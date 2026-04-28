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
    return data?.payment_link?.url ?? null;
  } catch (err) {
    console.error("[SQUARE] Payment link request error:", err);
    return null;
  }
}
