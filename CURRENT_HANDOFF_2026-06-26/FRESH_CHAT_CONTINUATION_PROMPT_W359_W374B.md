You are continuing EONAPP from the complete W359–W374B source snapshot.

Read these first:
1. `CURRENT_HANDOFF_2026-06-26/CHATGPT_W359_W374B_CONTINUATION.md`
2. `docs/EONAPP_UNIFIED_CITY_APPS_AUTOMATION_IDENTITY_COMMERCE_ROADMAP_2026-06-26.md`
3. `docs/EON_CITY_W364_W372_EXECUTION_LEDGER_2026-06-26.md`
4. `docs/W374B_GOOGLE_IDENTITY_ONBOARDING_SURFACES_2026-06-26.md`
5. `docs/GOOGLE_IDENTITY_OPERATOR_STATUS_2026-06-26.md`

Source status:
- W359–W372 source program is complete. External art/assets and real device/
  browser/prod certification are not complete.
- W373–W374 optional Google Login implementation exists in source but no
  Cloudflare D1 binding, secret, live OAuth flow, Preview deploy or production
  deploy has been performed in this working snapshot.
- W374B makes optional Google Login discoverable in Chat/onboarding, Apps,
  every app shell, City modes, My Realm, Billing and Profile. Every entry keeps
  guest use available and routes OAuth initiation through the Profile
  no-backup acknowledgement.
- The user's Google Cloud OAuth client is configured in Testing mode with only
  identity scopes. Do not request, invent or paste secrets. Keep rollout
  `testing` until proof is complete.

First work order:
1. Audit this snapshot, install dependencies with `npm ci`, and run the focused
   W359–W374B gates plus lint/build/site/launch checks.
2. Do not deploy until C-00 production truth repair has been planned and the
   source build is clean.
3. Then guide Cloudflare D1/binding/Secrets setup using the existing runbook.
4. Run Preview-only identity proof with the approved test user. Never capture
   secret/token/cookie/database/browser-storage evidence.
5. Repair the `/automations` production redirect issue through a Preview-first
   deploy and route probe before any payment work.
6. Continue remaining City proof and original asset work through the W365
   provenance pipeline.

Preserve local-first truth: Google Login is account access, not data backup.
Do not make cloud claims, auto-sync claims or execution claims that source and
proof cannot support.
