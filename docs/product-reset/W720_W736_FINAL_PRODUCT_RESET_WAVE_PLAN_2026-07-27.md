# EONAPP W720–W736 Final Product Reset and Launch Plan

**Date:** 2026-07-27  
**Chosen strategy:** Option 2 — Hybrid Command Hub  
**Current source authority supplied by owner:** `EONAPP_W719_21_LIVE_SOURCE_cc3e698a_2026-07-27.zip`

## 1. Verified source authority

- ZIP SHA-256 verified: `5aa0554ca6edd0b9ac8a64d51f25bf47a20b1458ecaa08e420dca2ee3f9655b0`
- Reported live commit: `cc3e698a8468ec447bf8eab7dc85875318fa34cd`
- Reported Git tree: `1331baf4149f3f42a2b70d5bef1618897fbcde7b`
- Archive entries: 5,163
- Uncompressed archive content: 224,232,108 bytes
- `package-lock.json` present
- `node_modules` and untracked build outputs absent
- The source package is the only implementation base for W720 onward.

### Authority warning

The source archive contains historical authority documents that still describe older W479-era inputs, and the internal W719 frozen-release gate still reports “candidate NOT FROZEN; no deployment run.” Those files are retained as historical evidence, but they cannot remain current authority after the owner-provided W719.21 live identity is recorded. W720 must create one new superseding authority manifest without deleting history.

## 2. Final product promise

> EONAPP gives users a familiar AI workspace for real work, plus an optional living 3D Command Hub where their projects, tools, agents and creative systems become a place they can explore.

### Permanent design rule

- **2D for productivity:** text, forms, projects, files, settings, sharing, approvals and receipts.
- **3D for presence:** navigation, spatial identity, characters, discovery and visual excitement.
- **One implementation:** City stations open the same real components used by the normal app.

## 3. Final launch decisions

### 3.1 Launch themes

Only three dark themes ship:

1. **Graphite** — default neutral charcoal, soft contrast, restrained neutral/sage emphasis.
2. **Obsidian** — OLED-style near-black, crisp white, silver emphasis and highest contrast.
3. **Ember** — warm charcoal/espresso, soft cream text and muted copper/amber emphasis.

No launch theme is blue or purple. Legacy `neon-night` preferences migrate safely to Graphite unless the user explicitly selects Ember. Theme tokens must control the whole product, including City lighting accents; page-specific hardcoded theme colours are not accepted on launch routes.

### 3.2 Realm

Realm remains, but is simplified into **My Realm**:

- Hidden from the main sidebar.
- Available in `Settings → My Realm` and through the City Realm Portal.
- No free building at launch.
- Three fixed layouts:
  - **Command Loft** — active projects, automations and EONBOT.
  - **Creator Studio** — Create tools, featured output and media display.
  - **Archive Retreat** — Library, saved work and calm personal presentation.
- User may choose layout, appearance, four pinned shortcuts, one featured project/output, display name and companion position.
- Local/private state remains private.
- Sharing produces a **read-only Realm Card** containing only reviewed safe metadata and a CTA to create/open EONAPP. It is not multiplayer and does not expose the owner’s private live room.
- Public live visits, multiplayer, visitor counts and social presence are deferred.

### 3.3 EON City launch scope

The current launch contains one compact, complete **Command Hub**. Open world and Expanse development are deferred.

- No reachable empty roads, unfinished districts or inaccessible-looking functional objects.
- No public “infinite world” promise.
- Exterior skyline and closed gateways may communicate future expansion, but the player cannot enter unfinished space.
- Every visible character, station and interactable object has a working role.

### 3.4 Command Hub layout

**Centre — Orientation Core**

- Safe spawn and unobstructed opening camera.
- EONBOT dock.
- Current project/task summary.
- Clear station map.
- City Menu and direct station jump.

**Primary inner stations**

1. **EONBOT Nexus** — real Chat panel.
2. **Create Forge** — real Create panel.
3. **Project Atlas** — real Projects panel.
4. **Library Vault** — real Library/data panel.
5. **Share Relay** — real Share Command Center.

**Secondary outer alcoves**

6. **Command Console** — active work and system state.
7. **Automation Theatre** — genuine queued/running/review/completed tasks only.
8. **Local AI Lab** — real device and provider status.
9. **My Realm Portal** — the user’s fixed-layout personal room.

Research and Help are available through EONBOT, Command Console and the City Menu rather than adding another large station.

## 4. Confirmed source risks that the reset must address

1. `eon-app-shell.js` currently mounts a frontend Nexus on nearly every non-Chat/non-City app route.
2. `support.html` uses a separate older site shell and separately loads Nexus.
3. `build-production.mjs` explicitly requires old Nexus CSS, JavaScript markers and City beacon markers; hiding Nexus without replacing these gates would leave false certification.
4. Current theme IDs are Graphite, Obsidian and Neon Night, but Graphite and base styles still include purple/blue values and many launch stylesheets contain hardcoded colours.
5. City code is layered across multiple generations. The City JavaScript tree is approximately 3.2 MB before bundling, with a 244 KB main Babylon runtime plus multiple older Nexus, district and Expanse layers.
6. The maintained unit runner lists 418 candidate tests. At least 104 current tests from W660–W719 certify the old frontend Nexus, infinite/streamed Expanse, district belts or prior City architecture.
7. Help and Support are separate routes with conflicting information architecture.
8. Realm Studio exposes too many concepts, disclaimers, relics and publication boundaries before presenting a simple personal-space purpose.
9. The archive contains duplicate source/public asset copies; runtime delivery must continue to use only the emitted/public authority and must not load duplicate variants.
10. Dependency installation could not be completed in the planning environment because the npm registry gateway returned HTTP 503 for `ws@7.5.11`. Static W719 gates passed, but full build/test validation remains a required W720 baseline action in the coding environment.

## 5. Wave plan — 17 controlled waves

These waves are grouped into four implementation batches. They do not require 17 separate chat windows. Multiple waves can be completed locally in one coding session, but every wave receives its own contract, changed-file manifest, tests and result report.

---

## Batch A — Authority and product foundations

### W720 — Canonical W719.21 authority and clean baseline

**Purpose:** Establish one trusted starting point before changing behavior.

**Work**

- Create W720 source-authority manifest with ZIP hash, live commit, tree and entry count.
- Mark old authority documents as retained historical evidence, not current instructions.
- Record current route, test, asset and City-runtime inventories.
- Run Node 22 dependency install, maintained unit suite, lint, build, smoke and route audit in the coding environment.
- Record all pre-existing failures without repairing unrelated behavior in this wave.
- Preserve current production and rollback identities.

**Done when**

- One machine-readable authority file is accepted by all later gates.
- No source behavior has changed.
- Baseline results are reproducible.
- No deployment, merge or rollback occurs.

### W721 — Product-reset contracts and certification migration

**Purpose:** Prevent old tests from forcing the rejected product design back into the app.

**Work**

- Add the Option 2 product contract, launch route contract, Command Hub station contract, Realm v1 contract and deferred-feature contract.
- Create an explicit non-certifying archive for tests that require:
  - frontend Live Nexus/Pulse;
  - infinite or streamed Expanse at launch;
  - old district belts as the launch navigation model;
  - old Realm Studio/relic-heavy presentation;
  - duplicated Help/Support shells.
- Preserve archived tests and manifests for history.
- Build a new maintained-suite manifest for W720+ product truth.
- Update build verification so old Nexus markers are no longer launch requirements.

**Done when**

- The current runner cannot certify superseded UX.
- Archived tests remain runnable only through the historical diagnostic command.
- New tests fail if old frontend Nexus or open-world launch promises return.

### W722 — Complete dark design-token system

**Purpose:** Make themes real, global and maintainable.

**Work**

- Implement Graphite, Obsidian and Ember semantic tokens.
- Tokenize background, panels, sidebar, cards, borders, text hierarchy, inputs, focus, buttons, status colours, Orb and City accents.
- Migrate theme storage/bootstrap/profile/settings.
- Add live preview, active indicator, restore default and contrast status.
- Audit launch CSS for hardcoded theme colours; allow hardcoded values only for semantic safety states or non-theme media where documented.
- Map City lighting/material accents to the selected theme without recolouring identity-critical assets incorrectly.

**Done when**

- All launch routes visibly change as a complete system.
- No blue or purple launch theme remains.
- WCAG contrast gates pass.
- Theme change works without reload and survives reload.

### W723 — App shell, route and navigation reset

**Purpose:** Make the normal product immediately understandable.

**Work**

- Keep main sidebar: EONBOT, Create, Projects, Library, EON City.
- Utilities: Search, Automations, Local AI, Research.
- Profile menu: Account, Settings, Appearance, Providers, Data & backup, Billing, Help, Sign out.
- Remove Realm Studio from main navigation.
- Converge Help and Support onto one app-shell route; keep `/support` as a safe redirect/compatibility entry if required.
- Remove the second floating help launcher.
- Update route contract, redirects, shell context and PWA/cache route lists.

**Done when**

- One shell appears on every app route.
- No duplicate Help/Support experience exists.
- No user-facing internal wave labels or obsolete product concepts appear in the shell.

### W724 — Quick Command Orb and command registry

**Purpose:** Replace the frontend Nexus with a simple, useful control.

**Work**

- Remove frontend Nexus auto-mount from app routes.
- Quarantine old frontend Nexus runtime and styles as historical/non-launch code while preserving reusable City assets.
- Add one lower-right Quick Command Orb as the launcher only.
- Add tooltip, screen-reader label, first-use hint, reduced-motion mode and keyboard access.
- Build one page-context command registry and a full-screen 2D command surface on desktop, tablet and mobile.
- First screen: Continue, New, Ask EONBOT, Share.
- Below: recent items, section jump, current status, collapsed advanced controls and Help.
- Replace old Nexus production assertions with Orb and command-registry assertions.

**Done when**

- No frontend 3D Nexus loads on normal pages.
- Orb behavior and the full-screen command surface are consistent across routes.
- The Orb never blocks content or mobile controls.
- Every visible Orb action works or is truthfully unavailable.

---

## Batch B — Shared productivity and simplified 2D product

### W725 — Shared work-panel framework

**Purpose:** Ensure frontend and City do not develop separate tools again.

**Work**

- Create one responsive full-screen work-surface host. Smaller confirmations may remain modal, but productive Nexus/Command work never uses a cramped half-width panel.
- Add focus trapping, return focus, Escape/Close, scroll containment and reduced motion.
- Create panel adapters for Chat, Create, Projects, Library, Share, Command Status, Automations, Local AI, Help and My Realm.
- Define one command/station invocation payload and one navigation fallback.
- Lazy-load heavy panels.

**Done when**

- The same full-screen work-surface component can open from a page, Orb or City station.
- No important form or long text must render on a 3D mesh.
- Panel lifecycle tests pass on desktop, touch and keyboard.

### W726 — Create and Projects simplification

**Purpose:** Make the two central work routes beginner-first.

**Work**

- Apply the Vault-style page template: title, one-sentence purpose, one primary action, recent/current work, limited tabs, collapsed advanced details.
- Create: clear result choices, honest execution mode, current draft and provider readiness without repeated disclaimers.
- Projects: active work first, clear status, next action and recent activity.
- Move implementation notes, internal receipts and technical boundaries into collapsed Details/Receipts.
- Connect Orb and City panels to the same components.

**Done when**

- A first-time user can start or continue work without scrolling through implementation language.
- No dead buttons or duplicate creation/project paths remain.

### W727 — Library, Workspace and Vault/Data simplification

**Purpose:** Remove conceptual overlap among Library, Workspace, Vault and backup.

**Work**

- Library becomes the normal place for saved outputs, files and recent work.
- Advanced Workspace becomes a secondary advanced surface, not a competing home.
- Vault becomes account/provider/data custody and recovery where appropriate, using the successful clear-card pattern.
- Capsule remains the explicit encrypted backup/restore flow.
- Remove repeated safety paragraphs from first view; keep them in Details, Privacy and Receipts.
- Connect Library Vault City station to the shared Library/Data panel.

**Done when**

- Each route has one distinct purpose.
- No user must understand Vault/Workspace architecture before finding a saved item.

### W728 — Share Command Center redesign

**Purpose:** Make “send this to somebody” a one-step action.

**Work**

- Build one shared Share Command Center component.
- Top: Copy link, Share now, QR, preview, optional message and common platforms.
- Advanced collapsed: signed identity, EONKEY details, campaigns, privacy, expiry, technical metadata and receipts.
- Reuse it from page share actions, Quick Command Orb and City Share Relay.
- Preserve reviewed security and link-signing behavior.

**Done when**

- Basic sharing takes one obvious action.
- No three separate share implementations remain.
- No automatic posting or unreviewed data exposure occurs.

### W729 — Help, Settings and Profile consolidation

**Purpose:** Give users one current place for help and preferences.

**Work**

- Replace old Support Center shell with the normal app shell.
- Help home: search, Getting started, Chat/providers, Create/projects, City, Sharing, Account/billing, Privacy/backup, Troubleshooting, Report problem and Ask EONBOT.
- Move Appearance to Settings → Appearance.
- Reorganize Profile into identity/account summary; move technical controls to the relevant Settings sections.
- Keep support evidence pack under Report a problem, not on the first screen.
- Generate help content from a maintained current-feature inventory.

**Done when**

- `/help` is canonical and `/support` cannot drift into an older product shell.
- Internal waves and release history are absent from normal user help.

### W730 — My Realm fixed-template MVP

**Purpose:** Turn Realm into a clear personal space without free-build or multiplayer risk.

**Work**

- Replace long Realm Studio with My Realm settings.
- Implement Command Loft, Creator Studio and Archive Retreat templates.
- Allow safe personalization: layout, theme, four pinned shortcuts, featured item, name and companion placement.
- Add a compact personal room in City using the selected template.
- Add a reviewed read-only Realm Card share link and preview.
- Retire relic-heavy and abstract publication UI from the launch journey; preserve underlying historical code outside active launch paths if needed.

**Done when**

- “My Realm” clearly means “my personal place inside EON City.”
- Sharing exposes only reviewed metadata.
- No public live visit, multiplayer or free-building claim exists.

---

## Batch C — EON City Command Hub rebuild

### W731 — City runtime consolidation and old-layer quarantine

**Purpose:** Stop stacking another City patch onto multiple generations of runtime.

**Work**

- Keep authenticated access station, device profile, one Babylon engine, asset loading and safe fallback.
- Create one W731 Command Hub runtime owner.
- Retire old launch imports for infinite Expanse, district belts, frontend-to-City Nexus field and duplicate composition layers.
- Keep reusable camera, input, animation, EONBOT, asset and performance modules.
- Establish a strict launch asset manifest and lazy-loading boundaries.
- Remove duplicate runtime responsibilities and update City build/certification gates.

**Done when**

- One runtime owner controls the launch City.
- A trace can explain every launch module and asset.
- No hidden old world layer continues consuming performance or affecting camera/collision.

### W732 — Command Atrium geometry, camera and visual hierarchy

**Purpose:** Build the compact productive space before adding interactions.

**Work**

- Build open Orientation Core and inner/outer station layout.
- Use open sight lines, wide lanes, low/fading walls and camera-safe spacing.
- Keep tall buildings and decorative assets outside the playable boundary.
- Add completed boundary treatment, skyline and closed future gateways so the world feels intentional, not unfinished.
- Replace the main character with the strongest launch-ready Pathfinder asset.
- Establish spawn, camera, collision, occlusion and navigation anchors.
- Add clear screen-space station labels.

**Done when**

- First camera view is unobstructed.
- Every reachable area looks finished.
- All stations are identifiable from normal viewing distance.
- No mirrored 3D text exists.

### W733 — Functional stations and shared productive panels

**Purpose:** Make City useful.

**Work**

- Implement proximity/click/touch/`E` interaction for every launch station.
- Add short focus animation, then open the shared 2D panel.
- Wire EONBOT, Create, Projects, Library/Data, Share, Command Status, Automations, Local AI and My Realm.
- Add City Menu with direct station jump and Resume Location.
- Ensure closing a panel returns immediately to the correct City state.
- Record only truthful user-reviewed receipts.

**Done when**

- Every visible functional station opens a real working component.
- No decorative object appears interactive unless it is interactive.
- No City-only duplicate form or business logic exists.

### W734 — Characters, EONBOT, interaction polish and closed-world completeness

**Purpose:** Make the Command Hub feel alive without pretending to run fake work.

**Work**

- Assign each visible NPC a name, role, greeting, one useful action and animation set.
- Place role-specific NPCs only near their actual station.
- EONBOT follows curiously, reacts to stations and returns to its dock.
- Ensure main avatar idle/walk/run reliability and correct scale.
- Add ambient motion, terminal responses and subtle environmental life.
- Add desktop, mobile landscape, touch, keyboard, reduced-motion and performance-quality tuning.
- Keep open-world/Expanse gateways closed and labelled as future expansion only if visible.

**Done when**

- No visible primary NPC is inert.
- No fake agent activity is shown.
- Stable target frame rates and memory budgets pass on agreed device profiles.
- All accessible map space is complete and purposeful.

---

## Batch D — Certification and release

### W735 — Whole-app reconciliation and immutable release candidate

**Purpose:** Prove the reset works as one product before deployment.

**Work**

- Full route, link, button and interaction truth audit.
- Theme matrix across all launch routes.
- Keyboard, screen-reader, touch and mobile-landscape checks.
- City station-to-panel parity tests.
- Data survival/update safety, provider key custody, billing, identity, sharing and backup regression.
- Performance budgets and lazy-load evidence.
- Security headers, CSP, dependency audit and Cloudflare build verification.
- Current Help inventory and documentation validation.
- Build immutable candidate; record source commit, tree, dist digest and rollback authority.

**Done when**

- Zero P0/P1 defects.
- No dead visible buttons.
- No old frontend Nexus or old Support shell in emitted output.
- No open-world launch promise.
- Owner scorecard meets overall 9.5/10 and no pillar below 9/10.

### W736 — Preview, owner proof, identical production promotion and live verification

**Purpose:** Deploy only the certified candidate.

**Work**

- Deploy immutable candidate to Cloudflare Preview.
- Run headed Chrome/Edge/Firefox owner-device proof.
- Capture route, theme, Orb, Share, Realm and all City station evidence.
- Obtain explicit owner GO.
- Promote the identical build digest to production; no rebuild.
- Verify `eonapp.ch`, authentication, billing status, APIs, PWA/cache behavior and rollback identity.
- Observe 24-hour and 7-day windows; only P0/P1 fixes during stabilization.

**Done when**

- Preview and production use the same digest.
- Live owner proof passes.
- Rollback is verified and documented.
- W736 handover contains source, manifests, test reports, screenshots/video matrix, deploy IDs and exact rollback commands.

## 6. Implementation batch schedule

- **Batch A:** W720–W724 — authority, contracts, themes, shell and Orb.
- **Batch B:** W725–W730 — shared panels, simplified pages, Share, Help/Settings and My Realm.
- **Batch C:** W731–W734 — one City runtime and complete Command Hub.
- **Batch D:** W735–W736 — certification, Preview and production.

A batch may contain several local commits, but no batch is deployed until W735 produces the immutable release candidate.

## 7. Non-negotiable acceptance rules

1. No deployment before W735 approval.
2. No old source overlay after W719.21.
3. No deleting historical tests or assets merely to make gates pass.
4. Superseded exact-copy tests move to a documented non-certifying archive.
5. No separate frontend and City implementations of the same tool.
6. No user-facing internal wave labels.
7. No blue or purple launch theme.
8. No accessible empty City space.
9. No mirrored or unreadable 3D text.
10. No dead visible buttons or decorative fake interactions.
11. No open-world/Expanse claim in the current launch.
12. No public/multiplayer Realm claim in the current launch.
13. No automatic posting, spending, publishing or agent action.
14. No production rebuild after Preview certification.
15. Every wave produces changed-file manifest, tests, validation report and Codex-ready continuation commands.

## 8. Deferred post-launch programme

Not part of W720–W736:

- Bounded Expanse vertical slice.
- Wider open-world streaming.
- Public live Realm visits.
- Multiplayer/social presence.
- Visitor counts and social discovery.
- Free building.
- Large missions or complex NPC stories.
- Autonomous agent choreography beyond truthful real task state.

These begin only after the compact Command Hub is stable in production.

## 9. Immediate next coding action

Start **W720 only** from the verified W719.21 archive. Do not alter product behavior until the new authority manifest, baseline results and supersession map are complete.
