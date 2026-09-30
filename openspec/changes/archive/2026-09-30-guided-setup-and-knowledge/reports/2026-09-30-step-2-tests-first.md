# Step 2: the tests first (tasks 2.1 and 2.2)

Date: 2026-09-30 (UTC). Branch `feature/guided-setup-and-knowledge`, the branch of this change. Node of the round:

    $ npx -y -p node@24 node -v
    v24.21.0

## Step 2.1: the unit and route tests, in red

The tests of decisions 1 to 7 are in the tree of this commit. This is the red run taken on the tree the commit
carries, before any fix of this round, with the command the prompt fixes for Windows:

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run

     Test Files  15 failed | 69 passed (84)
          Tests  46 failed | 918 passed (964)
        Errors  2 errors
        Duration  51.32s

The suite is read in two parts, and the report says which part is which.

### The new tests of this change

    tests/setup-checklist.test.ts     passed   (decision 2: the derived state of the four steps)
    tests/setup-information.test.ts   passed   (decisions 3, 4 and 5: the upload result, the sample, the sections)
    tests/setup-questions.test.ts     passed   (decision 6: the suggested questions)
    tests/setup-routes.test.ts        passed   (decisions 2, 4 and 6: the routes of the flags, the try and the sample)
    tests/setup-ui.test.tsx           20 tests | 8 failed (decisions 1 to 7: the lane, the information, Try it, Publish)

Those four files pass because the round that wrote them was cut in the middle and its implementation of the library
and the routes was already written; the red state that this report records for them is the one of the type checker,
which did not accept them until this round finished the interface (see below). The eight cases of the interface were
red with real failures of the interface, not of the test file:

     FAIL  tests/setup-ui.test.tsx > the lane of the guided setup > opens the step the owner presses and asks the page for
     FAIL  tests/setup-ui.test.tsx > the lane of the guided setup > shows the state of a step in words, never in a badge
     FAIL  tests/setup-ui.test.tsx > the information lane > takes several files at once and says what happened to each one
     FAIL  tests/setup-ui.test.tsx > the information lane > says the reason of a file that failed and that the others were read
     FAIL  tests/setup-ui.test.tsx > the try lane > shows the answer with its citation and the passage inside its document
     FAIL  tests/setup-ui.test.tsx > the try lane > offers the suggested questions as buttons and never calls a model to
     FAIL  tests/setup-ui.test.tsx > the try lane > says the documents do not say it and suggests adding one
     FAIL  tests/setup-ui.test.tsx > the try lane > marks the answer as right through the route of the panel

Two of them were unhandled exceptions of the rendered tree, which is the red an unfinished component gives:

    TypeError: Cannot read properties of undefined (reading 'en')
     ❯ components/setup/InfoPanel.tsx:253:33
     ❯ InfoPanel components/setup/InfoPanel.tsx:239:21

    TypeError: strings.citation is not a function
     ❯ Object.citationLabel components/setup/TryItPanel.tsx:176:49

### The typed contract of the new tests

    $ npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit
    [exit=1] 47 errors, of which 21 are in the five test files of this change:
      12  tests/setup-information.test.ts
      12  tests/setup-ui.test.tsx
       2  tests/setup-questions.test.ts
       1  tests/setup-routes.test.ts

The rest name the interface the tests ask for and the code had not finished: `components/setup/TryItPanel.tsx` (8),
`components/setup/SetupLane.tsx` (1), `lib/i18n/admin.ts` (1), and the four pages that call `panelMetadata()` with the
names of this change (4).

### The rest of the suite

The other 36 failures are cases of the rounds before this one that this change moves, and they are the work of task
4.1: the navigation of the panel (five sections in `brand-panel.test.tsx`), the page "Setup" that becomes the guided
setup (`brand-panel.test.tsx`, `brand-round-14c-panel.test.tsx`, `admin-unconfigured-words.test.tsx`), the shape of
the upload answer (`admin-documents.test.ts`), the props of `ProviderConnect` (`provider-ui.test.tsx`,
`provider-panel-words.test.ts`), the list of routes of the browser suite (`affiliate-links.test.ts`), the tables of
the store (`provider-settings.test.ts`, `voice-store-state.test.ts`), the words of the two languages
(`admin-ui.test.tsx`), the pages that may not name a variable (`admin-pages-variables.test.ts`), the design document
(`design-md.test.ts`) and the README (`readme.test.ts`). The two known cases of `tests/personal-paths.test.ts` fail
before this change touches anything, for the absolute path in the parenthetical of decision 1 of `design.md`, whose
text this round may not edit (report of task 1.1 and the delivery).

## Step 2.2: the browser suite

The suite is `e2e/setup.spec.ts`, with its own service in `playwright.config.ts` (project `setup`, port 3217, its own
store, no provider of any kind at the start) and its own local double of a provider on port 3216: no test reaches a
real provider. It carries the eight scenarios of `specs/owner-setup/spec.md`, the walk "from zero to an answer" timed
end to end, an axe check of every page of the round in both languages, and the captures of task 7.1.

The suite was written before the pages of section 3 existed. Its first complete run, as soon as the round compiled,
was red and it found real defects:

| Run | Result | What it found |
|---|---|---|
| the build of the round | `[exit=1]` 47 errors of `tsc` | the round did not compile: the dictionary of the panel was half written |
| 1st full run | 7 failed, 63 passed | a function (`citation`) inside the strings the server hands to client components; the affiliate link computed in the browser, where the environment of the installation is not; a scrollable region without focus; axe measuring during an entrance animation; the spec running in two projects; two assertions of the suite itself |
| 2nd full run | 2 failed, 70 passed | the `role="status"` of the panel and the confirmation saying the same words; the current mark of the navigation |
| 3rd full run | 1 failed, 71 passed | the double of the suite answered the Chat Completions API with the shape of an embeddings answer, and the SDK refused it: the walk then showed "the assistant cannot answer right now" |
| 4th full run | 1 failed, 72 passed | **a PDF could not be read in a production build at all**: `pdf-parse` could not find its worker inside `.next` ("Setting up fake worker failed"), so every upload of a PDF failed with "This file could not be read"; and `pdf-parse` marks every page it extracts ("-- 1 of 1 --"), so a PDF with no text layer was ingested as one passage of a page number instead of being refused as a scan |
| 5th full run | 1 failed, 75 passed | the privacy page names the provider the walk connected (OpenRouter), not another one |
| 6th full run | 1 failed, 76 passed | with the four steps verified the lane gives way to the page of a finished owner |
| **7th full run** | **78 passed, 0 failed** (1.3 m) | — |

Two of those defects are of the product and not of the suite, and both are fixed in this round: the worker of
`pdf-parse` (a one-line `serverExternalPackages` in `next.config.ts`) and the page markers of the extraction
(`lib/ingest/parse.ts`), which is what makes the scenario "A scanned PDF" true. Both have their unit evidence:

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/ingest.test.ts tests/admin-documents.test.ts

     Test Files  3 passed (3)

The walk "from zero to an answer" is the timing of the round, printed by the suite itself on every run:

    from zero to an answer: 1.8 s
      ai connected 0.3 s · step 1 verified 0.4 s · step 2 verified 0.7 s · answer marked right 1.7 s · step 3 verified 1.8 s

with the deterministic double of the provider. The real run with DeepSeek is the other half of decision 13 and it is
recorded in the delivery.
