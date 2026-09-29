Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`): the exact command, the commit and the output.
Evidence rule: every `[x]` needs a real report that supports it at archive time; a report in a later commit than its
mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit in small steps on
`feature/brand-and-design-system`: the commits are part of the implementer's work. The repository will be public: no
secret, no customer data, no licensed font.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/brand-and-design-system` in the worktree `katalis-dev/community-ui`, created by Fable from
      `main` `aa52b7c`; confirm branch and base; `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status`; the change
      adds no persistence — report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red tests for every scenario of `specs/design-system/spec.md` that a unit test can read (hashes of the flame,
      the variant record, no invented logo, the tokens against the recorded values, the font files and their names) —
      report: `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Red E2E for the computed font of `html`, `body` and a paragraph, no request to an external font host, and
      `/kit` with its components and an axe check — report: `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 The flame files and the ink variants with their script and record (decisions 1 and 2) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The flame in the README foot of both languages, the banner and the social preview re-rendered with it, the
      invented logo removed and refused by the guard (decision 3) — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 Tokens, Outfit and the kit with `/kit` (decisions 4 to 6) — report:
      `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why — report: `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`, the
      luminance tests of the graphics — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start`, then `curl.exe` of `/`, `/kit` and the Outfit file: 200, and the font file
      served from the app — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 The E2E of 2.2 green; captures of `/kit` at 1440 and 375 px; the rendered README (GitHub Markdown API, images
      pointed at the local files) first screen and foot, light and dark — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/design-system.md`: tokens next to Construye, the font and its license, the flame and its hashes, the kit;
      `docs/readme-assets.md` updated — report: `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-04.md` in Spanish, with the captures and `## Issues` —
      report: `reports/2026-09-29-step-9-docs.md`

## 10. The flame has to be seen (contract written by Fable after looking at the banner)

Evidence rule as above. Report: `reports/2026-09-29-step-10-flame-size.md`. Commit in small steps.

- [ ] 10.1 Tests first: the records of the banner and of the social preview state the rendered height of the flame, and
      a test asserts at least 40 px in both banners and 64 px in the social preview; red against the current 19 px
- [ ] 10.2 Re-render both banners and the social preview with the flame at those sizes, beside `by Katalis`, keeping the
      luminance and the honesty tests green; the README foot stays at 48 px
- [ ] 10.3 `.gitattributes` marks `public/fonts/outfit/OFL.txt` with `-whitespace`, so the licence stays byte for byte and
      `git diff --check main...HEAD` exits 0; show both
- [ ] 10.4 `npm test`, `npm run typecheck`, `npm run lint`, gitleaks, `openspec validate --all --strict`; append the
      round to `katalis-dev/tasks/entrega-community-04.md` with the new images and `## Issues`
