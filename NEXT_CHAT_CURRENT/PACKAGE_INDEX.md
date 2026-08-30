# Package index

## Code

All runnable app source is at the archive root: package.json, package-lock.json, assets/, config/, functions/, scripts/, tests/, public/, platform-backend/, and route files.

## Begin here

`00_START_HERE__W479_R_NEXT_CHAT.md`

## Current task

`NEXT_CHAT_CURRENT/W479_R_MEGA_PATCH_IMPLEMENTATION_PLAN.md`

## Full forward roadmap

`NEXT_CHAT_CURRENT/MASTER_EXECUTION_ROADMAP_W479_R_TO_W482.md`

## Live evidence

`CITY_EVIDENCE_COMPACT/`

## Existing retained historic plans

- `CANONICAL_HANDOVER/`
- `HANDOVER_DOCS/`
- `NEXT_CHAT/`
- `CURRENT_HANDOFF_2026-06-26/`
- historical CHANGED_FILES / CHANGELOG documents at archive root.

## Build/test starting point

`CANONICAL_HANDOVER/VALIDATION_COMMANDS.md`

The ordinary baseline is:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

Use the NPM fallback only when clean install is blocked by registry reachability.
