# Codex Prompt — Apply and Validate W405 Live UX + EON City Rescue

Continue from the W405 source handover. Treat it as an overlay on the current active EONAPP repository; do not reintroduce old retired source bundles.

## First: preserve safety boundaries

Do **not** activate or add:

- Collection grants, Vault Reveals, EON Relay links/attribution/rewards, referral payout/coupon/credit/subscription-time logic;
- payment processor keys, billing, checkout or subscriptions;
- social OAuth, stored platform tokens, posting, scheduling or analytics;
- external Action Gateway execution;
- public GitHub/Cloudflare deployment for user projects;
- a second public Three.js/Realm City route.

Do not copy credentials, `.env.local`, Cloudflare tokens or Google client secrets into source, commits, docs, test fixtures or handover ZIPs.

## Run the exact source gate

Use Node 22 and run:

```bash
npm ci
npm run verify:w405-live-rescue-source
```

Do not claim green unless it completes. Expected current source result is 334/334 current runnable tests, strict lint, all specified gates, build, smoke, site audit and launch readiness.

## Review the W405 scope

Read:

- `HANDOVER_DOCS/EONAPP_W405_LIVE_UX_CITY_RESCUE_IMPLEMENTATION_HANDOVER_2026-06-28.md`
- `HANDOVER_DOCS/W405_LIVE_UX_CITY_RESCUE_MANUAL_PROOF_2026-06-28.md`
- `docs/W405_EON_CITY_CHAT_SHELL_AND_ART_RESCUE_PLAN.md`

Confirm these source rules:

1. `/eoncity` is canonical Babylon City.
2. `/realm`/old world navigation redirects to `/eoncity` after the PWA update.
3. `/eoncity/tour` / `/eoncity/3d` are temporary compatibility previews only and never primary navigation.
4. Guest Sign in is visible, acknowledgement-gated, identity-only, and never claims backup.
5. Chat popovers are contextual and dismissed safely.
6. City keyboard works after HUD clicks; Reset view exists.

## Production deployment and manual proof

After the source gate passes, deploy through the canonical GitHub → Cloudflare workflow. Do not manually alter route contracts or bind legacy referral databases.

Before live OAuth proof:

- Rotate the Google OAuth client secret if the currently configured secret was exposed in setup conversation.
- Update **only** the masked Production Cloudflare secret field.
- Keep Google OAuth in `testing` and keep Preview OAuth disabled.

Then collect redacted manual proof:

- guest header Sign in → acknowledgement → Google test account → return route;
- refresh session persistence;
- logout;
- account deletion only with a disposable test account;
- collapsed rail hover labels / no clipped labels;
- Search, More and Profile anchor beside their triggers;
- `/realm#my-realm-3d` becomes `/eoncity` after service-worker update;
- desktop keyboard/mouse/Reset view, and real Android/iOS touch controls;
- screenshot/video evidence.

## W406 onward — do not improvise the art direction

The present procedural district is still a vertical slice. Do not market it as AAA. W406–W410 need a small authored City kit with asset provenance and real performance proof:

- W406A interaction proof;
- W406B asset intake/manifest;
- W407 Arrival District art rebuild;
- W408 Creator + Forge district;
- W409 NPC/weather/city life;
- W410 visual/performance/device certification.

Use authored/licensed GLB/GLTF hero landmarks and a restrained procedural system for secondary variation. Do not solve City quality by generating additional raw cubes or giant floating labels.

At completion, return:

1. exact command outputs;
2. deployment URL/commit;
3. redacted OAuth/device evidence;
4. unresolved issues;
5. a changed-file list and checksum-verified lean handover.
