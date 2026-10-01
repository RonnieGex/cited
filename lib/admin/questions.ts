import { detectLanguage } from "../answer/language.ts";
import type { Lang } from "../settings/business.ts";
import type { Store } from "../store/index.ts";

// Decision 6 of `openspec/changes/guided-setup-and-knowledge/design.md`: up to four suggested questions built from the
// headings of the documents, with no model call: the store already holds the heading of every passage and this only
// wraps it in a question. The headings repeat across documents, so the answer is deduplicated.
//
// Decision 7 of `openspec/changes/passage-display-polish/design.md`: the suggestions come first from the documents
// written in the language of the panel. The language of a document is `detectLanguage` of the text of its first
// passages (up to 2,000 characters), computed when the suggestions are built; nothing new is stored.

export const SUGGESTED_QUESTIONS = 4;

/** How much of a document the detector reads to tell its language: the first passages, up to 2,000 characters. */
export const LANGUAGE_SAMPLE_CHARS = 2000;

const templates: Record<Lang, (heading: string) => string> = {
  en: (heading) => `What do the documents say about ${heading}?`,
  es: (heading) => `¿Qué dicen los documentos sobre ${heading}?`,
};

type DocumentHeadings = {
  name: string;
  headings: string[];
};

/** The headings of every document the store holds, in the order the store lists them and without a repeat. */
async function headingsByDocument(store: Store): Promise<DocumentHeadings[]> {
  const passages = await store.getPassages({ limit: 200 });
  const documents: DocumentHeadings[] = [];

  for (const passage of passages) {
    const heading = passage.heading?.trim() ?? "";

    if (heading.length === 0) {
      continue;
    }

    const last = documents.at(-1);

    if (last !== undefined && last.name === passage.name) {
      if (last.headings.some((one) => one.toLowerCase() === heading.toLowerCase()) === false) {
        last.headings.push(heading);
      }

      continue;
    }

    documents.push({ name: passage.name, headings: [heading] });
  }

  return documents;
}

/** Whether the document speaks the language of the panel, as the detector of the answers reads its first passages. */
async function speaks(store: Store, name: string, lang: Lang): Promise<boolean> {
  const passages = await store.getPassages({ name, limit: 200 });
  let text = "";

  for (const passage of passages) {
    text += `${passage.text} `;

    if (text.length >= LANGUAGE_SAMPLE_CHARS) {
      break;
    }
  }

  return detectLanguage(text.trim()) === lang;
}

export async function suggestedQuestions(store: Store, lang: Lang): Promise<string[]> {
  const documents = await headingsByDocument(store);
  const same: DocumentHeadings[] = [];
  const other: DocumentHeadings[] = [];

  for (const document of documents) {
    (await speaks(store, document.name, lang) ? same : other).push(document);
  }

  const seen = new Set<string>();
  const questions: string[] = [];

  for (const document of [...same, ...other]) {
    for (const heading of document.headings) {
      const key = heading.toLowerCase();

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      questions.push(templates[lang](heading));

      if (questions.length === SUGGESTED_QUESTIONS) {
        return questions;
      }
    }
  }

  return questions;
}
