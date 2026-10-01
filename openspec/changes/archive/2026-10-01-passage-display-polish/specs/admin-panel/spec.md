## ADDED Requirements

### Requirement: The guided setup has one Spanish name

Every Spanish string of the panel and every Spanish document of the repository SHALL name the guided setup
"configuración guiada" (feminine: "la configuración guiada", "Tu configuración guiada"), and none SHALL say "alta
guiada".

#### Scenario: No "alta guiada" is left

- **WHEN** the repository is searched for `alta guiada` and for `de la alta`, ignoring case
- **THEN** no file under `lib/`, `app/`, `components/`, `docs/` or the two READMEs matches, and the Spanish panel shows
  "Abrir la configuración guiada otra vez" where it showed "Abrir la alta guiada otra vez"
