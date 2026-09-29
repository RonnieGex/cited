# Step 2 report - bootstrap: the application skeleton

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: `d3ffc350ec9d654f550e98a46baa793846eac912` (feat(bootstrap): add the Next.js 16 skeleton with its smoke
  tests)

## Versions of the skeleton

| Component | Version | Why this one |
|---|---|---|
| Next.js | 16.3.6 | current release |
| React | 19.2.8 | the version `create-next-app@16.3.6` pins |
| TypeScript | 5.9.3 (`^5.9.3`) | the scaffolder pins `^5`; TypeScript 7 is published but is not the tested combination |
| Tailwind CSS | 4.3.3 (`^4.3.3`) | version 4, configured in CSS |
| ESLint | 9.39.5 (`^9.39.5`) | `create-next-app@16.3.6` pins `^9`; ESLint 10 is published and not yet the tested combination |
| Vitest | 5.0.2 | unit runner |
| Playwright | 1.63.0 | browser runner |
| Node | 24.11.0 local, `24` in `.nvmrc` | the runtime the project pins |

An earlier attempt installed `@types/node@^20.19.0` and `npm install` failed with `ERESOLVE`: `vitest@5.0.2` requires
`@types/node` in `^22.0.0 || >=24.0.0`. The version moved to `^24.19.0`, which also matches the pinned Node 24.

## Files

```
package.json          next 16.3.6, react 19.2.8, strict scripts, engines >=24 <25
package-lock.json     committed: npm ci installs the same tree everywhere
.nvmrc                24
tsconfig.json         strict, noUncheckedIndexedAccess, allowJs false
next.config.ts        reactStrictMode, poweredByHeader false
eslint.config.mjs     eslint-config-next core-web-vitals and typescript
postcss.config.mjs    @tailwindcss/postcss
app/layout.tsx        metadata, lang, explicit children type
app/page.tsx          one main with one h1: the product name
app/globals.css       @import "tailwindcss"
vitest.config.mts     jsdom, globals, setup file, @/ alias
vitest.setup.ts       @testing-library/jest-dom
playwright.config.ts  chromium, webServer that builds and starts the app on port 3100
tests/home.test.tsx   the unit smoke test
e2e/home.spec.ts      the end-to-end smoke test
```

`app/layout.tsx` types its props as `LayoutProps<"/">`, the global helper that Next.js 16 generates. The type script
runs `next typegen` and then `tsc --noEmit`, so the helper exists on a fresh clone and the check does not depend on a
previous build. The first version typed the props as `{ children: ReactNode }`; before closing this step the bundled
documentation of the installed version was read
(`node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`), which documents `LayoutProps` and
`PageProps` as globals of this version, and the file follows the convention of the framework. The four checks ran
again after the change: typecheck, lint, unit tests, build and the end-to-end suite, all with exit 0.

## Files the framework writes by itself

`next dev` creates `AGENTS.md` (the note of Next.js 16 about reading its bundled documentation) and `CLAUDE.md`
(which is `@AGENTS.md`). They are committed so the tree stays clean, because the framework recreates them on every
development run. The canonical instructions of this repository remain `docs/` and `ai-specs/`.

## Commands

```
npm ci
  -> added 550 packages, audited 551 packages in 27s
  -> found 0 vulnerabilities
  -> exit 0

npm run typecheck
  -> next typegen && tsc --noEmit
  -> Generating route types... Types generated successfully
  -> exit 0

npm run lint
  -> eslint .
  -> exit 0

npm run build
  -> ▲ Next.js 16.3.6 (Turbopack)
  -> Compiled successfully in 644ms
  -> Finished TypeScript in 2.1s
  -> Generating static pages (3/3) in 766ms
  -> Route (app): ○ / and ○ /_not-found
  -> exit 0
```

## Tailwind v4 and the design system

`postcss.config.mjs` declares `@tailwindcss/postcss` and `app/globals.css` imports `tailwindcss`. There is no
`tailwind.config.js` and no `tailwind.config.ts`: version 4 configures the theme in CSS, and the tokens arrive with
`@katalis/ui-tokens` in change 1. No font file of any kind is part of this repository.

## Verdict

PASS. A fork installs with `npm ci`, checks types, lints and builds without editing anything.
