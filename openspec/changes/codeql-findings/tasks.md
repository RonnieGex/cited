Contract of Claude (in the role of Fable) from Franc's OK of 2026-09-30 ("ok", on closing the CodeQL alerts of the
product). DeepSeek implements, Codex reviews, Franc accepts. A task is `[x]` only with its exact command and result in a
report under `reports/YYYY-MM-DD-step-N-<name>.md`, and with the commit it was verified against.

## 0. Step 0: the branch

- [x] 0.1 `feature/codeql-findings`, created by Fable from `origin/main` at `86b250f`, with this contract

## 1. Base before

- [x] 1.1 `npm ci`, then `npm test` and `npm run typecheck`: the counts, the runtime and `node -v` in
      `reports/<date>-step-1-base.md`

## 2. Tests first (each one red on `86b250f` before its fix)

- [x] 2.1 `tests/ingest.test.ts`: a DOCX whose paragraph reads `5 &lt; 6` gives a passage that reads `5 &lt; 6`, and
      one that reads `5 < 6` gives `5 < 6` (scenario "An entity is decoded once"); build the DOCX in the test, as the
      existing DOCX tests do
- [x] 2.2 `tests/ingest.test.ts`: `docxToMarkdown` of the HTML of the scenario "Markup is removed whole and text that
      looks like markup stays" gives its three lines (export the function for the test if it is not exported)
- [x] 2.3 `tests/ingest.test.ts`: a file above the byte limit is refused, and a spy on `fs/promises` shows that its
      size came from `FileHandle.stat` and that no `readFile` of the path ran (scenario "A file above the limit on disk")
- [x] 2.4 `tests/admin-session.test.ts`: with `node:crypto` spied, `passwordMatches` calls `scryptSync` for both
      values and `timingSafeEqual` once, and never `createHash`; the four cases of the scenario "The right and the wrong
      password" answer as written

## 3. Implementation (decisions 1 to 3 of `design.md`)

- [x] 3.1 `docxToMarkdown`: tag removal until stable, then one-pass decoding (tests 2.1 and 2.2 green)
- [x] 3.2 `parseFile`: one open file for the size and the bytes (test 2.3 green)
- [x] 3.3 `passwordMatches`: scrypt under the salt of the process, constant-time comparison (test 2.4 green)

## 4. Existing tests

- [x] 4.1 Review `tests/ingest.test.ts`, `tests/admin-session.test.ts` and the tests of `app/api/admin/login` for what
      the change touches; none is weakened or deleted

## 5. Run the tests and the checks

- [x] 5.1 `npm run typecheck`, `npm run lint`, `npm test` (counts and runtime), `npm run build`, `npm run audit:high`,
      `npm run secrets:scan`, `npm run openspec:validate`, each with its real output in `reports/<date>-step-5-checks.md`

## 6. Manual verification

- [x] 6.1 Start the application from a clean disposable clone with a test `.env` (never the `.env.local` of a worktree),
      and with `curl.exe`: the login with the right password answers with its session cookie, with a wrong one answers
      the refusal of the spec after its delay; the upload of a DOCX that holds `5 &lt; 6` and then the document page or
      the passages API show `5 &lt; 6`. Responses pasted in `reports/<date>-step-6-curl.md`

## 7. End to end

- [x] 7.1 `npm run test:e2e` (the sign-in of the panel is exercised by it): counts in `reports/<date>-step-7-e2e.md`

## 8. Documentation

- [x] 8.1 `docs/security.md`: the row of the password says it is compared through scrypt in constant time, and the row
      of the documents says the size is read from the open file; both name this change

## 9. Close

- [x] 9.1 `## Issues` at the end of the last report (BROKEN, RISK, NOT DONE, UNKNOWN), with the decisions taken by the
      implementer; the CodeQL scenario is NOT DONE locally and is checked by the pipeline only
- [ ] 9.2 Fable pushes the branch and opens the pull request; the CodeQL check of the pull request and the list of open
      alerts are recorded in the report (pipeline)
- [ ] 9.3 Adversarial review by Codex (`katalis-dev/tasks/revision-codeql-findings.md`)
- [ ] 9.4 Franc accepts; the change is archived and merged through the pull request
