import { guardRequest } from "../../../../lib/admin/guard.ts";
import { bodyOf, guardResponse, json } from "../../../../lib/admin/respond.ts";
import { readBusiness, saveBusiness, type BusinessInput } from "../../../../lib/settings/business.ts";

export const runtime = "nodejs";

const colorPattern = /^#[0-9a-fA-F]{6}$/;

function text(value: unknown, fallback: string): string | null {
  if (value === undefined || value === null) {
    return fallback;
  }

  return typeof value === "string" ? value : null;
}

function parse(body: Record<string, unknown>): BusinessInput | null {
  const name = typeof body["name"] === "string" ? body["name"].trim() : "";

  if (name.length === 0) {
    return null;
  }

  const color = body["primaryColor"];

  if (color !== undefined && color !== null && (typeof color !== "string" || colorPattern.test(color) === false)) {
    return null;
  }

  const language = body["language"];

  if (language !== undefined && language !== "en" && language !== "es") {
    return null;
  }

  const topics = body["forbiddenTopics"];

  if (topics !== undefined && (Array.isArray(topics) === false || topics.some((topic) => typeof topic !== "string"))) {
    return null;
  }

  const tone = text(body["tone"], "");

  if (tone === null) {
    return null;
  }

  const welcome = body["welcome"];

  if (welcome !== undefined && (typeof welcome !== "object" || welcome === null || Array.isArray(welcome))) {
    return null;
  }

  const record = (welcome ?? {}) as Record<string, unknown>;
  const en = text(record["en"], "");
  const es = text(record["es"], "");

  if (en === null || es === null) {
    return null;
  }

  return {
    name,
    primaryColor: color === undefined || color === null ? null : String(color),
    tone,
    language: language === undefined ? "en" : language,
    forbiddenTopics: (topics ?? []).map((topic) => String(topic).trim()).filter((topic) => topic.length > 0),
    welcome: { en, es },
  };
}

export async function GET(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  return json({ status: "ok", business: await readBusiness(process.env) });
}

export async function PUT(request: Request): Promise<Response> {
  const guarded = guardRequest(request, process.env);

  if (guarded.status !== "ok") {
    return guardResponse(guarded);
  }

  const body = await bodyOf(request);

  if (body === null) {
    return json({ status: "invalid", error: "the body must be a JSON object" }, 400);
  }

  const parsed = parse(body);

  if (parsed === null) {
    return json(
      {
        status: "invalid",
        error:
          'the body must be {"name": string, "primaryColor"?: "#rrggbb" | null, "tone"?: string, "language"?: "en" | "es", "forbiddenTopics"?: string[], "welcome"?: {"en": string, "es": string}}',
      },
      400,
    );
  }

  return json({ status: "ok", business: await saveBusiness(parsed, process.env) });
}
