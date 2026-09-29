## Decisions

1. **Encryption.** `lib/secrets/` encrypts with AES-256-GCM (Node `crypto`), a fresh 12-byte nonce per value, the
   32-byte key decoded from `ENCRYPTION_KEY` (base64); the stored value is `v1:<nonce>:<ciphertext>:<tag>`. Without a
   valid `ENCRYPTION_KEY` the panel stores no key and says why in plain words; nothing falls back to plaintext.
2. **Table** `provider_settings(kind TEXT PRIMARY KEY CHECK (kind IN ('chat','embeddings')), provider TEXT NOT NULL,
   model TEXT, key_ciphertext TEXT, key_last4 TEXT, base_url TEXT, mode TEXT, tested_at TEXT, test_latency_ms INTEGER,
   updated_at TEXT)`; `mode` is `keyword` for keyword search. The voice key joins in a later change.
3. **Resolver** `lib/settings/providers.ts`: `resolveChat()` and `resolveEmbeddings()` return the provider, model, key
   and source (`server`, `panel` or `none`). A value from the server environment wins (today's variables keep working
   unchanged); the panel's value comes next. The answer pipeline and the ingestion call only the resolver.
4. **Test before save.** `POST /api/admin/providers/test` takes `{ kind, provider, key, model?, baseUrl? }`, makes one
   minimal call (chat: a five-token reply; embeddings: one short text) with a 10-second timeout, and answers
   `{ ok, model, latencyMs }` or `{ ok: false, reason }` with `reason` one of `rejected_key`, `no_credit`,
   `rate_limited`, `model_not_found`, `unreachable`, `timeout`; the raw provider error never reaches the browser.
   `POST /api/admin/providers/save` repeats the test and saves only when it passes. `DELETE` removes a panel value.
   All three require the admin session and the `Origin` check, and share a limit of 20 tests per hour.
5. **Embeddings rule.** OpenAI, Gemini (through its OpenAI-compatible endpoint) and Ollama offer embeddings: the same
   key and a default embeddings model are proposed. DeepSeek, Anthropic, Groq and OpenRouter do not: the page offers a
   second key (OpenAI or Gemini) or keyword search. Keyword search makes the search use FTS5 alone and skips embeddings
   at ingestion. Changing the embeddings provider, model or mode marks the documents for re-indexing; the page says
   how many and offers "Re-index now", which re-embeds every passage (the documents are not stored, the passages are).
6. **Catalogue** `lib/providers/catalog.ts`, bilingual: id, name, one line on cost and speed, where it processes data
   (for example DeepSeek: China; OpenAI and Anthropic: United States; Ollama: your own computer), whether it offers
   embeddings, default chat and embeddings models (the current defaults of `answering`), `signupUrl`, optional
   `affiliateUrl`. When `affiliateUrl` is set and `AFFILIATE_LINKS` is not `off`, the link uses it and shows
   "(paid link)" / "(enlace pagado)" right next to it; otherwise the plain link and no label. No affiliate URL is
   committed until Franc joins a programme: the field stays empty in this change. Provider names are text only: no
   logos, no "partner" or "recommended" wording (DeepSeek terms 5.2 and 5.3).
7. **Hosted offer.** Under the list, "Prefer not to manage keys? Katalis runs it for you" links to `HOSTED_OFFER_URL`
   (empty hides it).
8. **Page "AI and keys"** (`/admin/ai`), built with the kit and `PRODUCT.md`: two sections, "Answers" and "Meaning
   search"; each shows the connected provider (name, model, `••••` and last four, last test and its latency, source)
   or the list to connect one; the key field is a password field with a show toggle; "Test" gives the result in words
   inline, never in a modal; a value set by the server shows "Set by the server" with no edit control. English first,
   Spanish complete. The old setup page becomes "For the installer": read-only, the same groups without the edit
   controls, variable names allowed only there.
9. **Before code**, read the Next.js guides in `node_modules/next/dist/docs/` for route handlers and server actions of
   this version, as `AGENTS.md` requires, and `PRODUCT.md`.
