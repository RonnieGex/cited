# Step 11: the contrast of the controls and the place of the reports

Contract: `openspec/changes/brand-and-design-system/tasks.md`, section 11, written by Fable after
`katalis-dev/tasks/revision-community-04.md`. Branch `feature/brand-and-design-system` in the worktree
`katalis-dev/community-ui`; base `aa52b7c` of `main`; the round opens at `e3c003d`.

The rulings of Fable that bound the round: the kit is light only in this change (the dark half of the Major 1 of the
review is out of scope and the README images keep their two themes), the contrast of the controls is in scope, and the
edit of `design.md` in `dd174e9` is accepted. The text of the sections 0 to 10 was not edited: the one box that changed
in `tasks.md` is the one of the four tasks of this section.

## 11.1 The eleven reports travel with the change

The reports of the sections 0 to 10 lived in the global `reports/` of the repository, which the standard of this
repository does not allow: `docs/katalis-sdd-standard.md` and `openspec/config.yaml` fix
`openspec/changes/<change>/reports/YYYY-MM-DD-step-N-<name>.md`, inside the change, so the evidence travels with the
change when it is archived. That is the Major 2 of the review, and Fable amended the header of `tasks.md` (line 2) to
name that path before this round.

```
$ New-Item -ItemType Directory -Force -Path openspec\changes\brand-and-design-system\reports
$ Get-ChildItem reports -File | ForEach-Object { git mv "reports/$($_.Name)" "openspec/changes/brand-and-design-system/reports/$($_.Name)" }

$ git status --short
R  reports/2026-09-29-step-0-branch.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-0-branch.md
R  reports/2026-09-29-step-1-base-before.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-1-base-before.md
R  reports/2026-09-29-step-10-flame-size.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-10-flame-size.md
R  reports/2026-09-29-step-2-tests-first.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-2-tests-first.md
R  reports/2026-09-29-step-3-implementation.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-3-implementation.md
R  reports/2026-09-29-step-4-existing-tests.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-4-existing-tests.md
R  reports/2026-09-29-step-5-checks.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-5-checks.md
R  reports/2026-09-29-step-6-curl.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-6-curl.md
R  reports/2026-09-29-step-7-e2e.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-7-e2e.md
R  reports/2026-09-29-step-8-base-after.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-8-base-after.md
R  reports/2026-09-29-step-9-docs.md -> openspec/changes/brand-and-design-system/reports/2026-09-29-step-9-docs.md
```

`R` and not `A` plus `D`: the eleven files are renames, and the history of each one is followed through the move:

```
$ git log --follow --oneline -- openspec/changes/brand-and-design-system/reports/2026-09-29-step-0-branch.md
98ac5ce Move the eleven reports of the change inside the change, with their references
dd174e9 Take the home directory out of the tracked contract and the first report
fbf1498 Confirm the branch, the base and the install of the round

$ git show --name-status -M --oneline HEAD      # the eleven lines of the commit, with their similarity
R096	reports/2026-09-29-step-0-branch.md	openspec/changes/brand-and-design-system/reports/2026-09-29-step-0-branch.md
R100	reports/2026-09-29-step-3-implementation.md	openspec/changes/brand-and-design-system/reports/2026-09-29-step-3-implementation.md
...
```

The empty directory is gone, and the change still validates:

```
$ Test-Path reports
False

$ npx openspec validate --all --strict
Totals: 7 passed, 0 failed (7 items)
exit=0
```

### The references, one by one

Nine reports carried a `Files` bullet that pointed at themselves (`- reports/<name> (this file).`) and the report of
step 10 carried one more in its own list. All ten now carry the full repository path of the file. Two quotations of
past runs name the old path and were left byte for byte, because they record what a command printed when it printed
it; each one now has a sentence that says where the file lives:

| File and line | Why it stays |
|---|---|
| `2026-09-29-step-1-base-before.md`, line 99 | it is the output of `git show --stat dd174e9`, which listed the report of step 0 at the path of then |
| `2026-09-29-step-10-flame-size.md`, lines 155 and 187 | they are the output of `git diff --check main...HEAD` and the command of the previous round |

Three more references lived in the delivery `katalis-dev/tasks/entrega-community-04.md` (the list of the reports of
the round 1, the report of the round 2 and one line of its `## Issues`) and were fixed to the new path.

The shorthand `reports/<name>` of the sections 0 to 10 of `tasks.md` was not touched: it is the text of the contract,
the amendment of Fable lives in its line 2 and names the real path, and the round changes no task text. The sections
11.1 to 11.4 name the report of this section with its full path.

Commit of the task: `98ac5ce`.

## 11.2 Tests first: the computed colors of `/kit`, and red

The scenario `The controls can be seen` of the delta asks three things of the rendered `/kit`: the border of `Input`,
the border of the secondary `Button` and the focus indicator reach 3:1 against the ground they sit on (WCAG 2.2,
1.4.11), every text reaches 4.5:1 (3:1 at 24 px or more), and the border and the fill of `Panel` are decorative and
exempt. The axe run of the previous round returned zero violations because non-text contrast is not one of its rules;
this test measures the colours instead of trusting that silence.

`e2e/design-system.spec.ts` carries a fourth test that navigates to `/kit` and, in one pass in the page:

- paints the ground of an element with the default ground of the page and the background of every ancestor in a
  canvas, and composites the computed colours on it, so a colour with alpha is measured as the reader sees it;
- reads the border of `Input` and of the secondary `Button`, the border and the fill of `Panel` and of `Chip`, every
  text of the page with its size, the placeholder and the value of the field;
- resolves the token `--border` in the page itself, so the border of a control is compared with the hairline of the
  system and not with the colour a utility would fall back to;
- focuses the field and the secondary button, waits for the transition of the outline and reads the two parts of the
  focus indicator (the `outline` and the shadow of the ring) from the computed style;
- screenshots eight pixels around the top left corner of each control and decodes the PNG with `tests/png.ts`, because
  the review of Codex measured the painted pixels and not the computed colour: a value the browser did not paint
  cannot pass.

The unit half is one case of `tests/design-system.test.ts`: the token `--border` is declared once, reaches Tailwind as
`--color-border`, is recorded in `docs/design-system.md` with the same value, `Input` and `Button` use `border-border`
and `Panel` keeps its own hairline.

Both were written before the change and both were red:

```
$ npx vitest run tests/design-system.test.ts
 ❯ tests/design-system.test.ts (19 tests | 1 failed)
   × gives the controls a hairline of the system, recorded in the document
AssertionError: docs/design-system.md carries one row for --border: expected +0 to be 1
 Test Files  1 failed (1)
      Tests  1 failed | 18 passed (19)
exit=1
```

```
$ npm run test:e2e
the hairline of the controls: --border resolves to rgb(0, 0, 0) = rgb(0, 0, 0) on the ground of the page
Input: the border is oklab(0.204625 0.00000931323 0.00000409782 / 0.2) = rgb(209, 209, 209) over the ground rgb(255, 255, 255), 1.53:1 at 1px (the scenario asks 3:1)

    Error: Input: the border over the ground it sits on
    Expected: >= 3
    Received:    1.527057553215567

  1 failed
    [chromium] › e2e\design-system.spec.ts:186:5 › the controls can be seen: 3:1 of the border and of the focus, 4.5:1 of every text
  3 passed (10.2s)
exit=1
```

The `1.53:1` of the red run is the number the review of Codex measured on the rendered page, reproduced here from the
computed colour of the control and from the ground the page paints under it.

Commit of the task: `12874df`.

## 11.3 The hairline of the controls

`Input` and the secondary `Button` took their border from `border-ink/20`: the ink of the system at 20 % of alpha over
the paper, which is `rgb(209, 209, 209)` and 1.53:1, below the 3:1 of the rule. The reference has no value for this:
`--stroke` of Construye is `rgba(0, 0, 0, 0.08)`, 1.19:1 on paper, so no hairline of the reference can carry a control.

The change adds one token to `app/tokens.css`, derived from the two colours of Construye and with no colour of its own,
and exposes it to Tailwind:

```
:root {
  --border: color-mix(in srgb, var(--ink) 50%, var(--paper));   /* #8B8B8B, 139,139,139 */
}

@theme inline {
  --color-border: var(--border);
}
```

`components/ui/Input.tsx` and the `secondary` variant of `components/ui/Button.tsx` move from `border-ink/20` to
`border-border`; nothing else of them changes. `Panel` keeps `border-ink/10` and `Chip` keeps `border-ink/20`, as the
task asks of the panel: the edge of a panel and the edge of a label are decorative, because the content of the panel
and the word of the chip do not depend on seeing them, and the scenario exempts the panel by name.

`focus.ts` did not change. The focus indicator of the kit is the 2 px lime outline of decision 6 plus the one pixel
edge of ink that the design pairs with it, and the measurement says which of the two carries the contrast: the lime is
1.22:1 on paper and the edge is 17.93:1, so the indicator does reach the 3:1 of the scenario through its edge and the
lime of the design stays. Both parts are measured by the test, so neither can disappear without the test saying so.
`docs/design-system.md` records the token, the reason and the two ratios; the sentence that said the lime is 1.07:1 was
corrected to the measured 1.22:1.

Green, with the same commands:

```
$ npx vitest run tests/design-system.test.ts
 Test Files  1 passed (1)
      Tests  19 passed (19)
exit=0
```

```
$ npm run test:e2e
the hairline of the controls: --border resolves to color(srgb 0.545098 0.545098 0.545098) = rgb(139, 139, 139) on the ground of the page
Input: the border is color(srgb 0.545098 0.545098 0.545098) = rgb(139, 139, 139) over the ground rgb(255, 255, 255), 3.41:1 at 1px (the scenario asks 3:1)
the rendered frame of Input: rgb(255, 255, 255) x54, rgb(139, 139, 139) x10; the hairline is painted 10 times
the secondary Button: the border is color(srgb 0.545098 0.545098 0.545098) = rgb(139, 139, 139) over the ground rgb(255, 255, 255), 3.41:1 at 1px (the scenario asks 3:1)
the rendered frame of the secondary Button: rgb(221, 244, 105) x8, rgb(255, 255, 255) x34, rgb(23, 23, 23) x12, rgb(139, 139, 139) x10; the hairline is painted 10 times
Panel: the border rgb(226, 226, 225) is 1.30:1 and the fill rgb(250, 250, 249) is 1.04:1: decorative and exempt
Chip: the border rgb(209, 209, 209) is 1.53:1 and the fill rgb(255, 255, 255) is 1.00:1: decorative and exempt
the focus of [data-kit="input"]: the outline rgb(221, 244, 105) of 2px is 1.22:1, and the edge that the design pairs with it (rgb(23, 23, 23) of 1px) is 17.93:1 (the indicator asks 3:1)
the focus of [data-kit="button-secondary"]: the outline rgb(221, 244, 105) of 2px is 1.22:1, and the edge that the design pairs with it (rgb(23, 23, 23) of 1px) is 17.93:1 (the indicator asks 3:1)
  4 passed (8.9s)
exit=0
```

The frame of `Panel` shows `rgb(226, 226, 225)`, the number the review measured, and the frame of the secondary button
shows its focus indicator as the page paints it: eight pixels of lime and twelve of ink around the hairline.

The 3.41:1 is against the paper of `/kit`. The same token over the warm surface of `Panel` (`#FAFAF9`) is 3.26:1, so a
control placed on the warm paper of the brand also passes. A separate verification, not committed, read the painted
pixels of the built page in Chromium and found the hairline exactly (`rgb(139,139,139)`) in the corner and in the edge
of both controls, which is the method the review used:

```
$ node .data/verify-hairline.mjs
boxes: {"[data-kit=\"input\"]":{"x":160,"y":555.5,"width":520,"height":58}, "[data-kit=\"button-secondary\"]":{...}}
[data-kit="input"] corner: {"size":[6,6],"counts":{"255,255,255":30,"139,139,139":6}}
[data-kit="input"] edge:   {"size":[4,3],"counts":{"255,255,255":9,"139,139,139":3}}
[data-kit="button-secondary"] corner: {"size":[6,6],"counts":{"255,255,255":30,"139,139,139":6}}
[data-kit="button-secondary"] edge:   {"size":[4,3],"counts":{"255,255,255":9,"139,139,139":3}}
```

The look is kept: the hairline is still one square pixel of an ink tone, the lime outline and its offset are untouched,
`Panel` and `Chip` are as light as they were, and the corner radius is still zero.

Commits of the task: `183883f` (the token, the two components and the document) and `09369c5` (the pixel half of the
test).

## 11.4 The battery

```
$ npm test
 Test Files  12 passed (12)
      Tests  133 passed (133)
exit=0
```

`133 passed` is the 132 of step 10 plus the case this round wrote.

```
$ npm run typecheck
> next typegen && tsc --noEmit
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npm run test:e2e
  4 passed (8.9s)
exit=0

$ npm run secrets:scan
184 commits scanned, ~2058696 bytes (2.06 MB) in 1.07s, no leaks found
exit=0

$ npx openspec validate --all --strict
Totals: 7 passed, 0 failed (7 items)
exit=0

$ git diff --check main...HEAD
exit=0

$ git status --short --branch
## feature/brand-and-design-system
```

The round is appended to `katalis-dev/tasks/entrega-community-04.md` in Spanish, with its `## Issues`, and the state of
the loop is in `LOOP_STATE.md`.

## Commits of this section

- `2e9f77b` the round opens, with `LOOP_STATE.md` in RUNNING.
- `98ac5ce` the eleven reports inside the change, with their references (11.1).
- `12874df` the red test of the contrast, unit and browser (11.2).
- `183883f` the hairline of the controls and its record in the document (11.3).
- `09369c5` the painted pixel of the hairline, and the frame of the exempt parts (11.3).
- The report of this section, the four boxes of the section 11 of `tasks.md` and `LOOP_STATE.md` travel in the commit
  that follows, which closes the round.

## Files

- The eleven reports of the sections 0 to 10, moved from `reports/` with `git mv`.
- `app/tokens.css` (the token `--border` and `--color-border`).
- `components/ui/Input.tsx`, `components/ui/Button.tsx` (the border of the two controls).
- `e2e/design-system.spec.ts` (the test of the scenario and its helpers).
- `tests/design-system.test.ts` (the case of the token and of the document).
- `docs/design-system.md` (the hairline, its ratios and the correction of the lime on paper).
- `openspec/changes/brand-and-design-system/tasks.md` (the four boxes of the section 11 and nothing else).
- `katalis-dev/tasks/entrega-community-04.md` (the round and its `## Issues`, outside the repository).
- `openspec/changes/brand-and-design-system/reports/2026-09-29-step-11-contrast.md` (this file).
