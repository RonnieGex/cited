# Step 11: archive

Date: 2026-10-09. Executor: parent Codex.

Executed under v24.21.0: openspec archive english-example --yes. Exit 0, after strict verification and independent adversarial PASS. Commit/CI step was correctly still pending when archiving.

Observed output:

```text
Task status: 11/13 tasks
Warning: 2 incomplete task(s) found. Continuing due to --yes flag.

Specs to update:
  english-example: create
Applying changes to openspec/specs/english-example/spec.md:
  + 6 added
Totals: + 6, ~ 0, - 0, → 0
Specs updated successfully.
Change 'english-example' archived as '2026-10-09-english-example'.
```

Verdict: PASS.
