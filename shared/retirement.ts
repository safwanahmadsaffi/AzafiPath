export interface RetirementInput {
  currentAge: number;
  targetRetirementAge: number;
  monthlyExpensePKR: number;
  inflationRate: number; // e.g. 0.07 for 7%
  preRetirementReturn: number; // e.g. 0.18 for 18% nominal
  postRetirementReturn: number; // e.g. 0.14 for 14%
  safeWithdrawalRate: number; // e.g. 0.08 for 8% in PKR
}

export interface RetirementResult {
  yearsToRetirement: number;
  futureMonthlyExpense: number;
  requiredCorpus: number;
  requiredMonthlySavings: number;
  suggestedEquityAllocation: number; // percentage e.g. 80
  suggestedFixedIncomeAllocation: number; // percentage e.g. 20
}

export function calculateRetirement(input: RetirementInput): RetirementResult {
  const yearsToRetirement = Math.max(1, input.targetRetirementAge - input.currentAge);
  const inflation = Math.max(0, input.inflationRate);
  
  // Future monthly expense adjusted for inflation
  const futureMonthlyExpense = input.monthlyExpensePKR * Math.pow(1 + inflation, yearsToRetirement);
  const annualExpense = futureMonthlyExpense * 12;
  
  // Safe withdrawal rate corpus calculation
  const swr = Math.max(0.01, input.safeWithdrawalRate);
  const requiredCorpus = annualExpense / swr;
  
  // Monthly compounding pre-retirement
  const monthlyRate = Math.max(0.01, input.preRetirementReturn) / 12;
  const totalMonths = yearsToRetirement * 12;
  
  // Future Value of annuity formula: FV = PMT * [ ((1 + r)^n - 1) / r ]
  const denominator = ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  const requiredMonthlySavings = denominator > 0 ? requiredCorpus / denominator : requiredCorpus / totalMonths;

  // Dynamic asset allocation based on runway (younger = higher equity)
  let equity = 80;
  if (yearsToRetirement > 25) equity = 90;
  else if (yearsToRetirement < 10) equity = 50;

  return {
    yearsToRetirement,
    futureMonthlyExpense: Math.round(futureMonthlyExpense),
    requiredCorpus: Math.round(requiredCorpus),
    requiredMonthlySavings: Math.max(500, Math.round(requiredMonthlySavings)),
    suggestedEquityAllocation: equity,
    suggestedFixedIncomeAllocation: 100 - equity,
  };
}
