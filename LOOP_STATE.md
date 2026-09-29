# LOOP_STATE · Katalis Responde Community

STATUS: RUNNING
CHANGE: codeql-when-public (OpenSpec)
BRANCH: feature/codeql-when-public
BASE: efdda14 (main)
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the contract `openspec/changes/codeql-when-public/tasks.md`, written by Fable, in order, with the evidence of
every task in `openspec/changes/codeql-when-public/reports/`. The defect: the first CodeQL run of `main`
(`36511364255`) analyzed the code and then failed at the upload, "Code scanning is not enabled for this repository",
because GitHub accepts code scanning uploads from a private repository only with a paid plan. The change is one
job-level condition, `if: ${{ !github.event.repository.private }}`, so the analysis job is skipped, not failed, while
the repository stays private, and it runs unchanged once change 7 makes it public.

## Progress

- Step 0: the branch and its base confirmed.
- Step 1: the state of the base, with the failing run quoted and the repository proven to have no database.
- Step 2: the contract test of `codeql.yml` written first and run red on Windows and on Linux.
- Step 3: the one-line condition on the analysis job; the test green.
- Step 4: the whole suite green on Windows and in a `node:24` Linux container.
- Step 5: the checks green on both platforms, plus the production build on Windows.
- Step 6: not applicable, no route changes; the changed-file list is in the report.
- Step 7: not applicable, the page does not change.
- Step 8: the state after, repeated; no database, the suite four tests wider.
- Step 9: in progress.

## Hard rules respected

- No Lufga source material and no licensed font file.
- No personal path in any tracked file.
- No `.env` file is opened.
- No push; the remote is not contacted.
- No commit in `main`.
- No archive.
- UTF-8 with LF in every file written or modified.
