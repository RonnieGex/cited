Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`): the exact command, the commit and the output. A
task that cannot be verified is `[BLOCKED]` with the reason. Evidence rule: every `[x]` needs a real report that
supports it at archive time; a report in a later commit than its mark is recorded, not blocking, unless it is missing
or contradicts the mark. Commit in small steps on `feature/cited-identity-and-readme`: the commits are part of the
implementer's work. The repository will be public: no secret, no customer data, no text of the Construye book and no
licensed font file.

## 0. Step 0: the branch

- [ ] 0.1 Work on `feature/cited-identity-and-readme`, created by Fable from `main` `5dec3af`; confirm branch and base;
      `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [ ] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`
- [ ] 1.2 The state of the store: prove this change adds no persistence and that the quick start leaves no store file
      tracked by git — report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [ ] 2.1 `tests/readme.test.ts` with every scenario of `project-readme`, and the two scenarios of `product-identity`,
      run red against the current README and names; paste the red run — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation in small steps

- [ ] 3.1 Identity: the name `Cited` in every tracked file outside `openspec/changes/archive/` as design decision 1,
      the MODIFIED home page, and the tests that name the product — report:
      `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.2 The banner script and template, the two banners and their record, as design decision 2 — report:
      `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.3 The graphics script, its templates and every graphic of design decision 8 in both themes, the demo drawn
      from the real run of the quick start, the social preview, and `docs/images/readme-graphics.json` — report:
      `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.4 `README.md` as design decisions 3 to 8, then `README.es.md` as its Spanish twin (decision 6); copy rules of
      decision 7 — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [ ] 4.1 The whole suite; update only the assertions of the old name, and say which and why — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [ ] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`,
      and the total weight of `docs/images/` — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [ ] 6.1 The quick start of the README executed word for word on a clean clone of the branch inside a `node:24`
      container, with its output; `curl.exe -sI` of every shields badge (200 and `image/svg+xml`), the CI workflow
      badge (anonymous `404` while the repository is private), and one `POST https://api.github.com/markdown` of each
      README without a token (200) — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [ ] 7.1 Both READMEs rendered by the GitHub Markdown API with their images pointed at the local files, captured with
      Playwright at 1280 and 400 px in light and dark (first screen, about 1300 px high at 1280 and 1500 at 400), and
      one full-page capture of `README.md` at 1280 in dark; `npm run test:e2e` still green — report:
      `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [ ] 8.1 Repeat 1.1 and 1.2 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [ ] 9.1 `docs/readme-assets.md`: how to re-render the banner and the graphics, which hosts the badges use, the size
      budget, and that the CI badge renders only for readers with access while the repository is private — report:
      `reports/2026-09-29-step-9-docs.md`
- [ ] 9.2 The delivery `katalis-dev/tasks/entrega-community-03.md` in Spanish, with the captures of 7.1 and every
      graphic in both themes, and `## Issues` — report: `reports/2026-09-29-step-9-docs.md`

## 10. After the merge (Fable only)

- [ ] 10.1 Rename the GitHub repository to `cited`, update the remote, and prove that the old URL redirects — report:
      `reports/2026-09-29-step-10-rename.md`
