# W275-A0 — PWA asset-policy source readiness

- Raised the Service Worker cache generation from `v48` to `v49`.
- Removed Vault and Vault Backup from the precache; they now use protected network-only/no-store navigation.
- Removed automatic replacement-worker activation during install; the existing Profile **Apply update** control now represents the required explicit activation path.
- Added the W275 source contract, gate, negative tests, evidence board and handoff notes.
- Did not claim install, update, rollback, offline or storage-pressure success; those remain real-browser evidence lanes.
