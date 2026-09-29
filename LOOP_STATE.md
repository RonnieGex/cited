# LOOP_STATE · Cited

STATUS: RUNNING
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: section 10 of the contract, tasks 10.1 to 10.8 — what the review of Codex reproduced
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main, "Write the product context of Cited: the owner, the visitor, and what the design must honour"); the
change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching the server")
HEAD AT THE START OF THE ROUND: 9a47f41 ("Keep provider errors and private networks out, hold the test limit, and
record the store")
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Close the findings of `katalis-dev/tasks/revision-community-12.md` (the adversarial review of Codex, FAIL): the Blocker
B-1 (a saved key could return to the browser inside the raw error of the provider), the Majors M-1 (SSRF through
`baseUrl`), M-2 (forty concurrent tests evaded the limit of twenty), M-3 (the contract contradicts itself about variable
names outside "For the installer"), M-4 (two E2E boxes marked without the evidence their text asks for, and the read of
every `/api/admin/*` response), M-5 (no state of the database before and after) and the Minors m-1 (the commit count)
and m-2 (gitleaks recorded for every commit). The three new requirements of the amended spec delta rule the round: "No
provider error reaches the browser", "A provider address cannot reach private networks" and "The test limit holds under
concurrency". Tests first and red before each fix, one real report per `[x]` inside the change folder, small commits with
gitleaks over each one, no real provider and no real private network in any test.

## Where the round is

- 10.1 to 10.8: pending.

## Hard rules of this round

- No `.env` file with secrets is opened (`.env.example` is the public template and is edited).
- No push, no remote, no commit in `main`, no archive, no deploy.
- `community` and `community-preview` are not mine: nothing is written in them.
- `MEMORY.md` never enters a commit. No personal path in a versioned file. UTF-8 with LF.
- The text of no task, of `design.md` or of the specs is edited: only the checkboxes of `tasks.md`.
