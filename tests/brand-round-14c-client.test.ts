import { describe, expect, it } from "vitest";
import { askCited } from "@/lib/chat/client";
import { PUBLIC_STRINGS } from "@/lib/i18n/public";
import type { Lang } from "@/lib/settings/business";

// Task 10.1 of `openspec/changes/brand-identity-ui/tasks.md`, decision 21 of `design.md` (the failures of `/api/ask` speak
// the language of the visitor), the client half: `askCited` returns a kind and never the text the server wrote, and the
// public strings carry one sentence per kind in both languages. Written before the fix: these tests are red until the
// kind exists.

const serverText = "more than RATE_LIMIT_PER_IP_PER_HOUR (30) questions from this address in an hour";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function asked(fetchImpl: () => Promise<Response>) {
  return askCited({ question: "q", sessionId: "s", fetchImpl: fetchImpl as unknown as typeof fetch });
}

describe("the failure kinds of the client of /api/ask (decision 21)", () => {
  it("answers a 429 with the kind rate_limited and none of the words of the server", async () => {
    const result = await asked(async () => json({ status: "rate_limited", error: serverText }, 429));

    expect(result).toEqual({ status: "failed", kind: "rate_limited" });
    expect(JSON.stringify(result)).not.toContain("RATE_LIMIT");
  });

  it("answers any other answer that is not 200 with the kind unavailable, read or not", async () => {
    await expect(asked(async () => json({ status: "unavailable", error: "the daily limit is reached" }, 503))).resolves.toEqual({
      status: "failed",
      kind: "unavailable",
    });
    await expect(asked(async () => json({ status: "invalid", error: "question_missing" }, 400))).resolves.toEqual({
      status: "failed",
      kind: "unavailable",
    });
    await expect(asked(async () => new Response("<html>502</html>", { status: 502 }))).resolves.toEqual({
      status: "failed",
      kind: "unavailable",
    });
  });

  it("answers a 429 that carries no readable body with the kind rate_limited too: the status decides", async () => {
    await expect(asked(async () => new Response("slow down", { status: 429 }))).resolves.toEqual({
      status: "failed",
      kind: "rate_limited",
    });
  });

  it("answers a 200 that says nothing the page knows with the kind unavailable", async () => {
    await expect(asked(async () => json({ status: "something else" }, 200))).resolves.toEqual({
      status: "failed",
      kind: "unavailable",
    });
    await expect(asked(async () => new Response("not json", { status: 200 }))).resolves.toEqual({
      status: "failed",
      kind: "unavailable",
    });
  });

  it("answers a request that fails with the kind network", async () => {
    await expect(
      asked(async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).resolves.toEqual({ status: "failed", kind: "network" });
  });

  it("keeps the answered and refused states as they were", async () => {
    const answered = { status: "answered", answer: "380 pesos. [1]", citations: [] };

    await expect(asked(async () => json(answered, 200))).resolves.toEqual(answered);
    await expect(asked(async () => json({ status: "refused", answer: "Not here." }, 200))).resolves.toEqual({
      status: "refused",
      answer: "Not here.",
    });
  });
});

function errorsOf(lang: Lang): Record<string, string> | undefined {
  return (PUBLIC_STRINGS[lang] as unknown as { errors?: Record<string, string> }).errors;
}

describe("the sentence of each failure, in the language of the page (decision 21)", () => {
  it("has the three sentences of the decision in English", () => {
    expect(errorsOf("en")).toEqual({
      rate_limited: "Too many questions from here. Try again in a while.",
      unavailable: "The answer could not be produced right now.",
      network: "No connection. Check your internet and try again.",
    });
  });

  it("has the three sentences of the decision in Spanish", () => {
    expect(errorsOf("es")).toEqual({
      rate_limited: "Demasiadas preguntas desde aquí. Inténtalo más tarde.",
      unavailable: "Ahora mismo no se pudo responder.",
      network: "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    });
  });

  it("names no variable of the environment and no address in any sentence", () => {
    for (const lang of ["en", "es"] as const) {
      for (const sentence of Object.values(errorsOf(lang) ?? {})) {
        expect(sentence, sentence).not.toMatch(/[A-Z]{3,}_[A-Z_]+|https?:|\.env/);
      }
    }
  });
});
