/** Visible, non-sensitive immutable release identity for owner screenshots and support. */
const ENDPOINT = '/release/candidate-provenance.json';
const HEX = /^[a-f0-9]+$/i;

function shortHex(value, length) {
  const text = String(value || '').trim();
  return HEX.test(text) ? text.slice(0, length) : '';
}

function render(target, state, label) {
  target.dataset.eonReleaseIdentityState = state;
  target.textContent = label;
  target.hidden = false;
}

export function shouldShowEonReleaseIdentity(environment = globalThis, root = environment?.document) {
  try {
    const params = new URLSearchParams(String(environment?.location?.search || ''));
    if (params.get('diagnostics') === '1' || params.get('cityDiagnostics') === '1') return true;
  } catch {}
  try {
    const body = root?.body || root?.querySelector?.('body');
    if (body?.dataset?.eonReleaseIdentityVisible === 'true') return true;
  } catch {}
  return false;
}

export async function installEonReleaseIdentity(root = document, environment = globalThis) {
  const target = root.querySelector('[data-eon-release-identity]');
  if (!target) return Object.freeze({ ok: false, reason: 'target-missing' });
  target.setAttribute('role', 'status');
  target.setAttribute('aria-live', 'polite');
  target.hidden = true;
  target.textContent = '';
  target.dataset.eonReleaseIdentityState = 'hidden';
  if (!shouldShowEonReleaseIdentity(environment, root)) {
    return Object.freeze({ ok: true, visible: false, reason: 'diagnostics-disabled' });
  }
  try {
    const fetchImpl = environment?.fetch || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new Error('release-identity-fetch-unavailable');
    const response = await fetchImpl.call(environment, ENDPOINT, { cache: 'no-store', credentials: 'same-origin', headers: { accept: 'application/json', 'cache-control': 'no-store' } });
    const payload = await response.json().catch(() => null);
    const candidate = shortHex(payload?.candidateDigest, 12);
    const commit = shortHex(payload?.commitSha, 8);
    if (!response.ok || !candidate || !commit) throw new Error('release-identity-unavailable');
    render(target, 'verified', `Release ${candidate} · ${commit}`);
    target.dataset.eonCandidateDigest = candidate;
    target.dataset.eonCommitSha = commit;
    return Object.freeze({ ok: true, visible: true, candidate, commit });
  } catch {
    render(target, 'unavailable', 'Release identity unavailable');
    return Object.freeze({ ok: false, visible: true, reason: 'release-identity-unavailable' });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => installEonReleaseIdentity(), { once: true });
  else installEonReleaseIdentity();
}
