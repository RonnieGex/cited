# LOOP_STATE · Cited

STATUS: DONE
CHANGE: public-page-and-widget (OpenSpec)
ROUND: section 10, "What the review of Codex reproduced" (contract amended by Fable after `revision-community-08`)
BRANCH: feature/public-page-and-widget
BASE: 7c4f4ff (main, "Merge brand-and-design-system")
HEAD AT THE START OF THE ROUND: b487ac1 ("Name the prop of the language switch, and ask for the color, the Escape and
the new tab": the amended decision 8 and the new requirement, written by Fable)
HEAD AT THE END OF THE ROUND: the closing commit, which carries this file, the section 10.5 of the report and the last
checkbox of the contract
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective of this round

Close the four Major that Codex reproduced in `katalis-dev/tasks/revision-community-08.md`, tests first and red before
each fix, reproducing exactly what the review reproduced, and only then repeat the battery.

## What was delivered

- **10.1**: `components/i18n/LanguageSwitch.tsx` takes the one prop `current` of design decision 8 as amended, so the
  file this lane owns can replace the stand-in of the parallel lane without breaking `npm run typecheck`. The red state
  was the real diagnostic of the review at a JSX call site: `Type '{ current: Lang; }' is not assignable to type
  'IntrinsicAttributes & LanguageSwitchProps'`.
- **10.2**: the primary color of the settings paints the ask button and the accents of `/` and `/embed`, through the
  new `brand` variant of `components/ui/Button.tsx` and two accents in `components/chat/`. Chromium measured
  `rgb(23, 23, 23)` before the fix (the ink the button kept) and `rgb(221, 244, 105)`, then `rgb(29, 78, 216)` with the
  accepted business color of the fixture, after it.
- **10.3**: `Escape` inside the iframe closes the widget and returns the focus to its button. `lib/widget/messages.ts`
  is the one protocol, `components/chat/Chat.tsx` posts it from `/embed`, and `lib/widget/script.ts` closes only for a
  message from its own origin and of that shape. `public/widget.js` was rebuilt (2466 bytes of 5120).
- **10.4**: a tab opened from the page starts its own conversation. The tab keeps the mark `cited-tab=<id>` in
  `window.name`, which `window.open` does not inherit, next to the id in `sessionStorage`, and `lib/chat/session.ts`
  believes the stored id only when the two agree.
- **10.5**: the whole battery, the round in `katalis-dev/tasks/entrega-community-08.md` (Spanish, with its own
  `## Issues`) and this file in `DONE`.

## Evidence

- Seven commits of this round against the contract: `a40927e` (RUNNING), `0850f7c` (the four red tests and their
  report), `17a6182`, `e3eef0c`, `8047f31`, `8ab05c6` and the closing commit.
- One report for the section, `openspec/changes/public-page-and-widget/reports/2026-09-29-step-10-review-fixes.md`,
  with the red reproduction and the green run of each point, the exact commands, the outputs and the commits.
- `npm test`: 27 files and 277 tests green on Windows 11 (Node v24.11.0); before this round, 26 and 264.
- `npm run test:e2e`: 15 tests green (12 before), axe 0 violations on `/` (24 rules), `/embed` (23) and `/kit` (21).
- `npm run typecheck`, `npm run lint`, `openspec validate --all --strict` (9 items), `git diff --check main...HEAD` and
  `node scripts/build-widget.mjs` (2466 bytes), all clean.
- gitleaks: 245 commits, 2.65 MB, `no leaks found`.

## The issues that stay open

- `docs/images/chat-page.png` is a real capture of the interface before this round: it shows the ask button in ink, and
  the button carries the fill of the brand from 10.2 on. It was not re-rendered, and `tests/readme.test.ts` measures its
  luminance and not its content.
- `--primary` and `--on-primary` are inline style attributes of the two public pages; the kit has no fallback for a
  consumer outside them, because the design system belongs to another change.
- The close message travels with `targetOrigin: "*"`: only an origin of `frame-ancestors` can frame `/embed`, the
  message carries no data, and the widget checks the origin of what it receives.
- The owner mark lives in `window.name`: if another script of the same origin erased it, the tab would start a new
  conversation, which is the safe fall.
- `e2e/widget.spec.ts` needs one port per test (3210 and 3212, both in `ALLOWED_ORIGINS`), because the tests of a file
  run in parallel.
- The independent adversarial review of this correction, the push, the merge, the archive and the deploy were not
  executed and were not authorized: they are Codex's or Fable's.

## Hard rules respected

- No `.env` file was opened (this worktree has none; only `.env.example` is tracked as the public template).
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community`, `feature/admin-panel-and-onboarding`) was not touched; its `AdminNav.tsx` was read
  once to pin the interface the owner has to match.
- No test called a real provider: the deterministic `fake` ran every command.
- No personal path in a versioned file; the logs of the round live outside the repository, in `katalis-dev/tasks/`.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: only its checkboxes; `design.md` and the two delta specs were not touched, and
  neither was the text of sections 0 to 9.
