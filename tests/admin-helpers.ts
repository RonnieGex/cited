import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeSharedStores } from "@/lib/store/instance";

export const ADMIN_PASSWORD = "una-clave-de-prueba-que-nadie-adivina";
export const ADMIN_SECRET = "un-secreto-de-sesion-de-prueba";

const managed = [
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_SECRET",
  "ADMIN_COOKIE_SECURE",
  "DATABASE_URL",
  "TURSO_DATABASE_URL",
  "EMBEDDINGS_PROVIDER",
  "EMBEDDINGS_BASE_URL",
  "EMBEDDINGS_MODEL",
  "EMBEDDINGS_API_KEY",
  "EMBEDDINGS_DIMENSIONS",
  "CHAT_PROVIDER",
  "CHAT_MODEL",
  "TRUST_PROXY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "VOICE_TOOL_SECRET",
  "ELEVENLABS_API_KEY",
  "ENCRYPTION_KEY",
  "AFFILIATE_LINKS",
  "HOSTED_OFFER_URL",
  "PROVIDER_TEST_TIMEOUT_MS",
  "OPENAI_BASE_URL",
  "ANTHROPIC_BASE_URL",
  "GEMINI_BASE_URL",
  "DEEPSEEK_BASE_URL",
  "GROQ_BASE_URL",
  "OPENROUTER_BASE_URL",
  "OLLAMA_BASE_URL",
  "LMSTUDIO_BASE_URL",
];

const roots: string[] = [];
const preserved = new Map<string, string | undefined>();

export function setEnvironment(overrides: Record<string, string | undefined>): void {
  for (const name of managed) {
    if (preserved.has(name) === false) {
      preserved.set(name, process.env[name]);
    }
  }

  for (const name of managed) {
    delete process.env[name];
  }

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}

export async function environmentOf(
  overrides: Record<string, string | undefined> = {},
): Promise<Record<string, string | undefined>> {
  const root = mkdtempSync(join(tmpdir(), "katalis-admin-"));
  const path = join(root, "store.sqlite");

  roots.push(root);
  setEnvironment({ DATABASE_URL: path, ...overrides });

  return { ...process.env, ...overrides, DATABASE_URL: path };
}

export function configured(): Record<string, string | undefined> {
  return { ADMIN_PASSWORD, ADMIN_SESSION_SECRET: ADMIN_SECRET };
}

export async function cleanup(): Promise<void> {
  await closeSharedStores();

  for (const [name, value] of preserved) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }

  for (const root of roots) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        break;
      } catch {
        await new Promise((wake) => setTimeout(wake, 200));
      }
    }
  }
}

const pngHead = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function pngBytes(payload = 32): Uint8Array {
  return Uint8Array.from([...pngHead, ...new Array<number>(payload).fill(7)]);
}

export function jpegBytes(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
}

export function webpBytes(): Uint8Array {
  const head = [..."RIFF"].map((letter) => letter.charCodeAt(0));
  const mark = [..."WEBP"].map((letter) => letter.charCodeAt(0));

  return Uint8Array.from([...head, 0x24, 0x00, 0x00, 0x00, ...mark, 0x56, 0x50, 0x38, 0x20]);
}

export function svgBytes(): Uint8Array {
  return new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8"/></svg>',
  );
}

export function renamedTextBytes(): Uint8Array {
  return new TextEncoder().encode("This is a text file that claims to be a PNG image.\n");
}

export function uploadForm(name: string, bytes: Uint8Array, type: string): FormData {
  const form = new FormData();

  form.set("logo", new File([new Uint8Array(bytes)], name, { type }));

  return form;
}

export function documentForm(name: string, text: string): FormData {
  const form = new FormData();

  form.set("document", new File([text], name, { type: "text/markdown" }));

  return form;
}

export function jsonRequest(
  url: string,
  body: unknown,
  method = "POST",
  headers: Record<string, string> = {},
): Request {
  return new Request(url, {
    method,
    headers: {
      "content-type": "application/json",
      origin: new URL(url).origin,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export function adminRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: BodyInit } = {},
): Request {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { ...options.headers };

  if (method !== "GET" && method !== "HEAD") {
    headers["origin"] = headers["origin"] ?? new URL(url).origin;
  }

  if (options.body !== undefined && headers["content-type"] === undefined) {
    headers["content-type"] = "application/json";
  }

  return new Request(url, { method, headers, body: options.body });
}

export function sessionHeader(token: string): Record<string, string> {
  return { cookie: `cited_admin=${token}` };
}
