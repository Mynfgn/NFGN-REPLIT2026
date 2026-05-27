import { useState } from "react";
import { Link } from "wouter";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0a0a0a" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: "#111", border: "1px solid rgba(201,168,76,0.2)" }}
      >
        <div className="text-center mb-8">
          <span
            className="font-serif font-bold tracking-tighter"
            style={{ fontSize: "2rem", color: "#C9A84C" }}
          >
            NFGN
          </span>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            New Face Global Network
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              ✉️
            </div>
            <h2 className="text-xl font-semibold" style={{ color: "#fff" }}>
              Check your email
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              If an account exists for <strong style={{ color: "#C9A84C" }}>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              The link expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 text-sm font-medium"
              style={{ color: "#C9A84C" }}
            >
              ← Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#fff" }}>
              Forgot your password?
            </h2>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: "rgba(201,168,76,0.8)" }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#fff",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-opacity"
                style={{
                  background: loading ? "rgba(201,168,76,0.5)" : "linear-gradient(135deg, #C9A84C, #a8843b)",
                  color: "#0a0a0a",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm" style={{ color: "rgba(201,168,76,0.7)" }}>
                ← Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
