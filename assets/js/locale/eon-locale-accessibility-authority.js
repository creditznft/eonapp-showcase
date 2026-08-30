import {
  EON_CHAT_GUIDE_LANGUAGE_MATRIX,
  EON_FULL_PRODUCT_LANGUAGE_MATRIX,
  EON_LANGUAGE_CAPABILITY_MATRIX,
  EON_VOICE_LANGUAGE_MATRIX,
  getEonLanguageCapability
} from '../utils/language-matrix.js';

export const EON_LOCALE_ACCESSIBILITY_SCHEMA = 'eonapp.locale-accessibility-authority.a15.i24.v1';
export const EON_ACCESSIBILITY_MIN_TARGET_PX = 48;

const freeze = Object.freeze;

export const EON_ACCESSIBILITY_EVIDENCE_LANES = freeze([
  freeze({ id: 'keyboard', kind: 'source', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'focus-visible', kind: 'source', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'reduced-motion', kind: 'source', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'semantic-alternatives', kind: 'source', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'touch-targets', kind: 'source', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'language-of-page', kind: 'source', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'reflow-200-400', kind: 'browser', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'nvda-chrome', kind: 'assistive-technology', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'forced-colors', kind: 'browser', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'mobile-landscape-touch', kind: 'physical-device', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'rtl-browser', kind: 'browser', sourceReady: true, externalStatus: 'pending' }),
  freeze({ id: 'pwa-installed', kind: 'physical-device', sourceReady: true, externalStatus: 'pending' })
]);

export function getPublishedInterfaceLanguages() {
  return freeze(EON_FULL_PRODUCT_LANGUAGE_MATRIX.map((entry) => freeze({ ...entry })));
}

export function getChatGuideLanguageCapabilities() {
  return freeze(EON_CHAT_GUIDE_LANGUAGE_MATRIX.map((entry) => freeze({ ...entry })));
}

export function getBrowserSpeechLanguageCapabilities() {
  return freeze(EON_VOICE_LANGUAGE_MATRIX.map((entry) => freeze({ ...entry })));
}

export function describeLanguageCapability(value = 'en') {
  const entry = getEonLanguageCapability(value, EON_LANGUAGE_CAPABILITY_MATRIX[0]);
  return freeze({
    code: entry.code,
    name: entry.name,
    direction: entry.dir,
    publishedFullUi: entry.publishedFullUi,
    chatGuide: entry.chatGuide,
    browserSpeech: entry.browserSpeech,
    interfaceFallback: entry.publishedFullUi ? entry.code : 'en',
    publicationBlockedBy: entry.publishedFullUi ? freeze([]) : freeze(['route-state-copy', 'legal-copy', 'accessibility-browser-evidence'])
  });
}

export function evaluateRouteLocalizationManifest(routes = []) {
  const rows = Array.isArray(routes) ? routes : [];
  const errors = [];
  const ids = new Set();
  for (const row of rows) {
    if (!row?.id || ids.has(row.id)) errors.push(`route-identity:${row?.id || 'missing'}`);
    ids.add(row?.id);
    if (!row?.file || row?.language !== 'en' || row?.sourceComplete !== true) errors.push(`route-source:${row?.id || 'missing'}`);
  }
  return freeze({
    schema: `${EON_LOCALE_ACCESSIBILITY_SCHEMA}.route-manifest.v1`,
    routeCount: rows.length,
    englishSourceComplete: rows.length > 0 && errors.length === 0,
    errors: freeze(errors)
  });
}

export function createAccessibilityEvidenceReceipt(evidence = []) {
  const supplied = new Map((Array.isArray(evidence) ? evidence : []).map((row) => [row?.id, row]));
  const lanes = EON_ACCESSIBILITY_EVIDENCE_LANES.map((lane) => {
    const row = supplied.get(lane.id);
    const externalPass = row?.status === 'pass' && typeof row?.evidenceDigest === 'string' && /^[a-f0-9]{64}$/.test(row.evidenceDigest);
    return freeze({ ...lane, externalStatus: externalPass ? 'pass' : 'pending', evidenceDigest: externalPass ? row.evidenceDigest : null });
  });
  const externalComplete = lanes.every((lane) => lane.externalStatus === 'pass');
  return freeze({
    schema: `${EON_LOCALE_ACCESSIBILITY_SCHEMA}.evidence-receipt.v1`,
    lanes: freeze(lanes),
    sourceReady: lanes.every((lane) => lane.sourceReady),
    externalComplete,
    wcagConformanceCertified: externalComplete,
    assistiveTechnologyCertified: externalComplete,
    physicalDeviceCertified: externalComplete,
    automaticCertification: false,
    externalActionPerformed: false
  });
}

export function getLocaleAccessibilityTruth() {
  return freeze({
    schema: `${EON_LOCALE_ACCESSIBILITY_SCHEMA}.truth.v1`,
    publishedInterfaceLanguageCount: EON_FULL_PRODUCT_LANGUAGE_MATRIX.length,
    publishedInterfaceLanguages: freeze(EON_FULL_PRODUCT_LANGUAGE_MATRIX.map((entry) => entry.code)),
    chatGuideLanguageCount: EON_CHAT_GUIDE_LANGUAGE_MATRIX.length,
    browserSpeechLanguageCount: EON_VOICE_LANGUAGE_MATRIX.length,
    minimumTargetPx: EON_ACCESSIBILITY_MIN_TARGET_PX,
    nonEnglishInterfacePublished: EON_FULL_PRODUCT_LANGUAGE_MATRIX.some((entry) => entry.code !== 'en'),
    wcagConformanceCertified: false,
    assistiveTechnologyCertified: false,
    physicalDeviceCertified: false,
    browserMatrixCertified: false,
    automaticCertification: false,
    networkRequestCreated: false,
    storageWritten: false,
    navigationCreated: false
  });
}

export default freeze({
  EON_LOCALE_ACCESSIBILITY_SCHEMA,
  EON_ACCESSIBILITY_MIN_TARGET_PX,
  EON_ACCESSIBILITY_EVIDENCE_LANES,
  getPublishedInterfaceLanguages,
  getChatGuideLanguageCapabilities,
  getBrowserSpeechLanguageCapabilities,
  describeLanguageCapability,
  evaluateRouteLocalizationManifest,
  createAccessibilityEvidenceReceipt,
  getLocaleAccessibilityTruth
});
