const freeze = (value) => Object.freeze(value);

export const W483_CEO_CITY_LAUNCH_AUDIT_SCHEMA = 'eon.ceo.city-launch-audit.w483.v1';

export const W483_REMAINING_EXECUTION_WAVES = freeze([
  freeze({ id: 'W483', name: 'CEO City/app launch audit matrix', owner: 'ChatGPT source patch', status: 'coded-source-gate', codexRole: 'rebase and prove live evidence' }),
  freeze({ id: 'W484', name: 'City institutional visual/device proof run', owner: 'Codex + physical devices', status: 'evidence-required', codexRole: 'capture browser screenshots, FPS, console, Lighthouse and physical-device proof' }),
  freeze({ id: 'W485', name: 'Launch activation decision gate', owner: 'Owner + Codex', status: 'owner-go-required', codexRole: 'activate only approved external systems after evidence is green' })
]);

export const W483_EXECUTIVE_AUDIT_DOMAINS = freeze([
  freeze({ id: 'city-graphics', label: 'EON City institutional graphics', requiredProof: freeze(['canonical /eoncity loads without WebGL texture warnings', 'desktop cinematic and balanced profiles captured', 'mobile portrait and tablet layouts captured', 'no overlapping controls, cut text, stuck loading, or silent fallback', 'safe performance governor and 2D recovery path recorded']) }),
  freeze({ id: 'city-work-loop', label: 'EON City product meaning', requiredProof: freeze(['Command Deck routes to real app surfaces', 'Creator, Vault, Market, Trade, Local AI and Support lanes are truthful', 'no fake active automation, payouts, social posting, NPC work, or model generation claims', 'EONBOT work proposals require user review']) }),
  freeze({ id: 'creator-viral', label: 'Creator, referral and viral sharing', requiredProof: freeze(['Ready-to-Post export creates user-controlled copy/assets', 'share/referral links are attributable and privacy-safe', 'automatic posting remains off until OAuth connectors are proved', 'public share surfaces are mobile-readable and beginner-friendly']) }),
  freeze({ id: 'vault-cash-trust', label: 'Vault, billing and cash features', requiredProof: freeze(['Vault persistence survives app updates', 'billing/catalogue remains approval-gated', 'no Dodo or checkout activation before merchant approval', 'support/refund/trust copy is consistent']) }),
  freeze({ id: 'local-ai-media', label: 'Local AI image/video readiness', requiredProof: freeze(['text/local model setup is separated from image/video adapters', 'image/video surfaces show setup guidance only until adapter proof exists', 'cancel/output/error evidence required before activation', 'device guidance is non-technical and tiered']) }),
  freeze({ id: 'iot-sync-devices', label: 'Sync, IoT and external devices', requiredProof: freeze(['cross-device sync is explicit and encrypted/export-based unless server sync is approved', 'IoT/device connection is client-side opt-in with user confirmation', 'drones/robots/smart devices require local-network pairing proof and emergency stop UX', 'no background device control or unsafe automation is implied']) }),
  freeze({ id: 'all-device-release', label: 'All-device launch assurance', requiredProof: freeze(['desktop, Android portrait, iPhone portrait, tablet, weak-WebGL and reduced-motion cases are captured', 'console and network errors are collected', 'Lighthouse route matrix passes budgets or returns FIX REQUIRED', 'production commit SHA and Cloudflare deployment id are recorded']) })
]);

export const W483_CEO_DECISIONS = freeze([
  'EON City remains the flagship visual entry, but every impressive visual must map to a real product lane or a clearly preview-only lane.',
  'Institutional-grade means evidence-gated: screenshots, FPS witness, console logs, Lighthouse, route checks and physical-device proof, not opinion.',
  'Do not activate payments, direct social OAuth posting, local image/video generation, or device/IoT control until the exact adapter has proof and owner approval.',
  'IoT/drones/robotics stay future-ready and client-side: beginner pairing, visible permissions, review-before-action, local-network proof and emergency stop are mandatory.',
  'Codex should receive only merge/deploy/proof duties after this source gate; product decisions and unsafe activations stay locked.'
]);

export const W483_CODEX_EVIDENCE_DUTIES = freeze([
  'rebase-source-patch-onto-current-main-without-overwrite',
  'record-current-main-sha-and-patched-sha',
  'run-final-verify-chain',
  'deploy-preview-then-production-only-after-green',
  'capture-eoncity-desktop-balanced-cinematic-screenshots',
  'capture-eoncity-mobile-portrait-tablet-screenshots',
  'capture-fps-console-webgl-network-evidence',
  'capture-lighthouse-route-matrix',
  'capture-android-iphone-tablet-human-device-notes',
  'return-pass-fixrequired-environmentblocked-decision'
]);

export const W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT = freeze({
  schema: W483_CEO_CITY_LAUNCH_AUDIT_SCHEMA,
  wave: 'W483',
  remainingExecutionWaves: W483_REMAINING_EXECUTION_WAVES,
  domains: W483_EXECUTIVE_AUDIT_DOMAINS,
  decisions: W483_CEO_DECISIONS,
  codexEvidenceDuties: W483_CODEX_EVIDENCE_DUTIES,
  truth: freeze({
    sourceAuditCanPlanAndGate: true,
    sourceAuditCanCertifyProduction: false,
    cityNearPerfectRequiresLiveScreenshots: true,
    physicalDevicesRequired: true,
    iotDeviceControlActivationAllowedNow: false,
    paymentActivationAllowedNow: false,
    directSocialPostingActivationAllowedNow: false,
    localImageVideoAdapterActivationAllowedNow: false
  })
});

export function validateW483CeoCityLaunchAuditContract(contract = W483_CEO_CITY_LAUNCH_AUDIT_CONTRACT) {
  const errors = [];
  const ensure = (value, message) => { if (!value) errors.push(message); };
  ensure(contract.schema === W483_CEO_CITY_LAUNCH_AUDIT_SCHEMA, 'W483 schema must stay canonical.');
  ensure(contract.remainingExecutionWaves.length === 3, 'W483 must keep exactly three remaining execution waves for CEO clarity.');
  ensure(contract.domains.length >= 7, 'W483 must audit City, app, creator, trust, local AI, IoT and devices.');
  for (const required of ['city-graphics', 'city-work-loop', 'creator-viral', 'vault-cash-trust', 'local-ai-media', 'iot-sync-devices', 'all-device-release']) {
    ensure(contract.domains.some((domain) => domain.id === required), `W483 required audit domain missing: ${required}`);
  }
  for (const domain of contract.domains) {
    ensure(Array.isArray(domain.requiredProof) && domain.requiredProof.length >= 4, `W483 domain needs concrete proof items: ${domain.id}`);
  }
  ensure(contract.codexEvidenceDuties.includes('capture-eoncity-desktop-balanced-cinematic-screenshots'), 'Codex must capture desktop City visuals.');
  ensure(contract.codexEvidenceDuties.includes('capture-android-iphone-tablet-human-device-notes'), 'Codex must capture physical-device notes.');
  ensure(contract.truth.cityNearPerfectRequiresLiveScreenshots === true, 'Near-perfect City quality requires live screenshots.');
  ensure(contract.truth.sourceAuditCanCertifyProduction === false, 'Source-only audit cannot certify production.');
  ensure(contract.truth.iotDeviceControlActivationAllowedNow === false, 'IoT/device control must not be activated now.');
  ensure(contract.truth.paymentActivationAllowedNow === false && contract.truth.directSocialPostingActivationAllowedNow === false && contract.truth.localImageVideoAdapterActivationAllowedNow === false, 'Cash/social/local media activation must remain blocked.');
  return errors;
}
