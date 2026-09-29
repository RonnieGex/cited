import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as honesty from "../scripts/readme-graphics/honesty.mjs";
import { decodePng } from "./png";

// The design system of Cited: the change `brand-and-design-system`. These tests read the scenarios of
// `openspec/changes/brand-and-design-system/specs/design-system/spec.md` that a unit test can read:
//
//   * the flame is the original (the SHA-256 of every file, against the record and against the source),
//   * the ink variant is derived, not drawn (the same shape, the same shading, recolored to ink),
//   * no invented logo (the files are gone, both READMEs show the flame, the guard refuses a record that names it),
//   * one set of tokens, the ones of Construye, and Outfit self-hosted, licensed and the only family of the app.
//
// The computed font, the absence of a request to an external font host and the `/kit` page need a browser and live in
// `e2e/design-system.spec.ts`.

const repositoryRoot = resolve(import.meta.dirname, "..");
const designDocument = "docs/design-system.md";
const tokensSheet = "app/tokens.css";
const variantsRecord = "public/brand/flame-variants.json";
const flameDirectory = "public/brand";
const fontDirectory = "public/fonts/outfit";
const fontExtensions = new Set([".woff", ".woff2", ".ttf", ".otf"]);
const flameSizes = [64, 192, 512];
const inkSizes = [64, 192];
const inkValue = 0x17;
const tokenNames = [
  "--ink",
  "--lime",
  "--coral",
  "--surface",
  "--surface-dark",
  "--paper",
  "--radius",
  "--ease-out-expo",
];
const kit = [
  "Button",
  "Chip",
  "Input",
  "Panel",
  "SectionTitle",
] as const;

// The source of the flame is the Construye web app on the machine of the maintainer. The path is built from
// `homedir()` so that no tracked file of this public repository carries the home directory of a development machine,
// which `tests/personal-paths.test.ts` enforces. Without the source the test falls back to the recorded hash.
const sourceBrand = resolve(
  homedir(),
  "Documents",
  "Antigravity Projects",
  "finanzas-katalis",
  "web",
  "public",
  "brand",
);
const sourceReachable = existsSync(sourceBrand);
const intendedLogo = /katalis[\s_-]*logo/i;

type Cells = string[];

function absolute(path: string): string {
  return resolve(repositoryRoot, path);
}

function readText(path: string): string {
  return readFileSync(absolute(path), "utf8");
}

function readBytes(path: string): Buffer {
  return readFileSync(absolute(path));
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function strip(cell: string): string {
  return cell.replaceAll("`", "").trim();
}

function tableRow(line: string): Cells | null {
  if (!line.startsWith("|") || !line.endsWith("|") || /^\|[\s:|-]+\|$/.test(line)) {
    return null;
  }

  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

/** The one row of a table of the document whose first cell is `key`. */
function rowWith(text: string, key: string): Cells {
  const wanted = strip(key);
  const found = text
    .split("\n")
    .map(tableRow)
    .filter((cells): cells is Cells => cells !== null)
    .filter((cells) => strip(cells[0] ?? "") === wanted);

  expect(found.length, `${designDocument} carries one row for ${key}`).toBe(1);

  return found[0] as Cells;
}

/** The normal form of a CSS value, so that `0` and `0px` and the case of a hex color do not matter. */
function cssValue(value: string): string {
  return strip(value)
    .toLowerCase()
    .replaceAll(/\s*,\s*/g, ", ")
    .replaceAll(/\s+/g, " ")
    .replace(/^0px$/, "0");
}

/** Every custom property declared in a stylesheet, as written. */
function declarations(text: string): Map<string, string> {
  const found = new Map<string, string>();

  for (const match of text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    found.set(match[1] ?? "", (match[2] ?? "").trim());
  }

  return found;
}

/** The body of a rule of a stylesheet, from its selector to the closing brace of its own line. */
function block(text: string, selector: string): string {
  return new RegExp(`${selector}[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(text)?.[1] ?? "";
}

function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files", "-z"], { cwd: repositoryRoot, encoding: "utf8" })
    .split("\0")
    .filter((path) => path.length > 0)
    .map((path) => path.replaceAll("\\", "/"));
}

function relativeLuminance(red: number, green: number, blue: number): number {
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

function pictureBlocks(text: string): string[] {
  return [...text.matchAll(/<picture>[\s\S]*?<\/picture>/g)].map((match) => match[0]);
}

function sourceOf(picture: string, theme: "dark" | "light"): string {
  if (theme === "dark") {
    return (
      /<source[^>]*media="\(prefers-color-scheme: dark\)"[^>]*srcset="([^"]+)"/.exec(picture)?.[1] ??
      ""
    );
  }

  return /<img[^>]*src="([^"]+)"/.exec(picture)?.[1] ?? "";
}

describe("the mark of the maker is the real flame", () => {
  it("copies the three files byte for byte from the flame of the product", () => {
    const document = readText(designDocument);

    for (const size of flameSizes) {
      const path = `${flameDirectory}/katalis-flame-${size}.png`;
      const bytes = readBytes(path);
      const image = decodePng(bytes);

      expect(bytes.subarray(0, 8).toString("hex"), `${path} is a PNG`).toBe("89504e470d0a1a0a");
      expect({ width: image.width, height: image.height }, path).toEqual({
        width: size,
        height: size,
      });
      expect(sha256(bytes), `${path}: the hash recorded in ${designDocument}`).toBe(
        strip(rowWith(document, path)[2] ?? ""),
      );
    }
  });

  it.skipIf(sourceReachable === false)("is byte for byte the file of the same size in Construye", () => {
    for (const size of flameSizes) {
      const ours = readBytes(`${flameDirectory}/katalis-flame-${size}.png`);
      const theirs = readFileSync(resolve(sourceBrand, `katalis-logo-${size}.png`));

      expect(sha256(ours), `the ${size} px flame`).toBe(sha256(theirs));
      expect(ours.equals(theirs), `${size} px: the same bytes`).toBe(true);
    }
  });

  it("derives the ink variant from the 512 px original and records the operation", () => {
    const document = readText(designDocument);
    const record = JSON.parse(readText(variantsRecord)) as Record<string, unknown>;
    const source = record["source"] as Record<string, unknown>;
    const original = readBytes(`${flameDirectory}/katalis-flame-512.png`);
    const operations = (record["operations"] ?? []) as string[];
    const written = record["outputs"] as Array<Record<string, unknown>>;

    expect(source["file"]).toBe(`${flameDirectory}/katalis-flame-512.png`);
    expect(source["sha256"]).toBe(sha256(original));
    expect(strip(rowWith(document, `${flameDirectory}/katalis-flame-512.png`)[2] ?? "")).toBe(
      sha256(original),
    );
    expect(operations.join(" "), "the record names the recoloring").toMatch(/recolor|ink/i);
    expect(operations.join(" "), "the record names the resizing").toMatch(/resize/i);
    expect(record["color"]).toBe("#171717");

    expect(written.map((entry) => entry["file"]).sort()).toEqual(
      inkSizes.map((size) => `${flameDirectory}/katalis-flame-ink-${size}.png`).sort(),
    );

    for (const size of inkSizes) {
      const path = `${flameDirectory}/katalis-flame-ink-${size}.png`;
      const bytes = readBytes(path);
      const image = decodePng(bytes);
      const entry = written.find((candidate) => candidate["file"] === path);

      expect({ width: image.width, height: image.height }, path).toEqual({
        width: size,
        height: size,
      });
      expect(entry?.["sha256"], path).toBe(sha256(bytes));
      expect(strip(rowWith(document, path)[2] ?? ""), path).toBe(sha256(bytes));
    }
  });

  it("keeps the shading of the original in ink, and draws nothing of its own", () => {
    // The comparison is a box filter of the 512 px original, computed here: the resampling kernel of the script is
    // not the one of this test, and the committed 64 and 192 px files of Construye are not resizes of its own 512 px
    // file with one kernel either (3107 of the 36864 alpha pixels of the 192 px differ from a Lanczos resize of the
    // 512 px by up to 16). What has to hold, and a drawn logo cannot hold, is that the ink variant is a band limited
    // version of the recolored original: the same alpha, the same tone, no colour and nothing above the ink.
    const original = decodePng(readBytes(`${flameDirectory}/katalis-flame-512.png`));

    for (const size of inkSizes) {
      const drawn = decodePng(readBytes(`${flameDirectory}/katalis-flame-ink-${size}.png`));
      const step = original.width / size;
      let opaque = 0;
      let neutral = 0;
      let lighter = 0;
      let compared = 0;
      let alphaDifference = 0;
      let toneDifference = 0;
      let close = 0;

      expect({ width: drawn.width, height: drawn.height }, `ink ${size}`).toEqual({
        width: size,
        height: size,
      });

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const at = (y * size + x) * 4;
          const alpha = drawn.pixels[at + 3] ?? 0;
          const red = drawn.pixels[at] ?? 0;
          const green = drawn.pixels[at + 1] ?? 0;
          const blue = drawn.pixels[at + 2] ?? 0;
          let weight = 0;
          let sourceAlpha = 0;
          let tone = 0;
          let count = 0;

          for (let sy = Math.floor(y * step); sy < Math.floor((y + 1) * step); sy += 1) {
            for (let sx = Math.floor(x * step); sx < Math.floor((x + 1) * step); sx += 1) {
              const from = (sy * original.width + sx) * 4;
              const a = original.pixels[from + 3] ?? 0;

              sourceAlpha += a;
              tone +=
                a *
                Math.round(
                  inkValue *
                    relativeLuminance(
                      original.pixels[from] ?? 0,
                      original.pixels[from + 1] ?? 0,
                      original.pixels[from + 2] ?? 0,
                    ),
                );
              weight += a;
              count += 1;
            }
          }

          if (alpha === 0) {
            continue;
          }

          opaque += 1;

          if (Math.max(red, green, blue) - Math.min(red, green, blue) <= 1) {
            neutral += 1;
          }

          // The bound is the ringing of the Lanczos resize of an eight bit image, and it is measured on the pixels a
          // reader sees: at the edge of the mark the alpha is a few units of 255 and the color there is invisible
          // (the brightest pixel of the committed files is 63 of 255 at 192 px with an alpha of 4). No visible pixel
          // of the mark is lighter than the ink of the system.
          if (alpha >= 128 && (red > inkValue + 8 || green > inkValue + 8 || blue > inkValue + 8)) {
            lighter += 1;
          }

          const expectedAlpha = count === 0 ? 0 : sourceAlpha / count;

          alphaDifference += Math.abs(expectedAlpha - alpha);

          if (weight > 0 && alpha > 128) {
            const expected = tone / weight;
            const difference = Math.abs(expected - red);

            compared += 1;
            toneDifference += difference;

            if (difference <= 8) {
              close += 1;
            }
          }
        }
      }

      console.log(
        `${size} px ink: ${opaque} opaque, ${neutral} neutral, ${lighter} lighter than the ink, ` +
          `alpha error ${(alphaDifference / opaque).toFixed(2)} of 255, ` +
          `tone error ${(toneDifference / Math.max(1, compared)).toFixed(2)} of ${inkValue}, ` +
          `${((close / Math.max(1, compared)) * 100).toFixed(1)}% of the tone within 8`,
      );

      expect(opaque, `ink ${size} is not empty`).toBeGreaterThan(100);
      expect(neutral / opaque, `ink ${size} is ink and nothing else`).toBe(1);
      expect(lighter, `ink ${size} is never lighter than the ink`).toBe(0);
      expect(alphaDifference / opaque, `ink ${size} keeps the alpha of the original`).toBeLessThan(12);
      expect(compared, `ink ${size} has pixels to compare`).toBeGreaterThan(100);
      expect(
        close / compared,
        `ink ${size} keeps the shading of the original as luminance`,
      ).toBeGreaterThan(0.9);
    }
  });

  it("is reproduced byte for byte by the committed script", () => {
    const paths = [
      variantsRecord,
      ...inkSizes.map((size) => `${flameDirectory}/katalis-flame-ink-${size}.png`),
    ];
    const before = paths.map((path) => sha256(readBytes(path)));

    execFileSync(process.execPath, ["scripts/render-flame-variants.mjs"], {
      cwd: repositoryRoot,
      encoding: "utf8",
    });

    const after = paths.map((path) => sha256(readBytes(path)));

    expect(after, "a second run of the script writes the same bytes").toEqual(before);
  });


  it("removes the invented logo and every reference to it, and the foot of both READMEs shows the flame", () => {
    for (const name of ["katalis-logo.png", "katalis-logo-dark.png"]) {
      expect(existsSync(absolute(`docs/images/${name}`)), `docs/images/${name}`).toBe(false);
    }

    for (const readme of ["README.md", "README.es.md"]) {
      const text = readText(readme);
      const foot = pictureBlocks(text).at(-1) ?? "";

      expect(text, readme).not.toMatch(intendedLogo);
      expect(sourceOf(foot, "dark"), `${readme}: the original for the dark theme`).toBe(
        `${flameDirectory}/katalis-flame-192.png`,
      );
      expect(sourceOf(foot, "light"), `${readme}: the ink variant as the fallback`).toBe(
        `${flameDirectory}/katalis-flame-ink-192.png`,
      );
      expect(foot, `${readme}: the height of the foot`).toContain('height="48"');
      expect(text, `${readme}: the link of the foot`).toContain(
        '<a href="https://katalis.dev">Built by Katalis</a>',
      );
    }
  });

  it("draws the flame beside by Katalis in the banner and in the social preview", () => {
    for (const template of ["scripts/readme-banner.html", "scripts/readme-graphics/social.html"]) {
      const text = readText(template);

      expect(text, template).toMatch(/flame/i);
      expect(text, template).toContain("by Katalis");
    }

    for (const script of ["scripts/render-readme-banner.mjs", "scripts/render-readme-graphics.mjs"]) {
      expect(readText(script), script).toContain(flameDirectory);
    }

    for (const record of ["docs/images/readme-banner.json", "docs/images/readme-graphics.json"]) {
      expect(readText(record), record).toMatch(/katalis-flame/);
    }
  });

  it("refuses a record that names the invented logo, and accepts the records of the round", () => {
    const named = {
      logo: { file: "docs/images/katalis-logo.png", dark: "docs/images/katalis-logo-dark.png" },
    };

    expect(honesty.inventedLogos(named)).toEqual([
      "logo.file: docs/images/katalis-logo.png",
      "logo.dark: docs/images/katalis-logo-dark.png",
    ]);
    expect(() => honesty.assertHonestRecord(named, "a record")).toThrow(/flame/);

    for (const path of ["docs/images/readme-graphics.json", "docs/images/readme-banner.json"]) {
      const record = JSON.parse(readText(path)) as Record<string, unknown>;

      expect(honesty.inventedLogos(record), path).toEqual([]);
      expect(() => honesty.assertHonestRecord(record, path), path).not.toThrow();
    }
  });
});

describe("one set of tokens, the ones of Construye", () => {
  it("declares the tokens of the reference once, in app/tokens.css", () => {
    const tokens = declarations(block(readText(tokensSheet), ":root"));

    for (const name of tokenNames) {
      expect([...tokens.keys()], name).toContain(name);
    }

    expect(tokens.get("--ink")?.toLowerCase()).toBe("#171717");
    expect(tokens.get("--lime")?.toLowerCase()).toBe("#ddf469");
    expect(tokens.get("--coral")?.toLowerCase()).toBe("#ff6059");
    expect(tokens.get("--radius")).toBe("0");
    expect(tokens.get("--ease-out-expo")).toMatch(/^cubic-bezier\(0\.16, ?1, ?0\.3, ?1\)$/);
  });

  it("records in the document the value each token has in Construye, and the two are equal", () => {
    const document = readText(designDocument);
    const tokens = declarations(block(readText(tokensSheet), ":root"));

    for (const name of tokenNames) {
      const row = rowWith(document, name);

      expect(row.length, `${name}: the row carries the four cells`).toBe(4);
      expect(cssValue(row[1] ?? ""), `${name}: the recorded value of Cited`).toBe(
        cssValue(tokens.get(name) ?? ""),
      );
      expect(cssValue(row[1] ?? ""), `${name}: the value of Construye`).toBe(
        cssValue(row[3] ?? ""),
      );
    }
  });

  it.skipIf(sourceReachable === false)("carries the values of Construye's own stylesheet", () => {
    const definiciones = readFileSync(resolve(sourceBrand, "..", "..", "app", "globals.css"), "utf8");
    const document = readText(designDocument);

    for (const name of tokenNames) {
      const row = rowWith(document, name);
      const value = strip(row[3] ?? "");

      expect(definiciones, `${name}: the value of Construye is in its stylesheet`).toContain(value);
    }
  });

  it("exposes the tokens to Tailwind through @theme and imports them from globals.css", () => {
    const sheet = readText(tokensSheet);
    const globals = readText("app/globals.css");
    const theme = block(sheet, "@theme");
    const exposed = [...declarations(theme).keys()];

    expect(theme.length, "app/tokens.css carries a @theme block").toBeGreaterThan(0);
    expect(globals).toContain('@import "./tokens.css"');

    for (const name of ["ink", "lime", "coral", "surface", "surface-dark", "paper"]) {
      expect(exposed, `--color-${name}`).toContain(`--color-${name}`);
    }

    expect(exposed).toContain("--ease-out-expo");
    expect(exposed).toContain("--font-sans");
  });
});

describe("Outfit is the font, self-hosted and licensed", () => {
  it("ships the Outfit files and nothing else, with the OFL license next to them", () => {
    const files = readdirSync(absolute(fontDirectory)).sort();
    const fonts = files.filter((name) => fontExtensions.has(extname(name).toLowerCase()));
    const license = readText(`${fontDirectory}/OFL.txt`);

    expect(files).toContain("OFL.txt");
    expect(fonts.length, "the Outfit files").toBeGreaterThan(0);

    for (const name of fonts) {
      expect(name.toLowerCase(), `${name}: the family in the file name`).toContain("outfit");
    }

    expect(license).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(license).toMatch(/Copyright \d{4} The Outfit Project Authors/);
  });

  it("carries no font file outside public/fonts/outfit and no name of a licensed family", () => {
    const files = trackedFiles();
    const fonts = files.filter((name) => fontExtensions.has(extname(name).toLowerCase()));
    const licensed = /lufga/i;

    expect(fonts.length, "the font files of the repository").toBeGreaterThan(0);
    expect(
      fonts.filter((name) => name.startsWith(`${fontDirectory}/`)).length,
      "every font file lives in public/fonts/outfit",
    ).toBe(fonts.length);

    for (const name of [...files, ...fonts.map((font) => readBytes(font).toString("latin1"))]) {
      expect(name, "a name of a licensed family").not.toMatch(licensed);
    }
  });

  it("declares the face in the tokens sheet and applies it on html", () => {
    const sheet = readText(tokensSheet);
    const layout = readText("app/layout.tsx");

    expect(sheet).toMatch(/@font-face\s*\{[\s\S]*?font-family:\s*"Outfit"/);
    expect(sheet).toMatch(/font-weight:\s*100\s+900/);
    expect(sheet).toMatch(/--font-sans:\s*"Outfit",\s*system-ui,\s*sans-serif/);
    expect(layout).toMatch(/<html[^>]*className="[^"]*font-sans/);

    const linked = [...sheet.matchAll(/url\("(\/fonts\/[^"]+)"\)/g)].map((match) => match[1] ?? "");

    expect(linked.length, "the font files the sheet links").toBeGreaterThan(0);

    for (const url of linked) {
      const bytes = readBytes(`public${url}`);

      expect(existsSync(absolute(`public${url}`)), url).toBe(true);
      expect(bytes.subarray(0, 4).toString("latin1"), `${url} is a woff2`).toBe("wOF2");
      expect(bytes.length, `${url} carries the family`).toBeGreaterThan(1024);
      expect(statSync(absolute(`public${url}`)).isFile(), url).toBe(true);
    }
  });
});

describe("a kit of components", () => {
  it("provides the five components of the kit, built on the tokens", () => {
    const directory = readdirSync(absolute("components/ui")).sort();

    for (const name of kit) {
      const path = `components/ui/${name}.tsx`;
      const text = readText(path);

      expect(directory, name).toContain(`${name}.tsx`);
      expect(text, `${name}: a server component`).not.toContain('"use client"');
      expect(text, `${name}: built on a token`).toMatch(/\b(ink|lime|coral|surface|paper)\b/);
    }

    for (const name of ["Button", "Panel", "Input", "Chip"]) {
      expect(readText(`components/ui/${name}.tsx`), `${name}: the square corners`).toContain(
        "rounded-none",
      );
    }

    const focus = readText("components/ui/focus.ts");

    expect(focus).toContain("focus-visible:outline-2");
    expect(focus).toContain("outline-lime");

    for (const name of ["Button", "Input"]) {
      expect(readText(`components/ui/${name}.tsx`), `${name}: the focus of the kit`).toContain(
        "focusRing",
      );
    }

    const button = readText("components/ui/Button.tsx");

    expect(button).toContain('"primary"');
    expect(button).toContain('"secondary"');
  });

  it("renders the kit in Spanish at /kit", () => {
    const page = readText("app/kit/page.tsx");

    expect(page).toContain("@/components/ui");
    expect(page).toMatch(/export default function/);

    for (const marker of [
      "button-primary",
      "button-secondary",
      "input",
      "chip",
      "panel",
      "section-title",
    ]) {
      expect(page, marker).toContain(`data-kit="${marker}"`);
    }
  });
});
