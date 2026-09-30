# Step 0 — the branch and the base

- Date: 2026-09-29
- Change: `elevenlabs-voice-agent` (OpenSpec)
- Branch: `feature/elevenlabs-voice-agent`, in the worktree `katalis-dev/community`
- Agent: deepseek-harness
- Contract: `openspec/changes/elevenlabs-voice-agent/tasks.md`, written by Fable (2026-09-29)
- Task: 0.1

## What the task asks

Work on `feature/elevenlabs-voice-agent`, created by Fable from `main` after the admin panel and the public page;
confirm branch and base; `npm ci`.

## Commands and real output

### The branch and its base

```
$ git rev-parse --abbrev-ref HEAD
feature/elevenlabs-voice-agent

$ git rev-parse HEAD
d7a276eb855a27844256ad9d8e0b14839898fbef

$ git rev-parse main
21ad3b9c9b40c7458e9ea61acd43ec7c60449c22

$ git merge-base main HEAD
21ad3b9c9b40c7458e9ea61acd43ec7c60449c22

$ git worktree list
(the three worktrees of the suite, one line each; the paths of the machine are left out of this report, as the rule
of `tests/personal-paths.test.ts` asks: this lane is `community` at `d7a276e`, the parallel lane is `community-ins` at
`b9cedbd` and `main` is checked out in `community-ui` at `21ad3b9`)

$ git status --porcelain
(no line)
```

The branch is the one the contract names, the merge base of `main` and this branch is `21ad3b9`
("Merge admin-panel-and-onboarding"), which is exactly the base Fable declared, and the head of the branch is `d7a276e`
("Specify the ElevenLabs voice agent, English first"), the contract itself. `main` is checked out in the
`community-ui` worktree and this lane never writes to it. The other worktree, `community-ins`, carries the parallel
lane of the feedback and the insights; it is read only here.

### `npm ci`

```
$ npm ci
added 626 packages, and audited 633 packages in 18s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

The install exits `0` with 626 packages and 0 vulnerabilities, the same count the previous lane recorded. Node and npm
of this machine are `v24.11.0` and `11.6.1`; the `engines` field asks for `>=24.15.0 <25.0.0`, so npm prints
`EBADENGINE` warnings for the project and for four packages of the test tree (jsdom and its dependencies) and installs
anyway. That difference is a property of the machine, not of this change, and it is the same one every previous round
of this repository ran on. `npm ci` also printed a `npm warn cleanup` about a directory it could not remove inside
`node_modules/@unrs/resolver-binding-wasm32-wasi`, which does not affect the exit code.

The warnings are named here because a report never says that something ran clean when it did not.

## Verdict

Task 0.1 is done: the branch and the base are the ones the contract declares, and the dependencies install from the
lock file with the exact command the standard names.

## Commit

`d7a276e` is the contract this report was verified against; the report, `LOOP_STATE.md` in `RUNNING` and the empty
`reports/` folder of the change travel in the commit that closes step 0.
