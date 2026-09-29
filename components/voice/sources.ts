/**
 * The sources the agent reports through the client tool `mostrar_fuentes`. Pure validator: only pages of this site
 * survive, so a citation the agent invented can never become a link to somebody else's page. It is a port of
 * `components/voice/sources.ts` of Construye (MIT, read only), adapted to a server tool that answers relative URLs:
 * the playbook records that an agent hands back exactly what a webhook tool returned, so a relative URL is resolved
 * against the origin of the page and a cross-origin one is somebody else's page.
 */

export interface VoiceSource {
  titulo: string;
  url: string;
}

export interface SourcesResult {
  fuentes: VoiceSource[];
  descartadas: number;
}

export const MAX_SOURCES = 6;
export const MAX_TITLE_LENGTH = 120;
/**
 * A chip has one line: past this length the label keeps its beginning and is closed with an ellipsis, at a word
 * boundary when the prefix has one.
 */
export const MAX_SOURCE_LABEL_LENGTH = 80;
/** The separator of `cafe-la-horquilla.md · Precios`, which is how the server tool names a source. */
export const LABEL_SEPARATOR = " · ";
export const SOURCES_TOOL = "mostrar_fuentes";
/** The anchor of a citation of the page (`/#cita-2`): it names the position of the source, not a section of a document. */
export const CITATION_ANCHOR = /^cita-\d+$/i;
/**
 * `//host/...` and `\\host\...` take their scheme from the page, so the URL parser would turn them into a URL of this
 * site and hide where they came from. They are dropped before anything else.
 */
const PROTOCOL_RELATIVE = /^[\\/]{2}/;

function readList(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const fuentes = (payload as { fuentes?: unknown }).fuentes;

    if (Array.isArray(fuentes)) {
      return fuentes;
    }
  }

  return null;
}

function normalise(item: unknown, origin: string): VoiceSource | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const { titulo, url } = item as { titulo?: unknown; url?: unknown };

  if (typeof titulo !== "string" || typeof url !== "string") {
    return null;
  }

  const title = titulo.trim();

  if (title === "" || title.length > MAX_TITLE_LENGTH) {
    return null;
  }

  const raw = url.trim();

  if (raw === "" || PROTOCOL_RELATIVE.test(raw)) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(raw, origin);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  if (parsed.origin !== origin) {
    return null;
  }

  return { titulo: title, url: parsed.toString() };
}

/** Validates one payload of the tool: `{ fuentes: [{ titulo, url }] }` (a bare list is tolerated). */
export function validateSources(payload: unknown, origin: string): SourcesResult {
  const list = readList(payload);

  if (!list) {
    return { fuentes: [], descartadas: 0 };
  }

  const fuentes: VoiceSource[] = [];
  const seen = new Set<string>();
  let descartadas = 0;

  for (const item of list) {
    const source = normalise(item, origin);

    if (!source || seen.has(source.url) || fuentes.length >= MAX_SOURCES) {
      descartadas += 1;
      continue;
    }

    seen.add(source.url);
    fuentes.push(source);
  }

  return { fuentes, descartadas };
}

/**
 * The internal path of a validated source, which is what the chip links to. The query and the anchor survive: a
 * citation names its position on the page (`/#cita-2`) and the chip has to land on it.
 */
export function sourcePath(url: string): string {
  try {
    const parsed = new URL(url);

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

/** What the agent receives back from the tool. */
export function sourcesAnswer(result: SourcesResult): string {
  return `Mostradas: ${result.fuentes.length}. Descartadas: ${result.descartadas}.`;
}

/**
 * The section of a document from the anchor of its URL, as an agent may cite it (`#la-regla-de-las-dos-bolsas`):
 * percent-decoded, hyphens as spaces and the first letter in upper case. `null` when the URL carries no anchor or when
 * the anchor is the position of a citation and not the name of a section.
 */
export function sourceSection(url: string): string | null {
  let hash: string;

  try {
    // A relative URL is resolved against a placeholder: only its anchor is read here, and the validator has already
    // checked that a validated source belongs to the origin of the page.
    hash = new URL(url, "http://localhost").hash;
  } catch {
    return null;
  }

  if (hash === "") {
    return null;
  }

  let text: string;

  try {
    text = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }

  if (CITATION_ANCHOR.test(text.trim())) {
    return null;
  }

  const words = text.replace(/-+/g, " ").replace(/\s+/g, " ").trim();

  if (words === "") {
    return null;
  }

  // La primera letra en mayúscula, no el primer carácter: `¿cuánto guardar?` se lee `¿Cuánto guardar?`.
  return words.replace(/\p{L}/u, (letter) => letter.toUpperCase());
}

function capLabel(label: string): string {
  if (label.length <= MAX_SOURCE_LABEL_LENGTH) {
    return label;
  }

  const cut = label.slice(0, MAX_SOURCE_LABEL_LENGTH - 1);
  const boundary = cut.lastIndexOf(" ");
  const head = boundary > 0 ? cut.slice(0, boundary) : cut;

  return `${head.trimEnd()}…`;
}

/**
 * What a chip says: the document and the section the tool reported. When the title carries no section and the URL
 * names one, the anchor names the chip, so two sections of one document never look like the same chip.
 */
export function sourceLabel(source: VoiceSource): string {
  if (source.titulo.includes(LABEL_SEPARATOR)) {
    return capLabel(source.titulo);
  }

  const section = sourceSection(source.url);

  if (section === null) {
    return capLabel(source.titulo);
  }

  return capLabel(`${source.titulo}${LABEL_SEPARATOR}${section}`);
}
