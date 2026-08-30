# W605 — TurboQuant Decision

## Decision

**Do not add TurboQuant as a browser-side “make a 16 GB model run on 4 GB” feature.**

TurboQuant is relevant to compressed **vector/KV-cache** representations and retrieval workloads. It is not a complete model-weight runtime, a universal GPU-VRAM reducer, or a one-click way to run every image/video model on a 4 GB laptop GPU. EONAPP should track it as a future retrieval/vector-store optimization candidate, not as the solution to local video generation.

## Correct fit in EONAPP

- Future local knowledge/RAG vector cache for public EONAPP grounding content.
- Optional server-side/vector database compression where quality, recall and re-index evidence are measured.
- Never as a claim that it makes all local LLM or video models fit in low VRAM.

## Not a fit today

- Do not bolt research-paper code into the browser.
- Do not conflate system RAM with GPU VRAM.
- Do not promise local Wan/LTX quality video on 4 GB VRAM.
- Do not use compression to bypass output, thermal, storage, licensing or safety evidence.

## Better low-VRAM strategy now

1. Use a small local text model with a concise W605 grounding pack.
2. Use SD 1.5-class 512px image generation only as a manually verified baseline.
3. Make image-to-video an explicit micro-clip trial after image proof.
4. Route larger media jobs to higher-VRAM systems or an explicit user-chosen provider path.
5. Keep the same prompt, workflow, output-validation and human review record so quality can improve from evidence rather than guesses.
