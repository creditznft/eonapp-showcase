import { ensureProfile, getProfileStats } from '../utils/profile.js';
import { generateInviteLink } from '../utils/referral-par.js';
import { copyToClipboard, showToast } from '../utils/share.js';
import { getCurrentLanguage, initAppLanguage, translateForUser } from '../utils/app-language.js';
import { INTENTS } from './intents.js';
import { RESPONSES } from './responses.js';
import { buildGuidePlaybook } from './guide-mode-playbooks.js';
import { mapEonbotMultilingualRoutingSeed } from './eonbot-multilingual-routing.js';
import { buildEonbotCommandHubPlan } from './eonbot-command-hub.js';
import { applyEonbotTruthOverlay, buildEonbotTruthPlan } from './eonbot-truth-contract.js';

function sanitizeUrl(/** @type {any} */ url) {
  try {
    const parsed = new URL(String(url || ''), window.location.origin);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function openInNewTab(/** @type {any} */ url) {
  const safeUrl = sanitizeUrl(url);
  if (!safeUrl) {
    showToast('Blocked an unsafe link.', 'error');
    return;
  }
  window.open(safeUrl, '_blank', 'noopener,noreferrer');
}

function runChatAction(/** @type {any} */ action) {
  if (action === 'copyInvite') {
    void (async () => {
      const url = await generateInviteLink(ensureProfile(), { source: 'chatbot-action', destination: '/vault' });
      copyToClipboard(url);
    })().catch(() => showToast('Could not create a signed invite link.', 'error'));
    return;
  }

  if (action === 'openInvite') {
    void (async () => {
      const url = await generateInviteLink(ensureProfile(), { source: 'chatbot-open', destination: '/vault' });
      openInNewTab(url);
    })().catch(() => showToast('Could not create a signed invite link.', 'error'));
    return;
  }

  showToast('That action is not ready yet.', 'error');
}

function isWidgetMounted() {
  // Skip if the new eon-chat-widget or page-specific assistant is already on the page
  if (document.getElementById('eon-widget-btn') ||
      document.getElementById('eon-widget-panel') ||
      document.getElementById('cs-ai-toggle')) {
    return true;
  }
  return document.querySelector('[data-eon-chat-widget]') !== null;
}

async function translateBotText(/** @type {any} */ text, /** @type {any} */ category = 'guide') {
  return translateForUser(text, { fromLang: 'en', category });
}

async function translateChipList(/** @type {any} */ items = [], /** @type {any} */ category = 'guide') {
  const list = Array.isArray(items) ? items : [];
  return Promise.all(list.map((/** @type {any} */ item) => translateBotText(item, category)));
}

function mapMultilingualIntentKeyword(text) {
  return mapEonbotMultilingualRoutingSeed(text);
}

async function toEnglishForRouting(/** @type {any} */ text) {
  const source = String(text || '').trim();
  if (!source) return '';
  const mapped = mapMultilingualIntentKeyword(source);
  if (mapped) return mapped;
  const appLang = String(getCurrentLanguage() || 'en').toLowerCase();
  if (appLang === 'en') return source;
  const looksNonLatin = !/^[\p{ASCII}\s.,!?;:'"()\-_/]+$/u.test(source);
  try {
    const translated = await translateForUser(source, { fromLang: appLang, toLang: 'en', category: 'guide' });
    const primary = String(translated || source);
    if (looksNonLatin && primary === source) {
      const fallback = await translateForUser(source, { fromLang: 'auto', toLang: 'en', category: 'guide' });
      return String(fallback || primary);
    }
    return primary;
  } catch {
    return source;
  }
}

export class EONChatbot {
  /** @type {{user: string; bot: string; intent?: string}[]} */
  history = [];
  /** @type {string | null} */
  context = null;

  /** @param {{[key: string]: unknown}} [config] */
  constructor(/** @type {any} */ config = {}) {
    this.config = config;
  }

  respond(/** @type {any} */ userInput) {
    const normalized = userInput.toLowerCase().trim().replace(/[?!.,]/g, '');
    const truthPlan = buildEonbotTruthPlan(userInput, { voiceOptions: this.config.voiceOptions || {} });
    if (truthPlan.blocked) {
      this.history.push({ user: userInput, bot: truthPlan.text, intent: truthPlan.category });
      this.context = truthPlan.category;
      return truthPlan;
    }
    const commandPlan = buildEonbotCommandHubPlan(userInput, { source: 'chatbot' });
    const intent = commandPlan.matched ? { id: 'eonbot_command_hub' } : this._detectIntent(normalized);
    const rawResponse = commandPlan.matched ? commandPlan : this._buildResponse(intent);
    const response = applyEonbotTruthOverlay(rawResponse, truthPlan);
    this.history.push({ user: userInput, bot: response.text, intent: intent?.id || truthPlan.category });
    this.context = intent?.id || truthPlan.category || this.context;
    return response;
  }

  /** @param {string} text */
  _detectIntent(/** @type {any} */ text) {
    for (const /** @type {any} */
intent of INTENTS) {
      for (const /** @type {any} */
pattern of intent.patterns) {
        if (new RegExp(pattern, 'i').test(text)) {
          return intent;
        }
      }
    }
    return null;
  }

  _buildResponse(/** @type {any} */ intent) {
    if (!intent) {
      return this._fallback();
    }

    const playbook = buildGuidePlaybook(intent.id, this.config);
    if (playbook) return playbook;

    const variants = (/** @type {any} */ (RESPONSES))[intent.id] || [];
    const text = variants[Math.floor(Math.random() * variants.length)] || 'I can help you use Chat, Create, Projects, Library, Local AI, Vault, Research, EON City and safe sharing.';
    return {
      text,
      toolCTA: intent.toolCTA || null,
      actionCTA: intent.actionCTA || null,
      quickReplies: intent.quickReplies || [],
      steps: [],
      truthNote: ''
    };
  }

  _fallback() {
    return buildGuidePlaybook('fallback', this.config) || {
      text: "I’m EONBOT. Tell me the result you want, and I’ll prepare one clear next step for Chat, Create, Projects, Library, Local AI, Vault, Research, EON City or safe sharing.",
      toolCTA: { label: 'Open Create', url: '/create' },
      actionCTA: null,
      quickReplies: ['Start a new chat', 'Open Create', 'Open Projects', 'Make Local AI ready'],
      steps: [],
      truthNote: ''
    };
  }
}

function buildFixedActions(/** @type {any} */ root, /** @type {any} */ options = {}) {
  const stats = getProfileStats();
  const /** @type {any} */
actions = [
    {
      label: 'Copy invite',
      type: 'action',
      value: 'copyInvite'
    },
    {
      label: 'Open vault',
      type: 'link',
      value: '/vault'
    },
    {
      label: 'Open Create',
      type: 'link',
      value: '/create'
    },
    {
      label: 'Make Local AI ready',
      type: 'link',
      value: '/local-ai#eonbot-local-ai-setup'
    },
    {
      label: 'EON City',
      type: 'link',
      value: '/eoncity'
    },
    {
      label: 'Profile & limits',
      type: 'link',
      value: '/profile'
    }
  ];

    if (options.mode === 'widget') {
      const /** @type {any} */
statsEl = root.querySelector('[data-chat-profile]');
      if (statsEl) {
        statsEl.textContent = '';
        const /** @type {any} */
strong = document.createElement('strong');
        strong.textContent = `Generated alias · ${stats.avatar} ${stats.alias}`;
        const /** @type {any} */
details = document.createElement('span');
        details.textContent = 'Private local profile · Invite & Share Center is available without rewards or tracking.';
        statsEl.appendChild(strong);
        statsEl.appendChild(details);
      }
    }

  const /** @type {any} */
actionsEl = root.querySelector('[data-chat-actions]');
  if (!actionsEl) {
    return;
  }

  actionsEl.textContent = '';
  actions.forEach((/** @type {any} */ item) => {
    if (item.type === 'link') {
      const /** @type {any} */
link = document.createElement('a');
      link.className = 'chat-mini-action';
      link.href = sanitizeUrl(item.value) || '/';
      link.textContent = item.label;
      actionsEl.appendChild(link);
      return;
    }
    const /** @type {any} */
button = document.createElement('button');
    button.className = 'chat-mini-action';
    button.type = 'button';
    button.dataset.chatAction = item.value;
    button.textContent = item.label;
    actionsEl.appendChild(button);
  });

  actionsEl.querySelectorAll('[data-chat-action]').forEach((/** @type {any} */ button) => {
    button.addEventListener('click', () => runChatAction(button.dataset.chatAction));
  });
}

function renderChatInterface(/** @type {any} */ root, /** @type {any} */ options = {}) {
  initAppLanguage();
  const bot = new EONChatbot(options);
  const mode = options.mode || 'page';

  root.innerHTML = `
    <div class="${mode === 'widget' ? 'chat-widget-window' : 'chat-window'}">
      <div class="chat-widget-header">
        <div>
          <strong>EONBOT AI</strong>
          <span>${mode === 'widget' ? 'Local guide + AI handoff' : 'Rule-based site guide'}</span>
        </div>
        ${mode === 'widget' ? '<button class="chat-widget-close" type="button" aria-label="Close chat" data-chat-close>×</button>' : ''}
      </div>
      <div class="chat-widget-profile" data-chat-profile></div>
      <div class="chat-messages" data-chat-messages></div>
      <div class="chat-quick-btns" data-chat-quick></div>
      <div class="chat-shortcuts" data-chat-actions></div>
      <div class="chat-input-row">
        <input type="text" data-chat-input placeholder="Ask EONBOT what you want to create, continue or understand…" maxlength="220" />
        <button class="chat-send" type="button" data-chat-send>Send</button>
      </div>
    </div>
  `;

  const /** @type {any} */
messagesEl = root.querySelector('[data-chat-messages]');
  const /** @type {any} */
inputEl = root.querySelector('[data-chat-input]');
  const /** @type {any} */
sendBtn = root.querySelector('[data-chat-send]');
  const /** @type {any} */
quickEl = root.querySelector('[data-chat-quick]');

  const renderQuickReplies = async (/** @type {any} */ quickReplies = []) => {
    quickEl.innerHTML = '';
    const localizedReplies = await translateChipList(quickReplies, 'guide');
    localizedReplies.forEach((/** @type {any} */ reply) => {
      const /** @type {any} */
button = document.createElement('button');
      button.className = 'quick-btn';
      button.type = 'button';
      button.textContent = reply;
      button.addEventListener('click', () => handleSend(reply));
      quickEl.appendChild(button);
    });
  };

  const addMessage = async (/** @type {any} */ { text, role, toolCTA = null, actionCTA = null, commandProposal = null, quickReplies = [], steps = [], truthNote = '' }) => {
    const /** @type {any} */
message = document.createElement('div');
    message.className = `msg msg-${role}`;
    message.textContent = text;
    messagesEl.appendChild(message);

    const localizedSteps = Array.isArray(steps) && steps.length ? await translateChipList(steps, 'guide') : [];
    if (localizedSteps.length) {
      const list = document.createElement('ul');
      list.className = 'chat-guide-steps';
      list.style.cssText = 'margin:.45rem 0 .2rem 1.15rem;padding:0;align-self:flex-start;color:#e2e8f0';
      localizedSteps.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        li.style.margin = '0 0 .25rem';
        list.appendChild(/** @type {Node} */ (li.cloneNode(true)));
      });
      messagesEl.appendChild(list);
    }

    if (truthNote) {
      const truth = document.createElement('div');
      truth.className = 'chat-guide-truth';
      truth.style.cssText = 'margin:.4rem 0 0;padding:.6rem .75rem;border:1px solid rgba(148,163,184,.25);border-radius:12px;background:rgba(15,23,42,.55);align-self:flex-start;color:#cbd5e1;font-size:.8rem;line-height:1.5';
      truth.textContent = await translateBotText(truthNote, 'guide');
      messagesEl.appendChild(truth);
    }

    if (commandProposal) {
      const /** @type {any} */ review = document.createElement('a');
      review.href = '/';
      review.className = 'btn btn-outline btn-sm';
      review.style.cssText = 'display:inline-flex;margin-top:.5rem;align-self:flex-start';
      review.textContent = await translateBotText('Open full EONBOT Chat to review this guarded action', 'guide');
      messagesEl.appendChild(review);
    }

    if (toolCTA) {
      const /** @type {any} */
link = document.createElement('a');
      link.href = toolCTA.url;
      link.className = 'btn btn-primary btn-sm';
      link.style.cssText = 'display:inline-flex;margin-top:.5rem;align-self:flex-start';
      link.textContent = await translateBotText(toolCTA.label, 'guide');
      messagesEl.appendChild(link);
    }

    if (actionCTA) {
      const /** @type {any} */
actionButton = document.createElement('button');
      actionButton.type = 'button';
      actionButton.className = 'btn btn-outline btn-sm';
      actionButton.style.cssText = 'display:inline-flex;margin-top:.5rem;align-self:flex-start';
      actionButton.textContent = await translateBotText(actionCTA.label, 'guide');
      actionButton.addEventListener('click', () => runChatAction(actionCTA.action));
      messagesEl.appendChild(actionButton);
    }

    await renderQuickReplies(quickReplies || []);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const handleSend = async (/** @type {any} */ explicitText = '') => {
    const text = (explicitText || inputEl.value).trim();
    if (!text) {
      return;
    }
    if (sendBtn.dataset.processing === '1') {
      return; // prevent double-send while rule-based bot is typing
    }

    await addMessage({ text, role: 'user' });
    inputEl.value = '';
    sendBtn.dataset.processing = '1';
    sendBtn.disabled = true;

    setTimeout(async () => {
      const routingText = await toEnglishForRouting(text);
      const response = bot.respond(routingText);
      const localizedText = await translateBotText(response.text, 'guide');
      await addMessage({
        text: localizedText,
        role: 'bot',
        toolCTA: response.toolCTA,
        actionCTA: response.actionCTA,
        commandProposal: response.proposal || null,
        quickReplies: response.quickReplies,
        steps: response.steps,
        truthNote: response.truthNote
      });
      delete sendBtn.dataset.processing;
      sendBtn.disabled = false;
    }, 260 + Math.random() * 260);
  };

  sendBtn.addEventListener('click', () => { void handleSend(); });
  inputEl.addEventListener('keydown', (/** @type {any} */ event) => {
    if (event.key === 'Enter') {
      void handleSend();
    }
  });

  void (async () => {
    const /** @type {any} */
headerSub = root.querySelector('.chat-widget-header span');
    if (headerSub) {
      headerSub.textContent = await translateBotText(mode === 'widget' ? 'Local guide + AI handoff' : 'Rule-based site guide', 'guide');
    }
    if (inputEl) {
      inputEl.placeholder = await translateBotText('Ask EONBOT what you want to create, continue or understand…', 'guide');
    }
    if (sendBtn) {
      sendBtn.textContent = await translateBotText('Send', 'guide');
    }
  })();

  buildFixedActions(root, options);

  const stats = getProfileStats();
  setTimeout(async () => {
    const localizedGreeting = await translateBotText(`👋 Hey ${stats.alias}. Tell me the outcome you want. I can guide Chat, Create, Projects, Library, compatible Local AI, Vault, Research, sharing and EON City with clear approval steps.`, 'guide');
    await addMessage({
      text: localizedGreeting,
      role: 'bot',
      actionCTA: { label: 'Copy my invite link', action: 'copyInvite' },
      toolCTA: { label: 'Let EONBOT guide local AI', url: '/local-ai#eonbot-local-ai-setup' },
      quickReplies: ['Open Create', 'Make Local AI ready', 'Open EON City', 'Access status'],
      steps: ['Describe the result you want.', 'EONBOT will show the right app area and any approval needed.'],
      truthNote: 'Reward offers are not active until an approved provider and server-verified postback are connected.'
    });
  }, 220);
}

export function mountChatbot(/** @type {any} */ containerId, /** @type {any} */ config = {}) {
  const /** @type {any} */
root = document.getElementById(containerId);
  if (!root) {
    return;
  }
  renderChatInterface(root, { ...config, mode: 'page' });
}

export function mountChatWidget(/** @type {any} */ config = {}) {
  if (isWidgetMounted()) {
    return;
  }

  const /** @type {any} */
root = document.createElement('div');
  root.dataset.eonChatWidget = 'true';
  root.className = 'chat-widget-shell';
  root.innerHTML = `
    <button class="chat-widget-launcher" type="button" data-chat-launcher>
      <span>💬</span>
      <span>EONBOT AI</span>
    </button>
    <div class="chat-widget-panel" hidden>
      <div class="chat-widget-content" data-chat-widget-root></div>
    </div>
  `;
  document.body.appendChild(root);

  const /** @type {any} */
launcher = root.querySelector('[data-chat-launcher]');
  const /** @type {any} */
panel = root.querySelector('.chat-widget-panel');
  const /** @type {any} */
content = root.querySelector('[data-chat-widget-root]');

  renderChatInterface(content, { ...config, mode: 'widget' });

  const /** @type {any} */
closeButton = root.querySelector('[data-chat-close]');
  const setOpen = (/** @type {any} */ value) => {
    root.classList.toggle('is-open', value);
    panel.hidden = !value;
    localStorage.setItem('eon:chat-widget-open', value ? '1' : '0');
  };

  launcher.addEventListener('click', () => {
    setOpen(panel.hidden);
  });

  closeButton?.addEventListener('click', () => setOpen(false));

  const shouldOpen = localStorage.getItem('eon:chat-widget-open') === '1';
  if (shouldOpen) {
    setOpen(true);
  } else {
    setTimeout(() => {
      root.classList.add('is-ready');
    }, 1200);
  }
}
