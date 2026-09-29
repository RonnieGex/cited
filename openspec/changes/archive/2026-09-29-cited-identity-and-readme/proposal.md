## Why

The free and forkable edition was called "Katalis Responde Community": long, and the "Community" suffix reads as a
second-class edition. Franc chose a new name on 2026-09-29: **Cited, by Katalis**. It names the promise of the
product: it answers only from the business's own documents and cites where each answer came from.

The repository will be public, and Franc asked that its README be "our calling card". Today the README is a bootstrap
note: plain text, no identity, no picture of how the product works, and a list of what is missing. A reader who lands
on the repository from a post or an interview must understand in five seconds what Cited is, see that it is serious
work, know exactly what works today, and run it in minutes.

## What Changes

- **Identity.** The product is `Cited` everywhere in the repository: `package.json`, `NOTICE`, the page title and
  heading, the docs, the standards, the agent files, the OpenSpec context, the samples and the tests. The old name
  stays only in the archived changes, which are history.
- **A README that presents the product**, in English (`README.md`) with a Spanish twin (`README.es.md`):
  - a brand banner in a light and a dark variant, the heading of the README, rendered by a committed script;
  - badges for the license, the stack and the CI;
  - the promise in one line, and three reasons that say why it is different;
  - an honest status table: what is available now, and what arrives in which change;
  - a diagram of how it works;
  - a quick start that runs the ingestion and the search of the sample corpus;
  - the configuration, named by variable, with what each one is for and whether it is read today;
  - security, contributing and license, with "Built by Katalis" at the foot.
- **A contract test for the README**, so every claim stays true: status rows against the specs and the plan, commands
  against `package.json`, variables against `.env.example` and the code, links and images against the files, the
  Spanish twin against the English one.
- After the merge, Fable renames the GitHub repository to `cited` and updates the remote.

## Impact

- Changed: `README.md`, `NOTICE`, `package.json` (`name`), `package-lock.json` (its `name`), `app/layout.tsx`,
  `app/page.tsx`, the docs, `ai-specs/`, `openspec/config.yaml`, `samples/README.txt`, `.env.example` (comments only),
  `SECURITY.md`, `CONTRIBUTING.md`, `LOOP_STATE.md` and the tests that name the product.
- New: `README.es.md`, `scripts/render-readme-banner.mjs` with its template, `docs/images/` with the two banners and
  their record, and `tests/readme.test.ts`.
- No behaviour of the search, no dependency and no deploy changes. The `app-skeleton` requirement "Home page" is
  modified to name `Cited`.
