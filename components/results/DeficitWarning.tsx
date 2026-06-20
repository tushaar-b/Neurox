"use client";

import React from "react";
import { CalculationResult } from "../../types";
import { AlertTriangle, TrendingUp, CheckCircle, RefreshCw, Scissors, Sparkles } from "lucide-react";

interface DeficitWarningProps {
  result: CalculationResult;
  onReset: () => void;
}

export default function DeficitWarning({ result, onReset }: DeficitWarningProps) {
  const {
    baselineIncome,
    actualNeeds,
    actualWants,
    idealNeeds,
    idealWants,
    deficitAmount,
  } = result;

  const needsVariance = actualNeeds - idealNeeds;
  const wantsVariance = actualWants - idealWants;

  // Find the primary driver of the deficit
  let primaryDriver: "needs" | "wants" | "both" = "both";
  let recommendation = "";

  if (needsVariance > 0 && wantsVariance > 0) {
    primaryDriver = "both";
    recommendation = "Both your essential needs and discretionary wants exceed the 50/30/20 guidelines. Start by trimming Wants (lifestyle expenses) since they are easier to cut immediately, then review Needs (housing, debt payments) for structural reduction.";
  } else if (wantsVariance > needsVariance && wantsVariance > 0) {
    primaryDriver = "wants";
    recommendation = `Your discretionary Wants are the primary driver of your deficit, exceeding the guideline by ₹${wantsVariance.toLocaleString("en-IN")} (+${((wantsVariance / baselineIncome) * 100).toFixed(1)}%). Focus on cutting non-essentials like dining out, entertainment, and shopping to return to a positive surplus.`;
  } else if (needsVariance > wantsVariance && needsVariance > 0) {
    primaryDriver = "needs";
    recommendation = `Your essential Needs are the primary driver of your deficit, exceeding the guideline by ₹${needsVariance.toLocaleString("en-IN")} (+${((needsVariance / baselineIncome) * 105).toFixed(0)}%). Since essential costs are harder to trim, look at refinancing debt, finding lower-cost utilities, or down-scaling housing costs.`;
  } else {
    // Both are within absolute guidelines but total exceeds due to small baseline or other factor
    primaryDriver = "wants";
    recommendation = "Your expenses exceed your conservative baseline income. Focus on trimming discretionary lifestyle expenses (Wants) first to build a positive margin.";
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1c1917] border border-[#d97757]/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-[#151311] border border-[#d97757]/30 rounded-2xl flex items-center justify-center text-[#d97757]">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-black text-[#f5f0e6]">Negative Cash Margin</h2>
          <p className="text-[#a89f91] text-sm max-w-md mx-auto">
            Your monthly spending exceeds your conservative baseline income. We cannot calculate safety buffers or investing plans until you have a surplus.
          </p>
        </div>

        {/* Deficit detail card */}
        <div className="bg-[#151311] border border-[#28231e] rounded-2xl p-6 grid grid-cols-2 gap-4 divide-x divide-[#28231e] max-w-sm mx-auto shadow-inner">
          <div>
            <span className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Baseline Income</span>
            <strong className="text-[#f5f0e6] text-lg font-mono">₹{baselineIncome.toLocaleString("en-IN")}</strong>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Monthly Deficit</span>
            <strong className="text-[#d97757] text-lg font-mono">₹{deficitAmount?.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* Breakdown and diagnosis card */}
      <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-6 shadow-xl">
        <h3 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wider border-b border-[#28231e] pb-4 flex items-center gap-2">
          <Scissors size={16} className="text-[#d97757]" /> Expense Diagnosis
        </h3>

        {/* Grid showing actual vs ideal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#151311] p-4 rounded-xl border border-[#28231e] shadow-inner">
            <span className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider mb-1">Essential Needs</span>
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold font-mono text-[#f5f0e6]">₹{actualNeeds.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-[#a89f91]">vs ₹{idealNeeds.toLocaleString("en-IN")} (Ideal)</span>
            </div>
            <div className="mt-2 text-[10px] font-semibold">
              {needsVariance > 0 ? (
                <span className="text-[#d97757] flex items-center gap-0.5">
                  <TrendingUp size={12} /> +₹{needsVariance.toLocaleString("en-IN")} Over Ideal
                </span>
              ) : (
                <span className="text-[#7b8c6c] flex items-center gap-0.5">
                  <CheckCircle size={12} /> Under Ideal by ₹{Math.abs(needsVariance).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#151311] p-4 rounded-xl border border-[#28231e] shadow-inner">
            <span className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider mb-1">Discretionary Wants</span>
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold font-mono text-[#f5f0e6]">₹{actualWants.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-[#a89f91]">vs ₹{idealWants.toLocaleString("en-IN")} (Ideal)</span>
            </div>
            <div className="mt-2 text-[10px] font-semibold">
              {wantsVariance > 0 ? (
                <span className="text-[#d97757] flex items-center gap-0.5">
                  <TrendingUp size={12} /> +₹{wantsVariance.toLocaleString("en-IN")} Over Ideal
                </span>
              ) : (
                <span className="text-[#7b8c6c] flex items-center gap-0.5">
                  <CheckCircle size={12} /> Under Ideal by ₹{Math.abs(wantsVariance).toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actionable recommendation */}
        <div className="p-4 bg-[#151311] border border-[#d9b382]/30 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-[#d9b382] flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles size={14} /> Tactical recommendation
          </h4>
          <p className="text-[11px] text-[#f5f0e6] leading-relaxed">{recommendation}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-[#1c1917] hover:bg-[#151311] border border-[#352f2a] text-[#f5f0e6] font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <RefreshCw size={14} /> Edit Questionnaire
        </button>
      </div>
    </div>
  );
}
