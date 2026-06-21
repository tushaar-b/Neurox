"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardProvider, useWizard } from "../../components/wizard/WizardContext";
import SummaryCards from "../../components/results/SummaryCards";
import AllocationChart from "../../components/results/AllocationChart";
import BufferProgress from "../../components/results/BufferProgress";
import DeficitWarning from "../../components/results/DeficitWarning";
import { RefreshCw, FileText, ArrowLeft, GraduationCap, CheckCircle2, Database, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import NavbarAuth from "../../components/NavbarAuth";
import { getStockRecommendations } from "../../lib/recommendations";

function StockRecommendationsGrid({ investing, result }: { investing: any, result: any }) {
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  
  const recommendations = getStockRecommendations(investing.experienceLevel, result.investableSurplus);
  const allStocks = [...recommendations.buy, ...recommendations.sell];

  useEffect(() => {
    async function fetchPrices() {
      if (allStocks.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/stocks/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stocks: allStocks })
        });
        const data = await res.json();
        if (data.prices) {
          setPrices(data.prices);
        }
      } catch (err) {
        console.error("Failed to fetch prices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, [investing.experienceLevel, result.investableSurplus]);

  if (allStocks.length === 0) return null;

  return (
    <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-4 shadow-xl">
      <h4 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wider flex items-center gap-2">
        <Database size={16} className="text-[#d9b382]" /> TradeSignal PRO - Recommended Trades
      </h4>
      <p className="text-xs text-[#a89f91] border-b border-[#28231e] pb-3">Based on your {investing.experienceLevel} experience level and investable surplus of ₹{result.investableSurplus.toLocaleString("en-IN")}</p>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 size={24} className="animate-spin text-[#d9b382]" />
          <span className="ml-3 text-sm text-[#a89f91]">Fetching Friday Closing Prices...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {recommendations.buy.map((stock, i) => (
            <div key={`buy-${i}`} className="bg-[#151311] border border-[#28231e] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-32 hover:border-[#352f2a] transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-[#f5f0e6] font-serif tracking-wide">{stock}</span>
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md tracking-widest uppercase">BUY</span>
              </div>
              <div className="mt-auto">
                <span className="text-[10px] text-[#a89f91] uppercase tracking-wider">Closing Price</span>
                <div className="text-lg font-mono text-[#f5f0e6]">
                  {prices[stock] !== undefined && prices[stock] !== null ? `₹${Number(prices[stock]).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                </div>
              </div>
            </div>
          ))}
          {recommendations.sell.map((stock, i) => (
            <div key={`sell-${i}`} className="bg-[#151311] border border-[#28231e] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between h-32 hover:border-[#352f2a] transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-[#f5f0e6] font-serif tracking-wide">{stock}</span>
                <span className="text-[10px] font-bold text-[#d97757] bg-[#d97757]/10 px-2 py-1 rounded-md tracking-widest uppercase">SELL</span>
              </div>
              <div className="mt-auto">
                <span className="text-[10px] text-[#a89f91] uppercase tracking-wider">Closing Price</span>
                <div className="text-lg font-mono text-[#f5f0e6]">
                  {prices[stock] !== undefined && prices[stock] !== null ? `₹${Number(prices[stock]).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsContent() {
  const { result, resetWizard, isCompleted, investing, income } = useWizard();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const { user, customConfig } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncUrl, setSyncUrl] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [retrievedSummary, setRetrievedSummary] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoToDashboard = async () => {
    if (!user?.email) return;
    setIsRedirecting(true);
    try {
      const response = await fetch("/api/sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (data.token) {
        window.location.href = `https://final-hack-three.vercel.app/login?token=${data.token}`;
      } else {
        console.error("Failed to fetch SSO token");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRedirecting(false);
    }
  };


  const handleAutoSaveAndFetchSummary = async () => {
    if (!user || !result) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (customConfig) {
        if (customConfig.apiKey) headers["x-notion-api-key"] = customConfig.apiKey;
        if (customConfig.usersDbId) headers["x-notion-users-db"] = customConfig.usersDbId;
        if (customConfig.plansDbId) headers["x-notion-plans-db"] = customConfig.plansDbId;
      }

      const response = await fetch("/api/plan/save", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
          baselineIncome: result.baselineIncome,
          volatilityClass: result.volatilityClass,
          actualNeeds: result.actualNeeds,
          actualWants: result.actualWants,
          bufferTargetMonths: result.bufferTargetMonths,
          bufferTargetDollars: result.bufferTargetDollars,
          currentBufferDollars: result.currentBufferDollars,
          bufferGapDollars: result.bufferGapDollars,
          monthlyBufferContribution: result.monthlyBufferContribution,
          investableSurplus: result.investableSurplus,
          experienceLevel: investing.experienceLevel || "beginner",
          timelineAdjustedMonths: result.timelineAdjustedMonths,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI Advisor Summary");
      }

      setSyncUrl(data.notionPageUrl);
      setRetrievedSummary(data.aiSummary);
    } catch (err: any) {
      console.error(err);
      setSyncError(err.message || "An unexpected error occurred while generating the AI summary.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Wait for context to restore state from sessionStorage
    const timer = setTimeout(() => {
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && user && result && !hasAutoSaved && !syncing && !syncUrl) {
      setHasAutoSaved(true);
      handleAutoSaveAndFetchSummary();
    }
  }, [loading, user, result, hasAutoSaved, syncing, syncUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-[#a89f91]">
        <RefreshCw size={24} className="animate-spin text-[#d9b382]" />
        <span className="text-sm font-semibold">Loading your plan...</span>
      </div>
    );
  }

  // Redirect back if no result exists in session
  if (!result) {
    return (
      <div className="text-center py-16 space-y-6">
        <p className="text-[#a89f91] text-sm">No budget plan was found in this session.</p>
        <button
          onClick={() => router.push("/wizard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d9b382] hover:bg-[#e0d6c8] text-[#110f0d] font-bold rounded-xl transition-all"
        >
          <ArrowLeft size={16} /> Go to Questionnaire
        </button>
      </div>
    );
  }

  // Deficit State
  if (result.isDeficit) {
    return (
      <div className="py-8">
        <DeficitWarning
          result={result}
          onReset={() => {
            resetWizard();
            router.push("/wizard");
          }}
        />
      </div>
    );
  }

  const handleStartOver = () => {
    resetWizard();
    router.push("/");
  };

  // Generate dynamic plain-language summary based on investing profile
  const generateSummary = () => {
    const isBeg = !investing.hasInvestedBefore || investing.experienceLevel === "beginner";
    const isInt = investing.hasInvestedBefore && investing.experienceLevel === "intermediate";
    const isExp = investing.hasInvestedBefore && investing.experienceLevel === "experienced";

    const baseText = `Your conservative baseline net monthly income is calculated at ₹${result.baselineIncome.toLocaleString("en-IN")} based on your ${income.employmentType.replace("_", " ")} profile. `;
    const needsWantsText = `Your actual essential needs sum to ₹${result.actualNeeds.toLocaleString("en-IN")} (${((result.actualNeeds / result.baselineIncome) * 100).toFixed(1)}% of income) and discretionary wants sum to ₹${result.actualWants.toLocaleString("en-IN")} (${((result.actualWants / result.baselineIncome) * 100).toFixed(1)}%). `;

    if (isBeg) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-[#f5f0e6] leading-relaxed">
            {baseText}
            {needsWantsText}
            This leaves you with a monthly surplus of <strong className="text-[#d9b382]">₹{result.surplus.toLocaleString("en-IN")}</strong>. 
            We have allocated <strong className="text-[#d9b382]">₹{result.monthlyBufferContribution.toLocaleString("en-IN")}</strong> of this surplus to build your emergency fund. 
            The remaining <strong className="text-[#d9b382]">₹{result.investableSurplus.toLocaleString("en-IN")}</strong> represents your 
            <strong className="text-[#d9b382]"> investable surplus</strong>.
          </p>
          <div className="bg-[#151311] border border-[#28231e] p-4 rounded-2xl text-xs text-[#a89f91] leading-relaxed space-y-2">
            <span className="font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px] text-[#f5f0e6]">
              <GraduationCap size={14} className="text-[#d9b382]" /> Understanding Investable Surplus
            </span>
            <p>
              An <strong className="text-[#f5f0e6]">investable surplus</strong> is money that is completely free of immediate requirements. It's the cash left over after you've covered all daily survival expenses (Needs), lifestyle desires (Wants), and set aside short-term emergency funds (Buffer). This is the specific capital you should use to buy assets like index funds, stocks, or retirement assets to compile compound interest.
            </p>
          </div>
        </div>
      );
    }

    if (isInt) {
      return (
        <p className="text-sm text-[#f5f0e6] leading-relaxed">
          {baseText}
          {needsWantsText}
          Out of your <strong className="text-[#d9b382]">₹{result.surplus.toLocaleString("en-IN")}</strong> surplus, 
          <strong className="text-[#d9b382]">₹{result.monthlyBufferContribution.toLocaleString("en-IN")}</strong> is directed to complete your emergency buffer, 
          leaving <strong className="text-[#d9b382]">₹{result.investableSurplus.toLocaleString("en-IN")}</strong> as an investable surplus available for markets. 
          Once your buffer gap is closed, your entire surplus will convert into investable capital.
        </p>
      );
    }

    if (isExp) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-[#f5f0e6] leading-relaxed font-mono">
            BASELINE_NET: ₹{result.baselineIncome.toLocaleString("en-IN")} | SURPLUS: ₹{result.surplus.toLocaleString("en-IN")}
            <br />
            ALLOCATION: Needs {((result.actualNeeds / result.baselineIncome) * 100).toFixed(1)}% | Wants {((result.actualWants / result.baselineIncome) * 100).toFixed(1)}% | Buffer {((result.monthlyBufferContribution / result.baselineIncome) * 100).toFixed(1)}% | Investable {((result.investableSurplus / result.baselineIncome) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-[#a89f91]">
            Emergency target of {result.bufferTargetMonths} months (₹{result.bufferTargetDollars.toLocaleString("en-IN")}) has a remaining gap of ₹{result.bufferGapDollars.toLocaleString("en-IN")}, funded at ₹{result.monthlyBufferContribution.toLocaleString("en-IN")}/mo. Investable surplus rate: ₹{result.investableSurplus.toLocaleString("en-IN")}/mo.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10 w-full space-y-10">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-wide text-[#f5f0e6]">Your Budget Allocation</h2>
          <p className="text-sm text-[#a89f91] mt-1">A dynamic plan tailored to your job volatility and income structure.</p>
        </div>
        <button
          onClick={handleStartOver}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1c1917] hover:bg-[#151311] border border-[#352f2a] text-[#a89f91] hover:text-[#f5f0e6] text-sm font-semibold rounded-xl active:scale-[0.98] transition-all"
        >
          <RefreshCw size={14} /> Create New Plan
        </button>
      </div>

      {/* 1. Headline summary cards */}
      <SummaryCards result={result} />

      {/* 2. Visual comparison and Chart */}
      <AllocationChart result={result} />

      {/* 3. Emergency fund progress bar */}
      <BufferProgress result={result} />

      {/* AI Financial Advisor Summary */}
      <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 border-b border-[#28231e] pb-4">
          <div className="p-2 bg-[#151311] border border-[#352f2a] rounded-lg text-[#d9b382]">
            <Database size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wider">AI Financial Advisor Summary</h4>
            <p className="text-xs text-[#a89f91] mt-0.5">Secure cloud-synced diagnostic and wealth building intelligence.</p>
          </div>
        </div>

        {/* Loader or Content */}
        {syncing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-[#a89f91]">
            <RefreshCw size={24} className="animate-spin text-[#d9b382]" />
            <span className="text-xs font-semibold tracking-wide">Generating Advisor summary & saving to database...</span>
          </div>
        ) : retrievedSummary ? (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-[#151311] border-l-4 border-[#d9b382] p-5 rounded-r-2xl text-sm text-[#f5f0e6] leading-relaxed italic relative">
              <span className="absolute -top-3 -left-2 text-4xl text-[#d9b382]/10 font-serif select-none">“</span>
              <p className="pl-2 relative z-10 font-sans tracking-wide">{retrievedSummary}</p>
            </div>
            
            {syncUrl && (
              <div className="flex justify-end">
                <a
                  href={syncUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#352f2a] bg-[#151311] hover:bg-[#1c1917] text-xs font-bold text-[#d9b382] hover:text-[#f5f0e6] rounded-xl transition-all cursor-pointer"
                >
                  View Detailed Report Document ↗
                </a>
              </div>
            )}
          </div>
        ) : syncError ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-[#151311] border border-[#d97757]/30 text-[#d97757] text-xs rounded-xl font-medium">
              Error: {syncError}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAutoSaveAndFetchSummary}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#d9b382] hover:bg-[#e0d6c8] text-[#110f0d] font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Retry Generating Summary
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 py-2">
            <p className="text-xs text-[#a89f91]">No summary generated yet. Your plan calculations will automatically sync.</p>
            <button
              onClick={handleAutoSaveAndFetchSummary}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#d9b382] hover:bg-[#e0d6c8] text-[#110f0d] text-xs font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer"
            >
              Get AI Summary
            </button>
          </div>
        )}
      </div>

      {/* 4. Dynamic plain language summary */}
      <div className="bg-[#1c1917] border border-[#28231e] rounded-3xl p-6 space-y-4 shadow-xl">
        <h4 className="text-sm font-bold text-[#f5f0e6] uppercase tracking-wider flex items-center gap-2">
          <FileText size={16} className="text-[#d9b382]" /> Plan Executive Summary
        </h4>
        <div className="border-t border-[#28231e] pt-4">
          {generateSummary()}
        </div>
      </div>

      {/* 5. Stock Recommendations */}
      {result && result.investableSurplus > 0 && (
        <StockRecommendationsGrid investing={investing} result={result} />
      )}

      {/* Go to Stock Dashboard CTA */}
      <div className="flex justify-center">
        <button
          onClick={handleGoToDashboard}
          disabled={isRedirecting || !user?.email}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-[#d9b382] hover:bg-[#e8c896] text-[#110f0d] font-bold text-sm rounded-2xl shadow-lg shadow-[#d9b382]/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isRedirecting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          )}
          {isRedirecting ? "Connecting..." : "Go to Stock Dashboard"}
          {!isRedirecting && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          )}
        </button>
      </div>

      {/* Internal Assertion Alert */}
      <div className="p-4 bg-[#151311] border border-[#28231e] rounded-2xl flex items-center justify-between gap-4 text-[10px] text-[#a89f91]">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-[#d9b382] shrink-0" />
          <span>Internal Check: Needs + Wants + Buffer + Investable = Baseline Net Income</span>
        </div>
        <span className="font-mono bg-[#1c1917] px-2 py-1 rounded text-[#f5f0e6] border border-[#352f2a]">
          ₹{result.actualNeeds.toLocaleString("en-IN")} + ₹{result.actualWants.toLocaleString("en-IN")} + ₹{result.monthlyBufferContribution.toLocaleString("en-IN")} + ₹{result.investableSurplus.toLocaleString("en-IN")} = ₹{result.baselineIncome.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="relative min-h-screen bg-[#110f0d] text-[#f5f0e6] flex flex-col justify-between overflow-hidden font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center relative z-10 border-b border-[#28231e] bg-[#110f0d]/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded border border-[#352f2a] flex items-center justify-center bg-[#1c1917]">
            <span className="text-[#d9b382] font-bold">A</span>
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-wide leading-tight text-[#f5f0e6]">AARTHIAI</span>
            <p className="text-[9px] uppercase tracking-widest text-[#a89f91] font-semibold mt-0.5">Institutional Grade</p>
          </div>
        </div>
        <NavbarAuth />
      </header>

      {/* Content */}
      <WizardProvider>
        <ResultsContent />
      </WizardProvider>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-[10px] text-[#a89f91] relative z-10 border-t border-[#28231e]">
        AARTHIAI Planning Tool • Confidential Plan Analysis
      </footer>
    </div>
  );
}
