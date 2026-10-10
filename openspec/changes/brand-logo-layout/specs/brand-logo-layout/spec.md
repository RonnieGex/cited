## ADDED Requirements

### Requirement: Equal agent rows

Remove the bottom legend from all four agents graphics. Keep status text below each client name. The three right-hand rows SHALL have equal height and equal spacing, aligned to the top and bottom of the left proof block.

#### Scenario: Render approved variants
- **WHEN** the existing renderer builds the localized variants
- **THEN** the layout satisfies the approved R8 corrections without changing evidence or product behavior
- **AND** automated tests and visual evidence record the actual result
