## Context

- `npm audit --audit-level=high` on `f644f85` with `next@16.4.0`, measured on 2026-10-09: 23 entries, 20 of them at the
  high level, over two advisories alone. `GHSA-68fv-2mgg-jv7q` reaches `source-map-js` 1.2.1, hoisted once for
  `next/node_modules/postcss`, `@tailwindcss/node` and `css-tree`; `GHSA-vfj7-8cjw-p6xm` reaches `braces` 3.0.3
  through `eslint-config-next` only. The other high entries are the packages that depend on those two.
- `npm audit --omit=dev --audit-level=high` on the same tree: six entries, the `source-map-js` chain at the high level
  and the `sprintf-js` chain (moderate) of `mammoth`. The production tree has no other finding.
- The registry answers that `source-map-js` 1.2.2 is the newest version (`https://registry.npmjs.org/source-map-js`)
  and that `braces` 3.0.3 is the newest of its package, with no patched version in the advisory.
- `npm run audit:high` is `npm audit --audit-level=high` in `package.json`, the job `Dependency audit` of
  `.github/workflows/ci.yml` calls it, and `docs/security.md` and `docs/development-guide.md` name both.
- The suite runs on Vitest 5, which reads `npm audit --json` output as plain JSON. The audit needs the network; a test
  that runs it is a test that fails without a connection, which is why the guard takes its inputs as files.

## Decisions

1. **The fix, in `overrides`.** `source-map-js` is transitive in three places at once (`next`, `@tailwindcss/node`,
   `css-tree`) and no direct dependency of this repository. `"overrides": { "source-map-js": "1.2.2" }` raises it in
   the whole tree with one entry, keeps `next` at 16.4.0 and leaves `package-lock.json` as the single place that
   records the resolved version. A direct dependency would install a package nothing imports, and `npm audit fix`
   would rewrite unrelated parts of the lock in the same run.
2. **The guard is the only place that decides.** `scripts/audit-high.mjs` reads four inputs: the payload of
   `npm audit --json` (the whole tree), the payload of `npm audit --omit=dev --json` (the production tree),
   the tree of `npm ls --omit=dev --all --json` (which packages are production) and
   `security/audit-exceptions.json`. Each of the three npm inputs can be given as a file with
   `--audit-file`, `--prod-audit-file` and `--prod-tree-file`, and the guard runs the command itself when the option
   is absent. The tests use the files, so they need no network and no installed tree.
3. **A pair is what is excepted.** An advisory is matched by the pair (GHSA identifier, package it reaches). The
   identifier comes from the `via` entries of the payload that carry a `url`, and the package is the key of the entry
   of `vulnerabilities`. An advisory at the high level or above whose pair is not an entry fails the guard, which names
   the pair; the packages that depend on it are not listed one by one.
4. **The production tree accepts no exception.** The production payload is checked on its own: any advisory at the
   high level or above fails, whatever the file says. The production tree is checked on its own too: an entry whose
   package appears in the tree of `npm ls --omit=dev --all --json` fails, even when the package carries no advisory
   today. A production dependency is fixed or the pipeline stops.
5. **Thirty days, and the day of the run is the reference.** Every entry carries `expires` as `YYYY-MM-DD`. The entry
   is in force through its own date, and it fails when its date is before the day of the run and when it is more than
   30 days after it. The day is the UTC date of the machine, and `--today` overrides it so a test can place itself at
   a date without touching the clock.
6. **A malformed entry never passes.** The identifier has to match the shape of a GHSA, the package, the reason and
   the evidence that no fixed version is published have to be non-empty text, and the date has to be a real calendar
   date of the shape `YYYY-MM-DD`. The guard fails naming the entry instead of ignoring what it cannot read.
7. **npm is spawned without a shell.** The guard runs `process.execPath` on the npm CLI entry that
   `npm_execpath` names, with the npm CLI of the runtime as the second choice, and captures its output through a
   temporary file. No shell, no `npm.cmd`, no parsing of a human report: the same code path on Windows and on Linux.
   An audit that cannot run exits non-zero, so a network failure is never read as a clean tree.
8. **The gate affirms, it does not only run.** `scripts/gate-audit.mjs` runs the type check, the lint, the unit suite,
   the build, the strict OpenSpec validation, the secret scan, `npm run audit:high`,
   `npm audit --omit=dev --audit-level=high`, and it runs the guard against every red fixture, which has to fail. It
   prints one line per statement and closes with `GATE: GREEN` or `GATE: RED`.
9. **The fixtures are the real shape of the payload.** `tests/fixtures/audit/` holds the payloads of a green tree, of
   the tree of 2026-10-09 with its one exception, of a tree with a new advisory, of an expired entry, of an entry
   longer than 30 days, of an exception of the production tree, of a production tree with a finding, and of a
   malformed entry. They are written by hand from the shape npm produces, with the two advisories of the day and
   invented identifiers for the rest, and no test opens a socket.

## Decisions taken by the implementer

- The guard reads the exceptions from `security/audit-exceptions.json` with the shape
  `{ "exceptions": [ { id, package, reason, noFixEvidence, expires } ] }`; the test doubles use the same shape.
- The tests import the guard as a module and read its verdict object, and the gate is what runs it as a command, so
  the suite has no child process and no network at all.
- The production tree is read with `npm ls --omit=dev --all --json` instead of the lock, because the lock describes
  what `npm ci` would install while the tree describes what is installed, which is what the audit reads.
- The suite runs with the Node 24 of the PATH in this machine because the sandbox of the session denies `npx`; every
  report names `node -v`.
