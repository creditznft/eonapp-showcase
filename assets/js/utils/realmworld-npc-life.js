/**
 * realmworld-npc-life.js
 * Deterministic offline NPC life layer for RealmWorld/EON City.
 *
 * NPCs feel alive even when no real players are present. Positions are derived
 * from time slices and snapshot data, not from a server or public chat feed.
 */

export const REALMWORLD_NPC_LIFE_SCHEMA = 'eon.realmworld.npc-life.v1';

const ACTIONS = Object.freeze(['patrol', 'guide', 'inspect', 'trade', 'celebrate', 'secure']);

function hash(value = '') {
  let h = 2166136261;
  const text = String(value || 'npc');
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(value, min = 4, max = 96) {
  return Math.max(min, Math.min(max, Number(value) || 50));
}

function walkPosition(npc = {}, index = 0, tick = 0) {
  const seed = hash(`${npc.id || npc.name || index}:${tick}`);
  const radius = 3 + (seed % 7);
  const phase = ((tick + index * 17 + (seed % 29)) % 360) * Math.PI / 180;
  return {
    x: clamp(Number(npc.x ?? 50) + Math.cos(phase) * radius),
    y: clamp(Number(npc.y ?? 50) + Math.sin(phase * 0.82) * radius),
    altitude: Number(npc.altitude ?? 30) + ((seed % 5) - 2),
    direction: Math.cos(phase) >= 0 ? 'east' : 'west'
  };
}

export function buildRealmNpcLifeLayer(snapshot = {}, options = {}) {
  const npcs = Array.isArray(snapshot.npcs) ? snapshot.npcs : [];
  const nowMs = Number(options.nowMs ?? Date.now());
  const tick = Number.isFinite(options.tick) ? Number(options.tick) : Math.floor(nowMs / 8000);
  const citizens = npcs.slice(0, Number(options.limit || 10)).map((npc, index) => {
    const position = walkPosition(npc, index, tick);
    const action = ACTIONS[(hash(`${npc.id || npc.name}:${tick}`) + index) % ACTIONS.length];
    return {
      id: `life-${npc.id || index}`,
      sourceNpcId: npc.id || '',
      name: npc.name || `EON Citizen ${index + 1}`,
      role: npc.role || 'City NPC',
      script: npc.script || 'Preset city NPC behavior.',
      emote: npc.emote || 'wave',
      action,
      ...position,
      publicChat: false,
      serverControlled: false,
      uploads: false
    };
  });
  return {
    schema: REALMWORLD_NPC_LIFE_SCHEMA,
    realmId: snapshot.id || 'realmworld',
    tick,
    citizens,
    policy: {
      offlineSimulation: true,
      publicFreeTextChat: false,
      userUploads: false,
      requiresCloudflareWorker: false,
      requiresCentralGameServer: false,
      refreshMs: 8000
    }
  };
}

export function buildNpcInteractionCard(npc = {}) {
  return {
    schema: 'eon.realmworld.npc-interaction-card.v1',
    id: String(npc.id || 'npc-card'),
    title: String(npc.name || 'EON City NPC').slice(0, 80),
    role: String(npc.role || 'City NPC').slice(0, 80),
    action: String(npc.action || 'guide').slice(0, 40),
    body: String(npc.script || 'This NPC uses preset safe copy only.').replace(/[<>]/g, '').slice(0, 220),
    allowedReplies: ['wave', 'spark', 'bow', 'cheer', 'thanks'],
    freeTextChat: false,
    opensUploadDialog: false
  };
}

export function validateNpcLifeSafety(layer = {}) {
  const policy = layer.policy || {};
  const problems = [];
  if (policy.publicFreeTextChat === true) problems.push('NPC life must not enable public free-text chat.');
  if (policy.userUploads === true) problems.push('NPC life must not enable user uploads.');
  if (policy.requiresCloudflareWorker === true) problems.push('NPC life must not require a Cloudflare Worker.');
  if (policy.requiresCentralGameServer === true) problems.push('NPC life must not require a central game server.');
  return { ok: problems.length === 0, problems };
}
