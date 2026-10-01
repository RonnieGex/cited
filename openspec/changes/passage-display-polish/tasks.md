Contract of Claude (in the role of Fable), from Franc's "cerremos lo que tenemos con broche de oro" (2026-09-30) and the
art review of the landing (rounds 6 and 7: the passage reads as a bug). DeepSeek implements, Codex reviews, Franc
accepts. A task is `[x]` only with its exact command and result in a report under
`reports/YYYY-MM-DD-step-N-<name>.md`, and with the commit it was verified against. Facts of the code are in the
Context of `design.md`; the decisions there are closed.

## 0. Step 0: the branch

- [x] 0.1 `feature/passage-display-polish`, created by Fable from `origin/main` at `86b250f`, with this contract

## 1. Base before

- [ ] 1.1 `npm ci`, then `npm test`, `npm run typecheck` and `npm run test:e2e`: counts, runtime and `node -v` in
      `reports/<date>-step-1-base.md`
- [ ] 1.2 The passages of the sample corpus before the change (`npm run ingest -- samples/` with the deterministic
      providers into a scratch store, then their `position`, `heading` and `text`), and the results of the searches of
      `tests/search.test.ts`, saved in the report: they are the baseline of the scenario "Search does not move"

## 2. Tests first (each one red on `86b250f` before its fix)

- [ ] 2.1 Chunker (`tests/search.test.ts` or a new `tests/chunk-lists.test.ts`): the two Markdown scenarios and the DOCX
      scenario of "A list keeps its lines in its passage"
- [ ] 2.2 Search: the searches of `tests/search.test.ts` return the same passages in the same order as the baseline of
      1.2 (scenario "Search does not move"); a test whose expected text holds a list is updated to the new line breaks,
      never deleted
- [ ] 2.3 Helpers (`tests/passage-view.test.ts`): the body without its heading (decision 1); `leadLength` on the
      overlap the chunker makes, on a first passage (0), on a previous passage missing (0), and the 120-character bound
      (decision 4)
- [ ] 2.4 Answering (`tests/answer.test.ts`): each citation carries `lead`, `0` for the first passage of a section and the
      length of the repeated words for a passage that continues the one before it (both scenarios of "A citation says
      where its own words start")
- [ ] 2.5 Views (`tests/chat.test.tsx`, `tests/setup-ui.test.tsx`): the heading shown once; the `Precios` list as a list
      of five items; the lead outside the highlighter; in Try it, the mark beside the cited passage reads the citation's
      `n` (`1`), never the position; the document page shows no citation mark and labels its first passage 1
- [ ] 2.6 Suggestions (`tests/setup-questions.test.ts`): the Spanish and the English scenarios of "Suggestions speak the
      language of the panel", with the three sample documents loaded
- [ ] 2.7 Copy: a test that fails while `alta guiada` or `de la alta` appears in `lib/i18n/admin.ts`, and the Spanish
      string of the reopen link reads "Abrir la configuración guiada otra vez"

## 3. Implementation (decisions 1 to 8 of `design.md`, in the order the tests demand)

- [ ] 3.1 The chunker keeps list lines (decision 2)
- [ ] 3.2 The helpers of the body and of the lead, in one module (decisions 1 and 4)
- [ ] 3.3 `lead` on every citation of `POST /api/ask`, `extractCitations` kept pure (decision 4)
- [ ] 3.4 One shared view of a passage (decisions 3, 4 and 5) used by `CitationPanel`, `TryItPanel` and `DocumentPanel`
- [ ] 3.5 The citation's number in Try it, no citation mark on the document page (decision 6)
- [ ] 3.6 Suggestions ordered by the language of each document (decision 7)
- [ ] 3.7 "configuración guiada" in `lib/i18n/admin.ts`, `README.es.md` and `docs/owner-guide.md` (decision 8)

## 4. Existing tests

- [ ] 4.1 Review and update the tests the change touches, among them `tests/search.test.ts`, `tests/chat.test.tsx:113`
      (an exact `getByText` of the excerpt), `tests/brand-public.test.tsx`, `tests/brand-round-14c-public.test.tsx`,
      `e2e/public-chat.spec.ts`, `e2e/brand.spec.ts` (`.hl` holds "Afinación de bicicleta: 380 pesos.") and both setup
      E2E files (they click the first suggestion and expect "380 pesos"). An expectation changes only to the new
      behaviour of the spec, and the report names each one with the reason

## 5. Run the tests and the checks

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm test` (counts and runtime), `npm run build`, `npm run audit:high`,
      `npm run secrets:scan`, `npm run openspec:validate`, each with its real output in `reports/<date>-step-5-checks.md`
- [ ] 5.2 The passages of the sample corpus after the change, in the same form as 1.2: only the passages with a list
      change, and only by their line breaks

## 6. Manual verification

- [ ] 6.1 From a clean disposable clone with a test `.env` and the deterministic providers (never the `.env.local` of a
      worktree): `curl.exe` `POST /api/ask` in Spanish with a question about the prices and with one about the café;
      paste the responses, with `lead` on each citation, in `reports/<date>-step-6-curl.md`

## 7. End to end

- [ ] 7.1 Playwright, in `e2e/` (public project and panel project), at 1440 px and at 375 px, in Spanish and in
      English: the four scenarios of "A cited passage reads as its document says it", measured in the browser (for the
      highlighter: the top of the first band against the top of the first line of the body, and one band per line),
      the number beside the cited passage in Try it, the suggestions of the Spanish panel and the reopen link
- [ ] 7.2 Screenshots for the review, both languages, both widths: the public page with the `Precios` passage open,
      the widget with a passage open, Try it with a cited passage, saved in `reports/` and named in the report
- [ ] 7.3 `npm run test:e2e` whole: counts in `reports/<date>-step-7-e2e.md`

## 8. Documentation

- [ ] 8.1 `docs/` and the two READMEs: the sample outputs of the search in `README.md:170-188` and
      `README.es.md:172-188` (and `docs/images/readme-graphics.json:230` if it carries them) follow the new passage text;
      the API documentation names `lead`; the owner's guide uses "configuración guiada"

## 9. Close

- [ ] 9.1 `## Issues` at the end of the last report (BROKEN, RISK, NOT DONE, UNKNOWN), with the decisions taken by the
      implementer and the passages of existing installations that keep their old text until their file is uploaded
      again
- [ ] 9.2 Fable pushes the branch and opens the pull request; the checks of the pipeline are recorded in the report
- [ ] 9.3 Adversarial review by Codex (`katalis-dev/tasks/revision-passage-display-polish.md`)
- [ ] 9.4 Franc accepts; the change is archived and merged through the pull request
