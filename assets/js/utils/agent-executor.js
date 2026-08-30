/**
 * Agent Execution Engine — EONAPP.CH Edition
 * ==========================================
 * The policy/orchestration layer decides what is allowed.
 * This execution engine actually walks approved job steps, records receipts,
 * and routes work into the existing browser / creator / voice / video labs.
 *
 * The executor is intentionally local-first:
 * - job state lives in localStorage
 * - progress is recorded per step
 * - risky publish steps pause for approval
 * - browser tasks can be updated as the job advances
 */

import { getAgentOrchestrator } from './agent-orchestrator.js';
import eonBrowserService from './eon-browser.js';
import videoLabService from './video-lab.js';
import musicLabService from './music-lab.js';
import aiVoiceService from './ai-voice.js';
import { researchTopic, listTools } from './tool-registry.js';
import { offlineStorage } from './offline-storage.js';
import * as aiRuntime from '../chat/ai-runtime.js';
import { recordAgentPresence } from '../operator/agent-presence.js';
import { EON_WORKLOAD_KINDS, getEonWorkloadGovernor } from '../runtime/eon-workload-governor.js';

const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);
const EXECUTOR_STATE_KEY = 'eon:agent-executor:state:v1';
const EXECUTOR_SCHEMA = 'agent-executor-state/v1';
const STEP_RESULT_SCHEMA = 'agent-step-result/v1';
const MAX_EXECUTOR_EVENTS = 250;
const AGENT_JOB_SYNC_TYPE = 'agent-job-drain';

let agentOfflineSyncRegistered = false;

/**
 * @typedef {Object} AgentJob
 * @property {string} id
 * @property {string} title
 * @property {string} [intentText]
 * @property {string} [origin]
 * @property {string[]} [steps]
 * @property {boolean} [approvedByHuman]
 * @property {string} [approvedBy]
 * @property {number} [approvedAt]
 * @property {any} [metadata]
 * @property {any} [execution]
 * @property {any[]} [pendingApprovals]
 * @property {any[]} [retries]
 * @property {string} [status]
 * @property {string} [completionResult]
 * @property {string} [failureReason]
 */

/**
 * @typedef {Object} StepHandlerContext
 * @property {AgentJob} job
 * @property {any} [context]
 * @property {string} [step]
 * @property {number} [stepIndex]
 * @property {AgentExecutionEngine} [executor]
 */

function uid(prefix = 'exec') {
  const bytes = new Uint8Array(8);
  if (!appWin.crypto?.getRandomValues) throw new Error('crypto.getRandomValues required');
  appWin.crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * @param {any} value
 * @param {number} [max]
 */
function sanitize(value, max = 1200) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(EXECUTOR_STATE_KEY) || 'null');
    if (raw && typeof raw === 'object') return raw;
  } catch {}
  return { schema: EXECUTOR_SCHEMA, events: [], lastJobId: '', runningJobId: '' };
}

/**
 * @param {any} state
 */
function saveState(state) {
  try {
    localStorage.setItem(EXECUTOR_STATE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * @param {Record<string, any>} event
 */
function pushEvent(event) {
  const state = loadState();
  state.schema = EXECUTOR_SCHEMA;
  state.events = Array.isArray(state.events) ? state.events : [];
  state.events.push({
    id: uid('event'),
    ts: Date.now(),
    ...event
  });
  if (state.events.length > MAX_EXECUTOR_EVENTS) {
    state.events = state.events.slice(-MAX_EXECUTOR_EVENTS);
  }
  state.lastJobId = event.jobId || state.lastJobId || '';
  saveState(state);
  return state.events[state.events.length - 1];
}

/**
 * @param {string} step
 */
function stepLabel(step) {
  const map = /** @type {Record<string, string>} */ ({
    plan: 'Plan',
    research: 'Research',
    idea: 'Idea',
    script: 'Script',
    voice: 'Voice',
    subtitles: 'Subtitles',
    video: 'Video',
    distribute_prepare: 'Distribution Prep',
    publish: 'Publish',
    chat_reply: 'Chat Reply',
    eonbrowser_assist: 'Browser Assist'
  });
  return map[String(step || '')] || String(step || 'step');
}

/**
 * @param {any} value
 * @param {number} [max]
 */
function summarizeOutput(value, max = 500) {
  if (value == null) return '';
  if (typeof value === 'string') return sanitize(value, max);
  try {
    return sanitize(JSON.stringify(value), max);
  } catch {
    return sanitize(String(value), max);
  }
}

/**
 * @param {AgentJob} job
 * @param {string} step
 * @param {number} stepIndex
 */
function buildStepExecutionKey(job, step, stepIndex) {
  const payload = JSON.stringify({
    jobId: job?.id || '',
    origin: job?.origin || '',
    intentText: job?.intentText || '',
    step: String(step || ''),
    stepIndex: Number(stepIndex || 0)
  });
  let hash = 0x811c9dc5;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `step:${hash.toString(16).padStart(8, '0')}`;
}

/**
 * @param {AgentJob} job
 */
function buildPlanSummary(job) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  if (!steps.length) return 'No steps were planned.';
  return steps.map((step, index) => `${index + 1}. ${stepLabel(step)}`).join(' ');
}

/**
 * @param {string} text
 * @returns {{ html?: string, css?: string, js?: string }}
 */
function splitLabeledSections(text) {
  const raw = String(text || '');
  const labels = ['HTML', 'CSS', 'JS'];
  const sections = /** @type {{ html?: string, css?: string, js?: string }} */ ({});
  for (const label of labels) {
    const rx = new RegExp(`${label}\\s*:\\s*([\\s\\S]*?)(?=(?:\\n(?:HTML|CSS|JS)\\s*:)|$)`, 'i');
    const match = raw.match(rx);
    if (match && match[1]) {
      const key = /** @type {'html' | 'css' | 'js'} */ (label.toLowerCase());
      sections[key] = sanitize(match[1].trim(), 12000);
    }
  }
  return sections;
}

/**
 * @param {string} prompt
 * @param {string} [size]
 */
function buildPollinationsImageUrl(prompt, size = '1024x1024') {
  const safePrompt = encodeURIComponent(String(prompt || 'EONAPP creator image').trim());
  const [width, height] = String(size || '1024x1024').split('x');
  return `https://image.pollinations.ai/prompt/${safePrompt}?width=${width || '1024'}&height=${height || '1024'}&nologo=true&seed=${Date.now()}`;
}

/**
 * @param {AgentJob} job
 */
function getLatestExecutionText(job) {
  const rows = Array.isArray(job?.execution?.steps) ? job.execution.steps : [];
  return rows
    .map((/** @type {any} */ row) => summarizeOutput(row?.result || row?.errorLog || ''))
    .filter(Boolean)
    .slice(-5)
    .join('\n');
}

function registerAgentOfflineSync() {
  if (agentOfflineSyncRegistered) return;
  agentOfflineSyncRegistered = true;
  try {
    offlineStorage.onSync(AGENT_JOB_SYNC_TYPE, async () => {
      try {
        await getAgentExecutor().runPendingJobs({ limit: 10 });
        return true;
      } catch {
        return false;
      }
    });
  } catch {}
}

/**
 * @param {string} mode
 * @param {string} prompt
 */
async function runWorkbenchMission(mode, prompt) {
  const { runMission } = await import('../workbench-ai.js');
  return runMission({
    mode,
    prompt,
    onError: (/** @type {any} */ msg) => {
      throw new Error(msg || 'AI request failed.');
    }
  });
}

/**
 * @param {string} mode
 * @param {string} prompt
 */
async function runWorkbenchMissionDetailed(mode, prompt) {
  const { runMissionDetailed } = await import('../workbench-ai.js');
  return runMissionDetailed({
    mode,
    prompt,
    onError: (/** @type {any} */ msg) => {
      throw new Error(msg || 'AI request failed.');
    }
  });
}

/**
 * @param {string} step
 * @param {any} outcome
 * @param {AgentJob} job
 * @param {number} stepIndex
 */
function normalizeStepOutcome(step, outcome, job, stepIndex) {
  const resultText = summarizeOutput(outcome?.result || outcome?.summary || outcome?.text || outcome?.artifact || '', 2200);
  const artifact = outcome?.artifact || null;
  const mission = outcome?.mission || null;
  const routing = outcome?.meta?.routing || outcome?.routing || null;
  const browserAction = outcome?.browserAction || null;
  const stepExecutionId = buildStepExecutionKey(job, step, stepIndex);
  return {
    schema: STEP_RESULT_SCHEMA,
    stepExecutionId,
    idempotencyKey: stepExecutionId,
    step,
    status: outcome?.status || 'success',
    resultText,
    artifact,
    mission,
    routing,
    browserAction,
    raw: outcome || null
  };
}

/**
 * @param {AgentJob} job
 */
function ensureBrowserTask(job) {
  const browserTaskId = String(job?.metadata?.browserTaskId || '');
  if (!browserTaskId) return null;
  const runtime = job?.execution?.runtime || {};
  const currentStep = sanitize(
    runtime.currentStep || (Array.isArray(job?.steps) ? job.steps[Number(runtime.currentStepIndex || 0)] : '') || 'starting',
    80
  );
  const task = eonBrowserService.updateAgentTask(browserTaskId, {
    status: 'running',
    currentStep,
    updatedAt: Date.now()
  });
  return task || null;
}

/**
 * @param {AgentJob} job
 * @param {string} resultText
 */
function completeBrowserTask(job, resultText) {
  const browserTaskId = String(job?.metadata?.browserTaskId || '');
  if (!browserTaskId) return null;
  return eonBrowserService.completeAgentTask(browserTaskId, resultText, 90);
}

/**
 * @param {string} step
 */
function getApprovalGateReason(step) {
  if (step === 'publish') return 'Publish steps require explicit human approval before posting.';
  return 'Human approval required before this step can proceed.';
}

class AgentExecutionEngine {
  constructor() {
    this.orchestrator = getAgentOrchestrator();
    this.state = loadState();
    this.stepHandlers = new Map();
    this._registerBuiltInHandlers();
    registerAgentOfflineSync();
  }

  _registerBuiltInHandlers() {
    this.registerStepHandler('plan', async ({ job }) => {
      // Ask AI to validate and enrich the job plan, returning a structured summary
      const stepList = buildPlanSummary(job);
      const aiPrompt = `You are a business execution planner. A user has requested this task: "${sanitize(job.intentText || job.title, 400)}".
The planned steps are: ${stepList}.
In 2-3 sentences, confirm the plan is logical, identify any risks, and provide the single most important success condition for this job.
Be direct and concise.`;
      let planInsight = '';
      let missionResult = null;
      try {
        missionResult = await runWorkbenchMissionDetailed('ask', aiPrompt);
        planInsight = String(missionResult?.text || '');
      } catch {
        planInsight = `Plan confirmed. Steps: ${stepList}`;
      }
      return {
        status: 'success',
        result: planInsight || `Plan confirmed for "${job.title}". Steps: ${stepList}`,
        artifact: {
          title: job.title,
          planSummary: stepList,
          aiInsight: planInsight,
          missionId: missionResult?.mission?.missionId || '',
          budget: missionResult?.budget || null
        },
        mission: missionResult?.mission || null,
        routing: missionResult?.meta?.routing || null
      };
    });

    this.registerStepHandler('research', async ({ job }) => {
      const topic = sanitize(job.intentText || job.title || 'research request', 400);
      const depth = /deep|thorough|full/i.test(topic) ? 'deep' : 'standard';

      // Try eonBrowserService research agent first (richer, uses browser context)
      let research = null;
      try {
        research = await eonBrowserService.runResearchAgent(topic, depth, aiRuntime);
      } catch (_e) {
        research = null;
      }

      // If browser research agent unavailable or failed, fall back to tool-registry webSearch
      if (!research?.success) {
        const toolResult = await researchTopic(topic);
        if (!toolResult.ok) {
          throw new Error('Research failed via both browser agent and web search tools.');
        }
        return {
          status: 'success',
          result: toolResult.content,
          artifact: {
            taskId: `tool-registry-${Date.now()}`,
            domain: 'web-search',
            sources: toolResult.sources,
            availableTools: listTools().map((t) => t.name)
          }
        };
      }

      return {
        status: 'success',
        result: research.research,
        artifact: {
          taskId: research.taskId,
          domain: research.domain || ''
        }
      };
    });

    this.registerStepHandler('idea', async ({ job }) => {
      const result = await runWorkbenchMissionDetailed(
        'build',
        `Generate strategic creative ideas for: ${job.intentText}. Return concise but highly actionable ideas and possible angles.`
      );
      return { status: 'success', result: summarizeOutput(result?.text || result, 2200), mission: result?.mission || null, routing: result?.meta?.routing || null, artifact: { budget: result?.budget || null } };
    });

    this.registerStepHandler('build', async ({ job, context }) => {
      const prompt = `Create a polished website or app starter scaffold for: ${job.intentText}.
Return the output in three labeled sections only:
HTML:
CSS:
JS:
Use practical defaults, good structure, and production-ready starter markup.`;
      const result = await runWorkbenchMissionDetailed('build', prompt);
      const resultText = summarizeOutput(result?.text || result, 5000);
      const sections = splitLabeledSections(resultText);
      const fallbackTitle = sanitize(job.title || 'EON Project', 80);
      const fallbackPrompt = sanitize(job.intentText || 'browser-first build', 200);
      const fallbackScaffold = {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${fallbackTitle}</title>
</head>
<body>
  <main class="app-shell">
    <h1>${fallbackTitle}</h1>
    <p>${fallbackPrompt}</p>
    <button id="run-btn">Run</button>
    <pre id="output"></pre>
  </main>
</body>
</html>`,
        css: `body{font-family:system-ui,sans-serif;background:#0f0f1a;color:#e2e8f0;min-height:100vh;display:grid;place-items:center;padding:2rem}.app-shell{max-width:720px;width:100%}button{margin-top:1rem;padding:.75rem 1rem;border:0;border-radius:.5rem;background:linear-gradient(135deg,#8b5cf6,#2563eb);color:#fff;font-weight:700}pre{margin-top:1rem;white-space:pre-wrap}`,
        js: `const btn=document.getElementById('run-btn');const out=document.getElementById('output');btn?.addEventListener('click',()=>{out.textContent='✅ ${fallbackTitle} is running. ${fallbackPrompt}';});`
      };

      if (sections.html || sections.css || sections.js) {
        try {
          if (sections.html) localStorage.setItem('eon:code-maker:v1:html', sections.html);
          if (sections.css) localStorage.setItem('eon:code-maker:v1:css', sections.css);
          if (sections.js) localStorage.setItem('eon:code-maker:v1:js', sections.js);
        } catch {}
      } else {
        try {
          localStorage.setItem('eon:code-maker:v1:html', fallbackScaffold.html);
          localStorage.setItem('eon:code-maker:v1:css', fallbackScaffold.css);
          localStorage.setItem('eon:code-maker:v1:js', fallbackScaffold.js);
        } catch {}
      }

      if (context?.openPreview !== false) {
        try {
          const baseUrl = typeof location !== 'undefined' && location.origin ? location.origin : '';
          const codeMakerUrl = baseUrl ? `${baseUrl}/code-maker.html` : 'https://eonapp.ch/code-maker.html';
          eonBrowserService.openTab(codeMakerUrl, 'Code Maker');
        } catch {}
      }

      return {
        status: 'success',
        result: resultText,
        artifact: {
          prefilledCodeMaker: true,
          hasHtml: !!sections.html,
          hasCss: !!sections.css,
          hasJs: !!sections.js,
          budget: result?.budget || null
        },
        mission: result?.mission || null,
        routing: result?.meta?.routing || null,
        browserAction: {
          step: 'build',
          action: 'prefill code maker',
          target: typeof location !== 'undefined' && location.origin ? `${location.origin}/code-maker.html` : 'https://eonapp.ch/code-maker.html',
          outcome: 'Code Maker scaffold prepared'
        }
      };
    });

    this.registerStepHandler('code', async ({ job, context }) => {
      const outcome = await this.stepHandlers.get('build')({ job, context });
      return outcome;
    });

    this.registerStepHandler('image', async ({ job, context }) => {
      const prompt = sanitize(job.intentText || job.title || 'generated image', 500);
      const size = String(context?.size || '1024x1024');
      const url = buildPollinationsImageUrl(prompt, size);

      try {
        localStorage.setItem('eon:creator:image:last:v1', JSON.stringify({
          prompt,
          url,
          size,
          ts: Date.now()
        }));
      } catch {}

      if (context?.openPreview !== false) {
        try {
          eonBrowserService.openTab(url, `Image: ${prompt.slice(0, 48)}`);
        } catch {}
      }

      return {
        status: 'success',
        result: `Generated image preview for "${prompt}".`,
        artifact: {
          url,
          prompt,
          size
        },
        browserAction: {
          step: 'image',
          action: 'open generated image',
          target: url,
          outcome: 'Image preview ready'
        }
      };
    });

    this.registerStepHandler('music', async ({ job }) => {
      const result = await musicLabService.generateWithAI(job.intentText, aiRuntime);
      if (!result?.success) {
        throw new Error(result?.error || 'Music generation failed.');
      }
      const summary = `Music project ready at ${result.bpm || 'unknown'} BPM.`;
      return {
        status: 'success',
        result: summary,
        artifact: {
          bpm: result.bpm || 0,
          pattern: result.pattern || null
        }
      };
    });

    this.registerStepHandler('script', async ({ job }) => {
      const result = await runWorkbenchMissionDetailed(
        'build',
        `Write a production-ready script outline for: ${job.intentText}. Include hook, main points, and CTA.`
      );
      return { status: 'success', result: summarizeOutput(result?.text || result, 2200), mission: result?.mission || null, routing: result?.meta?.routing || null, artifact: { budget: result?.budget || null } };
    });

    this.registerStepHandler('voice', async ({ job, context }) => {
      const draft = await runWorkbenchMission(
        'ask',
        `Rewrite the following into a natural spoken narration script: ${job.intentText}. Keep it concise, clear, and conversational.`
      );

      if (context?.autoSpeak) {
        aiVoiceService.generateAndSpeak(summarizeOutput(draft, 2000), {
          aiEnhance: false,
          lang: context?.lang || navigator.language || 'en-US'
        }).catch(() => {});
      }

      return {
        status: 'success',
        result: summarizeOutput(draft, 2200),
        artifact: { autoSpeak: !!context?.autoSpeak }
      };
    });

    this.registerStepHandler('subtitles', async ({ context }) => {
      const subtitleResult = await videoLabService.generateSubtitles(aiRuntime, context?.language || navigator.language || 'en');
      if (!subtitleResult?.success) {
        throw new Error(subtitleResult?.error || 'Subtitle generation failed.');
      }
      return {
        status: 'success',
        result: subtitleResult.srt,
        artifact: { language: context?.language || navigator.language || 'en' }
      };
    });

    this.registerStepHandler('video', async ({ job }) => {
      const result = await videoLabService.generateWithAI(job.intentText, aiRuntime);
      if (!result?.success) {
        throw new Error(result?.error || 'Video generation failed.');
      }
      const project = result.project || {};
      return {
        status: 'success',
        result: `Video project ready: ${project.name || job.title}.`,
        artifact: {
          projectId: project.id || '',
          projectName: project.name || job.title,
          width: project.width || 0,
          height: project.height || 0,
          tracks: Array.isArray(project.tracks) ? project.tracks.length : 0
        }
      };
    });

    this.registerStepHandler('distribute_prepare', async ({ job }) => {
      const result = await runWorkbenchMissionDetailed(
        'build',
        `Prepare a distribution pack for: ${job.intentText}. Produce short platform variants, a publish checklist, and a scheduling note.`
      );
      return {
        status: 'success',
        result: summarizeOutput(result?.text || result, 2200),
        mission: result?.mission || null,
        routing: result?.meta?.routing || null,
        artifact: { budget: result?.budget || null }
      };
    });

    this.registerStepHandler('publish', async ({ job, context }) => {
      if (!job.approvedByHuman) {
        return {
          status: 'waiting_approval',
          result: getApprovalGateReason('publish'),
          artifact: { approvalRequired: true }
        };
      }

      const publishPacket = {
        title: job.title,
        summary: summarizeOutput(getLatestExecutionText(job) || job.intentText, 600),
        approvedBy: job.approvedBy || 'operator',
        approvedAt: job.approvedAt || Date.now(),
        target: context?.target || job.metadata?.target || 'manual-review'
      };

      if (job.metadata?.browserTaskId) {
        eonBrowserService.updateAgentTask(job.metadata.browserTaskId, {
          status: 'done',
          extractedData: publishPacket.summary,
          successRate: 90,
          completedAt: Date.now()
        });
      } else if (context?.browserTaskGoal) {
        const task = eonBrowserService.createAgentTask(context.browserTaskGoal, 'auto');
        eonBrowserService.completeAgentTask(task.id, publishPacket.summary, 90);
      }

      return {
        status: 'success',
        result: `Publish packet ready for ${publishPacket.target}.`,
        artifact: publishPacket
      };
    });

    this.registerStepHandler('chat_reply', async ({ job }) => {
      const result = await runWorkbenchMissionDetailed(
        'ask',
        `Draft a concise response or follow-up for this request: ${job.intentText}. Keep it useful, friendly, and ready to send.`
      );
      return {
        status: 'success',
        result: summarizeOutput(result?.text || result, 2200),
        mission: result?.mission || null,
        routing: result?.meta?.routing || null,
        artifact: { budget: result?.budget || null }
      };
    });

    this.registerStepHandler('eonbrowser_assist', async ({ job, context }) => {
      const url = sanitize(context?.url || job.metadata?.url || '', 1000);
      const goal = sanitize(job.metadata?.browserGoal || job.intentText || 'browser assistance', 500);
      let browserResult = null;

      if (url) {
        eonBrowserService.openTab(url, goal || undefined);
        browserResult = await eonBrowserService.summarizePage(url, aiRuntime);
      } else {
        const task = eonBrowserService.createAgentTask(goal, 'browser');
        eonBrowserService.completeAgentTask(task.id, `Browser task created for: ${goal}`, 80);
        browserResult = {
          success: true,
          taskId: task.id,
          summary: `Browser task created for: ${goal}`
        };
      }

      if (!browserResult?.success) {
        throw new Error(browserResult?.error || 'Browser assist failed.');
      }

      return {
        status: 'success',
        result: browserResult.summary || `Browser assist completed for ${goal}.`,
        artifact: {
          url,
          taskId: /** @type {any} */ (browserResult).taskId || null
        }
      };
    });
  }

  /**
   * @param {string} step
   * @param {(args: StepHandlerContext) => Promise<any> | any} handler
   */
  registerStepHandler(step, handler) {
    const key = sanitize(step, 80).toLowerCase();
    if (!key || typeof handler !== 'function') return false;
    this.stepHandlers.set(key, handler);
    return true;
  }

  /**
   * @param {string} step
   */
  getStepHandler(step) {
    return this.stepHandlers.get(sanitize(step, 80).toLowerCase()) || null;
  }

  getState() {
    this.state = loadState();
    return this.state;
  }

  /**
   * @param {number} [limit]
   */
  getEvents(limit = 25) {
    const rows = Array.isArray(this.getState().events) ? this.getState().events : [];
    return rows.slice(-Math.max(1, Math.min(100, limit))).reverse();
  }

  /**
   * @param {string} jobId
   */
  getExecutionSnapshot(jobId) {
    const job = this.orchestrator.getJob(jobId);
    if (!job) return null;
    const runtime = job.execution?.runtime || null;
    return {
      jobId,
      jobStatus: job.status,
      runtime,
      steps: Array.isArray(job.execution?.steps) ? job.execution.steps : [],
      approvals: {
        approvedByHuman: !!job.approvedByHuman,
        pendingApprovals: Array.isArray(job.pendingApprovals) ? job.pendingApprovals.slice() : []
      }
    };
  }

  /**
   * @param {string} jobId
   * @param {Record<string, any>} [context]
   */
  async runJob(jobId, context = {}) {
    const workloadGovernor = getEonWorkloadGovernor();
    const admission = workloadGovernor.acquire(EON_WORKLOAD_KINDS.AGENT_ACTION, {
      id: `agent-job:${sanitize(jobId, 80)}`,
      source: 'agent-executor',
      label: 'EONAPP agent action',
      userInitiated: context?.surface !== 'background'
    });
    if (!admission.ok) {
      const queuedJob = this.orchestrator.getJob(jobId);
      if (queuedJob && !['completed', 'failed'].includes(String(queuedJob.status || ''))) {
        this.orchestrator.ensureJobExecutionRuntime(jobId);
        this.orchestrator.updateJobExecutionRuntime(jobId, {
          state: 'queued',
          waitingApproval: false,
          deferredAt: Date.now(),
          lastError: 'Device workload governor deferred this local agent action.'
        });
        this.orchestrator.markJobStatus(jobId, 'queued', 'Deferred locally until the device workload settles.');
      }
      return {
        ok: true,
        state: 'queued',
        job: queuedJob || null,
        result: 'Queued locally until the device workload settles. No agent step started.',
        workload: admission.decision
      };
    }
    try {
      return await this._runJobWithinWorkloadLease(jobId, context);
    } finally {
      try { admission.lease?.release?.('agent-job-complete'); } catch {}
    }
  }

  async _runJobWithinWorkloadLease(jobId, context = {}) {
    const job = this.orchestrator.getJob(jobId);
    if (!job) {
      return { ok: false, state: 'missing', reason: 'Job not found.' };
    }

    if (job.status === 'failed') {
      return { ok: false, state: 'failed', reason: job.failureReason || 'Job already failed.' };
    }

    if (job.status === 'completed') {
      return {
        ok: true,
        state: 'completed',
        job,
        result: job.completionResult || 'Job already completed.'
      };
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false && context?.allowOffline !== true) {
      try {
        await offlineStorage.queue({
          type: AGENT_JOB_SYNC_TYPE,
          data: {
            jobId: job.id,
            surface: sanitize(context?.surface || 'local-ui', 40),
            queuedAt: Date.now()
          },
          maxRetries: 1
        });
      } catch {}

      this.orchestrator.markJobStatus(job.id, 'queued', 'Offline - queued for background sync.');
      this.orchestrator.ensureJobExecutionRuntime(job.id);
      this.orchestrator.updateJobExecutionRuntime(job.id, {
        state: 'queued',
        waitingApproval: false,
        queuedAt: Date.now(),
        currentStepIndex: Number(job.execution?.runtime?.currentStepIndex || 0),
        currentStep: String(job.execution?.runtime?.currentStep || '')
      });
      pushEvent({
        jobId: job.id,
        type: 'job_queued',
        step: '',
        surface: sanitize(context?.surface || 'local-ui', 40),
        summary: `Queued ${job.title} until connectivity returns.`
      });
      recordAgentPresence({
        source: 'agent-executor', workRef: job.id, action: job.steps?.[0] || 'plan',
        role: 'coordinator', status: 'queued', phase: 'queued'
      });
      this.state.runningJobId = '';
      saveState(this.state);
      return {
        ok: true,
        state: 'queued',
        job,
        result: 'Queued until connectivity returns.'
      };
    }

    this.state.runningJobId = job.id;
    this.state.lastJobId = job.id;
    saveState(this.state);

    this.orchestrator.ensureJobExecutionRuntime(job.id);
    this.orchestrator.updateJobExecutionRuntime(job.id, {
      state: 'running',
      startedAt: job.execution?.runtime?.startedAt || Date.now(),
      waitingApproval: false,
      currentStepIndex: Number(job.execution?.runtime?.currentStepIndex || 0),
      currentStep: String(job.execution?.runtime?.currentStep || '')
    });
    this.orchestrator.markJobStatus(job.id, 'running', 'Execution started by AgentExecutionEngine.');
    recordAgentPresence({
      source: 'agent-executor', workRef: job.id, action: job.steps?.[0] || 'plan',
      role: 'coordinator', status: 'active', phase: 'planning'
    });

    pushEvent({
      jobId: job.id,
      type: 'job_started',
      step: '',
      surface: sanitize(context?.surface || 'local-ui', 40),
      summary: `Started ${job.title}`
    });

    ensureBrowserTask(job);

    const runtime = job.execution?.runtime || {};
    const startIndex = Number(runtime.currentStepIndex || 0);
    const steps = Array.isArray(job.steps) ? job.steps : [];
    let executedCount = 0;

    for (let index = startIndex; index < steps.length; index += 1) {
      const step = String(steps[index] || '');
      const handler = this.getStepHandler(step);
      if (!handler) {
        const message = `No handler registered for step '${step}'.`;
        this.orchestrator.recordJobFailure({
          jobId: job.id,
          reason: message,
          errorLog: message
        });
        this.orchestrator.updateJobExecutionRuntime(job.id, {
          state: 'failed',
          failedAt: Date.now(),
          lastError: message
        });
        pushEvent({
          jobId: job.id,
          type: 'job_failed',
          step,
          summary: message
        });
        recordAgentPresence({
          source: 'agent-executor', workRef: job.id, action: step,
          status: 'failed', phase: 'failed'
        });
        this.state.runningJobId = '';
        saveState(this.state);
        return { ok: false, state: 'failed', reason: message, job };
      }

      this.orchestrator.updateJobExecutionRuntime(job.id, {
        state: 'running',
        currentStepIndex: index,
        currentStep: step,
        lastStepAt: Date.now(),
        waitingApproval: false
      });

      recordAgentPresence({
        source: 'agent-executor', workRef: job.id, action: step,
        status: 'active', phase: 'working'
      });

      if (step === 'publish' && !job.approvedByHuman) {
        const waitMsg = getApprovalGateReason(step);
        this.orchestrator.recordJobExecution({
          jobId: job.id,
          step,
          result: waitMsg,
          status: 'waiting_approval'
        });
        this.orchestrator.markJobStatus(job.id, 'awaiting_approval', waitMsg);
        this.orchestrator.updateJobExecutionRuntime(job.id, {
          state: 'waiting_approval',
          waitingApproval: true,
          currentStepIndex: index,
          currentStep: step,
          lastOutcome: waitMsg
        });
        pushEvent({
          jobId: job.id,
          type: 'approval_required',
          step,
          summary: waitMsg
        });
        recordAgentPresence({
          source: 'agent-executor', workRef: job.id, action: step,
          status: 'waiting', phase: 'waiting-approval'
        });
        this.state.runningJobId = '';
        saveState(this.state);
        return {
          ok: true,
          state: 'waiting_approval',
          job,
          step,
          result: waitMsg
        };
      }

      try {
        const outcome = await handler({
          job,
          context,
          step,
          stepIndex: index,
          executor: this
        });
        const normalizedOutcome = normalizeStepOutcome(step, outcome, job, index);

        if (normalizedOutcome.status === 'waiting_approval') {
          this.orchestrator.recordJobExecution({
            jobId: job.id,
            step,
            result: normalizedOutcome.resultText || getApprovalGateReason(step),
            status: 'waiting_approval',
            artifact: normalizedOutcome.artifact,
            mission: normalizedOutcome.mission,
            routing: normalizedOutcome.routing,
            details: { stepIndex: index, stepExecutionId: normalizedOutcome.stepExecutionId, idempotencyKey: normalizedOutcome.idempotencyKey, workflowState: 'waiting_approval' }
          });
          this.orchestrator.markJobStatus(job.id, 'awaiting_approval', normalizedOutcome.resultText || getApprovalGateReason(step));
          this.orchestrator.updateJobExecutionRuntime(job.id, {
            state: 'waiting_approval',
            waitingApproval: true,
            currentStepIndex: index,
            currentStep: step,
            lastOutcome: normalizedOutcome.resultText || getApprovalGateReason(step)
          });
          pushEvent({
            jobId: job.id,
            type: 'approval_required',
            step,
            summary: normalizedOutcome.resultText || getApprovalGateReason(step)
          });
          recordAgentPresence({
            source: 'agent-executor', workRef: job.id, action: step,
            status: 'waiting', phase: 'waiting-approval'
          });
          this.state.runningJobId = '';
          saveState(this.state);
          return {
            ok: true,
            state: 'waiting_approval',
            job,
            step,
            result: normalizedOutcome.resultText || getApprovalGateReason(step)
          };
        }

        const resultText = normalizedOutcome.resultText;
        this.orchestrator.recordJobExecution({
          jobId: job.id,
          step,
          result: resultText,
          status: normalizedOutcome.status || 'success',
          artifact: normalizedOutcome.artifact,
          mission: normalizedOutcome.mission,
          routing: normalizedOutcome.routing,
          details: {
            stepIndex: index,
            stepExecutionId: normalizedOutcome.stepExecutionId,
            idempotencyKey: normalizedOutcome.idempotencyKey,
            hasArtifact: !!normalizedOutcome.artifact,
            hasMission: !!normalizedOutcome.mission,
            hasRouting: !!normalizedOutcome.routing
          }
        });
        this.orchestrator.updateJobExecutionRuntime(job.id, {
          state: 'running',
          currentStepIndex: index + 1,
          currentStep: steps[index + 1] || '',
          lastOutcome: resultText,
          lastStepAt: Date.now()
        });

        if (normalizedOutcome.browserAction) {
          this.orchestrator.recordBrowserAction({
            jobId: job.id,
            step: normalizedOutcome.browserAction.step || step,
            action: normalizedOutcome.browserAction.action || step,
            target: normalizedOutcome.browserAction.target || '',
            outcome: normalizedOutcome.browserAction.outcome || resultText,
            status: normalizedOutcome.browserAction.status || 'success',
            evidence: normalizedOutcome.browserAction.evidence || {}
          });
        }

        if (job.metadata?.browserTaskId && typeof eonBrowserService.updateAgentTask === 'function') {
          eonBrowserService.updateAgentTask(job.metadata.browserTaskId, {
            status: 'running',
            steps,
            currentStep: step,
            extractedData: resultText.slice(0, 1200)
          });
        }

        pushEvent({
          jobId: job.id,
          type: 'step_completed',
          step,
          summary: resultText
        });
        recordAgentPresence({
          source: 'agent-executor', workRef: job.id, action: step,
          status: index < steps.length - 1 ? 'handoff' : 'complete',
          phase: index < steps.length - 1 ? 'review' : 'complete'
        });
        executedCount += 1;
      } catch (err) {
        const errorMessage = summarizeOutput((/** @type {any} */ (err))?.message || err || 'Step execution failed', 500);
        const retryCategory = /network|timeout|fetch|econnrefused|failed to fetch/i.test(errorMessage)
          ? 'transient'
          : /policy|permission|blocked/i.test(errorMessage)
            ? 'policy'
            : /invalid|syntax/i.test(errorMessage)
              ? 'technical'
              : 'permanent';
        const retryPolicy = this.orchestrator.getRetryPolicy(retryCategory);
        this.orchestrator.recordJobExecution({
          jobId: job.id,
          step,
          result: errorMessage,
          status: 'failed',
          errorLog: errorMessage
        });

        if (retryPolicy.shouldRetry) {
          const retryCount = Array.isArray(job.retries) ? job.retries.length + 1 : 1;
          const nextRetryAtMs = Date.now() + Math.min(30000, 1000 * Math.pow(2, retryCount - 1));
          this.orchestrator.recordJobRetry({
            jobId: job.id,
            step,
            retryCount,
            nextRetryAtMs,
            errorLog: errorMessage
          });
          this.orchestrator.updateJobExecutionRuntime(job.id, {
            state: 'retrying',
            currentStepIndex: index,
            currentStep: step,
            lastError: errorMessage,
            retryAt: nextRetryAtMs
          });
          pushEvent({
            jobId: job.id,
            type: 'step_retrying',
            step,
            summary: errorMessage
          });
          recordAgentPresence({
            source: 'agent-executor', workRef: job.id, action: step,
            status: 'waiting', phase: 'waiting-approval'
          });
          this.state.runningJobId = '';
          saveState(this.state);
          return {
            ok: true,
            state: 'retrying',
            job,
            step,
            reason: errorMessage,
            nextRetryAtMs
          };
        }

        this.orchestrator.recordJobFailure({
          jobId: job.id,
          reason: errorMessage,
          errorLog: errorMessage
        });
        this.orchestrator.updateJobExecutionRuntime(job.id, {
          state: 'failed',
          failedAt: Date.now(),
          currentStepIndex: index,
          currentStep: step,
          lastError: errorMessage
        });
        pushEvent({
          jobId: job.id,
          type: 'step_failed',
          step,
          summary: errorMessage
        });
        recordAgentPresence({
          source: 'agent-executor', workRef: job.id, action: step,
          status: 'failed', phase: 'failed'
        });
        this.state.runningJobId = '';
        saveState(this.state);
        return { ok: false, state: 'failed', job, step, reason: errorMessage };
      }
    }

    const completionText = `Completed ${executedCount} step${executedCount === 1 ? '' : 's'} for "${job.title}".`;
    this.orchestrator.recordJobSuccess({
      jobId: job.id,
      result: completionText
    });
    this.orchestrator.updateJobExecutionRuntime(job.id, {
      state: 'completed',
      completedAt: Date.now(),
      currentStepIndex: steps.length,
      currentStep: '',
      lastOutcome: completionText,
      waitingApproval: false
    });
    if (job.metadata?.browserTaskId && typeof eonBrowserService.completeAgentTask === 'function') {
      const finalText = summarizeOutput(getLatestExecutionText(job) || completionText, 1200);
      completeBrowserTask(job, finalText);
    }
    pushEvent({
      jobId: job.id,
      type: 'job_completed',
      step: 'complete',
      summary: completionText
    });
    recordAgentPresence({
      source: 'agent-executor', workRef: job.id, action: steps.at?.(-1) || steps[steps.length - 1] || 'plan',
      role: 'coordinator', status: 'complete', phase: 'complete'
    });

    this.state.runningJobId = '';
    saveState(this.state);

    return {
      ok: true,
      state: 'completed',
      job: this.orchestrator.getJob(job.id) || job,
      result: completionText
    };
  }

  /**
   * @param {{ limit?: number }} [options]
   */
  async runPendingJobs({ limit = 5 } = {}) {
    const jobs = /** @type {any[]} */ (this.orchestrator
      .listJobs(100)
      .filter((/** @type {any} */ job) => ['ready', 'awaiting_approval', 'retrying'].includes(job.status))
      .filter((/** @type {any} */ job) => !['completed', 'failed'].includes(job.status))
      .slice(0, Math.max(1, Math.min(10, limit))));

    const results = [];
    for (const job of jobs) {
      // Fire sequentially so receipts stay readable and rate-limited.
      // If one job is waiting for approval, the next job can still proceed.
      // Each job still runs the steps in order.
      results.push(await this.runJob(job.id, { surface: 'background' }));
    }
    return results;
  }

  getRunnerSummary() {
    const state = this.getState();
    return {
      schema: state.schema || EXECUTOR_SCHEMA,
      runningJobId: state.runningJobId || '',
      lastJobId: state.lastJobId || '',
      recentEvents: Array.isArray(state.events) ? state.events.slice(-10).reverse() : []
    };
  }
}

/** @type {AgentExecutionEngine | null} */
let _executor = null;

export function getAgentExecutor() {
  if (!_executor) {
    _executor = new AgentExecutionEngine();
  }
  return _executor;
}

/**
 * @param {string} step
 * @param {(args: StepHandlerContext) => Promise<any> | any} handler
 */
export function registerAgentStepHandler(step, handler) {
  return getAgentExecutor().registerStepHandler(step, handler);
}

/**
 * @param {string} jobId
 */
export function getAgentExecutionSnapshot(jobId) {
  return getAgentExecutor().getExecutionSnapshot(jobId);
}

export function getAgentExecutorSummary() {
  return getAgentExecutor().getRunnerSummary();
}

/**
 * @param {string} jobId
 * @param {Record<string, any>} [context]
 */
export async function runAgentJob(jobId, context = {}) {
  return getAgentExecutor().runJob(jobId, context);
}

/**
 * @param {{ limit?: number }} [options]
 */
export async function runPendingAgentJobs(options = {}) {
  return getAgentExecutor().runPendingJobs(options);
}

Object.assign(globalThis, {
  getAgentExecutor,
  getAgentExecutionSnapshot,
  getAgentExecutorSummary,
  runAgentJob,
  runPendingAgentJobs,
  registerAgentStepHandler,
  AgentExecutionEngine
});
