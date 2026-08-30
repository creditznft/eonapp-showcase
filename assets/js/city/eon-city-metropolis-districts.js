/** W414 — remaining Living Creator Metropolis districts, local wayfinding only. */
export const EON_CITY_METROPOLIS_DISTRICTS_SCHEMA = 'eon.city.metropolis-districts.w414.v1';

const freeze = (value) => Object.freeze(value);
const district = (value) => freeze({ ...value, launches: freeze(value.launches.map((item) => freeze({ ...item }))) });

export const EON_CITY_METROPOLIS_DISTRICTS = freeze([
  district({
    id: 'signal-tower',
    title: 'Signal Tower',
    shortLabel: 'Signal',
    x: -9.45,
    z: 8.8,
    accent: '#f0abfc',
    description: 'Prepare campaign and share direction. No account connection, scheduling, or posting happens in City.',
    launches: [
      { id: 'share-pack', label: 'Share Pack', route: '/workspace#eon-share' },
      { id: 'remix-card', label: 'Remix Card', route: '/workspace#eon-remix-card' }
    ]
  }),
  district({
    id: 'automation-observatory',
    title: 'Automation Observatory',
    shortLabel: 'Automate',
    x: 10.15,
    z: 1.65,
    accent: '#86efac',
    description: 'Review a safe automation proposal. City never executes, schedules, or connects an automation.',
    launches: [
      { id: 'automation-review', label: 'Automation review', route: '/automations' }
    ]
  }),
  district({
    id: 'archive-gardens',
    title: 'Archive Gardens',
    shortLabel: 'Archive',
    x: 9.25,
    z: 9.25,
    accent: '#93c5fd',
    description: 'Return to local collections and milestones. No grant, reward, wallet, or marketplace action is present.',
    launches: [
      { id: 'local-library', label: 'Open Library', route: '/library' },
      { id: 'local-projects', label: 'Open Projects', route: '/projects' }
    ]
  })
]);

const BY_ID = new Map(EON_CITY_METROPOLIS_DISTRICTS.map((entry) => [entry.id, entry]));

export function getMetropolisDistrict(id = '') {
  return BY_ID.get(String(id || '').trim()) || null;
}

export function getMetropolisDistrictLaunches() {
  return EON_CITY_METROPOLIS_DISTRICTS.flatMap((entry) => entry.launches.map((launch) => freeze({ ...launch, districtId: entry.id, districtTitle: entry.title })));
}

export function validateMetropolisDistricts(value = EON_CITY_METROPOLIS_DISTRICTS) {
  const errors = [];
  if (!Array.isArray(value) || value.length !== 3) errors.push('Metropolis extension requires exactly three districts.');
  const ids = new Set();
  for (const entry of value || []) {
    if (!/^[-a-z]{4,48}$/.test(String(entry?.id || ''))) errors.push('District ID is invalid.');
    if (ids.has(entry?.id)) errors.push('District ID is duplicated.');
    ids.add(entry?.id);
    if (!String(entry?.title || '').trim() || !String(entry?.description || '').trim()) errors.push('District label or description is missing.');
    if (!Number.isFinite(entry?.x) || !Number.isFinite(entry?.z)) errors.push('District coordinates are invalid.');
    if (!Array.isArray(entry?.launches) || !entry.launches.length) errors.push('District must expose one or more user-selected native launches.');
    for (const launch of entry?.launches || []) {
      if (!/^\/[a-z0-9/?#=&._-]*$/i.test(String(launch?.route || ''))) errors.push('District launch route is invalid.');
    }
  }
  return freeze({ schema: EON_CITY_METROPOLIS_DISTRICTS_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true });
}

export function getMetropolisDistrictTruth() {
  return freeze({
    schema: EON_CITY_METROPOLIS_DISTRICTS_SCHEMA,
    localOnly: true,
    routesUserSelected: true,
    automaticNavigation: false,
    socialPosting: false,
    socialOAuth: false,
    automationExecution: false,
    projectRead: false,
    projectWrite: false,
    collectionGrant: false,
    reward: false,
    wallet: false,
    payment: false,
    tracking: false,
    remoteAssets: false,
    finalVisualCertification: false
  });
}
