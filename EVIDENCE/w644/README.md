# W644 EON City owner certification evidence

Production certification is intentionally **NOT-RUN** in source. Source tests cannot assign visual quality scores.

Run only against the exact immutable Preview candidate:

1. Sign in to EONAPP with Google manually in a normal Chrome/Edge profile.
2. Restart that same profile with a loopback-only DevTools port. Do not export cookies or storage state.
3. Set `EON_CITY_AUTH_BASE_URL`, `EON_CITY_CDP_ENDPOINT`, and `EON_CITY_EXPECTED_BUILD_PROVENANCE`.
4. Run `npm run evidence:w644-city-owner`.
5. Capture desktop 1440×900, mobile portrait 390×844, mobile landscape 844×390, reduced motion, refresh recovery, Command Room, EONBOT work path, console/network diagnostics and a screen recording.
6. Redact account identity, email, URLs with query strings, tokens, cookies and absolute paths.
7. The owner must score all eight categories. Overall must be at least 9.5/10 and no category below 9.0.

A screenshot label and SHA-256 row is evidence; a typed `PASS` is not. The visible release badge must match the candidate provenance. Any page error, console error, first-party HTTP error, unexplained request failure, access bypass or identity leak is NO-GO.
