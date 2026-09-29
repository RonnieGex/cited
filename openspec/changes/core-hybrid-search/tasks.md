Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task, except recording decision
1b in `design.md` as task 2.2 says. Evidence rule: every `[x]` needs a real report that supports it at archive time; a
report in a later commit than its mark is recorded, not blocking, unless it is missing or contradicts the mark.
Reports: `reports/2026-09-29-step-N-<name>.md`. No network call to a real provider in any test.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/core-hybrid-search`, created by Fable from `main` (`2e1e580`); confirm branch and base —
      report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict` — report:
      `reports/2026-09-29-step-1-base-before.md`
- [x] 1.2 The state of the database: no store exists before this change; prove it — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. The spike

- [x] 2.1 `tests/spike/libsql-capabilities.test.ts` as design decision 1, run on Windows and in a `node:24` Linux container;
      paste the statements and results — report: `reports/2026-09-29-step-2-spike.md`
- [x] 2.2 Record decision 1b in `design.md` (libSQL, or the `better-sqlite3` + `sqlite-vec` fallback) quoting the report;
      this is the only design text the implementer writes — report: `reports/2026-09-29-step-2-spike.md`

## 3. Tests first

- [x] 3.1 Red tests for every scenario of `specs/knowledge-search/spec.md` before the modules exist: renamed file, broken
      file, limits, re-ingestion, missing key, keyword-only match, meaning-only match, plus RRF arithmetic on a fixed
      example — report: `reports/2026-09-29-step-3-tests-first.md`

## 4. Implementation in small steps

- [x] 4.1 The store and its schema — report: `reports/2026-09-29-step-4-implementation.md`
- [x] 4.2 Type detection, limits and the three parsers, with their licenses checked — report:
      `reports/2026-09-29-step-4-implementation.md`
- [x] 4.3 Chunking with headings — report: `reports/2026-09-29-step-4-implementation.md`
- [x] 4.4 The embeddings interface and its three providers — report: `reports/2026-09-29-step-4-implementation.md`
- [x] 4.5 Hybrid search with RRF — report: `reports/2026-09-29-step-4-implementation.md`
- [x] 4.6 The CLI scripts and the sample corpus — report: `reports/2026-09-29-step-4-implementation.md`

## 5. Review and update of the existing tests

- [x] 5.1 The existing suite (smoke, personal paths, workflow contracts) still passes; say what changed — report:
      `reports/2026-09-29-step-5-existing-tests.md`

## 6. Run the checks and the state of the store

- [x] 6.1 `npm test` on Windows and in `node:24` Linux, `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high`,
      gitleaks, `openspec validate --all --strict`, `git diff --check` — report: `reports/2026-09-29-step-6-checks.md`
- [x] 6.2 The state of the store before and after the tests: counts of documents and passages in the test file, and proof
      that tests leave no store file behind — report: `reports/2026-09-29-step-6-checks.md`

## 7. Manual verification (the CLI plays the role of curl in this change: there is no HTTP route yet)

- [x] 7.1 `npm run ingest -- samples/` and three `npm run search -- "<question>"` with the fake provider, pasting the
      top results; one question in Spanish and one in English — report: `reports/2026-09-29-step-7-manual.md`

## 8. End-to-end

- [x] 8.1 Not applicable: no page changes in this change; say so — report: `reports/2026-09-29-step-8-e2e.md`

## 9. Documentation and RAM

- [x] 9.1 `docs/search.md`: how ingestion, chunking and hybrid search work, the providers and their variables, the parser
      licenses, the measured RAM, and the store decision; `.env.example` with the new names and empty values — report:
      `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-02.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`

## 10. Review round (contract written by Fable after `revision-community-02.md`)

Evidence rule as above. Report: `reports/2026-09-29-step-10-review-round.md`. Commit in small steps on
`feature/core-hybrid-search`: the commits are part of the implementer's work.

- [ ] 10.1 Major 1, tests first: a PDF above 500 pages is refused from its page count before any text is extracted;
      prove it with a spy on the text extraction that records zero calls for the refused file; paste the red run
- [ ] 10.2 Major 2, tests first: the requirement "A remote libSQL database authenticates with its token" with its two
      scenarios; `.env.example` and `docs/search.md` name `TURSO_AUTH_TOKEN` with an empty value
- [ ] 10.3 Major 3: the keyword-only and meaning-only tests isolate their ranking. Prove it by mutation: with the
      vector branch disabled the meaning-only test fails, with the keyword branch disabled the keyword-only test fails,
      and both pass with the real search; paste the three runs. Correct the reports whose figures contradict the
      real corpus
- [ ] 10.4 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`;
      append the round to `katalis-dev/tasks/entrega-community-02.md` under its own heading with `## Issues`
