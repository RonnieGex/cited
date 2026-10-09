# Tasks

Authority: Fable's approved round-three assignment. Author: independent contracts agent. Check only with executed command and result in the linked report.

- [x] 0. Record branch, baseline and Node 24 in `reports/2026-10-09-step-0-baseline.md`; reuse authorized `docs/agents-readme` instead of creating `feature/agent-evidence-r3`.
- [x] 1. TDD: extend README/graphics guards for new provenance, disclosure, Markdown caption, SVG marks, separate routes and concrete links; record expected failures in `reports/2026-10-09-step-1-tdd.md`.
- [x] 2. Import new canonical plugin evidence and update the agents graphic and bilingual copy in small steps.
- [x] 2.1. Add regression guards for the corrected two-of-three supported-price count and retained canonical attempt-2. Keep the graphic at 1280x640 with the complete question, exact own-source passage and exact first paragraph of the final answer labeled `Answer excerpt · original Spanish`. Verify no paraphrase or silent clipping, preserve the complete final answer and every exchange in the linked raw download, and disclose the observed English false price claim. Record executed tests without repeating capture.
- [x] 3. Replace status glyphs with roadmap SVG marks, split compatibility routes and fix concrete evidence links.
- [x] 4. Review and update existing README/renderer tests, preserving unrelated graphic and runtime behavior.
- [x] 5. Run unit tests under Node 24 and verify the isolated sample database counts/hashes before and after; record exact commands and state in `reports/2026-10-09-step-5-validation.md`.
- [x] 6. Execute sanitized curl MCP checks and concrete evidence-file HTTP checks; record results and merge dependency in `reports/2026-10-09-step-6-curl.md`.
- [x] 7. Run both-theme Playwright rendering checks, inspect graphics, and execute the required frontend E2E suite with CI evidence in `reports/2026-10-09-step-7-browser.md`.
- [x] 8. Update asset documentation and development manual with evidence and reproduction commands.
- [x] 9. `/verify`: run strict OpenSpec validation and requirement/evidence reconciliation in `reports/2026-10-09-step-9-verify.md`.
- [x] 10. `/adversarial-review`: independent reviewer records evidence, Blocker/Major/Minor findings and PASS/PASS WITH GAPS/FAIL; independently review corrections in `reports/2026-10-09-step-10-adversarial-review.md`.
- [x] 11. `/archive`: archive only with Blockers and Majors resolved; preserve all reports.
- [x] 12. `/commit`: run automated checks and gitleaks before committing; push PR #18, require all checks green, set `Merge after RonnieGex/dsh-cited#1` in its description and never merge or deploy. Add actual outcomes and classified Issues to the shared Spanish delivery. Evidence: `reports/2026-10-09-step-12-closure.md`.

Archive evidence: `openspec archive agent-evidence-r3 --yes`: succeeded after independent PASS WITH GAPS, no open Blocker/Major. `openspec validate --all --strict`: 15/15 valid.
