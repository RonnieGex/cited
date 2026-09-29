# Step 2 report - fix-tracked-text-scan: tests first

- Date: 2026-09-29
- Change: fix-tracked-text-scan
- Agent: deepseek-harness
- Container: `node:24` (Linux, Node v24.21.0), disposable: `--rm`, the repository mounted read-only at `/src`, a
  scratch directory of the host mounted at `/scripts`. Everything the container writes lives inside the container.
- Base of the red reproduction: `3ff834f` (`main`). Red of the new scenarios: `2c3e2ae`.

The commands of this report run from the repository root; `${PWD}` is that root.

## Task 2.1 - red on Linux over a fresh clone of `main`

```
docker run --rm \
  -v "${PWD}:/src:ro" \
  -v "<scratch>:/scripts:ro" \
  node:24 bash /scripts/red-main.sh
```

The scratch directory is outside the repository and holds a script that clones `/src` (a fresh clone, so the checkout
is a Linux one), installs the locked dependencies and runs the suite:

```bash
git clone --no-hardlinks --quiet --branch main /src /work/community
cd /work/community
ls -l .claude/agents .codex/agents .cursor/agents
npm ci --no-audit --no-fund
npm test
```

```
=== HEAD of the clone ===
3ff834f Archive the bootstrap change
=== the three entries of mode 120000, as the Linux runner checks them out ===
lrwxrwxrwx 1 root root 18 .claude/agents -> ../ai-specs/agents
lrwxrwxrwx 1 root root 18 .codex/agents -> ../ai-specs/agents
lrwxrwxrwx 1 root root 18 .cursor/agents -> ../ai-specs/agents
=== git ls-files -s for them ===
120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0	.claude/agents
120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0	.codex/agents
120000 31cca693efbc8a9812c7fd22e14757b7f8c14b38 0	.cursor/agents
=== npm ci ===
npm ci exit code: 0
=== npm test ===
 ❯ tests/personal-paths.test.ts (3 tests | 2 failed) 10ms
   ❯ tracked files (3)
     ✓ are listed by git 2ms
     × carry no home directory of a development machine 4ms
     × carry no home directory prefix outside the change contract that states the rule 1ms

 FAIL  tests/personal-paths.test.ts > tracked files > carry no home directory of a development machine
 Error: EISDIR: illegal operation on a directory, read
  ❯ textOf tests/personal-paths.test.ts:23:17
    23|   const bytes = readFileSync(resolve(repositoryRoot, path));

 FAIL  tests/personal-paths.test.ts > tracked files > carry no home directory prefix outside the change
       contract that states the rule
 Error: EISDIR: illegal operation on a directory, read
  ❯ textOf tests/personal-paths.test.ts:23:17

 Test Files  1 failed | 1 passed (2)
      Tests  2 failed | 3 passed (5)
npm test exit code: 1
```

This is the failure of the GitHub run of `main`, reproduced locally on Linux with the same two assertions and the same
`EISDIR` at the same line.

## Task 2.2 - the scenarios of the spec as tests, red first

Commit `2c3e2ae` (`test(fix-tracked-text-scan): add the cross-platform scan scenarios`) added the scenarios of the
spec delta to `tests/personal-paths.test.ts` and the fixture scaffolding they need: a throwaway Git repository in the
temporary directory of the operating system, with the paths of a case added to its index, plus a tracked symbolic link
that is forced into the index with mode `120000` (`git update-index --cacheinfo`), so the scenario is exercised on
Windows even where the checkout cannot create a real link.

The four scenarios added, all of them red before the fix except the binary one:

| Test | Scenario of the spec |
|---|---|
| `are read by the target of the link when git tracks them as a symbolic link` | A tracked symlink to a directory on Linux |
| `report a tracked symbolic link whose target carries a home directory` | A home path in a symlink target |
| `exempt the rule-defining contract at its active and archived path and report any other file with the prefix` | The archived contract |
| `skip a binary tracked file` | A binary file SHALL be skipped (requirement text) |

### Red on Windows (before the fix)

```
npm test
  -> ❯ tests/personal-paths.test.ts (7 tests | 3 failed) 845ms
       × carry no home directory prefix outside the change contract that states the rule 57ms
       × report a tracked symbolic link whose target carries a home directory 220ms
       × exempt the rule-defining contract at its active and archived path and report any other file with the
         prefix 132ms
     Tests  3 failed | 6 passed (9)

     FAIL ... > carry no home directory prefix outside the change contract that states the rule
     - []
     + [ "openspec/changes/archive/2026-09-29-bootstrap/tasks.md" ]

     FAIL ... > report a tracked symbolic link whose target carries a home directory
     Error: ENOENT: no such file or directory, open '<temp>\katalis-tracked-paths-<id>\docs\vault'

     FAIL ... > exempt the rule-defining contract at its active and archived path
     - [ "docs/notes.md" ]
     + [ "docs/notes.md", "openspec/changes/archive/2026-09-29-bootstrap/tasks.md" ]
```

### Red on Linux (before the fix)

```
docker run --rm -v "${PWD}:/src:ro" -v "<scratch>:/scripts:ro" node:24 \
  bash /scripts/branch-run.sh feature/fix-tracked-text-scan 'npm test'
  -> === HEAD of the clone ===
     2c3e2ae test(fix-tracked-text-scan): add the cross-platform scan scenarios
     === npm ci exit code: 0 ===
     ❯ tests/personal-paths.test.ts (7 tests | 5 failed) 364ms
       ✓ are listed by git
       × carry no home directory of a development machine
       × carry no home directory prefix outside the change contract that states the rule
       × are read by the target of the link when git tracks them as a symbolic link
       × report a tracked symbolic link whose target carries a home directory
       × exempt the rule-defining contract at its active and archived path and report any other file with the
         prefix
       ✓ skip a binary tracked file
     Tests  5 failed | 4 passed (9)

     Error: EISDIR: illegal operation on a directory, read     (three times, at textOf line 90)
     Error: ENOENT: no such file or directory, open '/tmp/katalis-tracked-paths-<id>/docs/vault'
     AssertionError: expected [ 'docs/notes.md', …(1) ] to deeply equal [ 'docs/notes.md' ]
       + "openspec/changes/archive/2026-09-29-bootstrap/tasks.md"
     === exit code: 1 ===
```

The `<temp>` and `<id>` placeholders stand for the temporary directory of the machine and the random suffix of the
fixture; they are elided here because a report is a tracked file and must not carry a home path itself.

## Verdict

PASS. The red of `main` is reproduced on Linux (two `EISDIR`) and the four new scenarios fail before the fix for the
two defects of the proposal: the scan reads a link as a directory, and the exemption list does not know the archived
path of the rule-defining contract.
