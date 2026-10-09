# Design: Cited as an MCP server

## 1. What the contract asks, and what the specification says

The endpoint is `app/api/mcp/route.ts`, one route handler of the same Next.js process, and it speaks the **Streamable
HTTP** transport of the Model Context Protocol. Every quotation below is from the 2025-06-18 revision of the
specification, read on 2026-10-08:

- **Transports, Streamable HTTP**: "The server **MUST** provide a single HTTP endpoint path (hereafter referred to as
  the **MCP endpoint**) that supports both POST and GET methods."
- **Transports, Sending Messages to the Server**: "Every JSON-RPC message sent from the client **MUST** be a new HTTP
  POST request to the MCP endpoint." / "If the input is a JSON-RPC _response_ or _notification_: If the server accepts
  the input, the server **MUST** return HTTP status code 202 Accepted with no body." / "If the input is a JSON-RPC
  _request_, the server **MUST** either return `Content-Type: text/event-stream` … or `Content-Type:
  application/json`, to return one JSON object."
- **Transports, Listening for Messages from the Server**: "The server **MUST** either return `Content-Type:
  text/event-stream` in response to this HTTP GET, or else return HTTP 405 Method Not Allowed, indicating that the
  server does not offer an SSE stream at this endpoint." The endpoint offers no stream, so `GET` is `405`.
- **Transports, Session Management**: the session ID is optional ("A server using the Streamable HTTP transport
  **MAY** assign a session ID at initialization time"). Cited assigns none: every request is self-contained, which is
  what the contract calls *without state*, and `DELETE` (the way a client ends a session) is `405`.
- **Transports, Security Warning**: "Servers **MUST** validate the `Origin` header on all incoming connections to
  prevent DNS rebinding attacks" and "Servers **SHOULD** implement proper authentication for all connections." Both
  are R2.
- **Transports, Protocol Version Header**: "If the server receives a request with an invalid or unsupported
  `MCP-Protocol-Version`, it **MUST** respond with `400 Bad Request`."
- **Lifecycle, Initialization**: the client sends `initialize` first, the server answers its capabilities and
  information, and "After successful initialization, the client **MUST** send an `initialized` notification".
- **Lifecycle, Version Negotiation**: "If the server supports the requested protocol version, it **MUST** respond with
  the same version. Otherwise, the server **MUST** respond with another protocol version it supports. This **SHOULD**
  be the _latest_ version supported by the server." Cited supports `2025-06-18` and `2025-03-26` and answers
  `2025-06-18` to anything else.
- **Tools, Capabilities**: "Servers that support tools **MUST** declare the `tools` capability."
- **Tools, Data Types**: a tool carries `name`, `description`, `inputSchema`, an optional `outputSchema` and optional
  `annotations`.
- **Tools, Structured Content**: "a tool that returns structured content SHOULD also return the serialized JSON in a
  TextContent block."
- **Tools, Error Handling**: "Protocol Errors: Standard JSON-RPC errors for issues like: Unknown tools, Invalid
  arguments, Server errors" and "Tool Execution Errors: Reported in tool results with `isError: true`".
- **Tools, Security Considerations**: "Servers **MUST**: Validate all tool inputs / Implement proper access controls /
  Rate limit tool invocations / Sanitize tool outputs."
- **Authorization**: "Authorization is **OPTIONAL** for MCP implementations" and "MCP servers **MUST** use the HTTP
  header `WWW-Authenticate` when returning a _401 Unauthorized_". The section describes an OAuth 2.1 resource server
  that discovers an authorization server and validates audience-bound tokens. Cited is a single-tenant installation
  whose operator pastes one token into the environment, so there is no authorization server, no dynamic registration
  and no audience to validate: R2 fixes a static bearer compared in constant time. The two duties that do apply are
  kept: every request carries `Authorization: Bearer <token>` (never a query string) and every refusal is a `401`
  with `WWW-Authenticate`.

## 2. Why the subset is written by hand

Decision: **no `@modelcontextprotocol/sdk`**. R7 allows either, and the hand-written subset is smaller, has no
dependency to pin and audit, and covers exactly five methods. The pieces the SDK would bring and this route does not
need: an SSE stream (the endpoint answers one JSON object per request), a session store (`Mcp-Session-Id`), a
transport abstraction over `node:http`, resource and prompt registries, and the sampling and elicitation requests of
the client. The supply-chain spec of this repository would also ask for the version to be pinned and its licenses
audited for a surface of a few hundred lines. `lib/mcp/` holds the protocol, the tools, the authentication and the
counter, and the tests drive them without a network.

## 3. Pieces

| Module | What it holds |
|---|---|
| `lib/mcp/protocol.ts` | the protocol versions, the server name and version, the JSON-RPC types and the four error codes |
| `lib/mcp/server.ts` | `handleMessage()`: one parsed JSON-RPC message in, one response or an accepted notification out |
| `lib/mcp/tools.ts` | the two tool definitions (`inputSchema`, `outputSchema`, annotations) and `callTool()` |
| `lib/mcp/auth.ts` | the origin check and the bearer comparison |
| `lib/mcp/limits.ts` | `MCP_RATE_LIMIT_PER_HOUR` and the per-token window |
| `app/api/mcp/route.ts` | the transport: status codes, headers, `405`, `404`, `403`, `401` and the body |

The route is thin on purpose: it resolves the HTTP questions (is the server on, who is asking, which method, which
version header) and delegates every JSON-RPC question to `handleMessage()`. That is what lets the unit tests cover the
protocol and the tools with plain objects and the integration test cover the real `POST` with a `Request`.

## 4. Decisions taken by the implementer

1. **No session, no `Mcp-Session-Id`, no `DELETE`.** The spec allows the server to assign a session; the contract asks
   for a stateless transport. Nothing of a request survives it: the tools read the store, and the per-hour counter
   (§4.5) is the only memory, and it is a counter, not a session.
2. **The token is read on every request, not at boot.** `process.env.CITED_MCP_TOKEN` empty or absent means the server
   is off, and the route answers `404` for `POST`, `GET` and `DELETE` with no body, so a probe learns nothing. Swapping
   the token needs a restart of the process only because the environment does.
3. **The order of the refusals is: off (`404`), origin (`403`), token (`401`), version header (`400`).** The origin
   comes before the token because it is the transport guard the spec asks to validate "on all incoming connections";
   a browser of another site can send the `Origin` but not the token, and refusing it earlier keeps the DNS-rebinding
   answer out of the authentication counters. No `Origin` (a command-line client) is accepted, which is what the spec
   and the contract both expect.
4. **"The site's own origin" is the `Host` of the request.** An `Origin` whose host and port differ from the `Host`
   header is `403`; a missing `Origin` is accepted. The scheme is not compared: TLS usually ends in front of the
   application (Traefik, a CDN), and the forwarded scheme is a header a client can write. `Origin: null` (a sandboxed
   frame or a `file://` document) is not the site's own origin and is refused.
5. **`MCP_RATE_LIMIT_PER_HOUR` counts tool calls per token, in the process memory.** The contract asks for a limit per
   token, not per IP, and the store's `rate_limits` table is keyed by an address hash (the public route's bucket).
   Reusing it would need a second table or a fake address, that is, a migration; the counter therefore lives in
   `lib/mcp/limits.ts` as a fixed window keyed by the SHA-256 of the token, purged when the window turns. The
   consequence, written down instead of hidden: an installation that runs several Node processes counts each process
   apart until it restarts, and the limit is a spend guard, not a distributed quota. Only `tools/call` consumes it;
   `initialize`, `ping` and `tools/list` are free.
6. **`cited_ask` replaces the per-IP quota with the per-token one.** `askQuestion()` gains one optional input,
   `quota: "ip" | "external"`. The default is `"ip"` and every existing caller (the public route, the voice tool)
   keeps its behavior. The MCP tool passes `"external"`: the IP counter would cap the token at
   `RATE_LIMIT_PER_IP_PER_HOUR` (30 by default) before the token's own 120, and an agent has no address to bucket.
   The daily cap of model calls and the retention of conversations are untouched and still apply.
7. **The MCP channel is not stored, so there is no migration.** R6 allows marking the channel when a migration is
   needed. A turn of `cited_ask` is stored by `askQuestion()` exactly as `/api/ask` stores it (same table, same
   retention, same `sessionId`), and the panel of conversations reads it unchanged. No column, no table and no
   migration in this change; `docs/mcp.md` says where the turns of an agent land.
8. **An unknown tool is `-32602`, not `-32601`.** The spec's own example answers `-32602` "Unknown tool:
   invalid_tool_name"; `-32601` is kept for a method the server does not implement (`resources/list`, `prompts/list`).
9. **`cited_search` falls back to keywords.** It asks the resolver for the embeddings of the installation and uses
   them when the mode is `vectors` and the provider is configured; in every other case it searches with `null`, which
   is the keyword mode of `hybridSearch()`. The public route answers `503` in that case because it promises an answer
   from meaning; a search tool that can still return the passage a word appears in is more useful than an error, and
   the gate drives exactly this path (a seeded store, no provider).
10. **`outputSchema` is declared and `structuredContent` is sent with it.** The spec says a tool that returns
    structured content "SHOULD also return the serialized JSON in a TextContent block", so both tools answer with the
    JSON object and with a numbered text a client model can read and cite.
11. **The excerpt of a search passage is its text, trimmed, capped at 1200 characters.** The citation of
    `cited_ask` keeps the `excerpt` and `lead` of `/api/ask` untouched, because it is the same outcome.
12. **The limits of the text are the public ones.** A `query` or a `question` longer than `MAX_QUESTION_CHARS` is a
    tool error; `limit` outside 1..8 and a missing `query` are `-32602`, because the schema says so.
13. **Every sentence that leaves the route passes through `publicMessage()`**, as `/api/ask` does. An error text that
    names a variable of the environment (the rate-limit and daily-cap messages do) becomes the tool's own closed
    sentence, so no name of a variable and no text of a provider or of an SDK is ever sent to a client.
14. **One route, not a folder of tools.** `lib/mcp/tools.ts` holds the table and the two handlers; a registry grows
    when a third tool exists.
15. **The constant-time comparison moves to `lib/guards/bearer.ts`.** `lib/voice/secret.ts` re-exports it so the voice
    tool and its tests are untouched. Two copies of `timingSafeEqual` are worse than one shared guard.

## 5. The shapes

`tools/list` answers exactly two tools, in this order:

| Tool | Input | Output |
|---|---|---|
| `cited_search` | `{ query: string, limit?: integer 1..8 (5) }` | `{ passages: [{ n, document, heading, position, excerpt }] }` |
| `cited_ask` | `{ question: string, sessionId?: string }` | `{ status: "answered", answer, citations: [{ n, document, heading, position, excerpt, lead }] }` or `{ status: "refused", answer, citations: [] }` |

Both carry `annotations: { readOnlyHint: true, openWorldHint: false }`. `cited_ask` writes a conversation turn when it
receives a `sessionId`, as `/api/ask` does; it never writes a document, and the tool is read-only about the corpus,
which is what the annotation means.

The transport answers: `200` with one JSON object for a request, `202` with no body for a notification, `400` for a
body that is not a JSON-RPC message or for an unknown `MCP-Protocol-Version`, `401` with `WWW-Authenticate: Bearer`,
`403` for a foreign origin, `404` while the server is off, `405` for `GET` and `DELETE`.

## 6. What is deliberately out of this change

- The `dsh-plugin-cited` bundle of `tasks/investigacion-cited-deepseek-harness.md`: this change publishes the server,
  not the plugin that preconfigures it.
- SSE, resumability, server-to-client requests, resources and prompts.
- Marking the channel of a conversation as `mcp` in the store (decision 7).
- A distributed counter for an installation with several processes (decision 5).
