# Step 2.1 · The guard of the agent folders, red before the fix

Task of `tasks.md`: "`tests/agent-copies.test.ts`: the three folders hold the files of `ai-specs/agents/` byte for byte,
and git tracks no path with mode `120000`; plus a case that builds a drifted copy in a temporary folder and expects the
check to name the folder and the file (scenarios 'A Windows clone…' and 'A copy that drifts')".

The code this report verifies is the base of the change, `b42dfea` ("Contract of launch-hygiene: real agent folders and
the notice of sharp"): the only commits after it carry `LOOP_STATE.md` and the report of step 1.1, and no production
file has changed. The test file of this step is the only code of the commit that closes it.

## The command and its result

Windows, in the worktree `<worktree>`, with the Node 24.21.0 that `npx -y -p node@24` resolves:

```
npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/agent-copies.test.ts
```

```
 ❯ tests/agent-copies.test.ts (6 tests | 5 failed) 129ms
 Test Files  1 failed (1)
      Tests  5 failed | 1 passed (6)
   Duration  458ms
exit=1
```

## The five cases that are red on `b42dfea`

| Case | Failure |
| --- | --- |
| hold every file of `ai-specs/agents` byte for byte and nothing else | `[".claude/agents: is not a folder", ".codex/agents: is not a folder", ".cursor/agents: is not a folder"]` |
| are folders of the working tree, not symlinks and not files | `.claude/agents: expected false to be true` |
| carry mode 100644 in the index, and no path of the repository carries mode 120000 | `expected [ '.claude/agents', …(2) ] to deeply equal []` |
| keep the sync as the script of `npm run agents:sync` | `expected undefined to be 'node scripts/sync-agents.mjs'` |
| write the three copies from the source on every run of the sync | `Cannot find module '<worktree>\scripts\sync-agents.mjs'` |

The sixth case, "name the folder and the file of a copy that drifts", is green before the fix by construction: it builds
its own temporary tree with a missing file, an extra file and a file of different bytes, and it asserts that the same
comparison the first case uses on the repository returns the three lines that name the folder and the file. It is the
unit half of scenario "A copy that drifts"; the repository half is the first case, which is red. The red is therefore
in the check of the repository and in the sync, which is where the defect of item 2p lives.

## Verdict

Red, and for the reason of the change: on `b42dfea` the three paths are symbolic links in the index (mode `120000`),
this Windows checkout materialises them as text files, there is no `npm run agents:sync`, and no test compared the
folders with `ai-specs/agents/`.
