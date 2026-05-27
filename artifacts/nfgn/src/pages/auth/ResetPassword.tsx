import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export function ResetPassword() {
  const [location] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token. Please request a new password reset.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
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

        {done ? (
          <div className="text-center space-y-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl"
              style={{ background: "rgba(45,106,79,0.15)", border: "1px solid rgba(45,106,79,0.4)" }}
            >
              ✅
            </div>
            <h2 className="text-xl font-semibold" style={{ color: "#fff" }}>
              Password updated!
            </h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 px-8 py-3 rounded-lg font-semibold text-sm uppercase tracking-wider"
              style={{ background: "linear-gradient(135deg, #C9A84C, #a8843b)", color: "#0a0a0a" }}
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#fff" }}>
              Set new password
            </h2>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
              Choose a strong password for your account.
            </p>

            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                {error}
                {(error.includes("expired") || error.includes("invalid") || error.includes("Invalid")) && (
                  <div className="mt-2">
                    <Link href="/forgot-password" style={{ color: "#C9A84C", textDecoration: "underline" }}>
                      Request a new reset link
                    </Link>
                  </div>
                )}
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: "rgba(201,168,76,0.8)" }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors pr-12"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(201,168,76,0.25)",
                        color: "#fff",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.6)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(201,168,76,0.25)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                    style={{ color: "rgba(201,168,76,0.8)" }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter new password"
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
                  {loading ? "Updating…" : "Reset Password"}
                </button>
              </form>
            )}

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
