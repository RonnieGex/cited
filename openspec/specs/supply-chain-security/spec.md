# supply-chain-security Specification

## Purpose
Keep the dependencies and the history safe: locked installs, an audit of high findings, a secret scan of the
whole history and CodeQL when the repository is public.
## Requirements
### Requirement: Written threat model

`docs/security.md` SHALL describe the threat model of section 3 of `tasks/plan-rag-abierto.md`: the public endpoint,
the protected administration panel, the protection of the owner's balance, the widget and the voice agent, the
content, the headers, the privacy and the supply chain. Each area SHALL state what is true in this change and which
change builds the rest. The document SHALL declare itself a living document reviewed by the hardening change.

#### Scenario: Every area of the plan is present

- **WHEN** `docs/security.md` is read
- **THEN** it covers the administration panel, the answers endpoint, the owner's balance, the widget and the voice
  agent, the content, the headers, the privacy and the supply chain

#### Scenario: The document does not sell what is missing

- **WHEN** an area is not built yet
- **THEN** the document names the change that builds it instead of describing it as done

### Requirement: Environment template and ignored environment files

The repository SHALL carry `.env.example` with the planned variable names and empty values, and `.gitignore` SHALL
ignore `.env*` except `.env.example`. No environment file other than the template SHALL be tracked, and
`.env.example` SHALL carry no value.

#### Scenario: The template carries names only

- **WHEN** `.env.example` is read
- **THEN** every assignment has an empty value on the right of the equals sign

#### Scenario: Environment files are ignored

- **WHEN** `git check-ignore .env .env.local .env.production` runs
- **THEN** the three paths are reported as ignored and `git ls-files` lists no tracked file that starts with `.env`
  other than `.env.example`

### Requirement: Secret scanning before every commit

The repository SHALL carry `.githooks/pre-commit`, which runs gitleaks over the staged content, and
`npm run hooks:install`, which points `core.hooksPath` at `.githooks`. When gitleaks is not installed the hook SHALL
refuse the commit and print how to install it. The repository SHALL carry `.gitleaks.toml` extending the default
rules.

#### Scenario: A planted secret is refused

- **WHEN** a file with a known example credential is staged and `git commit` runs
- **THEN** gitleaks reports the finding, the command exits non-zero and the commit is not created

#### Scenario: A clean commit passes

- **WHEN** the planted file is removed and the real files are committed
- **THEN** the hook reports no leaks and the commit is created

#### Scenario: gitleaks is missing

- **WHEN** the hook runs on a machine without gitleaks
- **THEN** it exits non-zero and prints the installation command instead of allowing the commit

### Requirement: Blocking continuous integration

`.github/workflows/ci.yml` SHALL run, on every push and every pull request, one job per check: the type check, the
lint, the unit tests, the production build, `npm audit --audit-level=high`, gitleaks over the full history and
`openspec validate --all --strict`. Every job SHALL be blocking, every action SHALL be pinned by major version, and
the workflow SHALL install the dependency tree with `npm ci`.

#### Scenario: Every check is a job

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** it declares the jobs for types, lint, unit tests, build, audit, secret scan and OpenSpec validation

#### Scenario: The audit level is high

- **WHEN** the workflow is read
- **THEN** the audit step runs `npm audit --audit-level=high` and a finding at that level fails the job

#### Scenario: The history is scanned

- **WHEN** the secret job runs
- **THEN** gitleaks scans the full history of the repository and not only the last commit

### Requirement: CodeQL analysis

`.github/workflows/codeql.yml` SHALL run the CodeQL analysis for JavaScript and TypeScript on every push to `main`,
on every pull request and on a schedule, with the `security-extended` query suite and the security events permission,
**only while the repository is public**: its analysis job SHALL be skipped when `github.event.repository.private` is
true, because GitHub accepts code scanning uploads from private repositories only with a paid plan (the first run on
the private repository failed with "Code scanning is not enabled for this repository"). When the repository becomes
public in change 7, the job runs with no further edit.

#### Scenario: The language and the queries are declared

- **WHEN** the CodeQL workflow is read
- **THEN** it initializes the languages `javascript-typescript` with the `security-extended` queries and it declares
  the permissions for security events

#### Scenario: The analysis is scheduled

- **WHEN** the workflow triggers are read
- **THEN** a schedule is present next to the push and pull request triggers

#### Scenario: A private repository skips the analysis

- **WHEN** the CodeQL workflow runs while the repository is private
- **THEN** the analysis job is skipped, not failed, and the workflow does not end red

#### Scenario: A public repository runs the analysis

- **WHEN** the CodeQL workflow runs while the repository is public
- **THEN** the analysis job runs the `security-extended` queries and uploads its results

### Requirement: Dependency updates

`.github/dependabot.yml` SHALL watch npm and GitHub Actions weekly, with a limit of open pull requests per ecosystem
and a conventional commit prefix.

#### Scenario: Both ecosystems are watched

- **WHEN** `.github/dependabot.yml` is read
- **THEN** it declares the `npm` and the `github-actions` ecosystems with a weekly schedule

#### Scenario: The noise is bounded

- **WHEN** the configuration is read
- **THEN** each ecosystem sets an open pull request limit and a commit message prefix

### Requirement: The local run covers the pipeline

Every command of the pipeline that can run on a developer machine SHALL be callable with an npm script, and the
change report SHALL carry the command and its result for each one. The checks that need GitHub runners SHALL be
named in the report as run by the pipeline only.

#### Scenario: The local commands exist

- **WHEN** `package.json` is read
- **THEN** it carries `typecheck`, `lint`, `test`, `test:e2e`, `build`, `audit:high`, `secrets:scan`,
  `hooks:install` and `openspec:validate`

#### Scenario: What cannot run locally is declared

- **WHEN** the report of this change is read
- **THEN** CodeQL is listed with the reason it runs in the pipeline only, instead of being reported as verified
  locally
