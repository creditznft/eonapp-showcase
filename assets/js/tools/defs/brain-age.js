/**
 * EONAPP.ch — Viral Tool #7: BRAIN AGE BLITZ
 * "How old is your brain RIGHT NOW?"
 * Viral Score: 9/10 | Profit Score: 7/10 | Total: 8.5/10
 *
 * NOTE: This tool uses self-reported answers (no timed JS since ToolEngine
 * is form-based). The questions are designed to feel like cognitive tests
 * while producing shareable, persona-type results.
 * For a fully interactive timed version, use the Canvas game pattern instead.
 */
import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
BRAIN_ARCHETYPES = [
  {
    id: 'neural_prodigy',
    name: 'Neural Prodigy',
    emoji: '🧬',
    ageLabel: '18–24',
    desc: 'Your processing speed and pattern recognition are operating at peak levels. Your brain fires fast and filters sharp. You\'re in the top cognitive percentile for your age group.',
    traits: ['Lightning reflexes', 'Pattern recognition master', 'Multi-task capable', 'Distraction resistant'],
    weaknesses: ['May rush to conclusions', 'Can underestimate slower thinkers']
  },
  {
    id: 'sharp_analyst',
    name: 'Sharp Analyst',
    emoji: '🔬',
    ageLabel: '25–34',
    desc: 'You combine raw processing speed with learned pattern recognition. Your brain has hit the sweet spot: fast enough to react, wise enough to pause. Strong performer across all cognitive categories.',
    traits: ['Excellent working memory', 'Strategic problem solver', 'High attention to detail', 'Adapts under pressure'],
    weaknesses: ['Overthinking under stress', 'Perfectionism can slow output']
  },
  {
    id: 'deep_processor',
    name: 'Deep Processor',
    emoji: '🌊',
    ageLabel: '35–44',
    desc: 'You\'re slower to react but significantly deeper in reasoning. What you lose in reflex speed you gain in synthesis — connecting dots others never see. A rare and undervalued cognitive profile.',
    traits: ['Superior reasoning depth', 'Pattern synthesis expert', 'Long-term memory strength', 'Calm under cognitive load'],
    weaknesses: ['Reaction speed slower than average', 'Needs processing time in fast situations']
  },
  {
    id: 'wisdom_engine',
    name: 'Wisdom Engine',
    emoji: '🏛️',
    ageLabel: '45–54',
    desc: 'Experience has built robust neural pathways that compensate for any raw speed reduction. Your brain is efficient, not slow. You solve the same problems with 40% fewer cognitive resources.',
    traits: ['Crystallized intelligence peak', 'Pattern shortcuts built from experience', 'Emotional regulation strength', 'Resistant to cognitive traps'],
    weaknesses: ['Novel problems take longer', 'Risk of over-relying on familiar patterns']
  },
  {
    id: 'sage_circuit',
    name: 'Sage Circuit',
    emoji: '🌌',
    ageLabel: '55+',
    desc: 'Your brain has traded speed for wisdom and it got the better end of the deal. Accumulated pattern libraries, emotional insight, and executive function make you a cognitive asset most organizations undervalue.',
    traits: ['Peak narrative intelligence', 'Long-term pattern libraries', 'Excellent judgment under ambiguity', 'Minimal cognitive bias in decisions'],
    weaknesses: ['Fluid intelligence tests score lower', 'Multitasking energy cost is higher']
  }
];

const /** @type {any} */
def = {
  id: 'brain-age',
  title: 'Brain Age Blitz ⚡',
  metaTitle: 'Brain Age Blitz — What\'s Your Cognitive Score? | EONAPP.ch',
  metaDesc: 'Test your cognitive age with 8 quick questions covering speed, memory, pattern recognition, and focus. Share your result and challenge friends.',
  category: '⚡ Cognitive',
  description: 'Answer 8 questions about your mental speed, memory, focus, and patterns. We calculate your cognitive profile and reveal your brain\'s true performance age.',
  rewardProfile: 'quiz',
  runLabel: '⚡ Reveal My Brain Age',
  fields: [
    {
      id: 'reaction',
      type: 'choice',
      label: 'In a conversation, how quickly do you process what someone said?',
      options: [
        { value: 'instant', label: '⚡ Before they finish the sentence' },
        { value: 'fast', label: '✅ A second or two' },
        { value: 'normal', label: '🤔 Normal — I need to hear it fully' },
        { value: 'slow', label: '🐢 I often need it repeated' }
      ]
    },
    {
      id: 'memory',
      type: 'choice',
      label: 'Phone numbers, names, dates — how\'s your short-term memory?',
      options: [
        { value: 'excellent', label: '🎯 Excellent — I rarely forget things' },
        { value: 'good', label: '✅ Good — I remember most things' },
        { value: 'average', label: '📝 Average — I use notes a lot' },
        { value: 'poor', label: '😅 I forget things constantly' }
      ]
    },
    {
      id: 'focus',
      type: 'choice',
      label: 'When focusing on something difficult, you:',
      options: [
        { value: 'locked', label: '🔒 Lock in completely — hours pass fast' },
        { value: 'mostly', label: '💪 Stay focused with occasional breaks' },
        { value: 'struggle', label: '😤 Fight distraction constantly' },
        { value: 'scattered', label: '🌀 Jump topics frequently' }
      ]
    },
    {
      id: 'patterns',
      type: 'choice',
      label: 'Do you naturally notice patterns other people miss?',
      options: [
        { value: 'always', label: '🔮 Yes — I see patterns everywhere' },
        { value: 'often', label: '🎯 Often — more than average' },
        { value: 'sometimes', label: '🌤️ Sometimes' },
        { value: 'rarely', label: '📊 Rarely — I prefer data over intuition' }
      ]
    },
    {
      id: 'multitask',
      type: 'choice',
      label: 'When switching between tasks rapidly, you:',
      options: [
        { value: 'smooth', label: '🔄 Switch smoothly with no lag' },
        { value: 'decent', label: '✅ Decent — brief re-orientation needed' },
        { value: 'slow', label: '⏳ Slow to context switch' },
        { value: 'bad', label: '❌ Struggle — I prefer one thing at a time' }
      ]
    },
    {
      id: 'words',
      type: 'choice',
      label: 'When searching for a specific word or name, you:',
      options: [
        { value: 'instant', label: '⚡ Find it instantly, every time' },
        { value: 'usually', label: '✅ Usually retrieve it quickly' },
        { value: 'tip_of_tongue', label: '👅 Tip-of-tongue happens a lot' },
        { value: 'often_blank', label: '🌫️ Often go blank, find it later' }
      ]
    },
    {
      id: 'learning',
      type: 'choice',
      label: 'When learning a new skill or concept:',
      options: [
        { value: 'fast', label: '🚀 Pick it up faster than most people' },
        { value: 'average', label: '📈 Average learning curve' },
        { value: 'slow_retention', label: '📚 Slow but excellent retention' },
        { value: 'depends', label: '🎲 Depends heavily on the topic' }
      ]
    },
    {
      id: 'sleep_effect',
      type: 'choice',
      label: 'After a bad night\'s sleep, your cognitive ability:',
      options: [
        { value: 'unaffected', label: '💪 Barely affected — I power through' },
        { value: 'mild', label: '🌤️ Mildly reduced but functional' },
        { value: 'significant', label: '😩 Significantly degraded' },
        { value: 'brutal', label: '💀 I\'m completely useless' }
      ]
    }
  ],

  compute(/** @type {any} */ inputs) {
    // Score each answer (0-3)
    const /** @type {any} */
scoreMap = {
      reaction:     { instant: 3, fast: 2, normal: 1, slow: 0 },
      memory:       { excellent: 3, good: 2, average: 1, poor: 0 },
      focus:        { locked: 3, mostly: 2, struggle: 1, scattered: 0 },
      patterns:     { always: 3, often: 2, sometimes: 1, rarely: 1 },
      multitask:    { smooth: 3, decent: 2, slow: 1, bad: 0 },
      words:        { instant: 3, usually: 2, tip_of_tongue: 1, often_blank: 0 },
      learning:     { fast: 3, average: 2, slow_retention: 2, depends: 1 },
      sleep_effect: { unaffected: 3, mild: 2, significant: 1, brutal: 0 }
    };

    let total = 0;
    Object.entries(scoreMap).forEach((/** @type {any} */ [field, map]) => {
      total += map[inputs[field]] ?? 1;
    });

    // total: 0-24
    // Map to archetype (higher score = younger brain age)
    const archetypeIndex = total >= 21 ? 0 : total >= 16 ? 1 : total >= 11 ? 2 : total >= 6 ? 3 : 4;
    const archetype = BRAIN_ARCHETYPES[archetypeIndex];

    // Cognitive score: 0-100
    const cogScore = Math.round((total / 24) * 100);

    // Per-dimension breakdown (2 questions per zone)
    const speed   = Math.round(((scoreMap.reaction[inputs.reaction] ?? 1) + (scoreMap.multitask[inputs.multitask] ?? 1)) / 6 * 100);
    const memory2  = Math.round(((scoreMap.memory[inputs.memory] ?? 1) + (scoreMap.words[inputs.words] ?? 1)) / 6 * 100);
    const focus2   = Math.round(((scoreMap.focus[inputs.focus] ?? 1) + (scoreMap.sleep_effect[inputs.sleep_effect] ?? 1)) / 6 * 100);
    const pattern2 = Math.round(((scoreMap.patterns[inputs.patterns] ?? 1) + (scoreMap.learning[inputs.learning] ?? 1)) / 6 * 100);

    // Tier label
    const tier = cogScore >= 90 ? '🏆 ELITE' : cogScore >= 75 ? '💎 SHARP' : cogScore >= 55 ? '⚡ ABOVE AVG' : cogScore >= 35 ? '✅ AVERAGE' : '🌱 BUILDING';

    return { archetype, cogScore, tier, speed, memory: memory2, focus: focus2, pattern: pattern2 };
  },

  resultTemplate(/** @type {any} */ r) {
    const /** @type {any} */
dims = [
      { label: 'Processing Speed', val: r.speed,   icon: '⚡' },
      { label: 'Memory Recall',    val: r.memory,  icon: '🧠' },
      { label: 'Focus & Stamina',  val: r.focus,   icon: '🎯' },
      { label: 'Pattern Recognition', val: r.pattern, icon: '🔮' }
    ];
    const barColor = (/** @type {any} */ val) => val >= 75 ? 'var(--clr-green)' : val >= 50 ? 'var(--clr-accent)' : val >= 30 ? 'var(--clr-gold)' : 'var(--clr-red)';

    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">⚡ Your Brain Age Result</div>
          <div style="font-size:3.5rem;margin:.5rem 0">${r.archetype.emoji}</div>
          <div class="result-title gradient-text">${r.archetype.name}</div>
          <div style="color:var(--clr-accent);font-weight:700;font-size:1.05rem;margin-bottom:.25rem">Cognitive Age: ${r.archetype.ageLabel}</div>
          <div class="result-subtitle">${r.archetype.desc}</div>
        </div>

        <div style="text-align:center;margin:1.5rem 0">
          <div style="font-size:.75rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:.4rem">Overall Cognitive Score</div>
          <div style="font-size:3.2rem;font-weight:800;line-height:1">${r.cogScore}</div>
          <div style="color:var(--clr-accent);font-weight:700;font-size:1.1rem;margin-top:.25rem">${r.tier}</div>
        </div>

        <div style="background:var(--clr-bg);border-radius:2rem;height:10px;overflow:hidden;margin-bottom:1.5rem">
          <div style="width:${r.cogScore}%;height:100%;background:linear-gradient(90deg,var(--clr-accent),var(--clr-accent2));border-radius:2rem"></div>
        </div>

        <div style="display:grid;gap:.65rem;margin-bottom:1.5rem">
          ${dims.map((/** @type {any} */ d) => `
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
                <span style="font-size:.85rem;color:var(--clr-text-muted)">${d.icon} ${d.label}</span>
                <span style="font-weight:700;font-size:.9rem;color:${barColor(d.val)}">${d.val}%</span>
              </div>
              <div style="background:var(--clr-bg);border-radius:2rem;height:7px;overflow:hidden">
                <div style="width:${d.val}%;height:100%;background:${barColor(d.val)};border-radius:2rem"></div>
              </div>
            </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.25rem">
          <div style="background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);border-radius:.75rem;padding:.85rem">
            <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-green);margin-bottom:.4rem">✅ Strengths</div>
            ${r.archetype.traits.map((/** @type {any} */ t) => `<div style="font-size:.82rem;margin-bottom:.2rem">· ${t}</div>`).join('')}
          </div>
          <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.2);border-radius:.75rem;padding:.85rem">
            <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-gold);margin-bottom:.4rem">⚠️ Watch for</div>
            ${r.archetype.weaknesses.map((/** @type {any} */ w) => `<div style="font-size:.82rem;margin-bottom:.2rem">· ${w}</div>`).join('')}
          </div>
        </div>

        <div style="text-align:center;padding:.75rem;background:rgba(99,102,241,.07);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">Challenge a friend → Can they beat your cognitive score? 👇</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My Brain Age Blitz result: ${r.archetype.name} (${r.archetype.ageLabel} cognitive age) · Score: ${r.cogScore}/100 ${r.tier}. Can you beat it?`,
  challenge: (/** @type {any} */ r) => ({
    tool: 'brain-age',
    headline: 'Beat my cognitive score',
    value: r.cogScore,
    unit: '/100',
    summary: r.archetype.name,
    label: r.tier
  }),
  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.cogScore) > Number(challenge.value),

  related: [
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank', cat: 'Personality' },
    { url: '/tools/persona-mirror.html', icon: '🪞', title: 'Persona Mirror AI', cat: 'Identity' },
    { url: '/games/tap-reactor.html', icon: '🎵', title: 'Tap Reactor', cat: 'Game' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
