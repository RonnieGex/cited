import { describe, expect, it, vi } from "vitest";
import { ASK_ENDPOINT, askCited } from "@/lib/chat/client";

// The browser half of `/api/ask`: it carries the `sessionId` of the tab with every question and turns the answer of
// the route into the three states the chat paints.

const answered = {
  status: "answered",
  answer: "The tune-up is 380 pesos. [1]",
  citations: [
    {
      n: 1,
      document: "cafe-la-horquilla.md",
      heading: "Precios",
      position: 3,
      excerpt: "Afinación de bicicleta: 380 pesos.",
    },
  ],
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

describe("the client of /api/ask", () => {
  it("posts the question with the session of the tab", async () => {
    const fetchImpl = vi.fn(async () => json(answered));

    const result = await askCited({
      question: "How much is a tune-up?",
      sessionId: "tab-1",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual(answered);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];

    expect(url).toBe(ASK_ENDPOINT);
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toContain("application/json");
    expect(JSON.parse(String(init.body))).toEqual({
      question: "How much is a tune-up?",
      sessionId: "tab-1",
    });
  });

  it("carries a refusal as a refusal", async () => {
    const fetchImpl = vi.fn(async () =>
      json({ status: "refused", answer: "I can't find that in this business's documents." }),
    );

    await expect(
      askCited({
        question: "Do you sell submarines?",
        sessionId: "tab-1",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      status: "refused",
      answer: "I can't find that in this business's documents.",
    });
  });

  it("keeps the message of the server when the request is refused", async () => {
    const fetchImpl = vi.fn(async () =>
      json({ status: "rate_limited", error: "more than 30 questions from this address in an hour" }, 429),
    );

    await expect(
      askCited({
        question: "How much is a tune-up?",
        sessionId: "tab-1",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).resolves.toEqual({
      status: "failed",
      message: "more than 30 questions from this address in an hour",
    });
  });

  it("keeps the message of an unavailable server", async () => {
    const fetchImpl = vi.fn(async () =>
      json({ status: "unavailable", error: "the daily limit is reached" }, 503),
    );

    await expect(
      askCited({
        question: "How much is a tune-up?",
        sessionId: "tab-1",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).resolves.toEqual({ status: "failed", message: "the daily limit is reached" });
  });

  it("fails with no message when the answer cannot be read", async () => {
    const broken = vi.fn(async () => new Response("<html>502</html>", { status: 502 }));
    const nonsense = vi.fn(async () => json({ status: "something else" }));

    await expect(
      askCited({ question: "q", sessionId: "s", fetchImpl: broken as unknown as typeof fetch }),
    ).resolves.toEqual({ status: "failed", message: null });

    await expect(
      askCited({ question: "q", sessionId: "s", fetchImpl: nonsense as unknown as typeof fetch }),
    ).resolves.toEqual({ status: "failed", message: null });
  });

  it("fails with no message when the network is gone", async () => {
    const offline = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(
      askCited({ question: "q", sessionId: "s", fetchImpl: offline as unknown as typeof fetch }),
    ).resolves.toEqual({ status: "failed", message: null });
  });
});
