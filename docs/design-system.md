# The design system of Cited

The brand of Katalis, as Construye uses it, in one place: the flame of the maker, the tokens, the font and the kit of
components. The change `brand-and-design-system` is what put it here, and
`openspec/changes/brand-and-design-system/specs/design-system/spec.md` is the contract it obeys. Cited carries its
own copy of the tokens today; when `@katalis/ui-tokens` v0.2.0 exists without a licensed font, this file moves to the
shared package and the values do not change.

Everything below is checked by a test: `tests/design-system.test.ts` for the files, the tokens and the font, and
`e2e/design-system.spec.ts` for the computed font and the route `/kit`.

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
| `Button` | `variant="primary"` is the ink button, uppercase and bold, with the ink of the system on paper; `variant="secondary"` is the paper button with a hairline |
| `Panel` | the warm paper surface of `--surface`, a one pixel hairline and no shadow at rest |
| `Input` | a full width field on paper, with the hairline of the system |
| `Chip` | a small label in microcaps, for the state of a capability |
| `SectionTitle` | the microcaps eyebrow over a level of heading, with the tracking of the system |

`focusRing`, in `components/ui/focus.ts`, is the focus of the kit: a 2 px lime outline with offset, as decision 6
asks, plus a one pixel edge of ink. Lime on paper is 1.07:1, so the outline alone would be invisible on the ground
most screens use; the edge is what keeps the focus visible without giving up the lime of the design.

The route `/kit` shows one example of each component, in Spanish, the language of the first market. It is the
reference anyone who forks the repository can open.

The eyebrow of `SectionTitle` uses the ink at 70% instead of the 40% of Construye: at 11 px, 40% of the ink on paper
is 2.5:1, below the 4.5:1 that level AA asks for, and the axe check of `/kit` would refuse it.
