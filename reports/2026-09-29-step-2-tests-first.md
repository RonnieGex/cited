# Step 2 · tests first, in red

Contract: `openspec/changes/brand-and-design-system/tasks.md`, tasks 2.1 and 2.2.
Agent: deepseek-harness. Date: 2026-09-29.

Every command of this report runs in the worktree `katalis-dev/community-ui`, quoted below as the working directory
`.`; the absolute path of the machine is never written to a tracked file, because `tests/personal-paths.test.ts`
refuses it.

## 2.1 Red tests for every scenario a unit test can read

`tests/design-system.test.ts` is new and reads the four requirements of
`openspec/changes/brand-and-design-system/specs/design-system/spec.md` that a unit test can read:

| Scenario of the spec | Test |
|---|---|
| The flame is the original | `copies the three files byte for byte from the flame of the product`, `is byte for byte the file of the same size in Construye` |
| The ink variant is derived, not drawn | `derives the ink variant from the 512 px original and records the operation`, `keeps the shading of the original in ink, and draws nothing of its own`, `is reproduced byte for byte by the committed script` |
| No invented logo | `removes the invented logo and every reference to it, and the foot of both READMEs shows the flame`, `draws the flame beside by Katalis in the banner and in the social preview`, `refuses a record that names the invented logo` |
| The values match the reference | `declares the tokens of the reference once, in app/tokens.css`, `records in the document the value each token has in Construye, and the two are equal`, `carries the values of Construye's own stylesheet`, `exposes the tokens to Tailwind through @theme` |
| The font files and their names | `ships the Outfit files and nothing else, with the OFL license next to them`, `carries no font file outside public/fonts/outfit and no name of a licensed family`, `declares the face in the tokens sheet and applies it on html` |
| A kit of components (the source half) | `provides the five components of the kit, built on the tokens`, `renders the kit in Spanish at /kit` |

The two tests that need the source repository of the flame skip themselves when it is not on the machine: they are
built from `homedir()` so that the test file itself carries no home directory.

```
$ npx vitest run tests/design-system.test.ts

 RUN  v5.0.2 C:/Users/Franc/Documents/katalis-dev/community-ui

 ❯ tests/design-system.test.ts (17 tests | 17 failed) 57ms
   ❯ the mark of the maker is the real flame (8)
     × copies the three files byte for byte from the flame of the product 5ms
     × is byte for byte the file of the same size in Construye 1ms
     × derives the ink variant from the 512 px original and records the operation 0ms
     × keeps the shading of the original in ink, and draws nothing of its own 1ms
     × is reproduced byte for byte by the committed script 0ms
     × removes the invented logo and every reference to it, and the foot of both READMEs shows the flame 4ms
     × draws the flame beside by Katalis in the banner and in the social preview 2ms
     × refuses a record that names the invented logo, and accepts the records of the round 0ms
   ❯ one set of tokens, the ones of Construye (4)
     × declares the tokens of the reference once, in app/tokens.css 0ms
     × records in the document the value each token has in Construye, and the two are equal 0ms
     × carries the values of Construye's own stylesheet 1ms
     × exposes the tokens to Tailwind through @theme and imports them from globals.css 0ms
   ❯ Outfit is the font, self-hosted and licensed (3)
     × ships the Outfit files and nothing else, with the OFL license next to them 0ms
     × carries no font file outside public/fonts/outfit and no name of a licensed family 38ms
     × declares the face in the tokens sheet and applies it on html 0ms
   ❯ a kit of components (2)
     × provides the five components of the kit, built on the tokens 0ms
     × renders the kit in Spanish at /kit 0ms

 Test Files  1 failed (1)
      Tests  17 failed (17)
exit=1
```

A sample of the failures, one per requirement:

```
FAIL tests/design-system.test.ts > ... > copies the three files byte for byte from the flame of the product
Error: ENOENT: no such file or directory, open '<root>/docs/design-system.md'

FAIL tests/design-system.test.ts > ... > is byte for byte the file of the same size in Construye
Error: ENOENT: no such file or directory, open '<root>/public/brand/katalis-flame-64.png'

FAIL tests/design-system.test.ts > ... > refuses a record that names the invented logo
TypeError: inventedLogos is not a function

FAIL tests/design-system.test.ts > ... > declares the tokens of the reference once, in app/tokens.css
Error: ENOENT: no such file or directory, open '<root>/app/tokens.css'

FAIL tests/design-system.test.ts > ... > ships the Outfit files and nothing else
Error: ENOENT: no such file or directory, scandir '<root>/public/fonts/outfit'

FAIL tests/design-system.test.ts > ... > provides the five components of the kit
Error: ENOENT: no such file or directory, scandir '<root>/components/ui'
```

### One expectation corrected before the code, with its measurement

The first draft of `keeps the shape and the shading of the original` required the alpha channel of
`katalis-flame-ink-<size>.png` to be **equal pixel by pixel** to the alpha channel of the committed
`katalis-flame-<size>.png`. That is false for the files of the source: the 64 and 192 px files of Construye are not
resizes of its own 512 px file with the kernel of `sharp`. Measured against a Lanczos resize of the 512 px original:

```
192: alpha pixels different 3107/36864, worst 16, transparent committed 26589 vs resized 27591
 64: alpha pixels different  901/4096,  worst 20, transparent committed 3080 vs resized 3333
```

The scenario asks that the variant be derived from the 512 px original only by resizing and recoloring, so the test
was written to say exactly that instead: the ink is ink and nothing else (every opaque pixel is neutral and none is
lighter than `#171717`), its alpha is the alpha of the 512 px original through a box filter (mean error under 12 of
255), its tone is the luminance of the 512 px original recolored to ink (90% of the pixels within 8 of 23), and a
second run of the committed script writes the same bytes. The measurement above is in the comment of the test.

## 2.2 Red E2E for the font, the external host and `/kit`

`e2e/design-system.spec.ts` is new: the computed `font-family` of `html`, of `body` and of a paragraph, the assertion
that no request of the page leaves the origin of the app and that the app serves its own Outfit file, the `/kit` page
with one example of each component of the kit, the visible focus of the primary button and an axe check of level A and
AA. `@axe-core/playwright@^4.13.0` is the new development dependency it needs.

```
$ npx playwright test e2e/design-system.spec.ts --reporter=list

Running 2 tests using 2 workers

  x  2 [chromium] › e2e\design-system.spec.ts:19:5 › every text of the app is Outfit, served by the app (292ms)
  x  1 [chromium] › e2e\design-system.spec.ts:63:5 › the kit renders every component, answers 200 and passes axe (276ms)

  1) [chromium] › e2e\design-system.spec.ts:19:5 › every text of the app is Outfit, served by the app
    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 404
    > 28 |   expect(response?.status()).toBe(200);

  2) [chromium] › e2e\design-system.spec.ts:63:5 › the kit renders every component, answers 200 and passes axe
    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 200
    Received: 404
    > 66 |   expect(response?.status()).toBe(200);

  2 failed
exit=1
```

Both fail on `/kit`, which does not exist yet. The web server the configuration builds and starts answered the health
check, so the build of the base is sound and the failure is the missing route, not a broken server.

## Commits of this task

- `1c1b7dc` the red tests, the declaration of `inventedLogos` and the axe dependency.

## Files

- `tests/design-system.test.ts` (new).
- `e2e/design-system.spec.ts` (new).
- `scripts/readme-graphics/honesty.d.mts` (the declaration of `inventedLogos` and `intendedLogo`).
- `package.json`, `package-lock.json` (`@axe-core/playwright` as a development dependency).
- `reports/2026-09-29-step-2-tests-first.md` (this file).
