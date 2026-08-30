const freeze = (value) => Object.freeze(value);

export const W484_USER_FACING_RED_TEAM_SCHEMA = 'eon.user-facing-red-team.w484.v1';

export const W484_REMAINING_EXECUTION_WAVES = freeze([
  freeze({ id: 'W484', name: 'User-facing UX/business red-team and share audit', owner: 'ChatGPT source patch', status: 'coded-source-gate', codexRole: 'rebase, deploy preview, capture live proof' }),
  freeze({ id: 'W485', name: 'Live visual/device/share proof and owner activation decision', owner: 'Codex + Owner', status: 'evidence-and-owner-go-required', codexRole: 'capture route screenshots, console, Lighthouse, referral/share proofs and activation board' })
]);

export const W484_CEO_DECISIONS = freeze([
  'Adopt a ChatGPT-style navigation principle: collapsed desktop rail must reveal full labels on hover/focus, while mobile keeps a deliberate drawer.',
  'Keep EON City as the flagship but make the app feel simpler: Chat first, then Apps, City, Creator, Market, Vault, Local AI, Referral and Support as clear lanes.',
  'Every shareable object should produce user-controlled copy/link/card first; automatic posting remains locked until each OAuth connector has live proof.',
  'Referral must feel like an invitation/reward trail, not a crypto/payout promise; attribution and privacy-safe links are mandatory.',
  'IoT, drones, robotics and smart devices stay future-ready in Device Lab only: client-side pairing guide, visible permissions, emergency stop UX and no launch-active control claims.',
  'Do not add more launch features until this audit board stays green; improve clarity, proof and conversion before expanding scope.'
]);

export const W484_AUDIT_DOMAINS = freeze([
  freeze({
    id: 'shell-navigation',
    label: 'Shell/navigation UX',
    critique: 'A powerful app can feel confusing if the sidebar hides labels behind a click. ChatGPT-style hover reveal reduces friction while keeping the clean rail.',
    codedDecision: 'Desktop collapsed sidebar reveals full labels and chat history on hover/focus; mobile remains a drawer.',
    proof: freeze(['assets/js/eon-app-shell.js binds hover/focus expansion', 'assets/css/eon-app-shell.css exposes labels during hover-expanded state', 'no mobile forced hover behavior', 'keyboard focus also expands the rail'])
  }),
  freeze({
    id: 'viral-share',
    label: 'Viral sharing and referral loops',
    critique: 'Share systems must be everywhere the user creates value, but never feel spammy or fake-automated.',
    codedDecision: 'Audit requires share hooks for chat output, Creator exports, EON City postcards, realm/relic profiles, referral invites, rewards, project pages and support success receipts.',
    proof: freeze(['share surfaces remain user-controlled', 'referral attribution is privacy-safe', 'direct social OAuth stays proof-gated', 'mobile copy/cards must be readable'])
  }),
  freeze({
    id: 'business-logic',
    label: 'Business logic and monetization clarity',
    critique: 'Cash features must make sense before launch: value, ownership, billing state, refund/support, upgrade path and blocked unapproved processors.',
    codedDecision: 'Billing/Dodo/direct checkout stays off until approval; Market/Vault/Creator value must be explained as non-misleading utility and collectibles.',
    proof: freeze(['no checkout activation before approval', 'Vault backup/persistence survives updates', 'Market does not promise investment returns', 'Creator ready-to-post is manual unless connector proof exists'])
  }),
  freeze({
    id: 'eoncity-integration',
    label: 'EON City integration logic',
    critique: 'The City should not be a separate gimmick. Each district must route to a real useful task or be clearly preview-only.',
    codedDecision: 'City launch proof must verify Command Deck lanes: Chat, Creator, Market, Vault, Trade, Local AI, Referral, Device Lab/IoT and Support.',
    proof: freeze(['canonical /eoncity only', 'no cut controls in portrait/tablet', 'Command Deck app lanes open truthful routes', 'fallback mode is visible and dignified'])
  }),
  freeze({
    id: 'iot-device-lab',
    label: 'Sync, IoT and external device future',
    critique: 'External devices are powerful but high-risk. Non-technical users need plain pairing, permission, test mode and emergency stop before any drone/robot/smart-device action.',
    codedDecision: 'Device Lab remains a future-ready onboarding lane, not launch-active remote control.',
    proof: freeze(['client-side opt-in only', 'no background device control', 'local-network proof required', 'emergency stop and revoke permissions UX required'])
  }),
  freeze({
    id: 'launch-simplicity',
    label: 'Launch simplicity and product meaning',
    critique: 'Too many surfaces can dilute the launch. The public story should be: AI cockpit + City workspace + Creator/Market/Vault + safe sharing.',
    codedDecision: 'Prioritize clarity and receipts over feature expansion; every page needs one obvious next action.',
    proof: freeze(['primary CTA per major route', 'plain-language empty states', 'no fake active labels', 'support/help route always available'])
  })
]);

export const W484_SHAREABLE_OBJECTS = freeze([
  'chat-answer-card',
  'creator-ready-to-post-pack',
  'eoncity-postcard',
  'realm-profile-link',
  'relic-or-collection-card',
  'project-showcase-card',
  'referral-invite-link',
  'reward-progress-receipt',
  'vault-backup-reminder-card',
  'support-resolution-receipt'
]);

export const W484_CODEX_EVIDENCE_DUTIES = freeze([
  'rebase-w484-onto-current-main-without-overwrite',
  'prove-sidebar-hover-expand-on-desktop-and-keyboard-focus',
  'prove-mobile-sidebar-remains-click-drawer-not-hover-dependent',
  'capture-share-entry-points-across-chat-creator-city-market-vault-referral',
  'capture-referral-link-generation-and-privacy-safe-attribution',
  'capture-eoncity-command-deck-route-meaning',
  'capture-device-lab-iot-copy-as-future-ready-not-active-control',
  'return-red-team-findings-with-pass-fixrequired-blocked-status'
]);

export const W484_USER_FACING_RED_TEAM_CONTRACT = freeze({
  schema: W484_USER_FACING_RED_TEAM_SCHEMA,
  wave: 'W484',
  remainingExecutionWaves: W484_REMAINING_EXECUTION_WAVES,
  decisions: W484_CEO_DECISIONS,
  domains: W484_AUDIT_DOMAINS,
  shareableObjects: W484_SHAREABLE_OBJECTS,
  codexEvidenceDuties: W484_CODEX_EVIDENCE_DUTIES,
  truth: freeze({
    hoverExpandIsLaunchUxDecision: true,
    automaticPostingAllowedNow: false,
    unapprovedPaymentsAllowedNow: false,
    iotRemoteControlAllowedNow: false,
    sourceAuditCanCertifyProduction: false,
    liveVisualProofStillRequired: true
  })
});

export function validateW484UserFacingRedTeamContract(contract = W484_USER_FACING_RED_TEAM_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === W484_USER_FACING_RED_TEAM_SCHEMA, 'W484 schema must stay canonical.');
  ensure(contract.remainingExecutionWaves.length === 2, 'W484 must leave exactly two execution waves before owner GO.');
  for (const required of ['shell-navigation', 'viral-share', 'business-logic', 'eoncity-integration', 'iot-device-lab', 'launch-simplicity']) {
    ensure(contract.domains.some((domain) => domain.id === required), `W484 required audit domain missing: ${required}`);
  }
  for (const domain of contract.domains) {
    ensure(domain.critique && domain.codedDecision, `W484 domain needs critique and coded decision: ${domain.id}`);
    ensure(Array.isArray(domain.proof) && domain.proof.length >= 4, `W484 domain needs proof items: ${domain.id}`);
  }
  ensure(contract.shareableObjects.length >= 10, 'W484 must enumerate broad shareable objects.');
  ensure(contract.codexEvidenceDuties.includes('prove-sidebar-hover-expand-on-desktop-and-keyboard-focus'), 'Codex must prove hover-expand UX.');
  ensure(contract.codexEvidenceDuties.includes('capture-share-entry-points-across-chat-creator-city-market-vault-referral'), 'Codex must prove share entry points.');
  ensure(contract.truth.automaticPostingAllowedNow === false, 'Automatic posting must remain blocked.');
  ensure(contract.truth.unapprovedPaymentsAllowedNow === false, 'Unapproved payments must remain blocked.');
  ensure(contract.truth.iotRemoteControlAllowedNow === false, 'IoT remote control must remain blocked.');
  ensure(contract.truth.liveVisualProofStillRequired === true, 'Live visual proof remains required.');
  return errors;
}
