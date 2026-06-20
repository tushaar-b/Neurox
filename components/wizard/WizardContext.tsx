"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { IncomeInput, ExpenseInput, BufferInput, InvestingProfile, CalculationResult } from "../../types";
import { runFinancialAssessment } from "../../lib/calculations";

interface WizardState {
  step: number;
  income: IncomeInput;
  expenses: ExpenseInput;
  buffer: BufferInput;
  investing: InvestingProfile;
  errors: Record<string, string>;
  isCompleted: boolean;
  result: CalculationResult | null;
}

interface WizardContextType extends WizardState {
  setStep: (step: number) => void;
  updateIncome: (data: Partial<IncomeInput>) => void;
  updateExpenses: (data: Partial<ExpenseInput>) => void;
  updateBuffer: (data: Partial<BufferInput>) => void;
  updateInvesting: (data: Partial<InvestingProfile>) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  nextStep: () => boolean;
  prevStep: () => void;
  submitWizard: () => void;
  resetWizard: () => void;
}

const defaultIncome: IncomeInput = {
  employmentType: "employed_fixed",
  fixedMonthlyIncome: 50000,
  last6MonthsIncome: [50000, 50000, 50000, 50000, 50000, 50000],
  fallbackEstimate: { min: 40000, avg: 50000, max: 60000 },
};

const defaultExpenses: ExpenseInput = {
  needs: {
    housing: 15000,
    utilities: 3000,
    groceries: 8000,
    transportation: 4000,
    healthInsurance: 2000,
    minDebtPayments: 1000,
    otherNeeds: 0,
  },
  wants: {
    diningOut: 4000,
    entertainment: 2000,
    shopping: 3000,
    travelHobbies: 3000,
    otherWants: 0,
  },
};

const defaultBuffer: BufferInput = {
  hasExistingBuffer: false,
  currentBufferDollars: 0,
  currentBufferMonths: 0,
  bufferTimelineMonths: 12,
};

const defaultInvesting: InvestingProfile = {
  hasInvestedBefore: false,
  experienceLevel: "beginner",
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [step, setStepState] = useState(1);
  const [income, setIncome] = useState<IncomeInput>(defaultIncome);
  const [expenses, setExpenses] = useState<ExpenseInput>(defaultExpenses);
  const [buffer, setBuffer] = useState<BufferInput>(defaultBuffer);
  const [investing, setInvesting] = useState<InvestingProfile>(defaultInvesting);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Restore state from sessionStorage if available (client-side only)
  useEffect(() => {
    const saved = sessionStorage.getItem("budget_wizard_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStepState(parsed.step || 1);
        setIncome(parsed.income || defaultIncome);
        setExpenses(parsed.expenses || defaultExpenses);
        setBuffer(parsed.buffer || defaultBuffer);
        setInvesting(parsed.investing || defaultInvesting);
        if (parsed.isCompleted && parsed.result) {
          setIsCompleted(true);
          setResult(parsed.result);
        }
      } catch (e) {
        console.error("Failed to parse saved wizard state", e);
      }
    }
  }, []);

  // Save state to sessionStorage
  const saveState = (updatedStep: number, inc: IncomeInput, exp: ExpenseInput, buf: BufferInput, inv: InvestingProfile, comp: boolean, res: CalculationResult | null) => {
    sessionStorage.setItem(
      "budget_wizard_state",
      JSON.stringify({ step: updatedStep, income: inc, expenses: exp, buffer: buf, investing: inv, isCompleted: comp, result: res })
    );
  };

  const setStep = (s: number) => {
    setStepState(s);
    saveState(s, income, expenses, buffer, investing, isCompleted, result);
  };

  const updateIncome = (data: Partial<IncomeInput>) => {
    setIncome((prev) => {
      const next = { ...prev, ...data };
      saveState(step, next, expenses, buffer, investing, isCompleted, result);
      return next;
    });
  };

  const updateExpenses = (data: Partial<ExpenseInput>) => {
    setExpenses((prev) => {
      const next = { ...prev, ...data };
      saveState(step, income, next, buffer, investing, isCompleted, result);
      return next;
    });
  };

  const updateBuffer = (data: Partial<BufferInput>) => {
    setBuffer((prev) => {
      const next = { ...prev, ...data };
      saveState(step, income, expenses, next, investing, isCompleted, result);
      return next;
    });
  };

  const updateInvesting = (data: Partial<InvestingProfile>) => {
    setInvesting((prev) => {
      const next = { ...prev, ...data };
      saveState(step, income, expenses, buffer, next, isCompleted, result);
      return next;
    });
  };

  const clearErrors = () => setErrors({});

  const nextStep = () => {
    if (step < 5) {
      const nextS = step + 1;
      setStep(nextS);
      clearErrors();
      return true;
    }
    return false;
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      clearErrors();
    }
  };

  const submitWizard = () => {
    const finalResult = runFinancialAssessment(income, expenses, buffer, investing);
    setResult(finalResult);
    setIsCompleted(true);
    saveState(step, income, expenses, buffer, investing, true, finalResult);
  };

  const resetWizard = () => {
    setStepState(1);
    setIncome(defaultIncome);
    setExpenses(defaultExpenses);
    setBuffer(defaultBuffer);
    setInvesting(defaultInvesting);
    setErrors({});
    setIsCompleted(false);
    setResult(null);
    sessionStorage.removeItem("budget_wizard_state");
  };

  return (
    <WizardContext.Provider
      value={{
        step,
        income,
        expenses,
        buffer,
        investing,
        errors,
        isCompleted,
        result,
        setStep,
        updateIncome,
        updateExpenses,
        updateBuffer,
        updateInvesting,
        setErrors,
        clearErrors,
        nextStep,
        prevStep,
        submitWizard,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
