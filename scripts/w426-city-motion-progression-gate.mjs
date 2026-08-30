#!/usr/bin/env node
/** W426 source gate: Babylon motion and future visual upgrades remain safe, local and preview-only. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCityAssetDesignKitSummary, getCityAssetDesignTruth, validateCityAssetDesignKit } from '../assets/js/city/eon-city-asset-design-kit.js';
import { getCityVisualProgressionPlan, getCityVisualProgressionTruth, validateCityVisualProgressionPlan } from '../assets/js/city/eon-city-visual-progression.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW426CityMotionProgression() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const runtime = read('assets/js/city/eon-city-vector-art-runtime.js');
  const renderer = read('assets/js/city/eon-city-play-babylon.js');
  const docs = read('docs/W426_CITY_VISUAL_MOTION_AND_ASSET_DESIGN_FOUNDATION_2026-06-29.md');
  const asset = getCityAssetDesignKitSummary();
  const assetTruth = getCityAssetDesignTruth();
  const plan = getCityVisualProgressionPlan({ quality: 'cinematic', requestedTier: 'skyline' });
  const truth = getCityVisualProgressionTruth();

  check('required-files', existsSync(path.join(root, 'assets/js/city/eon-city-asset-design-kit.js')) && existsSync(path.join(root, 'assets/js/city/eon-city-visual-progression.js')) && existsSync(path.join(root, 'docs/W426_CITY_VISUAL_MOTION_AND_ASSET_DESIGN_FOUNDATION_2026-06-29.md')), 'asset design, visual progression and documentation are present');
  check('design-kit-valid', validateCityAssetDesignKit().ok && asset.npcBriefCount >= 6 && asset.buildingBriefCount >= 4, 'professional NPC and building briefs are complete enough for an authored asset handoff');
  check('no-final-asset-claim', asset.finalBinaryArt === false && assetTruth.finalArtShipped === false && assetTruth.remoteNetwork === false, 'design briefs remain local source guidance, not shipped binary art');
  check('foundation-only', validateCityVisualProgressionPlan().ok && plan.activeTier === 'foundation' && plan.requestedTier === 'skyline' && plan.activationBlocked === true, 'future City visual tiers cannot activate from source-only presentation state');
  check('no-commercial-or-collection-read', truth.subscriptionRead === false && truth.paymentRead === false && truth.rewardRead === false && truth.collectionGrantRead === false && truth.referralRead === false, 'W426 does not bind upgrades to payment, referral, reward or Vault Reveal state');
  check('real-svg-motion', /attachSubtleMotion/.test(runtime) && /texture\.vOffset|texture\.uOffset/.test(runtime) && /playPaused|playReducedEffects/.test(runtime), 'repeatable local SVG textures can animate while pause and reduced-effects remain respected');
  check('babylon-integration', /getCityVisualProgressionPlan/.test(renderer) && /getCityAssetDesignKitSummary/.test(renderer) && /vectorArtRuntime\.attachSubtleMotion/.test(renderer), 'the direct Babylon renderer uses the motion and design foundations');
  check('docs-boundaries', /preview-only/i.test(docs) && /no subscription, purchase, reward, referral/i.test(docs) && /real-device/i.test(docs), 'documentation preserves the no-entitlement and external-proof boundaries');
  return Object.freeze({ schema: 'eonapp.w426.city-motion-progression-gate.v1', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['This gate does not provide final 3D NPC/building art, live entitlement logic, or real-device visual certification.']) });
}

export function runW426CityMotionProgressionGate({ writeArtifact = true } = {}) {
  const report = inspectW426CityMotionProgression();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w426-city-motion-progression-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW426CityMotionProgressionGate();
  process.stdout.write(`W426 City motion + visual progression gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
