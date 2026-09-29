# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: pluggable-models-and-ask (OpenSpec)
ROUND: the whole contract, tasks 0.1 to 9.3
BRANCH: feature/pluggable-models-and-ask
BASE: aa52b7c (main, "Merge cited-identity-and-readme")
HEAD AT THE START OF THE ROUND: 77a21ad ("Specify the answers with citations of Cited")
HEAD AT THE END OF THE ROUND: pending
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute `openspec/changes/pluggable-models-and-ask/tasks.md`, the contract Fable wrote on 2026-09-29: the answer with
citations that is the heart of Cited. Tests first and red, small commits, a real report for every `[x]`, no network
call to a real provider in any test, and the README moved from "not ready" to the answer working.

## Plan

The nine sections of the contract, in order, each one with its report under
`openspec/changes/pluggable-models-and-ask/reports/`.

## Hard rules respected

- No `.env` file is opened.
- No push, no remote, no commit in `main`, no archive.
- No call to a real provider and no call to Turso: the deterministic `fake` provider runs every command.
- `MEMORY.md` is in no commit.
- UTF-8 with LF in every file written or modified.
- `community-ui` is not touched.
