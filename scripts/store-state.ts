import { existsSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { storeTables } from "../lib/store/tables.ts";
import { storeLocation } from "../lib/store/path.ts";

// The state of the store, read without opening the application: the tables the schema declares, how many rows each one
// holds and which of them the change of the keys in the panel added. It is the tool of task 10.6 of the contract and
// of the Major M-5 of `katalis-dev/tasks/revision-community-12.md`, which found that the reports of the change
// recorded the state of Git and never the state of the database: one does not prove the other.
//
//     node scripts/store-state.ts                     (the store of DATABASE_URL, or the default of the repository)
//     node scripts/store-state.ts .data/otra.sqlite   (a store of its own)
//
// It writes nothing and it reads with `node:sqlite` and `readOnly: true`. The first version called `openStore()`
// first, and `openStore()` creates every table the schema declares: a store that did not exist came out of the command
// existing and migrated, so the "before" it printed was the state after the current code. The Major M-4 of
// `katalis-dev/tasks/revision-community-12b.md` reproduced exactly that, and it is why this file imports a list of
// names that loads no client (`lib/store/tables.ts`) and never the application.
//
// A store that is not there is not a state of the store: it is a failure of the command. The Major M-2 of
// `katalis-dev/tasks/revision-community-12c.md` reproduced that the reader printed `exists: false` and finished with
// code 0, so a script could take the absence of the base for a successful reading. It now writes
// `store not found: <path>` to stderr and exits with code 2, creating neither the file nor its folder.

// The tables of `lib/store/index.ts`, in the order of the schema, with the ones this change added marked.
const ADDED_BY_THE_CHANGE = ["provider_settings", "provider_tests", "document_index"];

// The five tables FTS5 keeps for the index of `passages_fts`, which are not read one by one.
const SHADOW = /^passages_fts_/;

// A remote store lives in libSQL or in Turso: this reader opens a file and nothing else, and it says so instead of
// creating anything.
const REMOTE = /^(libsql|https?|wss?|ws):/;

function missing(path: string): never {
  console.error(`store not found: ${path}`);

  process.exit(2);
}

function main(): void {
  const declared = process.argv[2]?.trim();
  const asked = declared === undefined || declared.length === 0 ? storeLocation(process.env) : declared;

  if (REMOTE.test(asked)) {
    console.error(`store: ${asked}`);
    console.error("this reader opens a file of SQLite; a remote store is read with its own tools");

    process.exit(1);
  }

  // The path is resolved and never prepared: `prepareStorePath()` creates the folder that holds the store, and a
  // reader of the state does not create anything, not even a folder.
  const path = isAbsolute(asked) ? asked : resolve(asked);

  if (existsSync(path) === false) {
    missing(path);
  }

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
  console.log("exists: true");
  console.log(`bytes: ${statSync(path).size}`);
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

main();
