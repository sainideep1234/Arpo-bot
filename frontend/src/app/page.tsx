"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#f0f0f0] overflow-x-hidden relative">
      {/* Ambient background glow */}
      <div className="ambient-glow" />

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-[20px] bg-[#050505]/70 border-b border-white/[0.06]">
        <div className="max-w-[1100px] mx-auto px-8 h-16 flex items-center justify-between sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-[0_2px_16px_rgba(6,182,212,0.25)]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-[0.04em]">
              ARPO
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-[18px] py-2 text-[13px] font-medium text-[#999] no-underline rounded-full transition-all duration-200 hover:text-white hover:bg-white/[0.06]"
            >
              Admin
            </Link>
            <Link
              href="/auth"
              className="px-[22px] py-[9px] text-[13px] font-semibold text-black bg-white rounded-full no-underline transition-all duration-250 hover:bg-[#e0e0e0] hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(255,255,255,0.1)] active:translate-y-0"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative z-[1] flex flex-col items-center justify-center min-h-[88vh] px-8 pt-[120px] pb-20 text-center sm:px-5 sm:pt-[100px] sm:pb-[60px]">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-9 animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse-dot" />
          <span className="text-xs font-semibold text-[#888] tracking-[0.08em] uppercase">
            AI Scout Assistant
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[clamp(42px,7vw,80px)] font-extrabold leading-[1.05] tracking-[-0.03em] mb-7 max-w-[750px] animate-slide-up [animation-delay:0.1s] sm:text-4xl">
          <span className="text-gradient-hero">
            Master the Art of
            <br />
            Modern Scouting
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg leading-[1.7] text-[#777] max-w-[520px] mb-11 font-normal animate-slide-up [animation-delay:0.2s] sm:text-base">
          Your intelligent companion for the{" "}
          <strong className="text-[#ccc] font-medium">
            Bharat Scouts &amp; Guides
          </strong>
          . Instant access to verified protocols, badge requirements, and field
          guides.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap animate-slide-up [animation-delay:0.3s] sm:flex-col sm:w-full">
          <Link
            href="/auth"
            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full no-underline transition-all duration-300 tracking-[0.01em] shadow-[0_2px_20px_rgba(6,182,212,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_30px_rgba(6,182,212,0.35)] active:translate-y-0 sm:w-full"
          >
            Launch Assistant
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-medium text-[#ccc] bg-white/[0.04] border border-white/10 rounded-full no-underline transition-all duration-250 hover:bg-white/[0.08] hover:border-white/20 hover:text-white hover:-translate-y-px sm:w-full"
          >
            Admin Panel
          </Link>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative z-[1] max-w-[1100px] mx-auto px-8 pt-20 pb-[100px] sm:px-5 sm:pt-[60px] sm:pb-20">
        <div className="grid grid-cols-3 gap-5 md:grid-cols-1 md:gap-4">
          {/* Feature 1 */}
          <div className="p-8 px-7 rounded-[20px] bg-white/[0.02] border border-white/[0.06] transition-all duration-300 animate-slide-up [animation-delay:0.4s] hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5 text-[13px] font-bold tracking-[0.06em] bg-orange-400/10 text-orange-400 border border-orange-400/15">
              01
            </div>
            <h3 className="text-[17px] font-semibold text-[#eee] mb-2.5 tracking-[-0.01em]">
              Verified Knowledge
            </h3>
            <p className="text-sm leading-[1.65] text-[#777]">
              Direct access to official APRO rules and BSG guidelines. Every
              response is grounded in real documents — no hallucinations.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 px-7 rounded-[20px] bg-white/[0.02] border border-white/[0.06] transition-all duration-300 animate-slide-up [animation-delay:0.5s] hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5 text-[13px] font-bold tracking-[0.06em] bg-white/[0.06] text-[#ddd] border border-white/[0.08]">
              02
            </div>
            <h3 className="text-[17px] font-semibold text-[#eee] mb-2.5 tracking-[-0.01em]">
              Badge Tracker
            </h3>
            <p className="text-sm leading-[1.65] text-[#777]">
              Complete requirements for every proficiency badge from Pratham
              Sopan to Rajya Puraskar, organized step by step.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 px-7 rounded-[20px] bg-white/[0.02] border border-white/[0.06] transition-all duration-300 animate-slide-up [animation-delay:0.6s] hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5 text-[13px] font-bold tracking-[0.06em] bg-green-500/10 text-green-500 border border-green-500/15">
              03
            </div>
            <h3 className="text-[17px] font-semibold text-[#eee] mb-2.5 tracking-[-0.01em]">
              Field Ready
            </h3>
            <p className="text-sm leading-[1.65] text-[#777]">
              Optimized for low-bandwidth environments. Access camping
              protocols, first-aid guides, and knot references anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-[1] py-7 px-8 text-center border-t border-white/[0.04]">
        <p className="text-xs text-[#444] tracking-[0.06em] uppercase font-medium">
          © 2024 ARPO Bot • Built for Bharat Scouts &amp; Guides
        </p>
      </footer>
    </div>
  );
}
