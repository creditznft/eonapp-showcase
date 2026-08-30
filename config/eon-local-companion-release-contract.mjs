/**
 * RT90 — fail-closed Local Companion release artifact authority.
 *
 * Source may know how to build a Companion before a consumer release exists.
 * A browser download is exposed only after a platform artifact has a version,
 * HTTPS URL, SHA-256 digest, signature proof and device-certification receipt.
 * Codex/release engineering must populate those immutable facts from the real
 * signed artifacts; the web app must never infer readiness from source alone.
 */
export const EON_LOCAL_COMPANION_RELEASE_SCHEMA = 'eon.local-companion.release.rt90.v1';

const EMPTY_ARTIFACT = Object.freeze({
  version: '',
  url: '',
  sha256: '',
  signed: false,
  signatureAuthority: '',
  deviceCertified: false,
  certificationReceipt: '',
  sizeBytes: 0
});

export const EON_LOCAL_COMPANION_RELEASE = Object.freeze({
  channel: 'stable',
  artifacts: Object.freeze({
    'windows-x64': EMPTY_ARTIFACT,
    'windows-arm64': EMPTY_ARTIFACT,
    'macos-arm64': EMPTY_ARTIFACT,
    'macos-x64': EMPTY_ARTIFACT,
    'linux-x64': EMPTY_ARTIFACT,
    'linux-arm64': EMPTY_ARTIFACT
  })
});

function clean(value = '', max = 500) {
  return String(value || '').trim().slice(0, max);
}

export function isVerifiedEonLocalCompanionArtifact(value = {}) {
  const url = clean(value.url, 1000);
  const digest = clean(value.sha256, 80).toLowerCase();
  return Boolean(
    clean(value.version, 80)
    && /^https:\/\//i.test(url)
    && /^[a-f0-9]{64}$/.test(digest)
    && value.signed === true
    && clean(value.signatureAuthority, 180)
    && value.deviceCertified === true
    && clean(value.certificationReceipt, 500)
    && Number(value.sizeBytes || 0) > 0
  );
}

export function getVerifiedEonLocalCompanionArtifact(platformKey = '') {
  const key = clean(platformKey, 40).toLowerCase();
  const artifact = EON_LOCAL_COMPANION_RELEASE.artifacts[key] || null;
  if (!artifact || !isVerifiedEonLocalCompanionArtifact(artifact)) return null;
  return Object.freeze({ platformKey: key, ...artifact, sha256: clean(artifact.sha256, 80).toLowerCase() });
}

export function validateEonLocalCompanionReleaseContract() {
  const errors = [];
  for (const [key, artifact] of Object.entries(EON_LOCAL_COMPANION_RELEASE.artifacts)) {
    const hasAnyReleaseField = Boolean(clean(artifact?.version) || clean(artifact?.url) || clean(artifact?.sha256) || artifact?.signed || artifact?.deviceCertified || clean(artifact?.certificationReceipt));
    if (hasAnyReleaseField && !isVerifiedEonLocalCompanionArtifact(artifact)) errors.push(`${key}:partial-or-unverified-release-artifact`);
  }
  return errors;
}
