Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task, except recording decision
1b in `design.md` as task 2.2 says. Evidence rule: every `[x]` needs a real report that supports it at archive time; a
report in a later commit than its mark is recorded, not blocking, unless it is missing or contradicts the mark.
Reports: `reports/2026-09-29-step-N-<name>.md`. No network call to a real provider in any test.

## 0. Step 0: the branch

- [ ] 0.1 Work on `feature/core-hybrid-search`, created by Fable from `main` (`2e1e580`); confirm branch and base —
      report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [ ] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict` — report:
      `reports/2026-09-29-step-1-base-before.md`
- [ ] 1.2 The state of the database: no store exists before this change; prove it — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. The spike

- [ ] 2.1 `tests/spike/libsql-capabilities.test.ts` as design decision 1, run on Windows and in a `node:24` Linux container;
      paste the statements and results — report: `reports/2026-09-29-step-2-spike.md`
- [ ] 2.2 Record decision 1b in `design.md` (libSQL, or the `better-sqlite3` + `sqlite-vec` fallback) quoting the report;
      this is the only design text the implementer writes — report: `reports/2026-09-29-step-2-spike.md`

## 3. Tests first

- [ ] 3.1 Red tests for every scenario of `specs/knowledge-search/spec.md` before the modules exist: renamed file, broken
      file, limits, re-ingestion, missing key, keyword-only match, meaning-only match, plus RRF arithmetic on a fixed
      example — report: `reports/2026-09-29-step-3-tests-first.md`

## 4. Implementation in small steps

- [ ] 4.1 The store and its schema — report: `reports/2026-09-29-step-4-implementation.md`
- [ ] 4.2 Type detection, limits and the three parsers, with their licenses checked — report:
      `reports/2026-09-29-step-4-implementation.md`
- [ ] 4.3 Chunking with headings — report: `reports/2026-09-29-step-4-implementation.md`
- [ ] 4.4 The embeddings interface and its three providers — report: `reports/2026-09-29-step-4-implementation.md`
- [ ] 4.5 Hybrid search with RRF — report: `reports/2026-09-29-step-4-implementation.md`
- [ ] 4.6 The CLI scripts and the sample corpus — report: `reports/2026-09-29-step-4-implementation.md`

## 5. Review and update of the existing tests

- [ ] 5.1 The existing suite (smoke, personal paths, workflow contracts) still passes; say what changed — report:
      `reports/2026-09-29-step-5-existing-tests.md`

## 6. Run the checks and the state of the store

- [ ] 6.1 `npm test` on Windows and in `node:24` Linux, `npm run typecheck`, `npm run lint`, `npm audit --audit-level=high`,
      gitleaks, `openspec validate --all --strict`, `git diff --check` — report: `reports/2026-09-29-step-6-checks.md`
- [ ] 6.2 The state of the store before and after the tests: counts of documents and passages in the test file, and proof
      that tests leave no store file behind — report: `reports/2026-09-29-step-6-checks.md`

## 7. Manual verification (the CLI plays the role of curl in this change: there is no HTTP route yet)

- [ ] 7.1 `npm run ingest -- samples/` and three `npm run search -- "<question>"` with the fake provider, pasting the
      top results; one question in Spanish and one in English — report: `reports/2026-09-29-step-7-manual.md`

## 8. End-to-end

- [ ] 8.1 Not applicable: no page changes in this change; say so — report: `reports/2026-09-29-step-8-e2e.md`

## 9. Documentation and RAM

- [ ] 9.1 `docs/search.md`: how ingestion, chunking and hybrid search work, the providers and their variables, the parser
      licenses, the measured RAM, and the store decision; `.env.example` with the new names and empty values — report:
      `reports/2026-09-29-step-9-docs.md`
- [ ] 9.2 The delivery `katalis-dev/tasks/entrega-community-02.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`
