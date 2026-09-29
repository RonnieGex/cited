# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: brand-and-design-system (OpenSpec)
ROUND: section 10, `The flame has to be seen` (`openspec/changes/brand-and-design-system/tasks.md`)
BRANCH: feature/brand-and-design-system
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: ac818eb
HEAD AT THE END OF THE ROUND: pending
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the section 10 of the contract Fable wrote after looking at the banner: the flame of `public/brand/` measured
19 px beside `by Katalis` and did not read as the mark of the maker. Tests first and red before the change, the record
of the banner and of the social preview stating the rendered height of the flame with at least 40 px in both banners
and 64 px in the social preview, the mark still the real file of `public/brand/` and never another drawing, the foot of
the README at 48 px, `.gitattributes` exempting the verbatim licence of Outfit from the whitespace check so that
`git diff --check main...HEAD` exits 0, and the round appended to the delivery in Spanish with its new images and its
`## Issues`. Small commits on the branch, one report per task with the exact command, the commit and the output.

## Hard rules of this round

- No `.env` file is opened.
- No push, no remote, no commit in `main`, no archive, no deploy.
- The other worktree (`katalis-dev/community`, `feature/pluggable-models-and-ask`) is not touched.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The sections 0 to 9 of the contract are not touched: this round only adds section 10.
- `OFL.txt` is not modified: the exception lives in `.gitattributes`.

## Log

- 10.1 the red test of the record and of the committed image, written before the change.
