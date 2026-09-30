# Step 2: the tests first, red before the code

- Date: 2026-09-29
- Change: `provider-keys-in-panel`
- Branch: `feature/provider-keys-in-panel`
- Agent: deepseek-harness
- Commit of the red state: `f2fd3cb` (the tests alone, before any line of the implementation)
- Tasks: 2.1, 2.2, 2.3

## 2.1 and 2.2: the unit tests and the route tests, red

The files written before the code:

- `tests/secrets.test.ts`: round trip, a fresh nonce for every seal, tamper detection over the ciphertext, the tag and
  a value without its version, no `ENCRYPTION_KEY`, a key that is not 32 bytes of base64, a value sealed with another
  key, and `lastFour`.
- `tests/provider-settings.test.ts`: the resolver, with the server winning over the panel, the panel next, `none`, a
  server that names a key it does not carry, the unreadable key after the encryption key changed, the panel row that
  keeps the ciphertext and never the key, keyword mode, and the dimensions of a panel embeddings provider.
- `tests/provider-double.ts`: the local HTTP double of every provider, which records every request it receives.
- `tests/provider-routes.test.ts`: every scenario of `specs/provider-settings/spec.md`, with doubles for
  OpenAI-compatible, Anthropic, Gemini and Ollama and the answers 200, 401, 402, `insufficient_quota`, 404, 429 and a
  hang past the timeout; the save that only happens after a passing test; the missing encryption key; keyword search;
  the twenty tests per hour; the state that carries the last four characters and never the key nor its ciphertext; and
  the session and origin gate.
- `tests/provider-search.test.ts`: keyword mode with FTS5 alone and no vector in the store, the ingestion that stops
  naming what is missing, and a change of embeddings that marks every passage and re-indexes them.
- `tests/provider-answering.test.ts`: `/api/ask` with the provider saved in the panel and its key opened in the server
  process, the 503 that says the AI is not connected, and the 503 that names the variable of the server.
- `tests/provider-ui.test.tsx`: the page, with the server-set state read only, the last four characters and the last
  test, the honest lines of the catalogue, the affiliate link labelled and turned off, the hosted offer, keyword mode,
  the password field with its toggle, a rejected key in words, the save, the missing encryption key and the re-index.

### Command and output

```
$ npx vitest run tests/secrets.test.ts tests/provider-settings.test.ts tests/provider-routes.test.ts \
    tests/provider-search.test.ts tests/provider-answering.test.ts tests/provider-ui.test.tsx

⎯⎯⎯⎯⎯⎯ Failed Suites 6 ⎯⎯⎯⎯⎯⎯⎯⎯
 FAIL  tests/provider-answering.test.ts [ tests/provider-answering.test.ts ]
 FAIL  tests/provider-routes.test.ts [ tests/provider-routes.test.ts ]
 FAIL  tests/provider-search.test.ts [ tests/provider-search.test.ts ]
 FAIL  tests/provider-settings.test.ts [ tests/provider-settings.test.ts ]
 FAIL  tests/provider-ui.test.tsx [ tests/provider-ui.test.tsx ]
Error: Failed to resolve import "@/components/admin/ProviderConnect" from "tests/provider-ui.test.tsx". Does the file exist?
 FAIL  tests/secrets.test.ts [ tests/secrets.test.ts ]
Error: Cannot find package '@/lib/secrets' imported from .../tests/secrets.test.ts
 Test Files  6 failed (6)
      Tests  no tests
exit=1
```

The six suites fail to collect because the modules, the routes and the strings they demand do not exist yet: that is
the red of 2.1 and 2.2, taken before the first line of the implementation.

## 2.3: the E2E, written before the code

`e2e/providers.spec.ts` was written with the third server of `playwright.config.ts` (the panel on 3214, with no
`CHAT_PROVIDER` and no `EMBEDDINGS_PROVIDER`, `ENCRYPTION_KEY` generated in the configuration, `OPENAI_BASE_URL`
pointing at the double the spec serves on 3216, `AFFILIATE_LINKS=off` and `HOSTED_OFFER_URL` set) and the project
`keys` that carries it.

### Command and output

```
$ npm run build
tests/provider-ui.test.tsx(239,53): error TS2339: Property 'hostedOffer' does not exist on type 'AdminStrings'.
tests/provider-ui.test.tsx(285,37): error TS2339: Property 'keywordActive' does not exist on type 'AdminStrings'.
...
tests/secrets.test.ts(4,71): error TS2307: Cannot find module '@/lib/secrets' or its corresponding type declarations.
Failed to type check.
exit=1

$ npx playwright test --project=keys --reporter=list
[WebServer] Error: Could not find a production build in the '.next' directory.
Error: Process from config.webServer was not able to start. Exit code: 1
exit=1
```

**This is the honest shape of the red of 2.3, and it is not a passing run:** `next build` type-checks the repository,
so the build refused before the implementation existed and the browser suite could not start its servers. The E2E was
never seen failing on an assertion of its own; what the red proves is that the spec and its configuration were written
before the code they need, and that the repository refuses to build without that code. The green of the same spec is in
the report of step 7.

## Verdict

The tests of the three tasks exist before the implementation, and their red state is recorded with the exact command
and its real output: six suites that cannot collect and a build that type-checks its way out. Tasks 2.1, 2.2 and 2.3
are done.
