## ADDED Requirements

### Requirement: The README presents the product in its first screen

`README.md` SHALL open with the brand of Cited and say, before any command, what the product does, why it is
different and how mature it is, so that a reader who arrives from a post or an interview understands it in seconds.

#### Scenario: The banner is the heading

- **WHEN** the head of `README.md` is read
- **THEN** its only level-one heading is an HTML `<h1 align="center">` whose only content is a `<picture>` with the
  dark source `docs/images/readme-banner-dark.png` for `(prefers-color-scheme: dark)` and the fallback image
  `docs/images/readme-banner-light.png`, with an `alt` that names `Cited`
- **AND** both files exist, are PNG, 1280 px wide and 320 px high

#### Scenario: The banner is reproducible

- **WHEN** `node scripts/render-readme-banner.mjs` runs
- **THEN** it renders both banners and writes `docs/images/readme-banner.json` with the texts each one shows
- **AND** the tagline of the record equals the tagline written under the banner in `README.md`

#### Scenario: The promise and the maturity come first

- **WHEN** the text of `README.md` is read up to its first code block
- **THEN** it carries the tagline, the badges, a link to `README.es.md`, three reasons that say what makes Cited
  different, and a sentence that says it is in early development and not ready for production

### Requirement: The README says exactly what works today

`README.md` SHALL carry a status table whose rows are the capabilities of the product, each one marked `Available`
or `Planned`, so that nothing is presented as working before it works.

#### Scenario: Available means specified and merged

- **WHEN** a row is marked `Available`
- **THEN** it links the spec in force under `openspec/specs/` that describes it, and that spec exists

#### Scenario: Planned means scheduled

- **WHEN** a row is marked `Planned`
- **THEN** it names the change of the plan that delivers it (`design-system-shared`, `pluggable-models-and-ask`,
  `admin-and-public-ui`, `elevenlabs-voice-agent`, `security-hardening` or `docs-deploy-and-launch`)
- **AND** no sentence outside the status table and the roadmap presents a planned capability as available

### Requirement: The README runs the product in minutes

`README.md` SHALL carry a quick start whose commands exist and work on a clean clone, and SHALL explain how Cited works
with a diagram.

#### Scenario: The commands exist

- **WHEN** the commands of the quick start are read
- **THEN** every `npm run <script>` names a script of `package.json`, and the quick start ingests `samples/` and runs
  one search with the deterministic provider, so it needs no key

#### Scenario: How it works

- **WHEN** the section on how it works is read
- **THEN** it carries the designed flow graphic of the requirement "The README sells the product with graphics", with
  the ingestion, the libSQL store with full-text and vector search, the Reciprocal Rank Fusion and the answer with its
  citations, the planned parts marked `Next` in the graphic itself
- **AND** a Mermaid version of the same flow inside a `<details>` block, for readers who cannot see images

### Requirement: The configuration is documented by name only

`README.md` SHALL list the environment variables it asks the owner to set, SHALL say for each one what it is for and
whether the code reads it today, and SHALL never carry a value that could be a key.

#### Scenario: Variables against the example file and the code

- **WHEN** the variables of the configuration table are compared with `.env.example` and with the code
- **THEN** every variable of the table is in `.env.example`, and a variable marked as read today is read by a file under
  `lib/`, `scripts/` or `app/`

### Requirement: The Spanish twin says the same

`README.es.md` SHALL be the Spanish version of `README.md`, with the same banner, the same sections in the same order,
the same commands and the same variables, and each file SHALL link the other at its head.

#### Scenario: The twins agree

- **WHEN** the two files are compared
- **THEN** they have the same number of level-two sections, the same code blocks, the same variable names and the same
  status of every row

### Requirement: Every link and image of the README resolves

Every relative link and image of `README.md` and `README.es.md` SHALL resolve to a file of the repository, and every
image SHALL come from the repository, `https://img.shields.io/` or the workflow badge of the repository on
`github.com`, with no tracking parameter.

#### Scenario: Links and hosts

- **WHEN** every link and image of both files is listed
- **THEN** the relative ones exist on disk and the absolute images use only the allowed hosts

### Requirement: The README credits Katalis and states the license

`README.md` SHALL end with the license (Apache-2.0, with a link to `LICENSE` and `NOTICE`) and a centered footer with
the Katalis logo and the line `Built by Katalis` linking `https://katalis.dev`.

#### Scenario: The foot

- **WHEN** the last section of `README.md` is read
- **THEN** it names Apache-2.0, links `LICENSE` and `NOTICE`, and carries `Built by Katalis` with its link

### Requirement: The README sells the product with graphics

`README.md` SHALL read like an announcement of the product, with a designed graphic for each section that presents it,
every graphic rendered by a committed script in a light and a dark variant, so that the repository is Katalis's calling
card. A graphic SHALL never show a planned capability as working. (Added by Fable after Franc's request of
2026-09-29: "anúncialo casi como un Ad, genera gráficos, imágenes de todos".)

#### Scenario: The graphics exist in both themes

- **WHEN** the images of `README.md` are listed
- **THEN** besides the banner there are, each as a `<picture>` with its dark source and light fallback and an `alt`
  that says what it shows: one card per reason of `Why Cited`, the flow of `How it works`, a real demo of the search,
  the roadmap, and the teaser of the voice agent
- **AND** every file is a PNG under `docs/images/`, and all the images of the README weigh 3 MB or less together

#### Scenario: The demo is real output

- **WHEN** the render script builds the demo graphic
- **THEN** it runs `npm run ingest -- samples/` and one `npm run search` with the deterministic provider and draws the
  commands and their real output, and `docs/images/readme-graphics.json` records the commands and the lines drawn

#### Scenario: Planned is visible in the picture

- **WHEN** a graphic shows a capability that the status table marks `Planned`
- **THEN** the graphic itself carries the label `Next` on it, and its entry in `docs/images/readme-graphics.json`
  records that label
- **AND** the roadmap graphic shows the same rows and states as the status table, compared through the record

#### Scenario: A social preview

- **WHEN** `docs/images/social-preview.png` is read
- **THEN** it is a PNG of 1280 × 640 with the name, the tagline and `by Katalis`, ready to be set as the social preview
  of the repository at the launch
