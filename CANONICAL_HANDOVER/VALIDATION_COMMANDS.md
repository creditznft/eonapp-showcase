# Required validation commands

Run from the extracted clean worktree after `npm ci`:

```bash
npm ci
npm run qa:w479-v-voice
npm run qa:w479-p-manual-post
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm audit
npm audit --omit=dev
npm run security:secret-scan
```

Also read and obey the source gates documented in the package for W476, W477, W478 and W479. The current source evidence records **548/548** runnable-product tests, but Codex must rerun the current suite after landing the package in the clean worktree.

A successful local validation does not close deployed browser/CSP/device/PWA/accessibility/recovery evidence, local media adapter proof, or owner GO/NO-GO.
