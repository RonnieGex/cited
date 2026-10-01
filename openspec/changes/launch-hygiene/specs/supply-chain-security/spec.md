## ADDED Requirements

### Requirement: What npm installs under another license is named

`THIRD_PARTY_NOTICES.md` SHALL carry a section on the packages that `npm ci` installs, that this repository neither
serves nor ships, and whose license is not a permissive one: today the prebuilt binaries of sharp
(`@img/sharp-libvips-*`, installed through `next`), `LGPL-3.0-or-later`, with the version in `package-lock.json`, where
their license text travels (inside each installed package) and the statement that no code of this repository links
against them.

#### Scenario: A reader looks for the license of the image binaries

- **WHEN** `THIRD_PARTY_NOTICES.md` is read
- **THEN** it names `@img/sharp-libvips-*`, `LGPL-3.0-or-later`, the version of `package-lock.json` and where the
  license text is, and says the repository does not ship those binaries

#### Scenario: The version stays true

- **WHEN** `package-lock.json` changes the version of `@img/sharp-libvips-*`
- **THEN** `tests/third-party-notices.test.ts` fails until the section names the new version
