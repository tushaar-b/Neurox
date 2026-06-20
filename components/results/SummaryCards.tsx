"use client";

import React from "react";
import { CalculationResult } from "../../types";
import { Shield, Sparkles, AlertCircle, Coins } from "lucide-react";

interface SummaryCardsProps {
  result: CalculationResult;
}

export default function SummaryCards({ result }: SummaryCardsProps) {
  const {
    baselineIncome,
    actualNeeds,
    actualWants,
    monthlyBufferContribution,
    investableSurplus,
  } = result;

  const calculatePercent = (amount: number) => {
    if (baselineIncome <= 0) return 0;
    return Number(((amount / baselineIncome) * 100).toFixed(1));
  };

  const cards = [
    {
      title: "Essential Needs",
      amount: actualNeeds,
      percent: calculatePercent(actualNeeds),
      color: "border-[#352f2a] text-[#7b8c6c] bg-[#151311]",
      icon: Shield,
      desc: "Housing, debt, groceries, utility baseline survival costs.",
    },
    {
      title: "Discretionary Wants",
      amount: actualWants,
      percent: calculatePercent(actualWants),
      color: "border-[#352f2a] text-[#a89f91] bg-[#151311]",
      icon: Sparkles,
      desc: "Dining, entertainment, travel, and lifestyle choices.",
    },
    {
      title: "Buffer Contribution",
      amount: monthlyBufferContribution,
      percent: calculatePercent(monthlyBufferContribution),
      color: "border-[#352f2a] text-[#d9b382] bg-[#151311]",
      icon: AlertCircle,
      desc: "Monthly savings to cover safety buffer gap.",
    },
    {
      title: "Investable Surplus",
      amount: investableSurplus,
      percent: calculatePercent(investableSurplus),
      color: "border-[#352f2a] text-[#d97757] bg-[#151311]",
      icon: Coins,
      desc: "Leftover capital available to build long term wealth.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-[#352f2a]`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">{card.title}</span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <span className="block text-3xl font-mono font-bold text-[#f5f0e6]">₹{card.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                  card.percent > 0 ? "bg-[#151311] border border-[#352f2a] text-[#f5f0e6] shadow-inner" : "bg-[#151311] border border-[#28231e] text-[#a89f91]"
                }`}>
                  {card.percent}%
                </span>
                <span className="text-[9px] text-[#a89f91] uppercase tracking-widest font-semibold">of monthly net baseline</span>
              </div>
            </div>
            <p className="text-[11px] text-[#a89f91] mt-4 leading-relaxed border-t border-[#28231e] pt-4">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
