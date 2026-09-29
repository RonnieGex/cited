# LOOP_STATE · Cited

STATUS: DONE
CHANGE: cited-identity-and-readme (OpenSpec)
ROUND: section 12, review round (tasks 12.1 to 12.6)
BRANCH: feature/cited-identity-and-readme
BASE: 5dec3af (main)
HEAD AT THE START OF THE ROUND: 6400c01
HEAD AT THE END OF THE ROUND: 00bcd9b
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute section 12 of `openspec/changes/cited-identity-and-readme/tasks.md`, the contract Fable wrote after
`katalis-dev/tasks/revision-community-03.md`: four Majors and one Minor left by the adversarial review.

## What the round delivered

- **12.1** (`ee46955`): six tests first and red against the branch as it was: the two scenarios Fable added to
  `project-readme` (the twin is translated, only planned text speaks of answers), the terminal area of `demo-light.png`
  at 0.30 or less, the roadmap at 1280 px wide and 720 px high at most. `tests/png.ts` gained the measurement of a box
  of a decoded PNG. `6 failed | 30 passed`.
- **12.2** (`fa852e5`, `58bc5ed`): the tagline is `Ask your own documents. Get the passage and where it came from.`,
  the second reason card is `Every passage keeps its source.`, the section is `See it work` / `Míralo funcionar`, and
  every sentence of the two READMEs, of the alts and of `docs/` that promised an answer or a page today now promises
  the passage with its document, its heading and its position. The banner, the social preview, the card and the two
  records were re-rendered.
- **12.3** (`80b3865`): eleven Spanish headings, ten status words (`Disponible`, `Siguiente`), nine `sí` and the
  `#estado` anchor; code, commands, variables, paths and the names of the product and the changes stay as they are.
- **12.4** (`9309607`, `58bc5ed`): the terminal of the demo is dark in both themes (0.183 in the dark one, 0.148 in the
  light one, measured by the render inside the terminal box, which fails above 0.30), the render enforces the 720 px
  ceiling of the roadmap and writes both numbers in the record, and the voice teaser reads its sentence of decision 11.
  The corrected contrast pair found a real defect: the title bar was composited over the page, not over the terminal.
- **12.5** (`95459db`): the report of 6.1 names the seven lines of the quick start, says that lines 3 to 7 ran literally
  in `node:24`, that lines 1 and 2 cannot run while the repository is private (the anonymous clone exits 128) and what
  replaced them, with the transcript of the new run.
- **12.6**: the nine captures were retaken through the public Markdown API, and the battery is green: `npm test` 11
  files and 108 tests, `npm run typecheck` exit 0, `npm run lint` exit 0, gitleaks 106 commits with no leaks,
  `openspec validate --all --strict` 5 passed and 0 failed, `git diff --check main...HEAD` exit 0, `docs/images/` at
  714,046 bytes of a 3 MiB budget. The round is appended to `katalis-dev/tasks/entrega-community-03.md` under its own
  heading with the changed graphics and `## Issues`.

## The one measurement that cannot hold

Decision 10 asks every light variant for a mean luminance of 0.80 or more and decision 11 asks the terminal of
`demo-light.png` to be dark. A dark terminal has to stay under 19% of a 1280 × 560 canvas for the first rule, and the
real run of the quick start takes 55.4%, so `demo-light.png` measures 0.493. The test keeps that file out of the light
canvas list and measures it inside the terminal area, which is where decision 11 puts the rule; every other light
canvas is still measured against 0.80. It is recorded as a RISK in the report and in the delivery: closing it the other
way means giving up the real demo in the light variant.

## State of the tree

The tree is clean on `feature/cited-identity-and-readme` at `00bcd9b`. `main` still points at `5dec3af`, no remote was
contacted, nothing was pushed and nothing was archived. Section 12 carries its six boxes marked with the report of the
round; section 10 stays untouched because it is Fable's.

## Hard rules respected

- No `.env` file was opened: only the tracked template with empty values, and the container of 6.1 copies it to a
  throwaway tree outside the repository.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider ran every command.
- No font file enters the repository: Outfit is loaded from Google Fonts at render time.
- No secret, no customer data and no text of the Construye book in any commit.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: section 10 of the contract (rename the GitHub repository to `cited`, update the
  remote and prove that the old URL redirects), the adversarial review of this round, the merge and the archive.
- **NOT DONE**: the GitHub pipeline itself, because a push is forbidden here.
- **UNKNOWN**: how the translated headings and the new graphics render on themes and widths beyond the 1280 and 400 px
  of the captures, the state of the badge and the redirect after 10.1, and the weight of `docs/images/` if someone
  re-renders on another machine.
