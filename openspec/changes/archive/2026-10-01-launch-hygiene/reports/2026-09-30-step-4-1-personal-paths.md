# Step 4.1 · The existing test of personal paths

Task of `tasks.md`: "`tests/personal-paths.test.ts` keeps passing with its own link fixtures; its notes updated
(decision 3)".

The code this report verifies is `8723512` ("Read the link of personal-paths from its own fixture and note that no link
is tracked"), in the branch `feature/launch-hygiene` of the worktree `<worktree>`. The commit that closes this step
adds this report and the box, and changes nothing of the code below.

## What the commit carries

- The case that read the repository, "are read by the target of the link when git tracks them as a symbolic link",
  becomes a case over a repository the test builds itself: it writes `ai-specs/agents/backend-developer.md`, links
  `.codex/agents` to `../ai-specs/agents` through the `fixtureRepo` helper of the file, and then asserts that
  `git ls-files -s` reports mode `120000` for the path and that the scan reads its target. The rest of the file, the
  four fixture cases that were already there and the three cases over the repository, is not touched.
- A note at the head of the file says that the change `launch-hygiene` left the repository with no symbolic link,
  that the three agent folders are real folders with copies of `ai-specs/agents/` guarded by
  `tests/agent-copies.test.ts`, and that the link cases of this file are its own fixtures.

The case that became red on `12c77bb` (the commit of the sync) is green here; the red was expected between 3.1 and 4.1
and it is reported in `2026-09-30-step-3-1-sync.md`.

## Evidence

Windows, in the worktree `<worktree>`, with the Node 24.21.0 that `npx -y -p node@24` resolves:

| Command | Result | Commit |
| --- | --- | --- |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/personal-paths.test.ts tests/agent-copies.test.ts` | 2 files, 13 tests passed, 1.94 s, exit 0 | `8723512` |
| `npx -y -p node@24 node node_modules/eslint/bin/eslint.js tests/personal-paths.test.ts tests/agent-copies.test.ts tests/third-party-notices.test.ts scripts/sync-agents.mjs` | 0 problems, no output, exit 0 | `8723512` |

Before the commit, the same two files gave `tests/personal-paths.test.ts (7 tests | 1 failed)` with
`AssertionError: expected undefined to be '120000'`; the seven cases pass now, with the link case reading a fixture
that the test owns.

## Verdict

`tests/personal-paths.test.ts` reads the mode of every tracked path, and its link cases are its own fixtures, so the
file passes on `8723512` without the repository tracking a link. Verified.
