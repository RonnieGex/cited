# Approved Round 8 execution

Source: Fable's brief, authorized by Franc. Check a task only with command and outcome in its report.

- [x] 0. Confirm the existing approved branch and clean baseline; reuse it as expressly required by R8 instead of creating feature/<change>.
- [x] 1. Write and execute failing regression tests before product edits (TDD).
- [x] 2. Apply the approved visual corrections in small steps and regenerate affected outputs.
- [x] 3. Review and update existing layout assertions while preserving evidence and asset checks.
- [x] 4. Capture read-only database state before and after; execute unit tests and build; record exact commands and results in reports/YYYY-MM-DD-step-N-name.md.
- [x] 5. Execute local HTTP curl checks.
- [x] 6. Execute Playwright rendering and visual checks; landing uses tools/shoot.mjs and rendered/cited-agent-place-r8, EN/ES, 320-1440 px, axe zero, no overflow.
- [x] 7. Update documentation and project manual.
- [x] 8. Execute verify and strict OpenSpec validation with requirement-to-evidence report.
- [ ] 9. Obtain independent adversarial review, classify Blocker/Major/Minor and PASS/PASS WITH GAPS/FAIL; resolve blockers and majors and re-review corrections.
- [ ] 10. Archive only after acceptable independent review.
- [ ] 11. Scan secrets, commit with English message, push the two existing PR branches and verify green CI; landing stays local.
- [ ] 12. Deliver tasks/entrega-codex-agentes-r8.md with SHAs, validation, changed files and Issues.

Evidence: reports/2026-10-09-step-0-baseline.md; step-1-tdd.md; step-2-render.txt (README projects); step-4-validation.md; step-5-http.md; step-6-browser.md; step-7-docs.md; step-8-verify.md. All filenames share the 2026-10-09 date prefix. Steps 9-12 remain pending and are not represented as complete.
