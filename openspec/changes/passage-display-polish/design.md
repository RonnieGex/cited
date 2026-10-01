## Context

Facts read on `origin/main` at `86b250f` (paths and lines from that commit):

- The chunker makes a heading its own block (`lib/ingest/chunk.ts:43-51`) and joins blocks with a space (`:68`), so the
  first passage of a section starts with its heading; the heading is also stored in `heading` (`:71`). Embeddings
  (`lib/ingest/index.ts:109-112`) and the keyword index (`lib/store/index.ts:417-420`) use that text.
- The lines of one block are joined with a space (`chunk.ts:26`), so `- item` lines become one paragraph.
- Each passage after the first of a section starts with up to 120 characters of the end of the passage before it
  (`chunk.ts:4`, `:73-76`, `:96-108`), and the overlap is reset when the heading changes.
- There is no span: a citation highlights its whole `excerpt` (`lib/answer/citations.ts:40`), in `CitationPanel.tsx:27`,
  `TryItPanel.tsx:47` and `DocumentPanel.tsx:126`. In the last two the highlighted span is a child of a
  `flex items-baseline` container, which makes it a block, so `.hl` (`app/brand.css:18-25`) paints its band across the
  whole block instead of under each line.
- `TryItPanel.tsx:46` and `DocumentPanel.tsx:125` render `CitationMark n={passage.position}` (positions are 0-based);
  `TryItPanel.tsx:201` and `Chat.tsx:190-193` use the citation's `n`.
- `lib/admin/questions.ts:16-43` takes the first four headings of `getPassages({ limit: 200 })`, ordered by document
  name, so `bike-workshop-policies.md` comes first; documents carry no language. `lib/answer/language.ts:170-185`
  (`detectLanguage`) is the detector the answers already use.
- "alta guiada": `lib/i18n/admin.ts:531-536`, `README.es.md:100`, `docs/owner-guide.md:131` and `:135`.

## Decisions

1. **The heading is shown once, above the passage, and stored as today.** A pure helper (one module, used by every
   view) returns the body of a passage: its text without its heading at the start, when the text starts with the
   heading followed by whitespace. The stored text, the embeddings and the keyword index stay as they are, so search
   does not move.
2. **A list keeps its lines.** In the chunker, a line that starts with `- `, `* ` or a number followed by `. ` is a list
   item: it is kept on its own line (joined to what comes before it with `\n`, not with a space). Every other join stays
   a space. The keyword index tokenizes `\n` like a space, so keyword search does not move.
3. **The view of a passage** (one shared component) renders the body as paragraphs and lists: consecutive item lines
   become a `<ul>` (or an `<ol>` for numbered items) with one `<li>` per item, other text a `<p>`. A text with no line
   break (a passage stored before this change) renders as one paragraph, as today.
4. **The lead.** A pure helper `leadLength(previous, text)` returns the length of the longest prefix of `text`, at most
   120 characters and ending before a whitespace, that is also a suffix of `previous`; 0 when `previous` is missing.
   Each citation of `POST /api/ask` carries `lead`, computed from the passage at `position - 1` of the same document in
   the store; `extractCitations` stays pure and a separate step adds `lead`. Try it and the document page use the same
   helper on the passages they hold. The view renders the lead in the muted text colour, outside the highlight, and the
   highlight starts at the first character after it.
5. **The highlight paints line by line.** In every view the highlighted text is an inline element inside a paragraph or
   a list item, never a flex or grid child, so `.hl` paints under each line with `box-decoration-break: clone`.
6. **The citation's number.** Beside a passage that an answer cited, every view shows that citation's `n`. The document
   page, which shows passages without an answer, shows no citation mark; its passage labels for screen readers count
   from 1.
7. **Suggestions in the panel's language.** The language of a document is `detectLanguage` of the text of its first
   passages (up to 2,000 characters), computed when the suggestions are built; nothing new is stored. The suggestions
   take the headings of the documents in the panel's language first, in the order of today, then the other documents,
   up to four unique headings.
8. **One Spanish name.** "alta guiada" becomes "configuración guiada" in the Spanish strings and in the Spanish docs
   ("Tu alta guiada" → "Tu configuración guiada", "Después de la alta" → "Después de la configuración"). No English
   string changes.

## Out of scope

- Spanish word forms in the keyword search (planned with next week's work).
- Re-chunking the passages already stored by an installation (they change when their file is uploaded again).
- The heading sent twice to the model in `lib/answer/prompt.ts:66-69`.
- Headings of DOCX files (mammoth's HTML keeps no heading level the chunker can read).

## Amendment 1 (Fable, after `katalis-dev/tasks/revision-passage-display-polish.md`: FAIL, four Majors)

Codex reproduced that Try it and the document page paint the lead inside the highlighter, that the public panel and
the widget show the heading twice and split the `Precios` list into two lists of 1 and 4 items, that tests were
written to accept those defects, and that task 7.2 was marked with two captures missing. The decisions below close
every point and the six decisions the implementer took; nothing is left open.

9. **The heading once, in one place per view.** The citation panel of the public page and the widget shows the heading
   only on its section line (`Heading` / `Apartado`, under the passage, as it does today), never above the passage and
   never at the start of its text. Try it shows it only as the section label above the passage, and the document page
   only as the `h2` of the section (the implementer's decision 3, accepted). In every view the visible text of the
   heading appears exactly once.
10. **One list.** Consecutive item lines form one `ul` (or one `ol`) whatever line they start on, the first line of
    the body included; a list never splits because its first item opens the body.
11. **The lead in the owner's views.** Try it takes the `lead` of each citation it shows. The document page computes
    `leadLength` for every passage from the passage before it on the same page, shows each lead in the muted text colour
    outside any highlighter, and, for the highlighted passage, starts the highlighter after its lead.
12. **No list without line breaks (decision 3 holds; the implementer's decision 4 is rejected).** A body with no line
    break renders as one paragraph, whatever it holds: no " - " or number in prose turns into a list. A passage stored
    before this change shows its list again once its file is uploaded again.
13. **The other decisions of the implementer are accepted as written in the report of step 9:** 1 (the lead ends where
    the excerpt has a whitespace after it), 2 (the lead of a citation is read from the store), 5 (`lead` is required on
    `Citation`, `0` from the pure `extractCitations`, a missing `lead` read as `0` by the page) and 6 (the screen-reader
    labels of Try it count passages from 1).
14. **Tests that would have caught it.** The tests of this change assert, in the unit suite and in the browser: the
    number of visible occurrences of the heading text in each view (exactly 1), the number of list containers and the
    number of children of the one list (`Precios`: one list, five items), and in Try it and the document page the
    presence of the lead node and that the text of the highlighter starts after the lead. An assertion that accepts a
    defect of the spec (such as `getAllByText(heading).toHaveLength(2)`) is a defect of the change.

## Decisions taken by the implementer

The six decisions of the first round are closed in Amendment 1 (decisions 12 and 13). The implementer writes here
every decision a later round leaves open, and copies it to the `## Issues` of the report.
