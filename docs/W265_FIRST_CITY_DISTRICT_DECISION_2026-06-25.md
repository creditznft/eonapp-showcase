# W265-A0 — first City district decision: Orientation Hall

**Date:** 2026-06-25  
**State:** source-only product decision; not a release, purchase, or performance approval.

## Decision

The first approved post-baseline City expansion is **Orientation Hall** (`orientation-hall`). It is a quiet, non-transactional entry place that helps a visitor understand the existing City surfaces and select a next route for themselves.

| Scope | Decision |
|---|---|
| City Lite 2D | Included |
| Visual Tour 3D | Included as source-rendered procedural geometry only |
| Babylon City Play | Not included |
| Automatic routing | Prohibited |
| Wallet, chain, reward, referral, provider, Vault, commercial context | Prohibited |
| Remote assets, remote I/O, new runtime dependency | Prohibited |
| Added NPC/background/network budget | Zero |

## Why this is the right first district

It improves first-use orientation without expanding external trust surfaces. It uses only the existing source-controlled landmark registry and renderers, adds no new device burden by default, and preserves City Lite as the fallback surface.

## Evidence still required

This source decision does **not** prove visual quality, desktop/mobile performance, usability, accessibility, asset provenance beyond source inspection, or City Play readiness. W259/W266 device evidence and a separate performance/art review are required before any Babylon City Play expansion.

## Non-goals

No district-opening transaction, wallet, token, EON Lite, referral or reward action is created. This decision does not alter W260 NO-GO.
