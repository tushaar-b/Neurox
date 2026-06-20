"use client";

import React from "react";
import { CalculationResult } from "../../types";
import { ShieldCheck, Calendar, HelpCircle, Flame } from "lucide-react";

interface BufferProgressProps {
  result: CalculationResult;
}

export default function BufferProgress({ result }: BufferProgressProps) {
  const {
    bufferTargetMonths,
    bufferTargetDollars,
    currentBufferDollars,
    bufferGapDollars,
    monthlyBufferContribution,
    timelineAdjustedMonths,
    actualNeeds,
  } = result;

  const progressPercent = bufferTargetDollars > 0
    ? Math.min(100, Number(((currentBufferDollars / bufferTargetDollars) * 100).toFixed(1)))
    : 100;

  const monthsCovered = actualNeeds > 0
    ? Number((currentBufferDollars / actualNeeds).toFixed(1))
    : 0;

  return (
    <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wider">Emergency Buffer Progress</h4>
          <p className="text-xs text-[#a89f91]">Track how close you are to completing your volatility-adjusted cash buffer.</p>
        </div>
        <div className="bg-[#151311] border border-[#28231e] px-4 py-2 rounded-xl text-xs flex items-center gap-3 shadow-inner">
          <div>
            <span className="block text-[#a89f91] font-medium leading-none mb-0.5">Current Safety</span>
            <strong className="text-[#f5f0e6] text-sm">{monthsCovered} Months</strong>
          </div>
          <div className="h-4 w-px bg-[#28231e]" />
          <div>
            <span className="block text-[#a89f91] font-medium leading-none mb-0.5">Target Buffer</span>
            <strong className="text-[#f5f0e6] text-sm">{bufferTargetMonths} Months</strong>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-end text-xs font-semibold">
          <span className="text-[#f5f0e6]">Reserves Level</span>
          <span className="text-[#d9b382] font-bold">{progressPercent}% Funded</span>
        </div>
        <div className="h-3.5 bg-[#151311] border border-[#28231e] rounded-full overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#d9b382] to-[#e8cda7] transition-all duration-500 shadow-[0_0_10px_rgba(217,179,130,0.3)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#a89f91] font-mono font-medium px-1">
          <span>₹0 Saved</span>
          <span>₹{currentBufferDollars.toLocaleString("en-IN")} (Current)</span>
          <span>₹{bufferTargetDollars.toLocaleString("en-IN")} (Target)</span>
        </div>
      </div>

      {/* Numerical Gap card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-[#151311] border border-[#28231e] p-4 rounded-2xl flex flex-col justify-between shadow-inner">
          <span className="text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Remaining Deficit</span>
          <div className="mt-2">
            <strong className="text-[#f5f0e6] text-xl font-mono">₹{bufferGapDollars.toLocaleString("en-IN")}</strong>
            <p className="text-[10px] text-[#a89f91] mt-1">Needed to complete your emergency reserve buffer.</p>
          </div>
        </div>
        <div className="bg-[#151311] border border-[#28231e] p-4 rounded-2xl flex flex-col justify-between shadow-inner">
          <span className="text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Monthly Saving Rate</span>
          <div className="mt-2">
            <strong className="text-[#f5f0e6] text-xl font-mono">₹{monthlyBufferContribution.toLocaleString("en-IN")}/mo</strong>
            <p className="text-[10px] text-[#a89f91] mt-1">Contribution from monthly net income surplus.</p>
          </div>
        </div>
      </div>

      {/* Volatility Alert Cases */}
      {timelineAdjustedMonths !== undefined && (
        <div className="p-4 bg-[#151311] border border-[#d97757]/30 rounded-2xl flex gap-3 text-xs text-[#d97757]">
          <Flame size={18} className="shrink-0 mt-0.5 animate-pulse" />
          <div className="leading-relaxed">
            <strong className="text-[#f5f0e6]">Timeline Adjustment Needed:</strong> At your current income surplus, closing your emergency fund gap will take 
            <strong className="text-[#f5f0e6] mx-1">{timelineAdjustedMonths} months</strong> instead of your target timeline. 
            There will be <strong className="text-[#f5f0e6]">no investable surplus</strong> available for markets until this gap is fully closed.
          </div>
        </div>
      )}

      {bufferGapDollars === 0 && (
        <div className="p-4 bg-[#151311] border border-[#7b8c6c]/30 rounded-2xl flex gap-3 text-xs text-[#7b8c6c]">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#f5f0e6]">Safety Reserve Secured:</strong> You have an adequate buffer to cover {bufferTargetMonths} months of your core essentials (₹{bufferTargetDollars.toLocaleString("en-IN")}). 
            100% of your remaining surplus goes directly toward investing and building wealth!
          </div>
        </div>
      )}
    </div>
  );
}
