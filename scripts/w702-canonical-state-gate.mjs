#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEonAppW702CanonicalWorkState,
  getEonAppW702CanonicalWorkStateTruth,
  projectEonAppW702CanonicalWorkState,
  reduceEonAppW702CanonicalWorkState
} from '../assets/js/runtime/w702/eonapp-w702-canonical-work-state.js';
import {
  confirmEonAppW702ForegroundAction,
  getEonAppW702ForegroundActionTruth,
  prepareEonAppW702ForegroundAction
} from '../assets/js/action-gateway/eon-reviewed-foreground-action-gateway-w702.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW702CanonicalState() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const stateSource = read('assets/js/runtime/w702/eonapp-w702-canonical-work-state.js');
  const gatewaySource = read('assets/js/action-gateway/eon-reviewed-foreground-action-gateway-w702.js');
  const executable = `${stateSource}\n${gatewaySource}`.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  add('pure-no-storage-or-network', !/localStorage|sessionStorage|indexedDB|fetch\s*\(|XMLHttpRequest|navigator\.credentials/.test(executable), 'canonical state and reviewed gateway are pure local projections');
  add('no-direct-navigation', !/location\.(?:assign|replace)|location\.href\s*=|window\.open\s*\(/.test(executable), 'gateway returns routes but performs no navigation');
  add('no-provider-payment-media', !/createAIReplyStream|approveEonbotActionProposal|getUserMedia\s*\(|SpeechRecognition\s*\(|checkout|paymentIntent/.test(executable), 'provider, payment, camera and microphone execution are absent');
  const initial = createEonAppW702CanonicalWorkState({ project: { id: 'p1' }, revision: 2 }, { now: 1 });
  const selected = reduceEonAppW702CanonicalWorkState(initial, { type: 'select-work-object', payload: { id: 'task:1' }, explicitUserAction: true }, { now: 2 });
  add('canonical-revision', selected.ok && selected.state.revision === 3 && selected.state.project.id === 'p1' && selected.state.selectedWorkObject.id === 'task:1', 'one reducer preserves context and advances one revision');
  const surfaces = ['projects', 'atlas', 'nexus', 'city'].map((surface) => projectEonAppW702CanonicalWorkState(selected.state, surface));
  add('surface-projection-parity', surfaces.every((entry) => entry.revision === 3 && entry.project.id === 'p1' && entry.selectedWorkObject.id === 'task:1'), 'Projects, Atlas, NEXUS and City receive the same foreground identity');
  const prepared = prepareEonAppW702ForegroundAction({ kind: 'enter-city', explicitUserAction: true }, { now: 3, stateRevision: 3 });
  const confirmed = confirmEonAppW702ForegroundAction(prepared.proposal, { approved: true, explicitUserAction: true }, { currentStateRevision: 3 });
  add('two-step-reviewed-action', prepared.ok && confirmed.ok && confirmed.route === '/eoncity' && confirmed.navigationPerformed === false, 'reviewed action emits a canonical event without performing the side effect');
  const stateTruth = getEonAppW702CanonicalWorkStateTruth();
  const actionTruth = getEonAppW702ForegroundActionTruth();
  add('truth-boundaries', stateTruth.oneCanonicalForegroundState && !stateTruth.writesStorage && !stateTruth.startsProvider && actionTruth.twoStepReview && !actionTruth.performsNavigation && !actionTruth.startsPayment, 'truth contracts are fail-closed');
  return Object.freeze({ schema: 'eonapp.w702.canonical-state-gate.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks) });
}

const report = inspectW702CanonicalState();
for (const check of report.checks) console.log(`[W702] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W702] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
