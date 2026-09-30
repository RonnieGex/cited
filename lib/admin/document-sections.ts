import type { StoredPassage } from "../store/types.ts";

// Decision 5 of `openspec/changes/guided-setup-and-knowledge/design.md`: a document opens as a page with its passages
// grouped under their headings in reading order. The ingestion keeps the heading of every passage, so the page shows
// what the system understood and never re-reads the file: the order is the position the store wrote.

export type DocumentSection = {
  heading: string | null;
  passages: StoredPassage[];
};

export function documentSections(passages: StoredPassage[]): DocumentSection[] {
  const sections: DocumentSection[] = [];

  for (const passage of passages) {
    const last = sections.at(-1);

    // Only a titled run joins the section before it: the passages without a heading are a section of their own, so a
    // page never shows a heading over a passage that has none. The order of the store is the reading order and it is
    // kept: the sections come out as they were written.
    if (last !== undefined && passage.heading !== null && last.heading === passage.heading) {
      last.passages.push(passage);
      continue;
    }

    sections.push({ heading: passage.heading, passages: [passage] });
  }

  return sections;
}
