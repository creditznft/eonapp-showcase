# W272-A0 — CSP/network/supply-chain source readiness

## Added

- A fail-closed source gate for default CSP hardening invariants, route-scoped Telegram framing, redacted CSP reporting, opt-in sourcemaps and immutable lockfile locations.
- An explicit external-evidence board that preserves the pending narrow-allowlist, edge-header, browser, audit, SBOM and sourcemap decisions.
- Unit coverage for unsafe CSP and mutable Git/file lock locations.

## Decision

No blind CSP narrowing was made. Current broad BYOK-compatible `https:`/`wss:` source allowances require observed Preview/provider evidence and an approved rollback plan before any narrowing.

## Non-changes

No Cloudflare, deployment, Worker, D1, referral/milestone, reward, wallet, chain, provider or commercial state changed. W260 remains NO-GO.
