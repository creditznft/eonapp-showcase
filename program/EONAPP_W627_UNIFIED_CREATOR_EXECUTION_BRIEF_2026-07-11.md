# W627 Unified Creator Execution Brief

Date: 2026-07-11

## Frozen source result

W627A–W627G is source-complete. It consumes the W625 Local and W626 Direct BYOK contracts and does not create another media execution backend.

## User flow

1. Open `/create` and choose Image or Video.
2. Describe one goal in Beginner mode or deliberately reveal Advanced controls.
3. Choose Local, Direct BYOK or Guide.
4. Create a local draft. Draft creation sends no network request.
5. Continue to the established rail and project its authoritative events into the shared lifecycle.
6. Save to Creator Library only after completed output save/reopen SHA-256 evidence matches.
7. Explicitly attach a redacted asset reference to a Project, prepare a Forge or City handoff, create a version or export metadata.

## Persistence boundary

- `eon:creator-jobs:v1`: redacted lifecycle metadata, eligible for encrypted Capsule.
- `eon:creator-library:v1`: creator metadata/provenance, eligible for encrypted Capsule.
- `eonapp-creator-media-v1`: optional raw media in IndexedDB only after explicit save; excluded from the generic Capsule.
- Prompts enter Creator Library only after the user opts in. Credentials and secret-looking text are rejected.
- Restore is preview-first with add/same/conflict rows and explicit conflict choices.

## Certification truth

Source gates do not prove real image/video quality, physical-device usability, offline behavior or cross-route continuation. W627G remains NO-GO until every evidence row and the underlying W625/W626 real proofs pass.

## Permanent deployment command

```bash
npm ci
npm run verify:codex-predeploy
```
