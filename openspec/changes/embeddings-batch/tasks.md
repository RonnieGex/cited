# Tasks: embeddings-batch

Branch `feature/embeddings-batch` from `main`. Reports live in `reports/`, with the exact command and its output.
A task is `[x]` only with evidence.

## 0. Branch

- [ ] 0.1 `git switch -c feature/embeddings-batch` from `main` at `5527f6b`.

## 1. Tests first

- [ ] 1.1 Write `tests/embeddings-batch.test.ts`: the rule of the value (absent, `16`, `4`, empty, `0`, `-8`,
      `2.5`, `abc`) and the four scenarios of the spec with a recording provider over the fake embeddings, for the
      ingestion and for the re-index. Run it red before any code.

## 2. Implementation in small steps

- [ ] 2.1 `lib/embeddings/batch.ts`: `DEFAULT_EMBEDDINGS_BATCH` and `resolveEmbeddingsBatch(environment)`.
- [ ] 2.2 `lib/ingest/index.ts` and `lib/settings/indexing.ts`: `embedAll` reads the number from
      `resolveEmbeddingsBatch()` at the start of each call; the constant `32` leaves both files.

## 3. Existing tests

- [ ] 3.1 Run `tests/ingest.test.ts`, `tests/provider-search.test.ts`, `tests/readme.test.ts` and
      `tests/admin-pages-variables.test.ts`, the suites that read the ingestion, the re-index, the configuration
      table and the template.

## 4. Run the tests

- [ ] 4.1 `npm run typecheck`, `npm run lint`, `npm test` (whole suite, with counts and runtime) and
      `npx --yes @fission-ai/openspec@1.1.1 validate --all --strict`.

## 5. Manual verification

- [ ] 5.1 `EMBEDDINGS_PROVIDER=fake EMBEDDINGS_BATCH=4 npm run ingest -- samples/` and the same with
      `EMBEDDINGS_BATCH=abc`, against a temporary `DATABASE_URL`; paste the reports.

## 6. End to end

- [ ] 6.1 No frontend changes. The existing Playwright suite runs in the pull-request pipeline and is recorded
      from it.

## 7. Documentation

- [ ] 7.1 `EMBEDDINGS_BATCH` in the configuration table of `README.md` and `README.es.md`, in `.env.example` and in
      section 3 of `docs/search.md`.

## 8. Closure

- [ ] 8.1 Pull request against `main`, with every required check green; record the run.
- [ ] 8.2 Independent adversarial review recorded in `reports/`; Fable implemented, so Fable does not review.
- [ ] 8.3 Merge and archive belong to Franc.
