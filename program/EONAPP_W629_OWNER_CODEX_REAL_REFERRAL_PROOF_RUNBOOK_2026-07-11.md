# W629 owner/Codex real referral, EONKEY and Vault Reveal proof runbook

## Preconditions

1. Use the exact W629H authoritative source fingerprint and committed revision from the validation receipt.
2. Run only:

```bash
npm ci
npm run verify:codex-predeploy
```

3. Use production-like Google sessions for distinct inviter and invitee accounts.
4. Use the dedicated `EON_REFERRALS_DB` binding and real Dodo-origin lifecycle events for paid lanes.
5. Never include raw signed tokens, signatures, emails, provider references, raw webhooks, private prompts, media or credentials in evidence.

## Required genuine lanes

- Signed inviter identity binding with fresh challenge.
- Invite acceptance by a distinct account.
- Self-referral rejection.
- Tampered-link rejection.
- One-level-only enforcement.
- Browser-only grant attempt rejected.
- First-party activation receipt consumed exactly once.
- Click/share/post/sign-up/trial produce no grant.
- Paid reward pending before day 14.
- Paid reward vested after retained-active day 14.
- Monthly and yearly caps.
- Duplicate and race-safe idempotency.
- Genuine refund and dispute reversal.
- Revocation of a redeemed unlock.
- Canonical Vault Reveal migration with no data loss.
- Redacted privacy-safe evidence export.
- Support audit reason record without customer/private payload.

## Certification rule

Mocks, source strings, browser LocalStorage, synthetic billing events, Dodo dashboard screenshots, screenshots of a key balance, or manually edited D1 rows cannot certify W629H. Public reward claims remain disabled until all required rows are genuine and pass.
