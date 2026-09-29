Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`): the exact command, the commit and the output. A
task that cannot be verified is `[BLOCKED]` with the reason. Evidence rule: every `[x]` needs a real report that
supports it at archive time; a report in a later commit than its mark is recorded, not blocking, unless it is missing
or contradicts the mark. Commit in small steps on `feature/cited-identity-and-readme`: the commits are part of the
implementer's work. The repository will be public: no secret, no customer data, no text of the Construye book and no
licensed font file.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/cited-identity-and-readme`, created by Fable from `main` `5dec3af`; confirm branch and base;
      `npm ci` — report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`
- [x] 1.2 The state of the store: prove this change adds no persistence and that the quick start leaves no store file
      tracked by git — report: `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 `tests/readme.test.ts` with every scenario of `project-readme`, and the two scenarios of `product-identity`,
      run red against the current README and names; paste the red run — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation in small steps

- [x] 3.1 Identity: the name `Cited` in every tracked file outside `openspec/changes/archive/` as design decision 1,
      the MODIFIED home page, and the tests that name the product — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The banner script and template, the two banners and their record, as design decision 2 — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 The graphics script, its templates and every graphic of design decision 8 in both themes, the demo drawn
      from the real run of the quick start, the social preview, and `docs/images/readme-graphics.json` — report:
      `reports/2026-09-29-step-3-implementation.md`
- [x] 3.4 `README.md` as design decisions 3 to 8, then `README.es.md` as its Spanish twin (decision 6); copy rules of
      decision 7 — report: `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; update only the assertions of the old name, and say which and why — report:
      `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`,
      and the total weight of `docs/images/` — report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 The quick start of the README executed word for word on a clean clone of the branch inside a `node:24`
      container, with its output; `curl.exe -sI` of every shields badge (200 and `image/svg+xml`), the CI workflow
      badge (anonymous `404` while the repository is private), and one `POST https://api.github.com/markdown` of each
      README without a token (200) — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 Both READMEs rendered by the GitHub Markdown API with their images pointed at the local files, captured with
      Playwright at 1280 and 400 px in light and dark (first screen, about 1300 px high at 1280 and 1500 at 400), and
      one full-page capture of `README.md` at 1280 in dark; `npm run test:e2e` still green — report:
      `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 and 1.2 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/readme-assets.md`: how to re-render the banner and the graphics, which hosts the badges use, the size
      budget, and that the CI badge renders only for readers with access while the repository is private — report:
      `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-03.md` in Spanish, with the captures of 7.1 and every
      graphic in both themes, and `## Issues` — report: `reports/2026-09-29-step-9-docs.md`

## 10. After the merge (Fable only)

- [x] 10.1 Rename the GitHub repository to `cited`, update the remote, and prove that the old URL redirects — report:
      `reports/2026-09-29-step-10-rename.md`

## 11. Art direction, second pass (contract written by Fable after the first renders)

Evidence rule as above. Report: `reports/2026-09-29-step-11-art-direction.md`. Commit in small steps on
`feature/cited-identity-and-readme`. Section 10 stays reserved for Fable.

- [x] 11.1 Tests first: a test that decodes every PNG of `docs/images/` and asserts the luminance bounds of design
      decision 10 (dark variants and the social preview at 0.30 or less, light variants at 0.80 or more); paste the red
      run against the current graphics
- [x] 11.2 Re-design the templates of the graphics as design decision 10 says, card by card, and re-render every
      graphic in both themes and the social preview; `docs/images/readme-graphics.json` records the new texts; the
      README headlines follow the new ones
- [x] 11.3 Re-capture the four first screens of 7.1 and one full page of `README.md` in dark; put every graphic of
      both themes and the captures in the delivery, side by side with the first version, and say for each rule of
      decision 10 how it is met
- [x] 11.4 `npm test`, `npm run typecheck`, `npm run lint`, gitleaks, `openspec validate --all --strict`,
      `git diff --check main...HEAD`, the total weight of `docs/images/` at 3 MB or less; append the round to
      `katalis-dev/tasks/entrega-community-03.md` under its own heading with `## Issues`

## 12. Review round (contract written by Fable after `revision-community-03.md`)

Evidence rule as above. Report: `reports/2026-09-29-step-12-review-round.md`. Commit in small steps on
`feature/cited-identity-and-readme`. Section 10 stays reserved for Fable.

- [x] 12.1 Tests first, and each one red against the current files before the fix: the two new scenarios of
      `project-readme` (translated twin; only planned text speaks of answers), the luminance of the terminal area of
      `demo-light.png` at 0.30 or less, and the roadmap at 1280 px wide and 720 px or less high
- [x] 12.2 Major 1: the tagline and the second reason card as design decisions 2 and 10 now say, re-rendered in both
      themes with the banner, the social preview and every record; every sentence of both READMEs and `docs/` that
      promised an answer or a page today
- [x] 12.3 Major 2: `README.es.md` translated as design decision 11 says
- [x] 12.4 Major 3 and the teaser: the dark terminal in `demo-light.png`; the voice teaser copy of decision 11
- [x] 12.5 Minor: the report of 6.1 says exactly what was executed (the private repository cannot be cloned
      anonymously, so name the substitute and the lines it replaced)
- [x] 12.6 Re-capture the first screens of 7.1; `npm test`, `npm run typecheck`, `npm run lint`, gitleaks,
      `openspec validate --all --strict`, `git diff --check main...HEAD`, the weight of `docs/images/`; append the round
      to `katalis-dev/tasks/entrega-community-03.md` under its own heading with every graphic that changed and
      `## Issues`

## 13. Second review round (contract written by Fable after `revision-community-03b.md`)

Evidence rule as above. Report: `reports/2026-09-29-step-13-review-round.md`. Commit in small steps. Section 10 stays
reserved for Fable.

- [x] 13.1 Tests first: the amended scenario "Only planned text speaks of answers" over `docs/**/*.md` and every text
      field of both records, red against the current files; the render script cannot write a present-tense answer
      claim into a record
- [x] 13.2 Correct `docs/search.md`, `docs/backend-standards.md`, `docs/frontend-standards.md`, the records and any
      other place the test names, marking what is planned with the change that delivers it; re-render only what changed
- [x] 13.3 Minor: the report of 6.1 names `95459db` as the commit of its amendment
- [x] 13.4 `npm test`, `npm run typecheck`, `npm run lint`, gitleaks, `openspec validate --all --strict`,
      `git diff --check main...HEAD`; append the round to `katalis-dev/tasks/entrega-community-03.md` with `## Issues`

## 14. Third review round (contract written by Fable after `revision-community-03c.md`)

Evidence rule as above. Report: `reports/2026-09-29-step-14-review-round.md`. Commit in small steps.

- [x] 14.1 Tests first: a present-tense answer claim in any text field under `demo` other than the captured output
      lines turns the test red and makes the render guard exit non-zero; paste both red runs
- [x] 14.2 Replace the prefix exclusion of `demo` in `honesty.mjs` and `tests/readme.test.ts` by an exemption of the
      captured output lines only, as the amended scenario says; green
- [x] 14.3 `npm test`, `npm run typecheck`, `npm run lint`, gitleaks, `openspec validate --all --strict`,
      `git diff --check main...HEAD`; append the round to `katalis-dev/tasks/entrega-community-03.md` with `## Issues`
