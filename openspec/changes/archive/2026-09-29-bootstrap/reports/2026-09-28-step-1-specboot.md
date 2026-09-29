# Step 1 report - bootstrap: specboot, the workspace and the adapted standards

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: `460dcb80cc88c718137499c8eeba9b1ca8d16119` (chore(bootstrap): initialize the OpenSpec workspace and the
  adapted Katalis standards)

## What was done

```
openspec init --tools 'claude,codex,cursor'
  -> OpenSpec Setup Complete
  -> Created: Claude Code, Codex, Cursor
  -> 10 skills and 10 commands in .claude, .codex, .cursor/
  -> Config: skipped (non-interactive mode)
```

The CLI created `openspec/changes/`, `openspec/specs/` and the three tool folders. `openspec/config.yaml` is written
by hand, because the CLI does not create it (it only manages a global configuration): it carries the context of the
approved plan v2 and the rules of the suite.

## The specification artifacts

```
openspec/changes/bootstrap/proposal.md
openspec/changes/bootstrap/design.md
openspec/changes/bootstrap/tasks.md
openspec/changes/bootstrap/specs/repository-bootstrap/spec.md
openspec/changes/bootstrap/specs/app-skeleton/spec.md
openspec/changes/bootstrap/specs/supply-chain-security/spec.md
```

## Strict validation

```
npm run openspec:validate
  -> openspec validate --all --strict
  -> ✓ change/bootstrap
  -> Totals: 1 passed, 0 failed (1 items)
  -> exit 0

npx --yes @fission-ai/openspec@1.1.1 validate --all --strict
  -> ✓ change/bootstrap
  -> Totals: 1 passed, 0 failed (1 items)
  -> exit 0
```

The second command is the one the pipeline runs: the version is pinned there, so a fork validates with the same
release.

The first validation run failed, and the failure is recorded here because it changed the artifacts:

```
openspec validate bootstrap --strict --json
  -> "No delta sections found. Add headers such as \"## ADDED Requirements\" or move non-delta notes outside specs/."
  -> "Change must have at least one delta. No deltas found."
```

The three change specs carried a `## Purpose` section and `## Requirements`. In OpenSpec 1.1.1 a change delta needs
`## ADDED Requirements`. The `Purpose` sections were removed from the change specs; the canonical specifications of
`openspec/specs/` will receive their purpose when this change is archived, which needs the OK of Franc.

## The standards

Adapted from the private repository `katalis-dev/rag`, only the generic ones and rewritten for this stack:

| File | What changed |
|---|---|
| `docs/base-standards.md` | Python, uv and the manual in Spanish removed; the stack rule, the skills and the agents of this repository added |
| `docs/documentation-standards.md` | The manual in Spanish replaced by the bilingual README; the list of documents of this repository |
| `docs/frontend-standards.md` | The "this repository has no frontend" note replaced by App Router, React 19, Tailwind v4 and the design system |
| `docs/backend-standards.md` | Python 3.12, uv, FastAPI, LangGraph and pgvector replaced by route handlers, libSQL, the Vercel AI SDK and the limits |
| `docs/katalis-sdd-standard.md` | A byte-identical copy of `tasks/estandar-sdd-agentes.md`, the standard of the suite |
| `docs/openspec-tasks-mandatory-steps.md` | The report path of Katalis, the npm commands of this stack and the rule that CodeQL is reported as pipeline-only |

Proof that the copy is byte identical:

```
Copy-Item 'katalis-dev\tasks\estandar-sdd-agentes.md' 'docs\katalis-sdd-standard.md'
(Get-FileHash docs\katalis-sdd-standard.md).Hash
  -> F001DDBFE992F124AA6324A394BE71C2190A96D4C2F3E07AB31DE0D3108EBA3E
(Get-FileHash tasks\estandar-sdd-agentes.md).Hash
  -> F001DDBFE992F124AA6324A394BE71C2190A96D4C2F3E07AB31DE0D3108EBA3E
```

The `ai-specs/` definitions were rewritten for this repository: `backend-developer.md`, `frontend-developer.md`,
`product-strategy-analyst.md` and a `README.md` that names the canonical source. None of them mentions another
repository, another stack or the hiring product of the template they came from.

## Searches that prove what did not travel

```
Select-String over docs/base-standards.md, docs/backend-standards.md, docs/frontend-standards.md,
docs/documentation-standards.md, docs/openspec-tasks-mandatory-steps.md for 'uv run|pyproject|FastAPI|LangGraph|psycopg|pgvector'
  -> 0 matches
Select-String over ai-specs/agents for 'Prisma|Express|FastAPI|katalis-dev'
  -> 0 matches
```

## Verdict

PASS. The workspace validates strictly, the standards describe this stack and nothing of the private repository
travelled except the generic rules, rewritten.

## Issues found while executing this step

- UNKNOWN, not solvable here: the CLI ignores `openspec/config.yaml` (it only reads a global configuration), so the
  file orients the agents and the humans, and it is not validated by any command. Its YAML syntax was verified with
  `npx js-yaml`, exit 0.
