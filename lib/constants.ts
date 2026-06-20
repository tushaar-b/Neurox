import { EmploymentType, VolatilityClass } from "../types";

export const VOLATILITY_THRESHOLDS = {
  STABLE: 0.10,
  MODERATE: 0.25,
  VARIABLE: 0.50,
};

export const DEFAULT_BUFFER_TABLE: Record<EmploymentType, Record<VolatilityClass, number>> = {
  employed_fixed: {
    stable: 3,
    moderate: 4,
    variable: 5,
    highly_variable: 6,
  },
  employed_variable: {
    stable: 3,
    moderate: 4,
    variable: 5,
    highly_variable: 6,
  },
  self_employed: {
    stable: 5,
    moderate: 6,
    variable: 7,
    highly_variable: 9,
  },
  mixed: {
    stable: 5,
    moderate: 6,
    variable: 7,
    highly_variable: 7,
  },
};
