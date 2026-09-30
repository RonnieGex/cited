# Step 10.1: tests first for decisions 21 to 29 (red)

Implementer: Sonnet 5.5. Date: 2026-09-29. Tree: the merge commit `ca6b1d8` plus the report of 10.0 (`f3373a1`), Windows 11.
Every command ran with the Node the task asks for, and `node -v` is shown.

```
$ npx -y -p node@24 -- node -v
v24.21.0
```

Four new files, all under `tests/`, none of which touches the code of the product:

| File | Decisions | Tests | Red | Already green (regression guards) |
|---|---|---|---|---|
| `brand-round-14c-client.test.ts` | 21 (the kind of a failure, the sentences of `PUBLIC_STRINGS`) | 9 | 7 | 2 (answered and refused unchanged; no variable name in a sentence) |
| `brand-round-14c-public.test.tsx` | 21 (the chat), 22, 23, 24 (public titles), 25, 26, 27 and the minors of decision 33 (landmarks, double live region, keys, hover of an open source, landing, panel remount, stagger, 24 px buttons, focus ring) | 41 | 37 | 4 (the label before the first question, the scroll padding when there is room, a mark that opens a paragraph, a source whose heading is missing) |
| `brand-round-14c-panel.test.tsx` | 24 (titles of the panel and of the sign-in), 28, 29 and the minors of decision 33 (landmark of the column, tab stop of a box that does not scroll, the Conversations intro and its phone column) | 25 | 25 | 0 |
| `brand-round-14c-static.test.ts` | 31 (the index report) and the source checks of the minors (`.gitignore`, font preload, the dash of the refusal, `suppressHydrationWarning`, the capture script, the dependency guard) | 8 | 8 | 0 |

## The red run, before any fix

```
$ npx -y -p node@24 -- npm test
 Test Files  4 failed | 74 passed (78)
      Tests  77 failed | 793 passed (870)
   FAIL tests/brand-round-14c-client.test.ts   (7)
   FAIL tests/brand-round-14c-panel.test.tsx   (25)
   FAIL tests/brand-round-14c-public.test.tsx  (37)
   FAIL tests/brand-round-14c-static.test.ts   (8)
```

Before the four files the suite was `74 passed (74)` and `787 passed (787)` (report of 10.0); now the 787 tests are
still green (793 with the six new guards that already hold) and the 77 new tests are the whole of the red. No old test
fails, so the fixes of 10.2 are measured only by these 77 and by the old tests that a design decision changes (those are
listed in the report of 10.2 with the reason).

Each red test fails for the reason it was written for, read from the assertion and not only from the count. A sample by
decision:

| Decision | First failing assertion |
|---|---|
| 21, client | `expected { status: 'failed', message: null } to deeply equal { status: 'failed', kind: 'network' }`; `expected undefined to deeply equal { rate_limited: ..., unavailable: ..., network: ... }` |
| 21, chat | `the sentence of rate_limited: expected undefined to be type of 'string'`; the wait: `the pending entry has no live region of its own: expected [ ...(2) ] to deeply equal [ <p data-cited="announcer"> ]`; the retry: the failed `li` is reused as the pending one |
| 22 | `expected <li data-cited="pending"> to be null` (a `sessionStorage` that throws leaves the wait forever); `expected [] to have a length of 2 but got +0` (a storage that throws sends nothing) |
| 23 | `expected 'flex flex-col gap-3 sticky bottom-0 z...' to contain '[@media(min-height:560px)]:sticky'`; `a short viewport reserves nothing: expected '16px' to be ''` |
| 24 | `generateMetadata: expected undefined to be type of 'function'` on `/`, `/embed` and the five pages of the panel |
| 25 | `expected 'mx-1 inline-grid ...' to contain 'ms-[0.15em]'`; `expected 'Both agree 12 on this.' to be 'agree12'` |
| 26 | `Unable to find an accessible element with the role "button" and name "[1] Bookings and cancellations, bike-workshop-policies.md"` |
| 27 | `expected 'Hecho por Katalis' to contain 'Respuestas de Cited'`; `expected 'How much is a bicycle tune-up?' to be 'Type your question'` |
| 28 | `Unable to find an accessible element with the role "group" and name "Delete README.txt?"` (six tests, Documents and Conversations, English and Spanish) |
| 29 | `an id for every group: expected false to be true`; `expected 'the model answered NO_ANSWER' to match /respondió/i`; `expected 'No se pudo guardar el negocio.' to match /no respondió/i` (a failed request of a provider test said the business could not be saved) |
| 33 | `expected 'ASIDE' not to be 'ASIDE'` (sources, column of the panel); `the band is not inside main: expected true to be false`; `expected 'Katalis' to be ''` (footer flame); `expected '0' not to be '0'` (tab stop); `paper: expected ... to match /(^|\s)min-h-6(\s|$)/`; `expected [ '1', '2', '3', '4' ] to deeply equal [ '1', '2' ]` (four marks moving at once) |
| 31 and the sources of the minors | `openspec/.../2026-09-29-step-3-implementation.md: expected false to be true`; `expected [ ...(52) ] to include '/.vitest/'`; `expected '...' to contain 'rel="preload"'` |

## Contracts the tests fix (so the code of 10.2 has one reading)

- `AskResult` failed is `{ status: "failed"; kind: "rate_limited" | "unavailable" | "network" }`; the status decides (a 429 with
  an unreadable body is still `rate_limited`; any other answer that is not 200, read or not, is `unavailable`; a thrown
  request is `network`). `PublicStrings.errors[kind]` carries the sentences of decision 21 word for word.
- A citation mark is wrapped with the word before it and the punctuation after it in one `span.whitespace-nowrap`, with
  `ms-[0.15em]` and no `mx-1`; two marks in a row share the unit.
- A source row shows `heading ?? document`, then the document on a `.text-xs.text-ink-2` line unless it repeats; the
  accessible name is `[n] heading, document`.
- The confirmation is a `role="group"` named by the sentence (`Delete README.txt?`, `Delete all conversations?`, and their
  Spanish twins), with `Delete`/`Borrar` (primary) and `Keep`/`Conservar` (secondary); the focus goes to Keep, Escape keeps and
  returns the focus to the first button.
- `setupGroups` gives every group a stable `id` (the slug of its English title) and a `required` flag; `adminStrings(lang).setupGroups[id]`
  holds a title and a detail in both languages for every id of `.env.example`, so a new group of the template without a
  translation turns a test red.
- The title of a page of the panel is `<name> · Cited` in the language of the panel, and the sign-in answers `Sign in · Cited` /
  `Iniciar sesión · Cited` on every path while nobody is signed in.

## Gates

```
$ npx -y -p node@24 -- npm run typecheck     # exit 0 (the tests reach the new fields through casts until 10.2 types them)
$ npx eslint tests/brand-round-14c-*         # no output: clean
$ gitleaks protect --staged --no-banner      # no leaks found
```

## Issues

- **RISK**: several tests read the shape of the markup (`sr-only`, `flex-row`, `whitespace-nowrap`, `[@media(min-height:560px)]:sticky`)
  because jsdom has no layout. What a browser must measure (the box in reach at 812 px, 512x384 and 320x256, the flame on every page) is
  in the E2E of 10.5.
- **NOT DONE**: the tests of decision 32 (the flame loop) and the viewports of decision 23 are browser tests; they are written in 10.5.
