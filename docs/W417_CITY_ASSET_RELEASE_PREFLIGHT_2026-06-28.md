# W417 — City Asset Release Preflight

## Purpose

W417 is the release gate for future original/licensed City binary art. It does not add, approve or load any binary in this source package.

The current source package has **no approved binary art**. The current procedural Babylon scene remains the visible fallback.

## Required before one binary can ship

1. Update the City asset catalog only after provenance review.
2. Create a local manifest with an asset ID, same-origin GLB path, SHA-256, local evidence path, lod0/lod1/lod2 paths, KTX2/Basis Universal declaration and budget metrics.
3. Add a local `docs/city-art/...` provenance record with licence/original-work evidence and a human review result.
4. Keep every binary under `assets/city/`; no remote URL, user content or provider output is permitted.
5. Validate real file hashes:

```bash
node scripts/city-asset-release-preflight.mjs --manifest docs/city-art/release-manifest.json
```

6. Capture desktop, Android and iOS visual/performance evidence before wording any release as flagship art.

## Truth boundary

This is not final art. The preflight validates release discipline, not visual quality, art direction, GPU performance, texture appearance or real-device controls.

> **W611 current-state note (4 July 2026):** W602–W604 add local, same-origin engineering-candidate GLBs. They may be loaded only through the source-controlled catalog and preserve a procedural fallback. They are **not final art**: no human art/licence clearance, KTX2/Basis final packaging, real-device visual/performance evidence, authenticated City closure, or owner approval is claimed by this preflight summary.
