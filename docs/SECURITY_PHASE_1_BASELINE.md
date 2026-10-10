# Fun Play — Phase 1 Security Baseline

## Scope and deployment safety

This is a source-review checklist for the first security phase. It is not a penetration-test report and does not certify the platform for real-money gambling. Keep changes on a review branch until tests pass and the operator approves deployment.

## Confirmed source-level findings

- `server/index.js` configures CORS with a wildcard origin and credential support, alongside a large legacy list of domains. Replace this with an explicit environment-configured origin allowlist after confirming the current production frontend and admin origins.
- `server/apis/opayApi/opayApi.js` exposes `POST /opay/callback-deposit` that trusts request-body fields such as `success`, `amount`, `trxid`, and `userIdentifyAddress` before incrementing a user's balance. No provider signature or server-to-server transaction verification is visible in this handler. Do not accept this payload as proof of payment.
- `server/apis/opayApi/opayApi.js` also exposes settings/validation/running endpoints; verify authorization before allowing changes or returning stored payment credentials.
- `server/apis/adminDepositTransactionsApi/adminDepositTransactionsApi.js` contains list/update/delete handlers for deposit transactions. No authorization middleware is attached within this router; verify all upstream middleware before release. Approval increments the user balance and updates transaction status in separate database operations, which can diverge on failure or concurrent requests.
- `server/apis/depositTransactionsApi/depositTransactionsApi.js` accepts a caller-supplied `userId` when creating deposits and returns transactions by arbitrary `userId`. Ownership must be derived from a verified session/token, not trusted from request input.
- `server/apis/depositTransactionsApi/depositTransactionsApi.js` writes arbitrary request bodies to a daily JSON file through `POST /auto-payment`. Confirm whether this route is still used; otherwise remove or restrict it. If retained, validate the schema and require authorization.
- `server/utils.js` configures uploads without file-size, MIME-type, or file-signature validation. The delete endpoint in `server/index.js` also accepts a caller-supplied path. Restrict both before production use.
- `server/index.js` serves the `/uploads` directory publicly. Confirm that it contains only intentionally public assets; private identity/payment documents must be stored separately and access-controlled.

## Phase 1 execution order

1. Confirm a staging deployment and take a restorable MongoDB backup. Test the restore, not just backup creation.
2. Inventory every API route and the middleware applied at mount points. Document public, customer-authenticated, admin-only, and provider-webhook routes.
3. Rotate any provider/API credentials previously committed to source control. Store secrets only in Render environment variables; invalidate the old credentials with the provider.
4. Replace permissive CORS with an environment allowlist after confirming the exact customer and admin origins. Do not deploy an allowlist until the current production origins are known.
5. Implement one shared authentication/authorization middleware and apply it to customer-owned data and admin operations. Add tests for missing, invalid, expired, customer, and admin tokens.
6. Replace body-trusting payment callbacks with the approved provider's documented signature verification and/or server-to-server transaction lookup. Enforce idempotency and match merchant reference, currency, amount, recipient/account, and final payment status. Do not guess a signature format.
7. Make deposit approval concurrency-safe and atomic where the database supports it; introduce a ledger before production real-money use.
8. Add upload restrictions, rate limits, security headers, structured audit logs, dependency checks, and monitoring.
9. Run API regression tests against staging and perform independent security review before enabling real-money flows.

## Information required before implementing the payment adapter

- Exact approved payment provider and its official webhook/callback verification documentation.
- Confirmed production frontend origin(s) and admin origin(s).
- Whether `/opay/...` routes are used in production or are legacy code.
- Whether MongoDB deployment supports transactions (replica set / sharded cluster), and the intended currency and minor-unit precision.

## Release gate

No real-money release until authorization tests, duplicate-callback tests, concurrent approval tests, failed-write/recovery tests, backup restoration, provider reconciliation, age/identity and responsible-gambling controls, and the applicable UKGC/licence and game-testing requirements have been verified.
