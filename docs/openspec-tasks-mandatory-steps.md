---
description: Mandatory steps every OpenSpec tasks.md of this repository must contain, and the rules the implementing agent follows while executing them.
alwaysApply: true
---

# OpenSpec tasks: mandatory steps

This file is the operational list behind rule 3 of `docs/katalis-sdd-standard.md`. Read `openspec/config.yaml`
before drafting or editing any `tasks.md`, and read this file before executing one.

## 1. Report path (overrides specboot)

Reports live inside the change folder:

```
openspec/changes/<change>/reports/YYYY-MM-DD-step-N-<name>.md
```

The specboot template says `specs/<change>/reports/`. That path is wrong for this repository. The Katalis standard
wins: reports travel with the change when it is archived.

Every report carries, at least: the date, the change, the branch, the agent, the exact command of each verification
and its real output, the commit it was verified against, and a verdict. A report never says that something was run
when it was not run.

## 2. Order of steps in every `tasks.md`

1. **Step 0: create the feature branch.** `git switch -c feature/<change>` from `main`. It is always the first step;
   nothing is born in `main`.
2. **Tests first.** Every behavior starts as a failing test. The tasks that write the test come before the tasks
   that write the code.
3. **Implementation in small steps.** One behavior at a time, in the order the tests demand.
4. **Review and update the existing tests** that the change touches or invalidates.
5. **Run the tests.** Run the targeted tests and then the whole suite, and paste the counts and the runtime. A change
   that touches the database reports its state before and after.
6. **Manual verification.** The agent starts the application and requests the endpoints itself with `curl.exe`, and
   pastes the responses.
7. **End-to-end testing with Playwright**, mandatory when the change has a frontend.
8. **Update the technical documentation** in `docs/`, the `README.md` when what the project is changes, and
   `openspec/config.yaml` when the stack changes.

A task is marked `[x]` only with evidence: the exact command and its result, in the change report. A task that
cannot be verified is marked `[BLOCKED]` with the reason.

## 3. Rules for the implementing agent

The agent executes every validation itself. It never asks the user to run a test, a curl or an E2E scenario.

- Install exactly: `npm ci`.
- Types: `npm run typecheck`.
- Lint: `npm run lint`.
- Unit tests: `npm test`.
- Build: `npm run build`.
- Dependency audit: `npm run audit:high`, the guard of `scripts/audit-high.mjs`.
- Secret scan: `npm run secrets:scan` (or `gitleaks dir . --redact` before the first commit).
- Spec validation: `npm run openspec:validate`.
- Browser flows: `npm run test:e2e`.
- HTTP: `curl.exe` explicitly, never the `curl` alias of Windows PowerShell.
- Reports are written as UTF-8 without BOM with
  `[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))`.

A check that needs a GitHub runner, like CodeQL, is named in the report as run by the pipeline only. It is never
written as verified locally.

## 4. Definition of done of a change

A change is done only when its spec and its code agree, its tests pass in the pipeline, its manual verifications have
a report, `docs/` is updated with measured facts, and the change carries its `## Issues` section. Archiving needs the
explicit OK of Franc. Nothing is marked complete because the code compiles.
