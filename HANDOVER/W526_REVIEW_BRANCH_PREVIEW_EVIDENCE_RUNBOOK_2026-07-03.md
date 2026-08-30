# W526 — Review-Branch CI and Preview Evidence Runbook

## Purpose

Turn the local W525B–W535 source receipt into independently observable review-branch evidence without merging or deploying production.

## Preconditions

- The owner has reviewed the local source receipt and current product truth.
- The real repository receives only the validated source and contains no `.env*`, models, browser profiles, private traces, user data, `node_modules`, `dist`, or other local artifacts.
- No production deployment approval has been given.

## Operator sequence

1. Create a dedicated review branch from the intended source state.
2. Commit the source and handover evidence with an explicit W525B–W535 message.
3. Push **only that review branch**.
4. Capture the resulting commit SHA.
5. Record every GitHub Actions job name, conclusion, workflow URL and finish time.
6. Compare the CI job configuration/output with the local verification receipt. Investigate every mismatch before proceeding.
7. Only after CI is green and owner-approved, create/allow a non-production preview.
8. Record preview URL, revision, route/build result and any browser console errors without using personal account credentials.
9. Do not merge to production or deploy production in this wave.

## Required W526 receipt

- Review branch name and commit SHA.
- CI workflow/job table, each conclusion and direct evidence links.
- Dependency/install and build result.
- Route/smoke/verification result as configured in CI.
- Preview URL only if owner-approved.
- A statement that production remained unchanged.
- Open issues and the next proposed gate.

## Explicitly out of scope

- Google Drive OAuth, upload, restore, deletion or revocation.
- OAuth completion with a personal account.
- Physical-device/PWA certification.
- EON.HUB CID publication or Unstoppable wallet transaction.
- Payments, rewards, referrals, wallet/chain, social posting, P2P/relay, hardware, IPFS/Arweave runtime activation.
