## ADDED Requirements

### Requirement: The password is compared through a slow derivation

The login SHALL derive both the given password and `ADMIN_PASSWORD` with scrypt under one salt of 16 random bytes drawn
when the process starts, and SHALL compare the two derivations in constant time. No fast hash (MD5, SHA-1 or the SHA-2
family) SHALL touch a password. The rules of "The panel is protected" stay as they are.

#### Scenario: The right and the wrong password

- **WHEN** the login receives the password of `ADMIN_PASSWORD`, then the same password with one more space, then one
  character less, then an empty string
- **THEN** only the first one matches, and every comparison went through scrypt and a constant-time comparison

#### Scenario: CodeQL finds no fast hash on a password

- **WHEN** CodeQL analyses the pull request of this change
- **THEN** the alerts `js/insufficient-password-hash`, `js/double-escaping`, `js/incomplete-multi-character-sanitization`
  and `js/file-system-race` on `lib/` are not reported
