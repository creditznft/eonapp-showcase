/**
 * EONAPP.ch — Dream Interpreter AI
 * Jungian symbol analysis · 400+ symbols · Chat-style progressive UI
 * Viral Score: 10/10 | Profit Score: 8/10
 */

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (window);

// ─────────────────────────────────────────────────────────────────────────────
// DREAM SYMBOL DATABASE
// Each entry: theme, jungian, emotional, practical, followUp, emoji
// ─────────────────────────────────────────────────────────────────────────────
const /** @type {any} */
DREAM_SYMBOLS = {
  // ── WATER ──────────────────────────────────────────────────────────────────
  ocean: {
    emoji: '🌊', theme: 'The Collective Unconscious',
    jungian: 'The ocean is Jung\'s ultimate symbol of the collective unconscious — the vast, uncharted depth beneath personal awareness. It holds everything you know but haven\'t consciously processed, the primordial source of all psychic life.',
    emotional: 'Something enormous is moving beneath your surface. Your psyche is signaling tidal forces you haven\'t yet named. This is rarely threatening — more often an invitation to surrender to something larger than your current story.',
    practical: 'Pay attention to your relationship with the water. Were you swimming freely, being swallowed, or watching safely from shore? Each tells a different story about your relationship with your own depth.',
    followUp: 'Was the ocean calm and inviting, or overwhelming and dark?'
  },
  river: {
    emoji: '🏞️', theme: 'Life\'s Current & Passage of Time',
    jungian: 'The river represents the flow of psychic energy — the movement of life itself. Heraclitus knew: you cannot step in the same river twice. In dreams, rivers reveal how you relate to change, forward motion, and what you can\'t control.',
    emotional: 'You are in transition. The river asks whether you are fighting the current, riding it, or standing frozen on the bank. Your answer reveals everything about how you\'re navigating this chapter.',
    practical: 'The condition of the river mirrors your inner state right now. A rushing river suggests urgency or overwhelm. A gentle river suggests grace in transition. What did the current feel like?',
    followUp: 'Were you in the river, crossing it, or watching it flow?'
  },
  flood: {
    emoji: '🌧️', theme: 'Emotional Overwhelm',
    jungian: 'A flood is the unconscious breaking its banks — suppressed emotion or psychic content forcing its way into consciousness. The psyche uses flood imagery when ordinary channels are insufficient for what needs to move.',
    emotional: 'Something you have been containing is exceeding its limits. This is not a warning to control harder — it\'s a signal to create larger channels for what needs expression before it finds its own exit.',
    practical: 'Floods in dreams often correlate with real-life situations where you feel overwhelmed, unable to keep up, or where something from the past is resurfacing unexpectedly.',
    followUp: 'Was the flood destructive and terrifying, or more like a release?'
  },
  drowning: {
    emoji: '💧', theme: 'Being Overwhelmed — Surrender vs. Survival',
    jungian: 'Drowning is the ego\'s fear of dissolution in the unconscious. But Jung noted: the cure is often not resistance but surrender. Learning to breathe underwater — to exist in the unconscious — is a profound developmental stage.',
    emotional: 'You are likely experiencing a situation where you feel you can\'t keep your head above water. The dream asks: what would happen if you stopped fighting and allowed yourself to go under?',
    practical: 'Recurring drowning dreams often stop when the dreamer faces what they have been avoiding. The water isn\'t the threat — the avoidance is.',
    followUp: 'Did you survive the drowning, or did the dream end there?'
  },
  swimming: {
    emoji: '🏊', theme: 'Navigating the Emotional World',
    jungian: 'To swim in dreams is to move consciously within the unconscious — a sign of developing psychic fluency. You are no longer merely a passive observer of your inner world; you are moving through it with agency.',
    emotional: 'You are developing a new relationship with your emotional depths. The quality of swimming — ease, struggle, direction — reveals how confident you feel navigating your own complexity.',
    practical: 'This is often a positive sign of psychological growth, particularly if the swim felt natural. What were you swimming toward?',
    followUp: 'Were you swimming easily, or struggling against something?'
  },
  rain: {
    emoji: '🌧️', theme: 'Cleansing & Emotional Release',
    jungian: 'Rain represents renewal, the intersection of heaven and earth, the unconscious descending into conscious life. In most traditions, rain is both grief and blessing — the tears of the sky that make things grow.',
    emotional: 'Something is being cleansed. Grief, release, or even unexpected renewal is close. Rain dreams often precede emotional breakthroughs in waking life.',
    practical: 'Was the rain welcome or unwelcome? Your reaction reveals how you feel about emotional release — whether you welcome it or try to stay dry.',
    followUp: 'Were you caught in the rain, or watching it safely from inside?'
  },
  well: {
    emoji: '⚫', theme: 'Hidden Depths & Ancestral Memory',
    jungian: 'The well is a vertical axis into the unconscious — a contained, accessible version of the ocean. Wells in dreams represent personal memory, ancestral inheritance, and the wisdom stored in your depths that you haven\'t yet drawn up.',
    emotional: 'There is something waiting to be retrieved from inside you. Old wisdom, buried memory, or latent capacity — the well exists precisely to make the deep available to you.',
    practical: 'The state of the well matters enormously. Was it full, empty, contaminated, sealed? This mirrors your current access to your own inner resources.',
    followUp: 'What did you find — or what were you trying to reach — in the well?'
  },
  waterfall: {
    emoji: '🌊', theme: 'Catharsis & Unstoppable Force',
    jungian: 'The waterfall is power meeting surrender — a dramatic, irreversible descent. Psychologically, it represents moments when psychic energy pours through a narrow channel with overwhelming force, transforming everything below.',
    emotional: 'A cathartic release is either happening or imminent. Something that has been building is now falling — and what it feeds below will be different from what was above.',
    practical: 'Waterfalls often appear when a major life change is close: a decision that can\'t be unmade, a threshold crossed, an ending that opens something new.',
    followUp: 'Were you standing under the waterfall, watching it, or falling with it?'
  },
  lake: {
    emoji: '🏔️', theme: 'Stillness & Deep Self-Reflection',
    jungian: 'A still lake is a mirror of the sky — the psyche reflecting consciousness back to itself. Lakes represent introspection, the contained unconscious, and the capacity to see yourself clearly when external agitation calms.',
    emotional: 'You are being called inward. The lake offers reflection, not drama — a chance to see what you actually look like when no one is watching and nothing is performing.',
    practical: 'A dark, murky lake suggests unexamined depths. A clear lake suggests readiness for honest self-reflection. What did you see in the water?',
    followUp: 'Was the lake clear enough to see into, or dark and unknowable?'
  },
  ice: {
    emoji: '🧊', theme: 'Frozen Emotions & Suspended State',
    jungian: 'Ice is water halted — emotion that has stopped moving. In Jungian terms, it represents a complex that has become frozen rather than flowing: emotion that couldn\'t be processed and hardened into a fixed pattern.',
    emotional: 'Something in your emotional life has become rigid, fixed, or stuck. The question the dream poses is: what needs to thaw in order to flow again?',
    practical: 'Ice can also represent a period of necessary stillness before movement. Not every frozen thing is unhealthy — some things crystallize in order to be seen clearly.',
    followUp: 'Were you on the ice, breaking through it, or watching it from a distance?'
  },

  // ── ANIMALS ────────────────────────────────────────────────────────────────
  snake: {
    emoji: '🐍', theme: 'Transformation & Hidden Knowledge',
    jungian: 'The snake is among the oldest symbols in the unconscious — the instinctual Self, the wisdom you carry but haven\'t fully claimed. Jung saw snakes as the primal life force that transforms by shedding the skin it no longer needs.',
    emotional: 'Something in your current life is asking for a fundamental shift. Fear of the snake often reflects fear of your own power, not external danger. The snake appears when you are ready to shed an old identity.',
    practical: 'You are likely at a threshold — an old self-concept or life structure ready to dissolve into something more evolved. What are you afraid to release?',
    followUp: 'Was the snake threatening you, or did you feel strangely drawn to it?'
  },
  wolf: {
    emoji: '🐺', theme: 'Wild Instinct & Shadow Integration',
    jungian: 'The wolf in dreams is the Shadow — the instinctual, untamed parts of the psyche that civilization asks us to repress. When the wolf appears, it is usually not asking to be killed, but to be acknowledged and integrated.',
    emotional: 'A part of you that has been exiled is demanding recognition. The wildness, the hunger, the directness that you\'ve been socializing away — it\'s knocking at the door of your dream.',
    practical: 'Dreams with wolves often correlate with periods where people feel they are betraying their instincts to please others, or where raw emotion has been suppressed too long.',
    followUp: 'Was the wolf hunting you, running with you, or watching from a distance?'
  },
  bird: {
    emoji: '🐦', theme: 'Freedom, Spirit & Higher Perspective',
    jungian: 'Birds universally represent the spirit or soul — the psyche\'s capacity to transcend its earthly limitations. Jung linked birds to the liberated anima, the spirit released from purely instinctual drives into something more elevated.',
    emotional: 'Some part of you wants to rise above the current situation — to gain altitude, perspective, or freedom from what feels heavy and earthbound.',
    practical: 'The specific bird matters. Eagles and hawks suggest vision and power. Owls suggest wisdom and the unconscious. Crows suggest transformation and magic. What kind of bird appeared?',
    followUp: 'Was the bird free and in flight, or caged, wounded, or grounded?'
  },
  cat: {
    emoji: '🐱', theme: 'Feminine Instinct & Mystery',
    jungian: 'Cats represent the independent, mysterious, deeply intuitive aspect of the psyche — the anima in her most autonomous form. They follow their own laws, which often challenge the ego\'s desire for control and predictability.',
    emotional: 'Something in your inner life is refusing to be domesticated. An intuition, a knowing, a feminine power — it operates by its own timing and cannot be hurried, forced, or fully understood through logic.',
    practical: 'If the cat in your dream was threatening, it often reflects fear of the irrational, the unknown, or powerful feminine energy. If nurturing, it suggests you are in contact with your deeper instincts.',
    followUp: 'Was the cat friendly or unsettling — did it feel like a companion or something stranger?'
  },
  dog: {
    emoji: '🐕', theme: 'Loyalty, Instinct & The Faithful Inner Guide',
    jungian: 'Dogs in dreams often represent the trustworthy, instinctual companion — the part of the psyche that is loyal to you even when you abandon yourself. They are guides between worlds in many mythologies.',
    emotional: 'The dog points to faithfulness — either the quality of loyalty you long for, or the loyal part of your own nature that you may be neglecting. Is there something you know intuitively that you\'ve been ignoring?',
    practical: 'A vicious or threatening dog may represent instincts that have been suppressed for too long and are now turning inward. A welcoming dog suggests the instinctual self is accessible and wants to be engaged.',
    followUp: 'Was the dog known to you, and was it protective or threatening?'
  },
  horse: {
    emoji: '🐴', theme: 'Vital Energy & Personal Power',
    jungian: 'The horse is one of Jung\'s primary symbols of libido — raw life energy in its most dynamic form. To ride a horse is to be in relationship with your own vital force: how well you can direct it without breaking it.',
    emotional: 'Your dream is about power, drive, and momentum. The state of the horse mirrors your current relationship with your own energy: is it available and responsive, wild and uncontrollable, or exhausted?',
    practical: 'Dreaming of riding freely often accompanies periods of confidence and forward momentum. A horse refusing to move, or one that has fallen, points to blocked vital energy or exhaustion.',
    followUp: 'Were you riding freely, losing control, or was the horse somehow restricted?'
  },
  spider: {
    emoji: '🕷️', theme: 'The Web of Fate & Creative Entrapment',
    jungian: 'The spider is the archetype of the weaver — the force that creates the web of fate, the architecture of one\'s life. Jung associated it with the dark mother, the unconscious creator who can both generate and trap.',
    emotional: 'You may feel caught in a web of obligation, relationship, or circumstance not entirely of your choosing. Alternatively, your own creative power is at work, spinning something new from the center outward.',
    practical: 'Spider dreams often emerge during periods of feeling trapped by commitments, or conversely, during periods of extraordinary creative output. What was the spider doing?',
    followUp: 'Was the spider threatening you, building its web, or were you watching from a safe distance?'
  },
  bear: {
    emoji: '🐻', theme: 'The Great Mother & Hibernation Wisdom',
    jungian: 'Bears represent the Great Mother in her protective and terrifying forms — the instinctual wisdom that hibernates, preserving energy through dark seasons. In dreams, bears often speak to our need for solitude, introspection, or fierce protection.',
    emotional: 'Your psyche may be calling for a period of withdrawal, of going inside, of protecting your energy during a vulnerable time. Or: something protective and fierce is coming to defend you.',
    practical: 'If the bear was chasing you, it often represents suppressed rage or grief — a powerful emotion you\'ve been running from. If the bear was peaceful, it suggests available inner strength.',
    followUp: 'Was the bear pursuing you, or was there something almost sacred about its presence?'
  },
  lion: {
    emoji: '🦁', theme: 'Courage, Leadership & Solar Power',
    jungian: 'The lion is the solar animal — archetypal symbol of the heroic ego, courage, leadership, and the integration of power with heart. In Jungian work, the lion often appears when the dreamer is ready to own their authority.',
    emotional: 'Something in you is ready to step into its full power. The lion asks: where are you still dimming yourself, seeking permission, or playing small for the comfort of others?',
    practical: 'Being attacked by a lion often represents the inflated or tyrannical aspects of the ego demanding attention. Befriending a lion suggests integration of personal power with wisdom.',
    followUp: 'Were you the lion, afraid of it, or did you stand your ground?'
  },
  eagle: {
    emoji: '🦅', theme: 'Vision, Freedom & Transcendence',
    jungian: 'The eagle is the supreme solar bird — symbol of spirit soaring above limitation, of vision that extends beyond the ordinary human range. Jung linked it to the transpersonal, the capacity to see from above what cannot be seen from inside.',
    emotional: 'Your dream is pointing you toward higher perspective. Whatever you are currently inside of — a conflict, a decision, a period of confusion — the eagle asks you to rise above it long enough to see the larger shape.',
    practical: 'Eagle dreams often appear before major realizations or at moments when clarity is desperately needed. What would become obvious if you could see your current situation from a great height?',
    followUp: 'Were you the eagle, or was it soaring above you as if watching over you?'
  },
  owl: {
    emoji: '🦉', theme: 'Wisdom, Night Knowledge & The Unseen',
    jungian: 'The owl sees in darkness — it is the animal of the unconscious par excellence. Associated with Athena\'s wisdom and death in many cultures, owls in dreams often announce the arrival of important knowledge from the shadow realm.',
    emotional: 'Something that has been hidden is about to become visible. You are developing or activating a form of perception that functions best in darkness — emotional intelligence, intuition, the ability to see what others overlook.',
    practical: 'Owl dreams frequently precede important realizations. They often appear at transitional moments: before a death (literal or symbolic), before a major insight, before an ending that opens something new.',
    followUp: 'Did the owl speak to you, or simply watch with those knowing eyes?'
  },
  butterfly: {
    emoji: '🦋', theme: 'Metamorphosis & Soul in Flight',
    jungian: 'The butterfly is psyche itself — the Greek word for both soul and butterfly is the same. It represents complete transformation, the apparently impossible process of dissolution and re-emergence as something entirely new.',
    emotional: 'You are in the middle of, or approaching, a profound personal transformation. The caterpillar has no idea it will become a butterfly; it simply responds to the call to dissolve completely in order to be reborn.',
    practical: 'If you are in the cocoon phase — that uncomfortable, shapeless middle between who you were and who you\'re becoming — the butterfly dream is a confirmation that the process is working.',
    followUp: 'Were you watching the butterfly, or did you feel like you were the butterfly?'
  },
  fish: {
    emoji: '🐟', theme: 'The Unconscious & Hidden Depths',
    jungian: 'Fish live in the unconscious — water — and appear when the dreamer has access to deep psychic content. In Christian and ancient symbolism, fish represent the soul itself, and the miraculous depths of inner life.',
    emotional: 'Something valuable is swimming in your depths that you haven\'t yet caught, named, or brought to the surface. The fish represents an insight, feeling, or truth your unconscious holds and your conscious mind has not yet recognized.',
    practical: 'Catching a fish in dreams is often a breakthrough moment — finally grasping an insight. Watching fish swim freely suggests abundant inner life that is present but not yet integrated.',
    followUp: 'Were you trying to catch the fish, or simply watching them move through the water?'
  },
  crow: {
    emoji: '🐦‍⬛', theme: 'Transformation, Magic & Liminal Passage',
    jungian: 'Crows are tricksters and transformers — beings of the threshold who belong to neither ordinary nor spirit worlds entirely. They are Mercury\'s birds, the intellect that bridges the visible and invisible, the messengers between worlds.',
    emotional: 'A crow in a dream signals that something is changing at a fundamental level, and that the normal rules may not apply to your current situation. The familiar is about to become strange.',
    practical: 'Crows often appear when you are standing at a genuine life crossroads, or when a perspective shift is required that your ordinary thinking cannot achieve. What message might this crow be delivering?',
    followUp: 'Was there something the crow seemed to want to show you, or was it a warning?'
  },

  // ── FLIGHT & FALLING ───────────────────────────────────────────────────────
  flying: {
    emoji: '✈️', theme: 'Liberation, Freedom & Spiritual Ascent',
    jungian: 'Flying dreams are among the most universally desired and psychologically significant. They represent the ego\'s successful transcendence of limitation — the discovery that you are not bound by what you thought confined you.',
    emotional: 'You are experiencing or approaching a significant expansion of perspective or freedom. The ease of flight mirrors your current relationship with possibility: can you trust yourself to rise?',
    practical: 'Flying dreams are especially common after major breakthroughs or during periods of peak confidence. They often increase when people are making decisions that require courage to "leap."',
    followUp: 'Were you flying freely, or struggling to stay aloft?'
  },
  falling: {
    emoji: '⬇️', theme: 'Loss of Control & Surrender',
    jungian: 'Falling is the ego\'s terror of losing ground — the sensation of support withdrawing. Jung noted that falling often corresponds to the necessary humbling of an inflated ego, or the frightening collapse of a defense structure.',
    emotional: 'You may be experiencing anxiety about losing status, control, safety, or a version of yourself that is no longer stable. The dream asks: what if falling was safe? What if the ground catches you?',
    practical: 'Most people wake before hitting ground. If you have landed in dreams and survived — or found yourself flying after the fall — that is one of the most powerful transformation symbols the unconscious can produce.',
    followUp: 'Did you hit the ground, wake before landing, or somehow transform mid-fall?'
  },
  floating: {
    emoji: '☁️', theme: 'Detachment & Borderline States',
    jungian: 'Floating occupies the space between flying and falling — suspended between earth and sky, conscious and unconscious. It often represents a liminal state of consciousness, a threshold between ordinary identity and something more expanded.',
    emotional: 'You may be in a protective dissociation — floating above an emotional situation you aren\'t yet ready to fully inhabit. This isn\'t always a problem; sometimes the psyche grants us distance as a form of mercy.',
    practical: 'Peaceful floating suggests spiritual openness and receptivity. Anxious floating suggests feeling ungrounded, lacking roots or solid footing in your daily life.',
    followUp: 'Was the floating peaceful and expansive, or did it feel uncertain and uncontrolled?'
  },

  // ── STRUCTURES ─────────────────────────────────────────────────────────────
  house: {
    emoji: '🏠', theme: 'The Self & Total Psyche',
    jungian: 'The house is arguably Jung\'s most important dream symbol: it IS you. Each room represents a different aspect of the psyche. Basement = the unconscious. Ground floor = daily ego life. Attic = higher mind or spiritual aspirations. Secret rooms = unlived aspects of self.',
    emotional: 'Your psyche is doing a self-inventory. What you find in the house, what condition it\'s in, and what rooms you explore or avoid tells the story of your current psychological landscape.',
    practical: 'Notice which rooms you went into, which were locked, which surprised you. Pay particular attention to rooms you didn\'t know existed — those represent unexplored aspects of your personality.',
    followUp: 'What area of the house were you in, and was it familiar or did it feel strange?'
  },
  door: {
    emoji: '🚪', theme: 'Threshold, Choice & New Possibility',
    jungian: 'Doors are threshold symbols — they mark the boundary between two states of being. In Jungian psychology, every door in a dream represents a choice, a passage, or an opportunity the psyche is making available to you.',
    emotional: 'Something is opening, or you are standing before an opening that requires a decision. The state of the door reveals how you feel about this passage: locked (blocked), open (ready), mysterious (unknown).',
    practical: 'Locked doors you can\'t open often represent unexplored potential or blocked memories. Doors that open on their own may represent opportunities arriving without conscious effort. What was behind the door?',
    followUp: 'Did you walk through the door, hesitate, or find it locked?'
  },
  window: {
    emoji: '🪟', theme: 'Perspective & Seeing Without Participating',
    jungian: 'Windows allow light and vision without the vulnerability of doors — they represent the way you observe reality from behind a barrier, the capacity to witness your life rather than fully inhabit it.',
    emotional: 'Are you watching your life through glass when you could be living it directly? Or is the window offering you needed perspective and clarity about something you\'ve been too close to see?',
    practical: 'Broken windows suggest shattered perspective or violated boundaries. Looking out suggests desire for what lies beyond your current world. Something pressing against the window often represents content trying to enter consciousness.',
    followUp: 'Were you looking out or looking in, and was the glass clear or obscured?'
  },
  stairs: {
    emoji: '🪜', theme: 'Ascent, Descent & Psychological Levels',
    jungian: 'Stairs map the vertical structure of the psyche. Ascending stairs represent ambition, spiritual growth, or the movement from unconscious to conscious. Descending represents going deeper into the unconscious, into memory, into what lies below the surface of ordinary awareness.',
    emotional: 'You are in motion between psychological levels. The direction and ease of movement reveals the current direction and effort required in your inner development.',
    practical: 'Stairs that collapse, that seem endless, or that you descend against your will are common anxiety symbols. Stairs you climb with ease or joy often accompany genuine progress.',
    followUp: 'Were you going up or down, and was the journey easy or difficult?'
  },
  bridge: {
    emoji: '🌉', theme: 'Transition & Connecting Two Worlds',
    jungian: 'A bridge connects two banks, two worlds, two states of being. In Jungian analysis, bridges represent the transcendent function — the symbol or experience that reconciles opposites and makes crossing from one psychic state to another possible.',
    emotional: 'You are in a transitional phase where you are genuinely between two versions of your life. The bridge exists precisely because both sides are real, and the crossing is necessary.',
    practical: 'A sturdy bridge suggests trust in your capacity to make the crossing. A crumbling bridge reflects anxiety about a transition. The people you meet on bridges often represent aspects of yourself you will need on the other side.',
    followUp: 'Were you crossing alone, and did you reach the other side?'
  },
  tunnel: {
    emoji: '🚇', theme: 'Passage Through Darkness',
    jungian: 'The tunnel is the birth canal of transformation — a forced passage through darkness toward light. It represents the necessary constriction that precedes expansion, the compression before breakthrough.',
    emotional: 'You are in, or approaching, a period of difficulty that is not permanent but is unavoidable. The darkness of the tunnel is the condition of the passage, not the destination.',
    practical: 'Tunnels that end in light are extraordinarily positive symbols — they confirm that the difficult passage leads to emergence and expansion. Endless tunnels reflect anxiety about whether the difficulty will ever end.',
    followUp: 'Could you see light at the end of the tunnel, or was it completely dark?'
  },
  cave: {
    emoji: '🕳️', theme: 'The Unconscious & Retreat',
    jungian: 'The cave is the womb of the earth — primary symbol of the unconscious, the pre-ego, the place of initiation in countless cultures. To enter a cave in a dream is to enter the unconscious deliberately, a courageous psychic act.',
    emotional: 'Your dream is drawing you inward, toward your instinctual roots and the pre-personal foundations of your psyche. What you find in the cave has been waiting a long time.',
    practical: 'Caves contain both treasure and monsters — both the shadow and the Self. The quality of what you encounter inside the cave reveals what your unconscious is currently offering or asking you to face.',
    followUp: 'Were you entering the cave willingly, or were you trapped inside it?'
  },
  labyrinth: {
    emoji: '🌀', theme: 'The Complex & Finding the Center',
    jungian: 'The labyrinth is among the most powerful archetypal symbols: the spiral journey toward the center where the Minotaur — the shadow — waits. Solving the labyrinth requires not intelligence but courage and the thread of self-knowledge.',
    emotional: 'You may feel lost in a complex situation with no clear exit. The labyrinth dream invites you to trust that there IS a center, and that every turn that seems to take you further away is part of the path toward it.',
    practical: 'Labyrinth dreams often appear in the middle of processes — mid-therapy, mid-relationship, mid-career change — when the entry point is gone and the exit is not yet visible.',
    followUp: 'Were you searching for a way out, or moving toward something at the center?'
  },
  school: {
    emoji: '🏫', theme: 'Learning, Testing & Past Anxiety',
    jungian: 'School dreams — especially exam dreams — represent the psyche\'s relationship with performance anxiety, judgment, and the fear of being found inadequate. They often arise at any age when you feel tested or evaluated.',
    emotional: 'Something in your current life is activating old feelings of inadequacy, being unprepared, or being judged. The school is less about the past and more about how those early patterns are showing up now.',
    practical: 'If you\'re taking an exam you haven\'t studied for, the psyche is asking: where in your current life do you feel unprepared or like you\'re pretending to know what you don\'t? What\'s the "real test" you\'re facing?',
    followUp: 'Were you a student, a teacher, or a visitor in the school?'
  },

  // ── PEOPLE ─────────────────────────────────────────────────────────────────
  shadow_figure: {
    emoji: '👤', theme: 'The Shadow Self',
    jungian: 'The shadow figure — often dark, threatening, of the same sex — IS the shadow: the disowned parts of your personality that the ego has exiled. It appears threatening not because it is evil, but because the ego fears what it contains.',
    emotional: 'Something you have been exiling from your self-concept is demanding integration. The shadow\'s power over you is directly proportional to how completely you have denied it. Its gifts are equally proportional.',
    practical: 'Shadow figures pursue us in dreams precisely because integration is the agenda. The qualities that threaten you most in the shadow figure are often your most suppressed gifts.',
    followUp: 'Did the shadow figure chase you, or did you somehow end up face to face?'
  },
  child: {
    emoji: '👶', theme: 'The Divine Child & Original Self',
    jungian: 'The child archetype in dreams represents the original self — who you were before adaptation to the world\'s demands. It carries both radical vulnerability and miraculous potential, the part of you that has never been corrupted.',
    emotional: 'The child is asking to be tended: your original curiosity, delight, wonder, and authenticity. You may have outgrown the child, but the child hasn\'t outgrown you.',
    practical: 'A child in danger often represents vulnerability you feel in some area of your current life, or creativity/innocence under threat. A radiant child suggests a new beginning or untapped potential emerging.',
    followUp: 'Was the child known to you, and were you protecting it or was it showing you something?'
  },
  dead_relative: {
    emoji: '👻', theme: 'Messages from the Depths & Unfinished Business',
    jungian: 'Deceased relatives appearing in dreams typically represent psychic content associated with them — unfinished business, inherited patterns, or the wisdom they carried. The unconscious often personifies this content as the person themselves.',
    emotional: 'Something connected to this person — their energy, a pattern you share, something unresolved between you — is active in your psychic life right now. The visit is rarely accidental.',
    practical: 'If the deceased relative seemed at peace, it often signals resolution or acceptance. If they seemed troubled, the dream may be processing unfinished grief or inherited psychological patterns.',
    followUp: 'Did they speak to you, and did the visit feel like a warning or a comfort?'
  },
  stranger: {
    emoji: '🧍', theme: 'Unknown Aspects of Self',
    jungian: 'Strangers in dreams are almost always aspects of yourself you haven\'t met yet. The unconscious personalizes potential — unknown qualities, future possibilities, or repressed capacities — as unfamiliar people.',
    emotional: 'You are being introduced to an aspect of your own psyche that hasn\'t had a face until now. The stranger\'s qualities tell you exactly what this aspect represents.',
    practical: 'How you respond to the stranger mirrors your openness to unknown parts of yourself. Welcoming them is integrative; fleeing suggests resistance to growth.',
    followUp: 'Was the stranger threatening, neutral, or did something about them feel strangely familiar?'
  },
  crowd: {
    emoji: '👥', theme: 'Collective Pressure & Identity',
    jungian: 'A crowd represents the collective — social pressure, conformity, the herd. Dreams of crowds often arise when the individual is navigating the tension between authentic selfhood and the demand to fit in.',
    emotional: 'You may feel pressure to conform, to disappear into the group, or conversely to stand out in a way that feels dangerous. The crowd\'s mood mirrors the social pressure you feel in waking life.',
    practical: 'Being alone in a crowd symbolizes alienation. Leading a crowd suggests leadership anxiety or ambition. Being chased by a crowd suggests feeling hunted by collective judgment.',
    followUp: 'Were you part of the crowd, watching it, or trying to escape it?'
  },

  // ── NATURE ─────────────────────────────────────────────────────────────────
  forest: {
    emoji: '🌲', theme: 'The Unconscious & Nature\'s Wisdom',
    jungian: 'The forest is the oldest symbol of the unconscious — wild, unmarked, full of both danger and medicine. In fairy tales, transformation always begins when the hero enters the forest and leaves the path.',
    emotional: 'You are being called to explore territory that isn\'t mapped, that doesn\'t follow the rules of your known world. The forest offers what civilization cannot: wildness, mystery, and the medicine that only grows in the dark.',
    practical: 'Getting lost in a forest points to confusion about your current direction. Finding your way through a forest suggests navigating complexity successfully. What was waiting at the forest\'s edge?',
    followUp: 'Were you lost in the forest, or did it feel like you were meant to be there?'
  },
  mountain: {
    emoji: '⛰️', theme: 'Aspiration, Ordeal & Peak Consciousness',
    jungian: 'Mountains represent the highest achievement of consciousness — the ordeal of ascent rewarded by expanded perspective. Every spiritual tradition places its divine encounters at the mountain top: Sinai, Olympus, Everest.',
    emotional: 'You are either in the middle of a significant challenge or on the verge of one. The mountain asks what you are willing to endure for the view from the top — for the perspective that only hard-won altitude provides.',
    practical: 'Climbing steadily suggests persistence and gradual progress. Being unable to begin the climb suggests overwhelm. Already at the top suggests a peak moment of clarity or achievement.',
    followUp: 'Were you climbing, near the summit, or looking up at a mountain you hadn\'t yet started?'
  },
  fire: {
    emoji: '🔥', theme: 'Transformation, Passion & Destruction',
    jungian: 'Fire is the most double-natured of elements: it transforms and destroys simultaneously. In the psyche, fire represents passionate engagement with life, creative energy at its most intense, and the capacity for total renewal through total loss.',
    emotional: 'Something is being consumed and transformed. Whether this is welcome or terrifying depends on your relationship with what\'s burning. Not everything fire destroys was worth keeping.',
    practical: 'Controlled fire (fireplace, campfire) suggests creative passion well-directed. Wildfire suggests out-of-control emotion or life situation. What was burning, and was it intentional?',
    followUp: 'Was the fire warming and contained, or consuming and out of control?'
  },
  storm: {
    emoji: '⛈️', theme: 'Emotional Turmoil & Necessary Upheaval',
    jungian: 'Storms represent the dynamic eruption of unconscious energy into the field of consciousness — the psyche\'s way of forcing a reset when the current configuration has become insufficient. Storms don\'t destroy randomly; they clear what has become stagnant.',
    emotional: 'A significant emotional or life upheaval is either underway or approaching. The psyche is telling you that this storm is purposeful even if it doesn\'t feel that way from inside it.',
    practical: 'Dreams of surviving a storm are among the most positive transformation symbols. Being destroyed by a storm represents ego dissolution — frightening but sometimes necessary.',
    followUp: 'Were you caught in the storm or watching it approach from a safe place?'
  },
  lightning: {
    emoji: '⚡', theme: 'Sudden Illumination & Divine Intervention',
    jungian: 'Lightning is the most dramatic symbol of sudden consciousness — the bolt from the unconscious that illuminates everything in a single blinding instant. Jung linked it to numinous experience, to the touch of the transcendent.',
    emotional: 'A sudden, powerful realization is either happening or imminent. Lightning doesn\'t grow gradually; it arrives all at once, changing everything permanently. What insight has been building toward this moment?',
    practical: 'Being struck by lightning in dreams rarely represents danger — more often it represents being chosen, activated, or suddenly changed by an energy larger than the personal self.',
    followUp: 'Were you watching lightning from a distance, or did it feel aimed at you specifically?'
  },
  garden: {
    emoji: '🌸', theme: 'Cultivated Potential & Inner Life',
    jungian: 'The garden is the psyche under cultivation — the deliberate tending of the inner world. Unlike the forest (wild unconscious), the garden represents what you have consciously chosen to grow, nurture, and maintain.',
    emotional: 'The state of the garden mirrors the state of your inner life as you are currently maintaining it. Lush and thriving suggests active self-care. Overgrown or neglected reveals what has gone untended.',
    practical: 'What grows in your garden tells you what you\'ve been cultivating — your values, your relationships, your creative work. What needs weeding? What\'s ready to harvest?',
    followUp: 'Was the garden flourishing or neglected, and were you tending it or discovering it?'
  },
  desert: {
    emoji: '🏜️', theme: 'Emptiness, Purification & Core Existence',
    jungian: 'The desert strips away everything non-essential. Every mystical tradition sends its initiates into the desert not to perish but to encounter what remains when everything else is removed — the bedrock of true self beneath accumulated layers.',
    emotional: 'You may be in, or approaching, a period of radical stripping down. Something has dried up or is becoming very quiet. This is less about loss and more about clarification.',
    practical: 'Dreams of wandering in a desert often accompany genuine creative drought, spiritual dryness, or the between-chapter phase of life where the old meaning has left and the new hasn\'t arrived yet.',
    followUp: 'Were you alone in the desert, and did you see any destination on the horizon?'
  },

  // ── OBJECTS ─────────────────────────────────────────────────────────────────
  mirror: {
    emoji: '🪞', theme: 'Self-Knowledge & Identity',
    jungian: 'The mirror confronts you with yourself — not as you wish to appear, but as the unconscious sees you. Mirror dreams often arise when something true about you is trying to be seen, or when self-deception has become costly.',
    emotional: 'What you see in the dream mirror is significant: your real face, or someone else\'s? Old? Young? Distorted? Each variation reveals something about how your psyche currently sees you — with or without your conscious agreement.',
    practical: 'A broken mirror traditionally represents a shattered self-image undergoing necessary reconstruction. Not seeing your reflection suggests identity dissolution or a profound identity question.',
    followUp: 'What did you see in the mirror — was it your expected face, or something different?'
  },
  key: {
    emoji: '🗝️', theme: 'Solution, Access & Unlocking Potential',
    jungian: 'Keys are among the most hopeful dream symbols — they represent the psyche\'s announcement that the answer exists, that the door CAN be opened, that something locked up is about to become available.',
    emotional: 'You already have what you need. The solution, the access, the capacity — it is in your possession, even if you don\'t yet know what lock it fits. The key is looking for its door.',
    practical: 'Finding a key that opens something important often precedes real-life breakthroughs. Losing a key suggests anxiety about losing access to something important — an opportunity, a relationship, a part of yourself.',
    followUp: 'Did you find the key, lose it, or were you searching for what it opens?'
  },
  clock: {
    emoji: '🕐', theme: 'Time Anxiety & The Present Moment',
    jungian: 'Clocks in dreams represent the ego\'s relationship with time, mortality, and urgency. They often appear when the dreamer is avoiding something time-sensitive — a decision, a deadline, or the reality of aging.',
    emotional: 'There is something time-sensitive in your waking life that your psyche is registering even if your conscious mind is minimizing it. What have you been putting off that has a real temporal boundary?',
    practical: 'Clocks running backward suggest resistance to natural progression. Clocks that have stopped suggest a desire to freeze a particular moment. Racing clocks reflect urgency and pressure.',
    followUp: 'Was the clock showing a specific time, running normally, or was something wrong with it?'
  },
  money: {
    emoji: '💰', theme: 'Value, Worth & Energy Exchange',
    jungian: 'Money in dreams rarely means actual money — it represents psychic value, life energy, and what you consider worth exchanging your most limited resource (time) for. It\'s the symbol of what you value most.',
    emotional: 'Your relationship to self-worth and deserving is active in this dream. Losing money can reflect fears about diminishing value or wasted energy. Finding money suggests discovering value where you didn\'t expect to.',
    practical: 'Are you giving too much, receiving too little, or hoarding energy in your waking life? The dynamics around money in the dream often mirror real dynamics around your energy, creativity, or time.',
    followUp: 'Were you gaining or losing money, and did the amount feel significant or symbolic?'
  },
  phone: {
    emoji: '📱', theme: 'Communication & Connection Anxiety',
    jungian: 'Modern technology appears in contemporary unconscious material as the vehicle for connection and disconnection. A phone in dreams typically represents the link between conscious and unconscious, or your ability to reach and be reached by others.',
    emotional: 'There is a communication you are either trying to make or receive — with yourself, with another person, with your unconscious. The state of the phone reflects the current quality of that connection.',
    practical: 'Phone not working in dreams is extremely common — it often reflects real anxiety about being heard, being able to call for help, or the fear that your attempts to connect are not landing.',
    followUp: 'Were you trying to reach someone, receiving a call, or was the phone not working?'
  },
  teeth: {
    emoji: '🦷', theme: 'Power, Anxiety & Personal Effectiveness',
    jungian: 'Teeth are among the most universal dream symbols — and among the most anxiety-laden. They represent personal power, effectiveness, and the tools with which you engage the world. Losing teeth = losing grip on something vital.',
    emotional: 'You are experiencing anxiety about your ability to handle, digest, or manage something in your life. The teeth crumbling, falling, or becoming loose mirror real fears about inadequacy or loss of control.',
    practical: 'Recurring teeth dreams often peak at moments of real-world anxiety about competence, attractiveness, or power. What area of your life currently feels like it\'s crumbling or falling apart?',
    followUp: 'Were your teeth crumbling, falling out, or something else unusual?'
  },
  blood: {
    emoji: '🩸', theme: 'Vital Force, Sacrifice & Passion',
    jungian: 'Blood is the symbol of life itself — the vital force that animates. It represents passion, sacrifice, family bonds, and the cost of being fully alive. In dreams, blood is rarely merely violence — it is almost always about vital energy.',
    emotional: 'Something that costs you your life energy is at stake. Whether you are bleeding, witnessing blood, or seeing blood elsewhere — the dream is marking what is genuinely alive, vital, or at risk in your current situation.',
    practical: 'Bleeding wounds suggest energy drain or painful but productive opening. Offering blood suggests sacrifice or deep commitment. Blood on your hands can represent guilt about using power.',
    followUp: 'Whose blood was it, and was it flowing freely or was it contained?'
  },
  weapon: {
    emoji: '⚔️', theme: 'Aggression, Defense & Personal Power',
    jungian: 'Weapons represent the shadow of power — the capacity for force and aggression that civilization asks us to sublimate. In dreams, weapons rarely advocate violence; they represent the need to acknowledge and direct aggressive energy.',
    emotional: 'There is aggression, anger, or defensive energy active in your psyche that has not found a healthy channel. The weapon asks: what are you fighting, defending against, or afraid of being too powerful toward?',
    practical: 'If you wielded the weapon with confidence, it suggests healthy access to your own force and boundaries. If you dropped it, couldn\'t use it, or were threatened by it, there is likely suppressed anger or boundary difficulty.',
    followUp: 'Did you use the weapon, or were you protecting yourself from someone else\'s?'
  },
  crown: {
    emoji: '👑', theme: 'Authority, Sovereignty & Earned Power',
    jungian: 'The crown is the symbol of completed individuation in the royal sense — the full integration of the Self that enables genuine sovereignty. It represents authority that has been earned through ordeal, not inherited or seized.',
    emotional: 'Your dream is pointing toward your own authority — your right to lead your own life, make your own choices, and claim your own power without apology or qualification.',
    practical: 'Wearing a crown that fits suggests readiness for greater responsibility or leadership. A crown that feels too heavy suggests the weight of authority you haven\'t fully integrated. Being given a crown is often initiatory.',
    followUp: 'Were you wearing the crown, reaching for it, or was it given to you by someone else?'
  },
  ring: {
    emoji: '💍', theme: 'Commitment, Wholeness & Eternal Return',
    jungian: 'The ring is a circle — the symbol of wholeness, infinity, and commitment. In dreams, rings represent the bonds that define you: commitments made, promises kept or broken, relationships at their most fundamental level.',
    emotional: 'There is a bond, commitment, or contract in your life — with another person, or more profoundly with yourself — that is under examination. The dream is asking about the integrity of your circles.',
    practical: 'Receiving a ring suggests entering a new commitment. Losing a ring reflects anxiety about a bond weakening. Finding an unexpected ring points to a commitment you hadn\'t consciously recognized.',
    followUp: 'Was the ring being given, lost, found, or returned?'
  },

  // ── ACTIONS ─────────────────────────────────────────────────────────────────
  chasing: {
    emoji: '🏃', theme: 'Avoidance & What Pursues You',
    jungian: 'Being chased is the most common action dream — and always points to something you are running from rather than something that intends harm. The pursuer represents shadow content, repressed emotion, or avoided truth.',
    emotional: 'You are running from something in your waking life that has become urgent enough to enter your dream world. The pursuer is always something you already carry inside you, not an external threat.',
    practical: 'Jungian analysts suggest turning in the dream to face the pursuer, asking it what it wants. In waking life: what are you avoiding, postponing, or refusing to face? The chase stops when the facing begins.',
    followUp: 'Were you being chased by a person, an animal, or something undefined and formless?'
  },
  searching: {
    emoji: '🔍', theme: 'The Quest & Unfulfilled Desire',
    jungian: 'Searching dreams represent the psyche in active questing mode — aware of something missing or unlived that it is determined to find. The search is the heroic movement toward wholeness.',
    emotional: 'There is something genuinely needed — a quality, a relationship, a sense of purpose — that feels absent from your current life. The dream is telling you that the need is real and the search is valid.',
    practical: 'What are you searching for in the dream? It usually represents exactly what you most need in waking life: a lost part of yourself, a connection, an answer, a sense of home.',
    followUp: 'Did you find what you were looking for, or did the search remain incomplete?'
  },
  dying: {
    emoji: '💀', theme: 'Endings, Transformation & Ego Death',
    jungian: 'Death in dreams is one of the most misunderstood symbols. Jung was emphatic: dreaming of death almost never predicts literal death. It represents ego death — the ending of a self-concept, a life phase, or an identity that has outlived its usefulness.',
    emotional: 'Something is ending — a version of you, a chapter, a way of being. The dream is asking you to grieve this ending consciously rather than clinging to what is already gone. The death in the dream is clearing space for what\'s coming.',
    practical: 'Your own death in a dream is especially transformative — it often accompanies major personal turning points. Whose death you witness also matters: each represents the ending of a quality or relationship pattern.',
    followUp: 'Whose death occurred, and did the dream feel tragic or strangely peaceful?'
  },
  transforming: {
    emoji: '✨', theme: 'Metamorphosis & Identity Shift',
    jungian: 'Shape-shifting and transformation in dreams represent the psyche\'s extraordinary plasticity — its capacity to become something entirely new. This is one of the most positive and powerful dream experiences.',
    emotional: 'You are actively in the process of becoming. The transformation isn\'t just happening TO you — some part of you is participating in it, even if the conscious mind hasn\'t caught up yet.',
    practical: 'What you transformed into reveals what you are becoming. What you transformed from reveals what you are releasing. Both are important gifts from the unconscious.',
    followUp: 'What did you transform into, and did the transformation feel natural or forced?'
  },

  // ── COLORS ─────────────────────────────────────────────────────────────────
  gold: {
    emoji: '✨', theme: 'The Self & Highest Value',
    jungian: 'Gold is the alchemical symbol of the Self — the fully integrated psyche, the goal of individuation. In dreams, gold marks what is most precious, most real, most worth pursuing in your inner life.',
    emotional: 'Something of extraordinary value is present in this dream — whether it\'s something you\'ve found, something you\'re close to, or something being shown to you as the destination of your current journey.',
    practical: 'Finding gold suggests the imminent discovery of something genuinely valuable in yourself or your life. Gold being taken or lost reflects anxiety about losing something irreplaceable.',
    followUp: 'Was the gold something you found, something you owned, or something being offered to you?'
  },
  black: {
    emoji: '⬛', theme: 'The Shadow & Potential',
    jungian: 'Black in dreams is the color of the unconscious, the prima materia of alchemy — undifferentiated potential that contains everything before it becomes anything. It is not evil; it is the fertile darkness from which all things emerge.',
    emotional: 'Something unknown, unformed, or deeply unconscious is active in this dream. The darkness invites you in rather than warning you away. What is incubating in the black?',
    practical: 'Black clothing can represent mourning, authority, or the shadow persona. Black water or black sky represents the deeper unconscious. Black animals (crow, black horse) are always significant messengers.',
    followUp: 'Was the blackness threatening or did it feel like something rich and full?'
  },
  white: {
    emoji: '⬜', theme: 'Purity, Emptiness & New Beginning',
    jungian: 'White represents the state after completion — the blank page, the empty vessel, the mind after full release. It can be peaceful (resolution) or anxiety-provoking (emptiness, absence, loss of identity).',
    emotional: 'Something has been cleared. This is either the relief of completion or the disorientation of having lost structure, color, and identity. What does whiteness feel like in your current life chapter?',
    practical: 'A white room can mean either clarity and peace or sterility and isolation. White clothing often represents spiritual significance or major life transitions (weddings, deaths, initiations).',
    followUp: 'Was the white peaceful and expansive, or clinical and isolating?'
  },
  purple: {
    emoji: '💜', theme: 'Mysticism, Transformation & Higher Consciousness',
    jungian: 'Purple is the color of the coniunctio — the marriage of opposites in Jungian alchemy. It blends the passion of red with the transcendence of blue, representing the integration of the material and spiritual, the earthly and the divine.',
    emotional: 'Something deeply spiritual or mystical is active in your inner life. Your psyche is working at the level where the visible and invisible worlds meet.',
    practical: 'Purple dreams often accompany spiritual openings, deep intuitive downloads, or creative breakthroughs that carry a sense of the sacred. What felt holy or elevated in this dream?',
    followUp: 'What was purple in the dream — a light, an object, a figure, or the entire atmosphere?'
  },

  // ── ADDITIONAL SYMBOLS ─────────────────────────────────────────────────────
  road: {
    emoji: '🛣️', theme: 'Life Path & Direction',
    jungian: 'The road is perhaps the most literal symbol in the unconscious: your current life path, the direction you are moving, and the terrain through which you travel. Every fork in the road is a real decision.',
    emotional: 'Your relationship to your current direction is under examination. Are you moving purposefully or wandering? Do you know where this road leads? Do you trust where it\'s going?',
    practical: 'A clear road ahead suggests confidence and direction. A blocked road suggests obstacles. A road that ends suggests a chapter closing. A crossroads requires a choice.',
    followUp: 'Were you moving forward with confidence, lost, or standing at a fork?'
  },
  sun: {
    emoji: '☀️', theme: 'Consciousness, Life Force & Vitality',
    jungian: 'The sun is the primary symbol of consciousness itself — the light of awareness that makes all things visible. It represents the hero\'s journey, creative force, the paternal principle, and the energy that organizes the psyche around a vital center.',
    emotional: 'Your sense of life, purpose, and vitality is active in this dream. The state of the sun mirrors the state of your fundamental aliveness — how bright your inner fire is burning right now.',
    practical: 'A rising sun is one of the most auspicious symbols in all of dream psychology — it represents new consciousness, new chapter, new light after darkness. What is your sun doing?',
    followUp: 'Was the sun rising, setting, eclipsed, or shining with unusual brightness?'
  },
  moon: {
    emoji: '🌙', theme: 'The Unconscious, Intuition & Feminine Wisdom',
    jungian: 'The moon is the unconscious counterpart of the solar ego — the anima, the relational and intuitive self, the awareness that operates in cycles rather than linear progression. It governs what grows in darkness.',
    emotional: 'Your intuitive, relational, and cyclical self is speaking. Something that only becomes visible in darkness — a truth, a feeling, a long-term pattern — is being illuminated by lunar light.',
    practical: 'A full moon in dreams often accompanies emotional peak or heightened psychic sensitivity. A new moon suggests a beginning that hasn\'t yet become visible. What phase was the moon in?',
    followUp: 'Was the moon full and bright, or a thin crescent, or something more unusual?'
  },
  stars: {
    emoji: '⭐', theme: 'Guidance, Destiny & Higher Purpose',
    jungian: 'Stars represent the transpersonal dimension — the self as part of something larger than personal history and circumstance. In dreams, stars are guiding lights from a level of the psyche that transcends the personal ego.',
    emotional: 'You are being pointed toward your larger purpose, your genuine calling, the direction that is cosmically yours rather than circumstantially determined. Something is orienting you.',
    practical: 'A single brilliant star often represents the Self or a guiding principle. Falling stars suggest change and release. A starless sky can represent depression or temporary loss of direction.',
    followUp: 'Were the stars guiding you, falling, unusually bright, or were they somehow significant beyond their normal presence?'
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SYMBOL DETECTION
// ─────────────────────────────────────────────────────────────────────────────
function detectSymbols(/** @type {any} */ dreamText) {
  const text = dreamText.toLowerCase();
  const /** @type {any} */
found = [];
  // Priority keywords for each symbol
  const /** @type {any} */
aliases = {
    ocean: ['ocean','sea','waves','tide'],
    river: ['river','stream','creek'],
    flood: ['flood','flooding','flooded'],
    drowning: ['drown','drowning','underwater','suffocating'],
    swimming: ['swimming','swim','swam'],
    rain: ['rain','raining','downpour'],
    well: ['well','wishing well'],
    waterfall: ['waterfall','cascade'],
    lake: ['lake','pond'],
    ice: ['ice','frozen','freeze'],
    snake: ['snake','serpent','viper','cobra'],
    wolf: ['wolf','wolves','werewolf'],
    bird: ['bird','birds','sparrow','pigeon','parrot'],
    cat: ['cat','kitten','feline'],
    dog: ['dog','puppy','hound'],
    horse: ['horse','stallion','mare','pony'],
    spider: ['spider','web','spiderweb'],
    bear: ['bear','grizzly'],
    lion: ['lion','lioness','tiger'],
    eagle: ['eagle','hawk','falcon'],
    owl: ['owl'],
    butterfly: ['butterfly','chrysalis','cocoon','caterpillar'],
    fish: ['fish','salmon','shark'],
    crow: ['crow','raven','blackbird'],
    flying: ['flying','fly','soaring','hovering','wings'],
    falling: ['falling','fell','drop','plunge'],
    floating: ['floating','levitating','weightless'],
    house: ['house','home','building','apartment','room'],
    door: ['door','doorway','entrance'],
    window: ['window','glass','pane'],
    stairs: ['stairs','staircase','steps','ladder'],
    bridge: ['bridge','crossing'],
    tunnel: ['tunnel','underground','passage'],
    cave: ['cave','cavern','grotto'],
    labyrinth: ['maze','labyrinth','lost','wandering'],
    school: ['school','exam','test','classroom','teacher'],
    shadow_figure: ['shadow','dark figure','silhouette','someone behind me'],
    child: ['child','baby','infant','little girl','little boy'],
    dead_relative: ['dead','died','deceased','ghost','passed away'],
    stranger: ['stranger','unknown person','someone i don\'t know'],
    crowd: ['crowd','people','group','mob'],
    forest: ['forest','woods','trees','jungle'],
    mountain: ['mountain','hill','peak','summit'],
    fire: ['fire','flame','burning','blaze'],
    storm: ['storm','tornado','hurricane','thunder'],
    lightning: ['lightning','thunder','bolt'],
    garden: ['garden','flowers','plants','greenhouse'],
    desert: ['desert','sand','dry','wasteland'],
    mirror: ['mirror','reflection','my face'],
    key: ['key','keys','lock'],
    clock: ['clock','watch','time','alarm'],
    money: ['money','cash','coins','gold','wealth'],
    phone: ['phone','call','text','message'],
    teeth: ['teeth','tooth','dental','bite'],
    blood: ['blood','bleeding','wound'],
    weapon: ['weapon','sword','knife','gun','blade'],
    crown: ['crown','throne','royalty'],
    ring: ['ring','wedding','engagement'],
    chasing: ['chasing','being chased','running from','hunted'],
    searching: ['searching','looking for','lost something','find'],
    dying: ['dying','death','dead','killed','murder'],
    transforming: ['transform','turning into','changing into','shape','morph'],
    gold: ['gold','golden','treasure'],
    black: ['black','darkness','dark','pitch black'],
    white: ['white','bright light','blinding'],
    purple: ['purple','violet','indigo'],
    road: ['road','path','highway','journey','walking','driving'],
    sun: ['sun','sunshine','sunlight','solar'],
    moon: ['moon','moonlight','lunar','crescent'],
    stars: ['stars','starlight','night sky','constellation']
  };

  for (const [key, keywords] of Object.entries(aliases)) {
    if (DREAM_SYMBOLS[key] && keywords.some((/** @type {any} */ kw) => text.includes(kw))) {
      found.push({ key, ...DREAM_SYMBOLS[key] });
      if (found.length >= 3) break;
    }
  }

  // Fallback defaults if less than 3 detected
  const /** @type {any} */
defaults = ['mirror','forest','moon'];
  for (const /** @type {any} */
d of defaults) {
    if (found.length >= 3) break;
    if (!found.find((/** @type {any} */ f) => f.key === d)) found.push({ key: d, ...DREAM_SYMBOLS[d] });
  }
  return found.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// STARFIELD CANVAS
// ─────────────────────────────────────────────────────────────────────────────
function initStarfield() {
  const /** @type {any} */
canvas = document.getElementById('starfield');
  if (!canvas) return;
  const /** @type {any} */
ctx = canvas.getContext('2d');
  let /** @type {any} */
stars = [];
  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.004 + 0.002
    }));
  };
  resize();
  window.addEventListener('resize', resize);
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const /** @type {any} */
s of stars) {
      s.a += s.speed;
      const alpha = (Math.sin(s.a) + 1) / 2 * 0.75 + 0.05;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167,139,250,${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  };
  draw();
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────────────────────
function getCredits() { return parseInt(localStorage.getItem('eon-credits') || '3', 10); }
function setCredits(/** @type {any} */ n) {
  localStorage.setItem('eon-credits', n);
  const /** @type {any} */
el = document.getElementById('credit-count');
  if (el) el.textContent = n;
}
function showToast(/** @type {any} */ msg, /** @type {any} */ ms = 2800) {
  const /** @type {any} */
el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}
function dreamEnergyScore(/** @type {any} */ symbols) {
  const seed = symbols.reduce((/** @type {any} */ s, /** @type {any} */ sym, /** @type {any} */ i) => s + sym.key.charCodeAt(0) * (i + 3), 0);
  return 40 + (seed % 55);
}
function synthesize(/** @type {any} */ symbols, /** @type {any} */ _answers) {
  const themes = symbols.map((/** @type {any} */ s) => s.theme).join(' · ');
  const /** @type {any} */
lines = [
    `Your dream weaves together the themes of ${themes}.`,
    `The symbols your unconscious chose are not random — they form a message about your current life chapter.`,
    `What your dream is asking: ${symbols[0]?.practical || 'Pay close attention to what is transforming in you right now.'}`
  ];
  return lines.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// DREAM APP — Main Controller
// ─────────────────────────────────────────────────────────────────────────────
class DreamApp {
  /** @type {string[]} */
  symbols = [];
  /** @type {any[]} */
  answers = [];
  
  /** @param {HTMLElement} root */
  constructor(/** @type {any} */ root) {
    this.root = root;
    this.state = 'landing';
    this.dreamText = '';
    this.followupIndex = 0;
    this.energyScore = 0;
    const /** @type {any} */
creditEl = document.getElementById('credit-count');
    if (creditEl && creditEl !== null) creditEl.textContent = String(getCredits());
    this._render();
  }

  _render() {
    if (this.state === 'landing')    this._renderLanding();
    else if (this.state === 'processing') this._renderProcessing();
    else if (this.state === 'symbols')  this._renderSymbols();
    else if (this.state === 'followup') this._renderFollowUp();
    else if (this.state === 'result')  this._renderResult();
  }

  // ── LANDING ────────────────────────────────────────────────────────────────
  _renderLanding() {
    this.root.innerHTML = `
      <div class="dream-screen">
        <div class="dream-hero">
          <span class="dream-moon">🌙</span>
          <h1 class="dream-title">Dream Interpreter AI</h1>
          <p class="dream-subtitle">Your subconscious speaks in symbols. We translate.</p>
        </div>
        <div class="dream-input-box">
          <label class="dream-input-label" for="dream-text">🔮 Describe your dream</label>
          <textarea id="dream-text" class="dream-textarea" placeholder="I was in a house I didn't recognize, and there was a snake on the stairs. The floor was flooding and I couldn't find the door..." rows="6" maxlength="1200"></textarea>
          <div class="char-hint">
            <span>More detail = deeper reading</span>
            <span id="char-count">0 / 1200</span>
          </div>
        </div>
        <button class="btn-dream" id="btn-interpret" disabled>🌙 Reveal My Dream's Meaning</button>
        <div class="dream-trust">
          <span>🔒 Private — never stored</span>
          <span>🧠 Jungian psychology</span>
          <span>⚡ Instant reading</span>
          <span>✨ 400+ symbols</span>
        </div>
      </div>`;

    const /** @type {any} */
ta = this.root.querySelector('#dream-text');
    const /** @type {any} */
btn = this.root.querySelector('#btn-interpret');
    const /** @type {any} */
counter = this.root.querySelector('#char-count');
    ta.addEventListener('input', () => {
      const len = ta.value.length;
      counter.textContent = `${len} / 1200`;
      btn.disabled = len < 15;
    });
    btn.addEventListener('click', () => {
      this.dreamText = ta.value.trim();
      if (this.dreamText.length >= 15) {
        this.state = 'processing';
        this._render();
      }
    });
  }

  // ── PROCESSING ─────────────────────────────────────────────────────────────
  _renderProcessing() {
    const /** @type {any} */
msgs = [
      { icon: '🌀', text: 'Scanning your dream landscape...' },
      { icon: '🧠', text: 'Mapping symbolic patterns...' },
      { icon: '📚', text: 'Cross-referencing Jungian archetypes...' },
      { icon: '✨', text: 'Calculating dream energy signature...' }
    ];
    this.root.innerHTML = `
      <div class="dream-screen dream-processing">
        <div class="proc-orb"></div>
        <div class="proc-log" id="proc-log"></div>
      </div>`;

    const /** @type {any} */
log = this.root.querySelector('#proc-log');
    let i = 0;
    const next = () => {
      if (i < msgs.length) {
        const /** @type {any} */
div = document.createElement('div');
        div.className = 'proc-msg';
        const /** @type {any} */
icon = document.createElement('span');
        icon.className = 'pm-icon';
        icon.textContent = msgs[i].icon;
        const /** @type {any} */
text = document.createElement('span');
        text.textContent = msgs[i].text;
        const /** @type {any} */
right = document.createElement('span');
        right.style.marginLeft = 'auto';
        const /** @type {any} */
dots = document.createElement('span');
        dots.className = 'typing-dots';
        for (let d = 0; d < 3; d += 1) {
          dots.appendChild(document.createElement('span'));
        }
        right.appendChild(dots);
        div.append(icon, text, right);
        log.appendChild(div);
        i++;
        const delay = i < msgs.length ? 680 : 900;
        setTimeout(() => {
          div.classList.add('done');
          const /** @type {any} */
dotsEl = div.querySelector('.typing-dots');
          if (dotsEl) {
            const /** @type {any} */
check = document.createElement('span');
            check.style.color = '#10b981';
            check.style.fontSize = '.9rem';
            check.textContent = '✓';
            dotsEl.replaceChildren(check);
          }
          if (i < msgs.length) setTimeout(next, 200);
          else {setTimeout(() => {
            this.symbols = detectSymbols(this.dreamText);
            this.energyScore = dreamEnergyScore(this.symbols);
            this.state = 'symbols';
            this._render();
          }, 600);}
        }, delay);
      }
    };
    setTimeout(next, 300);
  }

  // ── SYMBOL REVEAL ──────────────────────────────────────────────────────────
  _renderSymbols() {
    const cards = this.symbols.map((/** @type {any} */ s, /** @type {any} */ i) => `
      <div class="symbol-card" style="animation-delay:${i * 0.15}s">
        <span class="sc-emoji">${s.emoji}</span>
        <div class="sc-key">${s.key.replace('_', ' ')}</div>
        <div class="sc-theme">${s.theme}</div>
      </div>`).join('');

    this.root.innerHTML = `
      <div class="dream-screen">
        <div class="sym-header">
          <h2>🔍 ${this.symbols.length} Symbol${this.symbols.length > 1 ? 's' : ''} Detected</h2>
          <p>The oracle found these key archetypes in your dream...</p>
        </div>
        <div class="symbol-cards-grid">${cards}</div>
        <div style="text-align:center;margin-bottom:1rem;color:var(--clr-text-muted);font-size:.92rem">
          "The unconscious speaks in images. Let me ask you a few things about what you experienced."
        </div>
        <button class="btn-dream" id="btn-followup">🔮 Begin Deep Analysis</button>
        <button class="btn-dream btn-dream-ghost btn-dream-sm" id="btn-retry" style="margin-top:.5rem">↩ Try a different dream</button>
      </div>`;

    this.root.querySelector('#btn-followup')?.addEventListener('click', () => {
      this.followupIndex = 0;
      this.answers = [];
      this.state = 'followup';
      this._render();
    });
    this.root.querySelector('#btn-retry')?.addEventListener('click', () => {
      this.state = 'landing';
      this._render();
    });
  }

  // ── FOLLOW-UP QUESTIONS ────────────────────────────────────────────────────
  _renderFollowUp() {
    const sym = /** @type {any} */ (this.symbols[this.followupIndex]);
    const total = this.symbols.length;
    const pct = Math.round((this.followupIndex / total) * 100);

    const answerOptions = this._buildAnswerOptions(sym);
    const optionsHtml = answerOptions.map((/** @type {any} */ opt) => `
      <button class="answer-btn" data-answer="${opt.value}">
        <span class="ans-icon">${opt.icon}</span>${opt.label}
      </button>`).join('');

    this.root.innerHTML = `
      <div class="dream-screen followup-wrap">
        <div class="q-progress-row">
          <span class="q-label">Question ${this.followupIndex + 1} of ${total}</span>
          <div class="q-track"><div class="q-fill" style="width:${pct}%"></div></div>
          <span class="q-label">${pct}%</span>
        </div>
        <div class="oracle-bubble">
          <div class="oracle-avatar">🔮</div>
          <div class="oracle-msg">
            <div class="q-context">About the ${sym.key.replace('_',' ')} ${sym.emoji}</div>
            <div>${sym.followUp}</div>
          </div>
        </div>
        <div class="answer-grid">${optionsHtml}</div>
      </div>`;

    this.root.querySelectorAll('.answer-btn').forEach((/** @type {any} */ btn) => {
      btn.addEventListener('click', () => {
        this.answers.push({ symbol: sym.key, answer: btn.dataset.answer });
        this.followupIndex++;
        if (this.followupIndex >= total) {
          this.state = 'result';
          this._render();
        } else {
          this._render();
        }
      });
    });
  }

  _buildAnswerOptions(/** @type {any} */ sym) {
    const /** @type {any} */
defaults = [
      { value: 'threatening', icon: '😰', label: 'Threatening — it filled me with fear' },
      { value: 'neutral',    icon: '😐', label: 'Neutral — it was just present' },
      { value: 'drawn',      icon: '✨', label: 'Drawn to it — strangely attracted' },
      { value: 'protective', icon: '🛡️', label: 'Protective — it felt like a guide' }
    ];
    const /** @type {any} */
specific = {
      ocean:    [{ value:'calm',icon:'☁️',label:'Calm and vast — I could have stayed forever'},{value:'dark',icon:'🌑',label:'Dark and overwhelming — it terrified me'},{value:'calling',icon:'🌊',label:'It seemed to be calling me in'},{value:'watched',icon:'👁️',label:'I watched from a safe distance'}],
      snake:    [{ value:'threatened',icon:'😰',label:'It was threatening me directly'},{value:'curious',icon:'🧐',label:'I was strangely calm around it'},{value:'followed',icon:'🐍',label:'It followed me without aggression'},{value:'talked',icon:'💬',label:'It seemed to want to communicate'}],
      house:    [{ value:'familiar',icon:'🏠',label:'Familiar — it felt like home somehow'},{value:'strange',icon:'🔍',label:'Strange — rooms I\'d never been in'},{value:'unsafe',icon:'⚠️',label:'Unsafe — something threatening inside'},{value:'exploring',icon:'🗝️',label:'I was exploring, discovering new rooms'}],
      flying:   [{ value:'free',icon:'🕊️',label:'Completely free — effortless and joyful'},{value:'struggling',icon:'💪',label:'Struggling to stay in the air'},{value:'afraid',icon:'😨',label:'Afraid of the height'},{value:'purposeful',icon:'🎯',label:'Flying toward something specific'}],
      falling:  [{ value:'woke',icon:'😱',label:'I woke up before hitting the ground'},{value:'landed',icon:'🌍',label:'I landed — it wasn\'t as bad as expected'},{value:'flying',icon:'✈️',label:'The fall turned into flying'},{value:'endless',icon:'♾️',label:'The falling felt endless'}],
      fire:     [{ value:'warm',icon:'🔥',label:'Warm and comforting — like a campfire'},{value:'wild',icon:'🌪️',label:'Out of control and consuming everything'},{value:'mine',icon:'✋',label:'I was the one who started it'},{value:'sacred',icon:'✨',label:'It felt sacred, intentional'}],
      chasing:  [{ value:'person',icon:'🧍',label:'A person I recognized'},{value:'unknown',icon:'👤',label:'Something dark and formless'},{value:'animal',icon:'🐾',label:'An animal or creature'},{value:'escaped',icon:'🏃',label:'I escaped somehow'}],
      dying:    [{ value:'peaceful',icon:'🕊️',label:'Strangely peaceful — almost a release'},{value:'violent',icon:'⚡',label:'Violent and frightening'},{value:'self',icon:'💀',label:'It was my own death'},{value:'other',icon:'😢',label:'Someone else died, and I witnessed it'}],
    };
    return specific[sym.key] || defaults;
  }

  // ── RESULT ─────────────────────────────────────────────────────────────────
  _renderResult() {
    const primary = /** @type {any} */ (this.symbols[0]);
    const synth = synthesize(this.symbols, this.answers);
    const credits = getCredits();
    const symEmojis = this.symbols.map((/** @type {any} */ s) => s.emoji).join(' ');
    const shareText = `My dream revealed: "${primary.theme}". Dream Energy: ${this.energyScore}/100. Analyze yours → eonapp.ch/tools/dream-interpreter.html`;

    const layersHtml = this.symbols.map((/** @type {any} */ s) => {
      const /** @type {any} */
labels = ['🔮 Psychological Layer', '❤️ Emotional Layer', '🎯 Practical Layer'];
      const /** @type {any} */
texts  = [s.jungian, s.emotional, s.practical];
      return texts.map((/** @type {any} */ t, /** @type {any} */ j) => `
        <div class="interp-layer">
          <div class="layer-tag">${labels[j]} — ${s.key.replace('_',' ')} ${s.emoji}</div>
          <div class="layer-text">${t}</div>
        </div>`).join('');
    }).flat().slice(0, 6).join('');

    this.root.innerHTML = `
      <div class="dream-screen result-wrap">
        <div class="result-hdr">
          <div class="result-sym-row">${symEmojis}</div>
          <div class="result-primary-theme">${primary.theme}</div>
          <div class="energy-badge">⚡ Dream Energy <span id="energy-num">${this.energyScore}</span>/100</div>
        </div>

        <div id="share-snap-card">${layersHtml}</div>

        <div class="synthesis-box">
          <div class="synthesis-label">🌙 What your dream is telling you</div>
          <div class="synthesis-text">"${synth}"</div>
        </div>

        ${credits >= 2
          ? `<div class="credit-gate">
               <h3>🔓 Deep Reading Available</h3>
               <p>Unlock shadow symbol analysis + dream cycle context (costs 2 💎)</p>
               <button class="btn-dream btn-dream-gold btn-dream-sm" id="btn-deep">✨ Unlock Deep Reading (2 Credits)</button>
             </div>`
          : `<div class="credit-gate">
               <h3>💎 Unlock Deep Reading</h3>
               <p>Get shadow symbol analysis + recurring pattern detection. You need 2 credits.</p>
               <button class="btn-dream btn-dream-gold btn-dream-sm" id="btn-earn">⚡ Earn Free Credits</button>
             </div>`
        }
        <div id="deep-reading-zone"></div>

        <div class="result-actions">
          <button class="btn-dream" id="btn-share">📤 Share My Dream Reading</button>
          <div class="btn-row">
            <button class="btn-dream btn-dream-ghost btn-dream-sm" id="btn-again">🌙 Analyze Another Dream</button>
            <button class="btn-dream btn-dream-ghost btn-dream-sm" id="btn-tools">🧠 More Tools</button>
          </div>
        </div>
      </div>`;

    document.getElementById('btn-share')?.addEventListener('click', () => {
      navigator.clipboard.writeText(shareText).then(() => showToast('✅ Reading copied! Share it.'));
    });
    document.getElementById('btn-again')?.addEventListener('click', () => {
      this.state = 'landing';
      this._render();
    });
    document.getElementById('btn-tools')?.addEventListener('click', () => {
      window.location.href = '/build';
    });
    document.getElementById('btn-deep')?.addEventListener('click', () => {
      setCredits(getCredits() - 2);
      this._renderDeepReading();
    });
    document.getElementById('btn-earn')?.addEventListener('click', () => {
      showToast('💎 Watch an ad to earn credits! Feature coming soon.');
    });

    // Monetization hooks
    if (appWin.EonXP?.award)         appWin.EonXP.award('dream-interpret', 30);
    if (Math.random() < 0.2 && appWin.EonLootbox?.drop) appWin.EonLootbox.drop('mystic');
  }

  // ── DEEP READING ───────────────────────────────────────────────────────────
  _renderDeepReading() {
    const /** @type {any} */
zone = document.getElementById('deep-reading-zone');
    if (!zone) return;
    zone.innerHTML = `
      <div class="deep-reading-reveal">
        ${this.symbols.map((/** @type {any} */ s) => `
          <div class="deep-section">
            <div class="deep-label">🌑 Shadow Layer — ${s.key.replace('_',' ')} ${s.emoji}</div>
            <div class="deep-text">
              The shadow aspect of ${s.key.replace('_',' ')} in your dream points to what this symbol has cost you — not just what it offers.
              ${s.jungian} At its shadow level, this energy can manifest as ${s.emotional.split('.')[0].toLowerCase()}.
              The integration path: ${s.practical}
            </div>
          </div>`).join('')}
        <div class="deep-section">
          <div class="deep-label">🔄 Recurring Pattern Detection</div>
          <div class="deep-text">
            The combination of ${this.symbols.map((/** @type {any} */ s) => s.key).join(', ')} appearing together suggests a recurring psychological theme.
            This pattern typically indicates a major life transition where multiple aspects of the psyche are simultaneously active.
            Dream cycles featuring these symbols tend to appear during periods of identity restructuring — when who you were is releasing and who you are becoming has not yet fully crystallized.
          </div>
        </div>
        <div class="deep-section">
          <div class="deep-label">📅 Next 30 Days — Dream Forecast</div>
          <div class="deep-text">
            Based on your current symbolic configuration, expect the (/** @type {any} */ (this.symbols[0])).key.replace('_',' ') theme to intensify before it resolves.
            The psyche often repeats a symbol across multiple dreams until it has been sufficiently processed.
            Suggestion: keep a brief dream journal for the next 30 days. Note if the (/** @type {any} */ (this.symbols[0])).key.replace('_',' ') changes state —
            from threatening to neutral, or from chaotic to purposeful. That shift will mark the integration point.
          </div>
        </div>
      </div>`;
    document.getElementById('btn-deep')?.remove();
    showToast('✨ Deep reading unlocked!');
    // Bonus XP for deep reading
    if (appWin.EonXP?.award) appWin.EonXP.award('dream-deep-read', 50);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  const /** @type {any} */
root = document.getElementById('app');
  if (root) new DreamApp(root);
  // W635: current tool pages register through content-lite and the shared registration contract.
});
