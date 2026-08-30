/**
 * EONAPP.ch — Viral Tool #3: PERSONA MIRROR AI
 * "A logic-powered identity scan revealing your true archetype and shadow self."
 * Viral Score: 9/10 | Profit Score: 8/10 | Total: 9.0/10
 */
import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
ARCHETYPES = [
  // 0: Ruler (Power + Logic)
  {
    name: 'The Ruler',
    emoji: '👑',
    label: 'Architect of Order',
    desc: 'You were born to lead systems, not just people. Strategy runs in your blood. Authority isn\'t something you seek — it\'s simply where you end up. Your clarity about how things should be is equal parts gift and burden.',
    shadow: { name: 'The Tyrant', desc: 'Your shadow controls through fear of losing control itself. Every rule you set carries a quiet terror of what happens when order breaks down.' },
    blindSpots: ['Delegating without quietly double-checking everything', 'Admitting emotional needs before they become explosive pressure', 'Seeing value in unstructured, messy thinking'],
    hiddenStrengths: ['Extraordinary calm in crises that shatter others', 'Seeing 10-year consequences in today\'s small choices', 'Making the hard call no one else will make'],
    compat: { 'The Sage': 92, 'The Rebel': 71, 'The Empath': 63, 'The Magician': 88 }
  },
  // 1: Rebel (Power + Intuition)
  {
    name: 'The Rebel',
    emoji: '⚡',
    label: 'Disruptor by Design',
    desc: 'You sense cracks in every system before anyone else does. Rules feel like cages built by people who stopped asking "why." Your best work happens exactly at the boundary of what\'s allowed — and slightly past it.',
    shadow: { name: 'The Destroyer', desc: 'Your shadow burns things down for the feeling of it, not the vision. Disruption without direction is just destruction with better branding.' },
    blindSpots: ['Finishing things after the exciting phase has ended', 'Trusting that some systems exist for genuinely good reasons', 'Accepting help without interpreting it as weakness'],
    hiddenStrengths: ['Seeing broken assumptions everyone else unconsciously accepts', 'Thriving in uncertainty that paralyzes others', 'Inspiring people to question everything they thought was fixed'],
    compat: { 'The Magician': 90, 'The Ruler': 71, 'The Sage': 68, 'The Hero': 85 }
  },
  // 2: Hero (Power + Connection)
  {
    name: 'The Hero',
    emoji: '🛡️',
    label: 'Born for the Storm',
    desc: 'You rise when the pressure rises. Challenge isn\'t something that happens to you — it\'s the environment you need to function at full capacity. Your deepest motivation is proving to yourself, through action, that you are enough.',
    shadow: { name: 'The Martyr', desc: 'Your shadow fights battles for others to avoid facing your own. Saving the world is infinitely easier than saving yourself — and far more visible.' },
    blindSpots: ['Resting without guilt or the narrative about wasting time', 'Letting others protect you, for once', 'Acknowledging victories before immediately chasing the next one'],
    hiddenStrengths: ['Genuine courage in the face of odds that send others home', 'Making others feel invincible just by being present', 'Converting personal pain into fuel for extraordinary output'],
    compat: { 'The Rebel': 85, 'The Caregiver': 79, 'The Empath': 72, 'The Sage': 76 }
  },
  // 3: Sage (Connection + Logic)
  {
    name: 'The Sage',
    emoji: '🦉',
    label: 'Keeper of Truth',
    desc: 'Truth is your obsession. You cannot rest until you understand the mechanics beneath the surface of things. You don\'t teach to be useful — you teach because not knowing is, to you, a kind of suffering.',
    shadow: { name: 'The Orphan', desc: 'Your shadow uses knowledge as a wall. If you know everything, you need no one. Wisdom used for distance is just sophisticated loneliness.' },
    blindSpots: ['Acting before achieving full certainty — which will never arrive', 'Accepting emotional truth as valid data alongside logic', 'Letting people be wrong in peace, without needing to correct them'],
    hiddenStrengths: ['Synthesizing complex, disconnected ideas into rare clarity', 'Staying cool when everyone around you is reacting emotionally', 'Long-term thinking that compounds quietly into genuine wisdom'],
    compat: { 'The Ruler': 92, 'The Magician': 87, 'The Hero': 76, 'The Rebel': 68 }
  },
  // 4: Empath (Connection + Intuition)
  {
    name: 'The Empath',
    emoji: '🌊',
    label: 'The Feeling Architect',
    desc: 'You feel what others cannot name. Rooms shift when you enter — sometimes without you even trying. Your emotional intelligence is a genuine superpower, and like all superpowers, it came wrapped in a wound.',
    shadow: { name: 'The Absorber', desc: 'Your shadow drowns in other people\'s feelings. The line between compassion and self-erasure blurs dangerously. Their storms become your permanent weather.' },
    blindSpots: ['Setting clear limits without the guilt spiral that follows', 'Distinguishing your own emotions from those you\'ve absorbed from others', 'Letting people experience their own consequences without intervening'],
    hiddenStrengths: ['Reading the subtext in every room — what is really said beneath the words', 'Creating a safety that makes people tell you things they\'ve never said aloud', 'Healing through pure presence, before a single word is spoken'],
    compat: { 'The Caregiver': 94, 'The Hero': 72, 'The Rebel': 60, 'The Sage': 78 }
  },
  // 5: Magician (Logic + Intuition)
  {
    name: 'The Magician',
    emoji: '✨',
    label: 'The Transformer',
    desc: 'You translate the invisible into the real. Patterns that others overlook are obvious to you. You don\'t just solve problems — you dissolve them by changing the frame they live in. Others call it genius; you call it obvious.',
    shadow: { name: 'The Manipulator', desc: 'Your shadow uses insight to engineer outcomes rather than enable them. When transformation becomes control, magic becomes a sophisticated form of manipulation.' },
    blindSpots: ['Sharing your process, not just your finished results', 'Trusting others\' intuition as equally valid alongside your own', 'Accepting that some things aren\'t yours to fix or transform'],
    hiddenStrengths: ['Connecting dots across completely unrelated fields into something new', 'Reframing what the game is — not just how to play it', 'Carrying a vision clearly when everyone else has already given up'],
    compat: { 'The Rebel': 90, 'The Sage': 87, 'The Creator': 85, 'The Ruler': 88 }
  },
  // 6: Caregiver (Connection dominant)
  {
    name: 'The Caregiver',
    emoji: '💛',
    label: 'Guardian of Others',
    desc: 'Your instinct is to protect, nurture, and hold space. Love isn\'t something you feel — it\'s something you do, constantly, often without recognition or reciprocation. Your presence is, for many people, a kind of home.',
    shadow: { name: 'The Martyr', desc: 'Your shadow gives until empty, then feels quiet resentment building. Giving from a depleted state isn\'t love — it\'s slow self-collapse dressed up as generosity.' },
    blindSpots: ['Receiving care without immediately deflecting or minimizing it', 'Recognizing when "helping" is actually a subtle form of control', 'Making your own needs non-negotiable, not optional'],
    hiddenStrengths: ['Building trust that money, status, and performance cannot replicate', 'Holding communities together during disintegration — quietly, effectively', 'Unconditional positive regard: the rarest and most powerful relationship skill'],
    compat: { 'The Empath': 94, 'The Hero': 79, 'The Sage': 71, 'The Ruler': 65 }
  },
  // 7: Creator (balanced / Logic + Intuition alternate)
  {
    name: 'The Creator',
    emoji: '🎨',
    label: 'Builder of Worlds',
    desc: 'You cannot not create. The drive to build something real from nothing is as involuntary as breathing. Your identity lives inside your work — simultaneously your most powerful strength and the trap that never lets you fully rest.',
    shadow: { name: 'The Perfectionist', desc: 'Your shadow never ships. It keeps reworking, polishing, never declaring anything ready. Creation paralysis disguised as very high standards.' },
    blindSpots: ['Releasing work before it\'s perfect — which it never will be, and that\'s the point', 'Valuing the messy creative process, not only the finished product', 'Accepting collaboration without experiencing it as invasion of your vision'],
    hiddenStrengths: ['Making genuine beauty out of raw, unprocessed chaos', 'Persisting through the unbearable ugly middle when everyone else quits', 'Giving people a vision of something they couldn\'t have imagined wanting until they saw it'],
    compat: { 'The Magician': 85, 'The Rebel': 80, 'The Empath': 77, 'The Sage': 82 }
  }
];

// Dimension index helpers
// p=0, c=1, l=2, i=3
const /** @type {any} */
PAIR_TO_IDX = {
  'cp': 2,  // Power + Connection = Hero
  'lp': 0,  // Power + Logic = Ruler
  'ip': 1,  // Power + Intuition = Rebel
  'cl': 3,  // Connection + Logic = Sage
  'ci': 4,  // Connection + Intuition = Empath
  'il': 5,  // Logic + Intuition = Magician
};
const /** @type {any} */
SINGLE_MAP = { p: 0, c: 6, l: 3, i: 5 };

const /** @type {any} */
def = {
  id: 'persona-mirror',
  title: 'Persona Mirror AI',
  metaTitle: 'Persona Mirror AI — Your Hidden Archetype Revealed | EONAPP.ch',
  metaDesc: 'Deep psychology meets pattern recognition. 10 questions reveal your true archetype, shadow self, blind spots, and hidden strengths. More accurate than MBTI.',
  category: '🪞 Personality',
  description: '10 deep questions. We analyze your subconscious patterns and reveal your true archetype — including the shadow self you\'ve been hiding from yourself.',
  rewardProfile: 'quiz',
  runLabel: '🪞 Reveal My Persona',

  fields: [
    {
      id: 'q1', type: 'choice',
      label: 'When you achieve something great, your first instinct is:',
      options: [
        { value: 'c', label: '🌍 Share it — success means nothing alone' },
        { value: 'l', label: '🔍 Analyze exactly what went right' },
        { value: 'p', label: '⚡ Ask what\'s next immediately' },
        { value: 'i', label: '🌙 Sit quietly and feel it first' }
      ]
    },
    {
      id: 'q2', type: 'choice',
      label: 'Your deepest fear (the one you rarely admit) is:',
      options: [
        { value: 'p', label: '👻 Becoming irrelevant or forgotten' },
        { value: 'c', label: '💔 That no one truly knows the real you' },
        { value: 'l', label: '❓ Making a catastrophically wrong decision' },
        { value: 'i', label: '🌫️ Losing touch with who you really are' }
      ]
    },
    {
      id: 'q3', type: 'choice',
      label: 'In conflict, you instinctively:',
      options: [
        { value: 'p', label: '🗡️ Hold your ground — backing down feels like dying' },
        { value: 'c', label: '🤝 Find the bridge — the relationship matters more than winning' },
        { value: 'l', label: '📊 Present the evidence and let truth decide' },
        { value: 'i', label: '🌀 Go quiet — you need to feel the situation before speaking' }
      ]
    },
    {
      id: 'q4', type: 'choice',
      label: 'Your inner critic most often says:',
      options: [
        { value: 'p', label: '🏆 "You\'re not successful enough yet"' },
        { value: 'c', label: '👥 "They don\'t actually like you"' },
        { value: 'l', label: '🧠 "You\'re not smart enough for this"' },
        { value: 'i', label: '🫥 "You\'re too much — tone it down"' }
      ]
    },
    {
      id: 'q5', type: 'choice',
      label: 'At your core, you want your life to feel like:',
      options: [
        { value: 'p', label: '🏛️ A monument — respected, enduring, built to last' },
        { value: 'c', label: '🔥 A hearth — warm, alive, people gathered around you' },
        { value: 'l', label: '🗺️ A map — clear, accurate, every part understood' },
        { value: 'i', label: '🌊 An ocean — deep, free, impossible to fully contain' }
      ]
    },
    {
      id: 'q6', type: 'choice',
      label: 'Others describe you as (even when you\'d add more nuance):',
      options: [
        { value: 'p', label: '🚀 Driven / relentless / intimidating' },
        { value: 'c', label: '💛 Warm / generous / always there' },
        { value: 'l', label: '💡 Smart / analytical / measured' },
        { value: 'i', label: '🔮 Different / deep / hard to fully read' }
      ]
    },
    {
      id: 'q7', type: 'choice',
      label: 'When everything falls apart, you:',
      options: [
        { value: 'p', label: '🔒 Tighten the grip and double down on control' },
        { value: 'c', label: '📞 Reach out — you can\'t carry collapse alone' },
        { value: 'l', label: '📋 Build the plan — structure is the only antidote to chaos' },
        { value: 'i', label: '🕯️ Go inward and search for the deeper meaning in it' }
      ]
    },
    {
      id: 'q8', type: 'choice',
      label: 'Your relationship with rules is:',
      options: [
        { value: 'p', label: '👑 I write them — or I rewrite the broken ones' },
        { value: 'c', label: '🕊️ I follow if it keeps peace and genuinely serves people' },
        { value: 'l', label: '✅ I follow if they make clear logical sense' },
        { value: 'i', label: '🚪 Rules feel like boxes built by people who are afraid to live' }
      ]
    },
    {
      id: 'q9', type: 'choice',
      label: 'Your most secret longing is:',
      options: [
        { value: 'i', label: '🌌 To be completely and truly understood by at least one person' },
        { value: 'c', label: '💞 To matter deeply to exactly the right people' },
        { value: 'l', label: '🎓 To master something so fully it becomes a form of art' },
        { value: 'p', label: '🗽 To shed every expectation and live entirely on your own terms' }
      ]
    },
    {
      id: 'q10', type: 'choice',
      label: 'In daydreams, you most often see yourself:',
      options: [
        { value: 'p', label: '🎤 Leading something that fundamentally changes how people think' },
        { value: 'c', label: '🌿 Healing or protecting someone who genuinely needs you' },
        { value: 'l', label: '🧩 Solving something impossibly complex — and nailing it cleanly' },
        { value: 'i', label: '🗺️ Wandering somewhere unmapped, discovering something unknown' }
      ]
    }
  ],

  compute(/** @type {any} */ inputs) {
    const /** @type {any} */
scores = { p: 0, c: 0, l: 0, i: 0 };
    ['q1','q2','q3','q4','q5','q6','q7','q8','q9','q10'].forEach((/** @type {any} */ id) => {
      const v = inputs[id];
      if (v && scores[v] !== undefined) scores[v]++;
    });

    const total = Object.values(scores).reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) || 1;
    const /** @type {any} */
pct = {
      p: Math.round(scores.p / total * 100),
      c: Math.round(scores.c / total * 100),
      l: Math.round(scores.l / total * 100),
      i: Math.round(scores.i / total * 100)
    };

    // Sort dimensions by score descending
    const sorted = Object.entries(scores).sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1]);
    const top1 = sorted[0][0];
    const top2 = sorted[1][0];

    // Determine archetype from top-2 pair
    const pair = [top1, top2].sort().join('');
    let archetypeIdx = PAIR_TO_IDX[pair];
    if (archetypeIdx === undefined) {
      archetypeIdx = SINGLE_MAP[top1] !== undefined ? SINGLE_MAP[top1] : 0;
    }

    // If all scores nearly equal → Creator (multidimensional)
    const maxScore = sorted[0][1];
    const minScore = sorted[3][1];
    if (maxScore - minScore <= 1 && total >= 8) {
      archetypeIdx = 7;
    }

    const archetype = ARCHETYPES[archetypeIdx];

    // Personalize compatibility scores with a deterministic hash of inputs
    const hash = Object.values(inputs).join('').split('').reduce((/** @type {any} */ a, /** @type {any} */ c) => a + c.charCodeAt(0), 0);
    const compat = Object.entries(archetype.compat).map((/** @type {any} */ [name, base]) => ({
      name,
      score: Math.min(99, Math.max(50, base + (hash % 9) - 4))
    }));

    const avgCompat = Math.round(compat.reduce((/** @type {any} */ a, /** @type {any} */ c) => a + c.score, 0) / compat.length);

    return {
      archetypeName: archetype.name,
      archetypeEmoji: archetype.emoji,
      archetypeLabel: archetype.label,
      archetypeDesc: archetype.desc,
      shadowName: archetype.shadow.name,
      shadowDesc: archetype.shadow.desc,
      blindSpots: archetype.blindSpots,
      hiddenStrengths: archetype.hiddenStrengths,
      compat,
      avgCompat,
      scores: pct
    };
  },

  resultTemplate(/** @type {any} */ r) {
    const /** @type {any} */
dimColors = { p: '#f59e0b', c: '#ec4899', l: '#6366f1', i: '#10b981' };
    const /** @type {any} */
dimLabels = { p: 'Power', c: 'Connection', l: 'Logic', i: 'Intuition' };

    const dimBars = Object.entries(r.scores).map((/** @type {any} */ [k, v]) => `
      <div style="display:flex;align-items:center;gap:.75rem;margin:.35rem 0">
        <div style="min-width:90px;font-size:.78rem;color:var(--clr-text-muted)">${dimLabels[k]}</div>
        <div style="flex:1;height:7px;background:var(--clr-border);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${v}%;background:${dimColors[k]};border-radius:4px"></div>
        </div>
        <div style="min-width:32px;font-size:.78rem;font-weight:700;text-align:right;color:${dimColors[k]}">${v}%</div>
      </div>`).join('');

    const compatBars = r.compat.map((/** @type {any} */ c) => `
      <div style="display:flex;align-items:center;gap:.75rem;margin:.35rem 0">
        <div style="min-width:115px;font-size:.78rem;color:var(--clr-text)">${c.name}</div>
        <div style="flex:1;height:7px;background:var(--clr-border);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${c.score}%;background:var(--clr-accent);border-radius:4px"></div>
        </div>
        <div style="min-width:32px;font-size:.78rem;font-weight:700;color:var(--clr-accent);text-align:right">${c.score}%</div>
      </div>`).join('');

    const bsList = r.blindSpots.map((/** @type {any} */ b) =>
      `<li style="padding:.4rem 0;border-bottom:1px solid var(--clr-border);font-size:.83rem;color:var(--clr-text);line-height:1.4">${b}</li>`
    ).join('');

    const hsList = r.hiddenStrengths.map((/** @type {any} */ h) =>
      `<li style="padding:.4rem 0;border-bottom:1px solid var(--clr-border);font-size:.83rem;color:var(--clr-text);line-height:1.4">${h}</li>`
    ).join('');

    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">🪞 Your Persona Mirror</div>
          <div style="font-size:3rem;margin:.5rem 0">${r.archetypeEmoji}</div>
          <div class="result-title gradient-text">${r.archetypeName}</div>
          <div style="color:var(--clr-accent);font-weight:600;margin-bottom:.5rem">${r.archetypeLabel}</div>
          <div class="result-subtitle">${r.archetypeDesc}</div>
        </div>

        <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:.75rem;padding:1rem;margin:1.25rem 0">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-red);font-weight:700;margin-bottom:.4rem">🌑 Shadow Archetype — The Part You Hide</div>
          <div style="font-size:1.05rem;font-weight:800;color:var(--clr-text);margin-bottom:.3rem">${r.shadowName}</div>
          <div style="font-size:.83rem;color:var(--clr-text-muted);line-height:1.5">${r.shadowDesc}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.25rem 0">
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem">
            <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-red);font-weight:700;margin-bottom:.6rem">⚠️ Blind Spots</div>
            <ul style="list-style:none;padding:0;margin:0">${bsList}</ul>
          </div>
          <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem">
            <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-green);font-weight:700;margin-bottom:.6rem">💎 Hidden Strengths</div>
            <ul style="list-style:none;padding:0;margin:0">${hsList}</ul>
          </div>
        </div>

        <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);font-weight:700;margin-bottom:.65rem">🧬 Psychic Profile</div>
          ${dimBars}
        </div>

        <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;margin-bottom:1.25rem">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);font-weight:700;margin-bottom:.65rem">🤝 Compatibility Score</div>
          ${compatBars}
        </div>

        <div style="text-align:center;padding:.75rem;background:rgba(99,102,241,.08);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">Eerily accurate? Tag someone who needs to see their shadow self 👇</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My Persona Mirror revealed I'm ${r.archetypeName} hiding a ${r.shadowName} shadow. Eerily accurate. What's yours? #PersonaMirror`,

  challenge: (/** @type {any} */ r) => ({
    tool: 'persona-mirror',
    headline: 'Beat my compatibility score',
    value: r.avgCompat,
    unit: '%',
    summary: r.archetypeName,
    label: r.archetypeLabel
  }),

  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.avgCompat) > Number(challenge.value),

  related: [
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank™', cat: 'Personality' },
    { url: '/tools/red-flag-decoder.html', icon: '🚩', title: 'Red Flag Decoder', cat: 'Social' },
    { url: '/tools/crypto-fate.html', icon: '₿', title: 'Crypto Fate Index', cat: 'Finance' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
