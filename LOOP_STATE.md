# LOOP_STATE · Cited

STATUS: DONE
CHANGE: launch-hygiene (OpenSpec), Amendment 1 (decisions 5 to 9 of `design.md`)
BRANCH: feature/launch-hygiene
BASE: 518a117 (the close of round 1); the amended contract is 765abea
AGENT: DeepSeek (implementer), amendment by Fable (765abea)
DATE: 2026-09-30

## Objective

Execute only steps 10.1 to 10.4 of `openspec/changes/launch-hygiene/tasks.md`: tests first and red on `518a117`, the
notice section of decisions 5 to 7 with both addresses checked, the sync of decision 9, and the checks of 10.4 with the
`## Issues` of the round and the section "Ronda 2" of the delivery. The sections 0 to 9 were not touched, and neither
was the text of the tasks, of `design.md` or of the specs.

## Progress

- **10.1**: the two guards are red on `518a117` (6 of 17 cases fail: five of the row-by-row guard of the notice and the
  refusal of the sync before a junction that leaves the root) in `4574c5c`; report
  `reports/2026-09-30-step-10-1-red.md`.
- **10.2**: the section of decisions 5 to 7 has one row per LGPL package of the lock (fourteen), says the packages carry
  the name of their license and no license text of it, links the official LGPL-3.0 text and the sharp-libvips project,
  and states the use of sharp as a fact, in `01f9894`; `tests/third-party-notices.test.ts` is green with 9 of 9. The
  sharp-libvips address answers 200 with `curl.exe`; `https://www.gnu.org/licenses/lgpl-3.0.html` could not be checked
  from this machine (its network cuts the TLS handshake, `curl` exit 35), written in the report as an UNKNOWN; report
  `reports/2026-09-30-step-10-2-notice.md`, box in `e78cc10`.
- **10.3**: `scripts/sync-agents.mjs` resolves the real path of every folder it deletes or writes and refuses one that
  falls outside the root before touching it, in `191343f`; the junction case is green and the eight cases of
  `tests/agent-copies.test.ts` pass; report `reports/2026-09-30-step-10-3-sync.md`, box in `e3ab487`.
- **10.4**: `npm run typecheck`, `npm run lint`, `npx -y -p node@24 node node_modules/vitest/vitest.mjs run`,
  `npm run build` in a clean clone without `.env`, `npm run secrets:scan` and `npm run openspec:validate`, all at exit 0
  on `e3ab487`; report `reports/2026-09-30-step-10-amendment.md` with the `## Issues` of the round, the box and this
  state in the closing commit, and the section "Ronda 2" of the delivery.

Step 10.5 (Fable pushes, an independent review, Franc accepts) is not mine and its box stays open.

## Evidence

- The suite of the two files of step 10.1 on `518a117`: `Tests 6 failed | 11 passed (17)`, exit 1, with the Node v24.21.0
  that `npx -y -p node@24` resolves for Vitest 5.0.2 and the Node v24.11.0 of the PATH.
- The suite of the round on `e3ab487`: 86 files, 1031 tests passed in 79.89 s, exit 0 (1026 tests in the same 86 files
  on `518a117`). `tests/third-party-notices.test.ts` 9 of 9 and `tests/agent-copies.test.ts` 8 of 8.
- `npm run typecheck` exit 0 ("Types generated successfully"), `npm run lint` exit 0, `npm run secrets:scan` exit 0
  (621 commits, 8.10 MB, "no leaks found") and `npm run openspec:validate` exit 0 (14 of 14).
- The build of a clean clone of `e3ab487` with no `.env` and no `.env.local`: `npm ci` added 693 packages, the build
  compiled in 10.5 s with 30 of 30 static pages, exit 0, and `git status --short` was empty after it.
- The section of the notice was checked against the lock (26 `@img/sharp-*` entries, 14 of them with `LGPL` in
  `license`), against the installed packages, against the README of the binding and of a libvips package, and against
  the tarballs (`npm pack --dry-run`): the libvips packages ship no license text and the bindings ship the Apache-2.0
  one, which is what the section says.
- The sync was checked by hand besides the test: a junction outside the root is refused (exit 1) and the folder outside
  keeps its file, a junction of `.claude/agents` to `ai-specs/agents` is replaced by a real folder with the source
  intact, and the guards of a missing source and of an empty source still refuse (exit 1).
- Every commit of the round passed gitleaks through the pre-commit hook, and `npm run secrets:scan` closed it with no
  leak.

## Hard rules respected

- No `.env` file with secrets was opened and no `.env` exists in the worktree or in the clone (the clone was created
  without one and the build ran without one); no push, no remote, no commit on `main`, no archive; `MEMORY.md` is in no
  commit; the worktrees `community`, `community-ins`, `community-ui`, `community-main`, `community-preview` and
  `community-2zc` were not touched, and no process of another session was stopped.
- No personal path in a versioned file (the reports write `<worktree>`, `<clean clone>` and `<home>`); UTF-8 with LF.
