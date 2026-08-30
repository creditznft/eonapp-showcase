/**
 * W713 cross-route product coherence.
 *
 * This pure authority projects one foreground work context across EONBOT,
 * Create, Projects, Library, Vault, Automations, Local AI, NEXUS, Atlas and
 * EON City. It deliberately stores no payload, credential, prompt or media,
 * and performs no navigation, provider call, publishing or approval.
 */
import { createEonAppW702CanonicalWorkState } from '../w702/eonapp-w702-canonical-work-state.js';

export const EONAPP_W713_CROSS_ROUTE_COHERENCE_SCHEMA = 'eonapp.cross-route-product-coherence.w713.v1';
export const EONAPP_W713_CREATOR_ATTACHMENT_SCHEMA = 'eonapp.creator-attachment-proposal.w713.v1';
export const EONAPP_W713_PROVIDER_READINESS_SCHEMA = 'eonapp.provider-readiness.w713.v1';

const freeze = Object.freeze;
const CONTROL_CHARACTERS = /\p{Cc}/gu;
const SECRET_FIELD = /^(?:secret|token|api[_-]?key|credential|credentials|password|private[_-]?key|authorization)$/i;
const PROVIDER_STATES = freeze(['empty', 'saved', 'verified', 'error']);
const ATTACHMENT_TARGETS = freeze(['project', 'library']);

function cleanText(value = '', max = 180) {
  return String(value ?? '').replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', fallback = '') {
  return cleanText(value, 160).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 160) || fallback;
}

function containsSecretField(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 5) return false;
  for (const [key, nested] of Object.entries(value)) {
    const normalized = String(key).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (SECRET_FIELD.test(normalized)) return true;
    if (nested && typeof nested === 'object' && containsSecretField(nested, depth + 1)) return true;
  }
  return false;
}

const ROUTES = freeze([
  freeze({ id: 'home', href: '/', label: 'EONBOT', purpose: 'Start, clarify and continue one foreground outcome.', custody: 'conversation', acceptsSecrets: false }),
  freeze({ id: 'create', href: '/create', label: 'Create', purpose: 'Create and review draft outputs before attaching them anywhere.', custody: 'draft-output', acceptsSecrets: false }),
  freeze({ id: 'projects', href: '/projects', label: 'Projects', purpose: 'Own ordinary work, tasks, outcomes and explicit output references.', custody: 'ordinary-work', acceptsSecrets: false }),
  freeze({ id: 'library', href: '/library', label: 'Library', purpose: 'Keep reusable, non-secret content and approved output references.', custody: 'reusable-content', acceptsSecrets: false }),
  freeze({ id: 'vault', href: '/vault', label: 'Vault', purpose: 'Keep credentials, recovery and security-sensitive material out of work surfaces.', custody: 'sensitive-material', acceptsSecrets: true }),
  freeze({ id: 'automations', href: '/automations', label: 'Automations', purpose: 'Draft, simulate and review repeatable work without hidden execution.', custody: 'reviewed-workflow', acceptsSecrets: false }),
  freeze({ id: 'local-ai', href: '/local-ai', label: 'Local AI', purpose: 'Show local runtime setup and verification state without storing provider secrets.', custody: 'runtime-status', acceptsSecrets: false }),
  freeze({ id: 'billing', href: '/billing', label: 'Billing', purpose: 'Review server-backed plans and entitlements without changing work state.', custody: 'server-entitlement', acceptsSecrets: false }),
  freeze({ id: 'help', href: '/help', label: 'Help', purpose: 'Explain product boundaries, recovery paths and verified help.', custody: 'help', acceptsSecrets: false }),
  freeze({ id: 'nexus', href: '/?nexus=open', label: 'NEXUS', purpose: 'Manipulate projections of the same foreground work objects.', custody: 'state-projection', acceptsSecrets: false }),
  freeze({ id: 'atlas', href: '/?nexus=atlas', label: 'Atlas', purpose: 'Map the selected project or offer useful project-start actions.', custody: 'state-projection', acceptsSecrets: false }),
  freeze({ id: 'city', href: '/eoncity', label: 'EON City', purpose: 'Provide spatial access to the same reviewed work context.', custody: 'state-projection', acceptsSecrets: false })
]);

function routeById(routeId = '') {
  const id = cleanId(routeId, 'home');
  return ROUTES.find((route) => route.id === id) || ROUTES[0];
}

function normalizeCreatorOutput(value = {}) {
  if (!value || typeof value !== 'object' || containsSecretField(value)) return freeze({ id: '', label: '', mediaKind: 'output', verified: false });
  return freeze({
    id: cleanId(value.id || value.assetId),
    label: cleanText(value.label || value.title || 'Creator output', 120),
    mediaKind: cleanId(value.mediaKind, 'output'),
    verified: value.verified === true || Boolean(cleanText(value.sha256, 128)),
    rawPromptIncluded: false,
    mediaBodyIncluded: false
  });
}

export function normalizeEonAppW713ProviderReadiness(value = {}) {
  if (!value || typeof value !== 'object' || containsSecretField(value)) {
    return freeze({
      schema: EONAPP_W713_PROVIDER_READINESS_SCHEMA,
      state: 'error',
      providerId: '',
      runtimeId: '',
      modelId: '',
      configured: false,
      saved: false,
      verified: false,
      error: 'secret-material-rejected',
      secretMaterialIncluded: false
    });
  }
  const providerId = cleanId(value.providerId || value.id);
  const runtimeId = cleanId(value.runtimeId || value.runtime);
  const modelId = cleanId(value.modelId || value.model);
  const errorSource = value.error || (value.ok === false ? value.note : '');
  const error = cleanText(errorSource, 180);
  const verified = value.verified === true || value.ok === true;
  const saved = value.saved === true || value.configured === true || Boolean(providerId || runtimeId || modelId);
  const configured = value.configured === true || saved;
  const state = error ? 'error' : verified ? 'verified' : saved ? 'saved' : 'empty';
  return freeze({
    schema: EONAPP_W713_PROVIDER_READINESS_SCHEMA,
    state: PROVIDER_STATES.includes(state) ? state : 'empty',
    providerId,
    runtimeId,
    modelId,
    configured,
    saved,
    verified: state === 'verified',
    error,
    secretMaterialIncluded: false
  });
}

export function prepareEonAppW713CreatorAttachment({ output = {}, target = '', projectId = '', explicitUserAction = false, confirmed = false } = {}) {
  const normalizedOutput = normalizeCreatorOutput(output);
  const normalizedTarget = cleanId(target);
  if (containsSecretField(output)) return freeze({ ok: false, reason: 'secret-material-rejected' });
  if (!ATTACHMENT_TARGETS.includes(normalizedTarget)) return freeze({ ok: false, reason: 'unsupported-attachment-target' });
  if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (confirmed !== true) return freeze({ ok: false, reason: 'explicit-confirmation-required' });
  if (!normalizedOutput.id || !normalizedOutput.verified) return freeze({ ok: false, reason: 'verified-output-reference-required' });
  const normalizedProjectId = cleanId(projectId);
  if (normalizedTarget === 'project' && !normalizedProjectId) return freeze({ ok: false, reason: 'project-required' });
  return freeze({
    ok: true,
    schema: EONAPP_W713_CREATOR_ATTACHMENT_SCHEMA,
    target: normalizedTarget,
    projectId: normalizedTarget === 'project' ? normalizedProjectId : '',
    output: normalizedOutput,
    href: normalizedTarget === 'project' ? '/projects' : '/library',
    preparedOnly: true,
    explicitUserAction: true,
    confirmed: true,
    publishes: false,
    navigates: false,
    writesStorage: false,
    rawPromptIncluded: false,
    mediaBodyIncluded: false
  });
}

function routeProjection(state, route, providerReadiness, creatorOutput) {
  return freeze({
    schema: `${EONAPP_W713_CROSS_ROUTE_COHERENCE_SCHEMA}.route.v1`,
    routeId: route.id,
    href: route.href,
    label: route.label,
    purpose: route.purpose,
    custody: route.custody,
    project: state.project,
    task: state.task,
    approval: state.approval,
    result: state.result,
    selectedWorkObject: state.selectedWorkObject,
    conversation: state.conversation,
    providerReadiness,
    creatorOutput,
    eonbotIdentity: 'eonbot:primary',
    oneSelectedProject: true,
    readsSecretMaterial: false,
    duplicatesPrivatePayload: false,
    automaticNavigation: false,
    automaticExecution: false
  });
}

export function buildEonAppW713CrossRouteCoherencePlan({ state = {}, providerStatus = {}, creatorOutput = {} } = {}) {
  const canonicalState = createEonAppW702CanonicalWorkState(state);
  const providerReadiness = normalizeEonAppW713ProviderReadiness(providerStatus);
  const normalizedCreatorOutput = normalizeCreatorOutput(creatorOutput);
  const routeViews = freeze(ROUTES.map((route) => routeProjection(canonicalState, route, providerReadiness, normalizedCreatorOutput)));
  return freeze({
    schema: EONAPP_W713_CROSS_ROUTE_COHERENCE_SCHEMA,
    canonicalState,
    selectedProjectId: canonicalState.project.id,
    selectedWorkObjectId: canonicalState.selectedWorkObject.id,
    eonbotIdentity: 'eonbot:primary',
    routes: ROUTES,
    routeViews,
    providerReadiness,
    creatorOutput: normalizedCreatorOutput,
    oneCanonicalForegroundState: true,
    oneSelectedProject: true,
    oneEonbotIdentity: true,
    routeCount: ROUTES.length,
    automaticNavigation: false,
    automaticExecution: false,
    automaticApproval: false,
    hiddenPublishing: false,
    secretMaterialCopied: false
  });
}

export function resolveEonAppW713RouteView(plan = {}, routeId = 'home') {
  const route = routeById(routeId);
  const rows = Array.isArray(plan.routeViews) ? plan.routeViews : [];
  return rows.find((entry) => entry.routeId === route.id)
    || routeProjection(createEonAppW702CanonicalWorkState(plan.canonicalState || {}), route, normalizeEonAppW713ProviderReadiness(plan.providerReadiness || {}), normalizeCreatorOutput(plan.creatorOutput || {}));
}

export function validateEonAppW713CrossRouteCoherencePlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EONAPP_W713_CROSS_ROUTE_COHERENCE_SCHEMA) errors.push('schema');
  if (!Array.isArray(plan.routes) || plan.routes.length !== ROUTES.length) errors.push('route-count');
  if (!Array.isArray(plan.routeViews) || plan.routeViews.length !== ROUTES.length) errors.push('route-view-count');
  if (new Set((plan.routes || []).map((route) => route.id)).size !== ROUTES.length) errors.push('route-identity');
  if ((plan.routeViews || []).some((view) => view.project?.id !== plan.selectedProjectId)) errors.push('project-continuity');
  if ((plan.routeViews || []).some((view) => view.eonbotIdentity !== 'eonbot:primary')) errors.push('eonbot-continuity');
  if (!plan.oneCanonicalForegroundState || !plan.oneSelectedProject || !plan.oneEonbotIdentity) errors.push('state-authority');
  if (plan.automaticNavigation || plan.automaticExecution || plan.automaticApproval || plan.hiddenPublishing || plan.secretMaterialCopied) errors.push('truth-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function getEonAppW713CrossRouteCoherenceTruth() {
  return freeze({
    schema: `${EONAPP_W713_CROSS_ROUTE_COHERENCE_SCHEMA}.truth.v1`,
    routeIds: freeze(ROUTES.map((route) => route.id)),
    oneCanonicalForegroundState: true,
    oneSelectedProject: true,
    oneEonbotIdentity: true,
    ordinaryWorkOwnedByProjects: true,
    reusableContentOwnedByLibrary: true,
    sensitiveMaterialOwnedByVault: true,
    creatorAttachmentRequiresConfirmation: true,
    providerStates: PROVIDER_STATES,
    writesStorage: false,
    startsProvider: false,
    navigatesAutomatically: false,
    publishesAutomatically: false,
    approvesAutomatically: false,
    copiesSecretMaterial: false
  });
}
