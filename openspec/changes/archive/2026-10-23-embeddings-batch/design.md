# A configurable embeddings request size

## Decisions

1. **One function, two callers.** `resolveEmbeddingsBatch(environment = process.env)` lives in
   `lib/embeddings/batch.ts`, next to the provider interface, and both `embedAll` functions call it. The number is
   not duplicated again and the rule of a bad value is written once.
2. **The same rule as the other limits.** The value is accepted only when `Number(value)` is a positive integer,
   exactly as `positive()` does in `lib/guards/limits.ts`; anything else is the default `32`. The rule is copied, not
   imported: `lib/guards/limits.ts` is about the public endpoint and `lib/embeddings/` must not depend on it.
3. **Read at the moment of embedding, not at module load.** The local patch read the variable once when the module
   loaded. Reading it inside `embedAll` costs nothing measurable, makes the behavior testable without re-importing
   modules, and matches how `resolveLimits` is read per request. Every request of one `embedAll` call uses the same
   number, read once at the start of that call.
4. **No upper bound.** A provider that accepts more than 32 texts per request may be given a larger number; the
   provider answers with its own error when the number is too large, and the ingestion reports it as today. The
   variable changes only how many texts travel together, never the vectors: the texts are sliced in order and the
   vectors come back in the same order, so each passage keeps its own vector.
5. **No name leaks.** The function reads `EMBEDDINGS_BATCH` and prints nothing. A bad value is silently the default,
   as with the other limits; the documentation says so.

## Decisions taken by the implementer

- The variable is named `EMBEDDINGS_BATCH`, in the family of `EMBEDDINGS_PROVIDER`, `EMBEDDINGS_MODEL` and
  `EMBEDDINGS_DIMENSIONS`, and sits with them in `.env.example` and in the configuration table of the README.
- The README row says "32 by default" and names 16 as the example of a smaller provider, because that is the limit of
  the service that motivated the change.

## Validation

A new test file proves the rule of the value (default, valid, every invalid class) and the behavior of both paths with
a recording provider: the ingestion and the re-index of a 40-passage document send requests of at most the configured
number, in order, and the texts received equal the passages in order. Types, lint, the unit suite and the strict
OpenSpec validation run locally; build, end to end, audit and secret scan run in the pull-request pipeline and are
recorded from it. The manual check is the ingestion command of the README with the variable set to `4` and to a bad
value, against a temporary store.
