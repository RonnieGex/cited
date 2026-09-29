# Step 2 - Tests first

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Commit verified against: `35112e6` (the contract of Fable), with `tests/readme.test.ts` in the working tree
- Report of task 2.1: `tests/readme.test.ts` with every scenario of `project-readme` and the two scenarios of
  `product-identity`, run red against the current README and names.

## The file

`tests/readme.test.ts`, 29 cases in nine groups. Every scenario of the change is covered:

| Scenario of the specs | Case of the test |
|---|---|
| `project-readme` › The banner is the heading | "opens with the picture of the banner as its only level-one heading", "renders the banner at 1280 by 320" |
| `project-readme` › The banner is reproducible | "is reproducible by the committed script", "records the texts of the banner, with the tagline of the README", "records the brand tokens and the font, and the font is not a file of the repository" |
| `project-readme` › The promise and the maturity come first | "carries the tagline, the badges, the link to the Spanish twin, three reasons and the maturity" |
| `project-readme` › Available means specified and merged | "marks every row Available or Planned, with the spec or the change that delivers it" |
| `project-readme` › Planned means scheduled | the same case, plus "never presents a planned capability as available outside the status table and the roadmap" |
| `project-readme` › The commands exist | "names only scripts of package.json, and runs the sample corpus with no key" |
| `project-readme` › How it works | "carries the designed flow and the Mermaid version inside a details block" |
| `project-readme` › Variables against the example file and the code | "compares the variables of the configuration with .env.example and with the code" |
| `project-readme` › The twins agree | the four cases of "README, the Spanish twin" |
| `project-readme` › Links and hosts | the two cases of "README, its links and its images" |
| `project-readme` › The foot | "closes with the license and the foot of Katalis" |
| `project-readme` › The graphics exist in both themes | "shows every graphic of the design in both themes, as a picture with its alt", "keeps every image as a PNG under docs/images, 3 MB or less together" |
| `project-readme` › The demo is real output | "draws the demo from the real run of the quick start" |
| `project-readme` › Planned is visible in the picture | "labels as Next every graphic that shows a planned capability", "shows in the roadmap the same rows and states as the status table" |
| `project-readme` › A social preview | "carries a social preview of 1280 by 640 with the name, the tagline and the byline" |
| `project-readme` › the graphics are reproducible | "is reproducible by the committed script and by the templates of every graphic" |
| `product-identity` › The former name is gone | "carries the former name in no tracked file outside the archived changes" |
| `product-identity` › The name in the places a reader sees first | "names Cited in the places a reader sees first", "keeps the home page as one main element with one heading that names Cited and nothing else" |

The test reads the real artifacts: the markdown of both READMEs, the JSON records of the banner and the graphics, the
PNG headers of every image, `package.json`, `.env.example`, the sources under `lib/`, `scripts/` and `app/`, and the
list of tracked files from `git ls-files`. It asserts order of sections, counts, states, commands, variable names and
pixel sizes; it never asserts the exact prose, so the copy can be written as an announcement without the test becoming
a second copy of it.

The names the test expects are exactly the names the design fixes: `docs/images/readme-banner-{dark,light}.png`,
`docs/images/readme-banner.json`, `docs/images/readme-graphics.json`,
`docs/images/{reason-sources,reason-citations,reason-voice,how-it-works,demo,roadmap,voice-teaser}-{dark,light}.png`,
`docs/images/social-preview.png`, `docs/images/katalis-logo.png`, `scripts/render-readme-banner.mjs`,
`scripts/readme-banner.html`, `scripts/render-readme-graphics.mjs` and `scripts/readme-graphics/<name>.html`.

## The red run, against the current README and the current names

```
> npx vitest run tests/readme.test.ts

 RUN  v5.0.2 <repository root>

 ❯ tests/readme.test.ts (29 tests | 29 failed) 78ms
   ❯ README, the banner (5)
     × opens with the picture of the banner as its only level-one heading 8ms
     × renders the banner at 1280 by 320 1ms
     × is reproducible by the committed script 0ms
     × records the texts of the banner, with the tagline of the README 1ms
     × records the brand tokens and the font, and the font is not a file of the repository 1ms
   ❯ README, the promise and the maturity (2)
     × carries the tagline, the badges, the link to the Spanish twin, three reasons and the maturity 1ms
     × carries no em dash in its prose 1ms
   ❯ README, the status table (2)
     × marks every row Available or Planned, with the spec or the change that delivers it 1ms
     × never presents a planned capability as available outside the status table and the roadmap 1ms
   ❯ README, the quick start and the configuration (2)
     × names only scripts of package.json, and runs the sample corpus with no key 1ms
     × compares the variables of the configuration with .env.example and with the code 1ms
   ❯ README, the Spanish twin (4)
     × has the same sections in the same order 0ms
     × has the same code blocks 0ms
     × has the same variables and the same status of every row 0ms
     × links the two files at the head of each one 0ms
   ❯ README, its links and its images (2)
     × resolves every relative link and image 1ms
     × takes every absolute image from the allowed hosts and with no tracking parameter 0ms
   ❯ README, its graphics (7)
     × shows every graphic of the design in both themes, as a picture with its alt 0ms
     × keeps every image as a PNG under docs/images, 3 MB or less together 0ms
     × labels as Next every graphic that shows a planned capability 0ms
     × draws the demo from the real run of the quick start 0ms
     × shows in the roadmap the same rows and states as the status table 0ms
     × carries a social preview of 1280 by 640 with the name, the tagline and the byline 0ms
     × is reproducible by the committed script and by the templates of every graphic 0ms
   ❯ README, the flow and the foot (2)
     × carries the designed flow and the Mermaid version inside a details block 1ms
     × closes with the license and the foot of Katalis 3ms
   ❯ the product is named Cited (3)
     × carries the former name in no tracked file outside the archived changes 49ms
     × names Cited in the places a reader sees first 1ms
     × keeps the home page as one main element with one heading that names Cited and nothing else 1ms

 Test Files  1 failed (1)
      Tests  29 failed (29)
   Start at  23:27:34
   Duration  1.64s
```

The first failing assertion of each group names the real gap:

| Group | First failure |
|---|---|
| the banner | `expected [ Array(2) ] to have a length of 1 but got 2`: the current README has two level-one headings (the English one and the Spanish one in the same file) |
| the banner files | `ENOENT: no such file or directory, open '<repository root>\docs\images\readme-banner-dark.png'` |
| the banner script | `ENOENT: no such file or directory, open '<repository root>\scripts\render-readme-banner.mjs'` |
| the promise | `docs/images/readme-banner.json exists: expected false to be true` |
| the status table | `the README has one level-two section "Status": expected [] to have a length of 1 but got +0` |
| the quick start | `expected 3 to be greater than or equal to 4`: the current block carries `npm ci`, `npm run hooks:install` and `npm run dev`, and no `ingest` and no `search` |
| the Spanish twin | `ENOENT: no such file or directory, open '...\README.es.md'` |
| the graphics | `docs/images/reason-sources-dark.png: expected undefined to be defined` |
| the foot | `expected '\nApache License 2.0, ...' to contain 'Apache-2.0'` |
| the identity | the former name in 25 tracked files (`package.json`, `NOTICE`, `README.md`, `app/page.tsx`, the docs, the standards, the samples and the tests) and `expected 'katalis-responde-community' to be 'cited'` |

The list of the 25 files that still carry the former name, as the test prints it: `.env.example`, `CONTRIBUTING.md`,
`LOOP_STATE.md`, `NOTICE`, `README.md`, `SECURITY.md`, `ai-specs/README.md`,
`ai-specs/agents/backend-developer.md`, `ai-specs/agents/frontend-developer.md`,
`ai-specs/agents/product-strategy-analyst.md`, `app/layout.tsx`, `app/page.tsx`, `docs/backend-standards.md`,
`docs/base-standards.md`, `docs/development-guide.md`, `docs/frontend-standards.md`, `docs/search.md`,
`docs/security.md`, `e2e/home.spec.ts`, `openspec/config.yaml`, `openspec/specs/app-skeleton/spec.md`,
`package-lock.json`, `package.json`, `samples/README.txt` and `tests/home.test.tsx`.

## The whole suite with the new file

```
> npm test

 Test Files  1 failed | 10 passed (11)
      Tests  29 failed | 72 passed (101)
```

The 72 tests of the base are untouched and still green: the new file adds failures, it breaks nothing.

## Verdict

PASS as a red run. The test fails for the real reason of every scenario (the identity is the old one, the README is the
bootstrap note, the twins, the graphics, the records and the scripts do not exist), and it is the last commit before
the implementation starts.
