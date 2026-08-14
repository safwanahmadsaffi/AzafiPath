import { describe, expect, it } from "vitest";
import { cycleRoomIndex, selectRoomIndex, swipeDirection } from "../shared/roomCarousel";

describe("four-room carousel interactions", () => {
  it("wraps next and previous arrow navigation across all four rooms", () => {
    expect(cycleRoomIndex(0, -1)).toBe(3);
    expect(cycleRoomIndex(3, 1)).toBe(0);
    expect(cycleRoomIndex(1, 1)).toBe(2);
  });

  it("keeps dot navigation inside the available room range", () => {
    expect(selectRoomIndex(2)).toBe(2);
    expect(selectRoomIndex(-4)).toBe(0);
    expect(selectRoomIndex(99)).toBe(3);
  });

  it("turns horizontal swipes into a room direction and ignores taps", () => {
    expect(swipeDirection(220, 150)).toBe(1);
    expect(swipeDirection(150, 220)).toBe(-1);
    expect(swipeDirection(150, 180)).toBe(0);
  });
});
