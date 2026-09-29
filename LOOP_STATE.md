# LOOP_STATE · Cited

STATUS: DONE
CHANGE: core-hybrid-search (OpenSpec)
BRANCH: feature/core-hybrid-search
BASE: 2e1e580 (main)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the review round of the contract `openspec/changes/core-hybrid-search/tasks.md`, section 10, written by Fable
after the adversarial review `katalis-dev/tasks/revision-community-02.md` (0 Blockers, 3 Majors). The three Majors were
reproduced first and corrected tests first, in small commits, each `[x]` with its report.

## What was delivered

- **10.1, Major 1**: `tests/ingest.test.ts` spies on `PDFParse#getText()` and proves zero calls for a PDF refused by
  its page count. `parsePdf` asks `getInfo()` for the count first and only then extracts the text; `parseFile` passes
  `limits.maxPages` down, so the check no longer runs after the extraction.
- **10.2, Major 2**: `tests/store-remote.test.ts` doubles the libSQL client and covers both scenarios of the new
  requirement: a remote URL with an empty `TURSO_AUTH_TOKEN` stops before a client exists, a remote URL with a token
  creates the client with it as `authToken`, and a local `file:` URL needs none. `.env.example` and `docs/search.md`
  name the variable and say when it is required.
- **10.3, Major 3**: the keyword-only test uses `mantenimiento` (the keyword ranking puts its passage first and the
  vector ranking does not) and the meaning-only test uses `¿Aceptan reprogramaciones gratuitas avisando
  anticipadamente?` (the keyword ranking is empty). With the vector branch disabled only the meaning-only test fails;
  with the keyword branch disabled only the keyword-only test fails; both pass with the real search. The step 3 and
  step 4 reports whose figures contradicted the real corpus are corrected.
- **10.4**: the battery is green on Windows and in a `node:24` Linux container with `--network none`; the round is
  appended to `katalis-dev/tasks/entrega-community-02.md` under its own heading with `## Issues`.

The report with every command, commit and real output is
`openspec/changes/core-hybrid-search/reports/2026-09-29-step-10-review-round.md`. The four boxes 10.1 to 10.4 are `[x]`
and the diff of `tasks.md` is four `[ ]` converted into `[x]`: the text of no task was edited.

## State of the tree

The tree is clean on `feature/core-hybrid-search`. `main` still points at `2e1e580`, no remote was contacted, nothing
was pushed and nothing was archived.

## Commits of the round (all on feature/core-hybrid-search, none in main)

| SHA | Message |
|---|---|
| `e033c8b` | chore(core-hybrid-search): open the review round of the contract |
| `ee7f411` | test(core-hybrid-search): spy the pdf text extraction before the page limit |
| `dc81a18` | fix(core-hybrid-search): refuse a pdf by its page count before extracting text |
| `5eaed5f` | test(core-hybrid-search): prove a remote store needs and uses its token |
| `ce205c5` | feat(core-hybrid-search): authenticate a remote libSQL store with its token |
| `17a2989` | docs(core-hybrid-search): document the page count check and the store token |
| `2435664` | test(core-hybrid-search): isolate the keyword-only and meaning-only rankings |
| `c66d71a` | docs(core-hybrid-search): correct the corpus figures of the search reports |
| `f119d0c` | docs(core-hybrid-search): report the review round of the contract |
| `f79d62c` | chore(core-hybrid-search): mark the review round of the contract |

The closing commit carries this state file; a commit cannot list its own hash, so the table stops at the ten commits of
the work itself.

## Closing battery

Windows 11, Node `v24.11.0`, clean tree: `npm test` 10 files and 72 tests passed, `npm run typecheck`, `npm run lint`,
`npm audit --audit-level=high` (0 vulnerabilities), `npm run secrets:scan` (62 commits, no leaks found),
`openspec validate --all --strict` (4 passed) and `git diff --check main...HEAD` all exit 0. Linux x64, image
`node@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4`, Node `v24.21.0`, native clone of the
closing tree outside the repository: `npm ci` installed 496 packages with 0 vulnerabilities and `npm test` passed 10
files and 72 tests with `--network none`.

## Hard rules respected

- No `.env` file was opened: only the tracked template with empty values, which the task asks to keep updated.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the suite uses the deterministic fake provider, one HTTP double on
  `127.0.0.1` and a doubled libSQL client module.
- No secret, no client data and no text of the Construye book in any file; no personal path in any tracked file.
- No `MEMORY.md` in any commit.
- UTF-8 with LF in every file written or modified; `git ls-files --eol` reports no CRLF and no mixed ending.

## Pending and out of scope

- **NOT DONE**: the GitHub pipeline, because a push is forbidden here; the equivalent battery ran locally on Windows
  and in the disposable `node:24` container.
- **NOT DONE, reserved for Fable and Codex**: the independent confirmation of the three Majors, the archive of the
  change and its merge. Archiving needs the explicit OK of Franc.
- **UNKNOWN**: the behaviour of a real Turso database (the contract of the client is proved with a double, never the
  network) and the quality of a real embeddings provider on a real corpus, which the plan already names as a risk.
