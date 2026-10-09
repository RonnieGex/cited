// The last door of the server. Requirement "No provider error reaches the browser" of
// `specs/provider-settings/spec.md`: the text of an error raised by a provider or by its SDK never leaves the process.
// The routes answer one of their closed categories, and this module removes, before anything else, whatever is shaped
// like a key. It is the second lock of the same door: `sanitizeOutbound()` when the route already has a category, and
// `describeProviderError()` when all it has is an exception.
//
// Decision of the review `katalis-dev/tasks/revision-community-12.md` (Blocker B-1): an SDK that echoes the key it
// received turns `error.message` into the key itself. Nothing here ever returns a value, and a text with nothing left
// after the redaction becomes the sentence the caller writes, never a fragment of the provider.

const REDACTED = "[redacted]";

// Every shape this repository, its providers and its SDKs use for a secret. `sk-` of OpenAI and DeepSeek, `sk-ant-`
// of Anthropic, `AIza` of Google, `gsk_` of Groq, `sk-or-` of OpenRouter, `hf_` of Hugging Face, the `Bearer` header,
// the `key=` of the query of Gemini, a long base64 or hexadecimal run, and the `v1:` of a sealed value of the store.
const KEY_SHAPES: RegExp[] = [
  /\b(?:sk|rk|pk|gsk|hf|xai)[-_][A-Za-z0-9._-]{6,}/gi,
  /\bAIza[0-9A-Za-z_-]{10,}/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{6,}/gi,
  /\b(?:api[-_]?key|access[-_]?token|key)=([A-Za-z0-9._~%+/-]{8,})/gi,
  /\bv1:[A-Za-z0-9+/=_-]+:[A-Za-z0-9+/=_-]+:[A-Za-z0-9+/=_-]+/g,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g,
  /\b[0-9a-fA-F]{32,}\b/g,
];

export function sanitizeOutbound(text: string): string {
  let clean = text;

  for (const shape of KEY_SHAPES) {
    clean = clean.replace(shape, REDACTED);
  }

  return clean;
}

// A name of a variable of the environment, written as the template writes it: capital letters with at least one
// underscore. `proposal.md` allows it in the body of an API error and in a command-line message — what whoever
// installs reads — and the requirement M-3 of `revision-community-12.md` keeps it out of the pages of the panel and
// out of the route the browser of a visitor talks to. The route of the answers passes every sentence through here.
export const VARIABLE_NAME = /[A-Z][A-Z0-9]*_[A-Z0-9_]+/;

// The same question as `VARIABLE_NAME.test(text)`, answered in one pass. The regular expression backtracks
// quadratically on a long run of capitals with no underscore (CodeQL js/polynomial-redos), and the MCP endpoint lets
// outside text reach `publicMessage()`. A name exists when an underscore that is not the last character of its run of
// `[A-Z0-9_]` follows a capital letter with no underscore in between.
export function containsVariableName(text: string): boolean {
  let capitalSinceUnderscore = false;

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    const capital = code >= 65 && code <= 90;
    const digit = code >= 48 && code <= 57;

    if (code === 95) {
      const next = index + 1 < text.length ? text.charCodeAt(index + 1) : -1;
      const continues = (next >= 65 && next <= 90) || (next >= 48 && next <= 57) || next === 95;

      if (capitalSinceUnderscore && continues) {
        return true;
      }

      capitalSinceUnderscore = false;
    } else if (capital) {
      capitalSinceUnderscore = true;
    } else if (digit === false) {
      capitalSinceUnderscore = false;
    }
  }

  return false;
}

// The text of a message that may leave the server: no shape of a key, no name of a variable, one line, and never
// more than a screenful. An empty answer means the caller writes its own sentence.
export function publicMessage(text: string): string {
  const clean = sanitizeOutbound(text).replace(/\s+/g, " ").trim();

  if (clean.length === 0 || clean === REDACTED || containsVariableName(clean)) {
    return "";
  }

  return clean.slice(0, 300);
}

// The sentence a caller writes from an exception it caught: the same rules as `publicMessage()`, and an empty answer
// means the exception had nothing safe to show — the message was the key itself, or a body of an SDK without words.
export function describeProviderError(error: unknown): string {
  return publicMessage(error instanceof Error ? error.message : "");
}
