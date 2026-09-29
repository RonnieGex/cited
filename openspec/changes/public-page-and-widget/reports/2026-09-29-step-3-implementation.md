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

The commit of step 3.1 is `9d83048` ("Build the chat and the sanitized Markdown renderer of the answer"), read from
`git log` in the report of 3.2.

## 3.2 The public page with the theme from the settings (decision 3)

### What was written

| Path | What it is |
| --- | --- |
| `lib/theme/primary.ts` | The contrast of a color against the ink and the paper, `textOn` (the token that is legible on the fill) and `readablePrimary`: the color of the settings when the better of its two contrasts reaches AA (4.5:1), lime when it does not, when it is empty or when it is not a hex color |
| `lib/public/brand.ts` | The face of the business for both pages: the language of the visitor over the language of the business, the name (the product name when the business has none), the logo flag, the primary color with its fallback and the welcome message |
| `app/page.tsx` | The public page: one `main` with one `h1`, the logo the panel serves, the chat and the foot with the flame of Katalis. The primary color travels as the CSS variables `--primary` and `--on-primary` |
| `app/layout.tsx` | The document declares the language of the page, so `lang="en"` holds for the demo and `lang="es"` for a visitor who chose Spanish or for a business that speaks Spanish |

### The commands

```powershell
npx vitest run tests/theme.test.ts tests/public-page.test.tsx
```

### The output (verbatim)

```text
 RUN  v5.0.2 <repository root>

 Test Files  2 passed (2)
      Tests  17 passed (17)
   Start at  10:09:44
   Duration  2.17s (environment 74%, setup 9%, tests 6%, import 3%, worker 1%)
```

### The decisions this section had to take, because the story leaves them open

1. **What "checked for contrast against the ink and the paper" means.** The primary color is a fill that carries text,
   so what has to reach AA is the better of its two contrasts, and `textOn` picks the ink or the paper for the text on
   it. The alternative reading, both contrasts at once, would refuse lime (1.22:1 against the paper), which is the
   fallback the same decision names, so it cannot be the one meant. Both are recorded in the head of
   `lib/theme/primary.ts` and in the Issues of the delivery.
2. **The band of the colors that fail.** The colors that fail against both tokens are the narrow band between the
   luminance where the paper stops reaching 4.5:1 and the one where the ink starts: 0.183 to 0.214. The test uses
   `#7c7c7c` (4.30:1 against the ink, 4.17:1 against the paper), and the first version of the test used `#767676`,
   which measures 4.54:1 against the paper and therefore passes: the correction of the test is in this commit.
3. **The ink is not pure black.** `#171717` against the paper is 17.93:1 and not the 21:1 of the theoretical pair; the
   test pins both numbers now.
4. **`app/layout.tsx` reads the cookie and the business.** Reading the language of the document needs both, so every
   route of the app is rendered per request from now on. It is the price of a document whose `lang` tells the truth in
   both languages, and the alternative (a `lang` that is always `en`) would fail the scenario of the demo.

### Commit

The commit of this step is the one that carries this section, and its hash is written in the report of step 3.3.
