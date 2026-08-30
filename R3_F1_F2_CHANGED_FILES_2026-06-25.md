# R3-F1/F2 changed files and surfaces

## New active controls

- `config/route-tiering.mjs`
- `scripts/r3-f1-physical-source-reduction-gate.mjs`
- `scripts/r3-f2-route-tiering-gate.mjs`
- `tests/unit/r3-f1-physical-source-reduction.test.mjs`
- `tests/unit/r3-f2-route-tiering.test.mjs`
- `archive/retired-value-systems/MANIFEST.json`
- `archive/retired-route-surfaces/MANIFEST.json`

## Active source changes

- Route contract and Cloudflare redirects preserve retired route destinations.
- Legal/Billing/Privacy/Support surface checks now target maintained policy documents.
- W247 automation retirement checks now prove the route contract and absence of retired root source.
- Existing W145/W242 tests and gates now assert maintained active surfaces plus archive integrity rather than importing retired authority.

## Removed from active root; retained in archive only

- `automation-studio.html`
- `device-check.html`
- `eon-browser.html`
- `music-studio.html`
- `signal.html`
- `tools.html`
- `trade-sandbox.html`
- `video-editor.html`
- `kpi-dashboard.html`
- `kpi-token-dashboard.html`
- `live-trading-dashboard.html`
- `refund-policy.html`
- `wallet-risk.html`

See the two archive manifests for exhaustive file lists and hashes.
