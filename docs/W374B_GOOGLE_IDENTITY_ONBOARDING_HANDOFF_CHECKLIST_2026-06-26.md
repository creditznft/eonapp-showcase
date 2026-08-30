# W374B handoff checklist — Google identity in onboarding and all relevant surfaces

## Source implementation now expected

- Chat has guest-first onboarding and Account & Backup / encrypted-backup links.
- App-shell surfaces expose Account & Backup without starting OAuth directly.
- App Deck exposes the same account/backup path.
- EON City Portal, City Lite, Spatial Command Space and Immersive Work Mode
  expose Account & Backup but preserve guest entry.
- My Realm Studio includes a local-data custody/backup explanation.
- Billing explains that optional account identity is not browser-data backup.
- Profile is the single OAuth initiation point and requires acknowledgement.
- OAuth callback return targets are allowlisted to EONAPP surfaces only.

## Fresh-machine verification

```bash
npm run qa:w374b-google-identity-onboarding-surfaces
npm run qa:w373-identity-account-operations
npm run qa:w374-google-oauth-pages-functions
```

After Preview deployment, manually verify each surface renders the account
entry point and that guest use remains possible. Do not capture tokens, cookie
values, database rows, OAuth codes, client secrets or browser-storage dumps.

## Release truth

Do not say Google Login is live until Cloudflare configuration, Preview proof,
logout/delete proof, production route repair, privacy/terms deploy and Google
consent publishing are complete.
