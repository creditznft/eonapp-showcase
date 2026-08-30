#!/usr/bin/env node
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES } from '../config/route-contract.mjs';
import {
  createAccessibilityEvidenceReceipt,
  evaluateRouteLocalizationManifest,
  getLocaleAccessibilityTruth
} from '../assets/js/locale/eon-locale-accessibility-authority.js';
import {
  EON_CHAT_GUIDE_LANGUAGE_CODES,
  EON_FULL_PRODUCT_LANGUAGE_CODES,
  EON_VOICE_LANGUAGE_MATRIX
} from '../assets/js/utils/language-matrix.js';
import { RC_LANGUAGE_CODES } from '../assets/js/utils/i18n-rc-registry.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const config = JSON.parse(read('config/locale/a15-i24-language-certification.json'));
const routes = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES];
const errors = [];

if (JSON.stringify(EON_FULL_PRODUCT_LANGUAGE_CODES) !== JSON.stringify(['en']) || JSON.stringify(RC_LANGUAGE_CODES) !== JSON.stringify(['en'])) errors.push('published-interface-language-set-invalid');
if (EON_CHAT_GUIDE_LANGUAGE_CODES.length !== 11 || EON_VOICE_LANGUAGE_MATRIX.length !== 11) errors.push('chat-guide-or-speech-capability-lost');
if (config.routes.length !== routes.length || JSON.stringify(config.routes.map((row) => row.id)) !== JSON.stringify(routes.map((row) => row.id))) errors.push('route-derived-manifest-drift');
for (const route of routes) {
  const html = read(route.file);
  if (!/<html[^>]*lang=["']en["']/i.test(html) || !/<title>[^<]+<\/title>/i.test(html) || !/<main\b/i.test(html) || !/name=["']viewport["']/i.test(html)) errors.push(`english-route-source:${route.file}`);
}
const manifest = evaluateRouteLocalizationManifest(config.routes);
if (!manifest.englishSourceComplete || manifest.errors.length) errors.push('english-manifest-incomplete');
const evidence = createAccessibilityEvidenceReceipt([]);
if (!evidence.sourceReady || evidence.externalComplete || evidence.wcagConformanceCertified || evidence.assistiveTechnologyCertified || evidence.physicalDeviceCertified) errors.push('external-evidence-boundary-invalid');
const truth = getLocaleAccessibilityTruth();
if (truth.publishedInterfaceLanguageCount !== 1 || truth.chatGuideLanguageCount !== 11 || truth.nonEnglishInterfacePublished || truth.wcagConformanceCertified || truth.automaticCertification) errors.push('locale-accessibility-truth-invalid');

const sourceFiles = [
  'assets/js/locale/eon-locale-accessibility-authority.js',
  'assets/js/utils/language-matrix.js',
  'assets/js/utils/i18n-rc-registry.js',
  'assets/js/runtime/w716/eonapp-w716-accessibility-language-input.js'
];
for (const file of sourceFiles) {
  const source = read(file);
  if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon|localStorage\.|sessionStorage\.|location\.(?:assign|replace)|window\.open/.test(source)) errors.push(`authority-side-effect:${file}`);
}
const css = `${read('assets/css/layout.css')}\n${read('assets/css/eon-city-play.css')}\n${read('public/assets/css/eon-nexus-live.css')}`;
if (!/:focus-visible/.test(css) || !/prefers-reduced-motion/.test(css) || !/safe-area-inset/.test(css)) errors.push('focus-motion-safe-area-source-missing');
if (config.claims.wcagConformanceCertified || config.claims.assistiveTechnologyCertified || config.claims.physicalDeviceCertified || config.claims.externalBrowserCertified || config.claims.automaticCertification) errors.push('config-false-certification-claim');

const core = {
  schema: 'eonapp.a15.i24.locale-accessibility-device-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I24',
  status: errors.length ? 'fail' : 'pass',
  publishedInterfaceLanguages: EON_FULL_PRODUCT_LANGUAGE_CODES,
  chatGuideLanguageCount: EON_CHAT_GUIDE_LANGUAGE_CODES.length,
  browserSpeechLanguageCount: EON_VOICE_LANGUAGE_MATRIX.length,
  routeCount: routes.length,
  englishSourceComplete: manifest.englishSourceComplete,
  minimumTargetPx: truth.minimumTargetPx,
  sourceAccessibilityReady: evidence.sourceReady,
  browserEvidenceComplete: false,
  assistiveTechnologyEvidenceComplete: false,
  physicalDeviceEvidenceComplete: false,
  wcagConformanceCertified: false,
  automaticCertification: false,
  externalActionPerformed: false,
  configSha256: sha(JSON.stringify(config)),
  errors
};
const receipt = { ...core, digest: sha(JSON.stringify(core)) };
const output = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I24_LOCALE_ACCESSIBILITY_DEVICE_GATE_RECEIPT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I24] ${receipt.status.toUpperCase()}: ${routes.length} English routes; ${core.chatGuideLanguageCount} Chat/Guide and ${core.browserSpeechLanguageCount} speech capabilities; external evidence pending.`);
if (errors.length) { errors.forEach((error) => console.error(`[A15 I24] ${error}`)); process.exitCode = 1; }
