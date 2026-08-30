/**
 * realmworld-workstation.js
 * Private EON City workstation rails.
 *
 * Every user can work inside the official bundled EON City without first
 * creating a personal realm. This module is static/local-first and stores no
 * private workstation data in the public city snapshot.
 */

export const REALMWORLD_WORKSTATION_SCHEMA = 'eon.realmworld.private-workstation.v1';
export const WORKSTATION_MODULES = Object.freeze([
  { id: 'ai-command-desk', label: 'AI Command Desk', icon: '🧠', href: '/chat.html', role: 'Talk to EONBOT, draft prompts, and route tasks into the app.' },
  { id: 'agent-workbench', label: 'Agent Workbench', icon: '🧰', href: '/eon-browser.html', role: 'Control browser cockpit, agents, tools, and automation missions.' },
  { id: 'vault-console', label: 'Vault Console', icon: '🛡️', href: '/vault', role: 'Open local identity, wallet safety, encrypted backup, and API-key panels.' },
  { id: 'market-terminal', label: 'Market Terminal', icon: '🛒', href: '/market', role: 'Browse official EON Team products and your realm commerce rails.' },
  { id: 'realm-builder-pad', label: 'Realm Builder Pad', icon: '🏗️', href: '/realmworld.html#my-realm', role: 'Generate and export your personal realm when you are ready.' },
  { id: 'mission-monitor', label: 'Mission Monitor', icon: '📊', href: '/workbench.html', role: 'Review launch tasks, local progress, and future agent outputs.' }
]);

function clean(value = '', max = 120) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function walletHint(value = '') {
  const wallet = String(value || '').trim().toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(wallet) ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : '';
}

export function buildEonCityPrivateWorkspace(profile = {}, options = {}) {
  const displayName = clean(profile.displayName || profile.username || 'Local Operator', 80) || 'Local Operator';
  const username = clean(profile.username || 'local-operator', 64) || 'local-operator';
  const modules = WORKSTATION_MODULES.map((module, index) => ({
    ...module,
    x: [66, 76, 86, 76, 66, 56][index] ?? 72,
    y: [43, 38, 48, 60, 64, 54][index] ?? 52,
    altitude: [70, 64, 58, 52, 48, 60][index] ?? 54,
    private: true,
    requiresOwnRealm: false,
    serverGameState: false
  }));
  return {
    schema: REALMWORLD_WORKSTATION_SCHEMA,
    id: `workspace-${username.toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 48) || 'local'}`,
    realmId: 'eon-city',
    label: `${displayName}'s Private Workstation`,
    owner: {
      username,
      displayName,
      walletHint: walletHint(profile.wallet || profile.walletAddress || '')
    },
    visibility: 'private-device-only',
    location: {
      districtId: 'city-workbench-tower',
      label: 'Private Workstation Deck',
      x: Number(options.x ?? 76),
      y: Number(options.y ?? 50),
      altitude: Number(options.altitude ?? 86)
    },
    modules,
    capabilities: [
      'ai-chat-control',
      'agent-workbench-launcher',
      'vault-console',
      'market-terminal',
      'realm-builder',
      'mission-monitor',
      'private-workspace-security',
      'local-only-control-room'
    ],
    privacy: {
      publicSnapshot: false,
      syncedToEonCity: false,
      storedInLocalStorageOnly: true,
      p2pSharedByDefault: false,
      sharePresenceOnly: false,
      publicVisitorsCanEnter: false,
      publicVisitorsCanSeeModules: false,
      note: 'The workstation appears inside EON City UI, but its app-control state is private to this browser/device.'
    },
    security: {
      defaultVisibility: 'private',
      allowPublicWorkspaceLinks: false,
      allowVisitorControl: false,
      allowP2PWorkspaceSharing: false,
      safeReason: 'AI chat, wallet, Vault, Workbench, and app-control surfaces must never be shared into the public city or P2P ghost presence by default.'
    },
    network: {
      requiresCloudflareWorker: false,
      requiresCentralGameServer: false,
      polling: false
    }
  };
}

export function buildWorkspaceSessionExport(workspace = {}, options = {}) {
  return {
    schema: 'eon.realmworld.private-workstation-export.v1',
    createdAt: options.now || new Date().toISOString(),
    workspaceId: clean(workspace.id || 'workspace-local', 96),
    realmId: clean(workspace.realmId || 'eon-city', 64),
    label: clean(workspace.label || 'Private Workstation', 96),
    owner: workspace.owner || {},
    modules: Array.isArray(workspace.modules) ? workspace.modules.map((module) => ({
      id: clean(module.id, 64),
      label: clean(module.label, 72),
      href: clean(module.href, 120),
      role: clean(module.role, 180)
    })) : [],
    privateDeviceOnly: true,
    requiresCloudflareWorker: false,
    requiresCentralGameServer: false,
    note: 'This is a local workstation state export. It is not a public EON City update.'
  };
}

export function validateWorkspaceSafety(workspace = {}) {
  const problems = [];
  if (workspace.visibility !== 'private-device-only') problems.push('Workspace must stay private-device-only at launch.');
  if (workspace.privacy?.publicSnapshot === true) problems.push('Private workstation must not be embedded in public city snapshots.');
  if (workspace.privacy?.publicVisitorsCanEnter === true) problems.push('Visitors must not enter a private workstation at launch.');
  if (workspace.security?.allowP2PWorkspaceSharing === true) problems.push('Private workstation must not be shared over P2P by default.');
  if (workspace.network?.requiresCloudflareWorker === true) problems.push('Workspace must not require a Cloudflare Worker game state.');
  if (workspace.network?.requiresCentralGameServer === true) problems.push('Workspace must not require a central game server.');
  return { ok: problems.length === 0, problems };
}
