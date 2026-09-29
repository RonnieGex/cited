# Step 0.1 · the branch

Contract: `openspec/changes/brand-and-design-system/tasks.md`, task 0.1.
Agent: deepseek-harness. Date: 2026-09-29.

## What the task asks

> Work on `feature/brand-and-design-system` in the worktree `katalis-dev/community-ui`, created by Fable from `main`
> `aa52b7c`; confirm branch and base; `npm ci`.

## Command and output

```
$ git -C C:\Users\Franc\Documents\katalis-dev\community-ui status --short --branch
## feature/brand-and-design-system
```

```
$ git worktree list
C:/Users/Franc/Documents/katalis-dev/community     aa52b7c [feature/pluggable-models-and-ask]
C:/Users/Franc/Documents/katalis-dev/community-ui  3b3cfbd [feature/brand-and-design-system]
```

```
$ git rev-parse HEAD          -> 3b3cfbdb80e067c7e32367a1cff47a9d6aae4e86
$ git rev-parse main          -> aa52b7ca7145ba62086f05dfe6f4546af033c554
$ git merge-base main HEAD    -> aa52b7ca7145ba62086f05dfe6f4546af033c554
```

The branch is `feature/brand-and-design-system`, its base is `main` at `aa52b7c` (the merge base equals `main`), and
`HEAD` is `3b3cfbd`, the commit of the contract. The other worktree (`community`,
`feature/pluggable-models-and-ask`) is a different checkout and was not touched.

```
$ npm ci
added 609 packages in 20s

npm warn EBADENGINE Unsupported engine {
npm warn EBADENGINE   package: 'cited@0.1.0',
npm warn EBADENGINE   required: { node: '>=24.15.0 <25.0.0' },
npm warn EBADENGINE   current: { node: 'v24.11.0', npm: '11.6.1' }
npm warn EBADENGINE }
npm warn EBADENGINE Unsupported engine { package: '@asamuzakjp/css-color@7.1.2' ... }
npm warn EBADENGINE Unsupported engine { package: '@asamuzakjp/dom-selector@9.2.2' ... }
npm warn EBADENGINE Unsupported engine { package: 'jsdom@30.1.1' ... }
npm warn EBADENGINE Unsupported engine { package: 'w3c-xmlserializer@6.0.0' ... }
npm warn deprecated eslint@9.39.5: This version is no longer supported.
```

Exit code 0. The install is complete; the engine warnings are the local Node (v24.11.0) against the floor of
`engines` (`>=24.15.0 <25.0.0`) and against jsdom's own floor, and they do not stop the install or the suite. Task 5.1
runs the same suite inside a `node:24` Linux container, where the floor of the image covers the requirement.

## What this task delivered

- The worktree, the branch and the base are confirmed with git itself, not with a note.
- `node_modules` is installed from `package-lock.json` (`npm ci`), 609 packages, exit 0.
- Commit of this report: `6a56a1f`.

## Files

- `reports/2026-09-29-step-0-branch.md` (this file).
