This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W214 — Security and trust handover

## Implemented controls
- CSP reports are size-bounded and retain only a small allowlisted diagnostic shape: directive, origin/path-safe context, and timestamp.
- Query strings, URL fragments, share tokens, headers, cookies, Authorization values, and obvious secret-shaped values are redacted before telemetry persistence.
- Browser isolation/security headers are defined in the Pages header files.
- Embedded browser/content surfaces receive sandbox and referrer hardening.
- Public privacy, legal, and trust text now states the product truth instead of promising active value, provider access, or cloud behavior that is not proven.

## Important limit
Headers and Worker behavior must still be verified on a Cloudflare Preview deployment. The W214 source gate confirms policy code and tests, not an external runtime certificate.

## Source gate

```bash
npm run qa:w214-security-trust
```

Result in this cumulative tree: PASS.
