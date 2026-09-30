# Step 0.1: the branch and the install

- Date: 2026-09-29
- Change: `provider-keys-in-panel`
- Branch: `feature/provider-keys-in-panel`
- Agent: deepseek-harness
- Task: 0.1

## Command and output

```
$ git status --short --branch
## feature/provider-keys-in-panel

$ git rev-parse --abbrev-ref HEAD
feature/provider-keys-in-panel

$ git rev-parse HEAD
71f08f0925bb462fecfcb90ac1ec687a8d5cd56c

$ git rev-parse main
c07640b09c19b632c9882e2d331791b2e57aa33d

$ git merge-base HEAD main
c07640b09c19b632c9882e2d331791b2e57aa33d

$ node --version
v24.11.0

$ npm --version
11.6.1

$ npm ci
added 626 packages, and audited 633 packages in 24s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

`npm ci` printed `npm warn EBADENGINE` for the local Node `v24.11.0`, which is below the `>=24.15.0` of
`package.json`. The install completed with exit code 0, the warning names the machine and not the lockfile, and the
`node:24` container of step 5 carries a version inside the range.

## Verdict

The worktree is on `feature/provider-keys-in-panel`, whose base is `main` at `c07640b` and whose head is the commit of
the contract, `71f08f0`; the merge base is the base itself, so nothing else has been merged into the branch. The
dependencies install clean from the lockfile with `npm ci`. Task 0.1 is done.
