# W244 initial emitted-output findings (resolved before final proof)

The first W244 built-output gate was intentionally run before the remediation was complete. It reported:

1. `/404.html` still linked directly to retired Local AI setup.
2. The signed-link runtime still allowlisted a retired onboarding destination.
3. Shared i18n/shell assets preserved old setup aliases in emitted JavaScript.
4. Vault wording included the phrase “saved key … ready,” although the intended meaning was the opposite.
5. Workspace/runtime-loader paths could still dynamically load the retired floating EONBOT widget.

All five findings were fixed before the final build. The final `07-w244-provider-local-ai-truth.log` is the authoritative passing evidence. This file records the earlier failure so the local-static pass is not represented as first-attempt proof.
