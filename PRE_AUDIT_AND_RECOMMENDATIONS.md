# Pre-Audit and Recommendations

## Executive read

The app is much more coherent than the older EONAPP waves. The current product story is understandable:

- Chat and EONBOT are the front door
- Workspace is the operator surface
- EON City 2D is the flagship visual loop
- 3D is optional
- Market is local preview only
- commercial, rewards, and payout claims remain disabled

That said, the source still carries avoidable operational drag.

## Strengths

- One route contract governs canonical pages and retired aliases.
- Product truth is much more honest than the earlier reward/commerce-heavy state.
- Unit coverage is broad for the approved current-product surface.
- Browser proof now matches the merged UI contract and passes.
- Cloudflare Preview deploy is working on the current branch.

## Main criticisms

### 1. The repo still carries too much historical weight

There is a large amount of archived handoff, patch, and historical product material in-tree. It is helpful for forensic continuity, but it raises onboarding cost, noise, and accidental reactivation risk.

Recommendation:

- separate active docs from historical handoffs more aggressively
- keep one top-level current product map and one archived evidence area
- make it harder for old scripts to masquerade as current release gates

### 2. Some proof tooling was stale enough to become misleading

The legacy HTTP proof script and some Lighthouse fallbacks were still pointed at retired expectations or aliases. That is dangerous because it creates false red failures and wastes operator time.

Recommendation:

- retire or rewrite outdated proof scripts as soon as route/product truth changes
- mark legacy proof files clearly with `retired`, `historic`, or `not-release-authoritative`

### 3. CSP is serviceable, but broader than a least-privilege target

The active headers still allow a broad `https:` connect surface and keep Telegram-related allowances in multiple places. That may be intentional for compatibility, but it is wider than the current disabled-commercial, low-network story suggests.

Recommendation:

- reduce third-party script/frame/connect allowances to only the routes that truly need them
- review whether Telegram-related allowances should remain global or be isolated further

### 4. Deployment reproducibility is still partly environmental

The repo is runnable, but Cloudflare deployment still depends on local secret material outside the repo. That is normal, but it means the source snapshot alone is not a complete deploy appliance.

Recommendation:

- keep a clean `.env.example` or deploy-variable runbook
- document exact Pages project assumptions and branch naming

### 5. External proof is still the real launch gap

The remaining gap is no longer "build more features." The gap is real-world evidence: device screenshots, PWA update proof, rollback drill, Lighthouse/accessibility/CSP on deployed targets, and a true git-history secret scan.

Recommendation:

- treat release proof as an evidence program, not an afterthought
- do not expand feature scope until those proofs are done

## CEO recommendations

- Keep the product center of gravity on Chat, Workspace, 2D City, Vault, Local AI, and private Realm.
- Keep 3D optional, never the required path.
- Do not reactivate payments, rewards, payouts, ad incentives, or user commerce without server-backed evidence and policy review.
- Reduce legacy operational noise before another big feature wave.
- Make "current route / current truth / current proof" easier to discover in the repo within 60 seconds.
