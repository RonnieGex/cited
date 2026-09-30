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

## Second round, finding 1 (major, compliance): the delivery captures did not show HEAD

No code or spec changed: the fix is a re-shoot of `katalis-dev/tasks/capturas-community-14/` (outside the repository,
not committed) with the `d4a8751` version of `scripts/capture-ui.mjs`, then a look at every file.

The server is the dev server on `http://localhost:3300`, run from this worktree, with `CHAT_PROVIDER=fake` and
`EMBEDDINGS_PROVIDER=fake`, the four files of `samples/` ingested (`README.txt`, `bike-workshop-policies.md`,
`cafe-la-horquilla.md`, `notas-del-negocio.txt`) and the sample business `Café La Horquilla` (`#1F5F4A`, English).
HEAD at the shot was `765862a`, which contains `27ffe23` and every step-12 fix committed after it (among them `d558911`,
the dates in the zone of the reader, and `2eefee3`, the panel without restated eyebrows). `git status` showed no change
under `app/`, `components/` or `lib/`, so the dev server served HEAD.

The first attempt stopped at the answer: the dev server's hourly question limit (bucket `direct`, 30 per hour) was spent
by the other lanes.

```
$ ADMIN_PASSWORD=<read from .env.local, never printed> node scripts/capture-ui.mjs katalis-dev/tasks/capturas-community-14 http://localhost:3300
rendered signin-1440.png ... public-empty-375.png
locator.waitFor: Timeout 20000ms exceeded.  waiting for locator('[data-cited="answer"]')
exit 1
$ curl -s -X POST -H "content-type: application/json" -H "origin: http://localhost:3300" -d '{"question":"When are you open on Saturday?"}' http://localhost:3300/api/ask
{"status":"rate_limited","error":"more than RATE_LIMIT_PER_IP_PER_HOUR (30) questions from this address in an hour"}
$ curl -s -i -X POST ... http://localhost:3300/api/ask | grep -i retry-after
retry-after: 2614
```

I did not touch the store or restart the server; I waited for the window to turn and ran the same command again:

```
$ ADMIN_PASSWORD=<read from .env.local, never printed> node scripts/capture-ui.mjs katalis-dev/tasks/capturas-community-14 http://localhost:3300
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
rendered panel-setup-1440.png
rendered panel-setup-375.png
rendered panel-business-1440.png
rendered panel-business-375.png
rendered panel-documents-1440.png
rendered panel-documents-375.png
rendered panel-conversations-1440.png
rendered panel-conversations-375.png
/admin/ai answered 404: skipped
exit 0
$ ls -la --time-style=+%H:%M katalis-dev/tasks/capturas-community-14/
18 PNG files, every one dated 19:01 (local time; the old set was 15:57 and 15:58)
```

I opened the 18 files with the Read tool:

| File | What it shows |
| --- | --- |
| `signin-1440.png`, `signin-375.png` | Ink half with the `Cited 1` wordmark, the headline with `it came from.` in lime, `Built by Katalis` beside the flame; paper half with `Sign in to your panel`, an empty password field and `SIGN IN`. No secret. |
| `public-empty-1440.png`, `public-empty-375.png` | Green band of `Café La Horquilla` with `English \| Español`, the welcome with its last words highlighted, `Your question` and `ASK`, footer `Built by Katalis` with the flame. |
| `public-answer-1440.png` | `YOU ASKED` / `When are you open on Saturday?`, the answer with the mark `1`, `SOURCES`, and the open citation with the highlighted passage, `DOCUMENT`, `HEADING` and `CLOSE`; the ask form below it. |
| `public-answer-375.png` | The screen with the citation scrolled into view: the passage, `DOCUMENT`, `HEADING`, `CLOSE`, then `Your question` and `ASK` below the citation, not over it. |
| `embed-1440.png`, `embed-375.png` | The compact band, the welcome, `Your question` and `ASK`. `embed-375.png` now exists. |
| `kit-1440.png`, `kit-375.png` | The kit in Spanish: logo, marca de cita, marcatextos (`Abrimos de martes a domingo.`), buttons, language switch, text field, labels, panel. No amount. |
| `panel-setup-1440.png`, `panel-setup-375.png` | `Setup` with no eyebrow above it, the two test buttons, `Required` open with `SET` chips and a plain `Missing` word, the other groups folded with `Set: n of m`. Only SET or Missing, never a value. |
| `panel-business-1440.png`, `panel-business-375.png` | `Business` with no eyebrow; the name, `#1F5F4A`, tone, language, forbidden topics, the two welcomes, `SAVE THE BUSINESS` and the logo panel. |
| `panel-documents-1440.png`, `panel-documents-375.png` | `Documents` with the four sample files and their passages; at 375 the two buttons stack under each name inside the width. |
| `panel-conversations-1440.png` | `Conversations` with no eyebrow; the `WHEN` column reads `Sep 29, 2026, 7:01 PM` and so on, no raw ISO string. |
| `panel-conversations-375.png` | The same rows; the table scrolls inside its panel and `WHEN` is past the right edge until the reader scrolls it. |

No amount of money appears in any file (the questions list holds `How much does a late cancellation cost?` as a question
text, with no figure), and no secret appears.

What is worth a note for the delivery (none of it is a defect of this area):

1. Every file carries the round `N` badge of `next dev` in the lower left (over `Built by Katalis` in the panel column).
   The step-7 set came from a `next start` build without it. The rules of this round forbid a build or `npm start` here,
   so a set without the badge needs the reintegration worktree.
2. The conversations shots show the whole dev store: about 50 turns that the lanes asked during the day, one of them
   stored with a broken encoding (`�A qu� hora abren el s�bado?`, a request sent in the wrong code page, not a render
   defect).
3. At 375 the `WHEN` and part of `CITATIONS` of the conversations table sit past the right edge (the reachable scrolling
   table); the fourth navigation item is off screen on Setup, Business and Documents. Both were noted in step 7.

## Issues (second round)

- BROKEN: none.
- RISK: the set is a screenshot of `next dev`, so the `N` badge of Next.js is in every file; a clean set needs a
  `next start` build (the reintegration agent).
- NOT DONE: none of this finding.
- UNKNOWN: none.
