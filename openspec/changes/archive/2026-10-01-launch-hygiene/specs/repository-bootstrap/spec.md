## ADDED Requirements

### Requirement: The agent folders are real folders on every platform

`.claude/agents`, `.codex/agents` and `.cursor/agents` SHALL be tracked as folders of regular files (mode `100644`),
never as symbolic links (mode `120000`), and each SHALL hold a byte-for-byte copy of every file of `ai-specs/agents/`
and nothing else. `ai-specs/agents/` SHALL stay the one place where an agent is edited; `npm run agents:sync` SHALL
write the three copies from it, and a unit test SHALL fail when a copy is missing, extra or different.

#### Scenario: A Windows clone without the symlink privilege

- **WHEN** the repository is cloned on Windows with `core.symlinks=false`
- **THEN** `.codex/agents`, `.claude/agents` and `.cursor/agents` are folders that hold `backend-developer.md`,
  `frontend-developer.md` and `product-strategy-analyst.md`, and `git ls-files -s` lists no path with mode `120000`

#### Scenario: A copy that drifts

- **WHEN** a file of `ai-specs/agents/` changes and `npm run agents:sync` is not run, or a file is added to only one
  of the three folders
- **THEN** `npm test` fails and names the folder and the file

#### Scenario: The sync

- **WHEN** `npm run agents:sync` runs after a change to `ai-specs/agents/`
- **THEN** the three folders hold the same files as `ai-specs/agents/`, byte for byte, and the test passes
