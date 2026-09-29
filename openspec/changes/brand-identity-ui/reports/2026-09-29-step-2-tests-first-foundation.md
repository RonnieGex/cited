# Step 2, foundation: the unit tests first (task 2.1, the part of the foundation)

Implementer: Sonnet 5.5. Date: 2026-09-29. Paths are relative to the repository; `<worktree>` is the checkout of `community-ui`.

Commit of this report's subject: `21e7484` "Add the unit tests of the identity foundation: wordmark, citation mark, highlighter, kit tones and kit page".
The pre-commit hook (gitleaks) ran on it:

```
INF scanned ~18561 bytes (18.56 KB) in 198ms
INF no leaks found
```

## What the file covers: `tests/brand-foundation.test.tsx` (53 tests at this commit, 54 after the `state` test added with the implementation)

| Group | Tests |
|---|---|
| `highlightLast` | six or more words (last three), exactly six, fewer than six (all), one word, empty and blank text, explicit count, Spanish text with accents, `lead + tail` keeps the text |
| `Wordmark` | word and lime mark saying 1 with the mark `aria-hidden`, `span` without `href` and link named `Cited` with it, never a heading, sizes 20/36/56 px, defaults, tones (ink text on paper, paper text on ink, mark lime in both), `className` |
| `CitationMark`, `citationMarkClass` | static span with `data-brand="citation-mark"`, default 1, numbers and en dash, the measures of decision 3, rest (lime, ink) and open (ink, lime) states with the same measures, `hover:bg-[var(--primary)]` and the focus ring, a real button looks like the span |
| `Highlight`, `HighlightedTail` | `.hl` and `.hl .hl-sweep`, last three words, short text whole, empty text nothing |
| `Button` | `ghost` (transparent, `border-paper/40`, paper text), `sm` (`px-4 py-2` and `max-lg:min-h-11`), default size, `brand` keeps `bg-[var(--primary)]` and `text-[var(--on-primary)]`, `secondary` keeps `border-border`, focus ring and `type="button"` |
| `SectionTitle` | eyebrow is `text-ink-2`, no eyebrow renders no paragraph |
| `LanguageSwitch` | for each of the three tones: English first, `aria-pressed`, group name; paper look unchanged; ink (lime chosen, `text-paper/80` the other); brand (`text-current`); the prop `current` alone still works; 44 px on phones and the focus ring |
| Server components | none of the kit, brand or `lib/brand` files is a client module; the kit keeps `rounded-none`, `border-ink/10`, `border-border`, `focusRing` |
| Kit page | nine markers once each, one `h1`, the wordmark in two tones, marks and highlighter inside their sections, Spanish, the three device names and a reduced-motion note, no paragraph wider than 75ch |

The static half of task 2.1 is `tests/brand-static.test.ts` (previous report). The tests for the panel navigation, the split sign-in and
the ledger belong to the surface agents.

## Red, before any implementation

```
$ npx vitest run tests/brand-foundation.test.tsx tests/brand-static.test.ts          (<worktree>, at 21e7484)
 FAIL  tests/brand-foundation.test.tsx [ tests/brand-foundation.test.tsx ]
Error: Failed to resolve import "@/components/brand" from "tests/brand-foundation.test.tsx". Does the file exist?
     × exists and declares the keyframes mark-land, note-in, rise and bar
     × animates only transform, opacity and the size of the highlighter inside its keyframes
     × times every animation between 150 and 700 ms, the waiting bar excepted
     × sets animation to none, under prefers-reduced-motion, for every class that uses a keyframe
     × gives the highlighter its final background-size under reduced motion
     × adds --ink-2, --rule and the three durations in the same :root
     × exposes --ink-2 to Tailwind, so that text-ink-2 exists
     × imports ./brand.css from app/globals.css, after the tokens
     × ink-2 (secondary text) on white paper reaches 4.5:1
     × ink-2 (secondary text) on the surface #FAFAF9 reaches 4.5:1
     × has no colored side stripe (border-l-2, border-r-2 or wider used as an accent)
 Test Files  2 failed (2)
      Tests  11 failed | 13 passed (24)
```

The foundation file is red as a whole because the modules do not exist yet. Once the brand modules existed and before the kit
changes, the file showed the reds of the second stage (kept as evidence of the test-first order):

```
$ npx vitest run tests/brand-foundation.test.tsx                                    (after 69bd79b, before the kit changes)
     × adds a ghost variant for controls on ink: transparent, a paper 40% border and paper text
     × adds an sm size with px-4 py-2, and keeps 44 px of height on phones
     × paints the eyebrow with text-ink-2 and keeps the heading
     × paints the chosen language lime and the other paper on the ink tone
     × takes the color of its ground on the brand tone
     × keeps 44 px of height on phones for its buttons and the focus ring
     × renders the nine markers, each once, and one h1
     × shows the wordmark in both tones, the citation mark and the highlighter in their sections
     × is in Spanish, says what each device is for and carries a note on reduced motion
 Test Files  1 failed (1)
      Tests  9 failed | 44 passed (53)
```

The eleventh red of the static test (`has no colored side stripe`) is not in the foundation: it lists `components/chat/Chat.tsx` and
`components/chat/CitationPanel.tsx`, files of the public-page agent.
