import { createAIReply, loadAISettings } from '../../chat/ai-runtime.js';
import { buildEonbotCommandHubPlan } from '../../chat/eonbot-command-hub.js';
import { resolveChatLanguage } from '../../utils/app-language.js';
import { dispatchEonCityW659gVerifiedAction } from '../../contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import { getChatThreadQuery, resolveChatThread, updateChatThreadMessages } from '../../utils/chat-threads.js';

const freeze = (value) => Object.freeze(value);
const fallbackHistory = new Map();

function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function canonicalThread(environment = globalThis) {
  try {
    const storage = environment?.sessionStorage;
    return resolveChatThread({ storage, sessionStorage: storage }).thread || null;
  } catch {
    return null;
  }
}

function fallbackKey(invocation = {}) {
  return String(invocation?.sessionId || invocation?.context?.citySessionId || 'shared-city-chat').slice(0, 160);
}

function toView(messages = []) {
  return (Array.isArray(messages) ? messages : []).map((entry) => ({
    role: entry?.role === 'user' ? 'user' : 'assistant',
    content: String(entry?.text || entry?.content || ''),
    preparedRoute: String(entry?.toolCTA?.url || entry?.preparedRoute || ''),
    preparedLabel: String(entry?.toolCTA?.label || entry?.preparedLabel || ''),
    meta: entry?.meta || null
  })).filter((entry) => entry.content);
}

function toAiHistory(messages = []) {
  return toView(messages).slice(-10).map((entry) => ({ role: entry.role, content: entry.content }));
}

function persistThread(thread, messages = [], environment = globalThis) {
  if (!thread?.id) return null;
  try { return updateChatThreadMessages(thread.id, messages, { storage: environment?.sessionStorage }); }
  catch { return null; }
}

function resolveWorldContext(invocation = {}) {
  const source = invocation?.context?.eonbotWorldContext || invocation?.context?.expanseWorkspaceContext?.worldContext || null;
  if (!source || source.includesPrivateContent === true) return null;
  const worldRegionId = String(source.worldRegionId || '').slice(0, 64);
  const worldLabel = String(source.worldLabel || worldRegionId || 'EON City').slice(0, 80);
  const objectiveId = String(source.objectiveId || '').slice(0, 96);
  const plotId = String(source.plotId || '').slice(0, 96);
  const buildingId = String(source.buildingId || '').slice(0, 96);
  const nextAction = String(source.nextAction || '').slice(0, 240);
  return freeze({ worldRegionId, worldLabel, objectiveId, plotId, buildingId, nextAction, includesPrivateContent: false });
}

function contextualAiInput(prompt = '', worldContext = null) {
  if (!worldContext?.worldRegionId) return String(prompt || '');
  const facts = [
    `World: ${worldContext.worldLabel}`,
    worldContext.objectiveId ? `Objective: ${worldContext.objectiveId.replaceAll('-', ' ')}` : '',
    worldContext.plotId ? `Plot: ${worldContext.plotId.replaceAll('-', ' ')}` : '',
    worldContext.buildingId ? `Building: ${worldContext.buildingId.replaceAll('-', ' ')}` : '',
    worldContext.nextAction ? `Current next action: ${worldContext.nextAction}` : ''
  ].filter(Boolean).join(' · ');
  return `[EON City public gameplay context — no private content: ${facts}]

${String(prompt || '')}`;
}

function creatorModeForRoute(route = '') {
  const match = String(route || '').match(/^\/create\?mode=(image|video|music)$/i);
  return match ? match[1].toLowerCase() : '';
}

function renderPreparedAction(item = {}) {
  const route = String(item?.preparedRoute || '');
  if (!route) return '';
  const label = escapeText(item?.preparedLabel || 'Review destination');
  const creatorMode = creatorModeForRoute(route);
  if (creatorMode) return `<button type="button" data-eon-city-chat-create="${creatorMode}">${label}</button>`;
  if (/^\/(?!\/)/.test(route)) return `<a href="${escapeText(route)}">${label}</a>`;
  return '';
}

function renderLog(root, history = []) {
  const log = root.querySelector('[data-eon-city-chat-log]');
  if (!log) return;
  const view = toView(history);
  log.innerHTML = view.length
    ? view.slice(-10).map((item) => `<article class="eon-work-card-row"><div><small>${item.role === 'assistant' ? 'EONBOT' : 'You'}</small><p>${escapeText(item.content)}</p>${item.role === 'assistant' ? renderPreparedAction(item) : ''}</div></article>`).join('')
    : '<p class="eon-work-empty">EONBOT is ready inside EON City. This is the same active session thread used by the main EONBOT page.</p>';
  log.scrollTop = log.scrollHeight;
}

function render(invocation = {}) {
  const worldContext = resolveWorldContext(invocation);
  const contextLine = worldContext ? `<p class="eon-work-status" data-eon-city-chat-world-context>Here with you in <strong>${escapeText(worldContext.worldLabel)}</strong>${worldContext.nextAction ? ` · ${escapeText(worldContext.nextAction)}` : ''}</p>` : '';
  const contextAction = worldContext ? '<button type="button" data-eon-city-chat-help-current>Help with current step</button>' : '';
  return `<section class="eon-work-panel" data-eon-city-chat-adapter="lightweight">
    <header class="eon-work-panel-intro"><div><p class="eon-work-panel-kicker">Conversation workspace</p><h2>EONBOT</h2><p>Ask, continue and shape the next useful step without leaving EON City.</p>${contextLine}</div><div class="eon-work-panel-actions"><a href="/" data-eon-city-chat-full>Open full EONBOT</a><a href="/?new=1">New chat</a></div></header>
    <section class="eon-work-card">
      <div class="eon-work-card-list" data-eon-city-chat-log aria-live="polite"></div>
      <form class="eon-work-form" data-eon-city-chat-form>
        <label>What do you want to do?<textarea name="prompt" maxlength="4000" placeholder="Message EONBOT…"></textarea></label>
        <div class="eon-work-panel-actions"><button class="is-primary" type="submit">Send</button>${contextAction}<button type="button" data-eon-city-chat-clear>Clear draft</button></div>
        <p class="eon-work-status" data-eon-city-chat-status>Same active EONBOT session thread · no provider call starts until you press Send.</p>
      </form>
    </section>
  </section>`;
}

export async function mountEonWorkSurface({ root, environment = globalThis, invocation = {}, open } = {}) {
  root.innerHTML = render(invocation);
  const form = root.querySelector('[data-eon-city-chat-form]');
  const textarea = form?.elements?.prompt;
  const status = root.querySelector('[data-eon-city-chat-status]');
  const key = fallbackKey(invocation);
  const worldContext = resolveWorldContext(invocation);
  let thread = canonicalThread(environment);
  let running = false;
  let disposed = false;
  if (!fallbackHistory.has(key)) fallbackHistory.set(key, []);

  const getMessages = () => thread?.messages || fallbackHistory.get(key) || [];
  const setMessages = (messages = []) => {
    if (thread?.id) {
      const updated = persistThread(thread, messages, environment);
      if (updated) thread = updated;
      return thread?.messages || messages;
    }
    const safe = Array.isArray(messages) ? messages.slice(-14) : [];
    fallbackHistory.set(key, safe);
    return safe;
  };
  const syncFullLink = () => {
    const link = root.querySelector('[data-eon-city-chat-full]');
    if (link && thread?.id) link.href = getChatThreadQuery(thread.id);
  };

  syncFullLink();
  renderLog(root, getMessages());
  if (status) {
    status.textContent = thread?.id
      ? `Continuing “${String(thread.title || 'active chat').slice(0, 72)}” · same session thread as main EONBOT.`
      : 'Session transcript storage is unavailable. Typed EONBOT still works in this City session.';
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    if (running || disposed) return;
    const prompt = String(textarea?.value || '').trim();
    if (!prompt) {
      if (status) status.textContent = 'Write a message first.';
      return;
    }
    const stored = getMessages();
    running = true;
    form.querySelector('button[type="submit"]')?.setAttribute('disabled', '');
    if (status) status.textContent = 'EONBOT is working on your request…';
    try {
      const plan = buildEonbotCommandHubPlan(prompt, { source: 'eoncity-lightweight-chat' });
      if (plan.matched) {
        const route = String(plan?.toolCTA?.url || plan?.proposal?.route || '');
        const label = String(plan?.toolCTA?.label || plan?.proposal?.reviewLabel || 'Review destination');
        const reply = [plan.text, plan.truthNote].filter(Boolean).join(' ');
        const persisted = setMessages([...stored,
          { role: 'user', text: prompt, source: 'user' },
          { role: 'bot', text: reply, source: 'guide', toolCTA: route ? { url: route, label } : null }
        ]);
        syncFullLink();
        renderLog(root, persisted);
        if (textarea) {
          textarea.value = '';
        }
        if (status) status.textContent = 'EONBOT prepared a reviewed next step. Nothing was opened, spent or published automatically.';
        return;
      }
      const result = await createAIReply({
        input: contextualAiInput(prompt, worldContext),
        history: toAiHistory(stored),
        settings: {
          ...loadAISettings(),
          replyLanguage: resolveChatLanguage(),
          requestContext: { userInitiated: true, consentSource: 'city-lightweight-chat-send', origin: 'eoncity-lightweight-chat' }
        }
      });
      const reply = String(result?.text || 'No response returned.');
      const persisted = setMessages([...stored,
        { role: 'user', text: prompt, source: 'user' },
        { role: 'bot', text: reply, source: 'ai', meta: { provider: result?.meta?.provider || '', model: result?.meta?.model || '', local: Boolean(result?.meta?.local), elapsedMs: result?.meta?.elapsedMs ?? null } }
      ]);
      syncFullLink();
      renderLog(root, persisted);
      if (textarea) textarea.value = '';
      if (status) status.textContent = `${result?.meta?.provider || 'EONBOT'} · ${result?.meta?.model || 'verified model'} · ${result?.meta?.local ? 'local/private rail' : 'configured provider rail'}.`;
      dispatchEonCityW659gVerifiedAction({ type: 'eonbot.real-reply', receiptId: `eonbot:${environment?.crypto?.randomUUID?.() || Date.now()}`, verified: true, verifiedAt: Date.now(), source: 'eoncity-lightweight-chat' }, environment);
    } catch (error) {
      if (status) status.textContent = String(error?.message || 'EONBOT could not complete this request. Check Chat or Local AI settings.');
    } finally {
      running = false;
      form.querySelector('button[type="submit"]')?.removeAttribute('disabled');
      textarea?.focus?.({ preventScroll: true });
    }
  };

  const onClick = (event) => {
    if (event.target?.closest?.('[data-eon-city-chat-help-current]')) {
      if (textarea && worldContext) {
        textarea.value = worldContext.nextAction
          ? `Help me with this current ${worldContext.worldLabel} step: ${worldContext.nextAction}`
          : `What should I do next in ${worldContext.worldLabel}?`;
      }
      if (status) status.textContent = 'Current-step context added to your draft. Review or edit it, then press Send.';
      textarea?.focus?.({ preventScroll: true });
      return;
    }
    if (event.target?.closest?.('[data-eon-city-chat-clear]')) {
      if (textarea) textarea.value = '';
      textarea?.focus?.({ preventScroll: true });
      return;
    }
    const create = event.target?.closest?.('[data-eon-city-chat-create]');
    if (create && typeof open === 'function') {
      const creatorMode = String(create.dataset.eonCityChatCreate || '');
      if (['image', 'video', 'music'].includes(creatorMode)) void open({ id: 'create', source: 'eoncity-lightweight-chat', explicitUserAction: true, presentationMode: invocation.presentationMode || 'dock', sessionId: invocation.sessionId, context: { ...(invocation.context || {}), creatorMode } }, create);
    }
  };

  form?.addEventListener('submit', onSubmit);
  root.addEventListener('click', onClick);
  environment.requestAnimationFrame?.(() => textarea?.focus?.({ preventScroll: true }));

  return freeze({
    ok: true,
    lightweight: true,
    canonicalThreadId: thread?.id || '',
    dispose() {
      if (disposed) return;
      disposed = true;
      form?.removeEventListener('submit', onSubmit);
      root.removeEventListener('click', onClick);
    }
  });
}

export default mountEonWorkSurface;
