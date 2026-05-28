import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const API_LOGIN_ID = process.env.AUTHORIZENET_API_LOGIN_ID!;
const TRANSACTION_KEY = process.env.AUTHORIZENET_TRANSACTION_KEY!;
const ANET_URL = "https://api.authorize.net/xml/v1/request.api";

router.post("/payments/authorizenet/process", requireAuth, async (req, res) => {
  try {
    const { opaqueDataDescriptor, opaqueDataValue, amount, note } = req.body;

    if (!opaqueDataDescriptor || !opaqueDataValue || !amount) {
      return res.status(400).json({ error: "opaqueDataDescriptor, opaqueDataValue, and amount are required" });
    }

    const user = (req as any).user;
    const amountStr = Number(amount).toFixed(2);

    const payload = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: API_LOGIN_ID,
          transactionKey: TRANSACTION_KEY,
        },
        refId: `NFGN-${user.id}-${Date.now()}`,
        transactionRequest: {
          transactionType: "authCaptureTransaction",
          amount: amountStr,
          payment: {
            opaqueData: {
              dataDescriptor: opaqueDataDescriptor,
              dataValue: opaqueDataValue,
            },
          },
          order: {
            description: note ?? "NFGN Purchase",
          },
          customer: {
            email: user.email,
          },
        },
      },
    };

    const response = await fetch(ANET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as any;

    // Authorize.net prepends a BOM character — strip it
    const result = typeof data === "string" ? JSON.parse(data.replace(/^\uFEFF/, "")) : data;

    const txResponse = result?.transactionResponse;
    const messages = result?.messages;

    if (messages?.resultCode === "Ok" && txResponse?.responseCode === "1") {
      return res.json({
        success: true,
        transactionId: txResponse.transId,
        authCode: txResponse.authCode,
        status: "COMPLETED",
      });
    }

    const errorMsg =
      txResponse?.errors?.[0]?.errorText ??
      messages?.message?.[0]?.text ??
      "Payment declined";

    return res.status(400).json({ error: errorMsg });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Payment failed" });
  }
});

router.get("/payments/authorizenet/config", (_req, res) => {
  res.json({
    apiLoginID: process.env.AUTHORIZENET_API_LOGIN_ID,
    clientKey: process.env.AUTHORIZENET_CLIENT_KEY,
  });
});

export default router;
