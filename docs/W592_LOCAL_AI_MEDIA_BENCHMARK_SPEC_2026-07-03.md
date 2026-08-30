# W592 — Local AI and Media Benchmark Specification

## What this benchmark proves

- An explicitly configured, loopback-only Ollama runtime can list models and complete a minimal token-return text probe.
- The actual machine can report coarse CPU/RAM and NVIDIA free-VRAM capability without serial numbers or hidden telemetry.
- An explicitly configured local ComfyUI workflow can be accepted and complete, when the operator knowingly enables a high-load image or video run.

## What it never proves

- EONAPP/EON City has a working local image/video adapter.
- City’s workload governor controls an external Ollama or ComfyUI process.
- Generated media is suitable, licensed, safe to publish, connected to a social account or ready for a user-facing workflow.
- A machine configuration inferred from a model name or prior conversation is sufficient for image/video execution.

## Safety model

- Text benchmark requires `EON_LOCAL_AI_BENCHMARK=1` plus `--confirm-local`.
- Endpoint must be `localhost`, `127.0.0.1` or `::1`.
- No model download, pull, install, deletion, configuration mutation or remote endpoint is permitted.
- Prompt text, raw responses, workflow JSON, generated files and workflow file paths are not persisted in the W592 receipt.
- Image and video each require their own opt-in plus `EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD=1`.
- Image blocks below 3.5 GB free VRAM; video blocks below 7.5 GB free VRAM.
- Default model limit is one and hard maximum is two.

## Receipt interpretation

| Status | Meaning |
|---|---|
| PASS | The exact requested local lane completed under its declared limits. |
| BLOCKED | A safety/availability precondition was absent. This is an expected honest outcome. |
| SKIP | The lane was not explicitly requested. |
| WARN | A media workflow started but completion was not observed before timeout. |
| FAIL | A requested lane reached the configured endpoint but did not satisfy the token/complete result. |

A `PASS` in this benchmark is **host-runtime evidence only**. The application remains adapter-not-proven until a separately implemented local adapter passes connection, cancellation, output, privacy, CSP/CORS/PNA, workload and device evidence.
