I attached `EONAPP_FINAL_CODEX_W419_ORIGINAL_VECTOR_ART_2026-06-28.zip`.

Use this W419 source package as the only baseline. Do not merge older handovers over it. Start with `NEXT_CHAT/W419_FINAL_ART_HANDOVER/00_START_HERE_CODEX_W419.md`.

Run:

```bash
npm ci
npm run verify:w419-city-original-vector-art
```

W419 is source-complete. It adds an original 18-piece same-origin SVG art kit, Babylon runtime texture integration, quality tiers and hash/provenance gates. Preserve these boundaries:

- Babylon `/eoncity` remains the sole public City engine.
- No remote art URLs or user data in City assets.
- W419 visual source art is not approved final GLB/KTX2 binary art.
- Do not claim institutional-grade final art until W417 binary-art evidence and device proof are completed.
- W412 Sync stays disabled/fail-closed until dedicated D1/OAuth plus manual two-device proof are complete.

Then deploy preview, collect the manual proof in `04_MANUAL_ART_AND_DEVICE_PROOF_W419.md`, and return a lean source ZIP, checksum, source manifest, actual command outputs, redacted evidence index, remaining blockers and a changed-file list.
