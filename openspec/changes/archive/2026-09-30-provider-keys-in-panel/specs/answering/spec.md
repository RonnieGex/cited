## MODIFIED Requirements

### Requirement: The chat model is chosen by variables

The chat provider SHALL be one of `openai`, `anthropic`, `gemini`, `deepseek`, `groq`, `openrouter`, `ollama`,
`lmstudio` or `fake`, chosen by `CHAT_PROVIDER` and `CHAT_MODEL` on the server or, when the server sets none, by the
provider saved in the panel (capability `provider-settings`); the key SHALL come from the server variable of that
provider or from the panel's encrypted value. When no model is chosen the provider's default SHALL be a model its
provider still serves according to its public documentation on the date of the change, recorded with that source in
`docs/answering.md`. A missing or invalid configuration SHALL answer `503` with a message that names what is missing
(the variable on the server, or "connect your AI in the panel") and never a value, and no key SHALL ever reach a
response, a log line or the browser.

#### Scenario: A missing key

- **WHEN** `CHAT_PROVIDER` is `openai`, `OPENAI_API_KEY` is empty and the panel holds no chat provider
- **THEN** `/api/ask` answers `503` naming `OPENAI_API_KEY`, and the body carries no value of any variable

#### Scenario: Nothing configured anywhere

- **WHEN** the server sets no chat provider and the panel holds none
- **THEN** `/api/ask` answers `503` saying the AI is not connected yet, and the public page shows that the assistant is
  not ready

#### Scenario: The provider saved in the panel

- **WHEN** the server sets no chat provider and the panel holds a tested DeepSeek key
- **THEN** answers are asked to DeepSeek with that key, decrypted only in the server process

#### Scenario: The deterministic provider

- **WHEN** `CHAT_PROVIDER` is `fake`
- **THEN** the answer is built without any network call from the top passages, with valid citations, and it says in
  its text that it comes from the test provider

#### Scenario: The defaults are current

- **WHEN** the table of defaults of `lib/models/types.ts` is compared with the table of `docs/answering.md`
- **THEN** both name the same model per provider, each row of the documentation carries the official source and the
  date it was checked, and the DeepSeek default is `deepseek-flash`, the model Katalis Responde serves in production
