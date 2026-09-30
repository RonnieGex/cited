# Step 10.2: the fixes of decisions 21 to 29 and 31, and the minors of decision 33

Implementer: Sonnet 5.5. Date: 2026-09-29. Windows 11, `node -v` under `npx -y -p node@24` is `v24.21.0`. The 77 red tests of 10.1
are green and nothing else went red.

```
$ npx -y -p node@24 -- npm test
 Test Files  78 passed (78)
      Tests  870 passed (870)
$ npx -y -p node@24 -- npm run typecheck    # exit 0
$ npx -y -p node@24 -- npm run lint         # exit 0, 0 errors, 1 warning in an ignored reviewer script under .data/
$ gitleaks protect --staged --no-banner     # no leaks found, before each of the commits below
```

## The commits

| Commit | What |
|---|---|
| `364caf2` | Decisions 21 to 27 in the chat and the two public pages: `askCited` returns a kind, `PublicStrings.errors`, the announcer as the one live region, the session in memory, the box that sticks from 560 px, `generateMetadata` of `/` and `/embed`, marks against their word, sources by passage, the footer and the placeholder, the landmarks of the public page |
| `66b901c` | The focus of a control on paper (ink outline, lime ring inside), the 24 px language buttons, the preload of Outfit |
| `be6727d` | Decisions 24 (panel), 28 and 29: titles of the panel, `ConfirmedDelete`, the localized groups of Setup and the sentences of a provider test, the column as a plain element, the tab stop that follows the scroll |
| `27c27e9` | `.gitignore`, the capture script, the index of step 3 (decision 31), the two guards (dependencies and specs) |

## What each decision became

- **21.** `lib/chat/client.ts`: `AskResult` failed is `{ status: "failed"; kind: "rate_limited" | "unavailable" | "network" }`; the status decides and the
  body of a failure is never read. `PublicStrings.errors[kind]` holds the three sentences of the decision in both languages;
  `Chat` prints only those and the announcer says the same sentence once; the pending and the failed blocks lost their `role="status"`.
  Each entry is keyed `${index}-${kind}` so a retried entry mounts a new node.
- **22.** `sessionOf()` in `Chat`: the storage in a `try`, an id kept in a `useRef` when it throws, and everything of `send` after the pending
  entry inside one `try` that lands a failure entry (`unavailable`).
- **23.** The form is `[@media(min-height:560px)]:sticky`, its scroll padding is reserved under the same `matchMedia` condition, the label is `sr-only`
  once threaded on the page too, and field and button share one `flex-row` with the safe-area padding.
- **24.** `generateMetadata` on `/` and `/embed` returns the name of the business (`Cited` with none); `lib/admin/titles.ts` and one `generateMetadata`
  per page of the panel answer `Documents · Cited` / `Documentos · Cited` and the sign-in title while the layout shows the sign-in.
- **25.** `Markdown`: the space before a mark is dropped, `ms-[0.15em]` replaces `mx-1`, and the last word, the marks and the punctuation that follows are one
  `whitespace-nowrap` span.
- **26.** A source row shows `heading ?? document` and the document on a `text-xs text-ink-2` line unless it repeats; its name is `[n] heading, document`.
- **27.** The footer is the small wordmark, `Answers by Cited` / `Respuestas de Cited`, a middot and the flame with `Built by Katalis` / `Hecho por Katalis`, one
  `text-sm` row; the placeholder is `Type your question` / `Escribe tu pregunta` (also in the kit sample).
- **28.** `components/admin/ConfirmedDelete.tsx`: Delete (a document) and Delete all swap for a `role="group"` named by its sentence with Delete and Keep; the
  focus moves to Keep; Escape keeps and gives the focus back; the request goes only on the second press.
- **29.** `setupGroups` gained `id` (the slug of the title in the template) and `required` (the comment that opens with "Required"); `lib/i18n/setup-groups.ts` holds the
  15 groups in both languages and a test fails if a group of `.env.example` has no entry; `TestButton` prints `testOk` / `testFailed` with `providerChat` /
  `providerEmbeddings` and never `detail`.
- **31.** `reports/2026-09-29-step-3-implementation.md` indexes the three reports of step 3 and their eleven commits, all checked to exist.

Decision 33 fixes the ink focus ring on paper although decision 1 says the focus ring does not change: the later decision wins, and `components/ui/focus.ts`
says so in its comment. Three focus rings now exist: `focusRing` (paper), `focusRingOnInk` (the ink column, the ghost button, the wordmark on ink) and
`focusRingOnBrand` (the language switch over the band of the business, the color of its text).

## The existing tests that changed, and why (only markup that a design decision moved, never a behaviour)

| Test | Why |
|---|---|
| `tests/ask-client.test.ts` (4) | decision 21: a failure carries a kind, not `message` |
| `tests/chat.test.tsx` (2) | decision 21: the chat prints the sentence of the kind, in the language of the page |
| `tests/brand-public.test.tsx` (13) | 21 (failure and wait have no `role="status"`, the announcer text), 23 (the label is `sr-only` once threaded), 26 (the source button is named `[n] heading, document`), 33 (a `group` and not an `aside`; the band, the footer and `main` under one wrapper that carries `--primary`), 5 (only the first two marks land) |
| `tests/public-page.test.tsx` (3) | 33: the variables and the `lang` live on the wrapper of the page, the footer flame is decoration (`alt=""`) |
| `tests/brand-foundation.test.tsx` (2), `tests/brand-foundation-tweaks.test.tsx` (1) | 33: the focus of a mark, a brand button and a file field on paper is ink with a lime ring; the ghost button keeps lime |
| `tests/brand-panel.test.tsx` (1) | 33: the box of Documents is a tab stop only while it scrolls |
| `tests/admin-ui.test.tsx` (4) | 28 and 29: the second press deletes; a provider test says the sentence of the panel |
| `tests/readme.test.ts`, `tests/brand-static.test.ts` | minors 42 and 43 |

## Decision 33: the 54 minors, one decision each

Fixed in this round when the fix is a line in a file the round already touches; otherwise queued as `brand-identity-polish` with its evidence (the finding
text and its `where`). "Task" points at the task of section 10 that carries the fix when it is not 10.2.

| # | Decision |
|---|---|
| 2 | Fixed (`66b901c`): ink outline plus lime ring on paper, lime kept on ink |
| 3 | Fixed (`66b901c`): `min-h-6` on the language buttons at every width |
| 4 | Fixed (`364caf2`): the sources are a `group` named Sources, not an `aside` |
| 5 | Fixed (`364caf2`): the announcer is the only live region (decision 21) |
| 6 | Fixed (`be6727d`): the column is a `div` with its `nav`. The optional skip link is queued: it becomes the first tab stop and moves every keyboard walk of the E2E |
| 7 | Fixed (`364caf2`): band and footer beside `main`, the list is unnamed, the footer flame has `alt=""` |
| 8 | No change: the disabled Ask button is an inactive control, exempt from 1.4.3; the finding says none is required |
| 9 | Captures: fixed in 10.5 (shot against `next start`, the script hides the indicator, `27c27e9`). The `proposal.md` line about a menu button is contract text: for Fable |
| 10 | Fixed (`be6727d`): `useOverflowing` makes the box a tab stop only while it scrolls |
| 20 | Fixed (`be6727d`) with the finding's second option: the Citations column leaves a phone. The stacked rows are queued |
| 21 | Fixed (`364caf2`): the rule sits on an inner div, aligned with the column |
| 22 | Queued: decision 10 says the refusal is a paper panel |
| 23 | Fixed in part: "Try again" twice is gone with the sentences of decision 21. The refusal label, its missing next step and the repeated "You asked" are queued (decision 10) |
| 24 | Queued: decision 9 sets the two sizes |
| 25 | Fixed in part (`66b901c`): the hit target is 24 px. The 11 px text size is queued (`DESIGN.md` gives the switch the label style) |
| 26 | Fixed (`66b901c`): Outfit is preloaded from the app's own file |
| 27 | Queued: decision 5 defines `rise` and `bar` as built |
| 28 | Fixed (`364caf2`): only the first two marks of an answer land |
| 29 | Fixed in part (`364caf2`): the dash of the refusal is paper on ink. The chosen language in lime is queued (decision 6 says lime) |
| 30 | Queued: the default color lives in `lib/theme/primary.ts`, a shared module, and `DESIGN.md` names the lime fallback |
| 31 | Queued: it needs a spec note that the headline carries the business tint |
| 32 | Queued: the file button of the kit is decided in `Input`, and the copy and the row layout of Documents are a redesign of the page |
| 33 | Queued: `app/admin/layout.tsx` is not touched by this round; the gutter is a layout decision |
| 34 | Queued: `BusinessForm` is not touched by this round |
| 35 | Queued: `AuthShell` is not touched by this round |
| 36 | Queued: more kit rows than a line |
| 37 | Queued: `DESIGN.md` says the kit keeps the timing of Construye for its buttons |
| 38 | Fixed (`be6727d`): the intro says what the column shows, the numbers of the sources |
| 41 | For Fable: the boxes for decisions 16 to 19 are text of `tasks.md` |
| 42 | Fixed (`27c27e9`): the guard compares with `main` or with `tests/fixtures/dependencies-of-main.json`, and never skips |
| 43 | Fixed (`27c27e9`): the guard compares requirements and scenarios without case or spacing, and the fallback of the name is pinned |
| 44 | Fixed in part here (`be6727d`): `suppressHydrationWarning` is gone. The retry loop of the E2E is 10.5 |
| 45 | Task 10.7 for `DESIGN.md`, `docs/design-system.md` and the comment of `tokens.css`. The two ratios in `design.md` (7.0 and 6.8) are contract text: for Fable |
| 46 | Task 10.7: the delivery is brought up to date |
| 47 | Task 10.5: the captures of record come from `next start` |
| 48 | Fixed (`364caf2`): same as decision 21 |
| 49 | Task 10.7: the delivery lists the files beyond the proposal with the decision that required each. The text of `proposal.md` is for Fable |
| 50 | Task 10.3: audit, the container and the full gitleaks scan at the tip |
| 54 | Fixed (`364caf2`): each entry is keyed by its index and its kind |
| 55 | Fixed (`364caf2`): an open source keeps its ink mark under the pointer |
| 56 | Fixed (`364caf2`): `landedAt` decides which entry lands, and the note of a passage is keyed by its number |
| 57 | Fixed (`364caf2`): same as decision 23 |
| 58 | Queued and UNKNOWN: `viewport-fit=cover` needs a review of every band under a notch and a device to see it; the `env()` padding stays where it is |
| 59 | Fixed (`66b901c`): same as 26 |
| 60 | Fixed (`be6727d`): the fold reads the `required` flag of the group, not its English title |
| 61 | Fixed (`be6727d`): same as 10 |
| 62 | Fixed (`364caf2`): the footer flame is decoration |
| 63 | Task 10.5: same as 40 |
| 64 | Queued: the kit page is not touched by this round and the samples are real controls by design |
| 65 | Fixed (`be6727d`): same as 6 |
| 66 | Fixed (`364caf2`): same as 28 |
| 67 | For Fable: `proposal.md` line 18 |
| 68 | Fixed (`27c27e9`): `/.vitest/` in `.gitignore` |
| 69 | Fixed in part (`27c27e9`): the script hides the indicator of `next dev`. Reading the password from `.env.local` is queued: it would open an environment file with secrets |

Counts (54 minors): fixed here 26; fixed in part here 5 (23, 25, 29, 44, 69, the rest of each is queued or in 10.5); moved to a later task of this
round 7 (9, 45, 46, 47, 49, 50, 63); queued as `brand-identity-polish` 13 (22, 24, 27, 30, 31, 32, 33, 34, 35, 36, 37, 58, 64) plus the remainder of the five partial
ones; for Fable 2 whole (41, 67) and the contract-text half of 9, 45 and 49; no change 1 (8). The rows 39 and 40 of the review are majors, not minors: they are decisions
31 and 32.

## Issues

- **RISK**: the browser behaviour of decisions 23, 25 and 28 is measured in 10.5 (the box at 812 px, 512x384 and 320x256; the marks at 375 px; the confirmation by keyboard).
  jsdom proves the markup and the order of events, not the layout.
- **RISK**: `focus.ts` now has three rings; a new control on ink must use `focusRingOnInk`. The kit page shows the switch on ink and paper, and the E2E contrast sampler
  does not measure a focus ring.
- **NOT DONE**: the 13 queued minors, the remainder of the five partial ones and the contract text for Fable, listed above. Setup as an owner's page is ff-13, not this round (decision 30).
- **UNKNOWN**: how the panel reads with a very long Spanish group title on a phone; the titles were written to the length of the English ones.
