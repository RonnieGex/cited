import { DatabaseSync } from "node:sqlite";
import { openStore, storeTables } from "../lib/store/index.ts";
import { prepareStorePath, storeLocation } from "../lib/store/path.ts";

// The state of the store, read without opening the application: the tables the schema declares, how many rows each one
// holds and which of them the change of the keys in the panel added. It is the tool of task 10.6 of the contract and
// of the Major M-5 of `katalis-dev/tasks/revision-community-12.md`, which found that the reports of the change
// recorded the state of Git and never the state of the database: one does not prove the other.
//
//     node scripts/store-state.ts                     (the store of DATABASE_URL, or the default of the repository)
//     node scripts/store-state.ts .data/otra.sqlite   (a store of its own)
//
// It writes nothing: `openStore()` creates the tables that are missing — which is what the application does on its
// first query — and the reader opens the file in read-only mode afterwards.

// The tables of `lib/store/index.ts`, in the order of the schema, with the ones this change added marked.
const ADDED_BY_THE_CHANGE = ["provider_settings", "provider_tests", "document_index"];

// The five tables FTS5 keeps for the index of `passages_fts`, which are not read one by one.
const SHADOW = /^passages_fts_/;

async function main(): Promise<void> {
  const declared = process.argv[2]?.trim();
  const path = declared === undefined || declared.length === 0 ? storeLocation(process.env) : declared;
  const store = await openStore(prepareStorePath(path));

  store.close();

  const database = new DatabaseSync(path, { readOnly: true });
  const found = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as Array<{ name: string }>;
  const names = found.map((one) => one.name);
  const own = names.filter((name) => SHADOW.test(name) === false);
  const counts: Record<string, number> = {};

  for (const name of own) {
    // `sqlite_sequence` belongs to SQLite, not to the schema: it is read like the rest and marked below.
    const row = database.prepare(`SELECT count(*) AS total FROM "${name}"`).get() as { total: number };

    counts[name] = Number(row.total);
  }

  database.close();

  console.log(`store: ${path}`);
  console.log(`tables: ${own.length} (plus the ${names.length - own.length} of the full-text index)`);

  for (const name of storeTables) {
    const mark = ADDED_BY_THE_CHANGE.includes(name) ? " (added by this change)" : "";

    console.log(`  ${name} rows=${counts[name] ?? 0}${mark}`);
  }

  for (const name of own) {
    if (storeTables.includes(name) === false && name !== "sqlite_sequence") {
      console.log(`  ${name} rows=${counts[name] ?? 0} (not declared by the schema)`);
    }
  }

  for (const name of storeTables) {
    if (own.includes(name) === false) {
      console.log(`  ${name} MISSING`);
    }
  }

  const total = ADDED_BY_THE_CHANGE.reduce((sum, name) => sum + (counts[name] ?? 0), 0);

  console.log(`rows of the tables this change added: ${total}`);
}

await main();
