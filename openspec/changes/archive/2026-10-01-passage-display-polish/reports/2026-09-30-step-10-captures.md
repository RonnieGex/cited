# Step 10 — the captures of Amendment 1 (task 10.4)

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 10.4)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** `8c99552` (the implementation of decisions 9 to 12)
- **Agent:** DeepSeek (implementer)
- **Verdict:** the two captures that 7.2 declared NOT DONE are taken, in both languages and both widths, and the five
  of the public page and the widget are taken again. Every one of the thirteen is taken with
  `prefers-reduced-motion: reduce`, so the highlighter of the picture is the finished one.

## The command

```
<clean clone of 8c99552> > $env:CI = "1"; npm run test:e2e

  94 passed (2.0m)
[exit code: 0]
```

The clone is disposable and was created from the objects committed with
`git clone --no-hardlinks --branch feature/passage-display-polish`; its only environment file is the `.env.example` of
the repository, and no `.env.local` of any worktree was opened. The 94 cases of the whole suite pass in 2.0 min, among
them the five of `e2e/passage-display.spec.ts`, which now runs with `test.use({ reducedMotion: "reduce" })`, and the
two new cases of the page of a document with the highlighted passage, one per language. The suite of the round before
this one was 92 cases.

`npm run build:e2e` compiles before Playwright starts. The servers and the ports are the ones of
`playwright.config.ts` (3100 and 3210 to 3217), free when the run started, and no process of another agent was
stopped. The captures land in `test-results/captures/passage-display/` and `test-results/captures/admin/`, which
`.gitignore` excludes, and were copied to `openspec/changes/passage-display-polish/reports/images/`:

```
public-precios-1440-en.png  1440x1289    public-precios-375-en.png   375x1477
public-precios-1440-es.png  1440x1330    public-precios-375-es.png   375x1509
widget-precios-375-en.png    375x1058
try-1440-en.png             1440x1566    try-375-en.png               375x2906
try-1440-es.png             1440x1304    try-375-es.png               375x2627
document-1440-en.png        1440x1109    document-375-en.png          375x1507
document-1440-es.png        1440x1109    document-375-es.png          375x1507
```

## What each capture shows

| Image | Source | What it shows |
|---|---|---|
| `public-precios-1440-en.png` | `e2e/passage-display.spec.ts` | the public page in English with the passage `Precios` open: the heading once under `HEADING`, the five items as one list, each one painted on its own line |
| `public-precios-375-en.png` | the same case at 375 px | the same at 375 px |
| `public-precios-1440-es.png` | the second case | the same in Spanish, under `APARTADO` |
| `public-precios-375-es.png` | the second case at 375 px | the same at 375 px |
| `widget-precios-375-en.png` | the case of `/embed` | the widget with the same passage open: one list of five items and the heading once |
| `try-1440-en.png` | `e2e/setup.spec.ts` (the walk) | Try it with the cited passage: the mark `1` beside it, the heading once as the section label, the highlighter on its own words and the document beside it |
| `try-375-en.png` | the same case at 375 px | the same at 375 px |
| `try-1440-es.png` | `e2e/setup-es.spec.ts` (the walk in Spanish) | the same in Spanish, with the suggestions of the Spanish documents |
| `try-375-es.png` | the same case at 375 px | the same at 375 px |
| `document-1440-en.png` | `e2e/setup.spec.ts` | the page of `cafe-la-horquilla.md` opened at `?highlight=2`: the `Precios` passage is the highlighted one, one list with five items, its heading once as the `h2` of the section |
| `document-375-en.png` | the same case at 375 px | the same at 375 px |
| `document-1440-es.png` | `e2e/setup-es.spec.ts` | the same page in Spanish: `Documento`, `Precios` and the five items in the highlighter |
| `document-375-es.png` | the same case at 375 px | the same at 375 px |

The defect the review of art found — `Café La Horquilla Somos un café…` and a list joined with ` - ` — and the two
Majors of the adversarial review — the heading twice and the list split in two — appear in none of the thirteen.
