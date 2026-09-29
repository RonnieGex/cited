import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import {
  EMBED_PATH,
  MAX_WIDGET_BYTES,
  WIDGET_BANNER,
  WIDGET_PATH,
  widgetSource,
} from "@/lib/widget/script";

// Design decision 4 of `openspec/changes/public-page-and-widget/design.md`: `lib/widget/` builds a dependency-free
// `public/widget.js`, under 5 KB, that adds a button and an iframe of `/embed` from the script's own origin; the
// button carries an accessible name and `Escape` closes the chat.

const repositoryRoot = resolve(import.meta.dirname, "..");
const builtWidget = resolve(repositoryRoot, "public/widget.js");

/** Runs the built script the way a browser runs it: a classic script in a page that loaded it from its origin. */
function load(origin: string, lang = "en"): void {
  const tag = document.createElement("script");

  tag.src = `${origin}${WIDGET_PATH}`;
  document.head.append(tag);
  document.documentElement.lang = lang;
  new Function(widgetSource())();
}

afterEach(() => {
  // The listener of `Escape` lives on the document, so the widget of a test outlives the body that carried it: the
  // first thing is to close whatever is open, and only then to clean the document of the next test.
  fireEvent.keyDown(document, { key: "Escape" });
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  document.documentElement.lang = "en";
});

describe("the widget script", () => {
  it("is built from lib/widget and committed in public/", () => {
    expect(existsSync(builtWidget), "public/widget.js exists").toBe(true);
    expect(readFileSync(builtWidget, "utf8")).toBe(widgetSource());
    expect(widgetSource().startsWith(WIDGET_BANNER)).toBe(true);
  });

  it("weighs less than five kilobytes", () => {
    const size = statSync(builtWidget).size;

    console.log(`public/widget.js: ${size} bytes`);

    expect(size).toBeLessThanOrEqual(MAX_WIDGET_BYTES);
    expect(Buffer.byteLength(widgetSource(), "utf8")).toBeLessThanOrEqual(MAX_WIDGET_BYTES);
  });

  it("depends on nothing", () => {
    const source = widgetSource();

    expect(source).not.toContain("require(");
    expect(source).not.toMatch(/\bimport\s/);
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("https://");
    expect(source).not.toContain("http://");
  });

  it("adds one floating button with an accessible name", () => {
    load("https://shop.example");

    const button = screen.getByRole("button", { name: PUBLIC_STRINGS.en.widget.button });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("opens the chat of its own origin, and only once", () => {
    load("https://shop.example");
    new Function(widgetSource())();

    expect(screen.getAllByRole("button")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.en.widget.button }));

    const frame = document.querySelector("iframe");

    expect(frame).not.toBeNull();
    expect(frame?.getAttribute("src")).toBe(`https://shop.example${EMBED_PATH}`);
    expect(frame?.getAttribute("title")).toBe(PUBLIC_STRINGS.en.widget.title);
    expect(
      screen.getByRole("button", { name: PUBLIC_STRINGS.en.widget.button }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("closes with Escape and with the button", () => {
    load("https://shop.example");

    const button = screen.getByRole("button", { name: PUBLIC_STRINGS.en.widget.button });

    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.querySelector("iframe")).toBeNull();
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(document.querySelector("iframe")).toBeNull();
  });

  it("asks in the language of the page that carries it", () => {
    load("https://shop.example", "es-MX");

    expect(
      screen.getByRole("button", { name: PUBLIC_STRINGS.es.widget.button }),
    ).toBeInTheDocument();
  });

  it("takes the origin of its own script and not the page it lands on", () => {
    const tag = document.createElement("script");

    tag.src = "https://cited.example/widget.js";
    document.head.append(tag);
    new Function(widgetSource())();

    fireEvent.click(screen.getByRole("button", { name: PUBLIC_STRINGS.en.widget.button }));

    expect(document.querySelector("iframe")?.getAttribute("src")).toBe(
      `https://cited.example${EMBED_PATH}`,
    );
  });

  // The scenario "Escape inside the iframe" of the requirement "The brand color is seen and the widget closes from
  // inside": the key that reaches the document of `/embed` never reaches the document of the host page, so the embed
  // posts the close to its parent and the widget believes only a message from its own origin.
  it("closes when the embed asks it to, and only through its own protocol and origin", () => {
    const close = { source: "cited-embed", type: "close" };
    const message = (data: unknown, origin: string): MessageEvent =>
      new MessageEvent("message", { data, origin });

    load("https://shop.example");

    const button = screen.getByRole("button", { name: PUBLIC_STRINGS.en.widget.button });

    fireEvent.click(button);

    expect(document.querySelector("iframe"), "the widget is open").not.toBeNull();

    window.dispatchEvent(message(close, "https://evil.example"));

    expect(document.querySelector("iframe"), "another origin cannot close it").not.toBeNull();

    window.dispatchEvent(message({ source: "cited-embed", type: "open" }, "https://shop.example"));
    window.dispatchEvent(message({ source: "another-widget", type: "close" }, "https://shop.example"));

    expect(document.querySelector("iframe"), "another protocol cannot close it").not.toBeNull();

    window.dispatchEvent(message(close, "https://shop.example"));

    expect(document.querySelector("iframe"), "its own embed closes it").toBeNull();
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button, "the focus comes back to the button").toHaveFocus();
  });
});
