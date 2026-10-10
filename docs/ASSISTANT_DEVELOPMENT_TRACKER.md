# Fun Play — Assistant Development Branch

## Branch and release safety

- Working branch: `assistant/fun-play-development`
- Base: `main` at the time this branch was created.
- `main` must remain unchanged by this work. All changes are committed only to this branch and proposed through reviewable pull requests.
- No production deployment, PR merge, real-money balance crediting, or secret changes are authorized by this development plan.
- Do not add credentials, signing secrets, API keys, or production customer data to source control.

## Development order

### Phase 0 — Establish a verifiable baseline
- Inventory API mounts, middleware, authentication, role model, database collections, frontend API calls, and existing tests.
- Add automated tests and a repeatable test command before high-risk refactors.
- Record unresolved assumptions instead of guessing.

### Phase 1 — Authentication and authorization
- Fail closed when `JWT_SECRET` is absent.
- Verify JWTs and resolve the current user from the database for authorization decisions.
- Add explicit admin authorization to administrative mutations and data exports.
- Scope user-facing reads and mutations to the authenticated user; allow a target user ID only for authorized admins.
- Preserve required public registration, login, and public configuration endpoints.
- Review every route and frontend dependency before changing route access.

### Phase 2 — Financial integrity
- Stop trusting caller-supplied payment success or amount.
- Introduce an auditable, immutable wallet ledger and idempotent financial operations.
- Ensure deposit/withdrawal state changes and ledger postings are atomic or recoverable.
- Verify payment provider signatures and reconcile provider-side payment records.
- Do not enable real-money credits until end-to-end staging tests pass.

### Phase 3 — Web/API hardening
- Restrict CORS to known origins, validate inputs, rate-limit sensitive endpoints, and standardize errors.
- Restrict upload types, sizes, and paths; prevent arbitrary file deletion/path traversal.
- Remove sensitive data from public responses and avoid logging credentials or personal data.
- Add security headers and operational audit logs.

### Phase 4 — Reliability and release gates
- Add unit/integration tests and CI checks.
- Verify database indexes, startup configuration, health checks, and rollback steps.
- Use staging for provider webhook replay, duplicate events, invalid signatures, amount/currency mismatch, and failed database writes.
- Keep changes in small commits and open/update a draft PR for review.

## Release blockers

- No unverified provider callback may credit a wallet.
- No balance changes without a server-verified business event and an idempotent ledger entry.
- No admin mutation without server-side authorization.
- No real-money launch until legal/licensing, responsible-gambling controls, KYC/AML, age/identity checks, payment provider approval, independent game testing, and operational controls have been reviewed for the target jurisdiction.
- Passing code tests alone does not establish regulatory compliance or production readiness.
