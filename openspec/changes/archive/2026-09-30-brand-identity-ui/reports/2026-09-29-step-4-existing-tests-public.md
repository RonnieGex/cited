# Step 4, public surface: the existing tests that changed (task 4.1, the part of the public page)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository. Commit: `a9c05b3` "Update the existing public tests where the design moved the markup: the switch, the waiting bar, the welcome headline and the numbered marks" (made before the code, so these four were red first).

Only assertions on markup that the design moved changed; no behaviour test changed and no key was renamed.

| Test | Change | Why |
|---|---|---|
| `tests/chat.test.tsx` "shows the welcome message and a labelled question box" | the last line asserted the `Español` button in the chat; it now asserts there is none | decision 9: the language switch moved out of the chat into the band of the page. The switch itself is asserted in `tests/brand-public.test.tsx` and its behaviour in `tests/i18n.test.tsx` (unchanged, green) |
| `tests/chat.test.tsx` "renders the answer with its citation chip and opens the excerpt, the document and the heading" | the excerpt, the document and the heading are read inside `getByRole("region", { name: "Citation 1" })` | decision 10: the sources list now shows the document name beside its mark, so `getByText(document)` would find two elements; the panel is read on its own. The behaviour (open, read, close) is the same |
| `tests/chat.test.tsx` "paints the ask button and the accents with the primary color of the settings" | the loading accent is read on `[data-cited="waiting-bar"]` (`bg-[var(--primary)]`) instead of `border-[var(--primary)]` on the loading text | decision 11: the waiting accent is the bar, not a side stripe. The intent (the accent of waiting takes the primary color) stays |
| `tests/public-page.test.tsx` "names the product when no business setting exists yet" | the welcome is read from `[data-cited="welcome"]` with `toHaveTextContent` | decision 9: the welcome is the headline and its last words sit in the highlighter, so its text is split across two nodes and `getByText` of the whole sentence no longer matches one element |
| `tests/markdown.test.tsx` "renders a citation marker as a button that names the citation" | `toHaveTextContent("[1]")` became `textContent` equal to `"1"` | decision 3: the mark shows the number of the source in a lime square; its name stays `Citation 1` through `aria-label` and the click still calls `onCitation(1)`. The plain-text fallback `[1]` (nothing to open) is unchanged and still tested |

Unchanged and green: `tests/embed.test.tsx` (2), `tests/i18n.test.tsx` (9), the rest of `tests/chat.test.tsx` (session id, refusal, failure, empty question, Escape in the widget) and of `tests/public-page.test.tsx` (language, color fallback, logo, cookie precedence, the document `lang`).

The run before the code (the four tests that the moved markup turned red; the `chat` test about the source document was already compatible with the old markup):

```
$ npx vitest run tests/chat.test.tsx tests/public-page.test.tsx tests/embed.test.tsx tests/markdown.test.tsx tests/i18n.test.tsx   (<worktree>, at a9c05b3)
     × renders a citation marker as a button that names the citation
     × names the product when no business setting exists yet
     × shows the welcome message and a labelled question box
     × paints the ask button and the accents with the primary color of the settings
 Test Files  3 failed | 2 passed (5)
      Tests  4 failed | 40 passed (44)
```

The green run after the code is in `2026-09-29-step-3-implementation-public.md` (76 tests in the six files, 107 with the static tests).

## E2E read, not run

I may not run Playwright in this worktree. I read `e2e/public-chat.spec.ts`, `e2e/widget.spec.ts`, `e2e/home.spec.ts` and `e2e/brand.spec.ts` against the markup and changed none of them. Selectors checked by reading: the label `Your question` and the single button that contains "ask" (the page has English, Español, `Citation n` marks and `[n] document` sources, none with "ask"); `[data-cited="answer"]` with the `Citation n` buttons inside it, `citation` and `refusal`; `[data-cited="turn"]`, `sources`, `ask` and `[data-public="band"]`; the `h1` "Cited" (visually hidden, still in the accessibility tree) and the business name as the only `h1`; `form button[type="submit"]` painting `--primary` on `/` and `/embed`; `Español` and the `Language` group inside the band; `.hl` in the headline and in the open citation; the embed inside the widget iframe.
