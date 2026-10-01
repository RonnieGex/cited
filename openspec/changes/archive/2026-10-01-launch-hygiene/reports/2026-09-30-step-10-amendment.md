# Step 10.4 · The checks of Amendment 1

Task of `tasks.md`: "`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run secrets:scan`,
`npm run openspec:validate`, in `reports/<date>-step-10-amendment.md` naming the commit verified, with the `## Issues`
of the round there and in the section 'Ronda 2' of the delivery".

The code this report verifies is `e3ab487` ("Mark step 10.3 with the sync of `191343f`"), which is the sync of
`191343f` plus the report and the box of step 10.3; the code of the round is the notice of `01f9894`, the sync of
`191343f` and the tests and the reports of the boxes 10.1 to 10.3. `git status --short` is empty in the worktree
`<worktree>` before the run, and the build ran in a clean clone of the branch with no `.env` and no `.env.local`.

## The checks

Windows, in the worktree `<worktree>`, with the Node v24.21.0 that `npx -y -p node@24` resolves for Vitest 5.0.2 and the
Node v24.11.0 of the PATH for the npm scripts. `ANTHROPIC_BASE_URL` is set and not empty in this shell, so nothing was
removed from the environment:

| Command | Result | Commit |
| --- | --- | --- |
| `npm run typecheck` (`next typegen && tsc --noEmit`) | exit 0, "Types generated successfully", 0 errors | `e3ab487` |
| `npm run lint` (`eslint .`) | exit 0, no output, 0 errors and 0 warnings | `e3ab487` |
| `npx -y -p node@24 node node_modules/vitest/vitest.mjs run` (what `npm test` runs) | 86 files, 1031 tests passed, 79.89 s, exit 0 | `e3ab487` |
| `npm run secrets:scan` (`gitleaks git --redact --no-banner`) | exit 0, 621 commits scanned, 8.10 MB, "no leaks found" | `e3ab487` |
| `npm run openspec:validate` (`openspec validate --all --strict`) | exit 0, "Totals: 14 passed, 0 failed (14 items)" | `e3ab487` |

The suite grew from 86 files and 1026 tests of `518a117` to 86 files and 1031 tests: the two new cases of
`tests/agent-copies.test.ts` (8 in the file) and the three new cases of `tests/third-party-notices.test.ts` (9 in the
file). The six cases that were red on `518a117` (step 10.1) are green here, and no other file of the suite changed its
count.

## The build, in a clean clone without `.env`

```
git -c core.symlinks=false clone --quiet --branch feature/launch-hygiene --single-branch <worktree> <clean clone>
git -C <clean clone> rev-parse HEAD
e3ab4870ecd2e61e5d6070f31ad07f5c39dddf09
Test-Path <clean clone>/.env        -> False
Test-Path <clean clone>/.env.local  -> False
Get-ChildItem <clean clone>/.codex/agents
backend-developer.md, frontend-developer.md, product-strategy-analyst.md
```

```
cd <clean clone> && npm ci --no-audit --no-fund
added 693 packages in 38s
exit=0
```

```
cd <clean clone> && npm run build          (after removing .next, so the build is from scratch)
▲ Next.js 16.3.6 (Turbopack)
✓ Compiled successfully in 10.5s
  Finished TypeScript in 11.7s ...
✓ Generating static pages using 15 workers (30/30) in 986ms
exit=0
```

`git -C <clean clone> status --short` is empty after the build, so the build wrote no tracked file, and the clone
carried no environment file of any kind. No `.env.local` was opened anywhere in this round.

## What the round changed

`git diff --stat 765abea..HEAD` at the close: `THIRD_PARTY_NOTICES.md` (51 lines), `scripts/sync-agents.mjs` (26),
`tests/agent-copies.test.ts` (94), `tests/third-party-notices.test.ts` (202), the three reports, `tasks.md` (only the
four boxes of section 10) and `LOOP_STATE.md`. `design.md`, `proposal.md` and the deltas of `supply-chain-security` and
`repository-bootstrap` are untouched by this round: the contract is the one of `765abea`.

## Issues

- **BROKEN**: none. Every case that was red on `518a117` is green on `e3ab487`, the suite passes with 1031 of 1031, the
  production build compiles in a clean clone without `.env`, and gitleaks found no leak in 621 commits.
- **RISK**: the address `https://www.gnu.org/licenses/lgpl-3.0.html` of decision 6 could not be checked with `curl.exe`
  from this machine: the name resolves and the port 443 accepts a connection, but every TLS attempt dies before the
  handshake (`curl: (35) schannel: failed to receive handshake`, exit 35) with `-4`, `--tlsv1.2`, `--tlsv1.3`,
  `--tls-max 1.2`, `-k`, `--http1.1`, `--ssl-no-revoke` and the `curl.exe` of Git for Windows, the `http://` address
  answers `curl: (52) Empty reply from server`, and a `fetch` of Node 24 fails with a connect timeout. The other
  address, `https://github.com/lovell/sharp-libvips`, answers 200. The URL that could not be checked is the one the
  delta mandates, so it stays in the section; the check is the only thing the machine's network blocked.
- **RISK**: the sentence of the section about where the name of the license travels (the `license` field and the
  "Licensing" table of the `README.md`) is not guarded by the test: the guard checks the rows of the table, the two
  addresses, the three scripts, `optional dependency`, `does not ship` and the absence of `links against`, so the
  sentence about the README could go stale without a red test. This round verified it against the installed packages
  and against the registry (`npm view @img/sharp-libvips-linux-x64@1.3.4 readme`), and the review verified all ten
  libvips packages; a change of layout upstream would need a new look, not a new test run.
- **RISK**: `docs/answering.md:226` still says "no code of this repository links against those binaries" (MENOR-4 of
  the review). The sentence predates this change, the Impact list does not name that file and decision 7 scoped the drop
  to the section of the notices, which no longer says it; the guard only reads the section. Whether that line of
  `docs/answering.md` changes is a decision of Fable and Franc, and it is left as it was.
- **RISK**: the section is only as true as the lock: when `next` moves `sharp`, the guard of
  `tests/third-party-notices.test.ts` fails naming the package whose row is missing, extra or different, and the
  fourteen rows have to be updated with the version and the license the lock records. That is the point of decision 8,
  written here so the next bump expects it.
- **NOT DONE**: nothing of my round. Step 10.5 (Fable pushes, an independent review in
  `katalis-dev/tasks/revision-launch-hygiene-b.md`, Franc accepts) is not mine and its box stays open in `tasks.md`, as
  do the boxes 9.2 to 9.4 of the close of round 1.
- **UNKNOWN**: whether the CI of the repository runs the suite on Linux for this branch was not observed: the round ran
  on Windows, and the junction case of `tests/agent-copies.test.ts` uses `"junction"` on Windows and `"dir"` on the
  other platforms. The rest of the round is platform-independent (the tests read the working tree, and the row-by-row
  guard reads `package-lock.json`).

## Verdict

Every check of the task passes on `e3ab487`, the suite has 1031 tests in 86 files, and the production build compiles in
a clean clone that carries no environment file. Verified locally; nothing of this step depends on a pipeline.
