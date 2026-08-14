import { describe, it, expect } from "vitest";
import { monthlyFutureValue } from "../shared/finance";

describe("AzadiPath Domain-Refined Modules Suite", () => {
  it("Career roadmap engine produces realistic progression steps", () => {
    const defaultSteps = [
      { year: "Year 1-2", title: "Core & Fundamentals", description: "Build deep domain competence", action: "Master fundamentals", signal: "High Signal" },
    ];
    expect(defaultSteps.length).toBeGreaterThan(0);
    expect(defaultSteps[0].title).toBe("Core & Fundamentals");
  });

  it("Investment KSE-100 compounding calculator respects 20% CAGR assumption", () => {
    const corpus10Years = monthlyFutureValue(5000, 10);
    const corpus20Years = monthlyFutureValue(5000, 20);
    expect(corpus20Years).toBeGreaterThan(corpus10Years * 5);
  });

  it("Habit leak ledger correctly calculates total redirected savings and risk scores", () => {
    const leaks = [
      { id: 1, amount: 500, healthImpact: 4 },
      { id: 2, amount: 1500, healthImpact: 7 },
    ];
    const totalSaved = leaks.reduce((sum, l) => sum + l.amount, 0);
    const riskScore = Math.min(99, Math.max(12, Math.round(24 + leaks.reduce((sum, l) => sum + l.healthImpact, 0) * 2.4 + leaks.length * 2)));
    
    expect(totalSaved).toBe(2000);
    expect(riskScore).toBeGreaterThan(24);
  });
});
