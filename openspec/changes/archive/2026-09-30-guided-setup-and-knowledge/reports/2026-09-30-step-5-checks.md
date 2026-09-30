# Step 5: the checks (task 5.1)

Date: 2026-09-30 (UTC). Branch `feature/guided-setup-and-knowledge`. Node of the round:

    $ npx -y -p node@24 node -v
    v24.21.0

## `npm test` on Windows

    $ npx -y -p node@24 node node_modules/vitest/vitest.mjs run

     Test Files  1 failed | 83 passed (84)
          Tests  2 failed | 971 passed (973)
       Duration  48.93s

The only red file is `tests/personal-paths.test.ts` and it is the known case of the base: the absolute path of a
development machine inside the parenthetical of decision 1 of `design.md` of this very change, which the contract
forbids editing. It is recorded in the report of task 1.1, in the report of task 4.1 and in the delivery as a broken
case of the base.

## `npm test` in a `node:24` Linux container

The suite ran in the container `node:24` against the worktree, with the modules of the host kept out of the way by a
named volume:

    $ docker run --rm -v "<worktree>:/app" -v cited-linux-modules:/app/node_modules -w /app node:24 \
        sh -c "apt-get install -y git && npm ci && node node_modules/vitest/vitest.mjs run"

     Test Files  3 failed | 81 passed (84)
          Tests  8 failed | 963 passed | 2 skipped (973)
       Duration  28.70s

The eight failures are not of the code: the three files are the ones that ask `git` for the list of tracked files
(`tests/personal-paths.test.ts` four cases, `tests/readme.test.ts` three, `tests/design-system.test.ts` one) and the
worktree of this round is a **linked worktree**, whose `.git` file points at
`community/.git/worktrees/community-ins`: a path of the host that does not exist inside the container, so
`git ls-files -z` fails there. Two of the four cases of `personal-paths` are, besides, the known ones of the base. The
complete Linux run was taken again on the clean clone of the commit of task 6.1, which carries a real `.git`:

    $ docker run --rm -v "<clean clone>:/app" -v cited-linux-modules-clean:/app/node_modules -w /app node:24 \
        sh -c "apt-get install -y git && npm ci && node node_modules/vitest/vitest.mjs run"

     Test Files  1 failed | 83 passed (84)
          Tests  2 failed | 969 passed | 2 skipped (973)
       Duration  26.54s

The one red file is the one of the Windows run and the same two known cases: the absolute path of `design.md`. The
cases that read the list of tracked files pass here, because the clone has a `.git` the container can read, which is
the difference with the eight failures of the worktree.

## `npm run typecheck`

    $ npx -y -p node@24 node node_modules/next/dist/bin/next typegen
    ✓ Types generated successfully

    $ npx -y -p node@24 node node_modules/typescript/bin/tsc --noEmit
    [exit=0] 0 errors

## `npm run lint`

    $ npx -y -p node@24 node node_modules/eslint/bin/eslint.js .
    [exit=0] 0 errors, 0 warnings

## `npm audit --audit-level=high`

    $ npm audit --audit-level=high
    found 0 vulnerabilities
    [exit=0]

## gitleaks

    $ gitleaks git --redact --no-banner
    478 commits scanned.
    scanned ~6991418 bytes (6.99 MB) in 3.09s
    no leaks found
    [exit=0]

The suite of the repository runs it on every commit through `.githooks/pre-commit`, so every commit of this round was
scanned before it existed.

## `openspec validate --all --strict`

    $ openspec validate --all --strict
    ✓ change/guided-setup-and-knowledge
    ✓ spec/admin-panel  ✓ spec/answering  ✓ spec/app-skeleton  ✓ spec/design-system
    ✓ spec/knowledge-search  ✓ spec/product-identity  ✓ spec/project-readme
    ✓ spec/provider-settings  ✓ spec/public-chat  ✓ spec/repository-bootstrap
    ✓ spec/supply-chain-security  ✓ spec/voice-agent
    Totals: 13 passed, 0 failed (13 items)
    [exit=0]

## `git diff --check main...HEAD`

    $ git diff --check main...HEAD
    [exit=0]

No whitespace error and no conflict marker in the diff of the round.
