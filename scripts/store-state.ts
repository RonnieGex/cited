/**
 * The state of a store: every table of the schema and the row count of each one, sorted by name. It is the evidence the
 * standard asks for before and after a change: point it at a fresh path to see the schema this code creates, and at the
 * path of a run to see what the run left behind.
 *
 * Usage:
 *   node scripts/store-state.ts <database-path> [path-to-store-module]
 *
 * The second argument reads the schema of another revision without checking it out. With the store of `21ad3b9`, the
 * base of the change `elevenlabs-voice-agent`, it shows the tables the change found and the two it adds:
 *   git show 21ad3b9:lib/store/index.ts > <temp>/base-store.ts
 *   node scripts/store-state.ts <temp>/before.sqlite <temp>/base-store.ts
 */

import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

type Store = { close: () => void };

const [database, storeModule] = process.argv.slice(2);

if (database === undefined) {
  console.error("Usage: node scripts/store-state.ts <database-path> [path-to-store-module]");
  process.exit(2);
}

const target = isAbsolute(storeModule ?? "")
  ? (storeModule as string)
  : resolve(import.meta.dirname, storeModule ?? "../lib/store/index.ts");
const { openStore } = (await import(pathToFileURL(target).href)) as {
  openStore: (path: string) => Promise<Store>;
};

const store = await openStore(database);

store.close();

const client = createClient({ url: pathToFileURL(resolve(database)).href });
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
);

console.log(`database: ${resolve(database)}`);
console.log(`tables: ${tables.rows.length}`);

for (const row of tables.rows) {
  const name = String(row["name"]);
  const counted = await client.execute(`SELECT count(*) AS rows FROM "${name}"`);

  console.log(`  ${name}: ${Number(counted.rows[0]?.["rows"] ?? 0)} rows`);
}

client.close();
