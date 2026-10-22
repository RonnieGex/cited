# Step 8: independent adversarial review (Codex) and its resolution

- Date: 2026-10-21, America/Mexico_City.
- Reviewed: branch `feature/embeddings-batch`, HEAD `78de1f3d7946728d53e8b01592e8f8836bdadf8e` (implementation
  `1d09bb6`), base `5527f6bce5c8d9db81759075ae7f3e8680b6e7cf`.
- Reviewer: Codex CLI 0.157.0, model `gpt-6-astra`, reasoning effort `high`, sandbox `read-only`, run by Fable from
  the clone with the prompt below. Fable implemented and does not review; Codex modified no file (`git status` clean
  after the run).

```
codex exec -s read-only --skip-git-repo-check -C <clone> "<prompt>" < /dev/null
```

The prompt named the scope (`git diff main...HEAD` and `openspec/changes/embeddings-batch/`), the rules
(`docs/katalis-sdd-standard.md` section 1, `openspec/config.yaml`), seven points to check and the output structure
(Verdict, Findings as Blocker/Major/Minor, Checked, Not verified).

## Verdict of the reviewer

**PASS WITH GAPS**: "The implementation passed read-only functional probes, but regression coverage and validation
claims are incomplete, and sandbox restrictions prevented running Vitest and typecheck."

## Findings and their resolution

| Severity | Finding | Resolution |
| --- | --- | --- |
| Major | Stored vector identity is not tested: the tests checked request sizes, text order and counts, never which vector each passage holds, and the step 4 report wrongly concluded alignment from that. A reversed batch would have passed. | `tests/embeddings-batch.test.ts` now reads every stored vector back from the libSQL file (`node:sqlite`, read-only, the raw float32 of the `F32_BLOB` column) and compares it with the fake embedding of its own text, within `1e-6`, for the default, `16` and `1`, across two documents (40 and 7 passages, boundaries `16, 16, 15` and `1` forty-seven times), for the ingestion and for the re-index (`4` and `1`). The step 4 report is corrected. |
| Minor | The silent-fallback scenario had no output assertion. | The invalid-value cases spy on `console.log`, `info`, `warn` and `error` and assert that no line mentions `EMBEDDINGS_BATCH` or the rejected value. |
| Minor | The README tests did not require the new row nor its meaning. | A documentation block asserts the row in both tables (`yes` / `sí`), that both purposes name 32 and 16, the exact fallback phrases in English and Spanish, and the empty template line with its comment. |
| Minor | The teardown swallowed every removal error. | The retries stay bounded (ten attempts); re-throwing the last error was tried and made the file fail on Windows with `EPERM`, because libSQL keeps the file busy for a while after `close()`. The file now warns with the path and the error instead of swallowing them, so a leftover is visible without turning the platform's timing into a red suite. This deviates from the suggested fix and is recorded here. |

Run after the resolution:

```
npx vitest run tests/embeddings-batch.test.ts
Test Files  1 passed (1)
     Tests  25 passed (25)
  Duration  8.24s
exit=0
```

## What the reviewer could not run, and who ran it

Codex's read-only sandbox refused the writes Vitest (`node_modules/.vite-temp`) and `next typegen`
(`.next/types/routes.d.ts`) need, so it executed a read-only Node probe of the resolver and of both paths with an
in-memory store double (all assertions passed, including vector-to-text alignment at the store boundary) and
`npm run lint` (exit 0). Vitest, the type check, the whole suite, the audit and the pipeline were run by Fable:
steps 1, 4 and 6 of this folder, and the pipeline of the pull request in step 7.

## Observations of a sibling session

A duplicated session of the same brief (local `a44040ff`) left read-only notes: an independent run of the suite on
the same tree (typecheck, lint, 20 new tests, 89 related, 1235 of the whole suite, Node 24.22.1); the note that the
`Number()` rule accepts `0x10` and `1e1`, the same rule as `positive()` in `lib/guards/limits.ts`, which Codex judged
consistent with the spec; and the note that `proposal.md` cites the private coordination path, as the archived
`mcp-initialize-version-header` change does. Both notes are kept as they are.
