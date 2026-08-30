/** RT91 — read-only visual transformation projection for persistent world change. */
export const EON_CITY_RT91_WORLD_TRANSFORMATION_SCHEMA = 'eon.city.world-transformation.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

const STAGES = freeze([
  freeze({ level: 0, id: 'damaged', label: 'Damaged', light: 0.25, activity: 0.2, transit: 0.15 }),
  freeze({ level: 1, id: 'recovering', label: 'Recovering', light: 0.45, activity: 0.4, transit: 0.3 }),
  freeze({ level: 2, id: 'operational', label: 'Operational', light: 0.68, activity: 0.62, transit: 0.55 }),
  freeze({ level: 3, id: 'thriving', label: 'Thriving', light: 0.86, activity: 0.8, transit: 0.75 }),
  freeze({ level: 4, id: 'signature', label: 'Signature', light: 1, activity: 1, transit: 0.92 })
]);

function stageFromRatio(value = 0) {
  const ratio = clamp(value, 0, 1);
  const index = ratio >= 1 ? 4 : ratio >= 0.72 ? 3 : ratio >= 0.45 ? 2 : ratio > 0 ? 1 : 0;
  return STAGES[index];
}

export function projectEonCityRt91WorldTransformation({ worldId = '', units = [] } = {}) {
  const world = clean(worldId);
  const rows = (Array.isArray(units) ? units : []).map((unit) => {
    const ratio = clamp(unit?.progressRatio ?? unit?.progressPercent / 100, 0, 1);
    const stage = stageFromRatio(ratio);
    return freeze({
      id: clean(unit?.id),
      label: String(unit?.label || unit?.id || '').trim(),
      progressRatio: Number(ratio.toFixed(4)),
      stageId: stage.id,
      stageLabel: stage.label,
      presentation: freeze({
        emissiveIntensityScale: stage.light,
        ambientActivityScale: stage.activity,
        transitActivityScale: stage.transit,
        damagedPresentationVisible: stage.level < 2,
        restoredPresentationVisible: stage.level >= 2,
        signaturePresentationVisible: stage.level === 4
      }),
      spawnsUnboundedGeometry: false,
      changesCollisionAuthority: false,
      grantsProgression: false
    });
  });
  const average = rows.length ? rows.reduce((sum, row) => sum + row.progressRatio, 0) / rows.length : 0;
  return freeze({
    schema: EON_CITY_RT91_WORLD_TRANSFORMATION_SCHEMA,
    worldId: world,
    units: freeze(rows),
    averageProgressRatio: Number(average.toFixed(4)),
    worldStage: stageFromRatio(average).id,
    materialLightAudioStatePreferredOverNewGeometry: true,
    writesPersistence: false,
    grantsProgression: false,
    ownsRenderLoop: false
  });
}

export function validateEonCityRt91WorldTransformationProjection(projection = {}) {
  const errors = [];
  if (projection?.schema !== EON_CITY_RT91_WORLD_TRANSFORMATION_SCHEMA) errors.push('schema');
  if (!['signal-frontier', 'storm-sector', 'my-frontier'].includes(projection?.worldId)) errors.push('world');
  for (const unit of projection?.units || []) {
    if (!unit?.id || unit.progressRatio < 0 || unit.progressRatio > 1) errors.push(`unit:${unit?.id || 'missing'}`);
    if (unit.spawnsUnboundedGeometry !== false || unit.changesCollisionAuthority !== false || unit.grantsProgression !== false) errors.push(`authority:${unit?.id || 'missing'}`);
  }
  if (projection?.writesPersistence !== false || projection?.grantsProgression !== false || projection?.ownsRenderLoop !== false) errors.push('projection-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), unitCount: projection?.units?.length || 0 });
}

export default freeze({ EON_CITY_RT91_WORLD_TRANSFORMATION_SCHEMA, projectEonCityRt91WorldTransformation, validateEonCityRt91WorldTransformationProjection });
