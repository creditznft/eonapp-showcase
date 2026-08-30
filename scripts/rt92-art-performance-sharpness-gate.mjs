import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildEonCityRt92ArtPerformancePlan } from '../assets/js/city/rt92/eon-city-rt92-art-performance-master.js';
import landmarks from '../config/rt92-my-frontier-bespoke-landmarks.generated.json' with { type: 'json' };

const checks = [];
const check = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail });
const artDir = path.resolve('assets/city/art/rt92');
const vectorManifest = JSON.parse(fs.readFileSync(path.join(artDir, 'manifest.json'), 'utf8'));
const glbs = [];
for (const family of landmarks.entries || []) for (const lod of family.lods || []) glbs.push(lod);
const glbBytes = glbs.reduce((sum, row) => sum + Number(row.bytes || 0), 0);
check('vector-budget', vectorManifest.totalBytes < 300_000, `${vectorManifest.totalBytes} bytes`);
check('vector-count', vectorManifest.fileCount >= 24, `${vectorManifest.fileCount} SVGs`);
check('glb-programme-budget', glbBytes < 8_000_000, `${glbBytes} bytes`);
check('bespoke-glb-count', glbs.length === 15, `${glbs.length} GLBs`);
for (const q of ['lite', 'balanced', 'cinematic']) {
  const p = buildEonCityRt92ArtPerformancePlan({ quality: q });
  check(`${q}-first-frame-zero`, p.firstFrameNewBinaryBytes === 0);
  check(`${q}-one-runtime`, p.oneEngine && p.oneScene && p.oneRenderLoop && !p.ownsEngine && !p.ownsScene && !p.ownsRenderLoop);
  check(`${q}-rings`, p.highDetailRadius < p.warmRadius, `${p.highDetailRadius}/${p.warmRadius}`);
}
const rt92JsDir = path.resolve('assets/js/city/rt92');
const source = [...fs.readdirSync(rt92JsDir).filter((n) => n.endsWith('.js')).map((n) => path.join(rt92JsDir, n))];
for (const sub of ['command-hub','signal','storm','my-frontier']) {
  const d = path.join(rt92JsDir, sub); if (fs.existsSync(d)) for (const n of fs.readdirSync(d).filter((x)=>x.endsWith('.js'))) source.push(path.join(d,n));
}
const joined = source.map((f)=>fs.readFileSync(f,'utf8')).join('\n');
check('no-second-engine', !/runRenderLoop|new\s+Engine\s*\(|new\s+Scene\s*\(/.test(joined));
check('no-remote-fetch', !/fetch\s*\(\s*['"]https?:\/\//.test(joined));
check('no-rt92-raster-art', !fs.readdirSync(artDir).some((n)=>/\.(png|jpe?g|webp|avif)$/i.test(n)));
check('sharpness-structure-ratio', /neutralStructureShareMin:\s*0\.7/.test(joined));
check('sharpness-emission-ratio', /emissiveShareMax:\s*0\.1/.test(joined));
const failed = checks.filter((c)=>!c.ok);
const receipt = { schema:'eon.city.rt92.art-performance-sharpness-gate.v1', pass: failed.length===0, checks, digest: crypto.createHash('sha256').update(JSON.stringify(checks)).digest('hex') };
fs.mkdirSync('artifacts/rt92-grand-art', { recursive: true });
fs.writeFileSync('artifacts/rt92-grand-art/wave9-performance-sharpness.json', JSON.stringify(receipt,null,2)+'\n');
console.log(`RT92 Wave 9 performance/sharpness: ${checks.length-failed.length}/${checks.length} PASS`);
for (const f of failed) console.error(`FAIL ${f.name}: ${f.detail}`);
if (failed.length) process.exit(1);
