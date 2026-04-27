export function OptionA() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 pt-8">
      <div className="w-[400px] space-y-4">
        <div className="text-center mb-2">
          <span className="inline-block bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Option A — Current (Manual Send)
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
            <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 text-center">
              <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider mb-1">NFGN Official Cash App</p>
              <p className="text-2xl font-black text-green-700">$NewFaceGlobalNetwork</p>
              <p className="text-xs text-gray-500 mt-1">Send exactly <strong>$89.97</strong> to this $cashtag</p>
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <span className="text-blue-500">ℹ</span> How to send via Cash App:
              </p>
              <p className="text-xs text-gray-600">1. Open <strong>Cash App</strong> and tap the <strong>$</strong> icon.</p>
              <p className="text-xs text-gray-600">2. Type amount: <strong>$89.97</strong></p>
              <p className="text-xs text-gray-600">3. Tap <strong>"Pay"</strong>, search <strong>$NewFaceGlobalNetwork</strong>.</p>
              <p className="text-xs text-gray-600">4. Add your name and order info in the <strong>For</strong> field.</p>
              <p className="text-xs text-gray-600">5. Confirm & send — then click <strong>"Place Order"</strong> below.</p>
              <p className="text-xs text-gray-600">6. We confirm within <strong>24 hours</strong> and ship your order.</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ Only send to <strong>$NewFaceGlobalNetwork</strong>. NFGN will never ask you to send to a personal account.
              </p>
            </div>

            <div className="pt-1 text-center text-[10px] text-gray-400 flex items-center justify-center gap-2">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <span>Order confirmed manually within 24 hours after payment is verified</span>
            </div>
          </div>
        </div>

        <button className="w-full bg-[#2D6A4F] hover:bg-[#235840] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
          Place Order · $89.97
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
}
