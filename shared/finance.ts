export function monthlyFutureValue(monthly: number, years: number, annualRate = 0.2) {
  if (monthly <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  return monthly * ((Math.pow(1 + monthlyRate, years * 12) - 1) / monthlyRate);
}

export function requiredMonthly(target: number, years: number, annualRate = 0.2) {
  if (target <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  return target * monthlyRate / (Math.pow(1 + monthlyRate, Math.max(1, years * 12)) - 1);
}

export function projectAtAge(currentAge: number, targetAge: number, targetCorpus: number, annualRate = 0.2) {
  return requiredMonthly(targetCorpus, Math.max(1, targetAge - currentAge), annualRate);
}
