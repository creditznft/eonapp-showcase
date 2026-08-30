# A15 I20 Trust, Support and Incident Runbook

## Authority

- Public support entry: `/help#trust-support-case`
- Public status: `/status`
- Public operator/config projection: `GET /api/trust/config`
- Case creation: `POST /api/support/cases`
- Private case read: `GET /api/support/cases/:caseId` with `X-Eon-Case-Token`
- Operator case list/update: bearer-protected `/api/support/cases` and `/api/trust/cases/:caseId`
- Operator incident create/update: bearer-protected `/api/trust/incidents`
- D1 migration: `migrations/trust/0001_trust_support_incident_authority.sql`

## Required deployment bindings and secrets

- D1 binding: `EON_TRUST_DB`
- Secret: `EON_TRUST_OPERATOR_TOKEN` (minimum 32 characters; never exposed to the browser)
- Public operator variables: `EONAPP_OPERATOR_LEGAL_NAME`, `EONAPP_OPERATOR_TRADING_NAME`, `EONAPP_OPERATOR_ADDRESS`, `EONAPP_OPERATOR_COUNTRY`, `EONAPP_SUPPORT_CONTACT`, `EONAPP_PRIVACY_CONTACT`, `EONAPP_SECURITY_CONTACT`, `EONAPP_GOVERNING_LAW`, `EONAPP_LEGAL_VENUE`

Paid launch remains blocked until the public operator/controller record is complete and owner/counsel approved.

## Case workflow

1. `submitted` — immutable case ID and one-time user token issued.
2. `triaged` — assigned to the category owner role.
3. `awaiting_user` or `in_review` — public response contains only bounded instructions.
4. `resolved` — outcome recorded; no browser-local commercial authority is granted.
5. `closed` — final state.

Never request passwords, API keys, recovery material, full card data or private workspace content. Raw attachments are not accepted.

## Incident workflow

1. Create an incident with a public-safe title, summary, component, severity and owner role.
2. Move through `investigating`, `identified`, `monitoring`, `resolved`.
3. Update `/status` without private case details, prompts, keys or customer content.
4. Exercise rollback through the release authority; the incident service does not deploy or roll back code itself.
5. Preserve the release and incident receipts.

## Drill acceptance

- Private case can be created/read/updated with invalid-token rejection.
- Billing/privacy/security owner roles are deterministic.
- Public status reflects a simulated incident and resolution.
- Operator endpoints reject missing/incorrect bearer tokens.
- Missing operator identity causes a public fail-closed configuration state.
- No request-time DDL exists in Functions or runtime modules.
