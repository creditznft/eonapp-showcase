# W605 — AI Capability, Grounding and Real-Output Quality Programme

**Status:** source implementation and deterministic gates complete; live model/media outputs intentionally unproven until the owner runs the explicit local matrix.

## Decision

EONAPP does not make a model smarter by silently training it on private chats, Vault values, videos or browser history. Instead, compatible text-model calls receive a small, versioned **runtime grounding pack** that tells the selected model what EONAPP is, what is real today, where the boundaries are, and what must be verified before claiming success.

This is paired with optional, same-browser local memory. The user must actively save a short non-sensitive memory card. It is not auto-captured from chat, is not cloud synced, is not sent to a provider merely because it exists, and is never training data.

## W605 implementation

| Capability | W605 status | Truth boundary |
|---|---|---|
| Versioned EONAPP product grounding | Implemented for compatible EONBOT text calls | Runtime context only, not fine-tuning |
| Opt-in cross-model memory | Implemented browser-local ledger | Same browser only; no raw-chat auto capture; no secrets |
| Internet/current-info behavior | Contract and model instruction implemented | No direct local-model browsing; needs explicit verified connector and citations |
| Local text output proof | Explicit loopback-only script added | Requires a user-installed local runtime and the owner’s command |
| Local image/video output proof | Explicit ComfyUI workflow matrix added | Requires manually exported workflow, high-load opt-in and human review |
| Creator Studio auto download/edit/post | Not implemented | No claim made; only authorized saved-output metadata can be inspected |
| Provider/API text output test | Architecture ready | Requires an explicit provider test lane and user-owned credential; W605 does not read `env.local` |

## Knowledge cards

The grounding pack contains public source-controlled cards for:

1. Vault and secret safety.
2. Local, connected and Guide Mode truth.
3. Grounding versus training versus memory.
4. Explicit cited web research requirements.
5. Creator Studio media truth and authorization.
6. Low-VRAM image/video guidance.
7. EON City truth.
8. External action, publication and payment approvals.

The builder selects concise relevant cards per turn, while always retaining the core identity and safety cards.

## How model calls become better informed

`ai-runtime.js` already generates a turn-specific EONBOT system context for local and connected requests. W605 adds `EONAPP_GROUNDING_W605` into this shared builder. This means compatible selected text models receive the same product truth on their first answer. It does **not** mean Guide Mode is a language model, that image/video models consume the text prompt, or that a provider is automatically online.

## Memory behaviour

Use `/local-ai` → **EONBOT knowledge and real-output proof** to save a short card. Examples:

- “Prefer concise plans with test receipts.”
- “My project is a creator workflow for short-form music clips.”
- “Use INR and Goa context when I ask for venue ideas.”

Do not enter passwords, API keys, recovery phrases, private keys, access tokens, payment credentials or raw private data. Secret-like text is rejected before it is saved.

## Web research architecture — W606 client-only requirement

Do not hand arbitrary internet access to every local model. W606 uses one explicit **client-only Research Ledger**:

1. Requires a clear user action and question.
2. Accepts a user-pasted permitted public extract or a browser-direct CORS fetch only when the source itself permits it.
3. Shows source URL, capture time and a short local evidence extract to the user.
4. Injects only that cited packet into the selected model turn once, then removes it from the queue.
5. Keeps research separate from model memory unless the user explicitly saves a non-sensitive memory card.
6. Rejects credentials, local/private URLs, payment/account-change requests and secret-like source content.
7. Uses no EONAPP/Cloudflare Worker, proxy, server-held research key or hidden relay.

No model can claim “I browsed” unless the user supplied a cited local source packet; even then it must say that it used supplied evidence rather than claiming live browser access.

## Local output test order for the owner’s 16 GB RAM / RTX 3050 4 GB VRAM laptop

1. **Text:** self-test a small local text model via existing Local AI setup; then use the W605 live text command.
2. **Image:** install and run ComfyUI manually; use one 512×512 SD 1.5-class image workflow as a device-fit baseline.
3. **Image-to-video:** only after the saved image baseline passes, manually run one short low-resolution LTX-Video 2B-class micro-clip trial with high-load consent. This is experimental on 4 GB VRAM, not a reliability promise.
4. **Do not default to Wan 1.3B** on 4 GB VRAM. Keep it for a better-equipped machine or a user-chosen provider path.
5. **Creator edits:** only test user-owned/authorized saved output. Validate the exported file with `ffprobe`; do not auto-download from social platforms or post automatically.

### Live commands

Run only from a local working copy after installing the relevant runtime yourself:

```powershell
$env:EON_W605_CONFIRM_LIVE='1'
$env:EON_W605_TEXT_MODEL='your-installed-model'
node scripts/w605-live-ai-output-matrix.mjs --confirm-live
```

For an image or video run, export an API workflow from ComfyUI, set the corresponding `EON_LOCAL_IMAGE_WORKFLOW_FILE` or `EON_LOCAL_VIDEO_WORKFLOW_FILE`, then add the explicit high-load opt-in:

```powershell
$env:EON_W605_CONFIRM_LIVE='1'
$env:EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD='1'
$env:EON_LOCAL_IMAGE_WORKFLOW_FILE='C:\path\to\exported-comfy-api-workflow.json'
node scripts/w605-live-ai-output-matrix.mjs --confirm-live --confirm-high-load
```

The script accepts loopback endpoints only, does not download models, does not store raw prompts or raw replies, does not copy generated media, and does not post anywhere. It writes a redacted receipt under `reports/w605-ai-output-matrix/`.

## Quality acceptance criteria

### Text
- Correctly explains local versus connected capability.
- Does not invent browsing, provider status, integrations, output completion or payment state.
- Refuses credentials and gives a safe routing instruction.
- Product answers match the W605 knowledge cards.

### Code
- No embedded secrets.
- Build/static check path supplied.
- Scope and file changes explainable.

### Image/video
- Loopback-only runtime and explicit high-load consent.
- Workflow accepted and saved-output metadata exists.
- Human evaluates prompt adherence, composition, artifacts, motion coherence and usable duration.
- No autogenerated “Ready to Post” or social publishing claim.

## W606–W610 sequence

- **W606 — cited research connector:** one explicit research action and receipt model.
- **W607 — connected-provider output evaluator:** opt-in, redacted API output evaluation with ownership/cost guard.
- **W608 — ComfyUI media adapter design and local proof:** connect only after W605 external evidence passes, with no automatic model installation.
- **W609 — Creator Studio authorized edit pipeline:** user-owned source import, transparent transform recipe, saved output validation and human review.
- **W610 — quality dashboard:** compare text/code/image/video results by model/device/workflow without uploading private raw outputs by default.

