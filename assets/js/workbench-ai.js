/**
 * workbench-ai.js
 * AI execution engine for the WorkBench page.
 * Bridges ai-runtime.js into WorkBench modes (Ask / Build / Agent / Hive / Signal).
 * Provider keys are consumed only from the canonical session runtime store.
 */

import {
  getApiKey,
  setApiKey,
  loadAISettings,
  PROVIDERS
} from './chat/ai-runtime.js';
import { createLoadGovernor } from './chat/load-governor.js';
import { getAIReadiness } from './utils/ai-readiness.js';
import { runMissionEngine } from './utils/mission-engine.js';
import { shouldProbeLocalRuntimes } from './utils/local-runtime-policy.js';

// Legacy provider-key containers are intentionally not read on WorkBench load.
// Reviewed migration is available only from Vault with an explicit passphrase.
const WORKBENCH_HISTORY_KEY = 'eon:workbench:history:v1';
const MEMORY_MAX_ITEMS = 8;
const MEMORY_MAX_CHARS = 2800;

// ── Mode system prompts ────────────────────────────────
const /** @type {any} */
MODE_SYSTEM_PROMPTS = {
  ask: `You are EONBOT on the WorkBench — a direct, knowledgeable assistant.
The user wants quick, accurate answers. Be concise and structured.
Use bullet points or numbered lists only when the answer genuinely needs structure.
Avoid preamble — get straight to the answer.`,

  build: `You are EONBOT in Build Mode — a senior product builder and deliverable generator.
The user wants complete, usable output: websites, product docs, pitch decks, launch plans, code, briefs.
Always produce concrete, copy-pasteable deliverables. Format nicely with clear sections.
If the request is ambiguous, make sensible assumptions and state them.`,

  agent: `You are EONBOT in Agent Mode — an autonomous task planner and executor.
Break every task into numbered steps. Show your plan first. Then execute step by step.
After each step, briefly confirm completion before proceeding to the next.
At the end, provide a summary of what was accomplished and any open items.`,

  hive: `You are the Hive coordinator on EONAPP WorkBench.
For every task, you simulate 4 specialist perspectives:
1. PLANNER — strategic overview and approach
2. EXECUTOR — specific implementation steps
3. CRITIC — risks, weaknesses, counter-arguments
4. FINISHER — polished final output or summary

Clearly label each perspective. Be thorough but not repetitive.`,

  collab: `You are EONBOT in Collab Mode — a multi-party collaboration orchestrator.
Your job is to coordinate humans + AI roles toward one shared outcome.

Always produce:
1. Shared objective and success criteria
2. Role map (Owner, Operator, Builder, Reviewer)
3. Collaboration board (backlog, in-progress, blocked, done)
4. Clear handoff notes and next sync agenda

Keep outputs execution-first, concrete, and ready to copy into a team workspace.`,

  boardroom: `You are EONBOT in AI Boardroom Mode — executive strategy council.
Run every request through four lenses:
1. Growth (acquisition, retention, monetization)
2. Finance (unit economics, budget impact, runway)
3. Product (user value, scope, ship plan)
4. Risk (legal, security, operational, reputation)

Output format:
1. Executive brief (max 8 lines)
2. Option A / B / C with trade-offs
3. Recommended decision with confidence (0-100)
4. 7-day execution plan with owners and checkpoints.`,

  signal: `You are EONBOT in Signal Mode — a research-first analyst for crypto, equities, and business intelligence.
For every query:
1. State what data/sources are relevant
2. Provide analytical framework
3. Give structured analysis (bull case / bear case / base case where applicable)
4. Highlight key risks and catalysts
5. Give a clear, opinionated conclusion

Be specific. Avoid vague platitudes. Caveat when data is unavailable.`
,

  twin: `You are EON Twin (Scoped v1) — a bounded autonomy copilot.
Strictly allowed scopes:
1. moderation review
2. draft generation
3. research prep

Hard rules:
- Never execute financial actions.
- Never execute publishing or public-posting actions.
- Never execute any action without explicit approval.

Output format:
1. Scope check (allowed or blocked)
2. Plan with explicit approval checkpoint
3. Safe draft output only`,

  bounty: `You are EON Bounty Copilot (v1 Microtasks).
Prioritize short, verifiable outputs for:
- content review
- research summary
- prompt refinement
- translation

When relevant, include quality rubric and reviewer notes fields.
Rewards are Pool Points first, optional EonLite second.`,

  skill: `You are EON Skill Tree Coach (v1 Professional Tracks).
Tracks: Builder, Creator, Signal, Moderator.
Given user actions and logs, provide objective progress updates, next milestone, and one concrete next action.
Keep recommendations measurable and execution-ready.`
};

function readHistoryMemory(/** @type {any} */ mode) {
  try {
    const rows = JSON.parse(localStorage.getItem(WORKBENCH_HISTORY_KEY) || '[]');
    if (!Array.isArray(rows) || rows.length === 0) return '';

    const prioritized = rows
      .slice(-40)
      .reverse()
      .sort((/** @type {any} */ a, /** @type {any} */ b) => {
        const aSame = String(a?.mode || '') === String(mode || '');
        const bSame = String(b?.mode || '') === String(mode || '');
        if (aSame === bSame) return 0;
        return aSame ? -1 : 1;
      })
      .slice(0, MEMORY_MAX_ITEMS)
      .reverse();

    let used = 0;
    const /** @type {any} */
lines = [];
    for (const /** @type {any} */
item of prioritized) {
      const m = String(item?.mode || 'ask').slice(0, 20);
      const p = String(item?.prompt || '').replace(/\s+/g, ' ').trim();
      const o = String(item?.output || '').replace(/\s+/g, ' ').trim();
      const line = `- mode=${m}; prompt="${p.slice(0, 180)}"; output="${o.slice(0, 180)}"`;
      if (used + line.length > MEMORY_MAX_CHARS) break;
      lines.push(line);
      used += line.length;
    }

    if (!lines.length) return '';
    return [
      'Recent WorkBench memory (for continuity, do not repeat verbatim):',
      ...lines
    ].join('\n');
  } catch {
    return '';
  }
}

// ── WorkBench mission executor ───────────────────────────────────────────────────
export async function runMission(/** @type {any} */ { mode = 'ask', prompt, onChunk, onDone, onError }) {
  const result = await runMissionDetailed({ mode, prompt, onChunk, onDone, onError });
  return String(result?.text || '');
}

export async function runMissionDetailed(/** @type {any} */ { mode = 'ask', prompt, onChunk, onDone, onError }) {
  const systemPrompt = (/** @type {any} */ (MODE_SYSTEM_PROMPTS))[mode] || MODE_SYSTEM_PROMPTS.ask;
  const settings     = loadAISettings();
  const memoryContext = readHistoryMemory(mode);
  const governor = createLoadGovernor();

  try {
    return await runMissionEngine({
      mode,
      prompt,
      settings,
      governor,
      systemPrompt: [systemPrompt, memoryContext].filter(Boolean).join('\n\n'),
      taskType: mode,
      origin: 'workbench',
      metadata: { surface: 'workbench', mode },
      onChunk,
      onDone,
      onError
    });
  } catch (/** @type {any} */
err) {
    let msg = (/** @type {any} */ (err))?.message || 'AI request failed.';
    // Friendly messages for common failure patterns
    if (!msg || msg === 'Failed to fetch' || msg.includes('net::ERR') || msg.includes('NetworkError')) {
      msg = 'AI provider unreachable — check your internet connection or provider URL.';
    } else if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('invalid_api_key')) {
      msg = 'Invalid API key — update it in Vault → Settings.';
    } else if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
      msg = 'Rate limit hit — wait a moment or switch provider in Settings.';
    } else if (msg.includes('503') || msg.includes('overloaded') || msg.includes('Service Unavailable')) {
      msg = 'Provider is overloaded — try again or switch to another provider.';
    } else if (msg.includes('No provider') || msg.includes('not configured') || msg.includes('guide')) {
      msg = 'No AI provider configured — complete the onboarding or set a provider in Vault → Settings.';
    }
    onError?.(msg);
    throw new Error(msg);
  }
}

// ── Provider status check ────────────────────────────────────────────────────────
export function getProviderStatus() {
  const readiness = getAIReadiness(loadAISettings(), {
    readyPrimaryLabel: 'Open AI Chat',
    readyPrimaryUrl: '/chat.html',
    readySecondaryLabel: 'Manage API keys',
    readySecondaryUrl: '/vault#api-keys',
    setupPrimaryLabel: 'Start onboarding',
    setupPrimaryUrl: '/onboarding.html',
    setupSecondaryLabel: 'Manage keys',
    setupSecondaryUrl: '/vault#api-keys'
  });

  return {
    ready: readiness.ready,
    label: readiness.bannerLabel,
    detail: readiness.detail,
    state: readiness.state,
    primaryAction: readiness.primaryAction,
    secondaryAction: readiness.secondaryAction
  };
}

// ── Auto-detect local providers ──────────────────────────────────────────────────
export async function detectLocalProviders(/** @type {{ force?: boolean } | boolean } */ options = {}) {
  if (!shouldProbeLocalRuntimes(options)) {
    return {
      ollama: { available: false, models: [] },
      lmstudio: { available: false, models: [] },
      jan: { available: false, models: [] }
    };
  }
  const /** @type {any} */
results = {};
  const probes = {
    ollama: ['http://127.0.0.1:11434/api/tags', 'http://localhost:11434/api/tags', 'http://127.0.0.1:11434/v1/models'],
    lmstudio: ['http://127.0.0.1:1234/v1/models', 'http://localhost:1234/v1/models'],
    jan: ['http://127.0.0.1:1337/v1/models', 'http://localhost:1337/v1/models']
  };
  const fetchJson = async (/** @type {string} */ url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    return await res.json();
  };

  for (const [provider, urls] of Object.entries(probes)) {
    results[provider] = { available: false, models: [] };
    for (const url of urls) {
      try {
        const data = await fetchJson(url);
        if (!data) continue;
        const models = provider === 'ollama'
          ? (data.models || data.data || []).map((/** @type {any} */ m) => m.name || m.id).filter(Boolean)
          : (data.data || data.models || []).map((/** @type {any} */ m) => m.id || m.name).filter(Boolean);
        if (models.length) {
          results[provider] = { available: true, models: models.slice(0, 10), endpoint: url };
          break;
        }
      } catch {}
    }
  }

  return results;
}

// ── Exports ──────────────────────────────────────────────────────────────────────
export { getApiKey, setApiKey, loadAISettings, PROVIDERS };
