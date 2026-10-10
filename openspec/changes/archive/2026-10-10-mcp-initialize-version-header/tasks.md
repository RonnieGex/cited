# Round 2 tasks

Fable's 2026-10-09 assignment approves these corrections and retains PR #21. Reports belong in `reports/`.
Round-1 red/build/Hermes claims are historical, not independently verified by Codex.

## 0. Branch

- [x] 0.1 Verify assigned existing `fix/mcp-initialize-version-header` rather than create `feature/<change>`, per assignment. Evidence: [executed commands and results](reports/2026-10-09-step-2-tdd.md).

## 1. Specification and TDD

- [x] 1.1 Record the two approved additional requirements, design and tasks; validate strictly before code. Evidence: [executed commands and results](reports/2026-10-09-step-2-tdd.md).
- [x] 1.2 Add negative initialize and bounded-body regressions; run them red before implementation. Evidence: [executed commands and results](reports/2026-10-09-step-2-tdd.md).

## 2. Small implementation steps

- [x] 2.1 Restrict the exception to valid individual initialize requests. Evidence: [executed commands and results](reports/2026-10-09-step-2-tdd.md).
- [x] 2.2 Bound POST reads to 1 MiB and 10 seconds after guards, with cancellation and cleanup. Evidence: [executed commands and results](reports/2026-10-09-step-2-tdd.md).

## 3. Existing tests

- [x] 3.1 Review and run route/protocol/tools cases, preserving supported negotiation and tool behavior. Evidence: [executed commands and results](reports/2026-10-09-step-2-tdd.md).
- [x] 3.2 Correct the README test's delta parser to inspect only ADDED sections in mixed ADDED/MODIFIED deltas. Evidence: [executed commands and results](reports/2026-10-09-step-4-validation.md).
      The full-suite red run incorrectly treats the existing modified transport requirement as newly added.

## 4. Automated validation and database evidence

- [x] 4.1 Verify seeded database state before and after real-handler calls using read-only queries; record results. Evidence: [executed commands and results](reports/2026-10-09-step-4-validation.md).
- [x] 4.2 Run all unit tests, lint, types and strict OpenSpec validation under Node 24. Evidence: [executed commands and results](reports/2026-10-09-step-4-validation.md).
- [x] 4.3 Build in a temporary worktree and remove it afterward; never build in the live worktree. Evidence: [build exit 0 and cleanup](reports/2026-10-09-step-4-validation.md).

## 5. HTTP and browser validation

- [x] 5.1 Execute curl checks for negotiation, rejection and limits against the isolated build. Evidence: [executed commands and results](reports/2026-10-09-step-5-http.md).
- [x] 5.2 Observe required PR CI checks, including existing Playwright E2E, on the pushed implementation HEAD. Evidence: [16 required checks SUCCESS](reports/2026-10-09-step-7-ci.md); final handoff commit is checked again in the delivery.

## 6. Documentation and closure

- [x] 6.1 Update the MCP manual for body negotiation, subsequent headers, 400, 413 and 408. Evidence: [executed commands and results](reports/2026-10-09-step-6-verification.md).
- [x] 6.2 Cite historical Hermes evidence and explicit independent-verification limits. Evidence: [executed commands and results](reports/2026-10-09-step-6-verification.md).
- [x] 6.3 Verify artifact/implementation/test mapping and deliver with actual issues. Evidence: [verification](reports/2026-10-09-step-6-verification.md), [handoff](reports/2026-10-09-step-7-ci.md).
- [x] 6.4 Fable performs independent adversarial review; Codex does not review its own code. Evidence: [PASS](reports/2026-10-09-step-8-fable-review.md).
- [x] 6.5 Archive after independent review. Round-2 commits and push precede that handoff as explicitly assigned. Evidence: `openspec archive mcp-initialize-version-header -y` and `openspec validate --all --strict`.
