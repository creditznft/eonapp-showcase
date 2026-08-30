# Start Here — W618A EON City Command World

Use this package as the baseline after W617B.

## What changed

W618A starts the approved EON City rebuild direction:

- Keep existing City districts/assets.
- Make Command Room the default product direction.
- Keep Living Dashboard and Agent Theater as planned layers.
- Fix the source-level left/right movement convention.
- Enable direct City mouse travel/click movement by default.
- Add readable Command Room shortcuts and Share entry in City.
- Clean `account` / `accountCode` OAuth return query parameters from the visible URL after capturing a sanitized notice.

## Command order for the next worker

```bash
npm ci
npm run qa:w618a-eon-city-command-world
npm run qa:w617b-launch-master-plan
npm run qa:w617a-shell-launch-readiness
npm run qa:w616d-locked-feature-surfaces
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run launch:readiness
npm run launch:page-gate
npm run launch:identity-gate
npm run launch:quality-gate
npm run security:secret-scan
```

## Next wave

Start W618B: global top-right EON Share Command Center and compact shell/sidebar simplification.

Do not start live Dodo checkout or live EON Key/referral grants until City usability, global Share/shell, Command Room and browser/mobile proof are complete.
> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.
