import { registerEonServiceWorker } from './utils/eon-service-worker-registration.js';
import { applyTheme } from './utils/storage.js';
import { ensureRewardScripts, mountChatWidgetDeferred } from './utils/runtime-loader.js';
import { initSiteShell } from './utils/site-shell.js';
import { initAppLanguage, localizeStatic } from './utils/app-language.js';
import { initInfoHints } from './utils/info-hints.js';
import { listTools } from './utils/tool-registry.js';
import eonBrowserService, { QUICK_SITES, escapeUrlAttr } from './utils/eon-browser.js';
import musicLabService from './utils/music-lab.js';
import videoLabService from './utils/video-lab.js';
import { getToolRouteForAction } from './utils/support-tools-footer-proof.js';
import { telemetry } from './utils/telemetry.js';

const TOOL_KIND = document.body?.dataset?.toolKind || 'tool';

function getToolPrompt(/** @type {any} */ kind) {
  const /** @type {any} */
map = {
    tool: {
      mode: 'ask',
      prompt: 'Audit the current project surface, summarize the strongest agent tools, and propose the fastest next workflow.'
    },
    browser: {
      mode: 'browse',
      prompt: 'Open Browse workflow: gather 5 high-signal sources for my topic, summarize each source, and produce one action plan.'
    },
    music: {
      mode: 'build',
      prompt: 'Compose a release-ready music concept: beat structure, hook, transitions, and production checklist for a 60-second format.'
    },
    video: {
      mode: 'build',
      prompt: 'Create a video production brief with hook, scene flow, editing cues, subtitle style, and CTA for short-form publishing.'
    }
  };
  return (/** @type {any} */ (map))[kind] || {
    mode: 'ask',
    prompt: 'Help me execute this tool workflow end-to-end with concrete next steps.'
  };
}

function launchWorkbench() {
  const payload = getToolPrompt(TOOL_KIND);
  try {
    sessionStorage.setItem('eon:launch-mission:v1', JSON.stringify({
      prompt: payload.prompt,
      mode: payload.mode
    }));
  } catch {}
  window.location.href = '/build';
}

function launchCreatorStudio() {
  const payload = getToolPrompt(TOOL_KIND);
  try {
    sessionStorage.setItem('eon:creator:launch:v1', JSON.stringify({
      source: TOOL_KIND,
      prompt: payload.prompt,
      createdAt: Date.now()
    }));
  } catch {}
  window.location.href = '/create';
}

function askEonbot() {
  const payload = getToolPrompt(TOOL_KIND);
  const prompt = `Guide me step-by-step for ${TOOL_KIND} workflow: ${payload.prompt}`;
  try {
    localStorage.setItem('eon:chat:prefill:v1', prompt);
  } catch {}
  window.location.href = `/chat.html?q=${encodeURIComponent(prompt)}`;
}

function bindToolActions() {
  window.__EON_TOOLS_PAGE_ROUTER_READY__ = true;
  document.querySelectorAll('[data-tool-action]').forEach((/** @type {any} */ btn) => {
    btn.setAttribute('data-tool-action-ready', '1');
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-tool-action');
      if (action === 'workbench') {
        launchWorkbench();
        return;
      }
      if (action === 'creator') {
        launchCreatorStudio();
        return;
      }
      if (action === 'chat') {
        askEonbot();
        return;
      }
      if (action === 'market') {
        window.location.href = '/market';
        return;
      }
      window.location.href = btn.getAttribute('data-fallback-href') || getToolRouteForAction(action);
    });
  });
}

function renderToolsHub(/** @type {any} */ root) {
  const tools = listTools();
  root.innerHTML = `
    <section class="tool-workspace tool-workspace--hub" data-info-title="Workflow Router Workspace" data-info-body="Clean shortcuts for agent routing, research packs, creator workflows, and local AI setup.">
      <div class="tool-title">Workflow Router Workspace</div>
      <div class="tool-muted" style="margin-bottom:.6rem">Clean shortcuts for users, with advanced tools kept behind EONBOT and the workstation.</div>
      <div class="tool-grid">
        <div class="tool-card">
          <div class="tool-title">Mission Engine</div>
          <div class="tool-muted">Route research, build, and execution work into the mission stack.</div>
          <div class="tool-row" style="margin-top:.55rem">
            <button class="btn btn-primary btn-sm" type="button" data-tool-action="workbench">Open Workstation</button>
            <button class="btn btn-outline btn-sm" type="button" data-tool-action="chat">Ask EONBOT</button>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-title">Creator Suite</div>
          <div class="tool-muted">Move from idea to image, video, music, or code with one guided pipeline.</div>
          <div class="tool-row" style="margin-top:.55rem">
            <button class="btn btn-primary btn-sm" type="button" data-tool-action="creator">Open Creator Suite</button>
            <button class="btn btn-outline btn-sm" type="button" data-tool-action="local-ai">Local AI Setup</button>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-title">Browser Cockpit</div>
          <div class="tool-muted">Run live browser tasks, research sources, and capture evidence from the web.</div>
          <div class="tool-row" style="margin-top:.55rem">
            <button class="btn btn-primary btn-sm" type="button" data-tool-action="browser">Open Browser Cockpit</button>
            <button class="btn btn-outline btn-sm" type="button" data-tool-action="market">Open Market</button>
          </div>
        </div>
        <div class="tool-card">
          <div class="tool-title">Agent Tool Registry</div>
          <div class="tool-muted">Compact background tools available to agents right now.</div>
          <div class="tool-mini-list" style="margin-top:.55rem">
            ${tools.map((tool) => `<div class="tool-mini-item"><strong>${escapeUrlAttr(tool.name)}</strong><div class="tool-muted">${escapeUrlAttr(tool.description)}</div></div>`).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
}

function injectToolStyles() {
  if (document.getElementById('tool-workspace-style')) return;
  const /** @type {any} */
style = document.createElement('style');
  style.id = 'tool-workspace-style';
  style.textContent = `
    .tool-workspace { margin: 1rem auto 2rem; max-width: 1100px; border: 1px solid rgba(148,163,184,.24); border-radius: .9rem; background: rgba(15,23,42,.54); padding: 1rem; }
    .tool-row { display: flex; gap: .6rem; flex-wrap: wrap; margin-bottom: .65rem; }
    .tool-row input, .tool-row select { background: rgba(15,23,42,.55); border: 1px solid rgba(148,163,184,.3); color: var(--clr-text); border-radius: .6rem; padding: .45rem .55rem; min-width: 180px; }
    .tool-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: .7rem; }
    .tool-card { border: 1px solid rgba(148,163,184,.25); border-radius: .75rem; padding: .65rem; background: rgba(15,23,42,.45); }
    .tool-title { font-weight: 700; margin-bottom: .35rem; }
    .tool-muted { color: var(--clr-text-muted); font-size: .84rem; }
    .tool-mini-list { max-height: 220px; overflow: auto; border: 1px solid rgba(148,163,184,.2); border-radius: .65rem; padding: .35rem; }
    .tool-mini-item { padding: .35rem .45rem; border-bottom: 1px solid rgba(148,163,184,.1); }
    .tool-mini-item:last-child { border-bottom: 0; }
    .tool-browser-frame { width: 100%; height: 420px; border: 1px solid rgba(148,163,184,.25); border-radius: .7rem; background: #0b1220; }
    .tool-steps { display: grid; grid-template-columns: repeat(16, minmax(18px, 1fr)); gap: .2rem; }
    .tool-step { height: 20px; border-radius: .25rem; border: 1px solid rgba(148,163,184,.3); background: rgba(15,23,42,.6); cursor: pointer; }
    .tool-step.active { background: rgba(16,185,129,.75); border-color: rgba(16,185,129,.85); }
    .tool-track-label { min-width: 58px; font-size: .76rem; color: var(--clr-text-muted); }
    .tool-video-canvas { width: 100%; max-width: 760px; border: 1px solid rgba(148,163,184,.25); border-radius: .65rem; background: #020617; }
    /* iframe blocked notice */
    .iframe-blocked-notice { display:none; align-items:center; gap:.75rem; padding:.75rem 1rem; background:rgba(245,158,11,.12); border:1px solid rgba(245,158,11,.4); border-radius:.7rem; margin-bottom:.6rem; color:#fbbf24; font-size:.85rem; }
    .iframe-blocked-notice.visible { display:flex; }
    /* ── Mobile ─────────────────────────────────────────────────────── */
    @media (max-width: 640px) {
      .tool-workspace { padding: .6rem; border-radius: .6rem; }
      .tool-row { flex-direction: column; gap: .4rem; }
      .tool-row input, .tool-row select { min-width: 0; width: 100%; }
      .tool-browser-frame { height: 280px; }
      .tool-video-canvas { width: 100%; max-width: 100%; }
      .tool-steps { grid-template-columns: repeat(8, 1fr); overflow-x: auto; }
      .tool-step { height: 18px; }
      .tool-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}

function renderBrowserWorkspace(/** @type {any} */ root) {
  const activeTab = eonBrowserService.getActiveTab();
  const history = eonBrowserService.getHistory(12);
  const bookmarks = eonBrowserService.bookmarks.slice(-12).reverse();
  const tasks = eonBrowserService.agentTasks.slice(-8).reverse();

  root.innerHTML = `
    <section class="tool-workspace" data-info-title="Browser Workspace" data-info-body="Run research tasks, summarize sources with AI, and move results into Creator Studio or WorkBench pipelines.">
      <div class="tool-title">Live Browser Workspace</div>
      <div class="tool-row">
        <input id="tool-browser-url" type="text" placeholder="Paste URL or search term" value="${escapeUrlAttr(activeTab?.displayUrl || '')}" />
        <button class="btn btn-primary btn-sm" type="button" id="tool-browser-open">Open</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-browser-search">Search</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-browser-bookmark">Bookmark</button>
      </div>
      <div class="tool-row">
        ${QUICK_SITES.slice(0, 8).map((/** @type {any} */ site) => `<button class="btn btn-outline btn-sm" type="button" data-quick-url="${escapeUrlAttr(site.url)}">${site.name}</button>`).join('')}
      </div>
      <div id="tool-iframe-blocked" class="iframe-blocked-notice" role="alert">
        ⚠️ This site blocks embedding — <a href="about:blank" id="tool-iframe-open-tab" data-w127-safe-fallback="new-tab" style="color:#fbbf24;margin-left:.35rem;text-decoration:underline;">open in new tab instead</a>
      </div>
      <iframe id="tool-browser-frame" class="tool-browser-frame" src="${escapeUrlAttr(activeTab?.url || 'about:blank')}" loading="lazy"></iframe>
      <div class="tool-row" style="margin-top:.6rem">
        <input id="tool-browser-agent-goal" type="text" placeholder="AI research task goal" />
        <button class="btn btn-outline btn-sm" type="button" id="tool-browser-agent-run">Run AI Research</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-browser-send-creator">Send Result to Creator Studio</button>
      </div>
      <div class="tool-grid">
        <div class="tool-card">
          <div class="tool-title">Bookmarks</div>
          <div class="tool-mini-list">${bookmarks.length ? bookmarks.map((/** @type {any} */ b) => `<div class="tool-mini-item">${escapeUrlAttr(b.title || b.url)}</div>`).join('') : '<div class="tool-muted">No bookmarks yet.</div>'}</div>
        </div>
        <div class="tool-card">
          <div class="tool-title">Recent History</div>
          <div class="tool-mini-list">${history.length ? history.map((/** @type {any} */ h) => `<div class="tool-mini-item">${escapeUrlAttr(h.title || h.url)}</div>`).join('') : '<div class="tool-muted">No history yet.</div>'}</div>
        </div>
        <div class="tool-card">
          <div class="tool-title">AI Tasks</div>
          <div class="tool-mini-list">${tasks.length ? tasks.map((/** @type {any} */ t) => `<div class="tool-mini-item">${escapeUrlAttr(t.goal)} · ${escapeUrlAttr(t.status)}</div>`).join('') : '<div class="tool-muted">No tasks yet.</div>'}</div>
        </div>
      </div>
    </section>
  `;

  const /** @type {any} */
urlEl = root.querySelector('#tool-browser-url');
  const /** @type {any} */
frame = root.querySelector('#tool-browser-frame');
  const /** @type {any} */
blockedNotice = root.querySelector('#tool-iframe-blocked');
  const /** @type {any} */
openTabLink = root.querySelector('#tool-iframe-open-tab');
  const refresh = () => renderBrowserWorkspace(root);

  // ── iframe blocked detection ───────────────────────────────────────
  let _currentFrameUrl = (activeTab?.url || 'about:blank');
  const _showBlocked = (/** @type {any} */ url) => {
    if (blockedNotice) blockedNotice.classList.add('visible');
    if (openTabLink) openTabLink.href = url || 'about:blank';
    telemetry.iframeBlock(url);
  };
  const _hideBlocked = () => {
    if (blockedNotice) blockedNotice.classList.remove('visible');
  };
  if (frame) {
    // CSP/X-Frame-Options errors fire as generic errors on the frame
    frame.addEventListener('error', () => _showBlocked(_currentFrameUrl));
    // If load event fires with about:blank replacement for blocked content
    frame.addEventListener('load', () => {
      try {
        const doc = frame.contentDocument;
        if (doc && doc.body && doc.body.textContent?.trim() === '' && _currentFrameUrl !== 'about:blank') {
          _showBlocked(_currentFrameUrl);
        } else {
          _hideBlocked();
        }
      } catch { /* cross-origin — cannot inspect */ }
    });
  }
  if (openTabLink) {
    openTabLink.addEventListener('click', (/** @type {any} */ e) => {
      e.preventDefault();
      if (_currentFrameUrl && _currentFrameUrl !== 'about:blank') {
        window.open(_currentFrameUrl, '_blank', 'noopener');
      }
    });
  }

  const _navigateFrame = (/** @type {any} */ url) => {
    _currentFrameUrl = url;
    _hideBlocked();
    if (frame) frame.src = url;
  };

  root.querySelector('#tool-browser-open')?.addEventListener('click', () => {
    const value = String(urlEl?.value || '').trim();
    if (!value) return;
    let tab = null;
    try {
      const parsed = new URL(value.includes('://') ? value : `https://${value}`);
      tab = eonBrowserService.openTab(parsed.toString(), parsed.hostname);
    } catch {
      tab = eonBrowserService.search(value);
    }
    if (tab?.url) _navigateFrame(tab.url);
    refresh();
  });

  root.querySelector('#tool-browser-search')?.addEventListener('click', () => {
    const value = String(urlEl?.value || '').trim();
    if (!value) return;
    const tab = eonBrowserService.search(value);
    if (tab?.url) _navigateFrame(tab.url);
    refresh();
  });

  root.querySelector('#tool-browser-bookmark')?.addEventListener('click', () => {
    const tab = eonBrowserService.getActiveTab();
    if (!tab?.url) return;
    eonBrowserService.addBookmark(tab.url, tab.title, null);
    refresh();
  });

  root.querySelectorAll('[data-quick-url]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-quick-url') || '';
      if (!url) return;
      const tab = eonBrowserService.openTab(url, url);
      if (tab?.url) _navigateFrame(tab.url);
      refresh();
    });
  });

  root.querySelector('#tool-browser-agent-run')?.addEventListener('click', async () => {
    const goal = String(root.querySelector('#tool-browser-agent-goal')?.value || '').trim();
    if (!goal) return;
    telemetry.aiAssist('browser', 'research');
    const result = await eonBrowserService.runResearchAgent(goal, 'standard', null);
    if (result?.success) {
      try {
        sessionStorage.setItem('eon:creator:launch:v1', JSON.stringify({
          source: 'browser',
          prompt: result.research,
          createdAt: Date.now()
        }));
      } catch {}
      root.querySelector('#tool-browser-agent-goal').value = '';
      refresh();
    }
  });

  root.querySelector('#tool-browser-send-creator')?.addEventListener('click', () => {
    const task = eonBrowserService.agentTasks.slice(-1)[0];
    const prompt = task?.extractedData || task?.goal || 'Browser research brief';
    try {
      sessionStorage.setItem('eon:creator:launch:v1', JSON.stringify({ source: 'browser', prompt, createdAt: Date.now() }));
    } catch {}
    telemetry.handoff('browser', 'creator-studio');
    window.location.href = '/create';
  });
}

function renderMusicWorkspace(/** @type {any} */ root) {
  const tracks = musicLabService.tracks;
  const projects = musicLabService.projects.slice(-8).reverse();

  root.innerHTML = `
    <section class="tool-workspace" data-info-title="Music Workspace" data-info-body="Build beats, generate patterns with AI, export WAV, and hand off the release brief directly to Creator Studio.">
      <div class="tool-title">Live Music Workspace</div>
      <div class="tool-row">
        <button class="btn btn-primary btn-sm" type="button" id="tool-music-play">${musicLabService.isPlaying ? 'Pause' : 'Play'}</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-music-stop">Stop</button>
        <input id="tool-music-bpm" type="number" min="40" max="280" value="${musicLabService.bpm}" style="max-width:90px" />
        <select id="tool-music-preset">
          <option value="">Preset...</option>
          <option value="four-on-floor">Four on the Floor</option>
          <option value="hip-hop">Hip Hop</option>
          <option value="ambient">Ambient</option>
          <option value="techno">Techno</option>
          <option value="lo-fi">Lo-Fi</option>
          <option value="cinematic">Cinematic</option>
        </select>
        <button class="btn btn-outline btn-sm" type="button" id="tool-music-export">Export WAV</button>
      </div>
      <div class="tool-row">
        <input id="tool-music-ai" type="text" placeholder="Describe style for AI pattern generation" />
        <button class="btn btn-outline btn-sm" type="button" id="tool-music-ai-run">AI Generate</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-music-send-creator">Send Release Brief to Creator</button>
      </div>
      <p class="tool-muted" data-tool-music-status>Music playback and offline WAV export declare their local workload before they begin.</p>
      <div>
        ${tracks.map((/** @type {any} */ track, /** @type {any} */ idx) => `
          <div class="tool-row" style="align-items:center">
            <span class="tool-track-label">${track.label}</span>
            <button class="btn btn-outline btn-sm" type="button" data-music-mute="${idx}">${track.muted ? 'Unmute' : 'Mute'}</button>
            <input type="range" min="0" max="100" value="${Math.round(track.volume * 100)}" data-music-vol="${idx}" />
            <div class="tool-steps">
              ${track.pattern.map((/** @type {any} */ step, /** @type {any} */ sIdx) => `<button class="tool-step ${step ? 'active' : ''}" type="button" data-music-step="${idx}:${sIdx}"></button>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="tool-card" style="margin-top:.6rem">
        <div class="tool-title">Recent Projects</div>
        <div class="tool-mini-list">${projects.length ? projects.map((/** @type {any} */ p) => `<div class="tool-mini-item">${escapeUrlAttr(p.name || 'Untitled')} · ${new Date(p.updatedAt || p.createdAt || Date.now()).toLocaleString()}</div>`).join('') : '<div class="tool-muted">No saved projects yet.</div>'}</div>
      </div>
    </section>
  `;

  const rerender = () => renderMusicWorkspace(root);
  const setMusicStatus = (message) => {
    const status = root.querySelector('[data-tool-music-status]');
    if (status) status.textContent = String(message || '');
  };
  const confirmCityPreemption = (taskLabel) => {
    if (typeof window.confirm !== 'function') return false;
    return window.confirm(`EON City is active. Pause City and continue with this local ${taskLabel}? City keeps its local pose and can be resumed later.`);
  };

  root.querySelector('#tool-music-play')?.addEventListener('click', () => {
    if (musicLabService.isPlaying) {
      musicLabService.pause();
      setMusicStatus('Music playback paused and its local workload lease was released.');
    } else {
      const result = musicLabService.play();
      setMusicStatus(result?.success ? 'Music playback is using a local workload lease.' : (result?.error || 'Music playback did not start.'));
    }
    rerender();
  });
  root.querySelector('#tool-music-stop')?.addEventListener('click', () => {
    musicLabService.stop();
    setMusicStatus('Music playback stopped and its local workload lease was released.');
    rerender();
  });
  root.querySelector('#tool-music-bpm')?.addEventListener('change', (/** @type {any} */ event) => {
    musicLabService.setBPM(parseInt(event.target.value, 10) || 120);
    rerender();
  });
  root.querySelector('#tool-music-preset')?.addEventListener('change', (/** @type {any} */ event) => {
    const preset = event.target.value;
    if (!preset) return;
    musicLabService.loadPreset(preset);
    rerender();
  });
  root.querySelector('#tool-music-export')?.addEventListener('click', async () => {
    let result = await musicLabService.exportWAV(8);
    if (!result?.success && result?.workload?.userChoiceRequired) {
      if (!confirmCityPreemption('WAV export')) {
        setMusicStatus('WAV export stayed paused. EON City was not changed.');
        return;
      }
      result = await musicLabService.exportWAV(8, { confirmPreemptCity: true });
    }
    if (!result?.success || !result.blob) {
      setMusicStatus(result?.error || 'WAV export did not start.');
      return;
    }
    const url = URL.createObjectURL(result.blob);
    const /** @type {any} */
link = document.createElement('a');
    link.href = url;
    link.download = `eon-music-${Date.now()}.wav`;
    link.click();
    URL.revokeObjectURL(url);
    setMusicStatus('WAV export completed locally. The export workload lease was released.');
  });
  root.querySelectorAll('[data-music-step]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const [trackIdx, stepIdx] = String(btn.getAttribute('data-music-step') || '').split(':').map((/** @type {any} */ v) => parseInt(v, 10));
      if (Number.isNaN(trackIdx) || Number.isNaN(stepIdx)) return;
      musicLabService.toggleStep(trackIdx, stepIdx);
      rerender();
    });
  });
  root.querySelectorAll('[data-music-mute]').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const trackIdx = parseInt(btn.getAttribute('data-music-mute') || '', 10);
      if (Number.isNaN(trackIdx)) return;
      musicLabService.toggleMute(trackIdx);
      rerender();
    });
  });
  root.querySelectorAll('[data-music-vol]').forEach((/** @type {any} */ slider) => {
    slider.addEventListener('input', (/** @type {any} */ event) => {
      const trackIdx = parseInt(event.target.getAttribute('data-music-vol') || '', 10);
      if (Number.isNaN(trackIdx)) return;
      musicLabService.setTrackVolume(trackIdx, (parseInt(event.target.value, 10) || 0) / 100);
    });
  });
  root.querySelector('#tool-music-ai-run')?.addEventListener('click', async () => {
    const desc = String(root.querySelector('#tool-music-ai')?.value || '').trim();
    if (!desc) return;
    const result = await musicLabService.generateWithAI(desc, null);
    if (result?.success) rerender();
  });
  root.querySelector('#tool-music-send-creator')?.addEventListener('click', () => {
    const prompt = `Music release workflow: BPM ${musicLabService.bpm}, project count ${musicLabService.projects.length}, generate script, caption pack, and publish checklist.`;
    try {
      sessionStorage.setItem('eon:creator:launch:v1', JSON.stringify({ source: 'music', prompt, createdAt: Date.now() }));
    } catch {}
    window.location.href = '/create';
  });
}

function renderVideoWorkspace(/** @type {any} */ root) {
  const projects = videoLabService.projects;
  const project = videoLabService.getActiveProject();

  root.innerHTML = `
    <section class="tool-workspace" data-info-title="Video Workspace" data-info-body="Create timeline clips, add overlays, run AI project generation, export WebM, and push briefs directly into Creator Studio.">
      <div class="tool-title">Live Video Workspace</div>
      <div class="tool-row">
        <select id="tool-video-project">
          <option value="">Select project...</option>
          ${projects.map((/** @type {any} */ p) => `<option value="${escapeUrlAttr(p.id)}" ${p.id === videoLabService.activeProjectId ? 'selected' : ''}>${escapeUrlAttr(p.name || 'Untitled')}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" type="button" id="tool-video-new">New Project</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-play">Play</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-stop">Stop</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-export">Export WebM</button>
      </div>
      <canvas id="tool-video-canvas" class="tool-video-canvas" width="960" height="540"></canvas>
      <p class="tool-muted" data-tool-video-status>Video playback and export ask the local workload governor before using device-heavy browser work.</p>
      <div class="tool-row" style="margin-top:.55rem">
        <input id="tool-video-text" type="text" placeholder="Overlay text" />
        <select id="tool-video-pos">
          <option value="lower_third">Lower Third</option>
          <option value="center">Center</option>
          <option value="top_center">Top</option>
          <option value="bottom_center">Bottom</option>
        </select>
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-add-text">Add Text Clip</button>
      </div>
      <div class="tool-row">
        <input id="tool-video-ai" type="text" placeholder="Describe video project for AI generation" />
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-ai-run">AI Generate Project</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-subs">Generate Subtitles</button>
        <button class="btn btn-outline btn-sm" type="button" id="tool-video-send-creator">Send Video Brief to Creator</button>
      </div>
      <div class="tool-card">
        <div class="tool-title">Project Tracks</div>
        <div class="tool-mini-list">
          ${project ? project.tracks.map((/** @type {any} */ track) => `<div class="tool-mini-item">${escapeUrlAttr(track.type)} · ${track.clips.length} clips</div>`).join('') : '<div class="tool-muted">Create a project to start.</div>'}
        </div>
      </div>
    </section>
  `;

  const /** @type {any} */
canvas = root.querySelector('#tool-video-canvas');
  if (canvas) {
    videoLabService.initCanvas(canvas);
    videoLabService.renderFrame(videoLabService.currentTime || 0);
  }

  const rerender = () => renderVideoWorkspace(root);
  const setVideoStatus = (message) => {
    const status = root.querySelector('[data-tool-video-status]');
    if (status) status.textContent = String(message || '');
  };

  root.querySelector('#tool-video-project')?.addEventListener('change', (/** @type {any} */ event) => {
    const id = String(event.target.value || '').trim();
    if (!id) return;
    videoLabService.loadProject(id);
    rerender();
  });
  root.querySelector('#tool-video-new')?.addEventListener('click', () => {
    const name = window.prompt('Project name:', 'EON Video Project') || 'EON Video Project';
    videoLabService.createProject(name, 1920, 1080);
    rerender();
  });
  const confirmCityPreemption = (taskLabel) => {
    if (typeof window.confirm !== 'function') return false;
    return window.confirm(`EON City is active. Pause City and continue with this local ${taskLabel}? City keeps its local pose and can be resumed later.`);
  };
  root.querySelector('#tool-video-play')?.addEventListener('click', () => {
    let result = videoLabService.play();
    if (!result?.success && result?.workload?.userChoiceRequired) {
      if (!confirmCityPreemption('video playback')) {
        setVideoStatus('Video playback stayed paused. EON City was not changed.');
        return;
      }
      result = videoLabService.play({ confirmPreemptCity: true });
    }
    setVideoStatus(result?.success ? 'Video playback is using a local workload lease. Stop playback when finished.' : (result?.error || 'Video playback did not start.'));
  });
  root.querySelector('#tool-video-stop')?.addEventListener('click', () => {
    videoLabService.stop();
    setVideoStatus('Video playback stopped and its local workload lease was released.');
    rerender();
  });
  root.querySelector('#tool-video-export')?.addEventListener('click', async () => {
    let result = await videoLabService.exportVideo();
    if (!result?.success && result?.workload?.userChoiceRequired) {
      if (!confirmCityPreemption('video export')) {
        setVideoStatus('Video export stayed paused. EON City was not changed.');
        return;
      }
      result = await videoLabService.exportVideo({ confirmPreemptCity: true });
    }
    if (!result?.success || !result.blob) {
      setVideoStatus(result?.error || 'Video export did not start.');
      return;
    }
    const url = URL.createObjectURL(result.blob);
    const /** @type {any} */
link = document.createElement('a');
    link.href = url;
    link.download = result.filename || `eon-video-${Date.now()}.webm`;
    link.click();
    URL.revokeObjectURL(url);
    setVideoStatus('Video export completed locally. The export workload lease was released.');
  });
  root.querySelector('#tool-video-add-text')?.addEventListener('click', () => {
    const currentProject = videoLabService.getActiveProject();
    if (!currentProject) return;
    const text = String(root.querySelector('#tool-video-text')?.value || '').trim();
    if (!text) return;
    const position = String(root.querySelector('#tool-video-pos')?.value || 'lower_third');
    const textTrack = currentProject.tracks.find((/** @type {any} */ track) => track.type === 'text');
    if (!textTrack) return;
    videoLabService.addClip(textTrack.id, {
      type: 'text',
      text,
      position,
      duration: 4,
      start: videoLabService.currentTime || 0
    });
    rerender();
  });
  root.querySelector('#tool-video-ai-run')?.addEventListener('click', async () => {
    const desc = String(root.querySelector('#tool-video-ai')?.value || '').trim();
    if (!desc) return;
    await videoLabService.generateWithAI(desc, null);
    rerender();
  });
  root.querySelector('#tool-video-subs')?.addEventListener('click', async () => {
    const result = await videoLabService.generateSubtitles(null, document.documentElement.lang || 'en');
    if (result?.success) {
      try {
        localStorage.setItem('eon:video:last-srt:v1', String(result.srt || '').slice(0, 120000));
      } catch {}
    }
  });
  root.querySelector('#tool-video-send-creator')?.addEventListener('click', () => {
    const active = videoLabService.getActiveProject();
    const prompt = active
      ? `Video project ${active.name}: ${active.tracks.map((/** @type {any} */ track) => `${track.type}:${track.clips.length}`).join(', ')}.`
      : 'Video workflow brief for production and publishing.';
    try {
      sessionStorage.setItem('eon:creator:launch:v1', JSON.stringify({ source: 'video', prompt, createdAt: Date.now() }));
    } catch {}
    window.location.href = '/create';
  });
}

function mountToolWorkspace() {
  const /** @type {any} */
main = document.getElementById('main');
  if (!main) return;
  injectToolStyles();
  telemetry.toolStart(TOOL_KIND);

  const /** @type {any} */
container = document.getElementById('tool-live-workspace') || document.createElement('div');
  container.id = 'tool-live-workspace';
  if (!container.parentElement) main.appendChild(container);

  if (TOOL_KIND === 'browser') {
    renderBrowserWorkspace(container);
    return;
  }
  if (TOOL_KIND === 'tool') {
    renderToolsHub(container);
    return;
  }
  if (TOOL_KIND === 'music') {
    renderMusicWorkspace(container);
    return;
  }
  if (TOOL_KIND === 'video') {
    renderVideoWorkspace(container);
  }
}

function scheduleToolIdle(task, timeout = 900) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => { void task(); }, { timeout });
    return;
  }
  window.setTimeout(() => { void task(); }, 140);
}

document.addEventListener('DOMContentLoaded', () => {
  initAppLanguage();
  initSiteShell();
  applyTheme();
  localizeStatic();
  initInfoHints();
  bindToolActions();
  scheduleToolIdle(() => mountToolWorkspace(), 700);
  void localizeStatic();
  document.addEventListener('language-changed', () => {
    localizeStatic();
    initInfoHints();
  });
  if ('serviceWorker' in navigator) {
    void registerEonServiceWorker();
  }
  void ensureRewardScripts();
  scheduleToolIdle(() => mountChatWidgetDeferred({ pageType: 'tool' }), 1800);
});
