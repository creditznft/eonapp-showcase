# W655 Lighthouse advisory timeout — 2026-07-14

The Lighthouse lane is advisory and does not authorize deployment. A hosted-runner checkout stalled indefinitely after the permanent predeploy lane had already passed. This change bounds the advisory job at five minutes so a runner/network stall cannot prevent the authoritative candidate workflow from reaching a terminal result. The permanent predeploy, immutable candidate, Preview verification, and production protections remain unchanged.
