# W554B synthetic City asset middleware — not the production art path

This directory is retained only as a testable fail-closed experiment for a
future protected asset route. No released EON City model, texture, audio,
image, project artifact or user-derived data may be placed behind this Pages
Function middleware.

W554C locks the City asset delivery rule:

- Browser downloads must request approved same-origin static paths directly.
- Pages Functions must not proxy or transform City binary response bodies.
- Google/EONAPP login remains the normal City boot gate.
- Before private binary art ships, configure and independently test an edge
  access policy for the static asset path. That policy validates access at the
  edge but lets the CDN serve the cached static body directly.

This file is architecture documentation only. It does not activate an asset
pack, identity provider, project portal, sync, telemetry, payment or storage.
