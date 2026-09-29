# LOOP_STATE · Cited

STATUS: DONE
CHANGE: provider-keys-in-panel (OpenSpec)
ROUND: sections 0 to 9 of the contract, tasks 0.1 to 9.2
BRANCH: feature/provider-keys-in-panel
BASE: c07640b (main, "Write the product context of Cited: the owner, the visitor, and what the design must honour"); the
change starts at 71f08f0 ("Specify the keys in the panel: connect your AI without touching the server")
HEAD AT THE START OF THE ROUND: 71f08f0
HEAD AT THE END OF THE ROUND: c568c3b, plus the closing commit that carries this file, the report of step 9 and the
two marks
AGENT: deepseek-harness
DATE: 2026-09-29

## Objective

Execute the whole contract `openspec/changes/provider-keys-in-panel/tasks.md` written by Fable: the owner of a small
business connects their AI from the panel, the key is tested before it is saved, stored encrypted with AES-256-GCM
under `ENCRYPTION_KEY` and never sent back to the browser, the server environment wins over the panel, the search falls
back to keyword mode when no embeddings provider is set, and the old list of variables becomes the read-only page "For
the installer". Tests first and red before the code, one real report per `[x]` inside the change folder, small commits
on the branch, captures of the new page, the documentation and the delivery in Spanish with its `## Issues`.

## What was delivered

- **0 and 1**: the branch and its base confirmed, `npm ci` (626 packages, 0 vulnerabilities) and the battery of the
  base green: 38 files and 348 tests.
- **2**: the tests first and red, in `f2fd3cb`: six suites that cannot collect and a build that refuses to compile the
  E2E before the code exists. The honest shape of the red of 2.3 is written in its report.
- **3**: `lib/secrets/` (AES-256-GCM, `v1:<nonce>:<ciphertext>:<tag>`), the table `provider_settings`, the resolver that
  the answer pipeline and the ingestion read, the routes of the test, the save, the removal and the re-indexing, the
  twenty tests per hour, the honest bilingual catalogue with disclosed links, and the two screens: "AI and keys" and
  "For the installer". `be42a26`.
- **4**: the whole suite green and the existing tests reviewed one by one: only `tests/public-page.test.tsx` and
  `tests/admin-helpers.ts` changed, each with its reason in the report.
- **5**: the battery on Windows and in a `node:24` Linux container from a clean clone, `npm run typecheck`,
  `npm run lint`, `npm audit --audit-level=high`, `gitleaks git` over 289 commits, `openspec validate --all --strict`
  and `git diff --check main...HEAD`: all green.
- **6**: the manual verification with `curl.exe`: no session is `401` and calls nothing, a good key answers the model
  and its latency, a rejected key is a word and not the text of the provider, the save stores a ciphertext of 81
  characters that starts with `v1:` and never the key, and no response of `/api/admin/*` carries a key.
- **7**: the browser suite green with the three servers (28 tests, axe at 0 violations) and ten captures of the new
  page and of the installer at 1440 and 375, rendered by the committed script against a local double.
- **8**: the base after the change, where the repeat found a real break of a rule of the repository (a personal path in
  the report of step 5) and repaired it.
- **9**: `docs/providers.md`, `.env.example`, `docs/security.md`, `docs/admin.md`, the status table of the two READMEs
  with its roadmap graphic, and `katalis-dev/tasks/entrega-community-12.md` in Spanish with its captures and its
  `## Issues`.

## Evidence

- Reports: `openspec/changes/provider-keys-in-panel/reports/2026-09-29-step-{0,1,2,3,4,5,6,7,8,9}-*.md`.
- `npm test`: 44 files and 408 tests green on Windows (13.00 s to 17.51 s across the runs); 44 files, 406 green and 2
  skipped in a `node:24` Linux container from a clean clone (v24.21.0, 72.55 s).
- `npm run test:e2e`: 28 tests green in one run with the panel, the public page and the keys, with axe at 0 violations
  in `/`, `/embed`, `/kit` and `/admin/ai`.
- Captures: `docs/images/admin/ai-keys-*.png` and `docs/images/admin/installer-1440.png`, with
  `scripts/render-panel-captures.mjs`.

## The issues that stay open

- No test calls a real provider: everything is proven against local doubles, by contract of the change.
- The affiliate path with a real URL is only proven by the component test, because no affiliate URL is committed.
- The roadmap graphic fits eleven rows: two rows of `knowledge-search` were merged into one to make room, and the next
  change that adds a row will trip the guard of the render script.
- The merge with `feature/elevenlabs-voice-agent` (`795b971`) will conflict in `.env.example` and in the two READMEs;
  its branch does not touch the navigation of the panel.
- The change is not archived (that needs the explicit OK of Franc), nothing was pushed and nothing was deployed.
- The panel was not tried with a real provider nor with a remote Turso database.

## Hard rules respected

- No `.env` file with secrets was opened (the repository has none: `Test-Path .env` is `False`); only the public
  template `.env.example` was edited.
- No push, no remote, no commit in `main`, no archive in this worktree, no deploy.
- The other worktree (`community`, the lane of the voice agent) was only read; nothing was written in it or in
  `community-ui`.
- No test calls a real provider: the local doubles of `tests/provider-double.ts` and of `e2e/providers.spec.ts`, and
  the deterministic `fake`, run everything.
- No real key in the repository and none in a capture; no real affiliate link: the field is empty in the catalogue.
- `MEMORY.md` is in no commit. No personal path in a versioned file. UTF-8 with LF in every file written.
- The text of no task, of `design.md` or of the specs was edited: only the checkboxes of `tasks.md`.
