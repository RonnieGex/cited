# Step 7 report - bootstrap: local verification of every pipeline command

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: `9f3770d716ef724ae567bda441232818ab81620c` is the head of the branch when this report was written; the
  reports themselves are committed after it.

## Toolchain (measured on this machine)

| Tool | Version |
|---|---|
| Windows PowerShell | 5.1.26100 (the `pwsh` of the harness) |
| Node | v24.11.0 |
| npm | 11.6.1 |
| Next.js | 16.3.6 |
| openspec | 1.1.1 |
| gitleaks | 8.30.1 |
| Playwright | 1.63.0 |
| git | 2.52.0.windows.1 |

## Every command of the pipeline, executed here

| Command | Exit code | Evidence |
|---|---|---|
| `npm ci` | 0 | `added 550 packages, and audited 551 packages in 27s; found 0 vulnerabilities` |
| `npm run typecheck` | 0 | `next typegen && tsc --noEmit`; `Generating route types... Types generated successfully` |
| `npm run lint` | 0 | `eslint .` with no finding |
| `npm test` | 0 | `Test Files 1 passed (1); Tests 2 passed (2); Duration 2.33s` |
| `npm run build` | 0 | `Compiled successfully in 644ms`; `Finished TypeScript in 2.1s`; routes `/` and `/_not-found` |
| `npm run test:e2e` | 0 | `ok 1 [chromium] › e2e\home.spec.ts:3:5`; `1 passed (9.8s)` |
| `npm run audit:high` | 0 | `found 0 vulnerabilities` |
| `npm run secrets:scan` | 0 | `6:05PM INF scanned ~723418 bytes (723.42 KB) in 311ms`; `no leaks found` |
| `npm run openspec:validate` | 0 | `✓ change/bootstrap`; `Totals: 1 passed, 0 failed (1 items)` |
| `npx --yes @fission-ai/openspec@1.1.1 validate --all --strict` | 0 | the exact command of the pipeline: `Totals: 1 passed, 0 failed (1 items)` |
| `npx --yes js-yaml` over the two workflows and `dependabot.yml` | 0 | each file parses to JSON |

`npm ci` ran after the lockfile was committed, with `node_modules` removed, so the tree is the one the pipeline
installs and not an incremental one.

## The unit test can fail

```
app/page.tsx heading changed to "Mutated title for the proof"
npm test
  -> Test Files  1 failed (1)
  ->      Tests  1 failed | 1 passed (2)
  -> exit 1
heading restored
npm test
  -> Test Files  1 passed (1)
  ->      Tests  2 passed (2)
  -> exit 0
```

## Secret scanning of the committed history

```
npm run secrets:scan
  -> gitleaks git --redact --no-banner
  -> scanned ~723418 bytes (723.42 KB) in 311ms
  -> no leaks found
  -> exit 0
```

The hook refused a planted credential earlier in this change, and the run above scanned the five commits that exist
now, after the plant was removed. Both facts are in `2026-09-28-step-5-security-day-one.md`.

## The database state before and after

Not applicable, and it is written instead of omitted: this change creates no table, no migration and no connection.
The first database of the project arrives with `core-libsql-hybrid-search` (change 2). Nothing was started and
nothing was left running.

## Manual verification of the running application

```
npm start -- --port 3200        (background)
curl.exe -s -o $env:TEMP\community-root.html -w '%{http_code}' http://127.0.0.1:3200/
  -> 200

Select-String -Path $env:TEMP\community-root.html -Pattern '<main>.*</main>'
  ->  <main><h1>Katalis Responde Community</h1></main>

curl.exe -s -D - -o NUL http://127.0.0.1:3200/
  -> HTTP/1.1 200 OK
  -> Vary: rsc, next-router-state-tree, next-router-prefetch, ...
  -> x-nextjs-cache: HIT
  -> Cache-Control: s-maxage=31536000
  -> Content-Type: text/html; charset=utf-8
  -> Content-Length: 5220
  -> x-powered-by: ABSENT (expected, `poweredByHeader` is false)
```

The server was stopped after the measurement and no process of this repository is left running.

## Manual verification of the development server

```
npm run dev                     (background, default port 3000)
curl.exe -s -o $env:TEMP\community-dev.html -w '%{http_code}' http://127.0.0.1:3000/
  -> 200

Select-String -Path $env:TEMP\community-dev.html -Pattern '<main>.*</main>'
  ->  <main><h1>Katalis Responde Community</h1></main>
```

After the two manual verifications, `Get-NetTCPConnection -State Listen` reports nothing listening on 3000, 3100 or
3200: the two servers were stopped and no service of the machine was touched.

## Repository state

```
git branch --show-current          -> feature/bootstrap
git log --oneline                  -> five commits, none of them in main
git rev-parse --verify main        -> fatal: Needed a single revision (main is unborn)
git log --oneline origin/main      -> fatal: ambiguous argument (nothing was ever pushed)
git status --short                 -> clean
git check-ignore .env .env.local .env.production
                                   -> the three paths are ignored (exit 0)
git ls-files | Select-String '^\.env'
                                   -> .env.example only
font files (.woff, .woff2, .ttf, .otf, .eot)
                                   -> none
```

## Verdict

PASS. Every blocking command of the pipeline that can run on this machine is green with the exact command the
pipeline uses. CodeQL and the GitHub-side validation of the workflows are UNKNOWN, and the reason is written in
`2026-09-28-step-6-ci-and-dependabot.md`.
