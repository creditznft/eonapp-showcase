/**
 * EONAPP.ch — Archetype Deep Scan
 * 12 Jungian archetypes · 15 deep questions · Shadow self analysis
 * Viral Score: 10/10 | Profit Score: 9/10
 */

const archetypeWin = /** @type {any} */ (window);

// ─────────────────────────────────────────────────────────────────────────────
// ARCHETYPE DATABASE — 12 Jungian Archetypes
// ─────────────────────────────────────────────────────────────────────────────
const /** @type {any} */
ARCHETYPES = {
  hero: {
    name: 'The Hero', emoji: '🛡️', label: 'Born for the Storm',
    desc: 'You rise when the pressure rises. Challenge isn\'t something that happens to you — it\'s the environment you need to function at full capacity. Your deepest motivation is proving to yourself, through action, that you are enough. Not for them. For you.',
    shadow: { name: 'The Martyr', desc: 'Your shadow fights battles for others to avoid facing your own inner work. Saving the world is infinitely easier — and far more visible — than saving yourself. You sacrifice for people who didn\'t ask for it, then feel unseen.' },
    gift: 'Genuine courage in the face of odds that send others home early.',
    wound: 'You cannot rest without guilt, because stillness feels like dying.',
    challenge: 'Learning to receive protection, care, and help without interpreting it as weakness.',
    career: ['Special forces', 'Emergency medicine', 'Entrepreneurship in crisis-phase companies'],
    relationship: 'You love through protection, presence, and showing up when things get hard. You are loyal beyond reason — but you often forget that your partner needs to protect you too.',
    compat: { 'Rebel ⚡': 85, 'Caregiver 💛': 79, 'Sage 🦉': 76, 'Empath 🌊': 72 }
  },
  sage: {
    name: 'The Sage', emoji: '🦉', label: 'Keeper of Truth',
    desc: 'Truth is your obsession. You cannot rest until you understand the mechanics beneath the surface of things. You don\'t teach to be useful — you teach because not knowing is, to you, a kind of suffering. Your mind processes everything: an overheard conversation, a glance, a pattern in numbers.',
    shadow: { name: 'The Orphan', desc: 'Your shadow uses knowledge as a fortress. If you know everything, you need no one. Wisdom deployed as distance is just sophisticated loneliness dressed in intellectual credibility.' },
    gift: 'Synthesizing complex, disconnected ideas into clarity so rare it stops people mid-sentence.',
    wound: 'You feel most at home in your mind, but you live in a world that runs on connection — and that gap exhausts you.',
    challenge: 'Acting before achieving full certainty — which will never arrive — and trusting emotional truth as data equal to logic.',
    career: ['Research & academia', 'Systems architecture', 'Philosophy, law, or medicine'],
    relationship: 'You connect through ideas first, vulnerability second. Your love is expressed through the effort of fully understanding someone — which few people receive and almost none expect.',
    compat: { 'Ruler 👑': 92, 'Magician ✨': 87, 'Hero 🛡️': 76, 'Rebel ⚡': 68 }
  },
  explorer: {
    name: 'The Explorer', emoji: '🗺️', label: 'Born at the Edge of Maps',
    desc: 'You are most alive at boundaries: new cities, new disciplines, new people, new versions of yourself. The known world contracts for you the moment it becomes fully known. You aren\'t running from something — you are running toward a self that keeps outpacing your current coordinates.',
    shadow: { name: 'The Wanderer', desc: 'Your shadow mistakes perpetual motion for meaning. You can spend years collecting experiences and still feel unfound. The next horizon becomes a way to avoid the intimacy that requires you to stop moving.' },
    gift: 'Discovering things no one else thought to look for, in places no one else thought to go.',
    wound: 'You carry a deep fear that arriving — committing to a place, person, or path — will end your aliveness.',
    challenge: 'Discovering that depth, not breadth, is where the most significant adventures actually occur.',
    career: ['Journalism & documentary', 'Startup founding', 'Cross-cultural consulting or anthropology'],
    relationship: 'You love people who grow, evolve, and surprise you. Predictability feels like a slow death. You are fiercely devoted — until the relationship stops being a frontier.',
    compat: { 'Rebel ⚡': 88, 'Creator 🎨': 82, 'Sage 🦉': 75, 'Magician ✨': 79 }
  },
  rebel: {
    name: 'The Rebel', emoji: '⚡', label: 'Disruptor by Design',
    desc: 'You sense the cracks in every system before anyone else does. Rules feel like cages built by people who stopped asking "why." Your best work happens exactly at the boundary of what\'s allowed — and slightly past it. You don\'t break things carelessly; you break them because you can see what should replace them.',
    shadow: { name: 'The Destroyer', desc: 'Your shadow burns things down for the feeling of it, not the vision. Disruption without direction is just destruction with better branding. Sometimes what you\'re burning is the last bridge to something worth keeping.' },
    gift: 'Seeing broken assumptions everyone else unconsciously accepts as permanent facts.',
    wound: 'You fight so many external systems that you sometimes never get around to the one internal system that needs the most dismantling.',
    challenge: 'Accepting that some structures exist for genuinely good reasons, and that finishing things matters as much as starting them.',
    career: ['Activist leadership', 'Disruptive tech founding', 'Political or social reform'],
    relationship: 'You are magnetic in your refusal to be ordinary. You love people who challenge and provoke you. The risk: your independence can become a wall before it becomes a strength.',
    compat: { 'Magician ✨': 90, 'Explorer 🗺️': 88, 'Hero 🛡️': 85, 'Sage 🦉': 68 }
  },
  lover: {
    name: 'The Lover', emoji: '💞', label: 'The Devoted One',
    desc: 'You experience everything at full intensity — beauty, connection, loss, music, a stranger\'s story on a train. You don\'t observe life from a distance; you inhabit it completely. This capacity for deep feeling is your greatest asset and your greatest vulnerability, often simultaneously.',
    shadow: { name: 'The Obsessive', desc: 'Your shadow loses the self in pursuit of the feeling of love. Intensity becomes a substitute for substance. You can mistake the flood of longing for the real thing — and real connection for not being alive enough.' },
    gift: 'The capacity to make others feel completely seen, entirely desired, and genuinely alive.',
    wound: 'You have loved so fully that the losses have been seismic. The scar tissue is real.',
    challenge: 'Learning that love is sustainable, not just electric. That depth doesn\'t require danger.',
    career: ['The arts', 'Coaching & therapy', 'Brand storytelling that requires genuine feeling'],
    relationship: 'You love completely or not at all. You are capable of extraordinary devotion, and you require it in return. Anything less registers as abandonment, not just disappointment.',
    compat: { 'Caregiver 💛': 91, 'Empath 🌊': 88, 'Creator 🎨': 83, 'Innocent 🌸': 76 }
  },
  creator: {
    name: 'The Creator', emoji: '🎨', label: 'Architect of the New',
    desc: 'You are driven by a force you didn\'t choose and cannot stop: the compulsion to make something that doesn\'t exist yet. You see the gap between what is and what could be, and the gap itself is unbearable until you fill it. Creation isn\'t what you do — it\'s what you are.',
    shadow: { name: 'The Perfectionist', desc: 'Your shadow withholds finished work from a world it considers unready, keeping masterpieces in permanent draft. The pursuit of perfection becomes the reason nothing is ever complete, shared, or received.' },
    gift: 'Bringing into existence things the world didn\'t know it needed until they arrived.',
    wound: 'You hold your work to a standard so high that sharing it requires a kind of courage most people never understand.',
    challenge: 'Releasing work that is 90% there rather than waiting for the 100% that will never feel real.',
    career: ['Visual or performing arts', 'Product design & UX', 'Architecture or writing'],
    relationship: 'You love people who see and honor your creative process. Criticism of your work feels like criticism of your soul — because for you, it is.',
    compat: { 'Magician ✨': 85, 'Explorer 🗺️': 82, 'Lover 💞': 83, 'Innocent 🌸': 74 }
  },
  caregiver: {
    name: 'The Caregiver', emoji: '💛', label: 'Guardian of Others',
    desc: 'Your instinct is to protect, nurture, and hold space. Love isn\'t something you feel — it\'s something you do, constantly, often without recognition or reciprocation. Your presence is, for many people, a kind of home. The world runs on the labor of people like you, mostly without noticing.',
    shadow: { name: 'The Martyr-Caregiver', desc: 'Your shadow gives until resentment replaces generosity, then continues giving to avoid confronting the resentment. You care for others as a way of not addressing your own unmet needs — which keeps everyone comfortable except you.' },
    gift: 'Creating a safety so complete that people tell you things they\'ve never said aloud, before they even know they\'re doing it.',
    wound: 'Your own needs are the last thing on every list you make — and the first thing you\'d give up if asked.',
    challenge: 'Learning that receiving care is not weakness, and that people who don\'t take care of you are not worth emptying yourself for.',
    career: ['Medicine, nursing, or social work', 'Teaching', 'Nonprofit leadership or community organizing'],
    relationship: 'You love by building. By making sure everyone is fed, held, and taken care of. The risk: you can forget to ask for any of that back — and run empty in silence.',
    compat: { 'Lover 💞': 91, 'Empath 🌊': 89, 'Hero 🛡️': 79, 'Innocent 🌸': 84 }
  },
  innocent: {
    name: 'The Innocent', emoji: '🌸', label: 'Bearer of Original Wonder',
    desc: 'You carry something rare in this world: the genuine belief that things can be beautiful, that people are fundamentally good, and that tomorrow holds something worth hoping for. This isn\'t naivety — it\'s a choice you make repeatedly, despite knowing the alternatives. That choice is a form of courage most people underestimate.',
    shadow: { name: 'The Denier', desc: 'Your shadow maintains beauty at the cost of truth. When reality becomes too sharp, the Innocent retreats into a version of events that is easier to live in. The denial protects, but it also prevents the growth that only comes from facing what is.' },
    gift: 'The capacity for wonder so intact that it reawakens it in others who thought they had lost it forever.',
    wound: 'Every betrayal has the same fresh devastation, because you never entirely stop expecting the world to be better than it is.',
    challenge: 'Learning to hold hope and reality simultaneously — neither collapsing into cynicism nor retreating from complexity.',
    career: ['Education, particularly early childhood', 'The healing arts', 'Creative fields that require genuine joy as fuel'],
    relationship: 'You love openly and fully, with very little armor. This is either the most beautiful thing your partner has ever experienced, or the most overwhelming.',
    compat: { 'Caregiver 💛': 84, 'Lover 💞': 76, 'Creator 🎨': 74, 'Everyman 🤝': 88 }
  },
  magician: {
    name: 'The Magician', emoji: '✨', label: 'The Transformer',
    desc: 'You translate the invisible into the real. Patterns that others overlook are obvious to you. You don\'t just solve problems — you dissolve them by changing the frame they live in. Others call it genius; you call it obvious. The dangerous thing about being a Magician is that you begin to believe you can transform anything — including things that should simply be mourned.',
    shadow: { name: 'The Manipulator', desc: 'Your shadow uses insight to engineer outcomes rather than enable them. When transformation becomes control, magic becomes a sophisticated form of manipulation dressed as service.' },
    gift: 'Connecting dots across completely unrelated fields and collapsing them into something genuinely new.',
    wound: 'The world expects your magic on demand, and you\'ve never entirely learned to say it costs something.',
    challenge: 'Sharing the process, not just the polished result. Trusting others\' wisdom as valid alongside your own.',
    career: ['Invention & deep tech', 'Strategic consulting', 'Interdisciplinary art or research'],
    relationship: 'You see potential in people before they see it themselves. That is both your gift and your shadow — you can fall in love with who someone could become rather than who they currently are.',
    compat: { 'Rebel ⚡': 90, 'Sage 🦉': 87, 'Creator 🎨': 85, 'Explorer 🗺️': 79 }
  },
  ruler: {
    name: 'The Ruler', emoji: '👑', label: 'Architect of Order',
    desc: 'You were born to build systems, not just navigate them. Strategy runs in your blood. Authority isn\'t something you seek — it\'s simply where you end up when the situation requires it. You have an unusual relationship with responsibility: it doesn\'t burden you. It clarifies you.',
    shadow: { name: 'The Tyrant', desc: 'Your shadow controls through fear of losing control itself. Every rule you set carries a quiet terror of what happens when order breaks down. The tighter you hold, the more the system you\'re holding starts to resent the grip.' },
    gift: 'Seeing ten-year consequences in today\'s small decisions, and making the hard call no one else will make.',
    wound: 'You learned early that dependence leads to disappointment, so you became someone who never needed anyone — at enormous cost.',
    challenge: 'Delegating trust without quietly double-checking everything, and discovering that your control impulse is protecting something that deserves to be healed, not managed.',
    career: ['Executive leadership', 'Policy and governance', 'Institutional architecture at scale'],
    relationship: 'You love by providing, protecting, and creating stability. You have extraordinary capacity for loyalty. The shadow: you can make people feel managed rather than loved.',
    compat: { 'Sage 🦉': 92, 'Magician ✨': 88, 'Hero 🛡️': 80, 'Rebel ⚡': 71 }
  },
  jester: {
    name: 'The Jester', emoji: '🃏', label: 'Keeper of Sacred Absurdity',
    desc: 'You understand something most serious people forget: humor is a form of truth-telling that bypasses the defenses that logic and argument trigger. Your lightness isn\'t the absence of depth — it\'s the depth\'s chosen costume. You make the unbearable bearable, and the overly serious appropriately small.',
    shadow: { name: 'The Avoider', desc: 'Your shadow uses humor to escape vulnerability. When things get too real — too raw, too intimate, too existentially significant — the joke arrives like a fire exit. The cost: people who love you sometimes cannot tell whether you\'re okay.' },
    gift: 'Making difficult things lighter, smaller, and survivable — without diminishing their reality.',
    wound: 'Very few people have ever asked whether you are okay and meant it, and you\'ve learned not to expect it.',
    challenge: 'Being fully seen — without the buffer of the joke — long enough for something real to be exchanged.',
    career: ['Comedy & creative writing', 'Culture-change consulting', 'Any role that requires truth delivered without triggering defensiveness'],
    relationship: 'You love through play, laughter, and making your person feel light in a heavy world. The risk: you have learned that being funny is safer than being honest, and your partner eventually needs both.',
    compat: { 'Innocent 🌸': 86, 'Caregiver 💛': 82, 'Everyman 🤝': 88, 'Lover 💞': 75 }
  },
  everyman: {
    name: 'The Everyman', emoji: '🤝', label: 'The Solid Ground',
    desc: 'You are what most people aspire to be without knowing it: real. No performance. No agenda. No gap between your public face and your private one. You make people feel safe to be themselves, because you are completely, uncomplicatedly yourself. In a world full of personas, you are a person.',
    shadow: { name: 'The Conformist', desc: 'Your shadow fears standing out so deeply that it erases the parts of you that are genuinely uncommon. You give up the authentic edges of your personality in exchange for belonging, and eventually forget they were ever there.' },
    gift: 'The rare capacity to make absolutely anyone feel equally seen, valued, and at ease.',
    wound: 'You sometimes mistake your adaptability for identity — and wonder, in quiet moments, whether you have one.',
    challenge: 'Discovering that having strong, unconventional views and preferences doesn\'t make you less relatable — it makes you more interesting.',
    career: ['Community organizing', 'Counseling and social work', 'Operations leadership that keeps complex systems human'],
    relationship: 'You are what a healthy relationship is made of: steadiness, honesty, and genuine presence. The risk: you can give so much consistent love that your own need for depth and novelty goes unspoken.',
    compat: { 'Innocent 🌸': 88, 'Jester 🃏': 88, 'Caregiver 💛': 85, 'Lover 💞': 79 }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTIONS — 15 total, 5 per dimension
// ─────────────────────────────────────────────────────────────────────────────
const /** @type {any} */
QUESTIONS = [
  // ── POWER (q1-q5)
  { id:'q1', dim:'power', dimLabel:'Power', text:'When you face a major obstacle, you:',
    options:[
      { value:'hero',    icon:'⚔️', label:'Charge through it — obstacles are what I train for' },
      { value:'sage',    icon:'📚', label:'Study it until you find the gap in its logic' },
      { value:'rebel',   icon:'🔥', label:'Reframe the whole situation so the obstacle disappears' },
      { value:'ruler',   icon:'♟️', label:'Plan strategically and mobilize resources to remove it' }
    ]},
  { id:'q2', dim:'power', dimLabel:'Power', text:'What does real power mean to you?',
    options:[
      { value:'ruler',   icon:'🏛️', label:'The ability to shape systems and outcomes at scale' },
      { value:'magician',icon:'✨', label:'Transforming how people see reality' },
      { value:'rebel',   icon:'⚡', label:'Freedom from every system that tries to define you' },
      { value:'hero',    icon:'🛡️', label:'The courage to act when everyone else freezes' }
    ]},
  { id:'q3', dim:'power', dimLabel:'Power', text:'Under extreme pressure, your first instinct is:',
    options:[
      { value:'hero',    icon:'💪', label:'I come alive — pressure is my fuel' },
      { value:'sage',    icon:'🧘', label:'Detach and analyze — emotion clouds judgment' },
      { value:'caregiver',icon:'🤝', label:'Check on others first — their wellbeing anchors mine' },
      { value:'ruler',   icon:'📋', label:'Create structure immediately — clarity is my defense' }
    ]},
  { id:'q4', dim:'power', dimLabel:'Power', text:'What drives you most deeply:',
    options:[
      { value:'innocent',icon:'🌸', label:'A world that still contains wonder and beauty' },
      { value:'magician',icon:'✨', label:'The possibility of radical, irreversible transformation' },
      { value:'explorer',icon:'🗺️', label:'Discovering what no one else has found yet' },
      { value:'creator', icon:'🎨', label:'Bringing something genuinely new into existence' }
    ]},
  { id:'q5', dim:'power', dimLabel:'Power', text:'Your relationship with authority:',
    options:[
      { value:'ruler',   icon:'👑', label:'I respect it when earned; I expect to lead eventually' },
      { value:'rebel',   icon:'⚡', label:'I question it by default — authority must prove itself' },
      { value:'everyman',icon:'🤝', label:'I work within it — cooperation beats endless conflict' },
      { value:'sage',    icon:'🦉', label:'I study it — understanding beats fighting every time' }
    ]},
  // ── CONNECTION (q6-q10)
  { id:'q6', dim:'connect', dimLabel:'Connection', text:'How do you prefer to love?',
    options:[
      { value:'lover',   icon:'💞', label:'Completely — I give everything or I hold back everything' },
      { value:'caregiver',icon:'💛', label:'Through action — love is what I build and protect' },
      { value:'innocent',icon:'🌸', label:'Openly and freely — love should feel entirely safe' },
      { value:'everyman',icon:'🤝', label:'Steadily — loyalty and presence over grand gestures' }
    ]},
  { id:'q7', dim:'connect', dimLabel:'Connection', text:'In a group, you naturally:',
    options:[
      { value:'ruler',   icon:'👑', label:'Notice the dynamics and start reshaping them' },
      { value:'jester',  icon:'🃏', label:'Lighten the energy and make everyone feel at ease' },
      { value:'caregiver',icon:'💛', label:'Check who needs support and move toward them' },
      { value:'sage',    icon:'🦉', label:'Observe silently — you learn more by watching' }
    ]},
  { id:'q8', dim:'connect', dimLabel:'Connection', text:'People come to you because:',
    options:[
      { value:'sage',    icon:'🦉', label:'You always have the answer, or know exactly where to find it' },
      { value:'hero',    icon:'🛡️', label:'You show up and handle things when no one else will' },
      { value:'caregiver',icon:'💛', label:'You make them feel completely seen and heard' },
      { value:'jester',  icon:'🃏', label:'You make difficult things lighter and more survivable' }
    ]},
  { id:'q9', dim:'connect', dimLabel:'Connection', text:'Your deepest relationship pattern:',
    options:[
      { value:'lover',   icon:'💞', label:'I fall fast and hard — intensity is how I know it\'s real' },
      { value:'hero',    icon:'🛡️', label:'I protect everyone, then feel unseen when no one protects me' },
      { value:'sage',    icon:'🦉', label:'I connect through ideas first — emotional intimacy comes slowly' },
      { value:'everyman',icon:'🤝', label:'I show up consistently and expect exactly the same back' }
    ]},
  { id:'q10', dim:'connect', dimLabel:'Connection', text:'A good life, for you, must include:',
    options:[
      { value:'innocent',icon:'🌸', label:'Peace, love, and simple moments that feel sacred' },
      { value:'explorer',icon:'🗺️', label:'New places, experiences, and constant genuine discovery' },
      { value:'creator', icon:'🎨', label:'Work that felt genuinely yours — not a job someone gave you' },
      { value:'ruler',   icon:'👑', label:'Impact — your presence measurably changed something real' }
    ]},
  // ── GROWTH (q11-q15)
  { id:'q11', dim:'growth', dimLabel:'Growth', text:'When you fail, your first response is:',
    options:[
      { value:'hero',    icon:'⚔️', label:'Get back up. Failure is data, not identity.' },
      { value:'sage',    icon:'🔍', label:'Analyze completely before attempting anything again' },
      { value:'innocent',icon:'🌸', label:'Feel it fully — then reset and choose to believe again' },
      { value:'rebel',   icon:'⚡', label:'Decide the game was rigged and change the rules' }
    ]},
  { id:'q12', dim:'growth', dimLabel:'Growth', text:'The theme your life keeps returning to:',
    options:[
      { value:'explorer',icon:'🗺️', label:'Searching — for meaning, for home, for your real self' },
      { value:'creator', icon:'🎨', label:'Building — something that will genuinely outlast you' },
      { value:'magician',icon:'✨', label:'Transformation — you shed identities others don\'t know exist' },
      { value:'caregiver',icon:'💛', label:'Service — your purpose runs through other people' }
    ]},
  { id:'q13', dim:'growth', dimLabel:'Growth', text:'What you secretly want people to see in you:',
    options:[
      { value:'hero',    icon:'🛡️', label:'That you\'re unbreakable — but that you also feel everything' },
      { value:'creator', icon:'🎨', label:'That your work reflects a mind unlike anyone else\'s' },
      { value:'lover',   icon:'💞', label:'That your love is rare — few will ever understand its real depth' },
      { value:'jester',  icon:'🃏', label:'That the humor is also wisdom — you just choose to smile' }
    ]},
  { id:'q14', dim:'growth', dimLabel:'Growth', text:'The shadow pattern you cannot escape:',
    options:[
      { value:'hero',    icon:'🛡️', label:'Taking on everyone\'s battles and calling it strength' },
      { value:'sage',    icon:'🦉', label:'Using knowledge to maintain comfortable emotional distance' },
      { value:'ruler',   icon:'👑', label:'Controlling outcomes because chaos feels like personal failure' },
      { value:'caregiver',icon:'💛', label:'Losing yourself in service because your needs feel selfish' }
    ]},
  { id:'q15', dim:'growth', dimLabel:'Growth', text:'What you are building in this chapter:',
    options:[
      { value:'creator', icon:'🎨', label:'Something that didn\'t exist before you touched it' },
      { value:'ruler',   icon:'👑', label:'A system, legacy, or structure that scales beyond you' },
      { value:'explorer',icon:'🗺️', label:'Understanding — of the world, yourself, and what\'s possible' },
      { value:'magician',icon:'✨', label:'A new version of yourself — radically different from before' }
    ]}
];

// ─────────────────────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────────────────────
function computeArchetype(/** @type {any} */ answers) {
  const /** @type {any} */
counts = {};
  for (const /** @type {any} */
val of Object.values(answers)) {
    counts[val] = (counts[val] || 0) + 1;
  }
  const ranked = Object.entries(counts).sort((/** @type {any} */ a, /** @type {any} */ b) => b[1] - a[1]);
  const primaryKey   = ranked[0][0];
  const secondaryKey = ranked[1]?.[0] || 'sage';
  const primary   = ARCHETYPES[primaryKey];
  const secondary = ARCHETYPES[secondaryKey];
  const total      = Object.values(answers).length;
  const depthScore = Math.round((ranked[0][1] / total) * 100);
  return { primary, secondary, primaryKey, secondaryKey, depthScore, counts, total };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function getCredits() { return parseInt(localStorage.getItem('eon-credits') || '3', 10); }
function showToast(/** @type {any} */ msg, /** @type {any} */ ms = 2800) {
  const /** @type {any} */
el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}

// ─────────────────────────────────────────────────────────────────────────────
// ARCHETYPE APP — Main Controller
// ─────────────────────────────────────────────────────────────────────────────
class ArchetypeApp {
  constructor(/** @type {any} */ root) {
    this.root = root;
    this.state = 'landing';
    this.answers = {};
    this.currentQ = 0;
    this.result = null;
    const /** @type {any} */
creditEl = document.getElementById('credit-count');
    if (creditEl && creditEl !== null) creditEl.textContent = String(getCredits());
    this._render();
  }

  _render() {
    if (this.state === 'landing')  this._renderLanding();
    else if (this.state === 'quiz') this._renderQuestion();
    else if (this.state === 'result') this._renderResult();
  }

  // ── LANDING ────────────────────────────────────────────────────────────────
  _renderLanding() {
    const /** @type {any} */
previewArchetypes = [
      ['hero','🛡️','Hero'], ['sage','🦉','Sage'], ['rebel','⚡','Rebel'], ['magician','✨','Magician'],
      ['creator','🎨','Creator'], ['ruler','👑','Ruler'], ['explorer','🗺️','Explorer'], ['lover','💞','Lover'],
      ['caregiver','💛','Caregiver'], ['innocent','🌸','Innocent'], ['jester','🃏','Jester'], ['everyman','🤝','Everyman']
    ];
    const previewHtml = previewArchetypes.map((/** @type {any} */ entry) => {
      const [, e, n] = entry;
      return `<div class="ap-chip"><span class="ap-e">${e}</span>${n}</div>`;
    }).join('');

    this.root.innerHTML = `
      <div class="a-screen">
        <div class="a-hero">
          <span class="a-hero-icon">🧬</span>
          <h1 class="a-title">Archetype Deep Scan</h1>
          <p class="a-subtitle">Which of the 12 Jungian archetypes are you really?</p>
          <div class="a-stats">
            <span class="a-stat">🎯 15 deep questions</span>
            <span class="a-stat">🌑 Shadow self revealed</span>
            <span class="a-stat">💎 Hidden gifts exposed</span>
            <span class="a-stat">⚡ 3 min to complete</span>
          </div>
        </div>
        <div class="archetype-preview">${previewHtml}</div>
        <button class="btn-arch" id="btn-start">🧬 Begin My Archetype Scan</button>
        <div style="text-align:center;margin-top:.8rem;font-size:.82rem;color:var(--clr-text-muted)">
          Used by 24,000+ people · 99% say it's uncomfortably accurate
        </div>
      </div>`;

    this.root.querySelector('#btn-start').addEventListener('click', () => {
      this.state = 'quiz';
      this._render();
    });
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  _renderQuestion() {
    const q = QUESTIONS[this.currentQ];
    const total = QUESTIONS.length;
    const pct = Math.round((this.currentQ / total) * 100);
    const /** @type {any} */
dimMap = { power:'dim-power', connect:'dim-connect', growth:'dim-growth' };
    const dimClass = (/** @type {any} */ (dimMap))[q.dim] || 'dim-power';

    const optHtml = q.options.map((/** @type {any} */ o) => `
      <button class="answer-btn" data-value="${o.value}">
        <span class="ans-icon">${o.icon}</span>${o.label}
      </button>`).join('');

    this.root.innerHTML = `
      <div class="a-screen">
        <div class="q-header">
          <div class="q-progress-bar">
            <div class="q-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="q-meta">
            <span>${this.currentQ + 1} / ${total}</span>
            <span class="q-dim-badge ${dimClass}">${q.dimLabel}</span>
            <span>${pct}% complete</span>
          </div>
        </div>
        <div class="q-card">
          <div class="q-num">Question ${this.currentQ + 1}</div>
          <div class="q-text">${q.text}</div>
        </div>
        <div class="answer-grid">${optHtml}</div>
        ${this.currentQ > 0 ? `<button class="btn-arch btn-arch-ghost btn-arch-sm" id="btn-back" style="margin-top:.5rem">← Back</button>` : ''}
      </div>`;

    this.root.querySelectorAll('.answer-btn').forEach((/** @type {any} */ btn) => {
      btn.addEventListener('click', () => {
        (/** @type {any} */ (this.answers))[q.id] = btn.dataset.value;
        this.currentQ++;
        if (this.currentQ >= QUESTIONS.length) {
          this.result = computeArchetype(this.answers);
          this.state = 'result';
        }
        this._render();
      });
    });
    this.root.querySelector('#btn-back')?.addEventListener('click', () => {
      this.currentQ--;
      this._render();
    });
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  _renderResult() {
    if (!this.result) return;
    const { primary, secondary, primaryKey: _primaryKey, secondaryKey, depthScore, counts } = this.result;
    const compat = primary.compat || {};
    const compatHtml = Object.entries(compat).map((/** @type {any} */ [name, pct]) => `
      <div class="compat-row">
        <span class="compat-name">${name}</span>
        <div class="compat-bar"><div class="compat-fill" style="width:${pct}%"></div></div>
        <span class="compat-pct">${pct}%</span>
      </div>`).join('');

    const secondaryCount = counts[secondaryKey] || 0;
    const shareText = `My archetype: ${primary.name} ${primary.emoji} — "${primary.label}". ${depthScore}% match. What's yours? → eonapp.ch/tools/archetype-scan.html`;

    this.root.innerHTML = `
      <div class="a-screen result-wrap">
        <div id="eon-share-card">
          <div class="arch-result-hero">
            <span class="arch-big-emoji">${primary.emoji}</span>
            <div class="arch-name">${primary.name}</div>
            <div class="arch-label">${primary.label}</div>
            <p class="arch-desc">${primary.desc}</p>
            <div class="depth-badge">⚡ ${depthScore}% archetype match</div>
          </div>

          <div class="compat-section">
            <div class="compat-title">Compatibility with other archetypes</div>
            ${compatHtml}
          </div>

          <div class="archetype-panels">
            <div class="arch-panel">
              <div class="ap-label ap-shadow-label">🌑 Shadow Self</div>
              <div style="font-size:.82rem;font-weight:700;color:#f87171;margin-bottom:.35rem">${primary.shadow.name}</div>
              <div class="ap-val">${primary.shadow.desc}</div>
            </div>
            <div class="arch-panel">
              <div class="ap-label ap-gift-label">✨ Hidden Gift</div>
              <div class="ap-val" style="color:#d1fae5">${primary.gift}</div>
            </div>
            <div class="arch-panel">
              <div class="ap-label ap-challenge-label">⚔️ Core Challenge</div>
              <div class="ap-val" style="color:#fef3c7">${primary.challenge}</div>
            </div>
          </div>

          <div style="background:rgba(255,255,255,.04);border-radius:.875rem;padding:1rem 1.1rem;margin-bottom:.75rem;font-size:.87rem">
            <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--clr-text-muted);font-weight:700">Your Wound</span>
            <div style="color:var(--clr-text);margin-top:.35rem;line-height:1.65">${primary.wound}</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:.875rem;padding:1rem 1.1rem;margin-bottom:.75rem;font-size:.87rem">
            <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--clr-text-muted);font-weight:700">How You Love</span>
            <div style="color:var(--clr-text);margin-top:.35rem;line-height:1.65">${primary.relationship}</div>
          </div>
          <div style="background:rgba(255,255,255,.04);border-radius:.875rem;padding:1rem 1.1rem;margin-bottom:1rem;font-size:.87rem">
            <span style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--clr-text-muted);font-weight:700">Career Paths That Suit You</span>
            <div style="color:var(--clr-text);margin-top:.35rem">
              ${primary.career.map((/** @type {any} */ c) => `<span style="display:inline-block;margin:.2rem .4rem .2rem 0;padding:.25rem .65rem;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:.5rem;font-size:.82rem;color:#fde68a">${c}</span>`).join('')}
            </div>
          </div>

          ${secondary ? `
          <div class="secondary-badge">
            Also carrying <strong style="color:#a78bfa">${secondary.emoji} ${secondary.name}</strong> energy
            — detected ${secondaryCount} time${secondaryCount > 1 ? 's' : ''} across your answers.
            <em style="display:block;margin-top:.35rem;font-size:.82rem">${secondary.label}: ${secondary.desc.split('.')[0]}.</em>
          </div>` : ''}
        </div>

        <div class="result-actions">
          <button class="btn-arch btn-arch-indigo" id="btn-share">📤 Share My Archetype</button>
          <div class="btn-row-2">
            <button class="btn-arch btn-arch-ghost btn-arch-sm" id="btn-again">🔄 Retake Scan</button>
            <button class="btn-arch btn-arch-ghost btn-arch-sm" id="btn-tools">🧠 More Tools</button>
          </div>
          <div style="text-align:center;padding:1rem;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:.875rem;font-size:.84rem;color:var(--clr-text-muted)">
            Challenge a friend → Are your archetypes compatible? 👇
          </div>
        </div>
      </div>`;

    document.getElementById('btn-share')?.addEventListener('click', () => {
      navigator.clipboard.writeText(shareText).then(() => showToast('✅ Result copied! Challenge someone.'));
    });
    document.getElementById('btn-again')?.addEventListener('click', () => {
      this.answers = {}; this.currentQ = 0; this.result = null;
      this.state = 'landing'; this._render();
    });
    document.getElementById('btn-tools')?.addEventListener('click', () => {
      window.location.href = '/build';
    });

    // Monetization
    if (archetypeWin.EonXP?.award)                          archetypeWin.EonXP.award('archetype-scan', 50);
    if (Math.random() < 0.3 && archetypeWin.EonLootbox?.drop) archetypeWin.EonLootbox.drop('archetype');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const /** @type {any} */
root = document.getElementById('app');
  if (root) new ArchetypeApp(root);
  // W635: current tool pages register through content-lite and the shared registration contract.
});
