"use client";

import Link from "next/link";
import s from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={s.page}>
      {/* Ambient background glow */}
      <div className={s.ambientGlow} />

      {/* ─── Navbar ─── */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <div className={s.navLogo}>
            <div className={s.logoCircle}>
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
            <span className={s.logoText}>ARPO</span>
          </div>

          <div className={s.navLinks}>
            <Link href="/admin" className={s.navLink}>
              Admin
            </Link>
            <Link href="/auth" className={s.navCta}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className={s.hero}>
        <div className={s.heroPill}>
          <span className={s.heroPillDot} />
          <span className={s.heroPillText}>AI Scout Assistant</span>
        </div>

        <h1 className={s.heroTitle}>
          <span className={s.heroTitleGradient}>
            Master the Art of
            <br />
            Modern Scouting
          </span>
        </h1>

        <p className={s.heroDesc}>
          Your intelligent companion for the{" "}
          <strong>Bharat Scouts & Guides</strong>. Instant access to verified
          protocols, badge requirements, and field guides.
        </p>

        <div className={s.heroButtons}>
          <Link href="/auth" className={s.btnPrimary}>
            Launch Assistant
          </Link>
          <Link href="/admin" className={s.btnSecondary}>
            Admin Panel
          </Link>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className={s.features}>
        <div className={s.featuresGrid}>
          <div className={s.featureCard}>
            <div className={`${s.featureIcon} ${s.featureIconVerified}`}>
              01
            </div>
            <h3 className={s.featureTitle}>Verified Knowledge</h3>
            <p className={s.featureDesc}>
              Direct access to official APRO rules and BSG guidelines. Every
              response is grounded in real documents — no hallucinations.
            </p>
          </div>

          <div className={s.featureCard}>
            <div className={`${s.featureIcon} ${s.featureIconBadge}`}>02</div>
            <h3 className={s.featureTitle}>Badge Tracker</h3>
            <p className={s.featureDesc}>
              Complete requirements for every proficiency badge from Pratham
              Sopan to Rajya Puraskar, organized step by step.
            </p>
          </div>

          <div className={s.featureCard}>
            <div className={`${s.featureIcon} ${s.featureIconField}`}>03</div>
            <h3 className={s.featureTitle}>Field Ready</h3>
            <p className={s.featureDesc}>
              Optimized for low-bandwidth environments. Access camping
              protocols, first-aid guides, and knot references anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className={s.footer}>
        <p className={s.footerText}>
          © 2024 ARPO Bot • Built for Bharat Scouts & Guides
        </p>
      </footer>
    </div>
  );
}
