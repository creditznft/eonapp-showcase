import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createEonCityW660mExperienceDirector,
  getEonCityW660mExperienceTruth,
  resolveEonCityW660mNpcDirective
} from '../assets/js/city/w660m/eon-city-w660m-experience-director.js';
import { validateEonCityW649AnimationManifest } from '../assets/js/city/w649/eon-city-w649-animation-manifest.js';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const checks = [];
const check = (name, condition) => {
  assert.ok(condition, name);
  checks.push(name);
};

const truth = getEonCityW660mExperienceTruth();
check('one-babylon-owner', truth.oneBabylonOwner === true && truth.ownsRenderLoop === false);
check('truthful-local-companion', truth.autonomousAgent === false && truth.startsAiWork === false && truth.startsVoiceCapture === false);
check('living-player-npc-companion', truth.playerIdleChoreography && truth.reactiveNpcRoutines && truth.curiousCompanion);
check('city-nexus-interest', truth.cityNexusInterestSupported === true);
check('creator-dock', truth.creatorDockSupported === true);
check('animation-manifest-valid', validateEonCityW649AnimationManifest().ok === true);

const director = createEonCityW660mExperienceDirector({ quality: 'balanced' });
const scan = director.update({
  moving: false,
  playerPosition: { x: 0, y: 0, z: 7 },
  currentDistrictId: 'orientation-hall',
  nearby: { type: 'nexus', id: 'orientation-nexus', position: { x: 1, y: 0, z: 7 } }
});
check('nexus-scan-behaviour', scan.companionMode === 'scan' && scan.nearbyKind === 'nexus');
const greeting = resolveEonCityW660mNpcDirective({ assetId: 'eoncity-eon-architect-12clips', playerDistance: 2, playerBearing: 0.7 });
check('npc-reactive-greeting', greeting.reactive === true && greeting.activity === 'acknowledging Pathfinder');

const [core, product, district, companion, css] = await Promise.all([
  read('assets/js/city/eon-city-play-core.js'),
  read('assets/js/city/w659n/eon-city-w659n-product-layer.js'),
  read('assets/js/city/w649/eon-city-w649-district-runtime.js'),
  read('assets/js/city/eon-city-companion-director.js'),
  read('assets/css/eon-city-product-layer.css')
]);
check('director-dynamic-import', core.includes("import('./w660m/eon-city-w660m-experience-director.js')"));
check('director-updates-maintained-owner', core.includes('experienceDirector.update({'));
check('companion-anchor-directed', core.includes('lastExperienceSnapshot?.companion?.position'));
check('intent-recursion-removed', core.includes('experienceDirector?.setCompanionIntent?.(mode)') && !/setCompanionIntent\(mode[^}]+productLayer\?\.setCompanionIntent/s.test(core));
check('product-living-context', product.includes('const getLivingContext = () =>') && product.includes('data-eon-w660m-living-status'));
check('physical-nexus-preserved', product.includes('createEonCityW660NexusHologram'));
check('operator-interaction-animates', product.includes("requestW649NpcState?.(operator.residentAssetId, 'talk'"));
check('district-living-routines', district.includes('updateLivingActors') && district.includes('getLivingSummary'));
check('unsupported-animation-fallback-safe', district.includes("animationProfile?.aliases?.[directive.state] ? directive.state : 'idle'"));
check('companion-dock-mode', companion.includes("'dock'") && companion.includes("mode === 'dock'"));
check('living-status-responsive', css.includes('W660M — readable living-world status') && css.includes('@media(max-width:760px)'));

console.log(JSON.stringify({
  schema: 'eon.city.w660m.living-rebuild-gate.v1',
  ok: true,
  passed: checks.length,
  checks
}, null, 2));
