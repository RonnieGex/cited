# Step 0 · the branch

Contract: `tasks.md`, task 0.1. Agent: deepseek-harness. Date: 2026-09-29.
Worktree: the repository root of `community` (every command below runs there; no tracked file carries the absolute
path of the machine, because `tests/personal-paths.test.ts` refuses it).

## 0.1 The branch, its base and the install

### The branch and the base

```
$ git branch --show-current
feature/admin-panel-and-onboarding

$ git rev-parse HEAD
8c054c18dadd6074e5863948019537acd81fa89e

$ git log --oneline -3
8c054c1 Specify the admin panel and the first-run assistant
7c4f4ff Merge brand-and-design-system
7bbd7eb Archive the brand-and-design-system change

$ git merge-base main HEAD
7c4f4ff16a03598c149fa025edfff5135378fd7c

$ git rev-parse main
7c4f4ff16a03598c149fa025edfff5135378fd7c

$ git log --oneline -1 main
7c4f4ff Merge brand-and-design-system
```

The branch is the one the contract names, it is checked out, and its base is `main` at `7c4f4ff`: the merge base of
`main` and `HEAD` is `7c4f4ff` itself. The branch carries one commit of its own, `8c054c1`, the specification of this
change written by Fable; the implementation starts there and never touches `main`.

### The install

```
$ npm ci

added 626 packages, and audited 633 packages in 19s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'w3c-xmlserializer@6.0.0',
npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn deprecated eslint@9.39.5: This version is no longer supported.
npm warn cleanup Failed to remove some directories [ ... '@unrs/resolver-binding-wasm32-wasi/node_modules/@emnapi/runtime' EPERM ... ]
exit=0
```

`npm ci` ends with exit code 0, installs 626 packages and audits 633 with zero vulnerabilities.

Two warnings of the install are recorded because they are real and not fixed here:

- `w3c-xmlserializer@6.0.0` declares `node: ^22.22.2 || ^24.15.0 || >=26.0.0` and this machine runs `v24.11.0`. The
  repository asks for `>=24.15.0` in `engines` and `.nvmrc`; the warning comes from the machine, not from the change,
  and the whole battery of this change runs on `v24.11.0` and is reported as such. The `node:24` Linux container of
  task 5.1 installs the version the image ships.
- `npm warn cleanup` failed to remove one directory of a wasm binding of the previous `node_modules`; the install
  still ends with exit 0.

### No environment file was opened

```
$ Test-Path .env
False
```

The repository carries no `.env`; the only environment template is `.env.example`, which has every value empty.

## Commit of this task

Every command above ran against `8c054c1` (`git rev-parse HEAD` before the first commit of the implementation). The
mark of 0.1, this report and `LOOP_STATE.md` with `STATUS: RUNNING` travel together in the closing commit of the step.
