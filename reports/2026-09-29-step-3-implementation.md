# Step 3 · the implementation

Contract: `openspec/changes/brand-and-design-system/tasks.md`, tasks 3.1, 3.2 and 3.3. The three tasks share this
report, as the contract asks.
Agent: deepseek-harness. Date: 2026-09-29.

Every command runs in the worktree `katalis-dev/community-ui`, quoted below as the working directory `.`; no tracked
file carries the absolute path of the machine, because `tests/personal-paths.test.ts` refuses it.

## 3.1 The flame files and the ink variants with their script and record

### The copy, byte for byte

```
$ Copy-Item <source>/katalis-logo-<size>.png ./public/brand/katalis-flame-<size>.png      # 64, 192 and 512
$ Get-FileHash ./public/brand/katalis-flame-<size>.png -Algorithm SHA256

katalis-flame-192.png 27491 aa9d25df0342edcc60caa5c62cef0d519ffc6a07cbbe29e437fb45aec1fba2dd
katalis-flame-512.png 166575 eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54
katalis-flame-64.png  4893  621b0996414f3576a26d563407781d2b25b793eb19efacddf78b57a9ad0e2f2f

$ Get-FileHash <source>/katalis-logo-<size>.png -Algorithm SHA256
katalis-logo-64.png  621b0996414f3576a26d563407781d2b25b793eb19efacddf78b57a9ad0e2f2f
katalis-logo-192.png aa9d25df0342edcc60caa5c62cef0d519ffc6a07cbbe29e437fb45aec1fba2dd
katalis-logo-512.png eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54
```

The three hashes are, character for character, the ones decision 1 of the design records (`621b0996414f3576`,
`aa9d25df0342edcc`, `eb66069b2dc7a346` as their first 16 hex). The source directory was only read: nothing in it was
written, moved or deleted. `tests/design-system.test.ts` compares the bytes of both sides when the source is on the
machine, and the hash of every file with the one recorded in `docs/design-system.md` everywhere.

### The ink variant and its record

```
$ node scripts/render-flame-variants.mjs
rendered public/brand/katalis-flame-ink-192.png (10123 bytes, 0ca17c874233dac4)
rendered public/brand/katalis-flame-ink-64.png (2735 bytes, b3e035c4e282d804)
wrote public/brand/flame-variants.json
```

What the script does, in its own words (the record it writes):

```json
{
  "source": {
    "file": "public/brand/katalis-flame-512.png",
    "width": 512,
    "height": 512,
    "bytes": 166575,
    "sha256": "eb66069b2dc7a346a98dcee5ebbbcbfd0024880f5db0236225576d1572443c54"
  },
  "color": "#171717",
  "operations": [
    "keep the alpha of every pixel of the original",
    "recolor every pixel to the ink #171717 with the shading of the original preserved as luminance",
    "resize the recolored original to 192 and 64 px"
  ],
  "outputs": [
    { "file": "public/brand/katalis-flame-ink-192.png", "width": 192, "height": 192, "bytes": 10123,
      "sha256": "0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae" },
    { "file": "public/brand/katalis-flame-ink-64.png", "width": 64, "height": 64, "bytes": 2735,
      "sha256": "b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458" }
  ],
  "script": "scripts/render-flame-variants.mjs"
}
```

The script is deterministic: a second run writes the same bytes.

```
$ <hash the three files>; node scripts/render-flame-variants.mjs; <hash them again>

public/brand/katalis-flame-ink-64.png
  before b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458
  after  b3e035c4e282d804e213670840ac1e94d68be336aceb117eb8cc6cd6069f0458
  same   True
public/brand/katalis-flame-ink-192.png
  before 0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae
  after  0ca17c874233dac4acf304fd45083a2ce58119d8fbc29149a786cdda4f2460ae
  same   True
public/brand/flame-variants.json
  before cb192f031aea7a42e232cd379c914843b0c5ffd543e348cd7dc68250f196cd81
  after  cb192f031aea7a42e232cd379c914843b0c5ffd543e348cd7dc68250f196cd81
  same   True
```

`tests/design-system.test.ts` runs the script itself and asserts that the bytes do not move.

### What the two marks look like

The proof was rendered with `sharp`, at 160 px, the original on the left and the ink variant on the right, on the ink
of the system and on the paper:

| Capture | What it shows |
|---|---|
| `katalis-dev/tasks/capturas-community-04/flama-sobre-tinta.png` | the silver flame on `#171717`, which is what it was made for, and the ink variant, which disappears there |
| `katalis-dev/tasks/capturas-community-04/flama-sobre-papel.png` | the silver flame on `#F7F6F2`, which almost disappears, and the ink variant, which reads |

The two files are the evidence of the reason of decision 2: one mark, two grounds, and the variant keeps every facet
of the original.

### The measurement the test makes

```
64 px ink: 1692 opaque, 1692 neutral, 0 lighter than the ink, alpha error 2.25 of 255,
           tone error 0.41 of 23, 100.0% of the tone within 8
```

Every visible pixel of the variant is a neutral gray, none is lighter than the ink of the system, the alpha is the
alpha of the 512 px original through a box filter within 2.25 of 255, and the tone follows the luminance of the
original within 0.41 of 23.

### One bound of the test corrected while implementing

The first draft of `keeps the shading of the original in ink` required **every** opaque pixel to stay within 4 of the
ink. Four pixels of the 64 px file and one of the 192 px are brighter, because the Lanczos resize of an eight bit
image rings at the edge of the mark; the brightest is 63 of 255 at 192 px, on a pixel whose alpha is 4 of 255 and
which is therefore invisible. The bound is now 8 over the ink and it is measured on the pixels a reader sees
(`alpha >= 128`), which is what "the mark is ink and never a lighter drawing" means. The measurement is in the comment
of the test.

### The document

`docs/design-system.md` is new and carries the first section, the flame: the three files with their full hashes, the
ink variant with its hashes and the command that renders it, and the three places where the flame appears. The rest of
the document (the tokens, the font and the kit) arrives with 3.3 and 9.1. The document is written where the code needs
it, because the tests of the flame read the hashes from it and the suite has to be green before step 5.

## 3.2 The flame at the foot of the READMEs, in the banner and in the preview

### The invented logo is gone and the guard refuses it

`docs/images/katalis-logo.png`, `docs/images/katalis-logo-dark.png` and the template that drew them,
`scripts/readme-graphics/logo.html`, were deleted, and the `logo` entry left the manifest:

```
$ git rm -q scripts/readme-graphics/logo.html docs/images/katalis-logo.png docs/images/katalis-logo-dark.png
$ git show --stat 3765e9c
 19 files changed, 220 insertions(+), 68 deletions(-)
 delete mode 100644 docs/images/katalis-logo-dark.png
 delete mode 100644 docs/images/katalis-logo.png
 delete mode 100644 scripts/readme-graphics/logo.html
```

`scripts/readme-graphics/honesty.mjs` carries the rule now: `intendedLogo` is `/katalis[\s_-]*logo/i`,
`inventedLogos(record)` collects every string field of a record that names the invented drawing with its route, and
`assertHonestRecord` throws before the record is written. This is what it says when a record brings the drawing back:

```
$ node --input-type=module -e "const { assertHonestRecord } = await import('./scripts/readme-graphics/honesty.mjs'); assertHonestRecord({ logo: { file: 'docs/images/katalis-logo.png' } }, 'a record');"
Error: a record would record the invented Katalis logo; the mark of the maker is the flame of public/brand/:
logo.file: docs/images/katalis-logo.png
exit=1
```

### The foot of the two READMEs

```
$ git diff README.md
 <p align="center">
-  <picture><source media="(prefers-color-scheme: dark)" srcset="docs/images/katalis-logo-dark.png"><img src="docs/images/katalis-logo.png" alt="Katalis" height="64"></picture>
+  <picture><source media="(prefers-color-scheme: dark)" srcset="public/brand/katalis-flame-192.png"><img src="public/brand/katalis-flame-ink-192.png" alt="Katalis" height="48"></picture>
+  <a href="https://katalis.dev">Built by Katalis</a>
 </p>
-
-<p align="center"><a href="https://katalis.dev">Built by Katalis</a></p>
```

`README.es.md` carries the same foot. The two files differ from the previous commit in that foot and in nothing else
that this task owns: the rest of the diff is the quick start capture, which the renderer patches with what the two
commands printed.

### The banner and the social preview

Both templates take `{{FLAME}}`, the renderers fill it with the flame of `public/brand/` as a data URI, and the flame
sits at the height of the `by Katalis` line and to its left, as decision 3 asks. The render measures it and fails
instead of shipping a banner with the mark missing or misplaced:

```
$ node scripts/render-readme-banner.mjs
rendered docs/images/readme-banner-dark.png (the flame is 19.0 by 19.0px, the line 19px)
rendered docs/images/readme-banner-light.png (the flame is 19.0 by 19.0px, the line 19px)
wrote docs/images/readme-banner.json
```

```
$ node scripts/render-readme-graphics.mjs
social-preview (dark): the flame is 20.0 by 20.0px beside a line of 20px
rendered docs/images/social-preview.png (31916 bytes, smallest text 20px, 0 headlines, empty band 157px of 160px)
wrote docs/images/readme-graphics.json
updated the quick start of README.md
updated the quick start of README.es.md
exit=0
```

The rest of that run is the seven graphics in both themes with their contrast table, unchanged; it prints where every
one of them went. `docs/images/readme-banner.json` and `docs/images/readme-graphics.json` now carry the `flame` entry
that names the two files and the place of the mark.

`tests/design-system.test.ts` reads the foot of both READMEs, the two templates, the two renderers and both records,
and it passed after this task, except for the four tests of `tests/readme.test.ts` that still name the deleted logo and
that task 4.1 updates.

## 3.3 Tokens, Outfit and the kit with `/kit`

### The tokens

`app/tokens.css` declares the eight tokens of decision 4 in `:root` and exposes them to Tailwind v4 through
`@theme inline` as colors, as `--radius-none` and as `--ease-out-expo`, and `app/globals.css` imports the sheet right
after Tailwind. The values are Construye's, and the record of `docs/design-system.md` carries them next to the ones of
its `app/globals.css`, cell by cell, which is what the test compares.

### Outfit, downloaded from its own source and with its license

```
$ curl.exe -sS -L "https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJtEtq.woff2"   -o outfit-latin.woff2
$ curl.exe -sS -L "https://fonts.gstatic.com/s/outfit/v15/QGYvz_MVcBeNP4NJuktqQ4E.woff2" -o outfit-latin-ext.woff2
$ curl.exe -sS -L "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt" -o OFL.txt

OFL.txt                 4389  c676351bf8576b9aba743cd5eaa8c0e7ee0d51f805d720447b4df4ddb6a2e416
outfit-latin-ext.woff2 14808  0f53d1c03b3918d744a843b5039001ee31695ca1e255e3914188df81beb461e9
outfit-latin.woff2     32292  6c18d579fd87c3776be068b762cbc83fde3acb543d49eabd3ade842eb987e887
```

The stylesheet Google Fonts serves for the family declares `font-family: 'Outfit'` with `font-weight: 100 900` and
these two files, which is why the two subsets are the ones of the family and not a subset of our own invention. The
license comes from the official Google Fonts repository, and the name table of the variable source of that same
family was read to be sure of the family and of the range of weights rather than trusting the file name:

```
$ node <a probe of the name table> Outfit[wght].ttf
family (1): Outfit Thin
typographic family (16): Outfit
typographic subfamily (17): Thin
axes: wght 100 to 900, default 0.0039215087890625
bytes: 110884
```

`fc7287273e66929776e2ba54f144fe699080bec29f61bf649d70d871468aeade` is the hash of that source file. The three files
are committed under `public/fonts/outfit/`, with the license next to them, and `app/tokens.css` declares the two
`@font-face` rules with the ranges of each subset. Outfit reaches every text of the app because `font-sans` — which is
`"Outfit", system-ui, sans-serif` — is on `<html>` in `app/layout.tsx`.

No paid font is in the repository: Lufga is not here, and the test lists every font file that git tracks and fails on
any of them that is not under `public/fonts/outfit` or that carries that name.

### The kit and the route `/kit`

`components/ui/` carries `Button` (primary and secondary), `Panel`, `Input`, `Chip` and `SectionTitle`, all of them
server components with the tokens of the sheet and the square corner of the system, and `focus.ts` carries the focus
of the house: a 2 px lime outline with offset. `app/kit/page.tsx` shows one example of each component in Spanish, with
`lang="es"` on its main element, and it is the route `/kit` the end to end test asks for.

```
$ npm run typecheck
> next typegen && tsc --noEmit
✓ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npx vitest run tests/design-system.test.ts
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

### The graphics are rendered from the Outfit of the repository

The two renderers used to take the family from the Google Fonts stylesheet, which made the record of the banner say
`fileInRepository: false` while the repository now ships Outfit. `scripts/readme-graphics/font.mjs` builds the two
`@font-face` rules from `public/fonts/outfit/` and both renderers embed them as data URIs, so the graphics are
rendered offline from the same family the app serves and the record says `fileInRepository: true` with the path of the
subset and the path of the license.

The proof that the two are the same file: `docs/images/readme-banner-dark.png` and `readme-banner-light.png` were
rendered once from the network and once from the repository, and the second render left them byte for byte as the
first one had written them (they are not in the diff of `644dff3`).

Whoever wants to render the graphics needs no network and no Google Fonts:
`node scripts/render-readme-banner.mjs && node scripts/render-readme-graphics.mjs`.

## Commits of this task

- `ecc7b26` the flame, the script, the record, the document and the bound of the test (3.1).
- `f568b76` the redaction of the machine path in the reports of steps 1 and 2.
- `52fe1ed` the report of step 3 with 3.1 and its mark.
- `3765e9c` the flame at the foot, in the banner and in the preview, the invented logo removed and the guard (3.2).
- `265fd6b` the tokens, the Outfit files, the kit and the route `/kit` (3.3).
- `644dff3` the two renderers on the Outfit of the repository and the graphics rendered again (3.3).
