import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

export const DEFAULT_STORE_PATH = ".data/katalis.sqlite";

export function storeLocation(environment: Record<string, string | undefined>): string {
  const remote = environment["TURSO_DATABASE_URL"]?.trim() ?? "";
  const local = environment["DATABASE_URL"]?.trim() ?? "";

  return remote.length > 0 ? remote : local.length > 0 ? local : DEFAULT_STORE_PATH;
}

export function prepareStorePath(storePath: string): string {
  if (/^file:|^libsql:|^https?:|^wss?:/.test(storePath)) {
    return storePath;
  }

  const absolute = isAbsolute(storePath) ? storePath : resolve(storePath);

  mkdirSync(dirname(absolute), { recursive: true });

  return absolute;
}
