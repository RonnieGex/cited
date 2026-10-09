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
| `docs/images/readme-banner.json` | the record: the wordmark, the citation mark, the tagline, the byline, the size, the flame it measured with its box, the font and the brand tokens |

```
node scripts/render-readme-banner.mjs
```

The script is the only writer of those three files. It renders in a headless Chromium from `@playwright/test`, so
`npx playwright install chromium` is needed once per machine.

**The font is Outfit, and it is a file of this repository.** `scripts/readme-graphics/font.mjs` builds the two
`@font-face` rules from `public/fonts/outfit/` and the script embeds them in the style sheet as data URIs, so the
render needs no network and no font host. The script then waits for `document.fonts.ready` and asks
`document.fonts.check('700 132px "Outfit"')`, and it throws when the family did not load, so a banner can never be
written in a fallback font by accident. Outfit is OFL: its origin, its two subsets and the hash of each file are in
`docs/design-system.md`, and no other family is a file of this repository.

The tagline of the record (`"Ask your own documents. Get the passage and where it came from."`) is the line under the
banner in both READMEs, and a test compares the two, so changing the tagline means changing the record and the two
READMEs together. It promises passages with their document, their heading and their position, which is what the code
returns today, and the answer with its numbered citations has been available since `pluggable-models-and-ask`.

## 2. The graphics

`scripts/render-readme-graphics.mjs` renders the eight graphics in **both themes** and the social preview, and writes
`docs/images/readme-graphics.json`.

```
node scripts/render-readme-graphics.mjs
```

To regenerate only the agent graphic and the status board:

```
npx -y -p node@24 node scripts/render-readme-graphics.mjs agents roadmap
```

A selective render updates only those PNGs and their entries in the record. It updates the roadmap rows when
`roadmap` is selected. It runs ingestion, search and ask and updates the README quick-start blocks only when
`demo` is selected, including a full render. Unknown graphic names fail before any output is written.

The agent graphic is a summary of the
[archived client verification](../openspec/changes/archive/2026-10-09-mcp-server/reports/2026-10-09-step-10-4-review-and-clients.md),
not a terminal capture. DeepSeek Harness searched and answered with a citation in a headless MCP run. Claude Code
and Codex connected and listed both tools; their tool calls were not verified. Cursor has documented configuration
and was not tested. The 380-peso result comes from `samples/cafe-la-horquilla.md`. A fresh curl check tests the
endpoint only and does not change these client labels.

`agents.html` uses local Outfit, flat ink `#171717` and paper `#FAFAF9`, lime `#DDF469` on the citation, thin rules
and square corners. The English graphic is shared by both READMEs; Spanish alt text and the adjacent table preserve
the same information without requiring the image.

What it does, in order:

1. it runs `npm run ingest -- samples/` and one `npm run search` with `EMBEDDINGS_PROVIDER=fake`, with no
   `DATABASE_URL` and no `TURSO_DATABASE_URL`, and keeps their real output;
2. it renders every template of `scripts/readme-graphics/` with Playwright in light and dark and optimizes each PNG
   with `sharp` when it is installed (`next` brings it);
3. it writes the record with the size, the headline and the copy each graphic draws, the state it shows, its `Next`
   label when it shows a planned capability, the bounds of the second art direction and the ones decision 11 amends
   (the terminal of the demo at 0.30 or less inside its own box, the roadmap 720 px high at most), the box of the
   terminal of the demo, the roadmap rows, the tagline, the font, the tokens and the demo;
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
| `agents-{dark,light}.png` | 1280 × 640 | verified client results, distinguishing a cited answer, tool discovery and untested configuration |
| `reason-sources-{dark,light}.png` | 400 × 300 | the first reason of `Why Cited`, with its benefit headline |
| `reason-citations-{dark,light}.png` | 400 × 300 | the second reason |
| `reason-voice-{dark,light}.png` | 400 × 300 | the third reason, with its benefit headline |
| `how-it-works-{dark,light}.png` | 1280 × 480 | the flow of an answer, written and out loud |
| `demo-{dark,light}.png` | 1280 × 560 | the real run of the quick start, with the first result in lime |
| `roadmap-{dark,light}.png` | 1280 × 720 | the status table as a board, `Next` on the planned column |
| `voice-teaser-{dark,light}.png` | 1280 × 360 | the voice: the real Orb of the panel (`docs/images/voice/orb.png`, captured by `scripts/render-readme-orb.mjs`), one click in the panel and ElevenLabs carries the voice |

| `social-preview.png` | 1280 × 640 | the preview of the repository: the name, the tagline and `by Katalis` with the flame of the maker to its left |

The roadmap uses thin rules and a wider available column to fit the added MCP server row within 720 px without
reducing any text below 16 px. Its reference labels use Outfit, keeping monospace inside terminal blocks.

One image of the README is not drawn by that script: the real capture of the public chat with an answer and its open
citation, written by

```
node scripts/render-readme-captures.mjs [http://127.0.0.1:3200]
```

The file is `docs/images/chat-page.png`. It comes from the application served by `npm run start` with the corpus of
`samples/` ingested and the deterministic providers. It has no dark variant, because the public chat is painted on the
paper of the brand and declares no dark scheme, so it is one file of the light canvases of the test instead of a themed
pair.

The foot of the two READMEs does not appear in that table because it is not a graphic of this script: it is the flame
of `public/brand/`, the mark every Katalis product uses, copied byte for byte from Construye and rendered in ink for
the light theme by `scripts/render-flame-variants.mjs`. `docs/design-system.md` carries its files, its hashes and the
command that renders the variant. The banner and the social preview draw the same flame beside their `by Katalis`
line, to its left and taller than it (48 px in the banner and 68 px in the social preview), and the render measures it
and fails when it is missing, misplaced or below the height the mark needs to be read (40 px and 64 px at the least).

The two variants of a graphic carry the same content: the dark one is ink with the lime glow and the light one is
off-white, both measured. In the light theme a lime mark carries an ink edge or an ink inner mark, because lime on
off-white is 1.07:1. **The terminal of the demo is dark in both themes**, as decision 11 asks: commands in lime and
output in off-white on the ink of the terminal, in the light variant too. A dark terminal has to stay under 19% of a
1280 × 560 canvas for the light variant to keep a mean luminance of 0.80, and the real run of the quick start does not
fit there, so `demo-light.png` is the one light canvas outside the canvas bound: the test measures it inside the
terminal area instead (0.30 or less, which the render prints and enforces), and `readme-graphics.json` records the box
of that terminal so the measurement cannot drift away from the image.

The templates share `scripts/readme-graphics/base.html` and the brand styles of the script, and they read the tokens
and the roadmap rows from `scripts/readme-graphics/data.mjs`. **That file is the single source of the status table**: a
capability that changes its state changes it there, and both the README and the graphic follow.

**A graphic never shows a planned capability as working.** Each entry of the record carries `shows` (`Available` or
`Planned`) and `label` (`Next` or none), the badge is drawn on the image itself, and a test compares the record with
the status table of the README row by row and state by state.

**A record never names a drawing of the Katalis logo.** The mark of the maker is the flame of `public/brand/` and
nothing else: `intendedLogo` and `inventedLogos` in `scripts/readme-graphics/honesty.mjs` read every text field of a
record before it is written, and `assertHonestRecord` throws when one of them names `katalis-logo`. The invented mark
of the first round, `docs/images/katalis-logo{,-dark}.png`, does not exist and cannot come back through a record.

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
| Files directly in `docs/images/` | 20 PNG and 2 JSON |
| Weight of those 20 PNGs | 814728 bytes |
| Unique local PNGs referenced by `README.md` | 24 files, 989631 bytes |
| Budget | 3 MB |

These counts were measured on 2026-10-09 after adding the agents graphic. When a graphic is added, keep it under the budget and prefer
flat colors and text: the palette of 256 colors of `sharp` is what keeps the set small while the lime glow and the orb
keep their gradients. The PNG of a graphic is also measured against the luminance bounds of decision 10 (0.30 or less for a dark variant and
for the social preview, 0.80 or more for every light variant except `demo-light.png`, whose dark terminal is measured
inside its own area), and the roadmap is 1280 px wide and 720 px high at most, which the render enforces, so a graphic
that forgets to paint its theme or a roadmap that grows past the limit fails the test even if it is small.
