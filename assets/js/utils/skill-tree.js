/**
 * Skill Tree Service (v1 Professional Tracks)
 * Tracks:
 * - Builder
 * - Creator
 * - Signal
 * - Moderator
 * Signals from existing logs:
 * - WorkBench mission history
 * - Moderation decisions and AI agreement
 */

const SKILL_TREE_KEY = 'eon:skill-tree:v1';
const HISTORY_KEY = 'eon:workbench:history:v1';
const MOD_DECISIONS_KEY = 'eon:mod:decisions:v1';
const appWin = /** @type {any} */ (window);

const /** @type {any} */
TRACKS = ['builder', 'creator', 'signal', 'moderator'];
const /** @type {any} */
LEVELS = [0, 100, 250, 500, 900, 1400];

// Badge milestones per level
const /** @type {any} */
BADGE_NAMES = {
  builder:   ['Spark', 'Assembler', 'Architect', 'Forge Master', 'Build Legend', 'Vanguard'],
  creator:   ['Sprout', 'Artisan', 'Storyteller', 'Voice', 'Luminary', 'EON Original'],
  signal:    ['Observer', 'Analyst', 'Scout', 'Intel Lead', 'Oracle', 'Signal Prime'],
  moderator: ['Rookie', 'Reviewer', 'Sentinel', 'Guardian', 'Arbiter', 'Grand Arbiter']
};

// Track accent colors for share cards
const /** @type {any} */
TRACK_COLORS = {
  builder:   { bg: '#0f172a', accent: '#6366f1', glow: '#818cf8' },
  creator:   { bg: '#0f172a', accent: '#ec4899', glow: '#f472b6' },
  signal:    { bg: '#0f172a', accent: '#06b6d4', glow: '#22d3ee' },
  moderator: { bg: '#0f172a', accent: '#10b981', glow: '#34d399' }
};

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(SKILL_TREE_KEY) || 'null');
    if (raw && typeof raw === 'object') return raw;
  } catch {}
  return {
    tracks: {
      builder: { xp: 0, events: 0, objectives: [] },
      creator: { xp: 0, events: 0, objectives: [] },
      signal: { xp: 0, events: 0, objectives: [] },
      moderator: { xp: 0, events: 0, objectives: [] }
    },
    ingested: { historyCount: 0, decisionsCount: 0 },
    updatedAt: 0
  };
}

function saveState(/** @type {any} */ state) {
  try { localStorage.setItem(SKILL_TREE_KEY, JSON.stringify(state)); } catch {}
}

function levelFromXp(/** @type {any} */ xp) {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i += 1) {
    if (xp >= LEVELS[i]) level = i + 1;
  }
  const nextIdx = Math.min(level, LEVELS.length - 1);
  const currentBase = LEVELS[level - 1] || 0;
  const nextBase = LEVELS[nextIdx] || currentBase;
  const span = Math.max(1, nextBase - currentBase);
  const progress = Math.max(0, Math.min(100, Math.round(((xp - currentBase) / span) * 100)));
  return { level, progress, nextXp: nextBase };
}

function safeArrayParse(/** @type {any} */ key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

class SkillTreeService {
  constructor() {
    this.state = loadState();
  }

  _persist() {
    this.state.updatedAt = Date.now();
    saveState(this.state);
  }

  _addXp(/** @type {any} */ track, /** @type {any} */ xp, /** @type {any} */ objective) {
    if (!TRACKS.includes(track)) return;
    const t = this.state.tracks[track];
    const prevLevel = levelFromXp(t.xp).level;
    t.xp += Math.max(0, xp);
    t.events += 1;
    if (objective && String(objective).trim()) {
      t.objectives.push({
        id: `obj-${Date.now()}-${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`,
        text: String(objective).trim(),
        ts: Date.now()
      });
      if (t.objectives.length > 40) t.objectives = t.objectives.slice(-40);
    }
    // Award Pool Points on level-up
    const newLevel = levelFromXp(t.xp).level;
    if (newLevel > prevLevel) {
      const bonusPts = newLevel * 50; // 50/100/150/200/250/300 per level
      try {
        if (appWin.EonPoolPoints?.awardPoints) {
          appWin.EonPoolPoints.awardPoints('mission-run', `Skill Tree level-up: ${track} reached level ${newLevel} (+${bonusPts} pts)`);
        } else {
          const raw = JSON.parse(localStorage.getItem('eon:pool-points:v2') || '{"total":0}');
          raw.total = (raw.total || 0) + bonusPts;
          localStorage.setItem('eon:pool-points:v2', JSON.stringify(raw));
        }
      } catch { /* never throw in addXp */ }
    }
  }

  ingestMissionHistory() {
    const history = safeArrayParse(HISTORY_KEY);
    if (history.length <= this.state.ingested.historyCount) return { added: 0 };

    const newRows = history.slice(this.state.ingested.historyCount);
    let added = 0;

    newRows.forEach((/** @type {any} */ row) => {
      const mode = String(row.mode || '').toLowerCase();
      if (mode === 'build' || mode === 'agent' || mode === 'hive') {
        this._addXp('builder', 14, `Mission completed in ${mode} mode`);
        added += 1;
      }
      if (mode === 'ask') {
        this._addXp('creator', 8, 'Drafting or ideation mission completed');
        added += 1;
      }
      if (mode === 'signal') {
        this._addXp('signal', 16, 'Signal analysis mission completed');
        added += 1;
      }
    });

    this.state.ingested.historyCount = history.length;
    this._persist();
    return { added };
  }

  ingestModerationSignals() {
    const decisions = safeArrayParse(MOD_DECISIONS_KEY);
    if (decisions.length <= this.state.ingested.decisionsCount) return { added: 0 };

    const newRows = decisions.slice(this.state.ingested.decisionsCount);
    let added = 0;

    newRows.forEach((/** @type {any} */ row) => {
      const base = row.aiAgreed ? 12 : 7;
      this._addXp('moderator', base, `Moderation decision: ${row.action || 'review'}`);
      if (row.aiAgreed) {
        this._addXp('moderator', 3, 'High-confidence moderation alignment');
      }
      added += 1;
    });

    this.state.ingested.decisionsCount = decisions.length;
    this._persist();
    return { added };
  }

  ingestEvent(/** @type {any} */ eventType, /** @type {any} */ payload = {}) {
    const type = String(eventType || '').toLowerCase();
    if (type === 'mission_run') {
      const mode = String(payload.mode || '').toLowerCase();
      if (mode === 'signal') this._addXp('signal', 12, 'Live mission signal run');
      else if (mode === 'build' || mode === 'agent' || mode === 'hive') this._addXp('builder', 10, 'Live mission build run');
      else this._addXp('creator', 6, 'Live mission ideation run');
      this._persist();
      return { success: true };
    }
    if (type === 'bounty_approved') {
      const taskClass = String(payload.taskClass || '');
      if (taskClass === 'research_summary') this._addXp('signal', 18, 'Bounty completed: research summary');
      if (taskClass === 'content_review') this._addXp('moderator', 16, 'Bounty completed: content review');
      if (taskClass === 'prompt_refinement') this._addXp('builder', 16, 'Bounty completed: prompt refinement');
      if (taskClass === 'translation') this._addXp('creator', 14, 'Bounty completed: translation');
      this._persist();
      return { success: true };
    }
    return { success: false, error: 'Unsupported event type' };
  }

  getSnapshot() {
    const /** @type {any} */
out = {};
    TRACKS.forEach((/** @type {any} */ track) => {
      const t = this.state.tracks[track];
      const level = levelFromXp(t.xp);
      (/** @type {any} */ (out))[track] = {
        xp: t.xp,
        events: t.events,
        level: level.level,
        progress: level.progress,
        nextXp: level.nextXp,
        recentObjectives: t.objectives.slice(-5).reverse()
      };
    });
    return {
      tracks: out,
      ingested: { ...this.state.ingested },
      updatedAt: this.state.updatedAt
    };
  }

  /**
   * Returns all earned badges for a track.
   * A badge is earned for each level threshold crossed.
   */
  getBadges(/** @type {any} */ track) {
    if (!TRACKS.includes(track)) return [];
    const t = this.state.tracks[track];
    const { level } = levelFromXp(t.xp);
    const /** @type {any} */
badges = [];
    const names = (/** @type {any} */ (BADGE_NAMES))[track] || [];
    for (let i = 0; i < level; i++) {
      badges.push({
        level: i + 1,
        name: names[i] || `Level ${i + 1}`,
        xpRequired: LEVELS[i] || 0,
        earnedAt: this.state.updatedAt || Date.now()
      });
    }
    return badges;
  }

  /**
   * Generate a share card PNG as a data URL using Canvas API.
   * Returns a Promise<{ dataUrl, filename }>.
   */
  async generateShareCard(/** @type {any} */ track) {
    if (!TRACKS.includes(track)) return null;

    const t = this.state.tracks[track];
    const { level, progress } = levelFromXp(t.xp);
    const badges = this.getBadges(track);
    const topBadge = badges[badges.length - 1]?.name || 'Beginner';
    const colors = (/** @type {any} */ (TRACK_COLORS))[track];

    const W = 480, H = 260;
    const /** @type {any} */
canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const /** @type {any} */
ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, W, H);

    // Accent top bar
    ctx.fillStyle = colors.accent;
    ctx.fillRect(0, 0, W, 6);

    // Glow circle
    const grd = ctx.createRadialGradient(60, 130, 0, 60, 130, 80);
    grd.addColorStop(0, colors.glow + '55');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 50, 160, 160);

    // Track name
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(track.toUpperCase() + ' TRACK', 24, 42);

    // Badge name (big)
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(topBadge, 24, 90);

    // Level
    ctx.fillStyle = colors.glow;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Level ${level}`, 24, 118);

    // XP
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText(`${t.xp.toLocaleString()} XP`, 24, 142);

    // Progress bar bg
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(24, 160, 280, 10, 5);
    ctx.fill();

    // Progress bar fill
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.roundRect(24, 160, Math.round(280 * (progress / 100)), 10, 5);
    ctx.fill();

    // Progress label
    ctx.fillStyle = '#64748b';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${progress}% to Level ${level + 1}`, 24, 188);

    // Missions completed
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${t.events} missions completed`, 24, 208);

    // Watermark
    ctx.fillStyle = colors.accent + 'aa';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('✦ Verified on EON', W - 140, H - 18);

    // EON brand
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('EON', W - 52, 42);

    const dataUrl = canvas.toDataURL('image/png');
    const filename = `eon-${track}-level${level}.png`;
    return { dataUrl, filename };
  }

  /**
   * Download the share card for a track, or trigger Web Share API.
   */
  async shareCard(/** @type {any} */ track) {
    const card = await this.generateShareCard(track);

    // Get referral link for current user
    let referralUrl = '';
    try {
      const profile = JSON.parse(localStorage.getItem('eon:profile') || 'null');
      if (profile?.id) {
        const { generateInviteLink } = await import('./referral-par.js');
        referralUrl = await generateInviteLink(profile);
      }
    } catch {}
    if (!referralUrl) referralUrl = window.location.origin + '/';

    const trackLabel = track[0].toUpperCase() + track.slice(1);
    const shareText = `Check out my EON ${trackLabel} Skill Card! Open EONAPP through this signed link → ${referralUrl}`;

    // Try Web Share API with referral link
    if (card) {
      try {
        const res = await fetch(card.dataUrl);
        const blob = await res.blob();
        const file = new File([blob], card.filename, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file], text: shareText })) {
          await navigator.share({ files: [file], title: `My EON ${trackLabel} Skill Card`, text: shareText, url: referralUrl });
          return;
        }
        if (navigator.share) {
          await navigator.share({ title: `My EON ${trackLabel} Skill Card`, text: shareText, url: referralUrl });
          return;
        }
      } catch (/** @type {any} */ err) {
        if (err?.name !== 'AbortError') console.warn('Share error:', err);
      }
    }

    // Fallback: copy share text + referral link to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      const /** @type {any} */
toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:1.3rem;left:50%;transform:translateX(-50%);z-index:99999;background:#6366f1;color:#fff;padding:.6rem 1.4rem;border-radius:.65rem;font-weight:600;font-size:.87rem;box-shadow:0 4px 20px rgba(0,0,0,.4);white-space:nowrap;';
      toast.textContent = '\u2705 Skill card + referral link copied!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } catch {
      if (card) {
        const /** @type {any} */
a = document.createElement('a');
        a.href = card.dataUrl;
        a.download = card.filename;
        a.click();
      }
    }
  }
}

const skillTreeService = new SkillTreeService();
export default skillTreeService;
export { TRACKS };
