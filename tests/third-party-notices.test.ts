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
