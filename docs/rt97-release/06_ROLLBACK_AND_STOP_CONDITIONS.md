# RT97 rollback and stop conditions

## Automatic protected-workflow rollback
The release workflow captures the last successful Production deployment before promotion. If Production was changed and any post-deploy proof fails, it calls the Cloudflare Pages rollback endpoint for that captured deployment.

## Manual stop before Production
Do not promote if:
- exact source CI is not green
- request commit/tree differs from source branch tip
- candidate digest/provenance differs between build and Preview
- actual Cloudflare Production Vexrail country list does not contain `IN`
- trust D1 schema is not v4 after ordered migration
- ordinary display is enabled on product/work surfaces
- rewarded verifier/signing/database authority is unavailable
- AdSense code gate fails
- secret scan detects a candidate secret

## Stop after Production
Rollback or disable the affected feature if:
- provenance/digest mismatch
- auth/billing/D1 critical route regression
- Vexrail leaks keys or violates country/privacy guard
- Local/BYOK silently routes to sponsored cloud
- ordinary ads appear on Chat/City/private work surfaces
- rewarded browser playback alone can issue value
- guide ads cover interactive controls or create material policy/usability failure
- City has a severe device crash/context-loss regression

External AdSense account approval or an ordinary no-fill condition does not require code rollback by itself; keep the serving configuration conservative and fix the external/account issue without inventing ad units.
