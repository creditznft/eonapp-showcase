# W605 changed files

## New

- `config/eon-ai-capability-and-grounding-contract.mjs`
- `config/eonapp-ai-knowledge-base.mjs`
- `config/eon-ai-output-test-matrix.mjs`
- `assets/js/ai-kernel/eon-ai-memory-ledger.js`
- `assets/js/chat/eonbot-knowledge-grounding.js`
- `assets/js/local-ai/eon-local-creator-media-profiles.js`
- `scripts/w605-ai-grounding-and-output-gate.mjs`
- `scripts/w605-live-ai-output-matrix.mjs`
- `tests/unit/w605-ai-grounding-and-output.test.mjs`
- `docs/ai/W605_AI_CAPABILITY_AND_OUTPUT_QUALITY_PROGRAMME.md`
- `docs/ai/W605_TURBOQUANT_DECISION.md`
- `docs/ai/W605_AI_GAP_AUDIT.md`

## Updated

- `assets/js/chat/eonbot-context-pack.js` — injects W605 runtime grounding into compatible text-model calls.
- `assets/js/local-ai/local-creator-media-setup.js` — exposes conservative VRAM-aware media profiles while retaining inactive-adapter truth.
- `assets/js/local-ai/local-ai-page.js` — adds explicit memory UI, VRAM-aware media plan, and manual redacted output-matrix commands.
- `package.json` — adds W605 deterministic and opt-in live matrix commands.

## Non-goals preserved

No model downloads, browser runtime installation, secret/env extraction, direct local-model internet access, automatic fine-tuning, automatic provider switching, media copying, social downloading, automatic edit or automatic posting are added by W605.
