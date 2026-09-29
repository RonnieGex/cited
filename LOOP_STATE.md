# LOOP_STATE · Cited

STATUS: DONE
CHANGE: cited-identity-and-readme (OpenSpec)
ROUND: section 11, art direction second pass (tasks 11.1 to 11.4)
BRANCH: feature/cited-identity-and-readme
BASE: 5dec3af (main)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute section 11 of `openspec/changes/cited-identity-and-readme/tasks.md`, the contract Fable wrote after looking at
the first renders: the dark variants of the graphics came out on a white background (mean luminance 0.92 to 0.98), the
cards were nearly invisible, the flow carried `Next` over the whole graphic and the social preview was a small logo on
white. The graphics must look like the banner, which is the reference, and the README must read almost like an
advertisement.

## What the round delivered

- **11.1**: `tests/png.ts` decodes a PNG with `node:zlib` and no new dependency, and `tests/readme.test.ts` decodes
  every PNG of `docs/images/` and asserts the luminance bounds of decision 10 (dark variants and the social preview at
  0.30 or less, light variants at 0.80 or more), with the exact list of files so no new PNG escapes the measurement.
  Run red against the first graphics in `ae4a054`, with the table of measurements pasted in the step 11 report.
- **11.2**: the root cause was `scripts/readme-graphics/base.html` asking for `{{BACKGROUND}}`, `{{TEXT}}`, `{{GLOW}}`
  and three more placeholders the renderer never filled, so the browser dropped those declarations and every canvas
  painted white. The renderer now fills every key and throws on a surviving placeholder, and it measures every render:
  smallest text (16, 17 and 20 px), headline size and weight (44 px on the 1280 graphics, 30 px on the cards, weight
  700), contrast of every text-on-surface pair (4.63:1 to 7.49:1), the longest band of empty background against a
  content-free render of the same page (14 px of 75 allowed at most, and so on), the share of the card the
  illustration takes (41%) and the canvas bounds. Every template was redesigned card by card, the record carries the
  new headlines and the README follows them.
- **11.3**: the nine captures were retaken through the public Markdown API, and the first version of every graphic and
  every capture was kept so the delivery shows both side by side, with one row per rule of decision 10 and its
  measurement.
- **11.4**: the whole battery is green and the round is appended to `katalis-dev/tasks/entrega-community-03.md` under
  its own heading with `## Issues de la segunda ronda`.

## The one deviation, written down

Decision 10 asks for a terminal that is dark in both themes and, in the same decision, for every light variant to be at
0.80 or more of mean luminance. A dark terminal has to stay under 19% of a 1280 × 560 canvas for that, and the real run
of the quick start does not fit there. The dark variant is the dark terminal of the decision; the light variant keeps
the same commands and the same output on paper, with ink text, an ink title bar and the first result on a lime block.
It is recorded as a RISK in the report and in the delivery.

## The defects the round found and closed

1. **The theme was never painted**: six placeholders of the base template had no value in the renderer, so every dark
   graphic but the banner came out white. The renderer now fails on any surviving placeholder.
2. **The footer logo could not be transparent**: the element screenshot composited the page background and `sharp`
   wrote it without alpha. It is captured with a transparent page background and written in RGBA.
3. **The re-render was not idempotent**: `patchReadmeQuickStart` looked for the literal `$ npm run ingest -- samples/`,
   which the render itself had already rewritten with `EMBEDDINGS_PROVIDER=fake` in front, so the second run of the
   script failed. It now finds the block by the script it runs.
4. **The terminal text was bold, and the machine renders monospace bold oblique**: the commands and the first result
   are lime without a weight change, so no text of the demo is slanted or synthesised.

## State of the tree

The tree is clean on `feature/cited-identity-and-readme`. `main` still points at `5dec3af`, no remote was contacted,
nothing was pushed and nothing was archived. The contract carries every box of section 11 marked with its report;
section 10 stays untouched because it is Fable's.

## Closing battery

Windows 11, Node `v24.11.0`: `npm test` 11 files and 103 tests passed, `npm run typecheck` exit 0, `npm run lint` exit
0, `npm run secrets:scan` 95 commits with no leaks found, `openspec validate --all --strict` 5 passed and 0 failed, and
`git diff --check main...HEAD` exit 0. The images of the README weigh 0.675 MB against the budget of 3 MB. The render
script exits 0 and prints the contrast table and the geometry of all 17 canvases; the capture script produced the 9
captures through the Markdown API without a token.

## Hard rules respected

- No `.env` file was opened: only the tracked template with empty values.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider ran every command.
- No font file enters the repository: Outfit is loaded from Google Fonts at render time.
- No secret, no customer data and no text of the Construye book in any commit.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified; `git ls-files --eol` reports no `crlf`, no `mixed` and no `bom`.

## Pending and out of scope

- **NOT DONE, reserved for Fable**: section 10 of the contract (rename the GitHub repository to `cited`, update the
  remote and prove that the old redirects), the independent review, the merge and the archive.
- **NOT DONE**: the GitHub pipeline itself, because a push is forbidden here.
- **UNKNOWN**: how the new graphics render on themes and widths beyond the 1280 and 400 px of the captures, and the
  final weight of `docs/images/` if someone re-renders on another machine.
