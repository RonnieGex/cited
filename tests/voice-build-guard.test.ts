// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The scenario "A production build" of the requirement "The microphone with the Orb": the test SDK of the end-to-end
// build never reaches the output of a production build, and a script fails the build when it does. This test runs that
// script over fixture trees, so the guard itself is what is proven, and then checks the repository declares it.

const repositoryRoot = resolve(import.meta.dirname, "..");
const guard = join(repositoryRoot, "scripts", "verify-no-test-sdk.mjs");
const fakeMarker = "__katalisVoiceFake";
const realMarker = "https://api.elevenlabs.io";

const roots: string[] = [];

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-build-guard-"));

  roots.push(root);

  for (const [path, content] of Object.entries(files)) {
    const absolute = join(root, path);

    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content, "utf8");
  }

  return root;
}

function guardOn(root: string, args: string[] = []): { status: number; output: string } {
  try {
    const output = execFileSync(process.execPath, [guard, ...args], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return { status: 0, output };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };

    return {
      status: failed.status ?? 1,
      output: `${failed.stdout ?? ""}${failed.stderr ?? ""}`,
    };
  }
}

afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

describe("the guard of the test SDK", () => {
  it("fails a production build whose output carries a marker of the test SDK", () => {
    const root = fixture({
      ".next/static/chunks/panel.js": `export const flag = "${fakeMarker}";`,
    });
    const run = guardOn(root);

    expect(run.status).toBe(1);
    expect(run.output).toContain("test SDK");
    expect(run.output).toContain(fakeMarker);
  });

  it("passes a production build that carries the real package and no marker of the test SDK", () => {
    const root = fixture({ ".next/static/chunks/panel.js": `export const base = "${realMarker}";` });
    const run = guardOn(root);

    expect(run.status).toBe(0);
    expect(run.output).toContain("OK");
  });

  it("fails a production build that carries neither, because the guard would prove nothing", () => {
    const root = fixture({ ".next/static/chunks/panel.js": "export const nothing = 1;" });
    const run = guardOn(root);

    expect(run.status).toBe(1);
    expect(run.output).toContain("neither");
  });

  it("fails when there is no build output at all", () => {
    const root = fixture({ "README.md": "# nothing built yet\n" });
    const run = guardOn(root);

    expect(run.status).toBe(1);
    expect(run.output).toContain("no build output");
  });

  it("asks for the marker when it is told the tree is the end-to-end build", () => {
    const withFake = fixture({ ".next/static/chunks/panel.js": `export const flag = "${fakeMarker}";` });
    const withoutFake = fixture({ ".next/static/chunks/panel.js": `export const base = "${realMarker}";` });

    expect(guardOn(withFake, ["--expect-test-sdk"]).status).toBe(0);
    expect(guardOn(withoutFake, ["--expect-test-sdk"]).status).toBe(1);
  });

  it("refuses a test build that also carries the real package", () => {
    const root = fixture({
      ".next/static/chunks/panel.js": `${fakeMarker} and ${realMarker}`,
    });

    expect(guardOn(root, ["--expect-test-sdk"]).status).toBe(1);
  });

  it("is declared by the repository, together with the two builds it guards", () => {
    const scripts = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const build = readFileSync(join(repositoryRoot, "scripts", "build-e2e.mjs"), "utf8");

    expect(scripts.scripts["build"]).toBe("next build");
    expect(scripts.scripts["build:e2e"]).toBe("node scripts/build-e2e.mjs");
    expect(scripts.scripts["verify:no-test-sdk"]).toBe("node scripts/verify-no-test-sdk.mjs");
    expect(scripts.scripts["verify:test-sdk"]).toBe(
      "node scripts/verify-no-test-sdk.mjs --expect-test-sdk",
    );
    expect(build).toContain("KATALIS_VOICE_FAKE_SDK");
  });

  it("fails a production build whose output carries the API key or its header", () => {
    const root = fixture({
      ".next/static/chunks/panel.js": `${realMarker} xi-api-key`,
    });
    const run = guardOn(root);

    expect(run.status).toBe(1);
    expect(run.output).toContain("xi-api-key");
  });
});
