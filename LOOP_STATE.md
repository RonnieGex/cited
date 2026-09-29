# LOOP_STATE · Cited

STATUS: DONE
CHANGE: brand-and-design-system (OpenSpec)
ROUND: the whole contract, sections 0 to 9 (`openspec/changes/brand-and-design-system/tasks.md`)
BRANCH: feature/brand-and-design-system
BASE: aa52b7c (main)
HEAD AT THE START OF THE ROUND: 3b3cfbd
HEAD AT THE END OF THE ROUND: 6062f19 (and the commit of this file)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract Fable wrote for `brand-and-design-system`, in order and complete: the real Katalis flame copied
byte for byte from Construye's `public/brand/`, its ink variant rendered by a committed script, the flame at the foot
of both READMEs, in the banner and in the social preview, the invented `docs/images/katalis-logo*.png` removed and
refused by the guard, `app/tokens.css` with the values of Construye, Outfit self-hosted with its OFL license, the kit
of `components/ui/` with the public `/kit` page. Tests first and red before the code, small commits, one report per
task with the exact command, the commit and the output.

## What the round delivered

- **0.1 and 1.1**: the branch, the base `aa52b7c` and `npm ci` confirmed with git; the state of the base before,
  `2 failed | 112 passed (114)`, both failures caused by the home directory of the machine inside
  `design.md`, the contract of this very change. Repaired in `dd174e9` without touching a decision or a requirement;
  the deviation is in the delivery as BROKEN 1.
- **2.1 and 2.2**: `tests/design-system.test.ts` (17 cases) and `e2e/design-system.spec.ts` (2 cases), written first
  and red: `17 failed (17)` and both end to end cases on a 404 of `/kit`.
- **3.1**: the three flame files copied byte for byte (the hashes of decision 1), the ink variant rendered by
  `scripts/render-flame-variants.mjs` and recorded in `public/brand/flame-variants.json`, deterministic to the byte,
  with the mark measured: every visible pixel neutral and none lighter than the ink.
- **3.2**: the flame at the foot of both READMEs, in the banner and in the social preview at the height of the
  `by Katalis` line, the invented logo and its template deleted, and `inventedLogos` with `assertHonestRecord`
  refusing any record that names it.
- **3.3**: `app/tokens.css` with the eight tokens of Construye exposed to Tailwind through `@theme`, Outfit served
  from `public/fonts/outfit/` with its OFL license, the five components of `components/ui/` and the route `/kit`.
  The two renderers read the family from the repository now, so the graphics need no network.
- **4.1**: the whole suite, `131 passed (131)`; five tests of `tests/readme.test.ts` updated and each one explained.
- **5.1**: the battery, with the suite green on Windows and in a `node:24` Linux container; the container found that
  the lock file had lost the optional dependencies of the other platforms, repaired in `d778f30`.
- **6.1**: `npm run build && npm run start` and `curl.exe`: `/` 200, `/kit` 200, both Outfit files 200 served by the
  app, no font host anywhere.
- **7.1**: the end to end green, axe with 0 violations, and the eight captures of the delivery rendered by
  `scripts/render-delivery-captures.mjs`, the README among them as GitHub itself renders it.
- **8.1**: the state of the base after, green, with no persistence added.
- **9.1 and 9.2**: `docs/design-system.md` complete, `docs/readme-assets.md` updated, and
  `katalis-dev/tasks/entrega-community-04.md` with its eight captures and its `## Issues`.

Every task of `tasks.md` is marked `[x]` with its report under `reports/2026-09-29-step-*.md`.

## Hard rules respected

- No `.env` file was opened.
- No push, no remote, no commit in `main`, no archive, no deploy.
- The source repository of the flame was read only: nothing there was written, moved or deleted.
- The other worktree (`katalis-dev/community`, `feature/pluggable-models-and-ask`) was not touched.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- Only Outfit, under the SIL Open Font License, entered the repository: no paid font.

## The two defects this round found and repaired

1. The home directory of the machine in `design.md`, which had the base suite red before a line of this round was
   written (`dd174e9`).
2. `package-lock.json` without the optional dependencies of Linux, which broke `npm ci` in the container and would
   have broken the pipeline on the push (`d778f30`).

Both are in the delivery as BROKEN, with the reason each one happened.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: the review of the change, the merge and the archive.
- **NOT DONE**: the push, the remote and the pipeline, which a hard rule forbids here.
- **UNKNOWN**: how GitHub renders the new foot of the README, and the verdict of the next review on the two repairs
  and on the three small deviations of RISK (the language of the kit, the ink edge of the focus, the microcaps at 70%).
