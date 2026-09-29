// @vitest-environment node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";

// Task 11.4 of the contract and the Major M-4 of `katalis-dev/tasks/revision-community-12b.md`: the reader of the
// state of the store (`scripts/store-state.ts`, task 10.6) called `openStore()` before reading, and `openStore()`
// creates every table the schema declares. The "before" it printed was therefore the state *after* the current code
// had migrated the file, which is exactly what the evidence of 10.6 must not be.
//
// Task 12.2 of the contract and the Major M-2 of `katalis-dev/tasks/revision-community-12c.md`: a `store:state` over a
// file that does not exist printed `exists: false` and finished with code 0, so a command of evidence could support a
// box with a store that was not there. It has to fail clearly: code 2 and `store not found: <path>` on stderr,
// creating nothing.
//
// The reader has to open the file with `node:sqlite` and `readOnly: true`, never with the libSQL client, and it must
// not create a database that is not there. This file runs the real script in a child process — the command of the
// report — and reads the file afterwards, so a reader that migrates anything fails here.

const repositoryRoot = resolve(import.meta.dirname, "..");
const roots: string[] = [];

type Run = { status: number | null; stdout: string; stderr: string };

function reader(path: string): Run {
  const run = spawnSync(process.execPath, ["scripts/store-state.ts", path], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

function tablesOf(path: string): string[] {
  const database = new DatabaseSync(path, { readOnly: true });
  const found = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all() as Array<{ name: string }>;

  database.close();

  return found.map((row) => row.name);
}

function scratch(): string {
  const root = mkdtempSync(join(tmpdir(), "cited-state-"));

  roots.push(root);

  return root;
}

function hashOf(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

// Two tables of the version before this change, with the columns the schema declared then. Nothing else: a reader
// that opens the store with the application turns this into the eleven tables of today.
function storeOfTheVersionBefore(path: string): void {
  const database = new DatabaseSync(path);

  database.exec(
    `CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sha256 TEXT NOT NULL,
      type TEXT NOT NULL,
      pages INTEGER,
      ingested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
  );
  database.exec(
    `CREATE TABLE passages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      heading TEXT,
      text TEXT NOT NULL,
      embedding F32_BLOB NOT NULL,
      UNIQUE (document_id, position)
    )`,
  );
  database.exec("INSERT INTO documents (name, sha256, type, pages) VALUES ('cafe.md', 'abc', 'text/markdown', 1)");
  database.close();
}

afterAll(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

describe("the reader of the state of the store", () => {
  it("fails clearly on a store that is not there, creating nothing", () => {
    const path = join(scratch(), "no-existe.sqlite");
    const result = reader(path);

    expect(result.status, result.stderr).toBe(2);
    expect(result.stderr).toContain(`store not found: ${path}`);
    expect(existsSync(path)).toBe(false);
  });

  it("leaves the bytes of an existing store exactly as they were", () => {
    const path = join(scratch(), "store-intact.sqlite");

    storeOfTheVersionBefore(path);

    const before = hashOf(path);
    const result = reader(path);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("exists: true");
    expect(hashOf(path)).toBe(before);
  });

  it("leaves the tables of the version before exactly as they were", () => {
    const path = join(scratch(), "store-main.sqlite");

    storeOfTheVersionBefore(path);

    const before = tablesOf(path);
    const result = reader(path);

    expect(result.status, result.stderr).toBe(0);
    // The two tables written here and the `sqlite_sequence` that SQLite keeps for an AUTOINCREMENT column.
    expect(before).toEqual(["documents", "passages", "sqlite_sequence"]);
    expect(tablesOf(path)).toEqual(before);
    expect(result.stdout).toContain("provider_settings MISSING");
    expect(result.stdout).toContain("provider_tests MISSING");
    expect(result.stdout).toContain("document_index MISSING");
    expect(result.stdout).toContain("exists: true");
  });

  it("counts the rows of a store that has every table", () => {
    const path = join(scratch(), "store-of-today.sqlite");

    storeOfTheVersionBefore(path);

    const database = new DatabaseSync(path);

    for (const statement of [
      "CREATE TABLE provider_settings (kind TEXT PRIMARY KEY, provider TEXT NOT NULL)",
      "CREATE TABLE provider_tests (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL)",
      "CREATE TABLE document_index (document_id INTEGER PRIMARY KEY, signature TEXT NOT NULL)",
    ]) {
      database.exec(statement);
    }

    database.exec("INSERT INTO provider_settings (kind, provider) VALUES ('chat', 'ollama')");
    database.close();

    const result = reader(path);

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("provider_settings rows=1 (added by this change)");
    expect(result.stdout).toContain("provider_tests rows=0 (added by this change)");
    expect(result.stdout).toContain("document_index rows=0 (added by this change)");
    expect(result.stdout).toContain("rows of the tables this change added: 1");
  });
});
