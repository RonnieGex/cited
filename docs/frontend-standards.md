---
description: Frontend standards for Cited. Next.js 16 App Router, React 19, strict TypeScript and Tailwind v4.
alwaysApply: true
---

# Frontend standards

## 1. Stack

- Next.js 16 with the App Router. One application, one process: the page, the route handlers and the agent live
  together.
- React 19. Server components by default; `"use client"` only in the component that needs state, an effect or a
  browser API, and as deep in the tree as possible.
- Strict TypeScript: `strict` and `noUncheckedIndexedAccess` are on and `allowJs` is off. Props are typed with an
  explicit type or interface; no `any`.
- Tailwind v4 through `@tailwindcss/postcss` and `@import "tailwindcss"` in `app/globals.css`. There is no
  `tailwind.config.js`: version 4 configures the theme in CSS.
- Vitest with jsdom and React Testing Library for components; Playwright for the browser flows.

## 2. Layout

```
app/
  layout.tsx        # root layout, metadata and language
  page.tsx          # public page of questions and answers (planned in admin-and-public-ui)
  globals.css       # Tailwind import and the theme of the project
  admin/            # administration panel (change 4)
  api/              # route handlers: ask, voice, upload, health (changes 3, 4 and 5)
components/         # UI of this application, ported from the shared kit in change 1
lib/                # search, models, guards, limits, settings
tests/              # unit tests of the application, next to Vitest
e2e/                # Playwright specs and their fixtures
public/             # static assets, no licensed font
```

## 3. Design system

- The single source of truth is `@katalis/ui-tokens` (change 1). The application does not copy token values and does
  not define its own palette.
- New UI lives in `components/`. Styles are not overwritten at the point of use: a variant is added to the component
  or to the token set, never with an inline override.
- The business information of the fork (name, logo, main color) brands the same system; the footer keeps
  "Built by Katalis".
- Accessibility: one `h1` per page, labelled form controls, visible focus, and text contrast of at least 4.5 to 1.

## 4. Content and safety in the browser

- Answers are rendered from sanitized markdown. Raw HTML from a model or from a document is never injected.
  **Planned** in `pluggable-models-and-ask`.
- No API key, no service token and no signed URL with a long life reaches the browser. A signed voice URL is
  requested from the server and lives 15 minutes at most.
- Every string that the user sees exists in Spanish and in English (change 4). No text is hardcoded in a component.

## 5. Tests

- Every component with logic has a unit test. The test asserts what the user sees, not the internal structure.
- Every flow that crosses the browser has a Playwright test against the built application.
- Unit tests are hermetic: no network and no real key. A model or a search is mocked at its boundary.
- A smoke test exists from the first change and asserts that the app renders; it is the test that catches a broken
  build.

## 6. Style

- No comments in the code. Names carry the meaning; the explanation goes in `design.md`.
- Files in `components/` and `app/` use `PascalCase` for components and `kebab-case` for everything else.
- Imports use the `@/` alias instead of long relative paths.
- Only explicit paths are staged: `git add <path>`. `git add .`, `git add -A` and `git commit -a` are forbidden.
