// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { afterAll, describe, expect, it } from "vitest";

// The state of the store before and after the voice agent runs: the tables of the schema with the row count of each
// one. A fresh store carries the two tables this change adds and no row in them; the two flows of the change — the
// reservation of a session and the agent the panel stores — leave exactly one row in each one. The script of the same
// evidence is `scripts/store-state.ts`; this file is its executable form. No network and no provider.

const roots: string[] = [];

interface TableState {
  tables: string[];
  counts: Record<string, number>;
}

async function stateOf(path: string): Promise<TableState> {
  const client = createClient({ url: `file:${path}` });
  const found = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  const tables = found.rows.map((row) => String(row["name"]));
  const counts: Record<string, number> = {};

  for (const name of tables) {
    const counted = await client.execute(`SELECT count(*) AS rows FROM "${name}"`);

    counts[name] = Number(counted.rows[0]?.["rows"] ?? 0);
  }

  client.close();

  return { tables, counts };
}

function databasePath(name: string): string {
  const root = mkdtempSync(join(tmpdir(), `katalis-voice-state-${name}-`));

  roots.push(root);

  return join(root, "store.sqlite");
}

afterAll(async () => {
  const { closeSharedStores } = await import("@/lib/store/instance");

  await closeSharedStores();

  for (const root of roots) {
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

describe("the state of the store around the voice agent", () => {
  it("carries the two tables of the voice and no row in them before the flows run", async () => {
    const path = databasePath("before");
    const { openStore } = await import("@/lib/store");

    (await openStore(path)).close();

    const before = await stateOf(path);

    expect(before.tables).toEqual([
      "business",
      "conversations",
      "document_index",
      "documents",
      "login_attempts",
      "model_calls",
      "passages",
      "passages_fts",
      "passages_fts_config",
      "passages_fts_content",
      "passages_fts_data",
      "passages_fts_docsize",
      "passages_fts_idx",
      "provider_settings",
      "provider_tests",
      "rate_limits",
      "voice_agent",
      "voice_minutes",
    ]);
    // Every table of data is empty. The shadow tables of the full-text index (`passages_fts_config` and
    // `passages_fts_data`) carry the internal rows the index writes when it is created, and no document.
    const dataTables = before.tables.filter((name) => name.startsWith("passages_fts_") === false);

    expect(before.counts["passages_fts_config"]).toBe(1);
    expect(before.counts["passages_fts_data"]).toBe(2);
    expect(before.counts["voice_minutes"]).toBe(0);
    expect(before.counts["voice_agent"]).toBe(0);
    expect(dataTables.map((name) => before.counts[name])).toEqual(dataTables.map(() => 0));
  });

  it("leaves one reservation of five minutes and one agent after the two flows", async () => {
    const path = databasePath("after");
    const { openStore } = await import("@/lib/store");
    const { reserveSession, utcDay } = await import("@/lib/voice/minutes");
    const now = new Date("2026-09-29T18:00:00.000Z");
    const store = await openStore(path);
    const room = await reserveSession(store, {
      now,
      environment: { DAILY_VOICE_MINUTE_LIMIT: "30" },
    });

    await store.saveVoiceAgent({
      agentId: "agent_del_estado",
      secretId: "secret_1",
      toolId: "tool_1",
      sourcesToolId: "tool_2",
      language: "en",
    });
    store.close();

    const after = await stateOf(path);
    const client = createClient({ url: `file:${path}` });
    const minutes = await client.execute("SELECT day, minutes FROM voice_minutes");
    const agent = await client.execute("SELECT agent_id, language FROM voice_agent");

    client.close();

    expect(room).toEqual({ ok: true, minutes: 5 });
    expect(after.counts["voice_minutes"]).toBe(1);
    expect(after.counts["voice_agent"]).toBe(1);
    expect(after.counts["conversations"]).toBe(0);
    expect(after.counts["model_calls"]).toBe(0);
    expect({ ...minutes.rows[0] }).toEqual({ day: utcDay(now), minutes: 5 });
    expect({ ...agent.rows[0] }).toEqual({ agent_id: "agent_del_estado", language: "en" });
  });
});
