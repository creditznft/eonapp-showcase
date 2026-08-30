#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCompletePagesBundleManifest, stageCompletePagesDeployRoot } from './lib/w660l-pages-deploy-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  if (!key.startsWith('--')) continue;
  const value = process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[++index] : 'true';
  args.set(key.slice(2), value);
}
const candidateRoot = path.resolve(root, args.get('candidate') || 'artifacts/w641-release-candidate');
const outputRoot = path.resolve(root, args.get('output') || 'artifacts/w660l-complete-pages-bundle');
const deployRoot = path.join(outputRoot, 'deploy-root');
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
const staged = stageCompletePagesDeployRoot({ sourceRoot: root, candidateRoot, outputRoot: deployRoot });
const sourceCommit = String(args.get('source-commit') || (() => { try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } })());
const manifest = buildCompletePagesBundleManifest({
  deployRoot,
  provenance: staged.provenance,
  manifest: staged.manifest,
  supportFiles: staged.supportFiles,
  sourceAuthority: args.get('source-authority') || staged.provenance.commitSha,
  sourceCommit,
  generatedAt: args.get('generated-at') || new Date().toISOString()
});
fs.writeFileSync(path.join(outputRoot, 'W660L_COMPLETE_DEPLOY_BUNDLE_MANIFEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(outputRoot, 'DEPLOY_COMMAND.txt'), 'cd deploy-root\nnpx --yes wrangler@4 pages deploy . --project-name=eonapp-ch --branch=<preview-or-main>\n');

const verifyRoot = path.join(outputRoot, 'verify');
fs.mkdirSync(verifyRoot, { recursive: true });
fs.copyFileSync(path.join(root, 'scripts/lib/w660l-pages-deploy-bundle.mjs'), path.join(verifyRoot, 'w660l-pages-deploy-bundle.mjs'));
fs.writeFileSync(path.join(verifyRoot, 'verify-bundle.mjs'), `#!/usr/bin/env node\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nimport { verifyCompletePagesBundle } from './w660l-pages-deploy-bundle.mjs';\nconst here = path.dirname(fileURLToPath(import.meta.url));\nconst bundleRoot = path.resolve(here, '..');\nconst result = verifyCompletePagesBundle(bundleRoot);\nconsole.log(JSON.stringify({ ok: result.ok, bundleRoot, deployRoot: result.deployRoot || null, bundleDigest: result.manifest?.bundleDigest || null, candidateDigest: result.manifest?.candidateDigest || null, candidateCommitSha: result.manifest?.candidateCommitSha || null, functionsFileCount: result.manifest?.functionsFileCount || null, supportFileCount: result.manifest?.supportFileCount || null, issues: result.issues }, null, 2));\nif (!result.ok) process.exit(1);\n`);
fs.chmodSync(path.join(verifyRoot, 'verify-bundle.mjs'), 0o755);

fs.writeFileSync(path.join(outputRoot, 'README.md'), `# W660L complete Cloudflare Pages deployment bundle\n\nThis package is self-contained. Its deploy root includes:\n\n- the exact immutable static candidate;\n- all Cloudflare Pages Functions;\n- \`_routes.json\`;\n- every same-source module imported by those Functions;\n- served candidate provenance and manifest files.\n\n## Verify without the source repository\n\nFrom this extracted bundle root run:\n\n\`node verify/verify-bundle.mjs\`\n\nThe result must report \`ok: true\` and zero issues.\n\n## Deploy\n\nRun Wrangler **from inside \`deploy-root\`**:\n\n\`cd deploy-root\`\n\`npx --yes wrangler@4 pages deploy . --project-name=eonapp-ch --branch=<preview-or-main>\`\n\nDo not deploy only a nested \`dist/\` folder. Do not rebuild this candidate.\n`);
for (const relative of ['candidate-provenance.json', 'candidate-manifest.json', 'predeploy-receipt.json', 'w638-evidence-index.json', 'w639-freeze-manifest.json', 'CANDIDATE_SHA256.txt']) {
  const source = path.join(candidateRoot, relative);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(outputRoot, relative));
}
console.log(JSON.stringify({ ok: true, outputRoot, deployRoot, bundleDigest: manifest.bundleDigest, candidateDigest: manifest.candidateDigest, deployRootFileCount: manifest.deployRootFileCount, functionsFileCount: manifest.functionsFileCount, supportFileCount: manifest.supportFileCount, standaloneVerifier: 'verify/verify-bundle.mjs' }, null, 2));
