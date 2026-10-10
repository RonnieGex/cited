# Independent adversarial review

Date: 2026-10-09. Reviewer: Codex r6_review. Contract author: r6_contract. Implementer: parent root. Reviewer authored neither specification nor implementation.
Scope: community-english-example, english-example, branch docs/english-example, base b4e749f539399637d763a1ebaf6da55e729fdfd5 plus the reviewed R6 working tree.

## Sources and method

Read the approved assignment, complete SDD standard, adversarial-review skill, proposal/design/spec/tasks and their independently approved clarifications before reviewing implementation. Inspected git diffs against the recorded base and the complete capture/validator/render paths, locale copy, tests, workflow configuration, step 0 through 9 reports, raw capture attempts and final command-result artifacts. This review is pre-archive and pre-commit; final-SHA remote CI is not claimed.

## Acceptance and adversarial evidence

- Natural English capture: all three fixed prompts contain no tool instruction. Each saved result and final answer affirms the 90-day repair-work guarantee with its own numbered Guarantee passage from bike-workshop-policies.md. Canonical selection uses the validated callId, never a different exchange. Recomputed all raw transcripts and verified actual 3/3 counts. The historical Spanish-example batch remains 2/3, including its original English-on-Spanish failure.
- Provenance/isolation: capture installs GitHub main into temporary headless DSH_HOME, verifies resolved lock commit and installed lib hash, uses only public samples on 3246, records failures as well as successes and stops its server in finally. Runtime src/lib in the plugin and app/components/lib/migrations in Cited have no implementation diff. No merge, deployment or desktop access is part of the change.
- Preservation: independently hashed tracked historical evidence against git HEAD. All raw files remain identical; compatibility.md is an intentionally updated document. English canonical JSON/TXT and summary copies are identical across the three repositories. Cited Spanish PNGs equal the previous primary PNGs byte for byte. r6-integrity.json additionally verifies all 16 copied English artifacts.
- Locale and display: primary English surfaces and plugin Chinese graphics use English evidence; Spanish surfaces retain Spanish. The chip and exact highlighted passage are inside TOOL RESULT. Full model punctuation is preserved, safe Markdown rendering remains, and the actual language matches each transcript link and HTML lang. Inspected English Cited/plugin images and a narrow English landing capture visually without clipping.
- Validator challenges: independently reproduced the initial acceptance of refusals and unrelated 90-day text, then a refusal followed by a quoted Source paragraph, a question, and a modal claim. Those Major findings were corrected by the implementer with red/green regressions in both final and tool answers. Final focused suite confirms rejection while all three real attempts remain valid. Identical validator code is present in all consumers.
- Geometry: the final renderer asserts English answer 22px, Spanish 27px, Outfit, English flex-column space-between, source 20px, complete answer/source equality, source line limits, footer clearance and column-bottom difference. Original Spanish pixels remain unchanged.
- Image readiness: shoot waits for image decoding, verifies complete/naturalWidth and enforces 30-second URL-specific failure; requestfailed remains active and unfiltered. The original aborted-image failure is preserved separately from the successful rerun. Four reproduction scripts in rendered/cited-agent-place-r6 are byte-identical to current landing tools.

## Executed independent checks

- node --test tests/readme.test.mjs in dsh-cited: exit 0, 12/12.
- node --test tools/agent-place.test.mjs in cited-landing: exit 0, 9/9.
- npx -y -p node@24 node node_modules/vitest/vitest.mjs run tests/readme.test.ts tests/personal-paths.test.ts in Cited: exit 0, 54/54 after npm ci. A preceding attempt during dependency reinstallation returned MODULE_NOT_FOUND; the completed-install rerun resolves that transient state.
- Get-NetTCPConnection -State Listen filtered to 3240, 3243, 3246, 4176 and 4186: no listeners.
- Node assertions over r6-http.json: all 12 recorded 200 responses have hashes matching current artifacts.
- Node assertions over all final command JSONs: exit 0. Parsed browser report: 34 entries, zero failing entries, 68 PNGs present.
- Node comparisons over before/after database reports: all 19 table rows/counts/hashes identical.

The first two focused reviewer commands used the shell's Node 24.11.0. Authoritative implementation validation and capture reports identify Node 24.21.0; Cited's independent rerun used the Node 24 package wrapper. No claim is made that the shell executable was 24.21.0.

## Retained validation

Cited npm ci: 693 packages, exit 0 under Node 24.21.0; unit/integration: 1168/1168; E2E: 96/96; staged README/personal-path checks: 54/54. Build, lint, types, audit policy and four agents renders: exit 0. See r6-install-final.json, r6-tests-green.json, r6-e2e.json, r6-staged-tests.json, r6-render-verified.json and corresponding build/lint/typecheck/audit JSON reports.

OpenSpec strict validation is green. Database snapshot code opens read-only and performs no initialization. The shared existing fixture is honestly documented as empty except internal FTS metadata; it is not represented as populated customer data. Separate real-capture snapshots contain four public documents and eleven passages, preserve all non-model_calls tables, and leave conversations empty. Snapshot reproduction scripts/helper and complete outputs are retained.

## Findings and disposition

| Severity | Finding | Disposition and evidence |
| --- | --- | --- |
| Major, resolved | Refusal, unrelated duration, source-only assertion, question and modal text could count as a supported guarantee answer. | Implementer added negative regressions and affirmative first-paragraph validation; independent focused tests pass and original 3/3 remains unchanged. |
| Minor, resolved | Newly fixed answer/font/flex values lacked computed-style assertions. | Final renderer asserts the required styles and final rerender exits 0. |
| Minor, resolved | Snapshot commands omitted before/after arguments; npm ci lacked a separate retained artifact. | Step 5 now states exact phase commands; r6-install-final.json records successful npm ci. |

No open Blocker, Major or Minor remains in the implementation reviewed here.

## Verdict and next steps

PASS (adversarial). Archiving is advisable now. The remaining mandated order is archive, secret-scanned commit, push and new PRs for the two remote repositories, then verification of required checks against the exact final SHA. Landing remains local. This verdict does not authorize merge or production deployment and does not declare future CI successful.

## Issues

- RISK: existing Cited dependency advisory remains allowlisted until 2026-11-08. npm ci raw output reports eight vulnerable-package entries, while the repository audit policy reports one active allowlisted advisory and no high production finding; both raw outcomes are retained, with no dependency change in this work.
- NOT DONE: archive, final commit and final-SHA remote CI belong to the subsequent closure step; they are not falsely marked complete by this review.
- RISK: Cited's new main-branch English evidence links depend on merging the plugin PR first. Documentation records that dependency; this task authorizes neither merge nor deployment.
