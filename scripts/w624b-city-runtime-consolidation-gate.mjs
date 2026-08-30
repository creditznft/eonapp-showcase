#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_RUNTIME_ASSET_MANIFEST, validateEonCityRuntimeAssetManifest } from '../assets/js/city/eon-city-runtime-asset-manifest.js';
import { EON_CITY_RUNTIME_STATES, getEonCityRuntimeStateContract } from '../assets/js/city/eon-city-runtime-state-machine.js';
import { W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT, validateW624bCityRuntimeContract } from '../config/w624b-city-runtime-consolidation-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const failures = [];
const check = (id, ok, detail = '') => {
  checks.push({ id, ok: Boolean(ok), detail });
  if (!ok) failures.push(`${id}${detail ? `: ${detail}` : ''}`);
};
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const contract = validateW624bCityRuntimeContract();
const manifest = validateEonCityRuntimeAssetManifest();
const state = getEonCityRuntimeStateContract();
const access = read('assets/js/city/eon-city-access-station.js');
const owner = read('assets/js/city/eon-city-runtime-owner.js');
const station = read('assets/js/eon-city-play-station.js');
const renderer = read('assets/js/city/eon-city-play-babylon.js');
const cityPage = read('eoncity.html');
const shellCss = read('assets/css/eon-app-shell.css');
const accessContract = read('config/w554-eon-city-access-project-portals-contract.mjs');
const authorizedBootBlock = access.indexOf("if (view.kind === 'boot')");
const corePreloader = access.indexOf('const preloadCore = () =>', authorizedBootBlock);
const automaticEntry = access.indexOf('const automaticEntry = enter()', corePreloader);
const coreImportCount = (access.match(/import\('\.\/eon-city-play-core\.js'\)/g) || []).length;
const authenticatedAutomaticBoot = authorizedBootBlock >= 0
  && corePreloader > authorizedBootBlock
  && automaticEntry > corePreloader
  && coreImportCount === 1
  && !access.includes('eon-city-runtime-owner.js');

check('contract-valid', contract.ok, contract.errors.join(','));
check('required-files', [W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT.runtimeOwner, W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT.stateMachine, W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT.assetManifest].every(exists), 'owner/state/manifest');
check('core-only-entry-contract', authenticatedAutomaticBoot, 'access starts only the proven Babylon core automatically after authorization');
check('owner-controls-station', owner.includes("from '../eon-city-play-station.js'") && owner.includes('mountEonCityPlayStation') && owner.includes('disposeEonCityPlayStation'), 'owner mounts and disposes station');
check('station-no-auto-mount', station.includes('no auto-mount') && !/DOMContentLoaded[^\n]+mountEonCityPlayStation/.test(station), 'station cannot self-start');
const canonicalCollapsedShell = cityPage.includes('eon-app-shell.js')
  && cityPage.includes('data-eon-app-shell="1"')
  && cityPage.includes('data-eon-app-page="eoncity"')
  && cityPage.includes('data-eon-city-direct-entry')
  && shellCss.includes('body.eon-app-sidebar-collapsed')
  && shellCss.includes('body[data-eon-app-shell="1"] > main')
  && shellCss.includes('margin-left: var(--eon-app-rail-width)');
check('canonical-collapsed-shell', canonicalCollapsedShell, 'collapsed app navigation stays available without covering the canonical City viewport');
check('compatibility-docs-static', W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT.compatibilityDocuments.every((file) => {
  const source = read(file);
  return source.includes('http-equiv="refresh"') && source.includes('data-eon-city-compatibility-only="true"') && !source.includes('type="module"');
}), 'retired docs redirect without renderer scripts');
check('deterministic-state-machine', EON_CITY_RUNTIME_STATES.length === 11 && state.progressBasis === 'completed-named-stages' && state.timerBasedProgress === false, EON_CITY_RUNTIME_STATES.join(','));
check('visible-recovery-language', Object.values(state.copy).every((copy) => copy.title && copy.detail && Array.isArray(copy.actions)), 'every state has title/detail/actions');
check('recovery-case-contract', W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT.requiredRecoveryCases.every((id) => state.recoveryCases.some((entry) => entry.id === id)), '12 named recovery cases');
check('asset-manifest-valid', manifest.ok, manifest.errors.join(','));
check('asset-manifest-paths-exist', [...EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired, ...EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed, ...EON_CITY_RUNTIME_ASSET_MANIFEST.targetFrameReferences].every((asset) => exists(asset.path.replace(/^\//, ''))), 'all same-origin paths');
check('core-integrity-matches', EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.every((asset) => {
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, asset.path.replace(/^\//, '')))).digest('hex');
  return asset.integrity === `sha256-${digest}`;
}), 'core sha256 metadata');
check('manifest-tiering', EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.length >= 5 && EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed.length >= 5 && EON_CITY_RUNTIME_ASSET_MANIFEST.fallbacks.length >= 4, 'core/optional/fallback');
check('real-stage-progress', station.includes("runtimeStateMachine.transition('core-ready'") && station.includes("'first-playable-frame'") && renderer.includes('onDetailStage') && station.includes("runtimeStateMachine.transition('ready', 'optional-detail-settled')"), 'first playable frame and settled stage callbacks');
check('recovery-wiring', owner.includes("'eon:session-expired'") && owner.includes("'eon:identity-signed-out'") && station.includes("runtimeStateMachine?.fail?.('webgl-context-lost')") && station.includes("runtimeStateMachine?.degrade?.('performance-governor')"), 'expiry/context/quality');
const currentMinimalDirectHud = station.includes('data-eon-play-objective')
  && station.includes('data-eon-play-nearby')
  && station.includes('data-eon-play-open-controls aria-haspopup="dialog">More</button>')
  && station.includes('data-eon-play-menu-section="work"')
  && station.includes('data-eon-play-share-city>Share City invite</button>')
  && station.includes('bindEonCitySharingCenter(root, { onStatus: setStatus })');
check('minimal-direct-hud', currentMinimalDirectHud, 'objective/nearby/direct More plus review-first Sharing Center inside Menu');
check('truth-boundaries', !owner.includes('localStorage') && !owner.includes('queryString') && EON_CITY_RUNTIME_ASSET_MANIFEST.truth.remoteArtDependency === false && EON_CITY_RUNTIME_ASSET_MANIFEST.truth.targetFramesAreRuntimeAssets === false, 'no client access bypass or remote art');
check('art-bible-preserved', owner.includes("from './eon-city-art-bible.js'") && renderer.includes('getEonCityArtBibleSummary'), 'W624A remains runtime authority');

const report = {
  schema: 'eonapp.w624b-city-runtime-consolidation-gate.v1',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'passed',
  checks,
  canonicalRoute: '/eoncity',
  runtimeOwner: W624B_CITY_RUNTIME_CONSOLIDATION_CONTRACT.runtimeOwner,
  stateCount: EON_CITY_RUNTIME_STATES.length,
  assetCounts: {
    coreRequired: EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.length,
    optionalStreamed: EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed.length,
    fallbacks: EON_CITY_RUNTIME_ASSET_MANIFEST.fallbacks.length,
    targetFrameReferences: EON_CITY_RUNTIME_ASSET_MANIFEST.targetFrameReferences.length
  },
  browserDeviceProof: false,
  finalVisualCertification: false,
  nextWave: 'W624C'
};
fs.mkdirSync(path.join(root, 'reports', 'w624b-city-runtime'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'w624b-city-runtime', 'launch-board.json'), `${JSON.stringify(report, null, 2)}\n`);

if (failures.length) {
  console.error(`W624B gate failed (${failures.length}/${checks.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`W624B gate passed ${checks.length}/${checks.length}.`);
console.log(`One owner, ${EON_CITY_RUNTIME_STATES.length} runtime states, ${EON_CITY_RUNTIME_ASSET_MANIFEST.coreRequired.length} core assets, ${EON_CITY_RUNTIME_ASSET_MANIFEST.optionalStreamed.length} optional assets.`);
console.log('Real browser/device recovery and visual parity remain pending; source architecture does not certify final City quality.');
