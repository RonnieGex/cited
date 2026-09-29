# Step 1.1 Â· the state of the base before

Contract: `openspec/changes/brand-and-design-system/tasks.md`, task 1.1.
Agent: deepseek-harness. Date: 2026-09-29.

## What the task asks

> `npm test`, `npm run typecheck`, `npm run lint`, `openspec validate --all --strict`, `git status`; the change adds no
> persistence.

## Command and output

```
$ npm test
> cited@0.1.0 test
> vitest run

 RUN  v5.0.2 <root>

 â¯ tests/personal-paths.test.ts (7 tests | 2 failed) 1669ms
   â¯ tracked files (7)
     Ã— carry no home directory of a development machine 302ms
     Ã— carry no home directory prefix outside the change contract that states the rule 116ms

 Test Files  1 failed | 10 passed (11)
      Tests  2 failed | 112 passed (114)
   Duration  13.26s
exit=1
```

The two failures are not caused by this round's code: both name
`openspec/changes/brand-and-design-system/design.md`, the contract of this change, which carries the absolute path of
the source directory of the flame. The rule the test defends is that no tracked file carries the home directory of a
development machine, and the only exempt files are the two paths of the bootstrap contract that states the rule. The
repository will be public, so a home directory in a tracked file is a defect of the base, present at `3b3cfbd`, before
this round wrote a line.

Raw failure:

```
 FAIL  tests/personal-paths.test.ts > tracked files > carry no home directory of a development machine
AssertionError: expected [ Array(1) ] to deeply equal []
- Expected
+ Received
- []
+ [
+   "openspec/changes/brand-and-design-system/design.md",
+ ]
 â¯ tests/personal-paths.test.ts:156:49
```

```
$ npm run typecheck
> cited@0.1.0 typecheck
> next typegen && tsc --noEmit
Generating route types...
âœ“ Types generated successfully
exit=0

$ npm run lint
> cited@0.1.0 lint
> eslint .
exit=0

$ openspec validate --all --strict
âœ“ spec/app-skeleton
âœ“ change/brand-and-design-system
âœ“ spec/knowledge-search
âœ“ spec/product-identity
âœ“ spec/project-readme
âœ“ spec/repository-bootstrap
âœ“ spec/supply-chain-security
Totals: 7 passed, 0 failed (7 items)
exit=0

$ git status --short --branch
## feature/brand-and-design-system
exit=0   (and `git status --porcelain` returns 0 lines)
```

## The change adds no persistence

`git diff --stat main...HEAD` before this round contains no migration, no schema, no `prisma/`, no `db` script and no
change of `lib/store/`: the change adds static assets, CSS, components and documentation only. The quick start of the
README still writes its store to `.data/katalis.sqlite`, which `.gitignore` excludes, and no command of this round
touches it.

## Correction of the base defect

The home directory in `design.md` was replaced by the repository-relative description of the same source
(`finanzas-katalis/web/public/brand/`), which carries the same instruction without the personal prefix. No decision, no
requirement and no task text changed: only the machine-specific prefix left the file. It is recorded here because it is
a correction of a defect of the base, not part of the implementation, and it is reported in the delivery as a
deviation from the letter of Fable's document.

```
$ git show --stat dd174e9
    openspec/changes/brand-and-design-system/design.md | 4 ++--
    reports/2026-09-29-step-0-branch.md                | 4 ++--
```

After the correction:

```
$ npm test
 Test Files  11 passed (11)
      Tests  114 passed (114)
exit=0
```

## Commits of this task

- `dd174e9` the correction of the base defect in `design.md` and the redaction of the first report.
- This report travels in the commit that follows `dd174e9`; that commit is named in the report of step 2.

## Files

- `openspec/changes/brand-and-design-system/design.md` (one line, the source path).
- `reports/2026-09-29-step-1-base-before.md` (this file).
