# W216 evidence matrix — complete after Cloudflare Preview/device validation

| Gate | Required evidence | Status | Notes |
|---|---|---:|---|
| SHA/source | ZIP sidecar checksum and clean extraction | Pending | Must match delivered archive |
| Local source gates | Command log for W211–W215, lint, build, smoke, audit, readiness, prod audit | Source PASS | Rerun in Codex branch |
| Preview deploy | Cloudflare Preview URL and commit SHA | Pending | No production promotion yet |
| Chat/workspace | desktop and mobile screenshots + click path | Pending | `/chat`, `/projects`, `/library`, `/workspace`, `/automations` |
| Market/Vault | screenshots + local persistence proof | Pending | `/market`, `/vault` |
| Calm EON City | 2D desktop/mobile screenshots | Pending | `/eoncity` |
| Optional 3D | capable-device screenshot + low-capability fallback | Pending | `/eoncity/3d` |
| Trade safety | UI screenshot + no-execution proof | Pending | `/trade` |
| eon2 referral | valid, tampered, and explicit-expiry link results | Pending | No D1/KV resolver request |
| eon3 Realm | valid Realm link then `/u/<handle>` local verified state | Pending | No cloud Realm registry lookup |
| QR/social | QR camera scan plus copied link in a real share target | Pending | Use generic preview expectation |
| PWA install | Android and iPhone install/update behavior | Pending | Verify start URL and offline wording |
| Data survival | deploy update + Vault/Projects/Library/Automation persistence test | Pending | Export/restore evidence required |
| Headers/CSP | raw Preview headers + console/network capture | Pending | Header proof, CSP report redaction |
| Monetization off | UI + network capture of disabled routes | Pending | No campaign/provider requests |
| Accessibility | keyboard, focus, reduced-motion and basic screen-reader check | Pending | Record blockers honestly |
| CEO release gate | all evidence linked and no blockers | Pending | Final human decision |
