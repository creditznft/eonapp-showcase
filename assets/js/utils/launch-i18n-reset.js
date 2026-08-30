/** Honest launch-language notice for partially dynamic surfaces. */
const KEY = 'eon:i18n-launch-notice-dismissed:v1';

export function applyLaunchI18nReset(root = document) {
  if (!root?.body || root.getElementById?.('eon-i18n-launch-notice')) return null;
  let dismissed = false;
  try { dismissed = localStorage.getItem(KEY) === '1'; } catch {}
  if (dismissed) return null;
  const language = document.documentElement.lang || 'en';
  if (language === 'en') return null;
  const note = document.createElement('aside');
  note.id = 'eon-i18n-launch-notice';
  note.className = 'eon-i18n-launch-notice';
  note.setAttribute('role', 'status');
  note.innerHTML = '<span>You can choose your language from the header. Some advanced dynamic sections may remain English while translation coverage is completed.</span><button type="button" aria-label="Dismiss language notice">×</button>';
  note.querySelector('button')?.addEventListener('click', () => {
    try { localStorage.setItem(KEY, '1'); } catch {}
    note.remove();
  });
  root.body.appendChild(note);
  return note;
}
