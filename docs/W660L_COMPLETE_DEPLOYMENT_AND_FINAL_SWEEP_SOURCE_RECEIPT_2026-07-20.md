# W660L complete deployment and final sweep — source receipt

W660L closes the deployment ambiguity discovered during the W660K Codex run. The immutable W641 candidate intentionally covers `dist/`, while Cloudflare Pages Functions must be present in a `functions/` directory where Wrangler is executed. W660L creates and verifies one self-contained deployment root containing both authorities without rebuilding or modifying the immutable static candidate.

## Source changes

- Added recursive Pages Function dependency discovery and exact same-source support-module staging.
- Added a complete bundle builder and standalone verifier.
- Added hard checks for session, City access, billing status and referrals Functions.
- Updated Preview and production workflows to stage and deploy from the same explicit complete Pages root.
- Fixed the maintained legacy Babylon runtime so semantic `forward` and `backward` touch commands map to its internal `up` and `down` movement set.
- Preserved one Babylon owner, one canvas, one render loop, review-first actions and the W660K visual/travel improvements.

## Deployment rule

Wrangler must be run from inside the generated `deploy-root/`. That directory contains `_routes.json`, the exact candidate static payload, `functions/`, and every relative module imported by those Functions. Deployment from the static `dist/` directory alone is rejected by the W660L handoff.
