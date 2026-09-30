# Step 0: the branch (task 0.1)

Implementer: Sonnet 5.5. Date: 2026-09-29. Worktree: `<worktree>` (`community-ui`). Every path below is relative to the
repository; `<worktree>` stands for the checkout of `community-ui`, and `<e2e-worktree>` for its sibling `community-e2e`.

## The branch and its base

```
$ git branch --show-current
feature/brand-identity-ui

$ git log --oneline -4          (before my commits)
6668cff Fix the contrast of the numbered marks, drop an unused token and fix the names of the interfaces
bc8c1a9 Specify the identity of the product: the wordmark, the citation mark and the highlighter
c07640b Write the product context of Cited: the owner, the visitor, and what the design must honour
21ad3b9 Merge admin-panel-and-onboarding

$ git merge-base main HEAD
c07640b09c19b632c9882e2d331791b2e57aa33d
```

The merge base starts with `c07640b`, the commit the contract names, and `git rev-parse --short main` is `c07640b` too:
the branch was cut from the tip of `main`. The two commits above it when I started (`bc8c1a9`, `6668cff`) are Fable's.

## Dependencies: no `npm ci` in this worktree

`npm ci` deletes `node_modules`, which the dev server of this worktree (port 3300) is using, so I did not run it here.
The contract asks for `npm ls --depth=0` in its place:

```
$ npm ls --depth=0
cited@0.1.0 <worktree>
+-- @ai-sdk/anthropic@4.0.68
+-- @ai-sdk/deepseek@3.0.56
+-- @ai-sdk/google@4.0.85
+-- @ai-sdk/groq@4.0.52
+-- @ai-sdk/openai-compatible@3.0.59
+-- @ai-sdk/openai@4.0.81
+-- @axe-core/playwright@4.13.0
+-- @emnapi/runtime@1.11.3 extraneous
+-- @img/sharp-wasm32@0.35.5 extraneous
+-- @libsql/client@0.18.0
+-- @playwright/test@1.63.0
+-- @tailwindcss/postcss@4.3.3
+-- @testing-library/dom@10.4.2
+-- @testing-library/jest-dom@7.0.1
+-- @testing-library/react@16.3.3
+-- @types/node@24.19.0
+-- @types/react-dom@19.3.0
+-- @types/react@19.3.0
+-- @vitejs/plugin-react@6.1.1
+-- ai@7.0.122
+-- eslint-config-next@16.3.6
+-- eslint@9.39.5
+-- jsdom@30.1.1
+-- mammoth@1.13.0
+-- next@16.3.6
+-- pdf-parse@2.4.5
+-- react-dom@19.2.8
+-- react@19.2.8
+-- tailwindcss@4.3.3
+-- typescript@5.9.3
`-- vitest@5.0.2
```

Every direct dependency of `package.json` is installed at a version its range allows. Two packages are reported
`extraneous` (`@emnapi/runtime`, `@img/sharp-wasm32`): they are optional platform packages of `sharp` that the
installation of this machine brought in; they are not in `package.json` and the change adds nothing.
`package.json` here is byte for byte the one of `main` (`git show main:package.json | diff - package.json` is empty).

## The scratch worktree for everything that builds or serves

```
$ git -C <worktree> worktree add --detach <e2e-worktree> HEAD
Preparing worktree (detached HEAD 6668cff)
HEAD is now at 6668cff Fix the contrast of the numbered marks, drop an unused token and fix the names of the interfaces

$ cd <e2e-worktree> && npm ci
...
added 626 packages, and audited 633 packages in 47s

212 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
exit 0
```

`npm ci` printed 25 `EBADENGINE` warnings and nothing else: this machine runs Node `v24.11.0` and the repository
declares `"node": ">=24.15.0 <25.0.0"` (and `jsdom` and its dependencies ask `^24.15.0`). The installation and the
whole suite work on 24.11.0 (see step 1), but it is a difference from what the repository asks; it is listed as an
issue in the final answer.

## The capture script

`scripts/capture-ui.mjs` was left untracked by Fable. I committed it as it is (121 lines, not touched):

```
$ git add scripts/capture-ui.mjs && git commit -m "Add the capture script for the interface of Cited" ...
INF 0 commits scanned.
INF scanned ~4105 bytes (4.11 KB) in 184ms
INF no leaks found
[feature/brand-identity-ui 41c70fe] Add the capture script for the interface of Cited
 1 file changed, 121 insertions(+)
 create mode 100644 scripts/capture-ui.mjs
```

Commit: `41c70fe`. The gitleaks output above is the pre-commit hook's own.

`LOOP_STATE.md` shows as modified in `git status` since before I started; it is not mine and I never added it.
