## Context

The personal-path scan read every tracked path from the working tree. Git stores the three agent links as symlinks
(mode `120000`), and what a symlink becomes in the working tree depends on the platform:

- **Linux**: a real link to a directory, so `readFileSync` fails with `EISDIR` (the first CI run of `main`).
- **Windows with `core.symlinks=false`**: a small text file holding the target.

Once the first defect is fixed, a second one appears. The exemption named the contract at its active path, but the
archive moved it to `openspec/changes/archive/2026-09-29-bootstrap/tasks.md`. On `3ff834f` the Windows run is therefore
already red, with the archived contract reported as an offender.

## Decisions

1. **Inspect by git mode, not by working-tree type.** `git ls-files -s -z` gives each path's mode. The scan handles
   three cases:
   - `120000` is a symlink and is checked by its target: `readlinkSync` when the checkout has a real link, the file
     text otherwise.
   - `100644` and `100755` are checked by their content, and binary files are skipped.
   - Every other mode is skipped.
2. **Exemption by exact path.** The contract that states the rule is exempt at exactly two paths:
   `openspec/changes/bootstrap/tasks.md` and `openspec/changes/archive/2026-09-29-bootstrap/tasks.md`, where the archive
   put it. Nothing else is exempt, and no pattern is used: an exact list is stricter and the archived path never moves
   (amended by Fable after `revision-community-00e.md`).
3. **Proof on both platforms.** A disposable `node:24` Linux container runs over a fresh clone, so the links are real
   there. The Windows checkout runs with `core.symlinks=false`.

## Risks

- If the contract is ever moved again, the exemption list must be updated; the prefix test would report the new path
  and say so.
