# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: brand-and-design-system (OpenSpec)
ROUND: the whole contract, sections 0 to 9 (`openspec/changes/brand-and-design-system/tasks.md`)
BRANCH: feature/brand-and-design-system
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: 3b3cfbd
HEAD AT THE END OF THE ROUND: (open)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract Fable wrote for `brand-and-design-system`, in order and complete: the real Katalis flame copied
byte for byte from Construye's `public/brand/`, its ink variant rendered by a committed script, the flame at the foot
of both READMEs, in the banner and in the social preview, the invented `docs/images/katalis-logo*.png` removed and
refused by the guard, `app/tokens.css` with the values of Construye, Outfit self-hosted with its OFL license, the kit
of `components/ui/` with the public `/kit` page. Tests first and red before the code, small commits, one report per
task with the exact command, the commit and the output.

## Hard rules of this round

- No `.env` file is opened.
- No push, no remote, no commit in `main`, no archive.
- The source repository of the flame is read only: nothing there is written, moved or deleted.
- Another session works in `katalis-dev/community` on `feature/pluggable-models-and-ask`: it is not touched.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- Only Outfit, under the SIL Open Font License, enters the repository: no paid font.

## Progress

- 0.1 the branch, the base and `npm ci`: done, `reports/2026-09-29-step-0-branch.md`.
