import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ContactView } from "@/features/atlas/components/ContactView";

describe("ContactView", () => {
  it("offers Ahmed's email as the primary keyboard-accessible contact", async () => {
    const user = userEvent.setup();
    render(<ContactView />);
    const email = screen.getByRole("link", { name: "shuaibi.ahmed.a@gmail.com" });
    const profile = screen.getByRole("link", { name: "Ahmed Shuaibi personal profile" });

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Questions about DIALECT or the Atlas?",
      }),
    ).toBeInTheDocument();
    expect(email).toHaveAttribute("href", "mailto:shuaibi.ahmed.a@gmail.com");
    expect(profile).toHaveAttribute("href", "https://ahmedshuaibi.com");

    await user.tab();
    expect(email).toHaveFocus();
    await user.tab();
    expect(profile).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "Read the paper" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "View source" })).toHaveFocus();
  });
});
