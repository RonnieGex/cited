# Step 6 · the manual verification

- Date: 2026-10-09
- Change: `audit-exceptions`
- Branch: `feature/next-16-4`
- Agent: DeepSeek (implementer)
- Verdict: done

The change has no endpoint, so the manual verification is the guard itself: the command of the pipeline against the
real tree, and the same command against every fixture of `tests/fixtures/audit/`, with the exit code read by hand.

## The command of the pipeline

```
$ npm run audit:high
> cited@0.1.0 audit:high
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

The production audit exits 0: the three remaining entries are moderate (`sprintf-js` through `mammoth`), below the
level the job stops at, and the `source-map-js` chain of the base is gone.

## The guard against every fixture

```
$ node scripts/audit-high.mjs --audit-file tests/fixtures/audit/<case> \
    --prod-audit-file tests/fixtures/audit/<production> \
    --prod-tree-file tests/fixtures/audit/production-tree.json \
    --exceptions-file tests/fixtures/audit/<entries> --today 2026-10-09
```

| Case | The payloads | Exit | The guard said |
|---|---|---|---|
| a tree whose only advisory is an entry in force | `tree-of-head.json`, `production-clean.json`, `exceptions-of-braces.json` | 0 | `AUDIT: PASS (1 entries in force, the nearest expiry 2026-11-08)` |
| the measured base (`source-map-js` with no entry) | `tree-of-f644f85.json`, `production-clean.json`, `exceptions-of-braces.json` | 1 | `the high advisory GHSA-68fv-2mgg-jv7q of source-map-js is not in security/audit-exceptions.json` |
| a new advisory | `tree-with-a-new-advisory.json`, `production-clean.json`, `exceptions-of-braces.json` | 1 | `the high advisory GHSA-aaaa-bbbb-cccc of left-pad is not in security/audit-exceptions.json` |
| a finding of the production tree | `tree-of-head.json`, `production-of-f644f85.json`, `exceptions-of-braces.json` | 1 | `the production tree carries high GHSA-68fv-2mgg-jv7q in source-map-js, and no exception covers the production tree` |
| an expired entry | `tree-of-head.json`, `production-clean.json`, `exceptions-expired.json` | 1 | `entry 0 (GHSA-vfj7-8cjw-p6xm) expired on 2026-10-08` |
| an entry of 45 days | `tree-of-head.json`, `production-clean.json`, `exceptions-that-ask-45-days.json` | 1 | `entry 0 (GHSA-vfj7-8cjw-p6xm) asks for 45 days and the maximum is 30` |
| an entry of a package of the production tree | `tree-without-high.json`, `production-clean.json`, `exceptions-of-a-production-package.json` | 1 | `entry 0 (GHSA-hp3w-g68c-fv3c) excepts postcss, a package of the production tree, where no exception is allowed` |
| an entry without its evidence | `tree-of-head.json`, `production-clean.json`, `exceptions-without-evidence.json` | 1 | `entry 0 (GHSA-vfj7-8cjw-p6xm) carries no evidence that no fixed version is published` |
| a malformed entry | `tree-without-high.json`, `production-clean.json`, `exceptions-malformed.json` | 1 | `entry 0 (GHSA-XX) has no GHSA identifier`, `names no package`, `carries no reason`, `carries no real date of expiry` (five problems) |
| a payload that is not an audit | `not-an-audit-payload.json`, `production-clean.json`, `exceptions-of-braces.json` | 1 | `the payload of npm audit is not a payload of npm audit: it carries no vulnerabilities` |

Every red case exits 1 and names the finding; the one green case exits 0. `scripts/gate-audit.mjs` runs the same ten
commands as part of its own statements, so the behaviour is checked again on every run of the gate.

## What was not run

- No `curl`: the change adds no route and no server.
- No Playwright: the change has no frontend (step 7 of `tasks.md`).
- `npx -y -p node@24` cannot run in this session, because the sandbox refuses the pipe of a child; the version of the
  Node that ran every command is named in every report (`v24.11.0`, the Node 24 of the PATH).
