// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The scenario "The key stays on the server" of the requirement "The browser never sees the ElevenLabs key": the key
// of ElevenLabs is read by the server only, no file of the client carries it, and no bundle of this project can carry
// the `xi-api-key` header of the provider. The end-to-end suite checks the same over the responses of a real page.

const repositoryRoot = resolve(import.meta.dirname, "..");

function filesUnder(...directories: string[]): string[] {
  return directories.flatMap((directory) =>
    readdirSync(resolve(repositoryRoot, directory), { recursive: true, encoding: "utf8" })
      .map((entry) => entry.replaceAll("\\", "/"))
      .filter((entry) => /\.(ts|tsx|mjs)$/.test(entry))
      .map((entry) => `${directory}/${entry}`),
  );
}

function textOf(path: string): string {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

const clientFiles = [
  ...filesUnder("components"),
  ...filesUnder("app").filter((path) => path.endsWith(".tsx")),
];
const serverVoiceFiles = filesUnder("lib/voice", "app/api/voice", "app/api/admin/voice");

describe("the key of ElevenLabs", () => {
  it("is read by the server side of the voice only", () => {
    const readers = filesUnder("app", "components", "lib", "scripts")
      .filter((path) => textOf(path).includes("ELEVENLABS_"))
      .filter((path) => serverVoiceFiles.includes(path) === false)
      .filter((path) => path !== "lib/i18n/admin.ts");

    expect(readers).toEqual([]);
  });

  it("never reaches a file the browser runs", () => {
    const offenders = clientFiles.filter((path) => {
      const text = textOf(path);

      return (
        text.includes("ELEVENLABS_") ||
        text.includes("xi-api-key") ||
        /from "@\/lib\/voice\/(?!client)/.test(text)
      );
    });

    expect(offenders).toEqual([]);
  });

  it("is never written as a header by the browser side of this project", () => {
    const offenders = clientFiles.filter((path) => textOf(path).includes("xi-api-key"));

    expect(offenders).toEqual([]);
  });

  it("is reserved, empty, in the public template of the environment", () => {
    const template = textOf(".env.example");
    const names = [
      "ELEVENLABS_API_KEY=",
      "ELEVENLABS_AGENT_ID=",
      "ELEVENLABS_VOICE_ID=",
      "VOICE_TOOL_SECRET=",
      "DAILY_VOICE_MINUTE_LIMIT=",
    ];

    for (const name of names) {
      expect(template, name).toContain(`\n${name}\n`);
    }
  });

  it("is not in the source of the panel, which only ever sees a signed URL", () => {
    const panel = textOf("components/voice/VoicePanel.tsx");
    const url = textOf("components/voice/voice-url.ts");

    expect(url).toContain('export const SIGNED_URL_ENDPOINT = "/api/voice/signed-url"');
    expect(panel).not.toContain("ELEVENLABS_");
    expect(panel).not.toContain("xi-api-key");
  });
});
