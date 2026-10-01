// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

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
// `openspec/changes/launch-hygiene/specs/supply-chain-security/spec.md`: the notices carry a section on the packages
// `npm ci` installs and this repository neither serves nor ships, whose license is not a permissive one; today the
// prebuilt binaries of sharp, `@img/sharp-libvips-*`, `LGPL-3.0-or-later`, with the version of `package-lock.json`,
// where their license text travels and the statement that no code of this repository links against them. The version
// is read from the lock, so this fails when the lock moves and the section stays behind.

const NPM_SECTION = "## Installed by npm, not shipped";

type LockedPackage = { license?: string; version?: string };

function locked(): Record<string, LockedPackage> {
  const lock = JSON.parse(read("package-lock.json")) as { packages?: Record<string, LockedPackage> };

  return lock.packages ?? {};
}

function sharpBinaries(): Array<{ name: string; version: string; license: string }> {
  return Object.entries(locked())
    .filter(([path]) => path.includes("@img/sharp-libvips-"))
    .map(([path, entry]) => ({
      name: path.replace(/^node_modules\//, ""),
      version: entry.version ?? "",
      license: entry.license ?? "",
    }));
}

function section(heading: string): string {
  const lines = read(NOTICES).split("\n");
  const start = lines.indexOf(heading);

  if (start < 0) {
    return "";
  }

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("## "));

  return (end < 0 ? rest : rest.slice(0, end)).join("\n");
}

function sharpProblems(notice: string, version: string): string[] {
  if (notice.length === 0) {
    return [`the section ${NPM_SECTION} is missing`];
  }

  return [
    "@img/sharp-libvips-*",
    version,
    "LGPL-3.0-or-later",
    "node_modules/@img/sharp-libvips-",
    "installed through",
    "next",
    "does not ship",
    "links against them",
  ]
    .filter((expected) => !notice.includes(expected))
    .map((expected) => `the section does not say ${expected}`);
}

describe("the notice of what npm installs and this repository does not ship", () => {
  it("names the pattern, the version of the lock and the license of the prebuilt binaries of sharp", () => {
    const binaries = sharpBinaries();

    expect(binaries.length).toBeGreaterThan(0);
    expect(new Set(binaries.map((binary) => binary.version)).size).toBe(1);
    expect(new Set(binaries.map((binary) => binary.license))).toEqual(new Set(["LGPL-3.0-or-later"]));

    expect(sharpProblems(section(NPM_SECTION), binaries[0]?.version ?? "")).toEqual([]);
  });

  it("fails a section that names another version of the binaries", () => {
    const version = sharpBinaries()[0]?.version ?? "";
    const notice = [
      "@img/sharp-libvips-*",
      version,
      "LGPL-3.0-or-later",
      "node_modules/@img/sharp-libvips-",
      "installed through",
      "next",
      "does not ship",
      "links against them",
    ].join(" ");

    expect(sharpProblems(notice, version)).toEqual([]);
    expect(sharpProblems(notice, "0.0.0")).toEqual(["the section does not say 0.0.0"]);
  });
});
