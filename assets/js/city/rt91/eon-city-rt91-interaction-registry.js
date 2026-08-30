/** RT91 — interaction truth registry: significant objects are interactive or explicitly decorative. */
export const EON_CITY_RT91_INTERACTION_REGISTRY_SCHEMA = 'eon.city.interaction-registry.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();

export function defineEonCityRt91Interaction({ id = '', worldId = '', label = '', kind = 'interactive', action = '', prompt = '', range = 0, condition = 'always', authority = '', destination = '' } = {}) {
  const decorative = kind === 'decorative';
  return freeze({
    id: clean(id),
    worldId: clean(worldId),
    label: String(label || '').trim(),
    kind: decorative ? 'decorative' : 'interactive',
    action: decorative ? '' : clean(action),
    prompt: decorative ? '' : String(prompt || '').trim(),
    range: decorative ? 0 : Math.max(0, Number(range) || 0),
    condition: String(condition || 'always').trim(),
    authority: decorative ? '' : clean(authority),
    destination: decorative ? '' : String(destination || '').trim(),
    pickable: !decorative,
    grantsProgressionAutomatically: false,
    storesPrivateContent: false
  });
}

export function createEonCityRt91InteractionRegistry(entries = []) {
  return freeze({
    schema: EON_CITY_RT91_INTERACTION_REGISTRY_SCHEMA,
    entries: freeze([...(entries || [])]),
    objectCount: entries?.length || 0,
    noAmbiguousSignificantObjects: true,
    ownsRenderLoop: false
  });
}

export function validateEonCityRt91InteractionRegistry(registry = {}) {
  const errors = [];
  const ids = new Set();
  if (registry?.schema !== EON_CITY_RT91_INTERACTION_REGISTRY_SCHEMA) errors.push('schema');
  for (const entry of registry?.entries || []) {
    if (!entry?.id || ids.has(entry.id)) errors.push(`id:${entry?.id || 'missing'}`);
    ids.add(entry?.id);
    if (!['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier'].includes(entry?.worldId)) errors.push(`world:${entry?.id || 'missing'}`);
    if (entry.kind === 'interactive') {
      if (!entry.action || !entry.prompt || entry.range <= 0 || !entry.authority || entry.pickable !== true) errors.push(`interactive-contract:${entry.id}`);
    } else if (entry.kind === 'decorative') {
      if (entry.action || entry.prompt || entry.range !== 0 || entry.pickable !== false) errors.push(`decorative-contract:${entry.id}`);
    } else errors.push(`kind:${entry?.id || 'missing'}`);
    if (entry.grantsProgressionAutomatically !== false || entry.storesPrivateContent !== false) errors.push(`authority:${entry?.id || 'missing'}`);
  }
  if (registry?.noAmbiguousSignificantObjects !== true || registry?.ownsRenderLoop !== false) errors.push('registry-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), objectCount: registry?.entries?.length || 0 });
}

export default freeze({ EON_CITY_RT91_INTERACTION_REGISTRY_SCHEMA, defineEonCityRt91Interaction, createEonCityRt91InteractionRegistry, validateEonCityRt91InteractionRegistry });
