/** RT89 Workspace handoff desk. */
import { getEonForgeDeploymentPreflightTruth } from './forge-remote-deploy-preflight.js';
import { getEonForgeGitHubLaunchTruth } from './forge-github-launch-v1.js';

export function renderForgeRemoteDeployWorkspace() {
  const truth = getEonForgeDeploymentPreflightTruth();
  const github = getEonForgeGitHubLaunchTruth();
  return `<section id="eon-forge-deploy-prep" class="eon-hub-card eon-hub-card-full eon-forge-deploy-prep" aria-labelledby="eon-forge-deploy-prep-title"><div class="eon-city-work-mission-head"><div><p class="eon-hub-kicker">Forge Publishing · RT89</p><h2 id="eon-forge-deploy-prep-title">Publish static Forge projects through review, CI, then approval.</h2><p>Forge keeps local editing local. When you explicitly connect GitHub, an eligible static/client project can be staged to an <code>eonapp/*</code> review branch, opened as a pull request, checked by GitHub Actions, and merged only after a separate final approval.</p></div><span class="eon-record-status is-active">Review-first</span></div><div class="eon-record-list"><article class="eon-record-card"><div><p class="eon-record-type">GitHub v1</p><h3>Branch → PR → exact-SHA CI → GitHub Pages</h3><p>No PAT paste, force push, backend/database creation, or silent default-branch write is part of this lane. Remote proof still depends on a connected GitHub App and the required repository permissions.</p></div><a class="eon-record-button" href="/forge">Open Forge publishing</a></article></div><p class="eon-profile-status">Source contract ${github.sourceContractReady ? 'ready' : 'not ready'} · launch lane ${github.launchV1} · Cloudflare auto-deploy ${truth.cloudflareConnected ? 'connected' : 'not part of this v1 lane'}.</p></section>`;
}

export function bindForgeRemoteDeployWorkspace() {}
