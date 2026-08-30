import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_FLAGSHIP_CASES, EON_CITY_FLAGSHIP_PERFORMANCE_PLAN, EON_CITY_FLAGSHIP_PRESETS, createEonCityFlagshipCertificationController, getEonCityFlagshipPerformancePlan } from '../assets/js/city/eon-city-flagship-certification.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export async function validateW624lFlagshipCertificationContract() {
  const checks = [];
  const add = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  add('three-presets', Object.keys(EON_CITY_FLAGSHIP_PRESETS).length === 3, Object.keys(EON_CITY_FLAGSHIP_PRESETS).join(','));
  add('eleven-cases', EON_CITY_FLAGSHIP_CASES.length === 11, String(EON_CITY_FLAGSHIP_CASES.length));
  add('device-cases', ['low-device','mid-device','high-device'].every((id) => EON_CITY_FLAGSHIP_CASES.some((entry) => entry.id === id)), 'low/mid/high');
  add('recovery-cases', ['route-switching','background-foreground','pwa-update','memory-pressure','webgl-loss'].every((id) => EON_CITY_FLAGSHIP_CASES.some((entry) => entry.id === id)), 'recovery matrix');
  add('visual-owner-cases', ['visual-parity','owner-approval'].every((id) => EON_CITY_FLAGSHIP_CASES.some((entry) => entry.id === id)), 'human visual gates');
  add('performance-plan', EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.lod && EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.frustumCulling && EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.instancing && EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.frameTimeGovernor, 'core plan');
  add('compressed-texture-honest', EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.compressedTextureBoundary === 'manifest-gated-when-assets-exist', EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.compressedTextureBoundary);
  add('streaming-bounded', EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.assetStreaming === 'required-core-plus-optional-detail' && EON_CITY_FLAGSHIP_PERFORMANCE_PLAN.prefetchBoundary.includes('same-origin'), 'bounded streaming');
  const low = getEonCityFlagshipPerformancePlan('low');
  const mid = getEonCityFlagshipPerformancePlan('mid');
  const high = getEonCityFlagshipPerformancePlan('high');
  add('low-preset', low.preset.targetFps === 30 && low.preset.maxPixelRatio === 1 && low.preset.optionalDetail === false, JSON.stringify(low.preset));
  add('mid-preset', mid.preset.targetFps === 45 && mid.preset.maxPixelRatio === 1.5, JSON.stringify(mid.preset));
  add('high-preset', high.preset.targetFps === 60 && high.preset.maxPixelRatio === 2, JSON.stringify(high.preset));
  add('resident-window', [low,mid,high].every((entry) => entry.residentCells === 9), 'nine cells');
  add('no-final-claim-from-plan', [low,mid,high].every((entry) => entry.finalPerformanceClaim === false), 'pending');

  let clock = 1000;
  const controller = createEonCityFlagshipCertificationController({ deviceClass: 'mid', now: () => clock, performanceNow: () => clock, memoryReader: () => ({ usedJSHeapSize: 10_000_000 }) });
  add('initial-pending', controller.getSnapshot().status === 'pending' && controller.getSnapshot().finalPerformanceClaim === false, 'pending');
  add('invalid-frame-rejected', controller.recordFrame(-1).reason === 'invalid-frame-sample', 'invalid');
  clock += 16;
  add('frame-record-local', controller.recordFrame(16).ok && controller.getSnapshot().metrics.frameSamples === 1, 'one sample');
  add('memory-record-local', controller.sampleMemory().ok && controller.getSnapshot().metrics.memorySamples === 1, 'one memory sample');
  add('explicit-case-review', controller.selectCase('low-device').reason === 'explicit-review-required', 'explicit review');
  add('case-selected', controller.selectCase('low-device', { explicitUserAction: true }).ok, 'selected');
  add('human-review-required', controller.recordCase('low-device', 'pass', { explicitUserAction: true, evidenceRef: 'device/low/proof.json' }).reason === 'explicit-human-review-required', 'human review');
  add('evidence-required', controller.recordCase('low-device', 'pass', { explicitUserAction: true, explicitHumanReview: true }).reason === 'bounded-evidence-reference-required', 'reference required');
  add('case-recorded', controller.recordCase('low-device', 'pass', { explicitUserAction: true, explicitHumanReview: true, evidenceRef: 'device/low/proof.json' }).ok, 'recorded');
  add('one-case-not-certification', controller.getSnapshot().finalPerformanceClaim === false && controller.getSnapshot().passCount === 1, 'still pending');
  add('protection-explicit', controller.requestProtection().reason === 'explicit-user-action-required', 'explicit');
  add('export-explicit', controller.exportEvidence().reason === 'explicit-user-action-required', 'explicit');
  const exported = controller.exportEvidence({ explicitUserAction: true });
  add('export-private-safe', exported.ok && exported.privateContentIncluded === false && exported.networkRequestCreated === false, exported.filename);
  add('controller-disposes', controller.dispose().disposed === true, 'disposed');

  const source = read('assets/js/city/eon-city-flagship-certification.js');
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const runtimeOwner = read('assets/js/city/eon-city-runtime-owner.js');
  const manifest = read('assets/js/city/eon-city-runtime-asset-manifest.js');
  add('source-no-network', !/\bfetch\s*\(/.test(source), 'local only');
  add('source-no-auto-certification', /automaticCertification:\s*false/.test(source) && /finalPerformanceClaim/.test(source), 'human gated');
  add('source-no-battery-thermal-probe', !/getBattery\s*\(|temperature|thermalState/.test(source), 'no sensor inference');
  add('source-uses-governor', /createCityQualityGovernor/.test(source), 'existing governor');
  add('source-uses-observation', /createCityPerformanceObservation/.test(source), 'existing observation');
  add('source-uses-cell-window', /getEonCityCellResidencyPlan/.test(source), 'existing streaming boundary');
  add('station-integration', /bindEonCityFlagshipCertification/.test(station) && /w624l-flagship-certification/.test(station), 'lifecycle-owned');
  add('css-present', /W624L · evidence-gated performance/.test(css), 'W624L CSS');
  add('manifest-core-detail-preserved', /required/.test(manifest) && /optional/.test(manifest), 'W624B asset boundary');
  add('runtime-owner-preserved', /EON_CITY_RUNTIME_OWNER_SCHEMA/.test(runtimeOwner) && !/flagship-certification/.test(runtimeOwner), 'owner unchanged');
  add('w624k-preserved', /bindEonCityAccessibilityDeviceSystem/.test(station), 'W624K remains');
  add('w624j-preserved', /bindEonCitySharingCenter/.test(station), 'W624J remains');

  return Object.freeze({ schema: 'eonapp.contract.w624l-flagship-certification.2026-07-11.v1', wave: 'W624L', ok: checks.every((entry) => entry.pass), total: checks.length, passed: checks.filter((entry) => entry.pass).length, checks: Object.freeze(checks) });
}
export default validateW624lFlagshipCertificationContract;
