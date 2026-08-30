/** W627E — review-first Creator asset integration with Projects, Forge and City. */

import { addProjectArtifact, loadProjects } from '../utils/eon-workspace-store.js';
import { buildEonDestinationHref } from '../contracts/navigation/eon-destination-registry.js';
import { writeEonHandoff } from '../contracts/navigation/eon-handoff-authority.js';
import { prepareEonAppW713CreatorAttachment } from '../runtime/w713/eonapp-w713-cross-route-product-coherence.js';

export const EON_CREATOR_PROJECT_HANDOFF_SCHEMA = 'eon.creator-project-handoff.w627e.v1';
export const EON_CREATOR_FORGE_HANDOFF_KEY = 'eon:forge:creator-handoff:v1';

function clean(value = '', limit = 180) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit); }

export function buildCreatorAssetReference(asset = {}) {
  return Object.freeze({
    schema: EON_CREATOR_PROJECT_HANDOFF_SCHEMA,
    assetId: clean(asset.assetId, 160),
    versionId: clean(asset.versionId || 'v1', 80),
    mediaKind: asset.mediaKind === 'video' ? 'video' : 'image',
    title: clean(asset.title || 'Creator output'),
    sha256: clean(asset.sha256, 128),
    width: Math.max(0, Number(asset.width || 0)),
    height: Math.max(0, Number(asset.height || 0)),
    durationSeconds: Math.max(0, Number(asset.durationSeconds || 0)),
    providerId: clean(asset.providerId || 'local', 80),
    runtimeId: clean(asset.runtimeId, 120),
    workflowId: clean(asset.workflowId, 160),
    workflowVersion: clean(asset.workflowVersion, 120),
    rawPromptIncluded: false,
    mediaBodyIncluded: false
  });
}

export function attachCreatorAssetToProject(projectId = '', asset = {}, options = {}) {
  if (options.explicitUserAction !== true || options.confirmed !== true) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required' });
  const project = loadProjects(options).projects.find((entry) => entry.id === projectId);
  if (!project) return Object.freeze({ ok: false, reason: 'project-not-found' });
  const reference = buildCreatorAssetReference(asset);
  if (!reference.assetId || !reference.sha256) return Object.freeze({ ok: false, reason: 'verified-asset-reference-required' });
  const proposal = prepareEonAppW713CreatorAttachment({ output: { ...reference, id: reference.assetId, verified: true }, target: 'project', projectId, explicitUserAction: options.explicitUserAction, confirmed: options.confirmed });
  if (!proposal.ok) return proposal;
  const artifact = addProjectArtifact(projectId, { type: 'output', title: reference.title, content: JSON.stringify(reference) }, options);
  return Object.freeze({ ok: true, artifact, reference });
}

export async function prepareCreatorContinuation(asset = {}, destination = '', options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  const reference = buildCreatorAssetReference(asset);
  if (!reference.assetId || !reference.sha256) return Object.freeze({ ok: false, reason: 'verified-asset-reference-required' });
  const target = String(destination || '').trim().toLowerCase();
  if (target === 'export') return Object.freeze({ ok: true, destination: 'export', filename: `EONAPP_CREATOR_ASSET_${reference.assetId}.json`, preparedOnly: true, reference });
  if (!['forge', 'city', 'library', 'create'].includes(target)) return Object.freeze({ ok: false, reason: 'unsupported-destination' });
  let proposal = null;
  if (target === 'library') {
    proposal = prepareEonAppW713CreatorAttachment({ output: { ...reference, id: reference.assetId, verified: true }, target: 'library', explicitUserAction: options.explicitUserAction, confirmed: options.confirmed === true });
    if (!proposal.ok) return proposal;
  }
  const receiverId = target === 'city' ? 'eoncity' : target;
  const handoff = await writeEonHandoff({
    senderId: 'library',
    receiverId,
    kind: 'creator-asset-reference',
    referenceId: reference.assetId,
    safeLabel: reference.title,
    payload: {
      assetId: reference.assetId,
      versionId: reference.versionId,
      mediaKind: reference.mediaKind,
      sha256: reference.sha256,
      width: reference.width,
      height: reference.height,
      durationSeconds: reference.durationSeconds,
      providerId: reference.providerId,
      runtimeId: reference.runtimeId,
      workflowId: reference.workflowId,
      workflowVersion: reference.workflowVersion
    },
    sourceSchema: EON_CREATOR_PROJECT_HANDOFF_SCHEMA,
    handoffId: options.handoffId
  }, {
    explicitUserAction: true,
    sessionStorage: options.sessionStorage,
    cryptoApi: options.cryptoApi,
    now: options.now
  });
  if (!handoff.ok) return handoff;
  if (target === 'forge') {
    try {
      (options.sessionStorage || globalThis.sessionStorage)?.setItem?.(EON_CREATOR_FORGE_HANDOFF_KEY, JSON.stringify({ schema: 'eonapp.handoff-compat-pointer.a15.v1', handoffId: handoff.handoff.handoffId }));
    } catch {}
  }
  const href = target === 'create' ? buildEonDestinationHref('create', { mode: reference.mediaKind, handoff: handoff.handoff.handoffId }) : handoff.href;
  return Object.freeze({ ok: true, destination: target, href, preparedOnly: true, reference, proposal, handoff: handoff.handoff });
}

export function getCreatorProjectIntegrationTruth() {
  return Object.freeze({ schema: EON_CREATOR_PROJECT_HANDOFF_SCHEMA, projectAttachmentExplicit: true, libraryAttachmentExplicit: true, w713CoherenceAuthority: true, canonicalHandoffAuthority: true, forgeHandoffSessionOnly: true, cityReceivesSafeReferenceOnly: true, rawPromptShared: false, mediaBodyShared: false, backgroundPublish: false, remoteDeploy: false });
}
