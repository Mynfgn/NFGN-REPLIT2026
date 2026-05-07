const GOLD = "#C9A84C";

const TICKER_KEYFRAMES = `@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`;

interface TickerBarProps {
  messages: string[];
  fontSize?: number;
  padding?: string;
}

export function TickerBar({ messages, fontSize = 20, padding = "20px 0" }: TickerBarProps) {
  if (messages.length === 0) return null;

  return (
    <div style={{ background: GOLD, overflow: "hidden", padding }}>
      <div
        style={{
          display: "flex",
          gap: 72,
          whiteSpace: "nowrap",
          animation: "ticker 24s linear infinite",
        }}
      >
        {[...messages, ...messages].map((item, i) => (
          <span
            key={i}
            style={{
              color: "#fff",
              fontSize,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: fontSize * 0.7 }}>✦</span> {item}
          </span>
        ))}
      </div>
      <style>{TICKER_KEYFRAMES}</style>
    </div>
  );
}
