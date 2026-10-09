## MODIFIED Requirements

### Requirement: Blocking continuous integration

`.github/workflows/ci.yml` SHALL run, on every push and every pull request, one job per check: the type check, the
lint, the unit tests, the production build, `npm run audit:high`, gitleaks over the full history and
`openspec validate --all --strict`. Every job SHALL be blocking, every action SHALL be pinned by major version, and
the workflow SHALL install the dependency tree with `npm ci`.

#### Scenario: Every check is a job

- **WHEN** `.github/workflows/ci.yml` is read
- **THEN** it declares the jobs for types, lint, unit tests, build, audit, secret scan and OpenSpec validation

#### Scenario: The audit job runs the guard

- **WHEN** the audit step of the workflow is read
- **THEN** it runs `npm run audit:high`, which is `node scripts/audit-high.mjs`, and the job stops when the guard
  reports an advisory of the high level or above that `security/audit-exceptions.json` does not list, when an entry of
  that file is expired or asks for more than 30 days, when an entry is malformed, or when a finding appears in the
  production tree

#### Scenario: The history is scanned

- **WHEN** the secret job runs
- **THEN** gitleaks scans the full history of the repository and not only the last commit

## ADDED Requirements

### Requirement: Dependency audit with expiring exceptions

`npm run audit:high` SHALL run `scripts/audit-high.mjs`, a guard that adds no dependency and reads the payload of
`npm audit --json`, the payload of `npm audit --omit=dev --json`, the installed production tree and
`security/audit-exceptions.json`. The guard SHALL fail when an audit cannot be read or parsed, instead of treating the
tree as clean. The production tree SHALL audit clean at the high level and SHALL accept no exception: an entry exists
only for a development chain. The whole tree SHALL audit clean at the high level except for the advisories the file
lists, and every entry SHALL carry the identifier of the advisory (GHSA), the package it reaches, the reason, the
evidence that no fixed version is published and an expiry date of 30 days at most after the day of the run. The job
`Dependency audit` of `.github/workflows/ci.yml` SHALL keep calling `npm run audit:high`.

#### Scenario: The production tree audits clean

- **WHEN** `npm audit --omit=dev --audit-level=high` runs on the tree
- **THEN** it exits 0, and the guard exits non-zero when the production payload carries a finding of the high level or
  above, whatever `security/audit-exceptions.json` says

#### Scenario: An advisory that no entry lists

- **WHEN** the whole tree carries an advisory of the high level or above whose identifier and package are not an entry
  of `security/audit-exceptions.json`
- **THEN** the guard exits non-zero and names the advisory and the package

#### Scenario: An expired entry

- **WHEN** the expiry date of an entry is before the day of the run
- **THEN** the guard exits non-zero and names the entry and its date

#### Scenario: An entry longer than 30 days

- **WHEN** the expiry date of an entry is more than 30 days after the day of the run
- **THEN** the guard exits non-zero and names the entry and the days it asks for

#### Scenario: An entry of the production tree

- **WHEN** an entry names a package that appears in the installed production tree
- **THEN** the guard exits non-zero and names the entry and the package, because a production dependency is fixed or
  the pipeline stops, and it is never excepted

#### Scenario: An entry without its evidence, or malformed

- **WHEN** an entry has no package, no reason, no evidence that no fixed version is published, no GHSA identifier or a
  date that is not a real calendar date
- **THEN** the guard exits non-zero and names the entry

#### Scenario: Only current exceptions

- **WHEN** every advisory of the high level or above is an entry that is current, carries its evidence and covers no
  package of the production tree
- **THEN** the guard exits 0 and prints the number of entries in force and the nearest expiry

#### Scenario: An audit that cannot run

- **WHEN** a payload of `npm audit` cannot be read or parsed
- **THEN** the guard exits non-zero and says so, and the tree is never read as clean
