# Secret scans

Executed `gitleaks dir . --redact --no-banner`. Exit 0: no leaks found.

Executed `git diff --cached --check` and `gitleaks git --pre-commit --staged --redact --no-banner` after preparing the final diff: both exit 0, no leaks. Repeat the staged scan immediately before any future commit.
