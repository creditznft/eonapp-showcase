/**
 * W623 — source-controlled master launch programme ledger.
 *
 * This is a planning and acceptance register, not release proof. It records
 * the strongest current evidence boundary for every launch-critical track so
 * later coding waves cannot accidentally turn partial proof into a claim.
 */
export const EON_MASTER_PROGRAMME_SCHEMA = 'eonapp.institutional.master-launch-ledger.v6';
export const EON_MASTER_PROGRAMME_AS_OF = '2026-08-09';

const track = (id, title, status, objective, nextWave, acceptance) => Object.freeze({
  id, title, status, objective, nextWave, acceptance: Object.freeze(acceptance)
});

export const EON_MASTER_LAUNCH_TRACKS = Object.freeze([
  track('source-and-evidence', 'Source integrity and production evidence', 'source-certified-through-w639-external-proof-pending', 'Maintain reproducible builds, secret-safe evidence, current gates and real browser/device proof.', 'W640 owner evidence board and final decision', [
    'Uploaded source and evidence packages retain verified SHA-256 checksums and a rebuildable source boundary.',
    'The active source suite, release verifier, lint and production build pass from a clean dependency install.',
    'Legacy/wildcard test debris is labelled archival and must not be represented as the active certification suite.',
    'No package includes env files, provider keys, browser state, private prompts, generated customer media or node_modules.'
  ]),
  track('eon-city', 'EON City · useful command world', 'functional-proof-present-visual-approval-pending', 'Make City productive and entertaining through a clear command loop, useful districts, readable recovery and evidence-backed interaction.', 'W624 flagship visual and real-device recapture', [
    'Guest access remains gated while a human authenticated session can boot the real Babylon City.',
    'The direct HUD stays limited to Command Room, EONBOT, Districts and Menu; secondary actions live inside those surfaces.',
    'Navigation is semantic, same-origin and review-first; no City button silently executes external work.',
    'Desktop/mobile visual quality, landmark readability, controls, recovery and return loops require fresh human-approved captures.'
  ]),
  track('ai-grounding-memory-research', 'AI grounding, memory and client-only research', 'local-text-proven-contracts-current', 'Give compatible models truthful product context, explicit local memory and cited research without hidden training or invented browsing.', 'W625 AI quality and provider refresh', [
    'Ollama and LM Studio local-origin scan, self-test and EONBOT selection have real output proof.',
    'Hosted provider contracts are source-checked against the active runtime catalog; live account/model readiness remains user-action proof.',
    'Research uses explicit client-captured sources, citations and capture time; no EONAPP research relay is implied.',
    'No key, model response, private prompt or memory card becomes training data automatically.'
  ]),
  track('creator-media', 'Creator image and video', 'w638-indexed-real-output-not-run', 'Offer one simple Creator experience that selects a proven local rail on capable desktops and a transparent metered connected rail on small devices.', 'W640 owner/device/provider evidence board', [
    'The ComfyUI image adapter is loopback-allowlisted, explicit-action only, bounded to one conservative image workflow and disabled until checkpoint discovery.',
    'A real saved local image, CORS/PNA behavior, error recovery and on-device evidence are required before product-proven status.',
    'Local video is source-integrated with a separate workflow, hardware gating and progress/cancel controls; product-proven status still requires a real saved, reopened and playable output receipt on accepted hardware.',
    'Small-device media may use an EON-managed connected rail only with clear cloud disclosure, entitlement, quota, cost, safety and abuse controls; it is never disguised as local.'
  ]),
  track('persistence-and-recovery', 'Update-safe persistence and recovery', 'w637-source-complete-real-browser-drive-proof-pending', 'Keep user-owned local data safe across releases, migrations, export and restore.', 'W640 owner/device/Drive recovery evidence board', [
    'Protected local records survive simulated application updates and migrations.',
    'Backup/export and restore remain explicit, scoped and secret-safe.',
    'Generated creator outputs need a deliberate Library save contract; temporary object URLs are not durable storage.',
    'Google Drive sync remains separately consented and must be re-proved before launch claims.'
  ]),
  track('identity-and-privacy', 'Identity, privacy and consent', 'w636-source-hardened-external-proof-pending', 'Keep identity scope, local storage, cloud execution disclosure and revocation truthful.', 'W640 hostile-traffic, WAF and revocation evidence board', [
    'Google login remains identity-only unless a separately consented storage feature is used.',
    'Local runtimes are contacted only after explicit user action and only on allowlisted loopback endpoints.',
    'Connected creator requests disclose that prompt/output data leaves the device before execution.',
    'Permissions, provider keys, local status records and account deletion have understandable revocation paths.'
  ]),
  track('payments-and-subscriptions', 'Payments, subscriptions and entitlements', 'w638-indexed-not-run-real-customer-proof-pending', 'Use the proven Dodo/Cloudflare path without calling synthetic evidence a completed customer transaction.', 'W640 real Dodo customer lifecycle evidence board', [
    'Live checkout routes return real sessions for the four paid tiers with the configured seven-day trial.',
    'A signed production-safe synthetic webhook and D1 ledger write are proven; one real Dodo-origin customer lifecycle is still mandatory.',
    'Cancellation, refund, tax, support, entitlement expiry and failed-renewal behavior must match public copy.',
    'AI/City upsells require explicit confirmation and must not degrade the useful free core deceptively.'
  ]),
  track('sharing-and-referrals', 'Share Center, invitations and referral rewards', 'w638-indexed-not-run-real-referral-proof-pending', 'Keep public sharing safe and make referral rewards auditable rather than cosmetic.', 'W640 distinct-account referral lifecycle evidence board', [
    'Signed compact public links remain self-contained, bounded and tamper-evident.',
    'Private chats, Vault data and local creator media are never included automatically.',
    'Referral discount/grant wording matches the server ledger and retention/refund conditions.',
    'One real retained referral lifecycle is required before rewards are marketed as operational.'
  ]),
  track('trust-legal-support', 'Trust, legal and support', 'w639-source-rehearsal-complete-incident-proof-not-run', 'Make public claims, policies, safety and support routing match the current product.', 'W640 support, incident and rollback owner board', [
    'Privacy, terms, billing/refund, AI/cloud disclosure, accessibility and support routes are current and readable.',
    'No unproven media, City, payment, referral, telemetry or sync claim remains.',
    'Support escalation, deletion requests, payment disputes and incident recovery are exercised.'
  ]),
  track('mobile-accessibility', 'Mobile, accessibility and device quality', 'source-covered-real-device-refresh-required', 'Keep the useful core accessible on touch, keyboard, reduced motion and realistic hardware.', 'W624/W630 device matrix', [
    'City Lite, Chat, Local AI guidance and Creator rail selection remain usable on compact screens.',
    'Keyboard, touch, controller, focus, captions, reduced motion and orientation behavior have current device evidence.',
    'Small devices are routed to a safe connected creator option rather than an impossible local install promise.',
    'Performance, thermal/battery boundaries and recovery are measured instead of asserted.'
  ]),
  track('release-decision', 'Release decision and owner approval', 'no-go-full-launch-source-certified-through-w639', 'Produce one current GO/NO-GO record across all tracks.', 'W640 final board after owner/provider/device/payment evidence', [
    'Every mandatory track has current evidence, an explicit limitation or a recorded NO-GO.',
    'No source pass, canvas boot, synthetic webhook or mocked provider response is represented as customer proof.',
    'Owner signs off on City visual quality, creator outputs, privacy, commercial truth and device experience.'
  ])
]);

export function getEonMasterLaunchTrack(id = '') {
  return EON_MASTER_LAUNCH_TRACKS.find((item) => item.id === String(id || '')) || null;
}

export function validateEonMasterProgrammeLedger(tracks = EON_MASTER_LAUNCH_TRACKS) {
  const issues = [];
  const list = Array.isArray(tracks) ? tracks : [];
  const ids = new Set(list.map((item) => item?.id));
  for (const required of ['source-and-evidence', 'eon-city', 'ai-grounding-memory-research', 'creator-media', 'persistence-and-recovery', 'identity-and-privacy', 'payments-and-subscriptions', 'sharing-and-referrals', 'trust-legal-support', 'mobile-accessibility', 'release-decision']) {
    if (!ids.has(required)) issues.push(`missing-track:${required}`);
  }
  const byId = (id) => list.find((item) => item?.id === id) || null;
  const ai = byId('ai-grounding-memory-research');
  if (!ai?.acceptance?.some((item) => /no EONAPP research relay/i.test(item))) issues.push('client-only-research-acceptance-missing');
  const creator = byId('creator-media');
  if (creator?.status !== 'w638-indexed-real-output-not-run') issues.push('creator-media-proof-boundary-invalid');
  if (!creator?.acceptance?.some((item) => /never disguised as local/i.test(item))) issues.push('connected-media-disclosure-missing');
  const payments = byId('payments-and-subscriptions');
  if (payments?.status !== 'w638-indexed-not-run-real-customer-proof-pending') issues.push('payments-proof-boundary-invalid');
  const release = byId('release-decision');
  if (!String(release?.status || '').startsWith('no-go-full-launch')) issues.push('full-launch-must-remain-no-go');
  return Object.freeze(issues);
}
