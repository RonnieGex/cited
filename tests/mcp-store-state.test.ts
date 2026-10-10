// @vitest-environment node
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { afterAll, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";
import { closeSharedStores } from "@/lib/store/instance";
import { storeTables } from "@/lib/store/tables";
import { cleanupWorkspaces, restoreEnvironment, setEnvironment, vectorStore } from "./mcp-helpers";

function snapshot(path: string) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const counts = Object.fromEntries(storeTables.map((table) => [table,
      Number((db.prepare(`SELECT count(*) AS total FROM "${table}"`).get() as { total: number }).total),
    ]));
    const corpus = ["documents", "passages"].map((table) => db.prepare(`SELECT * FROM "${table}" ORDER BY id`).all());
    return { counts, corpusHash: createHash("sha256").update(JSON.stringify(corpus)).digest("hex") };
  } finally {
    db.close();
  }
}

async function call(body: unknown, version = "2025-06-18") {
  return POST(new Request("http://localhost/api/mcp", {
    method: "POST", headers: { authorization: "Bearer state-test", "mcp-protocol-version": version },
    body: JSON.stringify(body),
  }));
}

afterAll(async () => {
  await closeSharedStores();
  await cleanupWorkspaces();
  restoreEnvironment();
});

it("preserves the corpus and records only an accepted ask conversation", async () => {
  const path = await vectorStore();
  setEnvironment({ DATABASE_URL: path, CITED_MCP_TOKEN: "state-test", CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });
  await closeSharedStores();
  const before = snapshot(path);
  expect(before.counts.documents).toBeGreaterThan(0);
  expect(before.counts.passages).toBeGreaterThan(0);
  expect(before.counts.conversations).toBe(0);
  const ask = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "cited_ask", arguments: {
    question: "¿Cuánto cuesta una afinación de bicicleta?", sessionId: "mcp-state-evidence",
  } } };
  expect((await call(ask, "2025-11-25")).status).toBe(400);
  expect((await call([ask], "2025-11-25")).status).toBe(400);
  expect((await call({ jsonrpc: "2.0", method: "initialize" }, "2025-11-25")).status).toBe(400);
  const rejected = snapshot(path);
  expect(rejected).toEqual(before);
  const search = await call({ jsonrpc: "2.0", id: 2, method: "tools/call", params: {
    name: "cited_search", arguments: { query: "afinación de bicicleta" },
  } });
  expect((await search.json()).result.structuredContent.passages.length).toBeGreaterThan(0);
  const searched = snapshot(path);
  expect(searched).toEqual(before);
  const accepted = await call(ask);
  expect((await accepted.json()).result.structuredContent.status).toBe("answered");
  await closeSharedStores();
  const after = snapshot(path);
  expect(after.corpusHash).toBe(before.corpusHash);
  expect(after.counts.conversations).toBe(1);
  for (const table of storeTables.filter((name) => name !== "conversations" && name !== "model_calls")) {
    expect(after.counts[table], table).toBe(before.counts[table]);
  }
  console.log(JSON.stringify({ before, rejected, searched, after }));
});
