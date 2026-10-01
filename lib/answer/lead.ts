import type { Store } from "../store/index.ts";
import type { Citation } from "./types.ts";

// Decision 4 of `openspec/changes/passage-display-polish/design.md`: a citation says where its own words start. The
// chunker repeats up to 120 characters of the passage before it at the start of the next one, and every view shows
// those words as context, outside the highlighter. `extractCitations` stays pure; this is the separate step that reads
// the passage at `position - 1` of the same document and gives every citation its `lead`.

export const LEAD_LIMIT = 120;

/**
 * The length of the longest prefix of `text`, at most `LEAD_LIMIT` characters and followed by a whitespace in the
 * excerpt, that is also a suffix of the text of the passage before it; 0 when there is no passage before it and 0 when
 * the two share no such prefix.
 */
export function leadLength(previous: string | null | undefined, text: string): number {
  if (previous === null || previous === undefined || previous.length === 0) {
    return 0;
  }

  const limit = Math.min(text.length, previous.length, LEAD_LIMIT);
  let length = 0;

  for (let size = 1; size <= limit; size += 1) {
    // The prefix is followed by a whitespace in the excerpt, or the excerpt ends with it: a prefix that would cut a
    // word in half is not a run of words, and the run of the excerpt is the longest one the passage before it ends
    // with.
    const next = text[size];

    if (next !== undefined && next.trim() !== "") {
      continue;
    }

    if (previous.endsWith(text.slice(0, size))) {
      length = size;
    }
  }

  return length;
}
/**
 * The lead of the passage at `position` of `document`: the text of the passage before it in the store. A passage that
 * is the first of its document has none, and a document the store does not hold either.
 */
export async function leadOf(
  store: Store,
  document: string,
  position: number,
  text: string,
): Promise<number> {
  if (position <= 0) {
    return 0;
  }

  const passages = await store.getPassages({ name: document });
  const previous = passages.find((passage) => passage.position === position - 1);

  return leadLength(previous?.text, text);
}

/**
 * The citations of an answer, each one with its `lead`: the text of the passage at `position - 1` of the same
 * document, read from the store. It runs as a step of its own after `extractCitations`, which stays pure. Every other
 * field of a citation stays as it was written.
 */
export async function citationsWithLeadFromStore(
  store: Store,
  citations: Citation[],
): Promise<Citation[]> {
  const previousOf = new Map<string, string>();
  const wanted = new Map<string, number>();

  for (const citation of citations) {
    if (citation.position > 0) {
      wanted.set(citation.document, Math.min(wanted.get(citation.document) ?? citation.position, citation.position));
    }
  }

  for (const document of wanted.keys()) {
    const positions = await store.getPassages({ name: document, limit: 1000 });

    for (const passage of positions) {
      previousOf.set(`${document}\u0000${passage.position}`, passage.text);
    }
  }

  return citations.map((citation) => ({
    ...citation,
    lead: leadLength(previousOf.get(`${citation.document}\u0000${citation.position - 1}`), citation.excerpt),
  }));
}

/**
 * The same step when the passages are already at hand (`Try it` and the document page hold the whole document): every
 * citation takes its lead from the passage before it in the list the store gave.
 */
export function citationsWithLeadFromPassages(
  citations: Citation[],
  passages: Array<{ name: string; position: number; text: string }>,
): Citation[] {
  const previousOf = new Map<string, string>();

  for (const passage of passages) {
    previousOf.set(`${passage.name}\u0000${passage.position}`, passage.text);
  }

  return citations.map((citation) => ({
    ...citation,
    lead: leadLength(previousOf.get(`${citation.document}\u0000${citation.position - 1}`), citation.excerpt),
  }));
}
