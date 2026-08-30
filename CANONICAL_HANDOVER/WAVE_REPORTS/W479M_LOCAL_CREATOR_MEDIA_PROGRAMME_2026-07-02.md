# W479-M — Local Creator Media Programme: Image + Video, Truthful by Design

**Status:** planned after W476-B local-text browser proof; no local image/video adapter is connected today.  
**Audience:** creators and influencers who want private, fast, high-impact image and video workflows on capable personal devices.  
**Product promise:** EONAPP will make local creator media understandable and powerful without hiding required installs, storage, GPU limits, permissions, wait time, output ownership, or failures.

## Non-negotiable truth boundary

No screen may imply that a local image model, image-to-video workflow, text-to-video workflow, video enhancer, lip-sync pipeline, or media runtime is usable until its exact adapter has passed the dedicated runtime proof. A name in a roadmap, installation guide, discovery list, prompt library, or device recommendation is **not** executable capability.

Local mode never scans a LAN, starts a runtime, downloads a model, uploads media, sends a prompt to cloud, or falls back to a paid provider without a fresh, explicit user action and a visible destination choice.

## The creator journey: “Choose your device” before any model choice

The Local Creator Media entry starts with a plain-language device card, not technical jargon:

1. **Tell EONAPP your goal** — artwork, social post variations, image edit, product mockup, animated still, short image-to-video clip, cinematic video concept, enhancement, or a longer high-quality render.
2. **Choose your device** — Windows/NVIDIA, Windows/AMD, Apple Silicon, Intel/CPU-only, or “I do not know.” EONAPP explains what it can safely detect locally and what the user must confirm.
3. **Read the realistic capability level** — available GPU, VRAM, RAM, storage, browser capability, estimated download size, output duration/resolution, likely generation time range, and known limitations. The result is labelled Ready, Possible with limits, Needs setup, or Not suitable.
4. **Get an exact setup checklist** — which runtime to install, where it should be installed, how much storage to reserve, which model family/category to obtain, what first-run permissions to expect, and how to test it. No terminal-only instruction is the default path.
5. **Run a local-only connection test** — user presses Connect, sees the exact approved loopback destination, discovers only supported capabilities, selects a model/workflow, completes one tiny test, and gets a clear pass/failure explanation.
6. **Create with a visible local destination** — every generation screen labels the selected device, local runtime, model/workflow, estimated cost as ₹0 local compute, output folder/library, cancel button, queue state, and error recovery path.

## Capability levels

These are product capability classes, not promises of a specific model or vendor. Exact model choices remain discovery- and adapter-verified at release time.

| Level | Typical device fit | Creator outcome | Initial workflow envelope |
|---|---|---|---|
| **L0 — Planning & Prompt Lab** | Any modern browser | Prompt boards, shot lists, aspect-ratio plans, moodboards, project metadata | No local media execution; cloud/local destination must be chosen separately |
| **L1 — Light Visual Motion** | Entry GPU or capable Apple Silicon; constrained VRAM | Social still refinement, image variation, short motion-from-image tests | Low-resolution/short-duration image-to-video with strict memory guardrails; preview-first |
| **L2 — Creator Image Studio** | Mid-range dedicated GPU / adequate unified memory | Text-to-image, image-to-image, edits, inpaint/outpaint, brand variations, transparent assets | Queue, seed/version notes, reference images, local project folder, upscale as a separate opt-in job |
| **L3 — Motion Creator** | Strong GPU and substantial VRAM / memory | Reliable image-to-video, short text-led video concepts, camera motion, multiple passes | Duration, frames, resolution, batch count and temporal consistency are explicitly constrained by device proof |
| **L4 — Pro Video Lab** | High-VRAM desktop/workstation | Higher-resolution or longer video, multi-stage enhancement, interpolation/upscale, character/reference continuity | Isolated staged jobs with resumable checkpoints only after adapter supports them; large storage warnings |
| **L5 — Studio Pipeline** | Workstation/multi-GPU or approved local server under a separate policy | Advanced multi-shot sequences, quality passes, team handoff packages | Not browser-discovered by default; requires separately approved authenticated local-network or workstation bridge |

L1–L5 must never be inferred from a GPU name alone. EONAPP measures/asks for the evidence it is permitted to use, then confirms actual runtime capability with a user-triggered local test.

## Creator workflows to build, in order

### W479-M0 — media truth and device onboarding

- One shared capability vocabulary for **installed runtime**, **discovered model**, **compatible workflow**, **tested workflow**, and **available for this project**.
- A non-technical setup assistant with Windows-first steps, clear disk-space warnings, model location guidance, repair steps, and a “what changed on my device” receipt.
- Local-only privacy and storage explanation before every first connection.
- Device-fit labels and no unsupported promises on CPU-only, low-memory, or mobile devices.

### W479-M1 — local image adapter foundation

- Runtime-specific adapter contract, narrow loopback policy, capability discovery, model/workflow enumeration, one generation, cancellation, retries, errors, output retrieval, local project linking, and safe deletion/export semantics.
- Image workflows: text-to-image, image-to-image, masked edits, background/transparent asset flow, product/mockup variations, aspect-ratio variants, and optional separate upscale/enhance jobs.
- Every generation records only local project metadata by default; original media and generated media stay local unless a user explicitly exports or connects a remote provider.

### W479-M2 — light image-to-video “wow” lane

- Short image-to-video with motion presets, camera cues, subject-preservation guidance, aspect-ratio choices, duration/frame/resolution guardrails, preview render, full render, cancel/retry, and output size estimate.
- The UI makes quality tradeoffs visible: smoother motion vs. device time, clip length vs. VRAM, resolution vs. memory, and reference strength vs. creativity.
- A failed or unsupported workflow never silently turns into cloud generation.

### W479-M3 — advanced video lane

- Text-led video concepts, image-to-video, multi-reference consistency, frame extension, interpolation, local upscale, audio/lip-sync only where separately adapter-proven, and post-processing pipeline receipts.
- Jobs are staged: prepare → review settings → run local job → inspect output → keep/export/delete. No background surprise jobs.
- Local render cache controls, disk threshold checks, thermal/long-run warnings, queue controls, crash recovery policy, and clear “not enough device memory” recovery explanations.

### W479-M4 — Creator Library and publishing preparation

- A local-first media library for prompts, seeds/settings, source references, output lineage, format/aspect tags, safe export copies, and per-platform draft variants.
- Creator Studio may prepare captions, crop plans, thumbnails and campaign assets, but direct social upload remains a separately consented connector workflow.
- No output is public, tokenized, sold, shared, or posted just because it was generated locally.

## Adapter acceptance gate for every runtime

Before a runtime appears as selectable, the adapter needs all of the following:

1. User-triggered runtime connection, with an exact approved endpoint and no arbitrary LAN URL field.
2. Capability discovery that distinguishes image, video, edit, upscale, audio and unsupported capabilities.
3. Model/workflow selection based on discovered capability, not a guessed model name.
4. One real local test generation on a supported device class.
5. Browser CSP/CORS/PNA evidence, console review and failure-state evidence.
6. Cancellation, timeout, busy queue, out-of-memory, missing-model and disk-full handling.
7. Output storage, deletion and project linking proof with no unrequested upload.
8. No silent cloud fallback and no use of a remote endpoint under the “Local” label.
9. Physical device evidence for each supported tier and OS/browser combination.
10. A public truth card stating exactly what has passed, what is experimental, and what is unavailable.

## What is deliberately outside this programme until separately approved

- Background downloads or model installation without user confirmation.
- Unrestricted local-network/ComfyUI/server URL entry.
- Hidden remote inference routed through a “local” card.
- Automatic social posting, automatic monetization, wallet/NFT minting, reward issuance, or payment gating tied to local media generation.
- Claims about a model’s current quality, licensing, commercial rights, hardware requirement, or availability without a fresh provider/model review.

## Release sequence

| Order | Wave | Gate |
|---|---|---|
| 1 | W476-B | Prove Local AI text runtime CSP/CORS/browser behavior first; resolve the current legacy/local-origin inventory findings. |
| 2 | W477 | Retire or quarantine legacy external/local source paths and reduce broad network allowances. |
| 3 | W478 | Accessibility and physical-device proof for setup flows. |
| 4 | W479 | City/Realm playable proof, kept independent from media-runtime claims. |
| 5 | W479-M0 | Device-first Local Creator Media onboarding and capability truth layer. |
| 6 | W479-M1 | Verified local image adapter. |
| 7 | W479-M2 | Verified lightweight image-to-video lane. |
| 8 | W479-M3 | Verified advanced local video lane. |
| 9 | W479-M4 | Local Creator Library/export preparation. |
| 10 | W479.5 | Final non-payment certification, including the exact media adapters actually enabled. |
| 11 | W480 | Dodo only after every non-payment gate has genuine evidence. |
