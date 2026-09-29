# Step 11 - Art direction, second pass

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commits of this step: `ae4a054` (tests first), `9f67b1c`, `76fe142`, `a99fbd1`
- Contract: section 11 of `openspec/changes/cited-identity-and-readme/tasks.md`, written by Fable after looking at the
  first renders. The text of the task was not edited.

## 11.1 Tests first: the luminance bounds

`tests/png.ts` decodes a PNG with `node:zlib` and no new dependency (palette, truecolor, gray, with and without alpha,
bit depth 8 and 16, every row filter). `tests/readme.test.ts` decodes **every** PNG of `docs/images/`, prints its mean
relative luminance and asserts the bounds of design decision 10: `*-dark.png` and `social-preview.png` at 0.30 or less,
`*-light.png` at 0.80 or more. The footer mark of Katalis is not a canvas: the test asserts it is a transparent asset
and it also asserts the exact list of files, so a new PNG cannot enter `docs/images/` without being measured.

The commit `ae4a054` carries the test alone. The red run against the first graphics, before any template changed:

```
> npx vitest run tests/readme.test.ts -t "luminance"

The luminance of every PNG of docs/images:
demo-dark.png luminance 0.923 transparent 0.000
demo-light.png luminance 0.933 transparent 0.000
how-it-works-dark.png luminance 0.979 transparent 0.000
how-it-works-light.png luminance 0.970 transparent 0.000
katalis-logo-dark.png luminance 0.975 transparent 0.000
katalis-logo.png luminance 0.812 transparent 0.000
readme-banner-dark.png luminance 0.161 transparent 0.000
readme-banner-light.png luminance 0.922 transparent 0.000
reason-citations-dark.png luminance 0.937 transparent 0.000
reason-citations-light.png luminance 0.935 transparent 0.000
reason-sources-dark.png luminance 0.951 transparent 0.000
reason-sources-light.png luminance 0.950 transparent 0.000
reason-voice-dark.png luminance 0.953 transparent 0.000
reason-voice-light.png luminance 0.952 transparent 0.000
roadmap-dark.png luminance 0.965 transparent 0.000
roadmap-light.png luminance 0.950 transparent 0.000
social-preview.png luminance 0.988 transparent 0.000
voice-teaser-dark.png luminance 0.980 transparent 0.000
voice-teaser-light.png luminance 0.979 transparent 0.000

AssertionError: expected [ …(8) ] to deeply equal []
+ [
+   "reason-sources-dark.png 0.951",
+   "reason-citations-dark.png 0.937",
+   "reason-voice-dark.png 0.953",
+   "how-it-works-dark.png 0.979",
+   "demo-dark.png 0.923",
+   "roadmap-dark.png 0.965",
+   "voice-teaser-dark.png 0.980",
+   "social-preview.png 0.988",
+ ]
```

Every dark canvas but the banner, and the social preview, were between 0.923 and 0.988: the measurement of Fable
(0.92 to 0.98) reproduced exactly. The two marks were painted canvases too (`transparent 0.000`).

## 11.2 The second pass, graphic by graphic

### The defect the first pass had

`scripts/readme-graphics/base.html` asked for `{{BACKGROUND}}`, `{{TEXT}}`, `{{GLOW}}`, `{{MUTED}}`, `{{DOT}}`,
`{{NEXT_BACKGROUND}}` and `{{NEXT_TEXT}}`, and the renderer only filled the theme keys it happened to spell the same
way. The declarations with an unfilled placeholder are invalid CSS, so the browser dropped them and every body painted
white: the dark variant of every graphic but the banner came out white, and the lime tags lost their fill.

The renderer now fills every key of the theme and **fails loudly** if any `{{PLACEHOLDER}}` survives:

```
if (missing.length > 0) {
  throw new Error(`The template asks for ${[...new Set(missing)].join(", ")} and the renderer has no value.`);
}
```

The logo was a second defect of the same kind: the element screenshot composited the page background (a white box in the
dark theme) and `sharp` wrote it as truecolor without alpha, so the footer mark could not sit on any background. The
logo is now captured with the page background made transparent and written as RGBA; the test asserts it.

### What the render fails on now

`node scripts/render-readme-graphics.mjs` measures every render and stops on the rules of decision 10 that can be
measured, instead of leaving them to the eye:

- **Type:** the smallest text of the graphic at 16 px or more (found: 16 px, 17 px and 20 px), and every headline at
  700 with 44 px or more on the 1280 px graphics and 30 px or more on the 400 px cards.
- **Contrast:** a table of every text-on-surface pair of both themes, at 4.5:1 or more. The first run of the table
  failed with four pairs below it and the palette was corrected until all of them pass.
- **Fill:** the render is compared row by row against the same page painted without content; the longest run of empty
  background rows may not pass a quarter of the height.
- **Illustration:** the `.art` of a reason card may not be under 40% of the card.
- **Canvas:** no element may cross the bounds of the graphic.

The render prints the geometry of every graphic as evidence:

```
contrast of the dark theme:
  7.24:1  the body text on the page
  5.98:1  the muted text on the page
  4.63:1  the muted text on a card
  5.53:1  the body text on a card
  5.17:1  the index of a step on its card
  6.76:1  the Next tag on the page
  6.76:1  the Next tag on its surface
  5.40:1  the commands on the terminal
  5.78:1  the output on the terminal
  4.64:1  the title bar on the terminal
  6.76:1  the ink of a lime shape
contrast of the light theme:
  7.24:1  the body text on the page
  4.81:1  the muted text on the page
  4.89:1  the muted text on a card
  7.49:1  the body text on a card
  7.49:1  the index of a step on its card
  7.24:1  the Next tag on the page
  7.24:1  the Next tag on its surface
  6.76:1  the commands on the terminal
  7.24:1  the output on the terminal
  7.24:1  the title bar on the terminal
  6.76:1  the ink of a lime shape
rendered docs/images/reason-sources-dark.png (19871 bytes, smallest text 17px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/reason-sources-light.png (10124 bytes, smallest text 17px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/reason-citations-dark.png (19362 bytes, smallest text 17px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/reason-citations-light.png (10289 bytes, smallest text 17px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/reason-voice-dark.png (21970 bytes, smallest text 16px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/reason-voice-light.png (11994 bytes, smallest text 16px, 1 headlines, empty band 14px of 75px, illustration 41% of the card)
rendered docs/images/how-it-works-dark.png (35999 bytes, smallest text 16px, 1 headlines, empty band 53px of 120px)
rendered docs/images/how-it-works-light.png (34573 bytes, smallest text 16px, 1 headlines, empty band 53px of 120px)
rendered docs/images/demo-dark.png (45360 bytes, smallest text 16px, 1 headlines, empty band 40px of 140px)
rendered docs/images/demo-light.png (45823 bytes, smallest text 16px, 1 headlines, empty band 40px of 140px)
rendered docs/images/roadmap-dark.png (57728 bytes, smallest text 16px, 1 headlines, empty band 40px of 175px)
rendered docs/images/roadmap-light.png (59764 bytes, smallest text 16px, 1 headlines, empty band 40px of 175px)
rendered docs/images/voice-teaser-dark.png (36995 bytes, smallest text 16px, 1 headlines, empty band 51px of 90px)
rendered docs/images/voice-teaser-light.png (36497 bytes, smallest text 16px, 1 headlines, empty band 51px of 90px)
rendered docs/images/social-preview.png (31931 bytes, smallest text 20px, 0 headlines, empty band 157px of 160px)
rendered docs/images/katalis-logo.png (21834 bytes, transparent mark)
rendered docs/images/katalis-logo-dark.png (15385 bytes, transparent mark)
wrote docs/images/readme-graphics.json
```

### Card by card

- **Reason cards, 400 × 300.** A benefit headline at 30 px and weight 700 on a visible surface (a border, a fill and a
  shadow over the page), an illustration at 41% of the card, and one line of copy. Headlines: `Only your documents.`,
  `Every answer shows its page.` and `Talk to it.`; the voice card carries `Next`, and its copy says
  `Voice with ElevenLabs is next.`
- **How it works, 1280 × 480.** The five steps are cards with a visible surface joined by a lime line, and the two
  branches that follow the answer (`Web widget`, `Voice agent`) hang from a lime fork. `Next` appears only on the
  answer and on the two branches, three tags instead of one tag over the whole graphic.
- **Demo, 1280 × 560.** One terminal with the real run: the two commands of the quick start and the first result with
  its heading. The commands are lime, the output is off-white, the first result and its heading are lime, and no text
  carries an outline or a stroke effect any more. The line that does not fit the canvas is cut with `…`, as before.
- **Roadmap, 1280 × 700.** Two columns with bold headers. The four `Available now` rows carry a lime check and the spec
  that delivers them; the six `Next` rows carry an outlined `Next` tag and the name of the change. The graphic grew in
  height so that every row fits at 16 px without wrapping the capability.
- **Voice teaser, 1280 × 360.** A large orb of lime and ink gradients next to the headline `Talk to your documents.`,
  the tag `Next · ElevenLabs` and one line that says the voice is not built.
- **Social preview, 1280 × 640.** Full-bleed ink with the lime glow, the wordmark at 220 px with its `[1]` mark, the
  tagline, a lime rule and `by Katalis`. The text block is 326 px of the 640 px of the canvas, more than half.

### Two places where the light theme needed an edge, and one deviation

Decision 10 was written for the dark theme and the light variant has two hard limits of its own: lime on off-white is
1.07:1, and a dark terminal cannot cover a canvas that must stay at 0.80 of mean luminance.

- **Lime marks in the light theme carry an ink edge.** The hero of the banner does it (the lime `[1]` with an ink
  outline), and the graphics do the same: the connector lines and the check of the roadmap have an ink casing, the
  step index of a card is ink instead of lime, and the `Next` tag is outlined in ink. Lime is never text on off-white.
- **The demo is the one deviation.** Decision 10 asks for a terminal that is dark in both themes, and the same
  decision asks every `*-light.png` to be 0.80 or more. A dark terminal has to stay under 19% of a 1280 × 560 canvas to
  leave the mean at 0.80, and the real run of the quick start does not fit in 19% of the canvas. The dark variant is
  the dark terminal of the decision; the light variant keeps the same layout, the same commands and the same output on
  paper, with ink text, an ink title bar and the first result on a lime block. This is the only place where a rule of
  decision 10 is traded for another rule of decision 10, and it is recorded as a RISK in the delivery.

The light theme also keeps the ink title bar of the terminal, so the terminal is still a dark object in both variants;
only its screen follows the theme.

### The record and the README

`docs/images/readme-graphics.json` records the new text of every graphic (`headline` and, on the reason cards, `copy`),
its size and the bounds it is measured against (`artDirection`). A new test reads the record, asserts the headline is
in the template that draws it and asserts the same headline is in `README.md`, so the graphic and the prose cannot
drift. The README follows them: the three reasons open with the headline of their card, and `How it works`,
`See it answer`, `Roadmap` and `Voice` open with the line of their graphic (the Spanish twin carries its translation).

## 11.1 and 11.2 verdict

PASS. The red run of the luminance bound is pasted above and its commit carries the test alone. Every template was
redesigned, every graphic of both themes and the social preview were re-rendered, the record carries the new texts and
the README follows them. The green run of 11.1, after the fix:

```
The luminance of every PNG of docs/images:
demo-dark.png luminance 0.171 transparent 0.000
demo-light.png luminance 0.855 transparent 0.000
how-it-works-dark.png luminance 0.151 transparent 0.000
how-it-works-light.png luminance 0.937 transparent 0.000
katalis-logo-dark.png luminance 0.899 transparent 0.793
katalis-logo.png luminance 0.788 transparent 0.791
readme-banner-dark.png luminance 0.161 transparent 0.000
readme-banner-light.png luminance 0.922 transparent 0.000
reason-citations-dark.png luminance 0.250 transparent 0.000
reason-citations-light.png luminance 0.910 transparent 0.000
reason-sources-dark.png luminance 0.243 transparent 0.000
reason-sources-light.png luminance 0.913 transparent 0.000
reason-voice-dark.png luminance 0.209 transparent 0.000
reason-voice-light.png luminance 0.948 transparent 0.000
roadmap-dark.png luminance 0.161 transparent 0.000
roadmap-light.png luminance 0.935 transparent 0.000
social-preview.png luminance 0.151 transparent 0.000
voice-teaser-dark.png luminance 0.163 transparent 0.000
voice-teaser-light.png luminance 0.919 transparent 0.000

 Test Files  1 passed (1)
      Tests  1 passed | 30 skipped (31)
```

Every dark canvas is between 0.151 and 0.250, every light canvas between 0.855 and 0.948, and the two marks are 79% of
transparent pixels.
