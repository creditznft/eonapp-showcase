# W478 Creator and Platform Connector Truth — 2026-07-02

## Current product truth

EONAPP has useful creator preparation and **manual** distribution helpers, but it does **not** currently have every major social platform connected for direct publishing.

Current useful surfaces include creator briefs, caption/content preparation, export/native-share routes and web-intent/compose conveniences. These are not account connections.

The approved social connector registry is deliberately disabled. Current product truth is:

- no social OAuth flow;
- no server-side social token custody;
- no connected X, Instagram, TikTok, YouTube, LinkedIn, Facebook Pages, Pinterest, Telegram, Discord, Reddit, WhatsApp, Threads or Snapchat account;
- no direct media upload/post;
- no scheduling/background post;
- no direct-publishing receipt or revoke flow.

Legacy webhook/web-intent code is not treated as a verified direct-publishing connector.

## Correct future product shape

A future local image/video output enters the Creator Library only after its specific adapter proves local connection, capability discovery, generation, cancellation/error, user-controlled output and no silent cloud fallback.

Then EONAPP creates a metadata-only **Post Pack**:

- asset ID, title, kind, format and user-controlled save/location hint;
- caption and alt-text draft;
- provenance/format notes;
- selected platform handoff;
- explicit user review/save/export steps.

Today the user manually exports or uses native share. This avoids pretending that platform accounts are connected.

## Later direct connector requirements

Every direct social connector stays a separate delivery programme. It needs an official current API/approval review, eligible account type, secure server-side OAuth/token custody, per-post user review/cancel, exact media transfer, visibility/format checks, receipt/error handling, revoke/deletion/support behavior and real account/device proof.

No local media body, Blob, base64, credential or token is allowed in the Post Pack itself.
