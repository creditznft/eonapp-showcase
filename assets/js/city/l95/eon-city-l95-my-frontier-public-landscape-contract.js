/** L95-W13 — truthful public landscape around the buildable My Frontier plots. */
export const EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA = 'eon.city.l95.my-frontier-public-landscape.v1';

const freeze = Object.freeze;
const QUALITY = freeze({
  lite: freeze({ horizonFins: 6, pylons: 4, perimeterRings: 2 }),
  balanced: freeze({ horizonFins: 12, pylons: 8, perimeterRings: 3 }),
  cinematic: freeze({ horizonFins: 16, pylons: 10, perimeterRings: 4 })
});

export const EON_CITY_L95_MY_FRONTIER_DISTRICT_ANCHORS = freeze([
  freeze({ district: 'central', x: 0, z: 0 }),
  freeze({ district: 'creator', x: -21, z: -15 }),
  freeze({ district: 'knowledge', x: 0, z: -28 }),
  freeze({ district: 'systems', x: 21, z: -15 }),
  freeze({ district: 'signal', x: 21, z: 15 }),
  freeze({ district: 'transit', x: 0, z: 28 }),
  freeze({ district: 'personal', x: -21, z: 15 })
]);

function qualityName(value = 'balanced') {
  const candidate = String(value || '').trim().toLowerCase();
  return Object.hasOwn(QUALITY, candidate) ? candidate : 'balanced';
}

export function createEonCityL95MyFrontierPublicLandscapePlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = qualityName(quality);
  const budget = QUALITY[resolvedQuality];
  const fins = freeze(Array.from({ length: budget.horizonFins }, (_, index) => {
    const angle = (Math.PI * 2 * index) / budget.horizonFins + 0.11;
    const radius = 36.2 + (index % 3) * 0.65;
    return freeze({
      id: `frontier-fin-${index + 1}`,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      heading: -angle + Math.PI / 2,
      height: 2.7 + ((index * 7) % 5) * 0.62,
      width: 0.34 + (index % 2) * 0.1,
      depth: 1.25 + (index % 3) * 0.2,
      ownership: 'public-landscape',
      userBuilding: false,
      interactive: false
    });
  }));
  const pylons = freeze(Array.from({ length: budget.pylons }, (_, index) => {
    const angle = (Math.PI * 2 * index) / budget.pylons + Math.PI / budget.pylons;
    const radius = 31.4;
    return freeze({
      id: `frontier-energy-pylon-${index + 1}`,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      height: 2.2 + (index % 3) * 0.28,
      ownership: 'public-landscape',
      userBuilding: false,
      interactive: false
    });
  }));
  const perimeterRings = freeze(Array.from({ length: budget.perimeterRings }, (_, index) => freeze({
    id: `frontier-circuit-ring-${index + 1}`,
    diameter: 45 + index * 8.7,
    thickness: index === budget.perimeterRings - 1 ? 0.075 : 0.055,
    ownership: 'public-landscape',
    userBuilding: false,
    interactive: false
  })));
  const districtHalos = freeze(EON_CITY_L95_MY_FRONTIER_DISTRICT_ANCHORS.map((entry) => freeze({
    ...entry,
    id: `frontier-district-halo-${entry.district}`,
    diameter: entry.district === 'central' ? 13.4 : 10.8,
    ownership: 'public-landscape',
    userBuilding: false,
    interactive: false
  })));
  return freeze({
    schema: EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA,
    quality: resolvedQuality,
    fins,
    pylons,
    perimeterRings,
    districtHalos,
    meshBudget: fins.length + pylons.length + perimeterRings.length + districtHalos.length,
    publicLandscapeOnly: true,
    createsEngine: false,
    createsScene: false,
    createsRenderLoop: false,
    grantsXp: false,
    grantsConstruction: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonCityL95MyFrontierPublicLandscapePlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA) errors.push('schema');
  if (!['lite', 'balanced', 'cinematic'].includes(String(plan.quality || ''))) errors.push('quality');
  if (plan.districtHalos?.length !== 7) errors.push('district-halos');
  if (!(Number(plan.meshBudget || 0) >= 19 && Number(plan.meshBudget || 0) <= 37)) errors.push('mesh-budget');
  for (const row of [...(plan.fins || []), ...(plan.pylons || []), ...(plan.perimeterRings || []), ...(plan.districtHalos || [])]) {
    if (!row.id || row.ownership !== 'public-landscape' || row.userBuilding || row.interactive) errors.push(`truth:${row.id || 'unknown'}`);
  }
  if (!plan.publicLandscapeOnly || plan.createsEngine || plan.createsScene || plan.createsRenderLoop || plan.grantsXp || plan.grantsConstruction || plan.mutatesMissionState || plan.privateContentStored) errors.push('runtime-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), meshBudget: Number(plan.meshBudget || 0) });
}

export default freeze({
  EON_CITY_L95_MY_FRONTIER_PUBLIC_LANDSCAPE_SCHEMA,
  EON_CITY_L95_MY_FRONTIER_DISTRICT_ANCHORS,
  createEonCityL95MyFrontierPublicLandscapePlan,
  validateEonCityL95MyFrontierPublicLandscapePlan
});
