import { pathToFileURL } from "node:url";
import { createClient, type Client } from "@libsql/client";
import type {
  DocumentInput,
  KeywordMatch,
  PassageFilter,
  PassageInput,
  StoredDocument,
  StoredPassage,
  VectorMatch,
} from "./types.ts";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    sha256 TEXT NOT NULL,
    type TEXT NOT NULL,
    pages INTEGER,
    ingested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS passages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    heading TEXT,
    text TEXT NOT NULL,
    embedding F32_BLOB NOT NULL,
    UNIQUE (document_id, position)
  )`,
  `CREATE INDEX IF NOT EXISTS passages_document ON passages (document_id)`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS passages_fts USING fts5(text)`,
];

const searchableToken = /[\p{L}\p{N}]+/gu;

type Row = Record<string, unknown>;

function connectionUrl(path: string): string {
  if (/^(file|libsql|https?|wss?|ws):/.test(path)) {
    return path;
  }

  return pathToFileURL(path).href;
}

export function tokenize(question: string): string[] {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tokens = normalized.match(searchableToken) ?? [];

  return [...new Set(tokens)];
}

function matchExpression(question: string): string {
  return tokenize(question)
    .map((token) => `"${token}"`)
    .join(" OR ");
}

function toDocument(row: Row): StoredDocument {
  return {
    id: Number(row["id"]),
    name: String(row["name"]),
    sha256: String(row["sha256"]),
    type: String(row["type"]),
    pages: row["pages"] === null || row["pages"] === undefined ? null : Number(row["pages"]),
    ingestedAt: String(row["ingested_at"]),
  };
}

function toPassage(row: Row): StoredPassage {
  return {
    id: Number(row["id"]),
    name: String(row["name"]),
    position: Number(row["position"]),
    heading: row["heading"] === null || row["heading"] === undefined ? null : String(row["heading"]),
    text: String(row["text"]),
  };
}

export type Store = {
  readonly path: string;
  replaceDocument(document: DocumentInput, passages: PassageInput[]): Promise<void>;
  deleteDocument(name: string): Promise<void>;
  findDocument(name: string): Promise<StoredDocument | null>;
  listDocuments(): Promise<StoredDocument[]>;
  countDocuments(): Promise<number>;
  getPassages(filter?: PassageFilter): Promise<StoredPassage[]>;
  getPassagesByIds(ids: number[]): Promise<Map<number, StoredPassage>>;
  countPassages(filter?: PassageFilter): Promise<number>;
  countIndexed(): Promise<number>;
  keywordSearch(question: string, limit: number, documentName?: string): Promise<KeywordMatch[]>;
  vectorSearch(embedding: number[], limit: number, documentName?: string): Promise<VectorMatch[]>;
  close(): void;
};

export async function openStore(path: string): Promise<Store> {
  const client: Client = createClient({ url: connectionUrl(path) });

  for (const statement of schemaStatements) {
    await client.execute(statement);
  }

  const removeDocument = async (
    transaction: Awaited<ReturnType<Client["transaction"]>>,
    name: string,
  ): Promise<void> => {
    const existing = await transaction.execute({
      sql: "SELECT id FROM documents WHERE name = ?",
      args: [name],
    });
    const previous = existing.rows[0]?.["id"];

    if (previous === undefined) {
      return;
    }

    const ids = await transaction.execute({
      sql: "SELECT id FROM passages WHERE document_id = ?",
      args: [Number(previous)],
    });

    for (const row of ids.rows) {
      await transaction.execute({
        sql: "DELETE FROM passages_fts WHERE rowid = ?",
        args: [Number(row["id"])],
      });
    }

    await transaction.execute({
      sql: "DELETE FROM passages WHERE document_id = ?",
      args: [Number(previous)],
    });
    await transaction.execute({
      sql: "DELETE FROM documents WHERE id = ?",
      args: [Number(previous)],
    });
  };

  return {
    path,

    async replaceDocument(document: DocumentInput, passages: PassageInput[]): Promise<void> {
      const transaction = await client.transaction();

      try {
        await removeDocument(transaction, document.name);

        const inserted = await transaction.execute({
          sql: "INSERT INTO documents (name, sha256, type, pages) VALUES (?, ?, ?, ?)",
          args: [document.name, document.sha256, document.type, document.pages],
        });
        const documentId = Number(inserted.lastInsertRowid);

        for (const passage of passages) {
          const stored = await transaction.execute({
            sql: "INSERT INTO passages (document_id, position, heading, text, embedding) VALUES (?, ?, ?, ?, vector(?))",
            args: [
              documentId,
              passage.position,
              passage.heading,
              passage.text,
              new Uint8Array(Float32Array.from(passage.embedding).buffer),
            ],
          });

          await transaction.execute({
            sql: "INSERT INTO passages_fts (rowid, text) VALUES (?, ?)",
            args: [Number(stored.lastInsertRowid), passage.text],
          });
        }

        await transaction.commit();
      } catch (error) {
        await transaction.rollback();

        throw error;
      }
    },

    async deleteDocument(name: string): Promise<void> {
      const transaction = await client.transaction();

      try {
        await removeDocument(transaction, name);
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();

        throw error;
      }
    },

    async findDocument(name: string): Promise<StoredDocument | null> {
      const found = await client.execute({
        sql: "SELECT id, name, sha256, type, pages, ingested_at FROM documents WHERE name = ?",
        args: [name],
      });
      const row = found.rows[0];

      return row === undefined ? null : toDocument(row as Row);
    },

    async listDocuments(): Promise<StoredDocument[]> {
      const found = await client.execute(
        "SELECT id, name, sha256, type, pages, ingested_at FROM documents ORDER BY name",
      );

      return found.rows.map((row) => toDocument(row as Row));
    },

    async countDocuments(): Promise<number> {
      const found = await client.execute("SELECT count(*) AS total FROM documents");

      return Number(found.rows[0]?.["total"] ?? 0);
    },

    async getPassages(filter: PassageFilter = {}): Promise<StoredPassage[]> {
      const limit = filter.limit ?? 100;
      const found =
        filter.name === undefined
          ? await client.execute({
              sql: "SELECT p.id AS id, d.name AS name, p.position AS position, p.heading AS heading, p.text AS text FROM passages AS p JOIN documents AS d ON d.id = p.document_id ORDER BY d.name, p.position LIMIT ?",
              args: [limit],
            })
          : await client.execute({
              sql: "SELECT p.id AS id, d.name AS name, p.position AS position, p.heading AS heading, p.text AS text FROM passages AS p JOIN documents AS d ON d.id = p.document_id WHERE d.name = ? ORDER BY p.position LIMIT ?",
              args: [filter.name, limit],
            });

      return found.rows.map((row) => toPassage(row as Row));
    },

    async getPassagesByIds(ids: number[]): Promise<Map<number, StoredPassage>> {
      const found = new Map<number, StoredPassage>();

      if (ids.length === 0) {
        return found;
      }

      const placeholders = ids.map(() => "?").join(", ");
      const answer = await client.execute({
        sql: `SELECT p.id AS id, d.name AS name, p.position AS position, p.heading AS heading, p.text AS text FROM passages AS p JOIN documents AS d ON d.id = p.document_id WHERE p.id IN (${placeholders})`,
        args: ids,
      });

      for (const row of answer.rows) {
        const passage = toPassage(row as Row);

        found.set(passage.id, passage);
      }

      return found;
    },

    async countPassages(filter: PassageFilter = {}): Promise<number> {
      const found =
        filter.name === undefined
          ? await client.execute("SELECT count(*) AS total FROM passages")
          : await client.execute({
              sql: "SELECT count(*) AS total FROM passages AS p JOIN documents AS d ON d.id = p.document_id WHERE d.name = ?",
              args: [filter.name],
            });

      return Number(found.rows[0]?.["total"] ?? 0);
    },

    async countIndexed(): Promise<number> {
      const found = await client.execute("SELECT count(*) AS total FROM passages_fts");

      return Number(found.rows[0]?.["total"] ?? 0);
    },

    async keywordSearch(
      question: string,
      limit: number,
      documentName?: string,
    ): Promise<KeywordMatch[]> {
      const expression = matchExpression(question);

      if (expression.length === 0) {
        return [];
      }

      const found =
        documentName === undefined
          ? await client.execute({
              sql: "SELECT f.rowid AS id, bm25(passages_fts) AS score FROM passages_fts AS f WHERE passages_fts MATCH ? ORDER BY score LIMIT ?",
              args: [expression, limit],
            })
          : await client.execute({
              sql: "SELECT f.rowid AS id, bm25(passages_fts) AS score FROM passages_fts AS f JOIN passages AS p ON p.id = f.rowid JOIN documents AS d ON d.id = p.document_id WHERE passages_fts MATCH ? AND d.name = ? ORDER BY score LIMIT ?",
              args: [expression, documentName, limit],
            });

      return found.rows.map((row, index) => ({
        passageId: Number(row["id"]),
        rank: index + 1,
        score: Number(row["score"]),
      }));
    },

    async vectorSearch(
      embedding: number[],
      limit: number,
      documentName?: string,
    ): Promise<VectorMatch[]> {
      const vector = new Uint8Array(Float32Array.from(embedding).buffer);
      const found =
        documentName === undefined
          ? await client.execute({
              sql: "SELECT id, vector_distance_cos(embedding, vector(?)) AS distance FROM passages ORDER BY distance LIMIT ?",
              args: [vector, limit],
            })
          : await client.execute({
              sql: "SELECT p.id AS id, vector_distance_cos(p.embedding, vector(?)) AS distance FROM passages AS p JOIN documents AS d ON d.id = p.document_id WHERE d.name = ? ORDER BY distance LIMIT ?",
              args: [vector, documentName, limit],
            });

      return found.rows.map((row, index) => ({
        passageId: Number(row["id"]),
        rank: index + 1,
        distance: Number(row["distance"]),
      }));
    },

    close(): void {
      client.close();
    },
  };
}
