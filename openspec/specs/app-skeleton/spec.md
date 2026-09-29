# app-skeleton Specification

## Purpose
TBD - created by archiving change bootstrap. Update Purpose after archive.
## Requirements
### Requirement: Next.js application with strict TypeScript

The repository SHALL carry a Next.js 16 application that uses the App Router and React 19, and `tsconfig.json` SHALL
set `strict` and `noUncheckedIndexedAccess` to true and `allowJs` to false. `npm run typecheck` SHALL run
`tsc --noEmit` and SHALL exit 0 on a fresh clone, before any build.

#### Scenario: The type check passes before the first build

- **WHEN** `npm run typecheck` runs in a clone whose `.next` directory does not exist
- **THEN** the command exits 0

#### Scenario: Strict mode is on

- **WHEN** `tsconfig.json` is read
- **THEN** `strict` is true, `noUncheckedIndexedAccess` is true and `allowJs` is false

#### Scenario: The app builds

- **WHEN** `npm run build` runs
- **THEN** the production build completes and exits 0

### Requirement: Tailwind v4

The application SHALL use Tailwind v4 through the `@tailwindcss/postcss` plugin, and `app/globals.css` SHALL import
Tailwind with `@import "tailwindcss"`. The repository SHALL NOT carry a `tailwind.config.js` or
`tailwind.config.ts` file: version 4 configures the theme in CSS.

#### Scenario: The plugin and the import are wired

- **WHEN** `postcss.config.mjs` and `app/globals.css` are read
- **THEN** the PostCSS configuration declares `@tailwindcss/postcss` and the stylesheet imports `tailwindcss`

#### Scenario: No legacy Tailwind configuration

- **WHEN** the repository is listed for `tailwind.config.js` and `tailwind.config.ts`
- **THEN** neither file exists

### Requirement: Home page

The application SHALL render one page that shows the product name `Cited` and nothing else.
The page SHALL live in `app/page.tsx` and SHALL carry no design system: that arrives in change 1.

#### Scenario: The page names the product

- **WHEN** the application serves `GET /`
- **THEN** the response is 200 and its HTML carries the text `Cited`

#### Scenario: The page carries nothing else

- **WHEN** `app/page.tsx` is read
- **THEN** it renders one `main` element with one `h1` heading and no other content

### Requirement: Node version pinned

The repository SHALL pin Node 24 in `.nvmrc` and in the `engines` field of `package.json`, and it SHALL commit
`package-lock.json` so that `npm ci` installs the same tree everywhere.

#### Scenario: The runtime is pinned in both places

- **WHEN** `.nvmrc` and the `engines` field of `package.json` are read
- **THEN** both require Node 24

#### Scenario: The lockfile is committed

- **WHEN** the repository is listed
- **THEN** `package-lock.json` exists and `npm ci` installs from it

### Requirement: One smoke test per runner

The repository SHALL carry Vitest for unit tests and Playwright for end-to-end tests, each with one smoke test that
fails when the page stops rendering its text. `npm test` SHALL run Vitest in run mode and `npm run test:e2e` SHALL
run Playwright.

#### Scenario: The unit smoke test passes

- **WHEN** `npm test` runs
- **THEN** Vitest renders the home page, finds the product name and exits 0

#### Scenario: The unit smoke test can fail

- **WHEN** the text of the home page is changed and `npm test` runs
- **THEN** Vitest exits non-zero, so the test is not vacuous

#### Scenario: The end-to-end smoke test passes

- **WHEN** `npm run test:e2e` runs against the application
- **THEN** Playwright asks for `GET /` through its own web server, finds the product name and exits 0

### Requirement: The application starts

The application SHALL start with `npm run dev` and with `npm start` after a build, and the two commands SHALL serve
the page on the configured port.

#### Scenario: The development server answers

- **WHEN** `npm run dev` runs and `GET /` is requested
- **THEN** the response is 200 and carries the product name

#### Scenario: The production server answers

- **WHEN** `npm run build` has completed and `npm start` runs
- **THEN** `GET /` answers 200 and carries the product name
