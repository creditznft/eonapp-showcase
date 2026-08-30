# EONAPP A15 — Core, EONCITY and Expanse Integration Master Plan

**Date:** 2026-08-04  
**Mode:** Planning and preparation only; no product code changed in this session  
**Core architecture authority:** A14 Institutional Mega Launch Master Plan  
**Current code authority:** W802B commit `fdc92595ca6d8fb941f45afb598a4a282dc70e62`  
**Source archive SHA-256:** `76ea76c72f55f75a0d371116a65b675abe35265b3438ac092bb42bc04e2542ec`  
**Launch target:** 9.5/10 overall, every subsystem/category at least 9.0, zero unresolved P0  
**Current decision:** NO-GO. W802B is internally source-complete for its programme, but external certification and institutional integration remain incomplete.

---

## 1. CEO decision

A14 remains the correct Core architectural programme. W802B replaces the older A14 source snapshot as the sole coding baseline. A14 waves I00–I25 are preserved. The two broad City waves I26–I27 are retired and replaced by the twelve City/Integration waves C01–C12 in this plan.

The final programme is therefore:

- **26 Core implementation waves:** I00–I25.
- **12 EONCITY/Core/Expanse waves:** C01–C12.
- **10 certification and launch gates:** V01–V10.
- **38 implementation waves total.**
- **179 required real-world cases:** 120 A14 cases + 35 W802A owner playthrough cases + 24 A15 integration cases.
- **42 mandatory GO/NO-GO gates:** the original 30 A14 gates plus 12 City/Integration extension gates.

No completed W767–W802 source work is discarded or rewritten merely to satisfy a new plan. It is preserved, audited, adapted to the canonical Core contracts and externally certified.

## 2. Final product and experience definition

EONBOT remains the home and EONAPP Core remains fully usable without EONCITY. EONCITY is the optional flagship gamified layer.

Inside EONCITY, the user should understand two peer modes immediately:

1. **Open World — Signal Frontier**: the flagship exploration, mission, restoration, My Frontier and future-region experience.
2. **Command Hub**: the compact productive command centre, Living Nexus and stations.

There remains only one public route (`/eoncity`), one authenticated access authority, one Babylon Engine, one Scene and one render loop. Signal Frontier is not split into a second public application or route.

### Entry and menu decision

- First entry loads the safe Command Hub and immediately presents a prominent Open World card during onboarding.
- Returning users with a valid saved Expanse snapshot receive explicit choices: **Resume Signal Frontier** or **Open Command Hub**.
- The Command Hub HUD gains a direct **Open World** launcher.
- City Menu places a large **Open World — Signal Frontier** card above the utility/station grid, with current mission, restoration/progress and Resume/Enter action.
- The old subordinate label **Expanse Gate** becomes the physical-world landmark label, not the main product label.
- Entry remains review-first: Enter or Cancel. No automatic travel, mission, asset pack, provider call or work execution.
- Storm Sector remains hidden/locked until its exact package, performance and owner-playthrough gates pass.

## 3. Verified reconciliation findings

| ID | Area | Verified finding | Required outcome |
|---|---|---|---|
| A15-P0-01 | Authority | A14 audited ancestor a6cf226, while W802B is commit fdc9259 with 344 changed files and 38,193 additions. | Refresh every plan/test/ownership decision against W802B before behavior changes. |
| A15-P0-02 | Dependency inversion | Static inspection found all 13 primary non-City Core routes reach City implementation modules (19 distinct City modules). | Core route graph must contain zero City implementation imports. |
| A15-P0-03 | City implementation coupling | The active City closure reaches 57 non-City modules, including AI runtime/settings, Projects, Creator Library, Automations, billing and capability stores. | City receives a bounded privacy projection and neutral outcomes; it does not import Core implementations. |
| A15-P0-04 | Outcome authority | Existing redacted task/agent bridge and station receipts are useful but do not form one universal Handoff/Outcome/Progression authority. | One CityWorkHandoff, CoreOutcome and CityProgressReceipt contract. |
| A15-P0-05 | Data survival | Active state includes W731 resume, W737 missions, W751 station activity, W766 Expanse state and boot traces; 40 City modules directly access browser storage. | Inventory-driven migration/backup/restore/deletion with no private Core content in gameplay state. |
| A15-P0-06 | Creator Capture ownership | Core routes currently reach City-owned W659G Creator Capture through the shared work-surface host. | Port capture to Core; City/Expanse emit capture intents only. |
| A15-P0-07 | External certification | W802B source tests pass, but all external gates are incomplete because locked install/build/browser/performance/owner/Preview/Production proof is absent. | No launch/certified label until V01,V07,V08,V09,V10 pass. |
| A15-P1-01 | Flagship discoverability | A direct menu action exists, but “Expanse Gate” is the last item in a seven-action quick row and is framed as an outside-map discovery. | Promote “Open World — Signal Frontier” to a featured primary mode while retaining review-first entry. |
| A15-P1-02 | Station convergence | Ten stations and three discoveries use multiple legacy store/route/progression contracts. | Rebind every station to canonical destination, handoff, outcome and capability contracts. |
| A15-P1-03 | Storm release truth | Storm Sector authored source is complete but remains externally uncertified and owner-gated. | Certify exact digest or keep hidden/locked. |

## 4. Target integration architecture

```text
EONAPP CORE AUTHORITIES
├─ Universal Project / Artifact / Version
├─ Canonical Destination / Continue / Handoff
├─ Core Outcome Authority
├─ Capability / Entitlement Authority
├─ Workflow / Approval Authority
├─ Data Survival Inventory
├─ Core Creator Capture / Share Authority
└─ Privacy-Protected Product Projection
              │
              ▼
CITY INTEGRATION BOUNDARY
├─ CityLaunchIntent
├─ CityProjectionSnapshot (read-only, redacted)
├─ CityWorkHandoff (versioned, expiring, single-consume)
├─ CoreOutcome (verified by native authority)
├─ CityProgressReceipt (policy checked, duplicate protected)
├─ CityCaptureIntent (no media ownership)
└─ CityDataInventoryReceipt
              │
              ▼
EONCITY / COMMAND HUB / SIGNAL FRONTIER / MY FRONTIER / STORM SECTOR
```

### Mandatory invariants

1. Core never imports City implementation.
2. City never imports the AI executor, provider credential/settings authority, billing store, Project store, Library store or Automation store directly.
3. City receives only redacted projection snapshots and verified neutral outcomes.
4. Opening a Core surface is not completion. Returning to City is not completion. Only the native authority can issue a verified outcome.
5. A verified outcome may be consumed once by policy. Duplicate/stale/revoked receipts award nothing.
6. City state stores IDs, bounded progression and non-private visual choices only. It never stores prompts, outputs, credentials or private Project content.
7. Creator Capture is Core-owned; City only requests a capture moment/context.
8. Capability/billing truth is signed/server-derived where required; local City state cannot grant access.
9. Storm Sector public availability is bound to one exact certified package/build digest.

## 5. Coding programme

The complete machine-readable wave table is in `{waves_name}`. The Core sequence I00–I25 is preserved from A14 with the baseline refreshed to W802B. C01–C12 replace A14 I26–I27.

### City/Integration sequence

| ID | Wave | Depends on | Mandatory exit |
|---|---|---|---|
| C01 | W802B Delta Audit and City Ownership Freeze | I00 | One current City/Expanse authority; exact red/amber/green map; every W767–W802 system dispositioned; no parallel shared-file ambiguity. |
| C02 | City/Core Boundary Extraction and Import Inversion | I03,I04,I05,I16,C01 | 13/13 primary Core routes reach zero City implementation modules; City runtime no longer imports AI executor, provider settings, billing stores, project stores or automation stores directly. |
| C03 | Flagship EONCITY Navigation and Open World Entry | C02 | City Menu opens with a primary “Open World — Signal Frontier” card; Command Hub has a persistent Open World launcher; returning users may explicitly Resume Signal Frontier; entry review/cancel remains mandatory. |
| C04 | Canonical City Work Handoff and Return Protocol | I04,I05,C02 | Every Command Hub/Expanse productive action opens the maintained Core destination with sender/receiver/digest/expiry/consumedAt/result/error; stale or duplicate handoffs fail safely. |
| C05 | Verified Outcome, Mission and Progression Bridge | I09,I16,C04 | Create/Forge/Projects/Library/Local AI/Automation/Share outcomes can advance missions once; no route opening, local activity or unverified claim awards XP, unlocks or completion. |
| C06 | City, Expanse and Frontier Data Survival | I07,C05 | Backup/restore/migration/deletion receipts cover all active City keys and stores; no private Core content is copied into gameplay state; rollback works. |
| C07 | Capability, Billing, EONKEY, Share and Capture Integration | I09,I15,I17,I18,C05 | Plans panel shows server truth; revocation/downgrade is safe; EONKEYS unlock only approved cosmetic/feature items; Creator Capture is Core-owned; no auto-post or duplicate referral/XP. |
| C08 | Command Hub and Living Nexus Convergence | C02,C04,C05,C07 | Every object is clearly interactive or declared decorative; every station opens a valid maintained surface; Nexus is truthful and privacy-projected; no dead labels/buttons/routes. |
| C09 | Signal Frontier Flagship Experience Summit | C03,C05,C06,C08 | Signal Frontier is visibly the flagship EONCITY experience; all W802A Signal/Productive/Living/Share cases pass; no state loss or fabricated progress. |
| C10 | My Frontier and Storm Sector Release Governance | C05,C06,C07,C09 | My Frontier construction/resident/theme/reload cases pass; Storm Sector is certified against exact digest or remains hidden/locked; no source-complete claim becomes public certification. |
| C11 | City Accessibility, Mobile, Offline, Performance and Resilience | I22,I23,I24,I25,C08,C09,C10 | No critical accessibility issue; Core bundle remains City-free; Expanse/Storm assets load only after explicit entry; 4-hour endurance and transition soak show no material leak. |
| C12 | EONCITY 9.5 Quality Summit and Integration Freeze | C01-C11 | Every City category ≥9.0; overall ≥9.5; zero first-party console/network errors; all required evidence bound to one immutable candidate; exact source ZIP/Git bundle/checksums produced. |

## 6. Recommended execution order

### Stage A — Freeze the real authority

1. I00 + C01: verify W802B, generate delta/import/storage/ownership registries, and add no product behavior.
2. I01 + I02: dispose/quarantine stale systems and freeze current route/build/test authority.

### Stage B — Build the Core contracts City will consume

3. I03–I09: Core isolation, destinations, Projects, Library, Data Survival, identity and capability.
4. I10–I16: AI, Local AI, voice, Create/Forge, Core Creator Capture and workflow/outcome authority.

### Stage C — Integrate City without reverse dependencies

5. C02–C07: import inversion, flagship entry, handoff, verified outcomes, City data survival, capability/share/capture adapters.
6. C08–C10: Command Hub convergence, Signal Frontier flagship summit, My Frontier and Storm release governance.

### Stage D — Complete institutional Core and whole-product quality

7. I17–I25: commerce, trust, Cloudflare, PWA, observability, locale/accessibility and performance.
8. C11–C12: whole-City device/performance/resilience proof, visual repair rounds and integration freeze.

### Stage E — Certification and launch

9. V01–V08: source/build, real AI/local media, hostile journeys, accessibility/performance, City integration and owner playthrough certification.
10. V09: exact Preview deployment, migration/security/offline proof and rollback rehearsal.
11. V10: explicit Production authorization, canary, owner acceptance and seven-day stabilization.

## 7. Certification programme

| Gate | Name | Dependencies | Exit gate |
|---|---|---|---|
| V01 | Clean Source and Deterministic Build | I00-I25,C01-C12 | Zero blocking failures; deterministic authority/digests; no untracked production outputs. |
| V02 | Cross-Browser Core Product Journeys | V01 | All required Core journeys pass with zero first-party console/network errors. |
| V03 | Real Hosted AI and API-Key Certification | V01,V02 | Each public provider is certified or hidden/not certified. |
| V04 | Local AI and Local Media Certification | V01,V02 | Real local results and clean reconnect/shutdown/low-memory behavior; no key leakage. |
| V05 | Commerce, Data, Support and Hostile Scenarios | V02-V04 | No silent loss, duplicate charge/session, stranded case or false capability. |
| V06 | Accessibility, Language, Core Performance and Endurance | V02 | No critical a11y issue; published languages complete; Core budgets and endurance pass. |
| V07 | EONCITY/Core Integration Certification | V01-V06 | 24/24 pass; zero reverse dependency, state-loss, privacy, entitlement or handoff failure. |
| V08 | EONCITY/Expanse Owner Playthrough and 9.5 Summit | V07 | All required City/Expanse cases pass; each category ≥9.0; overall ≥9.5; exact candidate receipt. |
| V09 | Cloudflare Preview, Security, Migration and Rollback | V01-V08 | Preview digest equals candidate; rollback restores healthy release without schema/data loss. |
| V10 | Production Canary, Owner Acceptance and Seven-Day Stabilization | V09 | No Sev-1/Sev-2, data loss, duplicate billing or unresolved critical defect; owner signs exact deployment ID and GO board. |

The 24 new cross-platform cases are in `EONAPP_A15_INTEGRATION_CERTIFICATION_CASES_2026-08-04.csv`. They do not replace the 120 A14 cases or the 35 W802A owner cases.

## 8. 9.5/10 City acceptance rule

The City scorecard is in `{score_name}`. Acceptance requires:

- every category at least 9.0;
- overall EONCITY at least 9.5;
- zero unresolved P0;
- zero launch-blocking P1;
- zero first-party console errors, page errors or failed first-party requests in required journeys;
- exact candidate/build/package digests attached to evidence;
- no category may be averaged away by stronger categories;
- Storm Sector must be certified or remain inaccessible to normal users.

## 9. Branch, wave and handover protocol

- Integration branch: `launch/a15-core-city-integration`.
- Core wave branches: `launch/a15-Ixx-<slug>`.
- City wave branches: `launch/a15-Cxx-<slug>`.
- Shared amber files are exclusively locked to the integration owner; Core and City branches do not edit them simultaneously.
- Each wave begins by printing commit, branch, dirty state, Node/npm versions, registry, source manifest and intended file list.
- Contract tests and negative import/data-loss/capability tests are added before or with behavior.
- Each visible change receives headed-browser evidence before the wave is called complete.
- Each wave ends with one coherent commit, changed-file manifest, evidence index, exact editable source ZIP, Git bundle or cumulative patch, test logs and SHA-256.
- Every handover states the exact number of remaining implementation waves and external gates.
- No coding wave deploys Preview or Production. Deployment begins only at V09.
- Production requires explicit owner authorization for the exact certified candidate.

## 10. First coding session authority

The next coding session starts with **I00 + C01 only**:

1. Restore the W802B archive and verify SHA-256/commit/clean tree.
2. Create `launch/a15-core-city-integration` from `fdc92595ca6d8fb941f45afb598a4a282dc70e62`.
3. Add this A15 planning package to the repository as planning authority.
4. Generate the active route import graph, City closure graph, storage inventory, W767–W802 system disposition and red/amber/green ownership map.
5. Add fail-fast tests that encode the current boundary failures without changing behavior.
6. Produce the first source checkpoint and handover. Do not attempt dependency repair, browser certification or deployment in the same wave.

After I00+C01 pass, the next behavior-changing work is I01/I02 and then I03+C02.

## 11. Final readiness statement

The current W802B code is the correct source authority and its Expanse/Storm implementation must be preserved. It is not yet the institutional launch candidate. The missing work is no longer “build the open world”; it is **make the open world the obvious flagship, connect it to one verified Core authority, remove reverse dependencies, protect all state, and certify the entire product as one immutable system**.
