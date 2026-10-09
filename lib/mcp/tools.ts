/**
 * The two tools of the MCP endpoint. `cited_search` ranks the passages of the store with `hybridSearch()` and never
 * builds a chat model; `cited_ask` runs the pipeline of `/api/ask` through `askQuestion()` and keeps its refusal. Both
 * answer the structured content the schema declares beside the numbered text a client model reads.
 */

import type { LanguageModel } from "ai";
import { askQuestion } from "../answer/ask.ts";
import type { Citation } from "../answer/types.ts";
import { embeddingsFrom } from "../embeddings/providers.ts";
import type { EmbeddingProvider } from "../embeddings/types.ts";
import { resolveLimits } from "../guards/limits.ts";
import { describeProviderError, publicMessage } from "../guards/outbound.ts";
import { chatModelFrom } from "../models/providers.ts";
import type { ChatEnvironment } from "../models/types.ts";
import { hybridSearch } from "../search/index.ts";
import {
  chatProblem,
  embeddingsConfigured,
  resolveChat,
  resolveEmbeddings,
} from "../settings/providers.ts";
import type { Store } from "../store/index.ts";
import { sharedStore } from "../store/instance.ts";
import type { JsonSchema } from "./protocol.ts";

export const TOOL_SEARCH = "cited_search";
export const TOOL_ASK = "cited_ask";

export const DEFAULT_SEARCH_LIMIT = 5;
export const MAX_SEARCH_LIMIT = 8;

const NOT_CONNECTED =
  "the AI is not connected yet: the owner connects it in the panel, or whoever installs Cited sets it on the server";
const NO_ANSWER = "the AI could not answer right now";

export type McpToolAnnotations = { readOnlyHint: boolean; openWorldHint: boolean };

export type McpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  annotations: McpToolAnnotations;
};

export type ToolText = { type: "text"; text: string };

export type ToolResult = {
  content: ToolText[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export type ToolOutcome = { kind: "result"; result: ToolResult } | { kind: "invalid"; message: string };

export type ToolContext = { environment?: ChatEnvironment; now?: Date };

const nProperty: JsonSchema = { type: "integer", description: "The number the answer cites, like [1]." };
const documentProperty: JsonSchema = {
  type: "string",
  description: "The name of the document the passage came from.",
};
const headingProperty: JsonSchema = {
  type: ["string", "null"],
  description: "The section of the document, when it has one.",
};
const positionProperty: JsonSchema = {
  type: "integer",
  description: "The position of the passage inside its document.",
};
const excerptProperty: JsonSchema = {
  type: "string",
  description: "The text of the passage, so the answer can be checked.",
};
const leadProperty: JsonSchema = {
  type: "integer",
  description: "How many characters of the excerpt repeat the passage before it.",
};

const citationProperties: Record<string, JsonSchema> = {
  n: nProperty,
  document: documentProperty,
  heading: headingProperty,
  position: positionProperty,
  excerpt: excerptProperty,
  lead: leadProperty,
};

const citationSchema: JsonSchema = {
  type: "object",
  properties: citationProperties,
  required: ["n", "document", "heading", "position", "excerpt", "lead"],
  additionalProperties: false,
};

const searchInputSchema: JsonSchema = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "The words to look for in the documents of the business.",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: MAX_SEARCH_LIMIT,
      default: DEFAULT_SEARCH_LIMIT,
      description: "How many passages to return, between 1 and 8. Five by default.",
    },
  },
  required: ["query"],
  additionalProperties: false,
};

const searchOutputSchema: JsonSchema = {
  type: "object",
  properties: {
    passages: {
      type: "array",
      description: "The passages of the documents that match the query, best first.",
      items: {
        type: "object",
        properties: {
          n: nProperty,
          document: documentProperty,
          heading: headingProperty,
          position: positionProperty,
          excerpt: excerptProperty,
        },
        required: ["n", "document", "heading", "position", "excerpt"],
        additionalProperties: false,
      },
    },
  },
  required: ["passages"],
  additionalProperties: false,
};

const askInputSchema: JsonSchema = {
  type: "object",
  properties: {
    question: {
      type: "string",
      description: "The question to answer from the documents of the business.",
    },
    sessionId: {
      type: "string",
      description: "The same value across a conversation, so a follow-up keeps its thread.",
    },
  },
  required: ["question"],
  additionalProperties: false,
};

const askOutputSchema: JsonSchema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["answered", "refused"] },
    answer: { type: "string", description: "The answer, or the sentence of the refusal." },
    citations: { type: "array", items: citationSchema },
  },
  required: ["status", "answer", "citations"],
  additionalProperties: false,
};

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: TOOL_SEARCH,
    title: "Search the documents of Cited",
    description:
      "Read the passages of the business documents that match a query, with the document, the section, the position and the text of each one. Cite them by their number. This tool never writes an answer and never calls a language model, so it costs nothing.",
    inputSchema: searchInputSchema,
    outputSchema: searchOutputSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: TOOL_ASK,
    title: "Ask the documents of Cited",
    description:
      "Answer a question from the documents of the business, with numbered citations and the passage each one came from. When the documents do not hold the answer, the result says refused instead of inventing it.",
    inputSchema: askInputSchema,
    outputSchema: askOutputSchema,
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

type Arguments = Record<string, unknown>;

type Passage = {
  n: number;
  document: string;
  heading: string | null;
  position: number;
  excerpt: string;
};

function objectArguments(args: unknown): Arguments | null {
  if (typeof args !== "object" || args === null || Array.isArray(args)) {
    return null;
  }

  return args as Arguments;
}

function only(keys: string[], args: Arguments): boolean {
  return Object.keys(args).every((key) => keys.includes(key));
}

function invalid(message: string): ToolOutcome {
  return { kind: "invalid", message };
}

export function toolText(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

export function toolError(text: string): ToolResult {
  return { content: [{ type: "text", text }], isError: true };
}

function result(text: string, structuredContent: Record<string, unknown>): ToolOutcome {
  return { kind: "result", result: { content: [{ type: "text", text }], structuredContent } };
}

function errorOutcome(text: string): ToolOutcome {
  return { kind: "result", result: toolError(text) };
}

function where(document: string, heading: string | null): string {
  const section = heading?.trim() ?? "";

  return section.length === 0 ? document : `${document} · ${section}`;
}

function passageText(passages: Passage[], query: string): string {
  if (passages.length === 0) {
    return `No passage of the documents of this installation matches "${query}".`;
  }

  const lines = passages.map(
    (passage) => `${passage.n}. ${where(passage.document, passage.heading)}\n${passage.excerpt}`,
  );

  return [
    `Cited found ${passages.length} passage(s) for "${query}". Cite each one by its number, like [1].`,
    "",
    ...lines,
  ].join("\n");
}

function answerText(answer: string, citations: Citation[]): string {
  if (citations.length === 0) {
    return answer;
  }

  const sources = citations
    .map((citation) => `${citation.n}. ${where(citation.document, citation.heading)} (position ${citation.position})`)
    .join("\n");

  return `${answer}\n\nSources:\n${sources}`;
}

// The embeddings of the installation when it has them, and the keyword mode of `hybridSearch()` when it does not: a
// search tool that can still return the passage a word appears in is more useful than an error (decision 9).
async function searchEmbeddings(
  store: Store,
  environment: ChatEnvironment,
): Promise<EmbeddingProvider | null> {
  const resolution = await resolveEmbeddings({ environment, store });

  return resolution.mode === "vectors" && embeddingsConfigured(resolution)
    ? embeddingsFrom(resolution)
    : null;
}

async function searchTool(args: Arguments, context: ToolContext): Promise<ToolOutcome> {
  const environment = context.environment ?? process.env;
  const query = typeof args["query"] === "string" ? args["query"].trim() : null;
  const declared = args["limit"];

  if (query === null || query.length === 0) {
    return invalid("the query must be a non-empty string");
  }

  if (
    declared !== undefined &&
    (Number.isInteger(declared) === false ||
      Number(declared) < 1 ||
      Number(declared) > MAX_SEARCH_LIMIT)
  ) {
    return invalid(`the limit must be an integer between 1 and ${MAX_SEARCH_LIMIT}`);
  }

  const limit = declared === undefined ? DEFAULT_SEARCH_LIMIT : Number(declared);
  const limits = resolveLimits(environment);

  if (query.length > limits.maxQuestionChars) {
    return errorOutcome(
      publicMessage(`the query is longer than MAX_QUESTION_CHARS (${limits.maxQuestionChars} characters)`) ||
        "the query is too long",
    );
  }

  try {
    const store = await sharedStore(environment);
    const embeddings = await searchEmbeddings(store, environment);
    const hits = await hybridSearch(query, { store, embeddings, limit });
    const passages: Passage[] = hits.map((hit, index) => ({
      n: index + 1,
      document: hit.name,
      heading: hit.heading,
      position: hit.position,
      excerpt: hit.text,
    }));

    return result(passageText(passages, query), { passages });
  } catch (error) {
    return errorOutcome(
      publicMessage(describeProviderError(error)) ||
        "the documents of this installation cannot be read right now",
    );
  }
}

async function askTool(args: Arguments, context: ToolContext): Promise<ToolOutcome> {
  const environment = context.environment ?? process.env;
  const question = typeof args["question"] === "string" ? args["question"] : "";
  const declaredSession = args["sessionId"];

  if (question.trim().length === 0) {
    return invalid("the question must be a non-empty string");
  }

  if (declaredSession !== undefined && typeof declaredSession !== "string") {
    return invalid("the sessionId must be a string");
  }

  try {
    const store = await sharedStore(environment);
    const chat = await resolveChat({ environment, store });

    if (chat.provider === null || chatProblem(chat) !== null) {
      return errorOutcome(NOT_CONNECTED);
    }

    const embeddings = await searchEmbeddings(store, environment);
    const model: LanguageModel = chatModelFrom({
      provider: chat.provider,
      model: chat.model,
      key: chat.key,
      baseUrl: chat.baseUrl,
      ...(chat.fetch === undefined ? {} : { fetch: chat.fetch }),
    });
    let outcome;

    try {
      outcome = await askQuestion({
        question,
        ...(declaredSession === undefined ? {} : { sessionId: declaredSession }),
        store,
        embeddings,
        model,
        environment,
        // The endpoint counts its own limit per token, so the address of the public route is not used (decision 6).
        ip: "",
        quota: "external",
        ...(context.now === undefined ? {} : { now: context.now }),
      });
    } catch {
      return errorOutcome(NO_ANSWER);
    }

    if (outcome.status === "answered") {
      return result(answerText(outcome.answer, outcome.citations), {
        status: "answered",
        answer: outcome.answer,
        citations: outcome.citations,
      });
    }

    if (outcome.status === "refused") {
      return result(answerText(outcome.answer, []), {
        status: "refused",
        answer: outcome.answer,
        citations: [],
      });
    }

    if (outcome.status === "invalid") {
      return errorOutcome(publicMessage(outcome.message) || "the question cannot be asked");
    }

    if (outcome.status === "rate_limited") {
      return errorOutcome(publicMessage(outcome.message) || "too many questions in an hour");
    }

    return errorOutcome(publicMessage(outcome.message) || NO_ANSWER);
  } catch (error) {
    return errorOutcome(publicMessage(describeProviderError(error)) || NOT_CONNECTED);
  }
}

export async function callTool(
  name: string,
  args: unknown,
  context: ToolContext = {},
): Promise<ToolOutcome> {
  const parsed = objectArguments(args);

  if (name === TOOL_SEARCH) {
    return parsed === null || only(["query", "limit"], parsed) === false
      ? invalid("the arguments of cited_search are a query and an optional limit")
      : searchTool(parsed, context);
  }

  if (name === TOOL_ASK) {
    return parsed === null || only(["question", "sessionId"], parsed) === false
      ? invalid("the arguments of cited_ask are a question and an optional sessionId")
      : askTool(parsed, context);
  }

  return invalid(`Unknown tool: ${name}`);
}
