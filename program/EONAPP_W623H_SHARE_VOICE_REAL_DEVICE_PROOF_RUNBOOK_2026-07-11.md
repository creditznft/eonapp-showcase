# W623H — Share Command Center And Multilingual Voice Real-Device Proof

Date: 2026-07-11  
Source checkpoint required: W623G

This runbook proves runtime behavior that source tests cannot certify.

## A. Build and browser proof

1. Install dependencies from the frozen lockfile.
2. Run `npm run build`.
3. Serve the emitted build locally or deploy an immutable preview.
4. Set `EON_W623G_BASE_URL` to that origin.
5. Ensure Playwright Chromium is installed, or set `EON_CHROMIUM_PATH` to a compatible unmanaged browser.
6. Run `npm run evidence:w623g-share-browser`.

Required evidence:

- Chat native top-right Share.
- Create, Projects, Library and Profile global top-right Share.
- EON City HUD Share without overlap.
- Full Share Command Center visible and keyboard closable.
- Mobile 390×844 command center fits the viewport and keeps Close reachable.
- Invite, creation, milestone and campaign paths visible.
- EONKEY status says not active until W629 proof.

## B. Real media handoff

On at least one Android/iOS device and one desktop OS:

1. Select one non-sensitive local image.
2. Select one non-sensitive local video.
3. Generate each local PNG card preset: Creation, Project, City and Vault Reveal.
4. Use Share and choose an installed app.
5. Cancel once and confirm the file remains local.
6. Use a browser without native file sharing and confirm copy-caption/manual-upload fallback.

Do not record private content or provider keys in screenshots.

## C. Multilingual input/reply matrix

Run English, Spanish, Chinese, Japanese, Korean, French, German, Portuguese, Russian, Arabic and Hindi across available Chrome/Edge/Safari/Firefox/Android/iOS combinations.

For each language record:

- app/reply language;
- speech-recognition locale;
- browser Dictate available or unavailable;
- transcript editable before send;
- Stop Voice behavior;
- core Guide request understood;
- matching spoken voice, device-default fallback or visible-text/Read Aloud fallback;
- Local model selected-language reply;
- Direct BYOK selected-language reply;
- permission denied/retry behavior;
- foreground/background recovery.

## D. RTL and IME

- Arabic: direction, cursor, composer, punctuation, transcript and spoken reply.
- Chinese/Japanese/Korean: IME composition must not submit early; candidate selection and multiline editing must work.
- 200% zoom, reduced motion, keyboard-only and screen-reader labels.

## E. Local speech companion boundary

Do not activate the companion from the source contract alone. Passing evidence requires:

- signed binary provenance;
- authenticated short-lived loopback pairing;
- no query-string or ordinary LocalStorage secret;
- airplane-mode STT and TTS;
- language-pack licence record;
- explicit microphone start and cancel;
- no background listening, wake word or automatic transcript send;
- uninstall cleanup and low-memory recovery.

## Exit decision

W623H passes only when the machine-readable matrix, screenshots, output files and failure receipts exist. Missing browser voices or recognition are allowed when the typed/OS fallback is accurate and usable. No unsupported pair may be silently marked green.
