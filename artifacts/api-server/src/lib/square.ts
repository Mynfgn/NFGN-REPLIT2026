const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const SQUARE_BASE = "https://connect.squareup.com";

export async function createSquarePaymentLink(opts: {
  name: string;
  amountCents: number;
  bookingId: number;
  redirectUrl?: string;
}): Promise<string | null> {
  if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
    console.warn("[SQUARE] Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID — skipping payment link");
    return null;
  }

  const body = {
    idempotency_key: `booking-${opts.bookingId}-${Date.now()}`,
    quick_pay: {
      name: opts.name,
      price_money: {
        amount: opts.amountCents,
        currency: "USD",
      },
      location_id: SQUARE_LOCATION_ID,
    },
  };

  try {
    console.log(`[SQUARE] Generating payment link for booking #${opts.bookingId}, amount: $${(opts.amountCents / 100).toFixed(2)}`);

    const res = await fetch(`${SQUARE_BASE}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[SQUARE] Payment link creation failed:", res.status, err);
      return null;
    }

    const data = await res.json();
    const url = data?.payment_link?.url ?? null;
    if (url) {
      console.log(`[SQUARE] Payment link generated: ${url}`);
    } else {
      console.warn("[SQUARE] API returned OK but no URL in response:", JSON.stringify(data));
    }
    return url;
  } catch (err) {
    console.error("[SQUARE] Payment link request error:", err);
    return null;
  }
}
