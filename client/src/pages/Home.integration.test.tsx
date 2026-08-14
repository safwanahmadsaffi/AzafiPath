import { describe, it, expect } from "vitest";
import { calculateRetirement } from "../../../shared/retirement";

describe("AzadiPath Non-Carousel Integration Suite (Lightweight)", () => {
  it("verifies retirement calculations and core parameters", () => {
    const res = calculateRetirement({
      currentAge: 20,
      targetRetirementAge: 55,
      monthlyExpensePKR: 120000,
      inflationRate: 0.08,
      preRetirementReturn: 0.18,
      postRetirementReturn: 0.14,
      safeWithdrawalRate: 0.08,
    });
    expect(res.requiredCorpus).toBeGreaterThan(0);
  });
});
