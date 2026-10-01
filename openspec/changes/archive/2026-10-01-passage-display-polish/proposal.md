## Why

Capturing Cited for its landing page on 2026-09-30 showed that a cited passage does not read like the document it came
from, on the public page, in the widget and in the owner's Try it panel. The art review of the landing holds the page
at 9.4 because of it: the proof image reads "Café La Horquilla Somos un café…", which looks like a bug. Six defects:

1. The heading of a section runs into the passage ("Bookings and cancellations A repair booking is free…").
2. A list is flattened into one paragraph joined by " - ".
3. The highlight covers more than the passage says: the heading, the words the passage repeats from the passage before
   it (the overlap of the chunker), and, in Try it, a band that starts partway up the first line.
4. Beside a cited passage, Try it and the document page show the passage's position ("0", "2") where the citation's
   number ([1]) belongs.
5. The suggestions of the Spanish panel come from English documents ("¿Qué dicen los documentos sobre Bike workshop
   policies at Café La Horquilla?").
6. The Spanish panel says "la alta guiada"; it is "la configuración guiada", as the Spanish README already says.

A seventh finding of the same capture, the keyword search not joining Spanish word forms ("abren" and "abrimos"), is a
change to retrieval and is planned with the work of next week, not here.

## What Changes

- A passage is shown as its document says it: its heading once, above it; its lists as lists; the words it repeats
  from the passage before it as context, outside the highlight; the highlight from its first own word, line by line.
- The chunker keeps the lines of a list, so a list survives into the passage text.
- Every view of a cited passage shows the citation's number; a passage that no answer cited shows none.
- The suggestions of the panel come first from the documents written in the panel's language.
- One Spanish name for the guided setup: "configuración guiada".

## Impact

- Ingestion: `lib/ingest/chunk.ts` (the lines of a list). Search, embeddings and the store schema do not change; the
  passages of an installation keep their old text until their file is uploaded again.
- Answering: each citation of `POST /api/ask` gains `lead`, the number of characters at the start of `excerpt` that
  repeat the passage before it (0 when none). A field is added; none is removed or renamed.
- Interface: `components/chat/CitationPanel.tsx` (public page and widget), `components/setup/TryItPanel.tsx`,
  `components/setup/DocumentPanel.tsx`, one shared view of a passage, and `lib/admin/questions.ts`.
- Copy: `lib/i18n/admin.ts`, `README.es.md`, `docs/owner-guide.md`.
- Specs: deltas of `public-chat`, `owner-setup`, `knowledge-search`, `answering` and `admin-panel`.
