# W660O focused verify, deploy and visual-acceptance prompt

Continue from the supplied W660O complete source authority. W660N-R3 remains live until a verified W660O deployment succeeds.

1. Extract into a clean directory and run:
   `node scripts/w660o-verify-source-authority.mjs`
   Stop on any missing, added, changed, symlink or case-collision result.
2. Run `npm ci` and the focused current gates recorded in `docs/W660O_NEXUS_LAUNCH_CONTINUITY_RECEIPT_2026-07-21.md`.
3. Run ESLint, production build, build smoke and secret scan. The emitted candidate must contain Billing and Support Nexus bootstrap markers, visible restrained labels, and all nine City beacon-ring identifiers.
4. Preserve the current production deployment `88bd083a.eonapp-ch.pages.dev` and rollback `8ca40eef.eonapp-ch.pages.dev`.
5. Stage one complete Cloudflare Pages root with static output at root, recursive Functions dependencies, `_routes.json`, headers, redirects and manifests. Never upload nested `dist/` alone.
6. Deploy to Preview first when authenticated testing is possible; otherwise use a controlled production acceptance deployment without changing DNS, OAuth, bindings or secrets.
7. Capture live evidence for Billing Nexus, Support Nexus, one existing productive Nexus, one restrained route, all nine physical City station beacons, reduced motion, Opera and mobile.
8. Repair only confirmed defects. Preserve one EONBOT, one project/task state and review-first boundaries.
9. Return deployment identity, candidate/dist/deployment-root digests, screenshots, console/network report, rollback target and a new complete source freeze only when code changes are made.

Do not repeat old broad redesign work or claim the interrupted 314-file suite as passed. The completed focused evidence is authoritative unless changed code invalidates it.
