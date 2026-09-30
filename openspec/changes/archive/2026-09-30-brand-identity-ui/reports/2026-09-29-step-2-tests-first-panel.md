# Step 2, tests first: the panel surface (task 3.3)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.

## The tests

`tests/brand-panel.test.tsx` (new, 22 tests, commit `7f587c7`), decisions 7 and 8 and the hooks of 17:

- the new keys `tagline` and `builtBy` in both languages, and the two key sets still equal;
- the numbered navigation (`AdminNav`, with `next/navigation` mocked): four links in order with their hrefs, each with a
  `data-brand="citation-mark"` and the pattern `^\s*N\s*Name\s*$` that `e2e/admin-brand.spec.ts` uses; `aria-current="page"` on
  the current path only (`/admin` only on itself, a section on its own path and below it, nothing when `usePathname` is null);
  the inverted mark for the current one (`bg-ink text-lime`) and `text-paper/60` for the others; the landmark name; the
  wordmark as a link to `/admin` and no heading in the column; exactly one `language-switch` and one sign-out; the silver flame
  and "Built by Katalis"; Spanish;
- the whole signed-in layout (`app/admin/layout.tsx` rendered with `cookies` and `guardSession` mocked): one switch, one
  sign-out, one `h1`, one `main`, the `lg:grid-cols-[240px_1fr]` grid with the column as a direct child, `max-w-[960px]`;
- the split sign-in: the tagline in English and Spanish with `.hl` on its last three words (`it came from.`, `de dónde salió.`),
  the form label and button under one `h1`, wordmark and flame on the ink half, no navigation, `lg:grid-cols-2` with the ink half
  first and the paper half holding the form;
- the unconfigured page in the same shell (`data-admin="auth"`): its heading and message, the wordmark and tagline, no form.

## Red

Command, before any implementation, from `<worktree>`:

```
npx vitest run tests/brand-panel.test.tsx
```

Result at commit `7f587c7` (the test file only, the code still the old one):

```
 Test Files  1 failed (1)
      Tests  18 failed | 4 passed (22)
```

The 18 failing tests: both string tests, the 11 tests of the navigation and the layout grid (the old `AdminNav` has no
`data-admin`, no numbers, no `usePathname`), and the five tests that read `data-admin="auth"` or `data-admin="tagline"`. The 4 that
passed already held with the old markup: the form label and button under one `h1`, the unconfigured heading and message, the Spanish
unconfigured heading, and one switch / one sign-out / one `h1` in the signed-in layout.

Hook output of the commit: `INF 0 commits scanned. INF scanned ~11714 bytes (11.71 KB) in 1.04s INF no leaks found`.

The E2E of this area (`e2e/admin-brand.spec.ts`, `e2e/admin.spec.ts`) is red by construction before the code and is run by the
integration agent; this agent does not run Playwright.
