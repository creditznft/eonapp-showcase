# W479-P0 — Universal Ready-to-Post System

## CEO decision

**Manual-first is the universal publishing baseline.**

Every creator should be able to finish a post without waiting for a platform API, an EONAPP connector approval, a token, an account link or a Cloudflare-hosted upload. The same Ready-to-Post kit works for any current or future destination.

Direct platform connectors remain optional accelerators later. They do not replace manual-first and they do not block the core creator experience.

## What a creator gets

After they prepare content in EONBOT, Creator Studio, a future Local AI image/video adapter, or a future connected AI route, they can open one Ready-to-Post kit and receive:

- one selected destination label or **Any app on my device**;
- an editable title, caption, CTA, credit/hashtags and public link if the creator supplies one;
- multiple post-format notes: vertical video, square post, wide video and story card;
- visual brief and video-beat notes;
- copyable post text;
- a downloadable JSON/text-ready post kit; and
- an optional native-share handoff for one **user-selected** final image or video.

The creator chooses the final app and completes the upload/post themselves unless and until a real official connector exists.

## User journey

1. Create or finish an asset locally or through an approved provider flow.
2. Choose **Prepare Ready-to-Post kit**.
3. Select a destination, or leave it at **Any app on my device**.
4. Review and edit the post text. Nothing is sent yet.
5. On supported mobile browsers, choose the final image/video and press **Share via device**. The operating-system share sheet lets the creator select an installed app.
6. On desktop or unsupported browsers, copy the completed post text, download the kit and upload the final file manually.
7. The destination app—not EONAPP—shows the creator its final publish controls.

This works even when a platform has no public API, a connector is not approved, a device blocks native share, or a social account is ineligible for direct publishing.

## What stays out of EONAPP

The Ready-to-Post kit does **not**:

- upload, host, proxy, retain, scan, transform or optimize selected media;
- create an EONAPP public media link, campaign link, referral link or tracking link;
- connect a social account, store a token, call a social API or create a scheduled job;
- prove a destination post, view, reach, conversion, remix, reward or payment;
- transfer media through EONBOT, EON City or the saved post kit; or
- bypass the creator's final review.

Selected media exists only in the browser/device for the one explicit native-share attempt. The saved/exported kit contains text and structured creative direction, never a media body or credential.

## Why no Cloudflare media/referral transport

A central media relay would add upload cost, bandwidth, storage, privacy exposure, moderation obligations, delete/revoke work, public-link abuse risk and a dependency on EONAPP availability. It is not needed for the manual-first experience.

Referral/invite links remain separate EONAPP features. A Ready-to-Post kit never creates or injects one automatically. A creator may manually include a public link they control only after review.

## Destination catalogue — current manual-first status

The source surface includes: Any app, Instagram, Facebook Page, TikTok, YouTube, X, LinkedIn, Pinterest, Threads, Telegram, Discord, Reddit, WhatsApp and Snapchat.

These are destination labels and preparation formats, not a claim that EONAPP has connected accounts or direct-upload approval for them.

## Direct connector policy — later W481

A direct connector may be added only after all of the following are separately true for that platform:

1. EONAPP has the required official developer access and product approval.
2. The user is eligible and explicitly consents to the minimum OAuth scope.
3. Tokens are held server-side in a reviewable custody boundary, never in browser storage or a Share Pack.
4. The creator sees the exact final media/caption and presses Publish for that platform.
5. The connector has format preflight, cancellation where possible, durable idempotent job handling, receipt/error surface, revoke/disconnect and support evidence.
6. Real account and real-device evidence proves the route before the UI calls it Connected.

## Relationship to local image/video models

W479-M adapters must emit a reviewed local output into this kit only after their own connection, capability, generation, cancellation, output, local-storage, CSP/CORS/PNA and device proof pass. Until then, Creator Studio may prepare briefs and kits but must not claim to generate image or video media.

## Acceptance boundary

A share sheet opening is a successful handoff only. It is **not** proof that content was uploaded, published, accepted, viewed or distributed.
