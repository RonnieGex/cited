## Decisions

1. **One chat component** in `components/chat/` used by `/` and `/embed`: the question box, the list of turns, the
   citation chips (a button per `[n]` that opens a panel with the excerpt, the document and the heading), the refusal
   style, a loading state in words.
2. **Markdown** with a small allowlist renderer (`lib/markdown/`): paragraphs, lists, bold, italic, code and links with
   `http` or `https` only; raw HTML is never parsed; tested against an XSS corpus.
3. **Theme from the settings**: the primary color becomes a CSS variable checked for contrast against the ink and the
   paper; a color that fails AA contrast falls back to lime.
4. **Widget.** `lib/widget/` builds a dependency-free `public/widget.js` (under 5 KB) that adds a button and an iframe
   of `/embed` from the script's own origin; the button carries an accessible name; `Escape` closes it.
5. **Headers.** `/embed` sends `Content-Security-Policy: frame-ancestors 'self' <ALLOWED_ORIGINS>`; `/` sends
   `frame-ancestors 'self'`; both send a CSP without inline scripts other than Next's nonce.
6. **Session.** `crypto.randomUUID()` in `sessionStorage` under `cited-session`.
7. **Before code**, read the Next.js guides in `node_modules/next/dist/docs/` for pages, headers and CSP with nonces of
   this version, as `AGENTS.md` requires.
8. **Shared modules of the parallel lanes** (07 and 08 run at the same time; Fable reconciles them at merge). Two modules
   have one owner each and one exact interface; the other lane writes a stand-in with the same interface, headed
   `// Stand-in until <owner change> merges; Fable replaces it with the owner's file`, and its tests mock that module:
   - `lib/settings/business.ts`, owned by `admin-panel-and-onboarding`: `export type Lang = "en" | "es"`;
     `export interface Business { name: string; hasLogo: boolean; primaryColor: string | null; tone: string;
     language: Lang; forbiddenTopics: string[]; welcome: { en: string; es: string }; updatedAt: string }`;
     `export async function readBusiness(): Promise<Business | null>` (null when nothing is stored yet, never throws
     because the table is missing). The logo is served by `/api/brand/logo`, also owned by the panel.
   - `lib/i18n/language.ts` and `components/i18n/LanguageSwitch.tsx`, owned by `public-page-and-widget`:
     `export const LANG_COOKIE = "cited-lang"`; `export function resolveLang(cookie: string | undefined, fallback:
     Lang): Lang`; `LanguageSwitch` renders `English | Español` in that order as two buttons with `aria-pressed`, and
     writes the cookie (`path=/`, `sameSite=lax`, one year) before reloading the page in the chosen language. `Lang` is
     imported from `lib/settings/business.ts`.
   Strings live in `lib/i18n/admin.ts` (panel) and `lib/i18n/public.ts` (public page and widget), one file per lane.
