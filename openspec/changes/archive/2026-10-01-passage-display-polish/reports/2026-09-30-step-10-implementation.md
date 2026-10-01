# Step 10 — the implementation of Amendment 1

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 10.3)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** the commit that carries it (the parent is `2fc6e53`, the red of the
  tests of Amendment 1)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the four decisions of the amendment are implemented and the tests they made red are green. No test was
  deleted, relaxed or skipped.

## The command of the unit suite

```
<worktree> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run

 Test Files  89 passed (89)
      Tests  1055 passed (1055)
   Duration  76.50s
[exit code: 0]
```

Node of this run: `v24.21.0` (`npx -y -p node@24 node -v`). The same run before the fix was 8 failed and 1047 passed
in three files (`reports/2026-09-30-step-10-red.md`). `npm run typecheck` and `npm run lint` exit 0 at this tree.

## Decision 9 — the heading once, in one place per view

`components/chat/CitationPanel.tsx` renders `PassageBody` with `showHeading={false}`, so the heading is never painted
above the passage, and the `<dd>` of the section line carries `data-passage="heading"`: it is the one place the panel
shows the text of the heading, and `PassageBody` still removes it from the start of the excerpt. Try it and the page
of a document already showed it once, as the section label and as the `h2`; both now have a browser case that counts
it.

## Decision 10 — one list

`components/chat/PassageBody.tsx` no longer opens a `ul` of its own for the item that starts the body. `LinesBody`
collects the items of a run in one list and paints the lead inside the item that carries it, so the five items of
`Precios` are the children of one list whatever line they start on. A run of numbered items after a run of bullets
still opens its own list, because a list is one kind.

## Decision 11 — the lead in the owner's views

- `components/setup/TryItPanel.tsx` keeps the citation of each cited passage, not only its number, and hands its `lead`
  to `PassageBody`.
- `components/setup/DocumentPanel.tsx` computes `leadLength(passage before it on the page, passage)` for every passage
  of the page and hands it to `PassageBody`; the muted words are painted by the shared view and the highlighter of the
  passage a citation opened starts after them.
- `app/admin/information/[id]/page.tsx` reads `?highlight=` from the address and hands the position to `DocumentPanel`,
  so the page can open on the passage a citation marked. **Decision of the implementer**: no view links to that address
  yet — Try it opens the passage beside the answer, and the address is what the capture of 10.4 and the browser case
  use. It is copied to the `## Issues` of the round.

## Decision 12 — no list without line breaks

`components/chat/PassageBody.tsx` splits a body by its line breaks only; the split on the start of an item that turned
a flattened old passage into a list is gone. A body with no line break is one paragraph, whatever it holds, and a
passage stored before the change reads that way until its file is uploaded again. `docs/search.md` says so in its
chunking section, next to the sentence that already said that the old text is kept.

## The tests of the amendment that are green at this commit

| Decision | Unit case | Browser case |
|---|---|---|
| 9 | `tests/chat.test.tsx` (2), `tests/setup-ui.test.tsx` | `e2e/passage-display.spec.ts` (3), `e2e/setup.spec.ts`, `e2e/setup-es.spec.ts` |
| 10 | `tests/passage-view.test.tsx`, `tests/setup-ui.test.tsx` (2) | `e2e/passage-display.spec.ts` (3), `e2e/setup.spec.ts`, `e2e/setup-es.spec.ts` |
| 11 | `tests/setup-ui.test.tsx` (2) | `e2e/passage-display.spec.ts` (the lead of the panel), `e2e/setup-es.spec.ts` (the highlighted page) |
| 12 | `tests/passage-view.test.tsx` | — |
