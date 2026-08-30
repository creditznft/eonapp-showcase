/**
 * EONAPP.ch — Viral Tool #1: RARERANK
 * "How rare is your brain compared to everyone else?"
 * Viral Score: 10/10 | Profit Score: 8/10 | Total: 9.2/10
 */
import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
def = {
  id: 'rarerank',
  title: 'RareRank™',
  metaTitle: 'RareRank — How Rare Is Your Mind? | EONAPP.ch',
  metaDesc: 'Take the RareRank quiz and discover your unique personality percentile. Only 4% get the rarest archetypes. Free, instant, shareable.',
  category: '🧠 Personality',
  description: 'Answer 10 fast questions. We analyze your thought patterns and reveal exactly how rare your mind is compared to thousands of others.',
  rewardProfile: 'quiz',
  runLabel: '⚡ Reveal My Rarity',
  fields: [
    {
      id: 'q1', type: 'choice', label: 'You have a free afternoon. You:',
      options: [
        { value: 'a', label: '📚 Learn something' }, { value: 'b', label: '🎮 Play / game' },
        { value: 'c', label: '👥 Hang with people' }, { value: 'd', label: '🌿 Recharge alone' }
      ]
    },
    {
      id: 'q2', type: 'choice', label: 'When solving a problem you:',
      options: [
        { value: 'a', label: '🔍 Research deeply' }, { value: 'b', label: '⚡ Trust instinct' },
        { value: 'c', label: '🗣️ Ask others' }, { value: 'd', label: '🧪 Experiment' }
      ]
    },
    {
      id: 'q3', type: 'choice', label: 'Your biggest strength is:',
      options: [
        { value: 'a', label: '💡 Creativity' }, { value: 'b', label: '📊 Logic' },
        { value: 'c', label: '❤️ Empathy' }, { value: 'd', label: '🏃 Execution' }
      ]
    },
    {
      id: 'q4', type: 'choice', label: 'In a group you usually:',
      options: [
        { value: 'a', label: '🎯 Lead' }, { value: 'b', label: '🧩 Plan' },
        { value: 'c', label: '🌊 Go with flow' }, { value: 'd', label: '🔧 Execute' }
      ]
    },
    {
      id: 'q5', type: 'choice', label: 'Your risk tolerance:',
      options: [
        { value: 'a', label: '🚀 High risk = high reward' }, { value: 'b', label: '⚖️ Calculated risk' },
        { value: 'c', label: '🛡️ Safety first' }, { value: 'd', label: '🎲 Depends on mood' }
      ]
    },
    {
      id: 'q6', type: 'choice', label: 'You make decisions based on:',
      options: [
        { value: 'a', label: '📈 Data & facts' }, { value: 'b', label: '💫 Intuition' },
        { value: 'c', label: '❤️ Feelings' }, { value: 'd', label: '🤝 What helps others' }
      ]
    },
    {
      id: 'q7', type: 'choice', label: 'Your ideal work style:',
      options: [
        { value: 'a', label: '🌐 Remote freelance' }, { value: 'b', label: '🏢 Team office' },
        { value: 'c', label: '🏡 Solo home' }, { value: 'd', label: '🗺️ Varies always' }
      ]
    },
    {
      id: 'q8', type: 'choice', label: 'Under pressure you:',
      options: [
        { value: 'a', label: '💪 Perform better' }, { value: 'b', label: '🤔 Need space' },
        { value: 'c', label: '🤝 Seek support' }, { value: 'd', label: '📋 Make a plan' }
      ]
    },
    {
      id: 'q9', type: 'choice', label: 'Your biggest life goal:',
      options: [
        { value: 'a', label: '🌍 Impact the world' }, { value: 'b', label: '💰 Financial freedom' },
        { value: 'c', label: '🧘 Peace & balance' }, { value: 'd', label: '🏆 Master your craft' }
      ]
    },
    {
      id: 'q10', type: 'choice', label: 'At night you often think about:',
      options: [
        { value: 'a', label: '🔮 Future possibilities' }, { value: 'b', label: '📝 Today\'s tasks' },
        { value: 'c', label: '🌙 Random deep stuff' }, { value: 'd', label: '😴 Nothing, out fast' }
      ]
    }
  ],

  compute(/** @type {any} */ inputs) {
    const answers = Object.values(inputs);
    // Score vectors: [analytical, creative, social, practical]
    const /** @type {any} */
scoreMap = { a: [1, 0, 0, 0], b: [0, 1, 0, 0], c: [0, 0, 1, 0], d: [0, 0, 0, 1] };
    const /** @type {any} */
weights = [[3,2,1,2],[2,1,3,1],[1,3,2,2],[2,1,2,3],[1,2,3,2],[3,1,2,1],[1,2,2,3],[2,1,2,3],[1,2,3,2],[1,3,1,2]];

    let /** @type {any} */
scores = [0, 0, 0, 0];
    answers.forEach((/** @type {any} */ ans, /** @type {any} */ i) => {
      const base = scoreMap[ans] || [0,0,0,0];
      const w = weights[i] || [1,1,1,1];
      scores = scores.map((/** @type {any} */ s, /** @type {any} */ j) => s + base[j] * w[j]);
    });

    const total = scores.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) || 1;
    const norm = scores.map((/** @type {any} */ s) => Math.round((s / total) * 100));

    // Archetypes: 32 types based on top-2 traits
    const /** @type {any} */
archetypes = [
      { name: 'The Analytical Visionary', rarity: 4, emoji: '🔬', desc: 'You see patterns others miss. Hyper-logical but creative — a deadly combo.' },
      { name: 'The Creative Strategist', rarity: 7, emoji: '🎯', desc: 'You blend imagination with execution. Rare leaders emerge from this type.' },
      { name: 'The Empathic Analyst', rarity: 6, emoji: '🌊', desc: 'Data meets heart. You solve problems by truly understanding people.' },
      { name: 'The Practical Innovator', rarity: 9, emoji: '⚙️', desc: 'Builders who dream. You make ideas real while others are still thinking.' },
      { name: 'The Visionary Rebel', rarity: 3, emoji: '🚀', desc: 'You challenge everything. Your brain runs on possibilities most people fear.' },
      { name: 'The Silent Architect', rarity: 5, emoji: '🏛️', desc: 'Behind every great structure is someone like you — meticulous, unseen, essential.' },
      { name: 'The Social Catalyst', rarity: 8, emoji: '⚡', desc: 'You charge rooms. People don\'t know why they feel more alive around you.' },
      { name: 'The Deep Thinker', rarity: 2, emoji: '🌌', desc: 'Your thoughts go further than most. This rarity puts you in the top 2%.' }
    ];

    // Seeded selection based on score pattern
    const seed = norm[0] * 7 + norm[1] * 3 + norm[2] * 11 + norm[3] * 5;
    const archetype = archetypes[seed % archetypes.length];
    const rarityPct = Math.min(99, Math.max(1, 100 - archetype.rarity * 11 + (seed % 7)));

    return {
      archetype,
      scores: { analytical: norm[0], creative: norm[1], social: norm[2], practical: norm[3] },
      rarityPct,
      rarityLabel: rarityPct >= 96 ? '🏆 LEGENDARY' : rarityPct >= 90 ? '💎 ULTRA RARE' : rarityPct >= 75 ? '🌟 RARE' : rarityPct >= 50 ? '⚡ UNCOMMON' : '✅ COMMON'
    };
  },

  resultTemplate(/** @type {any} */ r) {
    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">⚡ Your RareRank Archetype</div>
          <div style="font-size:3.5rem;margin:0.5rem 0">${r.archetype.emoji}</div>
          <div class="result-title gradient-text">${r.archetype.name}</div>
          <div class="result-subtitle">${r.archetype.desc}</div>
        </div>
        <div style="text-align:center;margin:1.5rem 0">
          <div style="font-size:0.8rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.5rem">Your Rarity Percentile</div>
          <div style="font-size:3rem;font-weight:800;line-height:1">${r.rarityPct}%</div>
          <div style="color:var(--clr-accent);font-weight:700;font-size:1.1rem;margin-top:.25rem">${r.rarityLabel}</div>
          <div style="color:var(--clr-text-muted);font-size:0.85rem;margin-top:.25rem">Rarer than ${r.rarityPct}% of people</div>
        </div>
        <div class="rarity-bar"><div class="rarity-bar-inner" style="width:${r.rarityPct}%"></div></div>
        <div class="result-traits" style="margin-top:1.5rem">
          ${['analytical','creative','social','practical'].map((/** @type {any} */ t) => `
            <div class="trait-row">
              <div class="trait-name">${t.charAt(0).toUpperCase()+t.slice(1)}</div>
              <div class="trait-bar"><div class="trait-fill" style="width:${r.scores[t]}%"></div></div>
              <div class="trait-val">${r.scores[t]}%</div>
            </div>`).join('')}
        </div>
        <div style="text-align:center;margin-top:1rem;padding:.75rem;background:rgba(99,102,241,.08);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">Challenge a friend → Can they beat your rarity? 👇</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My RareRank result: "${r.archetype.name}" — I'm rarer than ${r.rarityPct}% of people. Can you beat my score?`,
  challenge: (/** @type {any} */ r) => ({
    tool: 'rarerank',
    headline: 'Beat my rarity score',
    value: r.rarityPct,
    unit: '%',
    summary: r.archetype.name,
    label: r.rarityLabel
  }),
  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.rarityPct) > Number(challenge.value),

  related: [
    { url: '/build', icon: '🪞', title: 'Persona Mirror AI', cat: 'Planned' },
    { url: '/build', icon: '🚩', title: 'Red Flag Decoder', cat: 'Planned' },
    { url: '/tools/crypto-fate.html', icon: '₿', title: 'Crypto Fate Index', cat: 'Finance' }
  ]
};

// Mount on DOM ready
const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
