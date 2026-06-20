"use client";

import React from "react";
import { useWizard } from "./WizardContext";
import { Step2ExpensesSchema } from "../../lib/validation";
import { ShieldCheck, HeartHandshake, Home, Wifi, ShoppingBag, Car, HeartPulse, CreditCard, Sparkles, Utensils, Tv, Palmtree, HelpCircle } from "lucide-react";

export default function StepExpenses() {
  const { expenses, updateExpenses, nextStep, prevStep, errors, setErrors, clearErrors } = useWizard();

  const handleNeedChange = (key: keyof typeof expenses.needs, val: number) => {
    const nextNeeds = { ...expenses.needs, [key]: val };
    updateExpenses({ needs: nextNeeds });
  };

  const handleWantChange = (key: keyof typeof expenses.wants, val: number) => {
    const nextWants = { ...expenses.wants, [key]: val };
    updateExpenses({ wants: nextWants });
  };

  const handleNext = () => {
    const validation = Step2ExpensesSchema.safeParse(expenses);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        const path = err.path.join(".");
        errMap[path] = err.message;
      });
      setErrors(errMap);
    } else {
      clearErrors();
      nextStep();
    }
  };

  // Real-time sums
  const totalNeeds = Object.values(expenses.needs).reduce((a, b) => a + b, 0);
  const totalWants = Object.values(expenses.wants).reduce((a, b) => a + b, 0);
  const grandTotal = totalNeeds + totalWants;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div>
          <div className="inline-block px-3 py-1 bg-[#1c1917] border border-[#352f2a] rounded-lg text-[#a89f91] text-[10px] font-bold tracking-widest uppercase mb-6">
            Module 02
          </div>
          <h2 className="text-xl md:text-2xl font-serif font-bold tracking-wide text-[#f5f0e6] uppercase">Monthly Expense Breakdown</h2>
          <p className="text-[11px] text-[#a89f91] mt-1 leading-relaxed max-w-md">Let's build your true baseline spending (Needs vs. Wants) to construct an accurate institutional risk profile.</p>
        </div>
        <div className="bg-[#1c1917] border border-[#28231e] rounded-2xl px-5 py-3.5 flex items-center gap-6 text-sm">
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[#a89f91] font-bold mb-0.5">Total Needs</span>
            <span className="font-mono font-medium text-[#f5f0e6]">₹{totalNeeds.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-8 w-px bg-[#352f2a]" />
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[#a89f91] font-bold mb-0.5">Total Wants</span>
            <span className="font-mono font-medium text-[#f5f0e6]">₹{totalWants.toLocaleString("en-IN")}</span>
          </div>
          <div className="h-8 w-px bg-[#352f2a]" />
          <div>
            <span className="block text-[10px] uppercase tracking-widest text-[#d9b382] font-bold mb-0.5">Grand Total</span>
            <span className="font-mono font-bold text-[#d9b382]">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Needs Column */}
        <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#28231e] pb-4">
            <div className="p-2 bg-[#151311] border border-[#352f2a] rounded-lg text-[#d9b382]">
              <ShieldCheck size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wide">Essential Needs</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Housing */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Home size={12} className="text-[#6b635a]" /> Rent / Mortgage + Tax
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.needs.housing || ""}
                    onChange={(e) => handleNeedChange("housing", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>

              {/* Utilities */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Wifi size={12} className="text-[#6b635a]" /> Utilities & Internet
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.needs.utilities || ""}
                    onChange={(e) => handleNeedChange("utilities", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Groceries */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={12} className="text-[#6b635a]" /> Groceries & Essentials
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.needs.groceries || ""}
                    onChange={(e) => handleNeedChange("groceries", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>

              {/* Transportation */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Car size={12} className="text-[#6b635a]" /> Transit & Car Payment
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.needs.transportation || ""}
                    onChange={(e) => handleNeedChange("transportation", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Health Insurance */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse size={12} className="text-[#6b635a]" /> Health & Medical
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.needs.healthInsurance || ""}
                    onChange={(e) => handleNeedChange("healthInsurance", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>

              {/* Debt Minimums */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={12} className="text-[#6b635a]" /> Min Debt Payments
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.needs.minDebtPayments || ""}
                    onChange={(e) => handleNeedChange("minDebtPayments", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>
            </div>

            {/* Other Needs */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={12} className="text-[#6b635a]" /> Other Uncategorized Needs
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                <input
                  type="number"
                  value={expenses.needs.otherNeeds || ""}
                  onChange={(e) => handleNeedChange("otherNeeds", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wants Column */}
        <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-[#28231e] pb-4">
            <div className="p-2 bg-[#151311] border border-[#352f2a] rounded-lg text-[#f5f0e6]">
              <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wide">Discretionary Wants</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dining Out */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils size={12} className="text-[#6b635a]" /> Dining Out & Takeout
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.wants.diningOut || ""}
                    onChange={(e) => handleWantChange("diningOut", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>

              {/* Entertainment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Tv size={12} className="text-[#6b635a]" /> Subscriptions & Fun
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.wants.entertainment || ""}
                    onChange={(e) => handleWantChange("entertainment", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shopping */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={12} className="text-[#6b635a]" /> Non-Essential Shopping
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.wants.shopping || ""}
                    onChange={(e) => handleWantChange("shopping", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>

              {/* Travel */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                  <Palmtree size={12} className="text-[#6b635a]" /> Travel & Hobbies
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                  <input
                    type="number"
                    value={expenses.wants.travelHobbies || ""}
                    onChange={(e) => handleWantChange("travelHobbies", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                  />
                </div>
              </div>
            </div>

            {/* Other Wants */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[#a89f91] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle size={12} className="text-[#6b635a]" /> Other Discretionary Wants
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b635a] text-xs">₹</span>
                <input
                  type="number"
                  value={expenses.wants.otherWants || ""}
                  onChange={(e) => handleWantChange("otherWants", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-6 pr-3 py-2.5 bg-[#151311] border border-[#28231e] rounded-lg text-sm text-[#f5f0e6] font-mono focus:border-[#d9b382] focus:ring-1 focus:ring-[#d9b382] outline-none transition-all placeholder:text-[#352f2a]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-[#2a1a1a] border border-[#4a2a2a] rounded-xl text-xs text-[#d97757]">
          Please check your entries. All fields should contain valid non-negative numbers.
        </div>
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
