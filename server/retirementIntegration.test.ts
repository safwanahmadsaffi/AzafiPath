import { describe, it, expect } from "vitest";
import { calculateRetirement } from "../shared/retirement";

describe("AzadiPath Upgraded Retirement & Module Engine", () => {
  it("calculates future expense, corpus, and asset allocation correctly", () => {
    const result = calculateRetirement({
      currentAge: 20,
      targetRetirementAge: 55,
      monthlyExpensePKR: 100000,
      inflationRate: 0.08,
      preRetirementReturn: 0.18,
      postRetirementReturn: 0.14,
      safeWithdrawalRate: 0.08,
    });

    expect(result.yearsToRetirement).toBe(35);
    expect(result.futureMonthlyExpense).toBeGreaterThan(100000);
    expect(result.requiredCorpus).toBeGreaterThan(1000000);
    expect(result.requiredMonthlySavings).toBeGreaterThan(0);
    expect(result.suggestedEquityAllocation).toBe(90);
    expect(result.suggestedFixedIncomeAllocation).toBe(10);
  });
});
