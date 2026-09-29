// Stand-in until admin-panel-and-onboarding merges; Fable replaces it with the owner's file

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

export async function readBusiness(): Promise<Business | null> {
  return null;
}
