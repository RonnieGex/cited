import type { SearchHit } from "../search/index.ts";
import type { Citation } from "./types.ts";

const markerPattern = /\[(\d{1,4})\]/g;

export type ParsedAnswer = { answer: string; citations: Citation[] };

export function extractCitations(rawAnswer: string, hits: SearchHit[]): ParsedAnswer {
  const order: number[] = [];
  const renumbered = rawAnswer.replace(markerPattern, (_whole, digits: string) => {
    const index = Number(digits);

    if (Number.isInteger(index) === false || index < 1 || index > hits.length) {
      return "";
    }

    let position = order.indexOf(index);

    if (position === -1) {
      order.push(index);
      position = order.length - 1;
    }

    return `[${position + 1}]`;
  });

  const citations = order.flatMap((index, position): Citation[] => {
    const hit = hits[index - 1];

    if (hit === undefined) {
      return [];
    }

    return [
      {
        n: position + 1,
        document: hit.name,
        heading: hit.heading,
        position: hit.position,
        excerpt: hit.text,
      },
    ];
  });

  return {
    answer: renumbered.replace(/[ \t]{2,}/g, " ").replace(/ +([.,;:!?])/g, "$1").trim(),
    citations,
  };
}
