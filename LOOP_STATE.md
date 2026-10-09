# LOOP_STATE · Cited

STATUS: DONE
CHANGE: audit-exceptions (OpenSpec)
BRANCH: feature/next-16-4
BASE: f644f85 (origin/main); 4b9b038 raises next and eslint-config-next to 16.4.0
AGENT: DeepSeek (implementer), contract by Fable
DATE: 2026-10-09

## Objective

Fix the mandatory check `Dependency audit`, red in `main` and in every branch, without weakening it: raise
`source-map-js` to 1.2.2, keep the production tree clean with no exception possible, and record the one advisory that
has no published fix (`braces`, GHSA-vfj7-8cjw-p6xm) as an exception that expires on 2026-11-08. The guard
`scripts/audit-high.mjs` is what `npm run audit:high` runs, and the job `Dependency audit` of
`.github/workflows/ci.yml` keeps calling `npm run audit:high`.

## Progress

- **Step 0**: the branch `feature/next-16-4` of Fable at `f644f85` carries the commit `4b9b038`, the bump of `next` and
  `eslint-config-next` to 16.4.0 exactly that came uncommitted in the worktree
  (`reports/2026-10-09-step-0-branch.md`).
- **Step 1**: the measured base with `next@16.4.0`: two high advisories of the tree (`source-map-js` through
  `postcss`, `braces` through `eslint-config-next`), the production tree with the `source-map-js` chain at the high
  level, and the registry answering 1.2.2 for `source-map-js` and 3.0.3 for `braces`
  (`reports/2026-10-09-step-1-base.md`).
- **Step 2**: `tests/fixtures/audit/` with the saved payloads of the day and `tests/audit-high.test.ts` with one case
  per scenario of the delta; the red is the suite without the guard and the guard against the payload of the base
  (`reports/2026-10-09-step-2-red.md`).
- **Step 3**: `overrides` raises `source-map-js` to 1.2.2, `security/audit-exceptions.json` carries the one entry, and
  `scripts/audit-high.mjs` is the guard (`reports/2026-10-09-step-3-implementation.md`).
- **Steps 4 to 8**: the existing suite stays green, the checks pass, the guard was verified by hand against every
  fixture, the change has no frontend, and `SECURITY.md` and `docs/` carry the rule
  (`reports/2026-10-09-step-5-checks.md`, `reports/2026-10-09-step-6-manual.md`).
- **Step 9**: `scripts/gate-audit.mjs` printed `GATE: GREEN` with exit 0 on the tree of `6ec38a4`, with the `## Issues`
  of the round in `reports/2026-10-09-step-9-gate.md`.

Step 9.5 of the contract (Fable pushes, an independent review, Franc accepts) is not mine and stays open.

## Gate

`node scripts/gate-audit.mjs --shim <the preload of the sandbox>` on `6ec38a4`, with the fixtures of the day:
`GATE: GREEN`, exit 0. Every statement passed: typecheck, lint, 1091 tests of 92 files, build, 14 of 14 specs, the
secret scan over 643 commits, `npm run audit:high`, `npm audit --omit=dev --audit-level=high`, the contract of the fix
and the nine red fixtures.

## Environment notes

- The sandbox of this session denies a child process whose stdio carries a pipe (spawn EPERM). Vitest runs with
  `--pool=threads`, the suite in groups of sixteen files, and a local preload that replaces the pipe with a temporary
  file (`<workspace>/.dsh-sandbox-shim.cjs`, never versioned). The repository is not touched by it.
- The build of Next.js runs with the same preload, because it starts the TypeScript check and its page-data workers
  with a pipe.
- `npx -y -p node@24` cannot run here for the same reason, so the suite runs with the Node 24 of the PATH
  (v24.11.0); every report names it.
- The local hook `.githooks/pre-commit` cannot run here either (`sh.exe` dies with a CreateFileMapping error); the
  control that did run is `npm run secrets:scan` over the whole history.
