# Step 0 · the branch and the bump of `next`

- Date: 2026-10-09
- Change: `audit-exceptions`
- Branch: `feature/next-16-4`
- Agent: DeepSeek (implementer), contract by Fable
- Verdict: done

## What was there

The worktree `community-deps` came from `origin/main` at `f644f85` on the branch `feature/next-16-4`, with `next` and
`eslint-config-next` raised to `16.4.0` exactly and **uncommitted**:

```
$ git -C <worktree> status --short --branch
## feature/next-16-4...origin/main
 M package-lock.json
 M package.json

$ git diff package.json
-    "next": "16.3.6",
+    "next": "16.4.0",
-    "eslint-config-next": "16.3.6",
+    "eslint-config-next": "16.4.0",
```

The tree was installed with Node 24 and the two raised packages were the ones in `node_modules`.

## What was done

```
$ git add package.json package-lock.json
$ git commit -m "chore(deps): bump next and eslint-config-next to 16.4.0"
[feature/next-16-4 4b9b038] chore(deps): bump next and eslint-config-next to 16.4.0
 2 files changed, 74 insertions(+), 117 deletions(-)
```

`4b9b038` is the base of the change. The pre-commit hook of gitleaks ran on it and the commit was created; the scan of
the whole history is one of the checks of step 5.

```
$ node -v
v24.11.0
$ npm -v
11.6.1
```

## Evidence

- Commit `4b9b038`, two files, `package-lock.json` (187 lines changed) and `package.json` (4 lines changed).
- `git status --short` after the commit: empty.
