# W655 — Codex End-to-End Deployment and Certification Runbook

## Inputs

Codex receives:

1. Exact W655 source checkpoint.
2. Exact W655 deployable `dist` candidate.
3. This certification handover.
4. Existing owner-controlled `.env.local` already present on the Codex machine.

Never copy, print, upload, commit, attach or place `.env.local` in evidence. Use only the minimum keys needed for the relevant live test. Redact tokens, session values, cookies and personal identifiers from screenshots, HARs and logs.

## Stage A — integrity and local replay

1. Verify outer ZIP SHA-256 files.
2. Verify internal manifest hashes.
3. Confirm source receipt and exact `dist` digest.
4. Run `npm ci` in source.
5. Run `npm run verify:w655-eoncity-executive-certification`.
6. Run full maintained tests using the project’s checkpoint-resume runner.
7. Run build, smoke, route, identity, quality, readiness, secret scan and dependency audit.
8. Do not rebuild the provided exact `dist` for initial Preview evidence.

## Stage B — guarded Cloudflare Preview

Dry-run and inspect:

```bash
node scripts/w655-codex-pages-deploy.mjs --mode=preview --project-name=eonapp-ch --dist=dist
```

Deploy after digest confirmation:

```bash
node scripts/w655-codex-pages-deploy.mjs --mode=preview --project-name=eonapp-ch --dist=dist --execute
```

Record Preview URL, deployment ID, branch and exact digest. Do not use production yet.

## Stage C — clean signed-out proof

Use a new clean browser context. Capture desktop/mobile screenshots, HAR and console. Prove:

- premium entrance and value proposition;
- Google CTA same-origin auth route;
- no Babylon, GLB, Meshopt, City audio or private project requests;
- no unsafe redirects, layout clipping or console errors.

## Stage D — real Google-authenticated proof

Use the owner’s already logged-in Chrome profile and real Google identity flow. Do not fake the final auth lane. Prove authorization precedes heavy runtime loading and capture the complete boot waterfall to first playable frame.

## Stage E — Command Room and native route matrix

Test every primary and systems lane. First click must review; second explicit action may open the canonical native route. Verify EONBOT, Projects, Create, Forge, Library, Research, Automations, Workspace, Local AI, Vault and Realm Studio. Return to EONCITY after each route.

## Stage F — district and real-work terminal matrix

Visit every district. Confirm its stated productivity role and entertainment role. At each terminal:

1. approach/select;
2. capture review state;
3. confirm no route or work executed yet;
4. explicitly open;
5. prove correct native route and usable operation;
6. return to City without losing local state.

Realm Relay and Local AI Observatory are mandatory CEO gates.

## Stage G — controls and devices

Execute the complete W655 controls matrix for keyboard, touch, D-pad, mouse/click-to-move and controller. Test four camera headings, camera cycle/reset, interact review, map, pause/resume, context loss and repeated City restart. No inverted direction, duplicate listener or hidden confirmation is permitted.

## Stage H — art, animation and district composition

Capture all active characters and major props. Compare Pathfinder Prime against Pathfinder A. Review lighting, materials, texture resolution, floor contact, rotation, clipping, deformation and animation transitions. Confirm street lamps, terminals, signage and repeated low-cost furnishings make the City feel populated without blocking traversal.

## Stage I — update/cache and resilience

Prove cold cache, warm cache, shell-only update, one changed model, fallback variant, browser cache eviction and site-data clear. Confirm unchanged content-hashed GLBs are reused and only required districts load.

## Stage J — full EONAPP live regression

On Preview, test sign-in/out, EONBOT, projects, workspace, Forge, library, Local AI, Vault, Realm, automations, settings/help/install, sharing/referral visibility and subscription/billing read paths. Do not create real charges or destructive actions without a separately approved test account/plan.

## Stage K — evidence validation

Place evidence in `CODEX_W655_EVIDENCE/`, then run:

```bash
node scripts/w655-validate-codex-evidence.mjs --folder=CODEX_W655_EVIDENCE
```

The validator must pass. Missing evidence is not a pass.

## Stage L — production promotion

Create `OWNER_W655_PRODUCTION_GO.json` only after owner review. It must include exact digest, Preview URL/deployment, `previewCertified:true`, `overallScore>=9.5`, `criticalDefects:0`, and `productionGo:true`.

Dry-run:

```bash
node scripts/w655-codex-pages-deploy.mjs --mode=production --project-name=eonapp-ch --branch=main --dist=dist --owner-go-file=OWNER_W655_PRODUCTION_GO.json
```

Deploy only after the dry-run guard passes and owner explicitly says GO:

```bash
node scripts/w655-codex-pages-deploy.mjs --mode=production --project-name=eonapp-ch --branch=main --dist=dist --owner-go-file=OWNER_W655_PRODUCTION_GO.json --execute
```

After production, repeat signed-out/authenticated smoke, headers, console, critical routes and rollback readiness on `https://eonapp.ch`.
