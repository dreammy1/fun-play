# Stripe webhook implementation gates

The approved payment direction is Stripe with signed webhooks. The current repository
does not yet contain Stripe's SDK or a configured webhook endpoint contract.

## Current boundary

`server/apis/payment/stripeWebhook.js` is a fail-closed placeholder. It accepts
only a raw JSON body and returns HTTP 503. It does not verify a signature, create
a payment, or change a user's balance.

## Required before processing events

1. Confirm the Stripe account, mode (test or live), endpoint URL, and approved
   event types with the account owner.
2. Obtain the webhook signing secret through the deployment secret manager.
   Never put the secret in source control or chat.
3. Add a pinned Stripe SDK version and use its official webhook construction API
   with the exact raw request bytes and the Stripe-Signature header.
4. Validate the event type and retrieve/verify the related PaymentIntent or
   Checkout Session from Stripe when required by the agreed flow.
5. Confirm payment status, currency, amount, and local transaction association
   server-side. Never trust client-supplied payment success or amount.
6. Record the provider event ID under a unique database index and make processing
   idempotent. Duplicate delivery must not credit twice.
7. Post to an immutable wallet ledger and update the displayed balance through
   one transaction or a documented recoverable operation. If MongoDB deployment
   does not support transactions, design and review a safe recovery protocol.
8. Test valid, invalid, stale, duplicate, out-of-order, amount-mismatch, and
   database-failure cases in Stripe test mode before enabling any credits.
9. Keep live-mode processing disabled until a reviewed staging run succeeds.

The existing manual deposit approval route also credits `users.balance` directly.
It requires separate authorization, idempotency, and ledger work before being
considered production safe. No webhook placeholder should be interpreted as
payment verification or launch readiness.
