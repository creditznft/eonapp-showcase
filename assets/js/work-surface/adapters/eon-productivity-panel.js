import { EON_CREATE_MODES } from '../../create/eon-create-catalog.js';
import { bindUnifiedCreatorWorkspace, renderUnifiedCreatorWorkspace } from '../../create/creator-unified-workspace.js';
import { bindEonMusicStudio, renderEonMusicStudio } from '../../create/eon-music-studio.js';
import { bindComfyUiImageLab, renderComfyUiImageLab } from '../../local-ai/comfyui-image-lab.js';
import { bindComfyUiVideoLab, renderComfyUiVideoLab } from '../../local-ai/comfyui-video-lab.js';
import { bindDirectByokWorkspace, renderDirectByokWorkspace } from '../../direct-byok/direct-byok-workspace.js';
import { createAIReply, loadAISettings } from '../../chat/ai-runtime.js';
import { buildEonbotCommandHubPlan } from '../../chat/eonbot-command-hub.js';
import {
  createEonCityVoiceConsentController,
  getEonCityVoiceLanguageOptions,
  speakEonCityCaption,
  stopEonCityCaption
} from '../../voice/eon-voice-consent.js';
import {
  getVoiceLanguageBase,
  readVoiceLanguagePreference,
  saveVoiceLanguagePreference
} from '../../chat/voice-language-preferences.js';
import { resolveChatLanguage, setChatLanguagePreference } from '../../utils/app-language.js';
import { loadAutomationState } from '../../utils/automation-os-store.js';
import { getWorkspaceSnapshot, loadLibrary, loadProjects } from '../../utils/eon-workspace-store.js';
import { ensureMyRealmState, MY_REALM_LAYOUTS } from '../../realm/realm-state.js';
import { dispatchEonCityW659gVerifiedAction } from '../../contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import { getChatThreadQuery, resolveChatThread, updateChatThreadMessages } from '../../utils/chat-threads.js';

const cityCreatorExecutionState = { image: null, video: null };
let pendingCityCreatorDraft = null;

const CITY_CREATOR_STYLE_HREFS = Object.freeze([
  '/assets/css/eon-create-hub.css',
  '/assets/css/local-ai.css'
]);

function ensureCityCreatorStyles(documentRef = globalThis.document) {
  if (!documentRef?.head?.appendChild) return;
  for (const href of CITY_CREATOR_STYLE_HREFS) {
    if (documentRef.querySelector?.(`link[data-eon-city-creator-style="${href}"]`)) continue;
    const link = documentRef.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.eonCityCreatorStyle = href;
    documentRef.head.appendChild(link);
  }
}

function renderCityCreatorExecution(mode = '') {
  if (mode === 'image') return `<section data-eon-city-creator-local>${renderComfyUiImageLab(cityCreatorExecutionState, { compact: true })}</section>${renderUnifiedCreatorWorkspace(mode)}${renderDirectByokWorkspace({ mediaKind: mode })}`;
  if (mode === 'video') return `<section data-eon-city-creator-local>${renderComfyUiVideoLab(cityCreatorExecutionState, { compact: true, embedded: true })}</section>${renderUnifiedCreatorWorkspace(mode)}${renderDirectByokWorkspace({ mediaKind: mode })}`;
  return renderEonMusicStudio();
}

function applyPendingCityCreatorDraft(root, mode = '') {
  if (!pendingCityCreatorDraft || pendingCityCreatorDraft.mode !== mode) return;
  const prompt = String(pendingCityCreatorDraft.prompt || '').trim();
  if (!prompt) { pendingCityCreatorDraft = null; return; }
  pendingCityCreatorDraft = null;
  const fields = mode === 'image'
    ? ['[data-comfy-prompt]', '[data-direct-media-prompt]', '[data-eon-unified-creator] textarea[name="goal"]']
    : mode === 'video'
      ? ['[data-video-prompt]', '[data-direct-media-prompt]', '[data-eon-unified-creator] textarea[name="goal"]']
      : ['[data-music-idea]', '[data-music-acestep-prompt]', '[data-music-hosted-prompt]'];
  for (const selector of fields) { const field = root.querySelector(selector); if (field && !String(field.value || '').trim()) { field.value = prompt; field.dispatchEvent(new Event('input', { bubbles: true })); } }
}

function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function safeDate(value = '') {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Saved locally';
  try { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date); } catch { return 'Saved locally'; }
}

function intro(invocation, actions = '') {
  return `<header class="eon-work-panel-intro"><div><p class="eon-work-panel-kicker">${escapeText(invocation.definition.eyebrow)}</p><h2>${escapeText(invocation.definition.label)}</h2><p>${escapeText(invocation.definition.description)}</p></div>${actions ? `<div class="eon-work-panel-actions">${actions}</div>` : ''}</header>`;
}

function empty(message) {
  return `<p class="eon-work-empty">${escapeText(message)}</p>`;
}

function projectCards(projects = []) {
  if (!projects.length) return empty('No local projects yet. Create one clear outcome and continue from here.');
  return `<div class="eon-work-card-list">${projects.slice(0, 6).map((project) => `<article class="eon-work-card-row"><div><strong>${escapeText(project.title || 'Untitled project')}</strong><small>${escapeText(project.status || 'active')} · ${escapeText(safeDate(project.updatedAt || project.createdAt))}</small></div><a href="/projects?project=${encodeURIComponent(project.id || '')}">Open</a></article>`).join('')}</div>`;
}

function libraryCards(items = []) {
  if (!items.length) return empty('No local Library items yet. Save a useful prompt, note, template or output.');
  return `<div class="eon-work-card-list">${items.slice(0, 6).map((item) => `<article class="eon-work-card-row"><div><strong>${escapeText(item.title || 'Saved item')}</strong><small>${escapeText(item.type || 'item')} · ${escapeText(safeDate(item.updatedAt || item.createdAt))}</small></div><a href="/library?item=${encodeURIComponent(item.id || '')}">Open</a></article>`).join('')}</div>`;
}

const cityChatFallbackHistory = new Map();

function resolveCanonicalCityChatThread() {
  try {
    const storage = globalThis.sessionStorage;
    return resolveChatThread({ storage, sessionStorage: storage }).thread || null;
  } catch {
    return null;
  }
}

function cityChatFallbackKey(invocation = {}) {
  return String(invocation?.sessionId || invocation?.context?.citySessionId || 'shared-city-chat').slice(0, 160);
}

function toCityChatView(messages = []) {
  return (Array.isArray(messages) ? messages : []).map((entry) => ({
    role: entry?.role === 'user' ? 'user' : 'assistant',
    content: String(entry?.text || entry?.content || ''),
    preparedRoute: String(entry?.toolCTA?.url || entry?.preparedRoute || ''),
    preparedLabel: String(entry?.toolCTA?.label || entry?.preparedLabel || ''),
    meta: entry?.meta || null
  })).filter((entry) => entry.content);
}

function toAiHistory(messages = []) {
  return toCityChatView(messages).slice(-10).map((entry) => ({ role: entry.role, content: entry.content }));
}

function persistCanonicalCityChat(thread, messages = []) {
  if (!thread?.id) return null;
  try { return updateChatThreadMessages(thread.id, messages, { storage: globalThis.sessionStorage }); }
  catch { return null; }
}

function voiceLanguageOptionsMarkup(selected = 'auto') {
  return getEonCityVoiceLanguageOptions().map((option) => `<option value="${escapeText(option.value)}"${option.value === selected ? ' selected' : ''}>${escapeText(option.label)}</option>`).join('');
}

function renderChat(invocation) {
  const selectedVoiceLocale = readVoiceLanguagePreference();
  return `<section class="eon-work-panel">${intro(invocation, '<a href="/" data-eon-work-chat-full>Open full EONBOT</a><a href="/?new=1">New chat</a>')}<section class="eon-work-card"><div class="eon-work-card-list" data-eon-work-chat-log aria-live="polite"></div><form class="eon-work-form" data-eon-work-chat-form><label>What do you want to do?<textarea name="prompt" maxlength="4000" placeholder="Ask EONBOT here. This is the same active session thread used by the main EONBOT page."></textarea></label><div class="eon-work-panel-actions"><button class="is-primary" type="submit">Ask here</button><button type="button" data-eon-work-chat-clear>Clear draft</button></div><div class="eon-work-panel-actions" aria-label="City EONBOT voice controls"><label>Voice language <select data-eon-work-chat-voice-language>${voiceLanguageOptionsMarkup(selectedVoiceLocale)}</select></label><button type="button" data-eon-work-chat-mic-check>Enable microphone</button><button type="button" data-eon-work-chat-dictate>Dictate once</button><button type="button" data-eon-work-chat-stop-dictation>Stop dictation</button><button type="button" data-eon-work-chat-speak>Speak latest reply</button><button type="button" data-eon-work-chat-stop-speech>Stop speech</button></div><p class="eon-work-status" data-eon-work-chat-status>Same active EONBOT session thread · no provider call starts until you press Ask here. Dictation is editable-first and never auto-sends.</p></form></section></section>`;
}

function creatorModeForRoute(route = '') {
  const match = String(route || '').match(/^\/create\?mode=(image|video|music)$/i);
  return match ? match[1].toLowerCase() : '';
}

function renderPreparedChatAction(item = {}) {
  const route = String(item?.preparedRoute || '');
  const label = escapeText(item?.preparedLabel || 'Review destination');
  const creatorMode = creatorModeForRoute(route);
  if (creatorMode) return `<button type="button" data-eon-work-chat-prepared-create="${creatorMode}">${label}</button>`;
  if (/^\/(?!\/)/.test(route)) return `<a href="${escapeText(route)}">${label}</a>`;
  return '';
}

function renderChatLog(root, history = []) {
  const log = root.querySelector('[data-eon-work-chat-log]');
  if (!log) return;
  log.innerHTML = history.length ? history.slice(-8).map((item) => `<article class="eon-work-card-row"><div><small>${escapeText(item.role === 'assistant' ? 'EONBOT' : 'You')}</small><p>${escapeText(item.content)}</p>${item.role === 'assistant' ? renderPreparedChatAction(item) : ''}</div></article>`).join('') : '<p class="eon-work-empty">EONBOT is ready inside EON City. Your active session thread will continue here and on the main EONBOT page.</p>';
}

function bindChat(root, navigate, open, invocation) {
  const form = root.querySelector('[data-eon-work-chat-form]');
  const textarea = form?.elements?.prompt;
  const status = root.querySelector('[data-eon-work-chat-status]');
  const voiceLanguage = root.querySelector('[data-eon-work-chat-voice-language]');
  const fallbackKey = cityChatFallbackKey(invocation);
  let canonicalThread = resolveCanonicalCityChatThread();
  if (!cityChatFallbackHistory.has(fallbackKey)) cityChatFallbackHistory.set(fallbackKey, []);
  const getStoredMessages = () => canonicalThread?.messages || cityChatFallbackHistory.get(fallbackKey) || [];
  const setStoredMessages = (messages = []) => {
    if (canonicalThread?.id) {
      const updated = persistCanonicalCityChat(canonicalThread, messages);
      if (updated) canonicalThread = updated;
      return canonicalThread?.messages || messages;
    }
    const safe = Array.isArray(messages) ? messages.slice(-12) : [];
    cityChatFallbackHistory.set(fallbackKey, safe);
    return safe;
  };
  const syncFullChatLink = () => {
    const link = root.querySelector('[data-eon-work-chat-full]');
    if (link && canonicalThread?.id) link.href = getChatThreadQuery(canonicalThread.id);
  };
  syncFullChatLink();
  renderChatLog(root, toCityChatView(getStoredMessages()));
  let running = false;
  let latestReply = String(toCityChatView(getStoredMessages()).filter((entry) => entry.role === 'assistant').at(-1)?.content || '');
  if (status) {
    status.textContent = canonicalThread?.id
      ? `Continuing “${String(canonicalThread.title || 'active chat').slice(0, 72)}” · same session thread as main EONBOT.`
      : 'Session transcript storage is unavailable. Typed EONBOT still works, but this City transcript cannot follow you back to the main page.';
  }
  const voice = createEonCityVoiceConsentController({
    environment: globalThis,
    onState(snapshot) {
      if (snapshot.reviewReady && textarea) {
        textarea.value = String(snapshot.transcript || '').slice(0, 6000);
      }
      const listening = snapshot.dictationState === 'starting' || snapshot.dictationState === 'listening';
      if (listening && status) status.textContent = 'Listening once. The transcript stays editable and will not send automatically.';
      if (snapshot.lastError && status) status.textContent = `Voice: ${String(snapshot.lastError).replaceAll('-', ' ')}. Typed chat remains available.`;
    }
  });
  const resolvedSpeechLocale = () => String(voiceLanguage?.value || readVoiceLanguagePreference() || 'auto');

  const submitHandler = async (event) => {
    event.preventDefault();
    if (running) return;
    const prompt = String(textarea?.value || '').trim();
    if (!prompt) { if (status) status.textContent = 'Describe the task first.'; return; }
    const storedHistory = getStoredMessages();
    const history = toAiHistory(storedHistory);
    running = true;
    form.querySelector('button[type="submit"]')?.setAttribute('disabled', '');
    if (status) status.textContent = 'EONBOT is checking the same safe action planner and AI runtime used by Chat…';
    try {
      const plan = buildEonbotCommandHubPlan(prompt, { source: 'eoncity-work-surface-chat' });
      if (plan.matched) {
        const preparedRoute = String(plan?.toolCTA?.url || plan?.proposal?.route || '');
        const preparedLabel = String(plan?.toolCTA?.label || plan?.proposal?.reviewLabel || 'Review destination');
        const assistantText = [plan.text, plan.truthNote].filter(Boolean).join(' ');
        const creatorMode = creatorModeForRoute(preparedRoute);
        if (creatorMode) pendingCityCreatorDraft = { mode: creatorMode, prompt: prompt.slice(0, 1200) };
        const nextStored = [...storedHistory,
          { role: 'user', text: prompt, source: 'user' },
          { role: 'bot', text: assistantText, source: 'guide', toolCTA: preparedRoute ? { url: preparedRoute, label: preparedLabel } : null }
        ];
        latestReply = assistantText;
        const persisted = setStoredMessages(nextStored);
        syncFullChatLink();
        renderChatLog(root, toCityChatView(persisted));
        if (textarea) textarea.value = '';
        if (status) status.textContent = 'EONBOT prepared a reviewed destination. Nothing was generated, opened, spent or published yet.';
        return;
      }
      const result = await createAIReply({
        input: prompt,
        history,
        settings: {
          ...loadAISettings(),
          replyLanguage: resolveChatLanguage(),
          requestContext: { userInitiated: true, consentSource: 'city-work-surface-send-action', origin: 'eoncity-work-surface-chat' }
        }
      });
      latestReply = String(result?.text || 'No response returned.');
      const nextStored = [...storedHistory,
        { role: 'user', text: prompt, source: 'user' },
        { role: 'bot', text: latestReply, source: 'ai', meta: { provider: result?.meta?.provider || '', model: result?.meta?.model || '', local: Boolean(result?.meta?.local), elapsedMs: result?.meta?.elapsedMs ?? null } }
      ];
      const persisted = setStoredMessages(nextStored);
      syncFullChatLink();
      renderChatLog(root, toCityChatView(persisted));
      if (textarea) textarea.value = '';
      if (status) status.textContent = `${result?.meta?.provider || 'EONBOT'} · ${result?.meta?.model || 'verified model'} · ${result?.meta?.local ? 'local/private rail' : 'configured provider rail'}. No City-only AI fork was used.`;
      dispatchEonCityW659gVerifiedAction({ type: 'eonbot.real-reply', receiptId: `eonbot:${globalThis.crypto?.randomUUID?.() || Date.now()}`, verified: true, verifiedAt: Date.now(), source: 'eoncity-work-surface-chat' }, globalThis);
    } catch (error) {
      if (status) status.textContent = String(error?.message || 'EONBOT could not complete this request. Review the active model/provider in Chat or Local AI.');
    } finally {
      running = false;
      form.querySelector('button[type="submit"]')?.removeAttribute('disabled');
      textarea?.focus();
    }
  };
  form?.addEventListener('submit', submitHandler);

  const clickHandler = (event) => {
    const prepared = event.target?.closest?.('[data-eon-work-chat-prepared-create]');
    if (prepared) {
      const creatorMode = String(prepared.dataset.eonWorkChatPreparedCreate || '');
      if (!['image', 'video', 'music'].includes(creatorMode)) return;
      if (typeof open === 'function') {
        void open({ id: 'create', context: { ...(invocation?.context || {}), creatorMode }, explicitUserAction: true }, prepared);
        return;
      }
      navigate(`/create?mode=${encodeURIComponent(creatorMode)}`);
      return;
    }
    if (event.target?.closest?.('[data-eon-work-chat-clear]')) {
      if (textarea) textarea.value = '';
      voice.clearReview({ explicitUserAction: true });
      textarea?.focus();
      return;
    }
    if (event.target?.closest?.('[data-eon-work-chat-mic-check]')) {
      void voice.checkMicrophonePermission({ explicitUserAction: true }).then((result) => {
        if (status) status.textContent = result.ok ? 'Microphone permission check passed. Choose Dictate once when ready.' : `Microphone check unavailable: ${result.error}. Typed chat remains available.`;
      });
      return;
    }
    if (event.target?.closest?.('[data-eon-work-chat-dictate]')) {
      const result = voice.startDictation({ explicitUserAction: true, locale: resolvedSpeechLocale(), mode: 'dictate' });
      if (status) status.textContent = result.ok ? 'Listening once. Review the transcript before pressing Ask here.' : `Dictation did not start: ${result.error}.`;
      return;
    }
    if (event.target?.closest?.('[data-eon-work-chat-stop-dictation]')) {
      voice.stopDictation('user-stop');
      if (status) status.textContent = 'Dictation stopped. Review the text before pressing Ask here.';
      return;
    }
    if (event.target?.closest?.('[data-eon-work-chat-speak]')) {
      const result = speakEonCityCaption({ text: latestReply, locale: resolvedSpeechLocale(), explicitUserAction: true });
      if (status) status.textContent = result.ok ? 'Speaking the latest EONBOT reply through browser speech.' : `Browser speech unavailable: ${result.error}.`;
      return;
    }
    if (event.target?.closest?.('[data-eon-work-chat-stop-speech]')) {
      const result = stopEonCityCaption({ explicitUserAction: true });
      if (status) status.textContent = result.ok ? 'Browser speech stopped.' : `Browser speech unavailable: ${result.error}.`;
    }
  };
  root.addEventListener('click', clickHandler);

  const languageHandler = () => {
    const saved = saveVoiceLanguagePreference(resolvedSpeechLocale());
    const base = getVoiceLanguageBase(saved);
    if (base && base !== 'auto') setChatLanguagePreference(base);
    if (status) { status.textContent = base === 'auto'
      ? 'Voice language follows browser support; EONBOT reply language follows the Chat preference.'
      : `Voice language saved. EONBOT replies now follow ${base.toUpperCase()} unless changed in Chat.`; }
  };
  voiceLanguage?.addEventListener('change', languageHandler);

  return {
    dispose() {
      form?.removeEventListener('submit', submitHandler);
      root.removeEventListener('click', clickHandler);
      voiceLanguage?.removeEventListener('change', languageHandler);
      voice.dispose();
    }
  };
}

function selectedCityCreatorMode(invocation = {}) {
  const requested = String(invocation?.context?.creatorMode || '').trim().toLowerCase();
  return ['image', 'video', 'music'].includes(requested) ? requested : 'image';
}

function renderCreate(invocation) {
  ensureCityCreatorStyles();
  const selected = selectedCityCreatorMode(invocation);
  const tabs = ['image', 'video', 'music'].map((id) => {
    const mode = EON_CREATE_MODES.find((item) => item.id === id);
    return `<button type="button" data-eon-city-create-mode="${id}" aria-pressed="${selected === id}">${escapeText(mode?.label || id)}</button>`;
  }).join('');
  const workspace = renderCityCreatorExecution(selected);
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/create">Open full Create</a><a href="/projects">Continue project</a>')}<section class="eon-work-card"><p><strong>Creator inside EON City</strong></p><p>Image, Video and Music use the same maintained Creator modules as the normal app. City never creates a separate provider path or silently spends credit.</p><div class="eon-work-panel-actions" role="tablist" aria-label="Creator mode">${tabs}</div></section><div data-eon-city-create-workspace>${workspace}</div><details class="eon-work-details"><summary>Execution boundary</summary><div>Image and Video include the same explicit local ComfyUI and paired Direct BYOK execution rails as canonical Create. Music includes browser sequencing, local ACE-Step, hosted BYOK Music, Auto DJ and private EON Radio. Every network/compute action remains user-triggered; real runtime/provider certification stays proof-gated.</div></details></section>`;
}

function bindCreate(root, invocation, open) {
  const selected = selectedCityCreatorMode(invocation);
  const rerender = () => bindCreateRerender(root, invocation, open, selected);
  if (selected === 'music') bindEonMusicStudio(root, { rerender });
  else {
    if (selected === 'image') bindComfyUiImageLab(root, cityCreatorExecutionState, { rerender });
    if (selected === 'video') bindComfyUiVideoLab(root, cityCreatorExecutionState, { rerender });
    bindUnifiedCreatorWorkspace(root, { navigate: (href) => { if (typeof open === 'function' && /^\/local-ai/.test(href)) open({ id: 'local-ai', context: { ...invocation.context, creatorMode: selected }, explicitUserAction: true }); else globalThis.location?.assign?.(href); } });
    bindDirectByokWorkspace(root, { mediaKind: selected, rerender });
  }
  applyPendingCityCreatorDraft(root, selected);
  root.querySelectorAll('[data-eon-city-create-mode]').forEach((button) => button.addEventListener('click', () => bindCreateRerender(root, invocation, open, button.dataset.eonCityCreateMode)));
}

function bindCreateRerender(root, invocation, open, creatorMode) {
  const nextInvocation = { ...invocation, context: { ...(invocation?.context || {}), creatorMode } };
  root.innerHTML = renderCreate(nextInvocation);
  bindCreate(root, nextInvocation, open);
}

function renderProjects(invocation) {
  const projects = loadProjects();
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/projects?new=1">New project</a><a href="/projects">All projects</a>')}<div class="eon-work-grid is-two"><section class="eon-work-card"><h3>Active work</h3><p>Continue the most recent local outcomes and their next reviewed action.</p>${projectCards(projects.filter((project) => project.status !== 'complete'))}</section><section class="eon-work-card"><h3>Recent activity</h3><p>Completed and recently changed work remains available without becoming a second home screen.</p>${projectCards(projects)}</section></div><details class="eon-work-details"><summary>Project receipts and recovery</summary><div>Project handoffs remain review-only. Use the encrypted Portable Workspace Capsule for recovery; ordinary project records are not cloud-synced by Google Login.</div></details></section>`;
}

function renderLibrary(invocation) {
  const items = loadLibrary();
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/library?new=1">Save item</a><a href="/library">Open Library</a>')}<div class="eon-work-grid is-two"><section class="eon-work-card"><h3>Recent saved work</h3><p>Prompts, notes, templates and reviewed outputs saved in this browser.</p>${libraryCards(items)}</section><section class="eon-work-card"><h3>Data and recovery</h3><p>Library is ordinary reusable work. Provider keys and sensitive account material belong in Vault; full recovery uses Capsule.</p><div class="eon-work-panel-actions"><a href="/vault">Vault</a><a href="/capsule">Encrypted Capsule</a><a href="/workspace">Advanced workspace</a></div></section></div></section>`;
}

function renderCommandStatus(invocation) {
  let snapshot = {};
  let automations = {};
  try { snapshot = getWorkspaceSnapshot() || {}; } catch {}
  try { automations = loadAutomationState() || {}; } catch {}
  const projects = Array.isArray(snapshot.projects) ? snapshot.projects : loadProjects();
  const library = Array.isArray(snapshot.library) ? snapshot.library : loadLibrary();
  const tasks = Array.isArray(automations.tasks) ? automations.tasks : Array.isArray(automations.automations) ? automations.automations : [];
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/projects">Review projects</a><a href="/automations">Review automations</a>')}<div class="eon-work-grid"><article class="eon-work-card"><small>Projects</small><h3>${projects.length}</h3><p>${projects.filter((item) => item.status !== 'complete').length} active local outcome${projects.filter((item) => item.status !== 'complete').length === 1 ? '' : 's'}.</p><a href="/projects">Review projects</a></article><article class="eon-work-card"><small>Library</small><h3>${library.length}</h3><p>Reusable local item${library.length === 1 ? '' : 's'} saved in this browser.</p><a href="/library">Open Library</a></article><article class="eon-work-card"><small>Automations</small><h3>${tasks.length}</h3><p>Only real stored task states are counted here.</p><a href="/automations">Review automations</a></article></div><details class="eon-work-details"><summary>System boundaries</summary><div>This summary does not claim background work, cloud sync, provider execution, payment success or autonomous activity. Open the relevant surface to review the real state.</div></details></section>`;
}

function renderAutomations(invocation) {
  let state = {};
  try { state = loadAutomationState() || {}; } catch {}
  const tasks = Array.isArray(state.tasks) ? state.tasks : Array.isArray(state.automations) ? state.automations : [];
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/automations?new=1">Prepare automation</a><a href="/automations">Open Automations</a>')}<section class="eon-work-card"><h3>Genuine task states</h3><p>Queued, running, review-required and completed states are shown only when they exist locally.</p>${tasks.length ? `<div class="eon-work-card-list">${tasks.slice(0, 8).map((task) => `<article class="eon-work-card-row"><div><strong>${escapeText(task.title || task.label || 'Automation')}</strong><small>${escapeText(task.status || 'draft')}</small></div><a href="/automations">Review</a></article>`).join('')}</div>` : empty('No stored automation state is available. Nothing is represented as running.')}</section></section>`;
}

function renderLocalAi(invocation) {
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/local-ai#eonbot-local-ai-setup">Make Local AI ready</a><a href="/local-ai">Device status</a>')}<div class="eon-work-grid"><article class="eon-work-card"><h3>Private Local AI</h3><p>Use Local Lite on a compatible browser or self-test a supported Ollama, LM Studio or Jan desktop runtime. Normal setup does not begin with ports or CORS.</p><a href="/local-ai#eonbot-local-ai-setup">Make Local AI ready</a></article><article class="eon-work-card"><h3>Connected AI providers</h3><p>Manage user-owned provider connections and keys through the encrypted Vault. This is a separate explicit route, never a silent Local AI fallback.</p><a href="/vault#provider-check">AI &amp; Providers</a></article><article class="eon-work-card"><h3>Need help?</h3><p>Use current troubleshooting without claiming that a runtime, model or Companion installer is ready without proof.</p><a href="/help?topic=local-ai">Local AI help</a></article></div></section>`;
}

const HELP_TOPICS = Object.freeze([
  ['Getting started', '/help#getting-started', 'Learn the simple Chat, Create, Projects, Library and City flow.'],
  ['Chat and providers', '/help?topic=chat-providers', 'Resolve model, provider and conversation questions.'],
  ['Create and projects', '/help?topic=create-projects', 'Start, continue and organise useful work.'],
  ['EON City', '/help#eon-city', 'Entry, controls, stations, Creator Capture and My Realm.'],
  ['Sharing', '/help?topic=sharing', 'Signed links, QR, Creator Capture and reviewed posting.'],
  ['Account and billing', '/help#account-billing', 'Sign-in, plans, subscription status and hosted checkout.'],
  ['Privacy and backup', '/help?topic=privacy-backup', 'Local data, Vault and encrypted Capsule recovery.'],
  ['Troubleshooting', '/help?topic=troubleshooting', 'Find a safe, current fix.']
]);

function renderHelp(invocation) {
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/?context=help">Ask EONBOT</a><a href="/help">Open Help</a>')}<section class="eon-work-card"><form class="eon-work-form" data-eon-help-filter-form><label>Search help topics<input type="search" data-eon-help-filter placeholder="Try City capture, billing, providers or backup" autocomplete="off"></label></form><div class="eon-work-grid" data-eon-help-topics>${HELP_TOPICS.map(([label, href, detail]) => `<article class="eon-work-card" data-help-search="${escapeText(`${label} ${detail}`.toLowerCase())}"><h3>${escapeText(label)}</h3><p>${escapeText(detail)}</p><a href="${escapeText(href)}">Open topic</a></article>`).join('')}</div><p class="eon-work-status" data-eon-help-status></p></section></section>`;
}

function bindHelp(root) {
  const input = root.querySelector('[data-eon-help-filter]');
  const cards = [...root.querySelectorAll('[data-help-search]')];
  const status = root.querySelector('[data-eon-help-status]');
  input?.addEventListener('input', () => {
    const query = String(input.value || '').trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const show = !query || String(card.dataset.helpSearch || '').includes(query);
      card.hidden = !show;
      if (show) visible += 1;
    }
    if (status) status.textContent = query ? `${visible} matching topic${visible === 1 ? '' : 's'}.` : '';
  });
}

function renderRealm(invocation) {
  const loaded = ensureMyRealmState();
  const realm = loaded.state;
  const layout = MY_REALM_LAYOUTS.find((item) => item.id === realm.layout) || MY_REALM_LAYOUTS[0];
  return `<section class="eon-work-panel">${intro(invocation, '<a class="is-primary" href="/realm-studio">Personalise My Realm</a><a href="/eoncity?target=realm&return=realm">Enter in City</a>')}<div class="eon-work-grid"><article class="eon-work-card" data-featured="true"><small>Selected layout</small><h3>${escapeText(layout.label)}</h3><p>${escapeText(layout.description)}</p><a href="/realm-studio#realm-layouts">Change layout</a></article><article class="eon-work-card"><small>Identity</small><h3>${escapeText(realm.label)}</h3><p>@${escapeText(realm.handle)} · ${escapeText(realm.safety?.reviewStatus || 'local')}</p><a href="/realm-studio#realm-share-card">Review Realm Card</a></article><article class="eon-work-card"><small>Pinned shortcuts</small><h3>${Array.isArray(realm.shortcuts) ? realm.shortcuts.length : 0}/4</h3><p>Fixed, reviewed links to the tools used most often.</p><a href="/realm-studio#realm-shortcuts">Choose shortcuts</a></article></div><details class="eon-work-details"><summary>Sharing boundary</summary><div>The Realm Card is read-only and allowlisted. It does not expose private City state, visitor access, multiplayer, Vault content, credentials or free-building controls.</div></details></section>`;
}

export function mountEonWorkSurface({ root, invocation, navigate, open }) {
  const id = invocation.id;
  if (id === 'chat') root.innerHTML = renderChat(invocation);
  else if (id === 'create') root.innerHTML = renderCreate(invocation);
  else if (id === 'projects') root.innerHTML = renderProjects(invocation);
  else if (id === 'library') root.innerHTML = renderLibrary(invocation);
  else if (id === 'command-status') root.innerHTML = renderCommandStatus(invocation);
  else if (id === 'automations') root.innerHTML = renderAutomations(invocation);
  else if (id === 'local-ai') root.innerHTML = renderLocalAi(invocation);
  else if (id === 'help') root.innerHTML = renderHelp(invocation);
  else if (id === 'my-realm') root.innerHTML = renderRealm(invocation);
  else root.innerHTML = `<section class="eon-work-panel">${intro(invocation, `<a class="is-primary" href="${escapeText(invocation.definition.fallbackHref)}">Open normal page</a>`)}</section>`;
  const binding = id === 'chat' ? bindChat(root, navigate, open, invocation) : null;
  if (id === 'create') bindCreate(root, invocation, open);
  if (id === 'help') bindHelp(root);
  return binding || { dispose() {} };
}

export default mountEonWorkSurface;
