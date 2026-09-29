# Step 3 - Implementation in small steps

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commits verified against: `1c8bd38`, `35db337`, `7deca73`, `db41db3`, `eaaf2c7` and `75fc009`, all on
  `feature/cited-identity-and-readme`
- Reports of tasks 3.1, 3.2, 3.3 and 3.4.

## 3.1 Identity: the name Cited

Commit `1c8bd38` ("name the product Cited in the repository") and commit `35db337` ("name Cited on the page and in its
tests").

```
> git show --stat --oneline 1c8bd38
1c8bd38 feat(cited-identity-and-readme): name the product Cited in the repository
 .env.example                                |  2 +-
 CONTRIBUTING.md                             |  2 +-
 LOOP_STATE.md                               |  2 +-
 NOTICE                                      |  2 +-
 SECURITY.md                                 |  2 +-
 ai-specs/README.md                          |  2 +-
 ai-specs/agents/backend-developer.md        |  2 +-
 ai-specs/agents/frontend-developer.md       |  2 +-
 ai-specs/agents/product-strategy-analyst.md |  2 +-
 docs/backend-standards.md                   |  2 +-
 docs/base-standards.md                      |  2 +-
 docs/development-guide.md                   |  2 +-
 docs/frontend-standards.md                  |  2 +-
 docs/search.md                              |  2 +-
 docs/security.md                            |  2 +-
 openspec/config.yaml                        |  2 +-
 openspec/specs/app-skeleton/spec.md         |  4 +-
 package-lock.json                           |  4 +-
 package.json                                |  4 +-
 samples/README.txt                          |  2 +-
 21 files changed, 48 insertions(+), 60 deletions(-)

> git show --stat --oneline 35db337
35db337 feat(cited-identity-and-readme): name Cited on the page and in its tests
 app/layout.tsx      | 4 ++--
 app/page.tsx        | 2 +-
 e2e/home.spec.ts    | 2 +-
 tests/home.test.tsx | 2 +-
 4 files changed, 5 insertions(+), 5 deletions(-)
```

What the identity is now:

| Place | Before | After |
|---|---|---|
| `package.json` `name` | `katalis-responde-community` | `cited` |
| `package.json` `description` | Free and forkable edition of Katalis Responde | Cited, by Katalis: a business answers with its own documents |
| `package-lock.json` `name` (two places) | `katalis-responde-community` | `cited` |
| `NOTICE` first line | Katalis Responde Community | Cited |
| `app/layout.tsx` `title` | Katalis Responde Community | Cited |
| `app/layout.tsx` `description` | Free and forkable edition of Katalis Responde | Cited, by Katalis: answers from your own documents, with the page they came from |
| `app/page.tsx` heading | Katalis Responde Community | Cited |
| `openspec/specs/app-skeleton/spec.md` | the requirement "Home page" names the old product | it names `Cited`, as the MODIFIED requirement of this change says |
| `.env.example`, `CONTRIBUTING.md`, `SECURITY.md`, `LOOP_STATE.md`, `ai-specs/`, `docs/`, `openspec/config.yaml`, `samples/README.txt` | the old product | Cited |
| `tests/home.test.tsx`, `e2e/home.spec.ts` | the assertion of the old name | the assertion of `Cited` |

The proof that the former name is gone from every tracked file outside `openspec/changes/archive/` is a test, not a
grep, and it passes:

```
> npx vitest run tests/readme.test.ts -t "former name"
 ✓ tests/readme.test.ts > the product is named Cited > carries the former name in no tracked file outside the archived changes

 Test Files  1 passed (1)
      Tests  1 passed | 28 skipped (29)
```

The change contract itself (`openspec/changes/cited-identity-and-readme/`) is exempt because its text has to name what
it renames, and the archived changes are history that this change does not rewrite. `SECURITY.md` now points at the
future URL `https://github.com/RonnieGex/cited/security/advisories/new`: the rename of the repository is task 10.1,
which is Fable's, and until it happens the old URL keeps redirecting.

## 3.2 The banner script and the two banners

Commit `7deca73` ("render the banner of Cited in two themes").

Files: `scripts/render-readme-banner.mjs`, `scripts/readme-banner.html`, `docs/images/readme-banner-dark.png`,
`docs/images/readme-banner-light.png`, `docs/images/readme-banner.json`.

```
> node scripts/render-readme-banner.mjs
rendered docs/images/readme-banner-dark.png
rendered docs/images/readme-banner-light.png
wrote docs/images/readme-banner.json

> git show --stat --oneline 7deca73
7deca73 feat(cited-identity-and-readme): render the banner of Cited in two themes
 docs/images/readme-banner-dark.png  | Bin 0 -> 100498 bytes
 docs/images/readme-banner-light.png | Bin 0 -> 92180 bytes
 docs/images/readme-banner.json      |  19 +++++++++
 scripts/readme-banner.html          | 106 +++++++++++++++++++++++++++++++++++
 scripts/render-readme-banner.mjs    | 121 +++++++++++++++++++++++++++++++++
```

The banner is 1280 by 320 in both variants, the wordmark is `Cited` in Outfit with the citation mark `[1]` in lime, the
tagline is the line that `README.md` repeats under the banner, and the script refuses to write a PNG when Outfit did
not load:

```js
const loaded = await page.evaluate(() => document.fonts.check('700 132px "Outfit"'));

if (!loaded) {
  throw new Error(
    "The Outfit font did not load: a banner rendered without it is not the brand of the README.",
  );
}
```

The record `docs/images/readme-banner.json` carries the texts, the two files, the background of each variant, the ink
outline of the lime mark in the light variant, the font and the brand tokens:

```json
{
  "wordmark": "Cited",
  "mark": "[1]",
  "tagline": "Answers from your own documents, with the page they came from.",
  "byline": "by Katalis",
  "width": 1280,
  "height": 320,
  "dark": "docs/images/readme-banner-dark.png",
  "light": "docs/images/readme-banner-light.png",
  "darkBackground": "#171717",
  "lightBackground": "#F7F6F2",
  "lightMarkOutline": "#171717",
  "font": {
    "name": "Outfit",
    "source": "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap",
    "loadedAtRenderTime": true,
    "fileInRepository": false
  },
  "tokens": { "ink": "#171717", "lime": "#DDF469", "offWhite": "#F7F6F2" }
}
```

**No font file enters the repository.** The template links the Google Fonts stylesheet, the script waits for
`document.fonts.ready` and asserts the family loaded, and the test proves there is no `.woff`, `.woff2`, `.ttf` or
`.otf` in the tracked files.

## 3.3 The graphics, the demo and the social preview

Commit `db41db3` ("draw every graphic of the README in two themes").

Files: `scripts/render-readme-graphics.mjs`, the templates `scripts/readme-graphics/{data,manifest,quickstart}.mjs`
and `scripts/readme-graphics/{base,logo,reason-sources,reason-citations,reason-voice,how-it-works,demo,roadmap,voice-teaser,social}.html`,
the fourteen PNGs in both themes, `docs/images/social-preview.png`, `docs/images/katalis-logo.png`,
`docs/images/katalis-logo-dark.png` and `docs/images/readme-graphics.json`.

```
> node scripts/render-readme-graphics.mjs
rendered docs/images/reason-sources-dark.png (8215 bytes)
rendered docs/images/reason-sources-light.png (8199 bytes)
rendered docs/images/reason-citations-dark.png (8227 bytes)
rendered docs/images/reason-citations-light.png (8163 bytes)
rendered docs/images/reason-voice-dark.png (9396 bytes)
rendered docs/images/reason-voice-light.png (9367 bytes)
rendered docs/images/how-it-works-dark.png (18473 bytes)
rendered docs/images/how-it-works-light.png (18629 bytes)
rendered docs/images/demo-dark.png (35471 bytes)
rendered docs/images/demo-light.png (36134 bytes)
rendered docs/images/roadmap-dark.png (30918 bytes)
rendered docs/images/roadmap-light.png (31202 bytes)
rendered docs/images/voice-teaser-dark.png (13638 bytes)
rendered docs/images/voice-teaser-light.png (13611 bytes)
rendered docs/images/social-preview.png (9016 bytes)
rendered docs/images/katalis-logo.png (2298 bytes)
rendered docs/images/katalis-logo-dark.png (2077 bytes)
wrote docs/images/readme-graphics.json
updated the quick start of README.md
updated the quick start of README.es.md
the store of the run lives in .data/katalis.sqlite, which git ignores
```

| Graphic | Size | State it shows | Label |
|---|---|---|---|
| `reason-sources` | 400 × 300 | Available | none |
| `reason-citations` | 400 × 300 | Available | none |
| `reason-voice` | 400 × 300 | Planned | `Next` |
| `how-it-works` | 1280 × 480 | Planned | `Next` |
| `demo` | 1280 × 560 | Available | none |
| `roadmap` | 1280 × 440 | Planned | `Next` |
| `voice-teaser` | 1280 × 360 | Planned | `Next` |
| `social-preview` | 1280 × 640 | the name, the tagline and the byline | none |
| `katalis-logo` | 320 × 64 | the logo of the maker, light and dark | none |

**The demo is the real output of the quick start.** The script runs the two commands itself, with
`EMBEDDINGS_PROVIDER=fake`, no `DATABASE_URL` and no `TURSO_DATABASE_URL`, and draws what they printed:

```
> node -e "const r=require('./docs/images/readme-graphics.json'); console.log(r.demo.ingest.output); console.log(r.demo.search.output)"

ingested README.txt (txt, no pages, 1 passages)
ingested bike-workshop-policies.md (md, no pages, 5 passages)
ingested cafe-la-horquilla.md (md, no pages, 4 passages)
ingested notas-del-negocio.txt (txt, no pages, 1 passages)
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 26 ms, rss 113 MB

question: ¿Cuánto cuesta una afinación de bicicleta?
store: .data/katalis.sqlite
1. cafe-la-horquilla.md [Precios] position 2 score 0.032522
   ...
8 results, 6 ms, rss 78 MB
```

The same run patches the two code blocks of the quick start in `README.md` and `README.es.md`
(`scripts/readme-graphics/quickstart.mjs`), so the demo graphic, the record and the README cannot drift: the test
asserts that every line drawn in the graphic is in the quick start of the README.

**The roadmap is generated from the status rows.** `scripts/readme-graphics/data.mjs` is the single list: the script
draws the graphic from it, and the test compares the record of the graphic with the status table of `README.md` row by
row and state by state.

**Planned is visible in the picture.** Every graphic that shows a planned capability carries the `Next` badge drawn on
it, and the record says which ones:

```json
"states": { "Available": "Available", "Planned": "Next" }
```

The graphics use the brand tokens of the design: ink `#171717` for the dark background, off-white `#F7F6F2` for the
light one, lime `#DDF469` for the mark and the accents, and Outfit loaded from Google Fonts at render time.

**The whole set weighs 456 KB**, under the budget of 3 MB of the spec:

```
> Get-ChildItem docs/images -File | Measure-Object -Property Length -Sum
Count: 21   Sum: 466547 bytes (0.445 MB)
```

## 3.4 The README and its Spanish twin

Commit `eaaf2c7` ("write the README of Cited and its Spanish twin").

`README.md` is 221 lines and `README.es.md` is its translation, with the same number of level-two sections in the same
order, the same ten code fences, the same variables and the same state in every status row. The copy rules of decision
7 are held by the test: no em dash in the prose, no emoji in a heading, and no superlative without a measured number.

The head: the banner as the `<h1>`, the tagline underneath, seven badges (license, Node, Next.js, TypeScript, libSQL,
status, CI), the language switch, and the sentence that says Cited is in early development and not ready for
production. The body follows decisions 4 to 8: three reason cards, the status table of ten rows, the flow graphic plus
its Mermaid version inside `<details>`, the demo, the roadmap, the voice teaser, the quick start, the configuration
table of eighteen rows, security, contributing and the license with the foot of Katalis.

The `.env.example` gained `EMBEDDINGS_MODEL=`, the variable two code paths already read
(`lib/embeddings/providers.ts`) and the configuration table names. The template still carries no value for any
variable.

## Two defects of this execution, and how they were closed

1. **The first pass of the identity rename mangled the files.** A PowerShell loop over a table of replacements
   flattened the pairs and replaced single characters across nineteen files. The damage was caught by reading the diff
   before committing, the files were restored with `git checkout --` and the rename was redone with a script file that
   uses typed objects, checks that every old string is present and rewrites the file only then. The commits carry the
   clean diff. Nothing mangled reached a commit.
2. **Two report files of steps 1 and 2 carried a local path**, which the pre-existing `tests/personal-paths.test.ts`
   caught: `offenders(repositoryRoot, homePath)` listed them. The paths were replaced by `<repository root>` and by a
   relative `.data\katalis.sqlite`, and the suite is green again. The rule of the repository was enforced by the
   repository itself.

## Verdict

PASS. The four tasks are implemented in small commits, the identity is `Cited` in every tracked file outside the
archived changes, the banner and the nine graphics are reproducible by the two committed scripts in both themes, the
demo is the real output of the quick start, and the README and its twin satisfy the twenty-nine cases of the contract
test.
