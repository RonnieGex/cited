# Task B verification

- Date: 2026-10-09
- Change: `agents-readme`
- Branch: `docs/agents-readme`
- Agent: Codex, implementer
- Base: `4f4c000` from `origin/main`; results below cover the working changes prepared for the first commit.
- Authority: Fable's Task B, explicitly commissioned by Franc. This is implementation verification, not an
  independent adversarial review. Fable retains that review and the merge.

## Executed commands

| Command | Result |
|---|---|
| `git -C community-main worktree add ../community-readme -b docs/agents-readme origin/main` | Created at `4f4c000` |
| `npx -y -p node@24 -c "node --version && npm ci --no-audit --no-fund"` | 693 packages installed; the Windows npm shim used Node 24.11 and emitted engine warnings. Subsequent validation explicitly invoked Node 24.21.0 |
| `npx -y -p node@24 node --version` | `v24.21.0` |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts` before implementation | 6 failed, 38 passed: missing MCP row and agent graphics |
| Same README command after implementation | 45 passed, 0 failed |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run` | 96 files, 1166 tests passed in 78.88 s; subsequent renderer refinements also passed the targeted 45 tests |
| `npx -y -p node@24 node node_modules/eslint/bin/eslint.js .` | Exit 0 |
| `npx -y -p node@24 node node_modules/eslint/bin/eslint.js scripts/render-readme-graphics.mjs scripts/readme-graphics/manifest.mjs scripts/readme-graphics/data.mjs tests/readme.test.ts` | Exit 0 after final renderer refinements |
| `npx -y -p node@24 node node_modules/next/dist/bin/next typegen` | Route types generated |
| `npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit` | Exit 0 after giving the language pairs a readonly tuple type |
| `npx -y -p node@24 node scripts/render-readme-graphics.mjs agents roadmap` | Four PNGs rendered, no overflow, Outfit loaded, minimum text 16 px |
| `npx -y -p node@24 node ../tasks/verify-agents-b.mjs` | Repeated agents render byte-identical; invalid graphic rejected with exit 1 before writes |
| `npx -y -p node@24 node "$env:APPDATA/npm/node_modules/@fission-ai/openspec/bin/openspec.js" validate --all --strict` | 15 passed, 0 failed |
| Same OpenSpec CLI: `status --change agents-readme --json` and `instructions apply --change agents-readme --json` | All four artifacts present; requirements and tasks loaded for verification |
| `git diff --check` | Exit 0 |

The selective-render assertion hashes both READMEs, the graphics record, both demo PNGs, both agent PNGs and the
isolated database before and after `agents`. It also asserts the exit code and error for `unknown-graphic` and
checks the same hashes. No runtime files, dependencies or lockfiles changed.

## Database before and after the README test

Executed `npx -y -p node@24 node scripts/mcp-seed.ts .data/agents-readme.sqlite samples/`, then
`npx -y -p node@24 node scripts/store-state.ts .data/agents-readme.sqlite` before rendering and the 45 README tests,
and again afterwards. This is an isolated sample database, not the capture server's store.

- Both readings: 139264 bytes, 15 tables plus 5 FTS shadow tables; 4 documents, 11 passages, 11 FTS rows,
  4 document-index rows. Other application tables contain zero rows.
- SHA-256 before and after: `F2CFBFB299FF3CE0914D552E4027993D35DD1B84D11CC85597ED339D5CE7E7F5`.
- The existing state reader labels some historical tables as added by its own change. This README change adds none.

## HTTP evidence

Executed `curl.exe --silent --show-error --fail-with-body --config - http://127.0.0.1:3240/api/mcp --data-binary @<request-file>`
three times. A config passed through stdin carried the bearer header read from the assigned temporary token file;
the token was never printed or written to the evidence. JSON-RPC methods and saved responses:

- `initialize`, revision `2025-06-18`: HTTP 200, `2026-10-09-curl-initialize.json`.
- `tools/list`: HTTP 200, both tools, `2026-10-09-curl-tools-list.json`.
- `tools/call`, `cited_search`, query `afinación de bicicleta`, limit 2: HTTP 200, sample passages including
  the 380-peso tune-up, `2026-10-09-curl-search.json`.

These calls verify the endpoint only. Client compatibility derives from Fable's archived
`2026-10-09-mcp-server/reports/2026-10-09-step-10-4-review-and-clients.md`. No desktop app or profile was opened.

## Graphics

Inspected both agent themes and the roadmap. The agent image is an editorial summary of recorded evidence, not a
terminal screenshot or a new model transcript. No claim of a Claude Code or Codex tool call is made.

| File under `docs/images/` | Dimensions | Bytes | Longest empty band |
|---|---|---|---|
| `agents-dark.png` | 1280 x 640 | 30178 | 59 px, limit 160 |
| `agents-light.png` | 1280 x 640 | 29853 | 59 px, limit 160 |
| `roadmap-dark.png` | 1280 x 720 | 54135 | 32 px, limit 180 |
| `roadmap-light.png` | 1280 x 720 | 54536 | 32 px, limit 180 |

The existing image tests check luminance, links, image budget, matching roadmap rows and both themes. The new tests
check the MCP row in each language and preserve client scope and evidence links. The manifest records the new
flat palette per graphic. Asset and development documentation explain the generation commands and evidence limits.

## Specification verification

| Dimension | Result |
|---|---|
| Correctness | Both scenarios of the one added requirement are implemented and covered by README guards |
| Coherence | Existing renderer, manifest, local font, brand palette and archived client evidence reused |
| Completeness | Local implementation and verification complete; PR checks and Fable's independent review remain separate closure steps |

## Issues

- NOT DONE: CI results are recorded in the delivery once the requested PR runs all required checks.
- NOT DONE: Fable's independent adversarial review, archive and merge. Do not interpret this implementer report as
  PASS from an independent reviewer. The assignment explicitly reserves the review and merge for Fable.
- UNKNOWN: A real tool call from Claude Code or Codex, and Cursor compatibility. The graphics preserve these limits.
