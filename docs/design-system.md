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
| The banner of the README, both themes | `katalis-flame-192.png` on the ink, `katalis-flame-ink-192.png` on the paper | drawn by `scripts/render-readme-banner.mjs`, at the height of the `by Katalis` line and to its left |
| The social preview | `katalis-flame-192.png` | drawn by `scripts/render-readme-graphics.mjs`, at the height of the `by Katalis` line and to its left |
