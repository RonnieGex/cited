## ADDED Requirements

### Requirement: What npm installs under another license is named

`THIRD_PARTY_NOTICES.md` SHALL carry a section on the packages that `npm ci` can install, that this repository neither
serves nor ships, and whose license is not only a permissive one: every `@img/sharp-*` package of `package-lock.json`
whose `license` field names the LGPL, one row per package with its version and its `license` field exactly as the lock
records them. The section SHALL say that those packages carry the name of their license and no license text, and SHALL
link the text of the LGPL-3.0 (`https://www.gnu.org/licenses/lgpl-3.0.html`) and the list of the libraries each
prebuilt build bundles (`https://github.com/lovell/sharp-libvips`). It SHALL say how this repository uses sharp as
facts (which scripts import it, and that `next` lists it as an optional dependency), without a legal conclusion.

#### Scenario: A reader looks for the license of the image binaries

- **WHEN** `THIRD_PARTY_NOTICES.md` is read
- **THEN** it lists the ten `@img/sharp-libvips-*` packages, the three `@img/sharp-win32-*` packages and
  `@img/sharp-wasm32`, each with the version and the license of `package-lock.json`, says they carry no license text
  and links where the texts are, and says the repository does not ship them

#### Scenario: The rows stay true to the lock

- **WHEN** `package-lock.json` changes the version or the license of one of those packages, adds one or drops one
- **THEN** `tests/third-party-notices.test.ts` fails and names the row, comparing row by row and never against the
  section as a whole
