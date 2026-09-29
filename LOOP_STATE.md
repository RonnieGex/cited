# LOOP_STATE · Cited

STATUS: RUNNING
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

## What the round did

- **11.1**: `tests/png.ts` decodes a PNG with `node:zlib` and no new dependency, and `tests/readme.test.ts` decodes
  every PNG of `docs/images/` and asserts the luminance bounds of decision 10 (dark variants and the social preview at
  0.30 or less, light variants at 0.80 or more). Run red against the first graphics in `ae4a054`, with the table of
  measurements pasted in the step 11 report.
- **11.2**: the root cause was `scripts/readme-graphics/base.html` asking for `{{BACKGROUND}}`, `{{TEXT}}`, `{{GLOW}}`
  and three more placeholders the renderer never filled, so the browser dropped the declarations and every canvas
  painted white. The renderer now fills every key and throws on a surviving placeholder, and it measures every render:
  smallest text, headline size and weight, contrast of every text-on-surface pair, the longest band of empty
  background against a content-free render of the same page, the share of the card the illustration takes and the
  canvas bounds. Every template was redesigned card by card, the record carries the new headlines and the README
  follows them.
- **11.3**: the nine captures were retaken through the public Markdown API, and the first version of every graphic and
  every capture was kept so the delivery can show both side by side, with one row per rule of decision 10 and its
  measurement.
- **11.4**: the whole battery is green and the round is appended to `katalis-dev/tasks/entrega-community-03.md` under
  its own heading with `## Issues`.

## State of the tree

Nothing of the round is committed yet in this snapshot; the branch is
`feature/cited-identity-and-readme` and `main` still points at `5dec3af`.

## Hard rules respected

- No `.env` file was opened: only the tracked template with empty values.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider ran every command.
- No font file enters the repository: Outfit is loaded from Google Fonts at render time.
- No source file of a licensed font, no secret, no customer data and no text of the Construye book in any commit.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
