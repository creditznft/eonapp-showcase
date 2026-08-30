# W660N EONCITY + EONNEXUS Vision Lock

Date: 2026-07-20
Authority: user vision consolidated through W660N
Status: non-negotiable product direction

## Product identity

EONCITY is not a decorative 3D landing page and EONNEXUS is not an unrelated visual widget. Together they form one productive, game-like spatial operating layer for EONAPP.

The experience must feel alive, premium and useful at the same time. Visual spectacle is accepted only when it communicates real state or leads to a real EONAPP function.

## Non-negotiable City behavior

1. Pathfinder is never presented as a lifeless mannequin. Standing cycles use real idle, alternate-idle, interact and wave animation clips; movement uses real walk/run clips.
2. EONBOT is a curious floating companion. It follows Pathfinder, guides toward nearby functions, scans Nexus stations, observes waiting approvals, orbits during idle time and returns to the Creator Atrium docking station when appropriate.
3. Resident characters have product-bound roles, real animation routines and proximity responses. They may patrol, work at terminals, greet Pathfinder and expose review-first actions; they never pretend to perform remote work.
4. Buildings, terminals, stations and landmarks must connect to genuine EONAPP products or local City systems. Decorative assets may support composition but cannot replace functional interaction.
5. Nine districts remain distinct in landmark silhouette, lighting, purpose, terminals, residents and arrival presentation. Travel is explicit, visible and truthful about loading.
6. Missions, verified XP, Vault Reveals, EONKEY status, Creator Capture, optional microphone/facecam, Sharing Center, referral handoff, Agent Theatre and EONBOT quick work remain part of the productive City plan.
7. Mobile landscape, mobile portrait, desktop, touch, keyboard, reduced-motion and safe fallback behavior are first-class requirements.

## Non-negotiable Nexus behavior

1. There is one EONBOT identity, one conversation continuity and one selected-project state across Chat, EONCITY and the wider EONAPP shell.
2. EONCITY contains exactly one purpose-bound physical Nexus hologram in each of its nine districts.
3. City holograms are readable landmarks, not tiny decorative props. Their state rings, private-device shield, approval band and motion represent the same privacy-projected shared Nexus state.
4. The City Nexus panel shows the same EONBOT state, route, selected project, task stage, approvals and results. It provides explicit review-first links to native product surfaces.
5. District-specific station actions unlock only when Pathfinder approaches the physical hologram. Global continuity actions remain available from the City Nexus control.
6. Chat keeps its dedicated Nexus bridge. EONCITY keeps the Babylon holograms. Other app-shell routes receive page-specific Pulse/Live Nexus placement only when intentionally registered.
7. Security, account, billing, settings, backup and help routes use restrained presentation and cannot silently expand into another command center.
8. Unknown routes do not receive a generic Nexus automatically.

## Architecture and truth boundaries

- One maintained Babylon engine, scene, canvas and render loop.
- No duplicate conversation store, project store or assistant runtime.
- No automatic route opening, approval, checkout, microphone/camera capture, sharing, social posting or AI work.
- All private information remains projected, bounded and redacted.
- Local AI is labeled private only when a verified local route exists.
- Cloudflare Pages deployment must use the complete deployment root with recursively staged Functions and support modules; never deploy a nested static `dist/` alone.
- The separate referral backend remains outside the Pages deployment.

## Acceptance standard

A release cannot be called 9.5/10 from source tests alone. Codex must capture unobstructed headed evidence for all nine districts, movement, character animation, EONBOT behavior, Nexus state continuity, app-shell placements, mobile layouts and reduced motion. Any visual category below 9.5/10 must be repaired and re-tested before production promotion.
