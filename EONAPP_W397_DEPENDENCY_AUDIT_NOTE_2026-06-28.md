# W397 Dependency Audit Note

Command run locally:

```bash
npm audit --json
```

Result: 6 findings — 4 high, 1 moderate, 1 low; no critical findings.

Affected packages reported by the current lockfile:

- `wrangler` / `miniflare` chain (high)
- `undici` (high)
- `ws` (high)
- `js-yaml` (moderate)
- `esbuild` (low)

The audit reports fixes are available. No dependency upgrade was applied in this
handover because a blind upgrade can alter the build, Pages Functions and local
development behavior. Codex should evaluate the exact lockfile update, run the
full W397 suite again and record the outcome before deploy.

