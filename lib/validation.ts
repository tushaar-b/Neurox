import { z } from "zod";

export const Step1EmploymentSchema = z.object({
  employmentType: z.enum(["employed_fixed", "employed_variable", "self_employed", "mixed"]),
  fixedMonthlyIncome: z.number().min(0, "Income must be a non-negative number").optional(),
  last6MonthsIncome: z.array(z.number().min(0, "Income must be a non-negative number")).optional(),
  useFallback: z.boolean().optional(),
  fallbackEstimate: z.object({
    min: z.number().min(0, "Minimum estimate must be a non-negative number"),
    avg: z.number().min(0, "Average estimate must be a non-negative number"),
    max: z.number().min(0, "Maximum estimate must be a non-negative number"),
  }).optional(),
}).refine((data) => {
  if (data.employmentType === "employed_fixed") {
    return data.fixedMonthlyIncome !== undefined && data.fixedMonthlyIncome >= 0;
  } else {
    if (data.useFallback) {
      return (
        data.fallbackEstimate !== undefined &&
        data.fallbackEstimate.min >= 0 &&
        data.fallbackEstimate.avg >= data.fallbackEstimate.min &&
        data.fallbackEstimate.max >= data.fallbackEstimate.avg
      );
    } else {
      return (
        data.last6MonthsIncome !== undefined &&
        data.last6MonthsIncome.length === 6 &&
        data.last6MonthsIncome.every(x => x >= 0)
      );
    }
  }
}, {
  message: "Please fill out all income details correctly.",
  path: ["employmentType"],
});

export const Step2ExpensesSchema = z.object({
  needs: z.object({
    housing: z.number().min(0, "Amount must be at least 0"),
    utilities: z.number().min(0, "Amount must be at least 0"),
    groceries: z.number().min(0, "Amount must be at least 0"),
    transportation: z.number().min(0, "Amount must be at least 0"),
    healthInsurance: z.number().min(0, "Amount must be at least 0"),
    minDebtPayments: z.number().min(0, "Amount must be at least 0"),
    otherNeeds: z.number().min(0, "Amount must be at least 0"),
  }),
  wants: z.object({
    diningOut: z.number().min(0, "Amount must be at least 0"),
    entertainment: z.number().min(0, "Amount must be at least 0"),
    shopping: z.number().min(0, "Amount must be at least 0"),
    travelHobbies: z.number().min(0, "Amount must be at least 0"),
    otherWants: z.number().min(0, "Amount must be at least 0"),
  }),
});

export const Step3BufferSchema = z.object({
  hasExistingBuffer: z.boolean(),
  bufferInputMethod: z.enum(["dollars", "months"]).optional(),
  currentBufferDollars: z.number().min(0, "Amount must be at least 0").optional(),
  currentBufferMonths: z.number().min(0, "Months must be at least 0").optional(),
}).refine((data) => {
  if (!data.hasExistingBuffer) return true;
  if (data.bufferInputMethod === "dollars") {
    return data.currentBufferDollars !== undefined && data.currentBufferDollars >= 0;
  }
  if (data.bufferInputMethod === "months") {
    return data.currentBufferMonths !== undefined && data.currentBufferMonths >= 0;
  }
  return false;
}, {
  message: "Please enter your existing buffer amount.",
  path: ["currentBufferDollars"],
});

export const Step4BufferTimelineSchema = z.object({
  bufferTargetMonthsOverride: z.number().min(3).max(12).optional(),
  bufferTimelineMonths: z.number().min(3).max(36, "Timeline must be between 3 and 36 months"),
});

export const Step5InvestingSchema = z.object({
  hasInvestedBefore: z.boolean(),
  experienceLevel: z.enum(["beginner", "intermediate", "experienced"]).optional(),
}).refine((data) => {
  if (data.hasInvestedBefore) {
    return data.experienceLevel !== undefined;
  }
  return true;
}, {
  message: "Please select your experience level.",
  path: ["experienceLevel"],
});

// A complete schema for final validation check
export const FullWizardSchema = z.object({
  income: Step1EmploymentSchema,
  expenses: Step2ExpensesSchema,
  buffer: Step3BufferSchema,
  bufferTimeline: Step4BufferTimelineSchema,
  investing: Step5InvestingSchema,
});
