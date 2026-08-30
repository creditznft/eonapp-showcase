import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SVG_DIRS = ['assets/city/art', 'public/assets/city/art'];
const VECTOR_RUNTIME = 'assets/js/city/eon-city-vector-art-runtime.js';
const SAFE_RUNTIME = 'assets/js/city/eon-city-safe-texture-runtime.js';
const STAGING = 'assets/js/city/eon-city-engine-staging.js';
const CSS = 'assets/css/eon-city-play.css';

function read(file) { return fs.readFileSync(path.join(ROOT, file), 'utf8'); }

export function inspectW479RCityRemediation({ writeArtifact = true } = {}) {
  const errors = [];
  const svgFiles = [];
  for (const dir of SVG_DIRS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const name of fs.readdirSync(full).filter((item) => item.endsWith('.svg'))) svgFiles.push(path.join(dir, name));
  }
  for (const file of svgFiles) {
    const source = read(file);
    const tag = source.match(/<svg\b[^>]*>/)?.[0] || '';
    if (!/\bwidth="[1-9][0-9]*"/.test(tag)) errors.push(`${file} is missing explicit positive width`);
    if (!/\bheight="[1-9][0-9]*"/.test(tag)) errors.push(`${file} is missing explicit positive height`);
    if (!/\bviewBox="[^"]+"/.test(tag)) errors.push(`${file} is missing viewBox`);
  }

  const vectorRuntime = read(VECTOR_RUNTIME);
  if (!vectorRuntime.includes('createSafeCityTexture')) errors.push('vector art runtime does not use safe texture factory');
  if (/new\s+Texture\s*\(/.test(vectorRuntime)) errors.push('vector art runtime still constructs raw Babylon Texture directly');
  if (!/mipmap:\s*false/.test(vectorRuntime)) errors.push('vector art runtime does not explicitly disable vector mipmaps');

  const safeRuntime = read(SAFE_RUNTIME);
  for (const token of ['normalizeCityTextureDimensions', 'createCityFallbackTexture', 'createSafeCityTexture', 'mipmaps: !noMipmap']) {
    if (!safeRuntime.includes(token)) errors.push(`safe texture runtime missing ${token}`);
  }

  const staging = read(STAGING);
  for (const token of ['DEFAULT_FRAME_BUDGET_MS', 'frameBudgetMs', 'ledger', 'overBudget']) {
    if (!staging.includes(token)) errors.push(`stage queue missing ${token}`);
  }

  const css = read(CSS);
  if (!/\.eon-city-companion-status\{[^}]*gap:\.5rem \.56rem/.test(css)) errors.push('portrait companion chips do not have explicit two-axis gap');
  if (!/\.eon-city-companion-status span\{[^}]*display:inline-flex/.test(css)) errors.push('portrait companion chips are not independent inline-flex pills');
  if (!/white-space:nowrap/.test(css)) errors.push('portrait companion chip labels can fuse/wrap internally');

  const report = {
    schema: 'eonapp.w479r.city-remediation-gate.v1',
    status: errors.length ? 'fail' : 'pass',
    svgFiles: svgFiles.length,
    gates: {
      explicitSvgDimensions: errors.filter((e) => e.includes('.svg')).length === 0,
      safeTextureFactory: vectorRuntime.includes('createSafeCityTexture') && !/new\s+Texture\s*\(/.test(vectorRuntime),
      vectorMipmapPolicy: /mipmap:\s*false/.test(vectorRuntime),
      stageBudgetLedger: ['DEFAULT_FRAME_BUDGET_MS', 'frameBudgetMs', 'ledger', 'overBudget'].every((token) => staging.includes(token)),
      portraitChipLayout: /gap:\.5rem \.56rem/.test(css) && /display:inline-flex/.test(css)
    },
    errors
  };
  if (writeArtifact) {
    fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'artifacts/w479r-city-remediation-gate.json'), JSON.stringify(report, null, 2));
  }
  if (report.status !== 'pass') process.exitCode = 1;
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW479RCityRemediation();
  console.log(JSON.stringify(report, null, 2));
}
