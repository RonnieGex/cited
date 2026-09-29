# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: sections 0 to 9 of the contract, tasks 0.1 to 9.2
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main, "Write the product context of Cited: the owner, the visitor, and what the design must honour"); the
change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching the server")
HEAD AT THE START OF THE ROUND: 71f08f0
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the whole contract `openspec/changes/provider-keys-in-panel/tasks.md` written by Fable: the owner of a small
business connects their AI from the panel, the key is tested before it is saved, stored encrypted with AES-256-GCM
under `ENCRYPTION_KEY` and never sent back to the browser, the server environment wins over the panel, the search falls
back to keyword mode when no embeddings provider is set, and the old list of variables becomes the read-only page "For
the installer". Tests first and red before the code, one real report per `[x]` inside the change folder, small commits
on the branch, captures of the new page, the documentation and the delivery in Spanish with its `## Issues`.

## What is in progress

- Step 0 (`npm ci`, branch and base confirmed) and the reports of every step are written as the work advances, never
  before it.
- The parallel lane `feature/elevenlabs-voice-agent` of `community` is not touched: the two shared files
  (`components/admin/AdminNav.tsx` and `.env.example`) receive additive lines only.

## Hard rules respected

- No `.env` file with secrets is opened; only the public template `.env.example` is edited.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- No test calls a real provider: every provider is a local HTTP double or the deterministic `fake` provider.
- No real key in the repository and none in a capture: the captures show the panel with a key of the doubles.
- No real affiliate link: the catalogue field stays empty in this change.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
