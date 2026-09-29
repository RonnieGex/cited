# Step 10 · the flame has to be seen

Contract: `tasks.md`, tasks 10.1 to 10.4. The four share this report, as the
contract asks.
Agent: deepseek-harness. Date: 2026-09-29.

Every command runs in the worktree `katalis-dev/community-ui`, quoted below as the working directory `.`; no tracked
file carries the absolute path of the machine, because `tests/personal-paths.test.ts` refuses it.

The defect Fable saw: in the banner the flame of `public/brand/` measured 19 px, the height of the `by Katalis` line it
sits beside, and at that size the mark of the maker could not be read. The flame is still the real file of
`public/brand/`, the same bytes of Construye: nothing here redraws it, and the ink variant of the light grounds is
still the one `scripts/render-flame-variants.mjs` derives.

## 10.1 Tests first: the record of the render states the height of the mark

`tests/design-system.test.ts` carries one more case, `states the height of the flame of both banners and of the
preview, and the image shows it`, written and run before the change. It reads three things and refuses to pass on
fewer:

1. `flame.minimumHeight` of `docs/images/readme-banner.json` and of `readme-graphics.json` is the bound of the design
   (40 px for the banner, 64 px for the social preview).
2. the record states the rendered height of the mark: `flame.rendered.dark` and `flame.rendered.light` in the banner,
   `flame.rendered` in the preview, with the box of the mark and the line it sits beside.
3. the committed PNG shows it: the test decodes the banner and the preview and measures the rows of the box the record
   states that carry the mark, so a record cannot claim a size the image does not draw. The ground of a row is read
   inside the box, on its first columns, where the flame keeps a transparent margin.

### The red run, against the 19 px of the banner

```
$ npx vitest run tests/design-system.test.ts -t "states the height of the flame" --silent=false

 ❯ tests/design-system.test.ts (18 tests | 1 failed | 17 skipped) 7ms
   ❯ the mark of the maker is the real flame (9)
     × states the height of the flame of both banners and of the preview, and the image shows it 6ms

 FAIL  tests/design-system.test.ts > the mark of the maker is the real flame > states the height of the flame of both
banners and of the preview, and the image shows it
AssertionError: the dark banner: the record states no height and scripts/readme-banner.html draws the flame at 19px;
the design asks 40px: expected 0 to be greater than or equal to 40
 Test Files  1 failed (1)
      Tests  1 failed | 17 skipped (18)
exit=1
```

The 19 px of the message are the `1em` of the old style sheet, measured against the 19 px of the `by Katalis` line:
the test computes it from the template, so the red is against the real size of the defect and not against a number
written twice. The other 17 cases of the file already passed, as the contract asks: the change is red in the case that
describes it and nowhere else.

## 10.2 The flame at 48 px in the banner and at 68 px in the preview

- The height lives in the style sheet of each render: `48px` in `scripts/readme-banner.html` and `68px` in the styles
  of `scripts/render-readme-graphics.mjs` (they were `1em`, 19 px and 20 px).
- Each render measures the mark it drew and fails below the bound instead of shipping a banner with a mark that cannot
  be read: 40 px in the banner, 64 px in the preview. The old rule (`the mark is exactly as high as the line`) is
  gone, and the mark is still checked to the left of `by Katalis` and centred on it.
- The record of each render states what it measured. `docs/images/readme-banner.json`:

```json
"flame": {
  "dark": "public/brand/katalis-flame-192.png",
  "light": "public/brand/katalis-flame-ink-192.png",
  "minimumHeight": 40,
  "where": "beside the by Katalis line, to its left, taller than the line",
  "rendered": {
    "dark": { "x": 532.52, "y": 226.39, "width": 48, "height": 48, "line": 19 },
    "light": { "x": 532.52, "y": 226.39, "width": 48, "height": 48, "line": 19 }
  }
}
```

and `docs/images/readme-graphics.json`:

```json
"flame": {
  "dark": "public/brand/katalis-flame-192.png",
  "ink": "public/brand/katalis-flame-ink-192.png",
  "minimumHeight": 64,
  "where": "beside the by Katalis line, to its left, taller than the line",
  "rendered": { "x": 72, "y": 456.39, "width": 68, "height": 68, "line": 20 }
}
```

The preview draws the mark at 68 px and not at 64 because the flame of the 192 px file fills 190 of its 192 rows: a box
of exactly 64 px shows 63 rows of mark, and the bound of the design is a height a reader sees. The foot of the two
READMEs is untouched: it is still the `<picture>` with `height="48"` of the previous round, and its test still passes.

### The renders

```
$ node scripts/render-readme-banner.mjs
rendered docs/images/readme-banner-dark.png (the flame is 48.0 by 48.0px, the line 19px, the floor 40px)
rendered docs/images/readme-banner-light.png (the flame is 48.0 by 48.0px, the line 19px, the floor 40px)
wrote docs/images/readme-banner.json
exit=0

$ node scripts/render-readme-graphics.mjs
social-preview (dark): the flame is 68.0 by 68.0px beside a line of 20px, the floor 64px
rendered docs/images/social-preview.png (32271 bytes, smallest text 20px, 0 headlines, empty band 136px of 160px)
wrote docs/images/readme-graphics.json
updated the quick start of README.md
updated the quick start of README.es.md
exit=0
```

The rest of that run is the seven graphics in both themes with their contrast table, unchanged and green. The render of
the graphics also rewrites the two blocks of the quick start with the milliseconds and the memory of the run and
redraws `demo-{dark,light}.png` with those numbers, which is the behaviour of the base that step 5 recorded as RISK 7.
`README.md`, `README.es.md`, `docs/images/demo-dark.png` and `docs/images/demo-light.png` change in nothing else.

### The test green, with the mark measured on the image

```
$ npx vitest run tests/design-system.test.ts -t "states the height of the flame" --silent=false
the dark banner: the record states 48px, the style sheet draws 48px, docs/images/readme-banner-dark.png shows a mark of 46px
the light banner: the record states 48px, the style sheet draws 48px, docs/images/readme-banner-light.png shows a mark of 47px
the social preview: the record states 68px, the style sheet draws 68px, docs/images/social-preview.png shows a mark of 66px
 Test Files  1 passed (1)
      Tests  1 passed | 17 skipped (18)
exit=0
```

The 46 and the 47 px of the two banners and the 66 px of the preview are the rows of the committed PNG that carry the
mark with the alpha a reader sees; the last row or two of the box are the faint edge of the flame, and the bound of the
design is 40 and 64.

### The luminance and the honesty tests, green

```
$ npx vitest run tests/readme.test.ts -t "luminance" --silent=false
readme-banner-dark.png luminance 0.162 transparent 0.000
readme-banner-light.png luminance 0.921 transparent 0.000
social-preview.png luminance 0.152 transparent 0.000
The transparency of the flame: public/brand/katalis-flame-192.png 0.721, public/brand/katalis-flame-ink-192.png 0.748
      Tests  1 passed | 41 skipped (42)
exit=0
```

The bigger mark moves no canvas out of its bound (the dark banner was 0.162 and is 0.162, the light one was 0.922 and
is 0.921, the preview is 0.152 and the bound is 0.30). The records go through `assertHonestRecord` in the render itself
and in `tests/readme.test.ts`, and the new text fields of the record are read by the walker of that file like any
other. `docs/design-system.md` and `docs/readme-assets.md` state the new sizes and the two bounds, because the old
sentence (`at the height of the by Katalis line`) would have become false.

## 10.3 The licence stays byte for byte

The state of the check before this task, with two offenders:

```
$ git diff --check main...HEAD
public/fonts/outfit/OFL.txt:21: trailing whitespace.
+fonts, including any derivative works, can be bundled, embedded,
reports/2026-09-29-step-5-checks.md:146: trailing whitespace.
++fonts, including any derivative works, can be bundled, embedded,
exit=2
```

Three of the four quoted lines above end with the space the check is about, and they are quoted here without it, as
every line of this report is: the trailing space of the licence is shown by the command that measures the file, not by
a copy of it.

The first line is the licence of Outfit, copied byte for byte from the official Google Fonts repository: its line 21
ends with a space because its authors wrote it that way, and trimming it would change the file and break the SHA-256
that `docs/design-system.md` records and a test compares. `.gitattributes` exempts that path from the whitespace check,
so the text stays verbatim and the check stops reporting it:

```
$ git check-attr whitespace -- public/fonts/outfit/OFL.txt
public/fonts/outfit/OFL.txt: whitespace: unset

$ Get-FileHash public/fonts/outfit/OFL.txt -Algorithm SHA256
c676351bf8576b9aba743cd5eaa8c0e7ee0d51f805d720447b4df4ddb6a2e416      # the hash of step 3.3, unchanged

$ git diff main...HEAD --stat -- public/fonts/outfit/OFL.txt
 public/fonts/outfit/OFL.txt | 93 +++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 93 insertions(+)
```

The second line of the check was not the licence but the report of step 5, which quoted that same line of the licence
including its trailing space inside a code block. Removing an invisible space from a quotation of our own report does
not touch the licence and is what lets the check see the difference between the two, so it was done, and this is the
one line of the sections 0 to 9 this round changed:

```
$ git diff ac818eb..HEAD -- reports/2026-09-29-step-5-checks.md
-+fonts, including any derivative works, can be bundled, embedded,
++fonts, including any derivative works, can be bundled, embedded,
```

The path of the report of step 5 in the two quotations above is the one of before the move of section 11: the check and
the command printed it that way and they are quoted as they ran. The file lives now in
`reports/2026-09-29-step-5-checks.md`.

With both, the check the contract asks for:

```
$ git diff --check main...HEAD
exit=0
```

## 10.4 The battery

```
$ npm test
> vitest run
 Test Files  12 passed (12)
      Tests  132 passed (132)
exit=0

$ npm run typecheck
> next typegen && tsc --noEmit
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npm run secrets:scan
> gitleaks git --redact --no-banner
175 commits scanned, ~1983577 bytes (1.98 MB) in 947ms, no leaks found
exit=0

$ npx openspec validate --all --strict
Totals: 7 passed, 0 failed (7 items)
exit=0

$ git status --short --branch
## feature/brand-and-design-system
```

`132 passed` is the 131 of step 5 plus the case this round wrote. The delivery
`katalis-dev/tasks/entrega-community-04.md` carries the round in Spanish, with the new images of
`tasks/capturas-community-04/` and its `## Issues`.

The images of the round: the banner of `ac818eb` (the mark at 19 px) beside the two banners of now (48 px) and the
social preview (68 px), all of them the file the render wrote, plus the byline of the dark banner cropped at 340 by
90 px `[480, 205]` in both, which is where the difference is read at a glance:

```
$ node .data/render-flame-captures.mjs      # the script of the round: `git show ac818eb:docs/...` and `sharp`
wrote flama-banner-antes.png (the banner of ac818eb, the mark at 19 px)
wrote flama-banner-dark.png (docs/images/readme-banner-dark.png)
wrote flama-banner-light.png (docs/images/readme-banner-light.png)
wrote flama-social-preview.png (docs/images/social-preview.png)
wrote flama-zoom-antes.png (the byline of the dark banner, 340x90)
wrote flama-zoom-despues.png (the byline of the dark banner, 340x90)
exit=0
```

The crop script is not committed: it reads one blob of the history and crops two images, and the delivery quotes its
two commands. Everything else of the round is in the repository.

## Commits of this task

- `8429ff9` the round opens, with `LOOP_STATE.md` in RUNNING.
- `6c25e43` the red case of the size of the mark (10.1).
- `572dfea` the flame at 48 px in the banner and 68 px in the preview, with the floor of each render (10.2).
- `17ca398` the two banners, the social preview and the quick start rendered again (10.2).
- `d805bda` the new sizes and bounds in `docs/design-system.md` and `docs/readme-assets.md` (10.2).
- `037e4b2` the exemption of the verbatim licence in `.gitattributes` (10.3).
- `6765621` the quotation of the report of step 5 without its trailing space (10.3).

## Files

- `tests/design-system.test.ts` (the case of the size, and the helpers that measure the image).
- `scripts/readme-banner.html`, `scripts/render-readme-banner.mjs`, `scripts/render-readme-graphics.mjs`.
- `docs/images/readme-banner-{dark,light}.png`, `docs/images/readme-banner.json`,
  `docs/images/social-preview.png`, `docs/images/readme-graphics.json`, `docs/images/demo-{dark,light}.png`.
- `README.md`, `README.es.md` (the numbers of the quick start, as the render writes them).
- `docs/design-system.md`, `docs/readme-assets.md`.
- `.gitattributes`, `reports/2026-09-29-step-5-checks.md` (one invisible space
  of a quotation).
- `LOOP_STATE.md` and this report.
