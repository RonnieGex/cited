# Step 4 — the existing tests the change touches

- **Date:** 2026-09-30
- **Change:** `passage-display-polish` (`tasks.md`, task 4.1)
- **Branch:** `feature/passage-display-polish`
- **Commit this report was verified against:** the commit that carries it (the parent is `b441374`, the implementation)
- **Agent:** DeepSeek (implementer)
- **Verdict:** every file the task names was read, the expectations that the new behaviour invalidates were updated with
  their reason, and no case was deleted. The unit suite and the whole browser suite pass.

## The unit suite

```
<worktree> > npx -y -p node@24 node node_modules/vitest/vitest.mjs run
 Test Files  89 passed (89)
      Tests  1051 passed (1051)
   Duration  80.54s
[exit code: 0]
```

## The browser suite of the code of `b441374`, on a clean clone

```
<clean clone> > npm run test:e2e
  87 passed (2.0m)
[exit code: 0]
```

The clone was made from the branch at `b441374` with `git clone --no-hardlinks`, it carries no `.env.local` (its only
environment file is `.env.example`), and the run took 146 s of wall clock.

## The expectations that changed, each one with its reason

| File | What changed | Why |
|---|---|---|
| `tests/chat.test.tsx` | the case of the open citation reads the excerpt with `getByText(excerpt, { selector: ".hl" })` and the heading with `getAllByText(heading)` (two elements: the heading of the passage and the `dd` of the note) | the heading of the passage is now an element of its own above the text (decision 1), so `getByText(excerpt)` alone is not the whole note any more |
| `tests/brand-public.test.tsx` | the `Citation` fixtures of the file carry `lead: 0` | the field is required by the type; `0` is the value of a first passage of a section, which is what those fixtures describe |
| `tests/brand-round-14c-public.test.tsx` | the same | the same |
| `tests/ask-client.test.ts` | the fixture carries `lead: 0`, and a case was added: a citation of a server that carries no `lead` reads as a whole excerpt | the client is the door of the page, and an installation whose server is older than the page must not paint a bad highlight |
| `tests/voice-tool.test.ts` | the fixture carries `lead: 0` | the same |
| `tests/setup-ui.test.tsx` | the two new cases and the case of the document page read the new structure | the new behaviour of decisions 1, 3, 5 and 6 |

## The files the task names, one by one

- `tests/search.test.ts`: no expectation holds a list (its three documents are paragraphs only), so nothing changed.
  The scenario "Search does not move" is the rerun of step 5.2 against the baseline of `2026-09-30-step-1-corpus.md`.
- `tests/chat.test.tsx:113`: the exact `getByText` of the excerpt — updated, see the table.
- `tests/brand-public.test.tsx`: the assertion that the `.hl` element holds `first.excerpt` still holds, because that
  citation repeats nothing of the passage before it (`lead: 0`), which is the fixture the case was written with.
- `tests/brand-round-14c-public.test.tsx`: its fixtures carry no repetition either; only the type changed.
- `e2e/public-chat.spec.ts`: passes untouched.
- `e2e/brand.spec.ts`: the case that reads `.hl` still finds "Afinación de bicicleta: 380 pesos." inside the
  highlighter; the heading of the passage is a separate element and the case never asked for it inside `.hl`.
- `e2e/setup.spec.ts` and `e2e/setup-es.spec.ts`: both click the first suggestion and expect "380 pesos". The first
  suggestion of the English panel is now a heading of `bike-workshop-policies.md` and the one of the Spanish panel a
  heading of `cafe-la-horquilla.md` (decision 7); the double of the suite answers the same sentence for either, and both
  passes. The document page still shows "Afinación de bicicleta: 380 pesos." — now as one item of the list.

No case of any file was deleted.
