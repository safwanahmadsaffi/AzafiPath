import { describe, expect, it } from "vitest";
import { monthlyFutureValue, projectAtAge, requiredMonthly } from "../shared/finance";

describe("AzadiPath finance projections", () => {
  it("grows a monthly contribution with the configured annual rate", () => {
    const tenYearValue = monthlyFutureValue(5000, 10, 0.2);
    expect(tenYearValue).toBeGreaterThan(5000 * 120);
    expect(tenYearValue).toBeCloseTo(1_880_476, -2);
  });

  it("calculates a monthly contribution that reaches the target corpus", () => {
    const monthly = requiredMonthly(10_000_000, 20, 0.2);
    expect(monthly).toBeCloseTo(3_216, -1);
    expect(monthlyFutureValue(monthly, 20, 0.2)).toBeCloseTo(10_000_000, -2);
  });

  it("uses the age gap for a retirement plan", () => {
    const at  = projectAtAge(18, 55, 10_000_000, 0.2);
    const later = projectAtAge(25, 55, 10_000_000, 0.2);
    expect(at).toBeLessThan(later);
  });
});
