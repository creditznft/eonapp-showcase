# EONAPP W745 — Codex Test, Visual Certification and Preview Handover

## Authority

- Branch to continue: `chatgpt/w737-city-recovery`
- Local source branch: `w737-city-recovery-local`
- Parent W744 commit: `d4a05ded5f05ebb9483db0bdfb0ec1de17e3aad3`
- Exact W745 commit/tree: recorded after final freeze in the package manifest
- Exact live production commit remains: `e1957ffdbc12f831879980e4c3b3195abe2c6eb9`
- Exact live production tree remains: `310dba12cc1b2c2c34d2e76e7532e44a1ccde710`
- Exact live candidate digest remains: `22fd2d8d916a0ab8bb4f4d1da50be37910ebd46e82444a9ac3296851f8906e5f`

W745 is source-complete but not deployment-certified. Do not deploy directly to production.

## Mandatory first steps

1. Restore the frozen W745 source and verify package SHA-256 values.
2. Use Node 22.
3. Install from the unchanged lockfile. Do not regenerate or opportunistically upgrade dependencies.
4. Confirm a clean working tree before testing.
5. Read:
   - `EONAPP_W745_FINAL_CITY_QUALITY_SUMMIT_2026-07-29.md`
   - `EONAPP_W745_VALIDATION_RECEIPT_2026-07-29.md`
   - the retained W744 completion/red-team documents.

## Required commands

```text
npm ci
npm run qa:w745-final-city-polish
npm run qa:w745-final-city-polish:assets
npm run build
npm run qa:w743-city-performance-cache-hardening:browser
npm run qa:w744-command-centre-completion:browser
npm run qa:w745-final-city-polish:browser
```

Then run the maintained full unit, lint, route, security, service-worker, authenticated-browser and predeploy suites used by the repository. Do not weaken or skip a failing gate.

## W745 browser proof contract

The W745 spec must prove:

- runtime provenance `eon-city-command-centre-w745-1`;
- visible-frame gate completion;
- ten station triads;
- complete physical 3D Nexus;
- nine animated circuit pulses;
- Pathfinder non-static idle modes;
- EONBOT formation follow while moving;
- EONBOT structure scout, terminal inspect, host greet, Nexus spiral, circuit scan, playful loop, dock check and return formation;
- scout distance never exceeds 8.4 world units and station approaches avoid structure origins;
- no automatic station activation, navigation, docking or autonomous-agent claim;
- Share Command Center, Creator Capture and contextual non-ad Plans & Access remain present;
- zero page errors.
- assigned GLB bytes and hashes match the frozen manifest, with the exact Pathfinder 11-clip inventory present.

## Headed visual certification

Capture screenshots and a gameplay recording in real headed Chrome, Edge and Firefox covering:

- arrival composition and camera clearance;
- physical Nexus from multiple angles;
- Pathfinder idle-alt, inspect, pose and wave transitions;
- every EONBOT presentation state and its scan/greeting effects;
- all ten station structures, terminals and NPCs;
- Security Sentinel at Command Status with no coat deformation;
- NPC home-to-terminal movement with no walking in place;
- circuit-board floor, data pulses, station traces, lights, portals and beacons;
- Transit Capsule, Maintenance Worker and street-light network;
- Share/Creator Capture review flow;
- Plans & Access confirmation boundary;
- lite, balanced and cinematic modes.

## Stop conditions

Stop before preview, merge or production if any of the following occurs:

- any page/route is missing;
- any active character clips, drifts, deforms or walks in place;
- EONBOT activates a station or exceeds its bounded scout distance;
- Pathfinder uses walk/run while stationary;
- duplicate Babylon runtime ownership appears;
- the 3D Nexus is absent or replaced by only a UI panel;
- any station lacks structure, terminal or NPC interaction;
- Creator Capture uploads/posts automatically;
- Plans looks like an ad or starts checkout without confirmation;
- cache/runtime/service-worker provenance differs;
- preview output differs from the frozen source authority.

## Release sequence

1. Complete all local build and browser gates.
2. Produce a preview deployment only.
3. Record preview commit, tree, build digest and deployment ID.
4. Owner visually reviews the preview.
5. Fix and retest any issue; do not patch production directly.
6. Obtain a separate explicit owner production GO.
7. Merge/promote only after GO.
8. Record final production authority and rollback deployment.
