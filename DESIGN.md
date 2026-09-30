---
name: Cited
description: An editorial ledger for a business's own documents. Ink and paper, lime only as the mark of a citation, of something verified and of the active place, set in Outfit with square corners.
colors:
  ink: "#171717"
  lime: "#DDF469"
  coral: "#FF6059"
  surface: "#FAFAF9"
  surface-dark: "#1C1917"
  paper: "#FFFFFF"
  ink-2: "#57534E"
  border: "#8B8B8B"
  rule: "#E3E3E3"
typography:
  wordmark:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "20px, 36px or 56px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "28px, 36px from 1024px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "32px, 40px from 1024px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "12px 28px"
  button-primary-hover:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 28px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  button-ghost:
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "24px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "4px 12px"
  citation-mark:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "1.3em"
    padding: "0 0.3em"
  citation-mark-open:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.lime}"
    rounded: "{rounded.none}"
    height: "1.3em"
    padding: "0 0.3em"
  sidebar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    width: "240px"
---

# Design System: Cited

## 1. Overview

**Creative North Star: "The Editorial Ledger"**

Cited is a ledger of claims and of the sources that back them. Every screen reads like a page of a well-set book: the
important words are highlighted, every claim carries its footnote, and nothing is decorated. The register is product
(`PRODUCT.md`): the owner of a small business, not a developer, opens the panel between customers, and the visitor of
the public page wants a short answer they can verify. The theme is light (a bright room at midday), with one dark
surface, the ink column of the panel, that anchors the place.

The system is restrained and it has exactly two voices. In the panel the palette is ink, paper and lime, and lime is
never decoration: it marks a citation, something verified and the active place, and nothing else. On the public page one
band carries the color of the business (`--primary`), so the business is louder than Cited and Katalis, which sign in
the footer with the real flame. The whole system is recognizable in a screenshot without a logo because of two devices:
the **citation mark** (a lime square with the number of a source) and the **highlighter** (lime painted behind the words
that matter). Every other choice serves them: square corners, one typeface, flat surfaces, a single curve.

It rejects the anti-references of `PRODUCT.md` by name: a developer console (environment names, `MISSING` badges in
capitals, lists of settings with no next step), a generic SaaS dashboard (big metric cards, gradients, decorative
charts), a toy chatbot (bubbles, emoji, a robot avatar, answers without sources) and a node editor. In the panel,
familiar patterns are a feature: a standard side navigation and standard forms.

**Key Characteristics:**

- Ink and paper carry the layout; lime is a signal, on at most a few marks and one highlighted phrase per view.
- The two devices repeat everywhere: the numbered citation mark and the highlighter.
- Outfit only, with heavy weight and negative tracking for names and headlines, and 11px microcaps for labels.
- Square corners (`--radius: 0`), no shadows, dividers as one hairline (`--rule`).
- English first, Spanish complete: every string exists in both languages and the layout survives the longer Spanish.
- Motion is CSS only, three durations, and it disappears under `prefers-reduced-motion: reduce`.

**Layout.** The panel is a workspace: from 1024px a grid of a 240px sticky ink column and a content column of at most
960px (`px-6 py-12`, `lg:px-12`); below 1024px the column becomes an ink top bar with the sections in a row that
scrolls sideways. The public page is a full-width band, then a single column of at most 880px for the ledger. Body
copy never runs past 65ch. On a phone every control is at least 44px tall (an inline citation mark inside a sentence is
the one exemption) and the side gutter is `px-6`. There are no modals and no drawers: everything opens in place.

**Motion.** All of it lives in `app/brand.css` and animates only `transform`, `opacity` and the `background-size` of the
highlighter. The three durations are tokens: `--dur-fast` (180ms) for the color changes of a mark and of a navigation
link, `--dur-base` (320ms) for a mark or a note arriving, `--dur-slow` (640ms) for the highlighter. The keyframes are
`hl-sweep` (the highlighter paints itself in, once), `mark-land` (the marks of an answer that just arrived, staggered by
`calc(var(--i) * 40ms)`), `note-in` (a source note that opens, from the left), `rise` (the welcome headline, 480ms,
once) and `bar` (the waiting bar, `scaleX` 0 to 1, 1.6s, alternating: the one animation allowed to run longer than 700ms
because it says "still working"). At most two things move at once in any view. Under `prefers-reduced-motion: reduce`
every animation and transition is removed and the highlighter is painted in its final state at once.

## 2. Colors

A restrained palette of ink, paper and one signal color, with a warm neutral for surfaces. The values are the tokens of
`app/tokens.css`; the ratios below are measured against the real grounds and every text reaches 4.5:1 (3:1 from 24px).

### Primary

- **Ink** (`#171717`, `--ink`): text, the primary button, the sidebar and the ink band. It is also the fill of an open
  citation mark and the outline edge of the focus ring. Ink on paper is 17.93:1.
- **Lime** (`#DDF469`, `--lime`): the signal color. It fills the citation mark and the highlighter, marks a verified
  step, and is the number of the current place in the sidebar. Ink on lime is 14.70:1 and lime on ink is 14.70:1; lime
  on paper is 1.22:1, so lime is never text on paper and never carries meaning alone.

### Secondary

- **Coral** (`#FF6059`, `--coral`): failure only. It fills the square marker of a failed answer, with ink on it (6.04:1).
  It is never text on paper (2.97:1) and never a side stripe.

### Neutral

- **Paper** (`#FFFFFF`, `--paper`): the ground of the page and of every field. Paper on ink is 17.93:1.
- **Surface** (`#FAFAF9`, `--surface`): the warm ground of a panel. Ink on it is 17.17:1.
- **Surface dark** (`#1C1917`, `--surface-dark`): a warm near-ink, one step lighter than ink on every channel, used only
  as the hover of the primary button. It is not a ground and it is never darker than ink.
- **Ink 2** (`#57534E`, `--ink-2`): secondary text, labels, table heads and captions. 7.63:1 on paper and 7.30:1 on
  surface.
- **Border** (`#8B8B8B`, `--border`, the ink at half over paper): the border of a control (input, secondary button).
  3.41:1 on paper and 3.26:1 on surface, over the 3:1 WCAG asks of a control edge.
- **Rule** (`#E3E3E3`, `--rule`, the ink at 12% over paper): dividers and table lines, 1.28:1. It is never the border of
  a control.
- **The color of the business** (`--primary`, `--on-primary`): declared inline by the public page and the embed from the
  settings, checked for 4.5:1 in `lib/theme/primary.ts` and falling back to lime with ink when the color fails. It
  paints the band, the waiting bar, the ask button and the hover of a citation mark, and nothing in the panel.

### Text on ink

The sidebar and the ink band use paper at reduced alpha over ink: `text-paper/80` for the links (11.74:1), `text-paper/70`
for the foot (9.14:1) and `text-paper/60` for the quiet numerals (7.02:1). None goes lower, because a numeral is text.

### Named Rules

**The Signal Rule.** Lime marks a citation, something verified or the active place. If a lime element is not one of the
three, remove it. On a screen, lime is a few small marks and at most one highlighted phrase, never a fill of a large area.

**The Business First Rule.** On the public page the band is the color of the business and Cited and Katalis stay in the
footer. Never paint a public surface lime to "brand" it.

**The Contrast Ledger Rule.** Every text is measured on its real ground and the kit E2E fails below 4.5:1 (3:1 from
24px). Alpha over ink is measured after the blend, never by eye.

## 3. Typography

**Display Font:** Outfit (with `system-ui, sans-serif`)
**Body Font:** Outfit (with `system-ui, sans-serif`)
**Label/Mono Font:** none; labels are Outfit in microcaps.

**Character:** One geometric typeface at many weights. Names and headlines are heavy with tight tracking, which gives the
set-book weight the ledger needs; body is plain and generous. Outfit is variable (weights 100 to 900, SIL Open Font
License), served by the app from `public/fonts/outfit/`; no other family enters the repository, and a request to a
font host is a bug.

### Hierarchy

- **Wordmark** (800, 20px in the navigation, 36px in the sign-in and the kit, 56px on the public page without a
  business; line-height 1; tracking `-0.04em`): the word `Cited` followed by a citation mark that says 1. Never a heading.
- **Title** (700, 32px, 40px from 1024px, line-height 1.1, tracking `-0.02em`): the business name in the band, the one
  `h1` of the public page. `SectionTitle` uses the same weight and tracking at `text-4xl` (h1), `text-2xl` (h2) and
  `text-lg` (h3).
- **Headline** (600, 28px, 36px from 1024px, line-height 1.15, tracking `-0.02em`, at most 24ch): the welcome message of
  the public page, with its last three words in the highlighter.
- **Question** (600, 18px, line-height 1.4): the question of a turn of the ledger.
- **Body** (400, 18px, line-height 1.6, at most 65ch): an answer and an excerpt. Interface text in the panel is 16px, a
  source name 14px and a navigation link 15px at weight 600.
- **Label** (600, 11px, uppercase, tracking `0.18em`, in `--ink-2`): "You asked", "Sources", table heads, the eyebrow
  of a `SectionTitle`, the language switch and a chip. The buttons are 14px, 700, uppercase, tracking `0.05em`.

### Named Rules

**The Weight Rule.** Weight and size make the hierarchy; color does not. Headings are 600 to 800 with negative tracking,
labels are always microcaps with wide tracking, and there is no light or italic text.

**The Measure Rule.** Running text never exceeds 65ch (75ch is the hard ceiling), and a headline never exceeds 24ch.

## 4. Elevation

The system is flat. There are no shadows anywhere: depth comes from tonal layering (paper, then the warm surface, then
the ink column) and from one-pixel lines. A panel has a 1px border at 10% ink and no shadow at rest, a divider is
`--rule`, and the entries of the ledger are separated by a top rule and 32px of space. State is shown by color, never by
lift: a hover changes the fill, an open source is inverted to ink with a lime number, and the only glow-like element is
the focus ring.

### Focus

- **Focus ring** (`focusRing` of `components/ui/focus.ts`), on the keyboard only (`focus-visible`). On paper and on
  surface it is a 2px **ink** outline (17.93:1) at a 2px offset with a 2px **lime** ring between it and the control: lime
  alone is 1.22:1 on paper, so the old lime outline left one pixel of ink ring to carry the focus and, on an open citation
  mark (an ink square), no visible change at all. Now the outer edge is ink and the lime ring is what shows against an ink
  control (14.70:1). This amends decision 1 of the first change, which kept the ring untouched.
- **On ink** (`focusRingOnInk`: the column of the panel, the ghost button, the wordmark on ink) the outline is lime
  (14.70:1). **Over the band of the business** (`focusRingOnBrand`: the language switch) it is `currentColor`, the text
  color the page already checks against the band. Inside the sidebar, where a scrolling list would clip an outside outline,
  the outline is drawn inside the link (`-outline-offset-2`).

### Named Rules

**The Flat-By-Default Rule.** No `box-shadow`, no blur and no translucent glass. If depth is needed, change the ground
(paper to surface to ink) or add a `--rule` line.

**The Square Rule.** `--radius` is `0` and Tailwind's `rounded-none` is on every control, panel, chip and mark. A rounded
corner is a bug.

## 5. Components

The kit is `components/ui/` (`Button`, `Chip`, `Input`, `Panel`, `SectionTitle`) and the identity is `components/brand/`
(`Wordmark`, `CitationMark`, `Highlight`). The kit page at `/kit` shows one of each, with `data-kit` markers.

### Buttons

- **Shape:** square (0px), 14px, bold, uppercase, tracking `0.05em`; `md` is `px-7 py-3`, `sm` is `px-4 py-2`; on a phone
  both keep 44px of height.
- **Primary:** ink fill, paper text. Hover: `surface-dark`, a 400ms color transition on `ease-out-expo` (the one curve; the
  kit keeps the timing it has from Construye).
- **Secondary:** paper fill, ink text, a `--border` hairline; hover to `surface`.
- **Brand:** the color of the business (`--primary`) with `--on-primary`; the ask button of the public page and the embed.
- **Ghost:** transparent, `border-paper/40`, paper text, for controls on ink (the sign-out of the sidebar); its focus is
  the lime outline of `focusRingOnInk`.
- **Disabled:** 40% opacity. **Focus:** the focus ring of the ground it sits on.

### Chips

- **Style:** paper fill, a 1px border at 20% ink, ink text, 11px microcaps with wide tracking, `px-3 py-1`. A chip is a
  label, not a control, and its word carries the meaning.
- **State:** in the setup page a set value carries the plain kit chip with "Set" ("Puesta"); a missing one is plain
  `--ink-2` words in sentence case, "Missing" ("Falta"), never a chip, so the two states never look alike and no capital
  badge shouts. A chip carries no signal color: a set value is not a verified step. Only the Required group is open; the
  others fold into a `details` whose summary counts what is set ("Set: 1 of 8" / "Puestas: 1 de 8").

### Cards / Containers

- **Corner Style:** square. **Background:** `--surface` for a `Panel`, paper for the page.
- **Border:** 1px at 10% ink. **Shadow Strategy:** none (see Elevation). **Internal Padding:** 24px (`p-6`).
- A panel is used for a form, a refusal and an open citation. Never a grid of identical cards, and never a card
  inside a card.

### Inputs / Fields

- **Style:** full width, paper fill, `--border` hairline, ink text, `px-5 py-4`; the placeholder is ink at 60%. A file field
  dresses the native button of the picker as the primary button and keeps 44px of height.
- **Focus:** the focus ring. **Error:** one semibold ink sentence with `role="alert"` in the form, in the owner's words (14px);
  the coral square is reserved for a failed answer in the ledger, and a colored border alone never says an error.

### Navigation

- **The sidebar** (`data-admin="sidebar"`, 240px, ink, sticky, full height from 1024px): the wordmark `sm` on ink, then an
  ordered list of sections, each with a citation mark that carries its number (1 For the installer, 2 Business,
  3 Documents, 4 Conversations, 5 AI and keys) and its name at 15px, 600. The column is a plain element, not a
  complementary landmark: its `nav` is the landmark. Rest: `text-paper/80` and a quiet outlined mark. Current
  (`aria-current="page"`): paper text on `bg-paper/10`, the mark ink with a lime numeral inside a lime outline. Hover:
  `text-paper`. At the foot: the language switch in `tone="ink"`, the sign-out (ghost, `sm`) and the silver flame beside
  "Built by Katalis".
- **On a phone** it is an ink top bar: the wordmark, the same list scrolling sideways (the current section is brought into
  view), then the switch and the sign-out in one row.
- **The language switch** has two buttons (`English | Español`) with `aria-pressed`, in three tones: paper, ink (lime for
  the chosen one) and brand (`currentColor`, over the band of the business).

### Citation Mark (signature component)

A square with the number of a source, the first device of the system. Measures in `em` of the mark itself so it fits a
sentence, a wordmark and a navigation: `min-width: 1.5em`, `height: 1.3em`, `padding: 0 0.3em`, font Outfit 700 at
`0.72em` of its context, `vertical-align: 0.1em`, square, tabular numerals.

- **Rest:** lime fill, ink text (14.70:1). **Open or current:** ink fill, lime number. On an ink ground (`tone="ink"`) the
  rest mark is a quiet outline with `text-paper/60` and the open mark is ink with a lime number and a lime outline.
- **As a button** (the markers inside an answer, the sources list): same shape, the accessible name `Citation n` (or
  `[n] heading, document` in the sources), `aria-expanded` and `aria-controls`, the focus ring, and on the public page a
  hover in the color of the business (only while the mark is at rest, so an open mark never repaints under the pointer, in
  the text or in the sources).
- **Against its word:** in the text of an answer the space before a mark is dropped and the last word, the marks and the
  punctuation that follows are one unit that never breaks (`whitespace-nowrap`), so a mark never starts a line alone. Only
  the first two marks of an answer land when it arrives.
- **Uses:** the sources of an answer, the numbered sections of the panel, the steps of the guided setup lane. A refusal
  uses the same square in ink with an en dash, and a failure the same square in coral with an exclamation mark.

### Highlighter (signature component)

Lime painted behind the words that matter, the second device. `.hl` paints `linear-gradient(transparent 55%, var(--lime)
55%)`, no repeat, with `padding: 0 0.08em` and `box-decoration-break: clone` so it survives a line break.

- **`.hl-sweep`** paints it in once from `0% 100%` to `100% 100%` in `--dur-slow` with the expo curve.
- **`.hl-on-ink`** is the variant on an ink ground: a solid lime block with ink text, because the half-height marker would
  put paper text over lime (1.22:1). It is used with `.hl`.
- **Uses:** the last three words of a headline or a tagline (`highlightLast` in `lib/brand/highlight.ts`) and the whole
  excerpt of an open citation. It is text-level paint, not gradient text: the text color never changes to a gradient.

### The Ledger (signature component)

The public chat is a list of turns, each an `li` with a top `--rule` line: the question as a label row ("You asked" over
the question at 18px, 600), the answer at 18px with its citation marks inline, and the sources as a `group` named
"Sources" (not a landmark: four entries would list four identical regions) in a 220px right margin from 1024px (below it,
after the answer). Each source is a mark and, first, the heading of its passage (`text-sm`), then the file on a second line
(`text-xs`, `--ink-2`, hidden when it would repeat the heading); its name is `[n] heading, document`. The open citation is
a `Panel` under the answer with the excerpt in the highlighter, the document and the heading as a definition list and a
`sm` secondary "Close" button; choosing another citation mounts a new note, so it enters and sweeps again. The waiting
state is a line of text over a 2px bar in `--primary` moving with `bar`, with no live region of its own: one polite
announcer, always in the page, says the wait and the entry that lands, once.

A failure is a coral square and one sentence of the kind of failure, in the language of the page (`rate_limited`,
`unavailable` or `network`), never what the server wrote, beside a Try again button. The ask form sticks to the foot on
paper with a top rule once the thread exists, but only from 560px of viewport height (`[@media(min-height:560px)]:sticky`,
the scroll padding reserved under the same condition): on a phone on its side or at 200% and 400% zoom it stays in the flow
and the last answer is never under it. Once threaded its label is for the screen reader only and the field and the button
share one row at every width, with the safe-area padding.

### The Band (signature component)

The top of the public page and the embed: a full-width `header` (`data-public="band"`) painted `--primary` with
`--on-primary`, `py-10` (`lg:py-14`; the embed uses a slim `py-4` strip), the logo when there is one, the business name as
the one `h1` and the language switch at the end. With no business yet the band is ink, the wordmark `lg` is the visible
name and the `h1` "Cited" is visually hidden.

The band and the footer sit beside `main`, so the page has a banner and a contentinfo. The footer is one `text-sm` row under a
`--rule` line that lines up with the column: the small wordmark, `Answers by Cited` / `Respuestas de Cited`, a middot and the
real flame (decoration, `alt=""`) with `Built by Katalis` / `Hecho por Katalis`. The tab is named for the business (`Cited`
while there is none), and the placeholder of the box is neutral (`Type your question` / `Escribe tu pregunta`).

### Asking before a delete

A delete that cannot be undone asks first, in place: the button swaps for a group with a sentence ("Delete README.txt?" /
"¿Borrar README.txt?"), a primary Delete and a secondary Keep. The focus moves to Keep, Escape keeps and gives the focus back
to the first button, and nothing is sent until the second press. No modal (`ConfirmedDelete`).

## 6. Do's and Don'ts

### Do:

- **Do** keep lime to a citation, something verified and the active place: at most a few marks and one highlighted
  phrase in a view.
- **Do** number things with the citation mark (sources, sections, steps) so the device repeats.
- **Do** use `--ink-2` (`#57534E`) for secondary text and `--rule` (`#E3E3E3`) for dividers, and ink for everything else.
- **Do** put every animation in `app/brand.css`, animate only `transform`, `opacity` and the highlighter's
  `background-size`, keep it between 150 and 700ms (the waiting bar excepted) and remove it under
  `prefers-reduced-motion: reduce`.
- **Do** keep 44px of height on every control on a phone and the focus ring of the kit on every interactive element.
- **Do** measure the contrast of every text on its real ground and keep 4.5:1 (3:1 from 24px).
- **Do** write every string in English and Spanish, with plain words for a non-technical owner: "Connect your AI", never a
  variable name.
- **Do** say what to do next on every screen, and show the source on every answer.
- **Do** sign with the real flame (`public/brand`) beside every visible "Katalis", and use the silver flame on ink and the
  ink flame on paper.

### Don't:

- **Don't** use a colored side stripe: `border-left` or `border-right` wider than 1px as an accent is prohibited; use a
  full border, a background tint or a leading square marker instead.
- **Don't** use gradient text (`background-clip: text` over a gradient); emphasis is weight, size or the highlighter.
- **Don't** use a modal or a drawer; every action opens in place.
- **Don't** use emoji as icons, and don't invent a logo: the wordmark and the real flame files are the only marks.
- **Don't** use glassmorphism, blur, shadows or translucent panels.
- **Don't** build a developer console: no environment variable names, no `MISSING` badges in capitals, no lists of settings
  with no next step.
- **Don't** build a generic SaaS dashboard: no big metric cards, no decorative charts, no gradients, no grid of identical
  cards.
- **Don't** build a toy chatbot: no bubbles with emoji, no robot avatar, no answer without visible sources.
- **Don't** build a node editor in the style of Dify or Flowise; it is out of scope.
- **Don't** round a corner, and don't add a family other than Outfit or a font that is not under `public/fonts/outfit`.
- **Don't** paint lime as a text color on paper (1.22:1), and don't use coral as text.
- **Don't** animate a layout property (`width`, `height`, `top`, `margin`), and don't add a decorative animation.
- **Don't** let the panel wear the color of the business, or let Cited and Katalis outshine the business on the public page.
- **Don't** print a raw machine value where an owner reads (an ISO date, a variable name, a stack trace).
- **Test for any new screen:** cover the wordmark and the flame; if it could be any other product, the citation marks and
  the highlighter are missing or lime is used as decoration.
