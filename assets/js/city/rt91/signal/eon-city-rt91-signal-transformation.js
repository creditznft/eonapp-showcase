/** RT91 Signal — adapter from existing W771 restoration truth into RT91 persistent presentation stages. */
import { deriveEonExpanseW771ERestorationArtState } from '../../w771/eon-expanse-w771e-zone-restoration-art-state.js';
import { projectEonCityRt91WorldTransformation, validateEonCityRt91WorldTransformationProjection } from '../eon-city-rt91-world-transformation-projection.js';

export const EON_CITY_RT91_SIGNAL_TRANSFORMATION_SCHEMA = 'eon.city.signal.transformation.rt91.v1';
const freeze = Object.freeze;

export function projectEonCityRt91SignalTransformation(progress = {}) {
  const art = deriveEonExpanseW771ERestorationArtState(progress);
  const units = art.zones.map((zone) => freeze({ id: zone.zoneId, label: zone.transformationLabel, progressRatio: zone.restoration }));
  const projection = projectEonCityRt91WorldTransformation({ worldId: 'signal-frontier', units });
  return freeze({
    schema: EON_CITY_RT91_SIGNAL_TRANSFORMATION_SCHEMA,
    worldId: 'signal-frontier',
    sourceArtSchema: art.schema,
    zones: freeze(projection.units.map((unit) => {
      const source = art.zones.find((zone) => zone.zoneId === unit.id);
      return freeze({
        ...unit,
        artStage: source?.artStage || 'damaged',
        circuitIntensity: source?.circuitIntensity ?? 0,
        warmIntensity: source?.warmIntensity ?? 0,
        fogRelief: source?.fogRelief ?? 0,
        revealRestorationModules: source?.revealRestorationModules === true,
        presentationMutationPolicy: 'materials-lights-audio-ambient-activity-first'
      });
    })),
    averageRestorationPercent: art.averageRestorationPercent,
    worldStage: projection.worldStage,
    writesMissionState: false,
    writesProgression: false,
    createsGeometry: false,
    ownsRenderLoop: false
  });
}

export function validateEonCityRt91SignalTransformation(result = {}) {
  const errors = [];
  if (result.schema !== EON_CITY_RT91_SIGNAL_TRANSFORMATION_SCHEMA || result.worldId !== 'signal-frontier') errors.push('schema-world');
  const generic = validateEonCityRt91WorldTransformationProjection({
    schema: 'eon.city.world-transformation.rt91.v1',
    worldId: 'signal-frontier',
    units: result.zones || [],
    writesPersistence: false,
    grantsProgression: false,
    ownsRenderLoop: false
  });
  if (!generic.ok) errors.push(...generic.errors.map((error) => `projection:${error}`));
  if (result.zones?.length !== 5) errors.push('zone-count');
  for (const zone of result.zones || []) {
    if (!['damaged', 'restoring', 'restored'].includes(zone.artStage)) errors.push(`art-stage:${zone.id}`);
    if (zone.presentationMutationPolicy !== 'materials-lights-audio-ambient-activity-first') errors.push(`mutation-policy:${zone.id}`);
  }
  if (result.writesMissionState || result.writesProgression || result.createsGeometry || result.ownsRenderLoop) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), zoneCount: result.zones?.length || 0 });
}

export default freeze({ EON_CITY_RT91_SIGNAL_TRANSFORMATION_SCHEMA, projectEonCityRt91SignalTransformation, validateEonCityRt91SignalTransformation });
