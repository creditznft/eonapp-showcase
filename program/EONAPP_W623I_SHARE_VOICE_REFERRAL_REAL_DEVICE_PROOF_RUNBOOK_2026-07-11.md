# W623I — Referral Rollout, Share and Multilingual Voice Real-Device Proof

Date: 2026-07-11  
Source prerequisite: W623H

## Lane A — referral deployment

Follow `EONAPP_W623H_CLOUDFLARE_REFERRAL_ACTIVATION_RUNBOOK_2026-07-11.md` and produce evidence for migration, testing rollout, two-account identity/activation/grant/redemption, abuse rejection and rollback.

## Lane B — universal Share

1. Verify top-right Share on Chat, Create, Projects, Library, Profile, Billing, Support and one legal/information page.
2. Verify EON City uses its dedicated HUD Share without overlap.
3. Capture desktop and mobile screenshots with command center open.
4. Share a real local image, real local video and generated progress PNG through a supported native share sheet.
5. On an unsupported browser, verify copy caption/download/manual upload guidance.
6. Confirm no file is uploaded to EONAPP and no destination/post-success tracking occurs.

## Lane C — eleven-language input and replies

Test English, Hindi, Spanish, Portuguese, French, German, Arabic, Russian, Chinese, Japanese and Korean.

For each language record:

- typed Guide request;
- dictated Guide request where browser recognition is available;
- editable transcript before send;
- correct language-aware reply;
- spoken reply where a device voice is available;
- typed/OS fallback where it is not;
- explicit microphone permission and stop behavior;
- no background listening after leaving the surface.

## Lane D — script and layout

- Arabic RTL input, output, focus order and punctuation.
- Chinese/Japanese/Korean IME composition without premature submission.
- 200% zoom, mobile portrait/landscape, safe areas and large touch targets.
- Browser permission denied, microphone unavailable, network unavailable and background/foreground recovery.

## Lane E — model language routing

Use at least one Local model and one Direct BYOK model. Confirm the selected reply language reaches model context and the model answers in that language. No prompt or provider credential may pass through EONAPP Cloudflare Functions.

## Exit rule

W623I passes only when deployed referral authority, rollback, native media sharing and the real-device language matrix have saved evidence. Source strings or mocked browser APIs are insufficient.
