# W349–W350 merchant readiness and billing boundary

## Status

This is a source-level readiness contract only. It does not activate payment,
pricing, processor accounts, test credentials, checkout, webhooks, receipts,
subscriptions, product delivery, referral discounts, wallet use, crypto, or
licences.

## Owner actions outside source code

1. Deploy the truthful static EONAPP site.
2. Review public product, privacy, terms, legal, support and billing pages.
3. Create processor test-mode account(s) and complete the actual merchant/KYB
   information in each provider dashboard.
4. Confirm the allowed merchant category for privacy-first SaaS memberships and
   official personal-use digital packs.
5. Choose one processor only after written approval, refund/cancellation policy,
   support owner, and W351 test-mode go decision.

## Future billing boundary

- Hosted processor checkout only.
- Browser never receives raw card data, live secrets, webhook secrets or a
  browser-only payment success flag.
- A future narrow verifier may hold only processor references, lifecycle state,
  product ID, signed licence ID, and support/reconciliation references.
- Chat, prompts, projects, assets, provider keys, Vault passphrases, wallet
  secrets, Local Relics and private Realm state remain outside billing scope.
