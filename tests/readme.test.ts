import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(import.meta.dirname, "..");
const imagesDirectory = "docs/images";
const formerName = /katalis[\s-]+responde[\s-]+community/i;
const archivedChanges = "openspec/changes/archive/";
const contractItself = "openspec/changes/cited-identity-and-readme/";

const statusStates = ["Available", "Planned"] as const;
const plannedChanges = [
  "design-system-shared",
  "pluggable-models-and-ask",
  "admin-and-public-ui",
  "elevenlabs-voice-agent",
  "security-hardening",
  "docs-deploy-and-launch",
];
const activeSpecs = [
  "openspec/specs/app-skeleton/spec.md",
  "openspec/specs/knowledge-search/spec.md",
  "openspec/specs/repository-bootstrap/spec.md",
  "openspec/specs/supply-chain-security/spec.md",
];

const banner = {
  dark: `${imagesDirectory}/readme-banner-dark.png`,
  light: `${imagesDirectory}/readme-banner-light.png`,
};
const graphics = {
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
    planned: true,
  },
  "how-it-works": {
    dark: `${imagesDirectory}/how-it-works-dark.png`,
    light: `${imagesDirectory}/how-it-works-light.png`,
    planned: true,
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
    planned: true,
  },
};
const socialPreview = `${imagesDirectory}/social-preview.png`;
const katalisLogo = {
  light: `${imagesDirectory}/katalis-logo.png`,
  dark: `${imagesDirectory}/katalis-logo-dark.png`,
};
const bannerRecordPath = `${imagesDirectory}/readme-banner.json`;
const graphicsRecordPath = `${imagesDirectory}/readme-graphics.json`;

const imageHosts = ["https://img.shields.io/", "https://github.com/"];
const maximumImageWeight = 3 * 1024 * 1024;
const pngSignature = "89504e470d0a1a0a";

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
    const bytes = readFileSync(resolve(repositoryRoot, path));
    const binary = bytes.includes(0) || binaryExtensions.has(extname(path).toLowerCase());

    return { path: path.replaceAll("\\", "/"), text: binary ? null : bytes.toString("utf8") };
  });

  return trackedCache;
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
  const found = sectionsOf(text).filter(
    (section) => section.level === 2 && slug(section.title) === slug(name),
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

function statusRows(text: string): Array<{ capability: string; state: string; reference: string }> {
  return sectionNamed(text, "Status")
    .lines.map((line) => tableRow(line))
    .filter((cells): cells is string[] => cells !== null && cells.length === 3)
    .filter((cells) => (statusStates as readonly string[]).includes(cells[1] ?? ""))
    .map((cells) => ({
      capability: cells[0] ?? "",
      state: cells[1] ?? "",
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

  it("records the brand tokens and the font, and the font is not a file of the repository", () => {
    const tokens = recorded(bannerRecordPath)["tokens"] as Record<string, string>;
    const font = recorded(bannerRecordPath)["font"] as Record<string, string>;

    expect(tokens["ink"]?.toLowerCase()).toBe("#171717");
    expect(tokens["lime"]?.toLowerCase()).toBe("#ddf469");
    expect(font["name"]).toBe("Outfit");
    expect(font["loadedAtRenderTime"]).toBe(true);
    expect(font["fileInRepository"]).toBe(false);
    expect(
      trackedFiles().filter((file) => fontExtensions.has(extname(file.path).toLowerCase())),
    ).toEqual([]);
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
  it("marks every row Available or Planned, with the spec or the change that delivers it", () => {
    const rows = statusRows(readText("README.md"));

    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.filter((row) => row.state === "Available").length).toBeGreaterThanOrEqual(4);
    expect(rows.filter((row) => row.state === "Planned").length).toBeGreaterThanOrEqual(5);

    for (const row of rows) {
      if (row.state === "Available") {
        const linked = newlines("\\]\\(([^)]+)\\)").exec(row.reference)?.[1] ?? row.reference;

        expect(activeSpecs, row.capability).toContain(linked);
        expect(existsSync(resolve(repositoryRoot, linked)), row.capability).toBe(true);
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

    for (const phrase of ["answers with citations", "voice agent", "admin panel", "one-click deploy"]) {
      expect(prose(outside).toLowerCase(), phrase).not.toContain(phrase);
    }
  });
});

describe("README, the quick start and the configuration", () => {
  it("names only scripts of package.json, and runs the sample corpus with no key", () => {
    const manifest = JSON.parse(readText("package.json")) as { scripts: Record<string, string> };
    const quickStart = bodyOf(readText("README.md"), "Quick start");

    expect(commands(quickStart).length).toBeGreaterThanOrEqual(4);
    expect(commands(quickStart)).toContain("ci");
    expect(commands(quickStart)).toContain("ingest");
    expect(commands(quickStart)).toContain("search");

    for (const command of commands(quickStart)) {
      if (command !== "ci") {
        expect(Object.keys(manifest.scripts), command).toContain(command);
      }
    }

    expect(quickStart).toContain("samples/");
    expect(quickStart).toContain("EMBEDDINGS_PROVIDER=fake");
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
  it("has the same sections in the same order", () => {
    expect(h2Titles(readText("README.es.md"))).toEqual(h2Titles(readText("README.md")));
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
          expect(existsSync(resolve(repositoryRoot, target)), `${path} -> ${target}`).toBe(true);
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
  const themedMappings: Array<[string, string]> = [
    [banner.dark, banner.light],
    ...Object.values(graphics).map(
      (graphic): [string, string] => [graphic.dark, graphic.light],
    ),
    [katalisLogo.dark, katalisLogo.light],
  ];

  it("shows every graphic of the design in both themes, as a picture with its alt", () => {
    const pictures = pictureBlocks(readText("README.md"));

    for (const [dark, light] of themedMappings) {
      const block = pictures.find((picture) => picture.includes(dark));

      expect(block, dark).toBeDefined();
      expect(sourceOf(block ?? "", "dark"), dark).toBe(dark);
      expect(sourceOf(block ?? "", "light"), light).toBe(light);
      expect(altOf(block ?? "").length, dark).toBeGreaterThan(5);
    }
  });

  it("keeps every image as a PNG under docs/images, 3 MB or less together", () => {
    const text = `${readText("README.md")}\n${readText("README.es.md")}`;
    const local = imagesOf(text).filter((image) => !image.startsWith("http"));
    const total = local.reduce((sum, image) => sum + sizeInBytes(image), 0);

    expect(local.length).toBeGreaterThanOrEqual(18);

    for (const image of local) {
      expect(image.startsWith(imagesDirectory), image).toBe(true);
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
    const quickStart = bodyOf(readText("README.md"), "Quick start");

    expect(ingest["command"]).toBe("npm run ingest -- samples/");
    expect(search["command"]).toContain("npm run search --");
    expect(String(ingest["output"])).toContain("documents 4, passages 11");
    expect(String(search["output"])).toMatch(newlines("^\\d+\\. ", "m"));
    expect(demo["exitCode"]).toBe(0);

    const drawn = demo["drawn"] as Record<string, string[]>;

    for (const line of drawn["ingest"] ?? []) {
      expect(quickStart, line).toContain(line);
    }

    for (const line of (drawn["search"] ?? []).slice(0, 10)) {
      expect(quickStart, line).toContain(line);
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

  it("carries a social preview of 1280 by 640 with the name, the tagline and the byline", () => {
    const social = recorded(graphicsRecordPath)["social"] as Record<string, unknown>;
    const tagline = recorded(bannerRecordPath)["tagline"] as string;

    expect(pngSize(socialPreview)).toEqual({ width: 1280, height: 640 });
    expect(social["name"]).toBe("Cited");
    expect(social["tagline"]).toBe(tagline);
    expect(social["byline"]).toBe("by Katalis");
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
    expect(mermaid).toContain("(next)");
  });

  it("closes with the license and the foot of Katalis", () => {
    const text = readText("README.md");
    const body = bodyOf(text, "License");

    expect(body).toContain("Apache-2.0");
    expect(linksOf(body)).toContain("LICENSE");
    expect(linksOf(body)).toContain("NOTICE");
    expect(body).toContain("Built by Katalis");
    expect(body).toContain("https://katalis.dev");
    expect(body).toContain(katalisLogo.light);
    expect(h2Titles(text).at(-1)).toBe(slug("License"));
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
    expect(readText("app/page.tsx")).toContain("Cited");
  });

  it("keeps the home page as one main element with one heading that names Cited and nothing else", () => {
    const page = readText("app/page.tsx");

    expect(times(page, "<main")).toBe(1);
    expect(times(page, "<h1")).toBe(1);
    expect(page).toContain("<h1>Cited</h1>");
    expect(page).not.toMatch(/className|<p|<section|<div/);
  });
});
