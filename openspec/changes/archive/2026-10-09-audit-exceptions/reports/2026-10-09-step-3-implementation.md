# Step 3 · the implementation

- Date: 2026-10-09
- Change: `audit-exceptions`
- Branch: `feature/next-16-4`
- Agent: DeepSeek (implementer)
- Verdict: done

## The fix of what has a fix

`package.json` gains `"overrides": { "source-map-js": "1.2.2" }` and `next` stays at `16.4.0`; `package-lock.json`
resolves the one hoisted entry to `1.2.2`:

```
$ npm install --no-audit --no-fund
added 120 packages, and changed 1 package in 2s
exit 0

$ node -e "const l=require('./package-lock.json'); console.log(JSON.stringify(Object.entries(l.packages).filter(([k])=>k.includes('source-map-js'))))"
[["node_modules/source-map-js",{"version":"1.2.2","resolved":"https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.2.tgz", ...}]]
```

`npm ls source-map-js` shows the same single hoisted entry at `1.2.2` under `next/node_modules/postcss`,
`@tailwindcss/node` and `css-tree`.

## The exception of what has no fix

`security/audit-exceptions.json`, with the five fields:

```json
{
  "exceptions": [
    {
      "id": "GHSA-vfj7-8cjw-p6xm",
      "package": "braces",
      "reason": "Stack exhaustion through a deeply nested brace pattern. It is reachable only through eslint-config-next, @next/eslint-plugin-next, fast-glob and micromatch, a development chain that no request of an installation reaches and that is not installed in production.",
      "noFixEvidence": "3.0.3 is the newest version published on the registry (https://registry.npmjs.org/braces, read on 2026-10-09) and the advisory publishes no patched version, so no version of braces fixes it. ...",
      "expires": "2026-11-08"
    }
  ]
}
```

The expiry is 30 days after the day of the round (2026-10-09), which is the maximum the requirement allows.

## The guard

`scripts/audit-high.mjs`, with no new dependency:

- It reads the payload of `npm audit --json`, the payload of `npm audit --omit=dev --json`, the installed production
  tree and `security/audit-exceptions.json`. Each of the first three can be given as a file, so the suite runs with
  fixtures and no socket.
- It fails when the production tree carries a finding of the high level or above, when an advisory of the high level
  or above is not an entry of the file, when an entry is expired, when an entry asks for more than 30 days, when an
  entry names a package of the production tree, when an entry has no identifier, no package, no reason or no evidence,
  and when a payload cannot be read or parsed.
- npm is spawned as `process.execPath` on the command line that `npm_execpath` names, with a temporary file for its
  payload, never through a shell and never by parsing a human report.

```
$ npm run audit:high
PASS  production audit: no finding of the high level or above in the production tree
PASS  full audit: 1 advisories of the high level or above, 1 entries, 1 in force
AUDIT: PASS (1 entries in force, the nearest expiry 2026-11-08)
exit 0
```

## The pipeline

`package.json`:

```
-    "audit:high": "npm audit --audit-level=high",
+    "audit:high": "node scripts/audit-high.mjs",
```

The job `Dependency audit` of `.github/workflows/ci.yml` was not edited: it already calls `npm run audit:high`, and
that is the requirement. `scripts/gate-audit.mjs` reads the workflow and fails when the call is not there.

## What the guard is not

It is not a review of the advisories and it does not look for a fix: it records what the tree reports, and it forces
the file to be read again every 30 days, because an entry that nobody renewed stops the pipeline. A new advisory at the
high level, in production or in development, still stops it on the day it appears.
