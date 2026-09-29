# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: public-page-and-widget (OpenSpec)
ROUND: section 10, "What the review of Codex reproduced" (contract amended by Fable after `revision-community-08`)
BRANCH: feature/public-page-and-widget
BASE: 7c4f4ff (main, "Merge brand-and-design-system")
HEAD AT THE START OF THE ROUND: b487ac1 ("Name the prop of the language switch, and ask for the color, the Escape and
the new tab": the amended decision 8 and the new requirement, written by Fable)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective of this round

Close the four Major that Codex reproduced in `katalis-dev/tasks/revision-community-08.md`, tests first and red before
each fix, reproducing exactly what the review reproduced, and only then repeat the battery:

1. `LanguageSwitch` takes the prop `current` (design decision 8 as amended), so the file this lane owns can replace the
   stand-in of the parallel lane without breaking `npm run typecheck`.
2. The primary color of the settings paints the ask button and the accents of `/` and `/embed` (the new requirement
   "The brand color is seen and the widget closes from inside", scenario "The color reaches the page").
3. `Escape` pressed inside the iframe closes the widget and returns the focus to its button; `widget.js` closes only for
   a message from its own origin (scenario "Escape inside the iframe").
4. A tab opened from the page starts its own conversation (scenario "A tab opened from the page").

Sections 0 to 9 are already delivered and their text is not touched. The parallel lane
(`community`, `feature/admin-panel-and-onboarding`) is not touched either: it already consumes `<LanguageSwitch
current={lang} />` and this round makes the owner match it.

## Hard rules of the round

- No `.env` file is opened (this worktree has none; only `.env.example` is tracked as the public template).
- No push, no remote, no commit in `main`, no archive, no deploy.
- `MEMORY.md` is in no commit; no personal path in a versioned file.
- UTF-8 with LF in every file written.
- No test calls a real provider: the deterministic `fake` runs the whole battery.
