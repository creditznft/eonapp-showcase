# EONAPP W390–W391 — Collection and Viral Growth Decision

**Status:** design decision only. No referral reward, Collection entitlement, social connector, automated posting, payment, token, blockchain, marketplace, cashout, transfer, or lootbox capability is active through this document.

## 1. The final model

EONAPP is a creation workspace with an optional game-like progression layer.

- **EONBOT** is where people ask, create, plan, research, and manage work.
- **EON Forge** turns a brief into a real local project.
- **EON City** makes progress feel visible and enjoyable.
- **EON Collection** records earned visual progress and optional non-financial enhancements.

The Collection is not a store, wallet, investment, NFT exchange, or payment system.

## 2. Separate creation from progression

Do not revive a standalone public "Studio" merely to generate collectible cards.

- Image/video/content creation stays inside EONBOT's Create flow and later a contextual creator workspace.
- **Library → Collection** is where users see what they earned.
- **EON City → Collection Vault** is the visual in-world view of the same items.

This prevents three confusing products: Studio, Market, and NFT Generator. There is one creator flow and one progression/ownership surface.

## 3. The item system

### A. Artifacts — permanent visual progress

Artifacts are account-bound visual objects: City decorations, companion skins, profile frames, Forge project cover styles, City postcards, and milestone badges.

- Cosmetic first.
- No cash value.
- No sale, transfer, exchange, withdrawal, redemption, or user-to-user gifting.
- No blockchain claim.
- A user may export a flat image/postcard of an Artifact, but not transfer its entitlement.

### B. Access Passes — only after a real feature exists

An Access Pass can unlock an enhancement only when that enhancement is genuinely implemented, priced, and supportable. Examples may eventually include a Forge starter kit, City decoration pack, export presentation pack, or a time-boxed preview of an optional tool.

- Never gate chat, project ownership, source export, backup, basic City access, or safety features.
- Never promise AI/model credits until the cost and provider policy are real.
- Never treat a Pass as money, a balance, an asset, or an investment.
- Every pass must state its exact feature, duration, storage state, and expiry if any.

## 4. Reward reveals without lootbox risk

The product uses a **Vault Reveal** animation, not a lootbox.

- The earned item is deterministic before the reveal animation.
- There are no odds, chance mechanics, purchase, entry fee, random reward, or paid boost.
- Rarity describes art direction and story tier, not a probability table or financial value.
- Referral rewards must never be random.

Examples:

| Completed milestone | Deterministic reveal | User benefit |
|---|---|---|
| Create first Forge project | Foundation Artifact | Project cover and City desk decoration |
| Download first project source | Builder Mark | Profile/City cosmetic |
| Complete encrypted backup | Archive Seal | Backup recognition cosmetic |
| Create first approved campaign draft | Signal Frame | Share-card visual style |
| Complete a verified direct collaboration milestone (future) | Relay Artifact | Cosmetic only at launch |

Do not reward adding an API key, enabling a payment method, or making a purchase.

## 5. Referral program: conservative launch rule

A referral program is not active until account identity, server-side validation, anti-abuse controls, terms, privacy notices, and legal review are complete.

When it launches, use this narrow policy:

1. **Direct only:** one inviter and one invited person. No chain, team, downline, rank, pyramid, or indirect reward.
2. **No payment condition:** no purchase, deposit, subscription, or money transfer is required from either person.
3. **No click/signup reward:** a referral counts only after the invited person independently completes one meaningful in-app creation action and has not self-referred.
4. **Deterministic cosmetic reward first:** the first public pilot awards only a non-transferable Relay Artifact with no cash value and no essential feature entitlement.
5. **Seasonal cap:** small fixed maximum per account; no unlimited farming and no urgency language.
6. **No chance:** no referral lootbox, draw, contest, roulette, multiplier, or mystery odds.
7. **No cash language:** no earnings, income, commission, payout, withdraw, value, appreciation, resale, investment, or profit wording.
8. **No leaderboard based on recruits:** progress is private by default; no public recruitment ranking.
9. **Human-review queue:** unusual volume, same-device patterns, duplicate accounts, or circular referrals are held before any claim.
10. **Clear creator disclosure:** users who receive anything of value for promotional content must be given an upfront disclosure tool and wording.

Non-transferability is a risk-reduction design choice, not a legal safe harbour. Before enabling even cosmetic referral rewards, obtain India-specific legal review of the final terms, geography, age controls, and campaign copy.

## 6. Entitlement and backup rule

Before account identity exists, a Collection item is an unclaimed local visual record only.

After a user chooses to sign in and the entitlement service is approved:

- The account holds the authoritative entitlement record.
- Local browser storage is a cached display, not the proof of ownership.
- Backup can preserve local work and display metadata, but cannot create or transfer an entitlement to a different account.
- Restore requires the same signed-in account and a server-verified entitlement record.
- Local source downloads never contain Access Pass credentials or transferable keys.

## 7. Viral growth: share the work, not just the referral link

The primary growth loop is useful output. A creator should want to share a finished thing even if there is no reward.

### Growth loops to build

1. **Forge project share card** — opt-in attribution badge on a public/static project preview: “Built with EON Forge.”
2. **Remix brief** — a safe shared project brief opens a new local starter for the recipient, not the sender's private files.
3. **City postcard** — visual progress card that a user can share to a story or post.
4. **Creator campaign kit** — EONBOT creates a post concept, caption variants, visual brief, video storyboard, disclosure reminder, and posting checklist.
5. **Collaboration invite** — invite a friend to review a brief, choose a style, or remix a non-private template; this is collaboration, not recruitment.
6. **Template attribution** — user-created template authors can choose a visible credit link where public publishing is later enabled.
7. **EON Share** — a small, opt-in campaign workspace: create draft → user reviews → user approves → export/native share now; official-platform connections later.

Referral is secondary. It should live inside EON Share as a disclosed opt-in campaign objective, never as the main product action.

## 8. Social connector roadmap

### Phase 1 — no account connection

- Generate campaign briefs, captions, image/video storyboards, and share cards locally.
- Download/export and use the device native share sheet.
- Copy a clearly marked referral/invite link only when the user chooses it.
- No automatic posting or analytics claim.

### Phase 2 — connected drafts

- User connects an approved platform through its official OAuth flow.
- Show scopes, account/channel selection, draft, exact media/caption, disclosure label, schedule, and destination before approval.
- A social connection can be revoked from Settings.
- No token in browser localStorage; encrypted server-side storage only after the data-custody/privacy work is complete.

### Phase 3 — per-post publishing and scheduling

- User explicitly approves every post by default.
- Scheduling is separate from publishing and shows date, time, timezone, destination, caption, media, disclosure, and cancellation controls.
- Batch posting or recurring approval is a later, separately reviewed product decision.

Instagram and YouTube are the first technical candidates only after official app review/authorization requirements are satisfied. Other platforms are drafts/export-only until their API and policy contracts are verified.

## 9. Product copy rules

Use: “Invite a collaborator”, “Share your work”, “Earn a City Artifact”, “Unlock a cosmetic”, “Create a campaign draft”.

Never use: “earn money”, “recruit”, “downline”, “commission”, “payout”, “investment”, “token value”, “profit”, “trade”, “win a prize”, “lootbox”, or “guaranteed growth”.

## 10. Delivery order

- **W390A:** Collection data model and local visual display only. No referral and no entitlement claim.
- **W390B:** Deterministic Vault Reveal animation for product milestones.
- **W391A:** Account-bound entitlement service design after Google/D1 identity proof.
- **W391B:** Referral compliance review packet, terms, anti-abuse ledger, and pilot gate. Disabled by default.
- **W391C:** Small direct-referral cosmetic pilot only after written legal approval.
- **W391D:** EON Share campaign drafts and native share/export.
- **W391E:** Official social connectors, per-post approval, disclosure assistant, and revocation controls.

## 11. Launch gate

No Collection utility, referral reward, social publishing, scheduling, public project page, or campaign analytics becomes active until its own user-value, privacy, security, policy, legal, abuse-prevention, and support proof is complete.
