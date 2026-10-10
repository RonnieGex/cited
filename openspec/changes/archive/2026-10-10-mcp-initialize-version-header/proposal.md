## Why

Hermes Agent v0.21.6 (updated 2026-10-09, MCP SDK 2.x) cannot connect to Cited. Its client seeds the header
`MCP-Protocol-Version: 2025-11-25` on every request, the `initialize` request included, and `app/api/mcp/route.ts`
refuses any unsupported header with `400` before it reads the body, so the version negotiation never runs and
`hermes mcp test cited` fails with "the protocol version 2025-11-25 is not supported". The MCP transport
specification (2025-06-18, "Protocol Version Header") asks the client to send that header on the requests that
**follow** initialization, and negotiation itself happens in the body of `initialize`. Every client on a newer SDK
will meet the same wall.

## What Changes

- After access guards, `app/api/mcp/route.ts` reads a bounded body and checks `MCP-Protocol-Version` unless the message is
  a valid individual `initialize`. That request is negotiated by its body whatever header it carries, and receives `2025-06-18` when it
  asks for a version Cited does not support.
- Every other request with an unsupported header is still refused with `400`, as today.
- The spec `mcp-server` states it, with a scenario for the `initialize` that carries a newer header.
- Round 2 restricts the exception to the valid envelope and bounds every POST read to 1 MiB and 10 seconds total,
  returning 413 on overflow and 408 on timeout with cancellation and cleanup. See `design.md` and the added requirements.

Found by Fable while connecting Cited to Franc's Hermes ("ahorita pruébalo en mi hermes que ya tiene ia configurada,
pero actualízalo"). Fable writes and implements this small fix as a recorded exception to the separation of roles;
Codex reviewed round 1 and found two Majors and two Minors. Fable's round-2 assignment explicitly asks Codex to
implement those corrections and assigns the subsequent independent review to Fable. The change remains open for that
handoff; Codex does not independently approve its own implementation.

## Impact

- `app/api/mcp/route.ts`, `tests/mcp-route.test.ts`, `openspec/specs/mcp-server/spec.md` (on archive).
- No change to the tools, the token, the rate limit or the supported versions.
