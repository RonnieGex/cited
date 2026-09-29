# The design system of Cited

The brand of Katalis, as Construye uses it, in one place: the flame of the maker, the tokens, the font and the kit of
components. The change `brand-and-design-system` is what put it here, and
`openspec/changes/brand-and-design-system/specs/design-system/spec.md` is the contract it obeys. Cited carries its
own copy of the tokens today; when `@katalis/ui-tokens` v0.2.0 exists without a licensed font, this file moves to the
shared package and the values do not change.

The change `brand-identity-ui` added the identity of the product on top of it (section 5): the product tokens, the
citation mark and the highlighter, and the motion. `DESIGN.md` at the root of the repository records the whole visual
system in the format the design tools read, so every later screen starts from it.

Everything below is checked by a test: `tests/design-system.test.ts` for the files, the tokens and the font,
`tests/design-md.test.ts` for section 5 and for `DESIGN.md`, `tests/brand-static.test.ts` for the bans over the code,
and `e2e/design-system.spec.ts` and `e2e/brand.spec.ts` for the computed font, the contrast and the route `/kit`.

## 1. The flame of Katalis

The mark of the maker is the flame, the same image every Katalis product uses. It is copied byte for byte from the
`public/brand/` directory of the Construye web app (`finanzas-katalis/web/public/brand/`, read only) and it is never
drawn again: no other drawing of a Katalis logo exists in this repository.

### The three files of the flame

The silver flame of the maker, on a transparent ground, made for dark grounds.

| File | Size | SHA-256 |
|---|---|---|
| `public/brand/katalis-flame-64.png` | 64 × 64 | `621b0996414f3576a26d563407781d2b25b793eb19efacddf78b57a9ad0e2f2f` |
| `public/brand/katalis-flame-192.png` | 192 × 192 | `aa9d25df0342edcc60caa5c62cef0d519ffc6a07cbbe29e437fb45aec1fba2dd` |
| `public/brand/katalis-flame-512.png` | 512 × 512 | `eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54` |

The hash of each file is the hash of `katalis-logo-<size>.png` of the source directory. The first 16 hex characters of
each one are the ones recorded in `openspec/changes/brand-and-design-system/design.md`, decision 1.

### The ink variant

The flame is silver and it disappears on paper. On a light ground the same mark is used in the ink of the system:
`scripts/render-flame-variants.mjs` keeps the alpha of the 512 px original, recolors every pixel to `#171717` with the
shading of the original preserved as luminance, and resizes the result to 192 and 64 px. It is not a second drawing,
it is the same drawing respelled.

```
node scripts/render-flame-variants.mjs
```

| File | Size | SHA-256 |
|---|---|---|
| `public/brand/katalis-flame-ink-64.png` | 64 × 64 | `b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458` |
| `public/brand/katalis-flame-ink-192.png` | 192 × 192 | `0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae` |

`public/brand/flame-variants.json` is the record the script writes: the source file and its hash, the color, every
operation and the hash of each output. Running the script twice writes the same bytes.

### Where the flame appears

| Place | File | How |
|---|---|---|
| The foot of `README.md` and `README.es.md` | `katalis-flame-192.png` for the dark theme, `katalis-flame-ink-192.png` for the light one | a `<picture>` 48 px high, beside `Built by Katalis` |
| The banner of the README, both themes | `katalis-flame-192.png` on the ink, `katalis-flame-ink-192.png` on the paper | drawn by `scripts/render-readme-banner.mjs`, 48 px high, beside the `by Katalis` line and to its left |
| The social preview | `katalis-flame-192.png` | drawn by `scripts/render-readme-graphics.mjs`, 68 px high, beside the `by Katalis` line and to its left |

The two scripts measure what they draw and fail instead of shipping a banner whose mark is missing or misplaced: the
flame has to be to the left of `by Katalis`, centred on it, and it fails below the height the mark needs to be read
(40 px in the banner and 64 px in the social preview). At the height of the `by Katalis` line the mark measured 19 px in
the banner and 20 px in the preview, and Fable saw in the banner that it did not read as the flame of Katalis. The
height lives in the style sheet of each render, 48 px in `scripts/readme-banner.html` and 68 px in the styles of
`scripts/render-readme-graphics.mjs`, and `docs/images/readme-banner.json` and `docs/images/readme-graphics.json`
record what the render measured, the box of the flame and the line it sits beside, so a test measures the committed
PNG against its record and the record against the style sheet.

## 2. The tokens

`app/tokens.css` declares the tokens of the system once and `app/globals.css` imports it right after Tailwind. The
`@theme` block exposes them to Tailwind v4 as colors (`bg-ink`, `text-paper`, `outline-lime`), as the square corner
(`rounded-none`) and as the single curve of the system (`ease-out-expo`), and it declares the family of the app.

The values are the ones of Construye, read from its `app/globals.css`. This table is the record the test compares
against, cell by cell:

| Token | Value in Cited | Where it is in Construye | Value there |
|---|---|---|---|
| `--ink` | `#171717` | `--foreground` and `--primary` of `:root` | `#171717` |
| `--lime` | `#DDF469` | `--lime` of `:root` | `#DDF469` |
| `--coral` | `#FF6059` | `--coral` of `:root` | `#FF6059` |
| `--surface` | `#FAFAF9` | `--panel` of `:root` | `#FAFAF9` |
| `--surface-dark` | `#1C1917` | `--color-surface-dark` of `@theme inline` | `#1C1917` |
| `--paper` | `#FFFFFF` | `--background` of `:root` | `#FFFFFF` |
| `--radius` | `0` | `--radius-xl`, `--radius-2xl` and `--radius-squircle` of `@theme inline` | `0px` |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | the transitions of `.hover-lift` and `.btn-primary` | `cubic-bezier(0.16, 1, 0.3, 1)` |

The names are Cited's own, because this repository carries its copy until `@katalis/ui-tokens` v0.2.0 exists without
a licensed font; the values are Construye's to the character. Two conventions of the reference travel with the values:
the corner radius is zero everywhere, and one curve covers every transition of the system.

### The hairline of the controls

The border of `Input` and of the secondary `Button` is not decoration: it is the visual information that identifies a
control, and WCAG 2.2 asks 3:1 of it (1.4.11, non-text contrast). The hairline of the reference, `--stroke:
rgba(0, 0, 0, 0.08)` of Construye, is 1.19:1 on paper and cannot carry a control, so the system declares its own,
derived from the two colours of Construye and with no colour of its own:

| Token | Value in Cited | Where it comes from | Value there |
|---|---|---|---|
| `--border` | `color-mix(in srgb, var(--ink) 50%, var(--paper))` | the ink of Construye at half on its paper, `#8B8B8B`: 3.41:1 on the paper and 3.26:1 on the warm surface, both over the 3:1 of the rule | no such token |

`Panel` keeps its `border-ink/10` and `Chip` its `border-ink/20`. The scenario of the delta exempts the border and the
fill of the panel, because the content of the panel does not depend on seeing its edge, and the `Chip` is the same
case: it is a label and not a control, its word carries it and its edge is as decorative as the hairline of the panel.

The focus indicator of the kit is the 2 px lime outline of decision 6 with the one pixel edge of ink that the design
pairs with it. Measured on the rendered `/kit` with the computed colours, the lime is 1.22:1 on the paper and the edge
is 17.93:1: the 3:1 the scenario asks is reached by the edge, which is what keeps the focus visible without giving up
the lime of the design. `e2e/design-system.spec.ts` measures both parts, so neither the outline nor the edge can
disappear without the test saying so.

## 3. Outfit

The family of the product is **Outfit**, the variable font of weights 100 to 900, under the SIL Open Font License. It
is served by the app from `public/fonts/outfit/`, with its license next to the files, and it is applied on `<html>`
so every text of every screen uses it (the defect of Construye, where the family sits on `body`, is not copied).

| File | Origin | SHA-256 |
|---|---|---|
| `public/fonts/outfit/outfit-latin.woff2` | `https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2` | `6c18d579fd87c3776be068b762cbc83fde3acb543d49eabd3ade842eb987e887` |
| `public/fonts/outfit/outfit-latin-ext.woff2` | `https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqQ4E.woff2` | `0f53d1c03b3918d744a843b5039001ee31695ca1e255e3914188df81beb461e9` |
| `public/fonts/outfit/OFL.txt` | `https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt` | `c676351bf8576b9aba743cd5eaa8c0e7ee0d51f805d720447b4df4ddb6a2e416` |

The two web fonts are the two subsets Google Fonts serves for the family, taken from its own host, and the stylesheet
that names them declares `font-family: 'Outfit'` with `font-weight: 100 900`. Both carry the same variable family, so
`font-weight` works from 100 to 900 without a second file. The license comes from the official Google Fonts
repository, where the family lives as `ofl/outfit/Outfit[wght].ttf` (110884 bytes, SHA-256
`fc7287273e66929776e2ba54f144fe699080bec29f61bf649d70d871468aeade`, typographic family `Outfit`, one axis
`wght 100 to 900`).

**No paid font enters the repository.** Lufga, the family of Construye, is not here: it is not redistributable, and
the family of this product is Outfit, which is OFL. `tests/design-system.test.ts` lists every font file of the
repository and fails on any of them that is not under `public/fonts/outfit` or that carries the name Lufga.

## 4. The kit

`components/ui/` carries five small components. They are server components: no state, no effect, no `"use client"`.
They take their colors, their corners and their curve from the tokens, so a change of the palette is a change of
`app/tokens.css` and nothing else.

| Component | What it is |
|---|---|
| `Button` | `variant="primary"` is the ink button, uppercase and bold, with the ink of the system on paper; `variant="secondary"` is the paper button with a hairline; `variant="brand"` takes the color of the business and `variant="ghost"` is for controls on ink; `size="sm"` is the compact size, and on a phone every size keeps 44 px |
| `Panel` | the warm paper surface of `--surface`, a one pixel hairline and no shadow at rest |
| `Input` | a full width field on paper, with the hairline of the system |
| `Chip` | a small label in microcaps, for the state of a capability |
| `SectionTitle` | the microcaps eyebrow over a level of heading, with the tracking of the system |

`focusRing`, in `components/ui/focus.ts`, is the focus of the kit: a 2 px lime outline with offset, as decision 6
asks, plus a one pixel edge of ink. Lime on paper is 1.22:1, so the outline alone would be invisible on the ground
most screens use; the edge is what keeps the focus visible without giving up the lime of the design.

The route `/kit` shows one example of each component, in Spanish, the language of the first market. It is the
reference anyone who forks the repository can open.

The eyebrow of `SectionTitle` uses the ink at 70% instead of the 40% of Construye: at 11 px, 40% of the ink on paper
is 2.5:1, below the 4.5:1 that level AA asks for, and the axe check of `/kit` would refuse it.

## 5. The product tokens and the two devices

The change `brand-identity-ui` (`openspec/changes/brand-identity-ui/design.md`, decisions 1 to 5) adds to the tokens of
Construye and never changes one of them. The five product tokens are declared in the same `:root` of `app/tokens.css`,
and `--ink-2` and `--rule` also reach Tailwind as `text-ink-2` and `border-rule`. They have no counterpart in
Construye, so their table has three cells and this record is what `tests/design-md.test.ts` compares with the
stylesheet:

| Token | Value in Cited | Where it is used |
|---|---|---|
| `--ink-2` | `#57534E` | secondary text: labels, table heads, captions. 7.63:1 on paper and 7.30:1 on the warm surface |
| `--rule` | `color-mix(in srgb, var(--ink) 12%, var(--paper))` | dividers and table lines, `#E3E3E3` on paper (1.28:1). Never the border of a control: that is `--border` |
| `--dur-fast` | `180ms` | the color change of a citation mark and of a navigation link |
| `--dur-base` | `320ms` | a citation mark landing and a source note opening |
| `--dur-slow` | `640ms` | the highlighter painting itself in |

The measured contrast of the roles, on their real grounds: ink on paper 17.93:1, ink on lime 14.70:1, paper on ink
17.93:1, `text-paper/80` on ink 11.74:1, `text-paper/70` 9.14:1 and `text-paper/60` 7.02:1 (the quiet numerals of the
navigation are text and reach 4.5:1). Lime on paper is 1.22:1, so lime is never text on paper and never carries a
meaning alone: the number, the word or the shape says it too.

### The citation mark

The first device: a lime square with the number of a source. `components/brand/CitationMark.tsx` draws it and
`citationMarkClass` gives the same look to the buttons of an answer and of the sources list, so a button and a span
are identical. The measures are in `em` of the mark, so it fits a sentence, the wordmark and the navigation:

| Measure | Value |
|---|---|
| Width | `min-width: 1.5em` |
| Height | `1.3em` |
| Padding | `0 0.3em` |
| Type | Outfit 700 at `0.72em` of its context, tabular numerals, `vertical-align: 0.1em` |
| Corners | square |
| Rest | lime ground, ink text (14.70:1) |
| Open or current | ink ground, lime number |
| On ink (`tone="ink"`) | a quiet outline with paper text at 60%; the open mark is ink with a lime number and a lime outline |

`Wordmark` is the word `Cited` in Outfit 800 with `letter-spacing: -0.04em`, followed by a mark that says 1, in three
sizes (20, 36 and 56 px) and two tones (ink text on paper, paper text on ink). It is the only logo of the product besides
the real flame of Katalis, and it is never a heading.

### The highlighter

The second device: lime painted behind the words that matter, in `app/brand.css`.

| Class | What it does |
|---|---|
| `.hl` | `linear-gradient(transparent 55%, var(--lime) 55%)`, no repeat, `background-size: 100% 100%`, `padding: 0 0.08em`, `box-decoration-break: clone` |
| `.hl-on-ink` | the variant for an ink ground: a solid lime block with ink text, because the half-height marker would put paper text over lime (1.1:1); used together with `.hl` |
| `.hl-sweep` | paints the highlighter in once, from `0% 100%` to `100% 100%`, in `--dur-slow` on `--ease-out-expo` |

`highlightLast(text, words)` of `lib/brand/highlight.ts` picks the words to paint: the last three when the text has six
or more words, all of them otherwise. The welcome headline and the tagline carry it, and the excerpt of an open citation
is painted whole.

### The motion

Every keyframe of the product lives in `app/brand.css` and animates only `transform`, `opacity` and the paint size of the
highlighter; at most two things move at once in any view.

| Class | Keyframe | What moves | Time |
|---|---|---|---|
| `.hl-sweep` | `hl-sweep` | the `background-size` of the highlighter | `--dur-slow` (640ms), once |
| `.mark-land` | `mark-land` | the marks of an answer that just arrived: `translateY(0.35em) scale(0.85)` and `opacity` to rest, staggered by `calc(var(--i) * 40ms)` | `--dur-base` (320ms) |
| `.note-in` | `note-in` | a source note that opens: `translateX(-8px)` and `opacity` to rest | `--dur-base` (320ms) |
| `.rise` | `rise` | the welcome headline: `translateY(12px)` and `opacity` to rest, once | 480ms |
| `.bar` | `bar` | the waiting bar: `scaleX` 0 to 1, alternating, from the left | 1.6s, infinite (the only animation over 700ms: it says "still working") |

The last block of the file is `@media (prefers-reduced-motion: reduce)`: every animation and every transition of the
product is removed (`animation: none`, `transition: none`) and the highlighter is painted in its final state at once.
`tests/brand-static.test.ts` reads the stylesheet for its keyframes and for that block, and `e2e/brand.spec.ts` checks
the computed result in a browser.
