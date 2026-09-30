Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`, inside this change): the exact command, the commit
and the output, marked in the same commit as the evidence. Small commits on `feature/voice-owner-words`, gitleaks per
commit. No network call to a real provider. No personal path in a tracked file.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/voice-owner-words`, created by Fable from the local merge commit of `main` that carries
      `provider-keys-in-panel` and `elevenlabs-voice-agent`; confirm branch and base; `npm ci` — report:
      `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, and
      `npm run store:state -- <a store created by the code of the base>` — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red: `tests/voice-owner-words.test.ts` (design decision 5), a route test of `POST /api/admin/voice` for both
      codes, a test of `GET /api/voice/signed-url` for `voice_unavailable`, and a component test of `VoiceAgent.tsx`
      that renders both codes in English and Spanish with no variable name and the link to "For the installer" —
      report: `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The two routes and the log (decisions 1, 2 and 4) — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The screen and its strings (decision 3) — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why (only assertions on the old payload) — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container (Node 24.15 or newer), `npm run typecheck`,
      `npm run lint`, `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`,
      `git diff --check main...HEAD` — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start` on a free port with the panel configured and no voice: `curl.exe -i` of
      `POST /api/admin/voice` (signed in) and `GET /api/voice/signed-url`, showing the codes and no variable name, and
      the server log showing the names once — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 `CI=1 npm run test:e2e`, the whole suite green — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 and say what changed (no table should) — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/voice.md` (the codes, and where the installer reads the names) and the delivery
      `katalis-dev/tasks/entrega-community-15.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`

## 10. Amendment after the review of Codex (`katalis-dev/tasks/revision-community-15.md`, design decisions 6 to 10)

- [ ] 10.1 `tests/readme.test.ts` back to its text at `2f9a75b`; the whole suite green with the `MODIFIED` delta of
      `voice-agent` (decision 6) — report: `reports/2026-09-29-step-10-1-readme-guard.md`
- [x] 10.2 Red, then green: a route test of `POST /api/admin/voice` for `business_unnamed` (409, no request to the
      double of ElevenLabs) and a component test of `VoiceAgent.tsx` in English and Spanish with the link to "Business"
      (decision 7) — report: `reports/2026-09-29-step-10-2-business-unnamed.md`
- [x] 10.3 The `EPERM` of `tests/voice-minute-cap.test.ts` and of any test with the same pattern (decision 9); `npm test`
      twice in a row on Windows with Node 24.15 or newer, and once in a `node:24` Linux container — report:
      `reports/2026-09-29-step-10-3-windows-stability.md`
- [ ] 10.4 The checks of 5.1, the curl of 6.1 plus the business without a name, `CI=1 npm run test:e2e`, and
      `openspec archive` simulated in a disposable clone: the resulting `openspec/specs/voice-agent/spec.md` has no
      sentence that orders naming a variable (`grep -n "naming" ` shows none) — report:
      `reports/2026-09-29-step-10-4-checks.md`
- [ ] 10.5 `docs/voice.md` with the code `business_unnamed`, and the delivery `katalis-dev/tasks/entrega-community-15.md`
      corrected (the two classes of the link, decision 10) with its `## Issues` — report:
      `reports/2026-09-29-step-10-5-docs.md`
