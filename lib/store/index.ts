import { pathToFileURL } from "node:url";
import { createClient, type Client } from "@libsql/client";
import type {
  DocumentInput,
  KeywordMatch,
  PassageFilter,
  PassageInput,
  ProviderKind,
  ProviderSettingInput,
  StoreEnvironment,
  StoredDocument,
  StoredPassage,
  StoredProviderSetting,
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
  `CREATE TABLE IF NOT EXISTS rate_limits (
    ip_hash TEXT NOT NULL,
    window_start TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ip_hash, window_start)
  )`,
  `CREATE TABLE IF NOT EXISTS model_calls (
    day TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS voice_minutes (
    day TEXT PRIMARY KEY,
    minutes INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS voice_agent (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    agent_id TEXT NOT NULL DEFAULT '',
    secret_id TEXT NOT NULL DEFAULT '',
    tool_id TEXT NOT NULL DEFAULT '',
    sources_tool_id TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'en',
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS conversations (
    session_id TEXT NOT NULL,
    turn INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (session_id, turn)
  )`,
  `CREATE INDEX IF NOT EXISTS conversations_created ON conversations (created_at)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
    ip_hash TEXT NOT NULL,
    window_start TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ip_hash, window_start)
  )`,
  `CREATE TABLE IF NOT EXISTS business (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    logo_mime TEXT,
    logo_bytes BLOB,
    primary_color TEXT,
    tone TEXT NOT NULL DEFAULT '',
    language TEXT NOT NULL DEFAULT 'en',
    forbidden_topics TEXT NOT NULL DEFAULT '',
    welcome_en TEXT NOT NULL DEFAULT '',
    welcome_es TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS provider_settings (
    kind TEXT PRIMARY KEY CHECK (kind IN ('chat','embeddings')),
    provider TEXT NOT NULL,
    model TEXT,
    key_ciphertext TEXT,
    key_last4 TEXT,
    base_url TEXT,
    mode TEXT,
    tested_at TEXT,
    test_latency_ms INTEGER,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
  `CREATE TABLE IF NOT EXISTS provider_tests (
    window_start TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS document_index (
    document_id INTEGER PRIMARY KEY,
    signature TEXT NOT NULL,
    indexed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`,
];

const searchableToken = /[\p{L}\p{N}]+/gu;
const remoteProtocol = /^(libsql|https?|wss?|ws):/;

// The tables of the schema, for whoever reads the state of a store without opening the application
// (`scripts/store-state.ts`, task 10.6 of the contract of the keys in the panel). The list itself lives in
// `./tables.ts`, which imports nothing: a reader of the state must be able to know the names without loading the
// libSQL client of this module (task 11.4).
export { storeTables } from "./tables.ts";

type Row = Record<string, unknown>;

export type StoreOptions = {
  environment?: StoreEnvironment;
};

function connectionUrl(path: string): string {
  if (/^(file|libsql|https?|wss?|ws):/.test(path)) {
    return path;
  }

  return pathToFileURL(path).href;
}

function authTokenFor(url: string, environment: StoreEnvironment): string | undefined {
  if (!remoteProtocol.test(url)) {
    return undefined;
  }

  const token = environment["TURSO_AUTH_TOKEN"]?.trim() ?? "";

  if (token.length === 0) {
    throw new Error(
      "TURSO_AUTH_TOKEN is empty: a remote libSQL database needs its token. Fill it in the environment of the server; an empty value is an absent value.",
    );
  }

  return token;
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

function toProviderSetting(row: Row): StoredProviderSetting {
  const text = (value: unknown): string | null =>
    value === null || value === undefined ? null : String(value);

  return {
    kind: String(row["kind"]) === "embeddings" ? "embeddings" : "chat",
    provider: String(row["provider"]),
    model: text(row["model"]),
    keyCiphertext: text(row["key_ciphertext"]),
    keyLast4: text(row["key_last4"]),
    baseUrl: text(row["base_url"]),
    mode: text(row["mode"]),
    testedAt: text(row["tested_at"]),
    testLatencyMs:
      row["test_latency_ms"] === null || row["test_latency_ms"] === undefined
        ? null
        : Number(row["test_latency_ms"]),
    updatedAt: String(row["updated_at"]),
  };
}

export type StoredTurn = {
  sessionId: string;
  turn: number;
  question: string;
  answer: string;
  createdAt: string;
};

export type TurnInput = {
  sessionId: string;
  question: string;
  answer: string;
  createdAt?: string;
};

export type LoginAttempts = {
  windowStart: string;
  count: number;
};

export type StoredBusiness = {
  name: string;
  hasLogo: boolean;
  primaryColor: string | null;
  tone: string;
  language: string;
  forbiddenTopics: string;
  welcomeEn: string;
  welcomeEs: string;
  updatedAt: string;
};

export type BusinessRowInput = {
  name: string;
  primaryColor: string | null;
  tone: string;
  language: string;
  forbiddenTopics: string;
  welcomeEn: string;
  welcomeEs: string;
};

export type StoredLogo = {
  mime: string;
  bytes: Uint8Array;
};

export type StoredVoiceAgent = {
  agentId: string;
  secretId: string;
  toolId: string;
  sourcesToolId: string;
  language: string;
  updatedAt: string;
};

export type VoiceAgentRowInput = {
  agentId: string;
  secretId: string;
  toolId: string;
  sourcesToolId: string;
  language: string;
};

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
  recordQuestion(ipHash: string, windowStart: string): Promise<number>;
  questionsInWindow(ipHash: string, windowStart: string): Promise<number>;
  reserveModelCall(day: string, limit: number): Promise<number | null>;
  modelCallsOn(day: string): Promise<number>;
  reserveVoiceMinutes(day: string, minutes: number, limit: number): Promise<number | null>;
  voiceMinutesOn(day: string): Promise<number>;
  deleteVoiceMinutesBefore(day: string): Promise<number>;
  readVoiceAgent(): Promise<StoredVoiceAgent | null>;
  saveVoiceAgent(row: VoiceAgentRowInput): Promise<void>;
  appendTurn(turn: TurnInput): Promise<number>;
  turnsOf(sessionId: string, limit: number): Promise<StoredTurn[]>;
  deleteConversationsBefore(iso: string): Promise<number>;
  deleteRateLimitsBefore(iso: string): Promise<number>;
  deleteModelCallsBefore(day: string): Promise<number>;
  recordLoginFailure(ipHash: string, windowStart: string): Promise<number>;
  loginAttempts(ipHash: string, sinceIso: string): Promise<LoginAttempts | null>;
  clearLoginFailures(ipHash: string): Promise<void>;
  deleteLoginAttemptsBefore(iso: string): Promise<number>;
  readBusiness(): Promise<StoredBusiness | null>;
  saveBusiness(row: BusinessRowInput): Promise<void>;
  saveBusinessLogo(mime: string, bytes: Uint8Array): Promise<void>;
  readBusinessLogo(): Promise<StoredLogo | null>;
  readProviderSetting(kind: ProviderKind): Promise<StoredProviderSetting | null>;
  saveProviderSetting(row: ProviderSettingInput): Promise<void>;
  deleteProviderSetting(kind: ProviderKind): Promise<number>;
  reserveProviderTest(windowStart: string): Promise<number>;
  saveIndexSignature(documentName: string, signature: string): Promise<void>;
  countPassagesNeedingIndex(signature: string): Promise<number>;
  listDocumentsNeedingIndex(signature: string): Promise<StoredDocument[]>;
  countVectorized(): Promise<number>;
  listRecentTurns(limit: number): Promise<StoredTurn[]>;
  countTurns(): Promise<number>;
  deleteAllTurns(): Promise<number>;
  close(): void;
};

export async function openStore(path: string, options: StoreOptions = {}): Promise<Store> {
  const url = connectionUrl(path);
  const authToken = authTokenFor(url, options.environment ?? process.env);
  const client: Client =
    authToken === undefined ? createClient({ url }) : createClient({ url, authToken });

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
      sql: "DELETE FROM document_index WHERE document_id = ?",
      args: [Number(previous)],
    });
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
          // Keyword mode stores no vector: the row keeps an empty blob and the search ranks with FTS5 alone. The
          // `vector()` conversion needs bytes, so an empty embedding is written without it.
          const stored =
            passage.embedding.length === 0
              ? await transaction.execute({
                  sql: "INSERT INTO passages (document_id, position, heading, text, embedding) VALUES (?, ?, ?, ?, x'')",
                  args: [documentId, passage.position, passage.heading, passage.text],
                })
              : await transaction.execute({
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

    async recordQuestion(ipHash: string, windowStart: string): Promise<number> {
      const counted = await client.execute({
        sql: `INSERT INTO rate_limits (ip_hash, window_start, count) VALUES (?, ?, 1)
          ON CONFLICT (ip_hash, window_start) DO UPDATE SET count = count + 1
          RETURNING count`,
        args: [ipHash, windowStart],
      });

      return Number(counted.rows[0]?.["count"] ?? 0);
    },

    async questionsInWindow(ipHash: string, windowStart: string): Promise<number> {
      const found = await client.execute({
        sql: "SELECT count FROM rate_limits WHERE ip_hash = ? AND window_start = ?",
        args: [ipHash, windowStart],
      });

      return Number(found.rows[0]?.["count"] ?? 0);
    },

    async reserveModelCall(day: string, limit: number): Promise<number | null> {
      const counted = await client.execute({
        sql: `INSERT INTO model_calls (day, count) VALUES (?, 1)
          ON CONFLICT (day) DO UPDATE SET count = count + 1 WHERE count < ?
          RETURNING count`,
        args: [day, limit],
      });
      const row = counted.rows[0];

      return row === undefined ? null : Number(row["count"]);
    },

    async modelCallsOn(day: string): Promise<number> {
      const found = await client.execute({
        sql: "SELECT count FROM model_calls WHERE day = ?",
        args: [day],
      });

      return Number(found.rows[0]?.["count"] ?? 0);
    },

    async reserveVoiceMinutes(day: string, minutes: number, limit: number): Promise<number | null> {
      // The guard has to be in the `SELECT` and not only in the `ON CONFLICT` branch: the first reservation of a day
      // inserts instead of updating, so a limit smaller than the reservation would let the first session through and
      // store more minutes than the day allows.
      const counted = await client.execute({
        sql: `INSERT INTO voice_minutes (day, minutes)
          SELECT ?, ? WHERE ? <= ?
          ON CONFLICT (day) DO UPDATE SET minutes = minutes + excluded.minutes WHERE minutes + excluded.minutes <= ?
          RETURNING minutes`,
        args: [day, minutes, minutes, limit, limit],
      });
      const row = counted.rows[0];

      return row === undefined ? null : Number(row["minutes"]);
    },

    async voiceMinutesOn(day: string): Promise<number> {
      const found = await client.execute({
        sql: "SELECT minutes FROM voice_minutes WHERE day = ?",
        args: [day],
      });

      return Number(found.rows[0]?.["minutes"] ?? 0);
    },

    async deleteVoiceMinutesBefore(day: string): Promise<number> {
      const deleted = await client.execute({
        sql: "DELETE FROM voice_minutes WHERE day < ?",
        args: [day],
      });

      return Number(deleted.rowsAffected);
    },

    async readVoiceAgent(): Promise<StoredVoiceAgent | null> {
      const found = await client.execute(
        "SELECT agent_id, secret_id, tool_id, sources_tool_id, language, updated_at FROM voice_agent WHERE id = 1",
      );
      const row = found.rows[0];

      if (row === undefined || String(row["agent_id"]).length === 0) {
        return null;
      }

      return {
        agentId: String(row["agent_id"]),
        secretId: String(row["secret_id"] ?? ""),
        toolId: String(row["tool_id"] ?? ""),
        sourcesToolId: String(row["sources_tool_id"] ?? ""),
        language: String(row["language"] ?? "en"),
        updatedAt: String(row["updated_at"]),
      };
    },

    async saveVoiceAgent(row: VoiceAgentRowInput): Promise<void> {
      await client.execute({
        sql: `INSERT INTO voice_agent (id, agent_id, secret_id, tool_id, sources_tool_id, language, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
          ON CONFLICT (id) DO UPDATE SET
            agent_id = excluded.agent_id,
            secret_id = excluded.secret_id,
            tool_id = excluded.tool_id,
            sources_tool_id = excluded.sources_tool_id,
            language = excluded.language,
            updated_at = excluded.updated_at`,
        args: [row.agentId, row.secretId, row.toolId, row.sourcesToolId, row.language],
      });
    },

    async appendTurn(turn: TurnInput): Promise<number> {
      const stored = await client.execute({
        sql: `INSERT INTO conversations (session_id, turn, question, answer, created_at)
          VALUES (?, (SELECT COALESCE(MAX(turn), 0) + 1 FROM conversations WHERE session_id = ?), ?, ?, COALESCE(?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
          RETURNING turn`,
        args: [turn.sessionId, turn.sessionId, turn.question, turn.answer, turn.createdAt ?? null],
      });

      return Number(stored.rows[0]?.["turn"] ?? 0);
    },

    async turnsOf(sessionId: string, limit: number): Promise<StoredTurn[]> {
      const found = await client.execute({
        sql: "SELECT session_id, turn, question, answer, created_at FROM conversations WHERE session_id = ? ORDER BY turn DESC LIMIT ?",
        args: [sessionId, limit],
      });

      return found.rows
        .map((row) => ({
          sessionId: String(row["session_id"]),
          turn: Number(row["turn"]),
          question: String(row["question"]),
          answer: String(row["answer"]),
          createdAt: String(row["created_at"]),
        }))
        .reverse();
    },

    async deleteConversationsBefore(iso: string): Promise<number> {
      const deleted = await client.execute({
        sql: "DELETE FROM conversations WHERE created_at < ?",
        args: [iso],
      });

      return Number(deleted.rowsAffected);
    },

    async deleteRateLimitsBefore(iso: string): Promise<number> {
      const deleted = await client.execute({
        sql: "DELETE FROM rate_limits WHERE window_start < ?",
        args: [iso],
      });

      return Number(deleted.rowsAffected);
    },

    async deleteModelCallsBefore(day: string): Promise<number> {
      const deleted = await client.execute({
        sql: "DELETE FROM model_calls WHERE day < ?",
        args: [day],
      });

      return Number(deleted.rowsAffected);
    },

    async recordLoginFailure(ipHash: string, windowStart: string): Promise<number> {
      const counted = await client.execute({
        sql: `INSERT INTO login_attempts (ip_hash, window_start, count) VALUES (?, ?, 1)
          ON CONFLICT (ip_hash, window_start) DO UPDATE SET count = count + 1
          RETURNING count`,
        args: [ipHash, windowStart],
      });

      return Number(counted.rows[0]?.["count"] ?? 0);
    },

    async loginAttempts(ipHash: string, sinceIso: string): Promise<LoginAttempts | null> {
      const found = await client.execute({
        sql: "SELECT window_start, count FROM login_attempts WHERE ip_hash = ? AND window_start >= ? ORDER BY window_start DESC LIMIT 1",
        args: [ipHash, sinceIso],
      });
      const row = found.rows[0];

      return row === undefined
        ? null
        : { windowStart: String(row["window_start"]), count: Number(row["count"]) };
    },

    async clearLoginFailures(ipHash: string): Promise<void> {
      await client.execute({
        sql: "DELETE FROM login_attempts WHERE ip_hash = ?",
        args: [ipHash],
      });
    },

    async deleteLoginAttemptsBefore(iso: string): Promise<number> {
      const deleted = await client.execute({
        sql: "DELETE FROM login_attempts WHERE window_start < ?",
        args: [iso],
      });

      return Number(deleted.rowsAffected);
    },

    async readBusiness(): Promise<StoredBusiness | null> {
      const found = await client.execute(
        "SELECT name, (logo_bytes IS NOT NULL) AS has_logo, primary_color, tone, language, forbidden_topics, welcome_en, welcome_es, updated_at FROM business WHERE id = 1",
      );
      const row = found.rows[0];

      if (row === undefined) {
        return null;
      }

      return {
        name: String(row["name"]),
        hasLogo: Number(row["has_logo"] ?? 0) === 1,
        primaryColor:
          row["primary_color"] === null || row["primary_color"] === undefined
            ? null
            : String(row["primary_color"]),
        tone: String(row["tone"]),
        language: String(row["language"]),
        forbiddenTopics: String(row["forbidden_topics"]),
        welcomeEn: String(row["welcome_en"]),
        welcomeEs: String(row["welcome_es"]),
        updatedAt: String(row["updated_at"]),
      };
    },

    async saveBusiness(row: BusinessRowInput): Promise<void> {
      await client.execute({
        sql: `INSERT INTO business (id, name, primary_color, tone, language, forbidden_topics, welcome_en, welcome_es, updated_at)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
          ON CONFLICT (id) DO UPDATE SET
            name = excluded.name,
            primary_color = excluded.primary_color,
            tone = excluded.tone,
            language = excluded.language,
            forbidden_topics = excluded.forbidden_topics,
            welcome_en = excluded.welcome_en,
            welcome_es = excluded.welcome_es,
            updated_at = excluded.updated_at`,
        args: [
          row.name,
          row.primaryColor,
          row.tone,
          row.language,
          row.forbiddenTopics,
          row.welcomeEn,
          row.welcomeEs,
        ],
      });
    },

    async saveBusinessLogo(mime: string, bytes: Uint8Array): Promise<void> {
      await client.execute({
        sql: `INSERT INTO business (id, name, logo_mime, logo_bytes, updated_at)
          VALUES (1, '', ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
          ON CONFLICT (id) DO UPDATE SET
            logo_mime = excluded.logo_mime,
            logo_bytes = excluded.logo_bytes,
            updated_at = excluded.updated_at`,
        args: [mime, bytes],
      });
    },

    async readBusinessLogo(): Promise<StoredLogo | null> {
      const found = await client.execute(
        "SELECT logo_mime, logo_bytes FROM business WHERE id = 1 AND logo_bytes IS NOT NULL",
      );
      const row = found.rows[0];

      if (row === undefined) {
        return null;
      }

      return {
        mime: String(row["logo_mime"] ?? "application/octet-stream"),
        bytes: new Uint8Array(row["logo_bytes"] as ArrayBufferLike),
      };
    },

    async readProviderSetting(kind: ProviderKind): Promise<StoredProviderSetting | null> {
      const found = await client.execute({
        sql: "SELECT kind, provider, model, key_ciphertext, key_last4, base_url, mode, tested_at, test_latency_ms, updated_at FROM provider_settings WHERE kind = ?",
        args: [kind],
      });
      const row = found.rows[0];

      return row === undefined ? null : toProviderSetting(row as Row);
    },

    async saveProviderSetting(row: ProviderSettingInput): Promise<void> {
      await client.execute({
        sql: `INSERT INTO provider_settings (kind, provider, model, key_ciphertext, key_last4, base_url, mode, tested_at, test_latency_ms, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
          ON CONFLICT (kind) DO UPDATE SET
            provider = excluded.provider,
            model = excluded.model,
            key_ciphertext = excluded.key_ciphertext,
            key_last4 = excluded.key_last4,
            base_url = excluded.base_url,
            mode = excluded.mode,
            tested_at = excluded.tested_at,
            test_latency_ms = excluded.test_latency_ms,
            updated_at = excluded.updated_at`,
        args: [
          row.kind,
          row.provider,
          row.model,
          row.keyCiphertext,
          row.keyLast4,
          row.baseUrl,
          row.mode,
          row.testedAt,
          row.testLatencyMs,
        ],
      });
    },

    async deleteProviderSetting(kind: ProviderKind): Promise<number> {
      const deleted = await client.execute({
        sql: "DELETE FROM provider_settings WHERE kind = ?",
        args: [kind],
      });

      return Number(deleted.rowsAffected);
    },

    // The requirement "The test limit holds under concurrency": reading the counter and incrementing it in two
    // operations let forty simultaneous tests observe the same value before any of them reserved its slot (Major M-2
    // of `revision-community-12.md`). This writes first and counts after, and the two statements travel as one batch in
    // write mode, which is one atomic transaction: the row that the twentieth request leaves behind is the wall the
    // twenty-first one finds. The rows of the windows that are not the current one are removed in the same batch,
    // which is what keeps the table from growing for ever.
    async reserveProviderTest(windowStart: string): Promise<number> {
      const answers = await client.batch(
        [
          { sql: "DELETE FROM provider_tests WHERE window_start <> ?", args: [windowStart] },
          {
            sql: `INSERT INTO provider_tests (window_start, count) VALUES (?, 1)
              ON CONFLICT (window_start) DO UPDATE SET count = count + 1
              RETURNING count`,
            args: [windowStart],
          },
        ],
        "write",
      );

      return Number(answers[1]?.rows[0]?.["count"] ?? 0);
    },

    async saveIndexSignature(documentName: string, signature: string): Promise<void> {
      await client.execute({
        sql: `INSERT INTO document_index (document_id, signature, indexed_at)
          SELECT id, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now') FROM documents WHERE name = ?
          ON CONFLICT (document_id) DO UPDATE SET
            signature = excluded.signature,
            indexed_at = excluded.indexed_at`,
        args: [signature, documentName],
      });
    },

    async countPassagesNeedingIndex(signature: string): Promise<number> {
      const found = await client.execute({
        sql: `SELECT count(*) AS total FROM passages AS p
          JOIN documents AS d ON d.id = p.document_id
          LEFT JOIN document_index AS i ON i.document_id = d.id
          WHERE i.signature IS NULL OR i.signature <> ?`,
        args: [signature],
      });

      return Number(found.rows[0]?.["total"] ?? 0);
    },

    async listDocumentsNeedingIndex(signature: string): Promise<StoredDocument[]> {
      const found = await client.execute({
        sql: `SELECT d.id AS id, d.name AS name, d.sha256 AS sha256, d.type AS type, d.pages AS pages, d.ingested_at AS ingested_at
          FROM documents AS d
          LEFT JOIN document_index AS i ON i.document_id = d.id
          WHERE i.signature IS NULL OR i.signature <> ?
          ORDER BY d.name`,
        args: [signature],
      });

      return found.rows.map((row) => toDocument(row as Row));
    },

    async countVectorized(): Promise<number> {
      const found = await client.execute(
        "SELECT count(*) AS total FROM passages WHERE length(embedding) > 0",
      );

      return Number(found.rows[0]?.["total"] ?? 0);
    },

    async listRecentTurns(limit: number): Promise<StoredTurn[]> {
      const found = await client.execute({
        sql: "SELECT session_id, turn, question, answer, created_at FROM conversations ORDER BY created_at DESC, session_id DESC, turn DESC LIMIT ?",
        args: [limit],
      });

      return found.rows.map((row) => ({
        sessionId: String(row["session_id"]),
        turn: Number(row["turn"]),
        question: String(row["question"]),
        answer: String(row["answer"]),
        createdAt: String(row["created_at"]),
      }));
    },

    async countTurns(): Promise<number> {
      const found = await client.execute("SELECT count(*) AS total FROM conversations");

      return Number(found.rows[0]?.["total"] ?? 0);
    },

    async deleteAllTurns(): Promise<number> {
      const deleted = await client.execute("DELETE FROM conversations");

      return Number(deleted.rowsAffected);
    },

    close(): void {
      client.close();
    },
  };
}
