## ADDED Requirements

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
