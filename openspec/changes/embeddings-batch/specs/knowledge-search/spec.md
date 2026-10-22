## ADDED Requirements

### Requirement: The size of an embeddings request is configurable

The ingestion and the re-index SHALL send the passage texts to the embeddings provider in requests of at most
`EMBEDDINGS_BATCH` texts, in the order of the passages, SHALL use 32 texts per request when the variable is absent,
and SHALL use 32 when its value is not a positive integer (empty, `0`, negative, fractional or non-numeric). The
variable SHALL be read when the texts are embedded, so the ingestion and the re-index of one process obey the same
value, and the number of texts per request SHALL change nothing about the vectors: each passage keeps the vector of
its own text.

#### Scenario: The default request

- **WHEN** `EMBEDDINGS_BATCH` is absent and a document of 40 passages is ingested
- **THEN** the provider receives two requests, of 32 and 8 texts, and the texts of both requests read the 40
  passages in order

#### Scenario: A provider that accepts fewer texts

- **WHEN** `EMBEDDINGS_BATCH` is `16` and a document of 40 passages is ingested
- **THEN** the provider receives three requests, of 16, 16 and 8 texts, and every passage is stored with a vector

#### Scenario: The re-index obeys the same value

- **WHEN** `EMBEDDINGS_BATCH` is `4` and the owner re-indexes a document of 40 passages
- **THEN** the provider receives ten requests of 4 texts and the count of re-indexed passages is 40

#### Scenario: A value that is not a positive integer

- **WHEN** `EMBEDDINGS_BATCH` is empty, `0`, `-8`, `2.5` or `abc`
- **THEN** the requests carry 32 texts, as if the variable were absent, and no message names a value
