import { IncomeInput, ExpenseInput, BufferInput, InvestingProfile, CalculationResult, VolatilityClass } from "../types";
import { DEFAULT_BUFFER_TABLE, VOLATILITY_THRESHOLDS } from "./constants";

export function getBaselineIncome(input: IncomeInput): { baselineIncome: number; volatilityClass: VolatilityClass } {
  const { employmentType, fixedMonthlyIncome, last6MonthsIncome, fallbackEstimate } = input;

  if (employmentType === "employed_fixed") {
    return {
      baselineIncome: fixedMonthlyIncome || 0,
      volatilityClass: "stable",
    };
  }

  if (last6MonthsIncome && last6MonthsIncome.length > 0) {
    const m = last6MonthsIncome;
    const n = m.length;
    const mean = m.reduce((sum, val) => sum + val, 0) / n;
    
    // Population standard deviation
    const variance = m.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    const conservativeBaseline = Math.max(mean - stdDev, Math.min(...m));

    let volatilityClass: VolatilityClass = "highly_variable";
    if (cv < VOLATILITY_THRESHOLDS.STABLE) {
      volatilityClass = "stable";
    } else if (cv < VOLATILITY_THRESHOLDS.MODERATE) {
      volatilityClass = "moderate";
    } else if (cv < VOLATILITY_THRESHOLDS.VARIABLE) {
      volatilityClass = "variable";
    }

    return {
      baselineIncome: Number(conservativeBaseline.toFixed(2)),
      volatilityClass,
    };
  }

  if (fallbackEstimate) {
    return {
      baselineIncome: fallbackEstimate.min,
      volatilityClass: "variable",
    };
  }

  return {
    baselineIncome: 0,
    volatilityClass: "stable",
  };
}

export function calculateExpenses(input: ExpenseInput): { actualNeeds: number; actualWants: number } {
  const needs = input.needs;
  const wants = input.wants;

  const actualNeeds =
    (needs.housing || 0) +
    (needs.utilities || 0) +
    (needs.groceries || 0) +
    (needs.transportation || 0) +
    (needs.healthInsurance || 0) +
    (needs.minDebtPayments || 0) +
    (needs.otherNeeds || 0);

  const actualWants =
    (wants.diningOut || 0) +
    (wants.entertainment || 0) +
    (wants.shopping || 0) +
    (wants.travelHobbies || 0) +
    (wants.otherWants || 0);

  return {
    actualNeeds: Number(actualNeeds.toFixed(2)),
    actualWants: Number(actualWants.toFixed(2)),
  };
}

export function calculateIdealSplit(baselineIncome: number) {
  return {
    idealNeeds: Number((0.50 * baselineIncome).toFixed(2)),
    idealWants: Number((0.30 * baselineIncome).toFixed(2)),
    idealSaveInvest: Number((0.20 * baselineIncome).toFixed(2)),
  };
}

export function getRecommendedBufferMonths(employmentType: string, volatilityClass: VolatilityClass): number {
  const empKey = employmentType as keyof typeof DEFAULT_BUFFER_TABLE;
  const defaultTable = DEFAULT_BUFFER_TABLE[empKey];
  if (defaultTable) {
    return defaultTable[volatilityClass];
  }
  return 3; // Fallback default
}

export function runFinancialAssessment(
  income: IncomeInput,
  expense: ExpenseInput,
  buffer: BufferInput,
  investing: InvestingProfile
): CalculationResult {
  const { baselineIncome, volatilityClass } = getBaselineIncome(income);
  const { actualNeeds, actualWants } = calculateExpenses(expense);
  const { idealNeeds, idealWants, idealSaveInvest } = calculateIdealSplit(baselineIncome);

  const surplus = Number((baselineIncome - actualNeeds - actualWants).toFixed(2));
  const isDeficit = surplus <= 0;

  const recommendedBufferMonths = getRecommendedBufferMonths(income.employmentType, volatilityClass);
  const bufferTargetMonths = buffer.bufferTargetMonthsOverride !== undefined
    ? buffer.bufferTargetMonthsOverride
    : recommendedBufferMonths;
  
  const bufferTargetDollars = Number((bufferTargetMonths * actualNeeds).toFixed(2));

  let currentBufferDollars = 0;
  if (buffer.hasExistingBuffer) {
    if (buffer.currentBufferDollars !== undefined) {
      currentBufferDollars = buffer.currentBufferDollars;
    } else if (buffer.currentBufferMonths !== undefined) {
      currentBufferDollars = Number((buffer.currentBufferMonths * actualNeeds).toFixed(2));
    }
  }

  const bufferGapDollars = Math.max(0, Number((bufferTargetDollars - currentBufferDollars).toFixed(2)));

  let monthlyBufferContribution = 0;
  let investableSurplus = 0;
  let timelineAdjustedMonths: number | undefined = undefined;

  if (!isDeficit) {
    if (bufferGapDollars === 0) {
      monthlyBufferContribution = 0;
      investableSurplus = surplus;
    } else {
      const timeline = buffer.bufferTimelineMonths || 12;
      const requiredMonthly = Number((bufferGapDollars / timeline).toFixed(2));

      if (surplus < requiredMonthly) {
        monthlyBufferContribution = surplus;
        investableSurplus = 0;
        timelineAdjustedMonths = Number((bufferGapDollars / surplus).toFixed(1));
      } else {
        monthlyBufferContribution = requiredMonthly;
        investableSurplus = Number((surplus - requiredMonthly).toFixed(2));
      }
    }

    // Internal assertion test
    const totalAllocated = Number((actualNeeds + actualWants + monthlyBufferContribution + investableSurplus).toFixed(2));
    const delta = Math.abs(totalAllocated - baselineIncome);
    if (delta > 0.05) {
      console.warn(`Assertion warning: Allocated total (${totalAllocated}) differs from baseline income (${baselineIncome}) by ${delta}`);
    }
  } else {
    // Deficit state
    monthlyBufferContribution = 0;
    investableSurplus = 0;
  }

  return {
    baselineIncome,
    volatilityClass,
    actualNeeds,
    actualWants,
    idealNeeds,
    idealWants,
    idealSaveInvest,
    surplus,
    isDeficit,
    deficitAmount: isDeficit ? Number(Math.abs(surplus).toFixed(2)) : undefined,
    bufferTargetMonths,
    bufferTargetDollars,
    currentBufferDollars,
    bufferGapDollars,
    monthlyBufferContribution,
    investableSurplus,
    timelineAdjustedMonths,
  };
}
