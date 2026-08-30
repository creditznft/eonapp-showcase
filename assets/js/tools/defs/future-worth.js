/**
 * EONAPP.ch — Viral Tool #5: FUTUREWORTH FORECAST
 * "Project your net worth with shareable assumptions."
 * Viral Score: 8/10 | Profit Score: 10/10 | Total: 9.2/10
 */
import { ToolEngine } from '../ToolEngine.js';

// Module-scope formatter used by both resultTemplate and shareText
function fmtEuro(/** @type {any} */ n) {
  return '€' + Math.round(n).toLocaleString('en-EU');
}

// Future value of annuity formula
// pv = present value, r = annual rate, n = years, pmt = monthly payment
function futureValue(/** @type {any} */ pv, /** @type {any} */ r, /** @type {any} */ n, /** @type {any} */ pmt) {
  if (r <= 0) return pv + pmt * 12 * n;
  const growth = Math.pow(1 + r, n);
  return pv * growth + (pmt * 12) * (growth - 1) / r;
}

const /** @type {any} */
PERSONAS = {
  yolo: {
    name: 'The Wealth Sprinter',
    emoji: '🚀',
    desc: 'Maximum risk, maximum upside. You\'re betting on high-growth assets to compress what others do in 20 years into 4. This path works — for the people who survive the volatility. Most don\'t. You might be the exception.'
  },
  aggressive_young: {
    name: 'The Aggressive Accumulator',
    emoji: '⚡',
    desc: 'Youth plus aggression equals the most powerful wealth-building combination in existence. Time heals volatility. Your risk appetite now, compounded over decades, is your genuine unfair advantage over everyone who started safe.'
  },
  aggressive: {
    name: 'The Risk Architect',
    emoji: '🏗️',
    desc: 'You build wealth through calculated asymmetric positions. You understand that real returns come from absorbing real risk. Your portfolio will have violent drawdowns — and violent recoveries. Stay the course.'
  },
  conservative: {
    name: 'The Conservative Keeper',
    emoji: '🛡️',
    desc: 'Safety-first wealth preservation. Lower volatility, slower growth, but you sleep soundly. Your strategy protects against catastrophic loss. In bear markets, while others are liquidating, you\'ll be the one buying.'
  },
  savings_account: {
    name: 'The Steady Builder',
    emoji: '🧱',
    desc: 'Slow, consistent, unshakeable. You\'re the tortoise in a race full of hares. While others blow up on leverage and meme coins, you compound steadily. Patience, not risk, is your edge — and it works.'
  },
  balanced: {
    name: 'The Balanced Grower',
    emoji: '⚖️',
    desc: 'Smart diversification with measured risk. You understand that wealth-building is a marathon, not a sprint. Your approach captures most of the upside while limiting catastrophic downside. Boring and effective.'
  }
};

const /** @type {any} */
def = {
  id: 'future-worth',
  title: 'FutureWorth Forecast',
  metaTitle: 'FutureWorth Forecast — Project Your Net Worth | EONAPP.ch',
  metaDesc: 'Enter your savings and investment style. Get a shareable 4-year net worth projection with conservative, realistic, and bull scenarios. Free instant calculator.',
  category: '💰 Finance',
  description: 'Enter your numbers, pick your investment style. We project your next 4 years with three scenarios and reveal the wealth persona you\'re building toward.',
  rewardProfile: 'finance',
  disableOfferwall: true,
  runLabel: '💰 Project My Worth',

  fields: [
    {
      id: 'savings',
      type: 'number',
      label: 'Current savings / invested capital (€)',
      placeholder: 'e.g. 5000'
    },
    {
      id: 'monthly',
      type: 'number',
      label: 'Monthly savings contribution (€)',
      placeholder: 'e.g. 300'
    },
    {
      id: 'investment',
      type: 'select',
      label: 'Primary investment vehicle',
      options: [
        { value: 'stocks',          label: '📈 Stocks / Index Funds' },
        { value: 'crypto',          label: '₿ Crypto' },
        { value: 'real_estate',     label: '🏠 Real Estate' },
        { value: 'savings_account', label: '🏦 Savings Account / Bonds' },
        { value: 'diversified',     label: '🌐 Diversified Portfolio' }
      ]
    },
    {
      id: 'risk',
      type: 'choice',
      label: 'Your risk appetite:',
      options: [
        { value: 'conservative', label: '🛡️ Conservative — protect first' },
        { value: 'balanced',     label: '⚖️ Balanced — steady growth' },
        { value: 'aggressive',   label: '⚡ Aggressive — high growth' },
        { value: 'yolo',         label: '🚀 YOLO — maximum upside' }
      ]
    },
    {
      id: 'country',
      type: 'select',
      label: 'Country income level',
      options: [
        { value: 'low',       label: '🌍 Low income country' },
        { value: 'lower_mid', label: '🌎 Lower-middle income country' },
        { value: 'upper_mid', label: '🌏 Upper-middle income country' },
        { value: 'high',      label: '🇪🇺 High income (EU / UK)' },
        { value: 'very_high', label: '🇺🇸 Very high income (US / CH / SG)' }
      ]
    },
    {
      id: 'age',
      type: 'range',
      label: 'Your age',
      min: 18,
      max: 65,
      default: 28
    }
  ],

  compute(/** @type {any} */ inputs) {
    const savings  = Math.max(0, parseFloat(inputs.savings) || 0);
    const monthly  = Math.max(0, parseFloat(inputs.monthly) || 0);
    const investment = inputs.investment || 'diversified';
    const risk       = inputs.risk || 'balanced';
    const country    = inputs.country || 'upper_mid';
    const age        = parseInt(inputs.age) || 28;
    const startYear = new Date().getFullYear();

    // Base annual return rates (long-run historical approximations)
    const /** @type {any} */
BASE_RATES = {
      stocks:          0.09,
      crypto:          0.20,
      real_estate:     0.07,
      savings_account: 0.035,
      diversified:     0.08
    };

    // Risk multipliers applied to base rate
    const /** @type {any} */
RISK_MULT = {
      conservative: 0.45,
      balanced:     1.00,
      aggressive:   1.45,
      yolo:         2.10
    };

    // Country cost-of-living / market access modifier (affects compound bonus display only)
    const /** @type {any} */
COUNTRY_MULT = {
      low:       0.82,
      lower_mid: 0.91,
      upper_mid: 1.00,
      high:      1.08,
      very_high: 1.14
    };

    const baseRate   = BASE_RATES[investment] ?? 0.08;
    const riskMult   = RISK_MULT[risk] ?? 1.0;
    const cMult      = COUNTRY_MULT[country] ?? 1.0;

    const realisticRate   = baseRate * riskMult * cMult;
    const conservativeRate = realisticRate * 0.38;
    const bullRate         = realisticRate * 2.1;

    // Clamp rates to avoid absurd projections in display
    const clamp = (/** @type {any} */ r) => Math.min(r, 0.95);

    // Year-by-year projection table
    const projTable = [1, 2, 3, 4].map((/** @type {any} */ n) => ({
      year:         startYear + n,
      conservative: Math.round(futureValue(savings, clamp(conservativeRate), n, monthly)),
      realistic:    Math.round(futureValue(savings, clamp(realisticRate), n, monthly)),
      bull:         Math.round(futureValue(savings, clamp(bullRate), n, monthly))
    }));

    const final         = projTable[3];
    const totalInvested = Math.round(savings + monthly * 12 * 4);
    const compoundBonus = Math.max(0, final.realistic - totalInvested);

    // Years to milestone
    const milestone = savings >= 100000
      ? Math.ceil((savings + 1) / 100000) * 100000
      : 100000;

    let yearsTo100k = null;
    for (let y = 1; y <= 50; y++) {
      if (futureValue(savings, clamp(realisticRate), y, monthly) >= milestone) {
        yearsTo100k = y;
        break;
      }
    }

    // Wealth persona
    let /** @type {any} */
personaKey;
    if (risk === 'yolo')                               personaKey = 'yolo';
    else if (risk === 'aggressive' && age < 35)        personaKey = 'aggressive_young';
    else if (risk === 'aggressive')                    personaKey = 'aggressive';
    else if (risk === 'conservative')                  personaKey = 'conservative';
    else if (investment === 'savings_account')         personaKey = 'savings_account';
    else                                               personaKey = 'balanced';

    const persona = PERSONAS[personaKey];
    const annualRatePct = Math.round(realisticRate * 100 * 10) / 10;

    return {
      startYear,
      savings,
      monthly,
      totalInvested,
      compoundBonus: Math.round(compoundBonus),
      projTable,
      conservativeFinal: final.conservative,
      realisticFinal:    final.realistic,
      bullFinal:         final.bull,
      personaName:  persona.name,
      personaEmoji: persona.emoji,
      personaDesc:  persona.desc,
      yearsTo100k,
      milestone,
      annualRatePct,
      age
    };
  },

  resultTemplate(/** @type {any} */ r) {
    const tableRows = r.projTable.map((/** @type {any} */ row) => `
      <tr style="border-bottom:1px solid var(--clr-border)">
        <td style="padding:.6rem .75rem;font-weight:700;color:var(--clr-text)">${row.year}</td>
        <td style="padding:.6rem .75rem;text-align:right;color:var(--clr-text-muted);font-size:.88rem">${fmtEuro(row.conservative)}</td>
        <td style="padding:.6rem .75rem;text-align:right;color:var(--clr-accent);font-weight:700">${fmtEuro(row.realistic)}</td>
        <td style="padding:.6rem .75rem;text-align:right;color:#f59e0b;font-weight:700">${fmtEuro(row.bull)}</td>
      </tr>`).join('');

    const milestoneText = r.yearsTo100k
      ? `~${r.yearsTo100k} yr${r.yearsTo100k === 1 ? '' : 's'} to next €${(r.milestone / 1000).toFixed(0)}k`
      : '> 50 yrs to milestone';

    // Visual projection bar — scale to bull value
    const bullMax = r.bullFinal || 1;
    const scenarioBars = [
      { label: 'Conservative', val: r.conservativeFinal, color: 'var(--clr-green)' },
      { label: 'Realistic',    val: r.realisticFinal,    color: 'var(--clr-accent)' },
      { label: 'Bull',         val: r.bullFinal,         color: '#f59e0b' }
    ].map((/** @type {any} */ s) => `
      <div style="margin:.5rem 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.25rem">
          <span style="font-size:.78rem;color:var(--clr-text-muted)">${s.label}</span>
          <span style="font-size:.85rem;font-weight:700;color:${s.color}">${fmtEuro(s.val)}</span>
        </div>
        <div style="height:8px;background:var(--clr-border);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.round(s.val / bullMax * 100)}%;background:${s.color};border-radius:4px"></div>
        </div>
      </div>`).join('');

    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">💰 Your FutureWorth Forecast</div>
          <div style="font-size:2.75rem;margin:.5rem 0">${r.personaEmoji}</div>
          <div class="result-title gradient-text">${r.personaName}</div>
          <div class="result-subtitle" style="margin-top:.5rem">${r.personaDesc}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.25rem 0">
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.68rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Total Invested</div>
            <div style="font-size:1.45rem;font-weight:800;margin-top:.25rem">${fmtEuro(r.totalInvested)}</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.68rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Compound Bonus</div>
            <div style="font-size:1.45rem;font-weight:800;margin-top:.25rem;color:var(--clr-green)">+${fmtEuro(r.compoundBonus)}</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.68rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Expected Rate</div>
            <div style="font-size:1.45rem;font-weight:800;margin-top:.25rem;color:var(--clr-accent)">${r.annualRatePct}%/yr</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.68rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600">Milestone</div>
            <div style="font-size:.88rem;font-weight:700;margin-top:.3rem;color:var(--clr-text);line-height:1.3">${milestoneText}</div>
          </div>
        </div>

        <div style="background:var(--clr-bg);border-radius:.75rem;overflow:hidden;margin-bottom:1.25rem">
          <div style="padding:.75rem 1rem;font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);font-weight:700;border-bottom:1px solid var(--clr-border)">📈 Year-by-Year Projection</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:rgba(99,102,241,.05)">
                <th style="padding:.5rem .75rem;text-align:left;font-size:.72rem;color:var(--clr-text-muted);font-weight:600">Year</th>
                <th style="padding:.5rem .75rem;text-align:right;font-size:.72rem;color:var(--clr-text-muted);font-weight:600">Bear</th>
                <th style="padding:.5rem .75rem;text-align:right;font-size:.72rem;color:var(--clr-accent);font-weight:600">Base</th>
                <th style="padding:.5rem .75rem;text-align:right;font-size:.72rem;color:#f59e0b;font-weight:600">Bull</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>

        <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);font-weight:700;margin-bottom:.75rem">🎯 4-Year Scenario Comparison</div>
          ${scenarioBars}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
          <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.25);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.68rem;color:var(--clr-green);text-transform:uppercase;letter-spacing:.05em;font-weight:700">Conservative (Year +4)</div>
            <div style="font-size:1.5rem;font-weight:900;margin-top:.35rem;color:var(--clr-green)">${fmtEuro(r.conservativeFinal)}</div>
          </div>
          <div style="background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.68rem;color:#f59e0b;text-transform:uppercase;letter-spacing:.05em;font-weight:700">Bull (Year +4)</div>
            <div style="font-size:1.5rem;font-weight:900;margin-top:.35rem;color:#f59e0b">${fmtEuro(r.bullFinal)}</div>
          </div>
        </div>

        <div style="background:rgba(99,102,241,.06);border-radius:.5rem;padding:.6rem .75rem;margin-bottom:1rem">
          <div style="font-size:.72rem;color:var(--clr-text-muted);line-height:1.5">Projections use compound interest formulas with historically-grounded return rates adjusted for investment type, risk appetite, and cost-of-living context. All figures are illustrative estimates, not financial advice.</div>
        </div>

        <div style="text-align:center;padding:.75rem;background:rgba(99,102,241,.08);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">Challenge a friend and compare your 4-year projection 👇</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My FutureWorth projection: ${fmtEuro(r.conservativeFinal)} (conservative) to ${fmtEuro(r.bullFinal)} (bull) over 4 years. ${r.annualRatePct}%/yr expected. What's yours? #FutureWorth`,

  challenge: (/** @type {any} */ r) => ({
    tool: 'future-worth',
    headline: 'Beat my 4-year projection',
    value: r.realisticFinal,
    unit: '€',
    summary: r.personaName,
    label: `${r.annualRatePct}%/yr expected rate`
  }),

  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.realisticFinal) > Number(challenge.value),

  related: [
    { url: '/tools/crypto-fate.html', icon: '₿', title: 'Crypto Fate Index', cat: 'Finance' },
    { url: '/tools/persona-mirror.html', icon: '🪞', title: 'Persona Mirror AI', cat: 'Personality' },
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank™', cat: 'Personality' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
