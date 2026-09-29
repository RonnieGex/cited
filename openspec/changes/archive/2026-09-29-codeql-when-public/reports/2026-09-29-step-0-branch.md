# Step 0 report - codeql-when-public: the branch

- Date: 2026-09-29
- Change: codeql-when-public
- Agent: deepseek-harness
- Branch: `feature/codeql-when-public`
- Base: `efdda144662f2d0e01805540c3350f8b04b1451e` (`main`, "Merge fix-tracked-text-scan")

## Task 0.1 - the branch and its base

The contract says the branch was created by Fable from `main` (`efdda14`) with this contract on top. Confirmed in the
working tree of `community`, without contacting the remote:

```
$ git rev-parse --abbrev-ref HEAD
feature/codeql-when-public
$ git rev-parse HEAD
789c2c84342c7f1f26591b4074936723a13de192
$ git log --oneline -2
789c2c8 Specify running CodeQL only while the repository is public
efdda14 Merge fix-tracked-text-scan
$ git show --stat --oneline 789c2c8
789c2c8 Specify running CodeQL only while the repository is public
 openspec/changes/codeql-when-public/.openspec.yaml |  2 +
 openspec/changes/codeql-when-public/design.md      |  8 ++++
 openspec/changes/codeql-when-public/proposal.md    | 19 ++++++++
 .../specs/supply-chain-security/spec.md            | 31 ++++++++++++
 openspec/changes/codeql-when-public/tasks.md       | 56 ++++++++++++++++++++++
 5 files changed, 116 insertions(+)
$ git merge-base HEAD main
efdda144662f2d0e01805540c3350f8b04b1451e
$ git rev-parse main
efdda144662f2d0e01805540c3350f8b04b1451e
$ git rev-parse origin/main
efdda144662f2d0e01805540c3350f8b04b1451e
$ git status --porcelain
 M LOOP_STATE.md
?? openspec/changes/codeql-when-public/reports/
```

The last two lines are the state file of this loop and this report; at the moment of the confirmation, before they
were written, `git status --porcelain` printed no output, so the tree of the branch was clean.

The single commit of the branch is the contract of Fable; the branch has no work commit yet. The local `main` and the
tracked remote reference of `main` both point at the base, so nothing of this change has reached `main` and no push
has happened.

The contract is dated 2026-09-29 and the report paths it fixes are `reports/2026-09-29-step-N-<name>.md`; the reports
of this execution use exactly those names.

## Verdict

PASS. The branch `feature/codeql-when-public` exists over `efdda14` (`main`), it is the current branch, its tree is
clean, and task 0.1 is confirmed with the commands and their output above.
