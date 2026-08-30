#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ALL_ROUTE_ROWS, targetToFile } from '../config/route-contract.mjs';
import { minifyDist } from './minify-dist.mjs';
import { resolveBuildSourceRevision, writeBuildProvenance } from './build-provenance.mjs';
import { writeEonOfflinePackManifest } from './eon-offline-pack-manifest.mjs';
import { contentAddressEonCityBinaries, auditEonCityContentAddressedDist } from './eon-city-content-addressed-binaries.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const startedAt = Date.now();

function runNodeScript(relativePath) {
  const result = spawnSync(process.execPath, [path.join(ROOT, relativePath)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env
  });
  if (result.status !== 0) throw new Error(`${relativePath} failed with exit code ${result.status}`);
}

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(absolute);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

function findFiles(dir, predicate, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) findFiles(absolute, predicate, output);
    else if (entry.isFile() && predicate(absolute)) output.push(absolute);
  }
  return output;
}

function anyFileContains(files, needle) {
  return files.some((file) => fs.readFileSync(file, 'utf8').includes(needle));
}

function copyCloudflareDeployFiles() {
  for (const name of ['_headers', '_redirects', '_routes.json']) {
    const source = path.join(ROOT, name);
    if (!fs.existsSync(source)) continue;
    fs.copyFileSync(source, path.join(DIST, name));
  }
}

function materializeReleaseIdentity() {
  const sourceRevision = resolveBuildSourceRevision({ cwd: ROOT });
  if (!sourceRevision) throw new Error('W765R3 requires a resolved source revision for release identity.');
  const releaseId = `w765-2026-07-31-release-identity-${sourceRevision.slice(0, 12)}`;
  const releaseDir = path.join(DIST, 'release');
  const swPath = path.join(DIST, 'sw.js');
  let serviceWorker = fs.readFileSync(swPath, 'utf8');
  if (!serviceWorker.includes('w765-2026-07-31-release-identity-source-template') || !serviceWorker.includes('__EONAPP_RELEASE_SOURCE_REVISION__')) {
    throw new Error('W765R3 service-worker release identity tokens are missing.');
  }
  serviceWorker = serviceWorker.replaceAll('w765-2026-07-31-release-identity-source-template', releaseId).replaceAll('__EONAPP_RELEASE_SOURCE_REVISION__', sourceRevision);
  fs.writeFileSync(swPath, serviceWorker);
  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(path.join(releaseDir, 'runtime-identity.json'), `${JSON.stringify({ schema: 'eonapp.release-runtime-identity.w765r3.v1', releaseId, sourceRevision }, null, 2)}\n`);
  const marker = `<meta name="eonapp-release-identity" content="${releaseId}" data-eonapp-source-revision="${sourceRevision}">`;
  for (const htmlPath of findFiles(DIST, (file) => file.endsWith('.html'))) {
    // Provider ownership files are required to stay exact plain-text tokens;
    // they are not application documents and therefore have no HTML head.
    if (path.relative(DIST, htmlPath).replaceAll(path.sep, '/') === '21a049158b88ba5753ef69b45659efd9.html') continue;
    const html = fs.readFileSync(htmlPath, 'utf8');
    if (!html.includes('</head>')) throw new Error(`W765R3 cannot embed release identity in ${htmlPath}.`);
    fs.writeFileSync(htmlPath, html.replace('</head>', `  ${marker}\n</head>`));
  }
  return Object.freeze({ releaseId, sourceRevision });
}

function materializeCleanRouteFiles() {
  for (const row of ALL_ROUTE_ROWS) {
    if (row.from === '/' || row.from.includes('*') || Number(row.status) !== 200) continue;
    const sourceFile = targetToFile(row.to);
    if (!sourceFile) continue;
    const source = path.join(DIST, sourceFile);
    if (!fs.existsSync(source)) continue;
    const routeDir = path.join(DIST, row.from.replace(/^\/+/, ''));
    const target = path.join(routeDir, 'index.html');
    fs.mkdirSync(routeDir, { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function verifyDist() {
  const required = [
    'create.html',
    'workspace.html',
    'eoncity.html',
    'market.html',
    'vault.html',
    'realm-studio.html',
    path.join('billing', 'index.html'),
    path.join('help', 'index.html'),
    'assets',
    path.join('assets', 'js', 'eon-theme-bootstrap.js'),
    path.join('assets', 'css', 'eon-command-surface.css'),
    path.join('assets', 'css', 'eon-work-surface.css'),
    path.join('assets', 'media', 'sponsor-terminal', 'eonapp-sponsor-terminal-tail.mp4')
  ];
  const missing = required.filter((name) => !fs.existsSync(path.join(DIST, name)));
  const files = fs.existsSync(DIST) ? countFiles(DIST) : 0;
  // W228: retired root surfaces are intentionally excluded from production entrypoints.
  // Assert canonical outputs and a conservative asset floor, not historical page bloat.
  if (missing.length || files < 80) {
    throw new Error(`Vite output incomplete: files=${files}, missing=${missing.join(',') || 'none'}`);
  }
  const requiredStylesheets = [
    { file: path.join('assets', 'css', 'eon-command-surface.css'), selector: '.eon-command-surface' },
    { file: path.join('assets', 'css', 'eon-work-surface.css'), selector: '.eon-work-surface' }
  ];
  for (const stylesheet of requiredStylesheets) {
    const contents = fs.readFileSync(path.join(DIST, stylesheet.file), 'utf8');
    if (!contents.trim() || !contents.includes(stylesheet.selector) || /^\s*<!doctype html/i.test(contents) || /<title>[^<]*404/i.test(contents)) {
      throw new Error(`Production stylesheet is invalid: ${stylesheet.file}`);
    }
  }
  const appShellPages = [
    { file: path.join('billing', 'index.html'), page: 'billing' },
    { file: path.join('help', 'index.html'), page: 'help' }
  ];
  for (const entry of appShellPages) {
    const contents = fs.readFileSync(path.join(DIST, entry.file), 'utf8');
    if (!contents.includes('data-eon-app-shell="1"') || !contents.includes(`data-eon-app-page="${entry.page}"`)) {
      throw new Error(`Unified app-shell contract is missing: ${entry.file}`);
    }
  }
  const emittedScripts = findFiles(path.join(DIST, 'assets'), (file) => file.endsWith('.js'));
  if (!anyFileContains(emittedScripts, 'eonapp.monetization.sponsor-terminal.rt92.v2')) {
    throw new Error('RT92 Sponsor Terminal runtime was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eonapp.quick-command.surface.w724.v1')) {
    throw new Error('Quick Command surface was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'work-surface-adapter-not-registered')) {
    throw new Error('Shared work-surface static adapter loader map was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.city.runtime-owner.w731.v1')) {
    throw new Error('W731 single-runtime owner authority was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.city.workspace-presenter.w748.v1')) {
    throw new Error('W748 City Dock and Focus Workspace presenter was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.city.living-nexus.w749.v1')) {
    throw new Error('W749 central Living Nexus projection and Dock were not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.city.command-centre-live-walls.w750.v1')) {
    throw new Error('W750 Command Centre live walls and genuine Agent Theatre were not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.city.productive-stations.w751.v1')) {
    throw new Error('W751 productive station work loops were not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.city.missions-progression.w752.v1')) {
    throw new Error('W752 missions, XP, deterministic Vault Reveals and My Realm reflection were not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.share-command-center.w753.v1')) {
    throw new Error('W753 Share Command Center 2.0 was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.share.reviewed-handoff-receipt.w753.v1')) {
    throw new Error('W753 reviewed Share & Capture receipt authority was not emitted into the production JavaScript assets');
  }
  if (!anyFileContains(emittedScripts, 'eon.referral.public-status.w753.v1')) {
    throw new Error('W753 tri-state referral truth contract was not emitted into the production JavaScript assets');
  }
  return files;
}

async function runViteBuild() {
  const viteCli = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [viteCli, 'build', '--config', path.join(ROOT, 'vite.config.mjs'), '--logLevel', 'info'], {
      cwd: ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let completed = false;
    let killedAfterCompletion = false;
    let tail = '';
    const deadline = setTimeout(() => {
      if (!completed) {
        child.kill('SIGKILL');
        reject(new Error(`Vite build did not reach its completion marker within 180 seconds.\n${tail.slice(-8000)}`));
      }
    }, 180000);

    const consume = (chunk, isError = false) => {
      const text = String(chunk || '');
      tail = `${tail}${text}`.slice(-24000);
      if (isError && /error|failed|cannot|warning/i.test(text)) process.stderr.write(text);
      if (!completed && /built in\s+[\d.]+s/i.test(text.replace(/\x1b\[[0-9;]*m/g, ''))) {
        completed = true;
        clearTimeout(deadline);
        // In this container a benign plugin/esbuild handle can keep the CLI alive after a complete build.
        setTimeout(() => {
          if (child.exitCode === null && child.signalCode === null) {
            killedAfterCompletion = true;
            child.kill('SIGTERM');
          }
        }, 150);
      }
    };
    child.stdout.on('data', (chunk) => consume(chunk, false));
    child.stderr.on('data', (chunk) => consume(chunk, true));
    child.on('error', reject);
    child.on('close', (code, signal) => {
      clearTimeout(deadline);
      if (completed && (code === 0 || killedAfterCompletion || signal === 'SIGTERM')) {
        resolve({ code, signal, killedAfterCompletion, tail });
      } else {
        reject(new Error(`Vite build exited before completion (code=${code}, signal=${signal || 'none'}).\n${tail.slice(-8000)}`));
      }
    });
  });
}

try {
  runNodeScript('scripts/w623d-production-reachability-gate.mjs');
  runNodeScript('scripts/write-r3a1-ai-api-contract-board.mjs');
  runNodeScript('scripts/sync-local-ai-csp.mjs');
  runNodeScript('scripts/sync-route-contract.mjs');
  runNodeScript('scripts/sync-w477-route-seo.mjs');
  runNodeScript('scripts/sync-public-assets.mjs');
  const vite = await runViteBuild();
  materializeCleanRouteFiles();
  copyCloudflareDeployFiles();
  const contentAddressedCityAssets = contentAddressEonCityBinaries({ distDir: DIST, removeOriginals: true });
  const contentAddressAudit = auditEonCityContentAddressedDist({ distDir: DIST });
  if (!contentAddressAudit.ok) throw new Error('W766IR2-F emitted City binary content-address audit failed.');
  const emittedFiles = verifyDist();
  const minify = await minifyDist({ distDir: DIST, concurrency: 4 });
  const releaseIdentity = materializeReleaseIdentity();
  const offlinePack = writeEonOfflinePackManifest({ distDir: DIST, releaseId: releaseIdentity.releaseId, sourceRevision: releaseIdentity.sourceRevision });
  const buildProvenance = await writeBuildProvenance({ distDir: DIST, sourceRevision: process.env.EONAPP_SOURCE_REVISION });
  // Pages incremental uploads may retain an older release identity when this
  // public endpoint is absent. Emit it from the immutable build provenance.
  const releaseDir = path.join(DIST, 'release');
  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(path.join(releaseDir, 'candidate-provenance.json'), `${JSON.stringify({
    schema: 'eonapp.release-identity.build.v1',
    candidateDigest: buildProvenance.provenance.distribution.sha256,
    commitSha: buildProvenance.provenance.sourceRevision,
    buildProvenance: 'build-provenance.json'
  }, null, 2)}\n`);
  const report = {
    schema: 'eon.build.production.v2',
    ok: true,
    durationMs: Date.now() - startedAt,
    distFiles: emittedFiles,
    vite: {
      completed: true,
      benignHandleTerminated: vite.killedAfterCompletion,
      exitCode: vite.code,
      signal: vite.signal || null
    },
    minify,
    contentAddressedCityAssets: {
      schema: contentAddressedCityAssets.schema,
      assetsAddressed: contentAddressedCityAssets.assetsAddressed,
      bytesAddressed: contentAddressedCityAssets.bytesAddressed,
      rewrittenFiles: contentAddressedCityAssets.rewrittenFiles,
      rewrittenReferences: contentAddressedCityAssets.rewrittenReferences,
      rewrittenGltfUris: contentAddressedCityAssets.rewrittenGltfUris,
      removedOriginals: contentAddressedCityAssets.removedOriginals,
      emittedBinaryFiles: contentAddressAudit.binaryFiles,
      immutableManifest: contentAddressedCityAssets.immutableManifest
    },
    buildProvenance: {
      path: path.basename(buildProvenance.destination),
      sourceRevision: buildProvenance.provenance.sourceRevision,
      distributionSha256: buildProvenance.provenance.distribution.sha256
    },
    releaseIdentity,
    offlinePack: {
      path: path.relative(DIST, offlinePack.destination).split(path.sep).join('/'),
      digest: offlinePack.manifest.digest,
      packs: offlinePack.manifest.packs
    }
  };
  fs.writeFileSync(path.join(DIST, '.eon-build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
} catch (error) {
  console.error(error?.stack || error);
  process.exit(1);
}
