# EONAPP Launch95 Source Audit Receipt — 2026-08-10

## Authority
- Frozen production/live source ancestor: `7a833c91203c5c1dc82e8529c83a619473d67261`
- Launch95 audit head at receipt creation: `e11a974efc06a02fb4e4a7813d434b6b19e07e75`
- Branch: `chatgpt/launch95`
- Live ancestor check: PASS
- Working tree at receipt creation: clean

## Launch95 source gate
- Files changed from live authority: 132
- Changed JavaScript / MJS modules: 125
- `node --check` across every changed JS/MJS file: PASS (0 syntax failures)
- Launch95 maintained regression suite: 175 / 175 PASS
- `git diff --check`: PASS

## Launch-critical contracts verified in source
1. **Mobile critical controls**
   - Composer / Send owns the phone bottom safe zone.
   - Quick Command cannot cover Send.
   - City sheets/workspaces keep a reachable 48px dismiss path in phone portrait and landscape.
   - Open sheets suppress underlying gameplay HUD hit targets.

2. **One-click EONBOT continuity**
   - City EONBOT uses a dedicated lightweight adapter rather than loading Creator/Music/ComfyUI first.
   - Same canonical session thread is used across main EONBOT and City.
   - Exact active world is captured for workspace return.
   - Gameplay context is bounded and is not written as fake user transcript content.

3. **Open-world first-session access / retention**
   - Signal Frontier is recommended story, not a prerequisite for My Frontier.
   - My Frontier is available from the first session; construction receipts remain truthful.
   - Storm public access is gated only by maintained release certification, never by Signal completion.
   - Signal / My Frontier / Storm each have persistent next-action guidance and interaction parity.

4. **World presentation + performance ownership**
   - Signal, My Frontier and Storm lazy-mount instead of taxing Command Hub boot.
   - Inactive world-specific animation/update work is suspended while decoded assets may remain reusable in-session.
   - Static world transforms are frozen where safe.
   - Decorative/ambient work is cadence-bound; player, camera and interaction remain immediate.
   - FPS pressure sheds distant decoration before gameplay/hero surfaces.

5. **City + Local AI workload coordination**
   - W731 renderer remains sole owner of City visual/FPS adaptation.
   - Shared workload governor observes City pressure and can trim/defer new AI/background work without double-degrading the renderer.
   - Admitted in-flight EONBOT replies are allowed to finish safely.
   - Browser EONBOT prevents competing foreground replies.

6. **3D asset residency / Cloudflare transfer control**
   - Immutable City art uses a stable persistent cache and content-addressed URLs.
   - App-shell release changes do not invalidate unchanged content-addressed City art.
   - Command Hub does not prefetch Open-World hero assets before explicit entry.
   - Same-source concurrent decode spikes are prevented.
   - Performance evidence distinguishes observed network transfer from browser-local reuse.
   - Warm unchanged reopen proof is a required launch checklist item.

7. **Performance evidence quality**
   - FPS samples identify exact world: Command Hub / Signal / My Frontier / Storm.
   - Startup/warmup evidence is separated from stable-session evidence.
   - FPS protection evidence window resets after authored visible-frame readiness so startup decode does not masquerade as sustained gameplay pressure.
   - Renderer export includes world identity and asset-transfer observation.

8. **Console certification boundary**
   - First-party EONAPP errors/warnings remain certification relevant.
   - Browser-extension/content-script noise is retained separately and cannot falsely fail first-party certification.
   - Console evidence sanitizes query strings and credential-like values.

## Intentionally not claimed by this receipt
This receipt is a **source/regression** receipt. It does not claim the unreleased Launch95 branch has already passed final headed Chrome + Edge physical-device / deployed-candidate proof. That is the final Codex/owner release gate after exact-candidate deployment. Production was not changed by this receipt.
