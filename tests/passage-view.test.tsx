// Decisions 1 and 4 of `openspec/changes/passage-display-polish/design.md`: one module holds the pure helpers every
// view of a passage uses. `passageBody` is the text of a passage without its heading at the start; `leadLength` is how
// many characters at the start of a passage repeat the end of the passage before it, at most 120 and ending before a
// whitespace, which is what a document that repeats its own words at a boundary gives a citation. `PassageBody` is the
// one view of a passage: heading once, lists as lists, the repeated words in the muted colour outside the highlighter,
// and the highlight from the first own word.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PassageBody, leadLength, passageBody } from "@/components/chat/PassageBody";
import { chunkText } from "@/lib/ingest";

describe("passageBody", () => {
  it("removes the heading at the start of the text", () => {
    expect(passageBody("Horario Martes a viernes: 8:00 a 19:00.", "Horario")).toBe(
      "Martes a viernes: 8:00 a 19:00.",
    );
  });

  it("keeps a heading that is not at the start", () => {
    expect(passageBody("Martes a viernes: 8:00 a 19:00. Horario", "Horario")).toBe(
      "Martes a viernes: 8:00 a 19:00. Horario",
    );
  });

  it("keeps the text of a passage with no heading", () => {
    expect(passageBody("Abrimos de martes a domingo.", null)).toBe("Abrimos de martes a domingo.");
  });

  it("returns the text as it is when the text is only the heading", () => {
    expect(passageBody("Horario", "Horario")).toBe("Horario");
  });
});

describe("leadLength", () => {
  it("measures the words a passage repeats from the one before it", () => {
    const long = "frase de prueba ".repeat(80).trim();
    const passages = chunkText(long);
    const first = passages[0]?.text ?? "";
    const second = passages[1]?.text ?? "";
    const lead = leadLength(first, second);

    expect(passages.length).toBe(2);
    // The paragraph repeats one phrase, so the cut leaves a passage that opens with words the one before it ends with:
    // the lead is the length of those words, and it carries no more of them than the bound of 120.
    expect(lead).toBeGreaterThan(100);
    expect(lead).toBeLessThanOrEqual(120);
    expect(first.endsWith(second.slice(0, lead))).toBe(true);
  });

  it("is zero for the first passage of a section", () => {
    expect(leadLength(undefined, "Somos un café y taller de bicicletas.")).toBe(0);
    expect(leadLength(null, "Somos un café y taller de bicicletas.")).toBe(0);
  });

  it("is zero when the passage before it shares no prefix, and zero for a text with no shared words", () => {
    expect(leadLength("Martes a viernes: 8:00 a 19:00.", "Aceptamos efectivo y tarjeta.")).toBe(0);
    expect(leadLength(undefined, "Un pasaje sin vecino.")).toBe(0);
  });

  it("stops at 120 characters", () => {
    const previous = "a ".repeat(200).trim();
    const text = "a ".repeat(200).trim();
    // The bound is 120 and the excerpt is longer: the lead is the longest run of words below it.
    const lead = leadLength(previous, text);

    expect(text.length).toBeGreaterThan(120);
    expect(lead).toBeGreaterThanOrEqual(119);
    expect(lead).toBeLessThanOrEqual(120);
  });

  it("ends the repeated words at a word of the excerpt", () => {
    // The repeated words are a run of whole words: the excerpt whose colon follows "cámara" does not repeat them at
    // all, and the one whose whitespace follows them repeats those words and no more.
    const spaced = "cambio de cámara 120 pesos.";

    expect(leadLength("cambio de cámara, la bici", "cambio de cámara: 120 pesos.")).toBe(0);
    expect(leadLength("hoy hablamos de cambio de cámara", spaced)).toBe("cambio de cámara".length);
    expect(leadLength("otra cosa", spaced)).toBe(0);
  });
});

describe("the one view of a passage", () => {
  it("shows the heading once, above the passage", () => {
    render(
      <PassageBody
        heading="Café La Horquilla"
        text="Café La Horquilla Somos un café y taller de bicicletas en el centro de la ciudad."
      ></PassageBody>,
    );

    expect(screen.getAllByText("Café La Horquilla")).toHaveLength(1);
    expect(screen.getByText("Somos un café y taller de bicicletas en el centro de la ciudad.")).toBeInTheDocument();
  });

  it("shows the list of a passage as one list with one item per line, each one highlighted", () => {
    const { container } = render(
      <PassageBody
        heading="Precios"
        highlighted
        text={
          "Precios - Espresso: 35 pesos.\n- Café de olla: 45 pesos.\n- Pan dulce del día: 30 pesos.\n- Afinación de bicicleta: 380 pesos.\n- Cambio de cámara: 120 pesos."
        }
      />,
    );

    // Decision 10 of the amendment: the item that opens the body does not open a list of its own, so the five items
    // are the children of one single list.
    const lists = container.querySelectorAll("ul, ol");

    expect(lists).toHaveLength(1);
    expect(lists[0]?.children).toHaveLength(5);

    const items = screen.getAllByRole("listitem");

    expect(items).toHaveLength(5);
    expect(items[0]?.textContent).toBe("Espresso: 35 pesos.");
    expect(items[4]?.textContent).toBe("Cambio de cámara: 120 pesos.");
    expect(items[0]?.querySelector(".hl")?.textContent).toBe("Espresso: 35 pesos.");
  });

  it("renders a body with no line break as one paragraph, whatever it holds", () => {
    // Decision 12: a passage stored before this change holds its list flattened with " - ", and it is still one
    // paragraph: no dash and no number in prose turns into a list.
    const flattened =
      "Precios - Espresso: 35 pesos. - Café de olla: 45 pesos. - Pan dulce del día: 30 pesos. - Afinación de bicicleta: 380 pesos. - Cambio de cámara: 120 pesos.";
    const { container } = render(<PassageBody highlighted text={flattened} />);

    expect(container.querySelectorAll("ul, ol")).toHaveLength(0);
    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(container.querySelectorAll(".hl")).toHaveLength(1);
    expect(container.querySelector(".hl")?.textContent).toBe(flattened);
    expect(screen.getByText(flattened)).toBeInTheDocument();
  });

  it("renders a text with no line break as one paragraph", () => {
    const { container } = render(<PassageBody text="Aceptamos efectivo y tarjeta." />);

    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(screen.getByText("Aceptamos efectivo y tarjeta.")).toBeInTheDocument();
  });

  it("puts the lead in the muted colour, outside the highlighter, and starts the highlight at the first own word", () => {
    const { container } = render(
      <PassageBody
        highlighted
        text={"cambio de cámara: 120 pesos."}
        lead={"cambio de cámara: ".length}
      />,
    );
    const muted = container.querySelector('[data-passage="lead"]');
    const highlight = container.querySelector(".hl");

    expect(muted?.textContent).toBe("cambio de cámara: ");
    expect(muted?.className).toContain("text-ink-2");
    expect(highlight?.textContent).toBe("120 pesos.");
    expect(highlight?.parentElement?.textContent).toBe("cambio de cámara: 120 pesos.");
  });

  it("paints the highlighter as an inline span inside its paragraph", () => {
    const { container } = render(<PassageBody highlighted text="Aceptamos efectivo y tarjeta." />);

    const highlight = container.querySelector(".hl");

    expect(highlight?.tagName).toBe("SPAN");
    expect(highlight?.parentElement?.tagName).toBe("P");
  });
});
