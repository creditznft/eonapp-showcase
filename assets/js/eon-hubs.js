/** Lightweight W181 hub interactions. Data remains local until EON Sync ships. */

const MISSION_KEY = 'eon:workbench:mission-timeline:v1';
const CHAT_KEY = 'eon:chat-history:v2';

function readJson(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function routeToChat(prompt = '') {
  const text = String(prompt || '').trim();
  try { if (text) localStorage.setItem('eon:chat:prefill:v1', text); } catch {}
  window.location.assign(`/chat${text ? `?q=${encodeURIComponent(text)}` : ''}`);
}

function createRow(title, detail) {
  const row = document.createElement('div');
  row.className = 'eon-hub-list-row';
  const left = document.createElement('strong');
  left.textContent = title;
  const right = document.createElement('span');
  right.textContent = detail;
  row.append(left, right);
  return row;
}

function renderProjects() {
  const host = document.getElementById('eon-project-list');
  if (!host) return;
  const rows = readJson(MISSION_KEY).slice(-6).reverse();
  if (!rows.length) {
    host.textContent = '';
    const empty = document.createElement('p');
    empty.className = 'eon-hub-empty';
    empty.textContent = 'No saved project activity yet. Start in EONBOT and turn a task into a project when it matters.';
    host.appendChild(empty);
    return;
  }
  host.textContent = '';
  rows.forEach((item) => {
    const title = String(item.title || item.goal || item.intentText || 'Untitled task').slice(0, 100);
    const status = String(item.status || item.stage || 'Saved').replace(/_/g, ' ');
    host.appendChild(createRow(title, status));
  });
}

function renderLibrary() {
  const chatHost = document.getElementById('eon-library-chat-list');
  if (!chatHost) return;
  const history = readJson(CHAT_KEY).slice(-6).reverse();
  chatHost.textContent = '';
  if (!history.length) {
    const empty = document.createElement('p');
    empty.className = 'eon-hub-empty';
    empty.textContent = 'Your saved chats and generated outputs will appear here on this device.';
    chatHost.appendChild(empty);
    return;
  }
  history.forEach((item) => {
    const title = String(item?.content || item?.text || item?.title || item?.role || 'Conversation').replace(/\s+/g, ' ').slice(0, 100);
    chatHost.appendChild(createRow(title || 'Conversation', item?.role === 'user' ? 'You' : 'EONBOT'));
  });
}

function bindPromptButtons() {
  document.querySelectorAll('[data-eon-chat-prompt]').forEach((button) => {
    button.addEventListener('click', () => routeToChat(button.getAttribute('data-eon-chat-prompt') || ''));
  });
}

function init() {
  bindPromptButtons();
  renderProjects();
  renderLibrary();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
