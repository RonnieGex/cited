# Step 12, fixes of the adversarial review: the panel area

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of
`community-ui`, branch `feature/brand-identity-ui`. Area owned: `components/admin/`, `app/admin/`, `lib/i18n/admin.ts`,
`tests/admin-*`, `tests/brand-panel.test.tsx`, `e2e/admin.spec.ts`, `e2e/admin-brand.spec.ts`, `e2e/admin-fixtures.ts`.

Every command runs from `<worktree>`. Only the vitest files of this area were run; the whole suite, the build and Playwright are
for the reintegration agent. The E2E cases added or changed here were type-checked (`npx tsc --noEmit -p .`, no output) and
linted (`npx eslint e2e/admin-brand.spec.ts components/admin app/admin lib/i18n/admin.ts tests/brand-panel.test.tsx`, no
output) but not run. The live checks ran against the dev server on `http://localhost:3300` with a Playwright probe kept outside
the repository (sign-in through `/api/admin/login` with the password of the local environment, never printed).

## Commits

| Commit | What |
| --- | --- |
| `b64e73c` | Print the dates of the conversations as a time in the language of the panel |
| `671c5fa` | Keep the keyboard in the panel bar: first Tab on the wordmark, focused links whole |
| `2eefee3` | Quiet the panel chrome: sign-in language, plain Setup chips, no restated headings |
| `8e5d941` | Fit the documents table and the panel bar to a phone |

gitleaks, from the hook, on each of the four commits:

```
INF 0 commits scanned.
INF scanned ~6262 bytes (6.26 KB)   (b64e73c)   / ~7697 (671c5fa) / ~5628 (2eefee3) / ~8880 (8e5d941)
INF no leaks found
```

## Findings fixed

### 1. Dates read like dates (blocker, three reports: critique, compliance, engineering) — `b64e73c`

`lib/i18n/admin.ts` gains `formatWhen(iso, lang, timeZone)`: `Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle:
"short", timeZone })`. `ConversationsPanel` takes `lang` and `timeZone` and renders `<time dateTime={createdAt}>`. The page
passes the zone of the server (`Intl.DateTimeFormat().resolvedOptions().timeZone`), so the text rendered on the server and the
text hydrated in the browser are the same (the hydration risk the engineering report named). `tests/admin-ui.test.tsx` only
gains the two new required props of `ConversationsPanel` (`lang="en"`, `timeZone="UTC"`); no assertion changed.

Red first, `npx vitest run tests/brand-panel.test.tsx`:

```
 FAIL  ... > formats a stored value with the medium date and the short hour of the language, in the given zone
TypeError: formatWhen is not a function
 FAIL  ... > renders the When cell of Spanish as a time element with the ISO value and a date without T or Z
AssertionError: expected  to have a length of 1 but got +0
      Tests  2 failed | 22 passed (24)
```

Green, `npx vitest run tests/brand-panel.test.tsx tests/admin-ui.test.tsx`: `Test Files 2 passed (2)`, `Tests 36 passed (36)`.

Live, Spanish, `/admin/conversations` at 375 px (probe):

```
times [["2026-09-29T22:19:44.374Z","29 sept 2026, 16:19"],["2026-09-29T22:19:39.018Z","29 sept 2026, 16:19"], ...]
```

E2E added: `e2e/admin-brand.spec.ts`, "the conversations in Spanish print each date as a time an owner reads": it uploads a
document of its own (never the one `admin.spec.ts` deletes), asks about it, and asserts one `time` per row, `dateTime` equal to
the stored ISO value, text without `T` or `Z` equal to `formatWhen` for `es`, no hydration error in the console, and axe.

### 2. The first Tab skipped the wordmark and the sections (engineering, major) and focused links were off-screen on a phone (accessibility, major) — `671c5fa`, refined in `8e5d941`

The mount no longer calls `scrollIntoView` (in Chromium it moved the starting point of the sequential focus). It scrolls the
list itself, only when it overflows. Each link calls `scrollIntoView({ inline: "nearest", block: "nearest" })` on focus, and the
list has `scroll-px-6` (24 px of scroll padding). In `8e5d941` the mount scroll became "nearest" instead of "center": the list
stays at its start when the current section fits there and otherwise scrolls only until the current one is whole and 24 px from
the edge (the compliance report asked "scroll it to start when the current item fits"). The two unit tests of the centering,
written in `671c5fa` in this same step, were rewritten for the new behavior; they are not a loosened assertion but the
assertion of the behavior that replaced it, and they were red first:

```
 FAIL  ... > scrolls only the list, and only as far as the current section needs to be whole and clear of the edge
AssertionError: expected -187.5 to be 75 // Object.is equality
 FAIL  ... > stays at the start when the current section already fits there
AssertionError: expected -187.5 to be +0 // Object.is equality
```

Red of `671c5fa`, `npx vitest run tests/brand-panel.test.tsx`:

```
 FAIL  ... > never calls scrollIntoView when it mounts, so the first Tab starts at the top of the page
AssertionError: expected "vi.fn()" to not be called at all, but actually been called 1 times
 FAIL  ... > brings a link reached with the keyboard into view, sideways and only as far as needed
AssertionError: expected "vi.fn()" to be called with arguments: [ { inline: 'nearest', …(1) } ]
 FAIL  ... > keeps a focused link clear of the edges of the list and fades the edges where the list scrolls
AssertionError: expected '-mx-6 overflow-x-auto px-6 lg:mx-0 lg…' to contain 'scroll-px-6'
      Tests  5 failed | 25 passed (30)
```

Green: `Tests 42 passed (42)` (after `671c5fa`), `Tests 54 passed (54)` (after `8e5d941`, with `tests/admin-ui.test.tsx`).

Live, Spanish, fresh load, six presses of Tab (probe, after `8e5d941`):

```
1440 /admin/documents ["A:Cited1 x=24..95 h=29.6","A:1Configuración x=24..216 h=38.5","A:2Negocio ...","A:3Documentos ...","A:4Conversaciones ...","BUTTON:English ..."]
375 /admin/documents ["A:Cited1 x=24..95 h=45.6","A:1Configuración x=24..172 h=44.0","A:2Negocio x=176..284 h=44.0","A:3Documentos x=213..351 h=44.0","A:4Conversaciones x=192..351 h=44.0","BUTTON:English x=24..82 h=44.0"]
320 /admin/documents ["A:Cited1 x=24..95 h=45.6","A:1Configuración x=24..172 h=44.0","A:2Negocio x=176..284 h=44.0","A:3Documentos x=158..296 h=44.0","A:4Conversaciones x=137..296 h=44.0","BUTTON:English x=24..82 h=44.0"]
```

The first Tab lands on the wordmark at every width, and every focused link is whole inside the screen (375 and 320).

E2E changed: the 375 px case no longer calls `scrollIntoViewIfNeeded`; the helper `tabThroughTheBar` presses Tab from a fresh
load, asserts the wordmark is focused first, then each link focused and `toBeInViewport({ ratio: 1 })` with its height. A new
case runs it at 1440 (24 px targets) and at 320 px in Spanish (44 px targets, no horizontal scroll of the page).

### 3. The wordmark link was 70.5 x 21.6 px (accessibility, major) — `671c5fa`

In `AdminNav` the wordmark gets `py-1 -my-1` and, below 1024 px, `max-lg:py-3 max-lg:-my-3`: the padding grows the target and
the negative margin keeps the word where it was. Measured live: 45.6 px tall on a phone, 29.6 px from 1024 px (probe above).
`components/brand/Wordmark.tsx` is not in this area and was not touched.

### 4. Fade on the scrolling edge of the bar (part of the compliance major and of a critique minor) — `671c5fa`

The list carries, below 1024 px, `mask-image: linear-gradient(to right, transparent, black 24px, black calc(100% - 24px),
transparent)`: at the start the fade covers only the padding, and a section cut by the edge reads as more to scroll. It is a
mask on the list, not gradient text. Looked at in the captures of 375 and 320 px.

### 5. The sign-in shell carried no `lang` (accessibility, minor) — `2eefee3`

`AuthShell` takes `lang` and sets it on its `main`; the layout passes the panel language to the sign-in and to the
unconfigured page, as the signed-in branch already did. Red: `expected null to be 'en'` / `'es'` (three tests). Live: `signin
lang es`.

### 6. Setup chips painted lime with `!important` overrides (critique major, compliance major) — `2eefee3`

`app/admin/page.tsx` renders the plain kit `<Chip>` again: no lime for a value that is merely present, no `!` override, and
decision 6 ("Chip keeps its markup and classes") holds. Red: `Missing: expected 'inline-block rounded-none border bord…' not to
match /!(\s|$)/`. The redesign of Setup (no variable names, no capital badges) stays with the guided-setup lane.

### 7. Restated headings (critique, major) — `2eefee3`

`signInTitle` is now "Sign in to your panel" / "Entra a tu panel" (the key is unchanged, so `e2e/admin.spec.ts` still finds
it); the eyebrow `panelEyebrow` leaves the sign-in, the unconfigured page and the four panel pages (the key stays: it names the
navigation landmark); the `h2` inside the Documents and Conversations boxes is `sr-only`. Red: `expected 'The panel of Cited' to
be 'Sign in to your panel'`, the eyebrow found on every page, `expected '' to contain 'sr-only'`.

Green of `2eefee3`, `npx vitest run tests/brand-panel.test.tsx tests/admin-ui.test.tsx tests/admin-i18n.test.tsx`:
`Test Files 3 passed (3)`, `Tests 53 passed (53)`.

### 8. The Documents table cut its actions on a phone (compliance major, engineering minor) — `8e5d941`

The two actions move under the name of their document as a `group` named "Actions" / "Acciones", each button
`whitespace-nowrap`; the name wraps anywhere; the Actions column goes; the cells tighten to `px-2` below `sm`; the box is a
labelled region with `tabIndex=0` and the focus ring, like Conversations. Red:

```
 FAIL  ... > puts the two actions under the name of their document, in the same cell, as a named group
TestingLibraryElementError: Unable to find an accessible element with the role "group" and name "Acciones"
 FAIL  ... > keeps each action on one line and lets a long name wrap anywhere
AssertionError: Re-ingest: expected 'inline-flex items-center justify-cent…' to contain 'whitespace-nowrap'
 FAIL  ... > makes the box a labelled region reachable by keyboard, like the one of Conversations
TestingLibraryElementError: Unable to find an accessible element with the role "region" and name "Documents"
```

Live, Spanish (probe; `sw`/`cw` are the scroll and client widths of the box):

```
375 {"regionRight":351,"sw":325,"cw":325,"page":375,"btns":["Reingesta r=174 h=44","Borrar r=152 h=44",...]}
320 {"regionRight":296,"sw":270,"cw":270,"page":320,"btns":["Reingesta r=174 h=44","Borrar r=152 h=44",...]}
```

Before the `px-2` the box still scrolled 19 px at 320 (`sw 289, cw 270`); now nothing scrolls. E2E added: "the documents at 375
and 320 px keep every action whole, on one line, inside the box and the screen", with a document of its own and a long name,
then axe and the delete through the button.

## Findings not fixed, with the reason

- **Critique, major: the current section barely marked, the rest marks read as empty checkboxes.** The fix asks to change the
  `ink` tone of `components/brand/CitationMark.tsx` (not in this area) to a lime current mark with an ink number. Decision 7 of
  `design.md` specifies the opposite: the current mark "ink-on-lime inverted (ink background, lime number)" and the others a
  `text-paper/60` mark, and `tests/brand-panel.test.tsx` and `e2e/admin-brand.spec.ts` assert that. The design is the
  specification, so this is answered here, not changed. Dropping `bg-paper/10` from the current link alone would make the
  current place weaker, the opposite of the finding's goal.
- **Compliance, major, second half: extend `tests/brand-static.test.ts` to reject `!` modifiers and `!important`.** That file is
  not in this area; the one `!` override of the panel is gone (`2eefee3`) and a unit test of this area guards the Setup chips.
  The static ban belongs to the foundation fixer.
- **Critique, minor: an inline confirmation before Delete and Delete all.** A confirmation is a new behavior that no scenario of
  the specs describes; by the rule of the project a change of behavior goes into the spec first. It also changes the flows of
  `e2e/admin.spec.ts` that this step cannot run. Proposed for the guided-setup or a later change.
- **Critique, minor: Conversations as a stacked list below `sm`.** Documents fits a phone now and the bar fades; the four
  columns of Conversations still scroll inside their focusable, labelled region at 375 px (the When column off to the right).
  A stacked layout changes table semantics and needs its own review; left for a later change.
- **Engineering, minor: the wordmark reloads the whole document.** The clean fix is a link component prop on
  `components/brand/Wordmark.tsx`, not in this area; wrapping it in `next/link` from `AdminNav` would nest a second anchor or a
  second `data-brand="wordmark"`. Left to the foundation fixer.

## Tests of the area

`npx vitest run tests/admin-business-missing.test.ts tests/admin-business.test.ts tests/admin-documents.test.ts
tests/admin-guard.test.ts tests/admin-i18n.test.tsx tests/admin-lockout.test.ts tests/admin-routes.test.ts
tests/admin-session.test.ts tests/admin-setup.test.ts tests/admin-ui.test.tsx tests/brand-panel.test.tsx`

```
 Test Files  11 passed (11)
      Tests  107 passed (107)
```

Before this step the same eleven files had 87 tests (step 4 report); 20 new tests, all red first.

## Issues

- **BROKEN:** none known.
- **RISK:** the date is printed in the zone of the server; a container without `TZ` prints UTC. Setting `TZ` in the deployment
  gives the owner local hours. The E2E cases of this step were type-checked and linted, not run.
- **NOT DONE:** the five findings above. The group titles and details of Setup come in English in Spanish too (from
  `lib/admin/setup.ts`, not in this area; seen in the capture, not reported by the review). The language switch buttons measure
  16.5 px tall at 1440 (component not in this area).
- **UNKNOWN:** whether Chromium's ICU and Node's ICU could ever print a different `es` medium date; they matched on this machine
  and the E2E asserts no hydration error.
