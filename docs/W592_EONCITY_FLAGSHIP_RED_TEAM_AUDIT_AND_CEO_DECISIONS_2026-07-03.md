# W592 — EON City Flagship Red-Team Audit and CEO Decisions
## Source review date: 2026-07-03

## Executive judgement

EON City had strong technical boundaries, a capable world, and a credible source-validation history. Its major weakness was not missing features: it was **decision density**. The first minute could feel like a product-control surface wearing a City skin. That is not the flagship standard.

W592 makes a deliberate product decision: **EON City is a place first, a work gateway second, and a diagnostics surface only when a person asks for one.** It favours a calm, ChatGPT-like clarity over a feature inventory.

This is a source-level red-team result. It is not a visual, browser, device, identity, AI-runtime, security, performance, or launch certification.

## Red-team findings and actions

| Priority | Finding | Why it was not institutional | W592 decision | Status |
|---|---|---|---|---|
| P0 | First-run path cards were direct native-route links. | One accidental tap could leave City despite the rest of the product requiring review-first routing. | Replaced links with `choose → review → visible continue` flow. The native route remains a second explicit click. | Fixed |
| P1 | The Menu presented about 20 equal-weight controls in one sheet. | New users had to parse system, accessibility, work, maps, settings and proof tools at once. | Replaced it with five progressive-disclosure groups: Explore, Movement & display, Work & guidance, Appearance & accessibility, Trust/access/proof. | Fixed |
| P1 | Command Deck surfaced seven cards with equal priority. | Settings and route notes competed with the user’s five core work destinations. | Direct Deck now shows EONBOT, Forge, Projects, Library and Vault. Route notes and settings stay in Menu. Historical full-deck contract remains intact. | Fixed |
| P1 | Simplifying the old control panel initially hid keyboard/controller guidance. | Reduced clutter must not make motion, pointer-look, landmark focus, minimap or safe interaction undiscoverable. | Kept the four-action HUD, but restored a compact, plain-language control guide inside Movement & display: keyboard, controller, touch, minimap, click-to-move, pointer look and review-first landmark controls. | Fixed and regression-gated |
| P1 | Development-wave labels appeared in a user-facing systems panel. | Users should not need to understand wave numbers or internal certification vocabulary to use City. | Renamed it as a plain-language City systems guide and removed technical wave identifiers from primary user-facing cards. | Fixed |
| P1 | AI proof tooling wrote redacted key fragments. | Partial key samples are unnecessary evidence and expand secret exposure risk. | Presence-only environment summary; no prefixes, suffixes, samples, lengths or hashes. Exact-value secret scan added before evidence export. | Fixed |
| P1 | Local image/video expectations could be mistaken for an implemented EON City adapter. | A local Comfy/Ollama runtime is not the same as an in-app adapter with workload governance and output handling. | Added an explicit, opt-in loopback benchmark. It labels host-runtime proof separately and never claims City media integration. | Fixed truth boundary |
| P2 | Access copy used mixed EON Universe / EON City terminology and too many future-facing statements. | A flagship entry must tell people what happens now, not explain internal architecture. | Standardised the signed-in entry on EON City and reduced it to two trust promises. | Fixed |

## Product decisions now locked

1. **Entry is calm.** Direct City HUD has exactly four primary actions: Start here, EONBOT, Command Deck and Menu.
2. **City exits are review-first.** Any native surface is reached only after a visible confirmation. City never routes programmatically.
3. **Core work is five stations.** EONBOT, Forge, Projects, Library and Vault are the only equal-priority Command Deck stations.
4. **Menu follows user intent.** System and diagnostic features stay grouped behind named sections instead of competing with work entry.
5. **Controls stay discoverable.** Keyboard, mouse, controller and touch guidance belongs inside Movement & display, not in the primary HUD and not behind unexplained icons.
6. **User-facing language is product language.** Internal wave IDs, historic programme names, source-gate terms and development jargon do not belong in core City navigation.
7. **Signed-in access stays protected.** There is no public test bypass, demo password, client unlock, CAPTCHA bypass, identity impersonation, or automatic Google/OAuth flow.
8. **AI truth is non-negotiable.** A successful Ollama, ComfyUI or provider benchmark proves only that external runtime lane. It does not prove an EONAPP adapter, workload integration, media lifecycle or user-visible City output.
9. **Evidence is secret-safe.** `.env.local`, short-lived authenticated browser state and generated reports stay outside Git and the handover archive.

## Static source-design score

### Before W592

| Dimension | Score | Reason |
|---|---:|---|
| Entry clarity | 12/20 | Four HUD actions existed, but the initial route choices still sent people away too easily. |
| Route safety | 8/20 | First-run cards contradicted review-first routing. |
| Decision hierarchy | 9/15 | Menu and Command Deck had too many equal-weight choices. |
| Access and trust | 15/15 | Deferred, signed-in City boot was already a strong boundary. |
| Evidence security | 6/10 | Secret material was not written raw, but redacted key fragments were still unnecessary. |
| Local AI truth | 8/10 | Boundaries were good; actual machine-runtime evidence lane was missing. |
| Test integrity | 10/10 | W575 already protected guest/auth preview proof from bypasses. |
| **Static source-design total** | **68/100** | Strong base, not a flagship entry experience yet. |

### After W592

The W592 static gate scores the post-change **source interaction contract** at **100/100** across entry clarity, route safety, decision hierarchy, access/trust, evidence security, local-AI truth and test integrity.

That number is intentionally narrow. It does **not** rate art direction, frame rate, WebGL stability, touch feel, browser behaviour, real sign-in, actual provider output, actual local-model output, security review or launch readiness.

## What still requires independent proof

- Named-preview guest and authenticated City gameplay, recordings, screenshot set, browser logs and failed-network logs.
- Real desktop, Android, iPhone/iPad Safari, tablet, controller, portrait/landscape, reduced-motion, sound-off, cache/recovery and long-session checks.
- Normal human Google/EONAPP sign-in bootstrap; no automated credential/CAPTCHA/MFA/consent handling.
- Direct provider output using the owner’s local `.env.local`; evidence must be secret-audited before export.
- Ollama text output on the actual laptop; local image/video host-runtime proof only when explicit workflow and free-VRAM conditions are met.
- A true EONAPP local image/video adapter before any claim that City workload governance protects those media runs.
- Owner go/no-go approval after evidence review.

## CEO release posture

**Source interaction quality: ready for Codex preview evidence.**

**Production launch: not approved.** The W592 package is a better, safer and simpler flagship source. It must now earn visual, device, identity and runtime credibility on a named preview.
