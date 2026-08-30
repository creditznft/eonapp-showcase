/**
 * W404 — Creator Atrium local navigation contract.
 *
 * EON City can make creator and Forge work feel present without duplicating an
 * editor, reading a project, touching credentials, retaining media, or starting
 * a provider job. This registry is a small allowlisted launch board only.
 */
export const EON_CITY_CREATOR_ATRIUM_SCHEMA = 'eon.city.creator-atrium.w404.v1';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_CREATOR_ATRIUM_CARDS = freeze([
  freeze({ id: 'creator-engine', label: 'Creator Engine', detail: 'Plan image, video, voice and campaign work with an honest local, configured, or draft path.', route: '/workspace#creator-engine', accent: 'cyan' }),
  freeze({ id: 'forge-bay', label: 'Forge Bay', detail: 'Build, inspect and export a local site project in the native Forge workspace.', route: '/forge', accent: 'violet' }),
  freeze({ id: 'local-media', label: 'Local Media Path', detail: 'Check a device-aware local image and video setup before you install or run anything.', route: '/local-ai#creator-media', accent: 'mint' }),
  freeze({ id: 'asset-receipts', label: 'Asset Receipts', detail: 'Record source context and a lean media plan before a future review step.', route: '/workspace#eon-asset-provenance-title', accent: 'amber' })
]);

export function getCityCreatorAtriumCards() {
  return EON_CITY_CREATOR_ATRIUM_CARDS.map((card) => ({ ...card }));
}

export function getCityCreatorAtriumSummary() {
  return freeze({
    schema: EON_CITY_CREATOR_ATRIUM_SCHEMA,
    title: 'Creator Atrium',
    detail: 'A local City launch board for creator planning and Forge. It mirrors no project, file, provider, account, media, or private chat data.',
    cardCount: EON_CITY_CREATOR_ATRIUM_CARDS.length,
    localOnly: true,
    remoteTelemetry: false,
    displaysPrivateWork: false,
    mediaBodies: false,
    providerCalls: false,
    credentials: false,
    autoNavigation: false,
    codeEditor: false,
    mediaEditor: false
  });
}

export function validateCityCreatorAtriumCards(cards = EON_CITY_CREATOR_ATRIUM_CARDS) {
  const errors = [];
  const ids = new Set();
  const routes = new Set();
  for (const card of Array.isArray(cards) ? cards : []) {
    const id = String(card?.id || '');
    const route = String(card?.route || '');
    if (!/^[a-z0-9-]{2,32}$/.test(id)) errors.push(`Invalid Creator Atrium card id: ${id || '(empty)'}`);
    if (ids.has(id)) errors.push(`Duplicate Creator Atrium card id: ${id}`);
    ids.add(id);
    if (!/^\/(?:workspace(?:#(?:creator-engine|eon-asset-provenance-title))?|forge|local-ai#creator-media)$/.test(route)) errors.push(`Unsafe Creator Atrium route: ${route || '(empty)'}`);
    if (routes.has(route)) errors.push(`Duplicate Creator Atrium route: ${route}`);
    routes.add(route);
    if (!String(card?.label || '').trim() || !String(card?.detail || '').trim()) errors.push(`Incomplete Creator Atrium card: ${id || '(empty)'}`);
  }
  if (!Array.isArray(cards) || cards.length < 3 || cards.length > 5) errors.push('Creator Atrium must expose a compact set of three to five destinations.');
  const serialized = JSON.stringify(cards || []);
  if (/https?:\/\/|wallet|payment|token|reward|loot|referral|credential|api[-_ ]?key|social|publish|schedule|account/i.test(serialized)) errors.push('Creator Atrium contains a forbidden remote, value, credential, publishing, or account surface.');
  return freeze({ schema: EON_CITY_CREATOR_ATRIUM_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true, remoteTelemetry: false });
}
