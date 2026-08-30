# Start Here — W618B

Continue EONAPP from W618B.

Use the W618B source package as baseline. First run:

```text
npm ci
npm run qa:w618b-share-command-center-shell
npm run qa:w618a-eon-city-command-world
npm run qa:w617b-launch-master-plan
npm run qa:w616b-eon-keys-referral
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run launch:readiness
```

Then code W618C:

**W618C = EON Command Room default.**

Build the practical first layer of EON City:

- Default `/eoncity` experience becomes a usable 3D Command Room/cockpit.
- Keep existing City districts/assets as Explore mode.
- Big clickable panels: EONBOT, Projects, Forge, Studio, Local AI, Automations, Vault, Share.
- Keyboard shortcuts: C/EONBOT, P/Projects, F/Forge, S/Studio, L/Local AI, A/Automations/Apps, V/Vault, M/Map, Esc/Menu.
- Use existing custom City assets and animations where possible.
- No fake agent work, fake activity, checkout, live rewards, click tracking, or server entitlement grants.

Roadmap carried forward:

```text
W618C Command Room default
W618D Living Dashboard signals
W618E Agent Theater foundations
W618F browser/mobile proof
W619 Dodo/server ledger work
```
> historical-only
Use `CURRENT_PRODUCT_START_HERE.md` for current instructions.
Historical provenance is preserved in `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md`.
