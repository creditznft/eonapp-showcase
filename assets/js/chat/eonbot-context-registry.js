/**
 * EONAPP W228 product context registry for EONBOT.
 * Public facts only: no Vault values, credentials, private chat history or
 * browser-local Realm/Market data are included in an AI prompt.
 */
export const EON_PRODUCT_CONTEXT_VERSION = 'institutional-product-context-v6';

export const EON_ROUTE_MANIFEST = Object.freeze([
  { id: 'chat', route: '/', label: 'Chat', purpose: 'Start with EONBOT, voice input where supported, and local threads.', status: 'available' },
  { id: 'projects', route: '/projects', label: 'Projects', purpose: 'Organize saved work and approved next steps.', status: 'available-local' },
  { id: 'library', route: '/library', label: 'Library', purpose: 'Reuse saved prompts and outputs.', status: 'available-local' },
  { id: 'create', route: '/create', label: 'Create', purpose: 'Start Image, Video, Music, Website / Forge, Project / Document, Automation or Guide from one beginner-first screen.', status: 'available' },
  { id: 'workspace', route: '/workspace', label: 'Advanced Workspace', purpose: 'Use compatibility planning and reviewed tool drafts only when a deeper surface is needed.', status: 'advanced-compatibility' },
  { id: 'automations', route: '/automations', label: 'Automations', purpose: 'Draft, simulate and approve workflows before any external effect.', status: 'local-simulation' },
  { id: 'local-ai', route: '/local-ai', label: 'Local AI', purpose: 'Open Make Local AI ready: use Local Lite on compatible browsers or self-test a supported installed desktop runtime; a Companion installer appears only after platform certification.', status: 'device-dependent' },
  { id: 'market', route: '/create?mode=image', label: 'Create an image', purpose: 'Use the canonical Create image path; the old Market/Preview Studio route is compatibility-only.', status: 'compatibility-redirect' },
  { id: 'vault', route: '/vault', label: 'Vault', purpose: 'Manage local profile, backup, recovery and approved connected settings.', status: 'sensitive-local' },
  { id: 'insights', route: '/insights', label: 'Research Lab', purpose: 'Local research and uncertainty review only.', status: 'local-research-only' },
  { id: 'eoncity', route: '/eoncity', label: 'EON City', purpose: 'Enter the direct Babylon Command District with an in-world Command Deck and same-route safe recovery.', status: 'direct-babylon-city' },
  { id: 'profile', route: '/profile', label: 'Profile & Share Center', purpose: 'Manage a local profile, appearance and safe invite drafts.', status: 'available-local' },
  { id: 'realm-studio', route: '/eoncity', label: 'EON City', purpose: 'Use the canonical EON City destination; Realm naming is compatibility-only.', status: 'compatibility-redirect' },
  { id: 'rewards-status', route: '/rewards', label: 'Access status', purpose: 'Explain that no reward, conversion, payout, or token program is active.', status: 'disabled-no-active-program' }
]);

export const EON_CAPABILITY_MANIFEST = Object.freeze([
  { id: 'local-ai', keywords: ['local ai', 'offline', 'ollama', 'lm studio', 'model install', 'download model', 'local model', 'phi model', 'phi'], routeId: 'local-ai', availability: 'device-dependent', confirmation: 'none' },
  { id: 'create', keywords: ['build', 'create', 'image', 'video', 'music', 'song', 'track', 'dj', 'radio', 'website', 'document', 'new project'], routeId: 'create', availability: 'available', confirmation: 'none' },
  { id: 'music', keywords: ['music', 'song', 'beat', 'track', 'lyrics', 'auto dj', 'dj mix', 'radio', 'soundtrack'], routeId: 'create', availability: 'plan-and-capability-routed', confirmation: 'generation-runtime-dependent' },
  { id: 'workspace', keywords: ['workspace', 'advanced tools', 'analyze data'], routeId: 'workspace', availability: 'advanced-compatibility', confirmation: 'none' },
  { id: 'automations', keywords: ['automate', 'automation', 'schedule', 'workflow', 'repeat'], routeId: 'automations', availability: 'simulate-first', confirmation: 'external-effects' },
  { id: 'market', keywords: ['market', 'nft', 'preview', 'generate item', 'generate preview'], routeId: 'market', availability: 'local-preview-only', confirmation: 'none' },
  { id: 'vault', keywords: ['vault', 'backup', 'receipt', 'api key', 'profile', 'secure'], routeId: 'vault', availability: 'sensitive-local', confirmation: 'sensitive-action' },
  { id: 'insights', keywords: ['research lab', 'research', 'trade', 'trading', 'chart', 'market research', 'scenario'], routeId: 'insights', availability: 'local-research-only', confirmation: 'live-execution-not-available' },
  { id: 'eoncity', keywords: ['3d eon city', 'eon city 3d', 'city 3d', 'spatial command space', 'city tour'], routeId: 'eoncity', availability: 'device-adaptive', confirmation: 'device-choice' },
  { id: 'realm-studio', keywords: ['realm studio', 'my realm', 'create realm', 'edit realm'], routeId: 'realm-studio', availability: 'local-only', confirmation: 'none' },
  { id: 'eoncity', keywords: ['eon city', 'city', 'realm', 'operator map', '2d map', 'world', 'enter city'], routeId: 'eoncity', availability: 'spatial-work-portal', confirmation: 'none' },
  { id: 'profile', keywords: ['rewards', 'reward', 'offerwall', 'earn', 'credits', 'access status', 'limits'], routeId: 'profile', availability: 'no-active-program', confirmation: 'none' },
  { id: 'share', keywords: ['share', 'referral', 'invite', 'qr', 'promote'], routeId: 'profile', availability: 'local-signed-invites', confirmation: 'user-review-before-posting' },
  { id: 'voice', keywords: ['voice', 'microphone', 'speak', 'dictate'], routeId: 'chat', availability: 'browser-dependent', confirmation: 'microphone-permission' }
]);

function normalize(value = '') { return String(value || '').toLowerCase().replace(/[^a-z0-9\s/-]/g, ' ').replace(/\s+/g, ' ').trim(); }
function findRoute(id = '') { return EON_ROUTE_MANIFEST.find((entry) => entry.id === id) || null; }

export function inferEonbotCapability(input = '') {
  const text = normalize(input);
  if (!text) return null;
  let best = null;
  for (const capability of EON_CAPABILITY_MANIFEST) {
    const score = capability.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? keyword.length : 0), 0);
    if (!best || score > best.score) best = { capability, score };
  }
  return best?.score ? best.capability : null;
}

export function buildEonbotRoutePlan(input = '') {
  const capability = inferEonbotCapability(input);
  if (!capability) return null;
  const route = findRoute(capability.routeId);
  if (!route) return null;
  return Object.freeze({
    version: EON_PRODUCT_CONTEXT_VERSION,
    capabilityId: capability.id,
    route: route.route,
    label: route.label,
    availability: capability.availability,
    confirmation: capability.confirmation,
    purpose: route.purpose
  });
}

export function buildEonbotContextSlice(options = {}) {
  const input = String(options.input || '');
  const routePlan = buildEonbotRoutePlan(input);
  const currentPath = String(options.currentPath || '/');
  const selectedRoutes = routePlan
    ? [findRoute('chat'), findRoute(routePlan.capabilityId === 'share' ? 'profile' : routePlan.capabilityId), findRoute('local-ai')].filter(Boolean)
    : [findRoute('chat'), findRoute('create'), findRoute('local-ai')].filter(Boolean);
  const routeLines = selectedRoutes.map((entry) => `- ${entry.label} (${entry.route}): ${entry.purpose} Status: ${entry.status}.`).join('\n');
  const capabilityLine = routePlan
    ? `Current user intent: ${routePlan.capabilityId}. Route to ${routePlan.label} at ${routePlan.route}. Availability: ${routePlan.availability}. Confirmation: ${routePlan.confirmation}.`
    : 'Current user intent is general guidance. Ask one brief clarifying question only when needed.';
  return Object.freeze({
    version: EON_PRODUCT_CONTEXT_VERSION,
    currentPath,
    routePlan,
    prompt: `Current EONAPP capability context:
${capabilityLine}
Relevant routes:
${routeLines}

Truth rules:
- Never claim provider connectivity, a completed offer, payment, referral conversion, trade order or public publishing without verified evidence.
- Referral/EONKEY availability is server-authoritative and rollout-controlled. Do not infer active or inactive without current server evidence. Raw sharing, clicks, impressions, posts and time never create referral value by themselves.
- Local AI is device-dependent and cannot browse, post, trade or call cloud tools without a separately approved connected path.
- Vault Reveals are local, non-financial visuals; old Market and Preview Studio naming is compatibility-only.
- Research Lab is local research and uncertainty review only; it has no broker, exchange, order or paper-trading path.
- Never ask for, display or repeat recovery phrases, passwords, API keys, private keys or exchange secrets.`
  });
}

export function listPublicEonbotCapabilities() {
  return EON_CAPABILITY_MANIFEST.map((entry) => ({ id: entry.id, routeId: entry.routeId, availability: entry.availability, confirmation: entry.confirmation }));
}
