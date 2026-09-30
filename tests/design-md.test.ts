import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Task 9.1 of `openspec/changes/brand-identity-ui/tasks.md` (decision 14 of its `design.md`): `DESIGN.md` at the root
// records the visual system for the next screens, and `docs/design-system.md` carries the product tokens and the two
// devices. Both are written from `app/tokens.css` and `app/brand.css`, so these tests read the two stylesheets and fail
// when a document drifts from them.

const root = resolve(import.meta.dirname, "..");
const designFile = "DESIGN.md";
const designSystemFile = "docs/design-system.md";

const sections = ["Overview", "Colors", "Typography", "Elevation", "Components", "Do's and Don'ts"] as const;
const keyframes = ["hl-sweep", "mark-land", "note-in", "rise", "bar"] as const;

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8").replaceAll("\r\n", "\n");
}

/** The declarations of the `:root` block of `app/tokens.css`, name to value. */
function rootTokens(): Map<string, string> {
  const sheet = read("app/tokens.css");
  const start = sheet.indexOf(":root {");
  const end = sheet.indexOf("\n}", start);
  const declared = new Map<string, string>();

  for (const match of sheet.slice(start, end).matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) {
    declared.set(match[1] ?? "", (match[2] ?? "").trim());
  }

  return declared;
}

function frontmatter(text: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);

  expect(match, `${designFile} opens with a YAML frontmatter`).not.toBeNull();

  return match?.[1] ?? "";
}

/** `colors:` entries of the frontmatter, slug to the quoted value. */
function colors(front: string): Map<string, string> {
  const start = front.indexOf("\ncolors:\n");

  expect(start, "the frontmatter has a colors block").toBeGreaterThan(-1);

  const found = new Map<string, string>();

  for (const line of front.slice(start + 1).split("\n").slice(1)) {
    const entry = /^ {2}([a-z0-9-]+):\s*"(#[0-9A-Fa-f]{6})"\s*$/.exec(line);

    if (entry === null) {
      break;
    }

    found.set(entry[1] ?? "", (entry[2] ?? "").toUpperCase());
  }

  return found;
}

function mixWithPaper(ink: string, percent: number): string {
  const channels = [1, 3, 5].map((index) => Number.parseInt(ink.slice(index, index + 2), 16));

  return `#${channels
    .map((channel) => Math.round(channel * (percent / 100) + 255 * (1 - percent / 100)))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function table(text: string, key: string): string[] {
  const rows = text
    .split("\n")
    .filter((line) => line.startsWith("|") && line.endsWith("|"))
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.replaceAll("`", "").trim()),
    )
    .filter((cells) => cells[0] === key);

  expect(rows.length, `${designSystemFile} carries one row for ${key}`).toBe(1);

  return rows[0] ?? [];
}

describe("DESIGN.md, the visual system of Cited for the next screens", () => {
  it("opens with the frontmatter of the Stitch format: name, description and the token groups", () => {
    const front = frontmatter(read(designFile));

    for (const key of ["name", "description", "colors", "typography", "rounded", "spacing", "components"]) {
      expect(front, `the frontmatter declares ${key}`).toMatch(new RegExp(`^${key}:`, "m"));
    }

    for (const forbidden of ["motion", "shadows", "breakpoints"]) {
      expect(front, `${forbidden} is not a group of the format`).not.toMatch(new RegExp(`^${forbidden}:`, "m"));
    }
  });

  it("carries the six sections of the format, in order, with the literal words in the headers", () => {
    const headers = read(designFile)
      .split("\n")
      .filter((line) => line.startsWith("## "));

    expect(headers).toHaveLength(sections.length);

    sections.forEach((word, index) => {
      expect(headers[index], `header ${index + 1}`).toMatch(new RegExp(`^## ${index + 1}\\. ${word}`));
    });
  });

  it("states each color of the frontmatter with the value of app/tokens.css", () => {
    const declared = rootTokens();
    const found = colors(frontmatter(read(designFile)));
    const expected: Record<string, string> = {
      ink: "--ink",
      lime: "--lime",
      coral: "--coral",
      surface: "--surface",
      "surface-dark": "--surface-dark",
      paper: "--paper",
      "ink-2": "--ink-2",
    };

    for (const [slug, token] of Object.entries(expected)) {
      expect(found.get(slug), `colors.${slug} is ${token}`).toBe((declared.get(token) ?? "").toUpperCase());
    }

    expect(found.get("border"), "colors.border is --border resolved on paper").toBe(
      mixWithPaper(declared.get("--ink") ?? "", 50),
    );
    expect(found.get("rule"), "colors.rule is --rule resolved on paper").toBe(
      mixWithPaper(declared.get("--ink") ?? "", 12),
    );
  });

  it("names the three durations and every keyframe of app/brand.css, and the reduced-motion rule", () => {
    const text = read(designFile);
    const declared = rootTokens();
    const brand = read("app/brand.css");

    for (const token of ["--dur-fast", "--dur-base", "--dur-slow"]) {
      expect(text, `${token} is named with its value`).toContain(`${token}\` (${declared.get(token)}`);
    }

    for (const name of keyframes) {
      expect(brand, `${name} is a keyframe of app/brand.css`).toContain(`@keyframes ${name}`);
      expect(text, `${name} is documented`).toContain(name);
    }

    expect(text).toContain("prefers-reduced-motion: reduce");
    expect(text).toContain("transform");
    expect(text).toContain("background-size");
  });

  it("carries the bans of the craft rules as Don'ts and the anti-references of PRODUCT.md by name", () => {
    const text = read(designFile);
    const donts = text.slice(text.indexOf("### Don't"));

    for (const phrase of [
      "side stripe",
      "gradient text",
      "modal",
      "emoji",
      "glassmorphism",
      "developer console",
      "generic SaaS dashboard",
      "toy chatbot",
      "node editor",
    ]) {
      expect(donts.toLowerCase(), `a Don't names ${phrase}`).toContain(phrase.toLowerCase());
    }
  });

  it("records the measures of the two devices and the contrast of the color roles", () => {
    const text = read(designFile);

    for (const measure of ["1.5em", "1.3em", "0.72em", "55%", "17.93:1", "7.63:1", "14.70:1"]) {
      expect(text, `DESIGN.md states ${measure}`).toContain(measure);
    }
  });

  it("describes the chips of the setup page as app/admin/page.tsx renders them", () => {
    const text = read(designFile);
    const page = read("app/admin/page.tsx");
    const kit = read("components/ui/Chip.tsx");
    const chips = [...page.matchAll(/<Chip\b[^>]*>/g)].map((match) => match[0]);
    const chipSection = text.slice(text.indexOf("### Chips"), text.indexOf("\n### ", text.indexOf("### Chips") + 1));
    const limeRole = /^- \*\*Lime\*\*[\s\S]*?(?=\n- \*\*|\n\n)/m.exec(text)?.[0] ?? "";

    expect(chips.length, "the setup page renders its state in a Chip").toBeGreaterThan(0);
    expect(kit, "the kit chip is paper with an ink border at 20% and ink text").toMatch(
      /border-ink\/20[^"`]*bg-paper[^"`]*text-ink/,
    );

    const limeInCode = chips.some((chip) => /lime/.test(chip)) || /lime/.test(kit);

    expect(chipSection.length, "DESIGN.md has a Chips section").toBeGreaterThan(0);
    expect(/lime/i.test(chipSection), "the Chips section names lime only when a chip of the code is lime").toBe(
      limeInCode,
    );
    expect(limeRole, "DESIGN.md has the Lime role").not.toBe("");
    expect(/set variable/i.test(limeRole), "the Lime role marks a set variable only when a chip of the code is lime").toBe(
      limeInCode,
    );

    const missingIsChip = /<Chip\b[^>]*>\s*\{?[^<]*strings\.missing/.test(page);

    expect(page, "the setup page renders the missing state").toContain("strings.missing");
    expect(
      /missing one is plain\s+`--ink-2` words/.test(chipSection),
      "the Chips section says a missing value is plain ink-2 words exactly when the page does not put it in a Chip",
    ).toBe(missingIsChip === false);
  });

  it("holds no absolute path of a machine and no money figure", () => {
    for (const file of [designFile, designSystemFile]) {
      const text = read(file);

      expect(text, `${file}: a home directory`).not.toMatch(/[A-Za-z]:[\\/]+Users[\\/]/i);
      expect(text, `${file}: a money figure`).not.toMatch(/[$€]\s?\d|\d\s?(pesos|MXN|USD)\b/i);
    }
  });
});

describe("docs/design-system.md, the product tokens and the two devices", () => {
  it("has a section for the product tokens with a row per token and the value of app/tokens.css", () => {
    const text = read(designSystemFile);
    const declared = rootTokens();

    expect(text).toMatch(/^## \d+\. The product tokens and the two devices$/m);

    for (const name of ["--ink-2", "--rule", "--dur-fast", "--dur-base", "--dur-slow"]) {
      const row = table(text, name);

      expect(row.length, `${name}: the row carries three cells`).toBe(3);
      expect(row[1]?.replaceAll(" ", ""), `${name}: the value of app/tokens.css`).toBe(
        (declared.get(name) ?? "").replaceAll(" ", ""),
      );
    }
  });

  it("gives the measures of the citation mark and the highlighter from the code", () => {
    const text = read(designSystemFile);
    const brand = read("app/brand.css");
    const mark = read("components/brand/CitationMark.tsx");

    expect(mark).toContain("min-w-[1.5em]");
    expect(mark).toContain("h-[1.3em]");
    expect(mark).toContain("text-[0.72em]");
    expect(brand).toContain("linear-gradient(transparent 55%, var(--lime) 55%)");

    for (const measure of ["1.5em", "1.3em", "0.72em", "55%", ".hl", ".hl-on-ink", ".hl-sweep"]) {
      expect(text, `the section states ${measure}`).toContain(measure);
    }
  });

  it("lists every keyframe of app/brand.css and the reduced-motion rule", () => {
    const text = read(designSystemFile);

    for (const name of keyframes) {
      expect(text, `${name} is listed`).toContain(name);
    }

    expect(text).toContain("prefers-reduced-motion: reduce");
    expect(text).toContain("DESIGN.md");
  });
});
