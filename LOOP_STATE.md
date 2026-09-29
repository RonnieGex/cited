# LOOP_STATE · Cited

STATUS: DONE
CHANGE: brand-and-design-system (OpenSpec)
ROUND: section 10, `The flame has to be seen` (`openspec/changes/brand-and-design-system/tasks.md`)
BRANCH: feature/brand-and-design-system
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: ac818eb
HEAD AT THE END OF THE ROUND: 6765621 (and the commit of this file and of the report of step 10)
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

## What the round delivered

- **10.1**: one case of `tests/design-system.test.ts` written first and red, with the real number of the defect in its
  message: `the dark banner: the record states no height and scripts/readme-banner.html draws the flame at 19px; the
  design asks 40px`. It reads the bound of the design in the record, the height the render measured, and the rows of
  the committed PNG that carry the mark, so a record cannot claim a size the image does not draw.
- **10.2**: the flame at 48 px in both banners and at 68 px in the social preview (the style sheet of each render
  holds the height, the render fails below 40 and 64), the record of each render stating the box it measured and the
  line it sits beside, the two documents that said `at the height of the by Katalis line` corrected, and the README
  foot untouched at 48 px. The mark measured on the committed images: 46 and 47 px in the two banners, 66 px in the
  preview.
- **10.3**: `.gitattributes` marks `public/fonts/outfit/OFL.txt` with `-whitespace`, the licence keeps the SHA-256 of
  step 3.3 (`c676351bf8576b9a…`) byte for byte, and `git diff --check main...HEAD` exits 0. The second offender of that
  check was a quotation of the licence inside the report of step 5, and its one invisible space was removed.
- **10.4**: `npm test` 132 passed, `npm run typecheck`, `npm run lint`, gitleaks with 175 commits and no leak,
  `openspec validate --all --strict` 7 passed, and `katalis-dev/tasks/entrega-community-04.md` with the round, its
  six new images under `tasks/capturas-community-04/` and its `## Issues`.

Every task of the section is marked `[x]` with `reports/2026-09-29-step-10-flame-size.md`, which carries the exact
command, the commit and the output of each one.

## Hard rules respected

- No `.env` file was opened.
- No push, no remote, no commit in `main`, no archive, no deploy.
- The other worktree (`katalis-dev/community`, `feature/pluggable-models-and-ask`) was not touched.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- The text of no task was edited: the four boxes of section 10 and nothing else.
- `OFL.txt` was not modified: the exception lives in `.gitattributes`.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: the review of the change, the merge and the archive.
- **NOT DONE**: the push, the remote and the pipeline, which a hard rule forbids here.
- **UNKNOWN**: how GitHub renders the banner and the social preview at their new size, and the verdict of the next
  review on the trim of one invisible space in the report of step 5 and on the 68 px of the preview.
