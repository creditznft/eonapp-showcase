/** W623 — evidence-bounded CEO audit and launch decision. */
export const W623_CEO_AUDIT_SCHEMA = 'eonapp.w623.ceo-grand-audit.historical.v2';
export const W623_CEO_AUDIT_AS_OF = '2026-07-11';
export const W623_CEO_AUDIT_SNAPSHOT_KIND = 'historical-evidence-snapshot';

const freeze = Object.freeze;
const score = (id, label, value, state, evidence, blocker) => freeze({ id, label, value, state, evidence: freeze(evidence), blocker });

export const W623_CEO_SCORECARD = freeze([
  score('source-integrity', 'Source integrity and active certification', 92, 'strong-source-proof', ['verified handover SHA-256', 'clean dependency install', '753/753 active tests including W623 audit tests', 'release verifier/lint/build pass'], 'External browser/device proof and legacy test archaeology remain separate.'),
  score('local-text-ai', 'Local text AI', 88, 'product-proven-local-origin', ['Ollama scan/self-test/EONBOT proof', 'LM Studio scan/self-test/EONBOT proof', 'provider contract catalog reconciled'], 'Production-hosted loopback UX and current provider quality still need replay.'),
  score('local-image-ai', 'Local image AI', 58, 'source-integrated-proof-pending', ['allowlisted ComfyUI adapter', 'checkpoint discovery', 'bounded 512px workflow', 'job/history/output retrieval', 'nontechnical desktop UI'], 'No real Comfy server, checkpoint or saved image has passed on the owner device.'),
  score('local-video-ai', 'Local video AI', 20, 'historical-planned-disabled-at-2026-07-11', ['historical device-tier profiles', 'historical output matrix', 'superseded by later W625D-W625H source integration'], 'Historical blocker at 2026-07-11; do not use this row as current video capability truth.'),
  score('small-device-creator', 'Phone and weak-device Creator', 28, 'architecture-decided-not-built', ['compact UI blocks impossible desktop instructions', 'connected rail requirements frozen'], 'No metered connected execution backend or entitlement/quota proof.'),
  score('eon-city-functional', 'EON City functional system', 82, 'functional-proof-present', ['guest gate', 'authenticated Babylon boot', 'refresh recovery', 'Command Room and district contracts', 'four-action HUD'], 'Current evidence does not prove flagship visual quality or full device interaction.'),
  score('eon-city-visual', 'EON City visual/entertainment quality', 48, 'owner-approval-pending', ['existing screenshots reviewed', 'source art/performance gates exist'], 'Existing captures contain large dark/empty areas and do not persuasively prove a polished flagship experience.'),
  score('command-room', 'Command Room', 86, 'source-strong', ['semantic same-origin links', 'review-first action model', 'clear primary destinations'], 'Needs fresh authenticated visual and touch evidence.'),
  score('living-dashboard', 'Living Dashboard', 74, 'truthful-foundation', ['record-backed signals', 'no invented progress'], 'Limited real connected activity makes it useful but not yet convincingly live.'),
  score('agent-theatre', 'Agent Theatre', 56, 'honest-dormant-foundation', ['no fake agents or conversations', 'visibility/detail controls'], 'No real multi-agent execution fabric or sustained useful theatre loop.'),
  score('shell-navigation', 'Shell, sidebar and route hierarchy', 88, 'source-strong', ['Tools naming cleanup', 'Vault restored to hierarchy', 'consistent route highlighting', 'four-action City simplification'], 'Needs full route-by-route current visual/accessibility replay.'),
  score('sharing-referrals', 'Share Center and referrals', 72, 'source-integrated-proof-pending', ['tamper-evident signed links', 'private data boundaries', 'locked feature surfaces'], 'Real referral attribution, retention and reward grant lifecycle is unproven.'),
  score('billing', 'Billing and entitlement', 82, 'limited-preview-proof', ['four live checkout tiers', 'seven-day trial', 'signed synthetic webhook', 'D1 ledger write'], 'No real Dodo-origin customer lifecycle, cancellation/refund/expiry proof.'),
  score('persistence', 'Persistence and recovery', 87, 'source-proven-replay-required', ['protected local-key survival tests', 'portable-state boundary', 'explicit restore scope'], 'Generated Creator media is not yet saved durably to Library and Drive replay is pending.'),
  score('security-privacy', 'Security, privacy and consent', 89, 'strong-source-boundaries', ['loopback allowlist', 'CSP generation', 'BYOK/session-key boundaries', 'client-only research', 'no hidden media fallback'], 'Connected Creator requires a new explicit cloud-data and cost-consent review.'),
  score('mobile-accessibility', 'Mobile and accessibility', 72, 'source-covered-device-refresh-required', ['compact fallbacks', 'reduced-motion and input contracts', 'mobile City distinctions'], 'No current owner-device matrix for this exact source.'),
  score('overall-launch', 'Overall launch readiness', 68, 'limited-preview-only', ['core source builds', 'active certification green', 'billing/City/text partial external proof'], 'Full launch remains NO-GO until Creator, City visual/device, real billing and trust/device evidence close.')
]);

export const W623_CEO_DECISIONS = freeze([
  'Use one Creator UX with two clearly labelled rails: proof-gated local ComfyUI on capable desktops and a future metered connected rail on compact devices.',
  'Ship and prove one conservative image path before building video.',
  'Keep direct City HUD to Command Room, EONBOT, Districts and Menu.',
  'Treat City as a useful command world first; remove or demote decorative surfaces with no real workflow.',
  'Keep full launch NO-GO; limited preview is the maximum honest release state.',
  'Do not call a synthetic webhook, source test or mocked model response customer proof.'
]);

export const W623_LAUNCH_WAVES = freeze([
  freeze({ id: 'W623B', title: 'Real local image closure', outcome: 'One real ComfyUI image generated, returned, saved and evidenced on the owner Windows device.' }),
  freeze({ id: 'W624', title: 'City flagship reality pass', outcome: 'Fresh desktop/mobile visual, interaction, performance and recovery approval.' }),
  freeze({ id: 'W625', title: 'AI simplification and quality', outcome: 'Simple Private/Connected/Guide choice plus current model-list and output-quality receipts.' }),
  freeze({ id: 'W626', title: 'Connected Creator and video foundation', outcome: 'Metered, entitled, quota-controlled connected image rail; video remains behind separate proof.' }),
  freeze({ id: 'W627', title: 'Creator Library and persistence', outcome: 'Durable save/delete/export/provenance plus backup/restore and consent replay.' }),
  freeze({ id: 'W628', title: 'Real billing lifecycle', outcome: 'One owner-controlled Dodo-origin checkout-to-cancel/refund/expiry lifecycle.' }),
  freeze({ id: 'W629', title: 'Share and referral lifecycle', outcome: 'Real referral attribution, retention, grant, cap and reversal evidence.' }),
  freeze({ id: 'W630', title: 'Whole-app certification', outcome: 'Route/device/accessibility/trust/security board and explicit owner GO/NO-GO.' })
]);

export const W623_CEO_AUDIT = freeze({
  schema: W623_CEO_AUDIT_SCHEMA,
  asOf: W623_CEO_AUDIT_AS_OF,
  snapshotKind: W623_CEO_AUDIT_SNAPSHOT_KIND,
  verdict: 'NO_GO_FULL_LAUNCH_LIMITED_PREVIEW_ONLY',
  scoreMeaning: 'Scores are an evidence-bounded CEO assessment, not automated performance measurements or external certification.',
  scores: W623_CEO_SCORECARD,
  decisions: W623_CEO_DECISIONS,
  waves: W623_LAUNCH_WAVES,
  truth: freeze({
    localTextProductProvenOnLocalOrigin: true,
    localImageSourceIntegrated: true,
    localImageRealDeviceOutputProven: false,
    localVideoSourceIntegratedAtSnapshot: false,
    localVideoCurrentTruthMustComeFromInstitutionalAuthority: true,
    localVideoOutputProven: false,
    connectedCreatorBuilt: false,
    cityAuthenticatedBootProven: true,
    cityFlagshipVisualApproved: false,
    billingSyntheticWebhookProven: true,
    billingRealCustomerLifecycleProven: false,
    fullLaunchApproved: false
  })
});

export function getW623Score(id = '') {
  return W623_CEO_SCORECARD.find((row) => row.id === String(id || '')) || null;
}

export function validateW623CeoAudit(audit = W623_CEO_AUDIT) {
  const issues = [];
  if (audit?.schema !== W623_CEO_AUDIT_SCHEMA) issues.push('schema-invalid');
  if (audit?.verdict !== 'NO_GO_FULL_LAUNCH_LIMITED_PREVIEW_ONLY') issues.push('launch-verdict-must-remain-limited-preview');
  if (!Array.isArray(audit?.scores) || audit.scores.length < 15) issues.push('scorecard-incomplete');
  if (audit?.truth?.localImageSourceIntegrated !== true || audit?.truth?.localImageRealDeviceOutputProven !== false) issues.push('local-image-proof-boundary-invalid');
  if (audit?.truth?.localVideoOutputProven !== false || audit?.truth?.connectedCreatorBuilt !== false) issues.push('video-or-connected-rail-overclaim');
  if (audit?.truth?.cityAuthenticatedBootProven !== true || audit?.truth?.cityFlagshipVisualApproved !== false) issues.push('city-proof-boundary-invalid');
  if (audit?.truth?.billingSyntheticWebhookProven !== true || audit?.truth?.billingRealCustomerLifecycleProven !== false) issues.push('billing-proof-boundary-invalid');
  if (audit?.truth?.fullLaunchApproved !== false) issues.push('full-launch-overclaim');
  if (getW623Score('overall-launch')?.value > 69) issues.push('overall-launch-score-too-high-for-open-blockers');
  return freeze(issues);
}
