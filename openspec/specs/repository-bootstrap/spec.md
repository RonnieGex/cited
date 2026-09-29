# repository-bootstrap Specification

## Purpose
TBD - created by archiving change bootstrap. Update Purpose after archive.
## Requirements
### Requirement: OpenSpec workspace

The repository SHALL carry an OpenSpec workspace with `openspec/changes/`, `openspec/specs/` and an
`openspec/config.yaml` whose `context` describes this project: a single Next.js process in TypeScript, libSQL, the
Vercel AI SDK and Apache-2.0. The workspace SHALL validate with `openspec validate --all --strict` and the command
SHALL exit 0.

#### Scenario: Strict validation passes

- **WHEN** `npm run openspec:validate` runs in a clone with no changes open
- **THEN** the command exits 0

#### Scenario: The configuration describes this project

- **WHEN** `openspec/config.yaml` is read
- **THEN** its context names Next.js, TypeScript, libSQL and Apache-2.0, and it names no other repository

### Requirement: Adapted Katalis standards

`docs/` SHALL hold `base-standards.md`, `documentation-standards.md`, `frontend-standards.md`,
`backend-standards.md`, `katalis-sdd-standard.md` and `openspec-tasks-mandatory-steps.md`, rewritten for an
application that is one Next.js process in TypeScript. `docs/katalis-sdd-standard.md` SHALL remain a copy of
`tasks/estandar-sdd-agentes.md`. No standard SHALL mention uv, pyproject, FastAPI, LangGraph, psycopg, pgvector or
any other stack of another repository.

#### Scenario: No foreign stack survives in the standards

- **WHEN** the six standard files are searched for `uv run`, `pyproject`, `FastAPI`, `LangGraph`, `psycopg` and
  `pgvector`
- **THEN** every search returns no match

#### Scenario: The suite standard is the canonical one

- **WHEN** `docs/katalis-sdd-standard.md` is compared byte by byte with `tasks/estandar-sdd-agentes.md`
- **THEN** the two files are identical

#### Scenario: The reports path is the Katalis one

- **WHEN** `docs/openspec-tasks-mandatory-steps.md` is read
- **THEN** it fixes the report path as `openspec/changes/<change>/reports/YYYY-MM-DD-step-N-<name>.md` and says it
  overrides the specboot template

### Requirement: Agent definitions

`ai-specs/agents/` SHALL hold the definitions of the agents that work in this repository, and they SHALL describe
this stack: Next.js App Router, React 19, strict TypeScript, Tailwind v4, Vitest and Playwright. No agent definition
SHALL describe Prisma, Express, FastAPI or a hiring product, and none SHALL reference the private repository.

#### Scenario: The agent definitions match the stack

- **WHEN** `ai-specs/agents/` is searched for `Prisma`, `Express`, `FastAPI` and `katalis-dev`
- **THEN** every search returns no match

#### Scenario: The three agents exist

- **WHEN** `ai-specs/agents/` is listed
- **THEN** it contains `backend-developer.md`, `frontend-developer.md` and `product-strategy-analyst.md`

### Requirement: Free license and attribution

The repository SHALL carry the full text of the Apache License 2.0 in `LICENSE` and a `NOTICE` file that reads
`Built by Katalis (https://katalis.dev)`. `package.json` SHALL declare the `Apache-2.0` license.

#### Scenario: License files are present

- **WHEN** `LICENSE` and `NOTICE` are read
- **THEN** `LICENSE` contains the Apache License 2.0 text and `NOTICE` carries the attribution line of Katalis

#### Scenario: No commercially licensed font file

- **WHEN** the repository is listed for files ending in `.woff`, `.woff2`, `.ttf`, `.otf` or `.eot`
- **THEN** the listing is empty

### Requirement: Community files

The repository SHALL carry `SECURITY.md` with the reporting address and the supported version, `CONTRIBUTING.md`
with the local steps, the issue templates for a bug and a feature request, and a pull request template. Every
template SHALL be short and SHALL ask for the evidence that the work needs.

#### Scenario: The security policy says how to report

- **WHEN** `SECURITY.md` is read
- **THEN** it names a reporting address, it says which versions receive fixes and it commits to an answer

#### Scenario: The templates exist

- **WHEN** `.github/ISSUE_TEMPLATE/` and `.github/pull_request_template.md` are listed
- **THEN** the bug template, the feature template and the pull request template are present

### Requirement: Bilingual README

`README.md` SHALL describe what the project will be, SHALL state that it is under construction, SHALL name the
license, and SHALL carry its Spanish part in the same file. It SHALL NOT claim that a feature exists while the
change that builds it is open.

#### Scenario: The README is bilingual and honest

- **WHEN** `README.md` is read
- **THEN** it carries an English part and a Spanish part, it states the construction status, it names Apache-2.0 and
  it lists no capability outside this change without marking it as planned
