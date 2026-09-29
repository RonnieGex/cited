# Step 10 - What the review of Codex reproduced

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Review closed: `katalis-dev/tasks/revision-community-05.md` (1 Blocker, 4 Major, 1 Minor, all reproduced there)
- Starting point: `0ca819d` ("Close the forged header, the racing limit, the open delimiter and the retired defaults"),
  the commit of Fable that added the scenarios of the delta specs and this section of the contract
- Method: tests first. Every finding has a red run in a commit of its own, then the fix in the next one. No test calls
  a real provider: the deterministic `fake` ran every command, and several tests install a `fetch` that throws.

| Task | Red | Fix |
|---|---|---|
| 10.1 Blocker | `91d6e9d` | `012dabd` |
| 10.2 Major 1 | `ad06a3f` | `5ae2ea5` |
| 10.3 Major 2 | `03ebfa2` | `684052b` |
| 10.4 Major 3 | `81c1803` | `f8f75d5` |
| 10.5 Major 4 | `f60d002` | `be92eb3` |
| 10.6 Minor 1 | no commit: the red is the reproduction under load | `b699670` |
| typecheck of 10.4 | - | `7803e58` |

## 10.1 Blocker: the archive aborted because the spec in force was written by hand

### Red

Two red signals, both reproduced.

The first is the one Codex reproduced. On a throwaway clone of the branch (`git clone --no-hardlinks --branch
feature/pluggable-models-and-ask`, never in this worktree):

```
> openspec archive pluggable-models-and-ask -y
Task status: 17/24 tasks
Warning: 7 incomplete task(s) found. Continuing due to --yes flag.

Specs to update:
  answering: update
  project-readme: update
answering ADDED failed for header "### Requirement: Answers come only from the documents, with citations" - already exists
Aborted. No files were changed.
EXIT: 0
```

The branch carried `openspec/specs/answering/spec.md` (written by hand before the archive) and a modified
`openspec/specs/project-readme/spec.md`, so the archiver found the `ADDED` requirement already in force and aborted.
The tool returned 0, so an automation would have read the abort as a success.

The second is the amended scenario "Available means specified and merged" in `tests/readme.test.ts`. A row marked
`Available` links the spec of its capability; the spec either exists in `openspec/specs/` or an open change adds it as
`specs/<capability>/spec.md`, and the file of the spec in force "is never written by hand before". The test now proves
that rule, and it was red while both files disagreed:

```
> npx vitest run tests/readme.test.ts

 FAIL  tests/readme.test.ts > README, the status table > marks every row Available or Planned, with the spec or the change that delivers it
AssertionError: Answers with citations from any model provider, spend limits: a spec an open change still adds is never written by hand: expected true to be false
 Test Files  1 failed (1)
      Tests  1 failed | 41 passed (42)
```

### Fix

- `git rm openspec/specs/answering/spec.md`: the six requirements of the delta are the source, and the archive writes
  the spec in force.
- `openspec/specs/project-readme/spec.md` restored to the text of `main` (`git checkout main -- <path>`;
  `git diff main -- <path>` is empty).
- `tests/readme.test.ts`: `activeSpecs` (a hand-written list that had to grow with every capability) becomes
  `capabilityOf`, `openChangeSpecs` and `specIsDelivered`, which read `openspec/changes/*/specs/<capability>/spec.md`
  and skip `archive/`. The status test asserts that a spec an open change still adds is not in force, and the test of
  every relative link accepts a spec path the open change delivers.

### Green

```
> npx vitest run tests/readme.test.ts

 Test Files  1 passed (1)
      Tests  42 passed (42)
```

On a fresh throwaway clone of `012dabd`:

```
> openspec archive pluggable-models-and-ask -y
Task status: 17/24 tasks
Warning: 7 incomplete task(s) found. Continuing due to --yes flag.

Specs to update:
  answering: create
  project-readme: update
Applying changes to openspec/specs/answering/spec.md:
  + 7 added
Applying changes to openspec/specs/project-readme/spec.md:
  ~ 2 modified
Totals: + 7, ~ 2, - 0, → 0
Specs updated successfully.
Change 'pluggable-models-and-ask' archived as '2026-09-29-pluggable-models-and-ask'.
EXIT: 0
```

The `17/24` is this section before its own checkboxes were marked. On a fresh throwaway clone of the closing commit
(`81b73e3`, with the seven tasks marked and this report inside), the same command archives without a warning:

```
> openspec archive pluggable-models-and-ask -y
Task status: ✓ Complete

Specs to update:
  answering: create
  project-readme: update
Applying changes to openspec/specs/answering/spec.md:
  + 7 added
Applying changes to openspec/specs/project-readme/spec.md:
  ~ 2 modified
Totals: + 7, ~ 2, - 0, → 0
Specs updated successfully.
Change 'pluggable-models-and-ask' archived as '2026-09-29-pluggable-models-and-ask'.
EXIT: 0
```

`openspec validate --all --strict` passes with 7 items on the branch: the capability is checked through the open
change, and the restored spec of `main` is the one the archive modifies. `openspec list` reports the change as
`✓ Complete`.

## 10.2 Major 1: the last address of `X-Forwarded-For`

### Red

`tests/guards.test.ts` reads the header `203.0.113.7, 10.0.0.1` and the forged pair; `tests/ask-route.test.ts` sends
the two questions of the scenario with `TRUST_PROXY=1`, `RATE_LIMIT_PER_IP_PER_HOUR=1` and the headers
`198.51.100.10, 203.0.113.55` and `198.51.100.11, 203.0.113.55`.

```
> npx vitest run tests/guards.test.ts tests/ask-route.test.ts
AssertionError: expected '203.0.113.7' to be '10.0.0.1'          (guards)
AssertionError: expected '198.51.100.10' to be '203.0.113.55'    (guards)
AssertionError: expected 200 to be 429                           (route, the second question)
 Test Files  2 failed (2)
      Tests  3 failed | 21 passed (24)
```

`lib/guards/ip.ts` took the first value of the header, which is the one the client writes; Traefik keeps that prefix
and appends the real address at the end, so two forged prefixes gave two buckets and both questions passed.

### Fix

`firstValue` becomes `lastValue`: the address is the last non-empty value of `x-forwarded-for` (or of `x-real-ip`),
which is the one the trusted proxy appended. `docs/answering.md` section 7 says exactly that.

### Green

```
> npx vitest run tests/guards.test.ts tests/ask-route.test.ts

 Test Files  2 passed (2)
      Tests  24 passed (24)
```

## 10.3 Major 2: the atomic reservation of the daily limit

### Red

`tests/answer.test.ts` runs eight `askQuestion` calls at once against a gated store: a wrapper holds the first eight
`recordQuestion` calls until all eight have arrived, so the eight requests reach the daily-limit step together, like
the barrier of the review. `DAILY_MODEL_CALL_LIMIT` is 1. `tests/guards.test.ts` reserves eight times with limit 1
against the store directly.

```
> npx vitest run tests/answer.test.ts -t "makes exactly one model call"
AssertionError: expected [ { status: 'answered', …(2) }, …(7) ] to have a length of 1 but got 8

> npx vitest run tests/guards.test.ts
TypeError: store.reserveModelCall is not a function
 Test Files  2 failed (2)
      Tests  4 failed | 30 passed (34)
```

Eight answers, eight calls to the fake and `model_calls.count = 8`, exactly what the review measured: the read of
`modelCallsOn` and the write of the call were two statements with the search in between.

### Fix

`lib/store/index.ts` replaces `recordModelCall` with `reserveModelCall(day, limit)`, one statement:

```sql
INSERT INTO model_calls (day, count) VALUES (?, 1)
ON CONFLICT (day) DO UPDATE SET count = count + 1 WHERE count < ?
RETURNING count
```

It returns the new count, or `null` when the day already holds the limit. `lib/answer/ask.ts` reserves right before
`generateText` and answers `503` with the daily-limit message when the reservation is `null`. The reservation moved
after the search on purpose: a question the documents do not answer still spends nothing, which the existing test
proves. `docs/answering.md` sections 2 and 6 record the statement and the eight-question case.

### Green

```
> npx vitest run tests/answer.test.ts tests/guards.test.ts

 Test Files  2 passed (2)
      Tests  34 passed (34)

> npm run typecheck
exit 0

> npx vitest run tests/ask-route.test.ts tests/ask-cli.test.ts
 Test Files  2 passed (2)
      Tests  13 passed (13)
```

## 10.4 Major 3: the escaped passages

### Red

The fixture is the forged document of the review: a Markdown file that carries `</passage>`, a planted instruction and
a forged `<passage n="1" document="forged.md" heading="Forjado">` with a single sentence of 999 pesos. The test counts
the delimiters of the prompt the fake received and compares them with the passages the search returned.

```
> npx vitest run tests/answer.test.ts -t "keeps a passage that closes"
AssertionError: expected 3 to be 2
 Test Files  1 failed (1)
      Tests  1 failed | 19 skipped (20)
```

Three opening delimiters for two passages: the forged tag inside the document opened a passage the store does not
have, and the `</passage>` line closed the real one early. The fake answered from the forged passage and the citation
of its `[1]` pointed at a different passage.

### Fix

`lib/answer/prompt.ts` escapes the text of a passage, its document name and its heading (`&` as `&amp;`, `<` as
`&lt;`, `>` as `&gt;`, `"` as `&quot;`, `'` as `&apos;`), so no document can open or close a delimiter. The test also
proves the answer is attributable: every citation of the answer carries the figure the answer states.
`docs/answering.md` section 3 documents the escaping and names the test.

### Green

```
> npx vitest run tests/answer.test.ts
 Test Files  1 passed (1)
      Tests  20 passed (20)

> npx vitest run tests/answer.test.ts tests/readme.test.ts
 Test Files  2 passed (2)
      Tests  62 passed (62)
```

`7803e58` is a narrowing of the new assertions (`outcome.status !== "answered"`) that `npm run typecheck` found after
the fix; the runner does not type check, so the working tree was green while `tsc` was not. `npm run typecheck` now
exits 0.

## 10.5 Major 4: the current defaults of the providers

### Red

`tests/models.test.ts` pins the default of every provider and reads the table of `docs/answering.md`: the same model
as the code, an official source and the date it was checked, per row, in the order of `CHAT_PROVIDER_NAMES`.

```
> npx vitest run tests/models.test.ts
AssertionError: expected [] to deeply equal [ 'openai', 'anthropic', …(7) ]   (the table had four columns)
AssertionError: the default models of the code                          (claude-3-5-haiku-latest, gemini-2.0-flash, deepseek-chat, llama-3.3-70b-versatile)
 Test Files  1 failed (1)
      Tests  2 failed | 8 passed (10)
```

### Fix

`DEFAULT_CHAT_MODELS` and the table of `docs/answering.md` section 8 name the model each provider still served on
2026-09-29, with the source and the date:

| Provider | Default | Official source read on 2026-09-29 |
|---|---|---|
| `openai` | `gpt-4o-mini` | https://developers.openai.com/api/docs/models/gpt-4o-mini |
| `anthropic` | `claude-haiku-4-5-20251001` | https://platform.claude.com/docs/en/about-claude/model-deprecations |
| `gemini` | `gemini-3.8-flash` | https://ai.google.dev/gemini-api/docs/deprecations |
| `deepseek` | `deepseek-flash` | https://api-docs.deepseek.com/updates/ |
| `groq` | `openai/gpt-oss-120b` | https://console.groq.com/docs/models |
| `openrouter` | `openai/gpt-4o-mini` | https://openrouter.ai/openai/gpt-4o-mini/overview |
| `ollama` | `llama3.1` | https://ollama.com/library/llama3.1 |
| `lmstudio` | `local-model` | https://lmstudio.ai/docs/developer/openai-compat |
| `fake` | `fake` | `lib/models/fake.ts`, this repository |

What each page states, read without calling any provider:

- **Anthropic**: `claude-haiku-4-5-20251001` is `Active` in the model status table; `claude-3-5-haiku-20241022` is
  `Retired` since February 19, 2026. The pinned snapshot is the name the table carries.
- **Gemini**: `gemini-2.0-flash` was shut down on June 1, 2026; `gemini-3.8-flash` was released on September 2, 2026
  and has no shutdown date announced, and the page tells new projects to use 3.5 Flash-Lite or 3.8 Flash.
- **DeepSeek**: the change log of September 10, 2026 releases V4.1 Flash and says to set the model name to
  `deepseek-flash`; `deepseek-chat` was discontinued on July 24, 2026.
- **Groq**: `llama-3.3-70b-versatile` is `Enterprise` only after August 16, 2026; the models page marks
  `openai/gpt-oss-120b` as the featured production model of the developer plan and the deprecation page recommends it.
- **OpenAI**: the page of `gpt-4o-mini` still documents the model, its snapshot and its endpoints, with no retirement
  notice. The URL of the review (`https://platform.openai.com/docs/models/gpt-4o-mini`) redirects to the one recorded.
- **OpenRouter**: the model is offered with active providers. The page is rendered by the browser, so the fetched text
  does not state the lifecycle itself; the recorded verification is the one of the review, and the source is the page.
- **Ollama**: `llama3.1` is in the library, with 93 tags and no deprecation notice.
- **LM Studio**: the official page shows the placeholder `use the model identifier from LM Studio here`, which is what
  `local-model` is: an identifier the local server accepts, not a published model with a retirement cycle.

### Green

```
> npx vitest run tests/models.test.ts tests/readme.test.ts

 Test Files  2 passed (2)
      Tests  52 passed (52)
```

No test calls a provider: the table is read as text and the code is compared with it.

## 10.6 Minor 1: the cleanup of the suite

### Red

The cleanup of `tests/answer.test.ts:109` already closed every libSQL client before the first delete, but it ran
against the 10 s default of the runner: a deletion libSQL holds costs 2 s per root at worst (ten attempts of 200 ms),
so enough roots under load exhaust the default. Reproduced with the suite under load (five extra `vitest` processes,
`typecheck` and `lint` at the same time) and a cap of 2 s:

```
> npx vitest run --hookTimeout=2000
 FAIL  tests/answer.test.ts  [ tests/answer.test.ts ]
Error: Hook timed out in 2000ms.
    109| afterAll(async () => {
 FAIL  tests/ask-cli.test.ts
Error: Hook timed out in 2000ms.
     57| afterAll(async () => {
 FAIL  tests/ask-route.test.ts, tests/guards.test.ts, tests/ingest.test.ts, tests/search.test.ts, tests/store.test.ts
Error: Hook timed out in 2000ms.
```

Seven suites timed out, `tests/answer.test.ts` among them, with the call site the review reported.

### Fix

- `vitest.config.mts`: `hookTimeout: 60_000`, so no cleanup of the suite runs against the 10 s default.
- `tests/answer.test.ts`: the same margin in the hook itself (`afterAll(fn, 60_000)`), which keeps closing every
  client before the first delete.

### Green

Five runs in a row of `npm test` on Windows, on `b699670`, with an idle machine:

```
RUN 1: Test Files 16 passed (16) | Tests 172 passed (172) | 11.37s
RUN 2: Test Files 16 passed (16) | Tests 172 passed (172) | 11.60s
RUN 3: Test Files 16 passed (16) | Tests 172 passed (172) | 11.41s
RUN 4: Test Files 16 passed (16) | Tests 172 passed (172) | 11.32s
RUN 5: Test Files 16 passed (16) | Tests 172 passed (172) | 11.28s
```

The same battery under the load that reproduced the failure, after the fix:

```
> npm test   (with five vitest processes, typecheck and lint at once)
 Test Files  16 passed (16)
      Tests  172 passed (172)
   Duration  13.09s
```

## 10.7 The battery and the delivery

On Windows 11, Node v24.11.0, and in a `node:24` Linux container (v24.21.0, npm 11.19.0) from a clean clone of
`7803e58` (no `.env` in the clone: `Test-Path .env` is `False`):

| Command | Result |
|---|---|
| `npm test` (Windows) | 16 files, 172 tests, 0 failures, exit 0, five times in a row |
| `npm ci && npm test` in `node:24` | 512 packages, `found 0 vulnerabilities`, 16 files, 172 tests, exit 0, 35.69s |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run test:e2e` | 1 test, 1 passed (16.9s) |
| `npm audit --audit-level=high` | `found 0 vulnerabilities`, exit 0 |
| `npm run secrets:scan` | 197 commits, 2.10 MB, `no leaks found`, exit 0 |
| `openspec validate --all --strict` | 7 passed, 0 failed |
| `git diff --check main...HEAD` | exit 0, no output |
| `git status --short --branch` | only `## feature/pluggable-models-and-ask`, clean tree |

The delivery `katalis-dev/tasks/entrega-community-05.md` appends this round in Spanish, with `## Issues`, and
`LOOP_STATE.md` ends in `STATUS: DONE`. The closing commit was checked again after the report and the checkboxes
joined the tree: `npm test` 16 files and 172 tests green, `npm run typecheck` and `npm run lint` at 0, and the archive
of the clone above.

## Issues

1. **RISK: the OpenRouter page does not state the lifecycle in its fetched text.** The page of the model is rendered
   by the browser, so the text the fetch returns has no status table; the recorded source and the verification are the
   ones of the review ("la página vigente lo ofrece y muestra proveedores activos"). If Fable wants a machine-readable
   statement, it has to come from the models endpoint of OpenRouter, which is not a page this round may call.
2. **RISK: the source of the LM Studio row is not one of the pages the review cites.** The review itself calls
   `local-model` a local identifier, not a public model, so the row points at the official OpenAI-compatibility page
   of LM Studio, which shows the placeholder the default is. `fake` points at this repository for the same reason.
3. **RISK: the pinned Claude default is a snapshot.** `claude-haiku-4-5-20251001` is the name the deprecations page
   carries; the alias `claude-haiku-4-5` is documented on another page of Anthropic, outside the citations of the
   review, so this round recorded the pinned one. `CHAT_MODEL` overrides it either way.
4. **RISK: the escaping changes what a model echoes.** A document with `<`, `>` or `&` now travels as entities, so the
   deterministic `fake` can echo `&lt;passage ...&gt;` in its answer. The citations keep the real text of the store,
   and the prompt is the piece the scenario protects. A real provider may need the entities decoded on the way out;
   that is a product decision, not a hole in the delimiter.
5. **UNKNOWN: the four retired defaults of the first version.** The pages of each provider were read on 2026-09-29 by
   this agent, not by a scheduled job; the defaults age again. The test pins them and fails loudly when the code or
   the table moves, but nothing checks the pages themselves.
6. **UNKNOWN: the stability of the cleanup on a machine other than this one.** Five consecutive runs and a loaded run
   passed; the margin is 60 s against a worst case of roughly 2 s per root, measured here, not everywhere.
