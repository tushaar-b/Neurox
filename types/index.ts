export type EmploymentType = "employed_fixed" | "employed_variable" | "self_employed" | "mixed";
export type VolatilityClass = "stable" | "moderate" | "variable" | "highly_variable";

export interface IncomeInput {
  employmentType: EmploymentType;
  fixedMonthlyIncome?: number;          // for employed_fixed
  last6MonthsIncome?: number[];         // for all others
  useFallback?: boolean;
  fallbackEstimate?: { min: number; avg: number; max: number }; // if exact figures unavailable
}

export interface ExpenseInput {
  needs: {
    housing: number;
    utilities: number;
    groceries: number;
    transportation: number;
    healthInsurance: number;
    minDebtPayments: number;
    otherNeeds: number;
  };
  wants: {
    diningOut: number;
    entertainment: number;
    shopping: number;
    travelHobbies: number;
    otherWants: number;
  };
}

export interface BufferInput {
  hasExistingBuffer: boolean;
  bufferInputMethod?: "dollars" | "months";
  currentBufferDollars?: number;
  currentBufferMonths?: number;       // alternate input method
  bufferTargetMonthsOverride?: number;
  bufferTimelineMonths: number;       // default 12
}

export interface InvestingProfile {
  hasInvestedBefore: boolean;
  experienceLevel?: "beginner" | "intermediate" | "experienced";
}

export interface CalculationResult {
  baselineIncome: number;
  volatilityClass: VolatilityClass;
  actualNeeds: number;
  actualWants: number;
  idealNeeds: number;
  idealWants: number;
  idealSaveInvest: number;
  surplus: number;
  isDeficit: boolean;
  deficitAmount?: number;
  bufferTargetMonths: number;
  bufferTargetDollars: number;
  currentBufferDollars: number;
  bufferGapDollars: number;
  monthlyBufferContribution: number;
  investableSurplus: number;
  timelineAdjustedMonths?: number;    // shown when surplus < required monthly
}
