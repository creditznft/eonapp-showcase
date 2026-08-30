This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# START HERE — W104 Trading Lab Progress Snapshot

**Date:** 2026-06-11  
**Baseline:** W103 Creator and Automation OS balanced complete package  
**Status:** Stable W104 progress snapshot, packaged before chasing further browser-proof loops.

## What is implemented

- W104 Trading Lab mounted on `/trade`.
- Research-first guarded trading terminal.
- Dynamic exchange instrument discovery: tradable pairs are derived from user balances and exchange metadata, not from a hardcoded coin list.
- Owned-asset-aware universe planning for spot and eligible exchange instruments.
- Strategy research and backtesting engine with deterministic candles.
- Next-bar execution to reduce look-ahead bias.
- Fees, spread and slippage included in backtests.
- Walk-forward chronological out-of-sample scoring.
- Paper trading engine with simulated fills and no external side effects.
- Real-price shadow-mode architecture records observations only and cannot create orders.
- Strategy/model tournament using identical data and risk-adjusted metrics.
- Rebalancer is planning-only.
- Optional margin module is simulation/planning-only, supports 2x-3x risk modelling, and is blocked from live execution.
- Copy-trading design is governance-gated and paper-first; live auto-copy is blocked in W104.
- Legacy live-trading dashboard/orchestrator are hardened compatibility facades with no network execution.
- `/trade` no longer collects exchange API secrets directly; it uses Vault-reference boundaries only.
- Mobile CSS fix prevents the older Trade hero/header from intercepting Trading Lab tabs.
- W104 UI copy is present for the 11 release languages.

## Verification passed in this snapshot

- `npm run qa:w104-trading-lab`: **66/66 static/product gate + 12/12 unit tests passed**
- `npm run build`: **passed**
- `node scripts/site-audit.mjs`: **passed — 62 HTML files scanned**
- `npm run smoke:build`: **passed — 14 required files present**

## Browser proof status

A browser proof harness and screenshots are included, but this chat froze the scope before rerunning a final full browser matrix because the environment repeatedly introduced Chromium/browser-policy proof issues and then small production UI proof defects. Do not claim full final W104 browser certification from this progress snapshot alone. Run the browser proof again in a clean Playwright/Chromium environment before marking W104 final.

## Required next step

Continue W104 from this snapshot with:

1. Clean-environment browser proof for desktop and mobile.
2. Accessibility and reduced-motion pass for the Trading Lab.
3. More exchange-metadata fixture coverage.
4. Explicit W104 final verification JSON.
5. Lean final W104 package with checksum and handoff.

## Hard safety rules to preserve

- No profit promises.
- No live trading in W104.
- No API secrets in DOM, logs or workflow exports.
- Live execution remains blocked until W106 provider-specific proof.
- Margin is optional simulation only.
- Copy trading is paper/watchlist/governance only, not live auto-copy.
- No smart-contract modifications.
- No GitHub commit or push unless explicitly requested.
