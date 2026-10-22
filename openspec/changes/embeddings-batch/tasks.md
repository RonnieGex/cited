# Tasks: embeddings-batch

Branch `feature/embeddings-batch` from `main`. Reports live in `reports/`, with the exact command and its output.
A task is `[x]` only with evidence.

## 0. Branch

- [x] 0.1 `git switch -c feature/embeddings-batch` from `main` at `5527f6b`. Evidence:
      [step 1](reports/2026-10-21-step-1-tdd.md).

## 1. Tests first

- [x] 1.1 Write `tests/embeddings-batch.test.ts`: the rule of the value (absent, `16`, `4`, empty, `0`, `-8`,
      `2.5`, `abc`) and the four scenarios of the spec with a recording provider over the fake embeddings, for the
      ingestion and for the re-index. Run it red before any code. Evidence: two red runs and the green run in
      [step 1](reports/2026-10-21-step-1-tdd.md).

## 2. Implementation in small steps

- [x] 2.1 `lib/embeddings/batch.ts`: `DEFAULT_EMBEDDINGS_BATCH` and `resolveEmbeddingsBatch(environment)`.
      Evidence: [step 1](reports/2026-10-21-step-1-tdd.md), commit `1d09bb6`.
- [x] 2.2 `lib/ingest/index.ts` and `lib/settings/indexing.ts`: `embedAll` reads the number from
      `resolveEmbeddingsBatch()` at the start of each call; the constant `32` leaves both files. Evidence:
      [step 1](reports/2026-10-21-step-1-tdd.md), commit `1d09bb6`.

## 3. Existing tests

- [x] 3.1 Run `tests/ingest.test.ts`, `tests/provider-search.test.ts`, `tests/readme.test.ts` and
      `tests/admin-pages-variables.test.ts`, the suites that read the ingestion, the re-index, the configuration
      table and the template. Evidence: [step 1](reports/2026-10-21-step-1-tdd.md), 76 passed.

## 4. Run the tests

- [x] 4.1 `npm run typecheck`, `npm run lint`, `npm test` (whole suite, with counts and runtime) and
      `npx --yes @fission-ai/openspec@1.1.1 validate --all --strict`. Evidence:
      [step 4](reports/2026-10-21-step-4-validation.md), 1235 passed, 20 specs valid.
- [x] 4.2 The `Dependency audit` of the pipeline failed on the published advisories of `vite` 8.3.1, drift of the
      registry since the last run of `main`; the lockfile moves `vite` to 8.3.5, regenerated on Linux, and the
      audit, the suite, the types and the lint pass again. Evidence:
      [step 6](reports/2026-10-21-step-6-pipeline-audit.md).

## 5. Manual verification

- [x] 5.1 `EMBEDDINGS_PROVIDER=fake EMBEDDINGS_BATCH=4 npm run ingest -- samples/` and the same with
      `EMBEDDINGS_BATCH=abc`, against a temporary `DATABASE_URL`; paste the reports. Evidence:
      [step 5](reports/2026-10-21-step-5-manual.md).

## 6. End to end

- [ ] 6.1 No frontend changes. The existing Playwright suite runs in the pull-request pipeline and is recorded
      from it.

## 7. Documentation

- [x] 7.1 `EMBEDDINGS_BATCH` in the configuration table of `README.md` and `README.es.md`, in `.env.example` and in
      section 3 of `docs/search.md`. Evidence: commit `1d09bb6`; `tests/readme.test.ts` compares the table with the
      template and the code, green in [step 1](reports/2026-10-21-step-1-tdd.md).

## 8. Closure

- [ ] 8.1 Pull request against `main`, with every required check green; record the run.
- [x] 8.2 Independent adversarial review recorded in `reports/`; Fable implemented, so Fable does not review.
      Evidence: [step 8](reports/2026-10-21-step-8-adversarial-review.md), Codex `gpt-6-astra`: PASS WITH GAPS,
      one Major and three Minors, every one resolved in `tests/embeddings-batch.test.ts` (25 cases).
- [ ] 8.3 Merge and archive belong to Franc.
