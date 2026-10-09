## ADDED Requirements

### Requirement: The README shows verified agent compatibility

Both READMEs SHALL include the available MCP server in the status table and a themed graphic in the agent section.
The graphic SHALL distinguish verified search and citation from connection and tool discovery.

#### Scenario: The MCP server is available

- **WHEN** either README status table is read
- **THEN** the MCP server row links `openspec/specs/mcp-server/spec.md` and is available
- **AND** the generated roadmap and its record contain the same row

#### Scenario: Each client retains its verified scope

- **WHEN** the agent section is read in either README
- **THEN** a picture selects `agents-dark.png` for dark mode and `agents-light.png` otherwise
- **AND** its accessible text and adjacent table describe DeepSeek Harness search with a cited answer,
  Claude Code and Codex connection with tool discovery, and Cursor configuration without testing
- **AND** the existing renderer and manifest reproduce both graphics with local Outfit and the assigned brand colors

#### Scenario: Round-two correction approved by Fable
- **WHEN** the agent graphic and section are rendered
- **THEN** status glyphs distinguish called-and-answered, connected-and-listed, and documented-only clients
- **AND** the exact natural plugin answer and highlighted supporting passage match saved evidence
- **AND** both README tables distinguish the MCP configuration verified by step-10-4 from the native plugin evidence linked on main
- **AND** redundant headings and caveats are removed, while legacy rounded/glowing graphics remain unchanged; the roadmap follows the corrected MCP capability row
