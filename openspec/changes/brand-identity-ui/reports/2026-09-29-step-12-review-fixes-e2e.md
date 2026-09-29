# Step 12: review fixes, area e2e

Fixer of the e2e area, branch `feature/brand-identity-ui`. Files touched: `e2e/brand.spec.ts`, `e2e/admin-brand.spec.ts`,
`scripts/capture-ui.mjs` and this report. No Playwright run, no `npm test`, no build: the reintegration agent runs the
suite. `tasks.md`, `design.md` and the specs are untouched.

## Finding 1 (major, critique): no test for the ADDED scenarios of decisions 18 and 19

Commit `2b9f283` (Add the E2E cases of decisions 18 and 19: the Spanish signature beside the flame and the readable
conversation date).

What was added:

- `e2e/brand.spec.ts`, public project: two cases, `in en the footer of / reads "Built by Katalis" beside the flame of
  Katalis` and `in es the footer of / reads "Hecho por Katalis" beside the flame of Katalis`. Each sets the
  `cited-lang` cookie, checks `html[lang]`, finds the exact line, asserts one visible `img[src*='katalis-flame']` in
  its parent and that the other language's signature is absent.
- `e2e/admin-brand.spec.ts`, panel project: the Spanish sign-in case also asserts `Hecho por Katalis` with the flame
  beside it and no `Built by Katalis`.
- `e2e/brand.spec.ts`, the group "a business is configured" (its own `next start` server and its own store): `in Spanish
  the date of a conversation is a time element with the stored ISO value and a date an owner reads`. It signs in,
  uploads `samples/cafe-la-horquilla.md`, asks a question that is answered (only answered turns are stored), opens
  `/admin/conversations` in `es` and asserts that the row has exactly one `time`, that its `datetime` matches
  `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`, that its text has no `T` and no `Z`, and that its text equals
  `Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" })` of that value (decision 19).
  It runs on the branded server and not on the shared panel store because an answered row there races
  `e2e/admin.spec.ts`, which asserts a single `Answered` cell and then deletes every conversation.

Red before the fix of the code (the implementation of decisions 18 and 19 belongs to the public and panel areas):

```
$ curl -s -b cited-lang=es http://localhost:3300/ | grep -o "lang=\"es\"\|Hecho por Katalis\|Built by Katalis\|katalis-flame[^\"]*" | sort | uniq -c
      2 Built by Katalis
      1 katalis-flame-ink-64.png
      1 katalis-flame-ink-64.png\
      2 lang="es"
exit 0
$ grep -n "turn.createdAt" components/admin/ConversationsPanel.tsx
83:                  <td className={`${cell} whitespace-nowrap tabular-nums`}>{turn.createdAt}</td>
```

The Spanish public page reads `Built by Katalis`, and the date cell prints the raw ISO string, so the new cases fail
until those areas land. Static checks of the specs:

```
$ npx tsc --noEmit -p .
exit 0
$ npx eslint e2e/brand.spec.ts e2e/admin-brand.spec.ts
eslint exit 0
```

gitleaks in the hook:

```
INF 0 commits scanned.
INF scanned ~4696 bytes (4.70 KB) in 190ms
INF no leaks found
```

Not done here: the finding also asks for new tasks (3.5 and 7.2) in `tasks.md`. This fixer may not edit `tasks.md`;
the orchestrator or Fable adds them.

## Findings 2 and 3 (minor, compliance and engineering): the capture script

Commit `d4a8751` (Make the capture script shoot the embed at both sizes, ask a question with no amount and keep the
password local). Changes in `scripts/capture-ui.mjs`:

1. The default question is `When are you open on Saturday?`; its answer and cited passage carry no amount.
2. `/embed` is captured at 1440 and at 375 px.
3. At 375 px the answer shot scrolls `[data-cited="citation"]` into view and takes the screen (`fullPage: false`), so
   the sticky ask form sits under the note instead of over it.
4. `settle()` waits for every finite animation to finish (`document.getAnimations()`, as in
   `scripts/render-readme-captures.mjs`) instead of a fixed 1200 ms.
5. With `ADMIN_PASSWORD` set, a base URL whose host is not `localhost`, `127.0.0.1` or `[::1]` is refused before the
   browser starts.

The default question checked against a temporary store with the deterministic providers (outside the repository):

```
$ node scripts/ingest.ts samples/ && node scripts/ask.ts "When are you open on Saturday?"
status: answered
answer: Answer from the test provider: Groups and events We host a Saturday ride that leaves the shop at 9:30. [1]
  [1] bike-workshop-policies.md [Groups and events] position 3
$ node scripts/ask.ts "How much does a late cancellation cost?"
answer: Answer from the test provider: A late cancellation costs 50 pesos, and a dropped appointment costs the full estimate. [1]
```

The refusal of a remote host:

```
$ ADMIN_PASSWORD=not-a-real-password node scripts/capture-ui.mjs <temp dir> http://198.51.100.1:9
Error: ADMIN_PASSWORD is only sent to this machine: http://198.51.100.1:9 is not localhost or 127.0.0.1.
exit 1
```

The run against the dev server, with no password:

```
$ node scripts/capture-ui.mjs <temp dir> http://localhost:3300
rendered signin-1440.png
rendered signin-375.png
rendered public-empty-1440.png
rendered public-empty-375.png
rendered public-answer-1440.png
rendered public-answer-375.png
rendered embed-1440.png
rendered embed-375.png
rendered kit-1440.png
rendered kit-375.png
no ADMIN_PASSWORD: the panel was not captured
exit 0
```

Looked at with the Read tool: `public-answer-375.png` shows the question, the answer, the open citation with the
passage in the highlighter and the document name, then the ask form below it and not over it. No amount appears.
`embed-375.png` exists and shows the band, the welcome and the ask form. `tasks/capturas-community-14/` was not
re-shot: a re-shoot of the delivery set with the panel needs the password of the running app, which the reintegration
agent has.

```
$ npx eslint scripts/capture-ui.mjs
eslint exit 0
```

gitleaks in the hook:

```
INF 0 commits scanned.
INF scanned ~1739 bytes (1.74 KB) in 190ms
INF no leaks found
```

## Issues

- BROKEN: none known in this area. The new E2E cases stay red until the public area changes the Spanish footer to
  `Hecho por Katalis` and the panel area renders the date in a `time` element. That is intended.
- RISK: another fixer is adding its own date case to `e2e/admin-brand.spec.ts` (uncommitted when this report was
  written) on the shared panel store. An answered row there can race the single `Answered` assertion and the
  delete-all of `e2e/admin.spec.ts`. The reintegration should keep one of the two cases, and the isolated one in
  `e2e/brand.spec.ts` does not race.
- NOT DONE: the tasks 3.5 and 7.2 in `tasks.md` (this fixer may not edit it). The delivery captures in
  `tasks/capturas-community-14/` were not re-shot.
- UNKNOWN: the new Playwright cases were not run here (the rules keep Playwright for the reintegration agent).
