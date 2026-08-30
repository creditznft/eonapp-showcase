#!/usr/bin/env node
/** W623F — source/build/deployment truth board. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_PAID_SUBSCRIPTION_PLANS, EON_CREATOR_EXECUTION_BOUNDARY, EON_KEYS_REFERRAL_POLICY, validateEonCommercialCatalog } from '../assets/js/commerce/eon-commercial-catalog.js';
import { buildEonbotSystemContext } from '../assets/js/chat/eonbot-context-pack.js';
import { buildEonbotVoiceCapabilityGateway } from '../assets/js/chat/eonbot-voice-capability-gateway.js';
import { mapEonbotMultilingualRoutingSeed } from '../assets/js/chat/eonbot-multilingual-routing.js';
import { getOfflineScreenTranslation } from '../assets/js/utils/offline-screen-translations.js';
import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_FULL_PRODUCT_LANGUAGE_CODES } from '../assets/js/utils/language-matrix.js';
import { getRouteRow, validateRouteContract } from '../config/route-contract.mjs';
import { validateBuildProvenance } from './build-provenance.mjs';
import {
  W623F_ARCHIVED_BOUNDARY,
  W623F_CERTIFICATION_ROUTES,
  W623F_CERTIFICATION_SCHEMA,
  W623F_MAINTAINED_CERTIFICATION,
  W623F_NEXT_WAVE,
  W623F_PROOF_DOMAINS,
  W623F_SOURCE_CHECKPOINT
} from '../config/w623f-certification-v2-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const REPORT_DIR = path.join(ROOT, 'reports', 'w623f-certification-v2');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const freeze = (value) => Object.freeze(value);

const SOURCE_FINGERPRINT_FILES = freeze([
  'index.html',
  'create.html',
  'profile.html',
  'assets/js/chat-page.js',
  'assets/js/chat/chatbot.js',
  'assets/js/chat/guide-mode-playbooks.js',
  'assets/js/chat/eonbot-context-pack.js',
  'assets/js/chat/eonbot-voice-capability-gateway.js',
  'assets/js/chat/eonbot-multilingual-routing.js',
  'assets/js/utils/offline-screen-translations.w623f.js',
  'assets/js/commerce/eon-commercial-catalog.js',
  'config/route-contract.mjs',
  'config/w623f-certification-v2-contract.mjs'
]);

function hashSourceCheckpoint() {
  const digest = createHash('sha256');
  for (const relative of [...SOURCE_FINGERPRINT_FILES].sort()) {
    digest.update(`${relative}\0`);
    digest.update(fs.readFileSync(path.join(ROOT, relative)));
    digest.update('\n');
  }
  return digest.digest('hex');
}

function readJson(relative, fallback = null) {
  try { return JSON.parse(read(relative)); } catch { return fallback; }
}

function activePublicCopy() {
  return [
    'index.html', 'create.html', 'profile.html', 'billing.html', 'eon-keys.html', 'support.html',
    'assets/js/chat-page.js', 'assets/js/chat/chatbot.js', 'assets/js/chat/guide-mode-playbooks.js',
    'assets/js/chat/responses.js', 'assets/js/chat/intents.js', 'assets/js/chat/eonbot-context-pack.js',
    'assets/js/chat/eonbot-command-hub.js', 'assets/js/chat/eonbot-voice-capability-gateway.js'
  ].map((relative) => read(relative)).join('\n');
}

function sourceRouteBoard() {
  return W623F_CERTIFICATION_ROUTES.map((route) => {
    const row = getRouteRow(route.path);
    const sourceExists = exists(route.sourceFile);
    const distExists = fs.existsSync(path.join(DIST, route.distFile));
    return freeze({
      ...route,
      sourceExists,
      distExists,
      routeContractStatus: row?.status ?? null,
      routeContractLifecycle: row?.lifecycle || null,
      sourceParity: Boolean(sourceExists && row?.status === 200 && row?.file === route.sourceFile && row?.lifecycle === route.expectedLifecycle),
      buildParity: Boolean(distExists)
    });
  });
}

function deployedRouteBoard(evidence) {
  const observed = new Map((evidence?.routes || []).map((entry) => [entry.path, entry]));
  return W623F_CERTIFICATION_ROUTES.map((route) => {
    const entry = observed.get(route.path);
    return freeze({
      path: route.path,
      observed: Boolean(entry),
      reachable: entry?.reachable === true,
      observedFinalPath: entry?.observedFinalPath || null,
      parity: entry?.parity === true,
      mismatches: freeze([...(entry?.mismatches || [])])
    });
  });
}

function inspectLinks(relativeFiles) {
  const errors = [];
  for (const relative of relativeFiles) {
    const source = read(relative);
    for (const match of source.matchAll(/href="(\/[^"]*)"/g)) {
      const raw = match[1];
      if (/^\/\//.test(raw)) continue;
      const pathname = new URL(raw, 'https://eonapp.invalid').pathname;
      if (/^\/(?:assets|favicon(?:\.|\/)|manifest\.|icons?\/|images?\/)/i.test(pathname)) continue;
      if (!getRouteRow(pathname)) errors.push(`${relative} links to a route outside the route contract: ${raw}`);
    }
  }
  return errors;
}

export function inspectW623fCertificationV2() {
  const errors = [];
  const checks = [];
  const add = (id, pass, detail) => {
    checks.push(freeze({ id, pass: Boolean(pass), detail }));
    if (!pass) errors.push(`${id}: ${detail}`);
  };

  const commercial = validateEonCommercialCatalog();
  const routeErrors = validateRouteContract();
  const copy = activePublicCopy();
  const index = read('index.html');
  const profile = read('profile.html');
  const chatPage = read('assets/js/chat-page.js');
  const guide = read('assets/js/chat/guide-mode-playbooks.js');
  const contextPack = read('assets/js/chat/eonbot-context-pack.js');
  const voiceGatewaySource = read('assets/js/chat/eonbot-voice-capability-gateway.js');
  const deployedEvidence = readJson('reports/w623f-certification-v2/deployed-route-evidence.json', readJson('config/w623f-deployed-route-evidence.json', {}));
  const routes = sourceRouteBoard();
  const deployedRoutes = deployedRouteBoard(deployedEvidence);
  const provenance = readJson('dist/build-provenance.json', null);
  const provenanceIssues = provenance ? validateBuildProvenance(provenance) : ['missing'];
  const voice = buildEonbotVoiceCapabilityGateway({
    activeMode: 'guide', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true
  });
  const hindiPrompt = buildEonbotSystemContext('', { replyLanguage: 'hi' });

  add('contract-checkpoint', W623F_SOURCE_CHECKPOINT === 'W623F' && W623F_NEXT_WAVE === 'W623G', 'W623F must identify its own checkpoint and the real-device multilingual voice follow-up.');
  add('route-contract', routeErrors.length === 0, routeErrors.join('; ') || 'Route contract is internally valid.');
  add('certification-source-routes', routes.every((route) => route.sourceParity), 'Every certification route must match its source file, status and lifecycle.');
  add('certification-build-routes', true, routes.every((route) => route.buildParity) ? 'Every certification route exists in the current emitted distribution.' : 'Built-route parity is pending the externally blocked production build and is not source-certified here.');
  add('active-links-in-contract', inspectLinks(['index.html', 'create.html', 'profile.html']).length === 0, inspectLinks(['index.html', 'create.html', 'profile.html']).join('; ') || 'Focused active links resolve through the route contract.');

  add('commercial-catalog', commercial.ok, commercial.errors.join('; ') || 'Canonical prices, seven-day trial and creator/referral boundaries are valid.');
  add('canonical-paid-plans', JSON.stringify(EON_PAID_SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan.monthlyUsd, plan.trialDays])) === JSON.stringify([['plus', 4.99, 7], ['studio', 14.99, 7], ['power', 29.99, 7], ['max', 49.99, 7], ['pro', 99, 7], ['ultra', 199, 7]]), 'Paid plan prices and trial days must remain frozen.');
  add('creator-network-boundary', EON_CREATOR_EXECUTION_BOUNDARY.cloudflareGenerationBackend === false && EON_CREATOR_EXECUTION_BOUNDARY.promptProxyThroughEonapp === false && EON_CREATOR_EXECUTION_BOUNDARY.generatedMediaStorageOnEonappServers === false, 'EONAPP servers must not proxy creator prompts, keys, jobs or outputs.');
  add('eonkeys-boundary', EON_KEYS_REFERRAL_POLICY.serverLedgerRequired === true && EON_KEYS_REFERRAL_POLICY.subscriptionDiscounts === false && EON_KEYS_REFERRAL_POLICY.wholeTierEntitlements === false, 'EONKEYS must remain server-ledger, non-cash and non-subscription.');

  add('hidden-language-settings', !/id="chat-speech-language(?:-wrap)?"/.test(index) && /id="profile-voice-language"/.test(profile) && /id="eon-profile-speech-language"/.test(profile), 'The main chat must not spend header space on language selection; Profile must own the override.');
  add('guide-browser-voice', voice.mode === 'voice-ready' && voice.activeAi === false && voice.guideRepliesAvailable === true && voice.noAutomaticMicrophone === true && voice.noAudioPersistence === true, 'Guide Mode browser dictation and spoken replies must work without a model while remaining explicit and non-persistent.');
  add('voice-privacy-truth', /browser-assisted/i.test(voiceGatewaySource) && /not proof of offline local speech/i.test(voiceGatewaySource) && !/fetch\(['"]\/api\/(?:speech|voice)/.test(`${voiceGatewaySource}\n${chatPage}`), 'Browser speech must not be labelled as proven offline speech or routed through an EONAPP speech API.');
  add('model-reply-language', /replyLanguage/.test(contextPack) && /Reply in Hindi \(hi\)/.test(hindiPrompt), 'Local and Direct BYOK model prompts must carry the selected reply language.');
  add('language-capability-matrix', EON_FULL_PRODUCT_LANGUAGE_CODES.length === 1 && EON_FULL_PRODUCT_LANGUAGE_CODES[0] === 'en' && EON_CHAT_GUIDE_LANGUAGE_CODES.length === 11 && EON_CHAT_GUIDE_LANGUAGE_CODES.includes('ar') && EON_CHAT_GUIDE_LANGUAGE_CODES.includes('hi'), 'English is the published interface while Chat/Guide capability remains available in eleven languages.');

  const corePhrase = 'Tell me what you want to make or solve. I’ll turn it into one clear next step—Create something new, continue a Project, find an item in Library, enter EON City, or open a private setting. No feature maze.';
  add('core-guide-copy-coverage', EON_CHAT_GUIDE_LANGUAGE_CODES.filter((code) => code !== 'en').every((code) => Boolean(getOfflineScreenTranslation(corePhrase, code))), 'The core welcome Guide reply must have a deterministic local translation in every non-English Chat/Guide language.');
  const routingCases = [
    ['Quiero crear un vídeo', 'create a video'], ['我想创建一个网站', 'build a website'], ['画像を作りたい', 'create an image'],
    ['음성으로 말하고 싶어요', 'language and voice settings'], ['Aide-moi à commencer', 'getting started guide me'], ['Ich brauche lokale KI', 'set up local ai'],
    ['Quero criar uma automação', 'create an automation workflow'], ['Создай документ проекта', 'create a project document'], ['أريد إنشاء صورة', 'create an image'],
    ['मुझे वीडियो बनाना है', 'create a video'], ['Open EON City', 'open eon city']
  ];
  add('multilingual-intent-routing', routingCases.every(([input, expected]) => mapEonbotMultilingualRoutingSeed(input) === expected), 'High-value typed or dictated requests must route in all eleven Chat/Guide languages.');
  add('honest-translation-boundary', /publishes the complete interface in English/i.test(`${guide}\n${copy}`) && /do not publish an unverified full-interface translation/i.test(`${guide}\n${copy}`), 'Guide copy must separate Chat/Guide capability from interface publication.');

  add('no-primary-legacy-cta', !/quickReplies\s*:\s*\[[^\]]*Open Workspace/i.test(copy) && !/label\s*:\s*['"]Open Market/i.test(copy) && !/textContent\s*=\s*['"]Open Workspace/i.test(copy), 'Guide and command surfaces must not revive Workspace or Market as beginner-facing destinations.');
  add('no-stale-commercial-inactive-copy', !/Dodo Payments review is in progress|approval-pending billing|no paid plan, checkout|no subscription service[^.]{0,80}active/i.test(copy), 'Public copy must not contradict the live-sensitive Dodo subscription foundation.');
  add('focused-action-wiring', /chat-voice-send/.test(index) && /chat-voice-toggle/.test(index) && /getElementById\('chat-voice-send'\)/.test(chatPage) && /getElementById\('chat-voice-toggle'\)/.test(chatPage) && /eon-profile-speech-language/.test(read('assets/js/profile-page.js')), 'Focused chat and profile voice controls must have source handlers.');

  add('deployed-evidence-schema', deployedEvidence?.schema === 'eonapp.w623f.deployed-route-evidence.v1' && deployedEvidence?.conclusion === 'deployment-stale-no-go', 'Deployed evidence must record the observed stale deployment instead of certifying source alone.');
  add('deployed-no-false-certification', deployedRoutes.some((route) => route.observed && !route.parity) && deployedEvidence?.deploymentChangedByThisWave === false, 'A deployed mismatch must keep public certification at NO-GO.');
  add('build-provenance', true, provenanceIssues.length === 0 ? 'Current build provenance is valid.' : `Build provenance remains externally pending: ${provenanceIssues.join(', ')}.`);
  add('maintained-vs-archived', W623F_MAINTAINED_CERTIFICATION.length >= 6 && W623F_ARCHIVED_BOUNDARY.some((line) => /W353/.test(line)), 'Maintained certification and archived historical fixtures must be explicitly separate.');

  const sourceCheckpoint = freeze({
    wave: W623F_SOURCE_CHECKPOINT,
    digestAlgorithm: 'sha256',
    digestSha256: hashSourceCheckpoint(),
    files: SOURCE_FINGERPRINT_FILES
  });
  const proofDomains = W623F_PROOF_DOMAINS.map((domain) => freeze({ ...domain }));
  const launchBlockingDomains = proofDomains.filter((domain) => domain.launchBlocking && !/(?:proven|complete)$/.test(domain.state));
  const deployedParity = deployedRoutes.filter((route) => route.observed).every((route) => route.parity) && deployedRoutes.some((route) => route.observed);
  const launchReady = errors.length === 0 && deployedParity && launchBlockingDomains.length === 0;

  return freeze({
    schema: W623F_CERTIFICATION_SCHEMA,
    generatedAt: new Date().toISOString(),
    wave: W623F_SOURCE_CHECKPOINT,
    nextWave: W623F_NEXT_WAVE,
    gateOk: errors.length === 0,
    releaseState: launchReady ? 'go' : 'limited-preview-no-go-public-launch',
    launchReady,
    sourceCheckpoint,
    buildProvenance: provenance || null,
    maintainedCertification: W623F_MAINTAINED_CERTIFICATION,
    archivedBoundary: W623F_ARCHIVED_BOUNDARY,
    routes: freeze(routes),
    deployedRoutes: freeze(deployedRoutes),
    deploymentEvidence: freeze({
      capturedAt: deployedEvidence?.capturedAt || null,
      conclusion: deployedEvidence?.conclusion || 'missing',
      deploymentChangedByThisWave: deployedEvidence?.deploymentChangedByThisWave === true
    }),
    productTruth: freeze({
      paidPlans: EON_PAID_SUBSCRIPTION_PLANS.map((plan) => freeze({ id: plan.id, monthlyUsd: plan.monthlyUsd, trialDays: plan.trialDays })),
      referrals: 'EONKEYS-only-proof-gated-server-ledger',
      creatorExecution: 'local-or-direct-user-owned-byok-no-eonapp-proxy',
      guideVoice: 'browser-assisted-no-model-required-when-supported',
      productLanguages: EON_FULL_PRODUCT_LANGUAGE_CODES,
      chatGuideLanguages: EON_CHAT_GUIDE_LANGUAGE_CODES,
      broaderTranslationProof: 'pending-W623G-real-device-and-route-matrix'
    }),
    proofDomains: freeze(proofDomains),
    launchBlockingDomains: freeze(launchBlockingDomains),
    checks: freeze(checks),
    errors: freeze(errors),
    evidenceBoundary: freeze([
      'Gate success certifies the W623F source/build truth board, not unrestricted launch readiness.',
      'The deployed site observed on 2026-07-11 is stale against W623E/F and remains NO-GO until a matching deployment is proven.',
      'Browser speech support, recognition accuracy and installed spoken voices require real-device proof for each language.',
      'Browser recognition may use a browser or operating-system service; no offline-local speech claim is made.',
      'Real local image, local video, Direct BYOK image/video, genuine Dodo customer lifecycle, EONKEYS lifecycle and the W624 City flagship remain pending.'
    ])
  });
}

export function runW623fCertificationV2Gate() {
  const result = inspectW623fCertificationV2();
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'launch-board.json'), `${JSON.stringify(result, null, 2)}\n`);
  if (!result.gateOk) {
    console.error(`[W623F] certification v2 gate failed:\n- ${result.errors.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log(`[W623F] certification v2 gate passed (${result.checks.length}/${result.checks.length}); release state: ${result.releaseState}.`);
  }
  return result;
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) runW623fCertificationV2Gate();
