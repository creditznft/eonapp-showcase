# EONAPP — Social Connectors, EON Share, and Global Growth Plan

Date: 2026-06-27
Status: planning and architecture only. No social posting connector is active in this source snapshot.

## Product decision

EONAPP should support global creators. The founder being located in India must not remove globally valid user features such as TikTok for users in countries where TikTok and its APIs are available. Connector availability should be based on user geography, platform availability, platform terms, OAuth/app-review status, and local law.

## Core principle

EON Share is not a spam tool. It is an approval-first creator workflow:

1. User asks EONBOT to create a campaign.
2. EONBOT drafts post copy, image ideas, video storyboard, CTA and disclosure helper.
3. User reviews everything.
4. User chooses destination(s).
5. User approves each post/schedule.
6. User can revoke each connected account.

No silent posting. No auto-DM. No hidden loops. No follower scraping. No engagement manipulation.

## Phase 1 — EON Share without platform accounts

Build first because it is low-risk and useful immediately.

- Share-card generator.
- Campaign brief generator.
- Caption variants.
- Image prompt/video storyboard package.
- Disclosure reminder.
- Copy link/native share/download package.
- Public work attribution options such as “Built with EON Forge”.

No OAuth, no posting, no analytics claim.

## Phase 2 — Connected drafts

Add platform OAuth only after account identity, privacy, token storage, support and revocation are proven.

Potential connector list:

- TikTok — direct video/photo posting where approved and available for the user.
- Instagram — creator/business publishing where the account type and API permissions allow it.
- Facebook Pages — page post/reel/media publishing where the user has page permission.
- YouTube — uploads/metadata through YouTube Data API.
- LinkedIn — member/company post publishing where scopes and review permit.
- X/Twitter — draft/export first; API posting only after pricing, scopes and policy are reviewed.
- Pinterest — Pin creation for creator/ecommerce use cases where access is approved.
- Reddit — draft/export first; posting requires careful subreddit/community compliance.
- Telegram — channel/group posting through bot/admin consent.
- WhatsApp — share/export and Business API later; not spam broadcasting.

## Phase 3 — Scheduling

Scheduling must be explicit:

- Destination account.
- Date/time/timezone.
- Media.
- Caption.
- Link.
- Disclosure label.
- Cancel/edit controls.

Recurring campaigns require a separate approval because they can become spammy.

## Referral growth

Referral link sharing is secondary. The real viral loop is that users share useful or beautiful outputs:

- Forge website preview/share card.
- City postcard.
- Campaign pack.
- Template/remix brief.
- Collaboration invite.
- Public “Made with EONAPP” badge.

Referral rewards stay disabled until the legal/policy gate is complete.

## Referral reward gate

When allowed later:

- Direct referral only.
- No downline or chain.
- No cash, payout, withdrawal, commission or token value.
- No reward for clicks/signups alone.
- Count only meaningful activated users.
- Deterministic cosmetic Artifact first.
- Seasonal cap.
- Anti-abuse review.
- Clear disclosure helper for creators receiving any benefit.

## Next implementation

- W388A: EON Share draft/export/native-share.
- W388B: social connector architecture and settings screens, still disabled.
- W388C: platform-by-platform official OAuth proof.
- W388D: per-post approval and scheduling proof.
