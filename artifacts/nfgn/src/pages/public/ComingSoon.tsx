import { useState } from "react";
import { Link } from "wouter";

export function ComingSoon() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Gold top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full">
        {/* Logo */}
        <div className="mb-4">
          <span
            className="font-serif font-bold tracking-tighter"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4rem)", color: "#C9A84C" }}
          >
            NFGN
          </span>
        </div>

        {/* Brand name */}
        <p
          className="uppercase tracking-[0.25em] text-xs mb-12"
          style={{ color: "rgba(201,168,76,0.7)" }}
        >
          New Face Global Network
        </p>

        {/* Divider */}
        <div
          className="w-16 h-px mb-12"
          style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }}
        />

        {/* Headline */}
        <h1
          className="font-serif font-bold mb-6 leading-tight"
          style={{
            fontSize: "clamp(2rem, 6vw, 3.25rem)",
            color: "#ffffff",
          }}
        >
          Something Great
          <br />
          <span style={{ color: "#C9A84C" }}>Is Coming Soon</span>
        </h1>

        {/* Subtext */}
        <p
          className="mb-12 leading-relaxed max-w-md"
          style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.05rem" }}
        >
          We're putting the finishing touches on our platform. Be the first to
          know when we launch.
        </p>

        {/* Email capture */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3 rounded-lg text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: "#ffffff",
              }}
            />
            <button
              type="submit"
              className="px-7 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-opacity hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #a8843b)",
                color: "#0a0a0a",
                whiteSpace: "nowrap",
              }}
            >
              Notify Me
            </button>
          </form>
        ) : (
          <div
            className="px-8 py-4 rounded-lg text-sm font-medium"
            style={{
              background: "rgba(201,168,76,0.12)",
              border: "1px solid rgba(201,168,76,0.35)",
              color: "#C9A84C",
            }}
          >
            Thank you! We'll notify you when we launch.
          </div>
        )}

        {/* Divider */}
        <div
          className="w-16 h-px mt-16 mb-8"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)" }}
        />

        {/* Footer */}
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          &copy; {new Date().getFullYear()} New Face Global Network. All rights reserved.
        </p>

        {/* Hidden admin portal link — subtle, no label */}
        <Link
          href="/login"
          className="mt-6 text-xs transition-colors"
          style={{ color: "rgba(255,255,255,0.12)" }}
        >
          Portal
        </Link>
      </div>

      {/* Gold bottom line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, #C9A84C, transparent)" }}
      />
    </div>
  );
}
