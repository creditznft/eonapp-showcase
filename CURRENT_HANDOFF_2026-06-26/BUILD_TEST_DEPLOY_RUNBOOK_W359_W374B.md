# Build, test and safe deployment runbook — W359–W374B

## Prerequisites

- Node.js 22 (use `node --version` to verify)
- npm matching the lockfile
- No `.env.local` is supplied in this handover
- Do not add any credential to Git or the handover directory

## Install

```bash
npm ci
```

## Focused source verification

```bash
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

## Build and local smoke

```bash
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run dev
```

Do not treat local build success as mobile, controller, iPhone/Safari, live OAuth
or production evidence.

## Cloudflare identity setup

Use the provided Cloudflare setup prompt and Google runbooks. Add identity
configuration manually in the Cloudflare dashboard. No secret values appear in
this repository.

Keep Production at `EON_AUTH_ROLLOUT=testing`. Preview identity stays disabled
until its own exact Google OAuth Preview client exists.

## Deployment order

1. Deploy Preview.
2. Run no-credential route probes and core pages, including `/automations`.
3. Test Google Login only with the approved test account, using redacted proof.
4. Confirm logout and minimal cloud-account deletion, while verifying local
   work stays local.
5. Complete device/visual proof.
6. Only then decide whether to promote production.
