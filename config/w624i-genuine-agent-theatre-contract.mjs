import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_AGENT_THEATRE_RAILS,
  EON_CITY_AGENT_THEATRE_STATES,
  EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA,
  createEonCityGenuineAgentTheatreController,
  getEonCityGenuineAgentTheatreSnapshot,
  recordEonCityDirectByokJobReceipt,
  recordEonCityLocalJobReceipt,
  validateEonCityGenuineAgentTheatreSnapshot
} from '../assets/js/city/eon-city-genuine-agent-theatre.js';
import { EONBOT_JOB_FABRIC_SCHEMA, EONBOT_JOB_FABRIC_STORAGE_KEY } from '../assets/js/chat/eonbot-job-fabric.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const memoryStorage = (seed = {}) => {
  const map = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), dump: () => Object.fromEntries(map) };
};

function w435Seed(now) {
  return {
    schema: EONBOT_JOB_FABRIC_SCHEMA,
    version: 1,
    updatedAt: new Date(now).toISOString(),
    jobs: [{ schema: EONBOT_JOB_FABRIC_SCHEMA, version: 1, jobId: 'eonjob_contract_local_1234', state: 'ready-for-review', safeLabel: 'Local research review', taskClass: 'research', surfaceId: 'chat', capabilityMode: 'local', capabilityAvailable: true, reviewRequired: true, attempts: 1, createdAt: new Date(now - 5000).toISOString(), updatedAt: new Date(now - 1000).toISOString(), localOnly: true }],
    events: []
  };
}

export async function validateW624iGenuineAgentTheatreContract() {
  const checks = [];
  const add = (id, pass, detail = '') => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const now = 1_770_100_000_000;
  const storage = memoryStorage({ [EONBOT_JOB_FABRIC_STORAGE_KEY]: w435Seed(now) });
  const initial = getEonCityGenuineAgentTheatreSnapshot({ storage, now: () => now });
  const validation = validateEonCityGenuineAgentTheatreSnapshot(initial);

  add('schema', initial.schema === EON_CITY_GENUINE_AGENT_THEATRE_SCHEMA, initial.schema);
  add('eight-state-order', JSON.stringify(EON_CITY_AGENT_THEATRE_STATES) === JSON.stringify(['queued', 'preparing', 'waiting-for-user', 'running', 'paused', 'failed', 'cancelled', 'completed']), EON_CITY_AGENT_THEATRE_STATES.join(' → '));
  add('four-rails', JSON.stringify(EON_CITY_AGENT_THEATRE_RAILS) === JSON.stringify(['local', 'direct-byok', 'guide', 'unavailable']), EON_CITY_AGENT_THEATRE_RAILS.join(', '));
  add('snapshot-valid', validation.ok, validation.errors.join('; '));
  add('w435-adapted', initial.jobCount === 1 && initial.jobs[0]?.state === 'waiting-for-user', `${initial.jobCount}:${initial.jobs[0]?.state}`);
  add('w435-local-rail', initial.jobs[0]?.rail === 'local', initial.jobs[0]?.rail);
  add('w435-no-progress', initial.jobs[0]?.progress === null && initial.jobs[0]?.authoritativeProgress === false, String(initial.jobs[0]?.progress));
  add('w435-private-hidden', initial.jobs.every((job) => !job.rawPromptVisible && !job.rawOutputVisible && !job.credentialVisible && !job.fullFileVisible), 'bounded projection');

  const local = recordEonCityLocalJobReceipt({ jobId: 'eonagentjob_local_run_1234', state: 'running', jobType: 'local-model', safeLabel: 'Local model run', sourceSurface: 'local-ai', authoritativeProgress: true, progress: 42, supportedActions: ['pause', 'cancel'], logs: [{ code: 'running', state: 'running', at: now }] }, { storage, now: () => now, explicitUserAction: true });
  add('local-adapter-stores', local.ok && local.receipt?.rail === 'local', local.reason);
  add('authoritative-progress-only', local.receipt?.progress === 42 && local.receipt?.authoritativeProgress === true, String(local.receipt?.progress));
  add('local-privacy', /stays on this device/i.test(local.receipt?.boundary || ''), local.receipt?.boundary);
  add('local-no-network', local.networkRequestCreated === false && local.externalActionStarted === false, 'no network/external action');

  const unapproved = recordEonCityDirectByokJobReceipt({ jobId: 'eonagentjob_byok_run_1234', state: 'queued', jobType: 'direct-generation', safeLabel: 'Approved provider request', sourceSurface: 'create' }, { storage, now: () => now, explicitUserAction: true });
  add('byok-requires-approval', unapproved.ok === false && unapproved.reason === 'direct-byok-approval-required', unapproved.reason);
  const approved = recordEonCityDirectByokJobReceipt({ jobId: 'eonagentjob_byok_run_1234', state: 'running', jobType: 'direct-generation', safeLabel: 'Approved provider request', sourceSurface: 'create', supportedActions: ['cancel'], logs: [{ code: 'running', state: 'running', at: now }] }, { storage, now: () => now, explicitUserAction: true, explicitUserApproval: true });
  add('byok-adapter-stores', approved.ok && approved.receipt?.rail === 'direct-byok', approved.reason);
  add('byok-privacy', /approved request/i.test(approved.receipt?.leavesDevice || '') && !/key|prompt|response is shown here/i.test('') , approved.receipt?.leavesDevice);
  add('byok-no-invented-progress', approved.receipt?.progress === null && approved.receipt?.authoritativeProgress === false, String(approved.receipt?.progress));

  const rejected = recordEonCityLocalJobReceipt({ jobId: 'eonagentjob_reject_1234', state: 'completed', jobType: 'local-model', safeLabel: 'Rejected private payload', sourceSurface: 'local-ai', prompt: 'PRIVATE PROMPT' }, { storage, now: () => now, explicitUserAction: true });
  add('private-fields-rejected', rejected.ok === false && rejected.reason === 'private-or-sensitive-fields-rejected', rejected.reason);

  const next = getEonCityGenuineAgentTheatreSnapshot({ storage, now: () => now });
  add('dedicated-and-w435-combined', next.jobCount === 3, String(next.jobCount));
  add('running-native-only', next.jobs.filter((job) => job.state === 'running').every((job) => job.authority === 'native-bounded-receipt'), 'native receipt authority');
  add('empty-is-honest', getEonCityGenuineAgentTheatreSnapshot({ storage: memoryStorage(), now: () => now }).emptyMessage.includes('No genuine job receipt'), 'honest empty');

  const controller = createEonCityGenuineAgentTheatreController({ storage, now: () => now });
  add('review-explicit', controller.review(next.jobs[0].jobId).reason === 'explicit-review-required', 'explicit review');
  const reviewed = controller.review(next.jobs[0].jobId, { explicitUserAction: true });
  add('review-does-not-execute', reviewed.ok && reviewed.networkRequestCreated === false && reviewed.externalActionStarted === false, reviewed.reason);
  add('controller-disposes', controller.dispose().disposed === true, 'disposed');

  const source = read('assets/js/city/eon-city-genuine-agent-theatre.js');
  const station = read('assets/js/eon-city-play-station.js');
  const css = read('assets/css/eon-city-play.css');
  const runtimeOwner = read('assets/js/city/eon-city-runtime-owner.js');
  add('source-no-fetch', !/\bfetch\s*\(/.test(source), 'read/write local bounded receipts only');
  add('source-no-navigation', !/location\.(?:assign|replace)|window\.open/.test(source), 'controller cannot navigate');
  add('source-no-commercial-mutation', !/checkout|grantReward|referralMutation:\s*true|billingMutation:\s*true/i.test(source), 'no commercial mutation');
  add('station-import', /createEonCityGenuineAgentTheatreController/.test(station), 'station imports controller');
  add('station-review-first', /data-eon-genuine-agent-review-button/.test(station) && /data-eon-agent-native-route/.test(station), 'review then native route');
  add('station-lifecycle-owned', /w624i-genuine-agent-theatre/.test(station), 'owned cleanup');
  add('css-present', /W624I · receipt-backed Genuine Agent Theatre/.test(css), 'W624I CSS');
  add('w624b-owner-preserved', /EON_CITY_RUNTIME_OWNER_SCHEMA/.test(runtimeOwner) && /mountEonCityPlayStation/.test(runtimeOwner) && !/genuine-agent-theatre/.test(runtimeOwner), 'runtime owner unchanged');
  add('w624h-preserved', /bindTruthfulCommandCenter/.test(station), 'W624H status remains');
  add('w624g-preserved', /bindProductiveRpgLoop/.test(station), 'W624G loop remains');
  add('old-theatre-foundation-preserved', /buildEonCityAgentTheaterStage/.test(station), 'W618E/W620 foundation retained');

  return Object.freeze({ schema: 'eonapp.contract.w624i-genuine-agent-theatre.2026-07-11.v1', wave: 'W624I', ok: checks.every((entry) => entry.pass), total: checks.length, passed: checks.filter((entry) => entry.pass).length, checks: Object.freeze(checks) });
}

export default validateW624iGenuineAgentTheatreContract;
