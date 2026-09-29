## MODIFIED Requirements

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
