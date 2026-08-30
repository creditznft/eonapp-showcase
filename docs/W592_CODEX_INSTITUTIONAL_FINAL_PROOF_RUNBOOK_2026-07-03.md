# W592 — Codex Institutional Final Proof Runbook
## EON City flagship preview, AI and local-runtime evidence

## Purpose

Turn the W592 source result into auditable preview evidence while preserving all privacy, access, commercial and consent boundaries. This runbook is designed to minimise owner testing: Codex automates safe review paths and prepares the evidence; a human only supplies the ordinary signed-in preview bootstrap and performs the final physical-device judgement.

## Non-negotiable rules

- Use a **named preview deployment**, never an unapproved production target.
- Keep full City behind the existing Google/EONAPP session.
- Never create a public test bypass, demo account, hard-coded identity, client-side unlock, credential capture path, CAPTCHA bypass or OAuth/MFA automation.
- A human completes normal Google sign-in, CAPTCHA, consent and any account notice in a disposable preview-browser profile. The short-lived storage-state file stays outside the repository and expires after the review window.
- Do not confirm work actions, provider actions, payments, subscriptions, publishing, connector activation, permissions, microphone, voice, sound, sharing or launch approval in automation.
- Never commit `.env.local`, Playwright storage state, screenshots with private work, raw provider output, raw prompts, API keys, key samples, keys hashes or generated local model outputs.

## 1. Establish source identity

```bash
npm ci --offline --no-audit --no-fund
EONAPP_TEST_CONCURRENCY=8 npm run verify:w555a-w592-source
npm run qa:w592-eon-city-flagship-red-team
```

Record the source checksum, Node version, package lock hash, branch/commit identity, verifier receipt and produced `dist` identity. A failed or interrupted verifier is a blocked result, not a pass.

## 2. Deploy and preserve identity boundaries

1. Merge only to an authorised review branch.
2. Deploy that exact source identity to a named preview host.
3. Confirm `/eoncity` remains the canonical route and that guest entry does not import the heavy renderer.
4. A delegated human signs in through the normal Google/EONAPP path in a fresh preview browser profile.
5. Store the resulting short-lived Playwright state at a secure path **outside the repo**, never in chat, Git, ZIP or ticket attachments.

## 3. Run the guest and authenticated City rehearsal

```bash
export EON_CITY_FINAL_REHEARSAL=1
export EON_CITY_LIVE_BASE_URL="https://<approved-preview-host>"
export EON_CITY_AUTH_STORAGE_STATE="/secure/preview-storage-state.json"
export EON_CITY_FINAL_PROOF_OUTPUT_DIR="/secure/evidence/w592-city"
npm run qa:w592-eon-city-flagship-red-team:preview
```

Required findings:

- Guest lane: truthful signed-in entry, no heavy canvas/renderer boot, screenshot/video, console/page/failed-request logs.
- Authenticated lane: direct HUD has four actions; Menu has five groups; Command Deck has five primary work stations; first-run uses `choose → review → cancel` without any route confirmation.
- Capture one continuous recording per lane plus initial frame, grouped Menu, Command Deck review and first-run review screenshots.
- Keep all actions `safe-in-place` or `review-then-cancel`. A native confirmation link may be inspected but never clicked.

Then run the W575 deep-gameplay lane with the same secure state, because W592 strengthens rather than replaces the existing Journey proof:

```bash
export EON_CITY_LIVE_GAMEPLAY_RUN=1
export EON_CITY_PROOF_OUTPUT_DIR="/secure/evidence/w575-w592-gameplay"
npm run qa:w575-command-horizon-live-gameplay:preview
```

## 4. Run real hosted AI evidence locally and safely

This step is performed only on the owner/Codex machine where `.env.local` already exists. Do not upload or paste the file.

1. Start with the direct local verification harness and pass only providers that are deliberately configured.
2. Do not use `--require-keys` for providers that are intentionally absent.
3. Keep tests concise: discovery, model selection, one token-return probe, cancellation/error handling where supported, then stop.
4. Treat a provider HTTP success as provider evidence only; it does not prove every EONAPP screen or City control.

Example shape (replace the provider list with configured, approved providers):

```bash
node scripts/w358-live-ai-verification.mjs \
  --env .env.local \
  --confirm-live \
  --strict \
  --providers "<configured-provider-ids>" \
  --json-out reports/w592-live-ai/results.json

EON_EVIDENCE_SECRET_AUDIT=1 \
node scripts/w592-evidence-secret-audit.mjs \
  --confirm-local \
  --env .env.local \
  --directory reports/w592-live-ai
```

Run the secret audit again over any final evidence bundle before transfer. A match is an immediate stop-and-cleanup condition.

## 5. Run local Ollama and host-runtime benchmarks

Start with read-only discovery:

```bash
node scripts/w527-local-ai-evidence.mjs --probe-loopback
```

Then run one small text model at a time. The harness sends one minimal token-return prompt, stores metadata only and does not download or mutate models:

```bash
EON_LOCAL_AI_BENCHMARK=1 \
EON_LOCAL_AI_MODEL_LIMIT=1 \
node scripts/w592-local-ai-benchmark.mjs --confirm-local --strict
```

For a chosen installed model:

```bash
EON_LOCAL_AI_BENCHMARK=1 \
EON_LOCAL_AI_MODELS="<installed-ollama-model>" \
node scripts/w592-local-ai-benchmark.mjs --confirm-local --strict
```

The benchmark records actual free GPU memory with `nvidia-smi` when available. It must never guess GPU VRAM from a laptop name.

### Optional image workflow

This validates a local host runtime, **not** an EONAPP media adapter:

```bash
EON_LOCAL_AI_BENCHMARK=1 \
EON_LOCAL_IMAGE_BENCHMARK=1 \
EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD=1 \
EON_LOCAL_IMAGE_WORKFLOW_FILE="/secure/local-workflows/image-benchmark.json" \
node scripts/w592-local-ai-benchmark.mjs --confirm-local
```

The workflow must target a loopback ComfyUI endpoint and use the `{{EON_W592_PROMPT}}` placeholder. The harness blocks image execution below 3.5 GB free VRAM.

### Optional video workflow

Video is intentionally more conservative:

```bash
EON_LOCAL_AI_BENCHMARK=1 \
EON_LOCAL_VIDEO_BENCHMARK=1 \
EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD=1 \
EON_LOCAL_VIDEO_WORKFLOW_FILE="/secure/local-workflows/video-benchmark.json" \
node scripts/w592-local-ai-benchmark.mjs --confirm-local
```

It is blocked unless at least 7.5 GB free VRAM is detected. On a lower-memory RTX 3050 configuration, `BLOCKED: insufficient-free-vram` is the correct result—not a failure to hide or workaround.

## 6. Workload-governor truth test

The source has a Universal Workload Governor for City render and supported EONAPP workloads. It does **not** yet prove control over an external Ollama or ComfyUI process without a real adapter.

Therefore report two separate results:

1. **City governor source/UI proof:** City renders, pauses/lites/defers through the defined local workload policy and retains recovery behaviour.
2. **External host-runtime proof:** Ollama/ComfyUI runs independently with its measured output.

Do not call this “City + external model load balancing” until an adapter acquires/release governor leases around the real local process and proves pause/defer/cancel/output lifecycle end-to-end.

## 7. Minimal human device review

Codex should automate browser coverage and prepare an evidence workbook. Human testing is limited to:

- one normal Google/EONAPP preview sign-in bootstrap;
- short visual judgement on desktop, Android and iPhone/iPad Safari;
- one keyboard/mouse, touch and controller check where available;
- reduced-motion, sound-off, refresh/cache recovery judgement.

The required result is `pass`, `fail`, `blocked` or `not-run` for each lane. Never turn an unrun physical-device cell into a pass through browser emulation.

## 8. Exit criteria for an owner decision

Codex may recommend a preview iteration only when all applicable items are present:

- Source verifier and W592 gate receipts
- Build identity and named preview URL
- Guest and authenticated continuous recordings
- Screenshots for direct HUD, Menu, Command Deck, first-run review and each W575 region
- Control inventory with action class and result
- Console/page error and failed-network logs, with known exclusions explained
- Secret-audit receipt for every evidence folder
- Hosted AI result matrix, where configured
- Ollama/local runtime summary, where available
- Image/video host runtime receipts only when explicitly run
- Device matrix with honest pass/fail/blocked/not-run states
- Defect list, severity, owner and re-test outcome

Production promotion remains a separate owner decision after preview, identity, security, asset provenance, accessibility and device evidence are accepted.
