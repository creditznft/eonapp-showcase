# W617B — Launch Master Plan and Codex/Cloudflare Contract

Date: 2026-07-10  
Baseline: W616D source plus W617A shell launch readiness changes present in the working tree.

## Decision

The next safe wave was not live billing. It was to lock the launch plan in code so Codex and Cloudflare deployment cannot accidentally revive old payment rails or activate browser-only rewards.

W617B makes the current source truth explicit:

- Dodo is the first subscription processor, but checkout/trial activation remains off.
- EON Keys are non-transferable app capability/cosmetic unlocks, not cash or AI credits.
- EONAPP does not sell platform-paid AI/image/video credits at launch; users use local AI or their own provider/API keys.
- Paid features require future Dodo checkout + signed webhook + server entitlement-ledger proof.
- Referral/EON Key grants require a future server ledger, idempotency and abuse-cap proof.
- Cloudflare deployment requires build hash, Pages deployment id, route smoke proof, cache proof and rollback proof.

## Files changed

### New W617B launch contract

- `assets/js/launch/eon-launch-master-plan.js`
  - Adds the source-of-truth launch master plan.
  - Defines completed waves W616B/W616C/W616D/W617A/W617B.
  - Defines next waves W617C/W617D/W617E/W617F.
  - Defines Cloudflare Pages setup requirements.
  - Defines Codex command order.
  - Defines paid/referral activation blockers.

- `assets/js/utils/deploy-proof-plan.js`
  - Adds Cloudflare deploy runbook helper.
  - Adds Dodo/referral proof plan helper.
  - Keeps all proof routes source-only and inactive.

- `scripts/w617b-launch-master-plan-gate.mjs`
  - Adds a 14-check W617B QA gate.

- `tests/unit/w617b-launch-master-plan.test.mjs`
  - Adds six unit tests covering launch truth, Cloudflare setup, Dodo blockers and final signoff logic.

### Updated active launch helpers

- `assets/js/utils/final-launch-signoff.js`
  - Replaced obsolete active payment proof wording with Dodo checkout/webhook/entitlement proof.
  - Adds referral/EON Key server-ledger proof blockers.

- `assets/js/utils/financial-risk-guardrails.js`
  - Aligns financial risk checklist with Dodo subscriptions and EON Keys.

- `assets/js/utils/all-app-audit-plan.js`
  - Adds billing/referral route audit scope.
  - Adds checks for Dodo/trial/referral/key-redemption activation boundaries.

- `assets/js/utils/ceo-master-certification.js`
  - Updates CEO hard stops to Dodo/server proof and referral ledger proof.

- `scripts/launch-ops-plan.mjs`
  - Generates `CodexDocs/EONAPP_W617B_DODO_CLOUDFLARE_LAUNCH_RUNBOOK_2026-07-10.md`.

- `scripts/codex-handoff-certification.mjs`
  - Generates `CodexDocs/EONAPP_W617B_CODEX_HANDOFF_CERTIFICATION_PACK_2026-07-10.md`.

### Launch gate fixes found while validating

- `index.html`
  - Added missing Twitter metadata.
  - Corrected `data-page-type="home"` for the canonical root.

- `chat.html`
  - Corrected canonical URL to `https://eonapp.ch/chat` for the page-invariants gate.

- `assets/js/utils/p2p-discovery.js`
  - Added a disabled compatibility stub so the identity-surface gate has a safe active file to inspect.

- `package.json`
  - Added:
    - `qa:w617b-launch-master-plan`
    - `launch:ops-plan`
    - `launch:all-app-plan`
    - `launch:codex-handoff`

- `tests/unit/ceo-master-certification.test.mjs`
  - Updated to expect Dodo/server proof hard stops.

## Validation passed

```bash
npm ci
npm run qa:w616b-eon-keys-referral
npm run qa:w616c-locked-feature-resolver
npm run qa:w616d-locked-feature-surfaces
npm run qa:w617a-shell-launch-readiness
npm run qa:w617b-launch-master-plan
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run launch:readiness
npm run launch:page-gate
npm run launch:identity-gate
npm run launch:quality-gate
npm run security:secret-scan
```

## Validation result

- `npm ci`: passed, 0 vulnerabilities.
- W616B regression: passed.
- W616C regression: passed.
- W616D regression: passed.
- W617A gate: 10/10 passed.
- W617B gate: 14/14 passed.
- W617B unit tests: 6/6 passed.
- Lint: passed with `--max-warnings=0`.
- Build: passed.
- Build output: 444 dist files.
- Distribution SHA-256: `91296f204cd7bf8e4856cd02b32826a03c11367c13336125ccdbaa56ad7757ed`.
- Smoke build: passed.
- Launch readiness: PASS, 0 blockers, 0 warnings.
- Launch page gate: 0 blockers, 0 warnings.
- Launch identity gate: 0 blockers, 0 warnings.
- Launch quality gate: PASS, 0 blockers, 0 warnings.
- Secret scan: PASS.

## Still not claimed

- No Cloudflare deployment was performed in this chat runtime.
- No live Dodo checkout was activated.
- No live trial activation was activated.
- No live EON Key redemption was activated.
- No referral grant ledger was activated.
- No server entitlement ledger was activated.
- No browser-only entitlement unlock was added.
- No authenticated EON City browser proof was captured here.
- No mobile device proof was captured here.
