## Why

Franc opened Cited and asked where the information goes and where the API keys go (2026-09-29). The panel's setup page
is a list of environment variables (`OPENAI_API_KEY: MISSING`), and a key can only be set in a file on the server, which
the owner of a small business will never touch. The approved design brief (`katalis-dev/tasks/diseno-cited/brief-experiencia.md`)
and `PRODUCT.md` make the owner non-technical and put the keys in the panel, encrypted, tested before they are saved.
This change delivers step 1 of the guided setup, "Connect your AI", and the page "AI and keys" that replaces the list
of variables; the rest of the guided setup is the next change, `guided-setup-and-knowledge`.

## What Changes

- **Keys in the panel, encrypted.** The owner picks a chat provider, pastes a key, presses "Test"; the provider answers a
  short test and only then the key is saved, encrypted with AES-256-GCM under `ENCRYPTION_KEY`. The browser never sees a
  saved key again, only its last four characters, the provider, the model and the last test.
- **One resolver.** The answer pipeline and the ingestion read the provider through one module: a value set on the
  server wins and the panel shows it as "set by the server"; otherwise the panel's value; otherwise "not connected".
- **Meaning search.** If the chat provider also offers embeddings (OpenAI, Gemini, Ollama), they are used with the same
  key; if not (DeepSeek, Anthropic, Groq, OpenRouter), the owner adds a second key for them or chooses keyword search,
  which works without one and is labelled as such. Changing the embeddings re-indexes the documents, with a warning.
- **Honest catalogue.** Each provider shows one line on cost, speed, where it processes data and whether it offers
  meaning search, and a "Get a key" link; where a verified affiliate programme exists (ElevenLabs, for the voice, in
  the next changes) the link is an affiliate link labelled "(paid link)"; `AFFILIATE_LINKS=off` shows plain links. Under
  the list, "Prefer not to manage keys? Katalis runs it for you" links to the hosted paid version (Franc, 2026-09-29).
- **"For the installer"**, a read-only section that lists what the server sets above the panel, replaces the old list
  of variables; no variable name appears anywhere else in the interface.

## Impact

- New: `lib/secrets/` (encryption), `lib/settings/providers.ts` (the resolver), `lib/providers/catalog.ts`,
  `app/admin/ai/` (the page), `app/api/admin/providers/` (test, save, remove), tests and E2E, `docs/providers.md`.
- Changed: `lib/answer/` and `lib/ingest/` read through the resolver; `app/admin/setup` becomes "For the installer";
  the panel navigation; `.env.example` (`ENCRYPTION_KEY`, `AFFILIATE_LINKS`, `HOSTED_OFFER_URL`); the README and its twin.
- Specs: new capability `provider-settings`; `answering` (MODIFIED: the chat model is chosen in the panel or on the
  server); `knowledge-search` (MODIFIED: embeddings from the panel or the server, and keyword search without them).
