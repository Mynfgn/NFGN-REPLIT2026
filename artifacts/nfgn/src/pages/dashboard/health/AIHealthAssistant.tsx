import { useState, useEffect, useRef } from "react";
import { Heart, Send, Sparkles, AlertTriangle, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const PINK = "#a83265";
const PINK_M = "#fce8f0";
const DARK = "#0a0a0a";

function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  return fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  }).then(r => r.json());
}

interface Message { role: "user" | "assistant"; content: string; id: number }

const STARTER_QUESTIONS = [
  "What herbs are good for boosting energy naturally?",
  "How can I improve my gut health holistically?",
  "What supplements support healthy blood sugar?",
  "Which herbs help with anxiety and sleep?",
  "What does my blood type mean for my diet?",
  "How much water should I drink daily?",
];

let msgId = 0;

export function AIHealthAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/wellness/profile").then(d => setHasProfile(!!d.profile)).catch(() => {});
    // Welcome message
    setMessages([{
      role: "assistant",
      content: "Welcome! I'm your NFGN naturopathic health advisor. I can help you with questions about herbs, supplements, nutrition, hydration, gut health, sleep, and holistic wellness. What would you like to explore today?",
      id: msgId++,
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: msg, id: msgId++ };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const d = await apiFetch("/api/wellness/ai-chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, history }),
      });
      const reply = d.reply ?? "I'm sorry, I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, id: msgId++ }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment.", id: msgId++ }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "28px 20px", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: PINK_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={22} color={PINK} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>AI Health Assistant</h1>
            <p style={{ fontSize: 12, color: "#666", margin: 0 }}>Naturopathic-trained AI — personalized to your health profile</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${PINK}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Profile badge */}
      {hasProfile && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "7px 12px", background: GREEN_M, border: `1px solid ${GREEN}33`, borderRadius: 8, flexShrink: 0 }}>
          <Sparkles size={13} color={GREEN} />
          <span style={{ fontSize: 11, color: GREEN_D, fontWeight: 700 }}>Personalized to your health profile — responses are tailored to your blood type, body type & wellness goal</span>
        </div>
      )}

      {/* Starter questions (shown before any user message) */}
      {messages.length <= 1 && (
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Popular questions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {STARTER_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                disabled={loading}
                style={{ padding: "6px 13px", borderRadius: 20, border: `1.5px solid ${PINK}44`, background: PINK_M, color: PINK, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = PINK; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = PINK_M; (e.currentTarget as HTMLButtonElement).style.color = PINK; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat window */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingRight: 4, marginBottom: 16 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "user" ? GREEN : PINK,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {msg.role === "user" ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
            </div>
            {/* Bubble */}
            <div style={{
              maxWidth: "75%",
              background: msg.role === "user" ? GREEN : "#fff",
              color: msg.role === "user" ? "#fff" : "#333",
              border: msg.role === "user" ? "none" : `1.5px solid ${PINK}22`,
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 16px",
              fontSize: 13,
              lineHeight: 1.75,
              boxShadow: msg.role === "assistant" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading bubble */}
        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bot size={16} color="#fff" />
            </div>
            <div style={{ background: "#fff", border: `1.5px solid ${PINK}22`, borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <Loader2 size={14} color={PINK} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13, color: "#888" }}>Thinking…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me anything about herbs, nutrition, supplements, or holistic wellness…"
            disabled={loading}
            style={{ flex: 1, fontSize: 13, borderColor: `${PINK}44`, borderRadius: 10 }}
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{ background: PINK, color: "#fff", fontWeight: 700, borderRadius: 10, padding: "0 18px", flexShrink: 0 }}
          >
            <Send size={15} />
          </Button>
        </div>

        <div style={{ background: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "#777", lineHeight: 1.65 }}>
          <AlertTriangle size={12} style={{ display: "inline", marginRight: 5, color: GOLD }} />
          <strong>Educational only.</strong> This AI provides general naturopathic wellness information. It does not diagnose, treat, or replace professional medical advice. Always consult your healthcare provider before making health decisions.
        </div>
      </div>
    </div>
  );
}
