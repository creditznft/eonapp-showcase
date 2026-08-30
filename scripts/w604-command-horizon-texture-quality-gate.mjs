#!/usr/bin/env node
/** W604 source gate — original Command Horizon PBR texture asset integrity and truthful quality selection. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CITY_ASSET_CATALOG, getCityAssetVariant, validateCityAssetCatalog } from '../assets/js/city/eon-city-asset-catalog.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const checks = [];
const check = (id, ok, message) => checks.push({ id, ok: Boolean(ok), message });
const bytes = (relative) => fs.readFileSync(path.join(ROOT, relative));
const hash = (relative) => crypto.createHash('sha256').update(bytes(relative)).digest('hex');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

function parseGlb(relative) {
  const content = bytes(relative);
  if (content.readUInt32LE(0) !== 0x46546c67 || content.readUInt32LE(4) !== 2) throw new Error('invalid-glb');
  let cursor = 12;
  let json = null;
  let bin = null;
  while (cursor < content.length) {
    const length = content.readUInt32LE(cursor);
    const type = content.readUInt32LE(cursor + 4);
    const payload = content.subarray(cursor + 8, cursor + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(payload.toString('utf8').trim());
    if (type === 0x004e4942) bin = payload;
    cursor += 8 + length;
  }
  return { content, json, bin };
}

const assets = Object.freeze([
  Object.freeze({ id: 'command-horizon-arrival-gate-textured', fallback: 'command-horizon-arrival-gate' }),
  Object.freeze({ id: 'command-horizon-command-deck-textured', fallback: 'command-horizon-command-deck' }),
  Object.freeze({ id: 'command-horizon-wayfinding-textured', fallback: 'command-horizon-wayfinding' })
]);

const validation = validateCityAssetCatalog();
check('catalog-valid', validation.ok, validation.errors.join(' ') || 'City asset catalog validates.');
for (const spec of assets) {
  const asset = CITY_ASSET_CATALOG.find((entry) => entry.id === spec.id);
  check(`${spec.id}-record`, asset?.status === 'shipped' && asset?.fallback?.id === spec.fallback, `${spec.id} is source-shipped with its W603 fallback.`);
  check(`${spec.id}-truth`, asset?.tags?.includes('source-generated-png-pbr') && asset?.tags?.includes('ktx2-basis-pending') && asset?.releaseState === 'source-shipped-ktx2-pending-owner-visual-approval-pending', `${spec.id} does not overstate its texture/compression/approval state.`);
  check(`${spec.id}-provenance`, asset?.provenance?.evidencePath === 'docs/city-art/W604_COMMAND_HORIZON_TEXTURE_ASSET_PROVENANCE.md' && asset?.provenance?.derivativeOfThirdParty === false && asset?.constraints?.allowExternalNetwork === false && asset?.constraints?.containsUserData === false, `${spec.id} remains original local art without remote network or user data.`);
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const variant = getCityAssetVariant(asset, quality);
    const relative = String(variant?.sourcePath || '').replace(/^\//, '');
    const publicRelative = path.join('public', relative);
    const sourceExists = Boolean(relative) && fs.existsSync(path.join(ROOT, relative));
    const publicExists = Boolean(relative) && fs.existsSync(path.join(ROOT, publicRelative));
    check(`${spec.id}-${quality}-hash`, sourceExists && publicExists && hash(relative) === variant?.sha256 && hash(publicRelative) === variant?.sha256, `${spec.id} ${quality} source/public copies match the catalog SHA-256.`);
    if (!sourceExists) continue;
    try {
      const { content, json, bin } = parseGlb(relative);
      const serialized = JSON.stringify(json || {});
      const imageBindings = (json?.images || []).every((image) => {
        const view = json?.bufferViews?.[image?.bufferView];
        const offset = Number(view?.byteOffset || 0);
        return image?.mimeType === 'image/png' && !image?.uri && Boolean(view) && Buffer.compare(bin?.subarray(offset, offset + PNG_SIGNATURE.length), PNG_SIGNATURE) === 0;
      });
      const materialBindings = (json?.materials || []).every((material) => material?.pbrMetallicRoughness?.baseColorTexture && material?.pbrMetallicRoughness?.metallicRoughnessTexture && material?.normalTexture && material?.extras?.originalEonPbrTextureSet === true && material?.extras?.ktx2Basis === false);
      const uvBindings = (json?.meshes || []).every((mesh) => (mesh?.primitives || []).every((primitive) => primitive?.attributes?.TEXCOORD_0 !== undefined));
      check(`${spec.id}-${quality}-pbr`, content.readUInt32LE(8) === content.length && json?.asset?.generator === 'EONAPP W604 Command Horizon Original PBR Texture Builder' && json?.asset?.extras?.originalPbrTextures === true && json?.asset?.extras?.ktx2Basis === false && (json?.images || []).length === 4 && (json?.textures || []).length === 4 && imageBindings && materialBindings && uvBindings && (json?.materials || []).some((material) => material?.emissiveTexture) && !serialized.includes('http://') && !serialized.includes('https://') && !serialized.includes('data:'), `${spec.id} ${quality} contains local embedded original PBR PNGs, UVs, bindings, and no remote/data URI.`);
    } catch (error) {
      check(`${spec.id}-${quality}-pbr`, false, `${spec.id} ${quality} could not be parsed: ${error.message}`);
    }
  }
}

const artRuntime = read('assets/js/city/eon-city-original-scene-art-runtime.js');
check('runtime-quality-selection', artRuntime.includes('texturedAssetId') && artRuntime.includes('resolveEonCitySceneArtAssetId') && read('assets/js/city/eon-city-scene-art-quality.js').includes("normalizedQuality === 'lite' || !texturedAssetId ? assetId : texturedAssetId"), 'Runtime uses textureless W603 fallback on Lite and explicit W604 textured assets above Lite.');
check('runtime-truth', artRuntime.includes('getEonCitySceneArtTextureMode(quality)') && artRuntime.includes('ktx2BasisTexturePackShipped: false') && artRuntime.includes('ownerVisualApprovalPending: true'), 'Runtime does not claim KTX2/Basis or owner visual approval.');

const failed = checks.filter((entry) => !entry.ok);
const report = {
  schema: 'eon.city.w604.command-horizon-texture-quality-gate.v1',
  ok: failed.length === 0,
  checks,
  verifiedAt: new Date().toISOString(),
  truthfulState: {
    originalEnvironmentGlbsShipped: true,
    sourceGeneratedPngPbrCandidatesShipped: true,
    liteTexturelessFallbackRetained: true,
    ktx2BasisTexturePackShipped: false,
    ownerVisualApprovalPending: true,
    realBrowserDeviceProofPending: true,
    authenticatedProductionClosurePending: true
  },
  remoteNetwork: false,
  containsUserData: false
};
const output = path.join(ROOT, 'reports', 'w604-command-horizon-textures');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
