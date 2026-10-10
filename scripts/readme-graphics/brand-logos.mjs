import { readFileSync } from "node:fs";

const directory = new URL("../../docs/brand/logos/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("sources.json", directory), "utf8"));
const assets = new Map();
let sequence = 0;
const names = {
  "DeepSeek Harness": "deepseek", DeepSeek: "deepseek", "Claude Code": "claude", Codex: "codex", Cursor: "cursor",
  ElevenLabs: "elevenlabs", OpenAI: "openai", Anthropic: "anthropic", Gemini: "googlegemini", Groq: "groq",
  OpenRouter: "openrouter", Ollama: "ollama", "LM Studio": "lmstudio", "LM\u00a0Studio": "lmstudio", GitHub: "github",
  "Node.js": "nodedotjs", Node: "nodedotjs", npm: "npm", "Next.js": "nextdotjs", SQLite: "sqlite", libSQL: "libsql", Turso: "turso", Docker: "docker",
};
const pattern = new RegExp(`(?<![\\w])(${Object.keys(names).sort((a, b) => b.length - a.length).map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w])`, "g");

export function logo(name) {
  if (!manifest[name]) throw new Error(`Unknown brand ${name}`);
  if (!assets.has(name)) assets.set(name, readFileSync(new URL(manifest[name].file, directory), "utf8"));
  const source = assets.get(name);
  const opening = source.match(/<svg\b([^>]*)>/);
  if (!opening || !/viewBox="[^"]+"/.test(opening[1])) throw new Error(`Missing SVG viewBox: ${name}`);
  const attributes = opening[1].replace(/\s(?:role|width|height|style|aria-hidden|focusable|class)="[^"]*"/g, "");
  let rendered = source.replace(opening[0], `<svg${attributes} class="brand-logo" data-brand="${name}" aria-hidden="true" focusable="false">`).replace(/<title>[\s\S]*?<\/title>/g, "");
  if (name === "libsql") rendered = rendered.replace('fill="#2C5FC3"', 'fill="currentColor"').replace('fill="white"', 'fill="var(--brand-background, #FAFAF9)"');
  else if (name === "groq") rendered = rendered.replace('fill="#F43E01"', 'fill="currentColor"').replace(/fill="#fff"/g, 'fill="var(--brand-background, #FAFAF9)"');
  else {
    rendered = rendered.replace(/\bfill="(?!none|currentColor)[^"]+"/g, 'fill="currentColor"');
    if (!/\bfill=/.test(rendered.match(/<svg[^>]*>/)[0])) rendered = rendered.replace('<svg', '<svg fill="currentColor"');
  }
  const prefix = `brand-${name}-${++sequence}-`;
  rendered = rendered.replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`).replace(/((?:xlink:)?href=")#([^"]+)/g, (_, start, id) => `${start}#${prefix}${id}`);
  return rendered.trim();
}

export function brandText(html) {
  const blocked = [];
  return html.split(/(<[^>]+>)/g).map((part) => {
    if (part.startsWith("<")) {
      const tag = part.match(/^<\/?([\w-]+)/)?.[1]?.toLowerCase();
      if (["code", "pre", "script", "style", "svg"].includes(tag)) {
        if (part.startsWith("</")) blocked.pop(); else if (!part.endsWith("/>")) blocked.push(tag);
      }
      return part;
    }
    if (blocked.length) return part;
    return part.replace(pattern, (label) => manifest[names[label]] ? `<span class="brand-name">${logo(names[label])}<span>${label}</span></span>` : label);
  }).join("");
}
