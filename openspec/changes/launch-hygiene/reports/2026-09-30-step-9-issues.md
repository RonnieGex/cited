# Step 9 · The close of the change

Task of `tasks.md`: "`## Issues` at the end of the last report, with the decisions taken by the implementer".

The tree this report verifies is `4b25b4e` ("Write the decisions the contract left open in `design.md`"), which is the
documentation of step 8.1 (`8648852`) plus the decisions, with `git status --short` empty in the worktree
`<worktree>`. The closing commit carries this report, the box of 9.1 and the state of the loop; the product and the
tests it measures are the ones of the commits each report names.

## The checks of the close

Windows, in the worktree `<worktree>`, with the Node 24.21.0 that `npx -y -p node@24` resolves for Vitest and the Node
v24.11.0 of the PATH for the npm scripts:

| Command | Result | Commit |
| --- | --- | --- |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run`, after the crash | 86 files, 1026 tests passed, 82.37 s, exit 0 | `4b25b4e` |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run`, third run | 86 files, 1026 tests passed, 84.16 s, exit 0 | `4b25b4e` |
| `npm run typecheck` | exit 0, "Types generated successfully" | `4b25b4e` |
| `npm run lint` | exit 0, no output | `8648852` |
| `npm run secrets:scan` | exit 0, 8.01 MB scanned, "no leaks found" | `4b25b4e` |
| `npm run openspec:validate` | exit 0, "Totals: 14 passed, 0 failed (14 items)" | `4b25b4e` |

The first run of the close was **not** green: one worker of Vitest died with the native code `0xC0000005` while running
`tests/voice-owner-words.test.ts`, a file this change does not touch, and the run reported `85 passed (86)` and
`1024 passed (1026)` with the unhandled error `[vitest-pool]: Worker forks emitted error`. The two runs after it, which
the table shows, are green with 1026 of 1026, and the run of step 5.1 on `181f2a3` was green with the same counts. It
is written here as it happened; the crash is a worker of the environment and not a case of this change.

## The decisions taken by the implementer

They are written in the section "Decisions taken by the implementer" of `design.md`, in the commit `4b25b4e`, and they
are the ones of the `## Issues` below: the root argument of the sync, the comparison inside the test file, the
untouched `.gitattributes`, the second row of the notice and the wording of its guard, the fixture of
`tests/personal-paths.test.ts`, the two documents corrected beyond the Impact list, the `.cmd` wrapper of the Codex
command and the form of the Vitest command on Windows.

## The change in one line

Three symbolic links of the index became real folders with byte-for-byte copies of `ai-specs/agents/` written by
`npm run agents:sync` and guarded by `tests/agent-copies.test.ts` (six cases, five of them red before the fix), and
`THIRD_PARTY_NOTICES.md` gained the section that names the prebuilt binaries of sharp, their `LGPL-3.0-or-later`, the
version 1.3.4 of `package-lock.json` and where their license text travels, guarded by two cases of
`tests/third-party-notices.test.ts` (one red before the fix). A Windows clone with `core.symlinks=false` and a clone
inside `node:24` both carry the three folders, and Codex loads its configuration in the first one and answers with the
list of `.codex/agents` without `os error 267`.

## Issues

- **BROKEN**: none. Every case that was red before a fix is green in the two runs of the close, and the build of a
  clean clone without `.env` compiles.
- **RISK**: `docs/katalis-sdd-standard.md:40` still asks, in the bootstrap of a new project, to verify the symlinks of
  `.claude/`, `.codex/` and `.cursor/` toward `ai-specs/`. This change makes Cited's folders real folders on every
  platform, and that line is the rule of the suite and not of this repository alone, so it was not edited: Fable and
  Franc decide whether the standard changes with it. Until then a project bootstrapped by the standard keeps the defect
  of item 2p. The change ships the fix of Cited and the recipe (`scripts/sync-agents.mjs`) for any other repository.
- **RISK**: one Vitest worker crashed once during the close with the native code `0xC0000005`
  (`tests/voice-owner-words.test.ts`, a file this change does not touch) and the two runs around it were green. If the
  pipeline reproduces it, it is not from this change, but it is a flake of the suite and it is written down here.
- **RISK**: a fork or a contributor that edits `.claude/agents/`, `.codex/agents/` or `.cursor/agents/` by hand fails
  `npm test`: the copies are written by `npm run agents:sync` and the source of truth is `ai-specs/agents/`. The
  documentation of step 8.1 says so in `CONTRIBUTING.md`, `docs/base-standards.md`, `docs/development-guide.md` and
  `ai-specs/README.md`.
- **RISK**: the four documents named above and `THIRD_PARTY_NOTICES.md` were updated beyond the three files the Impact
  list names; the notice follows the requirement of the delta exactly (a row for the pattern of the requirement plus a
  second row for the platform binding, so the version of the section is true on Windows too).
- **NOT DONE**: none of the steps of this round. Steps 9.2 (Fable pushes the branch and opens the pull request), 9.3
  (the independent adversarial review) and 9.4 (Franc accepts, the change is archived and merged) are not mine by the
  assignment and stay open, as do the boxes 9.2 to 9.4 of `tasks.md`.
- **UNKNOWN**: the file inside `@img/sharp-libvips-<platform>` that carries its LGPL text was not read on this machine,
  because `npm ci` installs only the binding of the platform (`@img/sharp-win32-x64` here, whose `LICENSE` was read and
  named in the second row). The path `node_modules/@img/sharp-libvips-<platform>/LICENSE` of the section comes from the
  layout the package publishes and from the requirement, not from a file of this checkout.
- **UNKNOWN**: the end-to-end suite of the browser was not run for this change (step 7.1 declares it not applicable,
  and the diff carries no file under `app/`, `components/`, `e2e/`, `public/` or `lib/`). Nothing of this change is
  verified through a browser, and nothing of it needs one.
