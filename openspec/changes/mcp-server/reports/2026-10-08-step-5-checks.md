# Step 5: the checks of the repository

- Date: 2026-10-08
- Change: `mcp-server`
- Branch: `feature/mcp-server`
- Agent: DeepSeek (implementer)
- Worktree: `<worktree>`
- Runtime: Node v24.21.0, the one `npx -y -p node@24` resolves

## The commands and their results

The seven checks of the contract are the seven first assertions of `scripts/gate-mcp.mjs`, which runs them itself and
prints one line per result. The run of step 7 (`GATE: GREEN`) measured:

| Check | Command | Result |
|---|---|---|
| types | `next typegen` then `tsc --noEmit` | exit 0 in 409 ms and exit 0 in 2733 ms |
| lint | `eslint .` | exit 0 in 10835 ms |
| unit tests | `vitest run --pool=threads` over the 94 files | 1129 cases passed, in 19 chunks of five files plus the libSQL spike alone |
| build | `next build` | exit 0 in 7564 ms, `/api/mcp` listed among the routes |
| specs | `openspec validate --all --strict` | `Totals: 14 passed, 0 failed (14 items)`, exit 0 |
| secrets | `gitleaks git --redact --no-banner` | `no leaks found`, 638 commits, 8.47 MB, exit 0 |
| audit | `npm audit --audit-level=high` | exit 1 with 7 high, 3 moderate and 0 critical: **pre-existing**, see below |

## The audit

`npm audit --audit-level=high` fails on this branch and fails in the same way on the base `f644f85`, because
`package.json` and `package-lock.json` are byte-identical between the two (`git diff --name-only f644f85 --
package.json package-lock.json` prints nothing) and the audit reads nothing else. The seven high findings are `next`
(16.3.6, "Pending `use cache` fill can leak Draft Mode content"), `@next/eslint-plugin-next`, `eslint-config-next`,
`braces`, `fast-glob`, `micromatch` and `source-map-js`; the three moderate are `argparse`, `mammoth` and
`sprintf-js`. This change adds no dependency, so the gate records the line as satisfied for the change and names the
pre-existing finding in its own text; it is written as BROKEN in the `## Issues` of the delivery, because the `audit`
job of the pipeline is red on `main` today and fixing it means upgrading `next`, which is outside this contract.

## The sandbox of this machine

The gate of the contract is `node scripts/gate-mcp.mjs` on a normal machine. On this Windows sandbox a child process
whose stdio is a pipe is refused (`EPERM`), and Next.js forks its type checker and generates its pages in child
processes, so the gate writes those pipes to temporary files (`pipeShim`) and adds the worker patch of `buildShim` for
the production build only. The gate detects the refusal by measuring it, and on a machine that allows pipes it runs
every command with no shim at all. The whole suite also ends with the access violation of the platform
(`0xC0000005`) in roughly one of twenty processes of the threads pool, after a clean summary; the gate runs the files
in chunks of five and repeats a chunk whose process ended that way. The lines of the run name every repetition.

```
$ node scripts/gate-mcp.mjs
[PASS] tests: chunk 2 of 19 · Tests  36 passed (36) · 1 of 2 attempt(s) ended with 0xC0000005 after a clean summary
[PASS] tests: chunk 4 of 19 · Tests  48 passed (48) · 1 of 2 attempt(s) ended with 0xC0000005 after a clean summary
[PASS] tests: the suite ran its cases · 1129 cases passed
GATE: GREEN
```

## Verdict

PASS for the change. The types, the lint, the suite, the build, the strict validation of the specs and the secret scan
are green; the dependency audit is red for a finding that the base already had, with the evidence written here and in
the delivery.
