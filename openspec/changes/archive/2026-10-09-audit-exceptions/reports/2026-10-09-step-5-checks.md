# Step 5 · the tests and the checks

- Date: 2026-10-09
- Change: `audit-exceptions`
- Branch: `feature/next-16-4`
- Agent: DeepSeek (implementer)
- Verified on: `6ec38a4`
- Verdict: done

## The machine

```
$ node -v
v24.11.0
$ npm -v
11.6.1
```

## The commands

Every command was run by the agent. The type check, the lint, the unit suite, the build, the strict OpenSpec
validation, the secret scan, the guard and the production audit are the statements of `scripts/gate-audit.mjs`, which
prints one line per check and closes with `GATE: GREEN`; the run of the gate is reported in
`reports/2026-10-09-step-9-gate.md`.

```
$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✓ Types generated successfully
exit 0
```

```
$ npm run lint
> eslint .
exit 0
```

```
$ npm run openspec:validate
> openspec validate --all --strict
✓ spec/admin-panel … ✓ change/audit-exceptions … ✓ spec/voice-agent
Totals: 14 passed, 0 failed (14 items)
exit 0
```

```
$ npm run secrets:scan
> gitleaks git --redact --no-banner
2:13AM INF 643 commits scanned.
2:13AM INF scanned ~8596930 bytes (8.60 MB) in 3.75s
2:13AM INF no leaks found
exit 0
```

```
$ npm run audit:high
> node scripts/audit-high.mjs
PASS  production audit: no finding of the high level or above in the production tree
PASS  full audit: 1 advisories of the high level or above, 1 entries, 1 in force
AUDIT: PASS (1 entries in force, the nearest expiry 2026-11-08)
exit 0
```

```
$ npm audit --omit=dev --audit-level=high
3 moderate severity vulnerabilities
exit 0
```

## The unit suite

```
$ node node_modules/vitest/vitest.mjs run --pool=threads --execArgv=--require=<preload>
 Test Files  92 files, in six groups of sixteen files and the spike file apart
      Tests  1091 passed (1091)
exit 0
```

The suite is the whole `tests/**/*.test.ts(x)` of the repository: 92 files and 1091 tests, the new
`tests/audit-high.test.ts` (11 of them) among them. The line per group, and the two groups that died at their close
and ran again in halves, are in `reports/2026-10-09-step-9-gate.md`, which is the run that printed `GATE: GREEN`. It
runs with the preload of the sandbox of this session because the sandbox forbids the pipe of a child and a single
process with the whole suite dies at its close with `0xC0000005`; `tests/spike/libsql-capabilities.test.ts` runs alone
because it measures the memory of its own process. On a machine without that sandbox, `npm test` runs the same files
in one command with the pool of processes.

## The build

```
$ npm run build          (with NODE_OPTIONS=--require=<preload>)
> next build
▲ Next.js 16.4.0 (Turbopack)
✓ Compiled successfully
  Finished TypeScript
exit 0
```

The preload is the one of the sandbox: Next.js runs the TypeScript check and the page-data workers with a pipe, and
the sandbox denies it. The build of the pipeline is the same command without the preload.

## What the change does not owe

- No end-to-end suite: the change has no frontend and no route (step 7 of `tasks.md`).
- No manual HTTP: the change adds no endpoint (step 6 of `tasks.md`, which reports the guard by hand instead).
