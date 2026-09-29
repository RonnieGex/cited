// The tables of the schema of `lib/store/index.ts`, in the order of the schema, for whoever reads the state of a
// store without opening the application (`scripts/store-state.ts`, tasks 10.6 and 11.4 of the contract of the keys in
// the panel).
//
// This list lives in a module of its own, and not in `lib/store/index.ts`, for one reason: that module imports the
// libSQL client, which creates the file and migrates it, and the reader of the state has to open a store with
// `node:sqlite` and `readOnly: true` — never with the client that writes (the Major M-4 of
// `katalis-dev/tasks/revision-community-12b.md`).
export const storeTables = [
  "documents",
  "passages",
  "passages_fts",
  "rate_limits",
  "model_calls",
  "conversations",
  "login_attempts",
  "business",
  "provider_settings",
  "provider_tests",
  "document_index",
];
