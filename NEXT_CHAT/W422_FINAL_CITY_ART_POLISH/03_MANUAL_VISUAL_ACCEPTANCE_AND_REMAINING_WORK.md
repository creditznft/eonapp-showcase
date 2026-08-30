# W422 Manual Visual Acceptance and Remaining Work

## Manual City art acceptance

Use the City Controls > Art Review surface. Review the ten curated views at Lite, Balanced, and Cinematic.

Accept only when:

- visual hierarchy is readable within the first few seconds;
- Arrival Gate makes the next useful action obvious;
- no SVG plane/prop visibly clips, shimmers, blocks controls, or crowds the movement route;
- wet street, glass, graphite, skyline and district marks read as one visual language;
- low-tier mode remains clear rather than simply dark or empty;
- reduced-motion mode removes or minimizes optional motion without hiding routes;
- mobile safe areas and touch controls remain accessible;
- no error, external request, remote art, user data, telemetry, media capture, or upload is observed.

Log each issue with: view name, device/browser, viewport, quality tier, steps, expected/actual result, and a clean redacted screenshot/video reference.

## Remaining work by ownership

### Codex / deployment operator

- deploy preview and production carefully;
- collect actual device/OAuth/Sync evidence;
- preserve route/cache behavior;
- generate the return handover required in `02_CODEX_DEPLOY_PROOF_AND_RETURN_HANDOVER.md`.

### Art owner / reviewer

- decide whether W422 local original vector art is visually accepted as the shipped fallback;
- commission/create/acquire only properly licensed final GLB/KTX2 art if desired;
- approve provenance, rights, quality, and visual consistency;
- do not call final binary art institutional-grade before human review and device evidence.

### Cloudflare / identity operator

- retain safe Google OAuth production settings and test accounts;
- provision `EON_SYNC_DB` only when Sync proof is scheduled;
- run D1 migration and two-device drill;
- never put secrets into source archives or chat.

## Explicit non-completions

W422 does not itself provide final approved GLB/KTX2 assets, real desktop/Android/iOS captures, a production OAuth session recording, a D1 two-device Sync proof, or an art rights/review decision. These are necessary next steps, not coding omissions hidden by the package.
