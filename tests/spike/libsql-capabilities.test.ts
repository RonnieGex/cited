import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient, type Client } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const oneMegabyte = 1024 * 1024;
const memoryCeiling = 512 * oneMegabyte;
const root = mkdtempSync(join(tmpdir(), "katalis-libsql-spike-"));
const databasePath = join(root, "spike.sqlite");
const databaseUrl = pathToFileURL(databasePath).href;
const client: Client = createClient({ url: databaseUrl });

const vector = (values: number[]): Uint8Array =>
  new Uint8Array(Float32Array.from(values).buffer);

const neighbors = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const stranger = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
const query = [0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81];

type KeyRow = { id: number };
type RankedRow = { id: number; dist: number; text: string };
type Bm25Row = { id: number; score: number };

beforeAll(async () => {
  await client.execute("PRAGMA foreign_keys = ON");
});

afterAll(async () => {
  client.close();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });

      return;
    } catch {
      await new Promise((wake) => setTimeout(wake, 200));
    }
  }
});

describe("libSQL native vectors", () => {
  it("creates a table with an F32_BLOB(8) column", async () => {
    const created = await client.execute(
      "CREATE TABLE IF NOT EXISTS passages (id INTEGER PRIMARY KEY, text TEXT NOT NULL, embedding F32_BLOB(8) NOT NULL)",
    );

    expect(created.rowsAffected).toBe(0);

    const columns = await client.execute("SELECT name, type FROM pragma_table_info('passages')");

    expect(columns.rows.map((row) => `${String(row.name)}:${String(row.type)}`)).toEqual([
      "id:INTEGER",
      "text:TEXT",
      "embedding:F32_BLOB(8)",
    ]);
  });

  it("inserts vectors through the Node client", async () => {
    const inserted = await client.execute({
      sql: "INSERT INTO passages (id, text, embedding) VALUES (?, ?, vector(?))",
      args: [1, "the workshop opens at nine", vector(neighbors)],
    });

    expect(inserted.rowsAffected).toBe(1);

    const stored = await client.execute({
      sql: "SELECT id, vector_extract(embedding) AS text FROM passages WHERE id = ?",
      args: [1],
    });

    const raw = String(stored.rows[0]?.text ?? "");
    const values = raw
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((value) => Number(value));

    expect(values).toHaveLength(8);
    expect(values[0]).toBeCloseTo(0.1, 5);
    expect(values[7]).toBeCloseTo(0.8, 5);
  });

  it("creates a vector index on the column", async () => {
    const created = await client.execute(
      "CREATE INDEX IF NOT EXISTS passages_embedding ON passages (libsql_vector_idx(embedding))",
    );

    const indexes = await client.execute("SELECT name FROM sqlite_master WHERE type = 'index'");
    const names = indexes.rows.map((row) => String(row.name));

    expect(Number(created.rowsAffected)).toBeGreaterThanOrEqual(0);
    expect(names).toContain("passages_embedding");
  });

  it("runs vector_top_k over the index and returns the nearest keys", async () => {
    await client.execute({
      sql: "INSERT INTO passages (id, text, embedding) VALUES (?, ?, vector(?))",
      args: [2, "the workshop closes at six", vector(stranger)],
    });

    const found = await client.execute({
      sql: "SELECT id FROM vector_top_k('passages_embedding', vector(?), 2)",
      args: [vector(query)],
    });

    const keys = found.rows as unknown as KeyRow[];

    expect(keys.map((row) => Number(row.id))).toEqual([1, 2]);
  });

  it("joins vector_top_k with the table and measures the distance", async () => {
    const found = await client.execute({
      sql: "SELECT p.id, p.text, vector_distance_cos(p.embedding, vector(?)) AS dist FROM vector_top_k('passages_embedding', vector(?), 2) AS k JOIN passages AS p ON p.id = k.id ORDER BY dist",
      args: [vector(query), vector(query)],
    });

    const rows = found.rows as unknown as RankedRow[];

    expect(rows).toHaveLength(2);
    expect(Number(rows[0]?.id)).toBe(1);
    expect(rows[0]?.text).toBe("the workshop opens at nine");
    expect(Number(rows[0]?.dist)).toBeLessThan(Number(rows[1]?.dist));
  });

  it("orders by vector_distance_cos without the index", async () => {
    const found = await client.execute({
      sql: "SELECT id, text, vector_distance_cos(embedding, vector(?)) AS dist FROM passages ORDER BY dist LIMIT 2",
      args: [vector(query)],
    });

    const rows = found.rows as unknown as RankedRow[];

    expect(rows).toHaveLength(2);
    expect(Number(rows[0]?.id)).toBe(1);
    expect(Number(rows[1]?.dist)).toBeGreaterThan(Number(rows[0]?.dist));
  });
});

describe("libSQL full-text search", () => {
  it("creates an FTS5 virtual table and answers a MATCH query", async () => {
    await client.execute("CREATE VIRTUAL TABLE IF NOT EXISTS passages_fts USING fts5(text)");

    await client.execute("INSERT INTO passages_fts (rowid, text) VALUES (1, ?)", [
      "the workshop opens at nine",
    ]);

    await client.execute(
      "INSERT INTO passages_fts (rowid, text) SELECT id, text FROM passages WHERE id = 2",
    );

    const matched = await client.execute(
      "SELECT rowid AS id, text FROM passages_fts WHERE passages_fts MATCH ?",
      ["workshop"],
    );

    expect(matched.rows.length).toBe(2);
    expect(matched.rows.map((row) => String(row.text))).toContain("the workshop opens at nine");
  });

  it("reports a bm25 rank for the MATCH query", async () => {
    await client.execute({
      sql: "INSERT INTO passages (id, text, embedding) VALUES (?, ?, vector(?))",
      args: [3, "the workshop workshop workshop opens at nine", vector(neighbors)],
    });

    await client.execute("INSERT INTO passages_fts (rowid, text) VALUES (3, ?)", [
      "the workshop workshop workshop opens at nine",
    ]);

    const matched = await client.execute(
      "SELECT rowid AS id, bm25(passages_fts) AS score FROM passages_fts WHERE passages_fts MATCH ? ORDER BY score",
      ["workshop"],
    );

    const rows = matched.rows as unknown as Bm25Row[];

    expect(rows.length).toBe(3);
    expect(Number(rows[0]?.id)).toBe(3);
    expect(Number(rows[0]?.score)).toBeLessThan(Number(rows[1]?.score));
  });
});

describe("the spike environment", () => {
  it("reports the versions that decided the result", async () => {
    const version = await client.execute("SELECT sqlite_version() AS version");
    const fts5 = await client.execute("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled");

    expect(String(version.rows[0]?.version ?? "")).toMatch(/^3\./);
    expect(Number(fts5.rows[0]?.enabled)).toBe(1);
    expect(process.version).toMatch(/^v24\./);
    expect(process.memoryUsage().rss).toBeGreaterThan(oneMegabyte);
    expect(process.memoryUsage().rss).toBeLessThan(memoryCeiling);
  });
});
