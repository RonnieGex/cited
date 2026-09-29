# Step 4 · review and update of the existing tests

Contract: `openspec/changes/brand-and-design-system/tasks.md`, task 4.1.
Agent: deepseek-harness. Date: 2026-09-29.

Every command runs in the worktree `katalis-dev/community-ui`, quoted below as the working directory `.`.

## The whole suite

```
$ npm test
> cited@0.1.0 test
> vitest run

 RUN  v5.0.2 <root>

 Test Files  12 passed (12)
      Tests  131 passed (131)
   Duration  8.43s
exit=0
```

The base ran 11 files and 114 tests (two of them failing, the defect recorded in the report of step 1.1); the change
adds `tests/design-system.test.ts` with 17 tests and touches nothing else of the count. No test was deleted.

## Which test changed and why

`tests/readme.test.ts` is the only existing file that changed. Five of its tests spoke of the invented logo or of a
repository with no font file, and both of those facts are what this change reverses.

| Test | What changed | Why |
|---|---|---|
| `records the brand tokens and the font, and the font is not a file of the repository` | renamed to `... and the font of the repository is Outfit`; `fileInRepository` is now expected `true` instead of `false`, the record has to name `public/fonts/outfit/outfit-latin.woff2`, that file has to exist, and every font file git tracks has to be under `public/fonts/outfit/` instead of the test expecting none at all | decision 5 puts Outfit in the repository under the SIL Open Font License, which is the whole point of the change; the renderers read it from there since `644dff3`, so the record says the truth and the test measures the same rule the new `tests/design-system.test.ts` measures |
| `shows every graphic of the design in both themes, as a picture with its alt` | the pair of the foot is `public/brand/katalis-flame-192.png` and `public/brand/katalis-flame-ink-192.png` instead of `docs/images/katalis-logo{,-dark}.png` | the foot shows the real flame of the maker now, and the two files of the invented drawing do not exist |
| `keeps every image as a PNG under docs/images, 3 MB or less together` | renamed to `... under docs/images or public/brand ...`; a local image may start with either directory | the foot of the README carries a brand asset, which lives in `public/brand/`; the graphics of the README keep living in `docs/images/`, and the budget of 3 MB still covers both |
| `keeps every canvas in the luminance bounds of the second art direction` | `artDirection.marks` disappeared; the PNGs of `docs/images` are now compared with the canvases alone, and the transparency of the two marks is measured where they live, in `public/brand/` | same reason: the mark of the maker is a brand asset of `public/brand/`, and the rule it defends (the footer mark is transparent, not a painted canvas) is the rule it keeps defending, on the new paths |
| `closes with the license and the foot of Katalis` | the body has to contain the ink variant of the flame instead of the deleted `docs/images/katalis-logo.png` | the foot of the README changed |

`tests/design-system.test.ts` is new in this change and needed four corrections of its own while it was being made
green, each of them recorded in the report of the step that found it:

- the alpha of the ink variant is compared with a box filter of the 512 px original instead of with the committed
  64 and 192 px files, because those two are not resizes of the 512 px with the kernel of `sharp` (3107 of the 36864
  alpha pixels of the 192 px differ): the expectation was wrong, not the implementation (step 3.1);
- the lightness bound of the ink is measured on the pixels a reader sees, because the Lanczos resize rings on the
  invisible edge of the mark (step 3.1);
- the token values are read from the `:root` block instead of from the whole sheet, because `--ease-out-expo` is
  declared twice, once as the curve and once as the alias that exposes it to Tailwind (step 3.3);
- the variants of `Button` are read as the words `primary` and `secondary` instead of as a quoted literal, because the
  keys of an object are not quoted (step 3.3).

Nothing else changed: every other test of the repository passes without an edit, and the two failures of the base were
repaired in `dd174e9` by taking the home directory of the machine out of the contract that carried it.

## Commits of this task

- `697c60e` the update of the five tests; this report travels in the commit that follows it.

## Files

- `tests/readme.test.ts` (five tests).
- `reports/2026-09-29-step-4-existing-tests.md` (this file).
