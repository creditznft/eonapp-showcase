# W624D Execution Brief — Player Avatar and Camera

Date: 2026-07-11  
Prerequisites: W624A art bible, W624B runtime owner, W624C Command District source slice  
Constraint: W624C runtime visual score remains pending; do not expand final-quality production beyond the Command District

## Mission

Replace the prototype-feeling player/camera layer with one responsive, comfortable and recoverable Wayfinder experience inside the existing W624C route.

## Required implementation

1. Create a distinct Wayfinder silhouette consistent with Productive Nocturne.
2. Preserve inclusive/non-sexualized personalization and no pay-to-win statistics.
3. Provide authored states for idle, walk, run, turn, interact, inspect, celebrate, sit/work and recovery.
4. Keep animation transitions deterministic and reduced-motion aware.
5. Improve third-person follow, shoulder/zoom options, collision avoidance and camera reset.
6. Prevent camera clipping through all W624C landmark collision volumes and path approaches.
7. Preserve the W624C authoritative spawn and nearest-safe-point Unstuck contract.
8. Support keyboard/mouse, touch and controller mappings without hidden auto-navigation.
9. Keep portrait fallback and mobile-landscape guidance honest.
10. Do not alter projects, providers, billing, referrals, Vault data or product routes during movement/recovery.

## Frozen architecture

- `/eoncity` remains the only heavy renderer document.
- `/api/city/access` remains server-authoritative.
- `eon-city-runtime-owner.js` remains the only mount/disposal owner.
- The station must not self-mount.
- The W624B eleven-state lifecycle and asset boundaries remain unchanged.
- W624C destinations, paths, spawn and Unstuck points remain authoritative unless a tested correction is required.

## Acceptance

Produce focused source gates/tests plus real-browser evidence where available for:

- all required avatar states;
- no camera clipping along the W624C first-sixty-second route;
- reset and Unstuck from every certified collision region;
- keyboard/mouse, touch and controller mapping contracts;
- reduced-motion behavior;
- stable disposal and re-entry.

Do not claim physical-device quality from emulation. W624C visual scoring and owner approval remain an explicit blocking lane for expansion beyond the Command District.
