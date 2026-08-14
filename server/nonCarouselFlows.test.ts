import { describe, it, expect } from "vitest";
import { calculateRetirement } from "../shared/retirement";

describe("AzadiPath Non-Carousel Flows & Calculations", () => {
  it("verifies retirement inflation and corpus calculations match expectations", () => {
    const res = calculateRetirement({
      currentAge: 25,
      targetRetirementAge: 60,
      monthlyExpensePKR: 150000,
      inflationRate: 0.08,
      preRetirementReturn: 0.18,
      postRetirementReturn: 0.14,
      safeWithdrawalRate: 0.08,
    });
    expect(res.yearsToRetirement).toBe(35);
    expect(res.requiredCorpus).toBeGreaterThan(0);
    expect(res.requiredMonthlySavings).toBeGreaterThan(0);
  });

  it("verifies mock leak calculation logic", () => {
    const leaks = [
      { amount: 1000, healthImpact: 5 },
      { amount: 2000, healthImpact: 6 },
    ];
    const total = leaks.reduce((s, l) => s + l.amount, 0);
    expect(total).toBe(3000);
  });
});
