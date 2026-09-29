# Step 0: the branch

- Date: 2026-09-29
- Change: `public-page-and-widget`
- Branch: `feature/public-page-and-widget`
- Agent: deepseek-harness
- Commit verified against: `86c4598` (the commit of the contract, written by Fable)
- Verdict: the branch and its base are the ones the contract names, `npm ci` installs the tree and `LOOP_STATE.md`
  carries `STATUS: RUNNING`.

## 0.1 The branch and the base

Command:

```powershell
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
git rev-parse --short main
git merge-base HEAD main
git worktree list
```

Output (verbatim):

```text
feature/public-page-and-widget
86c459896cf541d72af7d08a519594e61efcf72b
7c4f4ff
7c4f4ff16a03598c149fa025edfff5135378fd7c
C:/Users/Franc/Documents/katalis-dev/community     8c054c1 [feature/admin-panel-and-onboarding]
C:/Users/Franc/Documents/katalis-dev/community-ui  86c4598 [feature/public-page-and-widget]
```

Read: the branch is the one the contract asks for, `HEAD` is `86c4598` (the commit that wrote the delta specs and the
tasks), `main` is `7c4f4ff` ("Merge brand-and-design-system") and the merge base of the branch with `main` is exactly
`7c4f4ff`, so the branch was cut from `main` after `pluggable-models-and-ask` and `brand-and-design-system`, as the
contract says. The second worktree, `community` on `feature/admin-panel-and-onboarding` at `8c054c1`, belongs to the
parallel lane of the administration panel: this round does not touch it.

`git status --short` before writing anything: empty (the worktree was clean at the start).

## 0.2 `npm ci`

Command:

```powershell
npm ci
```

Output (verbatim, the tail):

```text
added 626 packages, and audited 633 packages in 20s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
[stderr]
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'w3c-xmlserializer@6.0.0',
npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
```

Read: the install comes from `package-lock.json`, audits 633 packages with 0 vulnerabilities and exits 0. The
`EBADENGINE` warnings are the ones of the base machine (Node v24.11.0 against the `>=24.15.0` of `engines`): the same
warning appears in the previous round of this repository and the suite runs on it. `node --version` reports `v24.11.0`.

## 0.3 The state file

`LOOP_STATE.md` was rewritten for this round with `STATUS: RUNNING`, the change, the branch, the base and the objective.
It is committed with this report.

## Commit

`86c4598` is the tip before this step. The commit of this step is the one that carries this report and `LOOP_STATE.md`
in `RUNNING`; its hash is recorded in the report of step 1 (a commit cannot contain its own hash).
