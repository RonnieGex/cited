# codeql-findings · step 9.2 · the pipeline of the pull request

- Date: 2026-09-30
- Change: codeql-findings
- Branch: feature/codeql-findings, head `748c2d1` (the code verified)
- Agent: Fable (Claude)

## Pull request

`gh pr create` opened https://github.com/RonnieGex/cited/pull/8 against `main`.

## Checks

`gh pr checks 8 -R RonnieGex/cited`: 18 checks, 18 passing, 0 failing, 0 pending (the CI jobs of the push and of the
pull request, and CodeQL).

```text
CodeQL	pass	3s	https://github.com/RonnieGex/cited/runs/110167684759
```

## Alerts

`gh api "repos/RonnieGex/cited/code-scanning/alerts?ref=refs/pull/8/merge&state=open"`:

```text
open on PR 8: 0
```

The four alerts of the product (1, 2, 4 and 5 on `main`) are not reported on the merge of the pull request. Verdict:
the CodeQL scenario of `admin-panel` holds in the pipeline.
