# COPY/PASTE TO CODEX — W765R8 + W766I FINAL

Use the supplied W765R8/W766I final overlay as a one-time continuation from the exact deployed production commit:

```text
5919e3e4085aa8fc0d2f3b3a5dfed80de7c219be
```

Production authority:

```text
https://eonapp.ch/eoncity
Deployment: 95329a90-47d7-48f3-912b-f979cc9d4301
Rollback: 5e9cdcb5-b21e-4c94-b540-8eb930b4417f
```

Do not use the local audit Git bundle as production ancestry. Create a fresh real branch from deployed commit `5919e3e…`, apply the overlay once, and verify the changed-file ledger. Do not stack any earlier W765R8 or W766 patches.

## Required work

### 1. Restore exact toolchain

- Node 22
- npm 11
- exact `package-lock.json`
- a registry that contains `ws@7.5.11`

Run `npm ci` without modifying the lockfile merely to bypass the environment blocker.

### 2. Run source gates

At minimum:

```text
npm run lint -- --max-warnings=0
npm run build
npm run security:secret-scan -- --allow-no-history
node scripts/w745-launch-asset-binary-integrity.mjs
node scripts/w649-eoncity-asset-acceptance.mjs
node --test tests/unit/w698-expanse-open-world-presentation.test.mjs \
  tests/unit/w754-cast-eonbot-npc-schedules-transit.test.mjs \
  tests/unit/w755-environment-art-audio.test.mjs \
  tests/unit/w760-w765-command-core-convergence.test.mjs \
  tests/unit/w760-w765-runtime-integration.test.mjs \
  tests/unit/w765*.test.mjs \
  tests/unit/w766*.test.mjs
```

Then run the maintained repository suite and existing predeploy/certification gates. Do not reduce or rewrite failing gates merely to make the candidate pass.

### 3. Verify W765R8 Hub integrity

Authenticated headed browser evidence must confirm:

- Interior and exterior wall-display faces are both readable and not mirrored.
- Both faces route to the same maintained workspace.
- Mission Board and Expanse Gate are visible and actionable.
- Keyboard, arrows, touch controls, camera, NPCs and Transit remain stable.
- No silent primary control.

### 4. Verify Expanse entry lifecycle

Prove:

```text
Hub → review → cancel
Hub → review → explicit enter → loading → Gateway Overlook
Expanse → explicit return → restored Hub player/camera/input/UI
```

Repeat entry/return at least ten times while checking:

- one canvas;
- one Engine;
- one Scene;
- one render loop;
- no duplicate roots or observers;
- no growing GLB containers, animations or UI nodes;
- stable browser memory after disposal/GC opportunity.

### 5. Complete a real six-mission campaign

Use physical world interactions only:

1. Beyond the Gate
2. First Light
3. Echoes in the Archive
4. The Broken Line
5. Horizon Reconnected
6. The First Reveal

Verify exact total campaign XP `1,940`, final campaign level `8`, one Signal Vanguard Reveal, one cosmetic activation and one campaign receipt. Refresh at multiple steps and prove no duplicate XP/reward.

### 6. Verify living-frontier retention loop

Travel outside the hero region and prove:

- deterministic sector regeneration;
- no visible supported-traversal hard border;
- roads and region identities remain coherent;
- authored Signal Frontier is protected from procedural overlap;
- all three streaming rings behave correctly;
- macro skyline/population/discovery roots dispose on return;
- frontier contracts require landmark review plus three ordered physical field actions;
- all six contract families appear across suitable seeds/regions;
- procedural discoveries award canonical XP once;
- bounded events never block Hub return;
- side and productive missions remain explicit and receipt-backed.

### 7. Verify real 3D assets

Inspect primary and fallback assets in headed Chromium:

- Pathfinder Prime and fallback Vanguard
- Navigator Archive Vault
- EON X1 Maintenance Worker / Lost Worker
- Ascension Portal
- Holo Map Beacon
- AI Tower Core at Beacon Fields
- Navigator Arc
- Transit Core
- Genesis Core
- Forge Basilica distant silhouette
- productive terminals and route lamps

Correct only evidence-backed problems such as scale, rotation, grounding, material, animation mapping, deformation or collision. Do not invent asset evidence.

### 8. Visual acceptance

Inspect Lite, Balanced and Cinematic:

- five authored zones have distinct readable identities;
- routes are legible;
- skyline has near/mid/far depth;
- weather/fog do not hide objectives;
- Beacon, Archive, Transit and Vault restoration changes are visible;
- objective marker and Mission Board do not obstruct play;
- Transit camera remains comfortable;
- reduced motion works;
- mobile keeps meaning while reducing density.

### 9. Preview only

After all local gates pass, deploy one Cloudflare Preview candidate. Capture:

- release/commit/digest authority;
- desktop screenshots/video;
- mobile/touch screenshots/video;
- console/network evidence;
- campaign receipts;
- memory/disposal observations;
- visual defect ledger.

Repair defects on the same branch and Preview lineage. Do not deploy production until the owner explicitly approves the exact candidate.

### 10. Production

After explicit approval:

- verify Preview authority matches the approved commit/tree/build digest;
- deploy once to production;
- run production smoke tests;
- preserve rollback deployment `5e9cdcb5-b21e-4c94-b540-8eb930b4417f`;
- report exact deployment ID, commit, tree, candidate/payload digests and captured evidence.

Never claim a deployment, browser result or visual score that was not actually observed.
