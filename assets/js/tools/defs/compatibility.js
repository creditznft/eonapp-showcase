import { ToolEngine } from '../ToolEngine.js';

// 8x8 compatibility matrix [archA][archB] = { score, chemistry, strengths, friction }
const /** @type {any} */
ARCHETYPES = [
  { id: 0, name: 'Analytical Visionary', emoji: '🔬', rarity: '4%', traits: ['logical', 'strategic', 'independent'] },
  { id: 1, name: 'Creative Strategist',  emoji: '🎯', rarity: '7%', traits: ['adaptable', 'inventive', 'goal-driven'] },
  { id: 2, name: 'Empathic Analyst',     emoji: '🌊', rarity: '6%', traits: ['intuitive', 'caring', 'reflective'] },
  { id: 3, name: 'Practical Innovator',  emoji: '⚙️', rarity: '9%', traits: ['hands-on', 'resourceful', 'action-focused'] },
  { id: 4, name: 'Visionary Rebel',      emoji: '🚀', rarity: '3%', traits: ['bold', 'unconventional', 'future-focused'] },
  { id: 5, name: 'Silent Architect',     emoji: '🏛️', rarity: '5%', traits: ['methodical', 'precise', 'reserved'] },
  { id: 6, name: 'Social Catalyst',      emoji: '⚡', rarity: '8%', traits: ['energetic', 'persuasive', 'connector'] },
  { id: 7, name: 'Deep Thinker',         emoji: '🌌', rarity: '2%', traits: ['philosophical', 'introspective', 'complex'] },
];

// Full 8×8 matrix. Each pair: { score: 0-100, chemistry: string, strengths: string[], friction: string[], insight: string }
// Matrix is symmetric — we store upper triangle and mirror
const /** @type {any} */
RAW = [
  // 0 vs 0-7
  [
    { score:72, chemistry:'Mirror Match',         strengths:['Deep intellectual discussions','Shared love of systems','Long-term planning alignment'],                friction:['Compete for being "right"','Both can be emotionally distant','Slow to resolve conflict'],          insight:'Two Analytical Visionaries can build extraordinary things together — but you\'ll need to appoint a tiebreaker. Your biggest risk is turning every decision into a debate.' },
    { score:88, chemistry:'Vision + Execution',   strengths:['Ideas become real plans','Complementary thinking styles','Mutual respect for competence'],             friction:['Strategist may outpace Visionary\'s perfectionism','Different definitions of "done"'],                      insight:'This is one of the highest-functioning pairings. The Creative Strategist turns the Analytical Visionary\'s concepts into momentum. Rare chemistry.' },
    { score:79, chemistry:'Head meets Heart',      strengths:['Empathic Analyst softens sharp edges','Deep mutual understanding','Strong emotional + logical balance'], friction:['Analyst may feel under-appreciated','Visionary can dismiss emotional needs'],                           insight:'This pairing creates unusual depth. The Empathic Analyst brings warmth to the Analytical Visionary\'s world, but the Visionary must learn to receive it.' },
    { score:83, chemistry:'Blueprint & Build',     strengths:['Theory meets practice','High output efficiency','Respect for competence'],                             friction:['Innovator may find Visionary too abstract','Visionary may find Innovator impatient'],                     insight:'Powerful working pair. One designs the architecture, the other builds it. Friction emerges when the Innovator wants to move before all the details are decided.' },
    { score:91, chemistry:'Rarest Alliance',       strengths:['Explosive creative synergy','Both reject the ordinary','Mutual intellectual respect'],                  friction:['Can become isolated from everyone else','Hard to maintain practical life','Ego clashes on vision'],         insight:'The rarest and most electric pairing on the chart. Together you\'ll build things no one else would dare attempt. The challenge: staying grounded.' },
    { score:76, chemistry:'Precision & Depth',     strengths:['Shared love of accuracy','Zero tolerance for mediocrity','Strong structural thinking'],                 friction:['Both may struggle to express feelings','Can default to silence in conflict','Slow emotional intimacy'],     insight:'An unusually stable pairing where neither person wastes words. The risk is emotional distance — both need to consciously choose vulnerability.' },
    { score:65, chemistry:'Spark & Structure',     strengths:['Catalyst brings energy Visionary lacks','Great social coverage between them','Complementary public roles'], friction:['Very different communication speeds','Catalyst may feel unseen','Visionary may feel overwhelmed'],      insight:'High contrast — but contrast can be magnetic. The Social Catalyst pulls the Analytical Visionary into the world. The Visionary gives the Catalyst something worth saying.' },
    { score:94, chemistry:'Cosmic Understanding',  strengths:['Deepest intellectual bond possible','Shared philosophical worldview','Each feels truly understood'],     friction:['Both need alone time — can drift apart','May overthink relationship itself','Low practical output together'], insight:'The highest-scoring pairing. Two rare types who finally feel understood. The risk is getting lost in your own heads together — someone has to remember the grocery list.' },
  ],
  // 1 vs 0-7
  [
    null, // mirror of 0,1
    { score:74, chemistry:'Strategy Squared',      strengths:['Extremely aligned on goals','Fast collaborative decision-making','High mutual ambition'],               friction:['Can become a competitive relationship','Blind to each other\'s blind spots','Both may avoid vulnerability'], insight:'Two Creative Strategists can take over any room — but make sure you\'re building toward shared goals, not parallel empires. Healthy rivalry or unhealthy competition: you decide.' },
    { score:85, chemistry:'Heart & Compass',       strengths:['Analyst\'s empathy guides Strategist\'s drive','Deep emotional safety','Strategist protects Analyst'],   friction:['Strategist may move too fast for Analyst','Analyst may over-invest emotionally','Different conflict styles'], insight:'A beautiful pairing. The Empathic Analyst provides the emotional grounding the Creative Strategist secretly needs. This one builds quietly and lasts.' },
    { score:80, chemistry:'Make It Happen',        strengths:['Both are action-oriented','High execution speed','Clear roles emerge naturally'],                        friction:['Can neglect long-term vision','Both may steamroll quieter voices','Work before play mentality'],             insight:'Possibly the most productive pairing in any team context. The question isn\'t whether you\'ll get things done — it\'s whether you\'ll slow down enough to enjoy them.' },
    { score:78, chemistry:'Bold Blueprint',        strengths:['Rebel\'s vision + Strategist\'s execution','Disruption with direction','Both challenge the status quo'], friction:['Rebel may reject Strategist\'s structure','Can struggle to agree on what "winning" means'],                  insight:'This pairing builds movements. The Visionary Rebel provides the spark; the Creative Strategist keeps it from burning down. Needs clear shared mission.' },
    { score:82, chemistry:'Order & Ambition',      strengths:['Architect\'s precision keeps Strategist honest','High standards shared','Complementary strengths'],      friction:['Architect may slow Strategist down','Different social energy levels','Architect rarely initiates'],            insight:'Surprisingly strong. The Silent Architect\'s discipline gives the Creative Strategist\'s ambition a backbone. You won\'t always agree on pace, but you\'ll respect each other deeply.' },
    { score:90, chemistry:'The Power Duo',         strengths:['Unmatched social energy','Both love winning','Amplify each other\'s strengths'],                         friction:['Both can dominate conversations','May neglect depth for momentum','Conflict can be loud'],                   insight:'The most magnetic social pairing. Rooms notice when you walk in together. Keep an eye on the depth of your connection beneath the performance.' },
    { score:71, chemistry:'Strategy meets Soul',   strengths:['Deep Thinker grounds Strategist\'s ambition','Rare honest conversations','Push each other to grow'],    friction:['Very different social needs','Deep Thinker may seem "too slow"','Strategist may feel intense scrutiny'],      insight:'The Creative Strategist moves fast; the Deep Thinker questions whether they should. That tension is annoying and valuable in equal measure.' },
  ],
  // 2 vs 0-7
  [
    null, null,
    { score:68, chemistry:'Empathy Loop',          strengths:['Profound emotional understanding','No judgment between them','Deep mutual care'],                        friction:['Both can absorb each other\'s pain','Decision paralysis','Need an external catalyst'],                      insight:'Two Empathic Analysts understand each other like no one else can — and that\'s both the gift and the trap. You\'ll need to protect each other from over-feeling.' },
    { score:86, chemistry:'Feeling & Function',    strengths:['Innovator acts on what Analyst feels','Complementary decision styles','Strong support structure'],       friction:['Innovator may dismiss emotional processing','Analyst may over-explain feelings','Pacing mismatch'],          insight:'One of the most functional pairings. The Empathic Analyst reads the situation; the Practical Innovator does something about it. Excellent long-term pairing.' },
    { score:73, chemistry:'Dream & Depth',         strengths:['Shared idealism','Both question reality','Mutual encouragement for big thinking'],                       friction:['Can spiral into shared anxiety','Low practical output during stress','Both need grounding'],                 insight:'Beautiful vision, fragile execution. This pairing needs a practical anchor — a project, a goal, a deadline — to convert its enormous energy into results.' },
    { score:81, chemistry:'Quiet Depth',           strengths:['Both prefer depth over noise','Silent understanding','High trust and reliability'],                       friction:['Neither may initiate hard conversations','Can drift into comfortable distance','Low external stimulation'],  insight:'This is the slow-burn pairing. Trust builds over years, not weeks. The depth you reach eventually is worth the patience it takes to get there.' },
    { score:77, chemistry:'Warmth & Energy',       strengths:['Catalyst draws Analyst out','Analyst grounds Catalyst\'s energy','Natural give-and-take'],               friction:['Catalyst may overwhelm Analyst','Analyst may seem "too sensitive"','Different recharge needs'],              insight:'The Social Catalyst energizes the Empathic Analyst in ways they don\'t fully expect. The Analyst teaches the Catalyst how to truly listen. Mutually transformative.' },
    { score:89, chemistry:'Soul Resonance',        strengths:['Deepest emotional understanding','Both value inner world','Mutual philosophical curiosity'],              friction:['Can retreat from the world together','Both need to guard against shared depression','Low action bias'],       insight:'A rare and beautiful connection. Two people who genuinely reach each other on a level most people never experience. Guard against isolating yourselves from the world.' },
  ],
  // 3 vs 0-7
  [
    null, null, null,
    { score:71, chemistry:'Builder\'s Bond',        strengths:['High output efficiency','Shared respect for tangible results','Low drama'],                              friction:['Both may neglect emotional needs','Can get competitive','"Who fixes it?" tension'],                          insight:'Two Practical Innovators will build things — but someone has to handle the feelings. Don\'t let efficiency crowd out connection.' },
    { score:84, chemistry:'Vision Made Real',       strengths:['Rebel dreams, Innovator delivers','High energy output','Mutual admiration'],                            friction:['Rebel may reset goals before Innovator finishes','Different definitions of "done"','Frustration around completion'], insight:'The Visionary Rebel has the ideas; the Practical Innovator has the tools. Together they can build what neither could alone — if the Rebel can commit.' },
    { score:88, chemistry:'The Foundation',         strengths:['Both value reliability','High trust and consistency','Excellent long-term partnership'],                 friction:['Both may over-focus on work','Emotional intimacy needs conscious effort','Can be too stable (boring together)'], insight:'One of the most stable pairings possible. Not the flashiest, but it lasts. Build something real together — that\'s where this connection shines.' },
    { score:69, chemistry:'Energy Exchange',        strengths:['Catalyst motivates Innovator','Innovator brings Catalyst back to reality','Strong social + productive mix'], friction:['Catalyst may create chaos Innovator can\'t stand','Different energy management styles','Innovator may feel drained'], insight:'The Social Catalyst injects energy into the Practical Innovator\'s world — which is welcome until it isn\'t. This pairing works best with clear shared projects.' },
    { score:75, chemistry:'Grounded Vision',        strengths:['Thinker\'s depth challenges Innovator\'s assumptions','Mutual respect for competence','Unexpectedly strong bond'], friction:['Very different paces','Innovator may become impatient','Thinker may seem impractical'],           insight:'Slower to start, stronger over time. The Practical Innovator needs the Deep Thinker more than they initially realize — someone who asks "why" before building.' },
  ],
  // 4 vs 0-7
  [
    null, null, null, null,
    { score:63, chemistry:'Rebel Echo',            strengths:['No one else understands your mission','Shared iconoclasm','Maximum creative output'],                    friction:['Ego collisions','No one moderates each other','Can alienate everyone around them'],                           insight:'Two Visionary Rebels is either a revolution or a disaster. Probably both. If you can align your visions, you\'ll be unstoppable. If not, the friction will be brutal.' },
    { score:79, chemistry:'Structure & Fire',      strengths:['Architect provides the structure Rebel needs','Rebel prevents Architect from stagnating','High mutual respect'], friction:['Rebel may resent structure','Architect may not keep up with Rebel\'s pivots','Needs clear shared mission'], insight:'The Rebel provides the fire; the Architect provides the blueprint. This is a founding-team pairing — high tension, high output, high mutual learning.' },
    { score:87, chemistry:'Spark & Megaphone',     strengths:['Both love making noise','Catalyst amplifies Rebel\'s message','Natural performance together'],            friction:['Who leads?','Both can dominate the narrative','May lack operational follow-through'],                          insight:'Electric in public, sometimes exhausting in private. This pairing creates movements — just make sure one of you can also manage a spreadsheet.' },
    { score:82, chemistry:'Rebel & Philosopher',   strengths:['Deepest alignment on "why"','Both reject surface-level existence','Mutual intellectual challenge'],       friction:['Both can be impractical','Shared tendency to catastrophize','Neither grounds the other'],                   insight:'This is the pairing that writes manifestos. Both of you reject the ordinary — the question is whether you\'ll build something or just discuss building something.' },
  ],
  // 5 vs 0-7
  [
    null, null, null, null, null,
    { score:66, chemistry:'Double Architecture',   strengths:['Shared perfectionism','Excellent long-term planning','Zero tolerance for mediocrity'],                    friction:['Both can become isolated','Neither initiates emotional conversations','Work-life balance struggles'],      insight:'Two Silent Architects build extraordinary things — but the relationship itself needs maintenance. Schedule connection the way you schedule everything else.' },
    { score:72, chemistry:'Opposites Attract',     strengths:['Catalyst brings energy Architect needs','Architect grounds Catalyst\'s scatter','Natural balance'],         friction:['Very different social needs','Architect may feel overwhelmed','Catalyst may feel held back'],             insight:'High contrast, high potential. The Social Catalyst makes the Silent Architect\'s world more alive. The Architect makes the Catalyst\'s world more meaningful.' },
    { score:85, chemistry:'The Inner Circle',      strengths:['Both value depth and precision','Rare genuine understanding','High intellectual respect'],                 friction:['Both need significant alone time','Can create a closed system','Slow to include others'],                  insight:'This pairing forms the most private, exclusive bond. You won\'t have a lot of mutual friends — but the ones you have will be lifelong.' },
  ],
  // 6 vs 0-7
  [
    null, null, null, null, null, null,
    { score:70, chemistry:'Energy Amplified',      strengths:['Maximum social energy','Natural co-leaders','Great fun together'],                                        friction:['Both need to be the center','Emotional depth can suffer','High-octane but sometimes hollow'],              insight:'Two Social Catalysts are the most fun pair in any room. Just make sure the party eventually ends and the real conversation begins.' },
    { score:76, chemistry:'Light & Depth',         strengths:['Thinker gives Catalyst real substance','Catalyst brings Thinker to the surface','Both transform each other'], friction:['Very different energy levels','Catalyst may find Thinker too heavy','Thinker may feel performed for'], insight:'The Social Catalyst has met someone who won\'t be impressed by performance — and that\'s exactly what they needed. The Deep Thinker has found someone who makes them visible.' },
  ],
  // 7 vs 0-7
  [
    null, null, null, null, null, null, null,
    { score:67, chemistry:'The Abyss',             strengths:['Unparalleled mutual understanding','Both exist outside the mainstream','Shared philosophical home'],       friction:['Can spiral into shared nihilism','Both extremely private — low external support','Need external friction to grow'], insight:'No one understands a Deep Thinker like another Deep Thinker. The risk is that you create a perfectly comfortable echo chamber. Someone has to push the door open occasionally.' },
  ],
];

// Mirror the matrix
for (let a = 0; a < 8; a++) {
  for (let b = 0; b < a; b++) {
    RAW[a][b] = RAW[b][a];
  }
}

const /** @type {any} */
CONTEXT_MODIFIERS = {
  romantic:    { bonus: 5,  label: 'Romantic',    note: 'Romantic compatibility adds emotional stakes — and emotional rewards.' },
  friendship:  { bonus: 3,  label: 'Friendship',  note: 'Friendships between these types build slowly but last.' },
  work:        { bonus: 0,  label: 'Professional', note: 'In professional settings, complementary strengths matter most.' },
  family:      { bonus: -2, label: 'Family',      note: 'Family dynamics reveal the deepest compatibility truths over time.' },
};

const /** @type {any} */
FAMILIARITY_LABELS = { 1: 'Just met', 2: 'Getting to know', 3: 'Know each other', 4: 'Close', 5: 'Very close' };

function getScoreLabel(/** @type {any} */ score) {
  if (score >= 90) return { label: 'Legendary Match', color: '#f59e0b', emoji: '🌟' };
  if (score >= 80) return { label: 'Strong Compatibility', color: '#10b981', emoji: '💚' };
  if (score >= 70) return { label: 'Good Chemistry', color: '#6366f1', emoji: '💜' };
  if (score >= 60) return { label: 'Complementary Pairing', color: '#3b82f6', emoji: '💙' };
  return { label: 'Growth Opportunity', color: '#a855f7', emoji: '🔮' };
}

const /** @type {any} */
def = {
  id: 'compatibility',
  title: 'Compatibility Checker',
  category: '💞 Relationships',
  description: 'Discover your personality compatibility score. Based on the 8 rare archetypes from RareRank — enter both types and get a full compatibility breakdown: chemistry type, strengths, friction points, and deep insight.',
  rewardProfile: 'quiz',
  runLabel: '💞 Calculate Our Compatibility',
  fields: [
    {
      id: 'nameA',
      label: 'Your name',
      type: 'text',
      placeholder: 'Your first name',
      required: true,
    },
    {
      id: 'archetypeA',
      label: 'Your RareRank archetype',
      type: 'select',
      options: ARCHETYPES.map((/** @type {any} */ a) => ({ value: String(a.id), label: `${a.emoji} ${a.name} (${a.rarity} of people)` })),
      required: true,
    },
    {
      id: 'nameB',
      label: 'Their name',
      type: 'text',
      placeholder: 'Their first name',
      required: true,
    },
    {
      id: 'archetypeB',
      label: 'Their RareRank archetype',
      type: 'select',
      options: ARCHETYPES.map((/** @type {any} */ a) => ({ value: String(a.id), label: `${a.emoji} ${a.name} (${a.rarity} of people)` })),
      required: true,
    },
    {
      id: 'context',
      label: 'Relationship context',
      type: 'choice',
      options: [
        { value: 'romantic',   label: '💕 Romantic' },
        { value: 'friendship', label: '🤝 Friendship' },
        { value: 'work',       label: '💼 Professional' },
        { value: 'family',     label: '🏠 Family' },
      ],
      required: true,
    },
    {
      id: 'familiarity',
      label: 'How well do you know each other?',
      type: 'range',
      min: 1,
      max: 5,
      step: 1,
      default: 3,
    },
  ],

  compute(/** @type {any} */ inputs) {
    const parsedAIdx = Number.parseInt(inputs.archetypeA, 10);
    const parsedBIdx = Number.parseInt(inputs.archetypeB, 10);
    const aIdx = Number.isInteger(parsedAIdx) && parsedAIdx >= 0 && parsedAIdx < ARCHETYPES.length ? parsedAIdx : 0;
    const bIdx = Number.isInteger(parsedBIdx) && parsedBIdx >= 0 && parsedBIdx < ARCHETYPES.length ? parsedBIdx : 0;
    const archA = ARCHETYPES[aIdx];
    const archB = ARCHETYPES[bIdx];
    const pair = RAW[aIdx]?.[bIdx] || RAW[0][0];
    const ctx = CONTEXT_MODIFIERS[inputs.context] || CONTEXT_MODIFIERS.romantic;
    const parsedFamiliarity = Number.parseInt(inputs.familiarity, 10);
    const familiarity = Number.isInteger(parsedFamiliarity)
      ? Math.min(5, Math.max(1, parsedFamiliarity))
      : 3;

    // Score modifiers
    const familiarityBonus = (familiarity - 3) * 2; // -4 to +4
    const rawScore = Math.min(99, Math.max(35, pair.score + ctx.bonus + familiarityBonus));

    return {
      nameA: inputs.nameA || 'Person A',
      nameB: inputs.nameB || 'Person B',
      archA,
      archB,
      score: rawScore,
      chemistry: pair.chemistry,
      strengths: pair.strengths,
      friction: pair.friction,
      insight: pair.insight,
      contextLabel: ctx.label,
      contextNote: ctx.note,
      familiarity,
      familiarityLabel: FAMILIARITY_LABELS[familiarity] || 'Know each other',
      sameType: aIdx === bIdx,
    };
  },

  resultTemplate(/** @type {any} */ r) {
    const { label, color, emoji } = getScoreLabel(r.score);
    const arcAColor = '#6366f1';
    const arcBColor = '#a855f7';

    const strengthsHTML = r.strengths.map((/** @type {any} */ s) =>
      `<li style="padding:.35rem 0;border-bottom:1px solid var(--clr-border);color:var(--clr-text)">${s}</li>`
    ).join('');
    const frictionHTML = r.friction.map((/** @type {any} */ f) =>
      `<li style="padding:.35rem 0;border-bottom:1px solid var(--clr-border);color:var(--clr-text)">${f}</li>`
    ).join('');

    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (r.score / 100) * circumference;

    return `
<div id="eon-share-card" style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:0">

  <!-- Main result card -->
  <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:1.25rem;padding:2rem;text-align:center;margin-bottom:1.5rem">

    <!-- Context badge -->
    <div style="display:inline-block;background:var(--clr-bg);border:1px solid var(--clr-border);border-radius:2rem;padding:.25rem .75rem;font-size:.8rem;color:var(--clr-text-muted);margin-bottom:1.25rem">
      ${r.contextLabel} · ${r.familiarityLabel}
    </div>

    <!-- Archetype display -->
    <div style="display:flex;align-items:center;justify-content:center;gap:.75rem;margin-bottom:1.5rem;flex-wrap:wrap">
      <div style="background:var(--clr-bg);border:2px solid ${arcAColor};border-radius:.75rem;padding:.6rem 1rem;min-width:140px">
        <div style="font-size:1.5rem;margin-bottom:.2rem">${r.archA.emoji}</div>
        <div style="font-weight:700;color:${arcAColor};font-size:.9rem">${r.nameA}</div>
        <div style="font-size:.75rem;color:var(--clr-text-muted)">${r.archA.name}</div>
      </div>
      <div style="font-size:1.5rem;color:var(--clr-text-muted)">×</div>
      <div style="background:var(--clr-bg);border:2px solid ${arcBColor};border-radius:.75rem;padding:.6rem 1rem;min-width:140px">
        <div style="font-size:1.5rem;margin-bottom:.2rem">${r.archB.emoji}</div>
        <div style="font-weight:700;color:${arcBColor};font-size:.9rem">${r.nameB}</div>
        <div style="font-size:.75rem;color:var(--clr-text-muted)">${r.archB.name}</div>
      </div>
    </div>

    <!-- Score ring -->
    <div style="position:relative;width:140px;height:140px;margin:0 auto 1rem">
      <svg width="140" height="140" style="transform:rotate(-90deg)">
        <circle cx="70" cy="70" r="54" fill="none" stroke="var(--clr-border)" stroke-width="10"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke="${color}" stroke-width="10"
          stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
          stroke-linecap="round" style="transition:stroke-dashoffset 1s ease"/>
      </svg>
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="font-size:2.2rem;font-weight:900;color:${color};line-height:1">${r.score}</div>
        <div style="font-size:.7rem;color:var(--clr-text-muted)">/ 100</div>
      </div>
    </div>

    <!-- Chemistry label -->
    <div style="margin-bottom:.5rem">
      <span style="font-size:1.5rem">${emoji}</span>
    </div>
    <div style="font-size:1.4rem;font-weight:800;color:${color};margin-bottom:.25rem">${label}</div>
    <div style="font-size:1rem;color:var(--clr-text-muted);margin-bottom:1rem">${r.chemistry}</div>

    <!-- Insight -->
    <div style="background:var(--clr-bg);border-left:3px solid ${color};border-radius:.5rem;padding:1rem;text-align:left;font-size:.9rem;color:var(--clr-text);line-height:1.6">
      ${r.insight}
    </div>

    ${r.contextNote ? `<div style="margin-top:.75rem;font-size:.8rem;color:var(--clr-text-muted);font-style:italic">${r.contextNote}</div>` : ''}
  </div>

  <!-- Strengths & Friction grid -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
    <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:.75rem;padding:1.25rem">
      <div style="font-weight:700;color:#10b981;margin-bottom:.75rem;font-size:.9rem">✓ Strengths</div>
      <ul style="list-style:none;padding:0;margin:0;font-size:.85rem">${strengthsHTML}</ul>
    </div>
    <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:.75rem;padding:1.25rem">
      <div style="font-weight:700;color:#ef4444;margin-bottom:.75rem;font-size:.9rem">⚡ Watch out for</div>
      <ul style="list-style:none;padding:0;margin:0;font-size:.85rem">${frictionHTML}</ul>
    </div>
  </div>

  <!-- Archetype traits -->
  <div style="background:var(--clr-surface);border:1px solid var(--clr-border);border-radius:.75rem;padding:1.25rem;margin-bottom:1.5rem">
    <div style="font-weight:700;color:var(--clr-text);margin-bottom:1rem;font-size:.9rem">Type Traits</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div>
        <div style="font-size:.8rem;color:${arcAColor};font-weight:600;margin-bottom:.4rem">${r.archA.emoji} ${r.archA.name}</div>
        ${r.archA.traits.map((/** @type {any} */ t) => `<span style="display:inline-block;background:var(--clr-bg);border:1px solid var(--clr-border);border-radius:2rem;padding:.15rem .6rem;font-size:.75rem;color:var(--clr-text-muted);margin:.15rem .15rem 0 0">${t}</span>`).join('')}
      </div>
      <div>
        <div style="font-size:.8rem;color:${arcBColor};font-weight:600;margin-bottom:.4rem">${r.archB.emoji} ${r.archB.name}</div>
        ${r.archB.traits.map((/** @type {any} */ t) => `<span style="display:inline-block;background:var(--clr-bg);border:1px solid var(--clr-border);border-radius:2rem;padding:.15rem .6rem;font-size:.75rem;color:var(--clr-text-muted);margin:.15rem .15rem 0 0">${t}</span>`).join('')}
      </div>
    </div>
  </div>

  <!-- CTA to RareRank -->
  <div style="background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(168,85,247,.08));border:1px solid rgba(99,102,241,.2);border-radius:.75rem;padding:1.25rem;text-align:center">
    <div style="font-size:.9rem;color:var(--clr-text-muted);margin-bottom:.5rem">Don't know your archetype yet?</div>
    <div style="font-weight:700;color:var(--clr-text);margin-bottom:.75rem">Discover your RareRank in 3 minutes</div>
    <a href="/tools/rarerank.html" style="display:inline-block;background:var(--clr-accent);color:#fff;padding:.6rem 1.5rem;border-radius:.5rem;font-weight:600;text-decoration:none;font-size:.9rem">Find My Archetype →</a>
  </div>

</div>`;
  },

  shareText: (/** @type {any} */ r) => {
    const { label } = getScoreLabel(r.score);
    return `${r.nameA} (${r.archA.name}) + ${r.nameB} (${r.archB.name}) = ${r.score}% compatible — "${r.chemistry}" · ${label} · eonapp.ch/tools/compatibility.html`;
  },

  challenge: (/** @type {any} */ r) => ({
    tool: 'compatibility',
    headline: `Can you beat ${r.score}% compatibility?`,
    value: r.score,
    unit: '% match',
    summary: `${r.archA.name} × ${r.archB.name} = ${r.chemistry}`,
    label: r.chemistry,
  }),

  compareChallenge: (/** @type {any} */ result, /** @type {any} */ challenge) => result.score > challenge.value,

  related: [
    { url: '/tools/rarerank.html',      icon: '🔬', title: 'RareRank',        cat: 'Personality' },
    { url: '/tools/red-flag-decoder.html', icon: '🚩', title: 'Red Flag Decoder', cat: 'Relationships' },
    { url: '/tools/love-oracle.html',   icon: '💕', title: 'Love Oracle',     cat: 'Relationships' },
  ],
};

const /** @type {any} */
root = document.getElementById('tool-root');
if (root) new ToolEngine(def).mount(root);
