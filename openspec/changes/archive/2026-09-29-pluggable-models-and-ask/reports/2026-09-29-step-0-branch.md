# Step 0 - The branch

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Base: `main` at `aa52b7c` ("Merge cited-identity-and-readme")
- Agent: `deepseek-harness`
- Commit verified against: `77a21ad` ("Specify the answers with citations of Cited")

## Commands and real output

```
> git rev-parse --abbrev-ref HEAD
feature/pluggable-models-and-ask

> git rev-parse HEAD
77a21ad776d72010953784be64ff5264067d4df0

> git rev-parse main
aa52b7ca7145ba62086f05dfe6f4546af033c554

> git merge-base --is-ancestor main HEAD
merge-base --is-ancestor main HEAD exit: 0

> git log --oneline main..HEAD
77a21ad Specify the answers with citations of Cited

> git status --short
 M LOOP_STATE.md

> git status --branch
## feature/pluggable-models-and-ask
 M LOOP_STATE.md

> node --version
v24.11.0

> npm --version
11.6.1
```

The base of the contract (`aa52b7c`) is an ancestor of the branch head, and the only commit of the branch on top of
`main` is the contract written by Fable. The working tree was clean when this step started; the single modified file is
`LOOP_STATE.md`, which this execution sets to `RUNNING` as its contract asks. `git status --branch` carries no upstream
divergence line and the remote was never contacted: no fetch, no push.

## `npm ci`

```
> npm ci
added 609 packages, and audited 616 packages in 24s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

npm warn cleanup Failed to remove some directories [
npm warn cleanup   [
npm warn cleanup     '...\node_modules\@unrs\resolver-binding-wasm32-wasi\node_modules\@emnapi\wasi-threads',
npm warn cleanup     [Error: EPERM: operation not permitted, rmdir '...\wasi-threads'] { errno: -4048, code: 'EPERM', syscall: 'rmdir' }
npm warn cleanup   ]
npm warn cleanup ]
```

`npm ci` exited 0. The `EPERM` line is the cleanup warning of npm on Windows when it removes the previous
`node_modules` of a package it no longer needs; the installation itself finished with `found 0 vulnerabilities` and the
suite ran afterwards (`reports/2026-09-29-step-1-base-before.md`), so the tree of packages is complete.

## Verdict

PASS. The branch and its base are confirmed: `feature/pluggable-models-and-ask` over `main` at `aa52b7c`, with the
contract of Fable (`77a21ad`) as the only commit of the branch, and the declared dependencies installed by `npm ci`.
