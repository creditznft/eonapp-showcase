/**
 * realm-voxel-engine.js
 * W23 Realm Hub + EON City V2 implementation layer.
 *
 * Dependency-free Canvas/CSS voxel-style city renderer with safe NPCs, portals,
 * world panels, private workstation rails, and deterministic My Realm V2
 * generation. It intentionally avoids public chat, user uploads, external assets,
 * and any Cloudflare Worker game-state dependency for launch.
 */

export const REALM_V23_SCHEMA = 'eon.realm.v23.city-world.v1';

const DISTRICTS = Object.freeze([
  { id: 'spawn', label: 'Spawn Plaza', x: 0, y: 0, h: 2, tone: 'cyan', icon: '⚡', route: '/onboarding.html', panel: 'welcome', role: 'Start here, learn the city, and choose your next action.' },
  { id: 'vault', label: 'Vault Tower', x: -2, y: 1, h: 5, tone: 'blue', icon: '🔐', route: '/vault.html', panel: 'vault', role: 'Backups, recovery status, API provider health, balances, and collectibles.' },
  { id: 'ai', label: 'AI Tower', x: 1, y: -2, h: 6, tone: 'violet', icon: '🧠', route: '/chat.html', panel: 'ai', role: 'EONBOT, AI setup, model discovery, and provider health help.' },
  { id: 'market', label: 'Market Arcade', x: 3, y: 1, h: 3, tone: 'amber', icon: '🛒', route: '/market.html', panel: 'market', role: 'Official store discovery and safe marketplace browsing.' },
  { id: 'store', label: 'EON Team Store', x: 2, y: 3, h: 4, tone: 'gold', icon: '🏪', route: '/marketplace.html?tab=genesis', panel: 'store', role: 'USD open-edition utility upgrades generated after verified payment.' },
  { id: 'referral', label: 'Referral Beacon', x: -3, y: -1, h: 4, tone: 'green', icon: '📣', route: '/vault.html#referrals', panel: 'referral', role: 'Signed Realm links, local share tools, and referral relationship context. No reward campaign is active.' },
  { id: 'trade', label: 'Trade Dome', x: -1, y: 3, h: 3, tone: 'red', icon: '📈', route: '/trade', panel: 'trade', role: 'Research, watchlists, paper trading, and guarded order tickets later.' },
  { id: 'workbench', label: 'Workbench Lab', x: 4, y: -2, h: 3, tone: 'cyan', icon: '🛠️', route: '/workbench.html', panel: 'workbench', role: 'Builder tools, code maker, missions, and campaign execution surfaces.' },
  { id: 'portal', label: 'Portal Hall', x: -4, y: 3, h: 2, tone: 'violet', icon: '🌀', route: '/realmworld.html?engine=lab', panel: 'portal', role: 'Developer/engine lab route; Realm remains the public product front door.' }
]);

const NPCS = Object.freeze([
  { id: 'eonbot-guide', name: 'EONBOT Guide', role: 'City guide', district: 'spawn', icon: '🤖', script: 'Welcome to EON City. Pick AI, Vault, Market, Trade, Workbench, or your private workspace. I use scripted launch-safe help only.' },
  { id: 'vault-keeper', name: 'Vault Keeper', role: 'Recovery NPC', district: 'vault', icon: '🛡️', script: 'Finish encrypted backup, save your recovery phrase, and verify provider keys before depending on AI flows.' },
  { id: 'market-host', name: 'Market Host', role: 'Store NPC', district: 'market', icon: '🛒', script: 'Official EON Team utility items are open-edition USD products. No resale or profit promises.' },
  { id: 'referral-herald', name: 'Referral Herald', role: 'Share NPC', district: 'referral', icon: '📣', script: 'Share a signed Realm link. It is a public identifier, not a reward claim; no reward campaign is active.' },
  { id: 'trade-analyst', name: 'Trade Analyst', role: 'Risk NPC', district: 'trade', icon: '📈', script: 'Trade starts as research and paper mode. AI cannot execute live orders or override risk limits.' },
  { id: 'builder-operator', name: 'Builder Operator', role: 'Workbench NPC', district: 'workbench', icon: '🛠️', script: 'Use Builder Forge for websites, code prompts, campaigns, and automation planning.' }
]);

const PORTALS = Object.freeze([
  { id: 'portal-chat', label: 'AI Tower panel', district: 'ai', href: '/chat.html', icon: '🧠', panel: 'ai', action: 'Open EONBOT full page' },
  { id: 'portal-vault', label: 'Vault Bank panel', district: 'vault', href: '/vault.html', icon: '🔐', panel: 'vault', action: 'Open Vault full page' },
  { id: 'portal-market', label: 'Market Arcade panel', district: 'market', href: '/market.html', icon: '🛒', panel: 'market', action: 'Open Market full page' },
  { id: 'portal-store', label: 'EON Team Store panel', district: 'store', href: '/marketplace.html?tab=genesis', icon: '🏪', panel: 'store', action: 'Open Store full page' },
  { id: 'portal-trade', label: 'Trade Dome panel', district: 'trade', href: '/trade', icon: '📈', panel: 'trade', action: 'Open Trade full page' },
  { id: 'portal-workspace', label: 'Private Workstation', district: 'workbench', href: '#realm-private-workstation', icon: '🧰', panel: 'workspace', action: 'Open private room' },
  { id: 'portal-my-realm', label: 'My Realm Generator', district: 'portal', href: '#realm-my-realm-v2', icon: '🌍', panel: 'my-realm', action: 'Generate personal realm' }
]);

const WORLD_PANELS = Object.freeze({
  welcome: {
    title: 'Spawn Plaza',
    summary: 'EON City is the official bundled world and the first Realm screen.',
    bullets: ['No public chat at launch', 'No uploads in public worlds', 'Works without a game-state server']
  },
  ai: {
    title: 'AI Tower',
    summary: 'Use provider health, model discovery, and EONBOT from a city terminal.',
    bullets: ['Chat panel uses app state', 'Open full page for long sessions', 'No unsafe iframe browsing']
  },
  vault: {
    title: 'Vault Bank',
    summary: 'Vault terminal highlights backups, API health, balances, and collectibles.',
    bullets: ['Encrypted backup first', 'Provider health visible', 'Demo drops stay local']
  },
  market: {
    title: 'Market Arcade',
    summary: 'Marketplace discovery appears as a panel with full-page escape hatch.',
    bullets: ['Official store first', 'Safe purchase wording', 'No profit claims']
  },
  store: {
    title: 'EON Team Store',
    summary: 'Official generated utility NFTs are presented as verified-payment products.',
    bullets: ['Open edition USD items', 'Generated in Vault after proof', 'No manual seller-transfer copy']
  },
  referral: {
    title: 'Referral Beacon',
    summary: 'Share Realm links, social cards, and Pool Points attribution from inside the world.',
    bullets: ['WhatsApp/X/Telegram/Email', 'Visitor referral envelope', 'Local share tracking']
  },
  trade: {
    title: 'Trade Dome',
    summary: 'Research and paper-trading surface only until guarded connectors are proven.',
    bullets: ['AI cannot execute orders', 'Margin disabled by default', 'Risk engine overrides AI']
  },
  workbench: {
    title: 'Workbench Lab',
    summary: 'Builder tools, code maker, website generator, and campaign missions.',
    bullets: ['Launch tasks', 'Campaign drafts', 'Open full cockpit when needed']
  },
  workspace: {
    title: 'Private Workstation Room',
    summary: 'Every user gets a device-local room inside EON City without owning land.',
    bullets: ['Visitors cannot enter', 'API keys never appear in public snapshots', 'Local-only app controls']
  },
  'my-realm': {
    title: 'My Realm Generator V2',
    summary: 'Safe deterministic personal worlds with template objects only.',
    bullets: ['No arbitrary uploads', 'No arbitrary HTML', 'No public free-text signs']
  },
  portal: {
    title: 'Portal Hall',
    summary: 'Developer engine access is available, but Realm remains the public front door.',
    bullets: ['Engine route stays secondary', 'Full voxel clone remains staged', '2D fallback always available']
  }
});

const WORKSTATION_MODULES = Object.freeze([
  { id: 'ai-chat-terminal', label: 'AI Chat Terminal', icon: '🧠', href: '/chat.html', role: 'Talk to EONBOT and inspect provider/model status.' },
  { id: 'vault-backup-console', label: 'Vault Backup Console', icon: '🔐', href: '/vault.html', role: 'Encrypted backup, recovery status, wallet safety, and provider keys.' },
  { id: 'provider-health-console', label: 'Provider Health Console', icon: '🧪', href: '/vault', role: 'Verify keys and working chat models before using paid API calls.' },
  { id: 'referral-campaign-console', label: 'Referral Campaign Console', icon: '📣', href: '/vault.html#referrals', role: 'Create signed links and share cards. No reward campaign is active.' },
  { id: 'workbench-mission-board', label: 'WorkBench Mission Board', icon: '🛠️', href: '/workbench.html', role: 'Website, code, creator, and task missions.' },
  { id: 'market-store-screen', label: 'Market / Store Screen', icon: '🏪', href: '/marketplace.html?tab=genesis', role: 'Official EON Team Store and safe marketplace browsing.' }
]);

const BIOMES = Object.freeze([
  { id: 'neon-city', label: 'Neon City', palette: ['#020617', '#22d3ee', '#8b5cf6', '#facc15'], terrain: 'glass plazas and neon towers' },
  { id: 'vault-mountain', label: 'Vault Mountain', palette: ['#08111f', '#93c5fd', '#64748b', '#34d399'], terrain: 'vault-metal cliffs and safe rooms' },
  { id: 'garden-market', label: 'Garden Market', palette: ['#052e16', '#86efac', '#fbbf24', '#38bdf8'], terrain: 'green trade paths and market booths' },
  { id: 'portal-desert', label: 'Portal Desert', palette: ['#1c0a00', '#fb923c', '#fde68a', '#c4b5fd'], terrain: 'warm dunes and portal gates' }
]);

const SAFE_OBJECT_TEMPLATES = Object.freeze([
  { id: 'spawn-sign', label: 'Welcome Sign', icon: '🪧', text: 'Welcome to this EON Realm.' },
  { id: 'referral-booth', label: 'Referral Booth', icon: '📣', text: 'Share this Realm with a signed public link. No reward campaign is active.' },
  { id: 'store-shelf', label: 'Store Shelf', icon: '🛒', text: 'Browse safe template products.' },
  { id: 'vault-safe', label: 'Vault Safe', icon: '🔐', text: 'Back up before you build.' },
  { id: 'mission-board', label: 'Mission Board', icon: '📋', text: 'Pick a launch task.' },
  { id: 'portal-arch', label: 'Portal Arch', icon: '🌀', text: 'Open app panels safely.' }
]);

const PALETTE = Object.freeze({
  cyan: ['#22d3ee', '#0e7490'],
  blue: ['#93c5fd', '#1d4ed8'],
  violet: ['#c4b5fd', '#7c3aed'],
  amber: ['#facc15', '#b45309'],
  gold: ['#fde68a', '#d97706'],
  green: ['#86efac', '#16a34a'],
  red: ['#fca5a5', '#dc2626']
});

function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hashString(value = '') {
  let hash = 2166136261;
  const text = String(value || 'eon-realm');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seedValue = '') {
  let state = hashString(seedValue) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) / 4294967296);
  };
}

function safeSlug(value = '') {
  return String(value || 'local-operator')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64) || 'local-operator';
}

function iso(x, y, z, originX, originY, tile) {
  return {
    x: originX + (x - y) * tile,
    y: originY + (x + y) * tile * 0.52 - z * tile * 0.72
  };
}

function drawBlock(ctx, x, y, z, h, tone, originX, originY, tile, selected = false) {
  const colors = PALETTE[tone] || PALETTE.cyan;
  const top = iso(x, y, z + h, originX, originY, tile);
  const right = iso(x + 1, y, z + h, originX, originY, tile);
  const bottom = iso(x + 1, y + 1, z + h, originX, originY, tile);
  const left = iso(x, y + 1, z + h, originX, originY, tile);
  const baseRight = iso(x + 1, y, z, originX, originY, tile);
  const baseBottom = iso(x + 1, y + 1, z, originX, originY, tile);
  const baseLeft = iso(x, y + 1, z, originX, originY, tile);

  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(left.x, left.y);
  ctx.closePath();
  ctx.fillStyle = colors[0];
  ctx.globalAlpha = selected ? 1 : 0.92;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(right.x, right.y);
  ctx.lineTo(baseRight.x, baseRight.y);
  ctx.lineTo(baseBottom.x, baseBottom.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.closePath();
  ctx.fillStyle = colors[1];
  ctx.globalAlpha = selected ? 0.9 : 0.72;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.lineTo(baseBottom.x, baseBottom.y);
  ctx.lineTo(baseLeft.x, baseLeft.y);
  ctx.closePath();
  ctx.fillStyle = '#111827';
  ctx.globalAlpha = selected ? 0.68 : 0.58;
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = selected ? 'rgba(250,204,21,.9)' : 'rgba(226,232,240,.25)';
  ctx.lineWidth = selected ? 2 : 1;
  ctx.stroke();
}

function drawGrid(ctx, originX, originY, tile) {
  ctx.strokeStyle = 'rgba(148,163,184,.16)';
  ctx.lineWidth = 1;
  for (let x = -5; x <= 5; x += 1) {
    for (let y = -4; y <= 4; y += 1) {
      const a = iso(x, y, 0, originX, originY, tile);
      const b = iso(x + 1, y, 0, originX, originY, tile);
      const c = iso(x + 1, y + 1, 0, originX, originY, tile);
      const d = iso(x, y + 1, 0, originX, originY, tile);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.closePath();
      ctx.stroke();
    }
  }
}

function renderFallbackDistricts(root) {
  root.classList.add('rl-voxel-fallback');
  root.innerHTML = `<div class="rl-city-fallback">${DISTRICTS.map((district) => `<a href="${esc(district.route)}">${esc(district.icon)} ${esc(district.label)}</a>`).join('')}</div>`;
}

function drawCityCanvas(canvas, root, options = {}) {
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return false;
  const dpr = Math.min(2, (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1);
  const rect = root.getBoundingClientRect?.() || { width: 720, height: 420 };
  const width = Math.max(320, Math.floor(rect.width || 720));
  const height = Math.max(240, Math.floor(Number(options.height || Math.min(440, width * 0.58))));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const originX = width / 2;
  const originY = height * 0.58;
  const tile = Math.max(22, Math.min(38, width / 22));
  const selectedId = String(options.selectedDistrict || 'spawn');

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#08111f');
  grad.addColorStop(0.55, '#111827');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(99,102,241,.18)';
  ctx.beginPath();
  ctx.ellipse(width * 0.5, height * 0.56, width * 0.44, height * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  drawGrid(ctx, originX, originY, tile);
  DISTRICTS.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach((district) => {
    const selected = district.id === selectedId;
    drawBlock(ctx, district.x, district.y, 0, district.h, district.tone, originX, originY, tile, selected);
    const label = iso(district.x + 0.5, district.y + 0.5, district.h + 0.7, originX, originY, tile);
    ctx.font = selected ? '800 13px system-ui, sans-serif' : '700 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(248,250,252,.96)';
    ctx.fillText(district.icon, label.x, label.y - 12);
    ctx.font = selected ? '800 10px system-ui, sans-serif' : '700 10px system-ui, sans-serif';
    ctx.fillText(district.label, label.x, label.y + 4);
  });
  return true;
}

function selectByOffset(currentId, dx, dy) {
  const current = DISTRICTS.find((district) => district.id === currentId) || DISTRICTS[0];
  let best = current;
  let bestScore = Number.POSITIVE_INFINITY;
  DISTRICTS.forEach((district) => {
    if (district.id === current.id) return;
    const vx = district.x - current.x;
    const vy = district.y - current.y;
    const directional = (dx !== 0 ? Math.sign(vx || dx) === Math.sign(dx) : true) && (dy !== 0 ? Math.sign(vy || dy) === Math.sign(dy) : true);
    const distance = Math.abs(vx - dx) + Math.abs(vy - dy) + Math.abs(vx) * 0.2 + Math.abs(vy) * 0.2;
    const score = directional ? distance : distance + 20;
    if (score < bestScore) {
      bestScore = score;
      best = district;
    }
  });
  return best.id;
}

function renderPanel(panelId = 'welcome') {
  const panel = WORLD_PANELS[panelId] || WORLD_PANELS.welcome;
  return `
    <div class="rl-world-panel-card" data-panel="${esc(panelId)}">
      <strong>${esc(panel.title)}</strong>
      <p>${esc(panel.summary)}</p>
      <ul>${panel.bullets.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
    </div>`;
}

function renderWorldShell(root, options = {}) {
  const doc = root.ownerDocument || document;
  const shell = doc.createElement('div');
  shell.className = 'rl-city-world-shell';
  shell.innerHTML = `
    <div class="rl-city-world-head">
      <div>
        <span class="rl-world-kicker">W23 EON City V2</span>
        <h3>Interactive voxel city shell</h3>
      </div>
      <span class="rl-world-mode">Canvas + CSS fallback · safe panels · no public chat</span>
    </div>
    <div class="rl-city-world-layout">
      <div class="rl-city-world-canvas-wrap">
        <canvas class="rl-city-world-canvas" role="img" aria-label="Interactive voxel-style EON City world map"></canvas>
        <div class="rl-city-world-controls" aria-label="EON City controls">
          <button type="button" data-move="0,-1" aria-label="Move north">▲</button>
          <button type="button" data-move="-1,0" aria-label="Move west">◀</button>
          <button type="button" data-move="1,0" aria-label="Move east">▶</button>
          <button type="button" data-move="0,1" aria-label="Move south">▼</button>
        </div>
      </div>
      <div class="rl-city-world-side">
        <div class="rl-world-selected" aria-live="polite"></div>
        <div class="rl-world-panel-output"></div>
        <div class="rl-world-actions">
          <a class="btn btn-primary btn-sm" data-open-route href="/chat">Open Chat</a>
          <button class="btn btn-outline btn-sm" data-open-workspace type="button">Private workspace</button>
          <button class="btn btn-outline btn-sm" data-open-myrealm type="button">Generate My Realm</button>
        </div>
      </div>
    </div>
    <div class="rl-city-world-npcs" aria-label="Scripted EON City NPCs"></div>
    <div class="rl-city-world-portals" aria-label="Safe EON City portals"></div>`;
  root.innerHTML = '';
  root.appendChild(shell);

  const canvas = shell.querySelector('canvas');
  const selected = shell.querySelector('.rl-world-selected');
  const panelOutput = shell.querySelector('.rl-world-panel-output');
  const route = shell.querySelector('[data-open-route]');
  let selectedDistrict = String(options.selectedDistrict || 'spawn');

  const update = () => {
    const district = DISTRICTS.find((item) => item.id === selectedDistrict) || DISTRICTS[0];
    drawCityCanvas(canvas, root, { ...options, selectedDistrict });
    if (selected) {
      selected.innerHTML = `<span>${esc(district.icon)}</span><div><strong>${esc(district.label)}</strong><small>${esc(district.role)}</small></div>`;
    }
    if (panelOutput) panelOutput.innerHTML = renderPanel(district.panel);
    if (route) route.setAttribute('href', district.route);
    shell.querySelectorAll('[data-district]').forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-district') === district.id);
    });
  };

  shell.querySelectorAll('[data-move]').forEach((button) => {
    button.addEventListener('click', () => {
      const [dx, dy] = String(button.getAttribute('data-move') || '0,0').split(',').map(Number);
      selectedDistrict = selectByOffset(selectedDistrict, dx || 0, dy || 0);
      update();
    });
  });

  shell.addEventListener('keydown', (event) => {
    const keyMap = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const vector = keyMap[event.key];
    if (!vector) return;
    event.preventDefault();
    selectedDistrict = selectByOffset(selectedDistrict, vector[0], vector[1]);
    update();
  });
  shell.tabIndex = 0;

  const npcList = shell.querySelector('.rl-city-world-npcs');
  if (npcList) {
    npcList.innerHTML = NPCS.map((npc) => `
      <button type="button" class="rl-world-npc" data-panel="${esc(npc.district)}" title="${esc(npc.script)}">
        <span>${esc(npc.icon)}</span><strong>${esc(npc.name)}</strong><small>${esc(npc.role)}</small>
      </button>`).join('');
    npcList.querySelectorAll('[data-panel]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedDistrict = String(button.getAttribute('data-panel') || 'spawn');
        update();
      });
    });
  }

  const portalList = shell.querySelector('.rl-city-world-portals');
  if (portalList) {
    portalList.innerHTML = PORTALS.map((portal) => `
      <a class="rl-world-portal" href="${esc(portal.href)}" data-portal="${esc(portal.id)}" data-panel="${esc(portal.panel)}">
        <span>${esc(portal.icon)}</span><strong>${esc(portal.label)}</strong><small>${esc(portal.action)}</small>
      </a>`).join('');
    portalList.querySelectorAll('[data-panel]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const href = String(link.getAttribute('href') || '');
        if (href.startsWith('#')) event.preventDefault();
        const panel = String(link.getAttribute('data-panel') || 'welcome');
        const district = PORTALS.find((item) => item.panel === panel)?.district || selectedDistrict;
        selectedDistrict = district;
        update();
        if (href.startsWith('#')) {
          doc.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  shell.querySelector('[data-open-workspace]')?.addEventListener('click', () => {
    doc.getElementById('realm-private-workstation')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  shell.querySelector('[data-open-myrealm]')?.addEventListener('click', () => {
    doc.getElementById('realm-my-realm-v2')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  update();
  return { ok: true, mode: 'interactive-canvas-voxel', districts: getEonCityDistricts(), npcs: getEonCityNpcs(), portals: getEonCityPortals() };
}

export function getEonCityDistricts() {
  return DISTRICTS.map((district) => ({ ...district }));
}

export function getEonCityNpcs() {
  return NPCS.map((npc) => ({ ...npc }));
}

export function getEonCityPortals() {
  return PORTALS.map((portal) => ({ ...portal }));
}

export function getEonCityWorldPanels() {
  return Object.entries(WORLD_PANELS).map(([id, panel]) => ({ id, ...panel, bullets: [...panel.bullets] }));
}

export function getEonCityWorkstationModules() {
  return WORKSTATION_MODULES.map((module) => ({ ...module }));
}

export function getMyRealmV2Biomes() {
  return BIOMES.map((biome) => ({ ...biome, palette: [...biome.palette] }));
}

export function getSafeRealmTemplates() {
  return SAFE_OBJECT_TEMPLATES.map((template) => ({ ...template }));
}

export function buildPrivateWorkstationRoom(profile = {}) {
  const username = safeSlug(profile.username || profile.slug || profile.displayName || 'local-operator');
  const displayName = String(profile.displayName || username || 'Local Operator').replace(/[<>]/g, '').slice(0, 80) || 'Local Operator';
  return {
    schema: 'eon.realm.v23.private-workstation.v1',
    id: `private-workstation-${username}`,
    label: `${displayName}'s Private Workstation`,
    cityDistrict: 'workbench',
    visibility: 'private-device-only',
    modules: getEonCityWorkstationModules(),
    privacy: {
      publicSnapshot: false,
      visitorAccess: false,
      p2pSharedByDefault: false,
      apiKeysRenderedInPublic: false,
      vaultStateRenderedInPublic: false,
      storedInLocalStorageOnly: true
    },
    network: {
      requiresCloudflareWorker: false,
      requiresCentralGameServer: false,
      polling: false
    }
  };
}

export function buildMyRealmV2(profile = {}, options = {}) {
  const username = safeSlug(profile.username || profile.slug || profile.displayName || 'local-operator');
  const seed = String(options.seed || profile.seed || `eon:realm:v2:${username}`);
  const rng = seeded(seed);
  const biome = BIOMES[Math.floor(rng() * BIOMES.length)] || BIOMES[0];
  const templates = SAFE_OBJECT_TEMPLATES.map((template, index) => ({
    ...template,
    x: Math.round(12 + rng() * 76),
    y: Math.round(12 + rng() * 76),
    altitude: Math.round(20 + rng() * 38),
    order: index
  }));
  return {
    schema: 'eon.realm.v23.my-realm-generator.v2',
    owner: {
      username,
      displayName: String(profile.displayName || username || 'Local Operator').replace(/[<>]/g, '').slice(0, 80)
    },
    seed,
    biome: { ...biome, palette: [...biome.palette] },
    terrain: biome.terrain,
    objects: templates,
    npcs: [
      { id: 'my-realm-guide', name: 'Realm Guide', role: 'Welcome NPC', script: 'Explains this generated Realm using preset safe copy.', x: 50, y: 45 },
      { id: 'my-realm-store-host', name: 'Store Host', role: 'Store NPC', script: 'Shows template product shelves and referral booth only.', x: 62, y: 55 },
      { id: 'my-realm-operator', name: 'Builder Operator', role: 'Mission NPC', script: 'Routes the owner to WorkBench, Vault, and campaign tools.', x: 42, y: 60 }
    ],
    panels: ['welcome', 'vault', 'market', 'referral', 'workbench'],
    safety: {
      noUserUploads: true,
      noPublicChat: true,
      noArbitraryHtml: true,
      templateTextOnly: true,
      cloudflareWorkerRequired: false,
      centralGameServerRequired: false,
      p2pInviteOnlyGhosts: true
    },
    export: {
      arweaveReadyLater: true,
      localSnapshotOnly: true,
      contentType: 'application/json'
    }
  };
}

export function buildEonCityState(profile = {}) {
  return {
    schema: REALM_V23_SCHEMA,
    cityId: 'eon-city-v2',
    label: 'EON City V2',
    defaultEntry: '/realm',
    engineName: 'RealmWorld',
    publicProductName: 'Realm',
    districts: getEonCityDistricts(),
    npcs: getEonCityNpcs(),
    portals: getEonCityPortals(),
    panels: getEonCityWorldPanels(),
    privateWorkstation: buildPrivateWorkstationRoom(profile),
    myRealmV2: buildMyRealmV2(profile),
    controls: {
      desktop: ['arrow-keys', 'district-buttons', 'portal-click'],
      mobile: ['large-buttons', 'touch-friendly-cards', 'portrait-fallback'],
      landscapeRecommended: true
    },
    safety: {
      publicChat: false,
      userUploads: false,
      arbitraryHtml: false,
      externalIframes: false,
      cloudflareWorkerGameState: false,
      p2p: 'invite-first-ghost-only-no-chat'
    }
  };
}

export function validateRealmV23Safety(state = {}) {
  const problems = [];
  const safety = state.safety || {};
  if (safety.publicChat !== false) problems.push('Public chat must stay disabled for W23 launch.');
  if (safety.userUploads !== false) problems.push('User uploads must stay disabled in public worlds.');
  if (safety.externalIframes !== false) problems.push('Critical app panels must not rely on external iframes.');
  if (safety.cloudflareWorkerGameState !== false) problems.push('W23 must not require a Cloudflare Worker game-state server.');
  if (state.privateWorkstation?.privacy?.visitorAccess !== false) problems.push('Private workstation visitor access must be false.');
  if (state.privateWorkstation?.privacy?.apiKeysRenderedInPublic !== false) problems.push('API keys must never render in public world snapshots.');
  if (state.myRealmV2?.safety?.noArbitraryHtml !== true) problems.push('My Realm V2 must reject arbitrary HTML.');
  return { ok: problems.length === 0, problems };
}

export function mountRealmVoxelPrototype(root, options = {}) {
  if (!root) return { ok: false, reason: 'missing-root' };
  const doc = root.ownerDocument || document;
  const canvas = root.querySelector('canvas') || doc.createElement('canvas');
  canvas.width = Number(options.width || 720);
  canvas.height = Number(options.height || 420);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Voxel-style EON City preview with Vault Tower, AI Tower, Market Arcade, EON Team Store, Referral Beacon, Trade Dome, Workbench Lab, and Portal Hall.');
  if (!canvas.parentElement) root.appendChild(canvas);

  const ok = drawCityCanvas(canvas, root, options);
  if (!ok) {
    renderFallbackDistricts(root);
    return { ok: true, mode: 'fallback', districts: getEonCityDistricts() };
  }

  return { ok: true, mode: 'canvas-2d-voxel', districts: getEonCityDistricts() };
}

export function mountEonCityWorld(root, options = {}) {
  if (!root) return { ok: false, reason: 'missing-root' };
  const doc = root.ownerDocument || document;
  const canvas = doc.createElement('canvas');
  if (!canvas.getContext?.('2d')) {
    renderFallbackDistricts(root);
    return { ok: true, mode: 'fallback', districts: getEonCityDistricts(), npcs: getEonCityNpcs(), portals: getEonCityPortals() };
  }
  return renderWorldShell(root, options);
}

export function renderPrivateWorkstationHtml(profile = {}) {
  const room = buildPrivateWorkstationRoom(profile);
  return `
    <div class="rl-workstation-card">
      <div><span class="rl-world-kicker">Private workstation</span><h3>${esc(room.label)}</h3></div>
      <p>Device-local room inside EON City. Visitors, P2P ghosts, and public snapshots cannot see or control it.</p>
      <div class="rl-workstation-grid">
        ${room.modules.map((module) => `
          <a class="rl-workstation-module" href="${esc(module.href)}">
            <span>${esc(module.icon)}</span><strong>${esc(module.label)}</strong><small>${esc(module.role)}</small>
          </a>`).join('')}
      </div>
      <div class="rl-world-safety-strip">API keys and Vault state never render into public Realm snapshots.</div>
    </div>`;
}

export function renderMyRealmV2Html(profile = {}, options = {}) {
  const realm = buildMyRealmV2(profile, options);
  return `
    <div class="rl-myrealm-v2-card">
      <div><span class="rl-world-kicker">My Realm Generator V2</span><h3>${esc(realm.owner.displayName || realm.owner.username)} · ${esc(realm.biome.label)}</h3></div>
      <p>Deterministic safe world from local profile seed: ${esc(realm.terrain)}.</p>
      <div class="rl-myrealm-object-grid">
        ${realm.objects.map((object) => `
          <div class="rl-myrealm-object">
            <span>${esc(object.icon)}</span><strong>${esc(object.label)}</strong><small>${esc(object.text)}</small>
          </div>`).join('')}
      </div>
      <div class="rl-world-safety-strip">No arbitrary uploads · no arbitrary HTML · no public free-text chat · template signs only.</div>
    </div>`;
}
