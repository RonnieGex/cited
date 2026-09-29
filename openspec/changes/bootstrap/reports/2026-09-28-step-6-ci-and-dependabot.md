# Step 6 report - bootstrap: the pipeline and dependency updates

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: `9f3770d716ef724ae567bda441232818ab81620c` (ci(bootstrap): add the blocking pipeline, CodeQL and Dependabot)

## Files

```
.github/workflows/ci.yml       eight blocking jobs
.github/workflows/codeql.yml   JavaScript and TypeScript analysis
.github/dependabot.yml         npm and GitHub Actions, weekly
```

## The jobs of `ci.yml`

| Job | Command | Blocking |
|---|---|---|
| Types | `npm run typecheck` | yes |
| Lint | `npm run lint` | yes |
| Unit tests | `npm test` | yes |
| Build | `npm run build` | yes |
| End to end | `npx playwright install --with-deps chromium` then `npm run test:e2e` | yes |
| Dependency audit | `npm run audit:high`, which is `npm audit --audit-level=high` | yes |
| Secret scan | `gitleaks/gitleaks-action@v3` over the full history (`fetch-depth: 0`) | yes |
| OpenSpec validation | `npx --yes @fission-ai/openspec@1.1.1 validate --all --strict` | yes |

Every job installs with `npm ci` from the committed lockfile, sets Node up from `.nvmrc`, and the workflow declares
`permissions: contents: read` plus a concurrency group that cancels a superseded run.

The OpenSpec CLI is pinned to 1.1.1 in the pipeline instead of being resolved from the machine, so a fork validates
against the same release that this change was verified with.

## CodeQL

`codeql.yml` analyzes `javascript-typescript` with the `security-extended` query suite, on push to `main`, on every
pull request to `main` and on a weekly schedule (`17 6 * * 1`), with `security-events: write` for the job.

## Action versions, checked against the GitHub API

| Action | Version used | Latest release seen |
|---|---|---|
| `actions/checkout` | `v7` | v7.0.1, 2026-07-20 |
| `actions/setup-node` | `v7` | v7.0.0, 2026-07-14 |
| `gitleaks/gitleaks-action` | `v3` | v3.0.0, 2026-05-30 |
| `github/codeql-action` | `v4` | v4.38.2, 2026-09-24 |

```
curl.exe -s https://api.github.com/repos/actions/checkout/releases/latest        -> "tag_name":"v7.0.1"
curl.exe -s https://api.github.com/repos/actions/setup-node/releases/latest      -> "tag_name":"v7.0.0"
curl.exe -s https://api.github.com/repos/gitleaks/gitleaks-action/releases/latest -> "tag_name":"v3.0.0"
curl.exe -s 'https://api.github.com/repos/github/codeql-action/releases?per_page=15' -> v4.38.2 and v3.38.2
```

`gitleaks-action` v3 exists because v2 runs on Node 20, which GitHub removes from its runners in September 2026.

## Dependabot

`dependabot.yml` watches `npm` and `github-actions` with a weekly schedule (Monday, 06:00, America/Mexico_City), a
limit of five open pull requests per ecosystem, groups that separate production from development dependencies for
npm, and the commit prefixes `chore(deps)` and `chore(ci)`.

## Syntax verification

```
npx --yes js-yaml .github/workflows/ci.yml        -> YAML OK (exit 0, 5119 bytes of JSON)
npx --yes js-yaml .github/workflows/codeql.yml    -> YAML OK (exit 0, 1264 bytes of JSON)
npx --yes js-yaml .github/dependabot.yml          -> YAML OK (exit 0, 1052 bytes of JSON)
npx --yes js-yaml openspec/config.yaml            -> YAML OK (exit 0, 5048 bytes of JSON)
```

An earlier version of `openspec/config.yaml` did not parse: a rule carried a colon inside a plain scalar
(`... an open decision: "if applicable" ...`). The rule was rewritten without the colon and the file parses now. The
finding is recorded because an invalid YAML file in the repository is a defect even when no command reads it.

## What could not be verified locally, and why

- **CodeQL**: it needs a GitHub runner with `security-events: write`. The mission forbids a push, so the workflow is
  not executed by this change. Its YAML parses, its action versions were checked against the API, and the report says
  so instead of claiming a local run. Status: NOT DONE locally, UNKNOWN until the first push.
- **GitHub-side workflow validation**: the schema and the expression evaluation of a workflow are validated by GitHub
  when it is pushed. Nothing was pushed. Status: UNKNOWN.
- **Every command of the other seven jobs** was executed locally and is green; the evidence is in
  `2026-09-28-step-7-local-verification.md`.

## Verdict

PASS for what can be verified without a remote: the pipeline is complete, blocking, syntactically valid and its
dependency versions are current. The execution of CodeQL and the GitHub-side validation remain UNKNOWN by design of
this mission.
