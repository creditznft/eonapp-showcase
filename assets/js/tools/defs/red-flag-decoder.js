/**
 * EONAPP.ch — Viral Tool #4: RED FLAG DECODER
 * "Reveal how others read your vibe in dating, work, and friendship."
 * Viral Score: 9/10 | Profit Score: 8/10 | Total: 9.0/10
 */
import { ToolEngine } from '../ToolEngine.js';

const /** @type {any} */
PERSONAS = [
  {
    name: 'Green Light Giver',
    emoji: '💚',
    range: [80, 100],
    desc: 'Rare and genuinely extraordinary. Your emotional intelligence across relationships is a gift most people spend years trying to develop. You communicate before things become conflict, repair before things become distance, and grow instead of blame. People feel safe around you — that is not small.'
  },
  {
    name: 'Yellow Flag Flicker',
    emoji: '💛',
    range: [65, 79],
    desc: 'You\'re self-aware and mostly healthy, but specific patterns surface under pressure. Avoidance shows up before clarity does. You\'re genuinely close to exceptional — a few key communication habits stand between you and consistent green.'
  },
  {
    name: 'Mixed Signal Maestro',
    emoji: '🟡',
    range: [50, 64],
    desc: 'You show up differently in different contexts. Work green, dating orange. Or friendship first, everything else last. Your inconsistency isn\'t bad character — it\'s unprocessed patterns from different chapters of your life activating in different rooms.'
  },
  {
    name: 'Invisible Walls',
    emoji: '🧱',
    range: [35, 49],
    desc: 'You protect yourself so effectively that warmth can\'t always get through — in or out. Your walls were built by real experiences that deserved protection. But right now, they\'re blocking real connection. This pattern is absolutely changeable with awareness.'
  },
  {
    name: 'Danger Zone Drifter',
    emoji: '🟠',
    range: [20, 34],
    desc: 'Warning signals are running frequently. Passive-aggression, avoidance, and reactions that escalate before they resolve. You\'re not a bad person — but some of these patterns are pushing people away faster than you can see it happening.'
  },
  {
    name: 'Red Flag Factory',
    emoji: '🚩',
    range: [0, 19],
    desc: 'Multiple relationship-damaging patterns are active across contexts. The hard truth is: these patterns have costs you may not fully see yet. The awareness that brought you here is genuinely the first step. Change is completely possible — and it starts with exactly this kind of honesty.'
  }
];

const /** @type {any} */
FLAG_SCORES = { g: 0, y: 1, o: 2, r: 3 };

const /** @type {any} */
FLAG_LABELS = {
  q1: {
    g: 'Direct emotional expression in conflict',
    y: 'Graceful non-confrontational style',
    o: 'Passive-aggression under disappointment',
    r: 'Ultimatum usage in early relationship conflict'
  },
  q2: {
    g: 'Healthy closure and clear ex-boundaries',
    y: 'Guarded but controlled',
    o: 'Poor co-regulation — partner triangulation',
    r: 'Concealment when emotionally threatened'
  },
  q3: {
    g: 'Values alignment through honest dialogue',
    y: 'Avoidance of core difference conversations',
    o: 'Covert attempts to reshape partner\'s beliefs',
    r: 'Emotional shutdown over values conflict'
  },
  q4: {
    g: 'Assertive professional self-advocacy',
    y: 'Non-confrontational under workplace pressure',
    o: 'Indirect conflict — venting instead of addressing',
    r: 'Aggression or retaliation patterns at work'
  },
  q5: {
    g: 'Open to feedback and genuinely collaborative',
    y: 'Surface compliance with internal resistance',
    o: 'Bypassing authority rather than engaging it',
    r: 'Public dismissal of leadership or team decisions'
  },
  q6: {
    g: 'Clear professional negotiation and boundary-setting',
    y: 'Resentful compliance without addressing the issue',
    o: 'Martyr performance in professional contexts',
    r: 'Aggressive confrontation over reasonable requests'
  },
  q7: {
    g: 'Proactive emotional outreach and care',
    y: 'Respects space but lacks relational initiative',
    o: 'Emotional withdrawal when feeling excluded',
    r: 'Catastrophizing temporary distance in friendships'
  },
  q8: {
    g: 'Genuine curiosity and openness to self-reflection',
    y: 'Defensive humor used as a deflection mechanism',
    o: 'Defensive reaction with minimal follow-through',
    r: 'Emotional punishment for honest, caring feedback'
  }
};

const /** @type {any} */
def = {
  id: 'red-flag-decoder',
  title: 'Red Flag Decoder',
  metaTitle: 'Red Flag Decoder — How Others Read Your Vibe | EONAPP.ch',
  metaDesc: 'See exactly how you show up in dating, work, and friendship. Calculate your flag score, discover your patterns, and find out what people really see.',
  category: '🚩 Social',
  description: '8 real scenarios. We decode how you actually show up in dating, work, and friendship — including the patterns you can\'t see from the inside.',
  rewardProfile: 'quiz',
  runLabel: '🚩 Decode My Flags',

  fields: [
    {
      id: 'q1', type: 'choice',
      label: '💑 Dating: Someone cancels last-minute for the 3rd time. You:',
      options: [
        { value: 'g', label: '💚 Express how it feels — directly and calmly' },
        { value: 'y', label: '💛 Let it slide but feel quietly annoyed' },
        { value: 'o', label: '🟠 Send "it\'s fine" then go cold for a day' },
        { value: 'r', label: '🔴 Threaten to end things in the message' }
      ]
    },
    {
      id: 'q2', type: 'choice',
      label: '💑 Dating: Your ex texts randomly after 6 months. You:',
      options: [
        { value: 'g', label: '💚 Ignore or give a brief, neutral response' },
        { value: 'y', label: '💛 Reply but keep it deliberately short' },
        { value: 'o', label: '🟠 Show your current partner and let them handle it' },
        { value: 'r', label: '🔴 Reply warmly and keep it from your partner' }
      ]
    },
    {
      id: 'q3', type: 'choice',
      label: '💑 Dating: You realize your partner has very different core values. You:',
      options: [
        { value: 'g', label: '💚 Have a direct, curious conversation about it' },
        { value: 'y', label: '💛 Minimize it and hope things resolve naturally' },
        { value: 'o', label: '🟠 Start quietly trying to shift their perspective' },
        { value: 'r', label: '🔴 Become cold or distant without saying why' }
      ]
    },
    {
      id: 'q4', type: 'choice',
      label: '💼 Work: A colleague takes credit for your idea in a meeting. You:',
      options: [
        { value: 'g', label: '💚 Politely assert your contribution right there in the room' },
        { value: 'y', label: '💛 Let it go but document it privately for later' },
        { value: 'o', label: '🟠 Vent to other colleagues without confronting them directly' },
        { value: 'r', label: '🔴 Confront them aggressively or find ways to undermine them' }
      ]
    },
    {
      id: 'q5', type: 'choice',
      label: '💼 Work: Your manager gives feedback you strongly disagree with. You:',
      options: [
        { value: 'g', label: '💚 Listen fully, ask questions, then share your perspective clearly' },
        { value: 'y', label: '💛 Nod and agree, then do it your way anyway' },
        { value: 'o', label: '🟠 Go over their head to complain to their manager' },
        { value: 'r', label: '🔴 Dismiss it publicly and tell the team it was unfair' }
      ]
    },
    {
      id: 'q6', type: 'choice',
      label: '💼 Work: You\'re asked to take on more work with no extra pay. You:',
      options: [
        { value: 'g', label: '💚 Negotiate clearly and propose a fair arrangement' },
        { value: 'y', label: '💛 Accept it but feel quietly resentful' },
        { value: 'o', label: '🟠 Do it while making sure everyone knows you\'re suffering' },
        { value: 'r', label: '🔴 Refuse aggressively and make it a scene' }
      ]
    },
    {
      id: 'q7', type: 'choice',
      label: '🤝 Friendship: A close friend is struggling but hasn\'t reached out. You:',
      options: [
        { value: 'g', label: '💚 Check in — they may not know how to ask for help' },
        { value: 'y', label: '💛 Wait for them to come to you when ready' },
        { value: 'o', label: '🟠 Feel hurt they didn\'t include you and pull back slightly' },
        { value: 'r', label: '🔴 Assume they don\'t value you and create distance' }
      ]
    },
    {
      id: 'q8', type: 'choice',
      label: '🤝 Friendship: A close friend tells you something hard about yourself. You:',
      options: [
        { value: 'g', label: '💚 Get genuinely curious — there might be truth in it' },
        { value: 'y', label: '💛 Deflect with humor but think about it privately later' },
        { value: 'o', label: '🟠 Get defensive and minimize what they said' },
        { value: 'r', label: '🔴 Stop sharing personal things with them from that point on' }
      ]
    }
  ],

  compute(/** @type {any} */ inputs) {
    const /** @type {any} */
qIds = ['q1','q2','q3','q4','q5','q6','q7','q8'];
    const /** @type {any} */
answers = {};
    qIds.forEach((/** @type {any} */ id) => { answers[id] = inputs[id] || 'y'; });

    const /** @type {any} */
datingIds = ['q1', 'q2', 'q3'];
    const /** @type {any} */
workIds   = ['q4', 'q5', 'q6'];
    const /** @type {any} */
friendIds = ['q7', 'q8'];

    const sum = (/** @type {any} */ id) => FLAG_SCORES[answers[id]] || 0;
    const datingSum  = datingIds.reduce((/** @type {any} */ s, /** @type {any} */ id) => s + sum(id), 0);
    const workSum    = workIds.reduce((/** @type {any} */ s, /** @type {any} */ id) => s + sum(id), 0);
    const friendSum  = friendIds.reduce((/** @type {any} */ s, /** @type {any} */ id) => s + sum(id), 0);
    const totalSum   = datingSum + workSum + friendSum;

    // Convert to green percentage (higher = healthier behavior)
    const datingScore  = Math.round((1 - datingSum / 9) * 100);
    const workScore    = Math.round((1 - workSum / 9) * 100);
    const friendScore  = Math.round((1 - friendSum / 6) * 100);
    const overallScore = Math.round((1 - totalSum / 24) * 100);

    // Collect labeled flags
    const /** @type {any} */
redFlags = [];
    const /** @type {any} */
greenFlags = [];
    qIds.forEach((/** @type {any} */ id) => {
      const val = answers[id];
      const score = FLAG_SCORES[val] || 0;
      const label = FLAG_LABELS[id]?.[val] || '';
      if (score >= 2 && label) redFlags.push(label);
      else if (score === 0 && label) greenFlags.push(label);
    });

    // Persona selection
    const persona = PERSONAS.find((/** @type {any} */ p) => overallScore >= p.range[0] && overallScore <= p.range[1]) || PERSONAS[2];

    return {
      overallScore,
      datingScore,
      workScore,
      friendScore,
      personaName: persona.name,
      personaEmoji: persona.emoji,
      personaDesc: persona.desc,
      redFlags: redFlags.slice(0, 3),
      greenFlags: greenFlags.slice(0, 3),
      redCount: redFlags.length,
      greenCount: greenFlags.length
    };
  },

  resultTemplate(/** @type {any} */ r) {
    const scoreColor = (/** @type {any} */ s) => {
      if (s >= 80) return 'var(--clr-green)';
      if (s >= 60) return '#84cc16';
      if (s >= 40) return '#f59e0b';
      if (s >= 20) return '#f97316';
      return 'var(--clr-red)';
    };

    const bar = (/** @type {any} */ label, /** @type {any} */ score) => `
      <div style="margin:.6rem 0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.3rem">
          <span style="font-size:.8rem;color:var(--clr-text)">${label}</span>
          <span style="font-size:.85rem;font-weight:700;color:${scoreColor(score)}">${score}/100</span>
        </div>
        <div style="height:10px;background:var(--clr-border);border-radius:5px;overflow:hidden">
          <div style="height:100%;width:${score}%;background:${scoreColor(score)};border-radius:5px;transition:width .8s ease"></div>
        </div>
      </div>`;

    const flagList = (/** @type {any} */ flags, /** @type {any} */ icon) => flags.length
      ? flags.map((/** @type {any} */ f) => `<li style="padding:.35rem 0;border-bottom:1px solid var(--clr-border);font-size:.82rem;color:var(--clr-text);line-height:1.4">${icon} ${f}</li>`).join('')
      : `<li style="padding:.35rem 0;font-size:.82rem;color:var(--clr-text-muted);font-style:italic">None detected</li>`;

    const overallColor = scoreColor(r.overallScore);

    return `
      <div class="result-card" id="eon-share-card">
        <div class="result-header">
          <div class="result-label">🚩 Your Red Flag Report</div>
          <div style="font-size:3rem;margin:.5rem 0">${r.personaEmoji}</div>
          <div class="result-title gradient-text">${r.personaName}</div>
          <div style="text-align:center;margin:1rem 0">
            <div style="font-size:.75rem;color:var(--clr-text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.4rem">Overall Green Flag Score</div>
            <div style="font-size:3.5rem;font-weight:900;line-height:1;color:${overallColor}">${r.overallScore}</div>
            <div style="font-size:.85rem;color:var(--clr-text-muted);margin-top:.25rem">out of 100</div>
          </div>
          <div class="result-subtitle">${r.personaDesc}</div>
        </div>

        <div style="background:var(--clr-bg);border-radius:.75rem;padding:1rem;margin:1.25rem 0">
          <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-text-muted);font-weight:700;margin-bottom:.75rem">📊 Context Breakdown</div>
          ${bar('💑 Dating', r.datingScore)}
          ${bar('💼 Work', r.workScore)}
          ${bar('🤝 Friendship', r.friendScore)}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
          <div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:.75rem;padding:1rem">
            <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-green);font-weight:700;margin-bottom:.6rem">💚 Green Flags (${r.greenCount})</div>
            <ul style="list-style:none;padding:0;margin:0">${flagList(r.greenFlags, '✓')}</ul>
          </div>
          <div style="background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:.75rem;padding:1rem">
            <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--clr-red);font-weight:700;margin-bottom:.6rem">🚩 Red Flags (${r.redCount})</div>
            <ul style="list-style:none;padding:0;margin:0">${flagList(r.redFlags, '✗')}</ul>
          </div>
        </div>

        <div style="text-align:center;padding:.75rem;background:rgba(99,102,241,.08);border-radius:.5rem">
          <span style="font-size:.85rem;color:var(--clr-text-muted)">Challenge a friend → Can they beat your green flag score? 👇</span>
        </div>
      </div>`;
  },

  shareText: (/** @type {any} */ r) => `My Red Flag Score: ${r.overallScore}/100. Dating: ${r.datingScore} · Work: ${r.workScore} · Friendship: ${r.friendScore}. ${r.greenCount} green flags, ${r.redCount} red flags detected. What's yours?`,

  challenge: (/** @type {any} */ r) => ({
    tool: 'red-flag-decoder',
    headline: 'Beat my green flag score',
    value: r.overallScore,
    unit: '/100',
    summary: r.personaName,
    label: `Dating ${r.datingScore} · Work ${r.workScore}`
  }),

  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => Number(result.overallScore) > Number(challenge.value),

  related: [
    { url: '/tools/persona-mirror.html', icon: '🪞', title: 'Persona Mirror AI', cat: 'Personality' },
    { url: '/tools/rarerank.html', icon: '🧠', title: 'RareRank™', cat: 'Personality' },
    { url: '/tools/future-worth.html', icon: '💰', title: 'FutureWorth Forecast', cat: 'Finance' }
  ]
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
