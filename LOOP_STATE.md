# LOOP_STATE · Cited

STATUS: DONE
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: section 10 of the contract, tasks 10.1 to 10.8 — what the review of Codex reproduced
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main, "Write the product context of Cited: the owner, the visitor, and what the design must honour"); the
change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching the server")
HEAD AT THE START OF THE ROUND: 9a47f41 ("Keep provider errors and private networks out, hold the test limit, and
record the store")
HEAD AT THE END OF THE ROUND: the closing commit that carries this file, the report of section 10 and the eight marks
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-12.md` (the adversarial review of Codex, FAIL): the Blocker
B-1 (a saved key could return to the browser inside the raw error of the provider), the Majors M-1 (SSRF through
`baseUrl`), M-2 (forty concurrent tests evaded the limit of twenty), M-3 (the contract contradicts itself about variable
names outside "For the installer"), M-4 (two E2E boxes marked without the evidence their text asks for, and the read of
every `/api/admin/*` response), M-5 (no state of the database before and after) and the Minors m-1 (the commit count)
and m-2 (gitleaks recorded for every commit). Tests first and red before each fix, reproducing what the review
reproduced.

## What was delivered

- **10.1, the Blocker**: `lib/guards/outbound.ts` (the last door: every shape of a key, the name of a variable, one
  line and a cap), `/api/ask` answering its own closed sentences and never quoting the provider, `withClosedReason()`
  for the test and the save routes, `sanitizeOutbound()` in the reindex, the document upload and the re-ingestion, and
  `embeddingsConfigured()` for the public route. `c016b81`.
- **10.2, the Major of the address**: `lib/providers/address.ts` (own address only for Ollama, LM Studio and a custom
  endpoint; the official host of the server for a cloud provider; `https`, and `http` only to a local host with
  `ALLOW_LOCAL_PROVIDERS=1`; every resolved answer checked against loopback, link-local, RFC 1918, CGNAT, metadata,
  multicast and documentation; and no redirect followed), wired into the test and the save routes before the limit is
  spent, with the seventh word of the interface in English and Spanish, `ALLOW_LOCAL_PROVIDERS` in `.env.example` and
  the section in `docs/providers.md`. `9a56392`.
- **10.3, the Major of the limit**: `reserveProviderTest()` in the store, one atomic batch that deletes the old windows,
  inserts and returns the count; the decision is taken there and never before it. Of forty simultaneous tests, twenty
  reach the provider and twenty read `429`. `f62849f`.
- **10.4, the Major of the contract**: `panelEmbeddingsProblem()`, the state in the words of the owner, and the two
  panel routes that render a message using it; the diagnostic that names the variables stays for the command line, and
  a new suite renders every page of the panel and compares its text with every variable of `.env.example`, read from
  the template. `02dfe38`.
- **10.5, the Major of the evidence**: `affiliateUrlOf()` and `<PROVIDER>_AFFILIATE_URL`, a third service of the panel
  with the switch on, `e2e/affiliate.spec.ts` reading the fifteen routes of `/api/admin/*`, the pages, the raw bytes of
  the store and the row of `provider_settings`, and `tests/affiliate-links.test.ts` guarding the list of the routes.
  `be5509e`.
- **10.6, the Major of the gap**: `npm run store:state`, the tables of the schema with their row counts and the three
  this change added marked, with the state before (eight tables of the schema, none of the three) and after (the row
  with the `v1:` ciphertext and never the key) written in the report. `388c6f5`.
- **10.7 and 10.8**: the count of the commits of the delivery corrected to what it is, gitleaks recorded for each
  commit of the round, and the battery on Windows and in a `node:24` Linux container from a clean clone.

## Evidence

- Reports: `openspec/changes/provider-keys-in-panel/reports/2026-09-29-step-10-review-fixes.md` (the report of this
  section, with the command, the commit and the output of every task) and the reports of the steps 0 to 9.
- The numbers of the review, now the other way around: `leaks_saved_key=false`, `internal_requests=0`, `allowed=20` of
  40 simultaneous tests.
- `npm test`: 51 files and 457 tests green on Windows (21.13 s); 51 files, 455 green and 2 skipped in a `node:24` Linux
  container from a clean clone (v24.21.0, 103.35 s).
- `npm run test:e2e`: 30 tests green (28 before: the two new ones are the affiliate switch on and the full read of the
  administrative answers).
- `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high` (0 vulnerabilities), `gitleaks git` (324 commits,
  no leaks), `openspec validate --all --strict` (11 items) and `git diff --check main...HEAD`: green.
- The round: seven commits, 38 files, 2 941 lines added and 227 removed. The branch carries 18 commits over the
  contract: ten between `71f08f0` and `5404823`, `9a47f41` and the seven of this round.

## The issues that stay open

- `ALLOW_LOCAL_PROVIDERS=1` is what an installation with its own Ollama or LM Studio needs, and it also allows a local
  `http` address: whoever has the session of the panel can point a provider at a service of the machine. It is the
  decision the spec asks for, and it is written down in `.env.example` and in `docs/providers.md`.
- The address rules resolve the name in the server and `fetch` resolves it again: a DNS that changes its answer between
  the two (rebinding) is not closed, because `fetch` of Node does not offer pinning the resolved address without a
  transport of its own.
- No affiliate URL of a real programme is committed: the switched-on path is proven in a browser with a virtual link,
  and the day Franc joins a programme the variable has to be set and the label looked at again.
- No test calls a real provider and none opens a real private network: the doubles listen on `127.0.0.1` and the
  private addresses are refused by the guard, with controlled resolutions.
- The widget spec failed once in an intermediate run by resource contention and passed in the two following runs.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.

## Hard rules respected

- No `.env` file with secrets was opened (the repository has none: `Test-Path .env` is `False`); only the public
  template `.env.example` was edited.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- `community` and `community-preview` were not touched: the disposable worktree of this round lived inside
  `community-ins` (`.tmp-store-before`), was used to read the schema of the version before the change, and was removed
  and pruned.
- No test calls a real provider: the local doubles of `tests/provider-double.ts`, the doubles the specs serve on
  `127.0.0.1` and the deterministic `fake` run everything.
- No real key in the repository: the keys of the suites are generated by the run or strings of the test, and two of the
  commits were refused by the gitleaks hook until a synthetic key stopped being written as one literal.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs was edited: the only change in `tasks.md` is the box of each task
  of section 10.
