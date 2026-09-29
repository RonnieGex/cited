## Decisions

1. **Session.** A cookie `cited_admin` holding `expiry.hmac` signed with HMAC-SHA256 over `ADMIN_SESSION_SECRET`; no
   session table. `crypto.timingSafeEqual` for the password and the signature. Logout clears the cookie.
2. **Lockout** in the store: `login_attempts(ip_hash, window_start, count)` with the same IP hash as `answering`.
3. **Routes.** Server components for the pages; route handlers under `app/api/admin/` for mutations; a shared
   `requireAdmin()` guard used by every handler and by the admin layout. CSRF: `sameSite=strict` plus a check that the
   `Origin` header of every mutation equals the app's own origin.
4. **Settings** in a single-row table `business(name, logo_mime, logo_bytes, primary_color, tone, language,
   forbidden_topics, welcome_en, welcome_es, updated_at)`; `language` is `en` by default; the logo is served by `/api/brand/logo` with its MIME type and a cache
   header, so the public page reads it without the admin session.
5. **Prompt.** `lib/answer/prompt.ts` adds the tone, the language and the forbidden topics as rules; a forbidden topic
   makes the model answer `NO_ANSWER`, which `answering` already turns into a refusal.
6. **Uploads.** `multipart/form-data` through the route handler, the file written to a temporary path, ingested with
   `lib/ingest`, then removed; the documents themselves are not kept on disk after ingestion.
7. **Interface.** The kit of `brand-and-design-system`; English and Spanish strings in `lib/i18n/`. English first
   (Franc, 2026-09-29): the panel opens in English, and a visible switch `English | Español` (English always first)
   stores the choice in the cookie `cited-lang`, shared with the public page; `Accept-Language` is not read, so the
   first screen is predictable.
8. **Before code**, read the Next.js guides in `node_modules/next/dist/docs/` for route handlers, cookies and server
   actions of this version, as `AGENTS.md` requires.
9. **Shared modules of the parallel lanes** (07 and 08 run at the same time; Fable reconciles them at merge). Two modules
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
