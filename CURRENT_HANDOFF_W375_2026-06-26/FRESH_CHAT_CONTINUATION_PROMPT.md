Read `CURRENT_HANDOFF_W375_2026-06-26/README_START_HERE.md`, then `AUDIT/W375_IMPLEMENTATION_AND_VALIDATION_REPORT_2026-06-26.md` and `AUDIT/W375_CEO_CONTINUATION_DECISIONS_2026-06-26.md`.

The source-of-truth implementation is W375 Market Intelligence. `/trade` is a local-first manual/CSV research workspace with Forecast Oracle calibration. Keep its hard boundary: no network data feed, broker/exchange credentials, orders, custody, personal investment advice, stake, reward, payout, token, cash-out, public forecast market or automatic resolution.

Start W376 only: strengthen local import/schema/provenance/backup behavior and extend W375 tests. Do not begin licensed data, paid advice, data ingestion, or W380 activation.

Before changing source, run `npm run qa:w375-market-intelligence`, `npm run test:unit`, and review `archive/retired-trade-legacy/README.md`. Preserve W359–W374B guest-first, Google-not-a-backup and City-local-only boundaries.
