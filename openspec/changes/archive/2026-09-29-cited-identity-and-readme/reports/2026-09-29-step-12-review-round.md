# Step 12 - Review round

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Base: `main` at `5dec3af`; the branch was at `6400c01` when the round opened and at `95459db` when it closed
- Contract: section 12 of `tasks.md`, written by Fable after `katalis-dev/tasks/revision-community-03.md`
- Commits of the round: `e20fd8b` (the state file), `ee46955` (the tests first), `fa852e5` (the promise),
  `80b3865` (the Spanish twin), `9309607` (the dark terminal and the teaser), `58bc5ed` (the re-render),
  `95459db` (the report of 6.1)
- Every command of this report ran on Windows 11 with Node `v24.11.0`, with `EMBEDDINGS_PROVIDER=fake`, with no `.env`
  opened, with no call to a model provider and with no call to Turso

## 12.1 Tests first, and red (commit `ee46955`)

`tests/readme.test.ts` gained the two scenarios Fable wrote for `project-readme` (the twin is translated, only planned
text speaks of answers) and the measurements of the two graphics; `tests/png.ts` gained `meanLuminanceIn(image, box)`,
which is the mean relative luminance of the pixels inside a box of a decoded PNG, so the terminal area of the demo can
be measured where it is drawn.

```
> npx vitest run tests/readme.test.ts --reporter=verbose
 Test Files  1 failed (1)
      Tests  6 failed | 30 passed (36)
```

| Failing test | What it read |
|---|---|
| README, the promise of an answer > speaks of answers only in a line that carries Next | 23 lines with `answer`, `page`, `respuesta` or `página` and no `Next` |
| README, the Spanish twin > has the same sections in the same order, each one in its language | `# see-it-answer` in both files |
| README, the Spanish twin > is translated, not only mirrored | 11 English headings, 10 `Available`/`Planned`, 9 `yes` |
| README, its graphics > keeps the roadmap 1280 px wide and 720 px high at most | the record carried no limit (`undefined`) |
| README, its graphics > keeps the terminal of the demo dark in both themes | the record carried no terminal box |
| README, the art direction of its graphics > measures the terminal area of every exempt canvas | no box to measure |

The offenders of the promise test, the whole list the first red run printed:

```text
the tagline: Answers from your own documents, with the page they came from.
the social preview: Answers from your own documents, with the page they came from.
the headline of reason-citations: Every answer shows its page.
README.md: Answers from your own documents, with the page they came from.
README.md: invented page.
README.md: 2. **Every answer shows its page.** Document, heading and position travel with the text, so a reader
README.md: an answer came from instead of trusting a summary.
README.md: 3. **Talk to it.** Retrieval and search answer in text today; talking to the same documents with
README.md: ## See it answer
README.md: in once and drop it from the commands. The last command serves the page on
README.md: | ... | credentials of the chat providers, reserved for the change that drafts an answer and numbers its citations | no |
the alt of an image of README.md: Cited, by Katalis: answers from your own documents, with the page they came from
the alt of an image of README.md: Cited answers only from the documents of the business
the alt of an image of README.md: How Cited works: documents, passages, libSQL, Reciprocal Rank Fusion and the answer
README.es.md: Respuestas de tus propios documentos, con la página de donde salieron.
README.es.md: página inventada.
README.es.md: 2. **Cada respuesta muestra su página.** Documento, encabezado y posición viajan con el texto, así
README.es.md: abrir la página de donde salió una respuesta en lugar de confiar en un resumen.
README.es.md: ## See it answer
README.es.md: en una vez y quítalo de los comandos. El último comando sirve la página en
README.es.md: | ... | credenciales de los proveedores de chat, reservadas para el cambio que redacta una respuesta y numera sus citas | no |
the alt of an image of README.es.md: Cited, by Katalis: respuestas de tus propios documentos, con la página de donde salieron
the alt of an image of README.es.md: Cómo funciona Cited: documentos, pasajes, libSQL, Reciprocal Rank Fusion y la respuesta
```

The run is kept in `rendered/cited-readme/round-3-12.1-red.log` outside the repository.

## 12.2 Major 1: the promise is a passage with its source (commits `fa852e5` and `58bc5ed`)

Decision 2 fixes the tagline and decision 10 the headline of the second reason card. Both changed, in the two themes:

| Where | Before | Now |
|---|---|---|
| Tagline (banner, its record, the two READMEs) | `Answers from your own documents, with the page they came from.` | `Ask your own documents. Get the passage and where it came from.` |
| `reason-citations` card and its record | `Every answer shows its page.` | `Every passage keeps its source.` |
| Section and demo eyebrow | `See it answer` | `See it work` / `Míralo funcionar` |
| Reason 1 | `no invented page.` | `nothing invented.` |
| Reason 2 | an answer with a page to open | the passage with its document, its heading and its position |
| Reason 3 | `Retrieval and search answer in text today` | `Retrieval and search return passages in text today` |
| Configuration, chat credentials | `the change that drafts an answer and numbers its citations` | `pluggable-models-and-ask` |
| Quick start | `serves the page on` | `serves the app on` |
| Banner and reason alts | `answers from your own documents, with the page they came from`; `Cited answers only from` | the new tagline; `Cited reads only the documents you point it at` |
| `docs/readme-assets.md` | the old tagline quoted | the new one, with the reason: passages today, the answer with `Next` |

`app/layout.tsx` carried the same promise in its metadata description, so it changed with the rest. The banner, the
social preview, the second reason card and both records were re-rendered in the same round:

```
> node scripts/render-readme-banner.mjs
rendered docs/images/readme-banner-dark.png
rendered docs/images/readme-banner-light.png
wrote docs/images/readme-banner.json

> node scripts/render-readme-graphics.mjs
rendered docs/images/reason-citations-dark.png (19474 bytes, smallest text 17px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/reason-citations-light.png (10434 bytes, smallest text 17px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/social-preview.png (31893 bytes, smallest text 20px, 0 headlines, empty band 157px of 160px)
wrote docs/images/readme-graphics.json
updated the quick start of README.md
updated the quick start of README.es.md
```

The record of the banner and the tagline of `README.md` are the same string, which is the test of the scenario "The
banner is reproducible"; the answer with numbered citations appears only in the status table, in the roadmap and in
the nodes of the flow that carry `Next`.

## 12.3 Major 2: the twin is translated (commit `80b3865`)

| English | Spanish |
|---|---|
| Why Cited | Por qué Cited |
| Status | Estado |
| How it works | Cómo funciona |
| See it work | Míralo funcionar |
| Roadmap | Hoja de ruta |
| Voice | Voz |
| Quick start | Arranque rápido |
| Configuration | Configuración |
| Security | Seguridad |
| Contributing | Cómo contribuir |
| License | Licencia |

The four `Available` rows read `Disponible`, the six `Planned` rows read `Siguiente`, the nine `yes` read `sí` and the
anchor of the prologue is `#estado`. Code, commands, variable names, paths, and the names of the product and of the
changes stay as they are, which is what decision 11 asks. The test compares the two files section by section through
the translation table, so a heading that stays English fails instead of passing as it did before:

```
> npx vitest run tests/readme.test.ts --reporter=verbose
 ✓ README, the Spanish twin > has the same sections in the same order, each one in its language
 ✓ README, the Spanish twin > is translated, not only mirrored
 ✓ README, the Spanish twin > has the same code blocks
 ✓ README, the Spanish twin > has the same variables and the same status of every row
 ✓ README, the Spanish twin > links the two files at the head of each one
```

## 12.4 Major 3 and the teaser (commits `9309607` and `58bc5ed`)

The light theme draws the same ink terminal as the dark one, with the commands in lime and the output in off-white; the
title bar keeps a 5% off-white band, which is what the contrast rule allows over the ink of the terminal:

```
contrast of the light theme:
  6.76:1  the commands on the terminal
  7.24:1  the output on the terminal
  5.53:1  the title bar on the terminal
rendered docs/images/demo-dark.png (44729 bytes, smallest text 16px, 1 headlines, empty band 40px of 140px, terminal luminance 0.183)
rendered docs/images/demo-light.png (45940 bytes, smallest text 16px, 1 headlines, empty band 40px of 140px, terminal luminance 0.148)
```

The render now measures the mean luminance inside the terminal box of every graphic that has one and **fails above
0.3**, and it fails a roadmap taller than 720 px; both numbers and the box of the terminal of the demo travel in
`docs/images/readme-graphics.json`, so the test measures the same rectangle the renderer drew:

```
> npx vitest run tests/readme.test.ts --reporter=verbose
docs/images/demo-dark.png: the terminal is 55.4% of the canvas at 0.183
docs/images/demo-light.png: the terminal is 55.4% of the canvas at 0.148
demo-light.png: the terminal measures 0.148
```

The first render of this round found a real defect in the corrected contrast pair: the title bar was composited over
the page instead of over the terminal, and with the light terminal now ink, the pair fell to 4.48:1 in the light theme
and 4.06:1 in the dark one. The pair now composites the bar over the terminal, the band went from 0.09 to 0.05, and the
two themes read 5.53:1 and 4.64:1. The render fails below 4.5.

The voice teaser reads `Voice with ElevenLabs arrives in an upcoming release.`, the sentence of decision 11, instead of
a sentence about the graphic itself.

**The one measurement that cannot hold.** Decision 10 asks every light variant for a mean luminance of 0.80 or more and
decision 11 asks the terminal of `demo-light.png` to be dark. A dark terminal has to stay under 19% of a 1280 × 560
canvas for the first rule, and the real run of the quick start occupies 55.4%. `demo-light.png` measures 0.493, so the
test keeps it out of the light canvas list and measures it inside the terminal area, exactly where decision 11 puts the
rule. It is written down in `docs/readme-assets.md` and it is a RISK of this report: if Fable wants the canvas bound to
hold too, the demo graphic cannot show the real run of the quick start.

## 12.5 Minor: the report of 6.1 says what ran (commit `95459db`)

The report claimed the quick start ran "word for word" while it had replaced the clone with an export of the tree. It
now names the seven lines, says that lines 3 to 7 ran literally, and says that lines 1 and 2 did not, with the reason
and the substitute:

```
> git clone https://github.com/RonnieGex/cited.git /tmp/cited-public
Cloning into '/tmp/cited-public'...
fatal: could not read Username for 'https://github.com': No such device or address
CLONE_EXIT=128
```

The substitute is `git checkout-index --all --prefix=<directory>/` over the branch at the commit under test, mounted at
`/work` in a container that starts with no `.env` and no `.data/`. The section carries a new transcript of
2026-09-29 at commit `58bc5ed`, in `node:24` (Node `v24.21.0`, npm `11.19.0`), of the five commands that do not need
the public repository:

```
=== npm ci (line 3) ===
ci exit: 0
=== cp .env.example .env (line 4) ===
copied
=== line 5: EMBEDDINGS_PROVIDER=fake npm run ingest -- samples/ ===
documents 4, passages 11, skipped 0, store .data/katalis.sqlite, 134 ms, rss 121 MB
=== line 6: EMBEDDINGS_PROVIDER=fake npm run search -- "¿Cuánto cuesta una afinación de bicicleta?" ===
8 results, 13 ms, rss 96 MB
=== line 7: npm run dev ===
GET http://localhost:3000/ -> 200 after 10s
✓ Ready in 6.5s
=== the store of the run ===
-rw-r--r-- 1 root root 73728 Sep 29 07:34 katalis.sqlite
```

The eight results, their headings, their positions and their scores are the ones of the demo graphic and of both
READMEs. The verdict of the report no longer says "clean clone" either.

## 12.6 The captures and the battery

The nine captures of 7.1 were retaken through the public Markdown API, with no token, with the images pointed at the
local files:

```
> node capture-readme.mjs
rendered README.md through the Markdown API: 21164 chars of HTML
rendered README.es.md through the Markdown API: 21522 chars of HTML
captured readme-en at 1280 px in light
captured readme-en at 1280 px in dark
captured readme-en at 400 px in light
captured readme-en at 400 px in dark
captured readme-es at 1280 px in light
captured readme-es at 1280 px in dark
captured readme-es at 400 px in light
captured readme-es at 400 px in dark
captured the full page of README.md at 1280 in dark
9 captures in <output directory>
```

| Check | Result |
|---|---|
| `npm test` | 11 files, **108 tests passed**, exit 0 (103 before the round: five new tests) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, no warnings |
| `npm run secrets:scan` (gitleaks) | 106 commits, `no leaks found`, exit 0 |
| `npm run openspec:validate` (`--all --strict`) | 5 passed, 0 failed, exit 0 |
| `git diff --check main...HEAD` | exit 0 |
| Weight of `docs/images/` | 21 files, 714,046 bytes, 0.681 MiB, budget 3 MiB |
| `node scripts/render-readme-banner.mjs` | exit 0, two banners and the record |
| `node scripts/render-readme-graphics.mjs` | exit 0, 14 graphics in two themes, the social preview, the two marks and the record |
| `node capture-readme.mjs` | exit 0, 9 captures |
| The quick start in `node:24` | lines 3 to 7 literal, GET `/` 200 |

The luminance of every canvas after the round, as the test prints it:

```text
demo-dark.png luminance 0.169
demo-light.png luminance 0.493 (measured inside the terminal: 0.148)
how-it-works-dark.png luminance 0.151
how-it-works-light.png luminance 0.937
katalis-logo-dark.png luminance 0.899 transparent 0.793
katalis-logo.png luminance 0.788 transparent 0.791
readme-banner-dark.png luminance 0.161
readme-banner-light.png luminance 0.922
reason-citations-dark.png luminance 0.252
reason-citations-light.png luminance 0.908
reason-sources-dark.png luminance 0.243
reason-sources-light.png luminance 0.913
reason-voice-dark.png luminance 0.209
reason-voice-light.png luminance 0.948
roadmap-dark.png luminance 0.161
roadmap-light.png luminance 0.935
social-preview.png luminance 0.151
voice-teaser-dark.png luminance 0.161
voice-teaser-light.png luminance 0.920
```

## The five findings of `revision-community-03.md`

| Finding | State | Evidence |
|---|---|---|
| Major 1: a graphic and the text promised an answer with its page | Closed | New tagline, new second card, `See it work`, the promise test green; `fa852e5`, `58bc5ed` |
| Major 2: `README.es.md` was not the translation promised | Closed | Eleven Spanish headings, `Disponible`/`Siguiente`, `sí`/`no`, the twin tests green; `80b3865` |
| Major 3: `demo-light.png` broke the dark terminal of decision 10 | Closed | The terminal measures 0.148 in the light theme and the render fails above 0.3; `9309607`, `58bc5ed` |
| Major 4: the roadmap measured 1280 × 700 against a contract of 1280 × 360 | Closed by decision 11 | The contract now allows 720 and the graphic stays at 700; the limit travels in the record and the test pins it; `9309607` |
| Minor 1: the report of 6.1 claimed a word-for-word run | Closed | The report names the substitute and the lines it replaced, with a new transcript; `95459db` |

## Issues

### BROKEN

None. The four Majors and the Minor are closed with their tests, their measurements and their commits.

### RISK

1. **`demo-light.png` is outside the canvas bound of decision 10 (owner: Fable, if the bound must hold for every light
   variant).** Decision 11 asks for a dark terminal in both themes and the real run of the quick start takes 55.4% of
   the 1280 × 560 canvas, so its mean luminance is 0.493 and cannot reach 0.80: a dark terminal would have to stay
   under 19%. The test measures this file inside the terminal area (0.30 or less, met at 0.148) and measures every
   other light canvas against 0.80. Closing the tension the other way means giving up the real demo in the light
   variant.
2. **The CI badge and the clone URL still fail for anonymous readers (owner: Fable, task 10.1).** `curl.exe -sI` of the
   workflow badge answers 404 and the clone of the first line of the quick start exits 128 while the repository is
   private. Both resolve at the launch.
3. **The demo graphic changes with every render (owner: whoever re-renders).** The terminal draws the real times
   (`134 ms, rss 121 MB` on this machine), so rendering again rewrites the image, the record and the two quick start
   blocks of both READMEs. It is what keeps the image honest, and it dirties the diff.
4. **Rendering still needs the network (owner: the `design-system-shared` change).** Outfit is loaded from Google
   Fonts at render time and the script fails when it does not load. The repository carries no font file, and a test
   asserts it.
5. **The two READMEs can still drift in their prose (owner: whoever edits them).** The test compares sections, code
   blocks, variables, states and the translation of the headings; a sentence that drifts inside a translated section
   is not caught.

### NOT DONE

1. **Task 10.1 (rename the GitHub repository, update the remote, prove the redirect)** is Fable's and the remote is
   untouched here.
2. **The GitHub pipeline did not run**, because there is no push: the equivalent ran locally.
3. **The archive and the merge** wait for Fable's review and Franc's go-ahead.

### UNKNOWN

1. **How GitHub renders the translated headings and the new graphics on themes and widths beyond the 1280 and 400 px
   of the captures.**
2. **The badge and the redirect after 10.1**, because the repository is still private and not renamed.
3. **The weight of `docs/images/` if someone re-renders on another machine**: 714,046 bytes here, and the test guards
   the 3 MiB budget.
