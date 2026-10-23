# Step 6: the Dependency audit of the pipeline and the lockfile

Date: 2026-10-21. Agent: Fable. Pull request #26, first CI runs of `78de1f3` (push `39704643555`, pull request
`39704650230`).

## What failed

Every job of both runs passed except `Dependency audit`, on both:

```
PASS  production audit: no finding of the high level or above in the production tree
FAIL  full audit: 2 advisories of the high level or above, 1 entries, 1 in force
FAIL  the high advisory GHSA-587h-7wmj-h5pm of vite is not in security/audit-exceptions.json
AUDIT: FAIL (1 problems)
```

Reproduced locally with `npm run audit:high` on the same tree: the same three lines, exit 1. `npm audit --json` names six
high advisories of `vite` 8.3.1 (the development dependency of Vitest), all with a published fix (`>=8.3.0 <=8.3.2` is
the vulnerable range): GHSA-698v-4r3x-3vcv, GHSA-r825-w8mm-5pxw, GHSA-587h-7wmj-h5pm, GHSA-9jrq-w75r-8gcw,
GHSA-rq7h-c2jc-7f22 and GHSA-vfpm-58rq-9qcg. The last run of `main` (`38059123187`, 2026-10-10) passed the same job,
so the failure is drift of the registry since then, not a consequence of this change. The production tree audits
clean.

## Why no exception

`security/audit-exceptions.json` accepts an entry only with evidence that no fixed version is published
(`noFixEvidence`, the requirement "Dependency audit with expiring exceptions" of `supply-chain-security`). A fix is
published, so the honest move is the upgrade, not an entry.

## The lockfile, regenerated on Linux

`npm update vite --package-lock-only` on Windows produced a lockfile without the `@emnapi/core` and `@emnapi/runtime`
entries (`grep -c '"node_modules/@emnapi' package-lock.json`: 3 before, 1 after), the known loss of the optional
platform packages when the lockfile is written from Windows. That result was discarded with `git checkout --
package-lock.json`. The change was then made in a Linux container, with only `package.json` and `package-lock.json`
copied into a temporary folder:

```
docker run --rm -v <temporary>:/work -w /work node:24 sh -c "npm update vite --package-lock-only --no-audit --no-fund"
```

Result, copied back as the only change: `vite` 8.3.1 to 8.3.5; `@emnapi` entries 3; no `node_modules/...` entry added
or removed (`git diff -U0 package-lock.json | grep -E '^[-+]\s+"node_modules/'` is empty); `package.json` untouched;
`1 file changed, 99 insertions(+), 81 deletions(-)`.

## After the upgrade, on Windows with Node v24.11.0

| Command | Result |
| --- | --- |
| `npm ci` | exit 0; `node_modules/vite` is 8.3.5 |
| `npm run audit:high` | `PASS production audit`, `PASS full audit: 1 advisories ..., 1 entries, 1 in force`, `AUDIT: PASS (1 entries in force, the nearest expiry 2026-11-08)`, exit 0 |
| `npm test` | `Test Files 100 passed (100)`, `Tests 1235 passed (1235)`, `Duration 53.01s`, exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 |

The remaining entry in force is the existing `braces` exception, which expires on 2026-11-08. The moderate advisories
of `@vitest/mocker` 5.0.2 and `sprintf-js` are below the gate and were left alone.
