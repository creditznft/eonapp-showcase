# W479-M6 — Local Creator Media → platform distribution bridge

## Product promise

A creator should not have to rebuild a post after making an image or video locally. When a future local media adapter has passed its own evidence, its final output will enter the Creator Library as a **Post Pack**: local file/save location, caption draft, alt text, format notes, provenance/reminders and a selected platform handoff.

The workflow stays simple:

1. Create locally with a proven image/video adapter.
2. Review the finished file.
3. Save/export it to the user’s chosen local folder.
4. Pick a platform and review the caption/rules.
5. Share manually today, or use a future platform-specific connector only after that connector is officially approved and proven.

## What is live today

- Creator briefs, caption drafts, platform share/export routes, and a disabled global connector registry.
- No proven local image/video adapter yet.
- No connected X, Instagram, TikTok, YouTube, LinkedIn, Facebook Pages, Pinterest, Telegram, Discord, Reddit, WhatsApp, Threads or Snapchat account.
- No social OAuth, remote token storage, direct posting, background upload, scheduling or analytics claim.

## Bridge requirements before any asset is handed off

A local media adapter must prove all of the following for that exact runtime/workflow:

- explicit local connection;
- capability discovery;
- one successful generation;
- cancellation and error path;
- user-controlled local output;
- no silent cloud fallback.

The bridge takes **metadata only**. It refuses a file, Blob, base64/media body, token, key or secret. It cannot upload or post.

## Future official connector sequence

Every direct connector is separate and cannot be enabled globally:

1. Verify the platform’s current official API, eligible account type, app approval/audit and regional terms.
2. Build server-side OAuth/token custody with revoke and deletion behavior; do not keep platform tokens in browser localStorage.
3. Use an explicit, per-post review screen with cancel/back behavior.
4. Upload only the exact file the user reviewed; show format/visibility constraints before transfer.
5. Capture receipts/errors, then prove revoke, failure and support flows.
6. Keep manual export/native share available when direct posting is not approved.

This means an X post, Instagram Reel, TikTok video or YouTube upload will use the same Post Pack, but each will get its own approved connector evidence. No platform is treated as connected merely because its button or web intent exists.
