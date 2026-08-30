This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start Here — W106 Live Integrations and Contract Mapping

This package resumes after W105 Performance Complete.

## Main command

```bash
npm run qa:w106-live-integrations
```

This runs the W106 source gate and W106 unit tests.

## Full local restore flow

```bash
npm ci
npm run build
npm run qa:w106-live-integrations
npm run qa:w105-performance
npm run audit:site
npm run smoke:build
npm run qa:w104-trading-lab
```

## W106 evidence

Open these files first:

- `CodexDocs/GPT55_W106_LIVE_INTEGRATIONS_CONTRACT_MAPPING_FINAL_HANDOFF_2026-06-11.md`
- `CodexAuditPack/W106_LIVE_INTEGRATIONS_CONTRACTS/W106_FINAL_VERIFICATION.json`
- `CodexAuditPack/W106_LIVE_INTEGRATIONS_CONTRACTS/W106_INTEGRATION_MATRIX.json`
- `CodexAuditPack/W106_LIVE_INTEGRATIONS_CONTRACTS/W106_CONTRACT_MAP.json`
- `CodexAuditPack/W106_LIVE_INTEGRATIONS_CONTRACTS/W106_SMART_CONTRACT_HASHES.json`

## Boundaries to preserve

- Do not enable live trading without a separate provider-specific implementation and live proof.
- Do not edit `Smart Contracts/` in W106/W107 unless explicitly starting a contract phase.
- Do not put provider keys, bot tokens, payment secrets, RPC secrets, wallet private keys, or exchange secrets into static assets.
- Treat credential-bound integrations as configured only after Cloudflare env bindings and provider callback tests pass.

## Next phase

W107 is final independent certification: repeat all W104-W106 checks, verify physical mobile devices, verify real provider callbacks, verify Polygon addresses/source, and package the final release candidate.
