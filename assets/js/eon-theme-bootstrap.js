/* W381 — apply the local dark theme before the first styled paint. */
(() => {
  const root = document.documentElement;
  const migration = { 'classic-eon': 'graphite', system: 'graphite', 'neon-night': 'graphite' };
  const allowed = new Set(['graphite', 'obsidian', 'ember']);
  const defaultTheme = 'graphite';
  let saved = '';
  try { saved = String(localStorage.getItem('eon:theme') || '').trim().toLowerCase(); } catch {}
  const candidate = migration[saved] || saved;
  const theme = allowed.has(candidate) ? candidate : defaultTheme;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-eon-theme-bootstrap', 'ready');
  const colors = { graphite: '#111411', obsidian: '#070809', ember: '#17110e' };
  root.style.backgroundColor = colors[theme] || colors.graphite;
  const applyThemeColor = () => document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute('content', colors[theme] || colors.graphite));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyThemeColor, { once: true });
  else applyThemeColor();
})();
