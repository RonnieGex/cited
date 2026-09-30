# Step 8: the state of the base after (task 8.1)

Integration agent: Sonnet 5.5. Date: 2026-09-29. Run in `<worktree>` (`community-ui`) at `6926130` (the store script ran before the last commit `ed86833`, which touches no store code), after the E2E and the
captures, with the read-only script of step 1 (only `SELECT`, written to `.data/` which is git-ignored, run, then deleted;
`ls .data | grep -c state` printed 0 afterwards).

```
$ node .data/state-of-store.mjs
business	1
conversations	15
documents	4
login_attempts	0
model_calls	1
passages	11
passages_fts	11
passages_fts_config	1
passages_fts_content	11
passages_fts_data	6
passages_fts_docsize	11
passages_fts_idx	4
rate_limits	1
```

## Compared with step 1 (`2026-09-29-step-1-base-before.md`)

| Table | Before | After | |
|---|---|---|---|
| `business` | 1 | 1 | same |
| `documents` | 4 | 4 | same |
| `passages` and the five `passages_fts*` tables | 11, 11, 1, 11, 6, 11, 4 | 11, 11, 1, 11, 6, 11, 4 | same |
| `login_attempts` | 0 | 0 | same |
| `model_calls` | 1 | 1 | same |
| `rate_limits` | 1 | 1 | same |
| `conversations` | 3 | 15 | +12 |

The 13 tables are the same and every table a change could break (`business`, `documents`, `passages`) is untouched. The
only difference is `conversations`, +12. This change adds no table and no write path. The step-1 report warned that the
preview is in use: the surface agents ran `scripts/capture-ui.mjs` against the dev server of this worktree (port 3300) while
they looked at their work, and every run of the script asks one question, so each run adds a conversation row. My own E2E,
curl and captures ran in `<e2e-worktree>` on ports 3100, 3213, 3241 and 3400 with their own stores (`.data/e2e*.sqlite`,
`.data/curl.sqlite`) and never opened `.data/preview.sqlite`. `model_calls` stayed at 1, so the added rows did not go through
the counter of model calls either; in step 1 three conversations already coexisted with one model call.

UNKNOWN: I did not read the rows of `conversations`, so "the capture script of the surface agents" is an inference from the
count and not a proof; Franc also uses that preview.

A second read a few minutes later (after the last commit) gave `conversations` 16 and every other count identical: the preview
keeps receiving questions while I work, which supports the explanation above (someone or something asks through port 3300);
the tables that matter did not move.
