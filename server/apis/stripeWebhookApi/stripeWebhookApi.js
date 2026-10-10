const express = require("express");
const crypto = require("crypto");

module.exports = function stripeWebhookApi() {
  const router = express.Router();

  // Stripe requires the exact, unparsed request bytes for signature verification.
  router.post("/", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signingSecret) {
      // Fail closed. Configure the endpoint-specific whsec_ secret in Render.
      return res.status(503).json({ received: false, error: "Webhook endpoint is not configured" });
    }

    const signatureHeader = req.get("stripe-signature");
    if (!signatureHeader || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ received: false, error: "Missing signature or raw request body" });
    }

    try {
      const parts = signatureHeader.split(",").reduce((acc, part) => {
        const separator = part.indexOf("=");
        if (separator > 0) {
          const key = part.slice(0, separator);
          const value = part.slice(separator + 1);
          if (!acc[key]) acc[key] = [];
          acc[key].push(value);
        }
        return acc;
      }, {});

      const timestampText = parts.t?.[0];
      const timestamp = Number(timestampText);
      if (!timestampText || !Number.isInteger(timestamp) || Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) {
        return res.status(400).json({ received: false, error: "Invalid or expired webhook timestamp" });
      }

      const signedPayload = Buffer.concat([
        Buffer.from(timestampText + ".", "utf8"),
        req.body,
      ]);
      const expected = crypto.createHmac("sha256", signingSecret).update(signedPayload).digest();
      const validV1 = (parts.v1 || []).some((candidate) => {
        if (!/^[a-f0-9]{64}$/i.test(candidate)) return false;
        const supplied = Buffer.from(candidate, "hex");
        return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
      });
      if (!validV1) {
        return res.status(400).json({ received: false, error: "Invalid webhook signature" });
      }

      let event;
      try {
        event = JSON.parse(req.body.toString("utf8"));
      } catch {
        return res.status(400).json({ received: false, error: "Invalid JSON payload" });
      }

      if (!event || typeof event.id !== "string" || typeof event.type !== "string") {
        return res.status(400).json({ received: false, error: "Invalid Stripe event structure" });
      }

      const db = req.app.locals?.db;
      if (!db) return res.status(503).json({ received: false, error: "Database unavailable" });

      const events = db.collection("stripeWebhookEvents");
      try {
        await events.createIndex({ eventId: 1 }, { unique: true });
      } catch (indexError) {
        // A duplicate-key response below is safe; other index errors fail closed on insert.
      }

      try {
        await events.insertOne({
          eventId: event.id,
          type: event.type,
          livemode: event.livemode === true,
          receivedAt: new Date(),
          processingStatus: "received",
          // Store only the event envelope needed for audit; never log or store the signing secret.
          dataObjectId: typeof event.data?.object?.id === "string" ? event.data.object.id : null,
          apiVersion: event.api_version || null,
        });
      } catch (error) {
        if (error?.code === 11000) {
          return res.status(200).json({ received: true, duplicate: true });
        }
        throw error;
      }

      // Intentionally do not credit a wallet here. Payment-to-user mapping,
      // amount/currency verification, and ledger posting must be implemented and tested separately.
      return res.status(200).json({ received: true, processed: false });
    } catch (error) {
      console.error("Stripe webhook persistence failed:", error.message);
      return res.status(500).json({ received: false, error: "Webhook persistence failed" });
    }
  });

  return router;
};
