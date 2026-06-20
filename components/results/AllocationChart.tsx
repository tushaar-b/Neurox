"use client";

import React from "react";
import { CalculationResult } from "../../types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";

interface AllocationChartProps {
  result: CalculationResult;
}

export default function AllocationChart({ result }: AllocationChartProps) {
  const {
    baselineIncome,
    actualNeeds,
    actualWants,
    monthlyBufferContribution,
    investableSurplus,
    idealNeeds,
    idealWants,
  } = result;

  const data = [
    { name: "Essential Needs", value: actualNeeds, color: "#7b8c6c" },
    { name: "Discretionary Wants", value: actualWants, color: "#a89f91" },
    { name: "Buffer Contribution", value: monthlyBufferContribution, color: "#d9b382" },
    { name: "Investable Surplus", value: investableSurplus, color: "#d97757" },
  ].filter(item => item.value > 0);

  const calculatePercent = (amount: number) => {
    if (baselineIncome <= 0) return 0;
    return Number(((amount / baselineIncome) * 100).toFixed(1));
  };

  const actualNeedsPercent = calculatePercent(actualNeeds);
  const actualWantsPercent = calculatePercent(actualWants);
  const actualSavePercent = calculatePercent(monthlyBufferContribution + investableSurplus);

  // Delta calculations
  const needsDelta = Number((actualNeedsPercent - 50).toFixed(1));
  const wantsDelta = Number((actualWantsPercent - 30).toFixed(1));
  const saveDelta = Number((actualSavePercent - 20).toFixed(1));

  // Custom tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = calculatePercent(data.value);
      return (
        <div className="bg-[#1c1917] border border-[#352f2a] p-3.5 rounded-xl shadow-2xl">
          <span className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider mb-1">{data.name}</span>
          <strong className="block text-[#f5f0e6] text-base font-mono">₹{data.value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
          <span className="text-xs text-[#d9b382] font-semibold">{pct}% of income</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Recharts Pie/Donut Chart */}
      <div className="lg:col-span-2 bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] shadow-xl">
        <h4 className="text-sm font-bold text-[#f5f0e6] mb-4 uppercase tracking-wider self-start">Allocation Distribution</h4>
        <div className="w-full h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#1c1917" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Inner Text overlay */}
          <div className="absolute text-center">
            <span className="block text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">Baseline Net</span>
            <strong className="block text-2xl font-black font-mono text-[#f5f0e6]">₹{baselineIncome.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
            <span className="text-[10px] text-[#a89f91] font-semibold">/ month</span>
          </div>
        </div>
        {/* Custom Legend */}
        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="truncate">
                <span className="block font-medium text-[#f5f0e6] leading-none mb-0.5">{item.name}</span>
                <span className="text-[10px] font-mono text-[#a89f91]">₹{item.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })} ({calculatePercent(item.value)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 50/30/20 Comparison Strip */}
      <div className="lg:col-span-3 bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-6 flex flex-col justify-between shadow-xl">
        <div>
          <h4 className="text-sm font-bold text-[#f5f0e6] mb-1 uppercase tracking-wider">50/30/20 Ideal Comparison</h4>
          <p className="text-xs text-[#a89f91]">See how your actual allocations deviate from standard rules of thumb.</p>
        </div>

        <div className="space-y-4 my-auto">
          {/* Needs Row */}
          <div className="bg-[#151311] border border-[#28231e] shadow-inner p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f5f0e6]">Needs (Survival)</span>
              <div className="flex items-center gap-2">
                <span className="text-[#a89f91]">Actual: <strong className="text-[#f5f0e6]">{actualNeedsPercent}%</strong></span>
                <span className="text-[#352f2a]">|</span>
                <span className="text-[#a89f91]">Ideal: <strong className="text-[#f5f0e6]">50%</strong></span>
              </div>
            </div>
            {/* Visual Bar comparison */}
            <div className="flex h-2 bg-[#28231e] rounded-full overflow-hidden">
              <div className="bg-[#7b8c6c] rounded-full h-full" style={{ width: `${Math.min(actualNeedsPercent, 100)}%` }} />
            </div>
            {/* Delta Status */}
            <div className="flex justify-between items-center text-[10px] pt-1">
              {needsDelta > 0 ? (
                <span className="text-[#d97757] font-semibold flex items-center gap-1">
                  <ArrowUpRight size={12} /> {needsDelta}% Over Ideal (Needs trimming if possible)
                </span>
              ) : needsDelta < 0 ? (
                <span className="text-[#7b8c6c] font-semibold flex items-center gap-1">
                  <ArrowDownRight size={12} /> {Math.abs(needsDelta)}% Under Ideal (Excellent buffer)
                </span>
              ) : (
                <span className="text-[#a89f91] font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Exactly aligned with 50% guidelines
                </span>
              )}
              <span className="text-[#a89f91] font-mono font-medium">₹{actualNeeds.toLocaleString("en-IN")} vs. ₹{(0.5 * baselineIncome).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Wants Row */}
          <div className="bg-[#151311] border border-[#28231e] shadow-inner p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f5f0e6]">Wants (Lifestyle)</span>
              <div className="flex items-center gap-2">
                <span className="text-[#a89f91]">Actual: <strong className="text-[#f5f0e6]">{actualWantsPercent}%</strong></span>
                <span className="text-[#352f2a]">|</span>
                <span className="text-[#a89f91]">Ideal: <strong className="text-[#f5f0e6]">30%</strong></span>
              </div>
            </div>
            {/* Visual Bar comparison */}
            <div className="flex h-2 bg-[#28231e] rounded-full overflow-hidden">
              <div className="bg-[#a89f91] rounded-full h-full" style={{ width: `${Math.min(actualWantsPercent, 100)}%` }} />
            </div>
            {/* Delta Status */}
            <div className="flex justify-between items-center text-[10px] pt-1">
              {wantsDelta > 0 ? (
                <span className="text-[#d97757] font-semibold flex items-center gap-1">
                  <ArrowUpRight size={12} /> {wantsDelta}% Over Ideal (Consider trimming discretionary expenses)
                </span>
              ) : wantsDelta < 0 ? (
                <span className="text-[#a89f91] font-semibold flex items-center gap-1">
                  <ArrowDownRight size={12} /> {Math.abs(wantsDelta)}% Under Ideal (Conservative lifestyle)
                </span>
              ) : (
                <span className="text-[#a89f91] font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Exactly aligned with 30% guidelines
                </span>
              )}
              <span className="text-[#a89f91] font-mono font-medium">₹{actualWants.toLocaleString("en-IN")} vs. ₹{(0.3 * baselineIncome).toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Savings / Investing Row */}
          <div className="bg-[#151311] border border-[#28231e] shadow-inner p-4 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#f5f0e6]">Savings & Investing (Safety/Surplus)</span>
              <div className="flex items-center gap-2">
                <span className="text-[#a89f91]">Actual: <strong className="text-[#f5f0e6]">{actualSavePercent}%</strong></span>
                <span className="text-[#352f2a]">|</span>
                <span className="text-[#a89f91]">Ideal: <strong className="text-[#f5f0e6]">20%</strong></span>
              </div>
            </div>
            {/* Visual Bar comparison */}
            <div className="flex h-2 bg-[#28231e] rounded-full overflow-hidden">
              <div className="bg-[#d9b382] rounded-full h-full" style={{ width: `${Math.min(actualSavePercent, 100)}%` }} />
            </div>
            {/* Delta Status */}
            <div className="flex justify-between items-center text-[10px] pt-1">
              {saveDelta > 0 ? (
                <span className="text-[#7b8c6c] font-semibold flex items-center gap-1">
                  <ArrowUpRight size={12} /> +{saveDelta}% Surplus over 20% guideline (Supercharged saving)
                </span>
              ) : saveDelta < 0 ? (
                <span className="text-[#d9b382] font-semibold flex items-center gap-1">
                  <ArrowDownRight size={12} /> {saveDelta}% Under Ideal (Consider cutting expenses to increase reserves)
                </span>
              ) : (
                <span className="text-[#a89f91] font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Exactly aligned with 20% guidelines
                </span>
              )}
              <span className="text-[#a89f91] font-mono font-medium">₹{(monthlyBufferContribution + investableSurplus).toLocaleString("en-IN")} vs. ₹{(0.2 * baselineIncome).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#a89f91] italic text-center pt-2">
          Note: Static budgeting assumes 50/30/20 blindly. This dynamic engine recommends actual surplus allocations based on volatility.
        </div>
      </div>
    </div>
  );
}
