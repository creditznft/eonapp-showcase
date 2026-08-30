# EONAPP W359–W374B continuation handover

## Start here

This is the complete runnable source snapshot through **W374B**. It supersedes
all earlier small delta snapshots as the source to use in a new ChatGPT/Codex
window.

```bash
npm ci
npm run qa:w359-eon-city-agent-director
npm run qa:w360-eon-city-portal-route
npm run qa:w361-city-mode-transition
npm run qa:w362-app-deck-action-taxonomy
npm run qa:w363-city-lite-art
npm run qa:w364a-google-data-custody
npm run qa:w364-babylon-immersive-controls
npm run qa:w365-city-asset-foundation
npm run qa:w366-neon-command-district
npm run qa:w367-spatial-command-space
npm run qa:w368-eonbot-city-work-loop
npm run qa:w369-adaptive-soundscape
npm run qa:w370-my-realm-visual-profile
npm run qa:w371-performance-lab
npm run qa:w372-visual-certification-readiness
npm run qa:w373-identity-account-operations
npm run qa:w374-google-oauth-pages-functions
npm run qa:w374b-google-identity-onboarding-surfaces
```

For production build verification after dependencies are installed:

```bash
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

## Completed source work

- W359–W372 EON City program: Portal, City Lite, Babylon controls, asset
  pipeline, Neon Command District, Three.js Command Space, EONBOT work loop,
  local soundscape controls, My Realm visual profile, performance lab and
  certification-readiness board.
- W362 App Deck: Workrooms, AI Crew, Connections and Blueprints.
- W364A data-custody disclosures for optional Google identity.
- W373 minimal D1 account/session boundary.
- W374 server-side Google OAuth Pages Functions using Authorization Code +
  PKCE, state, nonce, server-side token validation and opaque sessions.
- W374B onboarding/surface integration: Google Login is discoverable but never
  a guest-use gate; every relevant surface states that it is not a backup and
  routes account actions through Profile acknowledgement.

## Google Cloud status

Google OAuth has been set up by the operator in **Testing** mode with
identity-only scopes and the exact production callback. It is not public yet.
No OAuth client secret, Client ID, test-user address, or other credential is in
this source snapshot.

Cloudflare configuration remains an operator task. Use:

- `docs/CLOUDFLARE_AI_GOOGLE_IDENTITY_SETUP_PROMPT_2026-06-26.md`
- `docs/GOOGLE_IDENTITY_CLOUDFLARE_SETUP_PLAN_2026-06-26.md`
- `docs/GOOGLE_IDENTITY_OPERATOR_STATUS_2026-06-26.md`
- `docs/W374_GOOGLE_OAUTH_PAGES_FUNCTIONS_RUNBOOK_2026-06-26.md`

Keep `EON_AUTH_ROLLOUT=testing` until the required Preview/live evidence and
legal-page deployment are complete.

## Remaining work — do not misrepresent as completed

1. **C-00 production truth repair:** reconcile Cloudflare production with the
   current source; repair `/automations` redirect loop; verify direct routes,
   headers, deployment commit and generated `_redirects` in Preview then live.
2. **Google identity infra:** create separate D1 prod/Preview databases and
   bindings; set the Client ID manually and server secrets as Cloudflare
   Secrets; test only the approved OAuth test user; capture redacted proof.
3. **W372 external certification:** real desktop, integrated GPU, Android,
   iPhone/Safari, controller, reduced-motion, route, restore, memory and
   visual evidence. The source board is readiness only, not proof.
4. **Original art/media:** add approved original character/prop/architecture
   assets, animations, PBR textures, music stems and SFX through the W365
   provenance ledger. Current City art remains procedural fallback geometry.
5. **Automation A-02 to A-08:** scoped connection broker, local/cloud runner
   boundary, verified integrations, policy controls, retries/receipts, City
   handoff and limited read/draft beta. Do not claim it can automate anything
   today.
6. **Google Login public launch:** only after documentation deploy, test proof,
   security review and publishing the Google consent configuration.
7. **Payments:** PayU/Cashfree research/application/hosted checkout/webhook
   work only after production truth repair and account/entitlement evidence.

## Hard rules

- Guest use stays available.
- Google identity uses `openid email profile` only. Gmail, Drive, Calendar,
  Contacts, YouTube and any other Google service need separate future consent.
- Never store raw local workspace data in D1/Cloudflare identity records.
- Never commit `.env*`, OAuth secret, session/signing key, subject pepper,
  token, cookie, raw test evidence, browser storage dump or payment secret.
- No wallet, token, referral payout, rewards, marketplace, automatic publish,
  spend, delete, or admin action activation without a dedicated decision gate.
- Do not fabricate historic evidence to hide the inherited 17 legacy failures.
