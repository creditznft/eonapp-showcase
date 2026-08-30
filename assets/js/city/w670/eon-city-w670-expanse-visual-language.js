export const EON_CITY_W670_EXPANSE_VISUAL_SCHEMA = 'eon.city.expanse-visual-language.w670.v1';

const freeze = (value) => Object.freeze(value);
const text = (value = '') => String(value || '').trim().toLowerCase();

export function resolveEonCityW670BuildingVisual(form = '') {
  const value = text(form);
  let shape = 'block';
  if (/tower|spire|lighthouse|observatory|stack|scanner|needle|beacon|mast/.test(value)) shape = 'tower';
  else if (/dome|rotunda|pavilion|canopy|greenhouse|garden|orbarium|sanctum/.test(value)) shape = 'faceted';
  else if (/arch|bridge|gate|viaduct|portal frame|skywalk/.test(value)) shape = 'arch';
  else if (/crystal|prism|obelisk|quartz|shard/.test(value)) shape = 'crystal';
  else if (/terrace|step|amphitheatre|ziggurat|cascade/.test(value)) shape = 'terrace';
  else if (/lattice|gantry|frame|scaffold|kinetic/.test(value)) shape = 'lattice';

  const roof = /habitat|residence|studio|house/.test(value)
    ? 'habitable'
    : /hall|forum|concourse|arcade|market|cathedral/.test(value)
      ? 'civic'
      : /workshop|foundry|forge|depot|assembly/.test(value)
        ? 'industrial'
        : 'signal';

  return freeze({
    schema: EON_CITY_W670_EXPANSE_VISUAL_SCHEMA,
    shape,
    roof,
    tapered: shape === 'tower' || shape === 'crystal',
    openFrame: shape === 'arch' || shape === 'lattice',
    stepped: shape === 'terrace',
    localOnly: true
  });
}

export function resolveEonCityW670TerrainVisual(cell = {}) {
  const profile = cell?.terrainProfile || {};
  const id = text(profile.id || 'urban-flat');
  const elevation = Number(profile.elevation || 0);
  const relief = Number(profile.relief || 0);
  const kind = /canal|wetland|lagoon/.test(id)
    ? 'water'
    : /ridge|ravine|crater|cliff/.test(id)
      ? 'relief'
      : /terrace|step/.test(id)
        ? 'terraced'
        : /garden|bio|canopy/.test(id)
          ? 'living'
          : /sky|suspended|deck/.test(id)
            ? 'elevated'
            : 'flat';
  return freeze({
    schema: EON_CITY_W670_EXPANSE_VISUAL_SCHEMA,
    id,
    kind,
    tileY: Number((elevation * 0.32).toFixed(3)),
    reliefHeight: Number(Math.max(0, relief).toFixed(3)),
    waterVisible: kind === 'water',
    vegetationVisible: kind === 'living' || /wetland|garden|bio/.test(id),
    elevated: kind === 'elevated' || elevation > 0.35,
    materialRole: kind === 'water' ? 'activity' : kind === 'living' ? 'identity' : 'cell',
    localOnly: true
  });
}

export function resolveEonCityW670PublicSpaceVisual(cell = {}) {
  const profile = cell?.publicSpaceProfile || {};
  const id = text(profile.id || cell?.roadGrammar?.plaza || 'none');
  const kind = /water|canal|lagoon/.test(id)
    ? 'water-court'
    : /garden|grove|wetland/.test(id)
      ? 'living-court'
      : /amphitheatre|forum|cathedral|dais/.test(id)
        ? 'civic-stage'
        : /market|bazaar/.test(id)
          ? 'market-field'
          : /observatory|sky|suspended/.test(id)
            ? 'elevated-deck'
            : /kinetic|sculpture|resonance/.test(id)
              ? 'signal-field'
              : id === 'none'
                ? 'none'
                : 'plaza';
  const scale = Number(profile.scale || 1);
  return freeze({
    schema: EON_CITY_W670_EXPANSE_VISUAL_SCHEMA,
    id,
    kind,
    visible: kind !== 'none',
    diameter: Number((Math.max(1.7, Math.min(5.4, 2.2 * scale))).toFixed(3)),
    height: kind === 'elevated-deck' ? 0.22 : kind === 'civic-stage' ? 0.14 : 0.075,
    tessellation: kind === 'water-court' || kind === 'living-court' ? 28 : kind === 'market-field' ? 8 : 16,
    materialRole: kind === 'water-court' || kind === 'living-court' ? 'activity' : kind === 'signal-field' ? 'route' : 'road',
    localOnly: true
  });
}

export function resolveEonCityW670StreetVisual(cell = {}) {
  const profile = cell?.streetProfile || cell?.roadGrammar || {};
  const topology = text(profile.topology || profile.pattern || profile.id || 'cross');
  const kind = /ring|radial/.test(topology)
    ? 'radial'
    : /diagonal|switchback|canyon/.test(topology)
      ? 'diagonal'
      : /crescent|quay|canal/.test(topology)
        ? 'crescent'
        : /parallel|split|boulevard/.test(topology)
          ? 'parallel'
          : /bridge|viaduct|suspended|sky/.test(topology)
            ? 'elevated'
            : /courtyard|loop|arcology/.test(topology)
              ? 'loop'
              : 'cross';
  return freeze({
    schema: EON_CITY_W670_EXPANSE_VISUAL_SCHEMA,
    topology,
    kind,
    laneCount: Math.max(1, Math.min(4, Number(profile.laneCount || 1))),
    pedestrianPriority: Boolean(profile.pedestrianPriority),
    elevated: kind === 'elevated' || Number(profile.elevation || 0) > 0.25,
    secondaryVisible: kind !== 'cross',
    localOnly: true
  });
}

export function resolveEonCityW670CellVisualLanguage(cell = {}) {
  return freeze({
    schema: EON_CITY_W670_EXPANSE_VISUAL_SCHEMA,
    terrain: resolveEonCityW670TerrainVisual(cell),
    publicSpace: resolveEonCityW670PublicSpaceVisual(cell),
    street: resolveEonCityW670StreetVisual(cell),
    skylineId: text(cell?.skylineProfile?.id || 'balanced-cluster'),
    microClimateId: text(cell?.microClimate?.id || 'clear-neon'),
    localOnly: true,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export default freeze({
  EON_CITY_W670_EXPANSE_VISUAL_SCHEMA,
  resolveEonCityW670BuildingVisual,
  resolveEonCityW670TerrainVisual,
  resolveEonCityW670PublicSpaceVisual,
  resolveEonCityW670StreetVisual,
  resolveEonCityW670CellVisualLanguage
});
