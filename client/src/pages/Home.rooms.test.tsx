// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FeatureRooms } from "./Home";

describe("FeatureRooms home carousel", () => {
  it("supports arrows, dots, swipe, room navigation, and Build my path", async () => {
    const user = userEvent.setup();
    const onBuildPath = vi.fn();
    const onJump = vi.fn();
    render(<FeatureRooms onBuildPath={onBuildPath} onJump={onJump} />);

    expect(screen.getByText("Your next move, made visible.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Next feature room" }));
    expect(screen.getByText("Let consistency become a strategy.")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Show Financial Leaks room" }));
    expect(screen.getByText("Redirect the small leaks.")).toBeTruthy();

    const surface = screen.getByTestId("room-surface");
    fireEvent.pointerDown(surface, { clientX: 220, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 150, pointerId: 1 });
    expect(screen.getByText("Build a future your body can enjoy.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Open this room" }));
    expect(onJump).toHaveBeenCalledWith("retirement");

    await user.click(screen.getByRole("button", { name: "Build my path now" }));
    expect(onBuildPath).toHaveBeenCalledTimes(1);
  });
});
