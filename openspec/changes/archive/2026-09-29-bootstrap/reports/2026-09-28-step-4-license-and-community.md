# Step 4 report - bootstrap: license and community files

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: `834a4caf089c76d236624d7bbd612eb4453092ab` (feat(bootstrap): license the project under Apache-2.0 and add
  the community files)

## Files

```
LICENSE                              the full Apache License 2.0 text
NOTICE                               "Built by Katalis (https://katalis.dev)" and the copyright line
SECURITY.md                          how to report, supported versions, assumptions of the project
CONTRIBUTING.md                      setup, the order of a change, the rules, the license of a contribution
README.md                            bilingual, with the construction status
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/pull_request_template.md
```

## The license text is the official one

```
curl.exe -s -o $env:TEMP\apache-2.0.txt https://www.apache.org/licenses/LICENSE-2.0.txt
Compare-Object (LICENSE, trailing whitespace ignored) (apache-2.0.txt without its leading blank line)
  -> MATCH: the LICENSE is the official text, without its leading blank line
```

The published file starts with an empty line and the copy in the repository does not; the rest of the two files is
identical, line by line, after normalising trailing whitespace.

## The attribution

`NOTICE` carries the line the plan asks for and the reason it matters:

```
Built by Katalis (https://katalis.dev)
```

Section 4 (d) of Apache-2.0 is quoted in the file, so a person who forks the project knows that the notice travels
with the fork.

## No licensed font file

```
Get-ChildItem -Recurse -File -Include *.woff,*.woff2,*.ttf,*.otf,*.eot (excluding node_modules and .next)
  -> none
```

The design system of change 1 brings a free font with an OFL license. Lufga is paid and it never enters this
repository.

## The README says what is true

The README states that the project is under construction and lists what exists today (the workspace, the standards,
one page, the license, the threat model and the pipeline) against what arrives in the next changes (the knowledge
store, the providers, the panel, the public page, the widget and the voice agent). It carries an English part and a
Spanish part with the same content, and both name the license and the attribution.

## Verdict

PASS. The license, the notice, the security policy, the contribution guide and the templates exist, and the license
text matches the official one.
