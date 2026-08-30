# AI/API change-control receipt

`qa:r3a1-ai-api-contracts` passed for 15 active hosted-provider contracts.

- NVIDIA API Catalog/NIM inference remains separated from the retired team-scoped NGC management path pattern.
- Hosted provider readiness requires user-initiated, authenticated model-list verification; a saved key/static model string is not a readiness claim.
- DeepSeek direct API paths use the current no-`/v1` base and old aliases are not fixed defaults.
- Qwen, xAI, Gemini and Cerebras changes are recorded as controlled migration candidates, not automatic runtime patches.
- Provider keys, account details, quotas, model lists and inference responses are outside this source evidence.

Monthly review is scheduled separately. Any vendor deprecation mail triggers an immediate A1 review before deployment.
