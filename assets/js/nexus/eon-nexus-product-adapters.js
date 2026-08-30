/**
 * W660E — bounded read-only adapters for focused EONAPP product surfaces.
 *
 * The registry reads existing stores and converts them into generic presence
 * facts for the shared EON NEXUS projection. It never starts Forge, runs an
 * automation, opens a provider, changes billing, reads Vault contents or owns
 * a second product store.
 */
import { readEonKernelForegroundSession } from '../ai-kernel/eon-ai-kernel-session-store.js';
import { readActiveProjectContext } from '../shell/eon-whole-app-ux.js';
import { loadProjects } from '../utils/eon-workspace-store.js';
import { loadAISettings } from '../chat/ai-runtime.js';
import { getAIReadiness } from '../utils/ai-readiness.js';
import { listCreatorAssets } from '../create/creator-library-store.js';
import { loadAutomationState } from '../utils/automation-os-store.js';
import { buildW632CustodySummary } from '../account/eon-account-vault-custody.js';
import { getBillingPublicArchitecture } from '../commerce/billing-commercial-status.js';

export const EON_NEXUS_PRODUCT_ADAPTER_SCHEMA = 'eon.nexus.product-adapters.w660e.v1';
export const EON_NEXUS_FORGE_STAGES = Object.freeze([
  'request', 'planner', 'files', 'generator', 'validation', 'preview', 'approval'
]);

const freeze = (value) => Object.freeze(value);
const nowIso = (now = Date.now()) => new Date(Number(now) || Date.now()).toISOString();
const safeArray = (value) => Array.isArray(value) ? value : [];

function latest(rows = []) {
  return [...safeArray(rows)].sort((left, right) => {
    const rightAt = Date.parse(String(right?.updatedAt || right?.createdAt || right?.at || '')) || 0;
    const leftAt = Date.parse(String(left?.updatedAt || left?.createdAt || left?.at || '')) || 0;
    return rightAt - leftAt;
  })[0] || null;
}

function mapForgeStage(record = {}) {
  const safeRecord = record && typeof record === 'object' ? record : {};
  const workflow = `${safeRecord.workflowState || ''} ${safeRecord.stage || ''}`.toLowerCase();
  const fallbackState = String(safeRecord.state || '').toLowerCase();
  if (/approval|review/.test(workflow)) return 'approval';
  if (/preview/.test(workflow)) return 'preview';
  if (/validat|test|lint|build/.test(workflow)) return 'validation';
  if (/generat|implement|edit|write|build-files/.test(workflow)) return 'generator';
  if (/file|inspect|context/.test(workflow)) return 'files';
  if (/plan|research|design/.test(workflow)) return 'planner';
  if (/approval|review/.test(fallbackState)) return 'approval';
  return 'request';
}

function mapTaskStatus(record = {}) {
  const safeRecord = record && typeof record === 'object' ? record : {};
  const state = String(safeRecord.state || '').toLowerCase();
  if (state === 'failed') return 'failed';
  if (state === 'review-needed') return 'waiting';
  if (state === 'completed') return 'complete';
  if (['running', 'paused'].includes(state)) return 'active';
  return 'available';
}

function selectProject(activeContext = {}, projectState = {}) {
  const id = String(activeContext?.projectId || '');
  return safeArray(projectState?.projects).find((entry) => String(entry?.id || '') === id) || null;
}

function automationCounts(state = {}, now = Date.now()) {
  const audits = safeArray(state.audit);
  const schedules = safeArray(state.schedules);
  const upcoming = schedules.filter((entry) => entry?.enabled === true && Date.parse(String(entry.nextRunAt || '')) > Number(now)).length;
  const successful = audits.filter((entry) => /^(ok|success|complete|completed)$/i.test(String(entry?.status || ''))).length;
  const failed = audits.filter((entry) => /^(failed|error)$/i.test(String(entry?.status || ''))).length;
  const waiting = audits.filter((entry) => /waiting|condition|pending/i.test(`${entry?.status || ''} ${entry?.type || ''}`)).length
    + safeArray(state.approvals).filter((entry) => entry?.status === 'pending').length;
  return freeze({ upcoming, successful, failed, waiting });
}

function adapter(id, status, count, updatedAt, detail = {}) {
  return freeze({
    id,
    role: id,
    status,
    count: Math.max(0, Math.min(999, Number(count) || 0)),
    providerKind: id === 'local-ai' ? 'local' : 'guide',
    updatedAt: String(updatedAt || ''),
    detail: freeze({ ...detail })
  });
}

export function readEonNexusProductAdapterSnapshot(options = {}) {
  const now = Number(options.now || Date.now());
  const localStorage = options.localStorage || (() => { try { return globalThis.localStorage; } catch { return null; } })();
  const sessionStorage = options.sessionStorage || (() => { try { return globalThis.sessionStorage; } catch { return null; } })();
  const readers = {
    readKernelSession: options.readers?.readKernelSession || readEonKernelForegroundSession,
    readActiveProjectContext: options.readers?.readActiveProjectContext || readActiveProjectContext,
    loadProjects: options.readers?.loadProjects || loadProjects,
    loadAISettings: options.readers?.loadAISettings || loadAISettings,
    getAIReadiness: options.readers?.getAIReadiness || getAIReadiness,
    listCreatorAssets: options.readers?.listCreatorAssets || listCreatorAssets,
    loadAutomationState: options.readers?.loadAutomationState || loadAutomationState,
    buildVaultSummary: options.readers?.buildVaultSummary || buildW632CustodySummary,
    getBillingArchitecture: options.readers?.getBillingArchitecture || getBillingPublicArchitecture
  };

  const kernel = options.kernelSession ?? readers.readKernelSession({ storage: sessionStorage });
  const task = latest(kernel?.records);
  const activeProject = options.activeProjectContext ?? readers.readActiveProjectContext({ storage: localStorage });
  const projectState = options.projectState ?? readers.loadProjects({ storage: localStorage });
  const project = options.project ?? selectProject(activeProject, projectState);
  const settings = options.settings ?? readers.loadAISettings();
  const readiness = options.readiness ?? readers.getAIReadiness(settings);
  const libraryAssets = options.libraryAssets ?? readers.listCreatorAssets({ storage: localStorage });
  const automationState = options.automationState ?? readers.loadAutomationState();
  const vault = options.vaultSummary ?? readers.buildVaultSummary({ storage: localStorage });
  const billing = options.billingArchitecture ?? readers.getBillingArchitecture();
  const automation = automationCounts(automationState, now);
  const forgeStage = mapForgeStage(task);
  const forgeStatus = mapTaskStatus(task);
  const projectSelected = Boolean(activeProject?.projectId || project?.id);
  const localReady = readiness?.ready === true && (String(readiness?.runtimeType || '').toLowerCase() === 'local' || ['browserlocal', 'ollama', 'lmstudio', 'jan'].includes(String(readiness?.providerId || '').toLowerCase()));
  const localNeedsAttention = String(readiness?.state || '').toLowerCase() === 'error';

  const adapters = freeze({
    forge: adapter('forge', forgeStatus, task ? 1 : 0, task?.updatedAt || task?.createdAt || '', { stages: EON_NEXUS_FORGE_STAGES, currentStage: forgeStage }),
    projects: adapter('projects', projectSelected ? 'selected' : 'available', projectSelected ? 1 : 0, project?.updatedAt || activeProject?.updatedAt || '', { selected: projectSelected }),
    'local-ai': adapter('local-ai', localNeedsAttention ? 'failed' : localReady ? 'active' : 'available', localReady ? 1 : 0, readiness?.checkedAt || '', { privateOnDevice: localReady }),
    library: adapter('library', safeArray(libraryAssets).length ? 'available' : 'available', safeArray(libraryAssets).length, latest(libraryAssets)?.updatedAt || latest(libraryAssets)?.createdAt || '', { provenanceOnly: true }),
    automations: adapter('automations', automation.failed ? 'failed' : automation.waiting ? 'waiting' : automation.upcoming ? 'active' : automation.successful ? 'complete' : 'available', automation.upcoming + automation.waiting + automation.failed, latest(automationState?.audit)?.at || latest(automationState?.schedules)?.updatedAt || '', automation),
    vault: adapter('vault', 'available', Number(vault?.credentialMetadataCount || 0) + Number(vault?.recoveryReviewCount || 0), '', { secureStateOnly: true }),
    settings: adapter('settings', 'available', 0, '', { helpPulseOnly: true }),
    billing: adapter('billing', billing?.hostedProvider === 'Dodo Payments' ? 'available' : 'blocked', safeArray(billing?.paidPlans).length, '', { serverAuthorityOnly: true })
  });

  return freeze({
    schema: EON_NEXUS_PRODUCT_ADAPTER_SCHEMA,
    generatedAt: nowIso(now),
    adapters,
    presence: freeze(Object.values(adapters)),
    truth: freeze({
      startsForge: false,
      runsAutomation: false,
      readsVaultContents: false,
      changesBilling: false,
      ownsProductStore: false,
      rawProjectLabels: false,
      rawLibraryFilenames: false
    })
  });
}

export function getEonNexusProductAdapterTruth() {
  return freeze({
    schema: EON_NEXUS_PRODUCT_ADAPTER_SCHEMA,
    adapterCount: 8,
    forgeStages: EON_NEXUS_FORGE_STAGES,
    readOnly: true,
    startsWork: false,
    duplicatesStores: false,
    rawSecrets: false
  });
}

export default freeze({
  EON_NEXUS_PRODUCT_ADAPTER_SCHEMA,
  EON_NEXUS_FORGE_STAGES,
  readEonNexusProductAdapterSnapshot,
  getEonNexusProductAdapterTruth
});
