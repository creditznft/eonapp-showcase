# EONAPP Dependency Audit Note — 2026-06-28

`npm audit` in the W404/W388A.1 source found 6 vulnerabilities:

| Severity | Count | Direct/top-level affected path |
|---|---:|---|
| High | 4 | `miniflare`, `undici`, `wrangler`, `ws` |
| Moderate | 1 | `js-yaml` |
| Low | 1 | `esbuild` |
| Critical | 0 | — |

All reported a fix as available. No automatic dependency update was applied in this handover. The high findings travel through the Cloudflare/Wrangler/miniflare dependency chain, so update the lockfile in a dedicated security wave, then repeat Node 22 install, unit suite, build, smoke, site audit, launch readiness, and any Cloudflare workflow validation.

This note is not a security certification.
