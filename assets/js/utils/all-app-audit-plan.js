/**
 * all-app-audit-plan.js
 * Whole-app autonomous audit checklist for the post-RealmWorld sweep.
 */

export const ALL_APP_AUDIT_SCHEMA = 'eon.all-app-audit-plan.v1';

export function buildAllAppAuditPlan(options = {}) {
  return {
    schema: ALL_APP_AUDIT_SCHEMA,
    date: options.date || '2026-06-02',
    addedWave: 'Wave 13 — Whole-app autonomous audit and dead-surface cleanup',
    purpose: 'Inspect every remaining user-facing page, trust surface, payment surface, AI surface, and deploy gate after RealmWorld is complete.',
    pageGroups: {
      core: ['index.html', 'about.html', 'support.html', 'offline.html', '404.html'],
      aiWorkspace: ['chat.html', 'projects.html', 'workspace.html', 'vault.html', 'local-ai.html'],
      city: ['eoncity.html', 'eoncity-3d.html', 'eoncity-play.html', 'realm-studio.html'],
      referralBilling: ['billing.html', 'eon-keys.html', 'referral.html', 'rewards.html'],
      research: ['trade.html', 'market.html', 'automations.html'],
      policy: ['privacy.html', 'terms.html', 'legal.html', 'billing.html']
    },
    codeGroups: {
      payments: ['billing.html', 'assets/js/referrals/eon-keys-catalog.js', 'assets/js/referrals/eon-feature-unlock-resolver.js', 'assets/js/referrals/eon-locked-feature-surface.js'],
      identity: ['assets/js/utils/vault.js', 'assets/js/utils/profile.js', 'assets/js/utils/identity.js'],
      ai: ['assets/js/chat/ai-runtime.js', 'assets/js/chat/model-policy-router.js', 'assets/js/vault-api-page.js'],
      city: ['assets/js/eon-city-3d-station.js', 'assets/js/city/*.js', 'assets/css/eon-city.css'],
      pwa: ['sw.js', 'public/sw.js', 'manifest.webmanifest', '_headers', '_redirects']
    },
    auditChecks: [
      'No old game pages promoted over RealmWorld.',
      'No trust page contains ads or aggressive monetization.',
      'No page promises profit, resale value, guaranteed AI result, or guaranteed trading result.',
      'No admin-only action trusts editable localStorage role fields.',
      'No service worker caches admin/payment/API pages as stale navigation responses.',
      'No API key persistence is default without clear warning.',
      'No paid feature relies only on localStorage entitlement if it calls a server route.',
      'No Dodo checkout, trial, referral grant, EON Key redemption, coupon or entitlement activation is implied before server proof.',
      'All official EON City changes ship through bundled app update, not public mutable server state.',
      'All launch billing routes through Dodo only after product, webhook and entitlement-ledger proof; creator commerce stays disabled.'
    ],
    outputs: [
      'Blocker list',
      'Code patch list',
      'Focused tests run',
      'Manual QA checklist for Codex/local browser',
      'Final launch decision memo'
    ]
  };
}

export function flattenAuditPages(plan = buildAllAppAuditPlan()) {
  return Object.values(plan.pageGroups || {}).flat();
}

export function validateAllAppAuditPlan(plan = {}) {
  const problems = [];
  const pages = Object.values(plan.pageGroups || {}).flat();
  if (!pages.includes('eoncity-play.html')) problems.push('EON City Play must be included in whole-app audit.');
  if (!pages.includes('legal.html')) problems.push('Legal product-boundary page must be included in whole-app audit.');
  if (!pages.includes('privacy.html')) problems.push('Privacy page must be included in whole-app audit.');
  if (!plan.auditChecks?.some((item) => /localStorage entitlement/i.test(item))) problems.push('Plan must check localStorage entitlement trust.');
  if (!plan.auditChecks?.some((item) => /service worker/i.test(item))) problems.push('Plan must check service worker cache safety.');
  if (!plan.auditChecks?.some((item) => /profit|resale/i.test(item))) problems.push('Plan must check financial overclaiming.');
  return { ok: problems.length === 0, problems };
}
