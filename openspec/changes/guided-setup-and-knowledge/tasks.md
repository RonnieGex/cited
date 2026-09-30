Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-30-step-N-<name>.md`, a folder inside this change, always written
relative to the change so the path holds after archive; never `reports/` at the root of the repository): the exact
command, the commit and the output. Evidence rule: every `[x]` needs a real report that supports it at archive time; a
report in a later commit than its mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit
in small steps on `feature/guided-setup-and-knowledge`: the commits are part of the implementer's work. The repository
will be public: no secret, no customer data, no personal path. No network call to a real provider in any test. Read
`PRODUCT.md` and `katalis-dev/tasks/diseno-cited/brief-experiencia.md` before any interface work.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/guided-setup-and-knowledge`, created by Fable from `main` after `brand-identity-ui` is merged
      (decision 11); confirm branch and base; `npm ci` — report: `reports/2026-09-30-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status`, and the
      state of the store (its tables and row counts, read with a command that is recorded) — report:
      `reports/2026-09-30-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red unit and route tests: the derived step states (decision 2), the upload results per file (decision 3), the
      sample business and its undo (decision 4), the suggested questions from headings (decision 6) — report:
      `reports/2026-09-30-step-2-tests-first.md`
- [x] 2.2 Red E2E for every scenario of `specs/owner-setup/spec.md`, "From zero to an answer" timed end to end, and an
      axe check of each new page in both languages — report: `reports/2026-09-30-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The welcome, the guided setup and the workspace navigation (decisions 1 and 2) — report:
      `reports/2026-09-30-step-3-implementation.md`
- [x] 3.2 Information: uploads, the sample business, the document page (decisions 3 to 5) — report:
      `reports/2026-09-30-step-3-implementation.md`
- [x] 3.3 Try it (decision 6) — report: `reports/2026-09-30-step-3-implementation.md`
- [x] 3.4 Publish with the live preview (decision 7) — report: `reports/2026-09-30-step-3-implementation.md`
- [x] 3.5 The public page: not ready, the AI disclosure and `/privacy` (decision 8) — report:
      `reports/2026-09-30-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why — report: `reports/2026-09-30-step-4-existing-tests.md`

## 5. Run the checks

- [ ] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD` —
      report: `reports/2026-09-30-step-5-checks.md`

## 6. Manual verification

- [ ] 6.1 `npm run build && npm run start` with the fake providers: `curl.exe` of `/admin` without the session, of `/`
      with no provider (not ready) and with one (disclosure), and of `/privacy` in both languages — report:
      `reports/2026-09-30-step-6-curl.md`

## 7. End-to-end

- [ ] 7.1 The E2E of 2.2 and the whole suite green; "From zero to an answer" under five minutes of scripted time;
      captures at 1440 and 375 px of the welcome, each step, a document page, Try it with a highlighted passage,
      Publish with the preview, and the public page not ready and ready — report: `reports/2026-09-30-step-7-e2e.md`

## 8. The state of the base after

- [ ] 8.1 Repeat 1.1, the state of the store included, and say which tables and counts changed and why — report: `reports/2026-09-30-step-8-base-after.md`

## 9. Documentation

- [ ] 9.1 `docs/owner-guide.md` (the four steps with captures, in both languages), the README (status table, a capture of
      the guided setup, "What quality to expect" untouched) and its twin — report: `reports/2026-09-30-step-9-docs.md`
- [ ] 9.2 The delivery `katalis-dev/tasks/entrega-community-13.md` in Spanish with `## Issues` — report:
      `reports/2026-09-30-step-9-docs.md`
