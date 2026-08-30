# W476-A4 — Aggregate Analytics & Release-Gate Source Work

## Implemented in this source package

- Added one shared aggregate-analytics bridge for the application shell, EON City and static site shell.
- Analytics remains disabled until the user has made a stored, explicit enablement choice.
- The bridge runs only on HTTPS production hostnames `eonapp.ch` and `www.eonapp.ch`.
- Route measurement is allowlisted to logical route IDs only. It never forwards raw URLs, query strings, fragments, page titles, chat text, file names, model names, account identifiers, OAuth values, Realm payloads, credentials or error strings.
- Google Signals/ad personalization remain disabled in the bridge configuration. No application `user_id` is assigned.
- Added a Profile measurement toggle and truthful Privacy disclosure.
- Excluded offline and campaign-admin surfaces from aggregate measurement.
- Repaired static CSP allowlists for the reviewed public informational pages that intentionally load the shared shell.
- Repaired release-scoped service-worker update identity checks, cache ownership tests and canonical redirect fixture line endings.

## Local evidence completed

- `npm run lint -- --max-warnings=0`
- `npm run test:unit` — 523 passing tests
- `npm run build`
- `npm run smoke:build`
- `npm run release:verify`

## Not claimed by this source wave

- GA DebugView / Tag Assistant or production network evidence.
- Consent/legal jurisdiction review.
- Production deployment, real user data survival, service-worker update or rollback proof.
- Physical-device certification.
- Local AI browser/CORS/CSP proof.

Those remain W476-B or later evidence work. No payment, wallet, token, NFT, reward or Dodo functionality was changed.
