# W676 — Orientation authored resident coherence

Date: 24 July 2026  
Authority: local N3 + C3 development only  
Deployment status: not deployed

## Purpose

W674 initially used bounded resident silhouettes so its District Belt could render without depending on asynchronous GLB loads. W676 connects that fallback presentation to the existing W649 authored-asset residency runtime.

## Result

Orientation Hall now requests six distinct existing animated character assets:

- Orientation Architect
- Holo Interface Device Guide
- EON X1 Mission Operator
- Citizen Arrival Guide
- Device Lab Maintenance Specialist
- Civilian Creator Project Liaison

Each character is placed at a purposeful District Belt anchor and continues to use the existing W649/W660M animation state machine. A procedural silhouette remains visible only until its matching GLB is resident. Once the real character is reported, the corresponding fallback is hidden. The generic Connected Core Orientation ambient capsule is also removed so population is not duplicated.

## Boundaries

- no invented autonomous employee behavior
- no fake work claims
- no automatic route opening
- no private-data reads
- no new loader, scene, canvas or render loop
- no remote network request
