## 0. Step 0: the branch

- [x] 0.1 `fix/mcp-initialize-version-header`, created from `origin/main` at `a044405`.

## 1. Spec, before any code

- [x] 1.1 The delta of `mcp-server` with the new scenario. Evidence: `openspec validate --all --strict` prints
      `Totals: 20 passed, 0 failed (20 items)`.

## 2. Tests first

- [x] 2.1 `tests/mcp-route.test.ts`: an `initialize` with `MCP-Protocol-Version: 2025-11-25` (and `2024-11-05`) is
      answered `200` with `protocolVersion` `2025-06-18`. Evidence before the fix: `Tests 1 failed | 14 passed (15)`,
      `2025-11-25: expected 400 to be 200`.
- [x] 2.2 The existing refusal of an unsupported header on `tools/list` still passes.

## 3. The fix

- [x] 3.1 `app/api/mcp/route.ts` reads the body first and checks the header only when the message is not
      `initialize`.

## 4. Verification

- [x] 4.1 `tests/mcp-route.test.ts`, `tests/mcp-protocol.test.ts` and `tests/mcp-tools.test.ts`: `Tests 50 passed (50)`;
      `tsc --noEmit` exit 0; eslint on the two changed files clean; `next build` green.
- [x] 4.2 Real client, Hermes Agent v0.21.6+387 (`dce1e9b`) on Windows, 2026-10-09: before the fix `hermes mcp test
      cited` failed with "the protocol version 2025-11-25 is not supported"; after it, "Connected" and "Tools
      discovered: 2". The Hermes desktop app then answered "380 pesos [1]" from `cafe-la-horquilla.md · Precios` and
      produced a quote PDF whose every figure appears in the sample documents.
- [ ] 4.3 Adversarial review by Codex before the merge.
