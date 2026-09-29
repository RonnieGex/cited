# Step 14 - Third review round

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Base: `main` at `5dec3af`; the branch was at `387e2df` when the round opened
- Contract: section 14 of `tasks.md`, written by Fable after `katalis-dev/tasks/revision-community-03c.md`
- Commits of the round: `f7eb7a1` (the state file), `9853148` (the tests first, red), `c7e7491` (the exemption of the
  captured lines, green)
- Every command of this report ran on Windows 11 with Node `v24.11.0`, with `EMBEDDINGS_PROVIDER=fake`, with no `.env`
  opened, with no call to a model provider and with no call to Turso. Nothing was pushed and nothing was archived.

## The defect and the amendment

`revision-community-03c.md` reproduced that `scripts/readme-graphics/honesty.mjs` and `tests/readme.test.ts` skipped the
whole `demo` subtree by prefix, so `"caption": "Cited answers every question today"` inside `demo` left the 41 tests
green and the guard accepted the record with exit 0. Fable amended the scenario "Only planned text speaks of answers"
in `specs/project-readme/spec.md` at `387e2df`: the only text exempt is the verbatim output the render script captured
from the real run of the quick start, the command lines and the lines they printed; every other field under `demo`, and
anywhere else, is checked.

## 14.1 Tests first, and red (commit `9853148`)

`tests/readme.test.ts` gained one scenario and amended one assertion of the guard block, both red against the files of
`387e2df`:

- **`reads every field of the demo but the lines the run printed`.** It asserts that the committed record carries no
  untagged claim even though `demo.ingest.output` prints `no pages`; that a claim written into a new field
  `demo.caption` is named; and that a claim that replaces the drawn line `demo.drawn.ingest[0]` is named too.
- **`keeps the state of a roadmap row and the captured run of the demo as the evidence`** now asserts both halves of
  the amended rule: the command lines and the printed lines of a demo are exempt, and any other field of `demo` is copy
  and is read. It was `keeps the state of a roadmap row and the capture of the demo as the record`.

The focused run, against the prefix exclusion:

```text
> npx vitest run tests/readme.test.ts -t "reads every field of the demo" --reporter=verbose
 × tests/readme.test.ts > README, the promise of an answer > reads every field of the demo but the lines the run printed
   → a field of the demo that the run did not print: expected [] to include 'demo.caption: Cited answers a questio…'
 Test Files  1 failed (1)
      Tests  1 failed | 41 skipped (42)
```

The whole file, where the amended assertion fails too:

```text
> npx vitest run tests/readme.test.ts --reporter=verbose
 × tests/readme.test.ts > README, the promise of an answer > reads every field of the demo but the lines the run printed
   → a field of the demo that the run did not print: expected [] to include 'demo.caption: Cited answers a questio…'
 × tests/readme.test.ts > the records of the render > keeps the state of a roadmap row and the captured run of the demo as the evidence
   → any other field under demo is copy and is read: expected [] to deeply equal [ Array(1) ]
 Test Files  1 failed (1)
      Tests  2 failed | 40 passed (42)
```

The second red run is the guard itself. `rendered/cited-readme/round-5-14.1-guard-mutant.mjs`, the sibling `rendered/`
directory of the suite, outside the repository, loads `scripts/readme-graphics/honesty.mjs`, mutates one route of the
committed record **in memory** and calls `assertHonestRecord`; it writes no file. Run from the repository root, where
`..\rendered\` is that directory:

```text
> node ..\rendered\cited-readme\round-5-14.1-guard-mutant.mjs scripts/readme-graphics/honesty.mjs docs/images/readme-graphics.json demo.caption
demo.caption: accepted
exit 0
> node ..\rendered\cited-readme\round-5-14.1-guard-mutant.mjs scripts/readme-graphics/honesty.mjs docs/images/readme-graphics.json demo.drawn.ingest[0]
demo.drawn.ingest[0]: accepted
exit 0
```

Both are the defect: the task asks for a non-zero exit and the guard returns 0. The runs are kept in
`rendered/cited-readme/round-5-14.1-red.log`, `round-5-14.1-red-full.log` and `round-5-14.1-guard-red.log`, outside the
repository.

## 14.2 The exemption of the captured lines only (commit `c7e7491`)

The prefix exclusion is gone from both files. `honesty.mjs` builds the evidence of the run once per record:

- **Exempt, by exact route:** `demo.ingest.command` and `demo.search.command` (the command lines), `demo.ingest.output`
  and `demo.search.output` (the lines they printed).
- **Exempt, by route and by content:** each element of `demo.drawn.ingest` and `demo.drawn.search`, and only while the
  string is one of the lines of its own capture. A drawn line that the run did not print is checked like any other
  field.
- **Checked:** every other string of the record, `demo` included. `demo.exitCode` and `demo.terminal` are numbers, so
  they carry no statement; a new field under `demo` is read.

`isCapturedOutput(record, route, value)` is the single predicate. `untaggedClaims` and `assertHonestRecord` use it
inside the walk and `tests/readme.test.ts` imports it for `textRoutes` and `textFields`, so the rule lives in one place
and the test no longer copies it. `scripts/readme-graphics/honesty.d.mts` declares the new export for `tsc`. The guard
runs before the write in both renderers, in the order the test `writes no record before the check of the guard` pins.

The scenario also ties the exemption to the published run: `draws the demo from the real run of the quick start` now
reads every line of both captures, not only the drawn ones, and every one of the 24 lines is present verbatim in the
quick start block of `README.md`, which the render script writes from the same capture.

Green after the change, same two commands:

```text
> npx vitest run tests/readme.test.ts --reporter=verbose
 Test Files  1 passed (1)
      Tests  42 passed (42)
> node ..\rendered\cited-readme\round-5-14.1-guard-mutant.mjs scripts/readme-graphics/honesty.mjs docs/images/readme-graphics.json demo.caption
Error: docs/images/readme-graphics.json (demo.caption) would record a planned answer as a capability of today; mark it
with Next, planned or the change that delivers it:
demo.caption: Cited answers a question and shows the page it came from.
exit 1
> node ..\rendered\cited-readme\round-5-14.1-guard-mutant.mjs scripts/readme-graphics/honesty.mjs docs/images/readme-graphics.json demo.drawn.ingest[0]
Error: docs/images/readme-graphics.json (demo.drawn.ingest[0]) would record a planned answer as a capability of today;
mark it with Next, planned or the change that delivers it:
demo.drawn.ingest[0]: Cited answers a question and shows the page it came from.
exit 1
```

## 14.3 The checks

| Command | Result |
|---|---|
| `npm test` | 11 files, **114 tests** (113 before; the new scenario), exit 0 |
| `npm run typecheck` | exit 0; route types generated and `tsc --noEmit` green |
| `npm run lint` | exit 0, no error output |
| `npm run secrets:scan` | 121 commits, `no leaks found`, exit 0 |
| `npm run openspec:validate` | 5 passed, 0 failed, exit 0 |
| `git diff --check main...HEAD` | exit 0 |
| `git status --short --branch` at the end | `## feature/cited-identity-and-readme`, clean tree |
| Files of the round | 5: `LOOP_STATE.md`, `honesty.mjs`, `honesty.d.mts`, `tests/readme.test.ts` and this report; no PNG changed |

The first version of this report spelled the path of the mutant scripts as the absolute path of the machine, and
`tests/personal-paths.test.ts` reads every tracked file of the repository: it refused the committed home directory
(`2 failed | 112 passed (114)`). The report now writes that path as `..\rendered\`, which is the same directory without
the home prefix, and `npm test` is green again at 11 files and 114 tests. The run that found it is kept in
`rendered/cited-readme/round-5-14.3-home-path.log`.

## Reproduction of the Major, with the record mutated on disk

`rendered/cited-readme/round-5-14.3-mutate.mjs` wrote each mutant into `docs/images/readme-graphics.json`, then the test
file and the guard ran, then `git checkout --` restored the record. The tree was clean after every case.

| Mutant of `docs/images/readme-graphics.json` | `npx vitest run tests/readme.test.ts` | Guard |
|---|---|---|
| `demo.caption = "Cited answers every question today"` | **RED**, exit 1, `3 failed \| 39 passed (42)`; names `speaks of answers only in a line that carries Next`, `reads every field of the demo but the lines the run printed` and `holds no claim the guard would refuse` | exit 1, `demo.caption would record a planned answer as a capability of today` |
| `demo.drawn.ingest[0] = "Cited answers a question and shows the page it came from."` | **RED**, exit 1, `4 failed \| 38 passed (42)`; adds `draws the demo from the real run of the quick start` (`a drawn line is a line the run printed`) | exit 1, names `demo.drawn.ingest[0]` |
| Without mutants | `42 passed (42)`, exit 0 | accepted, exit 0 |

The first two rows are the Major of `revision-community-03c.md` reproduced: at `387e2df` the same mutants left the file
green and the guard accepted them.

## The boundary that stays exempt, and what covers it

The capture fields are the evidence, so a promise inserted **inside** `demo.ingest.output` is still exempt from the
guard: the third mutant prepends `Cited answers every question today` to that field and the guard answers `accepted`,
exit 0. What refuses it is the test: `draws the demo from the real run of the quick start` fails, exit 1, because the
line is not in the quick start block of `README.md`. The exemption is therefore closed over exact routes and over the
published run for the output, and over exact routes and the content of its own capture for every drawn line. It is
recorded as a RISK in the delivery: the guard alone cannot tell a captured line from a fabricated one, and the record
is protected by the test, not by the writer.

## Issues

### BROKEN

None. The Major of `revision-community-03c.md` is closed: the prefix exclusion is gone from `honesty.mjs` and from
`tests/readme.test.ts`, a claim in a demo field that the run did not print turns the test red and makes the guard exit
non-zero, and the committed record is still accepted.

### RISK

1. **The capture fields are exempt by contract (owner: whoever edits a record by hand).** A promise written inside
   `demo.ingest.output` or `demo.search.output` passes the guard, because those fields are the evidence of the run. The
   test catches it against the quick start block of `README.md`, and the guard runs only inside the two renderers.
2. **The drawn lines are exempt by content (owner: whoever edits a record by hand).** The exemption is exact: a drawn
   line is exempt while it is a line of its own capture, so a handwritten line is read. If a future renderer trims or
   rewraps a drawn line, the guard refuses the write instead of hiding it.
3. **The rule of the page cited in `docs/` is still a heuristic (owner: whoever writes the documentation).** Unchanged
   by this round: it is the same RISK the second review round recorded.

### NOT DONE

1. **Section 10 (rename the GitHub repository, update the remote, prove the redirect)** stays reserved for Fable.
2. **The adversarial review of this round, the archive and the merge** wait for Fable and for the OK of Franc.
3. **The GitHub pipeline** did not run, because a push is forbidden here.

### UNKNOWN

1. **The verdict of the next review** on the exact exemption: a reviewer could ask for another source or another
   wording, or could call the capture fields a new blind spot.
2. **The state of the badge and of the redirect after 10.1.**
