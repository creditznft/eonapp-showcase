# W717 Incident Response Runbook

## Severity

- **P0:** credential exposure, unauthorized payment/entitlement, destructive data loss, authentication bypass or malicious production control.
- **P1:** broken sign-in/session, unsafe restore, widespread City/NEXUS failure, incorrect billing state or privacy-boundary regression.
- **P2:** bounded functional regression with a safe workaround.
- **P3:** cosmetic, documentation or non-blocking quality issue.

## Immediate response

1. Stop release activity. Do not rerun hosted workflows blindly.
2. Preserve the exact commit, candidate digest, deployment ID, timestamp and browser evidence.
3. For P0, revoke/rotate affected secrets and disable the smallest affected capability or route.
4. For P0/P1 production regressions, roll back to the last known Cloudflare deployment; do not rebuild during rollback.
5. Preserve logs and receipts without copying prompts, project content, provider keys or recovery material.
6. Open one incident record with owner, severity, scope, first observed time, current containment and proof links.

## Domain playbooks

### OAuth/session

- Disable sign-in entry only when necessary; guest/local work must remain available.
- Revoke opaque server sessions and clear the Secure, HttpOnly, SameSite cookie.
- Verify identity scopes remain `openid email profile`; Drive consent is separate.

### Vault/provider secret

- Stop affected provider verification and generation routes.
- Rotate exposed provider credentials outside EONAPP.
- Inspect browser storage and logs for masked-versus-plaintext boundary failure.
- Never paste secrets into the incident record.

### Billing/referral

- Disable checkout or referral mutation independently; do not disable read-only account status unnecessarily.
- Preserve signed webhook IDs, idempotency keys and ledger receipts.
- Reconcile duplicate, refund and reversal state server-side. Browser state never grants entitlement.

### Project handoff/recovery

- Stop import/restore, retain read-only review and export where safe.
- Preserve the hostile file hash and validation error, not its private payload.
- Never overwrite current local work during diagnosis.

### CSP/abuse

- Tighten the narrow affected origin or route.
- Confirm CSP reports are bounded and redacted before forwarding.
- Apply Cloudflare WAF/rate-limit containment using the minimum necessary scope.

## Recovery and closure

1. Add a regression test and source gate for the root cause.
2. Run the applicable W717 security lane and complete W718 exact-dependency/browser evidence.
3. Deploy one frozen fix to Preview, verify identity and rollback, then promote the identical root.
4. Record impact, containment, root cause, corrective action and evidence.
5. Close only after owner acceptance and a 24-hour observation window for P0/P1 incidents.
