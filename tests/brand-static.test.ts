import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The static half of the change `brand-identity-ui`: what can be read from the stylesheets, the package and the sources
// without rendering a page. The three spec deltas of `openspec/changes/brand-identity-ui/specs/` are read here through
// `design.md`:
//
//   * decisions 1 and 5: the additive tokens, `app/brand.css` with its four keyframes and its reduced-motion block,
//   * the requirement "Motion serves the state and respects the reader": nothing external moves, every animation is CSS
//     of the application and animates only `transform`, `opacity` or the size of the highlighter,
//   * the contrast of the colors that the identity introduces, computed from the hex values with the formula of WCAG 2.2,
//   * the bans of the craft rules: no colored side stripe, no gradient text, no emoji as an icon.
//
// What needs a browser (the computed colors of every text, the running animations, the layout at 1440 and 375 px) lives in
// `e2e/brand.spec.ts` and `e2e/admin-brand.spec.ts`; the components have their own unit tests, written by whoever builds
// them.

const repositoryRoot = resolve(import.meta.dirname, "..");
const tokensSheet = "app/tokens.css";
const brandSheet = "app/brand.css";
const globalsSheet = "app/globals.css";
const keyframeNames = ["mark-land", "note-in", "rise", "bar"] as const;
const allowedKeyframeProperties = new Set([
  "transform",
  "opacity",
  "background-size",
  "animation-timing-function",
]);

function absolute(path: string): string {
  return resolve(repositoryRoot, path);
}

function readText(path: string): string {
  return readFileSync(absolute(path), "utf8");
}

function withoutComments(css: string): string {
  return css.replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

type Rule = { prelude: string; body: string };

/** The rules at the top level of a stylesheet (or of the body of an at-rule), in order, with brace matching. */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  const text = withoutComments(css);
  let cursor = 0;

  while (cursor < text.length) {
    const open = text.indexOf("{", cursor);
    const semicolon = text.indexOf(";", cursor);

    if (open === -1) {
      break;
    }

    // A statement with no body (`@import "x";`) ends before the next brace.
    if (semicolon !== -1 && semicolon < open) {
      cursor = semicolon + 1;
      continue;
    }

    let depth = 1;
    let at = open + 1;

    while (at < text.length && depth > 0) {
      const character = text[at];

      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
      }

      at += 1;
    }

    rules.push({ prelude: text.slice(cursor, open).trim(), body: text.slice(open + 1, at - 1) });
    cursor = at;
  }

  return rules;
}

/** Every keyframe the stylesheet declares, so that the highlighter's own sweep is policed like the four of decision 5. */
function declaredKeyframes(css: string): string[] {
  return rulesOf(css)
    .filter((rule) => /^@keyframes\b/.test(rule.prelude))
    .map((rule) => rule.prelude.replace(/^@keyframes\s+/, "").trim());
}

function escapeForPattern(name: string): string {
  return name.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const reducedMotion = /^@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)$/;

function declarationsOf(body: string): Map<string, string> {
  const found = new Map<string, string>();

  for (const match of body.matchAll(/(^|[;{\s])(-{0,2}[a-z][a-z0-9-]*)\s*:\s*([^;]+);?/gi)) {
    found.set((match[2] ?? "").toLowerCase(), (match[3] ?? "").trim());
  }

  return found;
}

/** The custom properties declared in the first `:root` rule of a stylesheet. */
function rootTokens(sheet: string): Map<string, string> {
  const root = rulesOf(readText(sheet)).find((rule) => rule.prelude === ":root");

  return declarationsOf(root?.body ?? "");
}

function themeTokens(sheet: string): Map<string, string> {
  const theme = rulesOf(readText(sheet)).find((rule) => /^@theme\b/.test(rule.prelude));

  return declarationsOf(theme?.body ?? "");
}

function simpleSelectors(prelude: string): string[] {
  return prelude
    .split(",")
    .flatMap((selector) => selector.match(/\.[A-Za-z_][\w-]*|\[[^\]]+\]/g) ?? []);
}

// WCAG 2.2, relative luminance and contrast ratio, from hex values.
type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, "");

  expect(value, `"${hex}" is a six digit hex color`).toMatch(/^[0-9a-f]{6}$/i);

  return [0, 2, 4].map((at) => Number.parseInt(value.slice(at, at + 2), 16)) as Rgb;
}

function channel(octet: number): number {
  const value = octet / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Rgb): number {
  return 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
}

function contrast(one: Rgb, other: Rgb): number {
  const first = luminance(one);
  const second = luminance(other);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** `top` painted at `alpha` over `ground`, as a browser composites `text-paper/60` over an ink column. */
function mixed(top: Rgb, alpha: number, ground: Rgb): Rgb {
  return top.map((octet, at) => octet * alpha + (ground[at] ?? 0) * (1 - alpha)) as Rgb;
}

function ratio(value: number): string {
  return `${value.toFixed(2)}:1`;
}

function sourcesUnder(...directories: string[]): string[] {
  const found: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);

      if (statSync(path).isDirectory()) {
        visit(path);
      } else if ([".ts", ".tsx", ".css", ".mdx"].includes(extname(path))) {
        found.push(path);
      }
    }
  };

  for (const directory of directories) {
    visit(absolute(directory));
  }

  return found.map((path) => relative(repositoryRoot, path).replaceAll("\\", "/"));
}

describe("app/brand.css: every keyframe of the product, and the reduced-motion block", () => {
  it("exists and declares the keyframes mark-land, note-in, rise and bar", () => {
    expect(existsSync(absolute(brandSheet)), `${brandSheet} exists`).toBe(true);

    const declared = rulesOf(readText(brandSheet))
      .filter((rule) => /^@keyframes\b/.test(rule.prelude))
      .map((rule) => rule.prelude.replace(/^@keyframes\s+/, "").trim());

    for (const name of keyframeNames) {
      expect(declared, `@keyframes ${name}`).toContain(name);
    }
  });

  it("animates only transform, opacity and the size of the highlighter inside its keyframes", () => {
    const keyframes = rulesOf(readText(brandSheet)).filter((rule) => /^@keyframes\b/.test(rule.prelude));

    expect(keyframes.length, "the keyframes of the file").toBeGreaterThanOrEqual(keyframeNames.length);

    let seen = 0;

    for (const frames of keyframes) {
      for (const step of rulesOf(frames.body)) {
        for (const property of declarationsOf(step.body).keys()) {
          seen += 1;
          expect(
            allowedKeyframeProperties.has(property),
            `${frames.prelude} ${step.prelude} animates ${property}: only transform, opacity and background-size may move`,
          ).toBe(true);
        }
      }
    }

    expect(seen, "the properties the test read inside the keyframes").toBeGreaterThanOrEqual(keyframes.length * 2);
  });

  it("times every animation between 150 and 700 ms, the waiting bar excepted", () => {
    const tokens = rootTokens(tokensSheet);
    const seconds = (token: string): number => {
      const variable = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(token)?.[1];
      const value = variable === undefined ? token : (tokens.get(variable) ?? "");
      const time = /^(\d*\.?\d+)(ms|s)$/.exec(value.trim());

      return time === null ? Number.NaN : Number(time[1]) * (time[2] === "s" ? 1000 : 1);
    };
    const animating = rulesOf(readText(brandSheet)).filter(
      (rule) => reducedMotion.test(rule.prelude) === false && /^@keyframes\b/.test(rule.prelude) === false,
    );
    let measured = 0;

    for (const rule of animating) {
      const declared = declarationsOf(rule.body);
      const shorthand = declared.get("animation");

      if (shorthand === undefined) {
        continue;
      }

      for (const one of shorthand.split(/,(?![^(]*\))/)) {
        const name = declaredKeyframes(readText(brandSheet)).find((candidate) =>
          new RegExp(`(^|\\s)${escapeForPattern(candidate)}(\\s|$)`).test(one),
        );

        if (name === undefined || name === "bar") {
          continue;
        }

        const time =
          /(?:^|\s)(var\(\s*--dur-[a-z]+\s*\)|\d*\.?\d+m?s)(?=\s|$)/.exec(one)?.[1] ??
          declared.get("animation-duration") ??
          "";
        const duration = seconds(time);

        measured += 1;
        expect(duration, `${rule.prelude}: ${name} lasts ${time} (150 to 700 ms)`).toBeGreaterThanOrEqual(150);
        expect(duration, `${rule.prelude}: ${name} lasts ${time} (150 to 700 ms)`).toBeLessThanOrEqual(700);
      }
    }

    expect(measured, "the animations of mark-land, note-in and rise that the file declares").toBeGreaterThanOrEqual(3);
  });

  it("sets animation to none, under prefers-reduced-motion, for every class that uses a keyframe", () => {
    const rules = rulesOf(readText(brandSheet));
    const reduced = rules.filter((rule) => reducedMotion.test(rule.prelude));

    expect(reduced.length, "a @media (prefers-reduced-motion: reduce) block").toBe(1);

    const inside = rulesOf(reduced[0]?.body ?? "");
    const names = declaredKeyframes(readText(brandSheet));
    const uses = new RegExp(
      `animation(-name)?\\s*:[^;]*(^|[\\s:,])(${names.map(escapeForPattern).join("|")})(?=[\\s;,]|$)`,
    );
    const users = rules.filter(
      (rule) =>
        reducedMotion.test(rule.prelude) === false &&
        /^@keyframes\b/.test(rule.prelude) === false &&
        uses.test(rule.body),
    );

    expect(users.length, "the rules of the file that start an animation").toBeGreaterThanOrEqual(keyframeNames.length);

    const removedByAll = inside.some(
      (rule) =>
        /(^|,)\s*\*\s*(,|$)/.test(rule.prelude) &&
        /animation(-name)?\s*:\s*none/.test(rule.body),
    );

    for (const user of users) {
      for (const selector of simpleSelectors(user.prelude)) {
        const removed =
          removedByAll ||
          inside.some(
            (rule) =>
              simpleSelectors(rule.prelude).includes(selector) &&
              /animation(-name)?\s*:\s*none/.test(rule.body),
          );

        expect(removed, `${selector} starts an animation and reduced motion sets it to none`).toBe(true);
      }
    }

    const transitions = rules.filter(
      (rule) => reducedMotion.test(rule.prelude) === false && /(^|[;\s])transition\s*:/.test(rule.body),
    );

    if (transitions.length > 0) {
      expect(
        inside.some((rule) => /transition(-duration)?\s*:\s*(none|0)/.test(rule.body)),
        "the file declares a transition, so reduced motion sets transitions to none",
      ).toBe(true);
    }
  });

  it("gives the highlighter its final background-size under reduced motion", () => {
    const reduced = rulesOf(readText(brandSheet)).find((rule) => reducedMotion.test(rule.prelude));
    const painted = rulesOf(reduced?.body ?? "").filter(
      (rule) =>
        /\.hl\b/.test(rule.prelude) &&
        /background-size\s*:\s*100%\s+100%/.test(rule.body),
    );

    expect(painted.length, "a rule of the reduced-motion block paints the highlighter at 100% 100%").toBeGreaterThan(0);
  });

  it("is the only stylesheet that declares a keyframe, and no source uses a utility that brings one", () => {
    const withKeyframes = sourcesUnder("app", "components").filter(
      (path) => path !== brandSheet && readText(path).includes("@keyframes"),
    );
    const withUtility = sourcesUnder("app", "components").filter((path) =>
      /\banimate-(spin|pulse|bounce|ping)\b/.test(readText(path)),
    );

    expect(withKeyframes, "keyframes outside app/brand.css").toEqual([]);
    expect(withUtility, "Tailwind animation utilities").toEqual([]);
  });
});

describe("the additive tokens of app/tokens.css and the import of app/brand.css", () => {
  it("keeps the tokens of Construye untouched", () => {
    const tokens = rootTokens(tokensSheet);

    expect(tokens.get("--ink")?.toLowerCase()).toBe("#171717");
    expect(tokens.get("--lime")?.toLowerCase()).toBe("#ddf469");
    expect(tokens.get("--coral")?.toLowerCase()).toBe("#ff6059");
    expect(tokens.get("--surface")?.toLowerCase()).toBe("#fafaf9");
    expect(tokens.get("--surface-dark")?.toLowerCase()).toBe("#1c1917");
    expect(tokens.get("--paper")?.toLowerCase()).toBe("#ffffff");
    expect(tokens.get("--border")).toMatch(/^color-mix\(in srgb, ?var\(--ink\) 50%, ?var\(--paper\)\)$/);
    expect(tokens.get("--radius")).toBe("0");
    expect(tokens.get("--ease-out-expo")).toMatch(/^cubic-bezier\(0\.16, ?1, ?0\.3, ?1\)$/);
  });

  it("adds --ink-2, --rule and the three durations in the same :root", () => {
    const tokens = rootTokens(tokensSheet);

    expect(tokens.get("--ink-2")?.toLowerCase(), "--ink-2").toBe("#57534e");
    expect(tokens.get("--rule"), "--rule").toMatch(
      /^color-mix\(in srgb, ?var\(--ink\) 12%, ?var\(--paper\)\)$/,
    );
    expect(tokens.get("--dur-fast"), "--dur-fast").toBe("180ms");
    expect(tokens.get("--dur-base"), "--dur-base").toBe("320ms");
    expect(tokens.get("--dur-slow"), "--dur-slow").toBe("640ms");
  });

  it("exposes --ink-2 to Tailwind, so that text-ink-2 exists", () => {
    expect(themeTokens(tokensSheet).get("--color-ink-2"), "--color-ink-2").toBe("var(--ink-2)");
  });

  it("imports ./brand.css from app/globals.css, after the tokens", () => {
    const globals = readText(globalsSheet);

    expect(globals).toContain('@import "./tokens.css"');
    expect(globals).toContain('@import "./brand.css"');
    expect(globals.indexOf('@import "./brand.css"'), "brand.css comes after tokens.css").toBeGreaterThan(
      globals.indexOf('@import "./tokens.css"'),
    );
  });
});

describe("contrast of the colors the identity introduces, from the hex values (WCAG 2.2, 4.5:1)", () => {
  const tokens = rootTokens(tokensSheet);
  const hex = (name: string): string => tokens.get(name) ?? "";
  const cases: ReadonlyArray<{ label: string; value: () => number }> = [
    {
      label: "ink-2 (secondary text) on white paper",
      value: () => contrast(rgb(hex("--ink-2")), rgb("#FFFFFF")),
    },
    {
      label: "ink-2 (secondary text) on the surface #FAFAF9",
      value: () => contrast(rgb(hex("--ink-2")), rgb("#FAFAF9")),
    },
    {
      label: "ink on lime (the number inside a citation mark, the highlighted words)",
      value: () => contrast(rgb(hex("--ink")), rgb(hex("--lime"))),
    },
    {
      label: "lime on ink (the number of the current place, the chosen language on ink)",
      value: () => contrast(rgb(hex("--lime")), rgb(hex("--ink"))),
    },
    {
      label: "paper at 60% over ink (the numeral of an inactive navigation mark)",
      value: () => contrast(mixed(rgb(hex("--paper")), 0.6, rgb(hex("--ink"))), rgb(hex("--ink"))),
    },
    {
      label: "paper at 70% over ink (the secondary text of the ink column)",
      value: () => contrast(mixed(rgb(hex("--paper")), 0.7, rgb(hex("--ink"))), rgb(hex("--ink"))),
    },
    {
      label: "paper at 80% over ink (the name of an inactive navigation link)",
      value: () => contrast(mixed(rgb(hex("--paper")), 0.8, rgb(hex("--ink"))), rgb(hex("--ink"))),
    },
  ];

  for (const { label, value } of cases) {
    it(`${label} reaches 4.5:1`, () => {
      const measured = value();

      expect(measured, `${label}: ${ratio(measured)}`).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("no animation library, and no dependency that main does not have", () => {
  const banned = ["gsap", "motion", "framer-motion", "animejs", "anime.js", "lenis", "@studio-freight/lenis"];

  function dependenciesOf(text: string): string[] {
    const parsed = JSON.parse(text) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return [...Object.keys(parsed.dependencies ?? {}), ...Object.keys(parsed.devDependencies ?? {})].sort();
  }

  function packageOfMain(): string | null {
    for (const reference of ["main", "origin/main"]) {
      try {
        return execFileSync("git", ["show", `${reference}:package.json`], {
          cwd: repositoryRoot,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        // The next reference, and finally the committed list below: a missing `main` never turns the check into a skip.
      }
    }

    return null;
  }

  const main = packageOfMain();

  it("has no animation library among its dependencies", () => {
    const present = dependenciesOf(readText("package.json"));

    for (const name of banned) {
      expect(present, name).not.toContain(name);
    }
  });

  // Round 14c (finding 42): the guard never skips itself. Where git can read `main` (a checkout with its history) it compares
  // with `main`; where it cannot (a shallow clone, a container over a mounted worktree, a build without `.git`) it compares
  // with the list of the dependencies of `main` that is committed in `tests/fixtures/dependencies-of-main.json`.
  it("adds no dependency to the ones of main, and never skips the check when git cannot read main", () => {
    const listed = (JSON.parse(readText("tests/fixtures/dependencies-of-main.json")) as { names: string[] }).names;
    const before = new Set(main === null ? listed : dependenciesOf(main));
    const added = dependenciesOf(readText("package.json")).filter((name) => before.has(name) === false);

    expect(added, "dependencies that main does not have").toEqual([]);
    expect(listed.length, "the committed list of the dependencies of main").toBeGreaterThan(20);
  });
});

describe("the bans of the craft rules, over app/ and components/", () => {
  const sources = sourcesUnder("app", "components");

  it("reads the sources it claims to police", () => {
    expect(sources.length, "sources under app/ and components/").toBeGreaterThan(10);
    expect(sources).toContain("app/tokens.css");
  });

  // A side stripe is a border on one side, two pixels or wider, used as an accent. `border-l` alone is the hairline of 1px.
  const stripe =
    /\bborder-[lrse]-(?:[2-9]|\d{2,}|\[\s*(?:[2-9]|\d{2,})(?:\.\d+)?(?:px|rem|em)\s*\])(?![\w-])|border-(?:left|right|inline-start|inline-end)(?:-width)?\s*:\s*(?:[2-9]|\d{2,})(?:\.\d+)?(?:px|rem|em)/;

  it("has no colored side stripe (border-l-2, border-r-2 or wider used as an accent)", () => {
    const offenders = sources.filter((path) => stripe.test(readText(path)));

    expect(offenders, "files with a side stripe").toEqual([]);
  });

  it("has no gradient text (bg-clip-text, background-clip: text)", () => {
    const offenders = sources.filter((path) =>
      /\bbg-clip-text\b|background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text|text-fill-color\s*:\s*transparent/.test(
        readText(path),
      ),
    );

    expect(offenders, "files with gradient text").toEqual([]);
  });

  it("renders no emoji and no pictograph as an icon", () => {
    const offenders = sources.filter((path) => /\p{Extended_Pictographic}|\uFE0F|\u20E3/u.test(readText(path)));

    expect(offenders, "files with an emoji").toEqual([]);
  });

  it("puts no glassmorphism on a surface (backdrop-blur, backdrop-filter)", () => {
    const offenders = sources.filter((path) => /\bbackdrop-blur\b|backdrop-filter\s*:/.test(readText(path)));

    expect(offenders, "files with a blurred surface").toEqual([]);
  });
});
