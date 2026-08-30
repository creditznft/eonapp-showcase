I attached `EONAPP_FINAL_CODEX_W421_CITY_ART_COMPOSITION_2026-06-28.zip`.

Use this W421 package as the only baseline. Do not merge older handovers over it. Start with `NEXT_CHAT/W421_FINAL_CITY_ART_HANDOVER/00_START_HERE_CODEX_W421.md`.

Run:

```bash
npm ci
npm run verify:w421-city-art-review
```

W419–W421 complete the source-controlled City art/composition pass: 18 original local SVG assets, runtime integration, PBR color/atmosphere profiles and a City Controls Art review panel with six safe local compositions.

Keep these facts exact:

- `/eoncity` Babylon is canonical.
- Assets are same-origin and local; no remote art URL or private data is used.
- The vector/procedural City is shipped source art, **not** a final human-approved GLB/KTX2 art release.
- Do not call it institutional-grade final art until W417 binary-art provenance/LOD/device evidence and human review are complete.
- Sync remains fail-closed until D1/OAuth/two-device proof is captured.

Deploy a preview, execute the manual proof checklist, return redacted screenshots/video index plus all defects, and package a lean updated source archive with checksum, manifest, exact command output and remaining blockers.
