#!/usr/bin/env node
/** W302–W304 — capability truth, legacy salvage, and local review foundation gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CAPABILITY_TRUTH_LIFECYCLES,
  CAPABILITY_TRUTH_REGISTRY,
  getCapabilityTruth
} from '../assets/js/capabilities/capability-truth-registry.js';
import { buildEonbotLocalActionCardPlan } from '../assets/js/chat/eonbot-action-cards.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = 'config/w303-legacy-salvage-manifest.json';

function read(root, relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }

export function runW302W304ChatFirstFoundationGate(root = ROOT) {
  const errors = [];
  const ids = new Set();
  for (const item of CAPABILITY_TRUTH_REGISTRY) {
    if (!item.id || ids.has(item.id)) errors.push(`Invalid or duplicate capability: ${item.id || '(blank)'}`);
    ids.add(item.id);
    if (!CAPABILITY_TRUTH_LIFECYCLES.includes(item.lifecycle)) errors.push(`Invalid lifecycle for ${item.id}.`);
    for (const field of ['label', 'canonicalSurface', 'evidenceOwner', 'evidenceTest', 'truthfulUserFacingNote']) {
      if (!String(item[field] || '').trim()) errors.push(`Capability ${item.id} is missing ${field}.`);
    }
    if (item.externalEffect && !item.requiresApproval) errors.push(`Effectful capability ${item.id} must require approval.`);
  }
  for (const id of ['eonbot-chat', 'workspace', 'automation-local-review', 'eon-city-mirror', 'legacy-social-publisher', 'reward-wallet-referral']) {
    if (!getCapabilityTruth(id)) errors.push(`Required capability absent: ${id}`);
  }

  const manifest = JSON.parse(read(root, MANIFEST));
  const allowed = new Set(manifest.allowedClassifications || []);
  const requiredLegacy = new Set(['agent-executor', 'video-lab', 'music-lab', 'social-publisher', 'workbench-ai', 'eon-browser-page', 'creator-studio', 'platform-backend']);
  const seenLegacy = new Set();
  for (const record of manifest.records || []) {
    seenLegacy.add(record.id);
    if (!allowed.has(record.classification)) errors.push(`Invalid W303 classification: ${record.id}`);
    if (!record.source || !fs.existsSync(path.join(root, record.source))) errors.push(`Missing W303 source: ${record.id}`);
  }
  for (const id of requiredLegacy) if (!seenLegacy.has(id)) errors.push(`W303 legacy record missing: ${id}`);

  const publishing = buildEonbotLocalActionCardPlan('Upload and schedule this video to YouTube');
  const blocked = buildEonbotLocalActionCardPlan('activate referrals and wallet payout');
  const retired = buildEonbotLocalActionCardPlan('open the old Creator Studio');
  if (!publishing.matched || !publishing.cards.some((card) => card.kind === 'approval-packet-preview')) errors.push('W304 publishing plan must include a non-executable packet preview.');
  if (!blocked.cards.some((card) => card.kind === 'blocked-capability')) errors.push('W304 must surface blocked value requests.');
  if (!retired.cards.some((card) => card.kind === 'retired-capability')) errors.push('W304 must surface retired route requests.');

  const consumers = [
    'assets/js/chat/eonbot-command-hub.js',
    'assets/js/eon-workspace-pages.js',
    'assets/js/eon-automations-page.js',
    'assets/js/city/city-prepared-action.js'
  ];
  for (const file of consumers) {
    const source = read(root, file);
    if (!source.includes('capability-truth-registry.js')) errors.push(`W302 registry is not consumed by ${file}.`);
  }

  return { schema: 'eonapp.w302-w304.chat-first-foundation-gate.v1', ok: errors.length === 0, capabilityCount: CAPABILITY_TRUTH_REGISTRY.length, errors };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW302W304ChatFirstFoundationGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log(`W302–W304 Chat-first foundation gate passed: ${report.capabilityCount} truthful capabilities, local-only review cards.`);
  process.exitCode = report.ok ? 0 : 1;
}
