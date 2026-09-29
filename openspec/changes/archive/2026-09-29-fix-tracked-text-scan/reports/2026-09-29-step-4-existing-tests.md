# Step 4 report - fix-tracked-text-scan: review and update of the existing tests

- Date: 2026-09-29
- Change: fix-tracked-text-scan
- Agent: deepseek-harness
- Base of comparison: `3ff834f` (the three assertions as written) and `5b7fc46` (after the fix)

## Task 4.1 - the three assertions still hold

`tests/personal-paths.test.ts` had three assertions before the change and it still has them, with the same titles, the
same regular expressions and the same expectations. What changed is where the text of a tracked path comes from and
how the exemption list is written.

### 1. `are listed by git`

```
before:  const files = trackedFiles();
         expect(files.length).toBeGreaterThan(0);

after:   expect(trackedEntries(repositoryRoot).length).toBeGreaterThan(0);
```

The same expectation over the same set: every path git reports for the index. `trackedEntries` reads
`git ls-files -s -z` instead of `git ls-files -z`, so each item also carries its mode; the path list is identical.

### 2. `carry no home directory of a development machine`

```
before:  const offenders = files.filter((path) => {
           const text = textOf(path);
           return text !== null && homePath.test(text);
         });
         expect(offenders).toEqual([]);

after:   expect(offenders(repositoryRoot, homePath)).toEqual([]);
```

Same expression `homePath`, same `text !== null` guard, same `toEqual([])`. The filter moved into the `offenders`
helper; the regex lines are untouched by the diff. This assertion was **red on Linux** at the base (`EISDIR`) and is
green now on both platforms.

### 3. `carry no home directory prefix outside the change contract that states the rule`

```
before:  const offenders = files
           .filter((path) => !ruleDefiningContracts.includes(path))
           .filter((path) => {
             const text = textOf(path);
             return text !== null && homePrefix.test(text);
           });
         expect(offenders).toEqual([]);

after:   expect(offenders(repositoryRoot, homePrefix, ruleDefiningContracts)).toEqual([]);
```

Same expression `homePrefix`, same exemption by exact path, same `toEqual([])`. This assertion was **red on Windows**
at the base, on the archived contract, and is green now.

## What changed, exactly

| Change | Why |
|---|---|
| `trackedFiles()` becomes `trackedEntries()`, reading `git ls-files -s -z` | the mode of the path is what decides how to read it |
| `textOf(path)` becomes `textOf(root, entry)` with the helper `fileText(absolute)` | a link is read by its target, a regular file by its content, anything else is skipped |
| `textOfPath(root, path)` is new | the scenario test of the link needs the text of one known path |
| `offenders(root, pattern, exempt)` is new | the three assertions and the fixture scenarios share one scan |
| `ruleDefiningContracts` gains `openspec/changes/archive/2026-09-29-bootstrap/tasks.md` | the contract that states the rule moved to the archive with the same text |
| Fixture helpers (`git`, `write`, `fixtureRepo`, `gitDefaults`, `fixtureRoots`, `afterAll`) are new | the scenarios of the spec need a repository of their own, outside the project |
| The four new scenarios are added | they are the spec delta |

Nothing was weakened: no assertion was deleted, skipped or loosened; `homePath` and `homePrefix` are the same regular
expressions of the base (the diff does not touch those two lines); no path was added to the exemption list except the
archived copy of the very contract that already was exempt; and the two assertions of the base that the review of the
bootstrap change wrote still fail when a tracked file carries a home path, which the red runs of step 2 show.

## Result

```
npm test (Windows)                       -> Test Files  2 passed (2)
                                                 Tests  9 passed (9)
npm test (node:24 container, Linux)      -> Test Files  2 passed (2)
                                                 Tests  9 passed (9)
```

The file went from 3 assertions to 7 (the suite from 5 tests to 9): the three of the base and the four scenarios of
the spec delta.

## Verdict

PASS. The three existing assertions hold unchanged in meaning on both platforms, and what changed is documented
above.
