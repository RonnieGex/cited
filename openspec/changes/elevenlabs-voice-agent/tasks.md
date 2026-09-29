Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`, a folder inside this change, always written
relative to the change so the path holds after archive; never `reports/` at the root of the repository): the exact command, the commit and the output.
Evidence rule: every `[x]` needs a real report that supports it at archive time; a report in a later commit than its
mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit in small steps on
`feature/elevenlabs-voice-agent`: the commits are part of the implementer's work. The repository will be public: no
secret, no customer data. No network call to ElevenLabs or to a model provider in any test.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/elevenlabs-voice-agent`, created by Fable from `main` after the admin panel and the public
      page; confirm branch and base; `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red unit and route tests for every scenario of `specs/voice-agent/spec.md` with the API double — report:
      `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Red E2E with the test SDK: the microphone button, the Orb loaded on demand, the four states, the written
      question echoed once, the chips; the production-build guard — report: `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The server tool and the signed URL with the minute cap (decision 5) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The provisioning from the panel (decisions 2, 3 and 4) — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 The ported panel and Orb on the public page and the widget, and the build guard (decision 1) — report:
      `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why — report: `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`, the
      build guard in both build orders — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start`; `curl.exe` of `/api/voice/tool` without and with the Bearer (the fake
      model answers), and of `/api/voice/signed-url` without the key (503) — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 The E2E of 2.2 green; captures of the voice panel at 1440 and 375 px — report:
      `reports/2026-09-29-step-7-e2e.md`
- [BLOCKED] 7.2 One real session against a real agent is **Fable's** task; leave it `[BLOCKED]` — report:
      `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/voice-agent.md` (the one-click agent, the variables, the allowlist, the minute cap, the privacy note);
      the README status row, a capture and a short section; the Spanish twin — report: `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-09.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`

## 10. What the review of Codex reproduced (contract amended by Fable after `revision-community-09`)

Report: `reports/2026-09-29-step-10-review-fixes.md`. Tests first, red before each fix.

- [x] 10.1 Major (a gap of Fable's contract): the state of the store before and after this change, recorded as the
      standard requires (the tables and their row counts, and the new voice tables empty before and as expected after),
      with the exact commands — report: the one of this section
- [ ] 10.2 Major: the resampler and any worklet of the SDK served from the application's own origin, configured in the
      SDK, with a test that fails if a CDN host is requested (requirement "Voice works under the page's own security
      policy") — report: the one of this section
- [ ] 10.3 Major: the minute cap as amended (requirement "The minute cap never lets a session exceed it"), and the panel
      saying that a limit below five allows no session — report: the one of this section
- [ ] 10.4 Minor: the policy trimmed to what the implemented session uses (`connect-src` and `media-src`), with the
      reason of each directive left — report: the one of this section
- [ ] 10.5 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm run test:e2e`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`; append the round
      to `katalis-dev/tasks/entrega-community-09.md` with `## Issues` — report: the one of this section
