Contract of Fable for DeepSeek, 2026-10-09: the mandatory check `Dependency audit` is red in `main` and in every
branch and it blocks the merge of `mcp-server`. DeepSeek implements, an independent session reviews, Franc accepts. A
task is `[x]` only with its exact command and its result in a report under `reports/YYYY-MM-DD-step-N-<name>.md`,
naming the commit of the code it verified.

## 0. Step 0: the branch

- [x] 0.1 `feature/next-16-4`, created by Fable from `origin/main` at `f644f85`, with this contract; the worktree came
      with `next` and `eslint-config-next` raised to 16.4.0 uncommitted, and `4b9b038` is that bump with its lock
      (`reports/2026-10-09-step-0-branch.md`)

## 1. Base before

- [x] 1.1 The measured base on `4b9b038`: `node -v`, `npm -v`, `npm audit --audit-level=high`,
      `npm audit --omit=dev --audit-level=high`, the versions of `source-map-js` and `braces` installed, and what the
      registry answers as the newest version of each, in `reports/2026-10-09-step-1-base.md`

## 2. Tests first (red on `4b9b038`)

- [x] 2.1 `tests/fixtures/audit/`: the payloads of `npm audit --json`, of `npm audit --omit=dev --json` and of
      `npm ls --omit=dev --all --json`, saved and written by hand, so no test opens a socket
- [x] 2.2 `tests/audit-high.test.ts`: every scenario of the delta of `supply-chain-security` has its case (the
      production tree clean and a finding in it, an advisory that no entry lists, an expired entry, an entry longer
      than 30 days, an entry of the production tree, an entry without its evidence or malformed, only current
      exceptions, and a payload that cannot be read), red before the guard exists

## 3. Implementation

- [x] 3.1 `overrides` raises `source-map-js` to 1.2.2 in `package.json` and `package-lock.json`, with `next` staying
      at 16.4.0 (decision 1)
- [x] 3.2 `security/audit-exceptions.json` with the one entry of `braces`, `GHSA-vfj7-8cjw-p6xm`, expiring 2026-11-08,
      with its reason and its evidence (decision 5)
- [x] 3.3 `scripts/audit-high.mjs`: the four inputs, the pair (GHSA, package), the production tree with no exception,
      the 30 days and the malformed entry (decisions 2 to 7)
- [x] 3.4 `npm run audit:high` runs `node scripts/audit-high.mjs`; the job `Dependency audit` of
      `.github/workflows/ci.yml` keeps calling `npm run audit:high`, with no edit

## 4. Existing tests

- [x] 4.1 `tests/third-party-notices.test.ts` stays green with the new lock, and the suite that reads
      `package.json` and `docs/` stays green with the new script and the new paragraphs

## 5. Run the tests and the checks

- [x] 5.1 `npm run typecheck`, `npm run lint`, the whole unit suite (counts, runtime and `node -v`), `npm run build`,
      `npm run secrets:scan`, `npm run openspec:validate`, `npm run audit:high` and
      `npm audit --omit=dev --audit-level=high`, in `reports/2026-10-09-step-5-checks.md`

## 6. Manual verification

- [x] 6.1 `node scripts/audit-high.mjs` by hand on the real tree (exit code and output pasted), the same guard against
      every red fixture of `tests/fixtures/audit/` (each one exits non-zero and names the finding) and against the
      green one (exits 0), in `reports/2026-10-09-step-6-manual.md`

## 7. End to end

- [x] 7.1 Not applicable: the change has no frontend and no route; the report says so

## 8. Documentation

- [x] 8.1 `SECURITY.md` and `docs/security.md` (the row of the dependency audit) state the rule and how an exception is
      added or renewed; `docs/development-guide.md` names the guard, and
      `docs/openspec-tasks-mandatory-steps.md` names what `npm run audit:high` runs (decision 8 of the proposal)

## 9. Close

- [x] 9.1 `scripts/gate-audit.mjs`, green: it affirms the type check, the lint, the unit suite, the build, the strict
      OpenSpec validation, the secret scan, the guard, the production audit and the red fixtures, in
      `reports/2026-10-09-step-9-gate.md`
- [x] 9.2 `## Issues` at the end of the last report, with the decisions taken by the implementer
- [x] 9.3 `tasks/entrega-cited-audit-exceptions.md` in `katalis-dev`, in Mexican Spanish, with the table of the gate
- [x] 9.4 `STATUS: DONE` in `LOOP_STATE.md`; Fable pushes, an independent session reviews and Franc accepts
