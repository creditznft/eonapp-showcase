/**
 * RT91 — privacy-safe adapter from existing native EONAPP proof authorities to
 * My Frontier productive mission receipt classes.
 *
 * Read-only. It never fabricates a native outcome, awards XP, reads work
 * content, or writes any legacy product/progression authority.
 */
import { listEonCoreOutcomes } from '../../contracts/outcomes/eon-core-outcome-authority.js';
import { readEonCityW659gProgression } from '../../contracts/city/w659g/eon-city-w659g-progression-ledger.js';

const freeze = Object.freeze;
const safe = (value = '') => String(value || '').trim().toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 220);

export const EON_CITY_RT91_PRODUCTIVE_RECEIPT_ADAPTER_SCHEMA = 'eon.city.productive-receipt-adapter.rt91.v1';

const CORE_POLICIES = freeze({
  'command-status-reviewed': freeze(['command-status-reviewed']),
  'creator-output-reviewed': freeze(['creator-guide-artifact', 'creator-image-verified', 'creator-video-verified', 'creator-music-exported', 'creator-radio-station', 'forge-source-applied']),
  'project-continuity-reviewed': freeze(['project-shell', 'project-resume']),
  'knowledge-evidence-reused': freeze(['library-item-reused', 'backup-readiness-receipt', 'recovery-restore-receipt']),
  'local-ai-ready-verified': freeze(['local-ai-self-test', 'byok-provider-verification']),
  'automation-reviewed': freeze(['automation-proposal']),
  'creator-capture-reviewed': freeze(['creator-capture-saved']),
  'share-reviewed': freeze(['reviewed-signed-handoff'])
});

const VERIFIED_ACTION_POLICIES = freeze({
  'agent-handoff-reviewed': 'city.agent-receipt.reviewed',
  'eonbot-guidance-reviewed': 'eonbot.real-reply'
});

// Backward-compatible aliases for pre-Phase-G RT91 mission snapshots/source
// names. They resolve to the same truthful native authority, not a new proof.
const ALIASES = freeze({
  'project-milestone-reviewed': 'project-continuity-reviewed',
  'expedition-plan-reviewed': 'project-continuity-reviewed',
  'research-evidence-reviewed': 'knowledge-evidence-reused'
});

const GUIDANCE = freeze({
  'command-status-reviewed': 'Open Command Status and review the current truthful status once.',
  'creator-output-reviewed': 'Create or apply one reviewed Creator/Forge output, then return to this objective.',
  'project-continuity-reviewed': 'Create or resume a real Project so EONAPP can record a continuity receipt.',
  'knowledge-evidence-reused': 'Reuse a real Library, backup-readiness or recovery receipt from EONAPP.',
  'local-ai-ready-verified': 'Use Make Local AI ready and complete the Local AI setup/self-test on this device.',
  'automation-reviewed': 'Prepare and review one Automation proposal; nothing needs to run automatically.',
  'creator-capture-reviewed': 'Save one Creator Capture locally, then return to this objective.',
  'share-reviewed': 'Review one intentional signed handoff in Share Command Center; publishing is not required.',
  'agent-handoff-reviewed': 'Open Agent Theatre and explicitly review one genuine agent receipt.',
  'eonbot-guidance-reviewed': 'Ask EONBOT one real question through a configured Local or Connected AI route.',
  'vault-reveal-verified': 'Open one deterministic Vault Reveal that is already available to you.',
  'travel-readiness-reviewed': 'Complete the reviewed transit-readiness step, then return to this objective.'
});

export function getEonCityRt91ProductiveReceiptGuidance(requiredKind = '') {
  const requested = safe(requiredKind);
  const kind = ALIASES[requested] || requested;
  return GUIDANCE[kind] || 'Complete the reviewed native EONAPP action required by this objective, then return here.';
}

function newest(rows = [], readAt = () => 0) {
  return [...rows].sort((a, b) => Number(readAt(b) || 0) - Number(readAt(a) || 0))[0] || null;
}

function gameReceipt(requiredKind, evidence) {
  const evidenceId = safe(evidence?.evidenceReceiptId || evidence?.receiptId || evidence?.id || evidence?.outcomeId);
  const evidenceKind = safe(evidence?.kind || evidence?.type || evidence?.sourceKind);
  const verifiedAt = Math.max(1, Number(evidence?.verifiedAt || evidence?.openedAt || evidence?.completedAt || 0));
  if (!evidenceId || !evidenceKind || !Number.isFinite(verifiedAt)) return null;
  return freeze({
    schema: EON_CITY_RT91_PRODUCTIVE_RECEIPT_ADAPTER_SCHEMA,
    id: safe(`rt91:${requiredKind}:${evidenceId}`),
    kind: requiredKind,
    verified: true,
    verifiedAt,
    sourceEvidenceKind: evidenceKind,
    sourceEvidenceId: evidenceId,
    sourceAuthority: safe(evidence?.nativeAuthority || evidence?.source || evidence?.sourceAuthority || 'local-reviewed-proof'),
    privateContentStored: false,
    storesRawPrompt: false,
    storesRawFileContent: false,
    storesCredential: false,
    storesGeneratedContent: false,
    awardsXp: false,
    writesLegacyAuthority: false
  });
}

export function createEonCityRt91ProductiveReceiptAdapter({
  storage = globalThis.localStorage,
  getTravelReadinessReceipt = () => null,
  now = Date.now
} = {}) {
  const resolve = (requiredKind = '') => {
    const requested = safe(requiredKind);
    const kind = ALIASES[requested] || requested;
    if (!kind) return freeze({ ok: false, reason: 'productive-receipt-kind-required' });

    const coreKinds = CORE_POLICIES[kind];
    if (coreKinds) {
      const outcome = newest(
        listEonCoreOutcomes({ storage }).filter((entry) => entry?.verified === true && coreKinds.includes(String(entry.kind || ''))),
        (entry) => entry.verifiedAt
      );
      const receipt = outcome ? gameReceipt(requested || kind, outcome) : null;
      return receipt
        ? freeze({ ok: true, receipt, evidence: freeze({ authority: 'eon-core-outcome', kind: outcome.kind, nativeAuthority: outcome.nativeAuthority }), privateContentStored: false })
        : freeze({ ok: false, reason: 'reviewed-native-outcome-required', requiredKind: requested || kind, acceptableNativeKinds: coreKinds, nextAction: getEonCityRt91ProductiveReceiptGuidance(requested || kind) });
    }

    const verifiedType = VERIFIED_ACTION_POLICIES[kind];
    if (verifiedType) {
      const progression = readEonCityW659gProgression({ storage, now: now() });
      const evidence = newest(
        Object.values(progression?.receipts || {}).filter((entry) => entry?.accepted === true && String(entry.type || '') === verifiedType && entry.receiptId),
        (entry) => entry.verifiedAt
      );
      const receipt = evidence ? gameReceipt(requested || kind, { ...evidence, kind: verifiedType, sourceAuthority: 'w659g-verified-action' }) : null;
      return receipt
        ? freeze({ ok: true, receipt, evidence: freeze({ authority: 'w659g-verified-action', kind: verifiedType }), privateContentStored: false })
        : freeze({ ok: false, reason: 'reviewed-native-action-required', requiredKind: requested || kind, requiredActionType: verifiedType, nextAction: getEonCityRt91ProductiveReceiptGuidance(requested || kind) });
    }

    if (kind === 'vault-reveal-verified') {
      const progression = readEonCityW659gProgression({ storage, now: now() });
      const reveal = newest(progression?.revealHistory || [], (entry) => entry.openedAt);
      const evidence = reveal ? { ...reveal, kind: 'vault-reveal-opened', id: `vault-reveal:${reveal.revealNumber}:${reveal.rewardId || 'mastery'}:${reveal.openedAt}`, verifiedAt: reveal.openedAt, sourceAuthority: 'w659g-deterministic-vault-reveal' } : null;
      const receipt = evidence ? gameReceipt(requested || kind, evidence) : null;
      return receipt
        ? freeze({ ok: true, receipt, evidence: freeze({ authority: 'w659g-deterministic-vault-reveal', kind: 'vault-reveal-opened' }), privateContentStored: false })
        : freeze({ ok: false, reason: 'opened-vault-reveal-required', requiredKind: requested || kind, nextAction: getEonCityRt91ProductiveReceiptGuidance(requested || kind) });
    }

    if (kind === 'travel-readiness-reviewed') {
      const evidence = getTravelReadinessReceipt?.() || null;
      const receipt = evidence?.verified === true ? gameReceipt(requested || kind, { ...evidence, kind: evidence.kind || 'travel-readiness-reviewed', sourceAuthority: evidence.sourceAuthority || 'maintained-transit-authority' }) : null;
      return receipt
        ? freeze({ ok: true, receipt, evidence: freeze({ authority: safe(evidence.sourceAuthority || 'maintained-transit-authority'), kind: safe(evidence.kind || 'travel-readiness-reviewed') }), privateContentStored: false })
        : freeze({ ok: false, reason: 'reviewed-travel-receipt-required', requiredKind: requested || kind, nextAction: getEonCityRt91ProductiveReceiptGuidance(requested || kind) });
    }

    return freeze({ ok: false, reason: 'productive-receipt-authority-unavailable', requiredKind: requested || kind, nextAction: getEonCityRt91ProductiveReceiptGuidance(requested || kind) });
  };

  const verify = ({ requiredKind = '', receipt = null } = {}) => {
    const current = resolve(requiredKind);
    if (!current.ok) return current;
    if (receipt && safe(receipt.id) !== safe(current.receipt.id)) return freeze({ ok: false, reason: 'productive-receipt-selection-changed', requiredKind: safe(requiredKind) });
    return freeze({ ok: true, receipt: current.receipt, evidence: current.evidence, privateContentStored: false, mutatesNativeAuthority: false });
  };

  return freeze({
    schema: EON_CITY_RT91_PRODUCTIVE_RECEIPT_ADAPTER_SCHEMA,
    resolve,
    verify,
    getSupportedKinds: () => freeze([...Object.keys(CORE_POLICIES), ...Object.keys(VERIFIED_ACTION_POLICIES), 'vault-reveal-verified', 'travel-readiness-reviewed']),
    ownsNativeOutcomeAuthority: false,
    ownsXpAuthority: false,
    ownsUnlockAuthority: false,
    readsPrivateContent: false,
    networkRequestCreated: false
  });
}

export default freeze({ EON_CITY_RT91_PRODUCTIVE_RECEIPT_ADAPTER_SCHEMA, createEonCityRt91ProductiveReceiptAdapter, getEonCityRt91ProductiveReceiptGuidance });
