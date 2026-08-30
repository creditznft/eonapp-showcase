/**
 * W556 — bounded landmark focus contract.
 *
 * Keeps City landmark interaction semantics independent from Babylon and DOM
 * details. It exposes only presentational focus state and the four visible
 * user-chosen actions. It does not open routes, execute work, fetch data, or
 * read private City/project content.
 */
export const EON_CITY_LANDMARK_FOCUS_SCHEMA = 'eon.city.landmark-focus.w556.v1';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeId = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
const SOURCES = freeze(['hover', 'mouse', 'touch', 'keyboard', 'controller', 'ui', 'world']);
const ACTIONS = freeze([
  freeze({ id: 'enter', label: 'Enter', localOnly: true, opensRoute: false, executesWork: false }),
  freeze({ id: 'guide', label: 'Guide', localOnly: true, opensRoute: false, executesWork: false }),
  freeze({ id: 'quick-open', label: 'Quick Open', localOnly: true, opensRoute: false, requiresVisibleReview: true, executesWork: false }),
  freeze({ id: 'inspect', label: 'Inspect', localOnly: true, opensRoute: false, executesWork: false })
]);

export function getEonCityLandmarkInteractionActions() {
  return ACTIONS.map((action) => freeze({ ...action }));
}

export function normalizeEonCityLandmarkFocus(value = {}) {
  const id = safeId(value?.id || value?.landmarkId);
  if (!id) return null;
  const source = SOURCES.includes(String(value?.source || '').toLowerCase()) ? String(value.source).toLowerCase() : 'ui';
  const distance = Math.max(0, Math.min(10000, finite(value?.distance, 0)));
  const radius = Math.max(0, Math.min(10000, finite(value?.radius, 0)));
  const nearby = Boolean(value?.nearby ?? (radius > 0 && distance <= radius));
  return freeze({
    schema: EON_CITY_LANDMARK_FOCUS_SCHEMA,
    id,
    source,
    distance: Math.round(distance * 10) / 10,
    radius: Math.round(radius * 10) / 10,
    nearby,
    actions: freeze(getEonCityLandmarkInteractionActions()),
    localOnly: true,
    opensRoute: false,
    executesWork: false,
    readsPrivateWork: false,
    remoteNetwork: false
  });
}

export function createEonCityLandmarkFocusState() {
  let current = null;
  return freeze({
    focus(value = {}) {
      current = normalizeEonCityLandmarkFocus(value);
      return current;
    },
    clear() {
      current = null;
      return null;
    },
    getSnapshot() {
      return current ? freeze({ ...current, actions: freeze(current.actions.map((action) => freeze({ ...action }))) }) : null;
    }
  });
}
