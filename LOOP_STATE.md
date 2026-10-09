# LOOP_STATE · Cited, change `mcp-server`

STATUS: DONE
CHANGE: mcp-server (OpenSpec), new capability `mcp-server`
BRANCH: feature/mcp-server
BASE: f644f85 (`origin/main`, the close of launch-hygiene)
VERIFIED COMMIT: 1788899 (`Serve the documents of Cited over MCP: the route, the two tools and the gate`)
AGENT: DeepSeek (implementer); every step of section 10.4 is Fable's
DATE: 2026-10-08
RUNTIME: Node v24.21.0

## Objective

Cited as an MCP server: `app/api/mcp/route.ts`, the stateless Streamable HTTP transport, the two read-only tools
(`cited_search`, `cited_ask`), the token, the limits and the documentation, until `scripts/gate-mcp.mjs` prints
`GATE: GREEN`.

## Result

`node scripts/gate-mcp.mjs` ends with `GATE: GREEN`, exit 0, on the commit `1788899`: typecheck, lint, 1129 cases of the
suite over 94 files, `next build` (with `/api/mcp` among the routes), `openspec validate --all --strict` 14 of 14,
`gitleaks git` with no leak over 639 commits, and every assertion of the endpoint against a production server on port
3230 with the token and on port 3231 without it. The one line that is not green is `audit:high`, which is red for the
same 7 high findings on the base `f644f85` (the two manifests are byte-identical, this change adds no dependency): the
gate names it in its own line and the delivery lists it as BROKEN, because fixing it means upgrading `next`.

## Phase

Closed. The delivery Franc reads is `katalis-dev/tasks/entrega-cited-mcp-server.md`, in Mexican Spanish, with the table
of the gate, the manual verification with `curl` and the `## Issues`. The review, the connection of each client and the
archive of the change are the step 10.4 of `tasks.md`, and they are Fable's.

## Progress

- **Spec** (`80e411e`): `openspec/changes/mcp-server/` with `proposal.md`, `design.md` (the fifteen decisions and the
  sections of the MCP specification 2025-06-18 that are followed), `tasks.md` and the capability; `openspec validate
  mcp-server --strict` exit 0. Report `reports/2026-10-08-step-1-spec.md`.
- **Tests first** (`3f4a9c6`): `tests/mcp-protocol.test.ts`, `tests/mcp-tools.test.ts`, `tests/mcp-route.test.ts` and
  `tests/mcp-helpers.ts`, red because the modules did not exist. Report `reports/2026-10-08-step-2-red.md`.
- **Implementation** (`1788899`): `lib/mcp/` (protocol, server, tools, auth, limits), `app/api/mcp/route.ts`,
  `lib/guards/bearer.ts` with `lib/voice/secret.ts` re-exporting it, and the `quota` input of `lib/answer/ask.ts`. The
  three files of step 2 green with 49 cases. Reports of the steps 3 to 10 in the same folder.
- **Documentation** (`1788899`): `docs/mcp.md`, the bilingual section of both READMEs with the map of the twin updated,
  `.env.example`, `docs/development-guide.md` and `docs/security.md`.

## Evidence

- `scripts/gate-mcp.mjs`, `GATE: GREEN`: the full list of its assertions is in
  `reports/2026-10-08-step-7-gate.md`; the checks of the repository and the audit are in
  `reports/2026-10-08-step-5-checks.md`.
- The manual verification of `reports/2026-10-08-step-6-manual.md` ran a real server of the build: `401` with
  `WWW-Authenticate`, `403` of a foreign origin, `202` without a body, `-32601`, `405`, `400` of the version header,
  `404` without the token, and the passage of `samples/cafe-la-horquilla.md` with its 380 pesos.
- `scripts/mcp-smoke.mjs` ended in `SMOKE: GREEN` against that server.
- `scripts/mcp-seed.ts` filled the store of the manual run with the four documents of `samples/` in keyword mode.

## The sandbox of this machine

Two facts of this Windows sandbox, both measured by the gate and named in its lines and in the delivery: a child
process with piped stdio is refused (`EPERM`), and the suite ends with the access violation of the platform
(`0xC0000005`) in about one of twenty processes of the threads pool. The gate adapts to the first with two shims
installed only when it measures the refusal (the pipes become temporary files; the production build sends the workers
of Next.js to the thread pool) and to the second by running the files in chunks of five and repeating a chunk whose
process ended that way. On a machine that allows pipes the gate runs every command untouched.

## Hard rules respected

- No `.env` with secrets was opened and none exists in the worktree; no push, no remote, no commit on `main`, no
  archive; `MEMORY.md` is in no commit; the other worktrees of the suite were not touched and no process of another
  session was stopped.
- No personal path in a versioned file (the reports write `<worktree>`, `<temp>` and `<token>`); the literal token of
  the manual run was replaced by `<token>` and the commit was amended so the history carries no such value
  (`gitleaks git` over 639 commits: no leak).
- Commits in English, small, one per step of the contract with its evidence; the code, the specs, the tests and this
  file are in English; the delivery Franc reads is in Mexican Spanish.
