# Initialization exception and bounded reads

## Scope and ownership

Fable's round-2 assignment approves the four corrections on 2026-10-09. Codex records that approved contract and
implements it; Fable performs the subsequent independent review. Retain the assigned existing
`fix/mcp-initialize-version-header` branch and PR #21. No merge or deployment belongs to this round. Archive follows
Fable's independent review.

## Decisions

1. Preserve 404, 403, 401 guards in that order before accessing the body reader or Content-Length.
2. Recognize a single non-array initialize object with jsonrpc 2.0, an own string or finite integer ID, and object
   params containing a non-empty string protocolVersion. Do not add batch handling or broaden unrelated validation.
3. Bound every authenticated POST to 1 MiB and 10 seconds total. These are product budgets approved by the assignment,
   not MCP constants. A MiB accommodates the small tool argument envelopes while bounding buffering; ten seconds
   allows ordinary uploads while bounding stalled connections.
4. Reject declared oversized bodies before acquiring the reader. Count actual Uint8Array.byteLength for every chunk,
   including multibyte UTF-8, missing and understated headers. Decode the bounded bytes once to preserve characters
   split across chunks, then parse JSON.
5. Use one deadline across all reads, never reset it per chunk. Race reads against it and check monotonic elapsed time
   between reads. Cancel on read error, overflow and timeout, without awaiting potentially uncooperative cancellation.
   Release the reader and clear the timer in finally.
6. Limits return plain no-store HTTP 413/408; malformed JSON and read errors retain the HTTP 400 JSON-RPC parse error.
   The body determines valid initialization negotiation; subsequent unsupported headers still receive HTTP 400.

## Validation

Add regression tests before implementation, with a dispatch spy proving rejected messages cannot run tools. Preserve
the real route/protocol/tools suites. Verify database state using read-only SQLite queries around seeded real-handler
calls with deterministic providers. Run all unit tests, lint, types, strict OpenSpec validation, curl and an isolated
Next build. Existing Playwright coverage runs in PR CI; no frontend changes are introduced. Keep reports here.

Historical Hermes evidence lives in the private coordination workspace at `tasks/evidencia-hermes-cited/` and
`tasks/aceptaciones.md`. Cite filenames and hashes without copying private conversation content into the public repo.
Historical runs are not independently reproduced by Codex in this round.

## Existing test adjustment

The full-suite red run shows that the README maturity test scans every header of any delta containing ADDED.
Its assertion must inspect only the ADDED sections: MODIFIED transport requirements correctly already exist in the
base spec. Keep the prohibition against prematurely copying added requirements and scenarios into the base spec.
