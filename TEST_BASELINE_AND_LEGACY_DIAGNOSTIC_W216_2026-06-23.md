# Test Baseline and Legacy Diagnostic — W216

## Why two test lanes exist

The source contains both the current W180–W215 rebuild and older historical modules/tests. The project must not falsely call the full historical suite green when retired product assumptions still exist. The release path therefore uses two explicit lanes:

| Lane | Command | Purpose | Current result |
|---|---|---|---|
| Release-candidate | `npm run qa:w216-release-candidate` | Current W180–W216 product boundaries, source validity, build, static audit, PWA manifest, launch gates, production dependency audit. | Pass |
| Legacy diagnostic | `npm run test:unit` | Historical all-glob unit suite retained for migration cleanup planning. | 1247 pass / 109 fail / 1 skipped |

## What was not done

- No failing test was deleted to improve the release number.
- No broad test command was renamed to look green.
- No disabled monetization code was reactivated merely to satisfy historical tests.
- No Cloudflare/device/screenshot claim is inferred from source tests.

## Main legacy-failure families

The 109 historical failures are primarily associated with superseded or intentionally disabled areas:

1. old offerwall, reward, Pool Points, subscription, campaign, and provider-callback behavior;
2. legacy Marketplace/Exchange and commerce models retired in favor of the current Generate/Official boundary;
3. older RealmWorld / heavy 3D / NPC proof assumptions that conflict with the calm 2D-first W213 architecture;
4. legacy direct `.html` public route expectations now retired by Cloudflare redirects;
5. historical backend/integration contracts not present in the local source-only release path;
6. older copies of referral and public-sharing assumptions replaced by portable `eon2`/`eon3` signed links.

## Required future cleanup

Create a dedicated technical-debt wave before declaring the historical suite fully green:

1. classify every legacy test as **retain**, **rewrite for current product**, or **archive/remove with documented replacement**;
2. migrate any retained test to current canonical routes and disabled-monetization truth;
3. move non-routed compatibility modules behind an explicit legacy test directory;
4. ensure CI runs the release-candidate suite as required status, while the migration diagnostic remains visible but non-blocking until the cleanup wave is complete;
5. after migration, make a fresh full-suite baseline and require zero failures.

## Current release assertion

The final source is suitable for a **Cloudflare Preview evidence run**, not an unconditional production certification. Current targeted release gates passed; historical broad-suite cleanup remains an explicit post-W216 engineering task.
