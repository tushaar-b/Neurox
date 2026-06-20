"use client";

import React from "react";
import { useWizard } from "./WizardContext";
import { Step5InvestingSchema } from "../../lib/validation";
import { LineChart, BookOpen, GraduationCap, Trophy } from "lucide-react";

export default function StepInvesting() {
  const { investing, updateInvesting, prevStep, submitWizard, errors, setErrors, clearErrors } = useWizard();

  const handleHasInvestedChange = (val: boolean) => {
    updateInvesting({
      hasInvestedBefore: val,
      experienceLevel: val ? investing.experienceLevel || "beginner" : undefined,
    });
    clearErrors();
  };

  const handleLevelSelect = (level: "beginner" | "intermediate" | "experienced") => {
    updateInvesting({ experienceLevel: level });
    clearErrors();
  };

  const handleSubmit = () => {
    const dataToValidate = {
      hasInvestedBefore: investing.hasInvestedBefore,
      experienceLevel: investing.hasInvestedBefore ? investing.experienceLevel : undefined,
    };

    const validation = Step5InvestingSchema.safeParse(dataToValidate);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errMap[path || "experienceLevel"] = err.message;
      });
      setErrors(errMap);
    } else {
      clearErrors();
      submitWizard();
    }
  };

  const levels = [
    { id: "beginner", label: "Beginner", desc: "Just getting started, would like basic definitions and learning resources.", icon: BookOpen },
    { id: "intermediate", label: "Intermediate", desc: "Understand basic concepts (mutual funds, ETFs, stocks), need standard summaries.", icon: GraduationCap },
    { id: "experienced", label: "Experienced", desc: "Regular investor looking for direct numbers and advanced context.", icon: Trophy },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <div className="inline-block px-3 py-1 bg-[#1c1917] border border-[#352f2a] rounded-lg text-[#a89f91] text-[10px] font-bold tracking-widest uppercase mb-6">
          Module 04
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-bold tracking-wide text-[#f5f0e6] uppercase">Investing Profile</h2>
        <p className="text-[11px] text-[#a89f91] mt-1 leading-relaxed max-w-md">Tell us about your background so we can tailor our explanations.</p>
      </div>

      {/* Yes/No buttons */}
      <div className="space-y-4">
        <label className="block text-[11px] font-medium text-[#a89f91] uppercase tracking-wider">Have you invested in financial markets before?</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleHasInvestedChange(true)}
            className={`flex-1 py-4 text-center rounded-2xl border font-semibold transition-all duration-300 ${
              investing.hasInvestedBefore
                ? "bg-[#1c1917] border-[#d9b382] text-[#f5f0e6] shadow-[0_0_15px_rgba(217,179,130,0.1)]"
                : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:border-[#352f2a] hover:bg-[#1a1715]"
            }`}
          >
            Yes, I have
          </button>
          <button
            type="button"
            onClick={() => handleHasInvestedChange(false)}
            className={`flex-1 py-4 text-center rounded-2xl border font-semibold transition-all duration-300 ${
              !investing.hasInvestedBefore
                ? "bg-[#1c1917] border-[#d9b382] text-[#f5f0e6] shadow-[0_0_15px_rgba(217,179,130,0.1)]"
                : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:border-[#352f2a] hover:bg-[#1a1715]"
            }`}
          >
            No, I haven't
          </button>
        </div>
      </div>

      {/* Conditionally reveal levels */}
      {investing.hasInvestedBefore && (
        <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-[11px] font-bold text-[#f5f0e6] uppercase tracking-wider border-b border-[#28231e] pb-4">
            How would you describe your experience level?
          </h3>
          <div className="grid grid-cols-1 gap-4 pt-2">
            {levels.map((level) => {
              const Icon = level.icon;
              const isSelected = investing.experienceLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => handleLevelSelect(level.id)}
                  className={`flex items-center text-left p-5 rounded-xl border transition-all duration-300 ${
                    isSelected
                      ? "bg-[#151311] border-[#d9b382] text-[#f5f0e6] shadow-[0_0_15px_rgba(217,179,130,0.08)]"
                      : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:border-[#352f2a]"
                  }`}
                >
                  <div className={`p-3 rounded-lg mr-4 ${isSelected ? "bg-[#d9b382] text-[#110f0d]" : "bg-[#1c1917] border border-[#352f2a] text-[#a89f91]"}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[#f5f0e6] mb-1">{level.label}</h4>
                    <p className="text-[11px] text-[#a89f91] leading-relaxed max-w-md">{level.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors["experienceLevel"] && (
            <p className="text-[#d97757] text-xs mt-2">{errors["experienceLevel"]}</p>
          )}
        </div>
      )}

      {/* Disclaimer details */}
      <div className="p-4 bg-[#151311] border border-[#28231e] rounded-2xl flex gap-3 text-[10px] text-[#a89f91] shadow-inner mt-4">
        <LineChart size={16} className="shrink-0 mt-0.5 text-[#d9b382]" />
        <div className="leading-relaxed">
          This tool is for <strong className="text-[#f5f0e6]">financial literacy and planning purposes</strong> only. We do not provide specific brokerage recommendations or trading execution.
        </div>
      </div>

      <div className="flex items-center justify-between pt-12">
        <button
          onClick={prevStep}
          className="px-6 py-3 bg-[#151311] hover:bg-[#1a1715] border border-[#352f2a] text-[#a89f91] font-bold text-sm rounded-xl transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-3 bg-[#e0d6c8] hover:bg-[#f5f0e6] active:bg-[#d9b382] text-[#110f0d] font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(224,214,200,0.15)]"
        >
          Generate Budget Plan <span className="ml-1">→</span>
        </button>
      </div>
    </div>
  );
}
