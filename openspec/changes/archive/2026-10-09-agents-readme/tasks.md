# Tasks

Authority: Fable's Task B, explicitly commissioned by Franc on 2026-10-09. Evidence lives in `reports/`.

- [x] 0. Create the assignment's `docs/agents-readme` branch instead of the default `feature/<change>`.
  Command: `git -C community-main worktree add ../community-readme -b docs/agents-readme origin/main`.
  Result: worktree created at `4f4c000`.
- [x] 1. Run the README guards with the new agent and status expectations before implementation.
  `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts`: 6 failed, 38 passed.
- [x] 2. Add the MCP rows, themed agent graphic, manifest entry and truthful compatibility text.
  `npx -y -p node@24 node scripts/render-readme-graphics.mjs agents roadmap`: four PNGs, no overflow.
- [x] 3. Review and update the existing README image, roadmap and provenance guards.
  `npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts`: 45 passed.
- [x] 4. Run unit tests with database state before and after.
  `npx -y -p node@24 node node_modules/vitest/vitest.mjs run`: 1166 passed. The isolated sample database is
  byte-identical before and after the 45 README tests; commands and hash are in `reports/2026-10-09-step-7-verification.md`.
- [x] 5. Execute curl MCP checks without exposing the token.
  `curl.exe --silent --show-error --fail-with-body --config - http://127.0.0.1:3240/api/mcp --data-binary @<request-file>`:
  initialize, tools/list and cited_search returned HTTP 200. Sanitized JSON is in `reports/`.
- [x] 6. Render and inspect both themes with Playwright; run the required frontend E2E check in CI.
  `npx -y -p node@24 node scripts/render-readme-graphics.mjs agents roadmap`: four PNGs inspected.
  `gh run view 37952831180 --log`: `npm run test:e2e`, 96 passed in 1.9 minutes.
- [x] 7. Update the asset documentation and development manual.
  `git diff -- docs/readme-assets.md docs/development-guide.md`: generation, provenance and validation documented.
- [x] 8. Verify the diff, run the secret scan and submit the requested PR with required checks green.
  `git diff --check`: exit 0; `gitleaks git --pre-commit --staged --redact --no-banner -c .gitleaks.toml`: no leaks.
  `gh pr create --base main --head docs/agents-readme`: PR #18.
  `gh pr checks 18 --required --json name,state`: all eight required checks green on `e8ad973`.
- [x] 9. Independent technical adversarial review PASS and archive completed in round two. See reports/2026-10-09-r2-independent-review.md; `openspec archive agents-readme --yes`: archived. Fable retains design acceptance and merge; Codex must not merge.

## Round two, approved by Fable on 2026-10-09

Continue this same branch and PR #18 in the assigned A, B, C order. The approved correction source is `tasks/encargo-codex-agentes-r2.md` and both round-one reviews.

- [x] R2.1. TDD: update provenance and graphic contracts and observe failure.
- [x] R2.2. Correct status glyphs, alignment, exact natural answer, source highlight and bilingual copy.
- [x] R2.3. Run existing tests with sample database state before/after, agent curl checks and both Playwright themes.
- [x] R2.4. Update asset documentation and development manual; verify and obtain independent adversarial review.
- [ ] R2.5. Archive, scan secrets, commit, push to PR #18 and check required CI. Fable retains merge authority.

Round-two commands and results: [validation](reports/2026-10-09-r2-validation.md).
