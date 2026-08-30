/**
 * A15 I14 — Create, Forge and Project continuity authority.
 *
 * This authority answers one user-facing question: can this mode create a
 * verified result now, does it require setup, or is it planning only? It never
 * upgrades a mode from source presence alone and never starts generation,
 * provider use, deployment or publishing by navigation.
 */
import { writeEonHandoff } from '../contracts/navigation/eon-handoff-authority.js';

export const EON_CREATE_CONTINUITY_SCHEMA = 'eonapp.create-continuity.a15.v1';
export const EON_CREATE_AVAILABILITY = Object.freeze(['create-now', 'setup-required', 'plan-only']);

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 180) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);

const MODE_CONTRACTS = Object.freeze({
  image: freeze({ modeId: 'image', availability: 'setup-required', label: 'Setup required', destinationId: 'local-ai', verifiedResult: false, reviewBeforeApply: true }),
  video: freeze({ modeId: 'video', availability: 'setup-required', label: 'Setup required', destinationId: 'local-ai', verifiedResult: false, reviewBeforeApply: true }),
  music: freeze({ modeId: 'music', availability: 'create-now', label: 'Create now', destinationId: 'create', verifiedResult: true, verifiedScope: 'browser-sequencer-and-wav-export', generativeAudioCertified: false, reviewBeforeApply: true }),
  website: freeze({ modeId: 'website', availability: 'create-now', label: 'Create now', destinationId: 'forge', verifiedResult: true, reviewBeforeApply: true }),
  project: freeze({ modeId: 'project', availability: 'create-now', label: 'Create now', destinationId: 'projects', verifiedResult: true, reviewBeforeApply: true }),
  automation: freeze({ modeId: 'automation', availability: 'plan-only', label: 'Plan only', destinationId: 'automations', verifiedResult: false, reviewBeforeApply: true }),
  guide: freeze({ modeId: 'guide', availability: 'plan-only', label: 'Plan only', destinationId: 'home', verifiedResult: false, reviewBeforeApply: true })
});

export function resolveCreateModeAvailability(modeId = '', evidence = {}) {
  const id = clean(modeId, 24).toLowerCase();
  const base = MODE_CONTRACTS[id] || MODE_CONTRACTS.guide;
  if (['image', 'video'].includes(id) && evidence.certifiedGenerationReady === true) {
    return freeze({ ...base, availability: 'create-now', label: 'Create now', verifiedResult: true, certifiedBy: clean(evidence.certifiedBy, 120) || 'current certified runtime receipt' });
  }
  return base;
}

export async function prepareCreateDestinationHandoff(modeId = '', options = {}) {
  if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const mode = resolveCreateModeAvailability(modeId, options.evidence || {});
  if (!['website', 'project', 'automation'].includes(mode.modeId)) return freeze({ ok: false, reason: 'route-handoff-not-applicable', mode });
  const receiverId = mode.destinationId;
  const safeLabel = mode.modeId === 'website' ? 'Create a website in EON Forge' : mode.modeId === 'project' ? 'Create a Project' : 'Plan an Automation';
  return writeEonHandoff({
    senderId: 'create',
    receiverId,
    kind: 'create-continuity',
    referenceId: mode.modeId,
    safeLabel,
    sourceSchema: EON_CREATE_CONTINUITY_SCHEMA,
    handoffId: clean(options.handoffId, 180),
    payload: {
      modeId: mode.modeId,
      availability: mode.availability,
      reviewBeforeApply: true,
      universalProjectRegistry: true,
      externalExecutionAuthority: false
    }
  }, options);
}

export function getCreateContinuityTruth() {
  return freeze({
    schema: EON_CREATE_CONTINUITY_SCHEMA,
    websiteMode: 'create-now',
    websiteOwner: 'eon-forge',
    websiteReviewBeforeApply: true,
    websiteProjectContinuity: 'universal-project-registry',
    imageDefault: 'setup-required',
    videoDefault: 'setup-required',
    musicMode: 'create-now',
    musicVerifiedScope: 'browser-sequencer-and-wav-export',
    musicGenerativeAudioCertified: false,
    automationLaunchMode: 'plan-only',
    hiddenGenerationFallback: false,
    navigationStartsGeneration: false,
    navigationStartsDeployment: false,
    navigationStartsPublishing: false
  });
}

export default freeze({ EON_CREATE_CONTINUITY_SCHEMA, resolveCreateModeAvailability, prepareCreateDestinationHandoff, getCreateContinuityTruth });
