/**
 * EONAPP.ch — Viral Tool #6: LOVE TIMELINE ORACLE
 * "What's your next romantic milestone — and when?"
 * Viral Score: 9/10 | Profit Score: 8/10 | Total: 8.8/10
 */
import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
MILESTONES = [
  {
    id: 'deep_connection',
    title: 'The Deep Connection',
    emoji: '💞',
    timing: ['within 3 months', 'within 6 months', 'by end of year'],
    desc: 'Someone already in your life is about to reveal a layer you haven\'t seen yet. This isn\'t a new person — it\'s a new depth with an existing one.',
    catalyst: 'Vulnerability. One honest conversation unlocks it.',
    warning: 'Don\'t intellectualize it. When it happens, feel it first.'
  },
  {
    id: 'unexpected_spark',
    title: 'The Unexpected Spark',
    emoji: '⚡',
    timing: ['sooner than you think', 'within 3 months', 'when you stop looking'],
    desc: 'This arrives from a direction you\'re not watching. The strongest connections are usually the ones you didn\'t plan for.',
    catalyst: 'Showing up as yourself in a new social context.',
    warning: 'Your type might be limiting you. The spark looks different this time.'
  },
  {
    id: 'reunion_energy',
    title: 'The Reunion Pull',
    emoji: '🌀',
    timing: ['sooner than expected', 'in the next quarter', 'when timing aligns'],
    desc: 'Something from your past is circling back. Not because it\'s unfinished — because it evolved. Different people, different season.',
    catalyst: 'You\'ve changed enough that round 2 would actually work.',
    warning: 'Test the present version, not the memory.'
  },
  {
    id: 'commitment_pivot',
    title: 'The Commitment Pivot',
    emoji: '🔑',
    timing: ['within 2 months', 'at the 6-month mark', 'when you\'re ready to be honest'],
    desc: 'The next milestone is about depth, not discovery. Something already present needs a conscious step forward — or a conscious step back.',
    catalyst: 'Clarity. Stop letting things stay ambiguous.',
    warning: 'Comfort isn\'t the same as love. Know the difference before the pivot.'
  },
  {
    id: 'self_upgrade',
    title: 'The Self-Upgrade Phase',
    emoji: '🦋',
    timing: ['right now, actually', 'before the next quarter', 'this season'],
    desc: 'Your next romantic milestone isn\'t another person — it\'s a version of you that attracts a completely different caliber. This is the upgrade phase.',
    catalyst: 'One habit changed. One boundary enforced. One standard raised.',
    warning: 'You\'re not waiting for someone. Someone is waiting for you to arrive.'
  },
  {
    id: 'serious_proposal',
    title: 'The Big Step Forward',
    emoji: '🏡',
    timing: ['within the year', 'sooner than you\'ve planned', 'when you stop overthinking'],
    desc: 'Moving in, committing officially, or having the real talk — whatever "next level" means for your situation, it\'s closer than your doubt suggests.',
    catalyst: 'Saying the thing you\'ve been holding back.',
    warning: 'Fear and excitement feel identical. Check which one is actually running.'
  }
];

const /** @type {any} */
LOVE_STYLES = [
  { id: 'giver', label: 'The Devoted Giver', desc: 'You love fiercely and fully. You build, you stay, you show up.' },
  { id: 'chaser', label: 'The Passionate Chaser', desc: 'You thrive in pursuit energy. Stability can feel like stagnation until you rewire it.' },
  { id: 'guardian', label: 'The Slow Burn Guardian', desc: 'Trust is your currency. Once given, your loyalty is unconditional.' },
  { id: 'dreamer', label: 'The Romantic Dreamer', desc: 'You fall in love with potential. The challenge: loving people as they are, not as they could be.' },
  { id: 'protector', label: 'The Grounded Protector', desc: 'You show love through action. Your partner always feels safe — even if they miss your softness.' },
  { id: 'explorer', label: 'The Connection Explorer', desc: 'Every relationship teaches you something. You are still writing your definition of love.' }
];

const /** @type {any} */
def = {
  id: 'love-oracle',
  title: 'Love Timeline Oracle 💘',
  metaTitle: 'Love Timeline Oracle — Predict Your Next Romantic Milestone | EONAPP.ch',
  metaDesc: 'Predict when and how your next romantic milestone arrives. Free, instant, eerily accurate. Share your result and challenge a friend.',
  category: '💘 Prediction',
  description: 'Answer 8 questions about your current situation. We predict your next romantic milestone, reveal your love style, and tell you exactly what\'s blocking or accelerating it.',
  rewardProfile: 'quiz',
  runLabel: '🔮 Reveal My Love Timeline',
  fields: [
    {
      id: 'status',
      type: 'choice',
      label: 'Current relationship status:',
      options: [
        { value: 'single', label: '🙋 Single' },
        { value: 'dating', label: '💑 Casually dating' },
        { value: 'committed', label: '❤️ In a relationship' },
        { value: 'complicated', label: '🌀 It\'s complicated' }
      ]
    },
    {
      id: 'last_connection',
      type: 'choice',
      label: 'When did you last feel a genuine connection with someone?',
      options: [
        { value: 'recent', label: '⚡ Recently / right now' },
        { value: 'months', label: '📆 A few months ago' },
        { value: 'year', label: '🗓️ Over a year ago' },
        { value: 'unsure', label: '🌫️ Not sure / unsure' }
      ]
    },
    {
      id: 'primary_block',
      type: 'choice',
      label: 'What\'s most in your way right now?',
      options: [
        { value: 'timing', label: '⏰ Timing / life stage' },
        { value: 'trust', label: '🔒 Trust issues from the past' },
        { value: 'standards', label: '🎯 Haven\'t met the right person' },
        { value: 'nothing', label: '✅ Nothing — I\'m open and ready' }
      ]
    },
    {
      id: 'love_language',
      type: 'choice',
      label: 'How do you mainly express love?',
      options: [
        { value: 'words', label: '💬 Words and deep talks' },
        { value: 'acts', label: '🔧 Acts of service' },
        { value: 'touch', label: '🤝 Physical presence' },
        { value: 'gifts', label: '🎁 Thoughtful gestures' }
      ]
    },
    {
      id: 'pattern',
      type: 'choice',
      label: 'What pattern keeps repeating in your love life?',
      options: [
        { value: 'unavailable', label: '🏃 I attract emotionally unavailable people' },
        { value: 'toolong', label: '⏳ I stay too long in wrong situations' },
        { value: 'overthink', label: '🧠 I overthink and self-sabotage' },
        { value: 'no_pattern', label: '🌱 I don\'t see a repeating pattern' }
      ]
    },
    {
      id: 'openness',
      type: 'choice',
      label: 'How emotionally open are you right now?',
      options: [
        { value: 'very', label: '🌊 Very — walls are down' },
        { value: 'mostly', label: '🌤️ Mostly — some guards up' },
        { value: 'guarded', label: '🧱 Guarded — been hurt recently' },
        { value: 'closed', label: '🔒 Closed — not looking' }
      ]
    },
    {
      id: 'social',
      type: 'choice',
      label: 'How often do you enter new social situations?',
      options: [
        { value: 'often', label: '🎉 Often — new people all the time' },
        { value: 'sometimes', label: '🙂 Sometimes — my social circle rotates slowly' },
        { value: 'rarely', label: '🏠 Rarely — mostly same people' },
        { value: 'never', label: '💻 Almost never — mostly digital' }
      ]
    },
    {
      id: 'gut',
      type: 'choice',
      label: 'Deep down, what does your gut say about your love life?',
      options: [
        { value: 'close', label: '✨ Something good is close' },
        { value: 'work', label: '🔨 I need to work on myself first' },
        { value: 'wait', label: '⏳ It\'s just not the right time yet' },
        { value: 'unknown', label: '🎲 Genuinely no idea' }
      ]
    }
  ],

  /** @param {{openness: string; social: string; primary_block: string; gut: string; last_connection: string; pattern: string; status: string}} inputs */
  compute(/** @type {any} */ inputs) {
    // Scoring weights
    const /** @type {any} */
opennessMap = { very: 4, mostly: 3, guarded: 1, closed: 0 };
    const /** @type {any} */
socialMap   = { often: 4, sometimes: 3, rarely: 1, never: 0 };
    const /** @type {any} */
blockMap    = { nothing: 4, standards: 3, timing: 2, trust: 0 };
    const /** @type {any} */
gutMap      = { close: 4, work: 2, wait: 1, unknown: 2 };
    const /** @type {any} */
connectionMap = { recent: 4, months: 2, year: 1, unsure: 1 };
    
    const opennessScore = (/** @type {any} */ (opennessMap))[inputs.openness] ?? 2;
    const socialScore   = (/** @type {any} */ (socialMap))[inputs.social] ?? 2;
    const blockScore    = (/** @type {any} */ (blockMap))[inputs.primary_block] ?? 2;
    const gutScore      = (/** @type {any} */ (gutMap))[inputs.gut] ?? 2;
    const connectionScore = (/** @type {any} */ (connectionMap))[inputs.last_connection] ?? 2;

    const total = opennessScore + socialScore + blockScore + gutScore + connectionScore; // 0-20

    // Milestone selection: combine numeric seed + pattern
    const /** @type {any} */
patternWeights = { unavailable: 2, toolong: 3, overthink: 1, no_pattern: 0 };
    const /** @type {any} */
statusWeights  = { single: 0, dating: 1, committed: 2, complicated: 3 };
    const seed = total + ((/** @type {any} */ (patternWeights))[inputs.pattern] || 0) + ((/** @type {any} */ (statusWeights))[inputs.status] || 0);
    const milestone = MILESTONES[seed % MILESTONES.length];

    // Timing index: higher score = sooner
    const timingIndex = total >= 16 ? 0 : total >= 10 ? 1 : 2;
    const timing = milestone.timing[timingIndex];

    // Love style
    const /** @type {any} */
loveStyleMap = {
      words:   inputs.status === 'single' ? 'dreamer' : 'giver',
      acts:    inputs.openness === 'guarded' ? 'protector' : 'guardian',
      touch:   inputs.social === 'often' ? 'chaser' : 'giver',
      gifts:   inputs.gut === 'close' ? 'dreamer' : 'explorer'
    };
    const loveStyleId = (/** @type {any} */ (loveStyleMap))[(/** @type {any} */ (inputs)).love_language] || 'explorer';
    const loveStyle = LOVE_STYLES.find((/** @type {any} */ s) => s.id === loveStyleId) || LOVE_STYLES[5];

    // Readiness score (0-100)
    const readiness = Math.round((total / 20) * 100);

    // Accelerator: what would speed things up
    const /** @type {any} */
accelerators = {
      unavailable: 'Break the pattern: the next person who feels "too easy" might be exactly right.',
      toolong:     'Practice the exit: knowing when to leave is as important as knowing when to stay.',
      overthink:   'Take one unanalyzed risk this month. Let your gut lead for once.',
      no_pattern:  'You\'re positioned well. The main variable is showing up consistently.'
    };
    const accelerator = accelerators[inputs.pattern] || accelerators.no_pattern;

    return { milestone, timing, loveStyle, readiness, accelerator, inputs };
  },

  resultTemplate(/** @type {any} */ r) {
    const { milestone, timing, loveStyle, readiness, accelerator } = r;
    const readinessColor = readiness >= 70 ? 'var(--clr-green)' : readiness >= 40 ? 'var(--clr-gold)' : 'var(--clr-text-muted)';

    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">💘 Your Love Timeline</div>
          <div style="font-size:3.5rem;margin:.5rem 0">${milestone.emoji}</div>
          <div class="result-title gradient-text">${milestone.title}</div>
          <div style="background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);border-radius:.75rem;padding:.75rem 1rem;margin:.75rem 0;text-align:center">
            <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:var(--clr-text-muted);margin-bottom:.25rem">Predicted arrival</div>
            <div style="font-size:1.4rem;font-weight:800;color:var(--clr-accent)">${timing}</div>
          </div>
          <p class="result-subtitle">${milestone.desc}</p>
        </div>

        <div style="display:grid;gap:.75rem;margin:1.5rem 0">
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;border:1px solid var(--clr-border)">
            <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);margin-bottom:.4rem">⚡ What catalyzes it</div>
            <div style="font-size:.9rem;font-weight:600">${milestone.catalyst}</div>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;border:1px solid rgba(239,68,68,.2)">
            <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-red);margin-bottom:.4rem">⚠️ Watch for</div>
            <div style="font-size:.9rem">${milestone.warning}</div>
          </div>
        </div>

        <div style="background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(168,85,247,.06));border:1px solid rgba(99,102,241,.2);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
          <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
            <span style="font-size:1.5rem">${loveStyle.id === 'giver' ? '💝' : loveStyle.id === 'chaser' ? '🏃' : loveStyle.id === 'guardian' ? '🛡️' : loveStyle.id === 'dreamer' ? '🌙' : loveStyle.id === 'protector' ? '🏔️' : '🧭'}</span>
            <div>
              <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted)">Your love style</div>
              <div style="font-weight:700;color:var(--clr-accent)">${loveStyle.label}</div>
            </div>
          </div>
          <p style="font-size:.87rem;color:var(--clr-text-muted)">${loveStyle.desc}</p>
        </div>

        <div style="margin-bottom:1.25rem">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
            <span style="font-size:.8rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.08em">Love readiness</span>
            <span style="font-weight:700;color:${readinessColor}">${readiness}%</span>
          </div>
          <div style="background:var(--clr-bg);border-radius:2rem;height:10px;overflow:hidden">
            <div style="width:${readiness}%;height:100%;background:${readiness >= 70 ? 'var(--clr-green)' : readiness >= 40 ? 'var(--clr-gold)' : 'var(--clr-border)'};border-radius:2rem;transition:width .6s ease"></div>
          </div>
        </div>

        <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;border:1px solid var(--clr-border)">
          <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);margin-bottom:.4rem">🚀 Your accelerator</div>
          <div style="font-size:.9rem;font-style:italic">"${accelerator}"</div>
        </div>

        <div style="text-align:center;margin-top:1.25rem;padding:.75rem;background:rgba(99,102,241,.06);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">What milestone did your friend get? Send them the challenge 👇</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My Love Timeline Oracle result: "${r.milestone.title}" — predicted ${r.timing}. Love readiness: ${r.readiness}%. What's yours?`,
  challenge: (/** @type {any} */ r) => ({
    tool: 'love-oracle',
    headline: 'Compare love timelines',
    value: r.readiness,
    unit: '%',
    summary: r.milestone.title,
    label: `${r.milestone.emoji} ${r.milestone.title}`
  }),
  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.readiness) > Number(challenge.value),

  related: [
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank', cat: 'Personality' },
    { url: '/tools/red-flag-decoder.html', icon: '🚩', title: 'Red Flag Decoder', cat: 'Social' },
    { url: '/tools/persona-mirror.html', icon: '🪞', title: 'Persona Mirror AI', cat: 'Identity' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
