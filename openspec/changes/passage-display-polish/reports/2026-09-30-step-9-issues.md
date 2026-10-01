# Step 8 and 9.1 — the documentation and the issues of the change

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, tasks 8.1 and 9.1)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** the commit that carries it (the parent is `fc8af39`)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the documentation follows the change and the change has no broken item. What is not done and what is
  unknown are listed below with their reason.

## 8.1 The documentation

| File | What changed |
|---|---|
| `README.md` and `README.es.md` | the sample output of `npm run ask` names the lead of its citation (`position 2 lead 0`); the sample output of `npm run search` did not change, and step 5.2 proves it: the search does not move |
| `docs/images/readme-graphics.json` | the two records of that capture (`demo.ask.output` and `demo.drawn.ask[2]`) carry the same line |
| `docs/answering.md` | the JSON of the route names `lead` and explains it (the repeated words at the start of the excerpt, at most 120, 0 for the first passage of a section); the prompt example and the command line carry the new passage text; the list of what a citation carries names the field |
| `docs/search.md` | the chunking section says that an item of a list keeps its own line, that the keyword index does not move, and that a passage stored before the change keeps its flattened text until its file is uploaded again |
| `docs/owner-guide.md` | the page of a document and `Try it` say how a passage reads (the heading once, the lists as lists, the repeated words in the muted grey outside the highlighter, the citation's number beside the passage) and that the suggestions come first from the documents in the language of the panel; the Spanish twin keeps the same text and "configuración guiada" |

`README.es.md`, `lib/i18n/admin.ts` and `docs/owner-guide.md` say "configuración guiada" and no file of `lib/`, `app/`,
`components/`, `docs/` or the two READMEs says "alta guiada" or "de la alta" (the scenario of the delta `admin-panel`,
verified by `tests/guided-setup-copy.test.ts`).

## 9.1 The decisions taken by the implementer

The contract left these open and the implementer decided them. They are copied from the `## Decisions taken by the
implementer` of `design.md`:

1. **The end of the lead is a word boundary of the excerpt.** `leadLength()` takes the longest prefix of the excerpt
   that is also the end of the passage before it, and then steps back to the last boundary where the character after the
   prefix is a whitespace of the excerpt (or the prefix is the whole excerpt). The contract asks for a prefix "ending
   before a whitespace"; reading it as "the character after the prefix is a whitespace" is what keeps a half word out
   and keeps the first own word whole, and it is what the scenario "the lead outside the highlighter" needs. The bound
   of 120 characters is `LEAD_LIMIT` of `lib/answer/lead.ts`.
2. **The lead of a citation of `POST /api/ask` is read from the store, not from the hits.** `citationsWithLeadFromStore()`
   reads the passages of each cited document (`store.getPassages({ name, limit: 1000 })`) and takes the one at
   `position - 1`. A hit list only carries the passages the search returned, so the passage before a cited one is often
   not in it, and the citation would carry `lead: 0` by accident.
3. **A document page keeps its heading as the `h2` of the section and the passage body does not repeat it.** The shared
   view takes `showHeading` for the two places that already show the heading (a section of the page of a document and of
   `Try it`), and the heading is still removed from the start of the text in either case.
4. **The view also splits an old passage that carries its list flattened.** A passage stored before this change holds
   its items joined with " - ", so the view splits a body with no line break at the start of an item; a body with line
   breaks is split by its breaks only, so a paragraph that carries " - " keeps its text.
5. **`lead` is a required field of `Citation`.** It is written as `0` by `extractCitations()`, which stays pure, and the
   client of the page reads a citation of a server that carries no `lead` as a whole excerpt, so an installation whose
   server is older than its page paints no bad highlight.
6. **`Try it` numbers the passages of the cited document from 1 for a screen reader** (`Passage 1`), while the mark
   beside a cited passage carries the citation's number. The document page never paints a mark and its labels count the
   passages from 1, which is what its own scenario asks.

## Issues

### BROKEN

None. Every check of the change passes at the code of the last report: `npm run typecheck`, `npm run lint`,
`npm test` (89 files, 1052 tests), `npm run build`, `npm run audit:high`, `npm run secrets:scan`,
`npm run openspec:validate` (14 of 14), `npm run test:e2e` (92 cases, 2.0 min) and the two `curl.exe` requests of step
6.

### RISK

- **The passages already stored by an installation keep their old text.** The chunker keeps the lines of a list, and the
  passages of a store are not re-chunked: a document uploaded before this change keeps its text with the list flattened
  until its file is uploaded again. The view still shows that passage as a list (decision 4 of the implementer), but
  the text of the citation and the text the model reads are the old ones. Documented in `docs/search.md`; the owner
  uploads the file again to get the new text.
- **`leadLength()` is quadratic in the bound, not in the passage.** It walks at most 120 sizes and compares strings of
  up to 120 characters. Measured indirectly: the whole unit suite (1052 cases, many of them ingesting the sample corpus)
  runs in 79.68 s in the clean clone, which is the same order as the 83.39 s of the baseline. No case of the suite
  measures it by itself.
- **The highlighter of a passage of several lines is measured in a browser, not in jsdom.** The unit suite pins the
  structure (an inline `span` inside its paragraph or its item, never the child of a flex container) and the browser
  suite measures the band against the top of its line at 1440 px and at 375 px. A change of the layout of the panel
  could move the band without breaking the unit suite; the E2E case of `e2e/passage-display.spec.ts` is the one that
  would catch it.

### NOT DONE

- **The reopen link is not walked in Spanish in a browser.** The contract asks for it (task 7.1). The panel of the
  browser suite opens in English, and the Spanish string "Abrir la configuración guiada otra vez" is pinned by
  `tests/guided-setup-copy.test.ts` over `lib/i18n/admin.ts`, which reads the same string the panel renders. A browser
  walk of that link in Spanish needs a panel with the setup hidden and the language in Spanish, which no suite of this
  repository starts today.
- **Step 9.2 (the push and the pull request), 9.3 (the adversarial review of Codex) and 9.4 (the acceptance of Franc
  and the archive) are not mine.** They stay unchecked in `tasks.md`.
- **The "Decisions taken by the implementer" of `design.md` are not written in `design.md`.** The rule of
  `openspec/config.yaml` says that every decision the design leaves open is written under that heading of `design.md`
  and copied to the Issues section of the delivery, and the instructions of this round say not to edit the text of
  `design.md`. The six decisions are written in the "Decisions taken by the implementer" section of this report and
  copied to the `## Issues` of `katalis-dev/tasks/entrega-passage-display-polish.md`, which is the delivery document;
  the heading of `design.md` stays empty for Fable, who owns that file.

### UNKNOWN

- **The behaviour with a real provider.** No test and no verification of this change called a real provider: the unit
  suite and the browser suite use the deterministic providers, and `curl.exe` answered with `CHAT_PROVIDER=fake`. A real
  model may cite a passage whose `lead` is not the one the store computes (it cites whatever the search returned, which
  is the same store), so the unknown is not the field but the answer itself.
- **A DOCX whose list is written with a style instead of numbering.** The DOCX scenario of the change builds a document
  with `w:numPr` (the numbering Word writes for a bulleted list) and `mammoth` converts it to `- ` lines. A document
  whose list is only a paragraph style (`ListParagraph` with no numbering) does not reach the chunker as a list;
  `parse.ts` does not read the style, which is the same out-of-scope note the contract already carries for the headings
  of DOCX files.
- **The look of the passage in a browser other than Chromium.** Every browser case runs in the `Desktop Chrome` device
  of Playwright. `box-decoration-break: clone` and the paint of the band are measured there only.
