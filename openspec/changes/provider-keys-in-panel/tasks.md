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

- [ ] 1.1 `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status` — report:
      `reports/2026-09-29-step-1-base-before.md`

## 2. Tests first

- [ ] 2.1 Red unit tests for `lib/secrets/` (round trip, tamper detection, no key, wrong key) and for the resolver (server
      wins, panel next, none) — report: `reports/2026-09-29-step-2-tests-first.md`
- [ ] 2.2 Red route tests for every scenario of `specs/provider-settings/spec.md`, of the MODIFIED `answering` and
      `knowledge-search` requirements, with local HTTP doubles for OpenAI-compatible, Anthropic, Gemini and Ollama
      responses (200, 401, 402 or insufficient quota, 404 model, 429, a hang past the timeout) — report:
      `reports/2026-09-29-step-2-tests-first.md`
- [ ] 2.3 Red E2E: connect a chat provider through its double, see the last four characters, a rejected key in words,
      keyword mode, the server-set state, affiliate links on and off, and the hosted offer — report:
      `reports/2026-09-29-step-2-tests-first.md`

## 3. Implementation

- [ ] 3.1 `lib/secrets/`, the table and the resolver, and the answer pipeline and the ingestion reading through it
      (decisions 1 to 3) — report: `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.2 The test, save and remove routes (decision 4) and the embeddings rule with keyword mode and re-indexing
      (decision 5) — report: `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.3 The catalogue and the links (decisions 6 and 7) — report: `reports/2026-09-29-step-3-implementation.md`
- [ ] 3.4 The page "AI and keys" and "For the installer" (decision 8), English first and Spanish complete — report:
      `reports/2026-09-29-step-3-implementation.md`

## 4. Review and update of the existing tests

- [ ] 4.1 The whole suite; say which test changed and why — report: `reports/2026-09-29-step-4-existing-tests.md`

## 5. Run the checks

- [ ] 5.1 `npm test` on Windows and in a `node:24` Linux container, `npm run typecheck`, `npm run lint`,
      `npm audit --audit-level=high`, gitleaks, `openspec validate --all --strict`, `git diff --check main...HEAD` —
      report: `reports/2026-09-29-step-5-checks.md`

## 6. Manual verification with curl

- [ ] 6.1 `npm run build && npm run start` with a generated `ENCRYPTION_KEY` and a local double: `curl.exe` of the test
      route without the session (`401`), with it and a good key, with a rejected key, the save, then every
      `/api/admin/*` response and the store read for the key (absent) — report: `reports/2026-09-29-step-6-curl.md`

## 7. End-to-end

- [ ] 7.1 The E2E of 2.3 and the whole suite green; captures of "AI and keys" at 1440 and 375 px (connected, rejected,
      server-set) and of "For the installer" — report: `reports/2026-09-29-step-7-e2e.md`

## 8. The state of the base after

- [ ] 8.1 Repeat 1.1 — report: `reports/2026-09-29-step-8-base-after.md`

## 9. Documentation

- [ ] 9.1 `docs/providers.md` (the catalogue, where each processes data, the encryption, the server-over-panel rule,
      keyword mode, affiliate disclosure and `AFFILIATE_LINKS`), `.env.example`, `docs/security.md`, the README status
      table and its twin — report: `reports/2026-09-29-step-9-docs.md`
- [ ] 9.2 The delivery `katalis-dev/tasks/entrega-community-12.md` in Spanish with `## Issues` — report:
      `reports/2026-09-29-step-9-docs.md`
