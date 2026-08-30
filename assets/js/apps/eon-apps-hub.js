/**
 * W384 — simplified Apps hub.
 *
 * Public Apps is intentionally a small set of useful starting points. Legacy
 * App Deck catalog data remains available for migration and local records, but
 * it is no longer the first thing a new user needs to learn.
 *
 * No provider, social, payment, account or background action starts here.
 */

const root = document.getElementById('eon-apps-root');
const PENDING_COMPOSER_PROMPT_KEY = 'eon:chat:pending-composer-prompt:v1';

const APPS = Object.freeze([
  Object.freeze({
    id: 'build',
    eyebrow: 'EON Forge',
    title: 'Build websites & apps',
    icon: '⌘',
    description: 'Turn an idea into a website, app prototype, or working code project you can preview and keep.',
    action: 'route',
    label: 'Open EON Forge',
    href: '/forge'
  }),
  Object.freeze({
    id: 'create',
    eyebrow: 'EON Studio',
    title: 'Create visuals & campaigns',
    icon: '✦',
    description: 'Shape image, video, campaign and content ideas into a clear creative direction.',
    action: 'chat',
    label: 'Start creating',
    prompt: 'Help me turn an idea into a creative brief. Ask about audience, format, tone, goal, and deadline before proposing a clear direction.'
  }),
  Object.freeze({
    id: 'research',
    eyebrow: 'EON Insight',
    title: 'Research & organize ideas',
    icon: '◌',
    description: 'Explore questions, notes and files, then turn what you find into a useful plan.',
    action: 'route',
    label: 'Open Research',
    href: '/insights?desk=research'
  }),
  Object.freeze({
    id: 'automate',
    eyebrow: 'EON Flow',
    title: 'Plan automations',
    icon: '↝',
    description: 'Design repeat workflows and review every step before anything happens.',
    action: 'route',
    label: 'Open Automate',
    href: '/automations'
  })
]);

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function getApp(id) {
  return APPS.find((app) => app.id === String(id || '')) || APPS[0];
}

function storeChatPrompt(prompt = '') {
  try { sessionStorage.setItem(PENDING_COMPOSER_PROMPT_KEY, String(prompt || '').trim()); } catch {}
}

function startInChat(app) {
  storeChatPrompt(app.prompt);
  window.location.assign('/?new=1');
}

function openApp(app) {
  if (app.action === 'chat') {
    startInChat(app);
    return;
  }
  if (app.href) window.location.assign(app.href);
}

function renderCard(app, selected) {
  return `<article class="eon-apps-hub-card${selected ? ' is-selected' : ''}" data-eon-app-id="${escapeHtml(app.id)}">
    <div class="eon-apps-hub-card-top">
      <span class="eon-apps-hub-icon" aria-hidden="true">${escapeHtml(app.icon)}</span>
      <p>${escapeHtml(app.eyebrow)}</p>
    </div>
    <h2>${escapeHtml(app.title)}</h2>
    <p class="eon-apps-hub-card-copy">${escapeHtml(app.description)}</p>
    <button type="button" data-eon-app-open="${escapeHtml(app.id)}">${escapeHtml(app.label)}</button>
  </article>`;
}

function renderDetail(app) {
  const useNow = app.id === 'build'
    ? 'Open EON Forge to start a website, app or code project. Preview and download your work when you are ready.'
    : app.action === 'chat'
      ? 'Open a focused EONBOT conversation to develop the idea with you.'
      : app.id === 'research'
      ? 'Open Research to make sense of questions, notes and material you choose.'
      : 'Open Flow to map a repeat task before you approve any action.';
  return `<aside class="eon-apps-hub-detail" aria-live="polite">
    <p class="eon-apps-hub-eyebrow">Selected</p>
    <h2>${escapeHtml(app.title)}</h2>
    <p>${escapeHtml(useNow)}</p>
    <button type="button" class="eon-apps-hub-primary" data-eon-app-open="${escapeHtml(app.id)}">${escapeHtml(app.label)}</button>
    <small>Guest-first · local start · no account connection required</small>
  </aside>`;
}

function render(selectedId = APPS[0].id) {
  if (!root) return;
  const selected = getApp(selectedId);
  root.innerHTML = `<section class="eon-apps-hub" aria-labelledby="eon-apps-title">
    <header class="eon-apps-hub-hero">
      <div>
        <p class="eon-apps-hub-eyebrow">EONAPP Apps</p>
        <h1 id="eon-apps-title">What would you like to make?</h1>
        <p>Choose a tool for building, creating, researching or planning. EONBOT is always here when you need a hand.</p>
      </div>
      <div class="eon-apps-hub-hero-actions">
        <a class="eon-apps-hub-secondary" href="/?new=1">Open EONBOT</a>
        <a class="eon-apps-hub-secondary" href="/eoncity">Enter EON City</a>
      </div>
    </header>
    <div class="eon-apps-hub-layout">
      <section class="eon-apps-hub-grid" aria-label="Available apps">${APPS.map((app) => renderCard(app, app.id === selected.id)).join('')}</section>
      ${renderDetail(selected)}
    </div>
    <footer class="eon-apps-hub-truth"><strong>Start simply.</strong><span>Your work begins here. Nothing is published, purchased or sent without your clear approval.</span></footer>
  </section>`;

  root.querySelectorAll('[data-eon-app-id]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('button')) return;
      render(card.dataset.eonAppId || APPS[0].id);
    });
  });
  root.querySelectorAll('[data-eon-app-open]').forEach((button) => {
    button.addEventListener('click', () => openApp(getApp(button.dataset.eonAppOpen)));
  });
}

function initialApp() {
  try {
    const value = new URLSearchParams(window.location.search).get('open') || '';
    return APPS.some((app) => app.id === value) ? value : APPS[0].id;
  } catch {
    return APPS[0].id;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => render(initialApp()), { once: true });
else render(initialApp());
