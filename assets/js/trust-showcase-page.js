import { translateForUser } from './utils/multi-language.js';

const TRUST_STATIC = {
  local: [
    'Vault secrets stay device-local by default.',
    'Guide Mode can work without provider keys.',
    'Browser approval memory is temporary and scoped.',
    'Backups are designed around encrypted export, not hidden central custody.'
  ],
  approvals: [
    'Browser submit and sensitive actions always need review.',
    'Wallet / contract actions always need explicit approval.',
    'Financial checkout remains user-completed.',
    'CAPTCHA and anti-bot challenges stay manual.'
  ],
  notDo: [
    'EONAPP does not silently sell your API access.',
    'EONAPP does not pretend browser mic input equals full AI capability.',
    'EONAPP does not bypass CAPTCHA automatically.',
    'EONAPP does not expose your password vault directly to the AI model.'
  ],
  readHow: [
    'This page shows selected real code surfaces and architecture rules.',
    'The full product remains proprietary.',
    'Trust-critical surfaces can still be inspected here.',
    'Use this explorer to understand storage, approvals, and key handling.'
  ],
  openList: [
    'Trust explanations and architecture docs',
    'Selected security-critical code snippets',
    'Approval model and local-first storage explanations',
    'Public screenshots and trust-oriented walkthroughs',
    'Curated Code Showcase snippets with private implementation removed',
    'Sponsor Boost policy examples that prove ads stay opt-in and local-only'
  ],
  closedList: [
    'Full orchestration logic',
    'Marketplace/business growth engine',
    'Full proprietary UI logic and system glue',
    'Private monetization and competitive workflow layers'
  ],
  publicRepoList: [
    'Architecture diagrams',
    'Screenshots and walkthroughs',
    'Selected trust modules',
    'Key-handling / approval / local-storage explanations'
  ]
};

const TRUST_MODULES = [
  {
    id: 'keys',
    label: 'API key safety',
    path: 'assets/js/utils/secure-keystore.js',
    summary: 'Shows the local-first key storage direction and why provider/API secrets are treated as trust-critical.',
    why: 'Users need confidence that their paid API keys are not casually exposed or shipped to a central server by default.',
    tags: ['local-first', 'keys', 'vault', 'trust'],
    points: [
      'Keys belong in the local vault path first.',
      'Guide Mode works without keys, but real provider AI needs configured secrets or local runtime.',
      'The trust model should always explain where secrets live and when they are used.'
    ],
    code: `// Secure keystore surface (selected snippet)\nexport async function saveApiKey(providerId, secret) {\n  // store device-local secret\n  // encrypt before persistence\n  // return masked state for UI\n}\n\nexport async function loadApiKey(providerId) {\n  // local-only retrieval\n}\n`
  },
  {
    id: 'browser',
    label: 'Browser approvals',
    path: 'assets/js/utils/browser-approval.js',
    summary: 'Shows how browser actions are classified so drafts can move fast while submit/sensitive actions remain reviewed.',
    why: 'Browser automation is powerful, but user trust breaks fast if the product feels like it can click anything without consent.',
    tags: ['browser', 'approval', 'safety', 'automation'],
    points: [
      'Read and draft flows can be smoother.',
      'Submit and sensitive actions need explicit review.',
      'Host/risk context should stay visible to the user.'
    ],
    code: `export function classifyBrowserAction(input) {\n  if (input.kind === 'sensitive') return { approval: 'required' };\n  if (input.kind === 'submit') return { approval: 'required' };\n  if (input.kind === 'draft') return { approval: 'review-light' };\n  return { approval: 'low-risk' };\n}\n`
  },
  {
    id: 'router',
    label: 'Auto routing',
    path: 'assets/js/utils/eon-auto-router.js',
    summary: 'Shows the product rule that EONAPP should choose the most sensible path first, then fall back cleanly.',
    why: 'Non-technical users should not have to understand model/provider selection just to get work done.',
    tags: ['auto-mode', 'routing', 'local-ai', 'fallback'],
    points: [
      'Guide first when nothing is connected.',
      'Use local runtime where it fits.',
      'Use provider fallback where needed.',
      'Explain routing simply to the user.'
    ],
    code: `export function buildAutoRoutePlan(ctx) {\n  if (!ctx.hasProvider && !ctx.hasLocal) return { providerType: 'guide' };\n  if (ctx.prefersLocal && ctx.hasLocal) return { providerType: 'local' };\n  if (ctx.hasFreeProvider) return { providerType: 'free-provider' };\n  return { providerType: 'premium-provider' };\n}\n`
  },
  {
    id: 'backup',
    label: 'Backup & recovery',
    path: 'assets/js/local-first/eon-data-continuity.js',
    summary: 'Shows the active local-first recovery truth: encrypted Capsule export/import now, with Google Drive retained as a separately-consented future snapshot connector.',
    why: 'A trust-sensitive app needs credible recovery without pretending that identity login, storage handoff, or a secondary device has already become sync.',
    tags: ['backup', 'recovery', 'encrypted-capsule', 'local-first'],
    points: [
      'Create an encrypted Capsule and keep its passphrase separately.',
      'Keep at least one offline copy and rehearse a restore before relying on it.',
      'Google Drive is a future explicit encrypted-snapshot lane, never implied by ordinary Google Login.'
    ],
    code: `export function getEonDataContinuityLabel() {
  return 'Manual encrypted continuity is active. '
    + 'Automatic multi-device sync and Google Drive connection are not active.';
}
`
  },

  {
    id: 'sponsor-boost',
    label: 'Sponsor Boost safety',
    path: 'assets/js/ads/sponsor-boost-ceo-rules.js',
    summary: 'Shows the public rule that Direct Link and MultiTag are optional local Sponsor Boost paths, not paid entitlement proof.',
    why: 'Trust depends on keeping monetization opt-in, clear, and blocked from sensitive pages instead of making the app feel spammy.',
    tags: ['monetization', 'opt-in', 'ads', 'rewards'],
    points: [
      'MultiTag stays off until the user chooses it.',
      'Direct Link opens only after a clear user tap.',
      'Only verified rewarded ads plus postback can unlock account-wide reward value.',
      'Billing, legal, privacy, support, admin, and Vault secret pages stay clean.'
    ],
    code: `export function evaluateSponsorBoost(ctx) {
  if (ctx.routeIsSensitive) return { allowed: false };
  if (!ctx.userOptedIn) return { allowed: false, prompt: 'ask-first' };
  return { allowed: true, rewardScope: 'local-soft-boost-only' };
}
`
  },
  {
    id: 'eonbot-operator',
    label: 'EONBOT command operator',
    path: 'assets/js/chat/eonbot-app-operator.js',
    summary: 'Shows how EONBOT can guide or route the whole app while asking before sensitive actions.',
    why: 'The user should be able to control EONAPP by text or voice without giving the bot unsafe permission to mutate payments, Vault data, microphone, or ads silently.',
    tags: ['eonbot', 'commands', 'voice', 'approval'],
    points: [
      'Navigation commands can be fast.',
      'Voice, ads, backup, payment, and wallet commands require confirmation.',
      'EONBOT should explain rewards and Sponsor Boost in plain language.',
      'The same safe command rules apply to microphone input.'
    ],
    code: `export function classifyEonbotCommand(text) {
  if (/wallet|payment|backup|microphone|sponsor boost/i.test(text)) return 'confirm-first';
  if (/open|show|explain|guide/i.test(text)) return 'safe-navigation-or-answer';
  return 'guide-mode';
}
`
  },
  {
    id: 'mobile-game-ux',
    label: 'Mobile game UX guard',
    path: 'assets/js/realm3d/engine/EonCityMobileUxPerfectionRuntime.js',
    summary: 'Shows the rule that mobile overlays must never trap gameplay or hide the city without visible close/minimize controls.',
    why: 'EON City is the visual hero; mobile users must not be blocked by panels they cannot close.',
    tags: ['eon-city', 'mobile', 'gameplay', 'ux'],
    points: [
      'Every game panel needs close or minimize affordance.',
      'Portrait and landscape must keep controls reachable.',
      'Sponsor Boost panels must not cover active gameplay by default.',
      'The user can hide UI and reset camera quickly.'
    ],
    code: `export function enforceMobileGamePanel(panel) {
  panel.dataset.mustClose = 'true';
  panel.dataset.mustMinimize = 'true';
  panel.classList.add('eoncity-mobile-safe-panel');
  return panel;
}
`
  },
  {
    id: 'nft',
    label: 'Utility NFT model',
    path: 'assets/js/utils/nft-utility-catalog.js',
    summary: 'Shows the offchain-first utility NFT model with permanence, data-bundle rules, and optional onchain bridge.',
    why: 'Users should understand that NFTs in EONAPP are not only decorative; they can carry utility, permanence, and unlocks.',
    tags: ['nft', 'utility', 'offchain-first', 'arweave'],
    points: [
      'Utility NFTs can be offchain-first.',
      'Permanent/data-bearing assets should anchor before optional onchain bridge.',
      'Collector visuals and rarity can stay while utility remains central.'
    ],
    code: `export function buildUtilityBundleChecklist(type) {\n  return [\n    'Bundle utility data',\n    'Anchor to permanence rail',\n    'Prefer internal market first',\n    'Bridge onchain later if needed'\n  ];\n}\n`
  }
];

function esc(text='') {
  return String(text).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function t(text) {
  try {
    const lang = document?.documentElement?.lang || localStorage.getItem('eonapp_language') || 'en';
    return await translateForUser(String(text || ''), { toLang: lang, category: 'guide' });
  } catch {
    return String(text || '');
  }
}

async function fillList(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  const li = await Promise.all(items.map(async (item) => `<li>${esc(await t(item))}</li>`));
  el.innerHTML = li.join('');
}

async function renderModule(id) {
  const mod = TRUST_MODULES.find((m) => m.id === id) || TRUST_MODULES[0];
  document.getElementById('trust-module-summary').textContent = await t(mod.summary);
  document.getElementById('trust-module-why').textContent = await t(mod.why);
  document.getElementById('trust-module-path').textContent = mod.path;
  document.getElementById('trust-code').textContent = mod.code;
  document.getElementById('trust-module-tags').innerHTML = mod.tags.map((tag) => `<span class="trust-tag">${esc(tag)}</span>`).join('');
  const li = await Promise.all(mod.points.map(async (item) => `<li>${esc(await t(item))}</li>`));
  document.getElementById('trust-module-points').innerHTML = li.join('');
  const copyBtn = document.getElementById('trust-copy-snippet');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try { await navigator.clipboard.writeText(mod.code); copyBtn.textContent = await t('Copied'); }
      catch { copyBtn.textContent = await t('Copy failed'); }
      setTimeout(async () => { copyBtn.textContent = await t('Copy snippet'); }, 1200);
    };
  }
}

async function init() {
  await fillList('trust-local-list', TRUST_STATIC.local);
  await fillList('trust-approval-list', TRUST_STATIC.approvals);
  await fillList('trust-not-list', TRUST_STATIC.notDo);
  await fillList('trust-read-list', TRUST_STATIC.readHow);
  await fillList('trust-open-list', TRUST_STATIC.openList);
  await fillList('trust-closed-list', TRUST_STATIC.closedList);
  await fillList('trust-public-repo-list', TRUST_STATIC.publicRepoList);

  const sel = document.getElementById('trust-module-select');
  sel.innerHTML = (await Promise.all(TRUST_MODULES.map(async (m) => `<option value="${esc(m.id)}">${esc(await t(m.label))}</option>`))).join('');
  sel.addEventListener('change', () => renderModule(sel.value));
  await renderModule(TRUST_MODULES[0].id);
}
init();
