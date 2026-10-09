## Why

The mandatory check `Dependency audit` is red in `main` and in every branch, and it blocks the merge of `mcp-server`.
`npm audit --audit-level=high` on the tree of `f644f85` with `next@16.4.0` reports two high advisories, and the
production tree carries one of them:

- `source-map-js` below 1.2.2 (GHSA-68fv-2mgg-jv7q), with a published fix: 1.2.2 was published on 2026-09-30. It
  arrives through `postcss`, which is production code inside `next`, and through `@tailwindcss/node` and `css-tree`.
- `braces` up to 3.0.3 (GHSA-vfj7-8cjw-p6xm), with no published fix: 3.0.3 is the newest version of the package. It
  arrives only through `eslint-config-next` to `@next/eslint-plugin-next` to `fast-glob` to `micromatch`, a
  development chain. The other entries at the high level are that same chain.

A blocking job that is red with no way to record a known advisory without a fix forces one of two dishonest moves:
weaken the check, or report a red tree as green. This change fixes what has a fix and gives the unfixable advisory an
exception that carries its evidence and expires.

## What Changes

- `overrides` in `package.json` raises `source-map-js` to 1.2.2 in the whole tree, and `next` stays at 16.4.0.
- `npm run audit:high` runs `scripts/audit-high.mjs`, a guard with no new dependency: the production tree audits clean
  and accepts no exception, and the whole tree audits clean except the advisories of
  `security/audit-exceptions.json`.
- Every entry of that file carries the identifier of the advisory (GHSA), the package, the reason, the evidence that
  no fixed version is published and an expiry date of 30 days at most after the day of the run.
- The list starts with one entry: `GHSA-vfj7-8cjw-p6xm` (`braces`), expiring 2026-11-08.
- The job `Dependency audit` of `.github/workflows/ci.yml` keeps calling `npm run audit:high`.
- `SECURITY.md` and `docs/` say what the rule is and how an exception is added or renewed.
- A delta of the capability `supply-chain-security` rewrites the requirement about the blocking pipeline and adds the
  requirement of the expiring exceptions.

## Impact

- Repository: `package.json` (the `overrides`, the `audit:high` script), `package-lock.json`,
  `scripts/audit-high.mjs`, `scripts/gate-audit.mjs`, `security/audit-exceptions.json`, `tests/audit-high.test.ts`,
  `tests/fixtures/audit/`.
- Docs: `SECURITY.md`, `docs/security.md` (the row of the dependency audit), `docs/development-guide.md` and
  `docs/openspec-tasks-mandatory-steps.md`.
- Specs: one delta of `supply-chain-security`.
- No change to the application.
