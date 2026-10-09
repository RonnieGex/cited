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
- [ ] 6. Render and inspect both themes with Playwright; run the required frontend E2E check in CI.
- [x] 7. Update the asset documentation and development manual.
  `git diff -- docs/readme-assets.md docs/development-guide.md`: generation, provenance and validation documented.
- [ ] 8. Verify the diff, run the secret scan and submit the requested PR with required checks green.
- [ ] 9. Fable performs independent adversarial review, archives after acceptance and merges. Codex must not merge.
