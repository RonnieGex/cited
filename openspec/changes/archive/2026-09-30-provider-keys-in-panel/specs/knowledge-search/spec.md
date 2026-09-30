## MODIFIED Requirements

### Requirement: Embeddings come from a configured provider

The embeddings SHALL come from a provider set on the server by environment variables (an OpenAI-compatible API with
base URL, model and key, or Ollama with base URL and model) or, when the server sets none, from the embeddings provider
or the keyword mode saved in the panel (capability `provider-settings`). A missing or invalid configuration SHALL stop
the ingestion with a message that names what is missing, and SHALL never print a key. Changing the provider, the model
or the mode SHALL mark every passage for re-indexing until the owner re-indexes.

#### Scenario: Missing key

- **WHEN** the OpenAI-compatible provider is selected on the server and its key is empty
- **THEN** ingestion stops before reading any document and the message names the variable and not a value

#### Scenario: A change of embeddings

- **WHEN** the owner switches from keyword search to an embeddings provider with documents already ingested
- **THEN** the panel says how many passages need re-indexing, and after "Re-index now" every passage has a vector of the
  new provider

### Requirement: Hybrid search with rank fusion

The search SHALL rank passages by keyword relevance (FTS5) and by vector similarity, SHALL fuse both rankings with
Reciprocal Rank Fusion with `k = 60`, and SHALL return the top passages with document, heading, position and fused
score; in keyword mode (no embeddings provider) it SHALL rank by FTS5 alone and SHALL say so to the owner.

#### Scenario: A keyword-only match still ranks

- **WHEN** a question shares a rare exact term with one passage and no close meaning with any other
- **THEN** that passage is in the top results

#### Scenario: A meaning-only match still ranks

- **WHEN** a question paraphrases a passage with no shared terms
- **THEN** that passage is in the top results with the fake provider that encodes the paraphrase as close

#### Scenario: Keyword mode

- **WHEN** the panel holds keyword mode and a question shares a term with one passage
- **THEN** the search returns that passage without calling any embeddings provider, and ingestion stores no vectors
