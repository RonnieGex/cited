// @vitest-environment node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Inputs } from "../scripts/audit-high.mjs";
import {
  advisoriesOf,
  evaluate,
  inputsFrom,
  main,
  parseArguments,
  productionPackagesOf,
  today,
} from "../scripts/audit-high.mjs";

// Every scenario of the requirement "Dependency audit with expiring exceptions" of
// `openspec/changes/audit-exceptions/specs/supply-chain-security/spec.md`, against payloads of
// `npm audit --json` saved as fixtures: no test opens a socket and no test reads the installed tree. The list this
// repository ships is read as it is, with the day of the run, so an entry that nobody renewed fails here too.

const repositoryRoot = resolve(import.meta.dirname, "..");
const fixtures = join(repositoryRoot, "tests", "fixtures", "audit");
const day = "2026-10-09";

function read(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8"));
}

function given(overrides: Partial<Inputs> = {}): Inputs {
  return {
    audit: read("tree-of-head.json"),
    productionAudit: read("production-clean.json"),
    productionTree: read("production-tree.json"),
    exceptions: read("exceptions-of-braces.json"),
    day,
    ...overrides,
  };
}

function problemsOf(overrides: Partial<Inputs>): string {
  return evaluate(given(overrides)).problems.join("\n");
}

function commandOf(overrides: Record<string, string>): string[] {
  return [
    "--audit-file",
    join(fixtures, String(overrides["audit"])),
    "--prod-audit-file",
    join(fixtures, String(overrides["productionAudit"])),
    "--prod-tree-file",
    join(fixtures, "production-tree.json"),
    "--exceptions-file",
    join(fixtures, String(overrides["exceptions"])),
    "--today",
    day,
  ];
}

describe("the guard of the dependency audit", () => {
  it("passes when every advisory of the high level is a current entry and the production tree is clean", () => {
    const verdict = evaluate(given());

    expect(verdict.ok).toBe(true);
    expect(verdict.problems).toEqual([]);
    expect(verdict.entries).toBe(1);
    expect(verdict.nearestExpiry).toBe("2026-11-08");
    expect(verdict.lines.join("\n")).toContain("PASS  production audit");
  });

  it("fails when the production tree carries a finding, whatever the list says", () => {
    const problems = problemsOf({ productionAudit: read("production-of-f644f85.json") });

    expect(problems).toContain("production tree carries high GHSA-68fv-2mgg-jv7q in source-map-js");
    expect(problems).toContain("no exception covers the production tree");
  });

  it("fails when an advisory of the high level is not an entry", () => {
    expect(problemsOf({ audit: read("tree-with-a-new-advisory.json") })).toContain(
      "the high advisory GHSA-aaaa-bbbb-cccc of left-pad is not in security/audit-exceptions.json",
    );
    expect(problemsOf({ audit: read("tree-of-f644f85.json") })).toContain(
      "the high advisory GHSA-68fv-2mgg-jv7q of source-map-js is not in security/audit-exceptions.json",
    );
  });

  it("fails when an entry expired", () => {
    expect(problemsOf({ exceptions: read("exceptions-expired.json") })).toContain(
      "entry 0 (GHSA-vfj7-8cjw-p6xm) expired on 2026-10-08",
    );
  });

  it("fails when an entry asks for more than 30 days", () => {
    expect(problemsOf({ exceptions: read("exceptions-that-ask-45-days.json") })).toContain(
      "entry 0 (GHSA-vfj7-8cjw-p6xm) asks for 45 days and the maximum is 30",
    );
  });

  it("fails when an entry names a package of the production tree", () => {
    const problems = problemsOf({
      audit: read("tree-without-high.json"),
      exceptions: read("exceptions-of-a-production-package.json"),
    });

    expect(problems).toContain(
      "entry 0 (GHSA-hp3w-g68c-fv3c) excepts postcss, a package of the production tree, where no exception is allowed",
    );
  });

  it("fails when an entry has no evidence, and when an entry is malformed", () => {
    expect(problemsOf({ exceptions: read("exceptions-without-evidence.json") })).toContain(
      "entry 0 (GHSA-vfj7-8cjw-p6xm) carries no evidence that no fixed version is published",
    );

    const malformed = problemsOf({
      audit: read("tree-without-high.json"),
      exceptions: read("exceptions-malformed.json"),
    });

    expect(malformed).toContain("entry 0 (GHSA-XX) has no GHSA identifier");
    expect(malformed).toContain("entry 0 (GHSA-XX) names no package");
    expect(malformed).toContain("entry 0 (GHSA-XX) carries no reason");
    expect(malformed).toContain("entry 0 (GHSA-XX) carries no real date of expiry");
  });

  it("fails when an audit cannot be read, and never reads the tree as clean", () => {
    expect(() => evaluate(given({ audit: read("not-an-audit-payload.json") }))).toThrow(
      /is not a payload of npm audit/,
    );
    expect(() => parseArguments(["--audit-file"])).toThrow(/--audit-file needs a value/);
    expect(() => parseArguments(["--nope"])).toThrow(/unknown argument/);
    expect(() =>
      inputsFrom({
        auditFile: join(fixtures, "missing.json"),
        productionAuditFile: join(fixtures, "production-clean.json"),
        productionTreeFile: join(fixtures, "production-tree.json"),
        exceptionsFile: join(fixtures, "exceptions-of-braces.json"),
        day,
      }),
    ).toThrow(/missing\.json/);
  });

  it("reads the pair of an advisory and its package, and the packages of the production tree", () => {
    const advisories = advisoriesOf(read("tree-of-head.json"), "the fixture");

    expect(advisories).toEqual([
      {
        identifier: "GHSA-vfj7-8cjw-p6xm",
        package: "braces",
        severity: "high",
        title: "braces vulnerable to stack-exhaustion denial of service through deeply nested patterns",
      },
    ]);

    const production = productionPackagesOf(read("production-tree.json"));

    expect(production.has("next")).toBe(true);
    expect(production.has("postcss")).toBe(true);
    expect(production.has("source-map-js")).toBe(true);
    expect(production.has("braces")).toBe(false);
  });

  it("takes the list this repository ships as it is on the day of the run", () => {
    const shipped = JSON.parse(readFileSync(join(repositoryRoot, "security", "audit-exceptions.json"), "utf8"));
    const verdict = evaluate(given({ exceptions: shipped, day: today() }));

    expect(verdict.problems).toEqual([]);
  });

  it("answers the exit code and the closing line of the command", () => {
    const green: string[] = [];
    const red: string[] = [];

    expect(
      main(commandOf({ audit: "tree-of-head.json", productionAudit: "production-clean.json", exceptions: "exceptions-of-braces.json" }), (line) => green.push(line)),
    ).toBe(0);
    expect(
      main(commandOf({ audit: "tree-with-a-new-advisory.json", productionAudit: "production-clean.json", exceptions: "exceptions-of-braces.json" }), (line) => red.push(line)),
    ).toBe(1);

    expect(green.join("\n")).toContain("AUDIT: PASS (1 entries in force, the nearest expiry 2026-11-08)");
    expect(red.join("\n")).toContain("AUDIT: FAIL (1 problems)");
    expect(red.join("\n")).toContain("GHSA-aaaa-bbbb-cccc");
  });
});
