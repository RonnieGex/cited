/**
 * The words of a headline that carry the highlighter (decision 4 and the addendum of decision 17 of
 * `openspec/changes/brand-identity-ui/design.md`).
 *
 * `tail` is the last `words` words of the text; without a count it is the last three when the text has six or more
 * words and all of it otherwise, so a short greeting is painted whole and a long headline keeps its lead in plain ink.
 * `lead` is everything before the tail with its trailing space, so that `lead + tail` is the text without its trailing
 * whitespace. Only an empty text (or one made of spaces) has an empty tail.
 */
export function highlightLast(text: string, words?: number): { lead: string; tail: string } {
  const spans = [...text.matchAll(/\S+/g)];

  if (spans.length === 0) {
    return { lead: "", tail: "" };
  }

  const wanted = words === undefined || !Number.isFinite(words) || words < 1 ? undefined : Math.floor(words);
  const count = Math.min(wanted ?? (spans.length >= 6 ? 3 : spans.length), spans.length);
  const first = spans[spans.length - count];
  const last = spans[spans.length - 1];
  const start = first?.index ?? 0;
  const end = (last?.index ?? 0) + (last?.[0].length ?? 0);

  return { lead: text.slice(0, start), tail: text.slice(start, end) };
}
