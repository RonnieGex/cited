# product-identity Specification

## Purpose
Name the product Cited, by Katalis, everywhere a reader or a fork sees it.
## Requirements
### Requirement: The product is named Cited

The repository SHALL name the product `Cited` and its maker `Katalis`, and SHALL NOT carry the former name of the
free edition, recorded in the proposal of the archived change `2026-09-29-cited-identity-and-readme` (in any letter
case, with spaces or hyphens), in any tracked file outside `openspec/changes/archive/`. The paid service
`Katalis Responde` MAY be named as the paid service.

#### Scenario: The former name is gone

- **WHEN** every tracked file outside `openspec/changes/archive/` is scanned
- **THEN** none carries the former name, with spaces or hyphens, compared without letter case

#### Scenario: The name in the places a reader sees first

- **WHEN** `package.json`, `NOTICE`, `app/layout.tsx` and `app/page.tsx` are read
- **THEN** the package name is `cited`, the first line of `NOTICE` is `Cited`, the page title names `Cited`, and the
  page heading is `Cited`
