# Stripe webhook Phase 1 implementation

## What this change does

- Adds `POST /stripe/webhook`, mounted before JSON parsing so the verifier receives the raw request bytes.
- Verifies the Stripe `Stripe-Signature` header with HMAC-SHA256, constant-time comparison, and a 5-minute timestamp tolerance.
- Requires `STRIPE_WEBHOOK_SECRET`; if missing, the endpoint fails closed with HTTP 503.
- Persists a minimal event record in `stripeWebhookEvents` with a unique `eventId` index. Duplicate deliveries are acknowledged without inserting another event.
- Disables the legacy `POST /opay/callback-deposit` route with HTTP 410 because its previous implementation trusted request-body fields to credit a balance and is not a Stripe webhook.
- Does **not** credit balances or treat a received event as a completed deposit. This is intentional until the payment creation flow, Stripe PaymentIntent/Checkout metadata, currency/minor-unit rules, and ledger posting are implemented together.

## Render configuration

Set `STRIPE_WEBHOOK_SECRET` in the Render backend service to the endpoint-specific signing secret shown by Stripe for the deployed webhook endpoint. Do not use the Stripe API secret key here, do not commit secrets, and do not copy a Stripe CLI test secret into production. Restart/redeploy only after review and staging verification.

Configure the Stripe endpoint URL as:

`https://fun-admin.onrender.com/stripe/webhook`

Select only the event types required by the eventual payment flow. The current handler records valid events but performs no financial action.

## Verification and acceptance tests required before merge/deploy

1. Valid Stripe test-mode signed event: HTTP 200 and one `stripeWebhookEvents` record.
2. Same event delivered twice: HTTP 200 both times and exactly one record.
3. Missing or malformed `Stripe-Signature`: HTTP 400; no record.
4. Altered body or wrong signing secret: HTTP 400; no record.
5. Timestamp older than the accepted tolerance: HTTP 400; no record.
6. Missing `STRIPE_WEBHOOK_SECRET`: HTTP 503; no record.
7. Database unavailable: HTTP 503 or 500; no false acknowledgement.
8. Legacy Opay callback: HTTP 410 and no wallet credit.
9. Confirm frontend/admin flows do not depend on the legacy callback before any production rollout.

Use Stripe's official webhook-signing guidance: https://github.com/stripe/stripe-node#webhook-signing . Stripe requires the exact raw request body for signature verification. Before real-money wallet crediting, complete an audited payment-to-user reference design, validate amount and currency against a server-created payment record, and post to an idempotent ledger.
