import { DEFAULT_CHAT_MODELS } from "../models/types.ts";
// Decision 6 of `openspec/changes/provider-keys-in-panel/design.md`: the honest catalogue of the providers, bilingual,
// with one line on cost and speed and where each one processes the data, whether it offers meaning search, its default
// models and the link to get a key. No logo, no "partner" and no "recommended" wording: the names are text.
//
// No affiliate URL is committed until Franc joins a programme, so `affiliateUrl` is empty everywhere in this change and
// `signupLink` answers the plain link. The mechanism is the one that will carry the link of ElevenLabs for the voice in
// the next changes, and `AFFILIATE_LINKS=off` turns it off in one option for whoever forks the project.

export const AFFILIATE_LINKS_VARIABLE = "AFFILIATE_LINKS";
export const HOSTED_OFFER_VARIABLE = "HOSTED_OFFER_URL";

export type CatalogueLang = "en" | "es";
export type CatalogueKind = "chat" | "embeddings";

export type ProviderEntry = {
  id: string;
  kind: CatalogueKind;
  name: string;
  cost: Record<CatalogueLang, string>;
  processing: Record<CatalogueLang, string>;
  embeddings: boolean;
  chatModel: string;
  embeddingsModel: string | null;
  baseUrl: string;
  embeddingsBaseUrl: string;
  signupUrl: string;
  affiliateUrl: string | null;
};

export type CatalogueEnvironment = Record<string, string | undefined>;

function base(environment: CatalogueEnvironment, variable: string, fallback: string): string {
  return (environment[variable]?.trim() ?? "").replace(/\/+$/, "") || fallback;
}

function withoutSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function chatCatalogue(environment: CatalogueEnvironment = process.env): ProviderEntry[] {
  const openai = base(environment, "OPENAI_BASE_URL", "https://api.openai.com/v1");
  const anthropic = base(environment, "ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1");
  const gemini = base(environment, "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta");
  const deepseek = base(environment, "DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1");
  const groq = base(environment, "GROQ_BASE_URL", "https://api.groq.com/openai/v1");
  const openrouter = base(environment, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1");
  const ollama = base(environment, "OLLAMA_BASE_URL", "http://localhost:11434/v1");
  const lmstudio = base(environment, "LMSTUDIO_BASE_URL", "http://localhost:1234/v1");

  return [
    {
      id: "deepseek",
      kind: "chat",
      name: "DeepSeek",
      cost: {
        en: "Paid per use and one of the cheapest, answers quickly",
        es: "De pago por uso y de los más baratos, responde rápido",
      },
      processing: { en: "China", es: "China" },
      embeddings: false,
      chatModel: DEFAULT_CHAT_MODELS.deepseek,
      embeddingsModel: null,
      baseUrl: deepseek,
      embeddingsBaseUrl: deepseek,
      signupUrl: "https://platform.deepseek.com",
      affiliateUrl: null,
    },
    {
      id: "openai",
      kind: "chat",
      name: "OpenAI",
      cost: {
        en: "Paid per use, fast and the best documented",
        es: "De pago por uso, rápido y el mejor documentado",
      },
      processing: { en: "United States", es: "Estados Unidos" },
      embeddings: true,
      chatModel: DEFAULT_CHAT_MODELS.openai,
      embeddingsModel: "text-embedding-3-small",
      baseUrl: openai,
      embeddingsBaseUrl: openai,
      signupUrl: "https://platform.openai.com/api-keys",
      affiliateUrl: null,
    },
    {
      id: "anthropic",
      kind: "chat",
      name: "Anthropic",
      cost: {
        en: "Paid per use, careful answers, moderate speed",
        es: "De pago por uso, respuestas cuidadas, rapidez media",
      },
      processing: { en: "United States", es: "Estados Unidos" },
      embeddings: false,
      chatModel: DEFAULT_CHAT_MODELS.anthropic,
      embeddingsModel: null,
      baseUrl: anthropic,
      embeddingsBaseUrl: anthropic,
      signupUrl: "https://console.anthropic.com/settings/keys",
      affiliateUrl: null,
    },
    {
      id: "gemini",
      kind: "chat",
      name: "Google Gemini",
      cost: {
        en: "Free tier and paid plans, very fast",
        es: "Nivel gratuito y planes de pago, muy rápido",
      },
      processing: { en: "United States", es: "Estados Unidos" },
      embeddings: true,
      chatModel: DEFAULT_CHAT_MODELS.gemini,
      embeddingsModel: "gemini-embedding-001",
      baseUrl: gemini,
      embeddingsBaseUrl: `${gemini}/openai`,
      signupUrl: "https://aistudio.google.com/app/apikey",
      affiliateUrl: null,
    },
    {
      id: "groq",
      kind: "chat",
      name: "Groq",
      cost: {
        en: "Paid per use, the fastest of the list",
        es: "De pago por uso, el más rápido de la lista",
      },
      processing: { en: "United States", es: "Estados Unidos" },
      embeddings: false,
      chatModel: DEFAULT_CHAT_MODELS.groq,
      embeddingsModel: null,
      baseUrl: groq,
      embeddingsBaseUrl: groq,
      signupUrl: "https://console.groq.com/keys",
      affiliateUrl: null,
    },
    {
      id: "openrouter",
      kind: "chat",
      name: "OpenRouter",
      cost: {
        en: "One key for many models, paid per use",
        es: "Una llave para muchos modelos, de pago por uso",
      },
      processing: {
        en: "United States, and it forwards to each model's provider",
        es: "Estados Unidos, y reenvía al proveedor de cada modelo",
      },
      embeddings: false,
      chatModel: DEFAULT_CHAT_MODELS.openrouter,
      embeddingsModel: null,
      baseUrl: openrouter,
      embeddingsBaseUrl: openrouter,
      signupUrl: "https://openrouter.ai/keys",
      affiliateUrl: null,
    },
    {
      id: "ollama",
      kind: "chat",
      name: "Ollama",
      cost: {
        en: "Free, as fast as your own computer",
        es: "Gratis, tan rápido como tu propio ordenador",
      },
      processing: { en: "Your own computer", es: "Tu propio ordenador" },
      embeddings: true,
      chatModel: DEFAULT_CHAT_MODELS.ollama,
      embeddingsModel: "nomic-embed-text",
      baseUrl: ollama,
      embeddingsBaseUrl: withoutSlash(base(environment, "OLLAMA_BASE_URL", "http://localhost:11434").replace(/\/v1$/, "")),
      signupUrl: "https://ollama.com/download",
      affiliateUrl: null,
    },
    {
      id: "lmstudio",
      kind: "chat",
      name: "LM Studio",
      cost: {
        en: "Free, as fast as your own computer",
        es: "Gratis, tan rápido como tu propio ordenador",
      },
      processing: { en: "Your own computer", es: "Tu propio ordenador" },
      embeddings: false,
      chatModel: DEFAULT_CHAT_MODELS.lmstudio,
      embeddingsModel: null,
      baseUrl: lmstudio,
      embeddingsBaseUrl: lmstudio,
      signupUrl: "https://lmstudio.ai",
      affiliateUrl: null,
    },
  ];
}

export function embeddingsCatalogue(
  environment: CatalogueEnvironment = process.env,
): ProviderEntry[] {
  const chat = chatCatalogue(environment);

  return chat.filter(
    (entry) => entry.embeddings && entry.embeddingsModel !== null && entry.id !== "fake",
  );
}

export function providerEntry(
  id: string,
  kind: CatalogueKind,
  environment: CatalogueEnvironment = process.env,
): ProviderEntry | null {
  const found = (kind === "chat" ? chatCatalogue(environment) : embeddingsCatalogue(environment)).find(
    (entry) => entry.id === id,
  );

  return found ?? null;
}

export function affiliateLinks(environment: CatalogueEnvironment = process.env): boolean {
  return environment[AFFILIATE_LINKS_VARIABLE]?.trim().toLowerCase() !== "off";
}

export function hostedOfferOf(environment: CatalogueEnvironment = process.env): string {
  return environment[HOSTED_OFFER_VARIABLE]?.trim() ?? "";
}

export function signupLink(
  entry: ProviderEntry,
  options: { affiliateLinks: boolean },
): { href: string; paid: boolean } {
  const affiliate = entry.affiliateUrl?.trim() ?? "";

  return affiliate.length > 0 && options.affiliateLinks
    ? { href: affiliate, paid: true }
    : { href: entry.signupUrl, paid: false };
}
