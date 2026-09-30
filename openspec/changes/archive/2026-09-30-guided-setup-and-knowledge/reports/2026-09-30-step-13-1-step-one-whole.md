# Step 13.1 · The fourth amendment: step 1 is whole, the AI and how to search

Task of `tasks.md`: "Red, then green: with the chat set by the server and no search chosen, step 1 is 'needs attention'
with the sentence and the two doors in both languages; choosing search by words turns it green; the sample button of
step 2 links back to step 1 while the search is not chosen; the walk of `e2e/setup.spec.ts` gains the server-set case
(decision 24)".

Commits that carry the cases: `b6b6a5f` ("Bring the red cases of the fourth amendment first: the search is part of
step 1") for the unit suite and `0297080` ("Add the server-set case to the walk of the guided setup, on the port 3210")
for the browser walk, with the port of decision 17 written in `playwright.config.ts` and `docs/testing.md`. Commits that
carry the fix: `1954ed3` ("Make step 1 whole: the AI that answers and the search in one step"), `c3199f1` ("Take the
trailing blank line of the tasks out, as the whitespace check asks", one byte of the contract that made
`git diff --check` fail) and `237f066` ("Say in the owner guide that step 1 ends with the AI and the way to search").
This report validates those five commits and lands in the one that marks the box.

## The gap of the real run

`katalis-dev/tasks/entrega-community-13.md`, "Corrida real con DeepSeek" (decision 18): with `CHAT_PROVIDER=deepseek`
in the environment of the server and no search chosen, step 1 was `verified`, the lane opened step 2, and the sample
business stopped with "The meaning search is not chosen yet". A non-technical owner got stuck there, because the choice
the step was missing lives inside the step the panel had just declared done.

The state came from `lib/admin/setup-checklist.ts`, which asked `chatProblem()` about the chat provider and nothing about
the search, and from `app/api/admin/samples/route.ts`, which correctly refuses to ingest without a search — the button
was the only thing that could fail after the press. `/admin/information`, the same screen once the setup is done
(decision 11), had the same button.

## The red run of the unit cases

Windows, Node 24.21.0, in the worktree `<worktree>`, at the commit of the cases `b6b6a5f` and with the product before
the fix:

```
npx -y -p node@24 node -v
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/setup-checklist.test.ts tests/setup-ui.test.tsx --reporter=verbose
v24.21.0

 Test Files  2 failed (2)
      Tests  7 failed | 56 passed (63)
   Duration  74.11s
```

The seven, with the reason each one gave:

- `asks for attention when the server sets the AI and the search is not chosen` (checklist):
  `expected 'verified' to be 'attention'` — the gap of the real run, in one line.
- `turns the first step green when the server sets the AI and the search too` (checklist):
  `expected undefined to be true` — the checklist did not read the search at all.
- `asks for attention when the panel saved a tested provider and the search is not chosen` (checklist):
  `expected 'verified' to be 'attention'` — the same hole with the provider saved in the panel.
- `keeps the chat as the reason of the attention when the AI cannot answer and the search is missing` (checklist):
  `expected undefined to be 'chat'` — there was no reason to read.
- `does not verify the first step with the search alone` (checklist): `expected undefined to be null`.
- `asks the owner to choose how to search, in both languages` (setup UI):
  `It looks like undefined was passed instead of a matcher. Did you do something like getByText(undefined)?` —
  `stepSearchBody` did not exist yet.
- `sends the owner back to step 1 for the sample while the search is not chosen, in both languages` (setup UI):
  `Unable to find an accessible element with the role "link" and name "Try it with a sample business (Café La
  Horquilla)"` — the control was a button that posted, which is the press that failed in the real run.

Three existing cases of `tests/setup-checklist.test.ts` were updated with the contract and not against it: they assert
that a chat provider that answered its test verifies the step, and decision 24 says that claim is true only with the
search chosen, so they choose search by words first and go on testing the key and the test. No word of a task, of
`design.md` or of a spec was touched.

## The red of the browser case

The browser case names API the product does not have before the fix (`stepSearchBody`, `checklist.searchChosen`,
`checklist.attention`, the `search` source of the notice, the prop of the panel), and `next build` type-checks the whole
project: the first run of the E2E in the disposable clone stopped in the build with those type errors and the suite never
started.

To see the behaviour and not only the missing types, the clone relaxed that one gate (`typescript: { ignoreBuildErrors:
true }` in its own `next.config.ts`, a disposable clone and nothing committed) and ran the group:

```
npx -y -p node@24 node scripts/build-e2e.mjs
CI=1 npx -y -p node@24 node node_modules/@playwright/test/cli.js test --project=setup -g "the chat set by the server"
1 failed
  [setup] › e2e\setup.spec.ts:636:7 › the chat set by the server › step 1 asks for the search and the sample waits for it, in both languages
  Error: expect(locator).toBeVisible() failed
  Locator: locator('[data-setup-step="ai"]').getByRole('button', { expanded: true })
```

The lane opened step 2 because step 1 was already `verified`: "el paso 1 queda verde y cerrado", exactly the sentence of
the delivery. The red of the case is the finding, not a missing type.

## Decision 24 · Step 1 is whole

- `lib/admin/setup-checklist.ts`: the checklist resolves the search (`resolveEmbeddings()`) and carries `searchChosen`
  (`embeddingsConfigured()`: a meaning provider with everything it asks for, or search by words) and `attention`, the
  reason the first step asks for attention when it does. Step 1 is `verified` only with an AI that can answer *and* the
  search chosen; an AI that can answer with the search missing is `attention` in both shapes — the provider the server
  names and the one the panel saved whose test passed — because the owner still has a decision to make inside the same
  step. The chat that cannot answer keeps its precedence (`chat`), the first visit keeps `todo`, and a saved provider
  whose test is still missing keeps `progress`.
- `lib/i18n/admin.ts`: the sentence of the decision in both languages, "Your AI is connected. Choose how to search your
  documents: by meaning or by words." / "Tu IA está conectada. Elige cómo buscar en tus documentos: por significado o
  por palabras."
- `components/setup/AttentionNotice.tsx`: a fourth source, `search`, with that sentence and no action: the two doors
  that finish the step — a meaning provider with its key, or search by words — live in the same step, under the notice.
  The notice of the installer, the unreadable key and the unknown provider are untouched.
- `app/admin/page.tsx`: the notice reads the reason from the checklist (`checklist.attention`), which is the state the
  panel already had, and hands `checklist.searchChosen` to the second step. The lane opens step 1 by itself on a visit
  with no `?step` in the address, because step 1 is no longer `verified` and `current` is the first step that is not.
- `components/setup/InfoPanel.tsx`: while the search is not chosen the sample control is a link to `/admin?step=ai`
  (`buttonClass("secondary")`, one source with the button it replaces in `components/ui/Button.tsx`) and never a press
  that fails; `app/admin/information/page.tsx`, the same screen once the setup is done, reads the search the same way.
  The route keeps refusing the request: the server never trusts a control of the browser.
- `docs/owner-guide.md`: the first step of the guide says the step ends when the AI answers and the way to search is
  chosen, in both languages.

## The green runs

The two files of the red run, at `1954ed3`:

```
 Test Files  2 passed (2)
      Tests  63 passed (63)
   Duration  74.64s
```

The whole suite at the same commit, twice on Windows with Node 24.21.0:

```
 Test Files  85 passed (85)
      Tests  1018 passed (1018)
   Duration  75.68s

 Test Files  85 passed (85)
      Tests  1018 passed (1018)
   Duration  76.47s
```

`next typegen` and `tsc --noEmit`, and `eslint .`: no output, exit 0. No test called a real provider: the unit cases use
the deterministic providers of the suite, and the browser case of the walk keeps the local double of port 3216 and never
asks a question of the panel the server sets, so no call leaves the machine. The checks of 10.3, the E2E of 10.4 and the
green of the new browser case are in `reports/2026-09-30-step-13-2-checks.md`.

## One byte of the contract

`4607048` added the section 13 with a blank line at the end of `tasks.md`, which made `git diff --check main...HEAD`
report `tasks.md:114: new blank line at EOF`. `c3199f1` removed it without touching a word of a task — the same repair
`643f141` made for the third amendment — and the check is clean again.
