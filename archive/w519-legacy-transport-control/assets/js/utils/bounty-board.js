/**
 * Bounty Board Service (v1 Microtasks)
 * Supported classes:
 * - content review
 * - research summary
 * - prompt refinement
 * - translation
 * Rewards:
 * - Pool Points first
 * - Optional EonLite second
 */

import * as nostrP2P from './p2p-nostr.js';
const appWin = /** @type {any} */ (window);

const publishBounty = nostrP2P.publishBounty;
const fetchRecentEonEvents =
  typeof nostrP2P.fetchRecentEonEvents === 'function'
    ? nostrP2P.fetchRecentEonEvents
    : async () => [];

const BOUNTY_KEY = 'eon:bounty:board:v1';
const BOUNTY_RATE_KEY = 'eon:bounty:rate:v1';

// Anti-spam quality gates
const MIN_CONTENT_LENGTH = 80;           // absolute minimum characters
const MAX_SUBMISSIONS_PER_HOUR = 3;      // per userId per hour
const /** @type {any} */
QUALITY_GATES = {
  content_review:    { minWords: 60,  label: '60 words' },
  research_summary:  { minWords: 120, label: '120 words' },
  prompt_refinement: { minWords: 40,  label: '40 words' },
  translation:       { minWords: 30,  label: '30 words' }
};

/**
 * FNV-1a 32-bit hash for near-duplicate detection.
 */
function fnv1a(/** @type {any} */ str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16);
}

/**
 * Validate submission content against quality gates.
 * Returns { valid: bool, error: string|null }.
 */
function validateSubmission(/** @type {any} */ content, /** @type {any} */ taskClass) {
  const text = String(content || '').trim();
  if (text.length < MIN_CONTENT_LENGTH) {
    return { valid: false, error: `Submission too short (min ${MIN_CONTENT_LENGTH} characters). Please provide more detail.` };
  }
  const gate = (/** @type {Record<string, any>} */ (QUALITY_GATES))[taskClass];
  if (gate) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < gate.minWords) {
      return { valid: false, error: `${taskClass.replace('_', ' ')} requires at least ${gate.label}. You have ${wordCount}.` };
    }
  }
  return { valid: true, error: null };
}

/**
 * Rate-limit guard: max MAX_SUBMISSIONS_PER_HOUR per userId per hour.
 */
function checkRateLimit(/** @type {any} */ userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  try {
    const raw = JSON.parse(localStorage.getItem(BOUNTY_RATE_KEY) || '{}');
    const key = String(userId || 'anon');
    const timestamps = (raw[key] || []).filter((/** @type {any} */ t) => now - t < windowMs);
    if (timestamps.length >= MAX_SUBMISSIONS_PER_HOUR) {
      return { allowed: false, error: `Rate limit reached: max ${MAX_SUBMISSIONS_PER_HOUR} submissions per hour.` };
    }
    timestamps.push(now);
    raw[key] = timestamps;
    localStorage.setItem(BOUNTY_RATE_KEY, JSON.stringify(raw));
  } catch {}
  return { allowed: true };
}

const /** @type {any} */
BOUNTY_CLASSES = [
  'content_review',
  'research_summary',
  'prompt_refinement',
  'translation'
];

function loadBoard() {
  try {
    const raw = JSON.parse(localStorage.getItem(BOUNTY_KEY) || 'null');
    if (raw && typeof raw === 'object') return raw;
  } catch {}
  return { tasks: [], submissions: [], contributors: {} };
}

function saveBoard(/** @type {any} */ board) {
  try { localStorage.setItem(BOUNTY_KEY, JSON.stringify(board)); } catch {}
}

function makeId(/** @type {any} */ prefix) {
  return `${prefix}-${Date.now()}-${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`;
}

class BountyBoardService {
  constructor() {
    this.state = loadBoard();
    if (this.state.tasks.length === 0) {
      this.seedDefaultTasks();
    }
    this.syncFromNostr().catch(() => {});
  }

  _persist() {
    saveBoard(this.state);
  }

  seedDefaultTasks() {
    const /** @type {any} */
seed = [
      {
        title: 'Review 5 AI outputs for clarity and policy fit',
        taskClass: 'content_review',
        description: 'Score each output (1-5) for clarity, policy safety, and usefulness.',
        rewardPoints: 35,
        rewardEONL: 0
      },
      {
        title: 'Summarize 3 competitor updates in 120 words each',
        taskClass: 'research_summary',
        description: 'Deliver concise summaries plus one actionable takeaway per source.',
        rewardPoints: 45,
        rewardEONL: 0
      },
      {
        title: 'Refine onboarding prompt set for Build mode',
        taskClass: 'prompt_refinement',
        description: 'Improve precision and reduce ambiguity for 5 core prompts.',
        rewardPoints: 40,
        rewardEONL: 2
      }
    ];

    seed.forEach((/** @type {any} */ item) => {
      this.createTask({ ...item, createdBy: 'system' });
    });
  }

  createTask(/** @type {any} */ { title, taskClass, description, rewardPoints = 20, rewardEONL = 0, createdBy }) {
    if (!title || !String(title).trim()) return { success: false, error: 'Title is required.' };
    if (!BOUNTY_CLASSES.includes(taskClass)) return { success: false, error: 'Invalid task class.' };

    const /** @type {any} */
task = {
      id: makeId('bounty'),
      title: String(title).trim(),
      taskClass,
      description: String(description || '').trim(),
      rewardPoints: Math.max(5, Number(rewardPoints) || 20),
      rewardEONL: Math.max(0, Number(rewardEONL) || 0),
      createdBy: createdBy || 'operator',
      createdAt: Date.now(),
      status: 'open',
      claimedBy: null,
      reviewedBy: null,
      approvedSubmissionId: null
    };

    this.state.tasks.push(task);
    this._persist();

    // Broadcast bounty on Nostr (kind:62003) — fire-and-forget
    publishBounty({
      bountyId: task.id,
      type: task.taskClass,
      reward: `${task.rewardPoints}pts${task.rewardEONL ? '+' + task.rewardEONL + 'EonLite' : ''}`,
      deadline: '',
      description: task.description
    }).catch(() => {});

    return { success: true, task };
  }

  claimTask(/** @type {any} */ taskId, /** @type {any} */ userId) {
    const task = this.state.tasks.find((/** @type {any} */ t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found.' };
    if (task.status !== 'open') return { success: false, error: 'Task is not open.' };

    task.status = 'in_progress';
    task.claimedBy = userId || 'contributor';
    task.claimedAt = Date.now();
    this._persist();
    return { success: true, task };
  }

  submitTask(/** @type {any} */ taskId, /** @type {any} */ userId, /** @type {any} */ content) {
    const task = this.state.tasks.find((/** @type {any} */ t) => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found.' };
    if (!content || !String(content).trim()) return { success: false, error: 'Submission content is required.' };

    // Compatibility/UX: surface content quality feedback first for clearly low-quality submissions.
    const quality = validateSubmission(content, task.taskClass);
    if (!quality.valid) return { success: false, error: quality.error };

    if (task.status !== 'in_progress') return { success: false, error: 'Task is not in progress.' };
    if (task.claimedBy !== userId) return { success: false, error: 'Only claimant can submit.' };

    // Anti-spam: rate limit
    const rate = checkRateLimit(userId);
    if (!rate.allowed) return { success: false, error: rate.error };

    // Anti-spam: near-duplicate detection
    const contentHash = fnv1a(String(content).trim().toLowerCase().replace(/\s+/g, ' '));
    const duplicate = this.state.submissions.find((/** @type {any} */ s) => s.contentHash === contentHash);
    if (duplicate) {
      return { success: false, error: 'This submission appears to be a duplicate of an existing submission.' };
    }

    const /** @type {any} */
submission = {
      id: makeId('sub'),
      taskId,
      userId,
      content: String(content).trim(),
      contentHash,
      submittedAt: Date.now(),
      status: 'pending_review',
      score: null,
      reviewNote: ''
    };

    this.state.submissions.push(submission);
    task.status = 'pending_review';
    this._persist();
    return { success: true, submission };
  }

  reviewSubmission(/** @type {any} */ submissionId, /** @type {any} */ reviewerId, /** @type {any} */ decision, /** @type {any} */ reviewNote, /** @type {any} */ score = 80) {
    const submission = this.state.submissions.find((/** @type {any} */ s) => s.id === submissionId);
    if (!submission) return { success: false, error: 'Submission not found.' };
    if (submission.status !== 'pending_review') return { success: false, error: 'Submission already reviewed.' };

    const task = this.state.tasks.find((/** @type {any} */ t) => t.id === submission.taskId);
    if (!task) return { success: false, error: 'Task not found.' };

    const approved = decision === 'approve';
    // Enforce minimum score threshold for approval
    const numericScore = Math.max(0, Math.min(100, Number(score) || 0));
    if (approved && numericScore < 60) {
      return { success: false, error: 'Cannot approve: quality score must be 60 or higher.' };
    }
    submission.status = approved ? 'approved' : 'rejected';
    submission.reviewedAt = Date.now();
    submission.reviewedBy = reviewerId || 'reviewer';
    submission.reviewNote = String(reviewNote || '').trim();
    submission.score = numericScore;

    task.reviewedBy = submission.reviewedBy;
    task.status = approved ? 'closed' : 'in_progress';
    if (approved) task.approvedSubmissionId = submission.id;

    let /** @type {any} */
payout = { points: 0, eonl: 0 };
    if (approved) {
      payout = this._awardContributor(submission.userId, task.rewardPoints, task.rewardEONL, task.taskClass);
    }

    this._persist();
    return { success: true, approved, payout, submission, task };
  }

  _awardContributor(/** @type {any} */ userId, /** @type {any} */ points, /** @type {any} */ eonl, /** @type {any} */ taskClass) {
    const key = String(userId || 'contributor');
    const c = this.state.contributors[key] || {
      userId: key,
      pointsEarned: 0,
      eonlEarned: 0,
      completed: 0,
      byClass: {}
    };

    c.pointsEarned += points;
    c.eonlEarned += eonl;
    c.completed += 1;
    c.byClass[taskClass] = (c.byClass[taskClass] || 0) + 1;
    this.state.contributors[key] = c;

    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('mission-run', `Bounty completed: ${taskClass} (+${points} pts)`);
    } else {
      try {
        const raw = JSON.parse(localStorage.getItem('eon:pool-points:v2') || '{"total":0}');
        raw.total = (raw.total || 0) + points;
        localStorage.setItem('eon:pool-points:v2', JSON.stringify(raw));
      } catch {}
    }

    return { points, eonl };
  }

  getTasks() {
    return this.state.tasks.slice().sort((/** @type {any} */ a, /** @type {any} */ b) => b.createdAt - a.createdAt);
  }

  getSubmissions() {
    return this.state.submissions.slice().sort((/** @type {any} */ a, /** @type {any} */ b) => b.submittedAt - a.submittedAt);
  }

  getPendingSubmissions() {
    return this.state.submissions
      .filter((/** @type {any} */ s) => s.status === 'pending_review')
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.submittedAt - a.submittedAt);
  }

  getContributors(/** @type {any} */ limit = 10) {
    return Object.values(this.state.contributors)
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.pointsEarned - a.pointsEarned)
      .slice(0, limit);
  }

  getStats() {
    const tasks = this.state.tasks;
    const submissions = this.state.submissions;
    return {
      totalTasks: tasks.length,
      openTasks: tasks.filter((/** @type {any} */ t) => t.status === 'open').length,
      inProgress: tasks.filter((/** @type {any} */ t) => t.status === 'in_progress').length,
      pendingReview: tasks.filter((/** @type {any} */ t) => t.status === 'pending_review').length,
      closed: tasks.filter((/** @type {any} */ t) => t.status === 'closed').length,
      totalSubmissions: submissions.length,
      pendingSubmissions: submissions.filter((/** @type {any} */ s) => s.status === 'pending_review').length,
      contributors: Object.keys(this.state.contributors).length
    };
  }

  async syncFromNostr() {
    const events = await fetchRecentEonEvents(62003, 'bounty', 120);
    if (!events.length) return { added: 0 };

    const /** @type {any} */
existingIds = new Set(this.state.tasks.map((/** @type {any} */ t) => String(t.id)));
    let added = 0;

    events.forEach((/** @type {any} */ event) => {
      const tags = Array.isArray(event.tags) ? event.tags : [];
      const bountyId = tags.find((/** @type {any} */ t) => Array.isArray(t) && t[0] === 'bountyId')?.[1] || '';
      const type = tags.find((/** @type {any} */ t) => Array.isArray(t) && t[0] === 'type')?.[1] || 'content_review';
      const reward = tags.find((/** @type {any} */ t) => Array.isArray(t) && t[0] === 'reward')?.[1] || '20pts';
      if (!bountyId || existingIds.has(String(bountyId))) return;

      /** @type {any} */
      let /** @type {any} */
content = {};
      try { content = JSON.parse(event.content || '{}'); } catch {}

      const pointsMatch = String(reward).match(/(\d+)\s*pts/i);
      const eonlMatch = String(reward).match(/\+(\d+)\s*eonl/i);
      const taskClass = BOUNTY_CLASSES.includes(type) ? type : 'content_review';

      this.state.tasks.push({
        id: String(bountyId),
        title: `Nostr bounty (${taskClass.replace('_', ' ')})`,
        taskClass,
        description: String(content.description || 'Discovered from Nostr relay'),
        rewardPoints: Math.max(5, Number(pointsMatch?.[1] || 20)),
        rewardEONL: Math.max(0, Number(eonlMatch?.[1] || 0)),
        createdBy: `nostr:${String(event.pubkey || '').slice(0, 12)}`,
        createdAt: Number(event.created_at || Math.floor(Date.now() / 1000)) * 1000,
        status: 'open',
        claimedBy: null,
        reviewedBy: null,
        approvedSubmissionId: null,
        source: 'nostr'
      });
      existingIds.add(String(bountyId));
      added += 1;
    });

    if (added > 0) this._persist();
    return { added };
  }
}

const bountyBoardService = new BountyBoardService();
export default bountyBoardService;
export { BOUNTY_CLASSES };
