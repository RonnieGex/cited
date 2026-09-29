# LOOP_STATE · Cited

STATUS: DONE
CHANGE: brand-and-design-system (OpenSpec)
ROUND: section 11, `Contrast of the controls and the place of the reports` (`openspec/changes/brand-and-design-system/tasks.md`)
BRANCH: feature/brand-and-design-system
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: e3c003d
HEAD AT THE END OF THE ROUND: 09369c5 (and the commit of this file and of the report of step 11)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the section 11 of the contract Fable amended after `revision-community-04`: move the eleven reports of the
global `reports/` into `openspec/changes/brand-and-design-system/reports/` with `git mv`, fix every reference to them
and leave no empty directory; write first, and see red, a Playwright test that measures the computed colors of `/kit`
for the scenario `The controls can be seen`; darken the border token of the controls (and the focus indicator if it
fails) until the test is green, keeping the look and leaving `Panel` unchanged; and run the whole battery again. The
round is appended to the delivery in Spanish with its `## Issues`. Small commits on the branch, one report per task
with the exact command, the commit and the output.

The rulings of Fable that bound the round: the kit is light only in this change (the dark part of the Major 1 of the
review is out of scope, and the README images keep their two themes), the contrast of the controls is in scope, and the
edit of `design.md` in `dd174e9` is accepted.

## What the round delivered

- **11.1**: the eleven reports of the sections 0 to 10 moved with `git mv` into the change (eleven renames `R096` to
  `R100`, the history followed by `git log --follow`), ten references to them fixed (nine `this file` bullets, the list
  of step 10 and three lines of the delivery), two quotations of past runs left byte for byte with a sentence that
  says where the file lives, the shorthand `reports/...` of the sections 0 to 10 of the contract untouched, and the
  global `reports/` removed: `Test-Path reports` is `False` and `openspec validate --all --strict` is 7 of 7.
- **11.2**: one Playwright test that composites the computed colors of `/kit` on the ground the page paints, reads the
  border of both controls, the exempt parts, every text with its size, the placeholder, the token `--border` and the
  two parts of the focus indicator, and decodes a screenshot of the border with `tests/png.ts`; and one unit case of
  the token against the document. Both red before the change: `1 failed | 18 passed` in the unit half and
  `Input: the border ... 1.53:1 at 1px`, `Received: 1.527057553215567`, in the browser half.
- **11.3**: the token `--border` (`color-mix(in srgb, var(--ink) 50%, var(--paper))`, `#8B8B8B`, `rgb(139,139,139)`)
  and `--color-border` in `app/tokens.css`; `Input` and the secondary `Button` move from `border-ink/20` to
  `border-border`; `Panel` keeps `border-ink/10` and `Chip` its `border-ink/20`; `focus.ts` unchanged, because the
  indicator reaches the 3:1 through the one pixel edge of ink (17.93:1) and the lime of the design is 1.22:1 and stays.
  Green: `3.41:1` on paper and `3.26:1` on the warm surface, and the painted frame of both controls carries the
  hairline exactly. The look is kept: square, one pixel, the same palette and the same lime focus.
- **11.4**: `npm test` 133 passed, `npm run typecheck`, `npm run lint`, `npm run test:e2e` 4 passed, gitleaks with 184
  commits and no leak, `openspec validate --all --strict` 7 passed and `git diff --check main...HEAD` exit 0; the round
  in `katalis-dev/tasks/entrega-community-04.md` in Spanish with its `## Issues`; the four boxes of the section marked
  `[x]` with `reports/2026-09-29-step-11-contrast.md`.

## Hard rules respected

- No `.env` file was opened.
- No push, no remote, no commit in `main`, no archive, no deploy.
- The other worktree (`katalis-dev/community`) was not touched.
- `MEMORY.md` is in no commit: the verification scripts and logs of the round live in the ignored `.data/`.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: the four boxes of section 11 and nothing else; the sections 0 to 10 keep their text
  and their marks.
- No font and no image of the round: the token, two components, two tests and the documentation.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: the review of the change, the merge and the archive.
- **NOT DONE**: the push, the remote and the pipeline, which a hard rule forbids here.
- **UNKNOWN**: whether the next review accepts the reading of the focus indicator (the 3:1 is carried by the one pixel
  edge of ink that the design pairs with the lime outline, and both parts are measured) and whether it accepts that the
  shorthand `reports/<name>` of the sections 0 to 10 of the contract was left untouched.
