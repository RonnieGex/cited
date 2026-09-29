## ADDED Requirements

### Requirement: The personal-path scan works on every platform

The test that forbids home directories of a development machine in tracked files SHALL decide how to inspect each
tracked path from its git mode, so it behaves the same on Linux, macOS and Windows checkouts. A symlink SHALL be checked
by its link target; a regular file by its content; a binary file SHALL be skipped. The rule-defining contract SHALL be
exempt at its active path and at its archived path.

#### Scenario: A tracked symlink to a directory on Linux

- **WHEN** the suite runs on a Linux checkout where `.claude/agents` is a real link to a directory
- **THEN** the scan inspects the link target text and never reads the directory, and the test passes

#### Scenario: A home path in a symlink target

- **WHEN** a tracked symlink points to a target containing a home directory of a development machine
- **THEN** the scan reports that symlink as an offender

#### Scenario: The archived contract

- **WHEN** the contract that states the rule lives under `openspec/changes/archive/<date>-bootstrap/tasks.md`
- **THEN** it is exempt from the prefix check exactly as at its active path, and any other file with the prefix is still
  reported
