# W660O Next-Chat Handover

Use the W660O complete source ZIP as the editing authority. Do not restart from W660N-R3 except for rollback comparison.

## Parent live production

- Project: `eonapp-ch`
- Custom domain: `https://eonapp.ch`
- Current live W660N-R3 deployment before W660O: `88bd083a.eonapp-ch.pages.dev`
- W660N-R3 source commit: `51c547fe6036a06b84c913a406237381e5b3a11f`
- W660N-R3 candidate: `eabed2e51a1a6f4b49b9f5a83dc399ed969946b7088e8b2f64d2286960599f29`
- Immediate rollback known from R3: `8ca40eef.eonapp-ch.pages.dev`

W660O has not been deployed.

## W660O work completed

- Billing and Support receive restrained Nexus continuity without replacing their classic site shells.
- Restrained Nexus controls remain visibly labelled.
- Nine physical City Nexus stations receive overhead state-coloured beacons.
- Production build verification fails if these outputs disappear.
- Focused/inherited Nexus gates, lint, build, smoke and secret scan passed.

## Next action

1. Verify the W660O ZIP and extract cleanly.
2. Run `npm ci`.
3. Run `npm run qa:w660o-nexus-launch-continuity`.
4. Run the W660N/W660F/W660G/W660H/W660C Nexus gates as listed in the receipt.
5. Run lint, production build, smoke and secret scan.
6. Create a complete Pages deployment root with recursive Pages Functions support; never deploy nested `dist/` alone.
7. Preserve current production and rollback IDs.
8. Deploy W660O to Preview first when auth-capable visual testing is available, or use a controlled production acceptance deployment.
9. Capture Billing, Support, restrained-route and all-nine-City-beacon evidence.
10. Continue the remaining nine-district, Opera and mobile launch matrix without broad redesign.

## Safety boundaries

- One EONBOT, one project/task state and one review model.
- No automatic approval, navigation, voice capture, sharing, payment or provider request.
- Billing authority remains server-side.
- Support never sends evidence or secrets automatically.
- Do not change DNS, OAuth, bindings, secrets or environment variables without a proven defect.

## Packaged source authority

- Complete source package: `EONAPP_W660O_NEXUS_LAUNCH_CONTINUITY_COMPLETE_SOURCE_2026-07-21.zip`
- Authority manifest: `W660O_SOURCE_AUTHORITY_MANIFEST_2026-07-21.json`
- Authority verifier: `scripts/w660o-verify-source-authority.mjs`
- Required first command: `node scripts/w660o-verify-source-authority.mjs`
- Expected payload before dependency installation: **4,997 files** may change after final handoff documents are added; use the packaged manifest as source of truth.
- Do not deploy the W660O source ZIP directly. Build and stage a complete Pages root first.
