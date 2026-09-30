# Step 12.1 · The third amendment: no silent fake for an unknown provider

Task of `tasks.md`: "Red, then green: a panel row and a server variable with an unknown provider are 'needs attention'
and 'not ready' in both languages, `chatModelFrom()` throws for an unknown name, and no path reaches the fake model
unless the provider is `fake` (decision 23)".

Commits that carry the cases: `ad035b6` ("Bring the tests of the third amendment first: an unknown provider never falls
to the fake model"). Commits that carry the fix: `ba42e4b` ("Never build the test model for a provider outside the
catalogue: the constructor throws"), `dcbda77` ("Check every named provider against the catalogue: an unknown one
resolves with a problem"), `f40465a` ("Ask for attention when a step names a provider the catalogue does not know"),
`f140f26` ("Give the owner the words of a provider Cited does not know, in both languages") and the cleanup `fb63bb6`
("Read the provider of the panel with one catalogue lookup"). This report validates those six commits and lands in the
one that marks the box.

## The Major M-8 of `revision-community-13c.md`

A row of the panel with `provider: "unknown-provider"`, a readable key and `tested_at` did leave step 1 as `verified`:
`resolveChat()` accepted the name with a cast, `chatProblem()` said nothing and `chatModelFrom()` fell to its `default`,
which built `createFakeChatModel()`. The panel said a provider was connected while `/api/ask` answered with the test
double. The new case of `tests/provider-answering.test.ts` reproduced exactly that against the real route before the
fix:

```json
{"status":"answered","answer":"Respuesta del proveedor de prueba: - Afinación de bicicleta: 380 pesos. [1]",
 "citations":[{"n":1,"document":"cafe-la-horquilla.md","heading":"Precios","position":2,...}]}
```

## The red run

Windows, Node 24.21.0, in the worktree `<worktree>`, at the commit of the cases and with the product before the fix:

```
npx -y -p node@24 node -v
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/models.test.ts tests/provider-settings.test.ts
  tests/setup-checklist.test.ts tests/setup-ui.test.tsx tests/provider-answering.test.ts --reporter=verbose
v24.21.0

 Test Files  5 failed (5)
      Tests  8 failed | 78 passed (86)
   Duration  64.37s
```

The eight, with the reason each one gave:

- `refuses to build a model for a name outside the catalogue` (models): `expected [Function] to throw an error` —
  `chatModelFrom()` built the deterministic double for a name the catalogue does not have.
- `answers 503 and never the test double when the panel names an unknown provider` (answering):
  `expected 200 to be 503`, with the answer of the test double quoted above.
- `does not trust a panel row that names a provider outside the catalogue` (settings):
  `expected 'unknown-provider' to be null` — the resolution handed the unknown name to whoever asked.
- `resolves a server provider Cited does not know with a problem instead of an exception` (settings):
  `Error: CHAT_PROVIDER must be one of openai, anthropic, gemini, deepseek, groq, openrouter, ollama, lmstudio, fake;
  received an empty or unknown value.` — an exception, not a state the panel can show.
- `asks for attention when the panel names a provider Cited does not know` (checklist):
  `expected 'verified' not to be 'verified'`.
- `keeps asking for attention for an unknown panel provider with no test of its own` (checklist):
  `expected 'progress' to be 'attention'`.
- `asks for attention when the server names a provider Cited does not know` (checklist): the same exception of
  `selectedChatProvider()`.
- `tells the owner of a provider Cited does not know to connect the AI again, in both languages` (setup UI):
  `It looks like undefined was passed instead of a matcher. Did you do something like getByText(undefined)?` —
  `stepUnknownProviderBody` did not exist yet.

## Decision 23 · No silent fake

- `lib/models/providers.ts`: the `default` of the switch no longer returns `createFakeChatModel()`; it throws and names
  the catalogue. The double is built only for a provider that is literally `fake`, which is decided before the switch.
- `lib/settings/providers.ts`: `ChatResolution` carries `unknownProvider` — the name a row or the environment gave and
  the catalogue does not know — and never a provider. `resolveChat()` checks the panel row against the catalogue
  (`providerEntry()`), so a row that names something else resolves with no provider at all; the variable of the server
  is checked against `CHAT_PROVIDER_NAMES` before `serverChatCredentials()` reads it. `chatProblem()` says the provider
  is not known, and `chatConfigured()` is false, so the public page says "not ready" and `/api/ask` answers its own
  sentence before it builds a model. The catalogue is what the panel offers, so a panel row cannot hold `fake` either:
  the deterministic double belongs to the environment of whoever installs it, which is how the suite and the browser
  walks run.
- `lib/admin/setup-checklist.ts`: step 1 asks for attention when `chatProblem()` names something and a provider was
  named anywhere — by the panel row or by the server. A first visit (nothing named anywhere) keeps its `todo`, and the
  step stays in progress only while the provider can answer and its last test is still missing.
- `lib/i18n/admin.ts`, `components/setup/AttentionNotice.tsx`, `app/admin/page.tsx` and `lib/admin/provider-panel.ts`:
  the notice of the panel has a third reason, `unknown`, with the sentence of the decision in both languages ("The saved
  AI provider is not one Cited knows. Connect your AI again." / "El proveedor de IA guardado no es uno que Cited
  conozca. Conecta tu IA otra vez.") and the button that reopens step 1. The page reads the reason from the state it
  already had: a panel resolution with no provider is the unknown row (`panelUnknownProvider()`), which is the only
  panel state without a provider.

The four cases of the review's matrix that touch an unknown name are now: panel row with a readable key and a passed
test → `attention`; panel row with a readable key and no test → `attention`; panel row with a missing or unreadable key
→ `attention`; server variable → `attention`, with no exception. The `server` row of the matrix for a known provider is
untouched.

## The green runs

The same five files at `fb63bb6`:

```
 Test Files  5 passed (5)
      Tests  86 passed (86)
   Duration  63.75s
```

The whole suite at `fb63bb6`, which is the tree this report validates:

```
 Test Files  85 passed (85)
      Tests  1011 passed (1011)
   Duration  65.65s
```

`next typegen` and `tsc --noEmit`, and `eslint .`: no output, exit 0. No test called a real provider: the chat of the
answering case is the deterministic double of `lib/models/fake.ts`, which the case proves is never reached, and the two
browser walks keep the local double of port 3216. The checks of 10.3 and the E2E of 10.4, with their commits, are in
`reports/2026-09-30-step-12-2-checks.md`.

## One byte of the contract

`b55dc5e` added the section 12 with a blank line at the end of `tasks.md`, which made `git diff --check main...HEAD`
report `tasks.md:105: new blank line at EOF`. The line was removed in `643f141` without touching a word of a task, the
same repair `d99e1a0` made for the second amendment; the whitespace check is clean again.
