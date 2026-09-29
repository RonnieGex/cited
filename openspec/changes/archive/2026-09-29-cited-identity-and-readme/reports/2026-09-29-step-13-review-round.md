# Step 13 - Second review round

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Base: `main` at `5dec3af`; the branch was at `1ff74d6` when the round opened
- Contract: section 13 of `tasks.md`, written by Fable after `katalis-dev/tasks/revision-community-03b.md`
- Commits of the round: `37bde82` (the state file), `19fc7d9` (the tests first and the guard), `77860c7` (the
  documentation and the records), `81321f5` (the guard in the two writers), `596cc1f` (the report of 6.1)
- Every command of this report ran on Windows 11 with Node `v24.11.0`, with `EMBEDDINGS_PROVIDER=fake`, with no `.env`
  opened, with no call to a model provider and with no call to Turso

## 13.1 Tests first, and red (commit `19fc7d9`)

The scenario "Only planned text speaks of answers" that Fable amended in `specs/project-readme/spec.md` reads a third
and a fourth source now, so the test reads them too:

- **every Markdown file under `docs/`**, statement by statement. A statement is a paragraph, a bullet or a table row;
  inside a fenced block every line is its own statement, which is how the outlined `page.tsx` of
  `docs/frontend-standards.md:25` stays in scope. In `docs/` the word "page" only counts next to a cue of citation
  (`cite`, `show`, `give`, `return`, `point to`, `came from`), because a PDF has pages and the interface is a page, and
  both of those exist today: `docs/search.md:51` documents `MAX_PAGES` and `search.md:37` names the `pages` column of
  the schema.
- **every text field of `docs/images/readme-graphics.json` and `docs/images/readme-banner.json`**, with two documented
  exemptions: a row of `roadmap` is read as one statement, because it carries its own `state` and the `reference` of
  the change that delivers it (the same exemption the READMEs get for the status table and the roadmap), and the
  `demo` subtree is the verbatim output of the real run of the quick start, measured by the scenario "The demo is real
  output" instead of by this one.
- the `Next` tag of the scenario is now `next`, `planned`, `planeado` or `planeada`, `siguiente` or the name of the
  change that delivers it, which is what the amended sentence asks for. `Next.js` does not count as a tag.
- a test asserts that the `alt` of every entry of the record is the `alt` of its picture in `README.md`, so the record
  cannot say something the README does not say.

The render can no longer write a dishonest record: `scripts/readme-graphics/honesty.mjs` exports `answerWords`,
`plannedMark`, `untaggedClaims` and `assertHonestRecord`, and both writers call `assertHonestRecord(record, recordPath)`
immediately before `writeFile(absolute(recordPath), ...)`. `scripts/readme-graphics/honesty.d.mts` declares the module
for `tsc`; the repository keeps no comments in its code, so the names carry the rule.

```
> npx vitest run tests/readme.test.ts --reporter=verbose
 Test Files  1 failed (1)
      Tests  4 failed | 36 passed (40)
```

The whole list the first red run printed, ten statements:

```text
docs/backend-standards.md:35: - The public answer route is the only endpoint a stranger can call. It carries a per-IP limit, a daily cap of model calls, a cap of tokens per answer and a maximum question length of 1000 characters.
docs/backend-standards.md:40: - Errors answer with a status and a short message. A stack trace, a key or an internal path never reaches the client.
docs/frontend-standards.md:25: page.tsx          # public page of questions and answers
docs/frontend-standards.md:48: - Answers are rendered from sanitized markdown. Raw HTML from a model or from a document is never injected.
docs/search.md:3: How Cited turns the documents of a business into passages and answers a question with the passages that come closest to it. This is change 2 of the approved plan: the core, before any chat, voice or page.
docs/search.md:95: No test calls a real provider. The suite uses the fake provider and one HTTP double that listens on `127.0.0.1` and answers a recorded response, so the OpenAI-compatible path is exercised without leaving the machine.
docs/search.md:163: - A **meaning-only match ranks when the embeddings are good**: the sample corpus answers a paraphrase with the synthetic provider that ships for tests, but the real quality depends on the embeddings model of the installation. Bigger is usually better, and the paid service is better at this.
docs/search.md:166: - A small or one-topic corpus answers well; a large corpus with many similar documents needs an embeddings model of real quality. Choosing it is part of the installation, not of this code.
docs/images/readme-graphics.json: graphics[0].alt: Cited answers only from the documents of the business
docs/images/readme-graphics.json: graphics[3].alt: How Cited works: documents, passages, libSQL, Reciprocal Rank Fusion and the answer
```

The other three failures were the record against the guard, the guard absent from the two writers and the `alt` of the
record against the `alt` of the README. `docs/security.md` was read and stayed out of the list: its statements about the
answer already carry the mark **Planned** in `pluggable-models-and-ask`.

The run is kept in `rendered/cited-readme/round-4-13.1-red.log` outside the repository. The suite went from 108 to
**113 tests**: five of them new, four in the block "the records of the render" and the manifest one.

## 13.2 Major: the documentation and the records mark what is planned (commits `77860c7` and `81321f5`)

Nothing was deleted: every sentence that describes the planned answer keeps its description and gains the mark Fable
asked for.

| File | Before | Now |
|---|---|---|
| `docs/search.md:3-4` | `How Cited turns the documents of a business into passages and answers a question with the passages that come closest to it.` | `...into passages and finds the passages that come closest to a question. The answer that quotes them is **planned** in `pluggable-models-and-ask`; this is change 2...` |
| `docs/search.md:96` | the HTTP double `answers a recorded response` | `returns a recorded response` |
| `docs/search.md:163` | the sample corpus `answers a paraphrase with the synthetic provider` | `responds to a paraphrase with the synthetic provider` |
| `docs/search.md:166` | `A small or one-topic corpus answers well` | `A small or one-topic corpus works well` |
| `docs/backend-standards.md:35-36` | the public answer route in the present, unmarked | the same sentence with `**Planned** in `pluggable-models-and-ask`.` at the end of the bullet |
| `docs/backend-standards.md:40` | `Errors answer with a status` | `Errors return a status` |
| `docs/frontend-standards.md:25` | `page.tsx # public page of questions and answers` | `page.tsx # public page of questions and answers (planned in admin-and-public-ui)` |
| `docs/frontend-standards.md:48` | `Answers are rendered from sanitized markdown.` | the same sentence with `**Planned** in `pluggable-models-and-ask`.` |
| `docs/images/readme-graphics.json` and `scripts/readme-graphics/manifest.mjs` | `reason-sources` alt: `Cited answers only from the documents of the business` | `Cited reads only the documents you point it at`, the alt the README already carried |
| `docs/images/readme-graphics.json` and `scripts/readme-graphics/manifest.mjs` | `how-it-works` alt: `...Reciprocal Rank Fusion and the answer` | `...Reciprocal Rank Fusion, with the answer marked Next` |

The manifest and the record were corrected together because the manifest is what a new render writes into the record,
which is exactly the defect Codex reproduced in `manifest.mjs:14`. A test now compares the two, field by field, and the
guard refuses the write when the manifest carries a claim of today: with the old string back in the manifest,

```
> node --input-type=module -e "import { graphics } from './scripts/readme-graphics/manifest.mjs'; import { assertHonestRecord } from './scripts/readme-graphics/honesty.mjs'; assertHonestRecord({ graphics, social: {} }, 'docs/images/readme-graphics.json'); console.log('accepted');"
Error: docs/images/readme-graphics.json would record a planned answer as a capability of today; mark it with Next, planned or the change that delivers it:
graphics[0].alt: Cited answers only from the documents of the business
guard exit: 1
```

With the corrected manifest the same command prints `accepted` and exits 0.

**Only what changed was re-rendered: nothing.** The `alt` of a graphic is metadata, not pixels; no template draws it, so
no PNG changed. The commit `77860c7` touches no image, `docs/images/` still weighs **714,056 bytes in 21 files** (the
same as at the close of section 12) and no render needed the network. The three files that describe a graphic (the
record, the manifest and the README) now carry the same `alt`, which the new assertions pin.

## 13.3 Minor: the report of 6.1 names its amendment (commit `596cc1f`)

`git blame -L 12,13` attributes the two lines of the header to `95459db`, and `git show --name-only 95459db` lists only
that report, while `58bc5ed` lists the READMEs, the PNGs and the two JSON records. The header now reads:

```
- Amended on 2026-09-29 by task 12.5 of the review round (commit `95459db`): section 6.1 now says exactly what ran and
```

## 13.4 The battery

| Command or check | Result |
|---|---|
| `npx vitest run tests/readme.test.ts --reporter=verbose` before the fix | **4 failed**, 36 passed; the ten statements are above |
| `npm test` | 11 files, **113 tests passed**, exit 0 (108 before: five new) |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, no warnings |
| `npm run secrets:scan` (gitleaks) | 115 commits, `no leaks found`, exit 0 |
| `npm run openspec:validate` (`--all --strict`) | 5 passed, 0 failed, exit 0 |
| `git diff --check main...HEAD` | exit 0 |
| Weight of `docs/images/` | 21 files, 714,056 bytes, 0.681 MiB, budget 3 MiB, and no PNG changed in the round |
| `git status --short --branch` | `feature/cited-identity-and-readme`, clean tree |

## Mutant runs

Each defect was reintroduced in the working tree, the test was run and the tree was restored with `git checkout --`. No
mutant survives, and each one is reported by the statement that names it:

| Defect reintroduced | Command | Result |
|---|---|---|
| `Cited answers only from the documents of the business` in the record and the old opening of `docs/search.md` | `npx vitest run tests/readme.test.ts` | **ROJO**, 4 failed: the scenario named `docs/search.md:3` and `graphics[0].alt`, the guard test named the field, the manifest test named the drift and the `alt` test named the README |
| the same alt back in `scripts/readme-graphics/manifest.mjs` | `npx vitest run tests/readme.test.ts` | **ROJO**, 1 failed: `keeps the manifest of the graphics in step with the record it writes` |
| the same alt back in the manifest, through the guard the writer calls | the `node --input-type=module` command of 13.2 | **ROJO**, exit 1, `graphics[0].alt` named |

## The findings of `revision-community-03b.md`

| Finding | State | Evidence |
|---|---|---|
| Major 1: the documentation and the record of the graphics still say that Cited answers today | **CLOSED** | The four files, both records and the manifest are corrected and marked; the amended scenario reads `docs/**/*.md` and every text field of both records; `19fc7d9`, `77860c7`, `81321f5` |
| Minor 1: the report of 6.1 attributes its amendment to `58bc5ed` | **CLOSED** | The header names `95459db`, which is the commit `git blame` shows; `596cc1f` |

## Issues

### BROKEN

None. The Major and the Minor of `revision-community-03b.md` are closed with their test, their commit and their
reproduction, and the battery is green.

### RISK

1. **The rule for a cited page in `docs/` is a heuristic (owner: whoever writes the documentation).** A statement of
   `docs/` that promises a page counts as an offender only next to a cue of citation (`cite`, `show`, `give`, `return`,
   `point to`, `came from`), because `MAX_PAGES`, the `pages` column and the public page are real today. A sentence that
   promises a page with another verb would pass the scan. The READMEs and the records keep the strict word set, page
   included.
2. **A record edited by hand is caught by the test, not by the guard (owner: whoever edits a record).** The guard runs
   inside the two writers; the committed record is protected by `tests/readme.test.ts`, which reads every text field of
   both records. Editing a record by hand and running no test would leave it dishonest until the next `npm test`.
3. **The `alt` of a graphic now lives in three places (owner: whoever edits a graphic).** The record, the manifest and
   the two READMEs. Two assertions tie them together, and the guard stops a render that would write a claim, but a
   change of wording means touching the three.
4. **The CI badge and the clone URL still fail for anonymous readers (owner: Fable, task 10.1).** Unchanged by this
   round: the repository is still private and not renamed.
5. **Rendering still needs the network (owner: the `design-system-shared` change).** Outfit is loaded from Google Fonts
   at render time; this round rendered nothing, so it needed nothing.

### NOT DONE

1. **Task 10.1 (rename the GitHub repository, update the remote, prove the redirect)** is Fable's; the remote is
   untouched here.
2. **The GitHub pipeline did not run**, because there is no push.
3. **The adversarial review of this round, the archive and the merge** wait for Fable and for the OK of Franc.

### UNKNOWN

1. **The verdict of the next adversarial review** on the amended scenario: the test now reads `docs/` and the records,
   and a reviewer may want another source or another wording.
2. **The state of the badge and of the redirect after 10.1.**
3. **How GitHub renders the documentation that changed**, which is text and not images: only the record changed what a
   screen shows through the `alt` of a graphic.
