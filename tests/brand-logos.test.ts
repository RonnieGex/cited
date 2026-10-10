// @vitest-environment node
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { statusRows } from "../scripts/readme-graphics/data.mjs";
import { createHash } from "node:crypto";
import { test } from "vitest";
const read = (file: string) => readFileSync(new URL('../' + file, import.meta.url), "utf8");
test("brand assets retain published geometry and accessible presentation", async () => {
  const { logo, brandText } = await import('../scripts/readme-graphics/brand-logos.mjs');
  const manifest = JSON.parse(read('docs/brand/logos/' + "sources.json")) as Record<string, { file: string; sha256: string; url: string; version: string; license: string }>;
  for (const [name, record] of Object.entries(manifest)) {
    const source = read('docs/brand/logos/' + record.file);
    assert.equal(createHash("sha256").update(source).digest("hex"), record.sha256, name);
    const rendered = logo(name);
    assert.equal(rendered.match(/viewBox="([^"]+)"/)?.[1], source.match(/viewBox="([^"]+)"/)?.[1], name);
    for (const attribute of ["d", "transform", "fill-rule", "clip-rule", "x", "y", "width", "height"]) {
      const pattern = new RegExp("\\s" + attribute + '="([^"]+)"', "g");
      const shapes = (svg: string) => [...svg.replace(/<svg[^>]*>/, "").matchAll(pattern)].map((match) => match[1]);
      assert.deepEqual(shapes(rendered), shapes(source), `${name}/${attribute}`);
    }
    assert.match(rendered, /aria-hidden="true"/);
    assert.match(rendered, /focusable="false"/);
    assert.match(record.url, /^https:\/\//);
    assert.ok(record.version && record.license);
  }
  const marked = brandText('DeepSeek Harness <code>DeepSeek</code><a href="https://DeepSeek.example">DeepSeek</a>');
  assert.equal((marked.match(/data-brand="deepseek"/g) ?? []).length, 2);
  assert.ok(marked.includes('<code>DeepSeek</code>'));
  assert.ok(marked.includes('href="https://DeepSeek.example"'));
});

test("agent brand positions use real marks and separate textual verification levels", () => {
  const html = read("scripts/readme-graphics/agents.html");
  assert.doesNotMatch(html, /agents-status/);
  for (const key of ["deepseek", "claude", "codex", "cursor"]) assert.ok(html.includes(`{{LOGO_${key.toUpperCase()}}}`));
  assert.ok(html.includes("Called and answered"));
  assert.ok(html.includes("Connected, tools listed"));
  assert.ok(html.includes("Documented, not tested"));
});

test("source files match independently pinned publication hashes", () => {
  const pins = {
  "claude": "2d6fda79eb18ddccca35b799eeb3cece0dfabc22520ce3b10abd25668df9fa93",
  "codex": "1b156eb915f7e74443f3fc491334f1896b6650e8fb597e2f2cb71c0ff7dd1cb0",
  "deepseek": "7a55a0a7391d116eba7d32807d6838478f9209f6034612941e74fbb14934e2ef",
  "cursor": "71572a9be192cc069ec22b48d785e61d754eeed7edb7d082d615f6d5620f70ec",
  "elevenlabs": "e7bf01c62c849c3bd59eb117b7479cc8cc47daf941a3cdaaafc4791610fb2a40",
  "libsql": "a8cdcb254997b5554d32e377790c66b3f67d2bdeb38caf5b2cb77c13dc421621",
  "turso": "1944fde231d3137dcf5a5601ad0078087b375e8b90ce81158b1ef120867b2b2f",
  "ollama": "9c62bf0159ee96c8b58c86a732f33b002b4b3bb165ec86e8ecca51ad6a82dab6",
  "docker": "65571291c261ef869c31540a38f3ca0f0ee3bb73f179c172211c8860f19a6359"
};
  for (const [name, expected] of Object.entries(pins)) {
    const file = name === "codex" ? "codex_dark.svg" : `${name}.svg`;
    assert.equal(createHash("sha256").update(read("docs/brand/logos/" + file)).digest("hex"), expected, name);
  }
});

test("Docker roadmap regression detects an isolated pre-amendment source inventory and preserves Planned", async () => {
  const { brandText } = await import("../scripts/readme-graphics/brand-logos.mjs");
  const row = statusRows.find((entry) => entry.capability.includes("Docker"));
  assert.ok(row);
  assert.equal(row.state, "Planned");
  assert.match(brandText(row.capability), /data-brand="docker"/);
  const fixture = mkdtempSync(join(tmpdir(), "cited-pre-docker-"));
  try {
    const assets = JSON.parse(read("docs/brand/logos/sources.json"));
    delete assets.docker;
    mkdirSync(join(fixture, "assets"));
    writeFileSync(join(fixture, "assets", "sources.json"), JSON.stringify(assets));
    const helper = read("scripts/readme-graphics/brand-logos.mjs").replace("../../docs/brand/logos/", "./assets/");
    writeFileSync(join(fixture, "brand-logos.mjs"), helper);
    const moduleUrl = pathToFileURL(join(fixture, "brand-logos.mjs")).href;
    const code = `import { strict as assert } from 'node:assert'; import { brandText } from ${JSON.stringify(moduleUrl)}; assert.match(brandText('Docker image'), /data-brand="docker"/);`;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", windowsHide: true });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /AssertionError/);
    assert.match(result.stderr, /Docker image/);
  } finally {
    assert.equal(dirname(resolve(fixture)), resolve(tmpdir()));
    rmSync(fixture, { recursive: true, force: true });
  }
});
