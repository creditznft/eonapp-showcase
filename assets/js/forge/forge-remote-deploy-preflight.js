/**
 * W389 source-only deployment preparation.
 *
 * Forge can inspect a local export for later handoff, but never connects GitHub,
 * creates a repository, changes Cloudflare, uploads a build or deploys source.
 */
export const EON_FORGE_DEPLOYMENT_PREFLIGHT_SCHEMA = 'eonapp.forge.remote-deploy-preflight.v1';

const SECRET_RE = /(api[-_ ]?key|secret|token|password|private[-_ ]?key|bearer|authorization|GOCSPX-|AKIA[0-9A-Z]{16})/i;
function safeFileEntries(files = {}) {
  const source = files && typeof files === 'object' ? files : {};
  return Object.entries(source).filter(([name, value]) => typeof name === 'string' && typeof value === 'string').slice(0, 64);
}

export function buildForgeRemoteDeployPreflight({ title = '', files = {}, sourceCheckPassed = false } = {}) {
  const entries = safeFileEntries(files);
  const blockers = [];
  if (!String(title || '').trim()) blockers.push('project-title-required');
  if (!entries.length) blockers.push('no-local-source-files');
  if (!sourceCheckPassed) blockers.push('local-source-check-required');
  for (const [name, body] of entries) {
    if (!/^[a-zA-Z0-9._/-]{1,180}$/.test(name)) blockers.push(`unsafe-file-name:${name.slice(0, 40)}`);
    if (SECRET_RE.test(body)) blockers.push(`secret-review-required:${name.slice(0, 80)}`);
  }
  return Object.freeze({
    schema: EON_FORGE_DEPLOYMENT_PREFLIGHT_SCHEMA,
    title: String(title || '').trim().slice(0, 120),
    sourceFileCount: entries.length,
    expectedStarterFilesPresent: ['index.html', 'style.css', 'script.js'].every((name) => entries.some(([entry]) => entry === name)),
    readyForManualHandoff: blockers.length === 0,
    blockers: Object.freeze([...new Set(blockers)]),
    githubConnected: false,
    cloudflareConnected: false,
    repositoryCreated: false,
    deploymentCreated: false,
    remoteRequestCreated: false,
    requiredLaterProof: Object.freeze([
      'user-owned-github-oauth-and-repository-selection',
      'explicit-cloudflare-project-selection',
      'source-review-and-secret-scan',
      'explicit-final-deploy-confirmation',
      'durable-receipt-and-rollback-route'
    ])
  });
}

export function getEonForgeDeploymentPreflightTruth() {
  return Object.freeze({
    schema: EON_FORGE_DEPLOYMENT_PREFLIGHT_SCHEMA,
    sourceOnly: true,
    githubConnected: false,
    cloudflareConnected: false,
    remoteRequestCreated: false,
    deploymentCreated: false,
    automaticPublish: false,
    userApprovalRequired: true
  });
}

export default Object.freeze({ EON_FORGE_DEPLOYMENT_PREFLIGHT_SCHEMA, buildForgeRemoteDeployPreflight, getEonForgeDeploymentPreflightTruth });
