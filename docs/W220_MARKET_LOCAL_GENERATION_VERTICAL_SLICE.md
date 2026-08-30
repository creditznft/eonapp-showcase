# W220 — Market Local Generation Vertical Slice

## Purpose

Replace the false-looking prefilled Market with a truthful private creation flow. The Market must make it obvious when an item was generated, what it is, where it is stored, and what it is not.

## Final public contract

```text
Open /market
  -> empty private collection studio
  -> choose a theme + optional private direction
  -> click Generate 4 originals
  -> four local preview cards reveal progressively
  -> optional Save locally creates a browser-local Vault record
  -> reload returns to empty state with an explicit Resume local collection action
```

### Truth boundaries

| Surface | Current truth |
|---|---|
| Preview | Local visual reference generated on user action |
| Save | Browser-local Vault record with local fingerprint/origin |
| NFT / mint | Not active; preview is not an NFT |
| Listing / resale | Not active |
| User marketplace | Not active |
| Official checkout | Not active |
| Referral commission / payouts | Not active |
| Token / trading | Not active |

## Persistence and migration

- Active local collection: `eon:market:private-drop:v3`
- Earlier local collection: `eon:market:private-drop:v2`
- On load: V3 or V2 data is only detected as a resume candidate. It is not rendered.
- On **Resume local collection**:
  - existing V3 becomes visible;
  - V2 is copied into V3 with migration proof only after user action;
  - original V2 text is left unchanged.
- Saved local previews remain in the existing Vault-compatible collection records. No secret, wallet, payment, or public seller information is created.

## Operator commands

```bash
npm run qa:w220-market-generation
npm run qa:w131-market-trust-proof
npm run qa:w138-market-nft-generation-proof
npm run gpt55:market-nft-lootbox-visual-gate
npm run qa:w216-release-candidate

# Browser proof when Chromium is available:
npx playwright install chromium
npm run qa:w220-market-generation:browser
```

## Browser evidence requirement

The browser suite covers:

1. cold empty state;
2. explicit generate-four action and progressive reveal;
3. local Vault save;
4. reload without automatic render and explicit resume;
5. V2-to-V3 non-destructive migration;
6. official tab without checkout/listing/commission/payout/token/trading actions.

It is included but was not run here because this environment has no Playwright Chromium executable. A permitted CI/local run must produce the final screenshots/traces before deployment.

## Next phase boundary

Do not add official catalog, checkout, marketplace, rewards, affiliate payout, or token mechanics in the City phase. Phase 5 only makes EON City a truthful local 2D experience using persisted `CityWorldState` references, never raw Vault data or secret material.
