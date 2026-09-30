# design-system Specification

## Purpose
Give Cited the real Katalis flame, the tokens shared with Construye, the free Outfit typeface and a small accessible kit
of components, so every screen of the product looks like one brand and nothing licensed is redistributed.
## Requirements
### Requirement: The mark of Katalis is the real flame

Every place of the repository that shows the mark of the maker SHALL use the Katalis flame, the same image every
Katalis product uses, and SHALL NOT use any other drawing of a Katalis logo.

#### Scenario: The flame is the original

- **WHEN** `public/brand/katalis-flame-64.png`, `-192.png` and `-512.png` are hashed
- **THEN** each SHA-256 equals the one of the file of the same size in Construye's `public/brand/katalis-logo-*.png`,
  recorded in `docs/design-system.md`

#### Scenario: The ink variant is derived, not drawn

- **WHEN** `node scripts/render-flame-variants.mjs` runs
- **THEN** it writes `public/brand/katalis-flame-ink-64.png` and `-192.png` from the 512 px original only by resizing
  and recoloring, and the record of the script names the source hash

#### Scenario: No invented logo

- **WHEN** the images of the repository are listed
- **THEN** `docs/images/katalis-logo.png` and `docs/images/katalis-logo-dark.png` do not exist, the foot of `README.md`
  and `README.es.md` shows the flame (the original in the dark theme, the ink variant in the light theme), and the
  banner and the social preview show the flame next to `by Katalis`

### Requirement: One set of tokens, the ones of Construye

The app SHALL define its colors, radii and motion once, in `app/tokens.css`, with the values of Construye's
`app/globals.css`, and SHALL expose them to Tailwind v4 through `@theme`.

#### Scenario: The values match the reference

- **WHEN** the tokens of `app/tokens.css` are compared with the ones of Construye's `app/globals.css` listed in
  `docs/design-system.md`
- **THEN** ink, lime, coral, the surfaces, the corner radius and the motion curve are equal

### Requirement: Outfit is the font, self-hosted and licensed

The app SHALL use Outfit, served from `public/fonts/outfit/` with `OFL.txt` next to the files, applied on `<html>` so
every text of every page uses it, and SHALL NOT carry any other font file.

#### Scenario: The computed font

- **WHEN** a page of the app is rendered in a browser
- **THEN** the computed `font-family` of `html`, of `body` and of a paragraph starts with Outfit, and no request goes to
  a font host outside the app

#### Scenario: No licensed font

- **WHEN** the font files of the repository are listed
- **THEN** they are the Outfit files and nothing else, and none of them carries the name Lufga in its file name or in
  its metadata

### Requirement: A kit of components

`components/ui/` SHALL provide `Button` (primary and secondary), `Panel`, `Input`, `Chip` and `SectionTitle` built on
the tokens, accessible by keyboard with a visible focus, and the public page `/kit` SHALL show each one.

#### Scenario: The kit page

- **WHEN** `GET /kit` is served
- **THEN** it answers 200 and renders one example of each component, and an axe check of the page reports no
  violation of level A or AA

#### Scenario: The controls can be seen

- **WHEN** the rendered `/kit` is measured in Chromium with the computed colors of each component
- **THEN** the border of `Input`, the border of the secondary `Button` and the focus indicator reach at least 3:1
  against the ground they sit on (WCAG 2.2, 1.4.11), and every text reaches 4.5:1 (3:1 at 24 px or more)
- **AND** the border and the fill of `Panel` are decorative and exempt, because the content of the panel does not
  depend on seeing its edge

### Requirement: The identity reaches the product

The product SHALL carry one wordmark (`Cited` with a lime citation mark), one citation mark component that numbers the
sources of an answer and the places of the panel, and one highlighter (lime painted behind the words that matter), and
SHALL expose them in the kit page with their tokens; no other logo and no other accent color SHALL appear.

#### Scenario: The kit shows the devices

- **WHEN** `GET /kit` is served
- **THEN** it renders the wordmark, the citation mark and the highlighter with their `data-kit` markers, the six markers
  it already had, and an axe check reports no violation of level A or AA

#### Scenario: Every text still reads

- **WHEN** the rendered `/kit` is measured in Chromium with its computed colors
- **THEN** every text reaches 4.5:1 against the ground it sits on (3:1 at 24 px or more), including the number inside a
  citation mark and the words inside the highlighter, and the controls keep their 3:1

### Requirement: Katalis always signs with its flame

Every visible signature of Katalis SHALL show the real flame of Katalis beside the name and SHALL read in the language
of the page: the line "Built by Katalis" or "Hecho por Katalis", a "by Katalis" credit, a footer, a README banner or
its closing line, with the silver flame on ink grounds and the ink flame on light grounds.

#### Scenario: Every signature carries the flame

- **WHEN** `/`, `/embed`, `/kit`, `/admin` signed out and every page of the panel are rendered in English and in Spanish
- **THEN** every signature (`Built by Katalis`, `Hecho por Katalis`, `by Katalis`) has a flame image
  (`/brand/katalis-flame*.png`) as a sibling or child, and the Spanish pages read `Hecho por Katalis`; a sentence that
  only mentions Katalis inside the text of the kit is not a signature

### Requirement: Motion serves the state and respects the reader

Every animation SHALL be CSS of the application, SHALL animate only `transform`, `opacity` or the size of the
highlighter's paint, SHALL last between 150 ms and 700 ms except the waiting bar, and SHALL be removed under
`prefers-reduced-motion: reduce`.

#### Scenario: Reduced motion

- **WHEN** the page is opened with `prefers-reduced-motion: reduce`
- **THEN** no element carries a running animation, and the highlighter is painted in its final state at once

#### Scenario: Nothing external moves

- **WHEN** the dependencies of the repository are read
- **THEN** no animation library is among them, and `app/brand.css` holds every keyframe of the product
