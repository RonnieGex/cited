# Contributing

Thanks for looking at Cited. This is the free and forkable edition of Katalis Responde: a
business forks the repository, fills in its own information and its own API keys, and answers its customers with
citations from its own documents.

## Before you start

Read these two documents. They are short and they are the rules of this repository:

- `docs/katalis-sdd-standard.md`: how work is specified, implemented and closed.
- `docs/openspec-tasks-mandatory-steps.md`: the order every change follows and the evidence it leaves.

## Set up

```
npm ci
npm run hooks:install
npx playwright install chromium
npm run dev
```

`npm run hooks:install` points the git hooks at `.githooks` and fails with the installation command when gitleaks is
missing. Without it, a commit with a secret is not scanned. The full list of commands is in
`docs/development-guide.md`.

## How a change is made

1. A change starts as an OpenSpec change: `proposal.md`, `specs/<capability>/spec.md`, `design.md` and `tasks.md`.
   Nothing is built without an approved specification.
2. The branch is `feature/<change>`, created from `main`. Nothing is born in `main`.
3. The failing test comes first, then the code that makes it pass.
4. Every validation is executed by the author: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
   `npm run test:e2e`, `npm run audit:high`, `npm run secrets:scan` and `npm run openspec:validate`.
5. The evidence goes in `openspec/changes/<change>/reports/YYYY-MM-DD-step-N-<name>.md`, with the command and its real
   output. A task is marked done only with evidence.
6. Documentation is updated in the same change: `docs/` in English and the `README.md` when what the project is
   changes.

## Rules

- English for code, tests, documentation, commits and issues. The `README.md` is bilingual; everything else is not.
- No comments in the code. Names carry the meaning, and a decision that needs explaining goes in `design.md`.
- No `Co-Authored-By` trailer in a commit.
- A key never enters the repository: not in code, not in a test, not in a document, not in a fixture. Local values
  live in `.env`, which is ignored.
- No commercially licensed font file and no content of the paid service.
- Only explicit paths are staged: `git add <path>`.

## License of your contribution

By contributing you agree that your contribution is distributed under the Apache License 2.0 of this repository, and
that the `NOTICE` file keeps its attribution to Katalis.

## Security

Do not open a public issue for a vulnerability. Follow `SECURITY.md`.
