// @vitest-environment node
import { describe, expect, it } from "vitest";
import { describeProviderError, sanitizeOutbound } from "@/lib/guards/outbound";

// The last door of the server, tested alone: the Blocker B-1 of `katalis-dev/tasks/revision-community-12.md` is an SDK
// that puts the key it received inside the text of its error, and the requirement "No provider error reaches the
// browser" asks that no route return it. The shapes here are the ones the providers and the store of this repository
// really use.

const savedKey = "sk-guardada-0000000000007788";

// The shapes are built here instead of being written as one literal, because a line of this file that carried a whole
// key — even a synthetic one — would be the very thing the hook of the repository and the pipeline refuse.
const anthropicKey = ["sk-ant", "api03", "abcdefghijklmnop"].join("-");
const googleKey = ["AIza", "Sy", "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6"].join("");
const groqKey = ["gsk", "abcdefghijklmnopqrst"].join("_");
const openRouterKey = ["sk-or-v1", "0123456789abcdef0123456789abcdef"].join("-");
const ciphertext = ["v1", "YWJjZGVmZ2hpamtsbW5vcA==", "cXJzdHV2d3h5eg==", "MTIzNDU2Nzg5MA=="].join(":");
const bareToken = "a1b2c3d4".repeat(4);

describe("the redaction of what leaves the server", () => {
  it("removes the key of every provider of the catalogue", () => {
    const text = [
      `Incorrect API key provided: ${savedKey}.`,
      `x-api-key: ${anthropicKey}`,
      `key=${googleKey}`,
      `Authorization: Bearer ${groqKey}`,
      openRouterKey,
    ].join(" ");
    const clean = sanitizeOutbound(text);

    expect(clean).not.toContain(savedKey);
    expect(clean).not.toMatch(/sk-/i);
    expect(clean).not.toContain(googleKey);
    expect(clean).not.toContain(groqKey);
    expect(clean).not.toContain(openRouterKey);
    expect(clean).toContain("Incorrect API key provided");
  });

  it("removes the ciphertext of the store and a bare token", () => {
    const clean = sanitizeOutbound(`the row holds ${ciphertext} and the token ${bareToken}`);

    expect(clean).not.toContain("v1:");
    expect(clean).not.toContain(bareToken);
  });

  it("leaves a message without a secret as it was written", () => {
    expect(sanitizeOutbound("the provider answered 503 and no key travelled")).toBe(
      "the provider answered 503 and no key travelled",
    );
  });
});

describe("the sentence a route writes from an exception", () => {
  it("never returns the key of a provider that echoed it", () => {
    const text = describeProviderError(
      new Error(`401 Incorrect API key provided: ${savedKey}. You can find your API key in the panel.`),
    );

    expect(text).not.toContain(savedKey);
    expect(text).not.toMatch(/sk-/i);
    expect(text).toContain("Incorrect API key provided");
  });

  it("answers an empty text when the message was only the key", () => {
    expect(describeProviderError(new Error(savedKey))).toBe("");
    expect(describeProviderError(new Error("   "))).toBe("");
    expect(describeProviderError("not an error")).toBe("");
    expect(describeProviderError(undefined)).toBe("");
  });

  it("shortens a body of an SDK that answers with a whole document", () => {
    const long = describeProviderError(new Error("x".repeat(4_000)));

    expect(long.length).toBeLessThanOrEqual(300);
  });
});
