/**
 * W429 — functional, local-only Babylon Command Deck contract.
 *
 * The deck is a short in-world navigation room. It never renders a user's
 * work, prompts, files, Vault values, account state, provider data or any
 * commercial/reward surface. Native destinations require a second, visible
 * confirmation click; local panels stay inside the current Babylon City.
 */
export const EON_COMMAND_DECK_SCHEMA = 'eon.city.command-deck.w429.v3';

const freeze = (value) => Object.freeze(value);
const NATIVE_ROUTES = new Set(['/', '/forge', '/projects', '/library', '/vault']);
const LOCAL_PANELS = new Set(['eonbot', 'missions', 'settings']);

export const EON_COMMAND_DECK_CARDS = freeze([
  freeze({ id: 'eonbot', kind: 'in-world', panelId: 'eonbot', label: 'EONBOT', detail: 'Plan the next step before leaving City.', accent: 'cyan' }),
  freeze({ id: 'forge', kind: 'native-route', route: '/forge', label: 'EON Forge', detail: 'Build or edit a local web project.', accent: 'violet' }),
  freeze({ id: 'projects', kind: 'native-route', route: '/projects', label: 'Projects', detail: 'Open local work you chose to save.', accent: 'teal' }),
  freeze({ id: 'library', kind: 'native-route', route: '/library', label: 'Library', detail: 'Review saved local outputs and materials.', accent: 'mint' }),
  freeze({ id: 'vault', kind: 'native-route', route: '/vault', label: 'Vault & Collection', detail: 'Open protected settings and collection records.', accent: 'amber' }),
  freeze({ id: 'missions', kind: 'in-world', panelId: 'missions', label: 'Mission Board', detail: 'Review the current local City route.', accent: 'rose' }),
  freeze({ id: 'settings', kind: 'in-world', panelId: 'settings', label: 'City Settings', detail: 'Adjust this device’s graphics and accessibility.', accent: 'slate' })
]);

export const EON_COMMAND_DECK_PRIMARY_CARD_IDS = freeze(['eonbot', 'forge', 'projects', 'library', 'vault']);

/**
 * W592 flagship surface: the full historical deck inventory remains available
 * to source compatibility checks, while first-entry City UI presents only the
 * five work stations a person is most likely to need. City settings and route
 * notes belong in Menu, not beside primary work destinations.
 */
export function getCommandDeckPrimaryCards() {
  return EON_COMMAND_DECK_PRIMARY_CARD_IDS
    .map((id) => EON_COMMAND_DECK_CARDS.find((card) => card.id === id))
    .filter(Boolean)
    .map((card) => freeze({ ...card }));
}

export function getCommandDeckPrimarySummary() {
  return freeze({
    schema: EON_COMMAND_DECK_SCHEMA,
    title: 'Command Deck',
    detail: 'Choose a work station. Native pages open only after a second visible click.',
    cardCount: EON_COMMAND_DECK_PRIMARY_CARD_IDS.length,
    localOnly: true,
    confirmationRequiredForNativeRoutes: true,
    autoNavigation: false,
    commerce: false,
    rewards: false,
    socialConnectors: false
  });
}

export function getCommandDeckCards() {
  return EON_COMMAND_DECK_CARDS.map((card) => ({ ...card }));
}

export function getCommandDeckCard(cardId = '') {
  const id = String(cardId || '').trim();
  const card = EON_COMMAND_DECK_CARDS.find((entry) => entry.id === id);
  return card ? freeze({ ...card }) : null;
}

export function getCommandDeckPanel(cardId = '') {
  const card = getCommandDeckCard(cardId);
  if (!card) return null;
  const local = card.kind === 'in-world';
  return freeze({
    schema: EON_COMMAND_DECK_SCHEMA,
    id: card.id,
    title: card.label,
    detail: card.detail,
    kind: card.kind,
    route: local ? null : card.route,
    panelId: local ? card.panelId : null,
    actionLabel: local
      ? (card.panelId === 'settings' ? 'Open City Settings' : card.panelId === 'missions' ? 'Open Mission Board' : 'Open EONBOT planner')
      : `Open ${card.label}`,
    confirmationRequired: !local,
    localOnly: true,
    readsPrivateWork: false,
    autoNavigation: false
  });
}

export function getCommandDeckSummary() {
  return freeze({
    schema: EON_COMMAND_DECK_SCHEMA,
    title: 'Command Deck',
    detail: 'Choose a station. Native pages open only after a second visible click.',
    cardCount: EON_COMMAND_DECK_CARDS.length,
    localOnly: true,
    remoteTelemetry: false,
    displaysPrivateWork: false,
    autoNavigation: false,
    commerce: false,
    rewards: false,
    socialConnectors: false
  });
}

export function validateCommandDeckCards(cards = EON_COMMAND_DECK_CARDS) {
  const errors = [];
  const ids = new Set();
  const routes = new Set();
  const panels = new Set();
  for (const card of Array.isArray(cards) ? cards : []) {
    const id = String(card?.id || '');
    const kind = String(card?.kind || '');
    if (!/^[a-z0-9-]{2,32}$/.test(id)) errors.push(`Invalid Command Deck card id: ${id || '(empty)'}`);
    if (ids.has(id)) errors.push(`Duplicate Command Deck card id: ${id}`);
    ids.add(id);
    if (!String(card?.label || '').trim() || !String(card?.detail || '').trim()) errors.push(`Incomplete Command Deck card: ${id || '(empty)'}`);
    if (kind === 'native-route') {
      const route = String(card?.route || '');
      if (!NATIVE_ROUTES.has(route)) errors.push(`Unsafe Command Deck route: ${route || '(empty)'}`);
      if (routes.has(route)) errors.push(`Duplicate Command Deck route: ${route}`);
      routes.add(route);
      if (card?.panelId) errors.push(`Native Command Deck card cannot include a local panel: ${id}`);
    } else if (kind === 'in-world') {
      const panelId = String(card?.panelId || '');
      if (!LOCAL_PANELS.has(panelId)) errors.push(`Unsafe Command Deck local panel: ${panelId || '(empty)'}`);
      if (panels.has(panelId)) errors.push(`Duplicate Command Deck local panel: ${panelId}`);
      panels.add(panelId);
      if (card?.route) errors.push(`In-world Command Deck card cannot include a route: ${id}`);
    } else {
      errors.push(`Unknown Command Deck card kind: ${kind || '(empty)'}`);
    }
  }
  if (!Array.isArray(cards) || cards.length < 5 || cards.length > 7) errors.push('Command Deck must expose a compact set of five to seven stations.');
  const serialized = JSON.stringify(cards || []);
  if (/https?:\/\/|payment|token|reward|loot|referral|credential|api[-_ ]?key|social/i.test(serialized)) errors.push('Command Deck contains a forbidden remote, value, credential or social surface.');
  return freeze({ schema: EON_COMMAND_DECK_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true, remoteTelemetry: false });
}
