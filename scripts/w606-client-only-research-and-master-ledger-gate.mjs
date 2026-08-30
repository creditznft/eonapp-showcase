#!/usr/bin/env node
/** W606 source gate: client-only research and master launch ledger. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateEonClientResearchContract } from '../config/eon-client-research-contract.mjs';
import { getEonClientResearchTruth } from '../assets/js/ai-kernel/eon-client-research-ledger.js';
import { validateEonMasterProgrammeLedger } from '../config/eon-master-launch-ledger.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const read = (relative) => readFileSync(resolve(ROOT, relative), 'utf8');

export function inspectW606ClientOnlyResearchAndMasterLedger() {
  const checks = [];
  const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
  check('client-research-contract-valid', validateEonClientResearchContract().length === 0, 'public HTTPS, explicit capture and citation packet boundaries validate');
  check('master-programme-ledger-valid', validateEonMasterProgrammeLedger().length === 0, 'City, AI, persistence, payments, trust, mobile and release tracks remain recorded');
  const truth = getEonClientResearchTruth();
  check('client-research-no-relay', truth.cloudflareWorker === false && truth.eonappServerProxy === false && truth.automaticModelBrowsing === false, JSON.stringify(truth));
  const clientContract = read('config/eon-client-research-contract.mjs');
  check('no-server-research-transport', !/\/api\/research|OPENAI_API_KEY|server-side cited research connector|Cloudflare Worker/i.test(clientContract), 'no internal research endpoint or server key contract');
  check('direct-fetch-is-cors-no-credentials', clientContract.includes('safePublicResearchUrl') && read('assets/js/ai-kernel/eon-client-research-ledger.js').includes("credentials: 'omit'") && read('assets/js/ai-kernel/eon-client-research-ledger.js').includes("mode: 'cors'"), 'browser direct fetch only when source permits CORS');
  const runtime = read('assets/js/chat/ai-runtime.js');
  check('one-turn-packet-consumed-by-runtime', runtime.includes('consumeEonClientResearchPacket') && runtime.includes('clientResearchPacket'), 'queued source packets are consumed once by local/direct model requests');
  const grounding = read('assets/js/chat/eonbot-knowledge-grounding.js');
  check('grounding-labels-supplied-evidence', grounding.includes('client-only local source packet') && grounding.includes('do not claim browsing'), 'model receives citations with no live-browser claim');
  const page = read('assets/js/local-ai/local-ai-page.js');
  check('local-ai-ui-exposes-client-ledger', page.includes('client-only Research Ledger') && page.includes('Save pasted source locally') && page.includes('Try direct browser fetch'), 'explicit local capture UI is source-controlled');
  const programme = read('program/EONAPP_MASTER_LAUNCH_EXECUTION_LEDGER_2026-07-11.md');
  check('master-programme-document-present', /Billing/.test(programme) && /One Creator experience, two honest execution rails/.test(programme), 'rolling launch board includes commercial and client-only rules');
  for (const file of [
    'config/eon-client-research-contract.mjs',
    'config/eon-master-launch-ledger.mjs',
    'assets/js/ai-kernel/eon-client-research-ledger.js',
    'tests/unit/w606-client-only-research-and-ledger.test.mjs',
    'program/EONAPP_MASTER_LAUNCH_EXECUTION_LEDGER_2026-07-11.md'
  ]) check(`file-present:${file}`, existsSync(resolve(ROOT, file)), file);
  const passed = checks.every((item) => item.pass);
  return Object.freeze({ schema: 'eonapp.w606.client-only-research-gate.v1', status: passed ? 'pass' : 'fail', sourceOnly: true, checks: Object.freeze(checks) });
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const report = inspectW606ClientOnlyResearchAndMasterLedger();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}
