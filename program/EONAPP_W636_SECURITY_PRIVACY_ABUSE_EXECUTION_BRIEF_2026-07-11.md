# EONAPP W636 — Security, Privacy, Secrets and Abuse-Resistance Execution Brief

## Goal

Red-team the current W635 source and build without weakening product truth, custody separation, review-first actions or evidence fences.

## Required audit lanes

1. Authentication, session, logout, account-switching and authorization boundaries.
2. CSP, Trusted Types where applicable, XSS/HTML injection, URL handling and open redirects.
3. CORS, private-network and loopback companion origin authentication.
4. Provider-key custody, ordinary browser persistence, exports, sync and logs.
5. Dodo webhook signatures, replay/idempotency, D1 access and entitlement tampering.
6. Referral qualification, EONKEY grant/reversal/redemption and rate-limit abuse.
7. File/media type, size, path, metadata and decompression validation.
8. Dependency, build, workflow and supply-chain integrity.
9. Whole-tree secret scan plus targeted credential-like fixture controls.
10. Privacy, terms and support copy alignment with observed behavior.

## Acceptance

- No critical/high source issue remains unexplained.
- Every new security assertion has a maintained test or machine gate.
- Secret-bearing payloads remain rejected from ordinary export/sync.
- No live credential, production mutation or destructive provider action is used for source certification.
- Genuine external evidence remains pending rather than fabricated.
- Permanent certification expands from the W635 70-stage chain and remains resumable/fingerprint-bound.
