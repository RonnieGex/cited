# Step 0 - The branch

- Date: 2026-09-29
- Change: `cited-identity-and-readme`
- Branch: `feature/cited-identity-and-readme`
- Agent: `deepseek-harness`
- Report of task 0.1: work on `feature/cited-identity-and-readme`, created by Fable from `main` `5dec3af`; confirm the
  branch and the base; `npm ci`.

## The branch and the base

```
> git branch --show-current
feature/cited-identity-and-readme

> git rev-parse HEAD
35112e694147a7857c61f8bfad4e5b5d69cb4cd0

> git log --oneline -1
35112e6 Specify the Cited identity and the README that presents it

> git merge-base HEAD main
5dec3af897ceaae7199d7b6468ad7fffdb4d68d4

> git rev-parse main
5dec3af897ceaae7199d7b6468ad7fffdb4d68d4

> git log --oneline -1 main
5dec3af Merge core-hybrid-search

> git status --short --branch
## feature/cited-identity-and-readme
```

The merge base of the branch and `main` is the commit `main` points at, so the branch was created from `5dec3af` and
carries one commit of its own, `35112e6` ("Specify the Cited identity and the README that presents it"), written by
Fable. The tree was clean before the first edit of this execution.

## The environment

```
> node --version
v24.11.0

> npm --version
11.6.1
```

Node `v24.11.0` is older than the floor `engines` requires (`>=24.15.0`) and npm prints its `EBADENGINE` warning for
`vite` and its dependants. The local machine is the one that already ran the whole suite of the previous change; the
`node:24` Linux container of task 5.1 runs the same suite above the floor. This is recorded here as a RISK of the local
environment, not as a failure: nothing in this change depends on a Node API above 24.11.

## `npm ci`

```
> npm ci
added 609 packages, and audited 616 packages in 21s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
ci exit: 0
```

Stderr of the run, complete:

```
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'w3c-xmlserializer@6.0.0',
npm warn EBADENGINE   required: { node: '^22.22.2 || ^24.15.0 || >=26.0.0' },
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn deprecated eslint@9.39.5: This version is no longer supported. Please see https://eslint.org/version-support for other options.
```

`npm ci` installed from the committed lock file without modifying it: `git status --short` stayed empty after the run.

## Verdict

PASS. The branch is `feature/cited-identity-and-readme`, its base is `main` `5dec3af`, and the locked dependencies
install clean on Windows.
