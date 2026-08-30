/**
 * final-launch-signoff.js
 * CEO signoff decision helpers. W617B aligns the active launch checklist with
 * the current Dodo-first, EON-Keys, local/own-key AI plan.
 */

export const FINAL_SIGNOFF_SCHEMA = 'eon.final-launch-signoff.v2';

export function buildFinalLaunchChecklist(options = {}) {
  return {
    schema: FINAL_SIGNOFF_SCHEMA,
    date: options.date || '2026-07-10',
    launchMode: options.launchMode || 'soft-launch-candidate-after-codex-proof',
    requiredPasses: [
      'npm ci, focused W616/W617 QA, lint, build, smoke build and secret scan',
      'All primary app routes load: home, Projects, Library, Workspace, Local AI, Automations, Vault, EON Keys and EON City',
      'Sidebar/menu/drawer accessibility and mobile navigation proof',
      'Locked-feature cards show Subscribe, Trial, Refer for EON Keys and Use EON Key without activating checkout or redemption',
      'EON City guest/auth gate proof, authenticated Babylon renderer proof and mobile landscape proof',
      'Local AI and own-provider/API-key copy proof; no platform-paid AI credit claims',
      'Dodo checkout/webhook/entitlement proof if paid activation is enabled, otherwise paid CTAs remain disabled',
      'Referral/EON Key server-ledger proof if live grants are enabled, otherwise grants remain disabled',
      'Cloudflare Pages deploy proof with build hash, custom domain HTTPS, headers, redirects, cache and rollback proof',
      'Privacy, terms, billing and support copy review',
      'Accessibility smoke pass and mobile/browser visual proof',
      'CEO go / soft-launch / no-go note with paid activation explicitly on or off'
    ],
    acceptedSoftLaunchLimits: [
      'Dodo checkout, public trials and EON Key redemption can remain disabled during soft launch.',
      'Referral rewards are non-transferable EON Keys/capability/cosmetics only until server ledger proof exists.',
      'EONAPP does not sell platform-paid AI/image/video credits at launch; users use local AI or their own provider/API keys.',
      'EON City may remain beta/preview until authenticated renderer, controls and mobile proof are recorded.',
      'No browser-only entitlement unlock is acceptable for paid/server-side features.',
      'Creator commerce and marketplace purchase flows stay disabled unless separately reviewed and proven.'
    ],
    goCriteria: [
      'All hard blockers closed.',
      'Build, smoke, route, browser/mobile and Cloudflare deploy proof exists from Codex/local environment.',
      'Dodo and server entitlement proof exists or all paid activation remains disabled.',
      'Referral/EON Key grants have server-ledger proof or live grants remain disabled.',
      'Known risks are documented and accepted by CEO.'
    ]
  };
}

export function decideLaunchStatus(evidence = {}) {
  const blockers = [];
  const warnings = [];
  if (!evidence.buildPassed) blockers.push('Build proof missing.');
  if (!evidence.smokePassed) blockers.push('Smoke proof missing.');
  if (!evidence.secretScanPassed) blockers.push('Secret scan proof missing.');
  if (!evidence.cloudflareDeployProof) blockers.push('Cloudflare deploy proof missing.');
  if (evidence.enablePaidFeatures) {
    if (!evidence.dodoCheckoutProofPassed) blockers.push('Paid features requested but Dodo checkout proof missing.');
    if (!evidence.dodoWebhookProofPassed) blockers.push('Paid features requested but Dodo webhook proof missing.');
    if (!evidence.entitlementLedgerProofPassed) blockers.push('Paid features requested but server entitlement ledger proof missing.');
  }
  if (evidence.enableReferralGrants && !evidence.referralLedgerProofPassed) blockers.push('Referral grants requested but server referral/EON Key ledger proof missing.');
  if (!evidence.mobileQaPassed) warnings.push('Mobile QA proof missing; keep beta/soft-launch label.');
  if (!evidence.accessibilityPassed) warnings.push('Accessibility smoke proof missing.');
  if (!evidence.browserQaPassed) warnings.push('Browser QA proof missing.');
  if (!evidence.eonCityAuthenticatedProofPassed) warnings.push('Authenticated EON City proof missing; keep City beta label.');

  let decision = 'no-go';
  if (blockers.length === 0 && warnings.length === 0) decision = 'go';
  if (blockers.length === 0 && warnings.length > 0) decision = 'soft-launch';
  const paidProof = Boolean(evidence.dodoCheckoutProofPassed && evidence.dodoWebhookProofPassed && evidence.entitlementLedgerProofPassed);
  return {
    schema: 'eon.launch-decision.v2',
    decision,
    blockers,
    warnings,
    paidFeaturesAllowed: Boolean(evidence.enablePaidFeatures && paidProof),
    referralGrantsAllowed: Boolean(evidence.enableReferralGrants && evidence.referralLedgerProofPassed),
    note: decision === 'go'
      ? 'Launch criteria satisfied.'
      : decision === 'soft-launch'
        ? 'No hard blockers, but keep beta/soft-launch labels and finish warnings.'
        : 'Do not launch broadly until blockers are closed.'
  };
}
