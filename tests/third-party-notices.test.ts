// @vitest-environment node
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// The requirement "What is copied from a package keeps its notice" of
// `openspec/changes/elevenlabs-voice-agent/specs/voice-agent/spec.md`: a file of this repository that is a verbatim copy
// of a package sits next to the license text of that package, byte for byte from the installed package, and is listed
// in `THIRD_PARTY_NOTICES.md` with its name, version, license and origin. The test reads the package and compares, so a
// copy that drifts from its license, or a served file that is missing from the notices, fails here. Nothing opens a
// socket: the packages are the ones `npm ci` installed.

const SERVED = join("public", "voice", "worklets");
const NOTICES = "THIRD_PARTY_NOTICES.md";
const SAMPLER_LICENSE = "@alexanderolsen/libsamplerate-js/LICENSE.md";
const SDK_LICENSE = "@elevenlabs/client/LICENSE";

function at(...parts: string[]): string {
  return join(process.cwd(), ...parts);
}

function installed(path: string): Buffer {
  return readFileSync(at("node_modules", ...path.split("/")));
}

function served(name: string): Buffer {
  return readFileSync(at(SERVED, name));
}

function read(path: string): string {
  return readFileSync(at(path), "utf8");
}

describe("the notice of what is copied from a package", () => {
  it("keeps the license of the resampler next to it, byte for byte from the package", () => {
    const copy = served("LICENSE-libsamplerate-js.md");
    const text = copy.toString("utf8");

    expect(copy.equals(installed(SAMPLER_LICENSE))).toBe(true);
    expect(text).toContain("# libsamplerate-js License (MIT)");
    expect(text).toContain("Permission is hereby granted, free of charge");
    expect(text).toContain("The above copyright notice and this permission notice shall be included in all copies");
    expect(text).toContain("# libsamplerate (aka Secret Rabit Code) License (2-clause BSD)");
    expect(text).toContain("Redistributions of source code must retain the above copyright notice");
    expect(text).toContain("Redistributions in binary form must reproduce the above copyright notice");
  });

  it("keeps the license of the worklets of the SDK next to them, byte for byte from the package", () => {
    const copy = served("LICENSE-elevenlabs-client.md");
    const text = copy.toString("utf8");

    expect(copy.equals(installed(SDK_LICENSE))).toBe(true);
    expect(text).toContain("MIT License");
    expect(text).toContain("Copyright (c) 2025 ElevenLabs");
    expect(text).toContain("The above copyright notice and this permission notice shall be included in all");
  });

  it("names every copy the folder serves, with its name, version, license and origin", () => {
    const notices = read(NOTICES);
    const files = readdirSync(at(SERVED)).filter((name) => name.endsWith(".js"));

    expect(files).toHaveLength(3);

    for (const name of files) {
      expect(notices).toContain(`public/voice/worklets/${name}`);
    }

    for (const line of [
      "@alexanderolsen/libsamplerate-js",
      "2.1.2",
      "dist/libsamplerate.worklet.js",
      "BSD 2-Clause",
      "@elevenlabs/client",
      "1.26.0",
      "@elevenlabs/react",
      "1.16.0",
      "worklets/rawAudioProcessor.js",
      "worklets/audioConcatProcessor.js",
      "public/voice/worklets/LICENSE-libsamplerate-js.md",
      "public/voice/worklets/LICENSE-elevenlabs-client.md",
    ]) {
      expect(notices).toContain(line);
    }
  });

  it("names the font and its OFL, which the repository also serves", () => {
    const notices = read(NOTICES);
    const fonts = readdirSync(at("public", "fonts", "outfit"));

    expect(fonts).toContain("OFL.txt");

    for (const name of fonts) {
      expect(notices).toContain(`public/fonts/outfit/${name}`);
    }

    for (const line of ["Outfit", "SIL Open Font License", "OFL.txt", "fonts.gstatic.com", "google/fonts"]) {
      expect(notices).toContain(line);
    }
  });
});

// The requirement "What npm installs under another license is named" of
// `openspec/changes/launch-hygiene/specs/supply-chain-security/spec.md`: every `@img/sharp-*` package of
// `package-lock.json` whose `license` field names the LGPL has one row in the section, with the version and the license
// exactly as the lock records them; the section says those packages carry the name of their license and no license
// text, links where the texts are and says, as facts, how this repository uses sharp. The rows are compared one by one
// and never against the section as a whole, so a version that is right somewhere in the prose does not pass the guard.

const NPM_SECTION = "## Installed by npm, not shipped";
const LOCK = "package-lock.json";

type LockedPackage = { license?: string; version?: string };
type Lock = { packages?: Record<string, LockedPackage> };
type Entry = { name: string; version: string; license: string };
type Fixture = { lock?: (lock: Lock) => void; notice?: (notice: string) => string };

const fixtureRoots: string[] = [];

afterAll(() => {
  for (const root of fixtureRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

function textAt(root: string, path: string): string {
  return readFileSync(join(root, ...path.split("/")), "utf8");
}

function lockAt(root: string): Lock {
  return JSON.parse(textAt(root, LOCK)) as Lock;
}

function lockEntries(lock: Lock, onlyLgpl: boolean): Entry[] {
  return Object.entries(lock.packages ?? {})
    .map(([path, entry]) => ({
      name: path.replace(/^node_modules\//, ""),
      version: entry.version ?? "",
      license: entry.license ?? "",
    }))
    .filter((entry) => entry.name.startsWith("@img/sharp-"))
    .filter((entry) => !onlyLgpl || entry.license.includes("LGPL"));
}

function sectionOf(notice: string, heading: string): string {
  const lines = notice.split("\n");
  const start = lines.indexOf(heading);

  if (start < 0) {
    return "";
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));

  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

function rowsOf(section: string): Entry[] {
  return section
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim().replaceAll("`", "")))
    .filter((cells) => cells.length >= 3 && (cells[0] ?? "").startsWith("@img/sharp-"))
    .map((cells) => ({ name: cells[0] ?? "", version: cells[1] ?? "", license: cells[2] ?? "" }));
}

function rowProblems(notice: string, locked: Entry[]): string[] {
  const section = sectionOf(notice, NPM_SECTION);

  if (section.length === 0) {
    return [`the section ${NPM_SECTION} is missing`];
  }

  const rows = rowsOf(section);
  const expected = new Map(locked.map((entry) => [entry.name, entry]));
  const problems = rows
    .filter((row) => !expected.has(row.name))
    .map((row) => `${row.name} has a row and the lock does not name the LGPL for it`);

  for (const entry of locked) {
    const row = rows.find((candidate) => candidate.name === entry.name);

    if (row === undefined) {
      problems.push(`${entry.name} has no row`);
      continue;
    }

    if (row.version !== entry.version) {
      problems.push(`${entry.name} says version ${row.version} and the lock says ${entry.version}`);
    }

    if (row.license !== entry.license) {
      problems.push(`${entry.name} says license ${row.license} and the lock says ${entry.license}`);
    }
  }

  return problems;
}

function fixture(changes: Fixture = {}): string {
  const root = mkdtempSync(join(tmpdir(), "katalis-notices-"));
  const lock = lockAt(process.cwd());
  const notice = read(NOTICES);

  fixtureRoots.push(root);
  changes.lock?.(lock);
  writeFileSync(join(root, LOCK), `${JSON.stringify(lock, null, 2)}\n`);
  writeFileSync(join(root, NOTICES), changes.notice?.(notice) ?? notice);

  return root;
}

function moveVersion(lock: Lock, name: string, version: string): void {
  const entry = lock.packages?.[`node_modules/${name}`];

  if (entry !== undefined) {
    entry.version = version;
  }
}

describe("the notice of what npm installs and this repository does not ship", () => {
  it("gives one row per LGPL package of the lock, with the version and the license the lock records", () => {
    const locked = lockEntries(lockAt(process.cwd()), true);

    expect(locked.length).toBeGreaterThan(0);
    expect(locked.every((entry) => entry.license.includes("LGPL"))).toBe(true);
    expect(rowProblems(read(NOTICES), locked)).toEqual([]);
  });

  it("says the packages carry no license text, links the texts and says how this repository uses sharp", () => {
    const section = sectionOf(read(NOTICES), NPM_SECTION);

    for (const expected of [
      "no license text",
      "https://www.gnu.org/licenses/lgpl-3.0.html",
      "https://github.com/lovell/sharp-libvips",
      "does not ship",
      "optional dependency",
      "scripts/render-flame-variants.mjs",
      "scripts/render-readme-graphics.mjs",
      "scripts/render-readme-orb.mjs",
    ]) {
      expect(section).toContain(expected);
    }

    expect(section).not.toContain("links against");
  });

  it("names the row of a package whose version the lock moved, in a temporary copy", () => {
    const root = fixture({
      lock: (lock) => {
        moveVersion(lock, "@img/sharp-libvips-linux-x64", "9.9.9");
      },
    });

    expect(rowProblems(textAt(root, NOTICES), lockEntries(lockAt(root), true))).toEqual([
      "@img/sharp-libvips-linux-x64 says version 1.3.4 and the lock says 9.9.9",
    ]);
  });

  it("names the row of a package the lock no longer licenses under the LGPL, in a temporary copy", () => {
    const root = fixture({
      lock: (lock) => {
        const entry = lock.packages?.["node_modules/@img/sharp-libvips-linux-x64"];

        if (entry !== undefined) {
          entry.license = "Apache-2.0";
        }
      },
    });

    expect(rowProblems(textAt(root, NOTICES), lockEntries(lockAt(root), true))).toEqual([
      "@img/sharp-libvips-linux-x64 has a row and the lock does not name the LGPL for it",
    ]);
  });

  it("does not take a row that lives outside the section, in a temporary copy", () => {
    const root = fixture({
      notice: (notice) => {
        const row = notice.split("\n").find((line) => line.includes("@img/sharp-wasm32")) ?? "";

        return notice.replace(`${row}\n`, "").replace(NPM_SECTION, `${row}\n\n${NPM_SECTION}`);
      },
    });

    expect(rowProblems(textAt(root, NOTICES), lockEntries(lockAt(root), true))).toEqual([
      "@img/sharp-wasm32 has no row",
    ]);
  });
});
