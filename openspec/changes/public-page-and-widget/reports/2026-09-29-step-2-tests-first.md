# Step 2: tests first

- Date: 2026-09-29
- Change: `public-page-and-widget`
- Branch: `feature/public-page-and-widget`
- Agent: deepseek-harness
- Commit verified against: `5d0cd13` (step 1: the green base) for the red run
- Verdict: the unit tests of step 2.1 and the end-to-end tests of step 2.2 are red before any line of the
  implementation exists.

## 2.1 Red unit tests

### The command

```powershell
npm test
```

### The output (verbatim, the tail)

```text
 FAIL  tests/ask-client.test.ts [ tests/ask-client.test.ts ]
 FAIL  tests/chat.test.tsx [ tests/chat.test.tsx ]
 FAIL  tests/csp.test.ts [ tests/csp.test.ts ]
 FAIL  tests/i18n.test.ts [ tests/i18n.test.ts ]
 FAIL  tests/markdown.test.ts [ tests/markdown.test.ts ]
 FAIL  tests/public-page.test.tsx [ tests/public-page.test.tsx ]
 FAIL  tests/session.test.ts [ tests/session.test.ts ]
 Test Files  9 failed | 17 passed (26)
      Tests  191 passed (191)
 FAIL  tests/theme.test.ts [ tests/theme.test.ts ]
 FAIL  tests/widget.test.ts [ tests/widget.test.ts ]
```

and the reason of each failure, the one of the file that is quoted at length in the log:

```text
 FAIL  tests/theme.test.ts [ tests/theme.test.ts ]
Error: Failed to resolve import "@/lib/theme/primary" from "tests/theme.test.ts". Does the file exist?
  Plugin: vite:import-analysis
```

```text
 FAIL  tests/widget.test.ts [ tests/widget.test.ts ]
Error: Failed to resolve import "@/lib/i18n/public" from "tests/widget.test.ts". Does the file exist?
  Plugin: vite:import-analysis
```

Full log: `katalis-dev/tasks/_community-08-step2-unit-red.log`.

### Read

The 17 files of the base stay green with their 191 tests; the 9 files of this step are red because the module each one
demands does not exist yet, which is the definition of red here: the test is written, the code is not.

### What each file demands

| File | What it demands |
| --- | --- |
| `tests/markdown.test.ts` | `lib/markdown/parse.ts` (paragraphs, lists, bold, italic, code, links of `http` and `https` only, `[n]` as a citation) and `components/chat/Markdown.tsx`, against a corpus of 13 XSS entries: no `img`, no `script`, no event attribute and no hostile URL may reach the DOM, and no file writes HTML by hand |
| `tests/theme.test.ts` | `lib/theme/primary.ts`: the contrast of a color against the ink and the paper, lime as the fallback when the better of the two does not reach AA (4.5:1), and the ink or the paper as the text that sits on the fill |
| `tests/session.test.ts` | `lib/chat/session.ts`: one `crypto.randomUUID()` per tab under `cited-session`, kept between questions, new in a new tab, replaced when empty |
| `tests/widget.test.ts` | `lib/widget/script.ts` and the committed `public/widget.js`: byte for byte equal, under 5 KB, dependency-free, one floating button with an accessible name, an iframe of `/embed` from the origin of the script, `Escape` closes it, and the script is idempotent and speaks the language of the page |
| `tests/i18n.test.ts` | `lib/i18n/language.ts` (`cited-lang`, `resolveLang`), `lib/i18n/public.ts` (the welcome of the chosen language, falling back to the other when it is empty) and `components/i18n/LanguageSwitch.tsx`: `English | Español` in that order, `aria-pressed`, and the cookie `path=/`, `sameSite=lax`, one year, written before the reload |
| `tests/csp.test.ts` | `lib/headers/csp.ts`: `ALLOWED_ORIGINS` as origins and nothing else, `frame-ancestors 'self'` on `/` and `'self'` plus the allowed origins on `/embed`, a policy with the nonce of Next and no inline script, `unsafe-eval` in development only |
| `tests/ask-client.test.ts` | `lib/chat/client.ts`: the question with the `sessionId` of the tab to `/api/ask`, the answer, the refusal, and the message of the server when it fails |
| `tests/chat.test.tsx` | `components/chat/Chat.tsx`: the welcome, the labelled question box, the loading state in words, the answer as Markdown with its citation chip opening the excerpt, the document and the heading, the refusal style with no chip, one session per tab, and the message of a failure |
| `tests/public-page.test.tsx` | `app/page.tsx`, `app/embed/page.tsx` and `app/layout.tsx` against a mocked `lib/settings/business.ts`: one `main` with one `h1` (`Cited` when the business has no name), the question box, the welcome of the chosen language, the primary color of the business as a CSS variable with lime as fallback, the logo of the panel, the cookie over the language of the business, the browser in Spanish opening in English, and `lang` on the document |

### Commit

The commit of this step carries the nine test files: `e6b5b21`.
