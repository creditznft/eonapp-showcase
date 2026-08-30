import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_ANIMATION_MANIFEST } from '../assets/js/city/w649/eon-city-w649-animation-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from '../assets/js/city/w649/eon-city-w649-district-manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const animationById = new Map(EON_CITY_W649_ANIMATION_MANIFEST.entries.map((entry) => [entry.characterId, entry]));
const districtLinks = new Map();
for (const district of EON_CITY_W649_DISTRICT_MANIFEST.districts) {
  for (const assetId of district.assets) {
    const links = districtLinks.get(assetId) || [];
    links.push({ districtId: district.id, actions: district.actions });
    districtLinks.set(assetId, links);
  }
}
const interactionExpectation = (entry, animation) => {
  if (entry.id === 'eoncity-eonbot-orbit') return ['hover', 'follow', 'inspect', 'dock'];
  if (entry.id === 'eoncity-eonbot-charging-station') return ['available', 'occupied', 'release'];
  const aliases = animation?.aliases || {};
  return ['idle', 'walk', 'run', 'turn', 'inspect'].filter((state) => state === 'turn'
    ? Boolean(aliases.walk || aliases.idle)
    : state === 'inspect'
      ? Boolean(aliases.interact || aliases.talk || aliases.open || aliases.wave)
      : Boolean(aliases[state]));
};
const rows = EON_CITY_W649_CHARACTER_MANIFEST.entries.map((entry) => {
  const animation = animationById.get(entry.id) || null;
  return {
    assetId: entry.id,
    intendedRole: entry.role,
    district: entry.district,
    sourceFile: entry.sourceFile,
    lifecycle: entry.lifecycle,
    loadTier: entry.loadTier,
    variants: entry.variants,
    animationClipCount: animation?.clipCount ?? entry.animations ?? 0,
    animationClips: animation?.clips || entry.animationNames || [],
    animationAliases: animation?.aliases || {},
    requiredBehaviorProof: interactionExpectation(entry, animation),
    districtLinks: districtLinks.get(entry.id) || [],
    sourcePresent: true,
    exactBytesAndHashRequired: true,
    activeRuntimeImportExpected: entry.lifecycle === 'active',
    fallbackPolicy: entry.id.includes('pathfinder-a-vanguard')
      ? 'animation-donor-and-last-resort'
      : 'decoder-free-fallback-only-when-primary-unavailable',
    automatedAssetProof: true,
    browserLoadedProof: false,
    fallbackInactiveProof: false,
    animationVisualProof: false,
    functionalRoleProof: false,
    terminalOrDockProof: false,
    authenticatedHumanProof: false
  };
});
const output = {
  schema: 'eonapp.w662g.cast-certification.2026-07-23.v1',
  generatedFrom: {
    characterManifest: EON_CITY_W649_CHARACTER_MANIFEST.schema,
    animationManifest: EON_CITY_W649_ANIMATION_MANIFEST.schema,
    districtManifest: EON_CITY_W649_DISTRICT_MANIFEST.schema
  },
  truthBoundary: {
    sourceAndHashProofDoesNotEqualVisualAcceptance: true,
    fallbackIsAllowedOnlyWhenTruthfullyReported: true,
    animationClipNamesDoNotProveDeformationQuality: true,
    browserAndAuthenticatedHumanProofRemainSeparate: true
  },
  counts: {
    castAssets: rows.length,
    animatedProfiles: EON_CITY_W649_ANIMATION_MANIFEST.entries.length,
    districts: EON_CITY_W649_DISTRICT_MANIFEST.districts.length,
    expectedVariantFiles: rows.length * 2
  },
  roster: rows
};
await fs.mkdir(path.join(root, 'config'), { recursive: true });
await fs.writeFile(path.join(root, 'config/w662g-cast-certification.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Generated ${rows.length} W662G cast rows.`);
