import { ToolEngine } from '../ToolEngine.js';

function fmtUsd(/** @type {any} */ value) {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  return Math.min(max, Math.max(min, value));
}

function rateToPeriodic(/** @type {any} */ rate, /** @type {any} */ periodsPerYear, /** @type {any} */ mode) {
  const safeRate = clamp(rate, -0.9, 3);
  if (mode === 'annual') {
    return safeRate / periodsPerYear;
  }
  if (mode === 'continuous') {
    const annualEff = Math.exp(safeRate) - 1;
    return Math.pow(1 + annualEff, 1 / periodsPerYear) - 1;
  }
  const annualEff = Math.pow(1 + safeRate / 12, 12) - 1;
  return Math.pow(1 + annualEff, 1 / periodsPerYear) - 1;
}

function dcaFutureValue(/** @type {any} */ amountPerContribution, /** @type {any} */ periodsPerYear, /** @type {any} */ years, /** @type {any} */ annualRate, /** @type {any} */ compMode) {
  const periods = Math.max(1, Math.round(periodsPerYear * years));
  const i = rateToPeriodic(annualRate, periodsPerYear, compMode);
  if (Math.abs(i) < 0.0000001) {
    return amountPerContribution * periods;
  }
  return amountPerContribution * ((Math.pow(1 + i, periods) - 1) / i);
}

function getActionTip(/** @type {any} */ asset, /** @type {any} */ baseRate, /** @type {any} */ baseRoi) {
  if (asset === 'btc' && baseRate > 0.55) {
    return 'At this pace, plan a rebalance trigger. Locking 15-25% of gains into lower-volatility assets can protect compounding.';
  }
  if (asset === 'eth' && baseRoi > 120) {
    return 'Strong upside comes with large drawdowns. Keep an allocation cap so one asset does not dominate your full plan.';
  }
  if (asset === 'spy') {
    return 'Steady compounding wins by consistency. Automate contributions and avoid skipping months during flat markets.';
  }
  if (asset === 'gold') {
    return 'Gold is stability-heavy. Pair it with growth assets if your objective is long-term return, not just drawdown defense.';
  }
  return 'The edge is cadence, not prediction. Keep the contribution schedule unchanged through volatility.';
}

const /** @type {any} */
ASSET_CONFIG = {
  btc: {
    label: 'Bitcoin',
    icon: '₿',
    rates: { bear: 0.2, base: 0.65, bull: 1.2 }
  },
  eth: {
    label: 'Ethereum',
    icon: 'Ξ',
    rates: { bear: 0.15, base: 0.45, bull: 0.9 }
  },
  spy: {
    label: 'S&P 500',
    icon: '📈',
    rates: { bear: 0.04, base: 0.11, bull: 0.18 }
  },
  gold: {
    label: 'Gold',
    icon: '🥇',
    rates: { bear: 0.02, base: 0.06, bull: 0.12 }
  }
};

const /** @type {any} */
FREQ_CONFIG = {
  weekly: { n: 52, label: 'weekly' },
  biweekly: { n: 26, label: 'biweekly' },
  monthly: { n: 12, label: 'monthly' }
};

const /** @type {any} */
REGRET_YEARS = {
  now: 0,
  year1: 1,
  year3: 3,
  year5: 5
};

const /** @type {any} */
def = {
  id: 'dca-explorer',
  title: 'DCA Scenario Explorer',
  metaTitle: 'DCA Scenario Explorer - Compare DCA Strategy Outcomes | EONAPP.ch',
  metaDesc: 'Model weekly, biweekly, and monthly DCA scenarios across BTC, ETH, S&P 500, and gold with instant side-by-side outcomes.',
  category: '💰 Finance',
  description: 'Stress-test your contribution schedule against bear, base, and bull assumptions before you commit real capital.',
  rewardProfile: 'finance',
  disableOfferwall: true,
  runLabel: '📊 Compare DCA Scenarios',
  fields: [
    {
      id: 'amount',
      type: 'number',
      label: 'Amount per contribution',
      placeholder: '$50'
    },
    {
      id: 'frequency',
      type: 'choice',
      label: 'Contribution frequency',
      options: [
        { value: 'weekly', label: 'Weekly (52x/year)' },
        { value: 'biweekly', label: 'Biweekly (26x/year)' },
        { value: 'monthly', label: 'Monthly (12x/year)' }
      ]
    },
    {
      id: 'asset',
      type: 'choice',
      label: 'Primary asset',
      options: [
        { value: 'btc', label: '₿ Bitcoin (BTC) - 10yr CAGR ~80%' },
        { value: 'eth', label: 'Ξ Ethereum (ETH) - 10yr CAGR ~55%' },
        { value: 'spy', label: '📈 S&P 500 (SPY) - 10yr CAGR ~11%' },
        { value: 'gold', label: '🥇 Gold - 10yr CAGR ~6%' }
      ]
    },
    {
      id: 'years',
      type: 'range',
      label: 'Investment duration (years)',
      min: 1,
      max: 10,
      default: 3
    },
    {
      id: 'startedWhen',
      type: 'choice',
      label: 'Starting assumption',
      options: [
        { value: 'now', label: 'Starting today' },
        { value: 'year1', label: 'Should have started 1 year ago' },
        { value: 'year3', label: 'Should have started 3 years ago' },
        { value: 'year5', label: 'Should have started 5 years ago' }
      ]
    },
    {
      id: 'compoundFrequency',
      type: 'choice',
      label: 'Compounding style',
      options: [
        { value: 'annual', label: 'Annual compounding' },
        { value: 'monthly', label: 'Monthly compounding (more realistic)' },
        { value: 'continuous', label: 'Continuous compounding (bull scenario)' }
      ]
    }
  ],
  compute(/** @type {any} */ inputs) {
    const amount = clamp(parseFloat(inputs.amount) || 50, 1, 10000);
    const years = clamp(parseInt(inputs.years, 10) || 3, 1, 10);
    const frequency = FREQ_CONFIG[inputs.frequency] ? inputs.frequency : 'monthly';
    const asset = ASSET_CONFIG[inputs.asset] ? inputs.asset : 'spy';
    const startedWhen = Object.prototype.hasOwnProperty.call(REGRET_YEARS, inputs.startedWhen) ? inputs.startedWhen : 'now';
    const compoundFrequency = ['annual', 'monthly', 'continuous'].includes(inputs.compoundFrequency)
      ? inputs.compoundFrequency
      : 'monthly';

    const freq = FREQ_CONFIG[frequency];
    const rates = ASSET_CONFIG[asset].rates;
    const totalContributed = amount * freq.n * years;

    const scenarioValue = (/** @type {any} */ rate, /** @type {any} */ runYears = years) =>
      Math.round(dcaFutureValue(amount, freq.n, runYears, rate, compoundFrequency));

    const /** @type {any} */
scenarios = {
      bear: {
        label: 'Bear',
        emoji: '🐻',
        rate: rates.bear,
        value: scenarioValue(rates.bear)
      },
      base: {
        label: 'Base',
        emoji: '📊',
        rate: rates.base,
        value: scenarioValue(rates.base)
      },
      bull: {
        label: 'Bull',
        emoji: '🚀',
        rate: rates.bull,
        value: scenarioValue(rates.bull)
      }
    };

    const baseGain = scenarios.base.value - totalContributed;
    const baseMultiplier = totalContributed > 0 ? scenarios.base.value / totalContributed : 1;
    const baseROI = totalContributed > 0 ? Math.round((baseGain / totalContributed) * 100) : 0;
    const regretYears = REGRET_YEARS[startedWhen];
    const missedValue = regretYears > 0
      ? Math.max(0, scenarioValue(rates.base, years + regretYears) - scenarios.base.value)
      : 0;

    const yearsToMultiple = (/** @type {any} */ target, /** @type {any} */ rate) => {
      for (let y = 1; y <= 30; y += 1) {
        const contributedByYear = amount * freq.n * y;
        const valueByYear = dcaFutureValue(amount, freq.n, y, rate, compoundFrequency);
        if (contributedByYear > 0 && valueByYear >= contributedByYear * target) {
          return y;
        }
      }
      return null;
    };

    const hysaAnnual = 0.045;
    const hysaValue = Math.round(dcaFutureValue(amount, freq.n, years, hysaAnnual, 'monthly'));
    const hysaGap = scenarios.base.value - hysaValue;

    return {
      amount,
      years,
      totalContributed,
      annualContrib: amount * freq.n,
      scenarios,
      baseGain,
      baseMultiplier,
      baseROI,
      missedValue,
      regretYears,
      asset,
      assetLabel: ASSET_CONFIG[asset].label,
      assetIcon: ASSET_CONFIG[asset].icon,
      frequency,
      freqLabel: freq.label,
      startedWhen,
      compoundFrequency,
      yearsTo2x: yearsToMultiple(2, rates.base),
      yearsTo5x: yearsToMultiple(5, rates.base),
      yearsTo10x: yearsToMultiple(10, rates.base),
      hysaValue,
      hysaGap,
      actionTip: getActionTip(asset, rates.base, baseROI)
    };
  },
  resultTemplate(/** @type {any} */ r) {
    const baseColor = r.baseGain >= 0 ? '#22c55e' : '#ef4444';
    const baseWidth = Math.max(3, Math.min(100, (r.scenarios.base.value / Math.max(r.scenarios.bull.value, 1)) * 100));
    const contribMarker = Math.max(1, Math.min(100, (r.totalContributed / Math.max(r.scenarios.bull.value, 1)) * 100));
    const scenarioRows = ['bear', 'base', 'bull'].map((/** @type {any} */ key) => {
      const item = r.scenarios[key];
      const gain = item.value - r.totalContributed;
      const multiple = r.totalContributed > 0 ? item.value / r.totalContributed : 1;
      const color = key === 'bear' ? '#94a3b8' : key === 'base' ? '#22c55e' : '#f59e0b';
      return `
        <div style="display:grid;grid-template-columns:1.1fr .9fr 1fr 1fr .9fr;gap:.45rem;align-items:center;padding:.6rem .55rem;border-radius:.65rem;background:#0f172a;border:1px solid rgba(148,163,184,.14);margin-top:.45rem;font-size:.84rem">
          <div style="color:${color};font-weight:800">${item.emoji} ${item.label}</div>
          <div style="text-align:right;color:#cbd5e1">${Math.round(item.rate * 100)}%</div>
          <div style="text-align:right;color:#f8fafc;font-weight:700">${fmtUsd(item.value)}</div>
          <div style="text-align:right;color:${gain >= 0 ? '#22c55e' : '#ef4444'}">${gain >= 0 ? '+' : '-'}${fmtUsd(Math.abs(gain))}</div>
          <div style="text-align:right;color:${color};font-weight:700">${multiple.toFixed(2)}x</div>
        </div>`;
    }).join('');

    return `
      <div id="eon-share-card" style="max-width:720px;margin:0 auto;border-radius:28px;padding:20px;background:linear-gradient(180deg,#0b1220 0%,#111827 48%,#0f172a 100%);border:1px solid rgba(148,163,184,.2);box-shadow:0 28px 90px rgba(2,6,23,.5);color:#f8fafc;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
          <div>
            <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#93c5fd;font-weight:800">DCA scenario explorer</div>
            <div style="font-size:28px;font-weight:900;line-height:1.1;margin-top:.4rem">${r.assetIcon} ${r.assetLabel}</div>
            <div style="font-size:.9rem;color:#cbd5e1;margin-top:.35rem">${fmtUsd(r.amount)} ${r.freqLabel} for ${r.years} years</div>
          </div>
          <div style="padding:.75rem 1rem;border-radius:1rem;background:${baseColor}1f;border:1px solid ${baseColor}66;text-align:center;min-width:140px">
            <div style="font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#d1fae5">Base ROI</div>
            <div style="font-size:2rem;font-weight:900;color:${baseColor}">${r.baseROI >= 0 ? '+' : ''}${r.baseROI}%</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;margin-bottom:1rem">
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.16);border-radius:.9rem;padding:.8rem">
            <div style="font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Contributed</div>
            <div style="font-size:1.3rem;font-weight:800;color:#e2e8f0;margin-top:.25rem">${fmtUsd(r.totalContributed)}</div>
          </div>
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.16);border-radius:.9rem;padding:.8rem">
            <div style="font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Base value</div>
            <div style="font-size:1.3rem;font-weight:800;color:${baseColor};margin-top:.25rem">${fmtUsd(r.scenarios.base.value)}</div>
          </div>
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.16);border-radius:.9rem;padding:.8rem">
            <div style="font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Multiplier</div>
            <div style="font-size:1.3rem;font-weight:800;color:#f8fafc;margin-top:.25rem">${r.baseMultiplier.toFixed(2)}x</div>
          </div>
        </div>

        <div style="background:#02061799;border:1px solid rgba(148,163,184,.2);border-radius:1rem;padding:.85rem 0.75rem 0.95rem">
          <div style="display:grid;grid-template-columns:1.1fr .9fr 1fr 1fr .9fr;gap:.45rem;padding:0 .55rem .45rem;color:#94a3b8;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase">
            <div>Scenario</div>
            <div style="text-align:right">Rate</div>
            <div style="text-align:right">Value</div>
            <div style="text-align:right">Gain/Loss</div>
            <div style="text-align:right">Multiple</div>
          </div>
          ${scenarioRows}
        </div>

        <div style="margin-top:1rem;background:#0f172a;border:1px solid rgba(148,163,184,.16);border-radius:.95rem;padding:.85rem">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap">
            <div style="font-size:.84rem;color:#cbd5e1">Base projection progress toward bull ceiling</div>
            <div style="font-size:.84rem;color:#22c55e;font-weight:700">${fmtUsd(r.scenarios.base.value)}</div>
          </div>
          <div style="height:14px;border-radius:999px;background:#1e293b;overflow:hidden;margin-top:.55rem;position:relative">
            <div class="trait-fill" style="width:${baseWidth}%;height:100%;background:linear-gradient(90deg,#22c55e,#86efac);border-radius:999px"></div>
            <div style="position:absolute;left:calc(${contribMarker}% - 2px);top:0;bottom:0;width:4px;background:#f8fafc55"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:.45rem;font-size:.75rem;color:#94a3b8">
            <span>Contributed marker at ${fmtUsd(r.totalContributed)}</span>
            <span>Bull: ${fmtUsd(r.scenarios.bull.value)}</span>
          </div>
        </div>

        ${r.regretYears > 0 ? `
          <div style="margin-top:1rem;background:#7f1d1d26;border:1px solid #ef444466;border-radius:.95rem;padding:.85rem">
            <div style="font-size:.76rem;letter-spacing:.08em;text-transform:uppercase;color:#fca5a5">Missed opportunity</div>
            <div style="font-size:1.2rem;font-weight:800;color:#fecaca;margin-top:.2rem">If you started ${r.regretYears} year${r.regretYears === 1 ? '' : 's'} earlier: +${fmtUsd(r.missedValue)}</div>
            <div style="font-size:.85rem;color:#fecaca;margin-top:.3rem">Delay compounds twice: fewer contribution periods and fewer growth cycles.</div>
          </div>
        ` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-top:1rem">
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.16);border-radius:.95rem;padding:.85rem">
            <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Action tip</div>
            <div style="font-size:.9rem;line-height:1.55;color:#e2e8f0;margin-top:.35rem">${r.actionTip}</div>
          </div>
          <div style="background:#0f172a;border:1px solid rgba(148,163,184,.16);border-radius:.95rem;padding:.85rem">
            <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Alternative baseline</div>
            <div style="font-size:.9rem;line-height:1.55;color:#e2e8f0;margin-top:.35rem">If this same flow went to a 4.5% APY savings account: <strong>${fmtUsd(r.hysaValue)}</strong>. That is <strong>${r.hysaGap >= 0 ? fmtUsd(r.hysaGap) + ' less' : fmtUsd(Math.abs(r.hysaGap)) + ' more'}</strong> than your base scenario.</div>
          </div>
        </div>

        <div style="margin-top:1rem;padding:.85rem;border-radius:.95rem;background:#312e811f;border:1px solid #6366f166">
          <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#c7d2fe">Milestone scan</div>
          <div style="font-size:.88rem;color:#e2e8f0;margin-top:.35rem">2x: ${r.yearsTo2x ? r.yearsTo2x + 'y' : 'n/a'} · 5x: ${r.yearsTo5x ? r.yearsTo5x + 'y' : 'n/a'} · 10x: ${r.yearsTo10x ? r.yearsTo10x + 'y' : 'n/a'}</div>
        </div>
      </div>`;
  },
  shareText(/** @type {any} */ r) {
    return `I'm DCA'ing ${fmtUsd(r.amount)}/${r.freqLabel} into ${r.assetLabel} for ${r.years} years. Base case projects ${fmtUsd(r.scenarios.base.value)}. What's your scenario? -> eonapp.ch/tools/dca-explorer.html`;
  },
  challenge(/** @type {any} */ r) {
    return {
      tool: 'dca-explorer',
      headline: 'Beat my projected DCA return',
      value: r.scenarios.base.value,
      unit: '$',
      summary: `${r.assetLabel} at ${fmtUsd(r.amount)}/${r.freqLabel} for ${r.years} years`,
      label: r.assetLabel
    };
  },
  compareChallenge(/** @type {any} */ result, /** @type {any} */ challenge) {
    return Number(result.scenarios?.base?.value || 0) > Number(challenge.value || 0);
  },
  related: [
    { url: '/tools/future-worth.html', icon: '💰', title: 'FutureWorth', cat: 'Finance' },
    { url: '/tools/crypto-fate.html', icon: '₿', title: 'Crypto Fate', cat: 'Finance' },
    { url: '/tools/subscription-leak.html', icon: '💸', title: 'Subscription Leak', cat: 'Finance' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
