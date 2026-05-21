import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ fontFamily: "sans-serif", padding: 32, background: "#0a0a0a", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ color: "#C9A84C", fontSize: 22, margin: 0 }}>NFGN — Something went wrong</h1>
          <p style={{ color: "#aaa", fontSize: 14, textAlign: "center", maxWidth: 480 }}>
            The app encountered an error. Please reload the page. If the problem persists, contact support.
          </p>
          <pre style={{ background: "#111", color: "#f87171", padding: 16, borderRadius: 8, fontSize: 11, maxWidth: 560, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {err.message}{"\n"}{err.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ background: "#C9A84C", color: "#000", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
