import { describe, expect, it } from "vitest";
import { VARIABLE_NAME, containsVariableName, publicMessage } from "@/lib/guards/outbound";

// CodeQL js/polynomial-redos (alert 12, PR #15): `VARIABLE_NAME` backtracks quadratically on a long run of capitals
// with no underscore, and the MCP endpoint lets outside text reach `publicMessage()`. The scan that replaces it there
// is linear and answers exactly what the regular expression answers.
describe("containsVariableName", () => {
  const cases = [
    "OPENAI_API_KEY",
    "the key OPENAI_API_KEY is missing",
    "set CHAT_PROVIDER first",
    "A_B",
    "A__",
    "A_",
    "_A",
    "a_b",
    "Abc_Def",
    "1OPENAI_KEY",
    "X1_2",
    "MAX_QUESTION_CHARS (1000 characters)",
    "the AI could not answer right now",
    "no variable here",
    "ALLCAPS WITHOUT UNDERSCORE",
    "trailing CAPS_",
    "lower_case_name",
    "Mixed_Case",
    "A1_",
    "Z_9",
    "",
    "EVIL_VARIABLE_NAME",
  ];

  it.each(cases)("answers like the regular expression for %j", (text) => {
    expect(containsVariableName(text)).toBe(VARIABLE_NAME.test(text));
  });

  it("stays linear on a long run of capitals with no underscore", () => {
    const hostile = "A".repeat(200_000);
    const started = performance.now();

    expect(containsVariableName(hostile)).toBe(false);
    expect(performance.now() - started).toBeLessThan(200);
  });

  it("is what publicMessage uses, and a hostile text answers fast", () => {
    expect(publicMessage("the variable OPENAI_API_KEY is empty")).toBe("");
    expect(publicMessage("the AI could not answer right now")).toBe("the AI could not answer right now");

    const started = performance.now();

    // A long run of letters has the shape of a key, so nothing of it leaves; what matters is that it answers at once.
    expect(publicMessage("A".repeat(200_000))).toBe("");
    expect(performance.now() - started).toBeLessThan(500);
  });
});
