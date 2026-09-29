## Decisions

1. **Job-level condition.** Use `if: ${{ !github.event.repository.private }}` on the analysis job, so the job is
   reported as skipped rather than failed, and the rest of the file stays as it is.
2. **Test.** The existing workflow contract test (or a new one if none covers `codeql.yml`) parses the file and fails
   unless that exact condition is on the analysis job and the queries, languages, triggers and permissions are
   unchanged.
3. **No repository setting is touched.** Enabling code scanning belongs to the launch.
