# README assets

How the images of the README are made, where the badges come from and what they weigh. It is written for whoever has
to change a word of the banner or add a graphic, and it is the document the `project-readme` specification points at.

## 1. The banner

`scripts/render-readme-banner.mjs` renders `scripts/readme-banner.html` twice with Playwright at **1280 × 320** and
writes three files:

| File | What it is |
|---|---|
| `docs/images/readme-banner-dark.png` | the dark variant, ink `#171717` background and off-white text |
| `docs/images/readme-banner-light.png` | the light variant, off-white `#F7F6F2` background and ink text |
| `docs/images/readme-banner.json` | the record: the wordmark, the citation mark, the tagline, the byline, the size, the font and the brand tokens |

```
node scripts/render-readme-banner.mjs
```

The script is the only writer of those three files. It renders in a headless Chromium from `@playwright/test`, so
`npx playwright install chromium` is needed once per machine.

**The font is Outfit, and it is not a file of this repository.** The template links the Google Fonts stylesheet of
Outfit and the script waits for `document.fonts.ready`; it then asks `document.fonts.check('700 132px "Outfit"')` and
throws when the family did not load, so a banner can never be written in a fallback font by accident. Rendering the
banner therefore needs network access to `fonts.googleapis.com` and `fonts.gstatic.com`. The repository ships no
`.woff`, `.woff2`, `.ttf` or `.otf`, and the test asserts it: Outfit is OFL and the design system change is the one
that will vendor it with its license.

The tagline of the record (`"Answers from your own documents, with the page they came from."`) is the line under the
banner in both READMEs, and a test compares the two, so changing the tagline means changing the record and the two
READMEs together.

## 2. The graphics

`scripts/render-readme-graphics.mjs` renders the nine graphics in **both themes** and writes
`docs/images/readme-graphics.json`.

```
node scripts/render-readme-graphics.mjs
```

What it does, in order:

1. it runs `npm run ingest -- samples/` and one `npm run search` with `EMBEDDINGS_PROVIDER=fake`, with no
   `DATABASE_URL` and no `TURSO_DATABASE_URL`, and keeps their real output;
2. it renders every template of `scripts/readme-graphics/` with Playwright in light and dark and optimizes each PNG
   with `sharp` when it is installed (`next` brings it);
3. it writes the record with the size, the state each graphic shows, its `Next` label when it shows a planned
   capability, the roadmap rows, the tagline, the font, the tokens and the demo;
4. it patches the two output blocks of the quick start in `README.md` and `README.es.md` with what the commands
   printed, so the README cannot show a result the code does not produce.

| Graphic | Size | What it shows |
|---|---|---|
| `reason-sources-{dark,light}.png` | 400 × 300 | the first reason of `Why Cited` |
| `reason-citations-{dark,light}.png` | 400 × 300 | the second reason |
| `reason-voice-{dark,light}.png` | 400 × 300 | the third reason, with `Next` |
| `how-it-works-{dark,light}.png` | 1280 × 480 | the flow, with `Next` on the planned part |
| `demo-{dark,light}.png` | 1280 × 560 | the real run of the quick start |
| `roadmap-{dark,light}.png` | 1280 × 440 | the status table as a board, `Next` on the planned column |
| `voice-teaser-{dark,light}.png` | 1280 × 360 | the voice teaser, with `Next` |
| `social-preview.png` | 1280 × 640 | the preview of the repository: the name, the tagline and `by Katalis` |
| `katalis-logo{,-dark}.png` | 320 × 64 | the logo of the maker, at the foot of the README |

The templates share `scripts/readme-graphics/base.html` and the brand styles of the script, and they read the tokens
and the roadmap rows from `scripts/readme-graphics/data.mjs`. **That file is the single source of the status table**: a
capability that changes its state changes it there, and both the README and the graphic follow.

**A graphic never shows a planned capability as working.** Each entry of the record carries `shows` (`Available` or
`Planned`) and `label` (`Next` or none), the badge is drawn on the image itself, and a test compares the record with
the status table of the README row by row and state by state.

The script deletes nothing and touches no other file. The store it creates lives in `.data/katalis.sqlite`, which
`.gitignore` excludes; it is left in place, and removing it is a `Remove-Item -Recurse -Force .data`.

## 3. The badges

The seven badges of the README, with their host:

| Badge | Host | Notes |
|---|---|---|
| License Apache-2.0 | `img.shields.io` | static badge |
| Node 24.15 or newer | `img.shields.io` | static badge |
| Next.js 16 | `img.shields.io` | static badge |
| TypeScript in strict mode | `img.shields.io` | static badge |
| libSQL as the store | `img.shields.io` | static badge |
| Status: early development | `img.shields.io` | static badge |
| Continuous integration | `github.com` | the workflow badge of `ci.yml` |

The static badges of shields.io are part of the repository's promise only as long as the line under them is true: the
Node badge repeats the floor of `engines`, the Next.js badge repeats the dependency, and the status badge repeats the
sentence that says the product is in early development.

**None of the badges carries a query parameter**, so no reader is tracked, and a test asserts it. The only allowed
hosts are `https://img.shields.io/` and the workflow badge of this repository on `github.com`.

### The CI badge while the repository is private

The workflow badge does **not** render for an anonymous reader while the repository is private:

```
> curl.exe -sI https://github.com/RonnieGex/cited/actions/workflows/ci.yml/badge.svg
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
```

A reader with access to the repository sees it; anyone else sees the alt text of the image. It starts rendering for
everyone the moment the repository becomes public. This is a known trade-off of the launch, recorded in
`openspec/changes/cited-identity-and-readme/design.md`, and it is not a broken badge.

## 4. The size budget

The images of the README weigh **3 MB or less together**, and a test fails above it.

| | |
|---|---|
| Files in `docs/images/` | 21 |
| Weight of the whole directory | 0.445 MB |
| Weight of the images the README uses | about 0.44 MB |
| Budget | 3 MB |

The banner is the heaviest single file at about 100 KB. When a graphic is added, keep it under the budget and prefer
flat colors and text: the palette of 128 colors of `sharp` is what keeps the set small.
