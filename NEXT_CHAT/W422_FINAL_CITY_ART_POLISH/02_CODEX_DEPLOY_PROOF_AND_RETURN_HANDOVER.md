# W422 Codex Deployment, Proof and Return Handover

## Safe deployment steps

1. Start from the W422 archive only.
2. Run the individual source checks listed in `00_START_HERE_CODEX_W422.md` and record actual command output.
3. Deploy a preview first. Confirm `/eoncity`, legacy `/realm#my-realm-3d` redirect, and service-worker update behavior.
4. Do not enable Cloudflare Sync, Google production OAuth, social connectors, posting, billing, actions, or final-3D-art claims just because the source compiles.

## Required production/manual proof

### City visual and controls

- Desktop Chrome/Edge: keyboard movement, mouse look, HUD interactions, pause/resume, reset, Command Deck, Art Review filters, all ten views.
- Android Chrome and iOS Safari: touch joystick, camera swipe, safe areas, portrait/landscape, reduced motion, Lite/Balanced/Cinematic fallback behavior.
- Capture clean screenshots/video without DevTools/debug overlays.
- Record browser/device, OS, viewport, date/time, route, quality tier, defect status.

### Google identity

Use a disposable approved Google test account in production testing mode. Verify visible Sign in, compact modal, Google chooser, return-to-origin route, refresh persistence, logout, guest local-work retention, and redacted screenshots. Do not expose credentials.

### EON Sync Basic

Only after `EON_SYNC_DB`, identity configuration, and explicit proof flags are ready:
- Device A guest work -> sign in -> explicit opt-in/import.
- Device B sign in -> explicit merge/import choice.
- Offline edits -> reconnect -> documented conflict result.
- Tombstone deletion propagation, sign out/in, empty-device recovery.
- Confirm Vault/API/recovery keys never sync without separate secure-vault proof.

### Final binary 3D art

Before publishing any “final/institutional-grade 3D art” claim, provide a W417 asset manifest with:
- art creator/license/provenance documents;
- exact file SHA-256 values;
- GLB/KTX2/Basis optimized outputs;
- LOD, texture, triangle, draw-call, memory, and mobile fallback budgets;
- desktop/Android/iOS captures;
- named human visual/rights reviewer approval.

## Mandatory return handover to ChatGPT

Return one lean archive under 200 MB and one compact docs package. Include:

- `00_START_HERE_RETURN_TO_CHATGPT.md` with status and source baseline;
- exact changed-file manifest and `SHA-256` source manifest;
- every command and actual pass/fail result;
- production preview URL and deployment commit/branch reference;
- redacted OAuth evidence index;
- City screenshot/video index with devices, viewport, quality tier, route, and defects;
- Sync evidence index, D1 migration identifier, conflict/deletion/recovery results;
- art intake manifest, rights/provenance evidence, assets hashes, LOD/budget table and reviewer decision;
- unimplemented/blocked items, not vague “done” wording;
- no `.env`, tokens, credentials, browser profiles, `node_modules`, `dist`, caches, reports, or customer data.

Do not claim completion based only on build output. State which evidence was captured and which was not.

Use `09_CODEX_RETURN_STATUS_TEMPLATE.md` for the return status document so subsequent ChatGPT work can continue from verified evidence.
