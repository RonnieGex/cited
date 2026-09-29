import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");

const homePath = new RegExp("[A-Za-z]:[\\\\/]+Users[\\\\/]+[^\\\\/\\s`\"')]+", "i");
const homePrefix = new RegExp("[A-Za-z]:[\\\\/]+Users[\\\\/]", "i");

const ruleDefiningContracts = ["openspec/changes/bootstrap/tasks.md"];

function trackedFiles(): string[] {
  const output = execFileSync("git", ["ls-files", "-z"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  return output.split("\0").filter((path) => path.length > 0);
}

function textOf(path: string): string | null {
  const bytes = readFileSync(resolve(repositoryRoot, path));

  return bytes.includes(0) ? null : bytes.toString("utf8");
}

describe("tracked files", () => {
  const files = trackedFiles();

  it("are listed by git", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("carry no home directory of a development machine", () => {
    const offenders = files.filter((path) => {
      const text = textOf(path);

      return text !== null && homePath.test(text);
    });

    expect(offenders).toEqual([]);
  });

  it("carry no home directory prefix outside the change contract that states the rule", () => {
    const offenders = files
      .filter((path) => !ruleDefiningContracts.includes(path))
      .filter((path) => {
        const text = textOf(path);

        return text !== null && homePrefix.test(text);
      });

    expect(offenders).toEqual([]);
  });
});
