# LOOP_STATE · Cited

STATUS: RUNNING
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
  `eslint-config-next` to 16.4.0 exactly that came uncommitted in the worktree.
- **Step 1**: the measured base with `next@16.4.0`: two high advisories of the tree (`source-map-js` through
  `postcss`, `braces` through `eslint-config-next`), 20 entries at the high level, three moderate; the production tree
  (`npm audit --omit=dev`) carries the `source-map-js` chain alone, three entries.
- Phases 2 to 9 are open: the spec delta, the red tests with saved payloads, the guard, the gate, the documentation
  and the close.

## Gate

`scripts/gate-audit.mjs` is not written yet. Nothing has been printed.

## Environment notes

- The sandbox of this session denies a child process whose stdio carries a pipe (spawn EPERM), so Vitest is run with
  `--pool=threads` and a local preload that replaces the pipe with a temporary file
  (`<workspace>/.dsh-sandbox-shim.cjs`, never versioned). The repository is not touched by it.
- `npx -y -p node@24` cannot run here for the same reason, so the suite runs with the Node 24 of the PATH
  (v24.11.0). The gate prints the Node version it used.
