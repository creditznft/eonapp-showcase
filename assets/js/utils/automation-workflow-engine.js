import { getEonWorkflowLaunchTruth } from '../contracts/workflow/eon-workflow-action-state-machine.js';
import {
  AUTOMATION_APPROVAL_LEVELS,
  findProvidersForCapability,
  getAutomationProvider
} from './automation-provider-registry.js';
import {
  appendAutomationAudit,
  createAutomationApproval,
  loadAutomationState,
  saveAutomationState,
  upsertWorkflow
} from './automation-os-store.js';

const APPROVAL_ORDER = Object.freeze({ read: 0, draft: 1, submit: 2, sensitive: 3 });
const VALUE_BEARING_REQUEST_PATTERN = /\b(?:invoice|payment|charge|refund|checkout|purchase|sale|seller|marketplace|wallet|token|mint|payout|withdraw|cash\s*out|reward|lootbox|referral\s+bonus|transfer)\b/i;

function id(prefix = 'item') {
  try { if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`; } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function step(title, providerId, capability, approval = 'draft', type = 'action', description = '') {
  return Object.freeze({ id: id('step'), title, providerId, capability, approval, type, description, config: {}, enabled: true });
}

function localStep(title, approval = 'draft', type = 'action', description = '') {
  return step(title, 'local-runner', 'files', approval, type, description);
}

function officialLocalTemplate(id, name, description, tags, steps) {
  return Object.freeze({
    id,
    name,
    description,
    tags: Object.freeze([...tags]),
    localOnly: true,
    source: 'official-blueprint-pack',
    steps: Object.freeze([...steps])
  });
}

export const WORKFLOW_TEMPLATE_FAMILIES = Object.freeze([
  {
    id: 'content-production',
    name: 'Content Production Studio',
    description: 'Brief → research → script → storyboard → licensed assets → narration → captions → edit → review → export/post.',
    tags: ['creator', 'social', 'video', 'content'],
    steps: [
      step('Capture brief and success criteria', 'csv-json', 'import', 'read', 'trigger'),
      step('Research sources and preserve citations', 'perplexity', 'research', 'read'),
      step('Draft script and content variants', 'openai', 'chat', 'draft'),
      step('Create storyboard and shot list', 'google-docs', 'documents', 'draft'),
      step('Prepare licensed or user-owned assets', 'canva', 'design', 'draft'),
      step('Generate narration and captions', 'elevenlabs', 'speech', 'draft'),
      step('Review rights, facts, brand and output', 'local-runner', 'files', 'submit', 'approval'),
      step('Export or publish through approved channel', 'buffer', 'social-publishing', 'submit')
    ]
  },
  {
    id: 'inbox-triage',
    name: 'Inbox Triage & Draft Replies',
    description: 'Classify incoming messages, extract commitments, draft replies, and require approval before sending.',
    tags: ['email', 'support', 'productivity'],
    steps: [
      step('Read new messages', 'gmail', 'email-read', 'read', 'trigger'),
      step('Classify priority and intent', 'anthropic', 'reasoning', 'read'),
      step('Draft reply and next action', 'openai', 'chat', 'draft'),
      step('Human review checkpoint', 'local-runner', 'files', 'submit', 'approval'),
      step('Send approved reply', 'gmail', 'email-send', 'submit'),
      step('Record follow-up task', 'todoist', 'tasks', 'submit')
    ]
  },
  {
    id: 'lead-crm',
    name: 'Lead Capture & CRM Follow-up',
    description: 'Capture leads, enrich public company context, create CRM records, draft outreach and schedule follow-up.',
    tags: ['sales', 'crm', 'lead'],
    steps: [
      step('Receive form submission', 'typeform', 'forms', 'read', 'trigger'),
      step('Validate and normalize lead data', 'csv-json', 'transform', 'read'),
      step('Research public company context', 'perplexity', 'research', 'read'),
      step('Create or update CRM contact', 'hubspot', 'contacts', 'submit'),
      step('Draft personalized outreach', 'openai', 'chat', 'draft'),
      step('Approve outreach', 'local-runner', 'files', 'submit', 'approval'),
      step('Send and schedule follow-up', 'gmail', 'email-send', 'submit')
    ]
  },
  {
    id: 'local-decision-review',
    name: 'Local Decision Review',
    description: 'Capture an internal decision, prepare options, and require a person to review it before any separate future process.',
    tags: ['local', 'review', 'planning'],
    steps: [
      step('Capture the decision context', 'local-runner', 'files', 'read', 'trigger'),
      step('Prepare options and constraints', 'local-runner', 'files', 'draft'),
      step('Document evidence and open questions', 'local-runner', 'files', 'draft'),
      step('Human review checkpoint', 'local-runner', 'files', 'submit', 'approval')
    ]
  },
  {
    id: 'freelance-delivery',
    name: 'Freelance Intake & Delivery',
    description: 'Turn client intake into a scoped brief, milestone plan, draft delivery, approval and status update.',
    tags: ['freelance', 'client', 'delivery'],
    steps: [
      step('Capture client intake', 'tally', 'forms', 'read', 'trigger'),
      step('Draft scope and clarification questions', 'anthropic', 'reasoning', 'draft'),
      step('Create project and milestones', 'clickup', 'projects', 'submit'),
      step('Prepare draft deliverable', 'google-docs', 'documents', 'draft'),
      step('Client-ready review checkpoint', 'local-runner', 'files', 'submit', 'approval'),
      step('Send delivery update', 'gmail', 'email-send', 'submit')
    ]
  },
  {
    id: 'social-campaign',
    name: 'Social Campaign Builder',
    description: 'Create campaign themes, channel variants, review queue, schedule and performance log.',
    tags: ['social', 'marketing', 'campaign'],
    steps: [
      step('Capture campaign brief', 'notion', 'documents', 'read', 'trigger'),
      step('Research audience and current topics', 'perplexity', 'research', 'read'),
      step('Draft channel variants', 'openai', 'chat', 'draft'),
      step('Prepare design assets', 'canva', 'design', 'draft'),
      step('Approve final campaign', 'local-runner', 'files', 'submit', 'approval'),
      step('Schedule approved posts', 'buffer', 'social-publishing', 'submit'),
      step('Record performance', 'google-analytics', 'analytics', 'read')
    ]
  },
  {
    id: 'research-report',
    name: 'Research & Recurring Report',
    description: 'Collect cited sources, analyze data, draft a report and distribute only after verification.',
    tags: ['research', 'reporting', 'documents'],
    steps: [
      step('Collect approved sources', 'rss', 'feed-read', 'read', 'trigger'),
      step('Search and preserve citations', 'perplexity', 'research', 'read'),
      step('Analyze structured data', 'google-sheets', 'spreadsheets', 'read'),
      step('Draft report with limitations', 'anthropic', 'reasoning', 'draft'),
      step('Fact and source review', 'local-runner', 'files', 'submit', 'approval'),
      step('Export report', 'google-docs', 'documents', 'draft'),
      step('Distribute approved report', 'slack', 'messages', 'submit')
    ]
  },
  {
    id: 'calendar-followup',
    name: 'Meeting & Follow-up Operator',
    description: 'Prepare meetings, capture explicit notes, draft follow-up and create reviewed tasks.',
    tags: ['calendar', 'meeting', 'follow-up'],
    steps: [
      step('Read upcoming calendar event', 'google-calendar', 'calendar-read', 'read', 'trigger'),
      step('Prepare context brief', 'notion', 'documents', 'read'),
      step('Draft agenda and questions', 'openai', 'chat', 'draft'),
      step('Import user-approved meeting notes', 'google-docs', 'documents', 'read'),
      step('Draft follow-up message', 'openai', 'chat', 'draft'),
      step('Approve follow-up and tasks', 'local-runner', 'files', 'submit', 'approval'),
      step('Send and create tasks', 'gmail', 'email-send', 'submit')
    ]
  },
  {
    id: 'support-queue',
    name: 'Customer Support Queue',
    description: 'Classify tickets, retrieve approved knowledge, draft replies, escalate risk and submit only with policy controls.',
    tags: ['support', 'service', 'tickets'],
    steps: [
      step('Read incoming support ticket', 'zendesk', 'tickets', 'read', 'trigger'),
      step('Classify urgency and risk', 'anthropic', 'reasoning', 'read'),
      step('Retrieve approved knowledge', 'notion', 'documents', 'read'),
      step('Draft response', 'openai', 'chat', 'draft'),
      step('Escalate sensitive cases', 'pagerduty', 'alerts', 'sensitive', 'approval'),
      step('Submit approved response', 'zendesk', 'tickets', 'submit')
    ]
  },
  {
    id: 'developer-release',
    name: 'Developer Release Assistant',
    description: 'Summarize changes, run checks, draft release notes, require approval and publish through scoped DevOps connectors.',
    tags: ['developer', 'release', 'devops'],
    steps: [
      step('Read repository changes', 'github', 'repositories', 'read', 'trigger'),
      step('Run local tests', 'local-runner', 'device-jobs', 'read'),
      step('Draft release notes', 'anthropic', 'reasoning', 'draft'),
      step('Review security and deployment evidence', 'sentry', 'errors', 'read'),
      step('Release approval', 'local-runner', 'files', 'sensitive', 'approval'),
      step('Create approved release', 'github', 'releases', 'sensitive')
    ]
  },
  officialLocalTemplate('local-event-launch', 'Local Event Launch Plan', 'Create a reviewable event brief, run-of-show, promotion drafts and manual handoff checklist.', ['official', 'local-only', 'event'], [
    localStep('Capture event goal, audience and constraints', 'read', 'trigger'),
    localStep('Draft run-of-show, promotion direction and booking notes'),
    localStep('Prepare safety, budget and ownership questions'),
    localStep('Human review before any manual outreach', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-creator-engine', 'Local Creator Engine', 'Turn user-owned ideas into a calm content structure, source notes and review queue.', ['official', 'local-only', 'creator'], [
    localStep('Capture user-owned idea and audience context', 'read', 'trigger'),
    localStep('Draft content structure and format variants'),
    localStep('Prepare source, rights and fact-check notes'),
    localStep('Human review before any manual publication', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-website-release', 'Local Website Release Review', 'Prepare a build, QA, accessibility, performance and rollback review without touching hosting.', ['official', 'local-only', 'builder'], [
    localStep('Capture scope, change list and release criteria', 'read', 'trigger'),
    localStep('Draft QA, accessibility and performance checklist'),
    localStep('Prepare rollback and evidence questions'),
    localStep('Human release review; no hosting change follows', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-client-delivery', 'Local Client Delivery Plan', 'Prepare intake, scope, delivery, review and communication drafts without sending or charging.', ['official', 'local-only', 'business', 'client'], [
    localStep('Capture intake, scope and success criteria', 'read', 'trigger'),
    localStep('Draft proposal, milestones and clarification questions'),
    localStep('Prepare delivery and follow-up drafts'),
    localStep('Human review before any manual client action', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-business-brief', 'Local Business Brief', 'Turn a business question into assumptions, evidence needs, options and a reviewable next test.', ['official', 'local-only', 'business'], [
    localStep('Capture decision context and constraints', 'read', 'trigger'),
    localStep('Draft assumptions, options and evidence questions'),
    localStep('Prepare success measures and low-risk next test'),
    localStep('Human decision review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-project-rescue', 'Local Project Rescue', 'Identify blockers, define a smallest recovery slice and create a visible local decision record.', ['official', 'local-only', 'builder', 'recovery'], [
    localStep('Capture current outcome, blockers and constraints', 'read', 'trigger'),
    localStep('Draft recovery options and smallest testable slice'),
    localStep('Prepare risks, dependencies and evidence checklist'),
    localStep('Human recovery review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-study-system', 'Local Learning & Knowledge Review', 'Plan a sustainable local learning or knowledge rhythm with privacy-safe review steps.', ['official', 'local-only', 'personal', 'learning'], [
    localStep('Capture learning goal or knowledge topic', 'read', 'trigger'),
    localStep('Draft study or review rhythm and prompts'),
    localStep('Prepare recall, cleanup and privacy checklist'),
    localStep('Human review before manual reminders or sharing', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-research-decision', 'Local Decision Research', 'Structure a decision question, evidence plan, uncertainty notes and a reviewable memo.', ['official', 'local-only', 'research'], [
    localStep('Capture question, options and decision deadline', 'read', 'trigger'),
    localStep('Draft evidence plan, assumptions and unknowns'),
    localStep('Prepare options, caveats and decision criteria'),
    localStep('Human decision review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-competitor-review', 'Local Competitor Observation', 'Organise lawful public observations, comparisons and caveats without collecting private data.', ['official', 'local-only', 'research', 'business'], [
    localStep('Capture lawful public observation scope', 'read', 'trigger'),
    localStep('Draft comparison categories and source notes'),
    localStep('Prepare caveats, assumptions and differentiation questions'),
    localStep('Human review of observations', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-product-qa', 'Local Product Discovery & QA', 'Prepare a problem statement, acceptance criteria, test matrix and release questions without changing code.', ['official', 'local-only', 'builder', 'qa'], [
    localStep('Capture problem, users and constraints', 'read', 'trigger'),
    localStep('Draft scope, acceptance criteria and test matrix'),
    localStep('Prepare privacy, performance and rollback questions'),
    localStep('Human product or QA review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-hospitality-operations', 'Local Hospitality Operations', 'Prepare service standards, event collaboration or venue operations without accessing guest, booking or staff systems.', ['official', 'local-only', 'operations', 'hospitality'], [
    localStep('Capture service or event outcome, audience and constraints', 'read', 'trigger'),
    localStep('Draft operating cues, role notes and guest-experience checklist'),
    localStep('Prepare risks, recovery notes and manual handoff questions'),
    localStep('Human operations review before any manual outreach', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-campaign-review', 'Local Campaign Measurement Review', 'Structure a campaign question, locally supplied observations, measures and a reviewable next test.', ['official', 'local-only', 'business', 'campaign'], [
    localStep('Capture campaign goal, context and locally supplied observations', 'read', 'trigger'),
    localStep('Draft measures, assumptions and evidence gaps'),
    localStep('Prepare a low-risk next-test and review cadence'),
    localStep('Human campaign review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-ecommerce-launch', 'Local E-commerce Catalog Review', 'Prepare product listing structure, catalog QA and manual publishing review without accessing a store.', ['official', 'local-only', 'business', 'catalog'], [
    localStep('Capture product facts, audience and listing constraints', 'read', 'trigger'),
    localStep('Draft listing structure, photo checklist and customer questions'),
    localStep('Prepare catalog QA and policy or accuracy checks'),
    localStep('Human review before any manual store action', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-documentation-handoff', 'Local Documentation Handoff', 'Create a maintainable purpose, setup, decision and verification record from user-owned notes.', ['official', 'local-only', 'builder', 'documentation'], [
    localStep('Capture purpose, audience and existing local notes', 'read', 'trigger'),
    localStep('Draft setup, decisions, dependencies and limits'),
    localStep('Prepare verification and ownership checklist'),
    localStep('Human handoff review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-meeting-decision', 'Local Meeting Decision Review', 'Prepare a meeting agenda, decision framing, notes and manual follow-up outline without scheduling or messaging.', ['official', 'local-only', 'operations', 'meeting'], [
    localStep('Capture objective, participants and decision context', 'read', 'trigger'),
    localStep('Draft agenda, questions and note structure'),
    localStep('Prepare action ownership and manual follow-up outline'),
    localStep('Human decision review', 'submit', 'approval')
  ]),
  officialLocalTemplate('local-personal-operations', 'Local Personal Operations', 'Prepare a personal project, portfolio or administrative routine from local notes without accessing personal accounts.', ['official', 'local-only', 'personal', 'operations'], [
    localStep('Capture personal outcome, constraints and local records', 'read', 'trigger'),
    localStep('Draft priorities, checklists and review rhythm'),
    localStep('Prepare privacy, archive and manual reminder notes'),
    localStep('Human personal review', 'submit', 'approval')
  ])
]);

/** Historical W376 set; W377 expands it without rewriting the earlier source claim. */
export const OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376 = Object.freeze([
  'local-event-launch',
  'local-creator-engine',
  'local-website-release',
  'local-client-delivery',
  'local-business-brief',
  'local-project-rescue',
  'local-study-system',
  'local-research-decision',
  'local-competitor-review',
  'local-product-qa'
]);

export const OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS = Object.freeze([
  ...OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376,
  'local-hospitality-operations',
  'local-campaign-review',
  'local-ecommerce-launch',
  'local-documentation-handoff',
  'local-meeting-decision',
  'local-personal-operations'
]);

export function getWorkflowTemplate(templateId = '') {
  return WORKFLOW_TEMPLATE_FAMILIES.find((template) => template.id === templateId) || null;
}

export function createWorkflowFromTemplate(templateId = '', overrides = {}) {
  const template = getWorkflowTemplate(templateId);
  if (!template) throw new Error('Unknown workflow template.');
  const createdAt = new Date().toISOString();
  return {
    id: id('flow'),
    name: String(overrides.name || template.name),
    description: String(overrides.description || template.description),
    family: template.id,
    status: 'draft',
    runMode: 'simulate',
    planner: String(overrides.planner || 'template'),
    tags: [...template.tags],
    steps: template.steps.map((item) => ({ ...item, id: id('step'), config: {} })),
    createdAt,
    updatedAt: createdAt,
    lastRunAt: null,
    runCount: 0,
    version: 1
  };
}

function scoreTemplate(template, goal = '') {
  const text = String(goal || '').toLowerCase();
  const haystack = `${template.id} ${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
  const tokens = text.split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 2 : 0), 0);
}

function createValueBoundaryReview(cleanGoal = '') {
  const createdAt = new Date().toISOString();
  return {
    id: id('flow'),
    name: 'Restricted request review',
    description: `This request is recorded only as a local policy review: ${String(cleanGoal || '').slice(0, 900)}`,
    family: 'local-boundary-review',
    status: 'draft',
    runMode: 'simulate',
    planner: 'local-safety-boundary',
    tags: ['local-only', 'restricted-request'],
    steps: [
      step('Record a non-operative request summary', 'local-runner', 'files', 'read', 'trigger'),
      step('Prepare a local safety and prerequisite note', 'local-runner', 'files', 'draft'),
      step('Human review checkpoint', 'local-runner', 'files', 'submit', 'approval')
    ],
    createdAt,
    updatedAt: createdAt,
    lastRunAt: null,
    runCount: 0,
    version: 1
  };
}

export function planWorkflowLocally(goal = '', options = {}) {
  const cleanGoal = String(goal || '').trim().slice(0, 1600);
  if (!cleanGoal) throw new Error('Describe the outcome you want first.');
  if (VALUE_BEARING_REQUEST_PATTERN.test(cleanGoal)) return createValueBoundaryReview(cleanGoal);
  const ranked = WORKFLOW_TEMPLATE_FAMILIES
    .map((template) => ({ template, score: scoreTemplate(template, cleanGoal) }))
    .sort((a, b) => b.score - a.score || a.template.name.localeCompare(b.template.name));
  const selected = ranked[0]?.template || WORKFLOW_TEMPLATE_FAMILIES[0];
  const workflow = createWorkflowFromTemplate(selected.id, {
    name: options.name || `${selected.name}: ${cleanGoal.slice(0, 72)}`,
    description: cleanGoal,
    planner: 'local-agent-fallback'
  });
  const goalText = cleanGoal.toLowerCase();
  if (/whatsapp|sms|text message/.test(goalText)) {
    workflow.steps.push(step('Prepare approved mobile message', /whatsapp/.test(goalText) ? 'whatsapp-business' : 'twilio', /whatsapp/.test(goalText) ? 'messages' : 'sms', 'submit'));
  }
  if (/video|reel|short|youtube/.test(goalText) && !workflow.steps.some((item) => item.providerId === 'youtube')) {
    workflow.steps.push(step('Export reviewed video package', 'youtube', 'video-publishing', 'submit'));
  }
  workflow.steps = workflow.steps.map((item) => {
    if (getAutomationProvider(item.providerId)) return item;
    const candidate = findProvidersForCapability(item.capability, { limit: 1 })[0];
    return candidate ? { ...item, providerId: candidate.id } : item;
  });
  return workflow;
}

function extractJson(text = '') {
  const raw = String(text || '').trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || raw;
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(fenced.slice(start, end + 1)); } catch { return null; }
}

export function buildAgentPlannerPrompt(goal = '') {
  const providerList = findProvidersForCapability('', { limit: 0 });
  void providerList;
  return `You are the EON Automation OS workflow planner. Return JSON only.\n\nGoal: ${String(goal || '').slice(0, 1600)}\n\nRules:\n- Use 4 to 12 steps.\n- Each step must have title, providerId, capability, approval, and type.\n- approval must be read, draft, submit, or sensitive.\n- Never include API keys, passwords, tokens, cookies, private keys, seed phrases, or personal secrets.\n- Publishing, sending, deletion, security and irreversible actions must be submit or sensitive.\n- Do not plan commerce, payment, wallet, token, reward, referral, marketplace, payout, or money-transfer steps. Use only local review steps for a restricted request.\n- Prefer official API connectors; use browser-companion only when no API path exists.\n- Include a human approval step before submit/sensitive actions.\n- Do not promise background work unless cloud-scheduler or local-runner is explicitly configured.\n\nSchema: {"name":"...","description":"...","family":"custom","tags":["..."],"steps":[{"title":"...","providerId":"gmail","capability":"email-read","approval":"read","type":"trigger","description":"..."}]}`;
}

export function validateAgentWorkflowPlan(plan = {}, goal = '') {
  if (!plan || typeof plan !== 'object' || !Array.isArray(plan.steps)) return null;
  if (plan.steps.length < 2 || plan.steps.length > 20) return null;
  const createdAt = new Date().toISOString();
  const steps = [];
  let hasApprovalBeforeHighRisk = false;
  for (const [index, item] of plan.steps.entries()) {
    const rawTitle = String(item?.title || '');
    const rawCapability = String(item?.capability || '').slice(0, 120);
    if (VALUE_BEARING_REQUEST_PATTERN.test(`${rawTitle} ${rawCapability}`)) continue;
    const provider = getAutomationProvider(item?.providerId);
    if (!provider) continue;
    let approval = Object.values(AUTOMATION_APPROVAL_LEVELS).includes(item?.approval) ? item.approval : provider.defaultApproval;
    const capability = rawCapability;
    const highRisk = /(send|publish|delete|security|release|write|submit|create)/i.test(`${capability} ${rawTitle}`);
    if (highRisk && APPROVAL_ORDER[approval] < APPROVAL_ORDER.submit) approval = 'submit';
    if ((approval === 'submit' || approval === 'sensitive') && !hasApprovalBeforeHighRisk) {
      steps.push(step('Human review checkpoint', 'local-runner', 'files', 'submit', 'approval', 'Review the prepared action before any external state changes.'));
      hasApprovalBeforeHighRisk = true;
    }
    steps.push({
      id: id(`step${index + 1}`),
      title: String(item?.title || `Step ${index + 1}`).slice(0, 180),
      providerId: provider.id,
      capability,
      approval,
      type: String(item?.type || 'action').slice(0, 40),
      description: String(item?.description || '').slice(0, 600),
      config: {},
      enabled: true
    });
    if (String(item?.type || '') === 'approval') hasApprovalBeforeHighRisk = true;
  }
  if (steps.length < 2) return null;
  return {
    id: id('flow'),
    name: String(plan.name || 'Agent-planned workflow').slice(0, 180),
    description: String(plan.description || goal || '').slice(0, 1200),
    family: String(plan.family || 'custom').slice(0, 80),
    status: 'draft',
    runMode: 'simulate',
    planner: 'configured-ai-agent',
    tags: Array.isArray(plan.tags) ? plan.tags.map((tag) => String(tag).slice(0, 60)).slice(0, 20) : ['agent-planned'],
    steps,
    createdAt,
    updatedAt: createdAt,
    lastRunAt: null,
    runCount: 0,
    version: 1
  };
}

export async function planWorkflowWithAgent(goal = '', createAIReply) {
  if (typeof createAIReply !== 'function') return { workflow: planWorkflowLocally(goal), usedAI: false, fallbackReason: 'AI runtime unavailable' };
  try {
    const reply = await createAIReply({ input: buildAgentPlannerPrompt(goal), history: [], settings: { requestContext: { userInitiated: true, consentSource: 'automation-plan-request', origin: 'automations' } } });
    const parsed = extractJson(reply?.text || '');
    const workflow = validateAgentWorkflowPlan(parsed, goal);
    if (!workflow) throw new Error('AI plan did not match the safe workflow schema.');
    return { workflow, usedAI: true, meta: reply?.meta || null, fallbackReason: '' };
  } catch (error) {
    return {
      workflow: planWorkflowLocally(goal),
      usedAI: false,
      fallbackReason: error instanceof Error ? error.message : String(error)
    };
  }
}

function requiresApproval(stepItem = {}) {
  return stepItem.approval === 'submit' || stepItem.approval === 'sensitive' || stepItem.type === 'approval';
}

export function inspectWorkflowReadiness(workflow = {}, state = loadAutomationState()) {
  const missingProviders = [];
  const configured = [];
  for (const providerId of [...new Set((workflow.steps || []).map((item) => item.providerId).filter(Boolean))]) {
    const provider = getAutomationProvider(providerId);
    const connection = state.connections?.[providerId];
    if (!provider) missingProviders.push({ providerId, reason: 'Unknown provider' });
    else if (provider.auth !== 'none' && provider.state !== 'built-in' && !['configured', 'verified'].includes(connection?.status)) {
      missingProviders.push({ providerId, reason: 'Setup required' });
    } else configured.push(providerId);
  }
  const highRiskSteps = (workflow.steps || []).filter((item) => item.approval === 'submit' || item.approval === 'sensitive');
  const approvalSteps = (workflow.steps || []).filter((item) => item.type === 'approval');
  return {
    readyForSimulation: true,
    readyForLive: missingProviders.length === 0 && highRiskSteps.length === 0,
    missingProviders,
    configuredProviders: configured,
    highRiskSteps: highRiskSteps.length,
    approvalSteps: approvalSteps.length,
    stepCount: workflow.steps?.length || 0
  };
}

export async function runWorkflowSimulation(workflowId = '') {
  const state = loadAutomationState();
  const workflow = state.workflows.find((item) => item.id === workflowId);
  if (!workflow) throw new Error('Workflow not found.');
  const runId = id('run');
  const startedAt = new Date().toISOString();
  const results = [];
  appendAutomationAudit({ type: 'run-started', workflowId, runId, status: 'running', message: `Simulation started for ${workflow.name}.` });
  for (const stepItem of workflow.steps.filter((item) => item.enabled !== false)) {
    const provider = getAutomationProvider(stepItem.providerId);
    if (!provider) {
      results.push({ stepId: stepItem.id, status: 'blocked', message: 'Unknown provider.' });
      appendAutomationAudit({ type: 'step-blocked', workflowId, runId, providerId: stepItem.providerId, status: 'blocked', message: `${stepItem.title}: unknown provider.` });
      continue;
    }
    if (requiresApproval(stepItem)) {
      const approval = createAutomationApproval({
        workflowId,
        runId,
        stepId: stepItem.id,
        level: stepItem.approval === 'sensitive' ? 'sensitive' : 'submit',
        title: stepItem.title,
        summary: `Simulation prepared ${provider.name} · ${stepItem.capability || stepItem.type}. No external action was submitted.`
      });
      results.push({ stepId: stepItem.id, status: 'approval-required', approvalId: approval.id, message: 'Prepared safely; approval required.' });
      appendAutomationAudit({ type: 'approval-created', workflowId, runId, providerId: provider.id, approval: approval.level, status: 'pending', message: `${stepItem.title}: explicit approval required.` });
      continue;
    }
    results.push({ stepId: stepItem.id, status: 'simulated', message: `Simulated ${provider.name} ${stepItem.capability || stepItem.type}.` });
    appendAutomationAudit({ type: 'step-simulated', workflowId, runId, providerId: provider.id, approval: stepItem.approval, status: 'simulated', message: `${stepItem.title} simulated without external side effects.` });
  }
  const fresh = loadAutomationState();
  const stored = fresh.workflows.find((item) => item.id === workflowId);
  if (stored) {
    stored.lastRunAt = new Date().toISOString();
    stored.runCount = Number(stored.runCount || 0) + 1;
    stored.updatedAt = stored.lastRunAt;
    saveAutomationState(fresh);
  }
  appendAutomationAudit({ type: 'run-finished', workflowId, runId, status: 'complete', message: `Simulation completed with ${results.length} step result(s).`, metadata: { startedAt, resultCount: results.length } });
  return { runId, workflowId, mode: 'simulate', state: 'simulated', launchTruth: getEonWorkflowLaunchTruth(), startedAt, finishedAt: new Date().toISOString(), results, externalEffectCreated: false, providerRequestCreated: false };
}

export function savePlannedWorkflow(workflow = {}) {
  const saved = upsertWorkflow(workflow);
  appendAutomationAudit({ type: 'workflow-saved', workflowId: saved.workflow.id, status: 'ok', message: `${saved.workflow.name} saved to the durable Automation OS store.` });
  return saved.workflow;
}
