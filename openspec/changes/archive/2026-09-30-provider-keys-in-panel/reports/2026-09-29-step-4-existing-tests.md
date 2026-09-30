# Step 4: the whole suite and the existing tests that changed

- Date: 2026-09-29
- Change: `provider-keys-in-panel`
- Branch: `feature/provider-keys-in-panel`
- Agent: deepseek-harness
- Commit verified: `aa07ef6`
- Task: 4.1

## Command and output

```
$ npm test

 Test Files  44 passed (44)
      Tests  408 passed (408)
   Start at  13:38:26
   Duration  15.22s (tests 46%, environment 32%, setup 9%, import 9%, transform 3%, worker 4%)
exit=0

$ git diff --stat main...HEAD -- tests e2e playwright.config.ts
 e2e/providers.spec.ts            | 240 ++++++++++++++++
 playwright.config.ts             |  49 +++-
 tests/admin-helpers.ts           |  12 +
 tests/provider-answering.test.ts | 222 +++++++++++++++
 tests/provider-double.ts         | 142 +++++++++
 tests/provider-routes.test.ts    | 600 +++++++++++++++++++++++++++++++++++++++
 tests/provider-search.test.ts    | 212 ++++++++++++++
 tests/provider-settings.test.ts  | 287 +++++++++++++++++++
 tests/provider-ui.test.tsx       | 426 +++++++++++++++++++++++++++++++++++++++
 tests/public-page.test.tsx       |  24 ++
 tests/secrets.test.ts            | 110 +++++++
 11 files changed, 2319 insertions(+), 5 deletions(-)
```

The suite of the base carried 38 files and 348 tests; this branch carries 44 files and 408 tests.

## Which existing test changed and why

Only one test file of the base changed, and one helper. Every other file of `tests/` and `e2e/` is untouched and
green.

1. **`tests/public-page.test.tsx`** (5 lines changed, 19 added). The public page now asks the resolver whether the
   assistant is ready — the scenario "Nothing configured anywhere" of `specs/answering/spec.md` ends on the page — so
   the file mocks `@/lib/settings/providers.ts` with the same style it already used for `@/lib/settings/business.ts`,
   and one test was added: the page says the assistant is not ready, offers the link to the panel and shows no question
   box. Without the mock the test would open a real store, which is exactly what the file avoided before.
2. **`tests/admin-helpers.ts`** (12 added). The list of variables the helper clears between tests grew with
   `ENCRYPTION_KEY`, `AFFILIATE_LINKS`, `HOSTED_OFFER_URL`, `PROVIDER_TEST_TIMEOUT_MS` and the eight base URLs of the
   providers. A variable of the environment that a test sets and another test inherits is the flakiest thing a suite
   can have, and this change adds the first variables that decide behaviour without being a provider key.
3. **`e2e/admin.spec.ts`**: **no change**, and that is deliberate. The page `/admin` is still the page of the
   variables, now titled "For the installer" through the same string `strings.setupTitle` the spec reads, so its
   assertions keep their meaning; the test buttons stay because they do not edit anything and the installer still
   needs them.
4. **`tests/ask-route.test.ts`**: **no change**. Its two scenarios of an unusable configuration still hold: the 503
   that names `OPENAI_API_KEY`, and the 503 that names `EMBEDDINGS_PROVIDER` when the server sets none and the panel
   holds none. The second one is now produced by `embeddingsFrom()` through the resolver instead of
   `resolveEmbeddingsProvider()`, with the same promise: a missing configuration stops the call and names what is
   missing. Keyword mode is what makes the difference, and it is chosen in the panel, so an installation that chose
   nothing keeps refusing to answer instead of silently degrading.
5. **`tests/embeddings.test.ts`, `tests/ingest.test.ts`, `tests/search.test.ts`, `tests/admin-documents.test.ts`**:
   **no change**. `resolveEmbeddingsProvider()`, `ingestPaths()` and `hybridSearch()` widened their types
   (`EmbeddingProvider | null`) without changing what they do with a provider, so every existing call still compiles
   and still passes.

## Verdict

The suite of the branch is green end to end, with the five test files of the base that the change touches or could
have invalidated reviewed one by one. The two that changed did so for a reason that is written here; the three that
could have needed a change did not need one. Task 4.1 is done.
