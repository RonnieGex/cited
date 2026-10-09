## Why

Cited answers with citations through `POST /api/ask`, the public page and the widget. An agent that already knows how
to speak MCP (DeepSeek Harness, Claude Code, Codex, Cursor) has no way to ask the documents of an installation, so the
knowledge of a business cannot be cited inside the tool where the work happens.

## What Changes

- `POST /api/mcp`: a **stateless Streamable HTTP** MCP endpoint (`app/api/mcp/route.ts`) that speaks the JSON-RPC
  subset `initialize`, `notifications/initialized`, `ping`, `tools/list` and `tools/call`, negotiated over protocol
  versions `2025-06-18` and `2025-03-26`.
- `CITED_MCP_TOKEN`: without it the route is off and answers `404`; with it every request needs
  `Authorization: Bearer <token>`, compared in constant time, and an `Origin` that is not the site's own is refused
  with `403`.
- Two read-only tools: `cited_search` (passages of `hybridSearch()`, no chat model) and `cited_ask` (the outcome of
  `askQuestion()`, with the honest refusal).
- `MCP_RATE_LIMIT_PER_HOUR` (default 120), counted per token, beside the existing daily cap of model calls.
- `lib/mcp/`: the protocol, the authentication, the tools and the counter, written by hand, with no new dependency.
- `docs/mcp.md`, a section of both READMEs, `.env.example`, `scripts/mcp-smoke.mjs` and `scripts/gate-mcp.mjs`.

## Impact

- Application: `app/api/mcp/route.ts` (new), `lib/mcp/` (new), `lib/answer/ask.ts` (one optional input: an external
  hourly quota), `lib/voice/secret.ts` (re-export of the shared constant-time comparison).
- Docs: `docs/mcp.md` (new), `README.md`, `README.es.md`, `.env.example`, `docs/development-guide.md`,
  `docs/security.md`.
- Tests: `tests/mcp-protocol.test.ts`, `tests/mcp-tools.test.ts`, `tests/mcp-route.test.ts`,
  `tests/readme.test.ts` (the bilingual section map).
- Scripts: `scripts/mcp-seed.ts`, `scripts/mcp-smoke.mjs`, `scripts/gate-mcp.mjs` (new).
- Specs: the new capability `mcp-server`. No delta of another capability: the public route, its limits and its
  refusals keep their requirements, and the store gets no migration.
