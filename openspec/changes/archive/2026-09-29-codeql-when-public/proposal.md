## Why

The first CodeQL run on `main` (run `36511364255`) analyzed the code and then failed to upload the results. The error
was "Code scanning is not enabled for this repository". GitHub accepts code scanning uploads from a private repository
only with a paid plan, and this repository stays private until change 7 makes it public.

A workflow that is red on every push for a reason unrelated to the code trains everyone to ignore red.

## What Changes

- The analysis job of `.github/workflows/codeql.yml` is skipped while `github.event.repository.private` is true.
- It runs, unchanged, once the repository is public.
- The launch checklist of change 7 gains one line: confirm the first public CodeQL run is green.

## Impact

- Changed: `.github/workflows/codeql.yml` (one `if:`), the workflow contract test, and `docs/security.md` (one line on
  when CodeQL runs).
- No application code changes.
