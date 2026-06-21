"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import of the GSAP-animated ThreeGlobe component to bypass SSR errors.
const ThreeGlobe = dynamic(
  () => import("../components/ThreeGlobe").then((mod) => mod.ThreeGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-screen flex items-center justify-center bg-[#110f0d]">
        <div className="absolute inset-0 rounded-full bg-[#d9b382]/5 blur-[80px]" />
        <img
          src="/glowing_globe.png"
          alt="Loading Globe"
          className="w-[340px] h-[340px] sm:w-[500px] object-contain opacity-40 rounded-full animate-pulse select-none"
        />
      </div>
    ),
  }
);

export default function Home() {

  return (
    <div id="hero-section" className="relative h-screen w-screen overflow-hidden bg-[#110f0d] text-[#f5f0e6] font-sans">
      {/* Container that locks everything in the viewport */}
      <div className="relative h-full w-full flex flex-col justify-between overflow-hidden">
        
        {/* Dynamic GSAP-enabled ThreeGlobe Component */}
        <ThreeGlobe />

        {/* Header */}
        <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center relative z-40">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 select-none">
            <svg className="w-3.5 h-3.5 text-[#d9b382] fill-[#d9b382]" viewBox="0 0 24 24">
              <path d="M12 2L2 12l10 10 10-10L12 2z" />
            </svg>
            <span className="font-extrabold text-lg tracking-tight text-[#f5f0e6]">
              AarthiAI
            </span>
          </div>

          {/* Navigation Actions — only Get Started */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/wizard"
              className="px-4 py-1.5 bg-[#d9b382] hover:bg-[#e0d6c8] text-[#110f0d] font-extrabold text-xs rounded-full transition-all duration-200 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* STAGE 1: Hero Text overlays the Globe at scrollProgress = 0 */}
        <main
          className="hero-content-container flex-1 flex flex-col items-center justify-center relative w-full px-6 py-12 my-auto z-10 transition-all duration-300 ease-out"
        >
          <div className="relative flex flex-col items-center justify-center text-center max-w-3xl space-y-6">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-[#f5f0e6] select-none">
              Invest Smarter
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f5f0e6] to-[#d9b382]">
                With AI-Powered
              </span>
              <br />
              Intelligence
            </h1>

            <div className="space-y-3 max-w-xl text-[#a89f91] text-xs sm:text-sm md:text-base font-medium leading-relaxed">
              <p>
                Track India's top stocks with real time insights powered by artificial intelligence. Know where you stand in the market.
              </p>
              <p className="text-[#a89f91] opacity-75 font-normal">
                Scroll to explore Mumbai's financial heartbeat.
              </p>
            </div>
          </div>
        </main>

        
        {/* Bottom Scroll prompt - fades out on scroll */}
        <footer
          className="scroll-prompt-container w-full py-8 flex justify-center relative z-25 transition-opacity duration-300 ease-out"
        >
          <div className="flex flex-col items-center gap-2 select-none cursor-pointer">
            <div className="w-[18px] h-[30px] rounded-full border border-[#352f2a] flex justify-center p-1.5">
              <div className="w-[3px] h-[6px] rounded-full bg-[#d9b382] animate-[bounce_1.5s_infinite]" />
            </div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#a89f91] font-bold">
              Scroll to explore
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
