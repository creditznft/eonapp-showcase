/**
 * EON Constitution Service (v1)
 * User-defined rule engine that governs Twin and WorkBench actions.
 * Rule enforcement modes:
 *   hard_block  — action is rejected with an error
 *   soft_warn   — action proceeds but shows a warning
 *   log_only    — action proceeds, event is silently logged
 *
 * Rule categories:
 *   financial, content, privacy, work, values
 */

const CONSTITUTION_KEY = 'eon:constitution:v1';
const CONSTITUTION_LOG_KEY = 'eon:constitution:log:v1';

const /** @type {any} */
RULE_CATEGORIES = ['financial', 'content', 'privacy', 'work', 'values'];
const /** @type {any} */
ENFORCEMENT_MODES = ['hard_block', 'soft_warn', 'log_only'];

function loadConstitution() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONSTITUTION_KEY) || 'null');
    if (raw && Array.isArray(raw.rules)) return raw;
  } catch {}
  return { rules: [], version: 1, updatedAt: 0 };
}

function saveConstitution(/** @type {any} */ state) {
  try {
    state.updatedAt = Date.now();
    localStorage.setItem(CONSTITUTION_KEY, JSON.stringify(state));
  } catch {}
}

function loadLog() {
  try {
    const raw = JSON.parse(localStorage.getItem(CONSTITUTION_LOG_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function saveLog(/** @type {any} */ log) {
  try { localStorage.setItem(CONSTITUTION_LOG_KEY, JSON.stringify(log)); } catch {}
}

function makeId(/** @type {any} */ prefix) {
  return `${prefix}-${Date.now()}-${crypto.getRandomValues(new Uint8Array(3)).reduce((/** @type {any} */ s,/** @type {any} */ b)=>s+b.toString(36).padStart(2,'0'),'')}`;
}

class EONConstitutionService {
  constructor() {
    this.state = loadConstitution();
    this.log = loadLog();
    if (this.state.rules.length === 0) {
      this._seedDefaults();
    }
  }

  _seedDefaults() {
    const /** @type {any} */
defaults = [
      {
        category: 'financial',
        text: 'Never approve or execute any action that moves, transfers, or references funds, tokens, or wallets.',
        enforcement: 'hard_block'
      },
      {
        category: 'content',
        text: 'Do not generate content that promotes hatred, violence, or illegal activity.',
        enforcement: 'hard_block'
      },
      {
        category: 'privacy',
        text: 'Do not share, store, or request personally identifiable information without explicit consent.',
        enforcement: 'hard_block'
      },
      {
        category: 'work',
        text: 'All autonomous Twin tasks must have explicit human approval before execution.',
        enforcement: 'hard_block'
      },
      {
        category: 'values',
        text: 'Prefer local AI providers over cloud when the task is equivalent in quality.',
        enforcement: 'soft_warn'
      }
    ];
    defaults.forEach((/** @type {any} */ d) => this.createRule(d.category, d.text, d.enforcement));
  }

  _persist() {
    saveConstitution(this.state);
  }

  _appendLog(/** @type {any} */ entry) {
    this.log.push({ id: makeId('clog'), ts: Date.now(), ...entry });
    if (this.log.length > 500) this.log = this.log.slice(-500);
    saveLog(this.log);
  }

  /**
   * Create a new constitution rule.
   */
  createRule(/** @type {any} */ category, /** @type {any} */ text, /** @type {any} */ enforcement = 'soft_warn') {
    if (!RULE_CATEGORIES.includes(category)) {
      return { success: false, error: `Invalid category. Use: ${RULE_CATEGORIES.join(', ')}` };
    }
    if (!ENFORCEMENT_MODES.includes(enforcement)) {
      return { success: false, error: `Invalid enforcement. Use: ${ENFORCEMENT_MODES.join(', ')}` };
    }
    const trimmed = String(text || '').trim();
    if (!trimmed) return { success: false, error: 'Rule text is required.' };

    const /** @type {any} */
rule = {
      id: makeId('rule'),
      category,
      text: trimmed,
      enforcement,
      active: true,
      createdAt: Date.now()
    };
    this.state.rules.push(rule);
    this._persist();
    return { success: true, rule };
  }

  /**
   * Update an existing rule.
   */
  updateRule(/** @type {any} */ ruleId, /** @type {any} */ updates = {}) {
    const rule = this.state.rules.find((/** @type {any} */ r) => r.id === ruleId);
    if (!rule) return { success: false, error: 'Rule not found.' };

    if (updates.text !== undefined) rule.text = String(updates.text || '').trim();
    if (updates.enforcement !== undefined && ENFORCEMENT_MODES.includes(updates.enforcement)) {
      rule.enforcement = updates.enforcement;
    }
    if (updates.active !== undefined) rule.active = Boolean(updates.active);
    rule.updatedAt = Date.now();

    this._persist();
    return { success: true, rule };
  }

  /**
   * Delete a rule by ID.
   */
  deleteRule(/** @type {any} */ ruleId) {
    const before = this.state.rules.length;
    this.state.rules = this.state.rules.filter((/** @type {any} */ r) => r.id !== ruleId);
    if (this.state.rules.length === before) return { success: false, error: 'Rule not found.' };
    this._persist();
    return { success: true };
  }

  /**
   * Check an action text against all active constitution rules.
   * Returns { allowed, warnings, violations, blocked }.
   */
  checkAction(/** @type {any} */ actionText, /** @type {any} */ category = null) {
    const text = String(actionText || '').toLowerCase();
    const activeRules = this.state.rules.filter((/** @type {any} */ r) => r.active);
    const relevantRules = category ? activeRules.filter((/** @type {any} */ r) => r.category === category) : activeRules;

    const financialRiskMatch = /(transfer|send|withdraw|swap|buy|sell|stake|bridge|payment|invoice|wallet|treasury|fund|funds|token)/i.test(text);
    if (financialRiskMatch) {
      const financialRule = relevantRules.find((/** @type {any} */ r) => r.category === 'financial' && r.enforcement === 'hard_block');
      if (financialRule) {
        this._appendLog({ type: 'hard_block', ruleId: financialRule.id, action: String(actionText || '').slice(0, 200), reason: 'financial_risk_keyword' });
        return {
          allowed: false,
          blocked: true,
          violations: [{ id: financialRule.id, category: financialRule.category, text: financialRule.text }],
          warnings: []
        };
      }
    }

    /** @type {any[]} */
    const /** @type {any} */
violations = [];
    /** @type {any[]} */
    const /** @type {any} */
warnings = [];

    relevantRules.forEach((/** @type {any} */ rule) => {
      // Simple keyword matching: split rule into key phrases and check
      const keywords = rule.text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((/** @type {any} */ w) => w.length > 4);

      const matchedKeywords = keywords.filter((/** @type {any} */ kw) => text.includes(kw));
      if (matchedKeywords.length >= 2) {
        if (rule.enforcement === 'hard_block') violations.push(rule);
        if (rule.enforcement === 'soft_warn') warnings.push(rule);
        if (rule.enforcement === 'log_only') {
          this._appendLog({ type: 'log_only', ruleId: rule.id, action: actionText.slice(0, 200) });
        }
      }
    });

    if (violations.length > 0) {
      violations.forEach((/** @type {any} */ r) => {
        this._appendLog({ type: 'hard_block', ruleId: r.id, action: actionText.slice(0, 200) });
      });
    }

    const blocked = violations.length > 0;
    return {
      allowed: !blocked,
      blocked,
      violations: violations.map((/** @type {any} */ r) => ({ id: r.id, category: r.category, text: r.text })),
      warnings: warnings.map((/** @type {any} */ r) => ({ id: r.id, category: r.category, text: r.text }))
    };
  }

  getRules(/** @type {any} */ category = null) {
    const rules = this.state.rules;
    return category ? rules.filter((/** @type {any} */ r) => r.category === category) : rules.slice();
  }

  getLog(/** @type {any} */ limit = 50) {
    return this.log.slice(-limit).reverse();
  }

  getStats() {
    const rules = this.state.rules;
    const active = rules.filter((/** @type {any} */ r) => r.active).length;
    const /** @type {any} */
byCategory = {};
    RULE_CATEGORIES.forEach((/** @type {any} */ c) => {
      (/** @type {any} */ (byCategory))[c] = rules.filter((/** @type {any} */ r) => r.category === c).length;
    });
    return { total: rules.length, active, byCategory, logEntries: this.log.length };
  }
}

const eonConstitutionService = new EONConstitutionService();
export default eonConstitutionService;
export { RULE_CATEGORIES, ENFORCEMENT_MODES };
