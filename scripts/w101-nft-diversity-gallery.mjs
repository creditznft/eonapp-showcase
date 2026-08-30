import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildNftVisualBundle } from '../assets/js/utils/nft-visuals.js';
import { getW101NftDiversityDescriptors } from '../assets/js/utils/marketplace-w101-polish.js';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'CodexAuditPack', 'W101_MARKETPLACE_NFT_LOOTBOX_REWARDS');
fs.mkdirSync(OUT, { recursive: true });
const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'ultra', 'god-tier'];
const hollowModes = ['aurora-bloom', 'hologram-vault', 'orbital-relic', 'quantum-window'];
const descriptors = getW101NftDiversityDescriptors();
const rows = descriptors.map((descriptor, index) => {
  const rarity = rarities[index % rarities.length];
  const visualDescriptor = {
    id: descriptor.id,
    title: descriptor.title,
    rarity,
    collectionType: descriptor.collectionType,
    description: `${descriptor.utilityCategory}. ${descriptor.composition}. ${descriptor.palette}. ${descriptor.motion}.`,
    seed: descriptor.seed,
    metadata: {
      visualTheme: descriptor.palette,
      composition: descriptor.composition,
      motion: descriptor.motion,
      utilityCategory: descriptor.utilityCategory
    }
  };
  const bundle = buildNftVisualBundle(visualDescriptor, {
    hollow: index % 3 === 0,
    wide: true,
    hollowMode: hollowModes[index % hollowModes.length]
  });
  const svg = String(bundle.svg || '');
  const digest = crypto.createHash('sha256').update(svg).digest('hex');
  return {
    ...descriptor,
    rarity,
    svg,
    digest,
    archetype: bundle.archetype || '',
    hollowMode: bundle.hollowMode || '',
    stylePack: bundle.stylePack || '',
    traitFamily: bundle.traitFamily || '',
    qualityScore: Number(bundle.qualityScore || 0),
    qaPass: bundle.qaPass !== false
  };
});

const summary = {
  schema: 'eon.w101.nft-diversity-gallery.v1',
  generatedAt: new Date().toISOString(),
  count: rows.length,
  uniqueDigests: new Set(rows.map((row) => row.digest)).size,
  uniqueArchetypes: new Set(rows.map((row) => row.archetype)).size,
  uniqueHollowModes: new Set(rows.map((row) => row.hollowMode)).size,
  uniqueCompositions: new Set(rows.map((row) => row.composition)).size,
  uniquePalettes: new Set(rows.map((row) => row.palette)).size,
  uniqueMotions: new Set(rows.map((row) => row.motion)).size,
  uniqueUtilityCategories: new Set(rows.map((row) => row.utilityCategory)).size,
  minQualityScore: Math.min(...rows.map((row) => row.qualityScore)),
  qaPassCount: rows.filter((row) => row.qaPass).length,
  rows: rows.map(({ svg, ...row }) => row)
};

const cards = rows.map((row) => `
  <article class="card">
    <div class="art">${row.svg}</div>
    <div class="copy">
      <div class="eyebrow">${row.collectionType.replaceAll('_', ' ')} · ${row.rarity}</div>
      <h2>${row.title}</h2>
      <p><strong>Composition:</strong> ${row.composition}</p>
      <p><strong>Palette:</strong> ${row.palette}</p>
      <p><strong>Motion:</strong> ${row.motion}</p>
      <p><strong>Utility:</strong> ${row.utilityCategory}</p>
      <div class="chips"><span>${row.archetype || 'procedural'}</span><span>${row.hollowMode || 'solid'}</span><span>QA ${row.qualityScore}</span></div>
      <code>${row.digest.slice(0, 18)}…</code>
    </div>
  </article>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>W101 NFT Diversity Gallery</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#050914;color:#e2e8f0}*{box-sizing:border-box}body{margin:0;padding:28px;background:radial-gradient(circle at 50% 0,rgba(59,130,246,.12),transparent 35%),#050914}.header{max-width:1500px;margin:0 auto 24px}.kicker{color:#67e8f9;font-size:12px;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.header h1{margin:8px 0;font-size:clamp(28px,4vw,54px)}.summary{display:flex;flex-wrap:wrap;gap:8px;color:#cbd5e1}.summary span,.chips span{border:1px solid rgba(148,163,184,.22);border-radius:999px;padding:5px 9px;background:rgba(15,23,42,.75);font-size:12px}.grid{max-width:1500px;margin:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{min-width:0;border:1px solid rgba(148,163,184,.2);border-radius:18px;overflow:hidden;background:linear-gradient(160deg,rgba(17,24,39,.96),rgba(2,6,23,.98));box-shadow:0 20px 55px rgba(0,0,0,.28)}.art{aspect-ratio:4/3;display:grid;place-items:center;padding:14px;background:radial-gradient(circle at 50% 20%,rgba(99,102,241,.17),transparent 60%)}.art svg{width:100%!important;height:100%!important;max-width:100%;max-height:100%;object-fit:contain;overflow:visible}.copy{padding:15px}.eyebrow{color:#7dd3fc;font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.copy h2{margin:6px 0 12px;font-size:20px}.copy p{margin:5px 0;color:#aebbd0;font-size:13px;line-height:1.45}.copy strong{color:#dbeafe}.chips{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0}.copy code{display:block;overflow:hidden;text-overflow:ellipsis;color:#64748b;font-size:11px}@media(max-width:1000px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:620px){body{padding:14px}.grid{grid-template-columns:1fr}.art{aspect-ratio:1/1}.card{border-radius:14px}}@media(prefers-reduced-motion:reduce){svg,*{animation:none!important}}
</style></head><body>
<header class="header"><div class="kicker">W101 human visual review</div><h1>NFT generator diversity gallery</h1><p>Procedural outputs across subject, composition, palette, motion and utility category. These are product visuals, not investment promises.</p><div class="summary"><span>${summary.count} outputs</span><span>${summary.uniqueDigests} unique SHA-256 digests</span><span>${summary.uniqueArchetypes} archetypes</span><span>${summary.uniqueCompositions} compositions</span><span>${summary.uniquePalettes} palettes</span><span>${summary.uniqueMotions} motion concepts</span><span>Minimum QA ${summary.minQualityScore}</span></div></header>
<main class="grid">${cards}</main></body></html>`;

fs.writeFileSync(path.join(OUT, 'W101_NFT_DIVERSITY_GALLERY.html'), html);
fs.writeFileSync(path.join(OUT, 'W101_NFT_DIVERSITY_REPORT.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
