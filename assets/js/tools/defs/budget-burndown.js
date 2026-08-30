import { ToolEngine } from '../ToolEngine.js';

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  return Math.min(max, Math.max(min, value));
}

function fmtUsd(/** @type {any} */ value) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function fmtPct(/** @type {any} */ value, /** @type {any} */ digits = 0) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

const /** @type {any} */
CATEGORY_META = [
  { key: 'housing', label: 'Housing', color: '#6366f1', icon: '🏠' },
  { key: 'food', label: 'Food', color: '#22c55e', icon: '🛒' },
  { key: 'transport', label: 'Transport', color: '#f59e0b', icon: '🚗' },
  { key: 'subscriptions', label: 'Subscriptions', color: '#ef4444', icon: '📺' },
  { key: 'entertainment', label: 'Entertainment', color: '#8b5cf6', icon: '🍽️' },
  { key: 'other', label: 'Other', color: '#94a3b8', icon: '📦' }
];

function getGrade(/** @type {any} */ score) {
  if (score >= 85) {
    return { healthGrade: 'A', healthLabel: 'Surplus Strong', healthColor: '#22c55e' };
  }
  if (score >= 70) {
    return { healthGrade: 'B', healthLabel: 'Solid Budget', healthColor: '#84cc16' };
  }
  if (score >= 55) {
    return { healthGrade: 'C', healthLabel: 'Watch Spending', healthColor: '#f59e0b' };
  }
  if (score >= 40) {
    return { healthGrade: 'D', healthLabel: 'Budget Stress', healthColor: '#f97316' };
  }
  return { healthGrade: 'F', healthLabel: 'Deficit Risk', healthColor: '#ef4444' };
}

const /** @type {any} */
def = {
  id: 'budget-burndown',
  title: 'Budget Burndown Calculator',
  metaTitle: 'Budget Burndown Calculator - Daily Burn Rate & Runway | EONAPP.ch',
  metaDesc: 'Enter your monthly income and expenses to reveal your budget health score, daily burn rate, and monthly runway instantly.',
  category: '💰 Finance',
  description: 'Map where your money burns each month, spot the biggest leak, and share your budget score in one click.',
  rewardProfile: 'finance',
  disableOfferwall: true,
  runLabel: '💸 Calculate My Budget',
  fields: [
    {
      id: 'income',
      type: 'number',
      label: 'Monthly take-home income ($)',
      placeholder: 'e.g. 4200',
      default: 4200,
      min: 100,
      max: 100000
    },
    {
      id: 'housing',
      type: 'number',
      label: 'Rent/Mortgage ($)',
      placeholder: 'e.g. 1400',
      default: 1400,
      min: 0,
      max: 50000
    },
    {
      id: 'food',
      type: 'number',
      label: 'Food & groceries ($)',
      placeholder: 'e.g. 550',
      default: 550,
      min: 0,
      max: 50000
    },
    {
      id: 'transport',
      type: 'number',
      label: 'Transport & fuel ($)',
      placeholder: 'e.g. 320',
      default: 320,
      min: 0,
      max: 50000
    },
    {
      id: 'subscriptions',
      type: 'number',
      label: 'Subscriptions & services ($)',
      placeholder: 'e.g. 120',
      default: 120,
      min: 0,
      max: 50000
    },
    {
      id: 'entertainment',
      type: 'number',
      label: 'Entertainment & dining ($)',
      placeholder: 'e.g. 280',
      default: 280,
      min: 0,
      max: 50000
    },
    {
      id: 'other',
      type: 'number',
      label: 'Other expenses ($)',
      placeholder: 'e.g. 250',
      default: 250,
      min: 0,
      max: 50000
    }
  ],
  compute(/** @type {any} */ inputs) {
    const income = clamp(parseFloat(inputs.income) || 4200, 100, 100000);
    const expenses = Object.fromEntries(
      CATEGORY_META.map((/** @type {any} */ item) => [item.key, clamp(parseFloat(inputs[item.key]) || 0, 0, 50000)])
    );
    const totalExpenses = Object.values(expenses).reduce((/** @type {any} */ sum, /** @type {any} */ value) => sum + value, 0);
    const surplus = income - totalExpenses;
    const dailyBurnRate = totalExpenses / 30;
    const daysOfRunway = income > 0 && dailyBurnRate > 0 ? Math.floor(income / dailyBurnRate) : 0;
    const savingsRate = income > 0 ? clamp((surplus / income) * 100, 0, 100) : 0;
    const housingRatio = income > 0 ? expenses.housing / income : 0;
    const subscriptionsRatio = income > 0 ? expenses.subscriptions / income : 0;

    let healthScore = 100;
    if (surplus < 0) {
      healthScore = 0;
    } else {
      if (savingsRate < 5) {
        healthScore -= 35;
      } else if (savingsRate < 10) {
        healthScore -= 20;
      } else if (savingsRate < 20) {
        healthScore -= 5;
      }

      if (housingRatio > 0.35) {
        healthScore -= 20;
      } else if (housingRatio > 0.28) {
        healthScore -= 10;
      }

      if (subscriptionsRatio > 0.1) {
        healthScore -= 15;
      }
    }

    healthScore = clamp(Math.round(healthScore), 0, 100);
    const { healthGrade, healthLabel, healthColor } = getGrade(healthScore);
    const expensesByCategory = CATEGORY_META.map((/** @type {any} */ item) => {
      const value = expenses[item.key];
      return {
        label: item.label,
        value,
        pct: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        color: item.color,
        icon: item.icon
      };
    });

    const topExpense = [...expensesByCategory].sort((/** @type {any} */ a, /** @type {any} */ b) => b.value - a.value)[0] || expensesByCategory[0];
    let insight = `Your top category is ${topExpense.label} at ${fmtUsd(topExpense.value)}/mo (${fmtPct((topExpense.value / income) * 100)} of income). Trimming it by 15% saves ${fmtUsd(topExpense.value * 0.15)}/mo.`;
    if (savingsRate > 20) {
      insight = `You're in the top tier — a 20%+ savings rate beats most earners. Automate and compound it.`;
    } else if (topExpense?.label === 'Housing' && income > 0 && (expenses.housing / income) * 100 > 30) {
      insight = `Your biggest leak is housing at ${fmtPct((expenses.housing / income) * 100)} of income. Under 28% is the safe zone.`;
    }

    return {
      income,
      housing: expenses.housing,
      food: expenses.food,
      transport: expenses.transport,
      subscriptions: expenses.subscriptions,
      entertainment: expenses.entertainment,
      other: expenses.other,
      totalExpenses,
      surplus,
      dailyBurnRate,
      daysOfRunway,
      healthScore,
      healthGrade,
      healthLabel,
      healthColor,
      savingsRate,
      expensesByCategory,
      topCategory: topExpense?.label || 'Housing',
      insight,
      challengeScore: healthScore
    };
  },
  resultTemplate(/** @type {any} */ r) {
    const surplusColor = r.surplus >= 0 ? '#22c55e' : '#ef4444';
    const categoryRows = r.expensesByCategory.map((/** @type {any} */ item) => `
      <div style="padding:12px 12px 14px 12px;border-radius:18px;background:rgba(15,23,42,.86);border:1px solid rgba(148,163,184,.12)">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:8px;color:#f8fafc;font-weight:800">
            <span style="font-size:16px">${item.icon}</span>
            <span>${item.label}</span>
          </div>
          <div style="text-align:right">
            <div style="font-size:15px;color:#f8fafc;font-weight:800">${fmtUsd(item.value)}</div>
            <div style="font-size:12px;color:#94a3b8">${fmtPct(item.pct, 1)} of spend</div>
          </div>
        </div>
        <div style="margin-top:10px;height:10px;border-radius:999px;background:#172033;overflow:hidden">
          <div class="trait-fill" style="height:100%;width:${Math.max(item.value > 0 ? 4 : 0, Math.min(100, item.pct))}%;background:linear-gradient(90deg,${item.color},#f8fafc);border-radius:999px"></div>
        </div>
      </div>
    `).join('');

    return `
      <div id="eon-share-card" style="max-width:760px;margin:0 auto;border-radius:30px;padding:20px;background:linear-gradient(180deg,#080f1f 0%,#0f172a 46%,#111827 100%);border:1px solid rgba(148,163,184,.18);box-shadow:0 30px 100px rgba(2,6,23,.56);color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px">
          <div>
            <div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#93c5fd;font-weight:900">Budget Burndown</div>
            <div style="font-size:32px;font-weight:900;line-height:1.05;margin-top:8px">Budget health: ${r.healthScore}<span style="font-size:18px;color:#94a3b8">/100</span></div>
            <div style="font-size:14px;color:#cbd5e1;margin-top:8px">Top spend: ${r.topCategory} · Total monthly burn ${fmtUsd(r.totalExpenses)}</div>
          </div>
          <div style="min-width:182px;padding:14px 16px;border-radius:22px;background:linear-gradient(180deg,${r.healthColor}26,rgba(15,23,42,.9));border:1px solid ${r.healthColor}66;box-shadow:0 14px 36px ${r.healthColor}22">
            <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#dbeafe;font-weight:800">Grade badge</div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
              <div style="width:56px;height:56px;border-radius:18px;background:${r.healthColor};display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#fff">${r.healthGrade}</div>
              <div>
                <div style="display:inline-flex;padding:6px 10px;border-radius:999px;background:${r.healthColor};color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase">${r.healthLabel}</div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:8px">Savings rate ${fmtPct(r.savingsRate, 1)}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px">
          <div style="border-radius:20px;padding:16px;background:linear-gradient(180deg,rgba(14,165,233,.16),rgba(15,23,42,.92));border:1px solid rgba(56,189,248,.26)">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7dd3fc;font-weight:800">Daily Burn Rate</div>
            <div style="font-size:27px;font-weight:900;color:#f8fafc;margin-top:8px">${fmtUsd(r.dailyBurnRate)}<span style="font-size:15px;color:#cbd5e1">/day</span></div>
          </div>
          <div style="border-radius:20px;padding:16px;background:linear-gradient(180deg,rgba(99,102,241,.16),rgba(15,23,42,.92));border:1px solid rgba(129,140,248,.28)">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#c7d2fe;font-weight:800">Days of Runway</div>
            <div style="font-size:27px;font-weight:900;color:#f8fafc;margin-top:8px">${Math.max(0, r.daysOfRunway)}<span style="font-size:15px;color:#cbd5e1"> days</span></div>
          </div>
          <div style="border-radius:20px;padding:16px;background:linear-gradient(180deg,rgba(34,197,94,.16),rgba(15,23,42,.92));border:1px solid rgba(74,222,128,.24)">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#86efac;font-weight:800">Savings Rate</div>
            <div style="font-size:27px;font-weight:900;color:#f8fafc;margin-top:8px">${fmtPct(r.savingsRate, 1)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:start">
          <div style="background:rgba(2,6,23,.46);border:1px solid rgba(148,163,184,.16);border-radius:24px;padding:16px">
            <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:900">Expense breakdown</div>
              <div style="font-size:12px;color:#cbd5e1">6 categories · ${fmtUsd(r.totalExpenses)}/month</div>
            </div>
            <div style="display:grid;gap:10px">
              ${categoryRows}
            </div>
          </div>

          <div style="display:grid;gap:14px">
            <div style="border-radius:24px;padding:16px;background:linear-gradient(180deg,${surplusColor}1c,rgba(15,23,42,.92));border:1px solid ${surplusColor}55">
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:${r.surplus >= 0 ? '#86efac' : '#fca5a5'};font-weight:900">Surplus / Deficit</div>
              <div style="font-size:30px;font-weight:900;color:${surplusColor};margin-top:8px">${r.surplus >= 0 ? '+' : '-'}${fmtUsd(Math.abs(r.surplus))}</div>
              <div style="font-size:13px;color:#cbd5e1;margin-top:8px">${r.surplus >= 0 ? 'Cash left after essentials and lifestyle spend.' : 'Your budget is burning faster than income can replace it.'}</div>
            </div>

            <div style="border-radius:24px;padding:16px;background:rgba(15,23,42,.92);border:1px solid rgba(148,163,184,.16)">
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8;font-weight:900">Income vs burn</div>
              <div style="display:grid;gap:10px;margin-top:12px">
                <div>
                  <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#cbd5e1;margin-bottom:6px">
                    <span>Income</span>
                    <strong style="color:#f8fafc">${fmtUsd(r.income)}</strong>
                  </div>
                  <div style="height:12px;border-radius:999px;background:#172033;overflow:hidden">
                    <div class="trait-fill" style="height:100%;width:100%;background:linear-gradient(90deg,#38bdf8,#dbeafe);border-radius:999px"></div>
                  </div>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#cbd5e1;margin-bottom:6px">
                    <span>Expenses</span>
                    <strong style="color:${r.totalExpenses > r.income ? '#fca5a5' : '#f8fafc'}">${fmtUsd(r.totalExpenses)}</strong>
                  </div>
                  <div style="height:12px;border-radius:999px;background:#172033;overflow:hidden">
                    <div class="trait-fill" style="height:100%;width:${Math.max(4, Math.min(100, (r.totalExpenses / Math.max(r.income, 1)) * 100))}%;background:linear-gradient(90deg,${r.totalExpenses > r.income ? '#ef4444' : '#22c55e'},#f8fafc);border-radius:999px"></div>
                  </div>
                </div>
              </div>
            </div>

            <div style="border-radius:24px;padding:16px;background:linear-gradient(180deg,rgba(99,102,241,.18),rgba(15,23,42,.96));border:1px solid rgba(129,140,248,.35)">
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#c7d2fe;font-weight:900">Actionable insight</div>
              <div style="font-size:15px;line-height:1.6;color:#eef2ff;margin-top:10px">${r.insight}</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-top:18px;padding-top:14px;border-top:1px solid rgba(148,163,184,.12)">
          <div style="font-size:12px;color:#94a3b8">Built for instant budget check-ins, screenshot shares, and smarter monthly resets.</div>
          <div style="font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#e2e8f0">⚡ eonapp.ch</div>
        </div>
      </div>`;
  },
  shareText(/** @type {any} */ r) {
    return `My budget health score is ${r.healthScore}/100 (Grade ${r.healthGrade}). I burn $${Math.round(r.dailyBurnRate)}/day. What's yours? https://eonapp.ch/tools/budget-burndown.html`;
  },
  challenge(/** @type {any} */ r) {
    return {
      tool: 'budget-burndown',
      headline: 'Can you beat my budget health score?',
      value: r.healthScore,
      unit: '/100',
      summary: `${r.healthGrade} budget · $${Math.round(r.dailyBurnRate)}/day burn`,
      label: `${Math.round(r.savingsRate)}% savings rate`,
      score: r.healthScore,
      dailyBurn: Math.round(r.dailyBurnRate),
      grade: r.healthGrade,
      savingsRate: Math.round(r.savingsRate)
    };
  },
  compareChallenge(/** @type {any} */ result, /** @type {any} */ challenge) {
    const diff = result.healthScore - (challenge.score || 0);
    if (diff > 10) return { won: true, message: `You beat the challenger's budget score by ${diff} points!` };
    if (diff >= 0) return { won: true, message: `Your budget is healthier. Score: ${result.healthScore} vs ${challenge.score}.` };
    return { won: false, message: `The challenger scored ${challenge.score}. Improve your score to ${challenge.score + 1} or higher to beat them.` };
  },
  related: ['dca-explorer', 'future-worth', 'subscription-leak', 'crypto-fate']
};

const /** @type {any} */
root = document.getElementById('tool-root'); if (root) new ToolEngine(def).mount(root);
