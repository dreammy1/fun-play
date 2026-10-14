# Betnex real-money wallet setup

The game launcher now reads the authenticated customer's balance from the server and identifies the customer with a stable `fun_<Mongo ObjectId>` member account. The Betnex callback endpoint records provider serial numbers in `betnexTransactions` and applies balance changes in a MongoDB transaction. The provider's retry of an already-processed serial does not apply the amount a second time.

## Required before production

1. Add the production Betnex API key in Render as `BETNEX_API_KEY`. The previous `RAPIDAPI_KEY` is not a substitute for Betnex's direct production key.
2. Confirm that the service MongoDB deployment supports multi-document transactions (replica set or sharded cluster). The callback intentionally fails rather than partially updating the wallet if a transaction cannot be committed.
3. Register this HTTPS callback URL with Betnex: `https://fun-admin.onrender.com/games/betnex/callback`.
4. Confirm the callback contract assigned to this Betnex account. The public API PDF (v2.1) documents a callback containing `bet_amount`, `win_amount`, `member_account`, `game_uid`, `game_round`, `currency_code`, `api_key`, and `serial_number`. The public wallet/integration pages separately describe HMAC signing, and do not state the exact signature header or canonical bytes. Configure the verifier to match the provider's written account-specific instructions before opening production play.
5. Confirm the currency is BDT and whether callback amounts are major units or minor units. The PDF examples use major currency units, while the public integration guide says to use integer minor units. Set `BETNEX_CALLBACK_AMOUNT_DIVISOR=1` for major units or `100` for BDT paisa values.

## Render variables

Set secret values only in Render, never in GitHub or chat:

```dotenv
BETNEX_API_KEY=<production API key>
BETNEX_API_BASE_URL=https://livecasinoapi.betnex.co/casino
BETNEX_CURRENCY=BDT
GAME_HOME_URL=https://fun-admin.onrender.com
BETNEX_CALLBACK_AUTH_MODE=hmac-sha256
BETNEX_CALLBACK_SECRET=<callback signing secret>
BETNEX_CALLBACK_SIGNATURE_HEADER=<header specified by Betnex>
BETNEX_CALLBACK_TIMESTAMP_HEADER=<timestamp header specified by Betnex>
BETNEX_CALLBACK_SIGNATURE_FORMAT=timestamp-dot-body
BETNEX_CALLBACK_AMOUNT_DIVISOR=1
```

For an account whose API version sends an `api_key` in the callback JSON instead of HMAC, use `BETNEX_CALLBACK_AUTH_MODE=api-key` and set `BETNEX_CALLBACK_API_KEY` as specified by the provider. Do not select this mode unless Betnex confirms it for the account.

## Verification limits

Automated tests use mocked provider responses and an in-memory database. They verify authenticated launch balance, stable player mapping, bet/win updates, duplicate delivery handling, and insufficient-funds rejection. They do not certify the live Betnex account, its credentials, callback signature convention, currency denomination, or callback delivery. Complete Betnex sandbox certification and a controlled provider-approved production check before accepting real-money play.
