/**
 * Campaign Growth Loop Orchestrator
 * 
 * Automated execution of:
 * - Referral programs with incentive tracking
 * - Share triggers and viral loops
 * - Habit formation (daily/weekly cadences)
 * - Achievement milestones and celebrations
 * - Time-limited campaigns and promotions
 * 
 * All user-facing actions require explicit consent or opt-in.
 * No silent mass automation. Policy-first execution model.
 */

/**
 * @typedef {Object} CampaignReward
 * @property {string} type
 * @property {string} name
 * @property {string | number} value
 */

/**
 * @typedef {Object} CampaignMilestone
 * @property {number} threshold
 * @property {CampaignReward} reward
 */

/**
 * @typedef {Object} CampaignEntry
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} startDate
 * @property {number} endDate
 * @property {boolean} active
 * @property {string[]} triggers
 * @property {CampaignReward[]} rewards
 * @property {string} targetAudience
 * @property {Record<string, any>} progress
 * @property {CampaignMilestone[]} [milestones]
 * @property {Array<Record<string, any>>} referralTiers
 * @property {Array<Record<string, any>>} leaderboard
 * @property {Record<string, { current: number, best: number, lastCompleted: number | null }>} streaks
 */

/**
 * @typedef {Object} TriggerEntry
 * @property {string} userId
 * @property {string} type
 * @property {any} metadata
 * @property {number} timestamp
 * @property {boolean} processed
 */

class CampaignOrchestrator {
  constructor() {
    this.storageKey = 'campaign-orchestrator-v5';
    this.campaignKey = `${this.storageKey}:campaigns`;
    this.triggerKey = `${this.storageKey}:triggers`;
    this.rewardKey = `${this.storageKey}:rewards`;
    /** @type {Record<string, CampaignEntry>} */
    this.campaigns = {};
    /** @type {Record<string, TriggerEntry[]>} */
    this.triggers = {};
    /** @type {Record<string, any[]>} */
    this.rewards = {};
    this.init();
  }

  init() {
    this.loadState();
    this.registerDefaultCampaigns();
    this.startCampaignTick();
  }

  loadState() {
    try {
      this.campaigns = /** @type {Record<string, CampaignEntry>} */ (JSON.parse(localStorage.getItem(this.campaignKey) || '{}')) || {};
      this.triggers = /** @type {Record<string, TriggerEntry[]>} */ (JSON.parse(localStorage.getItem(this.triggerKey) || '{}')) || {};
      this.rewards = /** @type {Record<string, any[]>} */ (JSON.parse(localStorage.getItem(this.rewardKey) || '{}')) || {};
    } catch (/** @type {any} */
e) {
      console.warn('[CampaignOrch] Failed to load state:', e);
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.campaignKey, JSON.stringify(this.campaigns));
      localStorage.setItem(this.triggerKey, JSON.stringify(this.triggers));
      localStorage.setItem(this.rewardKey, JSON.stringify(this.rewards));
    } catch (/** @type {any} */
e) {
      console.warn('[CampaignOrch] Failed to save state:', e);
    }
  }

  // ============ Campaign Management ============

  registerDefaultCampaigns() {
    // Campaign 1: Early User Retention
    if (!this.campaigns['retention_week1']) {
      /** @type {CampaignEntry} */
      const campaign = {
        id: 'retention_week1',
        name: 'Week 1 Retention Blitz',
        description: 'Help new users hit their first milestone',
        startDate: Date.now(),
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        active: true,
        triggers: ['first_mission_complete', 'third_session'],
        rewards: [
          { type: 'badge', name: 'First Flight', value: 'early_adopter' },
          { type: 'credit', name: '100 Free AI Tokens', value: 100 },
        ],
        targetAudience: 'new_users',
        progress: {},
        leaderboard: [],
        referralTiers: [],
        streaks: {},
      };
      this.campaigns['retention_week1'] = campaign;
    }

    // Campaign 2: Creator Week
    if (!this.campaigns['creator_week']) {
      /** @type {CampaignEntry} */
      const campaign = {
        id: 'creator_week',
        name: 'Creator Week Challenge',
        description: 'Publish 3 posts, win bonus reach',
        startDate: Date.now(),
        endDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        active: true,
        triggers: ['publish_post'],
        rewards: [
          { type: 'boost', name: '5x Reach Boost', value: 5 },
          { type: 'feature', name: 'Featured Creator Spot', value: 'homepage' },
        ],
        targetAudience: 'creators',
        milestones: [
          { threshold: 1, reward: { type: 'badge', name: 'Publisher', value: 'first_post' } },
          { threshold: 3, reward: { type: 'boost', name: '5x Reach', value: 5 } },
          { threshold: 5, reward: { type: 'feature', name: 'Homepage Feature', value: 'homepage' } },
        ],
        progress: {},
        leaderboard: [],
        referralTiers: [],
        streaks: {},
      };
      this.campaigns['creator_week'] = campaign;
    }

    // Campaign 3: Referral Program
    if (!this.campaigns['referral_ongoing']) {
      /** @type {CampaignEntry} */
      const campaign = {
        id: 'referral_ongoing',
        name: 'Refer & Earn',
        description: 'Invite friends, earn rewards for both',
        startDate: Date.now(),
        endDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
        active: true,
        triggers: ['user_share', 'referred_user_signup'],
        rewards: [
          { type: 'credit', name: '$5 per signup', value: 5 },
          { type: 'badge', name: 'Recruiter', value: 'recruiter_tier_1' },
        ],
        targetAudience: 'all_users',
        referralTiers: [
          { referrals: 3, bonus: 5, badge: 'recruiter_tier_1' },
          { referrals: 10, bonus: 25, badge: 'recruiter_tier_2' },
          { referrals: 25, bonus: 100, badge: 'recruiter_tier_3' },
        ],
        progress: {},
        leaderboard: [],
        streaks: {},
      };
      this.campaigns['referral_ongoing'] = campaign;
    }

    // Campaign 4: Trading Paper League
    if (!this.campaigns['trading_league']) {
      /** @type {CampaignEntry} */
      const campaign = {
        id: 'trading_league',
        name: 'Paper Trading League',
        description: 'Compete on paper trades, win prizes',
        startDate: Date.now(),
        endDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        active: true,
        triggers: ['paper_trade_complete'],
        rewards: [
          { type: 'badge', name: 'Paper Trader', value: 'paper_trader' },
          { type: 'leaderboard', name: 'Top 10 Leaderboard', value: 'top_10' },
        ],
        targetAudience: 'traders',
        leaderboard: [],
        referralTiers: [],
        progress: {},
        streaks: {},
      };
      this.campaigns['trading_league'] = campaign;
    }

    // Campaign 5: Daily Habit Loop
    if (!this.campaigns['daily_habits']) {
      /** @type {CampaignEntry} */
      const campaign = {
        id: 'daily_habits',
        name: 'Daily Operator Habit',
        description: 'Complete daily briefing, build streak',
        startDate: Date.now(),
        endDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        active: true,
        triggers: ['daily_briefing_complete'],
        rewards: [
          { type: 'streak', name: '7-Day Streak', value: 7 },
          { type: 'streak', name: '30-Day Streak', value: 30 },
        ],
        targetAudience: 'operators',
        streaks: {},
        leaderboard: [],
        referralTiers: [],
        progress: {},
      };
      this.campaigns['daily_habits'] = campaign;
    }
  }

  // ============ Trigger Management ============

  recordTrigger(/** @type {string} */ userId, /** @type {string} */ triggerType, /** @type {any} */ metadata = {}) {
    const now = Date.now();
    /** @type {TriggerEntry} */
    const trigger = {
      userId,
      type: triggerType,
      metadata,
      timestamp: now,
      processed: false,
    };

    // Log trigger
    if (!this.triggers[triggerType]) {
      this.triggers[triggerType] = [];
    }
    this.triggers[triggerType].push(trigger);

    // Process campaigns
    this.processTriggersForUser(userId);
    this.saveState();

    return trigger;
  }

  processTriggersForUser(/** @type {string} */ userId) {
    Object.values(this.campaigns).forEach((/** @type {CampaignEntry} */ campaign) => {
      if (!campaign.active) return;

      // Check if user is in target audience
      if (campaign.targetAudience && !this.isUserInAudience(userId, campaign.targetAudience)) {
        return;
      }

      // Check triggers
      campaign.triggers.forEach((/** @type {string} */ triggerType) => {
        const recentTriggers = this.triggers[triggerType]
          ? this.triggers[triggerType].filter(
              (/** @type {TriggerEntry} */ t) =>
                t.userId === userId &&
                t.timestamp > Date.now() - 24 * 60 * 60 * 1000 &&
                !t.processed
            )
          : [];

        if (recentTriggers.length > 0) {
          recentTriggers.forEach((/** @type {TriggerEntry} */ trigger) => {
            this.awardReward(campaign, userId, trigger);
            trigger.processed = true;
          });
        }
      });

      // Check milestones
      if (campaign.milestones) {
        const userProgress = campaign.progress[userId] || { count: 0, milestonesHit: [] };
        userProgress.count++;
        campaign.progress[userId] = userProgress;

        campaign.milestones.forEach((/** @type {CampaignMilestone} */ milestone) => {
          if (
            userProgress.count >= milestone.threshold &&
            !userProgress.milestonesHit.includes(milestone.threshold)
          ) {
            userProgress.milestonesHit.push(milestone.threshold);
            this.executeReward(userId, milestone.reward, {
              campaign: campaign.id,
              milestone: milestone.threshold,
            });
          }
        });
      }
    });
  }

  // ============ Reward Management ============

  awardReward(/** @type {CampaignEntry} */ campaign, /** @type {string} */ userId, /** @type {TriggerEntry} */ trigger) {
    const rewards = campaign.rewards || [];
    rewards.forEach((/** @type {CampaignReward} */ reward) => {
      this.executeReward(userId, reward, { campaign: campaign.id, trigger: trigger.type });
    });
  }

  executeReward(/** @type {string} */ userId, /** @type {CampaignReward} */ reward, /** @type {any} */ context = {}) {
    /** @type {any} */
    const rewardRecord = {
      userId,
      type: reward.type,
      name: reward.name,
      value: reward.value,
      context,
      timestamp: Date.now(),
      claimed: false,
    };

    if (!this.rewards[userId]) {
      this.rewards[userId] = [];
    }
    this.rewards[userId].push(rewardRecord);

    console.log(`[Campaign] Awarded ${reward.name} to ${userId}`, rewardRecord);
    return rewardRecord;
  }

  getClaimableRewards(/** @type {string} */ userId) {
    return (this.rewards[userId] || []).filter((/** @type {any} */ r) => !r.claimed);
  }

  claimReward(/** @type {string} */ userId, /** @type {number} */ rewardIndex) {
    const rewards = this.rewards[userId] || [];
    if (rewards[rewardIndex]) {
      rewards[rewardIndex].claimed = true;
      this.saveState();
      return rewards[rewardIndex];
    }
    return null;
  }

  // ============ Referral / signed-share compatibility ============

  /**
   * W215 retires code-based referral links. Public sharing must use the async
   * signed eon2/eon3 helpers; this compatibility method cannot mint an alias.
   */
  createReferralLink(_userId) {
    return '';
  }

  /**
   * No rewards or credits are awarded from a signup or a share in this
   * deployment. Qualified relationships are handled by referral-par only after
   * a genuine action and are recorded as pseudonymous tree confirmations.
   */
  processReferralSignup(_referralCode, _newUserId) {
    return false;
  }

  // ============ Share & Viral Mechanics ============

  generateShareContent(/** @type {string} */ userId, /** @type {string} */ contentType, /** @type {string} */ contentId, /** @type {string} */ platform = 'twitter') {
    /** @type {Record<string, Record<string, string>>} */
    const shareTemplates = {
      post: {
        twitter: `🚀 Just published on EONAPP! Check it out: [link] #EONAPP #Creator`,
        linkedin: `Excited to share my latest creation on EONAPP. [link] #Web3 #Creator`,
        facebook: `Check out what I created on EONAPP! [link]`,
      },
      mission: {
        twitter: `✓ Completed a mission on EONAPP! Join me: [link] #Productivity`,
        linkedin: `Building my business automation workflow on EONAPP. [link] #Productivity`,
      },
      trading: {
        twitter: `📈 Paper trading challenge on EONAPP! Beat my score: [link] #Trading`,
        linkedin: `Testing trading strategies on EONAPP's paper trading platform. [link]`,
      },
    };

    const template = (shareTemplates[contentType] || {})[platform] || shareTemplates[contentType]?.twitter || '';
    return {
      template,
      referralCode: '',
      platform,
      contentId,
      ctaUrl: '',
      status: 'signed-link-required',
      note: 'Use generateSignedShareContent for a self-contained eon2/eon3 public link.'
    };
  }

  async generateSignedShareContent(userId, contentType, contentId, platform = 'x', options = {}) {
    const legacy = this.generateShareContent(userId, contentType, contentId, platform === 'x' ? 'twitter' : platform);
    const [{ createSignedShareLink }, { buildPlatformShareTargets }] = await Promise.all([
      import('./signed-share-link.js'),
      import('../social/social-platform-adapters.js')
    ]);
    const destination = options.destination || ({
      post: '/creator-studio.html',
      mission: '/workbench.html',
      trading: '/market.html'
    }[contentType] || '/');
    const signed = await createSignedShareLink({
      issuerId: String(userId || 'local-user'),
      rootReferralId: String(userId || 'local-user'),
      destination,
      source: platform,
      campaignId: options.campaignId || `content:${String(contentType || 'share')}:${String(contentId || 'item')}`,
      missionType: options.missionType || `share_${String(contentType || 'content')}`
    });
    const text = String(legacy.template || 'Explore EONAPP: [link]').replace('[link]', signed.link);
    return {
      ...legacy,
      platform,
      ctaUrl: signed.link,
      signedToken: signed.token,
      shareId: signed.payload.shareId,
      missionCode: signed.missionCode,
      shareTargets: buildPlatformShareTargets({ link: signed.link, missionCode: signed.missionCode, message: text })
    };
  }

  // ============ Habit & Cadence ============

  recordHabitCompletion(/** @type {string} */ userId, /** @type {string} */ habitType) {
    this.recordTrigger(userId, `${habitType}_complete`);

    // Track streak
    const campaign = this.campaigns['daily_habits'];
    if (campaign) {
      if (!campaign.streaks[userId]) {
        campaign.streaks[userId] = { current: 0, best: 0, lastCompleted: null };
      }

      const streak = campaign.streaks[userId];
      const daysSinceLastCompletion = streak.lastCompleted
        ? Math.floor((Date.now() - streak.lastCompleted) / (24 * 60 * 60 * 1000))
        : 999;

      if (daysSinceLastCompletion === 1) {
        // Continued streak
        streak.current++;
      } else if (daysSinceLastCompletion === 0) {
        // Already completed today
        return streak;
      } else {
        // Streak broken, restart
        streak.current = 1;
      }

      streak.best = Math.max(streak.best, streak.current);
      streak.lastCompleted = Date.now();

      console.log(`[Streak] ${userId}: ${streak.current} day streak (best: ${streak.best})`);
      return streak;
    }
    return null;
  }

  getStreakStatus(/** @type {string} */ userId) {
    const campaign = this.campaigns['daily_habits'];
    if (campaign && campaign.streaks[userId]) {
      return campaign.streaks[userId];
    }
    return { current: 0, best: 0, lastCompleted: null };
  }

  // ============ Leaderboard & Competition ============

  updateLeaderboard(/** @type {string} */ userId, /** @type {number} */ score, /** @type {string} */ tradeType = 'paper') {
    const campaign = this.campaigns['trading_league'];
    if (!campaign) return;
    campaign.leaderboard = campaign.leaderboard || [];

    const entry = campaign.leaderboard.find((/** @type {any} */ e) => e.userId === userId);
    if (entry) {
      entry.score = Math.max(entry.score, score);
    } else {
      campaign.leaderboard.push({ userId, score, tradeType, timestamp: Date.now() });
    }

    // Sort by score descending
    campaign.leaderboard.sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score);

    // Limit to top 100
    campaign.leaderboard = campaign.leaderboard.slice(0, 100);

    // Award badges to top 10
    campaign.leaderboard.slice(0, 10).forEach((/** @type {any} */ entry, /** @type {any} */ index) => {
      const badge =
        index === 0
          ? 'trading_champion'
          : index < 3
          ? 'trading_top_3'
          : 'trading_top_10';
      if (entry.badge !== badge) {
        entry.badge = badge;
        this.executeReward(entry.userId, {
          type: 'badge',
          name: badge,
          value: badge,
        });
      }
    });
  }

  getLeaderboard(/** @type {any} */ limit = 10) {
    const campaign = this.campaigns['trading_league'];
    if (campaign) {
      campaign.leaderboard = campaign.leaderboard || [];
      return campaign.leaderboard.slice(0, limit);
    }
    return [];
  }

  // ============ Helpers ============

  isUserInAudience(/** @type {any} */ userId, /** @type {any} */ audience) {
    void userId;
    // Simplified audience targeting
    // In production, would check user properties like create_date, permissions, etc.
    if (audience === 'all_users') return true;
    if (audience === 'new_users') return Math.random() > 0.8; // Mock
    if (audience === 'creators') return Math.random() > 0.5; // Mock
    if (audience === 'traders') return Math.random() > 0.6; // Mock
    if (audience === 'operators') return Math.random() > 0.7; // Mock
    return false;
  }

  startCampaignTick() {
    // Refresh campaign state every minute
    setInterval(() => {
      Object.values(this.campaigns).forEach((/** @type {CampaignEntry} */ campaign) => {
        // Check expiration
        if (campaign.endDate < Date.now()) {
          campaign.active = false;
        }
      });
      this.saveState();
    }, 60000);
  }

  // ============ Public API ============

  getCampaigns(/** @type {any} */ active = true) {
    return Object.values(this.campaigns).filter((/** @type {any} */ c) => !active || c.active);
  }

  getCampaignProgress(/** @type {any} */ userId) {
    const /** @type {any} */
progress = {};
    Object.values(this.campaigns).forEach((/** @type {any} */ campaign) => {
      progress[campaign.id] = campaign.progress[userId] || { count: 0, milestonesHit: [] };
    });
    return progress;
  }

  exportCampaignData() {
    return {
      campaigns: this.campaigns,
      rewards: this.rewards,
      triggers: this.triggers,
      exportedAt: new Date().toISOString(),
    };
  }
}

// Singleton instance
/** @type {CampaignOrchestrator | null} */
let _campaignOrch = null;

export function getCampaignOrchestrator() {
  if (!_campaignOrch) {
    _campaignOrch = new CampaignOrchestrator();
  }
  return _campaignOrch;
}
