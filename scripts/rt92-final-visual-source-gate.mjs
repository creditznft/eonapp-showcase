import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const checks=[];
const check=(name,ok,detail='')=>checks.push({name,ok:Boolean(ok),detail});
const read=(p)=>fs.readFileSync(path.resolve(p),'utf8');
const exists=(p)=>fs.existsSync(path.resolve(p));
const sha=(p)=>crypto.createHash('sha256').update(fs.readFileSync(path.resolve(p))).digest('hex');

const required=[
 'assets/js/city/rt92/eon-city-rt92-grand-art-bible.js',
 'assets/js/city/rt92/eon-city-rt92-shared-art-runtime.js',
 'assets/js/city/rt92/eon-city-rt92-environmental-life-art.js',
 'assets/js/city/rt92/eon-city-rt92-cinematic-vfx-art.js',
 'assets/js/city/rt92/eon-city-rt92-art-performance-master.js',
 'assets/js/city/rt92/command-hub/eon-city-rt92-command-hub-gold-master.js',
 'assets/js/city/rt92/signal/eon-city-rt92-signal-deep-art.js',
 'assets/js/city/rt92/storm/eon-city-rt92-storm-deep-art.js',
 'assets/js/city/rt92/my-frontier/eon-city-rt92-my-frontier-urban-fabric.js',
 'assets/js/city/rt92/my-frontier/eon-city-rt92-my-frontier-bespoke-landmarks.js',
 'assets/js/city/rt92/my-frontier/eon-city-rt92-my-frontier-bespoke-presenter.js',
 'config/rt92-my-frontier-bespoke-landmarks.generated.json',
 'assets/city/art/rt92/manifest.json'
];
for(const f of required) check(`required:${f}`,exists(f));

const vector=JSON.parse(read('assets/city/art/rt92/manifest.json'));
check('vector-schema',vector.schema==='eon.city.rt92.vector-art.v1');
check('vector-count',Number(vector.fileCount)>=24,`${vector.fileCount}`);
check('vector-budget',Number(vector.totalBytes)<300000,`${vector.totalBytes}`);
for(const f of ['world-command-hub.svg','world-signal-frontier.svg','world-storm-sector.svg','world-my-frontier.svg']) check(`key-art:${f}`,vector.files.includes(f)&&exists(`assets/city/art/rt92/${f}`));
check('no-rt92-raster',!vector.files.some((f)=>/\.(png|jpe?g|webp|avif)$/i.test(f)));

const landmarks=JSON.parse(read('config/rt92-my-frontier-bespoke-landmarks.generated.json'));
check('landmark-family-count',(landmarks.entries||[]).length===5,`${(landmarks.entries||[]).length}`);
let glbCount=0, glbBytes=0, externalTextures=0, badCopies=0, badHashes=0;
for(const family of landmarks.entries||[]){
  check(`landmark-lods:${family.buildingId}`,(family.lods||[]).length===3,`${(family.lods||[]).length}`);
  let last=Infinity;
  for(const lod of family.lods||[]){
    glbCount++; glbBytes+=Number(lod.bytes||0); externalTextures+=Number(lod.externalTextures||0);
    check(`lod-descends:${family.buildingId}:${lod.lod}`,Number(lod.bytes||0)<last,`${lod.bytes}<${last}`); last=Number(lod.bytes||0);
    const src=String(lod.sourcePath||''); const pub=`public/${src}`;
    if(!exists(src)||!exists(pub)||fs.statSync(src).size!==fs.statSync(pub).size||sha(src)!==sha(pub)) badCopies++;
    if(exists(src)&&sha(src)!==lod.sha256) badHashes++;
  }
}
check('glb-count',glbCount===15,`${glbCount}`);
check('glb-budget',glbBytes<8000000,`${glbBytes}`);
check('glb-zero-external-textures',externalTextures===0,`${externalTextures}`);
check('glb-source-public-byte-identical',badCopies===0,`${badCopies} mismatches`);
check('glb-content-addressed-hash-valid',badHashes===0,`${badHashes} mismatches`);

const rt92Files=[];
const walk=(dir)=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else rt92Files.push(p);}};
walk(path.resolve('assets/js/city/rt92'));
const source=rt92Files.filter((f)=>f.endsWith('.js')).map((f)=>fs.readFileSync(f,'utf8')).join('\n');
check('one-engine-scene-loop',!/runRenderLoop|new\s+Engine\s*\(|new\s+Scene\s*\(/.test(source));
check('no-remote-art-fetch',!/fetch\s*\(\s*['"]https?:\/\//.test(source));
check('no-progress-storage-authority',!/localStorage|sessionStorage/.test(source));
check('no-art-todo',!/\bTODO\b|\bFIXME\b|intentionally unfinished visual-production/i.test(source));
check('first-frame-zero',/firstFrameNewBinaryBytes:\s*0/.test(read('assets/js/city/rt92/eon-city-rt92-grand-art-bible.js')));
check('sharpness-law',/neutralStructureShareMin:\s*0\.7/.test(source)&&/emissiveShareMax:\s*0\.1/.test(source));

const hub=read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
const signal=read('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
const storm=read('assets/js/city/w792/eon-expanse-w792c-storm-sector-presenter.js');
const frontier=read('assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js');
check('command-integrated',/rt92CommandHubArt/.test(hub)&&/rt92EnvironmentalLife/.test(hub)&&/rt92CinematicVfx/.test(hub));
check('signal-integrated',/rt92SignalDeepArt/.test(signal)&&/rt92EnvironmentalLife/.test(signal)&&/rt92CinematicVfx/.test(signal));
check('storm-integrated',/rt92StormDeepArt/.test(storm)&&/rt92EnvironmentalLife/.test(storm)&&/rt92CinematicVfx/.test(storm));
check('frontier-integrated',/rt92UrbanFabric/.test(frontier)&&/rt92BespokeLandmarks/.test(frontier)&&/rt92EnvironmentalLife/.test(frontier)&&/rt92CinematicVfx/.test(frontier));
check('world-cards-upgraded',/\/assets\/city\/art\/rt92\/world-signal-frontier\.svg/.test(hub)&&/\/assets\/city\/art\/rt92\/world-storm-sector\.svg/.test(hub)&&/\/assets\/city\/art\/rt92\/world-my-frontier\.svg/.test(hub));
check('canonical-transition-boundaries',/setCurrentWorld\('signal-frontier', \{ reason: 'direct-signal-entry' \}\)/.test(hub)&&/setCurrentWorld\('storm-sector', \{ reason: 'storm-sector-transition-complete' \}\)/.test(hub)&&/setCurrentWorld\('my-frontier', \{ reason: 'direct-my-frontier-entry' \}\)/.test(hub)&&/setCurrentWorld\('command-hub', \{ reason: 'return-to-command-hub' \}\)/.test(hub));

const failed=checks.filter((x)=>!x.ok);
const receipt={schema:'eon.city.rt92.final-visual-source-gate.v1',pass:failed.length===0,checks,summary:{passCount:checks.length-failed.length,totalCount:checks.length,vectorBytes:vector.totalBytes,vectorFileCount:vector.fileCount,bespokeGlbBytes:glbBytes,bespokeGlbCount:glbCount,landmarkFamilyCount:(landmarks.entries||[]).length,firstFrameNewBinaryBytes:0,intentionallyUnfinishedHeroArtwork:0},digest:crypto.createHash('sha256').update(JSON.stringify(checks)).digest('hex')};
fs.mkdirSync('artifacts/rt92-grand-art',{recursive:true});
fs.writeFileSync('artifacts/rt92-grand-art/FINAL_VISUAL_SOURCE_GATE.json',JSON.stringify(receipt,null,2)+'\n');
console.log(`RT92 final visual source gate: ${receipt.summary.passCount}/${receipt.summary.totalCount} PASS`);
console.log(`Vector art: ${receipt.summary.vectorFileCount} files / ${receipt.summary.vectorBytes} bytes`);
console.log(`Bespoke landmarks: ${receipt.summary.bespokeGlbCount} GLBs / ${receipt.summary.bespokeGlbBytes} bytes`);
for(const f of failed) console.error(`FAIL ${f.name}: ${f.detail}`);
if(failed.length)process.exit(1);
