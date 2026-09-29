## Why

Franc opened Cited and said the screens have no identity at all (2026-09-29): a white page, a row of links, tiny boxes.
The identity already exists and he signed it in the README (K2): the wordmark `Cited` with its citation mark, ink and
paper with lime, Outfit, the real flame of Katalis. None of it reaches the product. Franc also asked for a better UI/UX
and asked that the specifier build it himself this once, so this change is written and implemented by Fable, with the
adversarial review of Codex kept as the standard asks.

## What Changes

- **One wordmark**, `Cited` with its citation mark, in two tones (on ink, on paper), on the sign-in, the panel, the
  unbranded public page and the kit; the real flame stays where it is, small, beside "Built by Katalis".
- **Two devices that make a screenshot recognizable without the logo**: the citation mark (a lime square with the number
  of the source) and the highlighter (lime painted behind the words that matter: a phrase of a headline, the passage an
  answer came from).
- **The panel becomes a workspace**: an ink side navigation with the wordmark, the sections numbered like citations, the
  active one highlighted in lime, the language switch, sign out and "Built by Katalis" at the foot; on a phone a top bar
  with a menu button. The sign-in becomes a split screen with the tagline.
- **The public page wears the business first**: a band in the business color (ink and the wordmark when there is no
  business yet), the welcome message as the headline, the answers as a ledger of question and answer with the sources in
  the margin of the answer they support, and a question box that stays in reach.
- **Motion with a purpose**: the highlighter sweeps in once, the citation marks land when an answer arrives, a source note
  enters beside its answer, waiting shows one honest bar; everything is CSS, nothing is a dependency, and everything is
  still under `prefers-reduced-motion`.
- **The kit shows the identity** (`/kit`) and `DESIGN.md` records it for the next screens, which the guided setup lane
  builds on.

## Impact

- New: `components/brand/` (wordmark, citation mark), `app/brand.css` (keyframes and the highlighter), `DESIGN.md`,
  `scripts/capture-ui.mjs`, tests and E2E, captures of the change.
- Changed: `app/tokens.css` (additive product tokens), the kit components, `components/admin/AdminNav.tsx`,
  `app/admin/layout.tsx`, `components/admin/LoginForm.tsx`, `app/page.tsx`, `app/embed/page.tsx`, `components/chat/*`,
  `components/i18n/LanguageSwitch.tsx` (a `tone` prop, the interface stays), `app/kit/page.tsx`,
  `docs/design-system.md`, the README captures.
- Untouched on purpose: the tokens of Construye, the flame files, Outfit, every route, every schema, every provider.
- Specs: `design-system`, `public-chat` and `admin-panel` (ADDED requirements).
