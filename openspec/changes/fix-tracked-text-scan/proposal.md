## Why

The first CI run of `main` (`3ff834f`) on GitHub failed in the job Unit tests, with
`EISDIR: illegal operation on a directory, read` in `tests/personal-paths.test.ts:23` (twice).

The test reads every tracked path with `readFileSync`. Three tracked paths are symlinks to directories:
`.claude/agents`, `.codex/agents` and `.cursor/agents` (mode `120000`). On Linux they are checked out as real links, so
reading them reads a directory. On the author's Windows checkout (`core.symlinks=false`) they are plain text files, so
the test passed locally and the defect only showed in CI.

A second defect hides behind the first. The exception list names `openspec/changes/bootstrap/tasks.md`, the contract
that states the rule. The archive moved that contract to `openspec/changes/archive/2026-09-29-bootstrap/tasks.md`, so
once the first defect is fixed the second test would flag the archived contract.

## What Changes

- The scan decides what to read from git's own mode, not the working tree:
  - a symlink (`120000`) is checked by its link target text;
  - a regular file is read as today;
  - anything else is skipped.
- The exception matches the contract that states the rule at its active path and at its archived path.
- The CI of `main` goes green on GitHub.

## Impact

- Changed: `tests/personal-paths.test.ts`.
- No application code changes.
