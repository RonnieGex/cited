// @vitest-environment node
// The two tools over a seeded store: the passages of the search, the answer and the refusal of `cited_ask`, the guards
// of the text, the counter of the token and what the answer stores. No provider is called: the corpus is the sample
// one and the chat provider is the deterministic double.

import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { VARIABLE_NAME } from "@/lib/guards/outbound";
import { daysBefore } from "@/lib/guards/window";
import { resetMcpCalls } from "@/lib/mcp/limits";
import { handleMessage, type McpOutcome } from "@/lib/mcp/server";
import { MCP_TOOLS, TOOL_ASK, TOOL_SEARCH, callTool, type ToolResult } from "@/lib/mcp/tools";
import { openStore, storeTables } from "@/lib/store";
import { closeSharedStores } from "@/lib/store/instance";
import {
  cleanupWorkspaces,
  keywordStore,
  restoreEnvironment,
  setEnvironment,
  vectorStore,
} from "./mcp-helpers";

const TOKEN = "token-de-prueba";
const priceQuestion = "¿Cuánto cuesta una afinación de bicicleta?";
const priceQuery = "afinación de bicicleta";
const nowhereQuestion = "¿Cuál es la capital de Australia?";

afterAll(async () => {
  await closeSharedStores();
  await cleanupWorkspaces();
  restoreEnvironment();
});

beforeEach(() => {
  resetMcpCalls();
});

async function run(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const outcome = await callTool(name, args, { environment: process.env });

  if (outcome.kind !== "result") {
    throw new Error(`the arguments were refused: ${outcome.message}`);
  }

  return outcome.result;
}

function structured(result: ToolResult): Record<string, unknown> {
  if (result.structuredContent === undefined) {
    throw new Error("the result carries no structured content");
  }

  return result.structuredContent;
}

function textOf(result: ToolResult): string {
  return result.content.map((part) => part.text).join("\n");
}

async function callMessage(name: string, args: Record<string, unknown>, token = TOKEN): Promise<ToolResult> {
  const outcome: McpOutcome = await handleMessage(
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } },
    { environment: process.env, token },
  );

  if (outcome.kind !== "response" || "error" in outcome.body) {
    throw new Error("the message did not answer a tool result");
  }

  return outcome.body.result as unknown as ToolResult;
}

describe("cited_search reads the store without a model", () => {
  it("returns the passages with the five fields of a citation", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path });
    await closeSharedStores();

    const result = await run(TOOL_SEARCH, { query: priceQuery });
    const passages = structured(result)["passages"] as Array<Record<string, unknown>>;

    expect(result.isError).toBeFalsy();
    expect(passages.length).toBeGreaterThanOrEqual(1);
    expect(passages[0]?.["n"]).toBe(1);
    expect(passages[0]?.["document"]).toBe("cafe-la-horquilla.md");
    expect(passages[0]?.["heading"]).toBe("Precios");
    expect(passages[0]?.["position"]).toBe(2);
    expect(String(passages[0]?.["excerpt"])).toContain("380 pesos");
    expect(textOf(result)).toContain("cafe-la-horquilla.md");
    expect(textOf(result)).toContain("380 pesos");
  });

  it("honours the limit of the schema and the default of five", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path });
    await closeSharedStores();

    const one = structured(await run(TOOL_SEARCH, { query: "bicicleta", limit: 1 }))["passages"] as unknown[];
    const many = structured(await run(TOOL_SEARCH, { query: "bicicleta" }))["passages"] as unknown[];

    expect(one.length).toBe(1);
    expect(many.length).toBeGreaterThanOrEqual(one.length);
    expect(many.length).toBeLessThanOrEqual(5);
  });

  it("answers an empty list, and not an error, when no passage matches", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path });
    await closeSharedStores();

    const result = await run(TOOL_SEARCH, { query: "helicoptero submarino" });

    expect(result.isError).toBeFalsy();
    expect(structured(result)["passages"]).toEqual([]);
  });

  it("refuses a query longer than MAX_QUESTION_CHARS and never echoes it", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, MAX_QUESTION_CHARS: "50" });
    await closeSharedStores();

    const query = "a".repeat(51);
    const result = await run(TOOL_SEARCH, { query });
    const serialized = JSON.stringify(result);

    expect(result.isError).toBe(true);
    expect(serialized).not.toContain(query);
    expect(VARIABLE_NAME.test(textOf(result))).toBe(false);
  });
});

describe("cited_ask answers with the pipeline of the answers", () => {
  it("answers with the citation of the document it came from", async () => {
    const path = await vectorStore();

    setEnvironment({ DATABASE_URL: path, CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });
    await closeSharedStores();

    const result = await run(TOOL_ASK, { question: priceQuestion });
    const content = structured(result);
    const citations = content["citations"] as Array<Record<string, unknown>>;

    expect(result.isError).toBeFalsy();
    expect(content["status"]).toBe("answered");
    expect(String(content["answer"])).toContain("[1]");
    expect(citations[0]?.["document"]).toBe("cafe-la-horquilla.md");
    expect(citations[0]?.["heading"]).toBe("Precios");
    expect(typeof citations[0]?.["lead"]).toBe("number");
    expect(textOf(result)).toContain("cafe-la-horquilla.md");
  });

  it("refuses instead of inventing when no document holds the answer", async () => {
    const path = await vectorStore();

    setEnvironment({ DATABASE_URL: path, CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });
    await closeSharedStores();

    const result = await run(TOOL_ASK, { question: nowhereQuestion });

    expect(result.isError).toBeFalsy();
    expect(structured(result)["status"]).toBe("refused");
    expect(structured(result)["citations"]).toEqual([]);
    expect(textOf(result).length).toBeGreaterThan(10);
  });

  it("is a tool error, and names no variable, when the installation has no chat provider", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path });
    await closeSharedStores();

    const result = await run(TOOL_ASK, { question: priceQuestion });
    const serialized = JSON.stringify(result);

    expect(result.isError).toBe(true);
    expect(VARIABLE_NAME.test(serialized)).toBe(false);
    expect(serialized).not.toMatch(/sk-[a-z0-9]/i);
    expect(textOf(result).toLowerCase()).toMatch(/panel|not connected/);
  });

  it("keeps the daily cap of model calls", async () => {
    const path = await vectorStore();

    setEnvironment({
      DATABASE_URL: path,
      CHAT_PROVIDER: "fake",
      EMBEDDINGS_PROVIDER: "fake",
      DAILY_MODEL_CALL_LIMIT: "1",
    });
    await closeSharedStores();

    const first = await run(TOOL_ASK, { question: priceQuestion });
    const second = await run(TOOL_ASK, { question: priceQuestion });
    const store = await openStore(path);
    const day = new Date().toISOString().slice(0, 10);
    const calls = await store.modelCallsOn(day);

    store.close();

    expect(first.isError).toBeFalsy();
    expect(second.isError).toBe(true);
    expect(VARIABLE_NAME.test(textOf(second))).toBe(false);
    expect(calls).toBe(1);
  });

  it("stores the turns of a session as the public route stores them", async () => {
    const path = await vectorStore();

    setEnvironment({ DATABASE_URL: path, CHAT_PROVIDER: "fake", EMBEDDINGS_PROVIDER: "fake" });
    await closeSharedStores();

    await run(TOOL_ASK, { question: priceQuestion, sessionId: "sesion-mcp" });
    await run(TOOL_ASK, { question: "¿Y el cambio de cámara?", sessionId: "sesion-mcp" });
    await closeSharedStores();

    const store = await openStore(path);
    const turns = await store.turnsOf("sesion-mcp", 6);

    store.close();

    expect(turns.length).toBe(2);
    expect(turns[0]?.question).toBe(priceQuestion);
    expect(turns[0]?.answer.length).toBeGreaterThan(0);
    expect(turns[1]?.question).toBe("¿Y el cambio de cámara?");
  });

  it("purges the conversations the retention has left behind", async () => {
    const path = await vectorStore();
    const now = new Date(Date.now() + 2 * 60 * 60 * 1000);

    setEnvironment({
      DATABASE_URL: path,
      CHAT_PROVIDER: "fake",
      EMBEDDINGS_PROVIDER: "fake",
      CONVERSATION_RETENTION_DAYS: "30",
    });

    const seeded = await openStore(path);

    await seeded.appendTurn({
      sessionId: "sesion-vieja",
      question: "una pregunta de hace dos meses",
      answer: "una respuesta de hace dos meses",
      createdAt: daysBefore(now, 40),
    });
    seeded.close();
    await closeSharedStores();

    const outcome = await callTool(
      TOOL_ASK,
      { question: priceQuestion, sessionId: "sesion-nueva" },
      { environment: process.env, now },
    );

    expect(outcome.kind).toBe("result");
    await closeSharedStores();

    const store = await openStore(path);
    const old = await store.turnsOf("sesion-vieja", 6);
    const fresh = await store.turnsOf("sesion-nueva", 6);

    store.close();

    expect(old).toEqual([]);
    expect(fresh.length).toBe(1);
  });

  it("does not migrate the store: the schema keeps its own tables", async () => {
    const path = await keywordStore();
    const store = await openStore(path);

    await store.replaceDocument(
      { name: "una-nota.txt", sha256: "0".repeat(64), type: "txt", pages: null },
      [{ position: 0, heading: null, text: "una nota", embedding: [] }],
    );
    store.close();
    await closeSharedStores();

    const client = createClient({ url: `file:${path}` });
    const found = await client.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_data' AND name NOT LIKE '%_idx' AND name NOT LIKE '%_content' AND name NOT LIKE '%_docsize' AND name NOT LIKE '%_config' ORDER BY name",
    );

    client.close();

    expect(found.rows.map((row) => String(row["name"]))).toEqual([...storeTables].sort());
    expect(storeTables.filter((table) => /mcp/i.test(table))).toEqual([]);
  });
});

describe("the counter of the token bounds the tools", () => {
  it("refuses the call over MCP_RATE_LIMIT_PER_HOUR and serves another token", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, MCP_RATE_LIMIT_PER_HOUR: "2" });
    await closeSharedStores();

    const first = await callMessage(TOOL_SEARCH, { query: priceQuery }, "token-uno");
    const second = await callMessage(TOOL_SEARCH, { query: priceQuery }, "token-uno");
    const third = await callMessage(TOOL_SEARCH, { query: priceQuery }, "token-uno");
    const other = await callMessage(TOOL_SEARCH, { query: priceQuery }, "token-dos");

    expect(first.isError).toBeFalsy();
    expect(second.isError).toBeFalsy();
    expect(third.isError).toBe(true);
    expect(VARIABLE_NAME.test(textOf(third))).toBe(false);
    expect(textOf(third).toLowerCase()).toMatch(/too many|limit/);
    expect(other.isError).toBeFalsy();
  });

  it("does not charge the calls that are not a tool call", async () => {
    const path = await keywordStore();

    setEnvironment({ DATABASE_URL: path, MCP_RATE_LIMIT_PER_HOUR: "1" });
    await closeSharedStores();

    for (const method of ["ping", "tools/list", "initialize"]) {
      const outcome = await handleMessage(
        { jsonrpc: "2.0", id: 1, method, params: { protocolVersion: "2025-06-18" } },
        { environment: process.env, token: TOKEN },
      );

      expect(outcome.kind, method).toBe("response");
    }

    const first = await callMessage(TOOL_SEARCH, { query: priceQuery });
    const second = await callMessage(TOOL_SEARCH, { query: priceQuery });

    expect(first.isError).toBeFalsy();
    expect(second.isError).toBe(true);
  });
});

describe("the definitions of the tools", () => {
  it("names the two tools of the contract and no other", () => {
    expect(MCP_TOOLS.map((tool) => tool.name)).toEqual([TOOL_SEARCH, TOOL_ASK]);
  });
});
