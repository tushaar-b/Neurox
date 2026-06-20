"use client";

import React, { useState, useEffect } from "react";
import { useWizard } from "./WizardContext";
import { Step3BufferSchema, Step4BufferTimelineSchema } from "../../lib/validation";
import { getBaselineIncome, getRecommendedBufferMonths } from "../../lib/calculations";
import { ShieldCheck, CircleDollarSign, CalendarDays, Coins, ShieldAlert, Sparkles } from "lucide-react";

export default function StepBuffer() {
  const { income, expenses, buffer, updateBuffer, nextStep, prevStep, errors, setErrors, clearErrors } = useWizard();
  
  // Calculate default recommendations based on current inputs
  const { volatilityClass } = getBaselineIncome(income);
  const recommendedMonths = getRecommendedBufferMonths(income.employmentType, volatilityClass);
  
  const [method, setMethod] = useState<"dollars" | "months">(buffer.bufferInputMethod || "dollars");
  const [targetMonths, setTargetMonths] = useState<number>(buffer.bufferTargetMonthsOverride || recommendedMonths);
  const [timelineMonths, setTimelineMonths] = useState<number>(buffer.bufferTimelineMonths || 12);

  // Sum needs to show user what 1 month covers
  const monthlyNeeds = Object.values(expenses.needs).reduce((a, b) => a + b, 0);

  // Update wizard context when local target/timeline changes
  useEffect(() => {
    updateBuffer({
      bufferTargetMonthsOverride: targetMonths,
      bufferTimelineMonths: timelineMonths,
    });
  }, [targetMonths, timelineMonths]);

  const handleHasBufferChange = (val: boolean) => {
    updateBuffer({
      hasExistingBuffer: val,
      bufferInputMethod: val ? method : undefined,
      currentBufferDollars: val ? buffer.currentBufferDollars || 0 : 0,
      currentBufferMonths: val ? buffer.currentBufferMonths || 0 : 0,
    });
    clearErrors();
  };

  const handleMethodChange = (m: "dollars" | "months") => {
    setMethod(m);
    updateBuffer({
      bufferInputMethod: m,
      currentBufferDollars: m === "dollars" ? buffer.currentBufferDollars || 0 : undefined,
      currentBufferMonths: m === "months" ? buffer.currentBufferMonths || 0 : undefined,
    });
    clearErrors();
  };

  const handleDollarsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    updateBuffer({ currentBufferDollars: val });
  };

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    updateBuffer({ currentBufferMonths: val });
  };

  const handleNext = () => {
    // Validate Step 3 data
    const step3Data = {
      hasExistingBuffer: buffer.hasExistingBuffer,
      bufferInputMethod: buffer.hasExistingBuffer ? method : undefined,
      currentBufferDollars: buffer.hasExistingBuffer && method === "dollars" ? buffer.currentBufferDollars : undefined,
      currentBufferMonths: buffer.hasExistingBuffer && method === "months" ? buffer.currentBufferMonths : undefined,
    };

    const step4Data = {
      bufferTargetMonthsOverride: targetMonths,
      bufferTimelineMonths: timelineMonths,
    };

    const step3Val = Step3BufferSchema.safeParse(step3Data);
    const step4Val = Step4BufferTimelineSchema.safeParse(step4Data);

    if (!step3Val.success || !step4Val.success) {
      const errMap: Record<string, string> = {};
      if (!step3Val.success) {
        step3Val.error.issues.forEach((err) => {
          const path = err.path.join(".");
          errMap[path || "currentBufferDollars"] = err.message;
        });
      }
      if (!step4Val.success) {
        step4Val.error.issues.forEach((err) => {
          const path = err.path.join(".");
          errMap[path || "bufferTimelineMonths"] = err.message;
        });
      }
      setErrors(errMap);
    } else {
      clearErrors();
      nextStep();
    }
  };

  // Intermediate calculations for live preview
  let currentBufferDollars = 0;
  if (buffer.hasExistingBuffer) {
    if (method === "dollars") {
      currentBufferDollars = buffer.currentBufferDollars || 0;
    } else {
      currentBufferDollars = (buffer.currentBufferMonths || 0) * monthlyNeeds;
    }
  }

  const targetDollars = targetMonths * monthlyNeeds;
  const gapDollars = Math.max(0, targetDollars - currentBufferDollars);
  const monthlySavingsNeeded = gapDollars > 0 ? Number((gapDollars / timelineMonths).toFixed(2)) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <div className="inline-block px-3 py-1 bg-[#1c1917] border border-[#352f2a] rounded-lg text-[#a89f91] text-[10px] font-bold tracking-widest uppercase mb-6">
          Module 03
        </div>
        <h2 className="text-xl md:text-2xl font-serif font-bold tracking-wide text-[#f5f0e6] uppercase">Safety Buffer & Emergency Fund</h2>
        <p className="text-[11px] text-[#a89f91] mt-1 leading-relaxed max-w-md">Configure your emergency reserves target and savings rate.</p>
      </div>

      {/* Helper Card */}
      <div className="bg-[#1c1917] border border-[#352f2a] rounded-2xl p-5 flex items-start gap-4 shadow-md">
        <div className="p-2.5 bg-[#151311] border border-[#352f2a] rounded-xl text-[#d9b382]">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#f5f0e6]">Monthly Needs Benchmark</h4>
          <p className="text-[11px] text-[#a89f91] mt-1 leading-relaxed">
            Your essential expenses are <strong className="text-[#d9b382]">₹{monthlyNeeds.toLocaleString("en-IN")} per month</strong>.
            Your safety buffer is calculated based on this monthly survival rate.
          </p>
        </div>
      </div>

      {/* Part 1: Existing reserves */}
      <div className="space-y-4">
        <label className="block text-[11px] font-medium text-[#a89f91] uppercase tracking-wider">1. Do you have an emergency fund set aside already?</label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleHasBufferChange(true)}
            className={`flex-1 py-3.5 text-center text-sm rounded-xl border font-semibold transition-all duration-300 ${
              buffer.hasExistingBuffer
                ? "bg-[#1c1917] border-[#d9b382] text-[#f5f0e6] shadow-[0_0_15px_rgba(217,179,130,0.1)]"
                : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:border-[#352f2a] hover:bg-[#1a1715]"
            }`}
          >
            Yes, I have savings
          </button>
          <button
            type="button"
            onClick={() => handleHasBufferChange(false)}
            className={`flex-1 py-3.5 text-center text-sm rounded-xl border font-semibold transition-all duration-300 ${
              !buffer.hasExistingBuffer
                ? "bg-[#1c1917] border-[#d9b382] text-[#f5f0e6] shadow-[0_0_15px_rgba(217,179,130,0.1)]"
                : "bg-[#151311] border-[#28231e] text-[#a89f91] hover:border-[#352f2a] hover:bg-[#1a1715]"
            }`}
          >
            No savings yet
          </button>
        </div>
      </div>

      {/* Part 1.5: Amount saved details */}
      {buffer.hasExistingBuffer && (
        <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">How much have you saved?</h4>
            <div className="flex bg-[#151311] border border-[#28231e] p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleMethodChange("dollars")}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  method === "dollars" ? "bg-[#352f2a] text-[#f5f0e6]" : "text-[#a89f91] hover:text-[#f5f0e6]"
                }`}
              >
                In Rupees (₹)
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange("months")}
                className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  method === "months" ? "bg-[#352f2a] text-[#f5f0e6]" : "text-[#a89f91] hover:text-[#f5f0e6]"
                }`}
              >
                In Months
              </button>
            </div>
          </div>

          {method === "dollars" ? (
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-sm">₹</span>
                <input
                  type="number"
                  value={buffer.currentBufferDollars !== undefined ? buffer.currentBufferDollars : ""}
                  onChange={handleDollarsChange}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                />
              </div>
              {errors["currentBufferDollars"] && (
                <p className="text-[#d97757] text-xs">{errors["currentBufferDollars"]}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={buffer.currentBufferMonths !== undefined ? buffer.currentBufferMonths : ""}
                  onChange={handleMonthsChange}
                  placeholder="e.g. 3"
                  className="w-full px-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">Months</span>
              </div>
              {errors["currentBufferDollars"] && (
                <p className="text-[#d97757] text-xs">{errors["currentBufferDollars"]}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Part 2: Buffer target Preferences (Sliders) */}
      <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-6 shadow-xl">
        <h3 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wide border-b border-[#28231e] pb-4 flex items-center gap-2">
          <Sparkles size={14} className="text-[#d9b382]" /> Buffer Targets & Preferences
        </h3>

        {/* Target Months Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="block text-[11px] font-bold text-[#f5f0e6] uppercase tracking-wider mb-1">2. Buffer Target: {targetMonths} Months</span>
              <span className="text-[10px] text-[#a89f91]">
                Recommended: <strong className="text-[#d9b382]">{recommendedMonths} months</strong> based on volatility ({volatilityClass})
              </span>
            </div>
            <div className="text-right">
              <span className="block text-sm font-bold font-mono text-[#f5f0e6]">₹{targetDollars.toLocaleString("en-IN")}</span>
              <span className="text-[10px] uppercase tracking-widest text-[#a89f91]">Target Reserves</span>
            </div>
          </div>
          <input
            type="range"
            min={3}
            max={12}
            step={1}
            value={targetMonths}
            onChange={(e) => setTargetMonths(parseInt(e.target.value))}
            className="w-full h-1 bg-[#28231e] rounded-lg appearance-none cursor-pointer accent-[#d9b382]"
          />
          <div className="flex justify-between text-[9px] text-[#a89f91] uppercase tracking-widest font-semibold px-1">
            <span>3 Months (Min)</span>
            <span>6 Months</span>
            <span>9 Months</span>
            <span>12 Months (Max)</span>
          </div>
        </div>

        {/* Timeline Slider */}
        {gapDollars > 0 ? (
          <div className="space-y-3 pt-6 border-t border-[#28231e]">
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-[11px] font-bold text-[#f5f0e6] uppercase tracking-wider mb-1">3. Build Timeline: {timelineMonths} Months</span>
                <span className="text-[10px] text-[#a89f91]">Time frame to save the remaining gap</span>
              </div>
              <div className="text-right">
                <span className="block text-sm font-bold font-mono text-[#f5f0e6]">₹{monthlySavingsNeeded.toLocaleString("en-IN")}/mo</span>
                <span className="text-[10px] uppercase tracking-widest text-[#a89f91]">Required rate</span>
              </div>
            </div>
            <input
              type="range"
              min={3}
              max={36}
              step={1}
              value={timelineMonths}
              onChange={(e) => setTimelineMonths(parseInt(e.target.value))}
              className="w-full h-1 bg-[#28231e] rounded-lg appearance-none cursor-pointer accent-[#d9b382]"
            />
            <div className="flex justify-between text-[9px] text-[#a89f91] uppercase tracking-widest font-semibold px-1">
              <span>3 Months</span>
              <span>12 Months (Default)</span>
              <span>24 Months</span>
              <span>36 Months</span>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#1c1917] border border-[#d9b382]/30 rounded-2xl flex gap-3 text-[11px] text-[#d9b382]">
            <ShieldCheck size={16} className="shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-[#f5f0e6] mb-1">Reserves fully covered!</strong> Your current savings match or exceed your target buffer of {targetMonths} months. 
              No extra monthly savings are required for the safety fund, freeing up more investable surplus!
            </div>
          </div>
        )}
      </div>

      {/* Summary of buffer calculations */}
      {gapDollars > 0 && (
        <div className="p-5 bg-[#151311] border border-[#28231e] rounded-3xl grid grid-cols-3 gap-4 text-center text-xs shadow-inner">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[#a89f91] font-bold mb-1.5">Target Buffer</span>
            <strong className="text-[#f5f0e6] text-sm font-mono">₹{targetDollars.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[#a89f91] font-bold mb-1.5">Current Savings</span>
            <strong className="text-[#d9b382] text-sm font-mono">₹{currentBufferDollars.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[#a89f91] font-bold mb-1.5">Remaining Gap</span>
            <strong className="text-[#d97757] text-sm font-mono">₹{gapDollars.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      )}

      {errors["bufferTimelineMonths"] && (
        <p className="text-[#d97757] text-xs mt-1 text-center">{errors["bufferTimelineMonths"]}</p>
      )}

      <div className="flex items-center justify-between pt-12">
        <button
          onClick={prevStep}
          className="px-6 py-3 bg-[#151311] hover:bg-[#1a1715] border border-[#352f2a] text-[#a89f91] font-bold text-sm rounded-xl transition-all"
        >
          ← Back
        </button>
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
