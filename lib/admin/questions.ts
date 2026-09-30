import type { Lang } from "../settings/business.ts";
import type { Store } from "../store/index.ts";

// Decision 6 of `openspec/changes/guided-setup-and-knowledge/design.md`: up to four suggested questions built from the
// headings of the documents, with no model call: the store already holds the heading of every passage and this only
// wraps it in a question. The headings repeat across documents, so the answer is deduplicated and the order is the one
// the store lists the passages in.

export const SUGGESTED_QUESTIONS = 4;

const templates: Record<Lang, (heading: string) => string> = {
  en: (heading) => `What do the documents say about ${heading}?`,
  es: (heading) => `¿Qué dicen los documentos sobre ${heading}?`,
};

export async function suggestedQuestions(store: Store, lang: Lang): Promise<string[]> {
  const passages = await store.getPassages({ limit: 200 });
  const seen = new Set<string>();
  const questions: string[] = [];

  for (const passage of passages) {
    const heading = passage.heading?.trim() ?? "";

    if (heading.length === 0) {
      continue;
    }

    const key = heading.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    questions.push(templates[lang](heading));

    if (questions.length === SUGGESTED_QUESTIONS) {
      break;
    }
  }

  return questions;
}
