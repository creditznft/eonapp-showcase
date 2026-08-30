/**
 * EONAPP.ch — Viral Tool #2: CRYPTO FATE INDEX
 * "Are you early, lucky, or exit liquidity?"
 * Viral Score: 8/10 | Profit Score: 10/10 | Total: 9.2/10
 */
import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
PERSONAS = [
  { id: 'diamond_owl', name: 'Diamond Owl 🦉', label: 'Disciplined Holder', desc: 'You DCA consistently, never panic sell, and see dips as discounts. Top 8% of investors.' },
  { id: 'early_genius', name: 'Early Genius 🧠', label: 'Timed the Market', desc: 'Your entry timing is exceptional. You\'ve caught moves others waited for.' },
  { id: 'exit_liquidity', name: 'Exit Liquidity 🩸', label: 'Bought the Top', desc: 'Classic entry at peak euphoria. But knowing this is step one to fixing it.' },
  { id: 'paper_hands', name: 'Paper Hands 📄', label: 'Sold Too Soon', desc: 'You escaped the crash but left life-changing gains on the table.' },
  { id: 'sleeper', name: 'The Sleeper 😴', label: 'Missed the Wave', desc: 'Late awareness, but early recognition. Second waves are where real wealth hides.' },
  { id: 'chaos_trader', name: 'Chaos Trader 🎲', label: 'Pure Emotion', desc: 'Your trades follow vibes, news, and Twitter. High risk, high drama, high potential.' },
];

const /** @type {any} */
COINS = ['BTC','ETH','SOL','BNB','ADA','DOGE','AVAX','MATIC','DOT','LINK'];

const /** @type {any} */
def = {
  id: 'crypto-fate',
  title: 'Crypto Fate Index',
  metaTitle: 'Crypto Fate Index — What Type of Crypto Investor Are You? | EONAPP.ch',
  metaDesc: 'Calculate your crypto destiny. See your missed gains, future projections, and which crypto persona you really are. Free instant calculator.',
  category: '₿ Finance',
  description: 'Enter your crypto setup and we calculate your missed gains, future projections, and reveal your true investor fate.',
  rewardProfile: 'finance',
  disableOfferwall: true,
  runLabel: '🔮 Reveal My Crypto Fate',
  fields: [
    {
      id: 'coin', type: 'select', label: 'Primary Coin',
      options: COINS.map((/** @type {any} */ c) => ({ value: c, label: c }))
    },
    { id: 'monthly', type: 'number', label: 'Monthly DCA Budget (€/$)', placeholder: 'e.g. 100' },
    { id: 'start_year', type: 'select', label: 'When did you start (or plan to)?',
      options: [2019,2020,2021,2022,2023,2024,2025,2026].map((/** @type {any} */ y) => ({ value: y, label: String(y) }))
    },
    {
      id: 'strategy', type: 'choice', label: 'Your typical strategy:',
      options: [
        { value: 'dca', label: '📅 Regular DCA' }, { value: 'lump', label: '💸 Lump sum' },
        { value: 'emotional', label: '😱 Buy high sell low' }, { value: 'hold', label: '💎 Buy & never sell' }
      ]
    },
    {
      id: 'panic', type: 'choice', label: 'During -50% crash you:',
      options: [
        { value: 'buy_more', label: '🛒 Buy more' }, { value: 'hold', label: '✋ Hold' },
        { value: 'sell_half', label: '😰 Sell half' }, { value: 'panic_sell', label: '🩸 Panic sell all' }
      ]
    }
  ],

  compute(/** @type {any} */ inputs) {
    const monthly = parseFloat(inputs.monthly) || 100;
    const startYear = parseInt(inputs.start_year) || 2022;
    const yearsIn = 2026 - startYear;
    const totalInvested = monthly * 12 * Math.max(yearsIn, 0.5);

    // Simulated multipliers based on coin+year (no live API needed, but can swap for CoinGecko)
    const /** @type {any} */
coinMultipliers = { BTC:3.2, ETH:2.8, SOL:5.1, BNB:2.1, ADA:0.8, DOGE:2.3, AVAX:1.9, MATIC:2.4, DOT:0.7, LINK:1.6 };
    const multiplier = coinMultipliers[inputs.coin] || 2.0;
    const /** @type {any} */
strategyBonus = { dca: 1.15, lump: multiplier > 2 ? 1.3 : 0.7, emotional: 0.6, hold: 1.25 };
    const /** @type {any} */
panicBonus = { buy_more: 1.2, hold: 1.0, sell_half: 0.75, panic_sell: 0.45 };

    const currentValue = totalInvested * multiplier * (strategyBonus[inputs.strategy] || 1) * (panicBonus[inputs.panic] || 1);
    const missedGains = Math.max(0, currentValue - totalInvested);

    // Future projection (4 years DCA from now)
    const futureInvested = monthly * 12 * 4;
    const conservativeROI = totalInvested + futureInvested * 1.8;
    const bullROI = totalInvested + futureInvested * 4.2;

    // Persona
    const seed = (startYear % 6) + (inputs.coin.length % 3) + (inputs.strategy === 'emotional' ? 2 : 0) + (inputs.panic === 'panic_sell' ? 3 : 0);
    const persona = PERSONAS[seed % PERSONAS.length];

    return {
      coin: inputs.coin,
      totalInvested: Math.round(totalInvested),
      currentValue: Math.round(currentValue),
      missedGains: Math.round(missedGains),
      futureConservative: Math.round(conservativeROI),
      futureBull: Math.round(bullROI),
      persona,
      roiPct: Math.round(((currentValue / totalInvested) - 1) * 100),
      yearsIn
    };
  },

  resultTemplate(/** @type {any} */ r) {
    const fmt = (/** @type {any} */ n) => '€' + n.toLocaleString('en-EU');
    const roiColor = r.roiPct >= 0 ? 'var(--clr-green)' : 'var(--clr-red)';
    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">₿ Your Crypto Fate</div>
          <div style="font-size:3rem;margin:.5rem 0">🔮</div>
          <div class="result-title gradient-text">${r.persona.name}</div>
          <div style="color:var(--clr-accent);font-weight:600">${r.persona.label}</div>
          <div class="result-subtitle" style="margin-top:.5rem">${r.persona.desc}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0">
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.75rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em">Total Invested</div>
            <div style="font-size:1.6rem;font-weight:800;margin-top:.25rem">${fmt(r.totalInvested)}</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.75rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em">Current Value</div>
            <div style="font-size:1.6rem;font-weight:800;margin-top:.25rem;color:${roiColor}">${fmt(r.currentValue)}</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.75rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em">ROI</div>
            <div style="font-size:1.6rem;font-weight:800;margin-top:.25rem;color:${roiColor}">${r.roiPct >= 0 ? '+' : ''}${r.roiPct}%</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;text-align:center">
            <div style="font-size:.75rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.05em">Gains / Losses</div>
            <div style="font-size:1.6rem;font-weight:800;margin-top:.25rem;color:${r.roiPct >= 0 ? 'var(--clr-green)' : 'var(--clr-red)'}">${r.roiPct >= 0 ? '+' : ''}${fmt(r.missedGains)}</div>
          </div>
        </div>
        <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;margin-bottom:1rem">
          <div style="font-size:.8rem;color:var(--clr-text-muted);margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.05em">📈 4-Year DCA Projection</div>
          <div style="display:flex;justify-content:space-between">
            <span>Conservative: <strong style="color:var(--clr-green)">${fmt(r.futureConservative)}</strong></span>
            <span>Bull: <strong style="color:var(--clr-gold)">${fmt(r.futureBull)}</strong></span>
          </div>
        </div>
        <div style="text-align:center;padding:.75rem;background:rgba(99,102,241,.08);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">Share your crypto fate 👇 Tag someone who needs to see this</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My Crypto Fate: "${r.persona.name}" — ${r.coin} ROI ${r.roiPct >= 0 ? '+' : ''}${r.roiPct}%. Can you top that?`,
  challenge: (/** @type {any} */ r) => ({
    tool: 'crypto-fate',
    headline: 'Beat my crypto ROI',
    value: r.roiPct,
    unit: '%',
    summary: r.persona.name,
    label: r.coin
  }),
  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.roiPct) > Number(challenge.value),

  related: [
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank Quiz', cat: 'Personality' },
    { url: '/tools/future-worth.html', icon: '💰', title: 'FutureWorth Forecast', cat: 'Finance' },
    { url: '/market', icon: '🎲', title: 'Meme Investor Game', cat: 'Planned' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
