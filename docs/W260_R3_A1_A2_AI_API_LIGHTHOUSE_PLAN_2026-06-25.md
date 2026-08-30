# W260-R3 A1/A2/A3 — AI API Change Control, Performance Rebaseline and Referral State Plan

## Purpose

External AI providers change URLs, versions, model IDs, quotas, terms, and key roles. EONAPP must treat those changes as a controlled compatibility process, not as an opportunity to claim that every provider is always available.

## Current scope

- **NVIDIA email:** the reviewed source uses `https://integrate.api.nvidia.com/v1`, the NVIDIA API Catalog/NIM inference surface. It does not contain the NGC management paths with `/teams/{team}` that NVIDIA retires on **2026-09-30**.
- **Hosted providers:** every active EONBOT cloud provider is BYOK. A saved key alone is never proof of readiness.
- **Model selection:** providers must be verified from the authenticated model list at user action time. Product code must not depend on a hard-coded “test model” staying available.
- **DeepSeek normalization:** active direct API paths use `https://api.deepseek.com` (no `/v1` prefix); legacy aliases are never fixed defaults.
- **Controlled migration candidates:** Qwen workspace/regional routing, xAI Responses adoption, Gemini Interactions/v1, and the Cerebras version patch require a separate verified migration decision, not an endpoint-only hot patch.
- **Referral/milestone state:** current source deliberately remains inactive and fail-closed; a local invite context is not a settled referral program.
- **Local runtimes:** remain device-local and require the separate local self-test.

## Permanent control loop

1. **Before every merge/deploy:** run `npm run qa:r3a1-ai-api-contracts`.
2. **Monthly and after any vendor deprecation email:** compare the provider’s official documentation, model API and key/role requirements with `config/ai-api-contracts.mjs`.
3. **When a provider changes:** do not hot-patch a URL alone. Update the registry, runtime, discovery path, tests, and release evidence together.
4. **Preview verification:** use a dedicated non-production BYOK key, user action, current model list, and a tiny non-sensitive test only after account/terms approval. Do not place that key, account ID, model list, or response body in Git or handover ZIPs.
5. **Production:** user action only; no background inference probe. On verification failure, show the provider as unavailable and guide the user to re-verify or choose another provider.
6. **Rollback:** a provider can be disabled from the registry/UI without removing local AI or Guide Mode. Existing encrypted key entries must remain untouched unless the user explicitly removes them.

## NVIDIA-specific decision

No runtime migration is required from this email alone because EONAPP uses the documented NIM/API Catalog inference base, not a deprecated team-scoped NGC API path. The W260-R3 A1 static gate blocks a future reintroduction of these paths. NVIDIA account roles and Personal/Service Key permissions remain an owner-side configuration check.

## Lighthouse program

1. `npm run build` materializes the deployment output.
2. The local Lighthouse server now emulates exact Cloudflare redirect entries from `_redirects`; `/` must redirect to `/chat` before Lighthouse follows it.
3. `npm run lighthouse:direct` is the fast core ten-route desktop run.
4. `npm run lighthouse:desktop` and `npm run lighthouse:mobile` are the broader local matrices. They may be slow, so Codex should run them with a normal browser-capable local environment and archive the JSON/HTML output.
5. A Lighthouse result is valid only when the local server returns the expected route/redirect and the JSON report exists. Browser policy, missing browser binaries, or server-only checks are **blocked evidence**, never a passing performance result.
6. Treat performance thresholds as release gates for the core route set. Full route/alias coverage is a regression scan; fix canonical page failures first, then aliases/redirects.
7. Run `npm run qa:r3a2-all-public-routes-static` after generating the inventory. It proves every public route and internal redirect resolves to local HTML; it is deliberately not a Lighthouse score.
8. Use W282 for score/budget remediation and retain raw browser reports outside Git/handovers.

## Referral / Cloudflare control (A3)

- `npm run qa:r3a3-referral-milestone-cloudflare` proves that the active source keeps rewards and access milestones disabled, avoids referral settlement requests, has no active referral Pages Function, deploys Pages `dist` only, and leaves the D1 migration deferred.
- It cannot inspect a Cloudflare dashboard, historical deployment, remote D1 table, binding, secret or owner role. No Cloudflare change is authorised by this source-only evidence.
- Any future activation belongs to W284 and requires explicit product, legal, privacy, security, abuse-control and Cloudflare Preview/rollback approvals.

## Current proof limits

A local build, static route check, and Lighthouse run cannot prove real-device behavior, Cloudflare edge behavior, logged-in provider compatibility, account quotas, or PWA update/rollback. W259/W260 remain NO-GO until their independent evidence lanes are completed.
