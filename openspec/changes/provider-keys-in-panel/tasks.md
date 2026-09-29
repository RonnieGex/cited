Contract written by Fable (2026-09-29). DeepSeek executes it and never edits the text of a task. A task is `[x]` only
with evidence in its report (`reports/2026-09-29-step-N-<name>.md`, a folder inside this change, always written
relative to the change so the path holds after archive; never `reports/` at the root of the repository): the exact
command, the commit and the output. Evidence rule: every `[x]` needs a real report that supports it at archive time; a
report in a later commit than its mark is recorded, not blocking, unless it is missing or contradicts the mark. Commit
in small steps on `feature/provider-keys-in-panel`: the commits are part of the implementer's work. The repository will
be public: no secret, no customer data, no personal path. No network call to a real provider in any test: every
provider is a local HTTP double. Read `PRODUCT.md` and `katalis-dev/tasks/diseno-cited/brief-experiencia.md` before any
interface work.

## 0. Step 0: the branch

- [x] 0.1 Work on `feature/provider-keys-in-panel`, created by Fable from `main`; confirm branch and base; `npm ci` —
      report: `reports/2026-09-29-step-0-branch.md`

## 1. The state of the base before

- [x] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [x] 2.1 Red unit tests for `lib/secrets/` (round trip, tamper detection, no key, wrong key) and for the resolver (server
      wins, panel next, none) — report: `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.2 Red route tests for every scenario of `specs/provider-settings/spec.md`, of the MODIFIED `answering` and
      `knowledge-search` requirements, with local HTTP doubles for OpenAI-compatible, Anthropic, Gemini and Ollama
      responses (200, 401, 402 or insufficient quota, 404 model, 429, a hang past the timeout) — report:
      `reports/2026-09-29-step-2-tests-first.md`
- [x] 2.3 Red E2E: connect a chat provider through its double, see the last four characters, a rejected key in words,
      keyword mode, the server-set state, affiliate links on and off, and the hosted offer — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [x] 3.1 `lib/secrets/`, the table and the resolver, and the answer pipeline and the ingestion reading through it
      (decisions 1 to 3) — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.2 The test, save and remove routes (decision 4) and the embeddings rule with keyword mode and re-indexing
      (decision 5) — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.3 The catalogue and the links (decisions 6 and 7) — report: `reports/2026-09-29-step-3-implementation.md`
- [x] 3.4 The page "AI and keys" and "For the installer" (decision 8), English first and Spanish complete — report:
      `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [x] 4.1 The whole suite; say which test changed and why — report: `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [x] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD` —
      report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [x] 6.1 `npm run build && npm run start` with a generated `ENCRYPTION_KEY` and a local double: `curl.exe` of the test
      route without the session (`401`), with it and a good key, with a rejected key, the save, then every
      `/api/admin/*` response and the store read for the key (absent) — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [x] 7.1 The E2E of 2.3 and the whole suite green; captures of "AI and keys" at 1440 and 375 px (connected, rejected,
      server-set) and of "For the installer" — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [x] 8.1 Repeat 1.1 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [x] 9.1 `docs/providers.md` (the catalogue, where each processes data, the encryption, the server-over-panel rule,
      keyword mode, affiliate disclosure and `AFFILIATE_LINKS`), `.env.example`, `docs/security.md`, the README status
      table and its twin — report: `reports/2026-09-29-step-9-docs.md`
- [x] 9.2 The delivery `katalis-dev/tasks/entrega-community-12.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`

## 10. What the review of Codex reproduced (contract amended by Fable after `revision-community-12`)

Report: `reports/2026-09-29-step-10-review-fixes.md`. Tests first, red before each fix, reproducing what the review
reproduced.

- [x] 10.1 Blocker: no provider error text leaves the server (requirement "No provider error reaches the browser"), with
      a double that echoes the key — report: the one of this section
- [x] 10.2 Major: the provider address rules against private networks (requirement "A provider address cannot reach
      private networks"), `ALLOW_LOCAL_PROVIDERS` in `.env.example` and `docs/providers.md` — report: the one of this
      section
- [x] 10.3 Major: the atomic test limit (requirement "The test limit holds under concurrency") — report: the one of this
      section
- [x] 10.4 Major: the pages follow the amended proposal (no variable name outside "For the installer"), with a test that
      reads every panel page — report: the one of this section
- [x] 10.5 Major: the E2E with affiliate links on, and the read of every `/api/admin/*` response and of the store for
      the saved key, as 6.1 asked — report: the one of this section
- [x] 10.6 Major (a gap of Fable's contract): the state of the store before and after this change (tables and row
      counts, the new table empty before and as expected after), with the exact commands — report: the one of this
      section
- [x] 10.7 Minors: the count of commits in the delivery, and gitleaks recorded for every commit of this round —
      report: the one of this section
- [x] 10.8 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm run test:e2e`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD`; append the round
      to `katalis-dev/tasks/entrega-community-12.md` with `## Issues` — report: the one of this section

## 11. What the second review of Codex reproduced (contract amended by Fable after `revision-community-12b`)

Report: `reports/2026-09-29-step-11-review-fixes.md`. Tests first, red before each fix, reproducing what the review
reproduced.

- [ ] 11.1 Major: the classification of addresses in every notation (requirement "The address that was validated is the
      address that is connected to", scenario "A mapped address"), a table test with `::ffff:7f00:1`,
      `::ffff:127.0.0.1`, `::ffff:a00:1`, `fc00::1`, `fe80::1`, `::`, `::1`, `64:ff9b::7f00:1`, `2002:7f00:1::1` and the
      IPv4 ranges of the earlier requirement; prefer `node:net` `BlockList` over hand-written arithmetic — report: the
      one of this section
- [ ] 11.2 Major: the validated address is the address connected to, for the test and for every chat or embeddings call
      that uses an owner-supplied base URL (scenario "A name that changes its answer"): a fetch that connects with
      `node:http` or `node:https` and a `lookup` that returns the classified address (the TLS name stays the host's), no
      new dependency, used by the test route and passed as `fetch` to the provider clients — report: the one of this
      section
- [ ] 11.3 Major: reason codes in the routes and owner words in the page (requirement "The owner never reads a variable
      name in an answer of the panel"), with a test that reads every response of the provider routes and every panel
      page for variable names outside "For the installer" — report: the one of this section
- [ ] 11.4 Major (the evidence of 10.6): a state reader that opens the store read-only (`node:sqlite` with
      `readOnly: true`, never the libSQL client, which creates and migrates), the state before measured on a copy of a
      store created by the code of `main` (a temporary worktree of `main`, its ingest, its file copied) and the state
      after on the same copy opened by the code of this branch, the new table absent before and present and empty after,
      with every command recorded — report: the one of this section
- [ ] 11.5 Minor: the delivery names the final HEAD and the count of commits computed with `git rev-list --count
      main..HEAD` after the last commit — report: the one of this section
- [ ] 11.6 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm run test:e2e`, gitleaks per commit, `openspec validate --all --strict`, `git diff --check main...HEAD`;
      append the round to `katalis-dev/tasks/entrega-community-12.md` with `## Issues` — report: the one of this section
