# W655 Preview verification incident — 2026-07-14

The authoritative W655 candidate was uploaded successfully to Cloudflare Pages. The first Preview run selected a branch deployment before its provenance file was available and failed with HTTP 404. A second diagnostic run confirmed the immutable deployment and alias provenance, then exposed a workflow contract drift: the verifier expected `eon.city.access.w554.v1`, while the current candidate serves `eon.city.access.w649b.v1`.

This follow-up hardens deployment resolution by snapshotting existing deployment IDs, requiring exactly one newly-created successful Preview deployment, using aliases returned by the Cloudflare API, and polling immutable and alias URLs independently. It also updates the verifier to the maintained city-access schema. Production remains blocked.
