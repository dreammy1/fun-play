const express = require("express");

/**
 * Stripe webhook boundary.
 *
 * Mount this router before express.json() so Stripe's official SDK can verify
 * the exact raw request body. This route intentionally does not mutate wallet
 * balances. Signature verification and event-to-ledger handling must be added
 * together after the provider account's event contract is confirmed.
 */
function createStripeWebhookRouter() {
  const router = express.Router();

  router.post(
    "/",
    express.raw({ type: "application/json" }),
    (req, res) => {
      // No signature or event processing is enabled until the official Stripe
      // SDK and a configured endpoint secret are available.
      return res.status(503).json({
        error: "Stripe webhook processing is not configured.",
      });
    }
  );

  return router;
}

module.exports = createStripeWebhookRouter;
