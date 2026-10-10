# Step 8: independent review by Fable (round 2)

- Date: 2026-10-09, America/Mexico_City.
- Reviewed commit: `1cb8d4b` (implementation `623b8b9`), branch `fix/mcp-initialize-version-header`, PR #21.
- Reviewer: Fable. Codex implemented round 2; Codex does not review its own code.

## Verdict: PASS

## What was checked

- **Valid initialize only.** `isInitialize` in `app/api/mcp/route.ts` requires a non-array object, `jsonrpc` `2.0`,
  method `initialize`, an own `id` that is a string or a finite integer, and object `params` with a non-empty string
  `protocolVersion`. Notifications, envelopes without `jsonrpc`, `null` or object ids, missing or array `params` and
  batches keep the `400` of an unsupported header.
- **Bounded read.** `lib/mcp/body.ts` refuses a declared `Content-Length` above 1 MiB before acquiring a reader,
  counts the real bytes when the header is absent or wrong, races every read against one 10-second deadline, cancels
  the reader without awaiting the cancellation, and clears the timer and releases the lock in `finally`. A garbage
  `Content-Length` (`NaN`) falls back to counting real bytes. A missing body is a parse error (`400`).
- **Guard order.** 404, 403 and 401 still run before any read.
- **`tests/readme.test.ts`.** The parser now reads only the `ADDED Requirements` sections of a delta. The old parser
  flagged every `MODIFIED` requirement as a hand copy, because a modified requirement exists in the live spec by
  definition. Scenarios added inside a `MODIFIED` requirement are no longer checked for hand copies; that check cannot
  tell them from the existing ones without the base version, so the narrower rule is accepted.

## Real client against this exact build

Build of `1cb8d4b` in a separate worktree (`community-cited-live`), served on `127.0.0.1:3240` with the public samples
and a local test token, read by the Hermes Agent of Franc, v0.21.6+387 (`dce1e9b`) on Windows:

- `hermes mcp test cited`: "Connected (3221ms)", "Tools discovered: 2".
- `hermes chat --oneshot -q "Is there a guarantee on repairs at the bike workshop?" --format stream-json`: the agent
  called `mcp__cited__cited_ask` and `mcp__cited__cited_search`; `cited_ask` returned "Every repair carries a 90 day
  guarantee on the work, and parts carry the guarantee of their maker [1]" from `bike-workshop-policies.md · Guarantee`,
  and the final answer kept that content and named the source.

## Minor, outside this change

- The agent's final English answer named the source but dropped the `[1]` mark that `cited_ask` returned. That is the
  agent's formatting, handled by the Hermes integration (skill and verifier), not by this endpoint.
