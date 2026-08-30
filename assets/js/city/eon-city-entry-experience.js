/**
 * W652 — EON City first-impression contract.
 *
 * The signed-out route remains a static, authenticated-only portal. This
 * module supplies value-led product copy without importing Babylon, City audio,
 * GLBs, project data, provider state, or private account content.
 */
export const EON_CITY_ENTRY_EXPERIENCE_SCHEMA = 'eon.city.entry-experience.w732.v1';

const freeze = (value) => Object.freeze(value);

export const EON_CITY_ENTRY_PROMISE = freeze({
  kicker: 'EON CITY · COMMAND HUB',
  title: 'Your work becomes a place.',
  detail: 'Enter a compact private 3D Command Hub where EONBOT, creation, projects, Library, sharing, automations and My Realm open through familiar full-screen workspaces.',
  authenticatedOnly: true,
  public3dPreview: false
});

export const EON_CITY_ENTRY_HIGHLIGHTS = freeze([
  freeze({ id: 'orientation-core', label: 'Orientation Core', detail: 'Spawn into one complete, readable atrium with every launch station nearby.' }),
  freeze({ id: 'productive-stations', label: 'Productive stations', detail: 'Open the same real EONAPP workspaces used by the normal app.' }),
  freeze({ id: 'share-capture', label: 'Share and Capture', detail: 'Record City gameplay locally, review it and share with an explicit invite link.' }),
  freeze({ id: 'my-realm', label: 'My Realm', detail: 'Return to a fixed personal layout without free-build or multiplayer claims.' })
]);

export const EON_CITY_ENTRY_TRUST_POINTS = freeze([
  freeze({ id: 'deferred-download', label: 'No City download before sign-in', detail: 'Babylon, GLBs, City audio and controls stay off until access is confirmed.' }),
  freeze({ id: 'review-first', label: 'You stay in control', detail: 'City can prepare and explain actions, but native work surfaces open only after a visible choice.' }),
  freeze({ id: 'local-custody', label: 'Local-first custody', detail: 'Google Login is identity only; local work stays in this browser unless you explicitly create a backup.' })
]);

export function getEonCityEntryExperience() {
  return freeze({
    schema: EON_CITY_ENTRY_EXPERIENCE_SCHEMA,
    promise: freeze({ ...EON_CITY_ENTRY_PROMISE }),
    highlights: freeze(EON_CITY_ENTRY_HIGHLIGHTS.map((entry) => freeze({ ...entry }))),
    trustPoints: freeze(EON_CITY_ENTRY_TRUST_POINTS.map((entry) => freeze({ ...entry }))),
    importsHeavyRuntime: false,
    readsPrivateWork: false,
    startsProvider: false,
    startsAudio: false,
    automaticNavigation: false
  });
}

export function validateEonCityEntryExperience(experience = getEonCityEntryExperience()) {
  const errors = [];
  if (experience?.schema !== EON_CITY_ENTRY_EXPERIENCE_SCHEMA) errors.push('entry-schema-invalid');
  if (experience?.promise?.title !== 'Your work becomes a place.') errors.push('entry-product-promise-missing');
  if (experience?.promise?.authenticatedOnly !== true || experience?.promise?.public3dPreview !== false) errors.push('entry-auth-boundary-invalid');
  if (!Array.isArray(experience?.highlights) || experience.highlights.length !== 4) errors.push('entry-highlight-count-invalid');
  if (!Array.isArray(experience?.trustPoints) || experience.trustPoints.length !== 3) errors.push('entry-trust-count-invalid');
  const ids = [...(experience?.highlights || []), ...(experience?.trustPoints || [])].map((entry) => entry?.id);
  if (ids.some((id) => !/^[a-z0-9-]{3,40}$/.test(String(id || ''))) || new Set(ids).size !== ids.length) errors.push('entry-identities-invalid');
  const text = JSON.stringify(experience || {});
  if (/public 3d preview|demo bypass|automatic provider|auto[- ]?navigate|payment|checkout|reward grant/i.test(text)) errors.push('entry-forbidden-claim');
  if (experience?.importsHeavyRuntime || experience?.readsPrivateWork || experience?.startsProvider || experience?.startsAudio || experience?.automaticNavigation) errors.push('entry-boundary-broadened');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), highlightCount: experience?.highlights?.length || 0, trustPointCount: experience?.trustPoints?.length || 0 });
}
