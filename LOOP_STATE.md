# LOOP_STATE · Cited

STATUS: DONE
CHANGE: launch-hygiene (OpenSpec)
BRANCH: feature/launch-hygiene
BASE: 86b250f (main when the change started); contract in b42dfea
HEAD BEFORE THE CLOSING COMMIT: 4b25b4e ("Write the decisions the contract left open in design.md")
AGENT: DeepSeek (implementer), contract by Fable (b42dfea)
DATE: 2026-09-30

## Objective

Execute `openspec/changes/launch-hygiene/tasks.md` from step 1.1 to step 9.1 and nothing else: steps 0, 9.2, 9.3 and
9.4 are not mine. Tests first, red before each fix, one real report per `[x]` inside the change, small commits, gitleaks
on every commit, no push, no remote, no archive, no commit on `main`, no edit of the text of the tasks, of `design.md`
or of the specs.

## Progress

- **1.1**: the base of `b42dfea` (`npm ci`, 85 files and 1018 tests, `tsc --noEmit` 0 errors, the three agent paths at
  mode `120000`); report `reports/2026-09-30-step-1-base.md`, box in `acea07f`.
- **2.1**: `tests/agent-copies.test.ts` red in `9c983c0` (5 of 6 cases fail: the three folders are text files, the
  index carries `120000`, there is no `agents:sync`, the sync script is missing); the sixth case is the synthetic
  fixture of a drifted copy.
- **2.2**: `tests/third-party-notices.test.ts` red in `0b7e34e` (the section `## Installed by npm, not shipped` does
  not exist), with the version and the license read from `package-lock.json`.
- **3.1**: `scripts/sync-agents.mjs`, the `agents:sync` script and the three links replaced by nine regular files of
  the blobs of `ai-specs/agents/` in `12c77bb`; the case of `tests/personal-paths.test.ts` that asserted the link of
  the repository is red from here to 4.1, as expected; report and box in `da6f993`.
- **3.2**: the copies already carry `text: auto` and `eol: lf` from `* text=auto eol=lf`, so `.gitattributes` is not
  touched; report and box in `9da9a62`.
- **3.3**: the section of `THIRD_PARTY_NOTICES.md` with `@img/sharp-libvips-*` 1.3.4 `LGPL-3.0-or-later`, the platform
  binding, the folder of the license text and the statement that nothing links or ships them, in `4c622fd`; report and
  box in `7416632`.
- **4.1**: the link case of `tests/personal-paths.test.ts` reads a fixture the file builds itself and the head of the
  file says the repository tracks no link any more, in `8723512`; report and box in `181f2a3`.
- **5.1**: typecheck, lint, 86 files and 1026 tests, the build of a clean clone without `.env`, gitleaks and
  `openspec validate --all --strict` (14 of 14); report `reports/2026-09-30-step-5-checks.md`, box in `f18d03e`.
- **6.1**: a Windows clone with `core.symlinks=false` and a clone inside `node:24`, both with the three folders, and the
  one command of Codex (`codex exec --skip-git-repo-check "List the files of .codex/agents" < NUL`) loading its
  configuration without `os error 267` and answering with the three files; report
  `reports/2026-09-30-step-6-clones.md`, box in `4e4e2f2`.
- **7.1**: not applicable (the diff carries no file under `app/`, `components/`, `e2e/`, `public/` or `lib/`); report,
  box in `e6c7515`.
- **8.1**: `docs/development-guide.md`, `CONTRIBUTING.md`, and the two documents that still called the copies links
  (`docs/base-standards.md`, `ai-specs/README.md`), in `8648852`; report and box in `e6d4aa7`.
- **9.1**: the decisions under "Decisions taken by the implementer" of `design.md` in `4b25b4e` and the `## Issues` at
  the end of `reports/2026-09-30-step-9-issues.md`, with the box and this state in the closing commit.

Every box of sections 1 to 9.1 is marked with its report inside the change, and every report names the commit it
validates. Boxes 9.2, 9.3 and 9.4 stay open: they are not mine.

## Evidence

- 86 files and 1026 tests passed on `4b25b4e` twice (82.37 s and 84.16 s) and on `181f2a3` once (77.74 s); the base of
  the change had 85 files and 1018 tests. One earlier run of the close lost a worker to the native code `0xC0000005` in
  `tests/voice-owner-words.test.ts`, a file this change does not touch; it is written in the report of step 9.
- `npm run typecheck`, `npm run lint`, `npm run secrets:scan` (8.01 MB, no leaks) and `npm run openspec:validate`
  (14 of 14) at exit 0, and `npm run build` compiled in 13.1 s in a clean clone with no `.env` and no `.env.local`.
- The nine copies carry the blobs `a115c754`, `024fc48c` and `79ea116d` of `ai-specs/agents/`, `git ls-files -s` lists
  no path with mode `120000`, and the SHA-256 of the source and of the three copies in the `node:24` clone is one
  single value.
- Codex loaded its configuration in the Windows clone of `f18d03e` and listed `.codex/agents`; the string `267` and the
  string `os error` appear in none of the 266 lines of its run.

## Hard rules respected

- No `.env` file with secrets was opened and no `.env` exists in the worktree or in the clones; no push, no remote, no
  commit on `main`, no archive; `MEMORY.md` is in no commit; the worktrees `community`, `community-ins`, `community-ui`,
  `community-main`, `community-preview` and `community-2zc` were not touched, and no process of another session was
  stopped.
- No personal path in a versioned file (the reports write `<worktree>`, `<clean clone>` and `<home>`); UTF-8 with LF.
- Every commit of the round passed gitleaks through the pre-commit hook, and `npm run secrets:scan` closed the change
  with no leak.
