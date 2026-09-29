## Why

Cited finds the passages that answer a question, but it does not answer yet: the README has to say "not ready" and
mark the answer as `Next`. Franc asked on 2026-09-29 to build the product instead of announcing it. The answer with
citations is the heart of Cited and the base of the next changes: the public page and the widget ask it, and the
ElevenLabs voice agent calls it as its tool. This is change 3 of the plan (`tasks/plan-rag-abierto.md`, section 7).

## What Changes

- **`POST /api/ask`** answers a question from the business's own documents: hybrid search, then one call to the chat
  model with the numbered passages, and a JSON response with the answer and its citations (document, heading,
  position, excerpt). The model may only answer from the passages and must cite them as `[n]`; an answer with no valid
  citation, or the model's `NO_ANSWER`, becomes a polite refusal. A search with no passage refuses without calling the
  model.
- **Any provider, chosen by variables**: OpenAI, Anthropic, Gemini, DeepSeek, Groq, OpenRouter, Ollama, LM Studio, and a
  deterministic `fake` for tests and for a first run without keys, through the Vercel AI SDK. A missing key answers
  `503` naming the variable, never its value.
- **The owner's wallet is protected**: a question of at most `MAX_QUESTION_CHARS`, `RATE_LIMIT_PER_IP_PER_HOUR` per IP
  (the IP stored only as a salted hash), `DAILY_MODEL_CALL_LIMIT` model calls per UTC day, and `MAX_ANSWER_TOKENS` per
  answer, with defaults that are safe for a small business.
- **Short conversations**: an optional `sessionId` keeps the last turns so a follow-up works; conversations are purged
  after `CONVERSATION_RETENTION_DAYS`.
- **Guards against prompt injection**: the documents are data, never instructions; the system prompt says so and a test
  proves that an instruction planted in a document is not obeyed by the deterministic provider's contract.
- **`npm run ask -- "<question>"`** for owners and for the tests.
- The README and its graphics move the answer from `Next` to `Available`, with a real demo of `npm run ask` on the
  sample corpus.

## Impact

- New: `lib/answer/` (prompt, citations, refusal), `lib/models/` (providers), `lib/guards/` (limits and counters),
  `app/api/ask/route.ts`, `scripts/ask.ts`, tests, `docs/answering.md`.
- Changed: `lib/store/` (tables for counters and conversations), `package.json` (the AI SDK and its providers),
  `.env.example` (`CHAT_PROVIDER` and the defaults), the README, its Spanish twin, the graphics and their records.
