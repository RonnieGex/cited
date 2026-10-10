// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/mcp/route";
import * as server from "@/lib/mcp/server";

const LIMIT = 1024 * 1024;
const init = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } };
const tool = { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "cited_search", arguments: { query: "sample" } } };

function request(body: string | ReadableStream<Uint8Array>, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/mcp", {
    method: "POST",
    headers: { authorization: "Bearer transport-test", ...headers },
    body,
    duplex: "half",
  } as RequestInit);
}

function sized(bytes: number) {
  const base = JSON.stringify({ ...init, padding: "é" });
  return base + " ".repeat(bytes - Buffer.byteLength(base));
}

function stream(chunks: Uint8Array[] = [], close = true, cancel = vi.fn()) {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
      for (const chunk of chunks) value.enqueue(chunk);
      if (close) value.close();
    },
    cancel,
  }, { highWaterMark: 0 });
  return { body, cancel, get controller() { return controller; } };
}

beforeEach(() => {
  vi.stubEnv("CITED_MCP_TOKEN", "transport-test");
  vi.spyOn(server, "handleMessage");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("only valid individual initialization bypasses the header", () => {
  const invalid = [
    { jsonrpc: "2.0", method: "initialize" },
    { method: "initialize" },
    { ...init, id: {} },
    { jsonrpc: "2.0", id: 1, method: "initialize" },
    { ...init, params: [] },
    { ...init, params: null },
    { ...init, params: { protocolVersion: "" } },
    { ...init, params: { protocolVersion: 2025 } },
    { ...init, id: null },
    { ...init, id: 1.5 },
    { ...init, id: true },
    { ...init, jsonrpc: "1.0" },
    [init], [init, tool], [], null,
    { jsonrpc: "2.0", id: 2, method: "tools/list" },
    tool,
    { jsonrpc: "2.0", method: "notifications/initialized" },
  ];

  it.each(invalid.map((body, index) => [index, body] as const))("rejects invalid or subsequent message %s without dispatch", async (_, body) => {
    const response = await POST(request(JSON.stringify(body), { "mcp-protocol-version": "2025-11-25" }));
    expect(response.status).toBe(400);
    expect(server.handleMessage).not.toHaveBeenCalled();
  });

  it("rejects non-finite numeric IDs parsed from JSON", async () => {
    const response = await POST(request(JSON.stringify(init).replace('"id":1', '"id":1e400'), { "mcp-protocol-version": "2025-11-25" }));
    expect(response.status).toBe(400);
    expect(server.handleMessage).not.toHaveBeenCalled();
  });

  it.each([0, -1, "request-id", ""])("negotiates by body with valid ID %s", async (id) => {
    const response = await POST(request(JSON.stringify({ ...init, id }), { "mcp-protocol-version": "2025-11-25" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id, result: { protocolVersion: "2025-03-26" } });
  });
});

describe("bounded POST bodies", () => {
  it.each(["", "2025-06-18", "2025-11-25"])("counts actual bytes with protocol header %s", async (version) => {
    for (const declared of [undefined, "1"]) {
      for (const bytes of [LIMIT, LIMIT + 1]) {
        vi.mocked(server.handleMessage).mockClear();
        const data = new TextEncoder().encode(sized(bytes));
        const source = stream([data.subarray(0, 71), data.subarray(71)], false);
        if (bytes === LIMIT) source.controller.close();
        const headers: Record<string, string> = { "mcp-protocol-version": version };
        if (declared !== undefined) headers["content-length"] = declared;
        const response = await POST(request(source.body, headers));
        expect(response.status).toBe(bytes === LIMIT ? 200 : 413);
        expect(source.body.locked).toBe(false);
        if (bytes > LIMIT) {
          expect(source.cancel).toHaveBeenCalledOnce();
          expect(server.handleMessage).not.toHaveBeenCalled();
        }
      }
    }
  });

  it("rejects oversized Content-Length before acquiring a reader", async () => {
    const source = stream([], false);
    const getReader = vi.spyOn(source.body, "getReader");
    const response = await POST(request(source.body, { "content-length": String(LIMIT + 1) }));
    expect(response.status).toBe(413);
    expect(getReader).not.toHaveBeenCalled();
    expect(server.handleMessage).not.toHaveBeenCalled();
    source.controller.close();
  });

  it.each([404, 403, 401])("preserves guard %s before reading or length checks", async (status) => {
    if (status === 404) vi.stubEnv("CITED_MCP_TOKEN", "");
    const source = stream([], false);
    const getReader = vi.spyOn(source.body, "getReader");
    const response = await POST(request(source.body, {
      "content-length": String(LIMIT + 1), authorization: "Bearer wrong",
      ...(status !== 401 ? { origin: "https://foreign.example" } : {}),
    }));
    expect(response.status).toBe(status);
    expect(getReader).not.toHaveBeenCalled();
    expect(server.handleMessage).not.toHaveBeenCalled();
    source.controller.close();
  });

  it.each([false, true])("uses a total deadline, trickling=%s", async (trickle) => {
    vi.useFakeTimers();
    const source = stream([], false);
    const pending = POST(request(source.body));
    let settled = false;
    void pending.then(() => { settled = true; });
    for (let index = 0; index < 9; index += 1) {
      await vi.advanceTimersByTimeAsync(1000);
      if (trickle) source.controller.enqueue(new TextEncoder().encode(" "));
    }
    await vi.advanceTimersByTimeAsync(999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).status).toBe(408);
    expect(source.cancel).toHaveBeenCalledOnce();
    expect(source.body.locked).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(server.handleMessage).not.toHaveBeenCalled();
  });

  it.each(["success", "invalid", "read-error", "overflow", "empty"])("cleans up after %s", async (kind) => {
    vi.useFakeTimers();
    const content = kind === "success" ? JSON.stringify(init) : kind === "overflow" ? sized(LIMIT + 1) : "{";
    const source = stream([new TextEncoder().encode(content)], false);
    if (kind === "read-error") source.controller.error(new Error("synthetic read failure"));
    else if (kind !== "overflow") source.controller.close();
    const input = kind === "empty" ? new Request("http://localhost/api/mcp", { method: "POST", headers: { authorization: "Bearer transport-test" } }) : request(source.body);
    const response = await POST(input);
    expect(response.status).toBe(kind === "success" ? 200 : kind === "overflow" ? 413 : 400);
    expect(source.body.locked).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["overflow", "timeout"])("does not await uncooperative cancellation on %s", async (kind) => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const source = stream(kind === "overflow" ? [new Uint8Array(LIMIT + 1)] : [], false, cancel);
    const pending = POST(request(source.body));
    if (kind === "timeout") await vi.advanceTimersByTimeAsync(10000);
    expect((await pending).status).toBe(kind === "overflow" ? 413 : 408);
    expect(cancel).toHaveBeenCalledOnce();
    expect(source.body.locked).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
