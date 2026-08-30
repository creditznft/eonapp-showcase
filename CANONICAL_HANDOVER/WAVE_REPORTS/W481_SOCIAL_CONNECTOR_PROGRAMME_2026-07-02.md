# W481 — Creator Social Connector programme

## CEO decision

EONAPP will support easy creator publishing, but **not by pretending every platform is connected**.

The launch-default path is universal: create or import an asset → review it in Creator Library → choose platforms → create platform-specific Post Packs → export/native-share with captions, hashtags, alt text and format notes.

Direct publishing is introduced **one platform at a time** after official API access, account eligibility, app review, server-side token custody, per-post confirmation, exact media upload, receipt, revoke and failure support have all been proven. It does not block the local-first core or Dodo eligibility.

## Shared publisher contract (W481-S0)

Every connector uses one durable, reviewable approval object:

`Asset → Post Pack → platform validation → Account connection → review → user confirms Publish → durable job → receipt / failure → revoke / disconnect`

Rules:

- A Post Pack contains reviewed metadata and a local asset reference; no raw token, secret or local media body goes through Chat or the City.
- A real upload fetches the exact user-reviewed file only after the Publish click.
- EONBOT may draft captions, hashtags, alt text, titles, descriptions and platform variants, but it cannot publish by itself.
- Each platform has its own terms/eligibility/format preflight, visibility setting, approval screen, cancel path and receipt.
- All direct-publish jobs are server-side and idempotent. Browser localStorage never holds long-lived platform tokens.
- Manual download/native share remains available whenever a connector is unavailable, denied or blocked by regional/account conditions.

## Connector order

### Pilot pack — highest creator value

1. **Instagram professional** — image/reel publishing only after official Meta approval and professional-account eligibility.
2. **Facebook Pages** — Page content publishing using a separately reviewed Meta capability.
3. **TikTok** — Direct Post flow with creator information/consent, required UI and status handling.
4. **YouTube** — video upload with explicit separate YouTube authorization, resumable upload/status and visibility review.
5. **X** — text-first posts, then media after its upload and user-context OAuth path is proven.

### Expansion pack — after pilot evidence

6. **LinkedIn** — member/organization posting only for available approved permissions.
7. **Pinterest** — pins and media only after current developer access and format rules are verified.
8. **Threads** — distinct Meta/Threads capability and terms review.
9. **Telegram channels/groups** — bot/admin posting only after destination confirmation, scoped consent and failure receipts.
10. **Discord** — scoped bot or webhook integration, never client-side webhook secrets.

### Manual/share-first by default

11. **Reddit** — content and community rules vary heavily; keep review-first/manual share unless an approved official route supports the exact use case.
12. **WhatsApp** — native share is the primary creator path; Business APIs are not treated as generic social-feed posting.
13. **Snapchat** — native share unless an approved official creator publishing route exists for the required account/region.

## Why this sequence

X exposes authenticated posting with OAuth user context; TikTok exposes a Direct Post sequence and creator-facing flow; YouTube supports authenticated media upload; and Instagram APIs target professional accounts. Those are viable pilot candidates, but none becomes live until EONAPP itself clears the provider-specific review and evidence gates. citeturn212958search0turn212958search1turn212958search2turn212958search3turn660251search0

LinkedIn and Reddit have different availability and approval models, so they are expansion candidates rather than assumptions. citeturn660251search2turn660251search33turn660251search3

## W481 exit criteria per platform

- current official API/policy verified on the implementation date;
- approved app/project and eligible account type;
- minimal scopes and revocation/disconnect path;
- encrypted server-side token custody and deletion route;
- platform-specific media constraints and preflight;
- explicit review/cancel/publish sequence;
- durable upload/post job with idempotency, status polling/webhook where applicable and user receipt;
- failures, retry, expiration and support routing;
- real-account test, real-device test and owner sign-off;
- manual export/native-share fallback always available.

No connector is enabled globally. A platform appears as **Connect** only after the exact connector has passed its own evidence gate.
