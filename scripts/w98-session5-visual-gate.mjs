import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const atlas = read('assets/js/realm3d/engine/EonCityMaterialAtlas.js');
const art = read('assets/js/realm3d/engine/EonCitySession5ArtDirection.js');
const architecture = read('assets/js/realm3d/engine/EonCityArchitectureKit.js');
const flagship = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const session4 = read('scripts/w98-session4-visual-gate.mjs');

const checks = {
  session5ArtSchema: art.includes("SESSION5_ART_SCHEMA = 'eon.realm3d.art-direction.w98.session5.v1'"),
  expandedMaterialAtlas: atlas.includes("visualSchema: 'eon.realm3d.material-atlas.w98.session5.v1'") && ['stone', 'ceramic', 'polymer', 'terrain', 'fabric', 'roof', 'soil', 'roadEdge'].every((id) => atlas.includes(`'${id}'`)),
  proceduralSurfaceDepth: atlas.includes('roughnessMap: detail') && atlas.includes('bumpMap:') && atlas.includes('detailTextureCount'),
  materialFamilies: ['wetRoad:', 'roadEdge:', 'terrain:', 'stone:', 'ceramic:', 'luminousPolymer:', 'officeCeramic:', 'fabric:'].every((token) => atlas.includes(token)),
  environmentPresets: ['neon-dawn', 'glass-midnight', 'aurora-garden', 'neon-night'].every((preset) => art.includes(`'${preset}'`)),
  layeredSkyShader: flagship.includes('uMid') && flagship.includes('uLowerHorizon') && flagship.includes('uCloudDensity') && flagship.includes('cloudNoise'),
  session5FogDirector: flagship.includes('applySession5Fog') && art.includes('scene.fog.near') && art.includes('scene.fog.far'),
  keyFillRimLighting: flagship.includes('session5-world-rim-light') && art.includes('rimIntensity') && art.includes('ambientIntensity'),
  terrainFoundation: art.includes('session5-curved-terrain-foundation') && art.includes('session5-district-terrain-pads-instanced'),
  roadNaturalism: art.includes('session5-road-curbs-instanced') && art.includes('session5-storm-drains-instanced') && art.includes('session5-road-reflectors-cyan-instanced'),
  plantedMedians: art.includes('session5-planted-medians-instanced') && art.includes('session5-median-grass-instanced'),
  skylineDepth: art.includes('session5-far-skyline-silhouettes-instanced') && art.includes('session5-horizon-haze'),
  atmosphereLayers: art.includes('session5-cloud-banks-instanced') && art.includes('buildSession5AtmosphereLayers'),
  districtMaterialFamilies: architecture.includes('applySession5MaterialFamily') && architecture.includes('architecture-material-family.w98.session5.v1'),
  workstationCoherence: ['session5-workstation-structural-ribs-instanced', 'session5-workstation-ceiling-baffles-instanced', 'session5-workstation-acoustic-wall-fins-instanced', 'session5-workstation-recessed-floor-trim-instanced'].every((token) => art.includes(token)),
  workstationIntegrated: flagship.includes('buildSession5WorkstationArchitecture') && flagship.includes('framed-glass-command-studio'),
  cityNaturalismIntegrated: flagship.includes('buildSession5CityNaturalism') && flagship.includes('session5NaturalismStats'),
  session5Telemetry: flagship.includes("visualSession: 'w98-session5'") && flagship.includes('session5Art:') && boot.includes("realmVisualSession = 'w98-session5'"),
  mobilePerformanceRails: art.includes("quality === 'low'") && flagship.includes("this.quality === 'low' ? this.materialAtlas?.materials?.road"),
  historicalSession4GatePreserved: session4.includes('historicalGateCompatibility') && flagship.includes("visualSession: 'w98-session4'") && boot.includes("realmVisualSession = 'w98-session4'")
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  schema: 'eon.w98.session5.visual-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  score: Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100),
  generatedAt: new Date().toISOString()
};
const out = path.join(root, 'CodexAuditPack/W98_SESSION5/W98_SESSION5_STATIC_GATE.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
