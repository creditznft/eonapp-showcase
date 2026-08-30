# W655 Preview v5 routing incident

Preview v5 uploaded the exact candidate static payload, release provenance, headers, redirects, and a compiled Pages Functions bundle, but the deployed `/api/*` paths returned HTML 404 responses. The cause was the Wrangler invocation context: the command ran from the checked-out source directory while publishing a separate temporary root, so the staged Pages project was not the command's working project for routing discovery.

The remediation keeps the candidate `dist/` unchanged, emits a source-controlled `dist/_routes.json`, stages the same-commit Functions tree at the Pages root, and runs Wrangler from that root with `pages deploy .`. The routing contract is tested locally with Wrangler Pages dev against the staged layout; representative identity, city, billing, and referral endpoints must return JSON 200 responses. Production remains blocked pending Preview certification and owner approval.
