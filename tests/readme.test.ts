import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertHonestRecord,
  capturedOutput,
  isCapturedOutput,
  pageWords,
  plannedMark,
  plannedWords,
  untaggedClaims,
} from "../scripts/readme-graphics/honesty.mjs";
import { decodePng, meanLuminance, meanLuminanceIn, transparentShare } from "./png";

const repositoryRoot = resolve(import.meta.dirname, "..");
const imagesDirectory = "docs/images";
const formerName = /katalis[\s-]+responde[\s-]+community/i;
const archivedChanges = "openspec/changes/archive/";
const contractItself = "openspec/changes/cited-identity-and-readme/";

// Decision 11: the Spanish twin is a translation, so its headings, its status words and its yes/no are Spanish and a
// contract test cannot compare them with the English words literally.
const twinSections: Record<string, string> = {
  "Why Cited": "Por qué Cited",
  Status: "Estado",
  "How it works": "Cómo funciona",
  "See it work": "Míralo funcionar",
  Roadmap: "Hoja de ruta",
  Voice: "Voz",
  "Works with your agent": "Funciona con tu agente",
  "Quick start": "Arranque rápido",
  Configuration: "Configuración",
  Security: "Seguridad",
  Contributing: "Cómo contribuir",
  License: "Licencia",
};
const statusStates: Record<string, string> = {
  Available: "Available",
  Planned: "Planned",
  Disponible: "Available",
  Siguiente: "Planned",
};
const plannedChanges = [
  "design-system-shared",
  "pluggable-models-and-ask",
  "public-page-and-widget",
  "elevenlabs-voice-agent",
  "security-hardening",
  "docs-deploy-and-launch",
];


const banner = {
  dark: `${imagesDirectory}/readme-banner-dark.png`,
  light: `${imagesDirectory}/readme-banner-light.png`,
};
const graphics = {
  agents: {
    dark: `${imagesDirectory}/agents-dark.png`,
    light: `${imagesDirectory}/agents-light.png`,
    planned: false,
  },
  "reason-sources": {
    dark: `${imagesDirectory}/reason-sources-dark.png`,
    light: `${imagesDirectory}/reason-sources-light.png`,
    planned: false,
  },
  "reason-citations": {
    dark: `${imagesDirectory}/reason-citations-dark.png`,
    light: `${imagesDirectory}/reason-citations-light.png`,
    planned: false,
  },
  "reason-voice": {
    dark: `${imagesDirectory}/reason-voice-dark.png`,
    light: `${imagesDirectory}/reason-voice-light.png`,
    planned: false,
  },
  "how-it-works": {
    dark: `${imagesDirectory}/how-it-works-dark.png`,
    light: `${imagesDirectory}/how-it-works-light.png`,
    planned: false,
  },
  demo: {
    dark: `${imagesDirectory}/demo-dark.png`,
    light: `${imagesDirectory}/demo-light.png`,
    planned: false,
  },
  roadmap: {
    dark: `${imagesDirectory}/roadmap-dark.png`,
    light: `${imagesDirectory}/roadmap-light.png`,
    planned: true,
  },
  "voice-teaser": {
    dark: `${imagesDirectory}/voice-teaser-dark.png`,
    light: `${imagesDirectory}/voice-teaser-light.png`,
    planned: false,
  },
};
const socialPreview = `${imagesDirectory}/social-preview.png`;
// The mark of the maker is the flame of `public/brand/`, the same image every Katalis product uses: the original for
// the dark theme and the ink variant the script renders for the light one. The invented
// `docs/images/katalis-logo*.png` of the first round is gone and the guard of the render scripts refuses it.
const katalisFlame = {
  dark: "public/brand/katalis-flame-192.png",
  light: "public/brand/katalis-flame-ink-192.png",
};
const bannerRecordPath = `${imagesDirectory}/readme-banner.json`;
const graphicsRecordPath = `${imagesDirectory}/readme-graphics.json`;

const imageHosts = ["https://img.shields.io/", "https://github.com/"];
const maximumImageWeight = 3 * 1024 * 1024;
const pngSignature = "89504e470d0a1a0a";

// Decision 10 of the design: a dark canvas is ink with the lime glow and a light canvas is off-white, measured as the
// mean relative luminance of the decoded pixels. The footer mark is a transparent asset, not a canvas.
// Decision 11 amends it: the terminal of the demo is dark in both themes, so the canvas bound of the light variant
// cannot hold for `demo-light.png` (a dark terminal has to stay under 19% of the canvas for the mean to reach 0.80 and
// the real run of the quick start does not fit there). That file leaves the canvas list and is measured inside the
// terminal area instead.
const artDirection = {
  darkMaximum: 0.3,
  lightMinimum: 0.8,
  terminalMaximum: 0.3,
  maximumRoadmapHeight: 720,
  canvases: [
    "agents-dark.png",
    "agents-light.png",
    "readme-banner-dark.png",
    "readme-banner-light.png",
    "chat-page.png",
    "reason-sources-dark.png",
    "reason-sources-light.png",
    "reason-citations-dark.png",
    "reason-citations-light.png",
    "reason-voice-dark.png",
    "reason-voice-light.png",
    "how-it-works-dark.png",
    "how-it-works-light.png",
    "demo-dark.png",
    "demo-light.png",
    "roadmap-dark.png",
    "roadmap-light.png",
    "voice-teaser-dark.png",
    "voice-teaser-light.png",
    "social-preview.png",
  ],
  darkCanvases: [
    "agents-dark.png",
    "readme-banner-dark.png",
    "reason-sources-dark.png",
    "reason-citations-dark.png",
    "reason-voice-dark.png",
    "how-it-works-dark.png",
    "demo-dark.png",
    "roadmap-dark.png",
    "voice-teaser-dark.png",
    "social-preview.png",
  ],
  lightCanvases: [
    "agents-light.png",
    "readme-banner-light.png",
    "chat-page.png",
    "reason-sources-light.png",
    "reason-citations-light.png",
    "reason-voice-light.png",
    "how-it-works-light.png",
    "roadmap-light.png",
    "voice-teaser-light.png",
  ],
  terminalCanvases: ["demo-light.png"],
};

const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".bin",
  ".pdf",
  ".docx",
  ".sqlite",
]);
const fontExtensions = new Set([".woff", ".woff2", ".ttf", ".otf"]);

type TrackedFile = { path: string; text: string | null };
type Section = { level: number; title: string; lines: string[] };
type Statement = [string, string];

let trackedCache: TrackedFile[] | null = null;

function readText(path: string): string {
  return readFileSync(resolve(repositoryRoot, path), "utf8");
}

function trackedFiles(): TrackedFile[] {
  if (trackedCache !== null) {
    return trackedCache;
  }

  const listed = execFileSync("git", ["ls-files", "-z"], { cwd: repositoryRoot, encoding: "utf8" })
    .split("\0")
    .filter((path) => path.length > 0);

  trackedCache = listed.map((path) => {
    const absolute = resolve(repositoryRoot, path);
    const regular =
      lstatSync(absolute).isFile() && binaryExtensions.has(extname(path).toLowerCase()) === false;

    if (!regular) {
      return { path: path.replaceAll("\\", "/"), text: null };
    }

    const bytes = readFileSync(absolute);

    return {
      path: path.replaceAll("\\", "/"),
      text: bytes.includes(0) ? null : bytes.toString("utf8"),
    };
  });

  return trackedCache;
}

// Amended by Fable in `pluggable-models-and-ask`, scenario "Available means specified and merged": a row marked
// `Available` links the spec of its capability, and that spec either exists in `openspec/specs/` or is added by an
// open change under `openspec/changes/` as `specs/<capability>/spec.md`. The file of the spec in force appears when
// that change is archived, and is never written by hand before.
//
// Amended by Fable in `admin-panel-and-onboarding`, task 10: a change may also carry a `## MODIFIED Requirements`
// delta of a capability that is already in force, as the amended `specs/answering/spec.md` of that change does. Such
// a delta leaves the spec of `openspec/specs/` in place instead of writing it, so only a delta that ADDS the
// capability explains a row whose spec file does not exist yet.
const specLink = /^openspec\/specs\/([^/]+)\/spec\.md$/;

function capabilityOf(link: string): string | null {
  return specLink.exec(link)?.[1] ?? null;
}

function addsCapability(path: string): boolean {
  return readText(path).includes("## ADDED Requirements");
}

function openChangeSpecs(capability: string): string[] {
  const root = resolve(repositoryRoot, "openspec/changes");

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "archive")
    .map((entry) => `openspec/changes/${entry.name}/specs/${capability}/spec.md`)
    .filter((path) => existsSync(resolve(repositoryRoot, path)))
    .filter((path) => addsCapability(path));
}

// The headers a delta adds, requirement and scenario alike, compared without case and without runs of spaces, so a hand copy with a
// reworded case or spacing is still caught (finding 43 of the third review).
function requirementHeaders(text: string): string[] {
  return (
    text.match(/^#{3,4} (?:Requirement|Scenario): .+$/gm)?.map((header) => header.trim().toLowerCase().replace(/\s+/g, " ")) ?? []
  );
}

function specIsDelivered(link: string): boolean {
  const capability = capabilityOf(link);

  if (capability === null) {
    return false;
  }

  return existsSync(resolve(repositoryRoot, link)) || openChangeSpecs(capability).length > 0;
}

function slug(title: string): string {
  return `# ${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function lines(text: string): string[] {
  return text.split("\n");
}

function newlines(pattern: string, flags = ""): RegExp {
  return new RegExp(pattern, flags);
}

function tableRow(line: string): string[] | null {
  if (!line.startsWith("|") || !line.endsWith("|") || /^\|[\s:|-]+\|$/.test(line)) {
    return null;
  }

  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function codeFences(text: string): string[] {
  return [...text.matchAll(newlines("^```[^\\n]*\\n([\\s\\S]*?)^```$", "gm"))].map(
    (match) => match[1] ?? "",
  );
}

function commands(text: string): string[] {
  return codeFences(text)
    .flatMap((block) => block.split("\n"))
    .map((line) => line.trim())
    .map((line) => line.replace(newlines("^([A-Z][A-Z0-9_]*=[^\\s]+ +)+"), ""))
    .filter((line) => /^npm (ci|run )/.test(line))
    .map((line) =>
      line.replace(/^npm run ([a-z0-9:]+).*$/, "$1").replace(/^npm (ci)$/, "$1"),
    );
}

function sectionsOf(text: string): Section[] {
  const found: Section[] = [];
  let current: Section | null = null;

  for (const line of lines(text)) {
    const heading = /^(#{2,3}) (.+)$/.exec(line);

    if (heading === null) {
      current?.lines.push(line);
      continue;
    }

    if (current !== null) {
      found.push(current);
    }

    current = { level: heading[1]?.length ?? 2, title: heading[2] ?? "", lines: [] };
  }

  if (current !== null) {
    found.push(current);
  }

  return found;
}

function h2Titles(text: string): string[] {
  return sectionsOf(text)
    .filter((section) => section.level === 2)
    .map((section) => slug(section.title));
}

function sectionNamed(text: string, name: string): Section {
  const titles = [slug(name), slug(twinSections[name] ?? name)];
  const found = sectionsOf(text).filter(
    (section) => section.level === 2 && titles.includes(slug(section.title)),
  );

  expect(found.length, `the README has one level-two section "${name}"`).toBe(1);

  return found[0] as Section;
}

function bodyOf(text: string, name: string): string {
  return sectionNamed(text, name).lines.join("\n");
}

function beforeFirstCodeBlock(text: string): string {
  const index = text.indexOf("```");

  return index === -1 ? text : text.slice(0, index);
}

type StatusRow = { capability: string; state: string; word: string; reference: string };

function statusRows(text: string): StatusRow[] {
  return sectionNamed(text, "Status")
    .lines.map((line) => tableRow(line))
    .filter((cells): cells is string[] => cells !== null && cells.length === 3)
    .filter((cells) => statusStates[cells[1] ?? ""] !== undefined)
    .map((cells) => ({
      capability: cells[0] ?? "",
      state: statusStates[cells[1] ?? ""] ?? "",
      word: cells[1] ?? "",
      reference: cells[2] ?? "",
    }));
}

function configurationRows(
  text: string,
): Array<{ variable: string; purpose: string; readToday: string }> {
  return bodyOf(text, "Configuration")
    .split("\n")
    .map((line) => tableRow(line))
    .filter((cells): cells is string[] => cells !== null && cells.length === 3)
    .map((cells) => ({
      variable: (cells[0] ?? "").replaceAll("`", "").trim(),
      purpose: cells[1] ?? "",
      readToday: cells[2] ?? "",
    }))
    .filter((row) => /^[A-Z][A-Z0-9_]+$/.test(row.variable));
}

function imagesOf(text: string): string[] {
  const markdown = [...text.matchAll(newlines("!\\[[^\\]]*\\]\\(([^)\\s]+)", "g"))].map(
    (match) => match[1] ?? "",
  );
  const html = [...text.matchAll(newlines('<img[^>]*src="([^"]+)"', "g"))].map(
    (match) => match[1] ?? "",
  );

  return [...markdown, ...html];
}

function linksOf(text: string): string[] {
  return [...text.matchAll(newlines("\\]\\(([^)\\s]+)\\)", "g"))]
    .filter((match) => text[(match.index ?? 0) + 1] !== "!")
    .map((match) => match[1] ?? "");
}

function pictureBlocks(text: string): string[] {
  return [...text.matchAll(newlines("<picture>[\\s\\S]*?</picture>", "g"))].map(
    (match) => match[0],
  );
}

function sourceOf(picture: string, theme: "dark" | "light"): string {
  if (theme === "dark") {
    return (
      newlines('<source[^>]*media="\\(prefers-color-scheme: dark\\)"[^>]*srcset="([^"]+)"').exec(
        picture,
      )?.[1] ?? ""
    );
  }

  return /<img[^>]*src="([^"]+)"/.exec(picture)?.[1] ?? "";
}

function altOf(picture: string): string {
  return /<img[^>]*alt="([^"]*)"/.exec(picture)?.[1] ?? "";
}

function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(resolve(repositoryRoot, path));

  expect(bytes.subarray(0, 8).toString("hex"), `${path} is a PNG`).toBe(pngSignature);

  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function sizeInBytes(path: string): number {
  return statSync(resolve(repositoryRoot, path)).size;
}

function recorded(path: string): Record<string, unknown> {
  expect(existsSync(resolve(repositoryRoot, path)), `${path} exists`).toBe(true);

  return JSON.parse(readText(path)) as Record<string, unknown>;
}

function prose(text: string): string {
  return text
    .replace(newlines("<picture>[\\s\\S]*?</picture>", "g"), " ")
    .replace(newlines("!\\[[^\\]]*\\]\\([^)]*\\)", "g"), " ")
    .replace(newlines("\\[[^\\]]*\\]\\([^)]*\\)", "g"), " ")
    .replace(newlines("```[\\s\\S]*?```", "g"), " ")
    .replace(newlines("`[^`]*`", "g"), " ")
    .replace(newlines("<[^>]+>", "g"), " ");
}

function docsMarkdown(): string[] {
  return readdirSync(resolve(repositoryRoot, "docs"), { recursive: true, encoding: "utf8" })
    .map((entry) => entry.replaceAll("\\", "/"))
    .filter((entry) => entry.endsWith(".md"))
    .sort()
    .map((entry) => `docs/${entry}`);
}

function markdownStatements(name: string, text: string): Statement[] {
  const found: Statement[] = [];
  let block: string[] = [];
  let opening = 1;
  let fenced = false;

  const flush = (): void => {
    if (block.length > 0) {
      found.push([`${name}:${opening}`, block.join(" ")]);
      block = [];
    }
  };

  lines(text).forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      flush();
      fenced = fenced === false;

      return;
    }

    if (fenced) {
      if (line.trim().length > 0) {
        found.push([`${name}:${index + 1}`, line.trim()]);
      }

      return;
    }

    if (line.trim().length === 0) {
      flush();

      return;
    }

    if (/^\s*(?:[-*+]|\d+\.)\s/.test(line) || /^\s*\|/.test(line) || /^#{1,6}\s/.test(line)) {
      flush();
    }

    if (block.length === 0) {
      opening = index + 1;
    }

    block.push(line.trim());
  });

  flush();

  return found;
}

function textRoutes(record: Record<string, unknown>): string[] {
  const found: string[] = [];

  const visit = (value: unknown, route: string): void => {
    if (typeof value === "string") {
      if (isCapturedOutput(record, route, value) === false) {
        found.push(route);
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${route}[${index}]`));

      return;
    }

    if (typeof value === "object" && value !== null) {
      const row = value as Record<string, unknown>;

      if (typeof row["state"] === "string" && typeof row["reference"] === "string") {
        return;
      }

      for (const [key, item] of Object.entries(row)) {
        visit(item, route.length === 0 ? key : `${route}.${key}`);
      }
    }
  };

  visit(record, "");

  return found;
}

function at(root: Record<string, unknown>, route: string, value: string): void {
  const keys = route.replaceAll(/\[(\d+)\]/g, ".$1").split(".");
  let cursor = root;

  for (const key of keys.slice(0, -1)) {
    cursor = cursor[key] as Record<string, unknown>;
  }

  cursor[keys.at(-1) ?? ""] = value;
}

function markdownHeadings(text: string, level: number): string[] {
  const marker = "#".repeat(level);
  const heading = newlines(`^${marker} [^\\n]*$`, "gm");

  return [...text.matchAll(heading)].map((match) => match[0]);
}

function markdownBody(text: string): string {
  return lines(text)
    .filter((line) => !/^#{1,6} /.test(line))
    .join("\n");
}

function times(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

describe("README, the banner", () => {
  it("opens with the picture of the banner as its only non markdown heading", () => {
    const text = readText("README.md");
    const outside = markdownBody(text).match(newlines("<h[1-6][^>]*>", "g")) ?? [];
    const opening = outside.filter((tag) => !tag.startsWith("</"));

    expect(markdownHeadings(text, 1)).toEqual([]);
    expect(opening).toEqual(['<h1 align="center">']);
    expect(text.slice(0, 3)).toBe("<h1");
    expect(sourceOf(pictureBlocks(text)[0] ?? "", "dark")).toBe(banner.dark);
    expect(sourceOf(pictureBlocks(text)[0] ?? "", "light")).toBe(banner.light);
    expect(altOf(pictureBlocks(text)[0] ?? "")).toContain("Cited");
  });

  it("renders the banner at 1280 by 320", () => {
    expect(pngSize(banner.dark)).toEqual({ width: 1280, height: 320 });
    expect(pngSize(banner.light)).toEqual({ width: 1280, height: 320 });
  });

  it("is reproducible by the committed script", () => {
    const script = readText("scripts/render-readme-banner.mjs");

    expect(script).toContain("scripts/readme-banner.html");
    expect(script).toContain(banner.dark);
    expect(script).toContain(banner.light);
    expect(script).toContain(bannerRecordPath);
  });

  it("records the texts of the banner, with the tagline of the README", () => {
    const record = recorded(bannerRecordPath);
    const tagline = record["tagline"];

    expect(record["width"]).toBe(1280);
    expect(record["height"]).toBe(320);
    expect(record["wordmark"]).toBe("Cited");
    expect(record["mark"]).toBe("[1]");
    expect(record["byline"]).toBe("by Katalis");
    expect(typeof tagline).toBe("string");
    expect(readText("README.md")).toContain(tagline as string);
  });

  it("records the brand tokens and the font, and the font of the repository is Outfit", () => {
    const tokens = recorded(bannerRecordPath)["tokens"] as Record<string, string>;
    const font = recorded(bannerRecordPath)["font"] as Record<string, string>;

    expect(tokens["ink"]?.toLowerCase()).toBe("#171717");
    expect(tokens["lime"]?.toLowerCase()).toBe("#ddf469");
    expect(font["name"]).toBe("Outfit");
    expect(font["loadedAtRenderTime"]).toBe(true);
    // Amended by the change `brand-and-design-system`: the render used to take Outfit from the Google Fonts
    // stylesheet and the record said so. The family is a file of the repository now, under the SIL Open Font License,
    // the render reads it from `public/fonts/outfit/` and it needs no network.
    expect(font["fileInRepository"]).toBe(true);
    expect(font["source"]).toBe("public/fonts/outfit/outfit-latin.woff2");
    expect(existsSync(resolve(repositoryRoot, font["source"] ?? "")), font["source"]).toBe(true);

    const fonts = trackedFiles().filter((file) =>
      fontExtensions.has(extname(file.path).toLowerCase()),
    );

    expect(fonts.length, "the font files of the repository").toBeGreaterThan(0);
    expect(
      fonts.filter((file) => file.path.startsWith("public/fonts/outfit/")).length,
      "every font file is the Outfit of the repository",
    ).toBe(fonts.length);
  });
});

describe("README, the promise and the maturity", () => {
  it("carries the tagline, the badges, the link to the Spanish twin, three reasons and the maturity", () => {
    const head = beforeFirstCodeBlock(readText("README.md"));
    const tagline = recorded(bannerRecordPath)["tagline"] as string;
    const badges = imagesOf(head).filter((image) => image.startsWith("https://img.shields.io/"));

    expect(head).toContain(tagline);
    expect(badges.length).toBeGreaterThanOrEqual(6);
    expect(linksOf(head)).toContain("README.es.md");
    expect(head).toMatch(/early development/i);
    expect(head).toMatch(/not ready for production/i);
    expect(bodyOf(readText("README.md"), "Why Cited").match(newlines("^\\d\\. ", "gm")) ?? []).toHaveLength(3);
  });

  it("carries no em dash in its prose", () => {
    expect(prose(readText("README.md"))).not.toContain("\u2014");
    expect(prose(readText("README.es.md"))).not.toContain("\u2014");
  });
});

describe("README, the status table", () => {
  it("lists the available MCP server in both languages", () => {
    for (const path of ["README.md", "README.es.md"]) {
      const row = statusRows(readText(path)).find((entry) => entry.reference.includes("mcp-server/spec.md"));

      expect(row, path).toBeDefined();
      expect(row?.state, path).toBe("Available");
    }
  });

  it("marks every row Available or Planned, with the spec or the change that delivers it", () => {
    const rows = statusRows(readText("README.md"));

    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.filter((row) => row.state === "Available").length).toBeGreaterThanOrEqual(5);
    // The integration of `public-page-and-widget` with `admin-panel-and-onboarding` moved the two rows of those lanes
    // from Planned to Available, and `elevenlabs-voice-agent` moved the voice one, so the floor of the planned rows
    // follows the table that is left: the shared design system, the hardening and the deploy.
    expect(rows.filter((row) => row.state === "Planned").length).toBeGreaterThanOrEqual(3);

    for (const row of rows) {
      if (row.state === "Available") {
        const linked = newlines("\\]\\(([^)]+)\\)").exec(row.reference)?.[1] ?? row.reference;
        const capability = capabilityOf(linked);
        const delivering = openChangeSpecs(capability ?? "");
        const inForce = existsSync(resolve(repositoryRoot, linked));

        expect(capability, row.capability).not.toBeNull();
        expect(inForce || delivering.length > 0, row.capability).toBe(true);
        // Amended in `brand-identity-ui`: a delta of `## ADDED Requirements` over a capability already in force is the
        // standard OpenSpec form of new requirements, so an open change may add to a spec in force. What stays
        // forbidden is writing the delta by hand into the spec in force before the archive: no requirement an open
        // change still adds is already a header of the spec in force.
        if (inForce) {
          const written = readText(linked).toLowerCase().replace(/\s+/g, " ");

          for (const path of delivering) {
            for (const header of requirementHeaders(readText(path))) {
              expect(
                written.includes(header),
                `${row.capability}: ${path} still adds "${header}", which is never written by hand into ${linked}`,
              ).toBe(false);
            }
          }
        }
      } else {
        expect(plannedChanges, row.capability).toContain(row.reference.replaceAll("`", "").trim());
      }
    }
  });

  it("never presents a planned capability as available outside the status table and the roadmap", () => {
    const text = readText("README.md");
    const outside = text
      .replace(bodyOf(text, "Status"), " ")
      .replace(bodyOf(text, "Roadmap"), " ");
    const untagged = prose(outside)
      .split("\n")
      .filter((line) => plannedMark.test(line) === false)
      .join("\n");

    // Amended by `elevenlabs-voice-agent`: the voice agent is Available now, so the words that still need a `Next` tag
    // outside the status table and the roadmap are the ones of a capability the table marks Planned.
    for (const phrase of ["admin panel", "one-click deploy"]) {
      expect(untagged.toLowerCase(), phrase).not.toContain(phrase);
    }

    expect(prose(outside).toLowerCase()).toContain("answers");
  });
});

describe("README, the promise of an answer", () => {
  // Decision 11, amended by Fable in `pluggable-models-and-ask`: the answer with citations is available from this
  // change on, so "answer" and "respuesta" stopped being words that need a `Next` tag. What still needs one is a
  // capability the status table marks Planned (the voice agent, the panel, the widget, the deploy), and what is
  // refused everywhere is a page: a passage of Cited keeps its document, its heading and its position, never a page.
  // The scenario reads every text field of the two records and every Markdown file under `docs/`; in `docs/` a page
  // counts only where the sentence cites it, because a PDF has pages and the interface is a page, and both exist.
  const citationCue =
    /\b(cite[sd]?|citing|citation|show[sn]?|give[sn]?|return(?:s|ed)?|point(?:s)? to|came from|come[s]? from)\b/i;
  const records = [graphicsRecordPath, bannerRecordPath];

  function offenders(
    lines: Statement[],
    words: RegExp | null,
    cites: (line: string) => boolean = () => false,
  ): string[] {
    return lines
      .filter(
        ([, line]) =>
          plannedMark.test(line) === false &&
          ((words !== null && words.test(line)) || cites(line)),
      )
      .map(([where, line]) => `${where}: ${line.trim()}`);
  }

  function citesAPage(statement: string): boolean {
    return statement
      .split(/[.!?]\s+/)
      .some((sentence) => pageWords.test(sentence) && citationCue.test(sentence));
  }

  function textFields(record: Record<string, unknown>, name: string): Statement[] {
    const found: Statement[] = [];

    const visit = (value: unknown, route: string): void => {
      if (typeof value === "string") {
        if (isCapturedOutput(record, route, value) === false) {
          found.push([`${name}: ${route}`, value]);
        }

        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item, index) => visit(item, `${route}[${index}]`));

        return;
      }

      if (typeof value === "object" && value !== null) {
        const row = value as Record<string, unknown>;

        if (typeof row["state"] === "string" && typeof row["reference"] === "string") {
          found.push([
            `${name}: ${route}`,
            Object.values(row)
              .filter((cell): cell is string => typeof cell === "string")
              .join(" "),
          ]);

          return;
        }

        for (const [key, item] of Object.entries(row)) {
          visit(item, route.length === 0 ? key : `${route}.${key}`);
        }
      }
    };

    visit(record, "");

    return found;
  }

  it("claims no page and no planned capability without its tag", () => {
    const graphics = (recorded(graphicsRecordPath)["graphics"] ?? []) as Array<
      Record<string, unknown>
    >;
    const social = recorded(graphicsRecordPath)["social"] as Record<string, unknown>;
    const spoken: Statement[] = [
      ["the tagline", String(recorded(bannerRecordPath)["tagline"] ?? "")],
      ["the social preview", String(social["tagline"] ?? "")],
      ...graphics.map(
        (entry): Statement => [
          `the headline of ${String(entry["name"])}`,
          String(entry["headline"] ?? ""),
        ],
      ),
    ];

    for (const path of records) {
      spoken.push(...textFields(recorded(path), path));
    }

    for (const name of ["README.md", "README.es.md"]) {
      const text = readText(name);
      const outside = text
        .replace(bodyOf(text, "Status"), " ")
        .replace(bodyOf(text, "Roadmap"), " ");

      for (const line of prose(outside).split("\n")) {
        if (line.trim().length > 0) {
          spoken.push([`${name}`, line]);
        }
      }

      for (const picture of pictureBlocks(text)) {
        spoken.push([`the alt of an image of ${name}`, altOf(picture)]);
      }
    }

    expect([
      ...offenders(
        docsMarkdown().flatMap((name) => markdownStatements(name, readText(name))),
        plannedWords,
        citesAPage,
      ),
      ...offenders(spoken, pageWords),
      ...offenders(spoken, plannedWords),
    ]).toEqual([]);
  });

  it("reads every field of the demo but the lines the run printed", () => {
    // Amended by Fable after `revision-community-03c.md`: the exemption of the demo is the capture of the quick
    // start, so every field of `demo` that is not a command line or a line the run printed is copy and is read.
    const promise = "Cited answers a question and shows the page it came from.";
    const record = recorded(graphicsRecordPath);
    const demo = record["demo"] as Record<string, unknown>;
    const drawn = demo["drawn"] as Record<string, string[]>;
    const printed = String((demo["ingest"] as Record<string, unknown>)["output"]);
    const command = String((demo["ingest"] as Record<string, unknown>)["command"]);
    const drawnLines = drawn["ingest"] ?? [];

    expect(printed).toContain("no pages");
    expect(printed.split("\n")).toContain(drawnLines[0]);
    expect(untaggedClaims(record), graphicsRecordPath).toEqual([]);

    expect(isCapturedOutput(record, `${capturedOutput}.ingest.command`, command)).toBe(true);
    expect(isCapturedOutput(record, `${capturedOutput}.ingest.output`, printed)).toBe(true);
    expect(isCapturedOutput(record, `${capturedOutput}.drawn.ingest[0]`, drawnLines[0])).toBe(true);

    const copied = structuredClone(record) as Record<string, unknown>;
    at(copied, `${capturedOutput}.caption`, promise);
    expect(untaggedClaims(copied), "a field of the demo that the run did not print").toContain(
      `${capturedOutput}.caption: ${promise}`,
    );
    expect(isCapturedOutput(copied, `${capturedOutput}.caption`, promise)).toBe(false);

    const redrawn = structuredClone(record) as Record<string, unknown>;
    at(redrawn, `${capturedOutput}.drawn.ingest[0]`, promise);
    expect(untaggedClaims(redrawn), "a drawn line the run did not print").toContain(
      `${capturedOutput}.drawn.ingest[0]: ${promise}`,
    );
    expect(isCapturedOutput(redrawn, `${capturedOutput}.drawn.ingest[0]`, promise)).toBe(false);
  });
});

describe("the records of the render", () => {
  const claim = "Cited answers a question and shows the page it came from.";
  const paths = [graphicsRecordPath, bannerRecordPath];

  it("holds no claim the guard would refuse", () => {
    for (const path of paths) {
      const record = recorded(path);

      expect(untaggedClaims(record), path).toEqual([]);
      expect(() => assertHonestRecord(record, path), path).not.toThrow();
    }

    expect(() => assertHonestRecord({ graphics: [{ alt: claim }] }, graphicsRecordPath)).toThrow(
      /planned capability as a capability of today/,
    );
  });

  it("reads every text field but the captured run and the state of a row", () => {
    for (const path of paths) {
      const record = recorded(path);
      const routes = textRoutes(record);

      expect(routes.length, path).toBeGreaterThan(10);

      for (const route of routes) {
        const mutated = structuredClone(record) as Record<string, unknown>;

        at(mutated, route, claim);

        expect(untaggedClaims(mutated), `${path}: ${route}`).toContain(`${route}: ${claim}`);
      }
    }
  });

  it("keeps the state of a roadmap row and the captured run of the demo as the evidence", () => {
    const record = recorded(graphicsRecordPath);
    const rows = record["roadmap"] as Array<Record<string, unknown>>;
    const available = rows.find((row) => row["state"] === "Available");
    const planned = rows.find((row) => row["state"] === "Planned");

    expect(available, "a row marked Available").toBeDefined();
    expect(planned, "a row marked Planned").toBeDefined();
    expect(
      untaggedClaims({ roadmap: [{ ...available, capability: claim }] }),
      "a row marked Available cannot promise an answer",
    ).not.toEqual([]);
    expect(
      untaggedClaims({ roadmap: [{ ...planned, capability: claim }] }),
      "a row marked Planned carries its own state and the change that delivers it",
    ).toEqual([]);
    expect(
      untaggedClaims({
        demo: {
          ingest: { command: claim, output: claim },
          search: { output: claim },
          drawn: { ingest: [claim], search: [claim] },
        },
      }),
      "the command lines and the lines they printed are the evidence of the demo",
    ).toEqual([]);
    expect(
      untaggedClaims({
        demo: {
          ingest: { output: claim },
          drawn: { ingest: [claim] },
          caption: claim,
        },
      }),
      "any other field under demo is copy and is read",
    ).toEqual([`demo.caption: ${claim}`]);
  });

  it("writes no record before the check of the guard", () => {
    for (const script of ["scripts/render-readme-graphics.mjs", "scripts/render-readme-banner.mjs"]) {
      const text = readText(script);

      expect(text, script).toContain('from "./readme-graphics/honesty.mjs"');
      expect(text, script).toMatch(
        /assertHonestRecord\(record, recordPath\);\n\s*await writeFile\(absolute\(recordPath\)/,
      );
    }
  });

  it("keeps the manifest of the graphics in step with the record it writes", () => {
    const manifest = readText("scripts/readme-graphics/manifest.mjs");
    const drawn = recorded(graphicsRecordPath)["graphics"] as Array<Record<string, unknown>>;

    for (const entry of drawn) {
      const name = String(entry["name"]);

      expect(manifest, name).toContain(String(entry["alt"]));

      if (typeof entry["copy"] === "string") {
        expect(manifest, name).toContain(entry["copy"]);
      }
    }
  });
});

describe("README, the quick start and the configuration", () => {
  it("names only scripts of package.json, and runs the sample corpus with no key", () => {
    const manifest = JSON.parse(readText("package.json")) as { scripts: Record<string, string> };
    const quickStart = bodyOf(readText("README.md"), "Quick start");

    expect(commands(quickStart).length).toBeGreaterThanOrEqual(5);
    expect(commands(quickStart)).toContain("ci");
    expect(commands(quickStart)).toContain("ingest");
    expect(commands(quickStart)).toContain("search");
    expect(commands(quickStart)).toContain("ask");

    for (const command of commands(quickStart)) {
      if (command !== "ci") {
        expect(Object.keys(manifest.scripts), command).toContain(command);
      }
    }

    expect(quickStart).toContain("samples/");
    expect(quickStart).toContain("EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/");
    expect(quickStart).toMatch(/EMBEDDINGS_PROVIDER=fake npm run search -- "/);
    expect(quickStart).toMatch(/EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm run ask -- "/);
  });

  it("compares the variables of the configuration with .env.example and with the code", () => {
    const text = readText("README.md");
    const example = readText(".env.example");
    const rows = configurationRows(text);
    const names = new Set(
      (example.match(newlines("^[A-Z][A-Z0-9_]+=", "gm")) ?? []).map((line) => line.replace("=", "")),
    );

    expect(rows.length).toBeGreaterThanOrEqual(10);

    for (const row of rows) {
      expect(names, row.variable).toContain(row.variable);
    }

    const readToday = rows.filter((row) => /^yes/i.test(row.readToday)).map((row) => row.variable);

    expect(readToday.length).toBeGreaterThanOrEqual(5);

    const source = ["lib", "scripts", "app"]
      .flatMap((folder) =>
        trackedFiles().filter((file) => file.path.startsWith(`${folder}/`) && file.text !== null),
      )
      .map((file) => file.text ?? "")
      .join("\n");

    for (const variable of readToday) {
      expect(source, variable).toContain(variable);
    }

    for (const row of rows) {
      expect(row.purpose.length, row.variable).toBeGreaterThan(10);
      expect(row.readToday, row.variable).toMatch(newlines("^(yes|no)\\b", "i"));
      expect(row.purpose, row.variable).not.toMatch(newlines("[A-Za-z0-9_-]{24,}"));
    }
  });
});

describe("README, the Spanish twin", () => {
  it("has the same sections in the same order, each one in its language", () => {
    const english = Object.keys(twinSections).map((name) => slug(name));
    const spanish = Object.keys(twinSections).map((name) => slug(twinSections[name] as string));

    expect(h2Titles(readText("README.md"))).toEqual(english);
    expect(h2Titles(readText("README.es.md"))).toEqual(spanish);
  });

  it("is translated, not only mirrored", () => {
    const english = readText("README.md");
    const spanish = readText("README.es.md");
    const englishSections = h2Titles(english);
    const mirrored = h2Titles(spanish).filter((title, index) => title === englishSections[index]);

    expect(mirrored).toEqual([]);

    const rows = statusRows(spanish);

    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(
      rows
        .filter((row) => ["Disponible", "Siguiente"].includes(row.word) === false)
        .map((row) => `${row.capability} ${row.word}`),
    ).toEqual([]);
    expect(rows.map((row) => row.state)).toEqual(statusRows(english).map((row) => row.state));

    const configuration = configurationRows(spanish);

    expect(configuration.length).toBeGreaterThanOrEqual(10);
    expect(
      configuration
        .filter((row) => row.readToday !== "sí" && row.readToday !== "no")
        .map((row) => `${row.variable} ${row.readToday}`),
    ).toEqual([]);
  });

  it("has the same code blocks", () => {
    expect(codeFences(readText("README.es.md")).length).toBe(
      codeFences(readText("README.md")).length,
    );
    expect(commands(readText("README.es.md"))).toEqual(commands(readText("README.md")));
  });

  it("has the same variables and the same status of every row", () => {
    const english = readText("README.md");
    const spanish = readText("README.es.md");

    expect(configurationRows(spanish).map((row) => row.variable)).toEqual(
      configurationRows(english).map((row) => row.variable),
    );
    expect(statusRows(spanish).map((row) => row.reference)).toEqual(
      statusRows(english).map((row) => row.reference),
    );
    expect(statusRows(spanish).map((row) => row.state)).toEqual(
      statusRows(english).map((row) => row.state),
    );
  });

  it("links the two files at the head of each one", () => {
    const english = beforeFirstCodeBlock(readText("README.md"));
    const spanish = beforeFirstCodeBlock(readText("README.es.md"));

    expect(linksOf(english)).toContain("README.es.md");
    expect(linksOf(spanish)).toContain("README.md");
    expect(spanish).toContain("Cited");
  });
});

describe("README, its links and its images", () => {
  it("resolves every relative link and image", () => {
    for (const path of ["README.md", "README.es.md"]) {
      for (const target of [...linksOf(readText(path)), ...imagesOf(readText(path))]) {
        if (!/^(https?:|mailto:|#)/.test(target)) {
          expect(specIsDelivered(target) || existsSync(resolve(repositoryRoot, target)), `${path} -> ${target}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("takes every absolute image from the allowed hosts and with no tracking parameter", () => {
    for (const path of ["README.md", "README.es.md"]) {
      for (const image of imagesOf(readText(path))) {
        if (image.startsWith("http")) {
          expect(imageHosts.some((host) => image.startsWith(host)), image).toBe(true);
          expect(image, image).not.toContain("?");
        }
      }
    }
  });
});

describe("README, its graphics", () => {
  it("uses the same own-source canonical run and counts supported answers", () => {
    const record = JSON.parse(readText("docs/evidence/agents/headless-answer.json"));
    const summary = JSON.parse(readText("docs/evidence/agents/natural-summary.json"));
    const attempts = summary.attempts.map((attempt: { artifact: string }) => JSON.parse(readText(`docs/evidence/agents/${attempt.artifact}`)));
    expect(attempts).toHaveLength(3);
    expect(summary.answeredWithCitation).toBe(2);
    expect(summary.attempts.map((attempt: { answeredWithCitation: boolean }) => attempt.answeredWithCitation)).toEqual([false, true, true]);
    expect(record.events).toEqual(attempts[1].events);
    expect(record.artifact).toBe(summary.canonical);
    expect(record.supportingEvidence).toBeUndefined();
    expect(record.events.find((event: { type: string; result?: string }) => event.type === "tool_result").result).toContain("1. cafe-la-horquilla.md · Precios (position 2)\n");
    expect(record.events.find((event: { type: string; result?: string }) => event.type === "tool_result").result).toContain("Afinación de bicicleta: 380 pesos.");
  });
  it("preserves the scope and provenance of the verified agent results", () => {
    const template = readText("scripts/readme-graphics/agents.html");
    const evidence = "openspec/changes/archive/2026-10-09-mcp-server/reports/2026-10-09-step-10-4-review-and-clients.md";

    expect(template).toContain("Tool result · cited_ask excerpt");
    expect(template).toContain("Question · original Spanish");
    expect(template).not.toContain("Passage 1");
    expect(template).not.toContain("Markdown rendered");
    expect(template).toContain("{{AGENT_RESULT}}");
    expect(template).toContain("font: 20px/1.35 Outfit");
    expect(template).toContain(".agents-proof .eyebrow { font-size: 16px; margin-top: 22px; }");
    expect(template).not.toMatch(/\.agents-tool-result\s*\{[^}]*border-top/);
    expect(template).toContain(".agents-client-row { padding: 24px 0;");
    expect(template).not.toContain(".agents-client-row:first-child");
    expect(readText("scripts/render-readme-graphics.mjs")).not.toMatch(/source-chip">1<\/span>\./);
    expect(template.match(/class="agents-result">Connected, tools listed/g)).toHaveLength(2);
    expect(template).toContain("Documented");
    expect(readText("scripts/render-readme-graphics.mjs")).toContain("Afinación de bicicleta: 380 pesos.");
    expect(template).toContain("{{AGENT_ANSWER}}");
    expect(template).toContain("2026-10-09");
    expect(readText(evidence)).toContain("tools/call cited_search");

    for (const [file, heading] of [["README.md", "Works with your agent"], ["README.es.md", "Funciona con tu agente"]] as const) {
      const section = bodyOf(readText(file), heading);

      expect(section).toContain(evidence);
      expect(section).toContain(graphics.agents.dark);
      expect(section).toContain(graphics.agents.light);
      expect(section).toContain("https://github.com/RonnieGex/dsh-cited/blob/main/docs/evidence/compatibility.md");
      expect(section).toContain("https://github.com/RonnieGex/dsh-cited/blob/main/docs/evidence/headless-answer.txt");
      expect(section).toContain("Markdown");
      expect(section.trimStart()).toMatch(/^Cited /);
      expect(section).not.toContain("deepseek-v4-flash");
      expect(section).not.toContain("Markdown rendered;");
    }
  });

  const themedMappings: Array<[string, string]> = [
    [banner.dark, banner.light],
    ...Object.values(graphics).map(
      (graphic): [string, string] => [graphic.dark, graphic.light],
    ),
    [katalisFlame.dark, katalisFlame.light],
  ];

  it("shows every graphic of the design in both themes, as a picture with its alt", () => {
    const pictures = pictureBlocks(readText("README.md"));
    const drawn = recorded(graphicsRecordPath)["graphics"] as Array<Record<string, unknown>>;

    for (const [dark, light] of themedMappings) {
      const block = pictures.find((picture) => picture.includes(dark));

      expect(block, dark).toBeDefined();
      expect(sourceOf(block ?? "", "dark"), dark).toBe(dark);
      expect(sourceOf(block ?? "", "light"), light).toBe(light);
      expect(altOf(block ?? "").length, dark).toBeGreaterThan(5);
    }

    for (const [name, graphic] of Object.entries(graphics)) {
      const entry = drawn.find((candidate) => candidate["name"] === name);
      const block = pictures.find((picture) => picture.includes(graphic.dark));

      expect(entry?.["alt"], name).toBe(altOf(block ?? ""));
    }
  });

  it("keeps every image as a PNG under docs/images or public/brand, 3 MB or less together", () => {
    const text = `${readText("README.md")}\n${readText("README.es.md")}`;
    const local = imagesOf(text).filter((image) => !image.startsWith("http"));
    const total = local.reduce((sum, image) => sum + sizeInBytes(image), 0);

    expect(local.length).toBeGreaterThanOrEqual(18);

    for (const image of local) {
      // Amended by the change `brand-and-design-system`: the foot of the README carries the flame of the maker, which
      // lives with the brand of the repository in `public/brand/`, not with the graphics of the README.
      expect(
        image.startsWith(imagesDirectory) || image.startsWith("public/brand/"),
        image,
      ).toBe(true);
      expect(pngSize(image).width, image).toBeGreaterThan(0);
    }

    expect(total).toBeLessThanOrEqual(maximumImageWeight);
  });

  it("labels as Next every graphic that shows a planned capability, and only those", () => {
    const record = recorded(graphicsRecordPath);
    const drawn = record["graphics"] as Array<Record<string, unknown>>;

    expect(drawn.length).toBeGreaterThanOrEqual(Object.keys(graphics).length);
    expect(record["states"]).toEqual({ Available: "Available", Planned: "Next" });

    for (const [name, value] of Object.entries(graphics)) {
      const entry = drawn.find((candidate) => candidate["name"] === name);

      expect(entry, name).toBeDefined();
      expect(entry?.["dark"]).toBe(value.dark);
      expect(entry?.["light"]).toBe(value.light);
      expect(entry?.["shows"], name).toBe(value.planned ? "Planned" : "Available");
      expect(entry?.["label"], name).toBe(value.planned ? "Next" : null);
    }
  });

  it("draws the demo from the real run of the quick start", () => {
    const demo = recorded(graphicsRecordPath)["demo"] as Record<string, unknown>;
    const ingest = demo["ingest"] as Record<string, unknown>;
    const search = demo["search"] as Record<string, unknown>;
    const ask = demo["ask"] as Record<string, unknown>;
    const quickStart = bodyOf(readText("README.md"), "Quick start");

    expect(ingest["command"]).toBe("EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/");
    expect(search["command"]).toContain("EMBEDDINGS_PROVIDER=fake npm run search --");
    expect(ask["command"]).toContain("EMBEDDINGS_PROVIDER=fake CHAT_PROVIDER=fake npm run ask --");
    expect(String(ingest["output"])).toContain("documents 4, passages 11");
    expect(String(search["output"])).toMatch(newlines("^\\d+\\. ", "m"));
    expect(String(ask["output"])).toContain("status: answered");
    expect(String(ask["output"])).toContain("[1]");
    expect(demo["exitCode"]).toBe(0);

    const drawn = demo["drawn"] as Record<string, string[]>;

    for (const step of ["ingest", "search", "ask"]) {
      const output = String((demo[step] as Record<string, unknown>)["output"]);
      const printed = output.split("\n");

      for (const line of drawn[step] ?? []) {
        expect(printed, `${step}: a drawn line is a line the run printed`).toContain(line);
      }

      for (const line of printed) {
        expect(quickStart, line.slice(0, 60)).toContain(line.slice(0, 60));
      }
    }
  });

  it("shows in the roadmap the same rows and states as the status table", () => {
    const roadmap = recorded(graphicsRecordPath)["roadmap"] as Array<Record<string, unknown>>;
    const rows = statusRows(readText("README.md"));
    const spanish = statusRows(readText("README.es.md"));

    expect(roadmap.map((row) => row["capability"])).toEqual(rows.map((row) => row.capability));
    expect(roadmap.map((row) => row["state"])).toEqual(rows.map((row) => row.state));
    expect(roadmap.length).toBe(spanish.length);
  });

  it("keeps the roadmap 1280 px wide and 720 px high at most", () => {
    const record = recorded(graphicsRecordPath);
    const limits = record["artDirection"] as Record<string, number>;
    const drawn = record["graphics"] as Array<Record<string, unknown>>;
    const entry = drawn.find((candidate) => candidate["name"] === "roadmap");

    expect(limits["maximumRoadmapHeight"]).toBe(artDirection.maximumRoadmapHeight);

    for (const path of [graphics.roadmap.dark, graphics.roadmap.light]) {
      const size = pngSize(path);

      expect(size.width, path).toBe(1280);
      expect(size.height, path).toBeLessThanOrEqual(artDirection.maximumRoadmapHeight);
      expect(size.height, path).toBe(entry?.["height"]);
    }
  });

  it("keeps the terminal of the demo dark in both themes", () => {
    const record = recorded(graphicsRecordPath);
    const limits = record["artDirection"] as Record<string, number>;
    const demo = record["demo"] as Record<string, unknown>;
    const terminal = demo["terminal"] as
      | { x: number; y: number; width: number; height: number }
      | undefined;

    expect(limits["terminalMaximum"]).toBe(artDirection.terminalMaximum);
    expect(terminal, "the record carries the box of the terminal").toBeDefined();

    for (const path of [graphics.demo.dark, graphics.demo.light]) {
      const image = decodePng(readFileSync(resolve(repositoryRoot, path)));
      const box = terminal ?? { x: 0, y: 0, width: 0, height: 0 };
      const inside = meanLuminanceIn(image, box);
      const share = (box.width * box.height) / (image.width * image.height);

      console.log(
        `${path}: the terminal is ${(share * 100).toFixed(1)}% of the canvas at ${inside.toFixed(3)}`,
      );

      expect(share, path).toBeGreaterThan(0.3);
      expect(inside, path).toBeLessThanOrEqual(artDirection.terminalMaximum);
    }
  });

  it("carries a social preview of 1280 by 640 with the name, the tagline and the byline", () => {
    const social = recorded(graphicsRecordPath)["social"] as Record<string, unknown>;
    const tagline = recorded(bannerRecordPath)["tagline"] as string;

    expect(pngSize(socialPreview)).toEqual({ width: 1280, height: 640 });
    expect(social["name"]).toBe("Cited");
    expect(social["tagline"]).toBe(tagline);
    expect(social["byline"]).toBe("by Katalis");
  });

  it("records the headline of every graphic, and the template and the README carry it", () => {
    const drawn = recorded(graphicsRecordPath)["graphics"] as Array<Record<string, unknown>>;

    for (const name of Object.keys(graphics)) {
      const entry = drawn.find((candidate) => candidate["name"] === name);
      const headline = entry?.["headline"];

      expect(typeof headline, name).toBe("string");
      expect(readText(`scripts/readme-graphics/${name}.html`), name).toContain(headline as string);
      expect(readText("README.md"), name).toContain(headline as string);
    }
  });

  it("is reproducible by the committed script and by the templates of every graphic", () => {
    const script = readText("scripts/render-readme-graphics.mjs");

    expect(script).toContain("scripts/readme-graphics");
    expect(script).toContain(graphicsRecordPath);

    for (const name of Object.keys(graphics)) {
      expect(existsSync(resolve(repositoryRoot, `scripts/readme-graphics/${name}.html`)), name).toBe(
        true,
      );
    }
  });
});

describe("README, the art direction of its graphics", () => {
  const directory = resolve(repositoryRoot, imagesDirectory);
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".png"))
    .sort();
  const measured = new Map(
    files.map((name) => {
      const image = decodePng(readFileSync(resolve(directory, name)));

      return [
        name,
        { image, luminance: meanLuminance(image), transparent: transparentShare(image) },
      ];
    }),
  );
  // Amended by the change `brand-and-design-system`: the two marks of the foot are the flame of the maker, which
  // lives with the brand in `public/brand/` and not with the graphics of the README in `docs/images/`.
  const marks = [katalisFlame.dark, katalisFlame.light];

  it("keeps every canvas in the luminance bounds of the second art direction", () => {
    const table = files
      .map(
        (name) =>
          `${name} luminance ${(measured.get(name)?.luminance ?? 0).toFixed(3)} transparent ${(
            measured.get(name)?.transparent ?? 0
          ).toFixed(3)}`,
      )
      .join("\n");

    console.log(`The luminance of every PNG of ${imagesDirectory}:\n${table}`);

    expect(files).toEqual([...artDirection.canvases].sort());

    const lightDark = artDirection.darkCanvases
      .map((name) => ({ name, value: measured.get(name)?.luminance ?? 1 }))
      .filter((entry) => entry.value > artDirection.darkMaximum);
    const darkLight = artDirection.lightCanvases
      .map((name) => ({ name, value: measured.get(name)?.luminance ?? 0 }))
      .filter((entry) => entry.value < artDirection.lightMinimum);
    const paintedMarks = marks
      .map((path) => ({
        path,
        value: transparentShare(decodePng(readFileSync(resolve(repositoryRoot, path)))),
      }))
      .filter((entry) => entry.value < 0.05);
    const exempted = artDirection.canvases.filter(
      (name) =>
        name.endsWith("-light.png") && artDirection.lightCanvases.includes(name) === false,
    );

    console.log(
      `The transparency of the flame: ${marks
        .map(
          (path) =>
            `${path} ${transparentShare(decodePng(readFileSync(resolve(repositoryRoot, path)))).toFixed(3)}`,
        )
        .join(", ")}`,
    );

    expect(lightDark.map((entry) => `${entry.name} ${entry.value.toFixed(3)}`)).toEqual([]);
    expect(darkLight.map((entry) => `${entry.name} ${entry.value.toFixed(3)}`)).toEqual([]);
    expect(paintedMarks.map((entry) => `${entry.path} transparent ${entry.value.toFixed(3)}`)).toEqual(
      [],
    );
    expect(exempted, "only the demo of the dark terminal leaves the light bound").toEqual(
      artDirection.terminalCanvases,
    );
  });

  it("measures the terminal area of every exempt canvas", () => {
    const record = recorded(graphicsRecordPath);
    const demo = record["demo"] as Record<string, unknown>;
    const terminal = demo["terminal"] as { x: number; y: number; width: number; height: number };

    for (const name of artDirection.terminalCanvases) {
      const image = measured.get(name)?.image;
      const value = image === undefined ? 1 : meanLuminanceIn(image, terminal);

      console.log(`${name}: the terminal measures ${value.toFixed(3)}`);

      expect(value, name).toBeLessThanOrEqual(artDirection.terminalMaximum);
    }
  });
});

describe("README, the flow and the foot", () => {
  it("carries the designed flow and the Mermaid version inside a details block", () => {
    const body = bodyOf(readText("README.md"), "How it works");
    const mermaid = codeFences(body).find((block) => block.includes("flowchart")) ?? "";

    expect(body).toContain(graphics["how-it-works"].light);
    expect(body).toContain("<details>");
    expect(mermaid.length).toBeGreaterThan(0);
    expect(mermaid).toMatch(/Ingest/i);
    expect(mermaid).toMatch(/libSQL/i);
    expect(mermaid).toMatch(/Reciprocal Rank Fusion/i);
    // Amended by `elevenlabs-voice-agent`: the voice agent and the widget are available now, so no node of the flow is
    // marked `(next)`. The capabilities that are still planned are not part of the flow of an answer.
    expect(mermaid).toMatch(/Voice agent/i);
    expect(mermaid).not.toContain("(next)");
  });

  it("closes with the license and the foot of Katalis", () => {
    const text = readText("README.md");
    const body = bodyOf(text, "License");

    expect(body).toContain("Apache-2.0");
    expect(linksOf(body)).toContain("LICENSE");
    expect(linksOf(body)).toContain("NOTICE");
    expect(body).toContain("Built by Katalis");
    expect(body).toContain("https://katalis.dev");
    expect(body).toContain(katalisFlame.light);
    expect(h2Titles(text).at(-1)).toBe(slug("License"));
  });

  // Requirement "Katalis always signs with its flame" of the change `brand-identity-ui`: the closing line of a README
  // reads in the language of the page, beside the flame.
  it("closes the Spanish README with Hecho por Katalis beside the flame", () => {
    const text = readText("README.es.md");
    const body = bodyOf(text, "Licencia");
    const signature = body.indexOf('<a href="https://katalis.dev">Hecho por Katalis</a>');
    const flame = body.lastIndexOf(katalisFlame.light, signature);

    expect(signature, "the closing line reads Hecho por Katalis").toBeGreaterThan(-1);
    expect(flame, "the flame sits just before the closing line").toBeGreaterThan(-1);
    expect(body.slice(flame, signature), "no other line between the flame and the signature").not.toMatch(
      /<p\b|<\/p>/,
    );
    expect(text, "the Spanish README never signs in English").not.toContain("Built by Katalis");
  });
});

describe("the product is named Cited", () => {
  it("carries the former name in no tracked file outside the archived changes", () => {
    const offenders = trackedFiles()
      .filter((file) => file.text !== null)
      .filter((file) => !file.path.startsWith(archivedChanges))
      .filter((file) => !file.path.startsWith(contractItself))
      .filter((file) => formerName.test(file.text ?? ""))
      .map((file) => file.path);

    expect(offenders).toEqual([]);
  });

  it("names Cited in the places a reader sees first", () => {
    const manifest = JSON.parse(readText("package.json")) as { name: string };

    expect(manifest.name).toBe("cited");
    expect((readText("NOTICE").split("\n")[0] ?? "").trim()).toBe("Cited");
    expect(readText("app/layout.tsx")).toContain("Cited");
    // Amended by the change `public-page-and-widget`: the page is the chat of the business now, so the name of the
    // product travels from `lib/public/brand.ts` as `PRODUCT_NAME`, it is the heading when the business has no name
    // yet, and it is the eyebrow of the shop when it has one.
    // Amended in `brand-identity-ui`: the page wears the wordmark and reads the name as `brand.name`, which
    // `lib/public/brand.ts` fills with `PRODUCT_NAME` while the business has none.
    expect(readText("app/page.tsx")).toContain("brand.name");
    expect(readText("lib/public/brand.ts")).toContain('PRODUCT_NAME = "Cited"');
    // Finding 43: `brand.name` alone would be satisfied by any variable, so the fallback itself is pinned: the name of the
    // brand is the business name or the product (the page with no settings renders "Cited" in `tests/brand-public.test.tsx`).
    expect(readText("lib/public/brand.ts")).toMatch(/name:[^\n]*\|\|\s*PRODUCT_NAME/);
  });

  it("keeps the home page as one main element with one heading and the chat of the business", () => {
    const page = readText("app/page.tsx");

    expect(times(page, "<main")).toBe(1);
    expect(times(page, "<h1")).toBe(1);
    expect(page).toContain("<Chat");
    expect(page).toContain("bg-paper");
  });
});
