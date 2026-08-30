# W399 Dependency Audit Note

`npm audit` was run while preparing this handover.

- Total: 6 findings
- High: 4
- Moderate: 1
- Low: 1
- Critical: 0

Packages in the reported dependency paths include `wrangler`, `miniflare`, `undici`, `ws`, `js-yaml`, and `esbuild`.

This is intentionally not auto-fixed. Codex must create a separate dependency update change, inspect compatible version changes, run the full W399 verification composite, and return build/test outcomes. Do not run a blind `npm audit fix` on the deployment candidate.
