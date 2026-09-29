# Step 5: the battery of checks, on Windows and in a `node:24` Linux container

- Date: 2026-09-29
- Change: `provider-keys-in-panel`
- Branch: `feature/provider-keys-in-panel`
- Agent: deepseek-harness
- Commit verified: `33c3b8d` (the tree the checks ran on; the working tree is clean at this commit)
- Task: 5.1

## On Windows

```
$ npm test
 Test Files  44 passed (44)
      Tests  408 passed (408)
   Start at  13:39:04
   Duration  16.64s (tests 47%, environment 32%, setup 9%, import 8%, transform 3%, worker 1%)
exit=0

$ npm run typecheck
> next typegen && tsc --noEmit
Generating route types...
✔ Types generated successfully
exit=0

$ npm run lint
> eslint .
exit=0

$ npm audit --audit-level=high
found 0 vulnerabilities
exit=0

$ gitleaks git --redact --no-banner
1:39PM INF 289 commits scanned.
1:39PM INF scanned ~3246130 bytes (3.25 MB) in 1.79s
1:39PM INF no leaks found
exit=0

$ npx openspec validate --all --strict
✔ spec/admin-panel
✔ spec/answering
✔ spec/app-skeleton
✔ spec/design-system
✔ spec/knowledge-search
✔ spec/product-identity
✔ spec/project-readme
✔ change/provider-keys-in-panel
✔ spec/public-chat
✔ spec/repository-bootstrap
✔ spec/supply-chain-security
Totals: 11 passed, 0 failed (11 items)
exit=0

$ git diff --check main...HEAD
exit=0

$ git status --short --branch
## feature/provider-keys-in-panel
exit=0
```

`npm run lint` and `git diff --check` print nothing when they find nothing: both exit 0 with an empty report.

## In a `node:24` Linux container, from a clean clone

```
$ git clone --no-hardlinks C:\Users\Franc\Documents\katalis-dev\community-ins <a temporary directory outside the repository>
clone exit=0
$ git -C <that directory> log --oneline -1
33c3b8d Review the whole suite and the existing tests the change touches

$ docker run --rm -v "<that directory>:/app" -w /app node:24 bash -lc "node --version && npm ci && npm test"
v24.21.0
added 513 packages, and audited 514 packages in 4m

 Test Files  44 passed (44)
      Tests  406 passed | 2 skipped (408)
   Start at  19:43:01
   Duration  72.55s (environment 52%, setup 21%, import 17%, tests 7%, transform 3%, worker 1%)
docker exit=0
```

The container runs `node v24.21.0`, inside the `>=24.15.0 <25.0.0` of `package.json`, so the `EBADENGINE` warning
that `npm ci` printed on this Windows machine (local Node `v24.11.0`) does not appear there. The two skipped tests are
the two of `tests/design-system.test.ts` that were already skipped on Linux before this change, and none of the tests
of this change is skipped.

## Verdict

Every check of the task is green on both platforms: the suite, the types, the lint, the audit, the secret scan over
289 commits, the strict OpenSpec validation and the whitespace of the diff. The working tree is clean. Task 5.1 is
done.
