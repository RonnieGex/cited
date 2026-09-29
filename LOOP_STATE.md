# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: brand-and-design-system (OpenSpec)
ROUND: section 11, `Contrast of the controls and the place of the reports` (`openspec/changes/brand-and-design-system/tasks.md`)
BRANCH: feature/brand-and-design-system
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: e3c003d
HEAD AT THE END OF THE ROUND: pending
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

## State of the round

- 11.1 pending
- 11.2 pending
- 11.3 pending
- 11.4 pending

## Hard rules respected

- No `.env` file is opened.
- No push, no remote, no commit in `main`, no archive, no deploy.
- The other worktree (`katalis-dev/community`) is not touched.
- `MEMORY.md` goes into no commit.
- UTF-8 with LF in every file written or modified.
- The text of the tasks of the sections 0 to 10 is not edited.
