# RT97 Cloudflare Production authority

Project: `eonapp-ch`  
Production origin: `https://eonapp.ch`

## Vexrail — India is mandatory
Before triggering Production, inspect the **actual Cloudflare Pages Production environment values**, not only `wrangler.jsonc`.

Required non-secret values:
```text
EON_ENVIRONMENT=production
EON_VEXRAIL_ROLLOUT=production
EON_VEXRAIL_GEO_MODE=selected_countries
EON_VEXRAIL_COUNTRIES=US,CA,GB,DE,IN
EON_VEXRAIL_REQUIRE_CF_METADATA=true
EON_VEXRAIL_TURNSTILE_MODE=required
EON_VEXRAIL_PAID_SPONSORED_OPT_IN=true
EON_VEXRAIL_PROFIT_GOVERNOR_MODE=enforce
```

**If `IN` is absent in the live Cloudflare Production setting, add it before release.** Preserve the selected-country model; do not change geo mode to `all` as a shortcut. Do not print Vexrail secret values while checking settings.

The RT97 protected workflow reads the Cloudflare Pages project configuration and blocks before deployment unless actual Production `EON_VEXRAIL_COUNTRIES` contains `IN` and the geo/metadata/Turnstile values remain hardened.

## Ordinary ads / rewarded authority
Required Production values:
```text
EON_MONETIZATION_ROLLOUT=production
EON_MONETIZATION_ENABLED=true
EON_DISPLAY_ADS_ENABLED=false
EON_EXOCLICK_ENABLED=false
EON_EXOCLICK_NATIVE_ENABLED=false
EON_EXOCLICK_MULTIFORMAT_ENABLED=false
EON_EXOCLICK_OUTSTREAM_ENABLED=false
EON_SPONSOR_VIDEO_ENABLED=true
EON_REWARDED_ADS_ENABLED=true
EON_REWARDED_PROVIDER=exoclick
EON_REWARDED_PROVIDER_VERIFIED=true
```

This is intentional: ordinary ExoClick display is disabled, while the voluntary Sponsor Video/rewarded path remains separately configured and server-authoritative.

## Secret/binding presence
The workflow checks names without printing secret values. At minimum preserve all existing Vexrail credentials/economics, Turnstile secret, reward signing key, trust rate-limit salt, Dodo product/billing secrets, identity bindings and all four D1 bindings.

## D1 migration authority
RT97 requires trust schema **v4**. The protected workflow applies ordered, unapplied migrations via Wrangler and then proves:
- identity schema v6
- billing schema v2
- premium billing schema v1
- referrals schema v5
- trust schema v4

Do not manually run request-time DDL. Do not rewrite already-applied migration files.

## Rollback
The workflow captures the last successful Production Pages deployment ID before promotion. If any post-deploy proof fails after Production changes, the workflow requests rollback to that captured deployment automatically.
