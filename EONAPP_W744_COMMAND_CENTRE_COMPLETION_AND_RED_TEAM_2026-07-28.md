# EONAPP W744 — Command Centre completion and red-team authority

Date: 2026-07-28  
Source branch: `w737-city-recovery-local`  
Deployment state: **local source only — not pushed, merged or deployed**

## CEO decisions frozen in W744

1. EONCITY remains one Babylon engine, one scene and one render loop. The Command Centre, outside discovery ring and 3D Nexus are one bounded experience; no retired district belt, second Nexus runtime or automatic Expanse mount returns.
2. Every launch destination is a purposeful 3D micro-location with three explicit interaction paths: **structure, terminal and NPC**. All three open the same maintained work surface for that station.
3. The damaged coat character in the owner screenshot is the Architect at **Command Status**. It is removed from the active cast and replaced by the stable `security-sentinel`. The Share host remains `citizen-variant`; the stable Holo Operator remains at Automation Theatre.
4. Command Status no longer depends on the unclear `/workspace` advanced page. Its maintained surface opens Projects, Library and Automations, with `/projects` as the normal-page fallback.
5. Station NPCs may take short bounded routes between their home position and terminal. A walk clip is permitted only while the anchor is actually changing position. At a station they idle, talk, wave or use the terminal; they never walk in place. Exterior citizens retain real walk/run loops.
6. Share Command Center is a permanent HUD and City Menu action. Creator Capture stays inside the sharing flow and can prepare gameplay media with a reviewed referral-ready link. Nothing posts automatically.
7. Plans & Access remains contextual membership discovery, never an ad. It does not interrupt play and cannot start checkout without explicit review and confirmation.
8. Existing content-hashed local 3D assets are used before any new asset request. Procedural geometry is a branded failure-safe, not the visual target.
9. The visible authored frame does not reveal until the five core environment assets and both hero characters (Pathfinder and EONBOT) have completed their bounded load attempt. A 12-second degraded fallback prevents a blank or stuck City without falsely claiming authored readiness.
10. All active READY W649 world assets are assigned to purposeful roles. The street-lamp asset now forms an authored exterior light network instead of remaining unused.
11. Coding and local/source certification finish before Codex receives a deployment handover. W744 itself is not deployment authority.

## Completed station matrix

| Station | Structure | Terminal | Role NPC | Spatial cue |
|---|---|---|---|---|
| Living EONBOT Nexus | Genesis Core | Command/Nexus terminal | EONBOT | central pedestal, status ribbons, command seat and dock |
| Create Forge | Forge Basilica | Forge Workbench | Device Lab Specialist | warm threshold, forge beacons and circuit trace |
| Project Atlas | Holographic Map Beacon | Navigation Kiosk | Archive Guide | map threshold and cool circuit trace |
| Library Vault | Navigator Arc | District Information terminal | Vault Steward | vault seal, mint beacons and circuit trace |
| Share Command Center | District Hologram | Share/Trade terminal | Citizen Variant | signal frame, capture cues and magenta circuit trace |
| Command Status | Holo Interface Landmark | Navigation Kiosk | Security Sentinel | command arch, status beacons and neutral circuit trace |
| Automation Theatre | Holo Interface Landmark | District Information terminal | Holo Operator | theatre gate, amber beacons and circuit trace |
| Local AI Lab | AI Tower Core | Provider/Trade terminal | Forge Worker | lab airlock, cool beacons and circuit trace |
| My Realm Portal | Portal Gate | Realm control terminal | Creator Host | active portal light and violet circuit trace |
| Plans & Access | Trade Dome Entrance | Membership terminal | Trade Steward | access threshold and warm circuit trace |

## Command Centre visual completion

- Added three concentric microchip/circuit buses, station traces, routing nodes and Nexus chip pads to the floor.
- Added four bounded real point lights for readable faces and silhouettes.
- Added station-specific emissive threshold frames, portals and 34 local beacons.
- Kept the authored Command Centre shell, Genesis Core, command seat, district hologram and EONBOT dock.
- Added independent authored terminal loading for all ten stations; a usable branded terminal fallback remains if a GLB fails.
- Added a bounded ambient Transit Capsule route and a Maintenance Worker route near the relay.
- Added eight authored street-lamp instances around the exterior ring, with procedural fallback posts retained for lite/degraded operation.
- Added bounded exponential fog, theme-aware exposure and contrast so the Command Centre has atmospheric depth without hiding stations.
- The initial reveal now waits for the authored shell/Nexus/seat/hologram/dock and both Pathfinder/EONBOT load attempts; branded fallbacks keep the experience usable after the 12-second ceiling.
- Preserved the exterior skyline, discovery ring, transport overlook, archive garden, maintenance relay and sealed Expanse overlook.

## Interaction and animation authority

- Structure meshes, terminal meshes and NPC meshes receive station metadata and require an explicit pointer, keyboard or menu action.
- NPC pointer actions identify the role character; terminal pointer actions identify the terminal; both open the station's same maintained work surface.
- Station movement is limited to the completion contract radius of 1.05–1.35 metres.
- Runtime records actual travelled distance and starts `walk` only during real anchor motion.
- Terminal arrival switches to a stationary interaction clip; home arrival switches to idle/gesture clips.
- User interaction suspends local walking and triggers talk/interact before the 2D workspace opens.
- Reduced-motion mode keeps role characters stationary while retaining useful work surfaces.

## Route and product audit

All ten station work surfaces resolve to maintained local pages. Exact station structure/terminal/NPC assignments and the four outside-discovery assets are also machine-validated:

- Nexus → `/`
- Create → `/create`
- Projects → `/projects`
- Library → `/library`
- Share → reviewed Share Command Center
- Command Status → `/projects` fallback, with direct Projects and Automations actions
- Automations → `/automations`
- Local AI → `/local-ai`
- My Realm → `/realm-studio`
- Plans & Access → `/billing`

Creator Capture falls back to `/eoncity`. Share and Plans retain their dedicated shared-work-surface adapters.

## Red-team findings and closures

### Closed

- **Wrong NPC diagnosis:** corrected from Share/Holo Operator to Command Status/Architect.
- **Broken or unclear Status destination:** removed the advanced-workspace primary action and changed fallback to an existing maintained route.
- **Floating-station problem:** every station now has a structure, terminal, NPC, light identity and circuit connection.
- **NPCs walking in place:** locomotion is tied to measured anchor displacement; stationary clips are selected otherwise. Terminal activation now selects an explicit stationary `interact` clip rather than always forcing `talk`.
- **NPCs not interactable:** both authored characters and transparent fallback hit volumes carry station interaction metadata.
- **Unused local assets:** every active READY W649 world asset is now assigned. Forge Basilica, Holo Interface Landmark, Trade Dome entrance, terminal families, Transit Core, Maintenance Worker and the authored street-lamp network all have real launch roles.
- **Nexus feeling like only a button:** the central Genesis Core, command seat, status ribbons, terminal, EONBOT and dock form one physical 3D Nexus composition.
- **Monetisation looking like advertising:** membership remains a contextual, owner-approved card and station; no interruptive placement or automatic checkout exists.
- **Sharing disappearing:** Share is restored to the HUD and City Menu; Creator Capture remains within the reviewed share path.
- **Premature authored reveal:** the loader now stages the five core environment assets and Pathfinder/EONBOT together before revealing, with a truthful bounded degraded fallback.
- **Flat exterior depth:** bounded exponential fog, exposure and contrast now support station readability and atmosphere.
- **Cache ambiguity:** runtime, manifest and both service workers use `eon-city-command-centre-w744-2`.

### Still requires owner/Codex browser proof before deployment

- Headed Chromium, Firefox and Edge visual review at the owner's real viewport and GPU.
- Confirm all authored GLBs have correct scale, facing, materials and no clipping in lite, balanced and cinematic quality.
- Visually inspect all nine role characters plus EONBOT through idle, talk, wave, walk and terminal-use transitions.
- Confirm the Security Sentinel replacement has no coat/rig deformation at Command Status.
- Click-test structure, terminal and NPC at every station.
- Verify Creator Capture permissions, local preview, signed link review and native share handoff without automatic posting.
- Verify Plans & Access reads server-confirmed entitlements and never starts checkout before confirmation.
- Record screenshots/video of the Command Centre floor, Nexus, every station, transport loop, maintenance route and outside discoveries.
- Run the maintained predeploy/build/security/route suites, then create a Codex deployment candidate and preview. Production remains a separate owner GO decision.

## Maintained commands

```text
npm run qa:w744-command-centre-completion
npm run qa:w744-command-centre-completion:browser
npm run qa:w743-city-performance-cache-hardening:browser
```

## Current source evidence

```text
W744 source gate: 54/54 passed
Syntax checks: passed
Diff integrity: passed
Build: blocked here because locked dependencies are unavailable (`esbuild` missing)
Playwright: authored but unavailable in this environment
```

See `EONAPP_W744_EONCITY_END_TO_END_COMPLETION_MATRIX_2026-07-28.md` for the no-forgetting system matrix and exact Codex continuation sequence.

W744 source success does not equal production certification. Browser evidence, full predeploy checks and owner approval remain mandatory.
