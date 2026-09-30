import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Decision 22 of the second amendment to `openspec/changes/guided-setup-and-knowledge/design.md`: the browser suite
// writes its captures to a folder `.gitignore` excludes and never over an image the repository tracks. A green run
// used to rewrite four PNGs under `docs/images/admin/` and leave its clone dirty (the Minor m-5 of
// `katalis-dev/tasks/revision-community-13b.md`). These cases read the specs, which is where the folder is chosen.

const repositoryRoot = resolve(import.meta.dirname, "..");
const specsFolder = join(repositoryRoot, "e2e");

function spec(name: string): string {
  return readFileSync(join(specsFolder, name), "utf8");
}

function specNames(): string[] {
  return readdirSync(specsFolder).filter((name) => name.endsWith(".ts"));
}

describe("the captures of the browser suite", () => {
  it("land in a folder the repository ignores", () => {
    const declared = /const captures = resolve\(\s*process\.cwd\(\),\s*"([^"]+)"/.exec(spec("setup.spec.ts"));

    expect(declared, "`e2e/setup.spec.ts` chooses the folder of its captures").not.toBeNull();
    expect(["test-results", ".data"], "the folder of the captures is one the suite may write").toContain(
      declared?.[1],
    );

    const ignored = readFileSync(join(repositoryRoot, ".gitignore"), "utf8");

    expect(ignored, `.gitignore ignores /${declared?.[1]}`).toContain(`/${declared?.[1]}`);
  });

  it("never build a path into the documentation", () => {
    // A path of the docs is written as a quoted segment (`"docs"`, `"images"`, `"admin"`): a comment may name the
    // folder it protects, and a path the suite writes to may not.
    expect(
      specNames().filter((name) => spec(name).includes('"docs') || spec(name).includes("'docs")),
    ).toEqual([]);
  });

  it("build every screenshot path of the walk from that folder", () => {
    const shots = [...spec("setup.spec.ts").matchAll(/page\.screenshot\(\{\s*path:\s*resolve\(([^,)]+),/g)];

    expect(shots.length).toBeGreaterThan(0);

    for (const [, argument] of shots) {
      expect(argument?.trim(), "the first argument of the path of a capture").toBe("captures");
    }
  });
});
