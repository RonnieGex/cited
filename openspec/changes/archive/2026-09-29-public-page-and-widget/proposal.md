## Why

`/api/ask` answers with citations, but a customer of the business has nowhere to ask. The public face of Cited is a
page with the business's brand where anyone asks and sees the answer with its sources, and a widget the owner pastes
into their own site. This is the second half of change 4 of the plan (`admin-and-public-ui`), built in parallel with
`admin-panel-and-onboarding`.

## What Changes

- **`/`, the public page**: the business name, logo and primary color from the settings (the brand of Cited when there
  are none yet), the welcome message, a question box, the answer rendered as sanitized Markdown with its `[n]` markers
  linked to citation chips, each chip opening the excerpt with its document and heading; a refusal shown as such; a
  footer "Built by Katalis" with the flame.
- **The widget**: `/widget.js`, a script the owner pastes into their site, opens a floating button and an iframe of
  `/embed`, the same chat without the page chrome; `ALLOWED_ORIGINS` decides which sites may embed it (the
  `frame-ancestors` of `/embed`); the admin panel shows the snippet to copy.
- **A conversation** keeps its `sessionId` in the browser's session storage, so a follow-up works and a new tab starts
  clean.
- English and Spanish, English first (Franc, 2026-09-29): the page opens in the business language, English by default,
  with the switch `English | Español` shared with the panel; the welcome message shown is the one of that language;
  keyboard and screen-reader friendly; built with the kit.

## Impact

- New: `app/page.tsx` (replacing the bare heading), `app/embed/page.tsx`, `public/widget.js` (generated from
  `lib/widget/`), `components/chat/`, `lib/markdown/` (sanitizer), tests and E2E, `docs/widget.md`.
- Changed: the `app-skeleton` requirement "Home page" (MODIFIED: the page is now the chat), the README (status row and
  a capture).
