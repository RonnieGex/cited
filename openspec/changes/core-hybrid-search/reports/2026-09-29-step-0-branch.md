# Step 0 - The branch

- Date: 2026-09-29
- Change: `core-hybrid-search`
- Branch: `feature/core-hybrid-search`
- Base: `main` at `2e1e580` ("Merge codeql-when-public")
- Agent: `deepseek-harness`
- Commit verified against: `39684fd` ("Specify the core hybrid search of Katalis Responde Community")

## Commands and real output

```
> git rev-parse --abbrev-ref HEAD
feature/core-hybrid-search

> git rev-parse HEAD
39684fdbd19fbfc78b8c347822665a605507650d

> git rev-parse main
2e1e580ab1cb12991277eb86d010c33f07bb2a20

> git merge-base --is-ancestor main HEAD   (exit code 0)

> git log --oneline main..HEAD
39684fd Specify the core hybrid search of Katalis Responde Community

> git status --short
 M LOOP_STATE.md
```

The base of the contract (`2e1e580`) is an ancestor of the branch head, and the only commit of the branch on top of
`main` is the contract written by Fable. The working tree was clean when this step started; the single modified file
is `LOOP_STATE.md`, which this execution sets to `RUNNING` as its contract asks.

`git status --branch` reports `## feature/core-hybrid-search` with no upstream divergence line, and the remote was
never contacted: no fetch, no push.

## Verdict

PASS. The branch and its base are confirmed: `feature/core-hybrid-search` over `main` at `2e1e580`, with the contract
of Fable (`39684fd`) as the only commit of the branch.
