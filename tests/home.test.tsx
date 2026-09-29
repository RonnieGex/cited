import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("home page", () => {
  it("shows the product name in a first level heading", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Cited",
    );
  });

  it("renders a single main region", () => {
    render(<Home />);

    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
