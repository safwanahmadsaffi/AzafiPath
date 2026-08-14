import { describe, expect, it } from "vitest";
import { calculateRetirement } from "../shared/retirement";

describe("calculateRetirement domain logic", () => {
  it("calculates future expense, required corpus, and monthly savings correctly", () => {
    const result = calculateRetirement({
      currentAge: 22,
      targetRetirementAge: 52,
      monthlyExpensePKR: 100000,
      inflationRate: 0.08,
      preRetirementReturn: 0.18,
      postRetirementReturn: 0.14,
      safeWithdrawalRate: 0.08,
    });

    expect(result.yearsToRetirement).toBe(30);
    expect(result.futureMonthlyExpense).toBeGreaterThan(100000);
    expect(result.requiredCorpus).toBeGreaterThan(0);
    expect(result.requiredMonthlySavings).toBeGreaterThan(0);
    expect(result.suggestedEquityAllocation).toBe(90);
  });
});
