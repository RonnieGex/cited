import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

const root = await mkdtemp(join(tmpdir(), "katalis-libsql-probe-"));
const file = join(root, "probe.sqlite");
const client = createClient({ url: pathToFileURL(file).href });

const ask = async (sql, args = []) => {
  try {
    const answer = await client.execute({ sql, args });

    return { sql, rows: answer.rows.length, affected: answer.rowsAffected, result: answer.rows };
  } catch (error) {
    return { sql, error: error.message };
  }
};

const vector = (values) => Float32Array.from(values);
const neighbors = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
const stranger = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
const query = [0.11, 0.21, 0.31, 0.41, 0.51, 0.61, 0.71, 0.81];

const statements = [
  ["SELECT sqlite_version() AS version"],
  ["SELECT sqlite_compileoption_used('ENABLE_FTS5') AS fts5"],
  ["CREATE TABLE passages (id INTEGER PRIMARY KEY, text TEXT NOT NULL, embedding F32_BLOB(8) NOT NULL)"],
  ["SELECT name, type FROM pragma_table_info('passages')"],
  ["INSERT INTO passages (id, text, embedding) VALUES (?, ?, vector(?))", [1, "the workshop opens at nine", vector(neighbors)]],
  ["INSERT INTO passages (id, text, embedding) VALUES (?, ?, vector(?))", [2, "the workshop closes at six", vector(stranger)]],
  ["SELECT id, vector_extract(embedding) AS vector FROM passages WHERE id = ?", [1]],
  ["CREATE INDEX passages_embedding ON passages (libsql_vector_idx(embedding))"],
  ["SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'passages_embedding'"],
  ["SELECT id FROM vector_top_k('passages_embedding', vector(?), 2)", [vector(query)]],
  [
    "SELECT p.id, p.text, vector_distance_cos(p.embedding, vector(?)) AS distance FROM vector_top_k('passages_embedding', vector(?), 2) AS k JOIN passages AS p ON p.id = k.id ORDER BY distance",
    [vector(query), vector(query)],
  ],
  [
    "SELECT id, vector_distance_cos(embedding, vector(?)) AS distance FROM passages ORDER BY distance LIMIT 2",
    [vector(query)],
  ],
  ["CREATE VIRTUAL TABLE passages_fts USING fts5(text)"],
  ["INSERT INTO passages_fts (rowid, text) SELECT id, text FROM passages"],
  ["SELECT rowid AS id, text FROM passages_fts WHERE passages_fts MATCH ?", ["workshop"]],
  [
    "SELECT rowid AS id, bm25(passages_fts) AS score FROM passages_fts WHERE passages_fts MATCH ? ORDER BY score",
    ["workshop"],
  ],
];

console.log(`node ${process.version}`);
console.log(`sqlite ${(await client.execute("SELECT sqlite_version() AS v")).rows[0]?.v}`);
console.log(`platform ${process.platform} ${process.arch}`);
console.log("");

for (const [sql, args = []] of statements) {
  const answer = await ask(sql, args);

  console.log(`SQL> ${sql}`);
  console.log(answer.error === undefined ? `OK  rows=${answer.rows} affected=${answer.affected} ${JSON.stringify(answer.result)}` : `ERR ${answer.error}`);
  console.log("");
}

console.log(`rss_mb ${Math.round(process.memoryUsage().rss / 1024 / 1024)}`);

client.close();

try {
  await rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
} catch (error) {
  console.log(`cleanup ${error.message}`);
}
