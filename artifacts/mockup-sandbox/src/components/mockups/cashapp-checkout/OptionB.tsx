import { useState } from "react";

export function OptionB() {
  const [section, setSection] = useState<"button" | "manual">("button");

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-8">
      <div className="w-[400px] space-y-4">
        <div className="text-center mb-2">
          <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Option B — Live Button + Manual Fallback
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-green-600 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Cash App Payment</span>
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-black text-lg">$</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-green-200 bg-green-50">
              <button
                onClick={() => setSection("button")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${section === "button" ? "bg-green-600 text-white" : "text-green-700 hover:bg-green-100"}`}
              >
                Pay Instantly
              </button>
              <button
                onClick={() => setSection("manual")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${section === "manual" ? "bg-green-600 text-white" : "text-green-700 hover:bg-green-100"}`}
              >
                Send Manually
              </button>
            </div>

            {section === "button" && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 text-center">
                  Tap the button below — Cash App opens automatically. Your order confirms <strong>instantly</strong> when payment clears.
                </p>

                {/* Square CashApp Pay button mockup */}
                <button className="w-full flex items-center justify-center gap-3 bg-[#00D64F] hover:bg-[#00c047] active:bg-[#00a83e] text-black font-bold py-3.5 rounded-xl shadow-md transition-colors">
                  <svg viewBox="0 0 40 40" className="h-6 w-6" fill="none">
                    <rect width="40" height="40" rx="8" fill="black"/>
                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="#00D64F" fontSize="20" fontWeight="bold">$</text>
                  </svg>
                  <span className="text-base">Pay $89.97 with Cash App</span>
                </button>

                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span>Powered by Square · Instant confirmation</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="bg-green-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-green-800">How it works:</p>
                  <p className="text-xs text-green-700">1. Tap the button — Cash App opens on your phone.</p>
                  <p className="text-xs text-green-700">2. Approve the <strong>$89.97</strong> payment in your Cash App.</p>
                  <p className="text-xs text-green-700">3. Return here — your order is confirmed <strong>automatically</strong>.</p>
                  <p className="text-xs text-green-700">No waiting, no manual review needed.</p>
                </div>

                <p className="text-center text-xs text-gray-400">
                  Don't have Cash App?{" "}
                  <button onClick={() => setSection("manual")} className="text-green-600 underline font-medium">
                    Send manually instead
                  </button>
                </p>
              </div>
            )}

            {section === "manual" && (
              <div className="space-y-3">
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider mb-1">NFGN Official Cash App</p>
                  <p className="text-xl font-black text-green-700">$NewFaceGlobalNetwork</p>
                  <p className="text-xs text-gray-500 mt-1">Send exactly <strong>$89.97</strong> to this $cashtag</p>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-1.5">
                  <p className="text-xs font-bold text-gray-700">How to send:</p>
                  <p className="text-xs text-gray-600">1. Open Cash App → tap <strong>$</strong> → enter <strong>$89.97</strong></p>
                  <p className="text-xs text-gray-600">2. Search <strong>$NewFaceGlobalNetwork</strong> → Pay</p>
                  <p className="text-xs text-gray-600">3. Add your name in the For field, then confirm.</p>
                  <p className="text-xs text-gray-600">4. Click <strong>"Place Order"</strong> below — we verify within 24 hrs.</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2.5">
                  <p className="text-xs text-yellow-800">⚠️ Only send to <strong>$NewFaceGlobalNetwork</strong>.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <button className="w-full bg-[#2D6A4F] hover:bg-[#235840] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
          {section === "button" ? "Complete Order — Pay via Cash App" : "Place Order · $89.97"}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>

        {section === "button" && (
          <p className="text-center text-[10px] text-gray-400">
            ⚡ Instant confirmation · No 24-hour wait
          </p>
        )}
      </div>
    </div>
  );
}
