import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const PAYPAL_API = "https://api-m.paypal.com";
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error_description ?? "Failed to get PayPal token");
  return data.access_token;
}

router.post("/payments/paypal/create-order", requireAuth, async (req, res) => {
  try {
    const { amount, currency = "USD" } = req.body;
    if (!amount) return res.status(400).json({ error: "amount is required" });

    const token = await getAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `nfgn-${(req as any).user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: Number(amount).toFixed(2),
          },
          description: "NFGN Purchase",
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: "New Face Global Network",
              locale: "en-US",
              landing_page: "LOGIN",
              user_action: "PAY_NOW",
              return_url: `${process.env.FRONTEND_URL ?? "https://3280747d-3245-4349-926e-ca1de22cbeb6-00-1r53mdpeusoj8.kirk.replit.dev"}/shop`,
              cancel_url: `${process.env.FRONTEND_URL ?? "https://3280747d-3245-4349-926e-ca1de22cbeb6-00-1r53mdpeusoj8.kirk.replit.dev"}/shop`,
            },
          },
        },
      }),
    });

    const data = await response.json() as any;
    if (!response.ok) {
      return res.status(400).json({ error: data.message ?? "Failed to create PayPal order" });
    }

    return res.json({ id: data.id, status: data.status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "PayPal error" });
  }
});

router.post("/payments/paypal/capture-order", requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const token = await getAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json() as any;
    if (!response.ok) {
      return res.status(400).json({ error: data.message ?? "PayPal capture failed" });
    }

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    if (data.status === "COMPLETED" && capture?.status === "COMPLETED") {
      return res.json({
        success: true,
        paypalOrderId: data.id,
        captureId: capture.id,
        status: data.status,
      });
    }

    return res.status(400).json({ error: "Payment was not completed", status: data.status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "PayPal capture error" });
  }
});

router.get("/payments/paypal/config", (_req, res) => {
  res.json({ clientId: CLIENT_ID });
});

export default router;
