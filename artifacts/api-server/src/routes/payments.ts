import { Router, type IRouter } from "express";
import { SquareClient, SquareEnvironment } from "square";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: SquareEnvironment.Production,
});

const LOCATION_ID = process.env.SQUARE_LOCATION_ID!;

router.post("/payments/square/process", requireAuth, async (req, res) => {
  try {
    const { sourceId, amount, currency = "USD", note } = req.body;

    if (!sourceId || !amount) {
      return res.status(400).json({ error: "sourceId and amount are required" });
    }

    const response = await squareClient.payments.createPayment({
      sourceId,
      idempotencyKey: `${(req as any).user.id}-${Date.now()}`,
      amountMoney: {
        amount: BigInt(Math.round(Number(amount) * 100)),
        currency,
      },
      locationId: LOCATION_ID,
      note: note ?? "NFGN Purchase",
      buyerEmailAddress: (req as any).user.email,
    });

    const payment = response.payment;
    if (payment?.status === "COMPLETED") {
      return res.json({
        success: true,
        paymentId: payment.id,
        status: payment.status,
        receiptUrl: payment.receiptUrl,
      });
    }

    return res.status(400).json({
      error: "Payment was not completed",
      status: payment?.status,
    });
  } catch (err: any) {
    const errors = err?.errors ?? [];
    const message = errors[0]?.detail ?? err?.message ?? "Payment failed";
    return res.status(400).json({ error: message });
  }
});

router.get("/payments/square/config", (_req, res) => {
  res.json({
    applicationId: process.env.SQUARE_APPLICATION_ID,
    locationId: LOCATION_ID,
  });
});

export default router;
