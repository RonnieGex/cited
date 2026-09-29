Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`): the exact command, the commit and the output.
Evidence rule: every `[x]` needs a real report that supports it at archive time; a report in a later commit than its
mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit in small steps on
`feature/pluggable-models-and-ask`: the commits are part of the implementer's work. The repository will be public: no
secret, no customer data. No network call to a real provider in any test.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/pluggable-models-and-ask` in `katalis-dev/community`, created by Fable from `main`
      `aa52b7c`; confirm branch and base; `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`
- [x] 1.2 The state of the store: the tables that exist before, and proof that tests leave no store file behind —
      report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [ ] 2.1 Red tests for every scenario of `specs/answering/spec.md` with the fake provider — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation in small steps

- [ ] 3.1 Providers and their licenses (decision 1) — report: `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.2 Prompt, citations and refusal (decisions 2 to 4) — report: `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.3 Guards, counters and conversations in the store (decision 5) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.4 The route and the CLI (decisions 6 and 7) — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [ ] 4.1 The whole suite, including the README contract; say which test changed and why — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks and the state of the store

- [ ] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD` —
      report: `reports/2026-09-29-step-5-checks.md`
- [ ] 5.2 The tables of the store after the tests, their row counts, and no IP in clear — report:
      `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [ ] 6.1 `npm run build && npm run start` with the fake providers and the sample corpus; `curl.exe` of `/api/ask` for:
      an answered question with its citations, a refused one, 1001 characters (400), the 31st question of an IP (429 with
      `Retry-After`), a missing key with `CHAT_PROVIDER=openai` (503 naming the variable) — report:
      `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [ ] 7.1 No page changes the behavior in this change; the existing E2E stays green — report:
      `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [ ] 8.1 Repeat 1.1 and 1.2 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation and the README

- [ ] 9.1 `docs/answering.md`: the flow, the prompt, the citations, the refusal, the providers and their variables and
      licenses, the guards and their defaults, the IP hash; `.env.example` with `CHAT_PROVIDER`, `TRUST_PROXY` and the
      defaults in comments — report: `reports/2026-09-29-step-9-docs.md`
- [ ] 9.2 The README, its Spanish twin and the graphics as design decision 8, with the modified requirement of
      `project-readme` green — report: `reports/2026-09-29-step-9-docs.md`
- [ ] 9.3 The delivery `katalis-dev/tasks/entrega-community-05.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`
