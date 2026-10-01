# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: launch-hygiene (OpenSpec), Amendment 1 (decisions 5 to 9 of `design.md`)
BRANCH: feature/launch-hygiene
BASE: 518a117 (the close of round 1); the amended contract is 765abea
AGENT: DeepSeek (implementer), amendment by Fable (765abea)
DATE: 2026-10-01

## Objective

Execute only steps 10.1 to 10.4 of `openspec/changes/launch-hygiene/tasks.md`: tests first and red on `518a117`, the
notice section of decisions 5 to 7 with both addresses checked, the sync of decision 9, and the checks of 10.4 with the
`## Issues` of the round and the section "Ronda 2" of the delivery. The sections 0 to 9 are closed and are not touched,
and the text of the tasks, of `design.md` and of the specs is not edited.

## Progress

- **10.1**: the two guards are red on `518a117` (6 of 17 cases fail: five of the row-by-row guard of the notice and the
  refusal of the sync before a junction that leaves the root); report `reports/2026-09-30-step-10-1-red.md`, box in this
  commit.
- **10.2**: the section of decisions 5 to 7 has one row per LGPL package of the lock (fourteen), says the packages carry
  the name of their license and no license text of it, links the official LGPL-3.0 text and the sharp-libvips project,
  and states the use of sharp as a fact, in `01f9894`; `tests/third-party-notices.test.ts` is green with 9 of 9. The
  sharp-libvips address answers 200 with `curl.exe`; `https://www.gnu.org/licenses/lgpl-3.0.html` could not be checked
  from this machine (its network cuts the TLS handshake, `curl` exit 35), written in the report as an UNKNOWN; report
  `reports/2026-09-30-step-10-2-notice.md`, box in this commit.
- **10.3**: `scripts/sync-agents.mjs` resolves the real path of every folder it deletes or writes and refuses one that
  falls outside the root before touching it, in `191343f`; the junction case is green and the eight cases of
  `tests/agent-copies.test.ts` pass; report `reports/2026-09-30-step-10-3-sync.md`, box in this commit.
- **10.4**: pending.

## Evidence

- The suite of the two files of step 10.1 on `518a117`: `Tests 6 failed | 11 passed (17)`, exit 1, with the Node v24.21.0
  that `npx -y -p node@24` resolves for Vitest and the Node v24.11.0 of the PATH.

## Hard rules respected

- No `.env` file with secrets is opened; no push, no remote, no commit on `main`, no archive; `MEMORY.md` is in no
  commit; the worktrees `community`, `community-ins`, `community-ui`, `community-main`, `community-preview` and
  `community-2zc` are not touched, and no process of another session is stopped.
- No personal path in a versioned file (the reports write `<worktree>`, `<clean clone>` and `<home>`); UTF-8 with LF.
