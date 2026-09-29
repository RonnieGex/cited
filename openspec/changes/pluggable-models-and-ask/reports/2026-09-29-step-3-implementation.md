# Step 3 - The implementation, in small steps

- Date: 2026-09-29
- Change: `pluggable-models-and-ask`
- Branch: `feature/pluggable-models-and-ask`
- Agent: `deepseek-harness`
- Commit verified against: `c5cab1f` (the red tests)

## 3.1 Providers and their licenses (decision 1)

### The command

```
> npm install ai@^7 @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/deepseek @ai-sdk/groq @ai-sdk/openai-compatible

added 136 packages, removed 1 package, and audited 627 packages in 4s
found 0 vulnerabilities
```

The AI SDK is installed at `7.0.122`, and `generateText` accepts `LanguageModelV3`, which is what the deterministic
provider of the tests implements (`MockLanguageModelV3`, exported by `ai/test`).

### The licenses of the new dependency, checked package by package

Every package of the closure of the seven new dependencies, read from its own `package.json`:

| Package | Version | License |
|---|---|---|
| `ai` | 7.0.122 | Apache-2.0 |
| `@ai-sdk/openai` | 4.0.81 | Apache-2.0 |
| `@ai-sdk/anthropic` | 4.0.68 | Apache-2.0 |
| `@ai-sdk/google` | 4.0.85 | Apache-2.0 |
| `@ai-sdk/deepseek` | 3.0.56 | Apache-2.0 |
| `@ai-sdk/groq` | 4.0.52 | Apache-2.0 |
| `@ai-sdk/openai-compatible` | 3.0.59 | Apache-2.0 |
| `@ai-sdk/gateway` | 4.0.100 | Apache-2.0 |
| `@ai-sdk/provider` | 4.0.19 | Apache-2.0 |
| `@ai-sdk/provider-utils` | 5.0.51 | Apache-2.0 |
| `@vercel/oidc` | 3.2.0 | Apache-2.0 |
| `@workflow/serde` | 4.1.0 | Apache-2.0 |
| `@standard-schema/spec` | 1.1.0 | MIT |
| `eventsource-parser` | 3.1.1 | MIT |
| `undici` | 8.11.2 | MIT |
| `json-schema` | 0.4.0 | (AFL-2.1 OR BSD-3-Clause) |

```
> node --input-type=module   (walks the closure of the seven packages)

closure 16
12      Apache-2.0
3       MIT
1       (AFL-2.1 OR BSD-3-Clause)
--- GPL family ---
(no output)
```

**No new dependency is GPL or AGPL.** The license of the whole installed tree was read as well (464 packages): 376 MIT,
38 Apache-2.0, 16 ISC, 13 BSD-2-Clause, 5 BSD-3-Clause, 3 MPL-2.0, and the rest permissive. Two findings belong to
the base and not to this change, and both are recorded here because the documentation claims no copyleft dependency:

- `jszip@3.10.2` (a dependency of `mammoth`, from the ingestion) is `(MIT OR GPL-3.0-or-later)`: a dual license whose
  MIT option is the one this project uses.
- `@img/sharp-wasm32@0.35.5` and `@img/sharp-win32-x64@0.35.5` (optional prebuilt binaries of `next`) are
  `Apache-2.0 AND LGPL-3.0-or-later`. LGPL-3.0 is not GPL-3.0 nor AGPL-3.0, and the packages are optional binaries of
  the framework that this project does not link against; the fact is written here so that nobody reads the claim of
  "no GPL or AGPL" as more than it is.

### The code

- `lib/models/types.ts`: the nine provider names, the default model of each one, the variables each provider needs,
  `selectedChatProvider` and `chatModelName`.
- `lib/models/providers.ts`: `resolveChatModel(environment)` returns a `LanguageModel` of the AI SDK. OpenAI,
  Anthropic, Gemini, DeepSeek and Groq use their own package; OpenRouter, Ollama and LM Studio use
  `createOpenAICompatible` with their endpoint; `fake` builds the deterministic model. A provider that needs a key
  throws `The <provider> chat provider needs <VARIABLE>.` and never a value.
- `lib/models/fake.ts`: the deterministic model of the tests and of a first run without keys. It reads the passages of
  the prompt, answers with the first sentence of the best-matching passage and its `[n]`, answers `NO_ANSWER` when no
  passage shares a word with the question, and says in its text that it comes from the test provider. `reply` and
  `onCall` let a test script the answer and read the prompt, the `maxOutputTokens` and the temperature that were sent.
- `lib/answer/language.ts`: the small word list that detects Spanish or English, Spanish by default, and the two
  localized refusal messages (design decision 4).

### The red that turns green

```
> npx vitest run tests/models.test.ts

 Test Files  1 passed (1)
      Tests  8 passed (8)
   Duration  1.48s
```

The eight tests cover the nine providers, the missing key of every provider that needs one, the message that carries
no value of the environment, the empty and unknown `CHAT_PROVIDER`, `CHAT_MODEL`, and the two tests that stub `fetch`
with a function that throws and prove that no provider is constructed over the network.

`git status --short` after this step carries `package.json`, `package-lock.json`, `lib/models/` and
`lib/answer/language.ts`.

## Verdict 3.1

PASS. The provider layer exists, its licenses are permissive and recorded, and its tests are green.
