// @vitest-environment node
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The requirement "The agent folders are real folders on every platform" of
// `openspec/changes/launch-hygiene/specs/repository-bootstrap/spec.md`: the three folders are tracked as folders of
// regular files, each holds a byte-for-byte copy of every file of `ai-specs/agents/` and nothing else, and
// `npm run agents:sync` writes the copies from the source. The comparison reads the working tree, so it holds on
// Windows and on Linux alike; the two fixtures build their own trees, so a copy that drifts fails here naming the
// folder and the file without touching the repository.

const repositoryRoot = resolve(import.meta.dirname, "..");
const sourceDirectory = "ai-specs/agents";
const copyDirectories = [".claude/agents", ".codex/agents", ".cursor/agents"];
const syncScript = "scripts/sync-agents.mjs";
const agents = ["backend-developer.md", "frontend-developer.md", "product-strategy-analyst.md"];
const symlinkMode = "120000";
const regularFileMode = "100644";
const fixtureTimeout = 30_000;
const fixtureRoots: string[] = [];

type TrackedEntry = { mode: string; path: string };

afterAll(() => {
  for (const root of fixtureRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

function trackedEntries(root: string): TrackedEntry[] {
  const output = execFileSync("git", ["ls-files", "-s", "-z"], { cwd: root, encoding: "utf8" });

  return output
    .split("\0")
    .filter((record) => record.length > 0)
    .map((record) => {
      const separator = record.indexOf("\t");
      const [mode = ""] = record.slice(0, separator).split(" ");

      return { mode, path: record.slice(separator + 1) };
    });
}

function filesUnder(root: string, directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
    const child = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...filesUnder(root, child));
    } else {
      files.push(child);
    }
  }

  return files.sort();
}

function drift(root: string): string[] {
  const source = filesUnder(root, sourceDirectory);
  const expected = new Set(source);
  const problems: string[] = [];

  for (const copy of copyDirectories) {
    let files: string[];

    try {
      files = filesUnder(root, copy);
    } catch {
      problems.push(`${copy}: is not a folder`);
      continue;
    }

    const present = new Set(files);

    for (const file of source) {
      const target = `${copy}/${file.slice(sourceDirectory.length + 1)}`;

      if (!present.has(target)) {
        problems.push(`${target}: missing`);
        continue;
      }

      if (!readFileSync(join(root, file)).equals(readFileSync(join(root, target)))) {
        problems.push(`${target}: different bytes`);
      }
    }

    for (const file of files) {
      if (!expected.has(`${sourceDirectory}/${file.slice(copy.length + 1)}`)) {
        problems.push(`${file}: extra`);
      }
    }
  }

  return problems;
}

function write(root: string, path: string, content: string): void {
  const absolute = join(root, path);

  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-agent-copies-"));

  fixtureRoots.push(root);

  for (const agent of agents.slice(0, 2)) {
    write(root, `${sourceDirectory}/${agent}`, `${agent} of the source\n`);

    for (const copy of copyDirectories) {
      write(root, `${copy}/${agent}`, `${agent} of the source\n`);
    }
  }

  return root;
}

function driftedFixture(): string {
  const root = fixture();

  writeFileSync(join(root, ".claude/agents/frontend-developer.md"), "frontend of a fork\n");
  rmSync(join(root, ".codex/agents/frontend-developer.md"));
  write(root, ".cursor/agents/product-strategy-analyst.md", "invented in one folder\n");

  return root;
}

function sync(root: string): void {
  execFileSync(process.execPath, [syncScript, root], { cwd: repositoryRoot, encoding: "utf8" });
}

describe("the agent folders of the repository", () => {
  it("hold every file of ai-specs/agents byte for byte and nothing else", () => {
    expect(filesUnder(repositoryRoot, sourceDirectory)).toEqual(
      agents.map((agent) => `${sourceDirectory}/${agent}`),
    );
    expect(drift(repositoryRoot)).toEqual([]);
  });

  it("are folders of the working tree, not symlinks and not files", () => {
    for (const copy of copyDirectories) {
      expect(lstatSync(join(repositoryRoot, copy)).isSymbolicLink(), copy).toBe(false);
      expect(statSync(join(repositoryRoot, copy)).isDirectory(), copy).toBe(true);
      expect(readdirSync(join(repositoryRoot, copy)).sort(), copy).toEqual(agents);
    }
  });

  it("carry mode 100644 in the index, and no path of the repository carries mode 120000", () => {
    const entries = trackedEntries(repositoryRoot);

    expect(entries.filter((entry) => entry.mode === symlinkMode).map((entry) => entry.path)).toEqual([]);

    for (const copy of copyDirectories) {
      for (const agent of agents) {
        expect(entries.find((entry) => entry.path === `${copy}/${agent}`)?.mode, `${copy}/${agent}`).toBe(
          regularFileMode,
        );
      }

      expect(entries.find((entry) => entry.path === copy), copy).toBeUndefined();
    }
  });

  it("keep the sync as the script of npm run agents:sync", () => {
    const manifest = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(manifest.scripts?.["agents:sync"]).toBe(`node ${syncScript}`);
  });

  it("name the folder and the file of a copy that drifts", { timeout: fixtureTimeout }, () => {
    const root = driftedFixture();

    expect(drift(root)).toEqual([
      ".claude/agents/frontend-developer.md: different bytes",
      ".codex/agents/frontend-developer.md: missing",
      ".cursor/agents/product-strategy-analyst.md: extra",
    ]);
  });

  it("write the three copies from the source on every run of the sync", { timeout: fixtureTimeout }, () => {
    const root = driftedFixture();

    expect(drift(root).length).toBeGreaterThan(0);

    sync(root);
    expect(drift(root)).toEqual([]);

    rmSync(join(root, `${sourceDirectory}/frontend-developer.md`));
    sync(root);
    expect(drift(root)).toEqual([]);
    expect(existsSync(join(root, ".claude/agents/frontend-developer.md"))).toBe(false);
  });
});
