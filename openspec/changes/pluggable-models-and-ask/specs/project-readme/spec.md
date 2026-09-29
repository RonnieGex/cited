## MODIFIED Requirements

### Requirement: The README says exactly what works today

`README.md` SHALL carry a status table whose rows are the capabilities of the product, each one marked `Available`
or `Planned`, so that nothing is presented as working before it works. After `pluggable-models-and-ask`, the row of the
answers with citations is `Available` and links `openspec/specs/answering/spec.md`.

#### Scenario: Available means specified and merged

- **WHEN** a row is marked `Available`
- **THEN** it links the spec in force under `openspec/specs/` that describes it, and that spec exists

#### Scenario: Planned means scheduled

- **WHEN** a row is marked `Planned`
- **THEN** it names the change of the plan that delivers it (`design-system-shared` or `brand-and-design-system`,
  `admin-and-public-ui`, `elevenlabs-voice-agent`, `security-hardening` or `docs-deploy-and-launch`)
- **AND** no sentence outside the status table and the roadmap presents a planned capability as available

#### Scenario: The answer is shown working

- **WHEN** the demo of the README is read
- **THEN** it shows the real output of `npm run ask` on the sample corpus with the fake providers, next to the search,
  and the graphics no longer mark the answer as `Next`

### Requirement: The Spanish twin says the same

`README.es.md` SHALL be the Spanish version of `README.md`, with the same banner, the same sections in the same order,
the same commands and the same variables, and each file SHALL link the other at its head.

#### Scenario: The twins agree

- **WHEN** the two files are compared
- **THEN** they have the same number of level-two sections, the same code blocks, the same variable names and the same
  status of every row

#### Scenario: The twin is translated

- **WHEN** the headings, the status column and the configuration table of `README.es.md` are read
- **THEN** no level-two heading is the English heading of `README.md`, every status reads `Disponible` or `Siguiente`,
  and every yes/no reads `sí` or `no`; only code, commands, variable names, paths and product and change names stay in
  English

#### Scenario: Only available capabilities are claimed

- **WHEN** the tagline, every text field of `docs/images/readme-graphics.json` and `docs/images/readme-banner.json`
  (headlines, copy, alt text), the sentences of both READMEs outside the status table and the roadmap, and every
  Markdown file under `docs/` are read
- **THEN** none of them presents as working today a capability that the status table marks `Planned`, and none says
  that Cited cites a page (passages keep their document, heading and position, not a page); a sentence about a planned
  capability carries `Next`, `planned` or the name of the change that delivers it (amended by Fable in
  `pluggable-models-and-ask`: the answer with citations is available from this change on)
- **AND** the only text exempt from this check is the verbatim output the render scripts captured from real runs (the
  command lines and the lines they printed), because it is evidence and not copy; every other field is checked
