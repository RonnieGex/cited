# LOOP_STATE · Cited, change `mcp-server`

STATUS: RUNNING
CHANGE: mcp-server (OpenSpec), new capability `mcp-server`
BRANCH: feature/mcp-server
BASE: f644f85 (`origin/main`, the close of launch-hygiene)
AGENT: DeepSeek (implementer); Fable reviews at the end
DATE: 2026-10-08

## Objective

Cited as an MCP server: `app/api/mcp/route.ts`, the stateless Streamable HTTP transport, the two read-only tools
(`cited_search`, `cited_ask`), the token, the limits and the documentation, until `scripts/gate-mcp.mjs` prints
`GATE: GREEN`.

## Phase

1. Spec. `openspec/changes/mcp-server/` with `proposal.md`, `design.md`, `tasks.md` and the spec of the capability.
   Next: tests first (step 2 of `tasks.md`).

## Last gate result

No run yet.

## Progress

- Reconnaissance of the worktree read: `app/api/ask/route.ts`, `lib/answer/ask.ts`, `lib/search/index.ts`,
  `lib/store/index.ts`, `lib/guards/limits.ts`, `lib/guards/outbound.ts`, `lib/settings/providers.ts`,
  `lib/voice/secret.ts`, `samples/`, `docs/`, the README test and the OpenSpec standards.
- The MCP specification (2025-06-18) read for the citations of `design.md`: Transports, Lifecycle, Tools and
  Authorization.
- The spec change written. Step 0.1 of `tasks.md` marked with its evidence; every later box waits for its own.
