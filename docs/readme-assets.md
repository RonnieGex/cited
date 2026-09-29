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

The tagline of the record (`"Ask your own documents. Get the passage and where it came from."`) is the line under the
banner in both READMEs, and a test compares the two, so changing the tagline means changing the record and the two
READMEs together. It promises passages with their document, their heading and their position, which is what the code
returns today: the answer with its numbered citations belongs to `pluggable-models-and-ask` and only appears in the
README carrying a `Next` tag.

## 2. The graphics

`scripts/render-readme-graphics.mjs` renders the seven graphics in **both themes**, the social preview and the two
Katalis marks, and writes `docs/images/readme-graphics.json`.

```
node scripts/render-readme-graphics.mjs
```

What it does, in order:

1. it runs `npm run ingest -- samples/` and one `npm run search` with `EMBEDDINGS_PROVIDER=fake`, with no
   `DATABASE_URL` and no `TURSO_DATABASE_URL`, and keeps their real output;
2. it renders every template of `scripts/readme-graphics/` with Playwright in light and dark and optimizes each PNG
   with `sharp` when it is installed (`next` brings it);
3. it writes the record with the size, the headline and the copy each graphic draws, the state it shows, its `Next`
   label when it shows a planned capability, the bounds of the second art direction, the roadmap rows, the tagline,
   the font, the tokens and the demo;
4. it patches the two output blocks of the quick start in `README.md` and `README.es.md` with what the commands
   printed, so the README cannot show a result the code does not produce. The block is found by the script it runs, so
   running the renderer twice is safe.

**The render measures what it draws and fails instead of shipping a graphic that breaks the art direction** (design
decision 10): the smallest text at 16 px or more, every headline at weight 700 with 44 px on the 1280 px graphics and
30 px on the cards, every text-on-surface pair of both themes at 4.5:1 or more, the longest band of empty background
against a content-free render of the same page at a quarter of the height or less, the illustration of a card at 40%
of it or more, and no element outside the canvas. A template with an unfilled `{{PLACEHOLDER}}` also fails: that is how
five dark variants once came out painted white.

| Graphic | Size | What it shows |
|---|---|---|
| `reason-sources-{dark,light}.png` | 400 × 300 | the first reason of `Why Cited`, with its benefit headline |
| `reason-citations-{dark,light}.png` | 400 × 300 | the second reason |
| `reason-voice-{dark,light}.png` | 400 × 300 | the third reason, with `Next` |
| `how-it-works-{dark,light}.png` | 1280 × 480 | the flow, with `Next` only on the answer and its two branches |
| `demo-{dark,light}.png` | 1280 × 560 | the real run of the quick start, with the first result in lime |
| `roadmap-{dark,light}.png` | 1280 × 700 | the status table as a board, `Next` on the planned column |
| `voice-teaser-{dark,light}.png` | 1280 × 360 | the voice teaser, with `Next · ElevenLabs` |
| `social-preview.png` | 1280 × 640 | the preview of the repository: the name, the tagline and `by Katalis` |
| `katalis-logo{,-dark}.png` | 340 × 64 | the transparent mark of the maker, at the foot of the README |

The two variants of a graphic carry the same content: the dark one is ink with the lime glow and the light one is
off-white, both measured. In the light theme a lime mark carries an ink edge or an ink inner mark, because lime on
off-white is 1.07:1. The one place where the light variant does not follow the dark one is the terminal of the demo,
which is dark on ink and paper on off-white: a dark terminal would have to stay under 19% of the canvas to keep the
light variant at 0.80 or more of mean luminance, and the real run of the quick start does not fit there.

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
| Files in `docs/images/` | 19 PNG and 2 JSON |
| Weight of the PNGs | 0.675 MB |
| Weight of the images the README uses | about 0.67 MB |
| Budget | 3 MB |

The banner is the heaviest single file at about 100 KB. When a graphic is added, keep it under the budget and prefer
flat colors and text: the palette of 256 colors of `sharp` is what keeps the set small while the lime glow and the orb
keep their gradients. The PNG of a graphic is also measured against the luminance bounds of decision 10 (0.30 or less
for a dark variant and for the social preview, 0.80 or more for a light variant), so a graphic that forgets to paint
its theme fails the test even if it is small.
