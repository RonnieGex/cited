Contract written by Fable (2026-09-29). Sonnet 5.5 executes it and never edits the text of a task. A task is `[x]`
only with evidence in its report (`reports/2026-09-29-step-N-<name>.md`, a folder inside this change, always written
relative to the change so the path holds after archive; never `reports/` at the root of the repository): the exact
command, the commit and the output. Evidence rule: every `[x]` needs a real report that supports it at archive time; a
report in a later commit than its mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit
in small steps on `feature/brand-identity-ui`: the commits are part of the implementer's work. The repository will be
public: no secret, no customer data, no personal path. No network call to a real provider in any test. Read
`PRODUCT.md`, `design.md` of this change and `katalis-dev/tasks/diseno-cited/brief-experiencia.md` before any
interface work; no side-stripe border, no gradient text, no modal, no emoji, no logo other than the wordmark and the
flame.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/brand-identity-ui`, created by Fable from `main` `c07640b` in the worktree `community-ui`;
      confirm branch and base; `npm ci`; commit the capture script Fable left untracked (`scripts/capture-ui.mjs`) —
      report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status`, and the state
      of the store (`.data/preview.sqlite` of the running preview: its tables and row counts, read with a command that
      is recorded; this change touches no table) — report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red unit tests: `Wordmark` and `CitationMark` (text, sizes, tones, the button attributes), `highlightLast`
      (six or more words: the last three; fewer: all; one word; empty), `LanguageSwitch` tones with the same
      `aria-pressed`, the numbered navigation with `aria-current`, the split sign-in with the tagline, the ledger (the
      question label, the marks with `--i`, the sources beside the answer, the highlighted excerpt, the waiting bar
      painted with `--primary`, the sticky ask form), `app/brand.css` (every keyframe of decision 5 and the
      reduced-motion block), the additive tokens, the kit markers — report: `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Red E2E `e2e/brand.spec.ts` for every scenario of the three spec deltas: the kit with its devices and axe, the
      contrast of every text of `/kit` (extend the sampler of `e2e/design-system.spec.ts` to the marks and the
      highlighter), reduced motion, the band of the business and the ink band without one, the long thread with the
      box in reach at 812 px, the marks of an answer, the panel navigation at 1440 and 375 px with `aria-current`, the
      split sign-in in Spanish with axe — report: `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The tokens, `app/brand.css`, `lib/brand/highlight.ts`, `components/brand/` (decisions 1 to 5) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The kit: `Button` ghost and sizes, `SectionTitle`, `LanguageSwitch` tones, the kit page (decisions 6 and 13)
      — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 The panel workspace and the split sign-in (decisions 7 and 8) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.4 The public page: the band, the headline, the ledger, the waiting bar, the sticky ask, the embed strip
      (decisions 9 to 12) — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why (only assertions on markup that the design moved, never a
      behaviour) — report: `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high` (the inherited findings are queue item 2h), gitleaks, `openspec validate --all
      --strict`, `git diff --check main...HEAD` — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start` on a free port with the fake providers and `samples/` ingested: `curl.exe`
      of `/`, `/embed`, `/kit` and `/admin` showing the wordmark, the band and the brand stylesheet in the HTML, and
      that no request of the pages leaves the origin (the fonts and the flame served by the app) — report:
      `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 The E2E of 2.2 and the whole suite green; the captures of `scripts/capture-ui.mjs` into
      `katalis-dev/tasks/capturas-community-14/` at 1440 and 375 px (sign-in, public empty and with an open citation,
      embed, kit, the four pages of the panel), with no secret and no money figure — report:
      `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1, the state of the store included, and say which tables and counts changed and why (none should)
      — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `DESIGN.md` at the root (decision 14), the section of the product tokens and the two devices in
      `docs/design-system.md`, the README capture of the public page re-rendered with
      `scripts/render-readme-captures.mjs` and its twin — report: `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-14.md` in Spanish with the captures and `## Issues` —
      report: `reports/2026-09-29-step-9-docs.md`

## 10. Amendment after the verification of three rounds (design decisions 20 to 33)

- [x] 10.0 Merge `main` (d71220d) into `feature/brand-identity-ui` in one merge commit; list each conflict and how it
      was resolved (decision 20); `npm ci`, `npm test`, `npm run typecheck` on the merged tree — report:
      `reports/2026-09-29-step-10-0-merge-main.md`
- [x] 10.1 Red first: unit and component tests for decisions 21 to 29 (failure kinds in both languages with no server
      text, blocked storage, titles, the mark against its word, the sources lines, the footer and placeholder, the
      inline delete, the Spanish Setup and test results) — report: `reports/2026-09-29-step-10-1-tests-first.md`
- [x] 10.2 The fixes of decisions 21 to 29 and 31, and the minors that decision 33 fixes in this round — report:
      `reports/2026-09-29-step-10-2-implementation.md`
- [x] 10.3 The checks of 5.1 on the merged tree (Windows twice and a `node:24` Linux container) — report:
      `reports/2026-09-29-step-10-3-checks.md`
- [x] 10.4 The curl of 6.1 on the merged tree, plus `/admin/ai` and a failure of `/api/ask` answered in Spanish with no
      server text — report: `reports/2026-09-29-step-10-4-curl.md`
- [x] 10.5 `CI=1 npm run test:e2e` whole and green, with the flame loop of decision 32 and the viewports 512x384 and
      320x256 of decision 23; the captures of 7.1 shot again at 1440 and 375 px — report:
      `reports/2026-09-29-step-10-5-e2e.md`
- [x] 10.6 Repeat 8.1 on the merged tree — report: `reports/2026-09-29-step-10-6-base-after.md`
- [ ] 10.7 `DESIGN.md`, `docs/design-system.md` and the delivery `katalis-dev/tasks/entrega-community-14.md` with a
      section "Ronda 14c": what was fixed, the decision for each of the 54 minors, and `## Issues` (Setup as ff-13) —
      report: `reports/2026-09-29-step-10-7-docs.md`
