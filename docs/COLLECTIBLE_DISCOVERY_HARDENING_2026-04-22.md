# Collectible Discovery Hardening

Date: 2026-04-22
Scope: vault loot discovery, swap artifacts, and anti-spam boundaries

---

## Goal

Keep collectible discovery shareable without turning it into a social marketplace that needs moderation.

The rule is simple:

- collectibles are system-generated
- identity is generated-only
- discovery is artifact-based
- no chat, no bios, no profile posts, no direct messaging

---

## Boundaries Locked In This Slice

### 1. No freeform public identity

- invite and challenge displays resolve from generated identity only
- remote challenge discovery should derive alias from UID, not trust raw alias strings

### 2. Signed-code trust, not social trust

- P2P swap discovery is only a discovery layer
- signed offer codes remain the trust anchor
- relay payloads must stay minimal and non-social

### 3. Rate-limited public feed

- one vault should not dominate the discovery board
- browse results should be capped per UID
- visible feed should stay intentionally shallow and recent

### 4. No user-authored marketplace surface

- no seller bios
- no descriptions typed by users
- no external links
- no comments or reply threads
- no public negotiation channel

---

## Current Practical Rules

- use system catalog names only for collectibles
- show offer requirements and item traits only
- keep discovery feed to recent swap artifacts
- avoid exposing raw relay metadata in UI
- keep local-first settlement as the default path

---

## Next Hardening Targets

1. Add stricter per-session publish throttles for swap artifact broadcast.
2. Add optional backend trust receipts only as reconciliation, not as the primary UX.
3. Collapse discovery language away from "marketplace" toward "artifact exchange" everywhere in the vault.
4. Add expiry badges and stale-feed cleanup UI so old offers disappear faster from the user-visible board.
5. Add challenge/discovery copy checks to launch gates so social-surface regressions get caught automatically.

---

## Launch Rule

If a new collectible feature introduces any of these, it is outside the launch-safe model and should be treated as a new moderation surface:

- custom public text
- uploaded media
- user links
- direct replies or messaging
- public account pages
- open-ended listings