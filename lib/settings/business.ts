import type { ChatEnvironment } from "../models/types.ts";
import { sharedStore } from "../store/instance.ts";
import type { StoredBusiness } from "../store/index.ts";
import { topicsFrom, topicsTo } from "./topics.ts";

export { topicsFrom, topicsTo };

export type Lang = "en" | "es";

export interface Business {
  name: string;
  hasLogo: boolean;
  primaryColor: string | null;
  tone: string;
  language: Lang;
  forbiddenTopics: string[];
  welcome: { en: string; es: string };
  updatedAt: string;
}

export interface BusinessInput {
  name: string;
  primaryColor: string | null;
  tone: string;
  language: Lang;
  forbiddenTopics: string[];
  welcome: { en: string; es: string };
}

export type BusinessLogo = {
  mime: string;
  bytes: Uint8Array;
};

function languageOf(value: string): Lang {
  return value === "es" ? "es" : "en";
}

function toBusiness(row: StoredBusiness): Business {
  return {
    name: row.name,
    hasLogo: row.hasLogo,
    primaryColor: row.primaryColor,
    tone: row.tone,
    language: languageOf(row.language),
    forbiddenTopics: topicsFrom(row.forbiddenTopics),
    welcome: { en: row.welcomeEn, es: row.welcomeEs },
    updatedAt: row.updatedAt,
  };
}

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message} ${messageOf(error.cause)}`;
  }

  return typeof error === "string" ? error : "";
}

function tableMissing(error: unknown): boolean {
  return /no such table/i.test(messageOf(error));
}

export async function readBusiness(
  environment: ChatEnvironment = process.env,
): Promise<Business | null> {
  try {
    const store = await sharedStore(environment);
    const row = await store.readBusiness();

    return row === null ? null : toBusiness(row);
  } catch (error) {
    if (tableMissing(error)) {
      return null;
    }

    throw error;
  }
}

export async function saveBusiness(
  input: BusinessInput,
  environment: ChatEnvironment = process.env,
): Promise<Business> {
  const store = await sharedStore(environment);

  await store.saveBusiness({
    name: input.name.trim(),
    primaryColor: input.primaryColor,
    tone: input.tone.trim(),
    language: input.language,
    forbiddenTopics: topicsTo(input.forbiddenTopics),
    welcomeEn: input.welcome.en,
    welcomeEs: input.welcome.es,
  });

  const stored = await store.readBusiness();

  if (stored === null) {
    throw new Error("the store kept no business row after the write");
  }

  return toBusiness(stored);
}

export async function saveBusinessLogo(
  mime: string,
  bytes: Uint8Array,
  environment: ChatEnvironment = process.env,
): Promise<void> {
  const store = await sharedStore(environment);

  await store.saveBusinessLogo(mime, bytes);
}

export async function readBusinessLogo(
  environment: ChatEnvironment = process.env,
): Promise<BusinessLogo | null> {
  try {
    const store = await sharedStore(environment);

    return await store.readBusinessLogo();
  } catch {
    return null;
  }
}
