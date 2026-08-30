/**
 * W302 — EONAPP Capability Truth Registry.
 *
 * This is the single browser-readable product truth contract for public
 * capability claims. It is intentionally static: entries describe what is
 * available now, what is local-only, and what remains planned, retired or
 * blocked. It never contains credentials, account identifiers, raw prompts,
 * provider tokens, or deployment state.
 */

export const CAPABILITY_TRUTH_REGISTRY_SCHEMA = 'eonapp.capability-truth-registry.v1';
export const CAPABILITY_TRUTH_LIFECYCLES = Object.freeze([
  'active-local',
  'active-connected',
  'draft-only',
  'manual-composer',
  'planned',
  'retired',
  'blocked'
]);

const LIFECYCLE_SET = new Set(CAPABILITY_TRUTH_LIFECYCLES);
const ACTIVE_LIFECYCLES = new Set(['active-local', 'active-connected', 'draft-only', 'manual-composer']);

function safeRoute(value = '') {
  try {
    const url = new URL(String(value || ''), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return '';
    return url.pathname;
  } catch {
    return '';
  }
}

function freezeRecord(record = {}) {
  const lifecycle = LIFECYCLE_SET.has(record.lifecycle) ? record.lifecycle : 'blocked';
  const routes = Object.freeze((Array.isArray(record.routes) ? record.routes : [])
    .map(safeRoute)
    .filter(Boolean));
  return Object.freeze({
    id: String(record.id || '').trim(),
    label: String(record.label || '').trim(),
    lifecycle,
    canonicalSurface: String(record.canonicalSurface || '').trim(),
    routes,
    requiresConnection: Boolean(record.requiresConnection),
    requiresApproval: Boolean(record.requiresApproval),
    externalEffect: Boolean(record.externalEffect),
    evidenceOwner: String(record.evidenceOwner || '').trim(),
    evidenceTest: String(record.evidenceTest || '').trim(),
    truthfulUserFacingNote: String(record.truthfulUserFacingNote || '').trim()
  });
}

const RECORDS = [
  {
    id: 'eonbot-chat', label: 'EONBOT Chat', lifecycle: 'active-local', canonicalSurface: 'Chat', routes: ['/'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W263 / W304', evidenceTest: 'qa:w263-eonbot-capability-execution',
    truthfulUserFacingNote: 'Chat can guide, route, and prepare local review cards. It does not silently run an external action.'
  },
  {
    id: 'mission-draft', label: 'Mission Draft', lifecycle: 'draft-only', canonicalSurface: 'Chat', routes: ['/'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W304', evidenceTest: 'qa:w301-w304-foundation',
    truthfulUserFacingNote: 'A mission draft is a local plan only. It is not a provider call, background job, publish, schedule, or deployment.'
  },
  {
    id: 'chat-action-cards', label: 'Chat Action Cards and Review Inbox', lifecycle: 'active-local', canonicalSurface: 'Chat + Workspace', routes: ['/', '/workspace'],
    requiresConnection: false, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W304', evidenceTest: 'qa:w301-w304-foundation',
    truthfulUserFacingNote: 'Cards make requirements visible and save local review state only. Packet previews are not server-issued or executable.'
  },
  {
    id: 'workspace', label: 'Workspace', lifecycle: 'active-local', canonicalSurface: 'Workspace', routes: ['/workspace', '/projects', '/library'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W211 / W304', evidenceTest: 'qa:w211-workspace-automation',
    truthfulUserFacingNote: 'Projects, library records, drafts, and review state remain local to this browser unless you explicitly export a backup.'
  },
  {
    id: 'automation-local-review', label: 'Automations local planning', lifecycle: 'draft-only', canonicalSurface: 'Automations', routes: ['/automations'],
    requiresConnection: false, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W211 / W304', evidenceTest: 'qa:w211-workspace-automation',
    truthfulUserFacingNote: 'Automations can be drafted, inspected, simulated, paused, and reviewed locally. They do not run a durable external job yet.'
  },
  {
    id: 'local-ai-runtime', label: 'Local AI runtime', lifecycle: 'active-local', canonicalSurface: 'Local AI', routes: ['/local-ai'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W219 / W285', evidenceTest: 'qa:w285-local-ai-device-support',
    truthfulUserFacingNote: 'A local model becomes available only after a device-local self-test. EONBOT does not install or download it for you.'
  },
  {
    id: 'configured-ai-provider', label: 'Configured AI provider', lifecycle: 'active-connected', canonicalSurface: 'Chat + Vault', routes: ['/', '/vault'],
    requiresConnection: true, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W244 / W281', evidenceTest: 'qa:w281-ai-provider-lifecycle',
    truthfulUserFacingNote: 'A user-configured provider may answer chat after existing Vault configuration. It does not grant social-account access or background execution authority.'
  },
  {
    id: 'manual-composer-share', label: 'Manual sharing and composer handoff', lifecycle: 'manual-composer', canonicalSurface: 'Workspace + Profile', routes: ['/workspace', '/profile'],
    requiresConnection: false, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W212 / W247', evidenceTest: 'qa:w212-market-links',
    truthfulUserFacingNote: 'EONAPP can prepare a reviewed link or composer destination. You choose whether any platform post is made.'
  },
  {
    id: 'realm-local-studio', label: 'My Realm local studio', lifecycle: 'active-local', canonicalSurface: 'My Realm + EON City', routes: ['/realm-studio'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W222 / W346-C0', evidenceTest: 'qa:w346-realm-relic-boundary',
    truthfulUserFacingNote: 'A Realm is a private City work environment and portable identity link. It is not a public property, seller account, storefront, marketplace, affiliate record, or payout surface.'
  },
  {
    id: 'local-relic-previews', label: 'Local Relic previews', lifecycle: 'active-local', canonicalSurface: 'Preview Studio + My Realm', routes: ['/preview-studio', '/realm-studio'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W220 / W346-C0', evidenceTest: 'qa:w346-realm-relic-boundary',
    truthfulUserFacingNote: 'Generated Relics are local visual/creative records for a Vault or Realm moodboard. They are not minted, sold, transferable, wallet-backed, royalty-bearing, or assigned financial value.'
  },
  {
    id: 'realm-share-relic-passport', label: 'Realm Share Relic Passport', lifecycle: 'active-local', canonicalSurface: 'My Realm', routes: ['/realm-studio', '/referral'],
    requiresConnection: false, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W347-A', evidenceTest: 'qa:w347-realm-share-relic-passport',
    truthfulUserFacingNote: 'A completed system share can create one local Signal Relic; a verified signed Realm link can create one local Welcome Relic for the visitor. These are free local cosmetics only. They do not verify delivery, clicks, visitors, referrals, conversion, payment, premium access, account creation, wallets, NFTs, sales, transfer, royalties, or financial value.'
  },
  {
    id: 'server-referral-eonkeys', label: 'Server referral and EONKEY unlock ledger', lifecycle: 'active-connected', canonicalSurface: 'EON Keys + Share Center', routes: ['/eon-keys'],
    requiresConnection: true, requiresApproval: true, externalEffect: true,
    evidenceOwner: 'W623H / W623I / W629B', evidenceTest: 'qa:w623g-share-voice-growth',
    truthfulUserFacingNote: 'Referral/EONKEY programme state is server-authoritative and rollout-controlled. Sharing, copying, posting, clicks or impressions never grant value by themselves. When the ledger is enabled, only an eligible accepted account association and verified qualifying milestone can create a bounded non-cash feature unlock; no wallet, token, payout or commission is created.'
  },
  {
    id: 'eon-city-mirror', label: 'EON City local visual mirror', lifecycle: 'active-local', canonicalSurface: 'EON City', routes: ['/eoncity'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W250–W286', evidenceTest: 'qa:w250-city-prepared-action',
    truthfulUserFacingNote: 'City shows safe local work cues and routes. It is not a job runner, OAuth surface, wallet, account console, or proof of cloud execution.'
  },
  {
    id: 'eon-city-spatial-command-space', label: 'Archived EON City alternate renderer', lifecycle: 'retired', canonicalSurface: 'EON City', routes: ['/eoncity'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W428', evidenceTest: 'qa:w428-one-public-city',
    truthfulUserFacingNote: 'Older map, tour and alternate-renderer paths redirect to the canonical Babylon EON City. They are not public destinations or fallback products.'
  },
  {
    id: 'encrypted-local-vault-foundation', label: 'Encrypted local vault foundation', lifecycle: 'draft-only', canonicalSurface: 'Vault + Workspace', routes: ['/vault', '/workspace'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W307', evidenceTest: 'qa:w307-local-vault-foundation',
    truthfulUserFacingNote: 'The device-local encrypted-record foundation is implemented, but existing workspace and chat records have not yet been migrated. Do not treat current local browser storage as fully encrypted until W308 migration proof is complete.'
  },
  {
    id: 'creator-suite-2', label: 'Advanced Workspace creator drafts', lifecycle: 'active-local', canonicalSurface: 'Workspace', routes: ['/workspace'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W321–W327 + Institutional AI v2', evidenceTest: 'qa:w321-w327-creator-suite',
    truthfulUserFacingNote: 'The Advanced Workspace can prepare local Build, Content, Image, Video, Audio, and Voice drafts for user-triggered export. This compatibility draft layer itself does not generate media or call a provider. Canonical Create now owns the maintained Image, Video and Music execution rails; retired standalone Creator/Video/Music routes must not be restored.'
  },
  {
    id: 'creator-local-image-video', label: 'Create local Image and Video generation', lifecycle: 'active-connected', canonicalSurface: 'Create + Local AI', routes: ['/create', '/local-ai'],
    requiresConnection: true, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W625D–W625H + Institutional AI v2', evidenceTest: 'institutional-ai-v2 + real-device-proof-pending',
    truthfulUserFacingNote: 'Canonical Create has source-integrated Local Image and Video rails through approved loopback runtimes. They remain workflow-, model-, hardware- and real-output-proof dependent; source integration alone is not launch certification and weak devices must fail closed.'
  },
  {
    id: 'creator-hosted-image-video', label: 'Create hosted Direct BYOK Image and Video', lifecycle: 'active-connected', canonicalSurface: 'Create + EON City', routes: ['/create', '/eoncity'],
    requiresConnection: true, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W626 + Institutional AI v2', evidenceTest: 'institutional-ai-v2 + real-provider-proof-pending',
    truthfulUserFacingNote: 'Canonical Create and EON City have reviewed prompt-first Direct BYOK Image/Video rails through the paired local Creator Companion for fal and Replicate. Keys stay in the OS credential vault; completed media is pulled into bounded Companion memory; reference-media upload, automatic paid retry/fallback and central EONAPP media storage are not authorized. Real owner-key provider/browser certification remains pending.'
  },
  {
    id: 'creator-browser-music', label: 'Create browser Music sequencer and Radio', lifecycle: 'active-local', canonicalSurface: 'Create', routes: ['/create', '/eoncity'],
    requiresConnection: false, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'Institutional AI v2', evidenceTest: 'institutional-ai-v2',
    truthfulUserFacingNote: 'Canonical Create includes a browser-local Music sequencer/WAV export, private session-only EON Radio queue, and local Auto DJ metadata-sequenced crossfade preview. These deterministic tools are not model-generated music, do not upload user audio, and do not connect a commercial streaming catalogue.'
  },
  {
    id: 'creator-generative-music', label: 'Create generative Music', lifecycle: 'active-connected', canonicalSurface: 'Create', routes: ['/create', '/eoncity'],
    requiresConnection: true, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'Institutional AI v2', evidenceTest: 'institutional-ai-v2 + real-provider/local-runtime-proof-pending',
    truthfulUserFacingNote: 'Canonical Music has reviewed source rails for explicit local ACE-Step generation and hosted ElevenLabs Music v2 through the paired Creator Companion. No model download, reference-song upload, hidden cloud fallback, automatic paid retry or central EONAPP media proxy is authorized; launch proof remains pending.'
  },
  {
    id: 'creator-outcome-kit-previews', label: 'Creator Outcome Kit local previews', lifecycle: 'active-local', canonicalSurface: 'Workspace', routes: ['/workspace'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W352', evidenceTest: 'qa:w349-w352-local-productization',
    truthfulUserFacingNote: 'Workspace offers five free local starting briefs for campaign, brand, build, creator export, and Realm style work. They are editable previews only, not purchases, licences, membership, provider calls, generated assets, referral value, token/NFT keys, or paid feature unlocks.'
  },
  {
    id: 'rt92-billing-commercial', label: 'Plans & Billing', lifecycle: 'active-connected', canonicalSurface: 'Billing', routes: ['/billing'],
    requiresConnection: true, requiresApproval: true, externalEffect: true,
    evidenceOwner: 'RT92 commercial hardening', evidenceTest: 'rt92 commercial + billing lifecycle suites',
    truthfulUserFacingNote: 'Billing presents six recurring subscriptions — Plus, Studio, Power, Max, Pro and Ultra — plus the Ultimate one-time software purchase. Checkout is created server-side and hosted by Dodo Payments; verified provider webhooks, not browser claims, control recurring entitlements and Ultimate software grants. Refund, dispute, cancellation and plan-change effects remain provider- and ledger-authoritative.'
  },
  {
    id: 'eon-offer-catalog', label: 'EONAPP product direction catalog', lifecycle: 'planned', canonicalSurface: 'Historical W348 product direction', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W348-A', evidenceTest: 'qa:w348-offer-catalog',
    truthfulUserFacingNote: 'The product direction describes a free local core, future Studio membership, and future official personal-use packs. It is not pricing, checkout, a payment offer, subscription, product delivery, referral discount, NFT feature key, token, user marketplace, or payout.'
  },
  {
    id: 'local-beta-readiness-desk', label: 'Local invite-only beta readiness desk', lifecycle: 'active-local', canonicalSurface: 'Workspace', routes: ['/workspace'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W353–W354', evidenceTest: 'qa:w353-w356-local-beta-release-governance',
    truthfulUserFacingNote: 'Workspace can record four non-sensitive local beta-readiness declarations alongside a user-owned Device Proof Kit. It cannot invite, enrol, monitor, collect feedback, collect telemetry, enable commerce, or certify a beta.'
  },
  {
    id: 'release-certification-board', label: 'Release certification board', lifecycle: 'blocked', canonicalSurface: 'Workspace', routes: ['/workspace'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W356', evidenceTest: 'qa:w353-w356-local-beta-release-governance',
    truthfulUserFacingNote: 'The local release board is intentionally fail-closed. It cannot certify, approve, deploy, or release EONAPP; authoritative evidence recovery, Git-history remediation, real-device proof, and independent review remain required.'
  },
  {
    id: 'rt92-rewarded-sponsor-keys', label: 'Sponsored Mission EONKEYS', lifecycle: 'active-connected', canonicalSurface: 'Reward Center', routes: ['/rewards'],
    requiresConnection: true, requiresApproval: true, externalEffect: true,
    evidenceOwner: 'RT98 monetization hardening', evidenceTest: 'rt98 MyLead reward-center assurance + D1 lifecycle suites',
    truthfulUserFacingNote: 'Signed-in users may voluntarily open MyLead Sponsored Missions from the Reward Center. EONAPP credits numeric non-cash EONKEYS only after a trusted provider server postback confirms an eligible conversion; browser actions never mint. EONKEYS redeem only for bounded temporary software unlocks and never grant a paid subscription, cash value, hosted AI credit or permanent high-value access.'
  },
  {
    id: 'referral-commercial-reentry', label: 'Commercial referral re-entry', lifecycle: 'blocked', canonicalSurface: 'Disabled status only', routes: ['/workspace', '/rewards'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W355', evidenceTest: 'qa:w353-w356-local-beta-release-governance',
    truthfulUserFacingNote: 'Realm Share Relics are free local cosmetics. Referral attribution, discount, cash, crypto, points, tokens, wallet, payout, and automatic activation remain disabled pending separate payment, refund, abuse, support, legal, and CEO review.'
  },
  {
    id: 'official-personal-licenses', label: 'Official personal product licences', lifecycle: 'planned', canonicalSurface: 'Billing + Workspace', routes: ['/billing', '/workspace'],
    requiresConnection: true, requiresApproval: true, externalEffect: true,
    evidenceOwner: 'W346-C0 / future commerce review', evidenceTest: 'not-built',
    truthfulUserFacingNote: 'A future card/UPI purchase may issue a signed personal licence for an official EONAPP pack. It will not be a token, NFT, wallet asset, resale item, user marketplace listing, referral value, or payout.'
  },
  {
    id: 'legacy-eonlite-polygon-stack', label: 'EONLite token and Polygon contract stack', lifecycle: 'blocked', canonicalSurface: 'Archive and evidence only', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W258 / W346-C0', evidenceTest: 'qa:w346-realm-relic-boundary',
    truthfulUserFacingNote: 'The legacy EONLite/Polygon stack is not connected to EONAPP. Its runtime and role state require independent verification; no token, wallet, NFT mint, royalty, loot, referral, settlement, marketplace, or payout capability is active.'
  },
  {
    id: 'youtube-private-upload', label: 'YouTube private or unlisted upload', lifecycle: 'planned', canonicalSurface: 'Workspace + Review Inbox', routes: ['/workspace'],
    requiresConnection: true, requiresApproval: true, externalEffect: true,
    evidenceOwner: 'W314–W315', evidenceTest: 'not-built',
    truthfulUserFacingNote: 'No Google Login, Google account connection, or YouTube upload is active. A future provider review would remain separate from EONAPP identity and require a post-level user action.'
  },
  {
    id: 'durable-automation-runtime', label: 'Durable backend automation runtime', lifecycle: 'planned', canonicalSurface: 'Action Gateway', routes: ['/workspace', '/automations'],
    requiresConnection: true, requiresApproval: true, externalEffect: true,
    evidenceOwner: 'W307–W310', evidenceTest: 'not-built',
    truthfulUserFacingNote: 'No durable job runner, queue, schedule, server action packet, or background agent is active. Local work pauses when this browser closes.'
  },
  {
    id: 'legacy-google-one-tap', label: 'Legacy Google One Tap', lifecycle: 'retired', canonicalSurface: 'No active surface', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W306 / W364A', evidenceTest: 'qa:w306-local-first-boundary',
    truthfulUserFacingNote: 'Legacy One Tap and browser-attached Google sign-in are retired. A Gemini API key, where a user chooses one, remains direct provider setup and never grants EONAPP account access.'
  },
  {
    id: 'google-identity-sign-in', label: 'Optional Google identity', lifecycle: 'planned', canonicalSurface: 'Profile', routes: ['/profile'],
    requiresConnection: true, requiresApproval: true, externalEffect: false,
    evidenceOwner: 'W364A', evidenceTest: 'qa:w364a-google-data-custody',
    truthfulUserFacingNote: 'Guest use remains available. Optional Google identity will use only identity scopes and account/session metadata; it will not back up Chat, Vault, projects, Realm layouts, City progress, provider keys, or local files.'
  },
  {
    id: 'legacy-browser-account-attachments', label: 'Browser account attachments and quick login', lifecycle: 'retired', canonicalSurface: 'No active surface', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W306', evidenceTest: 'qa:w306-local-first-boundary',
    truthfulUserFacingNote: 'EONAPP does not attach browser, Google, or social sign-in sessions. Manual composer handoff stays user-controlled.'
  },
  {
    id: 'cloud-workspace-control-plane', label: 'Cloud workspace control plane', lifecycle: 'blocked', canonicalSurface: 'No active surface', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W306', evidenceTest: 'qa:w306-local-first-boundary',
    truthfulUserFacingNote: 'User workspace data, chat history, projects, and task state are not routed through a Cloudflare control plane. EONAPP is local-first with user-created encrypted export only.'
  },
  {
    id: 'legacy-social-publisher', label: 'Legacy social publisher', lifecycle: 'retired', canonicalSurface: 'Archive only', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W303', evidenceTest: 'qa:w301-w304-foundation',
    truthfulUserFacingNote: 'The legacy social publisher is permanently retired. EONAPP does not capture passwords, cookies, browser sessions, or account-like data for publishing.'
  },
  {
    id: 'legacy-agent-executor', label: 'Legacy agent executor', lifecycle: 'retired', canonicalSurface: 'Archive only', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W303', evidenceTest: 'qa:w301-w304-foundation',
    truthfulUserFacingNote: 'The legacy browser agent executor is not an active background worker. Only audited planning ideas may be reused later.'
  },
  {
    id: 'legacy-workbench-creator-routes', label: 'Legacy Workbench and Creator routes', lifecycle: 'retired', canonicalSurface: 'Workspace', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W217 / W303', evidenceTest: 'qa:w217-route-contract',
    truthfulUserFacingNote: 'Retired Workbench, EON Browser, Creator Studio, Video Lab, and Music Lab routes redirect to canonical surfaces and must not be restored.'
  },
  {
    id: 'platform-backend-legacy', label: 'Legacy platform backend', lifecycle: 'blocked', canonicalSurface: 'No active surface', routes: [],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W303 / W309', evidenceTest: 'qa:w301-w304-foundation',
    truthfulUserFacingNote: 'The legacy platform backend is not a deployment target and its D1 schema or endpoints must not be reused for accounts, connections, jobs, or publishing.'
  },
  {
    id: 'reward-wallet-referral', label: 'Rewards, wallet, swap, and referral activation', lifecycle: 'blocked', canonicalSurface: 'Disabled status only', routes: ['/rewards'],
    requiresConnection: false, requiresApproval: false, externalEffect: false,
    evidenceOwner: 'W247 / W284', evidenceTest: 'qa:w284-referral-activation-decision',
    truthfulUserFacingNote: 'Legacy reward-wallet, swap, token, pool, payout, commission, cash-value conversion and commercial referral re-entry paths remain disabled and isolated. The separate server-authoritative EONKEY referral ledger, when rollout-enabled, may grant only bounded non-cash feature unlocks after verified qualification.'
  }
];

export const CAPABILITY_TRUTH_REGISTRY = Object.freeze(RECORDS.map(freezeRecord));
const BY_ID = new Map(CAPABILITY_TRUTH_REGISTRY.map((record) => [record.id, record]));

export function getCapabilityTruth(id = '') {
  return BY_ID.get(String(id || '').trim()) || null;
}

export function listCapabilityTruth({ surface = '', lifecycle = '' } = {}) {
  const wantedSurface = String(surface || '').trim().toLowerCase();
  const wantedLifecycle = String(lifecycle || '').trim();
  return Object.freeze(CAPABILITY_TRUTH_REGISTRY.filter((record) => {
    const surfaceMatch = !wantedSurface || record.canonicalSurface.toLowerCase().includes(wantedSurface);
    const lifecycleMatch = !wantedLifecycle || record.lifecycle === wantedLifecycle;
    return surfaceMatch && lifecycleMatch;
  }));
}

export function getCapabilityTruthForRoute(route = '') {
  const path = safeRoute(route);
  if (!path) return null;
  return CAPABILITY_TRUTH_REGISTRY.find((record) => record.routes.includes(path)) || null;
}

export function isCapabilityAvailableLocally(id = '') {
  const record = getCapabilityTruth(id);
  return Boolean(record && ACTIVE_LIFECYCLES.has(record.lifecycle) && record.externalEffect === false);
}


function normalizeCapabilityQuery(value = '') {
  return String(value || '').toLowerCase().replace(/[^a-z0-9+#./ -]+/g, ' ').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function capabilityQueryTokens(value = '') {
  const stop = new Set(['the','and','for','with','this','that','what','how','can','could','would','should','from','into','about','your','you','eonapp','eonbot']);
  return [...new Set(normalizeCapabilityQuery(value).split(' ').filter((token) => token.length >= 2 && !stop.has(token)))];
}

function capabilityRelevance(record, query = '') {
  const normalized = normalizeCapabilityQuery(query);
  const tokens = capabilityQueryTokens(query);
  if (!normalized || !tokens.length) return 0;
  const haystack = normalizeCapabilityQuery(`${record.id} ${record.label} ${record.canonicalSurface} ${record.routes.join(' ')} ${record.truthfulUserFacingNote}`);
  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 6;
    if (normalizeCapabilityQuery(record.label).includes(token)) score += 6;
    if (normalizeCapabilityQuery(record.id).includes(token)) score += 4;
  }
  if (record.lifecycle === 'active-connected' || record.lifecycle === 'active-local') score += score ? 2 : 0;
  if (record.lifecycle === 'blocked' || record.lifecycle === 'retired') score += score ? 1 : 0;
  return score;
}

/**
 * Turn-time capability overlay for EONBOT grounding.
 *
 * This returns reviewed product capability facts only. It does not inspect
 * account state, provider credentials, deployment secrets or private data and
 * it never treats a lifecycle flag as evidence that a user-specific external
 * action completed.
 */
export function buildCapabilityTruthContext(query = '', options = {}) {
  const limit = Math.max(0, Math.min(Number(options.limit ?? 4), 6));
  const rows = CAPABILITY_TRUTH_REGISTRY
    .map((record) => ({ record, score: capabilityRelevance(record, query) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
    .slice(0, limit)
    .map(({ record }) => record);
  const prompt = rows.length
    ? `Reviewed EONAPP capability truth (turn-relevant; product state only):\n${rows.map((record) => `- ${record.label} [${record.lifecycle}]: ${record.truthfulUserFacingNote} Connection required: ${record.requiresConnection ? 'yes' : 'no'}. Approval required: ${record.requiresApproval ? 'yes' : 'no'}.`).join('\n')}`
    : 'Reviewed EONAPP capability truth: no additional turn-specific capability record selected.';
  return Object.freeze({
    schema: CAPABILITY_TRUTH_REGISTRY_SCHEMA,
    rows: Object.freeze(rows),
    ids: Object.freeze(rows.map((record) => record.id)),
    prompt,
    accountStateIncluded: false,
    credentialStateIncluded: false,
    externalCompletionProof: false
  });
}

export function capabilityTruthSummary(id = '') {
  const record = getCapabilityTruth(id);
  if (!record) return Object.freeze({ known: false, lifecycle: 'blocked', note: 'This capability is not in the reviewed EONAPP registry.' });
  return Object.freeze({
    known: true,
    id: record.id,
    lifecycle: record.lifecycle,
    requiresConnection: record.requiresConnection,
    requiresApproval: record.requiresApproval,
    externalEffect: record.externalEffect,
    note: record.truthfulUserFacingNote
  });
}

export default Object.freeze({
  CAPABILITY_TRUTH_REGISTRY_SCHEMA,
  CAPABILITY_TRUTH_LIFECYCLES,
  CAPABILITY_TRUTH_REGISTRY,
  getCapabilityTruth,
  listCapabilityTruth,
  getCapabilityTruthForRoute,
  isCapabilityAvailableLocally,
  capabilityTruthSummary,
  buildCapabilityTruthContext
});
