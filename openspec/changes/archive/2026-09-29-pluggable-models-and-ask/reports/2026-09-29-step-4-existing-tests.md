# Step 4 - Review and update of the existing tests

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `dc473ce` (the route and the command line)

## 4.1 The whole suite

```
> npm test

 Test Files  16 passed (16)
      Tests  165 passed (165)
   Duration  11.29s
```

The eleven files of the base stay green and the five files of the change add 51 tests: 8 of the providers, 13 of the
guards, 18 of the answer, 9 of the route and 3 of the command line.

## The README contract

The contract of the README is the one test file this change could have broken without touching the answer, because it
reads the whole repository: the scripts of `package.json`, the variables of `.env.example` and the source of `lib/`,
`scripts/` and `app/`.

```
> npx vitest run tests/readme.test.ts

 Test Files  1 passed (1)
      Tests  42 passed (42)
   Duration  1.86s
```

It is green and **not one line of it changed**. The new `ask` script does not enter the quick start yet (that is
9.2), the new variables do not enter `.env.example` yet (that is 9.1), and the code of `lib/` and `app/` that reads a
variable today is not claimed in the configuration table until 9.2, so the two halves of the contract still agree.

## Which tests changed and why

Against `main`, the only test files that differ are the five that this change creates:

```
> git diff --stat main...HEAD -- tests/

 tests/answer.test.ts    | 421 ++++++++++++++++++++++++++++++++++++++++++++++++
 tests/ask-cli.test.ts   | 107 ++++++++++++
 tests/ask-route.test.ts | 334 ++++++++++++++++++++++++++++++++++++++++++++++
 tests/guards.test.ts    | 273 +++++++++++++++++++++++++++++++++++++++
 tests/models.test.ts    | 125 ++++++++++++++
 5 files changed, 1260 insertions(+)
```

Every line is an addition: no test of the base was deleted or weakened. Inside the new files, three corrections were
made while the implementation was written, and they are recorded here because they are changes to tests that step 2
had already committed:

1. `tests/answer.test.ts`, `sends at most the last six turns of the session`. The test asked its question against an
   empty store, so the search found no passage and the core refused **without calling the model**: there was no prompt
   to read. The store now carries one document, the model is called and the test reads the six turns it meant to read.
   The defect was in the test, not in the code: a test that wants to see a prompt has to give the search something to
   find.
2. `tests/answer.test.ts`, `marks a planted instruction as a passage and never returns the system prompt`. The test
   expected the delimiter `<passage n="1" document="notas.md">`, but the document of the test has a Markdown heading
   and the real delimiter carries `heading="Notas"`. The assertion now checks the document and lets the heading be
   there; the property it protects (the planted sentence travels inside a passage, after the system rules) is
   unchanged.
3. `tests/guards.test.ts`, `tests/answer.test.ts`, `tests/ask-route.test.ts` and `tests/ask-cli.test.ts`: the removal
   of the temporary folder of each test now retries and, if Windows still holds the file of a closed libSQL client,
   leaves the folder in the temporary directory instead of failing the suite. The store of a test never lives in the
   repository, and the assertion that no store file is left behind is about the repository.

## Verdict

PASS. The whole suite is green with the README contract among the files that pass, and the only tests that changed
are the new ones of this change, with the three corrections stated above.
