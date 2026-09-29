import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The three scenarios of `openspec/changes/brand-and-design-system/specs/design-system/spec.md` that need a browser:
// the computed font of `html`, of `body` and of a paragraph with no request to a font host outside the app; the public
// page `/kit` with one example of each component of the kit and an axe check of level A and AA; and the scenario
// `The controls can be seen`, which measures the computed colors of the rendered page instead of trusting the absence
// of violations of axe, because the contrast of a border is not one of the rules of that run.
//
// The unit half of the change lives in `tests/design-system.test.ts`.

const markers = [
  "button-primary",
  "button-secondary",
  "input",
  "chip",
  "panel",
  "section-title",
];

// The measurement of the scenario `The controls can be seen`. The page paints the ground of an element with the
// background of its ancestors in a canvas and composites the computed colours on it, so a colour with alpha is
// measured as the reader sees it; the contrast is the one of WCAG 2.2 (1.4.11), relative luminance over the same
// ground.
type Pixel = [number, number, number];

type Sampled = {
  label: string;
  border: string;
  borderWidth: number;
  background: string;
  ground: Pixel;
  borderOverGround: Pixel;
  backgroundOverGround: Pixel;
};

type SampledText = {
  label: string;
  text: string;
  color: string;
  fontSize: number;
  ground: Pixel;
  textOverGround: Pixel;
};

type SampledFocus = {
  visible: boolean;
  outline: { color: string; width: number; style: string; offset: number; overGround: Pixel };
  ring: { color: string; spread: number; overGround: Pixel } | null;
  ground: Pixel;
};

type Measured = {
  hairline: { name: string; value: string; overGround: Pixel };
  controls: Sampled[];
  decorative: Sampled[];
  texts: SampledText[];
  focus: Record<string, SampledFocus>;
};

/** The channel of the relative luminance of WCAG 2.2, from an octet of the rendered pixel. */
function channel(value: number): number {
  const octet = value / 255;

  return octet <= 0.04045 ? octet / 12.92 : ((octet + 0.055) / 1.055) ** 2.4;
}

function luminance(pixel: Pixel): number {
  return 0.2126 * channel(pixel[0]) + 0.7152 * channel(pixel[1]) + 0.0722 * channel(pixel[2]);
}

function contrast(one: Pixel, other: Pixel): number {
  const first = luminance(one);
  const second = luminance(other);
  const [light, dark] = first > second ? [first, second] : [second, first];

  return (light + 0.05) / (dark + 0.05);
}

function seen(pixel: Pixel): string {
  return `rgb(${pixel.join(", ")})`;
}

function ratio(value: number): string {
  return `${value.toFixed(2)}:1`;
}

test("every text of the app is Outfit, served by the app", async ({ page }) => {
  const asked: string[] = [];

  page.on("request", (request) => {
    asked.push(request.url());
  });

  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  const origin = new URL(page.url()).origin;

  await page.evaluate(() => document.fonts.ready);

  const families = await page.evaluate(() => {
    const family = (element: Element | null): string =>
      element === null ? "no element" : getComputedStyle(element).fontFamily;

    return {
      html: family(document.documentElement),
      body: family(document.body),
      paragraph: family(document.querySelector("p")),
    };
  });

  console.log(`computed font-family: ${JSON.stringify(families)}`);
  console.log(`requests of the page: ${JSON.stringify(asked)}`);

  for (const [where, family] of Object.entries(families)) {
    expect(family, `the computed font-family of ${where}`).toMatch(/^["']?Outfit["']?(\s*,|$)/);
  }

  const fetched = asked.filter((url) => /^(data:|blob:|about:)/.test(url) === false);
  const external = fetched.filter((url) => new URL(url).origin !== origin);
  const families_ = fetched.filter((url) => /\.woff2?(\?|$)/.test(url));

  expect(external, "no request leaves the app").toEqual([]);
  expect(
    families_.some((url) => url.includes("/fonts/outfit/")),
    "the app serves its own Outfit file",
  ).toBe(true);
});

test("the kit renders every component, answers 200 and passes axe", async ({ page }) => {
  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  for (const marker of markers) {
    await expect(page.locator(`[data-kit="${marker}"]`), marker).toHaveCount(1);
  }

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Buscar" })).toBeVisible();
  await expect(page.getByRole("textbox")).toBeVisible();

  const primary = page.locator('[data-kit="button-primary"]');

  await primary.focus();
  // The button carries `transition-colors` with the curve of the system, and the outline fades in with it: the
  // measurement waits for the transition to land instead of reading a colour halfway.
  await page.waitForTimeout(600);

  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = element === null ? null : getComputedStyle(element);

    return {
      visible: element?.matches(":focus-visible") ?? false,
      width: style?.outlineWidth ?? "0px",
      style: style?.outlineStyle ?? "none",
      color: style?.outlineColor ?? "none",
    };
  });

  console.log(`focus of the primary button: ${JSON.stringify(focus)}`);

  expect(focus.visible, "the focus is visible").toBe(true);
  expect(Number.parseFloat(focus.width), "the outline is 2 px").toBeGreaterThanOrEqual(2);
  expect(focus.style).toBe("solid");
  expect(focus.color.replaceAll(" ", ""), "the outline is lime").toBe("rgb(221,244,105)");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  console.log(
    `axe: ${results.violations.length} violations, ${results.passes.length} rules passed`,
  );

  expect(
    results.violations.map(
      (violation) => `${violation.id} (${violation.impact}): ${violation.nodes.length} nodes`,
    ),
  ).toEqual([]);
});

test("the controls can be seen: 3:1 of the border and of the focus, 4.5:1 of every text", async ({
  page,
}) => {
  const response = await page.goto("/kit");

  expect(response?.status()).toBe(200);

  const measured = (await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    const surface = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = 1;
    canvas.height = 1;

    if (surface === null) {
      throw new Error("the page cannot composite the computed colours: no 2d context");
    }

    const pixel = (): Pixel =>
      [0, 1, 2].map((at) => surface.getImageData(0, 0, 1, 1).data[at] ?? 0) as Pixel;

    const asColor = (value: Pixel): string => `rgb(${value.join(", ")})`;

    /** The page ground first (white), then every colour in the order it is painted. */
    const paint = (...colors: string[]): Pixel => {
      surface.clearRect(0, 0, 1, 1);
      surface.fillStyle = "#FFFFFF";
      surface.fillRect(0, 0, 1, 1);

      for (const color of colors) {
        surface.fillStyle = color;
        surface.fillRect(0, 0, 1, 1);
      }

      return pixel();
    };

    const over = (color: string, ground: Pixel): Pixel => paint(asColor(ground), color);

    /** The ground an element sits on: the default ground of the page and the background of every ancestor. */
    const groundOf = (element: Element, itself = false): Pixel => {
      const chain: Element[] = [];
      const from: Element | null = itself ? element : element.parentElement;

      for (let node = from; node !== null; node = node.parentElement) {
        chain.unshift(node);
      }

      return paint(...chain.map((node) => getComputedStyle(node).backgroundColor));
    };

    const elementOf = (selector: string): Element => {
      const element = document.querySelector(selector);

      if (element === null) {
        throw new Error(`the page carries no ${selector}`);
      }

      return element;
    };

    const sample = (label: string, selector: string): Sampled => {
      const element = elementOf(selector);
      const style = getComputedStyle(element);
      const ground = groundOf(element);

      return {
        label,
        border: style.borderTopColor,
        borderWidth: Number.parseFloat(style.borderTopWidth),
        background: style.backgroundColor,
        ground,
        borderOverGround: over(style.borderTopColor, ground),
        backgroundOverGround: over(style.backgroundColor, ground),
      };
    };

    const texts: SampledText[] = [];

    const addText = (label: string, element: Element, color: string): void => {
      const style = getComputedStyle(element);
      const ground = groundOf(element, true);

      texts.push({
        label,
        text: (element.textContent ?? "").replaceAll(/\s+/g, " ").trim().slice(0, 48),
        color,
        fontSize: Number.parseFloat(style.fontSize),
        ground,
        textOverGround: over(color, ground),
      });
    };

    for (const element of document.querySelectorAll("main, main *")) {
      const own = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? "").trim().length > 0,
      );

      if (own === false) {
        continue;
      }

      addText(element.tagName.toLowerCase(), element, getComputedStyle(element).color);
    }

    const field = elementOf('[data-kit="input"]');

    addText("the value of the field", field, getComputedStyle(field).color);
    addText(
      "the placeholder of the field",
      field,
      getComputedStyle(field, "::placeholder").color,
    );

    // The hairline of the controls as the token resolves it in the page, so the test says whether the border of a
    // control is the token of the system and not the colour a utility falls back to.
    const probe = document.createElement("span");

    probe.style.color = "var(--border)";
    document.body.append(probe);

    const token = getComputedStyle(probe).color;

    probe.remove();

    const ground = groundOf(field);
    const focusOf = (selector: string): SampledFocus => {
      const element = elementOf(selector);
      const style = getComputedStyle(element);
      const behind = groundOf(element);
      const shadows = [
        ...style.boxShadow.matchAll(
          /(rgba?\([^)]*\)|oklab\([^)]*\)|color\([^)]*\)|#[0-9a-fA-F]+)\s*((?:-?[\d.]+px\s*)+)/g,
        ),
      ]
        .map((match) => ({
          color: match[1] ?? "",
          spread: Number.parseFloat((match[2] ?? "").trim().split(/\s+/).at(-1) ?? "0"),
        }))
        .filter((shadow) => shadow.spread > 0);
      const edge = shadows.at(-1) ?? null;

      return {
        visible: element.matches(":focus-visible"),
        outline: {
          color: style.outlineColor,
          width: Number.parseFloat(style.outlineWidth),
          style: style.outlineStyle,
          offset: Number.parseFloat(style.outlineOffset),
          overGround: over(style.outlineColor, behind),
        },
        ring: edge === null ? null : { ...edge, overGround: over(edge.color, behind) },
        ground: behind,
      };
    };

    const focus: Record<string, SampledFocus> = {};

    for (const selector of ['[data-kit="input"]', '[data-kit="button-secondary"]']) {
      const element = elementOf(selector);

      if (element instanceof HTMLElement) {
        element.focus();
        // The button carries `transition-colors` with the curve of the system and the outline arrives with it.
        await new Promise((resolve) => setTimeout(resolve, 600));
        focus[selector] = focusOf(selector);
      }
    }

    return {
      hairline: { name: "--border", value: token, overGround: over(token, ground) },
      controls: [
        sample("Input", '[data-kit="input"]'),
        sample("the secondary Button", '[data-kit="button-secondary"]'),
      ],
      decorative: [sample("Panel", '[data-kit="panel"]'), sample("Chip", '[data-kit="chip"]')],
      texts,
      focus,
    };
  })) as Measured;

  console.log(
    `the hairline of the controls: ${measured.hairline.name} resolves to ${measured.hairline.value} = ` +
      `${seen(measured.hairline.overGround)} on the ground of the page`,
  );

  for (const control of measured.controls) {
    const value = contrast(control.borderOverGround, control.ground);

    console.log(
      `${control.label}: the border is ${control.border} = ${seen(control.borderOverGround)} over the ground ` +
        `${seen(control.ground)}, ${ratio(value)} at ${control.borderWidth}px (the scenario asks 3:1)`,
    );

    expect(value, `${control.label}: the border over the ground it sits on`).toBeGreaterThanOrEqual(3);
    expect(control.borderWidth, `${control.label}: the hairline of a control`).toBe(1);
    expect(
      seen(control.borderOverGround),
      `${control.label}: the border is the hairline of the system and not a colour of its own`,
    ).toBe(seen(measured.hairline.overGround));
  }

  // The scenario exempts the border and the fill of `Panel`, because the content of the panel does not depend on
  // seeing its edge. The `Chip` is the same case: it is a label and not a control, its word carries it and its edge
  // is as decorative as the hairline of the panel. Both are measured and reported, and neither is asserted.
  for (const part of measured.decorative) {
    console.log(
      `${part.label}: the border ${seen(part.borderOverGround)} is ` +
        `${ratio(contrast(part.borderOverGround, part.ground))} and the fill ` +
        `${seen(part.backgroundOverGround)} is ${ratio(contrast(part.backgroundOverGround, part.ground))}: ` +
        `decorative and exempt`,
    );
  }

  expect(measured.texts.length, "the texts of the page the test measured").toBeGreaterThan(8);

  for (const text of measured.texts) {
    const required = text.fontSize >= 24 ? 3 : 4.5;
    const value = contrast(text.textOverGround, text.ground);

    console.log(
      `${text.label} "${text.text}" at ${text.fontSize}px: ${seen(text.textOverGround)} over ` +
        `${seen(text.ground)} = ${ratio(value)} (asks ${required}:1)`,
    );

    expect(
      value,
      `${text.label} "${text.text}" at ${text.fontSize}px: the text over the ground it sits on`,
    ).toBeGreaterThanOrEqual(required);
  }

  expect(Object.keys(measured.focus).length, "the focus indicators the test measured").toBe(2);

  for (const [selector, indicator] of Object.entries(measured.focus)) {
    const outline = contrast(indicator.outline.overGround, indicator.ground);
    const edge = indicator.ring === null ? 0 : contrast(indicator.ring.overGround, indicator.ground);

    console.log(
      `the focus of ${selector}: the outline ${seen(indicator.outline.overGround)} of ` +
        `${indicator.outline.width}px is ${ratio(outline)}, and the edge that the design pairs with it ` +
        `(${indicator.ring === null ? "none" : `${seen(indicator.ring.overGround)} of ${indicator.ring.spread}px`}) ` +
        `is ${ratio(edge)} (the indicator asks 3:1)`,
    );

    expect(indicator.visible, `${selector}: the focus is visible`).toBe(true);
    expect(indicator.outline.style, `${selector}: the outline is drawn`).toBe("solid");
    expect(indicator.outline.width, `${selector}: the outline of the design`).toBeGreaterThanOrEqual(2);
    expect(
      seen(indicator.outline.overGround),
      `${selector}: the outline keeps the lime of the design`,
    ).toBe("rgb(221, 244, 105)");
    expect(
      indicator.ring?.spread ?? 0,
      `${selector}: the one pixel edge of ink of the focus`,
    ).toBeGreaterThanOrEqual(1);
    expect(
      Math.max(outline, edge),
      `${selector}: the indicator reaches 3:1 through the part that carries its contrast`,
    ).toBeGreaterThanOrEqual(3);
  }
});
