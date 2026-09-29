# Security policy

## Reporting a vulnerability

Report it privately through **Security → Report a vulnerability** on this repository
(`https://github.com/RonnieGex/cited/security/advisories/new`), which is the private
vulnerability reporting channel of GitHub. Never in a public issue.

There is no reporting email address yet. The role address `security@katalis.dev` is added to this file when the
mailbox exists, and it will never be a personal address. Until then, the private advisory of GitHub is the only
channel.

Include the revision, your configuration, the impact and the steps to reproduce it. If real data is involved,
describe its shape instead of pasting it.

You get an acknowledgement within a few working days and a statement of what we intend to do. This is a small project
and there is no bounty. Credit is given in the advisory unless you ask otherwise.

## State of the project

This repository is under construction. It carries a repository bootstrap, a page that names the product and nothing
else; the ask endpoint, the panel, the widget and the voice agent arrive in later changes. A report about a control
that `docs/security.md` lists as planned is still welcome, and it is more useful after the change that builds it.

## What this project assumes

- The owner of the installation puts their own API keys in the environment of the server. Keys never reach the
  browser and are never stored in the database.
- The public endpoint can be called by anyone, so the limits exist to protect the balance of the owner, not to keep
  the service available under a flood.
- Conversations stay in the installation. There is no telemetry to Katalis.
- Whoever runs a deployment holds the database, the environment and the logs. Nothing here protects data from the
  person hosting it.

The full model, with the state of each control and the change that builds it, is in `docs/security.md`.

## Supported versions

`main` is the only supported branch. There are no backports.

## Dependencies

Dependencies are updated deliberately. A vulnerable transitive dependency is reported the same way as anything else.
A pull request that bumps it is welcome, and the report says what the exposure is: a flaw in a development tool and a
flaw in the request path do not deserve the same urgency.

## Never in this repository

No key, no customer data and no commercially licensed font file. A commit that carries a secret is refused by the
blocking secret scan of the pipeline; the local hook of `.githooks/pre-commit` is a developer aid, only present after
`npm run hooks:install`, and it can be skipped.
