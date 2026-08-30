# Archived pre-W649 edge-asset requirement

This exact W554C test records the former assertion that binary City art required an edge protection layer before integration. W649 approved static Cloudflare Pages delivery instead: authentication controls whether the browser boots Babylon and requests GLBs, while content-hashed GLBs remain normal same-origin static files with no EONCITY-specific Pages Function relay.

This archive is historical and non-certifying. Current certification is in `tests/unit/w554c-eon-city-client-load.test.mjs`, `tests/unit/w649-eoncity-authenticated-entry.test.mjs`, and `tests/unit/w649-eoncity-asset-manifests.test.mjs`.
