## Direction

**Editorial ledger.** Cited is a ledger of claims and the sources that back them: every screen reads like a page of a
well-set book where the important words are highlighted and every claim carries its footnote. Register: product
(`PRODUCT.md`). Color strategy: restrained in the panel (ink, paper, lime only as the mark of a citation, of a verified
step and of the active place); committed on the public page, where one band carries the color of the business.
Scene: the owner of a café at the counter at midday, laptop open in a bright room, a few minutes between customers.
Light theme. References: the guided checklist of Stripe, a page of Notion, the README banner of Cited.

**The two devices that make a screenshot recognizable without the logo**: the citation mark (a lime square with the
number of the source) and the highlighter (lime painted behind the words that matter).

## Decisions

1. **Tokens, additive.** `app/tokens.css` keeps every token of Construye untouched and adds, in the same `:root` and
   `@theme inline`, the product tokens: `--ink-2: #57534E` (secondary text, 7.63:1 on paper), `--rule: color-mix(in
   srgb, var(--ink) 12%, var(--paper))` (dividers, never a control border), `--dur-fast: 180ms`,
   `--dur-base: 320ms`, `--dur-slow: 640ms`. The kit's `--border` and the focus ring do not change.
2. **`components/brand/Wordmark.tsx`** (server component): the word `Cited` in Outfit 800, `letter-spacing: -0.04em`,
   followed by a `CitationMark` with `1`, sizes `sm` (20 px, the navigation), `md` (36 px, the sign-in and the kit),
   `lg` (56 px, the public page when no business is configured); `tone="paper"` (ink text) or `tone="ink"` (paper
   text); the mark is lime in both tones. It links to `/` on the public page and to `/admin` in the panel.
3. **`components/brand/CitationMark.tsx`** (server component): `inline-grid place-items-center`, `min-width: 1.5em`,
   `height: 1.3em`, `padding: 0 0.3em`, lime background, ink text, Outfit 700 at `0.72em` of its context,
   `vertical-align: 0.1em`, square corners. As a button (the markers of an answer, the sources) it keeps
   `aria-label`, `aria-expanded` and `aria-controls` as today, takes `hover:bg-[var(--primary)]
   hover:text-[var(--on-primary)]` on the public page, and `aria-pressed`/open state paints it ink with lime text.
   It also numbers the navigation of the panel and the steps of the setup lane later.
4. **The highlighter**, `app/brand.css`: `.hl { background-image: linear-gradient(transparent 55%, var(--lime) 55%);
   background-repeat: no-repeat; background-size: 100% 100%; padding: 0 0.08em; box-decoration-break: clone; }`.
   `.hl-sweep` animates `background-size` from `0% 100%` to `100% 100%` in `var(--dur-slow)` with `--ease-out-expo`,
   once, `animation-fill-mode: both`. `highlightLast(text, n)` in `lib/brand/highlight.ts` wraps the last `n` words
   (3 when the text has 6 or more words, all of it otherwise) so the welcome headline and the tagline carry it; the
   excerpt of an open citation carries `.hl .hl-sweep` on the whole passage.
5. **Motion**, all in `app/brand.css`, CSS only, no dependency: `mark-land` (from `translateY(0.35em) scale(0.85)` and
   `opacity: 0`, `var(--dur-base)`, stagger `calc(var(--i) * 40ms)`) for the marks of an answer that just arrived;
   `note-in` (from `translateX(-8px)` and `opacity: 0`, `var(--dur-base)`) for a source note that opens; `rise` (from
   `translateY(12px)` and `opacity: 0`, 480 ms) for the welcome headline once; `bar` (`scaleX` 0 to 1, 1.6 s, alternate,
   infinite, `transform-origin: left`) for the waiting bar. Only `transform`, `opacity` and `background-size` animate;
   at most two things move at once in any view. `@media (prefers-reduced-motion: reduce)` sets every animation and
   transition of the file to none and the highlighter to its final state.
6. **Kit.** `Button` adds `variant="ghost"` (transparent, `border-paper/40`, paper text, for controls on ink) and
   `size="sm"` (`px-4 py-2`); `Chip` and `Panel` keep their markup and classes (`border-ink/10` on `Panel`, the test of
   the design system reads it); `SectionTitle` keeps its API and its eyebrow, the eyebrow color becomes `text-ink-2`.
   `LanguageSwitch` gains `tone?: "paper" | "ink" | "brand"` (paper by default, unchanged look; ink: paper text with
   lime for the chosen one; brand: `currentColor`), same buttons, same `aria-pressed`.
7. **The panel is a workspace.** `app/admin/layout.tsx` renders, from 1024 px, a grid `240px 1fr`: an ink side column
   (`min-height: 100vh`, sticky) with the wordmark (`sm`, `tone="ink"`), the navigation as a list where each link
   carries a `CitationMark` with its number (1 Setup, 2 Business, 3 Documents, 4 Conversations, and `AI and keys` when
   that page exists) and its name; the current page (from `usePathname` in `AdminNav`, which is already a client
   component) carries `aria-current="page"`, paper text and its mark ink-on-lime inverted (ink background, lime
   number); the others `text-paper/80` with a
   `text-paper/60` mark (7.02:1 over ink: the numeral is text); hover `text-paper`, `var(--dur-fast)`. At the
   foot of the column: `LanguageSwitch tone="ink"`, the sign-out as `variant="ghost" size="sm"`, and the silver flame
   (`/brand/katalis-flame-64.png`, the original, made for dark grounds) beside "Built by Katalis" in `text-paper/70`.
   Below 1024 px: an ink top bar with the wordmark and, under it in the same band, the same list scrolling
   horizontally (`overflow-x: auto`), then the switch and the sign-out in one row. The content column keeps
   `max-w-[960px]`, `px-6 py-12` (`lg:px-12`). No modal, no drawer.
8. **The sign-in is a split screen.** `LoginForm` keeps its form, labels, names and messages; the page around it
   (`app/admin/layout.tsx`, unauthorized branch) becomes a grid `1fr 1fr` from 1024 px: the left half ink with the
   wordmark `md tone="ink"`, the tagline `Every answer shows where it came from.` / `Cada respuesta enseña de dónde
   salió.` (from `lib/i18n/admin.ts`, new keys `tagline`) with the highlighter on its last three words, and the flame
   line; the right half paper with the form centered (`max-w-[420px]`). Below 1024 px they stack, ink first.
9. **The public page wears the business first.** `app/page.tsx`: a full-width band (`header`) painted with
   `--primary` and `--on-primary`, `py-10` (`lg:py-14`), holding the logo (when there is one) or the wordmark `lg` when
   the business is still `Cited`, the business name as the `h1` (Outfit 700, 32 px, 40 px from `lg`), and the
   `LanguageSwitch tone="brand"` at the end of the row. Under the band, on paper, the `Chat` in a column of
   `max-w-[880px]`. The `Chat` renders the welcome as the headline (`h2`? no: a `p` with `text-[28px] lg:text-[36px]
   font-semibold leading-[1.15] tracking-[-0.02em] max-w-[24ch]`, the last three words in the highlighter, the `rise`
   motion once). When there is no business yet, the band is ink with the wordmark and the switch in `tone="ink"`.
10. **The ledger.** Each turn of the `Chat` is an `li` with: the question as a label row (`text-[11px] uppercase
    tracking-[0.18em] text-ink-2` "You asked" / "Preguntaste" followed by the question in Outfit 600, 18 px); the
    answer at 18 px, `leading-[1.6]`, with the `CitationMark` buttons inline (each with `--i` for the stagger and
    `mark-land` when the turn is new); the sources as an `aside` labelled "Sources" that lists one `CitationMark`
    button per source with the document name beside it (the accessible name stays `[n] <document>`); the open
    citation as the `CitationPanel` under the answer with the excerpt in the highlighter (`.hl .hl-sweep`), the
    document and the heading as a definition list, and "Close" as `variant="secondary" size="sm"`; the `note-in`
    motion on open. From 1024 px the sources move to a right margin column (`grid-cols-[1fr_220px]`) beside their
    answer; below, they follow the answer. A refusal keeps `data-cited="refusal"` and its texts, styled as a paper
    panel with a `CitationMark`-shaped ink square carrying an en dash instead of a number. A failure keeps
    `role="status"` and shows the message beside a coral square of the same shape; the coral side stripe goes away.
11. **Waiting and asking.** The loading state keeps `role="status"` and its text and adds, under the text, a 2 px bar
    painted `bg-[var(--primary)]` with the `bar` motion (the test of the chat reads the class of the bar). The ask
    form stays at the foot of the column and becomes `sticky bottom-0` with a paper background and a top rule once the
    thread exists (`data-cited="ask"`), so the box stays in reach on a long thread; the label, the placeholder, the
    name `question` and the `brand` button do not change.
12. **The embed** (`app/embed/page.tsx`) keeps its size and its rules; its band is a slim strip (`py-4`) in the primary
    color with the name at 18 px and the switch in `tone="brand"`; the rest is the same `Chat`.
13. **The kit page** adds three sections with `data-kit="wordmark"`, `data-kit="citation-mark"` and
    `data-kit="highlighter"`, keeps the six markers it has, and a short paragraph per device saying what it is for; a
    reduced-motion note. `/kit` stays in Spanish.
14. **`DESIGN.md`** at the root, in the format the `impeccable` skill reads (visual theme, colors with the tokens,
    typography scale, components, layout, motion), so the guided-setup lane and every later screen start from it;
    `docs/design-system.md` gains a section for the product tokens and the two devices, with the same values.
15. **Captures** come from `scripts/capture-ui.mjs` (already written by Fable, kept in the change) against the running
    app with the fake providers and `samples/` ingested, at 1440 and 375 px, into
    `katalis-dev/tasks/capturas-community-14/`; the "before" set of the same script is in
    `katalis-dev/tasks/diseno-cited/antes/` for the review to compare.
16. **What does not change**: the tokens of Construye and the test that compares them, the flame files, Outfit, every
    route and API, every string key that a test names (only new keys are added), the shared modules of the parallel
    lanes (`lib/settings/business.ts`, the interface of `LanguageSwitch`), the CSP and the widget script.
17. **Interface addendum (Fable, before the build)**: the exact names, so that the tests and the code meet.
    `lib/brand/highlight.ts`: `export function highlightLast(text: string, words?: number): { lead: string; tail: string
    }`, where `lead` is the text before the highlighted tail with its trailing space and `tail` is the last `words`
    words (default 3 when the text has six or more words, all of them otherwise; `tail` is empty only for an empty
    text). `components/brand/Wordmark.tsx`: `Wordmark({ size?: "sm" | "md" | "lg"; tone?: "paper" | "ink"; href?: string;
    className?: string })`, an `a` when `href` is given and a `span` otherwise, carrying `data-brand="wordmark"` and the
    accessible name `Cited` (the visible `1` is `aria-hidden`). `components/brand/CitationMark.tsx`:
    `CitationMark({ n?: number | string; className?: string })` renders a static `span` with
    `data-brand="citation-mark"` (default `n` is 1) and exports `citationMarkClass(state?: "rest" | "open")`, the class
    string that the interactive marks of `Markdown` and the sources list use, so a button and a span look identical.
    Data hooks: `data-admin="sidebar"` (the ink column or the top bar), `data-public="band"`, `data-cited="turn"` (each
    ledger entry), `data-cited="sources"` (the aside of an entry), `data-cited="ask"` (the ask form),
    `data-cited="waiting-bar"` (the waiting bar); the existing `data-cited="answer"`, `"citation"` and `"refusal"`
    stay. The panel keeps exactly one `LanguageSwitch` (inside `data-testid="language-switch"`) and one sign-out
    button in the DOM at any width, and the `h1` of every page stays unique: the wordmark is never a heading. When no
    business exists the `h1` of the public page ("Cited") is visually hidden and the wordmark, `aria-hidden` there,
    is the visible name.
18. **Katalis signs with its flame (Franc, 2026-09-29).** Every visible "Katalis" signature carries the real flame
    beside it: `BuiltByKatalis` on the panel and the sign-in, the footer of the public page (`app/page.tsx`), and any
    later credit. The Spanish public footer in `lib/i18n/public.ts` reads `Hecho por Katalis` like the panel does. Text
    that cannot carry an image (the HTML description, the comment of the widget script) is out of scope.
19. **Dates an owner can read.** The "When" / "Cuándo" column of Conversations stops printing the stored ISO string: it
    renders `Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })` in the language of the panel
    inside a `<time dateTime="<the ISO value>">`, so the machine value stays in the markup and the owner reads
    "29 sept 2026, 15:49".

## Amendment after the verification of three rounds (Fable, 2026-09-29; findings in
`katalis-dev/tasks/verificacion-brand-identity-ui-r3.json`, 16 major and 54 minor)

20. **The base first.** `main` (d71220d: the keys in the panel and the voice agent) is merged into this branch before
    any other fix: main's behaviour wins inside the new look (`VoiceLauncher` on `/` and `/embed`, the not-ready state
    of the public page, `export const dynamic = "force-dynamic"`, the page `/admin/ai`). "AI and keys" / "IA y llaves"
    becomes a numbered section of the ink navigation, and the voice screen wears the workspace. Everything below is
    verified on the merged tree.
21. **A failure speaks the visitor's language.** `Chat` never renders `turn.message` nor a raw `error`. `askCited`
    returns a kind (`rate_limited` for 429, `unavailable` for any other answer that is not 200, `network` when the
    request fails) and `Chat` prints `PublicStrings.errors[kind]` in the language of the page ("Too many questions from
    here. Try again in a while." / "Demasiadas preguntas desde aquí. Inténtalo más tarde."; "The answer could not be
    produced right now." / "Ahora mismo no se pudo responder."; "No connection. Check your internet and try again." /
    "Sin conexión. Revisa tu internet e inténtalo de nuevo."). The announcer says that same sentence once; the visible
    pending and failure blocks lose their own `role="status"`.
22. **The session id survives blocked storage.** Reading and writing `sessionStorage` go in `try/catch`, with an id kept
    in a `useRef` when storage fails; `send` wraps everything after the pending entry so a thrown error lands a failure
    entry.
23. **The box in reach, not in the way.** The ask form is `sticky` only from 560 px of viewport height
    (`[@media(min-height:560px)]:sticky`, with the scroll padding under the same condition). Once threaded, the label
    is `sr-only` on the page too, and field and button share one row at every width with the safe-area padding.
24. **Every page has a title.** `generateMetadata` on `/` and `/embed` returns the name of the business (`Cited` when
    there is none); each page of the panel and the sign-in get a static title from `lib/i18n/admin.ts` in the language
    of the panel ("Documents · Cited" / "Documentos · Cited").
25. **A citation mark sits against its word.** The inline renderer trims the space before a mark, the mark keeps only
    `ms-[0.15em]`, and the last word with its mark (and a punctuation that follows) is wrapped in
    `whitespace-nowrap`.
26. **Sources name the passage.** Each row of the sources shows `source.heading ?? source.document` as its first line
    and the document on a second `text-xs text-ink-2` line (hidden when it repeats the first); its accessible name is
    `[n] heading, document`.
27. **The footer names Cited.** Small wordmark, `Answers by Cited` / `Respuestas de Cited`, a middot, and the flame with
    `Built by Katalis` / `Hecho por Katalis`, on one `text-sm` row. The placeholder is neutral: `Type your question` /
    `Escribe tu pregunta` (the bicycle question of the sample café leaves the product).
28. **A delete asks first, inline.** Delete (a document) and Delete all (the conversations) swap their button for a
    `role="group"` with a sentence ("Delete README.txt?" / "¿Borrar README.txt?"), a primary `Delete` / `Borrar` and a
    secondary `Keep` / `Conservar`; the focus moves to Keep; Escape keeps. No modal.
29. **The Spanish panel is whole.** The groups of Setup take their title and detail from a localized table keyed by the
    group id of the template; a provider test shows `testOk` / `testFailed` with the provider's name in the language of
    the panel, never the server's `detail` nor a token such as `NO_ANSWER`.
30. **Setup as an owner's page is the guided setup (queue ff-13), not this change.** This change keeps Setup in the
    workspace look and makes it whole in Spanish (decision 29); the rewrite of its content for a non-technical owner is
    ff-13, next in the queue. The delivery lists it under `## Issues` as NOT DONE with that pointer.
31. **Evidence pointers.** `reports/2026-09-29-step-3-implementation.md` is added as an index that links the three split
    reports of step 3 and their commits, so the marks of 3.1 to 3.4 point to a file that exists.
32. **The flame is proven everywhere.** One E2E loops over `/`, `/embed`, `/kit`, `/admin` signed out and every page of
    the panel (with `/admin/ai`) in both languages, and checks a flame beside every signature (the scenario, amended).
33. **The 54 minors** go to the delivery as a list with a decision for each: fixed in this round when it is one line in
    a file this round already touches (the landmarks, the double live region, the 24 px language buttons, the ink
    focus ring on paper), otherwise queued as `brand-identity-polish` with its evidence.
