# Step 8 report - bootstrap: the documentation

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: the documentation is spread over the five commits of the change; the reports are committed after them.

## What was updated and why

| Document | Content |
|---|---|
| `README.md` | bilingual, with what the project will be, the construction status, the quick start, the checks, the security pointer and the license |
| `docs/development-guide.md` | requirements, first run, every npm script, the ports 3000, 3100 and 3200, the environment files and the layout |
| `docs/security.md` | the threat model of section 3 of the plan, with the state of each control and the change that builds the rest |
| `docs/base-standards.md` | the principles, the language rules and the links to the rest, for this stack |
| `docs/backend-standards.md` | route handlers, libSQL, the Vercel AI SDK, configuration, limits, tests and the definition of done |
| `docs/frontend-standards.md` | App Router, React 19, strict TypeScript, Tailwind v4, the design system and the browser rules |
| `docs/documentation-standards.md` | the structure, the update process and the bilingual README |
| `docs/openspec-tasks-mandatory-steps.md` | the report path of Katalis, the order of the steps and the commands of this stack |
| `docs/katalis-sdd-standard.md` | the standard of the suite, byte-identical to `tasks/estandar-sdd-agentes.md` |
| `ai-specs/README.md` | the canonical source of the agents and its relation with `docs/` and the generated tool folders |
| `openspec/config.yaml` | the context of the approved plan v2 and the rules of the artifacts |

## Documentation against the code

Every fact in the guide was executed before it was written:

```
npm run dev            -> documented on port 3000 (the default of Next.js)
npm start -- --port N  -> used with 3200 for the manual verification
npm run test:e2e       -> builds and starts the application on port 3100 by itself
npm ci / typecheck / lint / test / build / audit:high / secrets:scan / openspec:validate
                       -> all of them run in this change with exit 0
```

The guide does not describe a database, a panel or an endpoint, because none of them exists yet: those sections name
the change that brings them.

## What the README promises

The English part and the Spanish part say the same, and both separate what exists today from what is coming. No
capability of a later change is written as if it existed: the knowledge store, the providers, the panel, the public
page, the widget and the voice agent are listed as pending, with the change that owns each one.

## Verdict

PASS. The documentation describes what this change really added, it is written in English except the Spanish part of
the README, and the only unverified claim in the repository is the one the reports mark as UNKNOWN.
