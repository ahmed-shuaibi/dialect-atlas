import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ContactView } from "@/features/atlas/components/ContactView";

describe("ContactView", () => {
  it("offers Ahmed's email as the primary keyboard-accessible contact", async () => {
    const user = userEvent.setup();
    render(<ContactView />);
    const email = screen.getByRole("link", { name: "ahmed.shuaibi@hey.com" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Questions about DIALECT or the Atlas?",
      }),
    ).toBeInTheDocument();
    expect(email).toHaveAttribute("href", "mailto:ahmed.shuaibi@hey.com");

    await user.tab();
    expect(email).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Read the paper" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "View source" })).toHaveFocus();
  });
});
