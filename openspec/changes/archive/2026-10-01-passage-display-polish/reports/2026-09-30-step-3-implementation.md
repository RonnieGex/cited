# Step 3 — the implementation of the eight decisions

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, tasks 3.1 to 3.7)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** the commit that carries it (the parent is `2feeb46`, the red tests)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the ten red cases of step 2 are green, the whole unit suite passes with **89 files and 1051 tests**
  (1018 before the change, 33 new), `tsc --noEmit` reports no error and `eslint` reports no error.

## The command

```
<worktree> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run
 Test Files  89 passed (89)
      Tests  1051 passed (1051)
   Duration  80.54s
[exit code: 0]

<worktree> > npm run typecheck
> next typegen && tsc --noEmit
[exit code: 0]

<worktree> > npm run lint
> eslint .
✖ 0 problems
[exit code: 0]
```

## 3.1 The chunker keeps the lines of a list — decision 2

`lib/ingest/chunk.ts`: `blockText()` joins an item of a list (a line that starts with `- `, `* ` or a number followed by
`. `) to what comes before it with `\n`, and every other line with a space. An empty line no longer flushes the block:
it is a boundary, and the lines on both sides are joined by the same rule, so the paragraph that introduces a list
keeps it and the list starts on its own line. The keyword index tokenizes `\n` like a space, so the search does not
move (measured in step 5.2).

`tests/fixtures/documents.ts`: `buildDocx()` grew an optional `list: true` per paragraph, which writes the numbering
part of the DOCX (`word/numbering.xml`, its relationship and the `w:numPr` of the paragraph). The case of the Word list
of `tests/chunk-lists.test.ts` reads a real bulleted list of a DOCX, which `parse.ts` turns into `- ` lines.

## 3.2 The helpers of the body and of the lead — decisions 1 and 4

- `components/chat/PassageBody.tsx` holds `passageBody(text, heading)` (the text without the heading at its start) and
  re-exports `leadLength` so every view that shows a passage reads both from one module.
- `lib/answer/lead.ts` holds `LEAD_LIMIT` (120), `leadLength(previous, text)`, `leadOf(store, document, position,
  text)`, `citationsWithLeadFromStore(store, citations)` and `citationsWithLeadFromPassages(citations, passages)`.

`leadLength` is the longest prefix of the excerpt, at most 120 characters, whose end is a word boundary of the excerpt
(the character after it is a whitespace, or the prefix is the whole excerpt) and which is also the end of the passage
before it. The end of the prefix is what keeps a half word out: `"cambio de cámara: 120 pesos."` against a passage that
ends with `"cambio de cámara, la bici"` repeats nothing, because the character after `"cambio de cámara"` is a colon.

## 3.3 `lead` on every citation of the answer — decision 4

`lib/answer/citations.ts` stays pure: it writes `lead: 0` on every citation. `lib/answer/ask.ts` calls
`citationsWithLeadFromStore()` after `extractCitations()`, which reads the passages of each cited document from the
store and gives every citation the length of the words it repeats from the passage at `position - 1`. `Citation` of
`lib/answer/types.ts` carries the new field, and no other field changed.

## 3.4 One shared view of a passage — decisions 3, 4 and 5

`PassageBody` renders the heading once, then the body: consecutive item lines become one `<ul>` (or `<ol>` for numbered
items) with one `<li>` per item and every other line a `<p>`. A passage stored before this change holds its list
flattened with " - ", so the view also splits a body on the start of an item: an old passage reads as a list too. The
highlighter is an inline `<span>` inside its paragraph or its item — never a child of the `flex items-baseline`
container — so `.hl` paints under each line with `box-decoration-break: clone`. The lead is a muted `<span>` outside the
highlighter.

The three views use it: `CitationPanel` (the public page and the widget) shows the heading and the highlighted excerpt;
`TryItPanel` and `DocumentPanel` show the passage of their section.

## 3.5 The citation's number in Try it, no mark on the document page — decision 6

`TryItPanel` maps every citation of the answer to the passage it cited and paints `CitationMark n={citation.n}` beside
it — the number of the citation, never `passage.position`. `DocumentPanel` paints no citation mark at all and its
`sr-only` labels count the passages of the document from 1.

## 3.6 Suggestions in the language of each document — decision 7

`lib/admin/questions.ts` groups the headings by document, reads the language of each document with `detectLanguage()`
over its first passages (up to 2,000 characters, no model call, nothing new stored), and offers the headings of the
documents of the panel's language first and the others after them, up to four unique headings.

## 3.7 One Spanish name — decision 8

`lib/i18n/admin.ts` (`setupOpen`, `setupSkippedNote`, `setupReopen`, `setupStepsTitle`), `README.es.md` and
`docs/owner-guide.md` (the heading and the sentence) now say "configuración guiada". No English string changed.

## The expectations of the existing tests that this step updated

- `tests/chat.test.tsx`: the panel of a citation no longer matches `getByText(excerpt)` on its own, because the heading
  is an element of its own above the excerpt; the case reads the excerpt inside `.hl` and the heading with
  `getAllByText(heading)` (twice: the passage and the `dd` of the note). Reason: the same behaviour the spec asks for.
- `tests/brand-public.test.tsx`, `tests/brand-round-14c-public.test.tsx`, `tests/ask-client.test.ts`,
  `tests/voice-tool.test.ts` and `tests/chat.test.tsx`: their `Citation` fixtures carry `lead: 0`. Reason: the new
  required field of the type; the value is the one a first passage of a section carries.
- `tests/setup-ui.test.tsx`: the two new cases read the passage of `Try it` and the page of a document with the new
  structure (the list of five items, the citation's number `2`, no mark on the page).
