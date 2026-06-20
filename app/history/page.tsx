"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Database, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  title: string;
  summary: string;
  createdTime: string;
  url: string;
}

export default function HistoryPage() {
  const { user, customConfig } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/wizard");
      return;
    }

    const fetchHistory = async () => {
      try {
        const headers: Record<string, string> = {};
        if (customConfig?.apiKey) headers["x-notion-api-key"] = customConfig.apiKey;
        if (customConfig?.usersDbId) headers["x-notion-users-db"] = customConfig.usersDbId;
        if (customConfig?.plansDbId) headers["x-notion-plans-db"] = customConfig.plansDbId;

        const res = await fetch(`/api/history?email=${encodeURIComponent(user.email)}`, {
          headers
        });

        const data = await res.json();
        if (data.success) {
          setPlans(data.plans);
        } else {
          setError(data.error || "Failed to load history.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, customConfig, router]);

  if (!user) return null; // Let the redirect happen

  return (
    <div className="relative min-h-screen w-full bg-[#110f0d] text-[#f5f0e6] font-sans flex flex-col">
      {/* Top Header */}
      <header className="px-10 py-6 flex items-center justify-between sticky top-0 bg-[#110f0d]/95 backdrop-blur z-20 border-b border-[#28231e]">
        <div className="flex items-center gap-4">
          <Link href="/wizard" className="p-2 rounded-lg bg-[#151311] border border-[#28231e] hover:bg-[#1c1917] hover:border-[#352f2a] transition-all text-[#a89f91] hover:text-[#f5f0e6]">
            <ArrowLeft size={18} />
          </Link>
          <h2 className="text-2xl font-serif font-bold text-[#f5f0e6]">Activity History</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7b8c6c] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7b8c6c] animate-pulse" />
          Live Logs Active
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center p-6 md:p-12">
        <div className="max-w-3xl w-full">
          <div className="mb-10 space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-[#f5f0e6]">Notion Database Summary</h1>
            <p className="text-sm text-[#a89f91]">Review financial plans and summaries synced to your Notion database.</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#a89f91]">
              <Loader2 className="w-8 h-8 animate-spin text-[#d9b382] mb-4" />
              <p className="text-sm font-medium">Fetching records from Notion...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#151311] border border-[#d97757]/30 text-[#d97757] rounded-xl text-sm">
              {error}
            </div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center bg-[#151311] border border-[#28231e] rounded-2xl">
              <p className="text-[#a89f91] text-sm">No plans found in your Notion database.</p>
              <Link href="/wizard" className="mt-4 inline-block px-4 py-2 bg-[#d9b382] hover:bg-[#e0d6c8] text-[#110f0d] font-bold text-xs rounded-full transition-all">
                Create a Plan
              </Link>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[1.2rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#d9b382]/50 before:via-[#352f2a] before:to-transparent">
              {plans.map((plan) => {
                const dateStr = new Date(plan.createdTime).toLocaleString();
                return (
                  <div key={plan.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#110f0d] bg-[#d9b382]/10 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Database size={16} className="text-[#d9b382]" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-[#151311] border border-[#28231e] hover:border-[#352f2a] hover:bg-[#1c1917] transition-all shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex flex-col gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-sm text-[#d9b382]">{plan.title}</h3>
                          <time className="text-[10px] font-bold text-[#a89f91] uppercase tracking-wider">{dateStr}</time>
                        </div>
                        <p className="text-sm text-[#a89f91] leading-relaxed line-clamp-4">
                          {plan.summary || "No AI summary available."}
                        </p>
                      </div>
                      
                      {plan.url && (
                        <a 
                          href={plan.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1917] hover:bg-[#28231e] border border-[#352f2a] rounded-lg text-xs font-semibold text-[#f5f0e6] transition-colors"
                        >
                          View in Notion
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
