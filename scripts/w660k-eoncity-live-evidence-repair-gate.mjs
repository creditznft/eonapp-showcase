#!/usr/bin/env node
/** W660K — live evidence repair, travel presentation and visual composition gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEonCityInputContractTruth } from '../assets/js/city/eon-city-input-contract.js';
import { describeEonCityW660kTravelTiming } from '../assets/js/city/w660k/eon-city-w660k-travel-presentation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireDist = process.argv.includes('--require-dist');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
const composition = read('assets/js/city/w660i/eon-city-w660i-district-composition.js');
const input = read('assets/js/city/eon-city-input-contract.js');
const productCss = read('assets/css/eon-city-product-layer.css');
const playCss = read('assets/css/eon-city-play.css');
const pkg = JSON.parse(read('package.json'));
const truth = getEonCityInputContractTruth();
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
const distText = () => {
  const directory = path.join(root, 'dist', 'assets');
  if (!fs.existsSync(directory)) return '';
  return fs.readdirSync(directory).filter((name) => /\.(?:js|css)$/.test(name)).map((name) => fs.readFileSync(path.join(directory, name), 'utf8')).join('\n');
};

add('short-tap-movement-contract', truth.shortTapGuaranteesMovementPulse === true && truth.minimumPointerPulseMs >= 200 && /minimumPointerPulseMs/.test(input));
add('travel-overlay-contract', /data-eon-w660k-travel-transition/.test(product) && /First visit may take 3–10 seconds/.test(product));
add('travel-immediate-core-arrival', /setPlayerPose\((?:arrivalDestination|result\.destination)\)[\s\S]*await activateDistrictAssets/.test(product));
add('travel-timing-instrumented', /eonCityLastTravelMs/.test(product) && /elapsedMs/.test(product));
add('travel-auto-clears-map', /closePanels\(\)[\s\S]*travelPresentation\.begin/.test(product) && /travelPresentation\.complete/.test(product));
add('travel-slow-state-truthful', describeEonCityW660kTravelTiming(9_500).phase === 'slow' && describeEonCityW660kTravelTiming(5_000).phase === 'first-visit');
add('world-visible-desktop-panels', /place-items:center end/.test(productCss) && /backdrop-filter:blur\(4px\)/.test(productCss));
add('modal-dpad-separation', /eon-city-overlay-open[\s\S]*eon-city-reduced-touch/.test(playCss) && /pointer-events:none!important/.test(playCss));
add('district-vista-layer', /function buildDistrictVista/.test(composition) && /district-aerial-courier/.test(composition) && /vistaMeshCount/.test(composition));
add('district-lighting-readable', /rimLight/.test(composition) && /0\.0095/.test(composition) && /districtLightCount/.test(composition));
add('one-owner-preserved', /ownsRenderLoop:\s*false/.test(composition) && !/new Engine\(/.test(composition));
add('source-receipt', fs.existsSync(path.join(root, 'docs/W660K_LIVE_EONCITY_EVIDENCE_REPAIR_SOURCE_RECEIPT_2026-07-20.md')));
add('package-script', pkg.scripts?.['qa:w660k-eoncity-live-evidence-repair']?.includes('w660k-eoncity-live-evidence-repair-gate'));
add('release-chain-includes-w660k', pkg.scripts?.['qa:w660-release-source']?.includes('qa:w660k-eoncity-live-evidence-repair'));
const emitted = requireDist ? distText() : '';
add('dist-present', !requireDist || emitted.length > 0);
add('dist-w660k-emitted', !requireDist || ['data-eon-w660k-travel-transition', 'eonCityLastTravelMs', 'district-aerial-courier'].every((needle) => emitted.includes(needle)));

const result = {
  schema: 'eonapp.w660k.eoncity-live-evidence-repair-gate.v1',
  wave: 'W660K',
  ok: checks.every((entry) => entry.pass),
  passed: checks.filter((entry) => entry.pass).length,
  total: checks.length,
  checks,
  claims: { sourceCertified: checks.every((entry) => entry.pass), headedVisualEvidenceSeparate: true, productionCertified: false }
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
