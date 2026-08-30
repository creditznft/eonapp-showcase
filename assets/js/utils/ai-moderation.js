/**
 * AI Moderation Service — EONAPP.CH Edition
 * ===========================================
 * Adapted from eonpackage/src/platforms/Community_Platform_Enhanced_V5.tsx
 * and eonpackage/src/platforms/AIHiveMindService_V5.ts
 * for vanilla JS, localStorage-first persistence, and EONAPP Pool Points.
 *
 * AI-assisted content moderation with wallet-backed fee debits.
 * Users earn Pool Points for moderation actions. AI reviews content
 * and suggests moderation actions. Human moderators verify and earn.
 *
 * MODERATION FLOW:
 *   1. Content submitted -> AI pre-review (auto-flag or pass)
 *   2. Flagged content enters moderation queue
 *   3. Human moderators review -> approve, reject, or escalate
 *   4. Moderators earn Pool Points for accurate reviews
 *   5. AI learns from moderator decisions -> improves over time
 *
 * @module utils/ai-moderation
 */

// -- Storage keys --
const QUEUE_KEY = 'eon:mod:queue:v1';
const DECISIONS_KEY = 'eon:mod:decisions:v1';
const MODERATORS_KEY = 'eon:mod:moderators:v1';
const STATS_KEY = 'eon:mod:stats:v1';
const RULES_KEY = 'eon:mod:rules:v1';
const appWin = /** @type {any} */ (window);

// -- Content categories --
export const /** @type {any} */
CONTENT_CATEGORIES = {
  spam: { label: 'Spam', severity: 'low', autoAction: 'flag' },
  harassment: { label: 'Harassment', severity: 'high', autoAction: 'quarantine' },
  hate_speech: { label: 'Hate Speech', severity: 'critical', autoAction: 'quarantine' },
  nsfw: { label: 'NSFW', severity: 'medium', autoAction: 'flag' },
  misinformation: { label: 'Misinformation', severity: 'medium', autoAction: 'flag' },
  impersonation: { label: 'Impersonation', severity: 'medium', autoAction: 'flag' },
  scam: { label: 'Scam / Phishing', severity: 'high', autoAction: 'quarantine' },
  copyright: { label: 'Copyright Violation', severity: 'medium', autoAction: 'flag' },
  violence: { label: 'Violence / Threats', severity: 'critical', autoAction: 'quarantine' },
  acceptable: { label: 'Acceptable', severity: 'none', autoAction: 'pass' }
};

// -- Moderation actions --
export const /** @type {any} */
MOD_ACTIONS = {
  pass: { label: 'Pass', points: 1, description: 'Content is acceptable' },
  flag: { label: 'Flag', points: 3, description: 'Flag for further review' },
  warn: { label: 'Warn', points: 5, description: 'Issue warning to author' },
  quarantine: { label: 'Quarantine', points: 8, description: 'Hide content pending review' },
  remove: { label: 'Remove', points: 10, description: 'Remove content from platform' },
  ban: { label: 'Ban', points: 25, description: 'Ban user from platform' }
};

// -- Pool Points earning rates for moderation --
const /** @type {any} */
MOD_POINT_RATES = {
  'mod-review-accurate': 15,    // Accurate review (matches AI or consensus)
  'mod-review-fast': 5,        // Review within 5 minutes of flag
  'mod-review-appeal': 10,      // Process an appeal correctly
  'mod-streak-day': 20,         // Daily moderation streak
  'mod-ai-agreement': 3,        // AI and human agree (confidence signal)
  'mod-first-review': 25,       // First ever review
  'mod-batch-10': 40,           // Complete batch of 10 reviews
  'mod-batch-50': 150,          // Complete batch of 50 reviews
  'mod-accuracy-bonus': 50      // 95%+ accuracy over 100 reviews
};

// -- Helpers --
function cryptoId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, /** @type {any} */ b => b.toString(16).padStart(2, '0')).join('');
}

function loadJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function saveJson(/** @type {any} */ key, /** @type {any} */ value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// -- Service class --
class AIModerationService {
  constructor() {
    /** @type {any[]} */
    this.queue = [];
    /** @type {any[]} */
    this.decisions = [];
    this.moderators = new Map();
    this.stats = {
      totalReviewed: 0,
      totalFlagged: 0,
      totalRemoved: 0,
      totalPassed: 0,
      avgResponseTimeMs: 0,
      accuracyRate: 0,
      aiAgreementRate: 0
    };
    /** @type {any[]} */
    this.rules = [];
    this._hydrate();
  }

  // -- Content submission for review --
  submitForReview(/** @type {any} */ content) {
    if (!content || !content.text) return { success: false, error: 'Content text required' };

    const itemId = `mod-${cryptoId()}`;
    const aiResult = this._aiPreReview(content.text);

    const /** @type {any} */
item = {
      id: itemId,
      text: content.text,
      authorId: content.authorId || 'anonymous',
      source: content.source || 'community',
      submittedAt: Date.now(),
      aiReview: aiResult,
      status: aiResult.action === 'pass' ? 'auto-approved' : 'pending',
      assignedModerator: null,
      humanDecision: null,
      appealStatus: null,
      metadata: content.metadata || {}
    };

    // Only add to queue if AI flagged it
    if (aiResult.action !== 'pass') {
      this.queue.push(item);
      this.stats.totalFlagged++;
    } else {
      this.stats.totalPassed++;
    }

    this._persist();
    return { success: true, itemId, aiAction: aiResult.action, aiCategory: aiResult.category };
  }

  // -- AI pre-review --
  _aiPreReview(/** @type {any} */ text) {
    // Simple rule-based AI pre-review (can be enhanced with LLM integration)
    const lower = text.toLowerCase();
    const /** @type {any} */
signals = [];

    // Spam signals
    if (/(buy now|click here|free money|crypto giveaway|limited offer|act now)/i.test(lower)) {
      signals.push({ category: 'spam', confidence: 0.7 });
    }

    // Scam signals
    if (/(send me.*eth|wallet drain|private key|seed phrase|double your)/i.test(lower)) {
      signals.push({ category: 'scam', confidence: 0.85 });
    }

    // Harassment signals
    if (/(you are stupid|kill yourself|nobody likes you|go away forever)/i.test(lower)) {
      signals.push({ category: 'harassment', confidence: 0.6 });
    }

    // Hate speech signals
    if (/(hate all|superior race|inferior race|ethnic cleansing)/i.test(lower)) {
      signals.push({ category: 'hate_speech', confidence: 0.8 });
    }

    // Violence signals
    if (/(going to kill|bomb|shoot up|stab|murder plan)/i.test(lower)) {
      signals.push({ category: 'violence', confidence: 0.9 });
    }

    // NSFW signals
    if (/(nsfw|porn|xxx|nude|explicit content)/i.test(lower)) {
      signals.push({ category: 'nsfw', confidence: 0.5 });
    }

    // No signals = pass
    if (signals.length === 0) {
      return { category: 'acceptable', confidence: 0.9, action: 'pass', reasoning: 'No policy violations detected' };
    }

    // Take highest confidence signal
    signals.sort((/** @type {any} */ a, /** @type {any} */ b) => b.confidence - a.confidence);
    const top = signals[0];
    const catInfo = (/** @type {any} */ (CONTENT_CATEGORIES))[String(top.category || 'spam')] || CONTENT_CATEGORIES.spam;

    return {
      category: top.category,
      confidence: top.confidence,
      action: catInfo.autoAction,
      reasoning: `AI detected ${catInfo.label} content (confidence: ${Math.round(top.confidence * 100)}%)`
    };
  }

  // -- Human moderation --
  reviewItem(/** @type {any} */ itemId, /** @type {any} */ moderatorId, /** @type {any} */ decision, /** @type {any} */ notes) {
    const item = this.queue.find(/** @type {any} */ i => i.id === itemId);
    if (!item) return { success: false, error: 'Item not found in queue' };

    const actionInfo = (/** @type {any} */ (MOD_ACTIONS))[decision];
    if (!actionInfo) return { success: false, error: 'Invalid decision action' };

    const reviewTime = Date.now() - item.submittedAt;
    const aiAgreed = item.aiReview.action === decision || (item.aiReview.category === 'acceptable' && decision === 'pass');

    item.humanDecision = {
      action: decision,
      moderatorId,
      notes: notes || '',
      reviewedAt: Date.now(),
      reviewTimeMs: reviewTime,
      aiAgreed
    };
    item.assignedModerator = moderatorId;
    item.status = 'reviewed';

    // Record decision
    this.decisions.push({
      itemId,
      moderatorId,
      action: decision,
      aiCategory: item.aiReview.category,
      aiAgreed,
      reviewTimeMs: reviewTime,
      timestamp: Date.now()
    });

    // Remove from queue
    this.queue = this.queue.filter(/** @type {any} */ i => i.id !== itemId);

    // Update stats
    this.stats.totalReviewed++;
    if (['remove', 'ban'].includes(decision)) this.stats.totalRemoved++;
    if (reviewTime < 5 * 60 * 1000) {
      // Fast review bonus
    }

    // Award Pool Points
    this._awardModerationPoints(moderatorId, decision, aiAgreed, reviewTime);

    // Update moderator stats
    this._updateModeratorStats(moderatorId, decision, aiAgreed, reviewTime);

    this._persist();
    return { success: true, pointsEarned: actionInfo.points, aiAgreed };
  }

  // -- Appeal handling --
  submitAppeal(/** @type {any} */ itemId, /** @type {any} */ reason) {
    const item = this.decisions.find(/** @type {any} */ d => d.itemId === itemId);
    if (!item) return { success: false, error: 'Decision not found' };

    // Add back to queue for re-review
    this.queue.push({
      id: `appeal-${cryptoId()}`,
      text: `APPEAL for ${itemId}: ${reason}`,
      authorId: 'appeal',
      source: 'appeal',
      submittedAt: Date.now(),
      aiReview: { category: 'acceptable', confidence: 0.5, action: 'flag', reasoning: 'Appeal requires human review' },
      status: 'pending',
      assignedModerator: null,
      humanDecision: null,
      appealStatus: 'pending',
      metadata: { originalItemId: itemId }
    });

    this._persist();
    return { success: true };
  }

  // -- Queue management --
  getQueue(/** @type {any} */ limit) {
    return this.queue.filter(/** @type {any} */ i => i.status === 'pending').slice(0, limit || 20);
  }

  getQueueSize() {
    return this.queue.filter(/** @type {any} */ i => i.status === 'pending').length;
  }

  // -- Moderator management --
  registerModerator(/** @type {any} */ userId) {
    if (this.moderators.has(userId)) return { success: true };

    this.moderators.set(userId, {
      userId,
      totalReviews: 0,
      accurateReviews: 0,
      accuracyRate: 0,
      avgResponseTimeMs: 0,
      streak: 0,
      lastReviewAt: 0,
      registeredAt: Date.now(),
      tier: 'trainee' // trainee -> reviewer -> senior -> lead
    });
    this._persist();
    return { success: true };
  }

  getModeratorStats(/** @type {any} */ userId) {
    return this.moderators.get(userId);
  }

  getLeaderboard(/** @type {any} */ limit) {
    return Array.from(this.moderators.values())
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.accuracyRate !== a.accuracyRate ? b.accuracyRate - a.accuracyRate : b.totalReviews - a.totalReviews)
      .slice(0, limit || 10);
  }

  // -- Stats --
  getStats() {
    const decisions = this.decisions;
    const total = decisions.length;
    const aiAgreed = decisions.filter(/** @type {any} */ d => d.aiAgreed).length;

    return {
      ...this.stats,
      accuracyRate: total > 0 ? Math.round((this.stats.totalReviewed > 0 ? (decisions.filter(/** @type {any} */ d => d.aiAgreed).length / total) * 100 : 0)) : 0,
      aiAgreementRate: total > 0 ? Math.round((aiAgreed / total) * 100) : 0,
      pendingInQueue: this.getQueueSize()
    };
  }

  // -- Private --
  _awardModerationPoints(/** @type {any} */ _moderatorId, /** @type {any} */ decision, /** @type {any} */ aiAgreed, /** @type {any} */ reviewTimeMs) {
    const actionInfo = (/** @type {any} */ (MOD_ACTIONS))[decision];
    let totalPoints = actionInfo.points;

    // AI agreement bonus
    if (aiAgreed) totalPoints += MOD_POINT_RATES['mod-ai-agreement'];

    // Fast review bonus
    if (reviewTimeMs < 5 * 60 * 1000) totalPoints += MOD_POINT_RATES['mod-review-fast'];

    // Accurate review bonus (AI agreed = proxy for accuracy)
    if (aiAgreed) totalPoints += MOD_POINT_RATES['mod-review-accurate'];

    // Award via Pool Points system
    if (appWin.EonPoolPoints?.awardPoints) {
      appWin.EonPoolPoints.awardPoints('mod-review-accurate', `Moderation review: ${actionInfo.label} (+${totalPoints} pts)`);
    }

    return totalPoints;
  }

  _updateModeratorStats(/** @type {any} */ moderatorId, /** @type {any} */ _decision, /** @type {any} */ aiAgreed, /** @type {any} */ reviewTimeMs) {
    let mod = this.moderators.get(moderatorId);
    if (!mod) {
      this.registerModerator(moderatorId);
      mod = this.moderators.get(moderatorId);
    }

    mod.totalReviews++;
    if (aiAgreed) mod.accurateReviews++;
    mod.accuracyRate = Math.round((mod.accurateReviews / mod.totalReviews) * 100);
    mod.avgResponseTimeMs = Math.round((mod.avgResponseTimeMs * (mod.totalReviews - 1) + reviewTimeMs) / mod.totalReviews);
    mod.lastReviewAt = Date.now();

    // Streak tracking
    const today = new Date().toISOString().slice(0, 10);
    const lastDay = new Date(mod.lastReviewAt).toISOString().slice(0, 10);
    if (today === lastDay) {
      mod.streak++;
    } else {
      mod.streak = 1;
    }

    // Tier progression
    if (mod.totalReviews >= 500 && mod.accuracyRate >= 95) mod.tier = 'lead';
    else if (mod.totalReviews >= 100 && mod.accuracyRate >= 90) mod.tier = 'senior';
    else if (mod.totalReviews >= 20 && mod.accuracyRate >= 80) mod.tier = 'reviewer';
    else mod.tier = 'trainee';
  }

  _hydrate() {
    this.queue = loadJson(QUEUE_KEY, []);
    this.decisions = loadJson(DECISIONS_KEY, []);
    this.stats = loadJson(STATS_KEY, this.stats);
    this.rules = loadJson(RULES_KEY, []);

    const modMap = loadJson(MODERATORS_KEY, {});
    for (const [id, mod] of Object.entries(modMap)) {
      if (mod && typeof mod === 'object') this.moderators.set(id, mod);
    }
  }

  _persist() {
    saveJson(QUEUE_KEY, this.queue.slice(-200));
    saveJson(DECISIONS_KEY, this.decisions.slice(-500));
    saveJson(STATS_KEY, this.stats);
    saveJson(RULES_KEY, this.rules);

    const modObj = /** @type {Record<string, any>} */ ({});
    for (const [id, mod] of this.moderators.entries()) modObj[id] = mod;
    saveJson(MODERATORS_KEY, modObj);
  }
}

// -- Singleton --
const aiModerationService = new AIModerationService();
export default aiModerationService;
export { AIModerationService };
