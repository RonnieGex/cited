## ADDED Requirements

### Requirement: Documents are ingested safely

The ingestion SHALL accept PDF, DOCX, Markdown and plain text, SHALL decide the type from the file's content (magic
bytes) and not from its name, SHALL refuse a file above 20 MB or above 500 pages, and SHALL report a file it cannot
parse and skip it without writing any of its passages.

#### Scenario: A renamed file

- **WHEN** a file named `notes.pdf` contains plain text
- **THEN** it is ingested as plain text, or refused if its content is not an accepted type, and the report says which

#### Scenario: A broken file

- **WHEN** a PDF cannot be parsed
- **THEN** the report names the file and the reason, no passage of that file exists in the store, and the rest of the
  folder is ingested

#### Scenario: Limits

- **WHEN** a file is larger than 20 MB or has more than 500 pages
- **THEN** it is refused before parsing and the report says which limit it crossed

### Requirement: Passages keep where they came from

Each passage SHALL keep its document name, its position in the document and the nearest heading above it, and
re-ingesting the same document SHALL replace its passages instead of duplicating them.

#### Scenario: Re-ingestion

- **WHEN** the same folder is ingested twice
- **THEN** the number of passages of each document is the same after the second run

### Requirement: Embeddings come from a configured provider

The embeddings SHALL come from a provider selected by environment variables: an OpenAI-compatible API (base URL, model,
key) or Ollama (base URL, model). A missing or invalid configuration SHALL stop the ingestion with a message that names
the variable, and SHALL never print a key.

#### Scenario: Missing key

- **WHEN** the OpenAI-compatible provider is selected and its key is empty
- **THEN** ingestion stops before reading any document and the message names the variable and not a value

### Requirement: Hybrid search with rank fusion

The search SHALL rank passages by keyword relevance (FTS5) and by vector similarity, SHALL fuse both rankings with
Reciprocal Rank Fusion with `k = 60`, and SHALL return the top passages with document, heading, position and fused
score.

#### Scenario: A keyword-only match still ranks

- **WHEN** a question shares a rare exact term with one passage and no close meaning with any other
- **THEN** that passage is in the top results

#### Scenario: A meaning-only match still ranks

- **WHEN** a question paraphrases a passage with no shared terms
- **THEN** that passage is in the top results with the fake provider that encodes the paraphrase as close

### Requirement: The store is verified before it is chosen

The store SHALL be chosen by the spike of this change. libSQL SHALL be used only if the spike proves native vectors and
FTS5 on a local file through the Node client. Otherwise the local store SHALL be `better-sqlite3` with `sqlite-vec`,
and the documentation SHALL say that Turso is not supported yet.

#### Scenario: The spike decides

- **WHEN** the spike runs
- **THEN** its report shows the exact statements and results for vectors and FTS5, and `design.md` records the choice
  before any other code of the store exists
