# W281-A0 — AI provider lifecycle and compatibility operations

## Source baseline completed

- The hosted-provider registry, static contract review board and authenticated model-list rule are tied together in a finite lifecycle snapshot.
- Any provider change must update the registry, runtime, discovery logic, tests and evidence together. A URL-only patch is forbidden by the source contract.
- Source QA does not make provider network calls, read a key, or claim billing, quota, model availability, CORS, latency, inference or production monitoring.

## Required external evidence

1. Official provider/deprecation/terms review before each provider path, transport, model-list or adapter change.
2. User-owned non-production model-list verification after an approved change.
3. Release-owner disable/revert decision that preserves Guide Mode and local runtime behavior when a hosted provider change is rejected.

## Claim boundary

This is a source lifecycle baseline only. It does not certify any provider account or enable a provider. W260 remains NO-GO.
