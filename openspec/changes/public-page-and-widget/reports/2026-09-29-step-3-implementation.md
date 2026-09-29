# Step 3: implementation

- Date: 2026-09-29
- Change: `public-page-and-widget`
- Branch: `feature/public-page-and-widget`
- Agent: deepseek-harness
- Verdict: the chat, the Markdown renderer, the language of the page and the session are built and their tests are
  green; the page, the theme, the widget and the headers close in 3.2 and 3.3.

## A correction of the previous report

The report of step 2 announced the commit of 2.2 as `2d21f9b` before the commit existed. The real hash is `9c014e8`
("Write the end-to-end tests of the public page first: the chat, the widget, the origins and axe"). The hash of 2.1,
`44463da`, is the real one. The task text is not edited; the correction lives here.

## 3.1 The chat component and the Markdown renderer (decisions 1 and 2)

### What was written

| Path | What it is |
| --- | --- |
| `lib/markdown/parse.ts` | The allowlist renderer: paragraphs, lists, bold, italic, code, links of `http` and `https` only and the `[n]` of a citation. `safeUrl` refuses everything that is not `http` or `https`; raw HTML is text and never a node |
| `components/chat/Markdown.tsx` | Paints the tree of the parser. A `[n]` is a button with an accessible name when the answer carries citations, and plain text when it does not. No `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` |
| `lib/chat/session.ts` | `cited-session` in session storage: `crypto.randomUUID()` once per tab, kept between questions |
| `lib/chat/client.ts` | The browser half of `/api/ask`: the question with the `sessionId`, and the three states of the answer |
| `components/chat/Chat.tsx` | The one chat of `/` and `/embed`: the welcome, the language switch, the turns, the loading state in words, the refusal panel, the citation chips and the question box |
| `components/chat/CitationPanel.tsx` | The panel a chip opens: the excerpt, the document and the heading |
| `components/chat/index.ts` | The exports of the folder |
| `lib/i18n/language.ts` | `LANG_COOKIE`, `resolveLang`, `langCookie` (owned by this lane, decision 8) |
| `lib/i18n/public.ts` | The strings of the public page and of the widget, English first, and `welcomeFor` |
| `components/i18n/LanguageSwitch.tsx` | `English | Español` in that order, `aria-pressed`, the cookie and then the reload (owned by this lane, decision 8) |
| `lib/settings/business.ts` | The stand-in of the parallel lane, with the exact interface of decision 8 and the header the decision asks for: `// Stand-in until admin-panel-and-onboarding merges; Fable replaces it with the owner's file`. `readBusiness()` answers `null` (nothing is stored), which is what the demo needs and what the interface allows; the tests of this lane mock the module |

### The command

```powershell
npx vitest run tests/markdown.test.tsx tests/session.test.ts tests/i18n.test.tsx tests/ask-client.test.ts tests/chat.test.tsx
```

### The output (verbatim)

```text
 RUN  v5.0.2 <repository root>

 Test Files  5 passed (5)
      Tests  38 passed (38)
   Start at  10:07:53
   Duration  2.13s (environment 71%, setup 12%, tests 9%, transform 4%, import 3%, worker 1%)
```

### Two corrections of the red tests, before the code

- `tests/markdown.test.ts` and `tests/i18n.test.ts` render components, so they are `tests/markdown.test.tsx` and
  `tests/i18n.test.tsx`: as `.ts` they do not parse. The rename is part of this commit.
- `tests/session.test.ts` wrote the stored id through the same method it was measuring (`setItem`), so its own setup
  appeared as a write of the code under test. The setup writes the map directly now, and the assertion is the real one:
  a tab that already carries an id does not write again.

### What is still red, and why

`tests/theme.test.ts` waits for `lib/theme/primary.ts` (step 3.2), and `tests/widget.test.ts`, `tests/csp.test.ts` and
`tests/public-page.test.tsx` wait for the widget, the headers and the page (steps 3.2 and 3.3). The whole-suite run of
step 4 is the one that has to be green.

### Lint

```powershell
npx eslint components lib tests e2e playwright.config.ts
```

Output: exit 0. The first run found `react-hooks/immutability` on the assignment to `document.cookie` inside the
component; the write moved to a module function, `chooseLanguage`, and the run above is the one after it.

### Commit

The commit of this step is the one that carries this report, the sources of the table above, the rename of the two test
files and the correction of `tests/session.test.ts`; a commit cannot carry its own hash, so the hash is written in the
report of step 3.2.
