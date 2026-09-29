import { execFileSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");

const homePath = new RegExp("[A-Za-z]:[\\\\/]+Users[\\\\/]+[^\\\\/\\s`\"')]+", "i");
const homePrefix = new RegExp("[A-Za-z]:[\\\\/]+Users[\\\\/]", "i");

const ruleDefiningContracts = [
  "openspec/changes/bootstrap/tasks.md",
  "openspec/changes/archive/2026-09-29-bootstrap/tasks.md",
];

const driveLetter = "C:";
const homeDirectory = "Users";
const developmentHome = `${driveLetter}\\${homeDirectory}\\dev`;
const developmentHomePrefix = `${driveLetter}\\${homeDirectory}\\`;

const symlinkMode = "120000";
const regularFileModes = ["100644", "100755"];
const gitDefaults = ["-c", "core.autocrlf=false", "-c", "init.defaultBranch=main"];
const fixtureRoots: string[] = [];

type TrackedEntry = { mode: string; path: string };

afterAll(() => {
  for (const root of fixtureRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

function git(root: string, args: string[], input?: string): string {
  return execFileSync("git", [...gitDefaults, ...args], {
    cwd: root,
    encoding: "utf8",
    input,
  }).trim();
}

function write(root: string, path: string, content: string | Uint8Array): void {
  const absolute = join(root, path);

  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

function fixtureRepo(
  files: Record<string, string | Uint8Array>,
  links: Array<{ path: string; target: string }> = [],
): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-tracked-paths-"));

  fixtureRoots.push(root);
  git(root, ["init", "--quiet"]);

  for (const [path, content] of Object.entries(files)) {
    write(root, path, content);
  }

  for (const link of links) {
    const absolute = join(root, link.path);

    mkdirSync(dirname(absolute), { recursive: true });

    try {
      symlinkSync(link.target, absolute, "dir");
    } catch {
      writeFileSync(absolute, link.target);
    }
  }

  git(root, ["add", "--all"]);

  for (const link of links) {
    const blob = git(root, ["hash-object", "-w", "--stdin"], link.target);

    git(root, ["update-index", "--add", "--cacheinfo", `${symlinkMode},${blob},${link.path}`]);
  }

  return root;
}

function trackedEntries(root: string): TrackedEntry[] {
  const output = execFileSync("git", ["ls-files", "-s", "-z"], {
    cwd: root,
    encoding: "utf8",
  });

  return output
    .split("\0")
    .filter((record) => record.length > 0)
    .map((record) => {
      const separator = record.indexOf("\t");
      const [mode = ""] = record.slice(0, separator).split(" ");

      return { mode, path: record.slice(separator + 1) };
    });
}

function fileText(absolute: string): string | null {
  const bytes = readFileSync(absolute);

  return bytes.includes(0) ? null : bytes.toString("utf8");
}

function textOf(root: string, entry: TrackedEntry): string | null {
  const absolute = resolve(root, entry.path);

  if (entry.mode === symlinkMode) {
    return lstatSync(absolute).isSymbolicLink() ? readlinkSync(absolute) : fileText(absolute);
  }

  if (regularFileModes.includes(entry.mode)) {
    return fileText(absolute);
  }

  return null;
}

function textOfPath(root: string, path: string): string | null {
  const entry = trackedEntries(root).find((candidate) => candidate.path === path);

  return entry === undefined ? null : textOf(root, entry);
}

function offenders(root: string, pattern: RegExp, exempt: readonly string[] = []): string[] {
  return trackedEntries(root)
    .filter((entry) => !exempt.includes(entry.path))
    .filter((entry) => {
      const text = textOf(root, entry);

      return text !== null && pattern.test(text);
    })
    .map((entry) => entry.path);
}

describe("tracked files", () => {
  it("are listed by git", () => {
    expect(trackedEntries(repositoryRoot).length).toBeGreaterThan(0);
  });

  it("carry no home directory of a development machine", () => {
    expect(offenders(repositoryRoot, homePath)).toEqual([]);
  });

  it("carry no home directory prefix outside the change contract that states the rule", () => {
    expect(offenders(repositoryRoot, homePrefix, ruleDefiningContracts)).toEqual([]);
  });

  it("are read by the target of the link when git tracks them as a symbolic link", () => {
    const link = trackedEntries(repositoryRoot).find((entry) => entry.path === ".claude/agents");

    expect(link?.mode).toBe(symlinkMode);
    expect(textOfPath(repositoryRoot, ".claude/agents")?.replaceAll("\\", "/")).toBe(
      "../ai-specs/agents",
    );
  });

  it("report a tracked symbolic link whose target carries a home directory", () => {
    const root = fixtureRepo(
      { "docs/notes.md": "Release notes." },
      [{ path: "docs/vault", target: `${developmentHome}\\Documents\\vault` }],
    );

    expect(offenders(root, homePath)).toEqual(["docs/vault"]);
    expect(offenders(root, homePrefix)).toEqual(["docs/vault"]);
  });

  it("exempt the rule-defining contract at its active and archived path and report any other file with the prefix", () => {
    const rule = `No ${developmentHomePrefix} path is committed.`;

    const root = fixtureRepo({
      "docs/notes.md": `Scratch checkout of ${developmentHomePrefix}`,
      "openspec/changes/archive/2026-09-29-bootstrap/tasks.md": rule,
      "openspec/changes/bootstrap/tasks.md": rule,
    });

    expect(offenders(root, homePrefix, ruleDefiningContracts)).toEqual(["docs/notes.md"]);
  });

  it("skip a binary tracked file", () => {
    const root = fixtureRepo({
      "docs/blob.bin": Buffer.concat([
        Buffer.from(`${developmentHomePrefix}scratch`, "utf8"),
        Buffer.from([0, 1, 2]),
      ]),
      "docs/notes.md": "Release notes.",
    });

    expect(offenders(root, homePrefix)).toEqual([]);
  });
});
