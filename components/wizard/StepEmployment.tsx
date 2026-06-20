"use client";

import React, { useState } from "react";
import { useWizard } from "./WizardContext";
import { Step1EmploymentSchema } from "../../lib/validation";
import { Briefcase, BarChart, User, Layers, Info } from "lucide-react";

export default function StepEmployment() {
  const { income, updateIncome, nextStep, errors, setErrors, clearErrors } = useWizard();
  const [useFallbackLocal, setUseFallbackLocal] = useState(income.useFallback || false);

  const empTypes = [
    { id: "employed_fixed", label: "Employed (fixed salary)", desc: "Stable monthly take-home salary", icon: Briefcase },
    { id: "employed_variable", label: "Employed (variable)", desc: "Commission/bonus-heavy income", icon: BarChart },
    { id: "self_employed", label: "Self-employed / Freelance", desc: "Contractor, freelancer, business owner", icon: User },
    { id: "mixed", label: "Mixed income", desc: "Multiple income streams or side gigs", icon: Layers },
  ] as const;

  const handleTypeSelect = (type: typeof empTypes[number]["id"]) => {
    updateIncome({ employmentType: type });
    clearErrors();
  };

  const handleFixedIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    updateIncome({ fixedMonthlyIncome: val });
  };

  const handleMonthIncomeChange = (index: number, val: number) => {
    const current = [...(income.last6MonthsIncome || [0, 0, 0, 0, 0, 0])];
    current[index] = val;
    updateIncome({ last6MonthsIncome: current });
  };

  const handleFallbackChange = (key: "min" | "avg" | "max", val: number) => {
    const fallback = { ...(income.fallbackEstimate || { min: 0, avg: 0, max: 0 }) };
    fallback[key] = val;
    updateIncome({ fallbackEstimate: fallback });
  };

  const toggleFallback = () => {
    const nextVal = !useFallbackLocal;
    setUseFallbackLocal(nextVal);
    updateIncome({ useFallback: nextVal });
    clearErrors();
  };

  const handleNext = () => {
    const dataToValidate = {
      employmentType: income.employmentType,
      fixedMonthlyIncome: income.employmentType === "employed_fixed" ? income.fixedMonthlyIncome : undefined,
      last6MonthsIncome: income.employmentType !== "employed_fixed" && !useFallbackLocal ? income.last6MonthsIncome : undefined,
      useFallback: income.employmentType !== "employed_fixed" ? useFallbackLocal : undefined,
      fallbackEstimate: income.employmentType !== "employed_fixed" && useFallbackLocal ? income.fallbackEstimate : undefined,
    };

    const validation = Step1EmploymentSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errMap[path || "employmentType"] = err.message;
      });
      setErrors(errMap);
    } else {
      clearErrors();
      nextStep();
    }
  };

  const isVariable = income.employmentType !== "employed_fixed";
  const months = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <div className="inline-block px-3 py-1 bg-[#1c1917] border border-[#352f2a] rounded-lg text-[#a89f91] text-[10px] font-bold tracking-widest uppercase mb-6">
          Module 01
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-bold tracking-wide text-[#f5f0e6] uppercase">Select Income Type</h2>
      </div>

      {/* Employment type grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {empTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = income.employmentType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => handleTypeSelect(type.id)}
              className={`flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 ${
                isSelected
                  ? "bg-[#1c1917] border-[#d9b382] shadow-[0_0_20px_rgba(217,179,130,0.08)] text-[#f5f0e6]"
                  : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:border-[#352f2a] hover:bg-[#1a1715]"
              }`}
            >
              <div className={`p-2.5 rounded-lg mb-4 ${isSelected ? "bg-[#d9b382] text-[#110f0d]" : "bg-[#1c1917] border border-[#28231e] text-[#a89f91]"}`}>
                <Icon size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#f5f0e6] mb-1.5">{type.label}</h4>
                <p className="text-[11px] leading-relaxed text-[#a89f91]">{type.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Input fields */}
      <div className="pt-4">
        <h3 className="text-[11px] uppercase tracking-widest font-bold text-[#a89f91] mb-4">Net Monthly Income (Take-home)</h3>
        
        {!isVariable ? (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a89f91] font-medium">₹</span>
              <input
                type="number"
                value={income.fixedMonthlyIncome || ""}
                onChange={handleFixedIncomeChange}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3.5 bg-[#151311] border border-[#28231e] rounded-xl focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] text-[#f5f0e6] font-mono outline-none transition-all placeholder:text-[#352f2a]"
              />
            </div>
            <p className="text-[11px] text-[#a89f91]">Post-tax income excluding any irregular bonuses.</p>
            {errors["fixedMonthlyIncome"] && (
              <p className="text-[#d97757] text-xs mt-1">{errors["fixedMonthlyIncome"]}</p>
            )}
          </div>
        ) : (
          <div className="space-y-6 bg-[#1c1917] border border-[#28231e] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#28231e] pb-4 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#f5f0e6]">Variable Income Assessment</h3>
                <p className="text-[11px] text-[#a89f91] mt-1">Please provide income details for volatility calculation.</p>
              </div>
              <button
                type="button"
                onClick={toggleFallback}
                className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  useFallbackLocal
                    ? "bg-[#151311] border-[#d9b382]/50 text-[#d9b382]"
                    : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:text-[#f5f0e6]"
                }`}
              >
                {useFallbackLocal ? "Switch to 6-Months Data" : "I don't have exact figures"}
              </button>
            </div>

            {!useFallbackLocal ? (
              <div>
                <p className="text-[11px] text-[#d9b382] flex items-center gap-1.5 mb-4">
                  <Info size={14} /> Provide take-home income for the last 6 months to determine volatility.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {months.map((month, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="block text-[11px] font-medium text-[#a89f91] uppercase tracking-wider">{month}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                        <input
                          type="number"
                          value={income.last6MonthsIncome?.[idx] || ""}
                          onChange={(e) => handleMonthIncomeChange(idx, parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors["employmentType"] && !income.last6MonthsIncome && (
                  <p className="text-[#d97757] text-xs mt-2">{errors["employmentType"]}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-[#d9b382] flex items-center gap-1.5 mb-4">
                  <Info size={14} /> Since data is incomplete, we will use a conservative volatility class assumption.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-[#a89f91] uppercase tracking-wider">Min Income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                      <input
                        type="number"
                        value={income.fallbackEstimate?.min || ""}
                        onChange={(e) => handleFallbackChange("min", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-[#a89f91] uppercase tracking-wider">Avg Income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                      <input
                        type="number"
                        value={income.fallbackEstimate?.avg || ""}
                        onChange={(e) => handleFallbackChange("avg", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-[#a89f91] uppercase tracking-wider">Max Income</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                      <input
                        type="number"
                        value={income.fallbackEstimate?.max || ""}
                        onChange={(e) => handleFallbackChange("max", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                      />
                    </div>
                  </div>
                </div>
                {errors["employmentType"] && (
                  <p className="text-[#d97757] text-xs mt-2">{errors["employmentType"]}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-12">
        <div className="flex items-center gap-2 text-[11px] text-[#a89f91]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#352f2a]" />
          <span>Auto-saving progress</span>
        </div>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-6 py-3 bg-[#e0d6c8] hover:bg-[#f5f0e6] active:bg-[#d9b382] text-[#110f0d] font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(224,214,200,0.15)]"
        >
          Continue <span className="ml-1">→</span>
        </button>
      </div>
    </div>
  );
}
