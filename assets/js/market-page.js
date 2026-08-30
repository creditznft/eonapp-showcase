/**
 * market-page.js — EON Market catalog and listing logic
 * Handles: filter tabs, search, render catalog, list-item form, genesis collection
 */

import { getAllGenesisItems, seedGenesisListings, seedTeamRealmProducts } from './utils/genesis-collection.js';
import { claimMarketStarterNftToVault, ensureMarketStarterDrop, getMarketStarterStats, getMarketStarterVaultProof } from './utils/market-starter-nfts.js';
import { formatUsdtWithSettlement, getUsdtFromEonAmount } from './utils/pricing.js';
import { buildNftUtilityProfile } from './utils/nft-economy.js';
import { escapeHtml } from './utils/escape.js';
import multiLanguageService from './utils/multi-language.js';
import { autoLocalizePage, getCurrentLanguage, translateForUser } from './utils/app-language.js';

let nftVisualBundlePromise = null;

async function getNftVisualBundleBuilder() {
  if (!nftVisualBundlePromise) {
    nftVisualBundlePromise = import('./utils/nft-visuals.js').then((mod) => mod.buildNftVisualBundle);
  }
  return nftVisualBundlePromise;
}

// Seed genesis marketplace listings and team realm products on load (idempotent)
seedGenesisListings();
seedTeamRealmProducts();

function sanitizeMarketplaceHref(/** @type {any} */ value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '/realm';
  try {
    const parsed = new URL(raw, window.location.origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '/realm';
    return parsed.href;
  } catch {
    return '/realm';
  }
}

const /** @type {any} */
CATALOG = [
  /* ── Templates ─────────────────────────────────────── */
  {
    id: 'tmpl-business-plan',
    type: 'template',
    title: 'Business Plan Builder',
    desc: 'Full WorkBench Agent mission template: market research → offer → positioning → go-to-market plan.',
    price: 'Free',
    by: 'EON Team',
    mode: 'agent',
    soon: false,
  },
  {
    id: 'tmpl-landing-page',
    type: 'template',
    title: 'Landing Page Generator',
    desc: 'Structured Build Mode template that outputs hero copy, features, FAQs, CTA, and footer sections.',
    price: 'Free',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },
  {
    id: 'tmpl-email-funnel',
    type: 'template',
    title: '5-Email Onboarding Funnel',
    desc: 'Welcome → value → proof → offer → urgency. Ready to paste and publish.',
    price: '50 EonLite',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },
  {
    id: 'tmpl-side-hustle',
    type: 'template',
    title: 'Side Hustle Finder',
    desc: 'Agent workflow that maps skills and resources to monetizable side hustle ideas with ranking.',
    price: 'Free',
    by: 'EON Team',
    mode: 'agent',
    soon: false,
  },
  {
    id: 'tmpl-content-calendar',
    type: 'template',
    title: '30-Day Content Calendar',
    desc: 'Creator template: niche → pillars → 30 post ideas with platform-specific hooks per day.',
    price: '30 EonLite',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },
  {
    id: 'tmpl-sop-builder',
    type: 'template',
    title: 'SOP Builder',
    desc: 'Describe a process and this template outputs a formatted Standard Operating Procedure document.',
    price: 'Free',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },

  /* ── Agent Packs ────────────────────────────────────── */
  {
    id: 'agent-launch-campaign',
    type: 'agent',
    title: 'Launch Campaign Agent',
    desc: 'Hive agent pack: planner writes campaign brief, executor builds assets, critic reviews, finisher publishes.',
    price: '100 EonLite',
    by: 'EON Team',
    mode: 'hive',
    soon: false,
  },
  {
    id: 'agent-code-reviewer',
    type: 'agent',
    title: 'Code Review Agent',
    desc: 'Drops into Build Mode. Reviews code for bugs, security issues, and performance. Outputs annotated report.',
    price: 'Free',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },
  {
    id: 'agent-competitor-research',
    type: 'agent',
    title: 'Competitor Research Agent',
    desc: 'Trade-linked agent that profiles up to 5 competitors: pricing, strengths, gaps, and positioning angles.',
    price: '80 EonLite',
    by: 'EON Team',
    mode: 'trade',
    soon: false,
  },
  {
    id: 'agent-content-machine',
    type: 'agent',
    title: 'Creator Content Machine',
    desc: 'Idea → script → image brief → caption pack → distribution queue in one Hive chain.',
    price: '120 EonLite',
    by: 'EON Team',
    mode: 'hive',
    soon: true,
  },

  /* ── Prompt Packs ───────────────────────────────────── */
  {
    id: 'prompt-viral-hooks',
    type: 'prompt',
    title: 'Viral Hook Formula Pack',
    desc: '50 proven hook frameworks for YouTube, TikTok, X, and LinkedIn. Each with fill-in slots.',
    price: '40 EonLite',
    by: 'EON Team',
    mode: 'ask',
    soon: false,
  },
  {
    id: 'prompt-trading-thesis',
    type: 'prompt',
    title: 'Trading Thesis Generator',
    desc: 'Trade mode prompts that produce structured thesis documents: entry, stop, target, and risk profile.',
    price: '60 EonLite',
    by: 'EON Team',
    mode: 'trade',
    soon: false,
  },
  {
    id: 'prompt-app-planner',
    type: 'prompt',
    title: 'App Planning Prompt Kit',
    desc: 'From rough idea to full spec: user stories, tech stack recommendations, and MVP feature list.',
    price: 'Free',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },
  {
    id: 'prompt-realm-page',
    type: 'prompt',
    title: 'Realm Page Copy Prompts',
    desc: 'Write your Realm bio, service descriptions, and CTA copy in your voice with these structured prompts.',
    price: 'Free',
    by: 'EON Team',
    mode: 'build',
    soon: false,
  },

  /* ── Output NFTs ────────────────────────────────────── */
  {
    id: 'nft-launch-kit-01',
    type: 'nft',
    title: 'Launch Kit #001',
    desc: 'AI-generated product launch pack: name, tagline, landing copy, social assets, and pitch deck outline.',
    price: '200 EonLite',
    by: 'EON Team',
    soon: true,
  },
  {
    id: 'nft-app-concept-01',
    type: 'nft',
    title: 'App Concept Pack #001',
    desc: 'Fully spec\'d app concept with user personas, feature list, monetization model, and tech recommendations.',
    price: '150 EonLite',
    by: 'EON Team',
    soon: true,
  },
];

const /** @type {any} */
TYPE_ICONS = {
  template: 'TPL',
  agent: 'AGT',
  prompt: 'PRM',
  nft: 'NFT',
  compute: 'CPU',
  dataset: 'DATA',
  skill_pack: 'SKILL',
};

const /** @type {any} */
TYPE_LABELS = {
  template: 'Template',
  agent: 'Agent Pack',
  prompt: 'Prompt Pack',
  nft: 'Output NFT',
  compute: 'Compute Offer',
  dataset: 'Dataset Pack',
  skill_pack: 'Skill Pack',
};

const MARKET_PAGE_COPY = {
  de: {
    'market.genesis.header.title': 'EON Genesis-Kollektion',
    'market.genesis.header.copy': 'Erstklassige Stücke vom EON-Team — alle Erlöse werden zwischen Treasury, Participation Pool, Entwicklung und Community aufgeteilt.',
    'market.genesis.header.community': 'Community-Artikel',
    'market.sell.templates.title': 'Vorlagen',
    'market.sell.templates.desc': 'Missionskonfigurationen, Workflow-Blueprints oder vorausgefüllte Task-Karten für jeden Build-Modus.',
    'market.sell.templates.cta': 'Vorlage auflisten',
    'market.sell.agents.title': 'Agentenpakete',
    'market.sell.agents.desc': 'Packe System-Prompts, Aufgabenketten und Ausführungs-Konfigurationen in ein wiederverwendbares Agentenpaket.',
    'market.sell.agents.cta': 'Agentenpaket auflisten',
    'market.sell.prompts.title': 'Prompt-Pakete',
    'market.sell.prompts.desc': 'Bewährte Prompt-Sets für hochwertige Ergebnisse in bestimmten Workflows oder für bestimmte Zielgruppen.',
    'market.sell.prompts.cta': 'Prompt-Paket auflisten',
    'market.sell.nfts.title': 'Output-NFTs',
    'market.sell.nfts.desc': 'Präge und verkaufe deine besten KI-Inhalte, App-Konzepte, Launch-Kits oder kreativen Outputs.',
    'market.sell.nfts.cta': 'Prägen & auflisten',
    'market.earn.title': 'Mit Creator Market verdienen',
    'market.earn.sub': 'Aktivitäten im Creator Market verdienen Pool Points, schalten NFT-Drops frei und erhöhen deinen öffentlichen Realm-Score.',
    'market.earn.pool.title': 'Pool Points pro Verkauf',
    'market.earn.pool.desc': 'Jede Vorlage, jedes Agentenpaket oder Prompt-Bundle bringt Pool Points für deinen epochalen EonLite-Anteil.',
    'market.earn.tier.title': 'Creator-Tier-Freischaltungen',
    'market.earn.tier.desc': 'Verkaufe genug, um Creator-Operator-Tier-NFTs, geringere Gebühren und zusätzliche Realm-Module freizuschalten.',
    'market.earn.realm.title': 'Öffentlicher Realm-Storefront',
    'market.earn.realm.desc': 'Veröffentlichte Einträge erscheinen auf deiner Realm-Seite. Teile deinen Realm für mehr Traffic und mehr Referrals.',
    'market.purchase.stub': 'Kauf',
    'market.purchase.stub.note': 'Der Vault-Checkout wird weiter ausgebaut; kostenlose Vorlagen funktionieren bereits — nutze bei kostenlosen Einträgen „Kostenlos verwenden“.',
    'market.settlement.label': 'Abwicklung',
    'market.by': 'von',
    'market.flag.hidden': 'Dieser Eintrag ist wegen Community-Meldungen verborgen.',
    'market.flag.hidden.status': 'Der Eintrag hat den Community-Meldewert erreicht und ist jetzt verborgen.',
    'market.flag.community': 'Von der Community markiert',
    'market.flag.reports': 'Meldungen',
    'market.flag.count': 'Meldungen',
    'market.flag.recorded': 'Meldung erfasst. Aktuelle Meldungen:',
    'market.coming-soon': 'Demnächst',
    'market.available-soon': 'Bald verfügbar',
    'market.open': 'Öffnen',
    'market.open-offer': 'Angebot öffnen →',
    'market.use': 'Verwenden',
    'market.use-free': 'Kostenlos verwenden →',
    'market.get': 'Holen',
    'market.team-realm': 'EON Team Realm',
    'market.team-realm-cta': 'Team Realm →',
    'market.form.list': 'Liste eine(n) {0}',
    'market.form.error.required': 'Bitte Titel und Beschreibung ausfüllen.',
    'market.form.ok.queued': '✓ Eintrag vorgemerkt! Marktplatz-Einreichungen starten in Phase 2. Dein Eintrag wurde lokal notiert.',
    'market.qa.pass': 'QA bestanden',
    'market.qa.tune': 'QA nachjustieren',
    'market.quality.elite': 'Elite',
    'market.quality.premium': 'Premium',
    'market.quality.standard': 'Standard',
    'market.quality.experimental': 'Experimentell',
    'market.type.template': 'Vorlage',
    'market.type.agent': 'Agentenpaket',
    'market.type.prompt': 'Prompt-Paket',
    'market.type.nft': 'Output-NFT',
    'market.type.compute': 'Compute-Angebot',
    'market.type.builder': 'Builder-NFT',
    'market.type.operator': 'Operator-NFT',
    'market.type.realmlord': 'Realm-Lord-NFT',
    'market.type.signal': 'Signal-NFT',
    'market.type.pioneer': 'Pioneer-NFT',
    'market.type.skill': 'Skill-Paket',
    'market.type.dataset': 'Datensatz',
    'market.type.workflow': 'Workflow',
    'market.type.profile': 'Agentenprofil',
    'market.type.item': 'Marktobjekt',
    'market.price.free': 'Kostenlos',
    'market.price.quote': 'Angebot',
    'market.price.settle-in-eonl': 'In EonLite abrechnen',
    'market.genesis.item.god-core-alpha-001.title': 'Gottkern Alpha #001',
    'market.genesis.item.god-core-alpha-001.desc': 'Spitzen-Genesis-Relikt des EON-Teams. Gewährt Flagship-Profilierung, bevorzugte Launch-Zuteilungen und Governance-Prestige. Maximal 3 Stück.',
    'market.genesis.item.ultra-model-foundry-001.title': 'Ultra Model Foundry #001',
    'market.genesis.item.ultra-model-foundry-001.desc': 'Ultra-Operator-Sammlerstück für High-End-KI-Bauer. Mit Prioritätsplatzierung in den Discovery-Rails des EON-Teams. Max. 12 Stück.',
    'market.genesis.item.founder-signet-001.title': 'Founder Signet #001',
    'market.genesis.item.founder-signet-001.desc': 'Das ursprüngliche Gründungs-Token der EON-Plattform. Signalisiert Erstwellen-Mitgliedschaft, Gebührenfreiheit und lebenslangen Realm-Boost. Max. 10 Stück.',
    'market.genesis.item.quantum-guardian-001.title': 'Quantum Guardian #001',
    'market.genesis.item.quantum-guardian-001.desc': 'Genesis-Sicherheitsbadge-NFT. Inhaber erhalten frühen Zugriff auf Quantum-Wallet-Funktionen und bevorzugte Verifizierungs-Slots. Max. 25 Stück.',
    'market.genesis.item.realm-lord-genesis-001.title': 'Realm Lord Genesis #001',
    'market.genesis.item.realm-lord-genesis-001.desc': 'Belegt frühen Realm-Operator-Status aus der Genesis-Ära. Schaltet erweiterte Realm-Storefront-Module und eine höhere Pool-Point-Rate frei. Max. 50 Stück.',
    'market.genesis.item.signal-oracle-genesis-001.title': 'Signal Oracle Genesis #001',
    'market.genesis.item.signal-oracle-genesis-001.desc': 'Genesis-Sammlerstück für Signal-Pioniere. Kennzeichnet frühen Zugang zur Marktintelligenz. Max. 100 Stück.',
    'market.genesis.item.builder-genesis-001.title': 'Builder Genesis #001',
    'market.genesis.item.builder-genesis-001.desc': 'Genesis-Builder-NFT für frühe Mitwirkende und Launch-Operatoren. Schaltet Vorteile der Builder-Operator-Stufe frei. Max. 200 Stück.',
    'market.genesis.item.pioneer-genesis-001.title': 'Pioneer Genesis #001',
    'market.genesis.item.pioneer-genesis-001.desc': 'Für frühe EON-Pioniere vergeben. Seltenes Genesis-Sammlerstück mit zusätzlichem Pool-Point-Gewicht in den Epochenausschüttungen. Max. 500 Stück.',
    'market.genesis.item.eon-citizen-badge.title': 'EON Citizen Badge',
    'market.genesis.item.eon-citizen-badge.desc': 'Offene Sammler-Edition für alle EON-Mitglieder. Keine Obergrenze — präge dein Exemplar als Mitgliedsnachweis und verdiene Basis-Pool-Points.',
    'market.genesis.item.eon-operator-pass.title': 'EON Operator Pass',
    'market.genesis.item.eon-operator-pass.desc': 'Unbegrenzter Operator-Pass. Gewährt Zugriff auf alle Realm-Operator-Module und Verkäuferfunktionen des Marktplatzes. 10 EonLite pro Quartal.',
    'market.genesis.item.ai-cinema-genesis-set.title': 'AI Cinema Genesis Set',
    'market.genesis.item.ai-cinema-genesis-set.desc': 'Visuelle EON-Team-Sequenz als NFT-Set für Creator-Showcases und Kampagnen-Drops. Offene Auflage mit rotierenden Metadaten-Paketen.',
    'market.genesis.item.ai-signal-atlas-series.title': 'AI Signal Atlas Series',
    'market.genesis.item.ai-signal-atlas-series.desc': 'Analytische Kunst-NFT-Serie auf Basis von EON-Signal-Snapshots und Markt-Intelligenz-Erzählungen.',
  },
  zh: {
    'market.genesis.header.title': 'EON Genesis 系列',
    'market.genesis.header.copy': 'EON 团队的一等精选作品 —— 所有收益在 Treasury、Participation Pool、开发与社区之间分配。',
    'market.genesis.header.community': '社区项目',
    'market.sell.templates.title': '模板',
    'market.sell.templates.desc': '适用于任何 Build 模式的任务配置、工作流蓝图或预填任务卡。',
    'market.sell.templates.cta': '上架模板',
    'market.sell.agents.title': '代理包',
    'market.sell.agents.desc': '把系统提示词、任务链和执行配置打包成可复用的代理包。',
    'market.sell.agents.cta': '上架代理包',
    'market.sell.prompts.title': '提示词包',
    'market.sell.prompts.desc': '为特定工作流或受众生成高质量输出的成熟提示词集合。',
    'market.sell.prompts.cta': '上架提示词包',
    'market.sell.nfts.title': '输出 NFT',
    'market.sell.nfts.desc': '铸造并出售你最好的 AI 内容、应用概念、发布包或创意作品。',
    'market.sell.nfts.cta': '铸造并上架',
    'market.earn.title': '通过 Creator Market 赚钱',
    'market.earn.sub': 'Creator Market 活动可赚取 Pool Points、解锁 NFT 掉落，并提升你的公开 Realm 分数。',
    'market.earn.pool.title': '每次出售的 Pool Points',
    'market.earn.pool.desc': '每个模板、代理包或提示词包的出售都会为你的 epoch EonLite 分成赚取 Pool Points。',
    'market.earn.tier.title': 'Creator 等级解锁',
    'market.earn.tier.desc': '卖出足够多后，可解锁 Creator Operator 等级 NFT、更低费用和额外 Realm 模块。',
    'market.earn.realm.title': '公开 Realm 店面',
    'market.earn.realm.desc': '已发布的项目会显示在你的 Realm 页面。分享 Realm 以获得更多流量和推荐转化。',
    'market.purchase.stub': '购买',
    'market.purchase.stub.note': 'Vault 结账流程仍在扩展中；免费模板已可使用 —— 免费项目请点“免费使用”。',
    'market.settlement.label': '结算',
    'market.by': '来自',
    'market.flag.hidden': '由于社区举报，该项目已隐藏。',
    'market.flag.hidden.status': '该项目已达到社区举报阈值，现已隐藏。',
    'market.flag.community': '社区标记',
    'market.flag.reports': '举报',
    'market.flag.count': '举报',
    'market.flag.recorded': '举报已记录。当前举报数：',
    'market.coming-soon': '即将上线',
    'market.available-soon': '即将可用',
    'market.open': '打开',
    'market.open-offer': '打开报价 →',
    'market.use': '使用',
    'market.use-free': '免费使用 →',
    'market.get': '获取',
    'market.team-realm': 'EON Team Realm',
    'market.team-realm-cta': 'Team Realm →',
    'market.form.list': '上架一个 {0}',
    'market.form.error.required': '请填写标题和描述。',
    'market.form.ok.queued': '✓ 已排队！Marketplace 提交将在第二阶段开放。你的项目已被本地记录。',
    'market.qa.pass': 'QA 通过',
    'market.qa.tune': 'QA 调整',
    'market.quality.elite': '顶级',
    'market.quality.premium': '高级',
    'market.quality.standard': '标准',
    'market.quality.experimental': '实验性',
    'market.type.template': '模板',
    'market.type.agent': '代理包',
    'market.type.prompt': '提示词包',
    'market.type.nft': '输出 NFT',
    'market.type.compute': '算力报价',
    'market.type.builder': 'Builder NFT',
    'market.type.operator': 'Operator NFT',
    'market.type.realmlord': 'Realm Lord NFT',
    'market.type.signal': 'Signal NFT',
    'market.type.pioneer': 'Pioneer NFT',
    'market.type.skill': '技能包',
    'market.type.dataset': '数据集',
    'market.type.workflow': '工作流',
    'market.type.profile': '代理资料',
    'market.type.item': '市场项目',
    'market.price.free': '免费',
    'market.price.quote': '报价',
    'market.price.settle-in-eonl': '以 EonLite 结算',
    'market.genesis.item.god-core-alpha-001.title': '神核 Alpha #001',
    'market.genesis.item.god-core-alpha-001.desc': 'EON 团队的顶级 Genesis 纪念品。提供旗舰级身份展示、优先发布名额和治理荣誉。最多 3 份。',
    'market.genesis.item.ultra-model-foundry-001.title': 'Ultra Model Foundry #001',
    'market.genesis.item.ultra-model-foundry-001.desc': '面向高阶 AI 构建者的超高等级运营收藏品。在 EON Team 的发现流中享有优先展示。最多 12 份。',
    'market.genesis.item.founder-signet-001.title': '创始徽记 #001',
    'market.genesis.item.founder-signet-001.desc': 'EON 平台的原始创始代币。象征首批成员、零手续费资格以及永久 Realm 增益。最多 10 份。',
    'market.genesis.item.quantum-guardian-001.title': '量子守护者 #001',
    'market.genesis.item.quantum-guardian-001.desc': 'Genesis 时代的安全徽章 NFT。持有者可优先使用 Quantum Wallet 功能并获得优先验证名额。最多 25 份。',
    'market.genesis.item.realm-lord-genesis-001.title': 'Realm Lord Genesis #001',
    'market.genesis.item.realm-lord-genesis-001.desc': '证明来自 Genesis 时代的早期 Realm 运营者身份。解锁更大的 Realm 店面模块和更高的 Pool Points 比例。最多 50 份。',
    'market.genesis.item.signal-oracle-genesis-001.title': '信号先知 Genesis #001',
    'market.genesis.item.signal-oracle-genesis-001.desc': 'Genesis 时代的 Signal 收藏 NFT。标记你在市场情报层的早期采用者身份。最多 100 份。',
    'market.genesis.item.builder-genesis-001.title': '构建者 Genesis #001',
    'market.genesis.item.builder-genesis-001.desc': '面向早期平台贡献者和发布运营者的 Genesis Builder NFT。解锁 Builder Operator 等级权益。最多 200 份。',
    'market.genesis.item.pioneer-genesis-001.title': '先驱 Genesis #001',
    'market.genesis.item.pioneer-genesis-001.desc': '授予 EON 平台先驱的稀有 Genesis 收藏品，在 epoch 分配中具有额外的 Pool Point 权重。最多 500 份。',
    'market.genesis.item.eon-citizen-badge.title': 'EON Citizen Badge',
    'market.genesis.item.eon-citizen-badge.desc': '面向所有 EON 社区成员的开放版收藏品。无供应上限——铸造它可证明成员身份并获得基础 Pool Points。',
    'market.genesis.item.eon-operator-pass.title': 'EON Operator Pass',
    'market.genesis.item.eon-operator-pass.desc': '无限量运营者通行证。可访问所有 Realm Operator 模块和市场卖家功能。每季度 10 EonLite。',
    'market.genesis.item.ai-cinema-genesis-set.title': 'AI Cinema Genesis Set',
    'market.genesis.item.ai-cinema-genesis-set.desc': 'EON 团队生成的视觉序列 NFT 套装，适合创作者展示与活动投放。开放供应，元数据包轮换。',
    'market.genesis.item.ai-signal-atlas-series.title': 'AI Signal Atlas 系列',
    'market.genesis.item.ai-signal-atlas-series.desc': '基于 EON 信号快照与市场情报叙事生成的分析艺术 NFT 系列。',
  },
  ar: {
    'market.genesis.header.title': 'مجموعة EON Genesis',
    'market.genesis.header.copy': 'قطع مميزة من فريق EON — تُقسّم جميع العائدات بين الخزينة ومجمع المشاركة والتطوير والمجتمع.',
    'market.genesis.header.community': 'عناصر المجتمع',
    'market.sell.templates.title': 'القوالب',
    'market.sell.templates.desc': 'تكوينات المهام، مخططات سير العمل، أو بطاقات مهام جاهزة لأي وضع Build.',
    'market.sell.templates.cta': 'إدراج قالب',
    'market.sell.agents.title': 'حزم الوكلاء',
    'market.sell.agents.desc': 'جمّع الأوامر النظامية وسلاسل المهام وتكوينات التنفيذ في حزمة وكيل قابلة لإعادة الاستخدام.',
    'market.sell.agents.cta': 'إدراج حزمة وكيل',
    'market.sell.prompts.title': 'حزم الأوامر',
    'market.sell.prompts.desc': 'مجموعات أوامر مجرّبة تنتج مخرجات عالية الجودة لسير عمل أو جماهير محددة.',
    'market.sell.prompts.cta': 'إدراج حزمة أوامر',
    'market.sell.nfts.title': 'NFTs للمخرجات',
    'market.sell.nfts.desc': 'صُك وبِع أفضل محتوى مولّد بالذكاء الاصطناعي، أو أفكار التطبيقات، أو حزم الإطلاق، أو المخرجات الإبداعية.',
    'market.sell.nfts.cta': 'صك وإدراج',
    'market.earn.title': 'الربح عبر Creator Market',
    'market.earn.sub': 'نشاط Creator Market يكسب Pool Points، ويفتح إسقاطات NFT، ويزيد تقييم Realm العام.',
    'market.earn.pool.title': 'Pool Points لكل عملية بيع',
    'market.earn.pool.desc': 'كل بيع لقالب أو حزمة وكيل أو حزمة أوامر يكسبك Pool Points من حصة EonLite للدورة.',
    'market.earn.tier.title': 'فتح مستويات Creator',
    'market.earn.tier.desc': 'بع بما يكفي لفتح NFTs من فئة Creator Operator ورسوم أقل ووحدات Realm إضافية.',
    'market.earn.realm.title': 'واجهة Realm عامة',
    'market.earn.realm.desc': 'تظهر العناصر المنشورة في صفحة Realm الخاصة بك. شارك Realm لزيادة الزيارات والتحويلات.',
    'market.purchase.stub': 'الشراء',
    'market.purchase.stub.note': 'ما زال إنهاء Vault checkout قيد التوسعة؛ القوالب المجانية تعمل الآن — استخدم “استخدام مجاني” على أي عنصر مجاني.',
    'market.settlement.label': 'التسوية',
    'market.by': 'بواسطة',
    'market.flag.hidden': 'تم إخفاء هذا الإدراج بسبب بلاغات المجتمع.',
    'market.flag.hidden.status': 'وصل الإدراج إلى حد بلاغات المجتمع وهو مخفي الآن.',
    'market.flag.community': 'موسوم من المجتمع',
    'market.flag.reports': 'بلاغات',
    'market.flag.count': 'بلاغات',
    'market.flag.recorded': 'تم تسجيل البلاغ. العدد الحالي:',
    'market.coming-soon': 'قريبًا',
    'market.available-soon': 'متاح قريبًا',
    'market.open': 'فتح',
    'market.open-offer': 'فتح العرض →',
    'market.use': 'استخدام',
    'market.use-free': 'استخدام مجاني →',
    'market.get': 'احصل على',
    'market.team-realm': 'منطقة فريق EON',
    'market.team-realm-cta': 'Team Realm →',
    'market.form.list': 'إدراج {0}',
    'market.form.error.required': 'يرجى تعبئة العنوان والوصف.',
    'market.form.ok.queued': '✓ تم وضع الإدراج في القائمة! ستفتح عمليات الإرسال في المرحلة 2. تم تسجيل العنصر محليًا.',
    'market.qa.pass': 'نجاح QA',
    'market.qa.tune': 'ضبط QA',
    'market.quality.elite': 'نخبوي',
    'market.quality.premium': 'ممتاز',
    'market.quality.standard': 'قياسي',
    'market.quality.experimental': 'تجريبي',
    'market.type.template': 'قالب',
    'market.type.agent': 'حزمة وكيل',
    'market.type.prompt': 'حزمة أوامر',
    'market.type.nft': 'NFT مخرجات',
    'market.type.compute': 'عرض حوسبة',
    'market.type.builder': 'NFT Builder',
    'market.type.operator': 'NFT Operator',
    'market.type.realmlord': 'NFT Realm Lord',
    'market.type.signal': 'NFT Signal',
    'market.type.pioneer': 'NFT Pioneer',
    'market.type.skill': 'حزمة مهارات',
    'market.type.dataset': 'مجموعة بيانات',
    'market.type.workflow': 'سير عمل',
    'market.type.profile': 'ملف وكيل',
    'market.type.item': 'عنصر سوق',
    'market.price.free': 'مجاني',
    'market.price.quote': 'عرض سعر',
    'market.price.settle-in-eonl': 'التسوية بـ EonLite',
    'market.genesis.item.god-core-alpha-001.title': 'نواة الإله ألفا #001',
    'market.genesis.item.god-core-alpha-001.desc': 'قطعة Genesis فائقة من فريق EON. تمنح إبرازًا من فئة flagship وأولوية في تخصيصات الإطلاق ومكانة حوكمة مرموقة. الحد الأقصى 3.',
    'market.genesis.item.ultra-model-foundry-001.title': 'Ultra Model Foundry #001',
    'market.genesis.item.ultra-model-foundry-001.desc': 'مقتنى فائق لمطوري AI المتقدمين. يحصل على أولوية الظهور في مسارات الاكتشاف الخاصة بفريق EON. الحد الأقصى 12.',
    'market.genesis.item.founder-signet-001.title': 'خاتم المؤسس #001',
    'market.genesis.item.founder-signet-001.desc': 'الرمز التأسيسي الأصلي لمنصة EON. يدل على عضوية الموجة الأولى، وإعفاء من الرسوم، وتعزيز دائم لـ Realm. الحد الأقصى 10.',
    'market.genesis.item.quantum-guardian-001.title': 'حارس الكم #001',
    'market.genesis.item.quantum-guardian-001.desc': 'NFT شارة أمان من عصر Genesis. يحصل الحاملون على وصول مبكر إلى ميزات Quantum Wallet وأولوية في الفحص. الحد الأقصى 25.',
    'market.genesis.item.realm-lord-genesis-001.title': 'سيد Realm Genesis #001',
    'market.genesis.item.realm-lord-genesis-001.desc': 'يثبت حالة مشغّل Realm المبكرة من عصر Genesis. يفتح وحدات متجر Realm الموسعة ويزيد معدل Pool Points. الحد الأقصى 50.',
    'market.genesis.item.signal-oracle-genesis-001.title': 'Signal Oracle Genesis #001',
    'market.genesis.item.signal-oracle-genesis-001.desc': 'NFT جامع من عصر Genesis لعشاق Signal. يعلن أنك من أوائل المتبنين في طبقة ذكاء السوق. الحد الأقصى 100.',
    'market.genesis.item.builder-genesis-001.title': 'Builder Genesis #001',
    'market.genesis.item.builder-genesis-001.desc': 'NFT Builder من عصر Genesis للمساهمين الأوائل ومشغلي الإطلاق. يفتح مزايا فئة Builder Operator. الحد الأقصى 200.',
    'market.genesis.item.pioneer-genesis-001.title': 'Pioneer Genesis #001',
    'market.genesis.item.pioneer-genesis-001.desc': 'يُمنح لروّاد منصة EON. مقتنى Genesis نادر بوزن إضافي لـ Pool Points في التوزيعات الدورية. الحد الأقصى 500.',
    'market.genesis.item.eon-citizen-badge.title': 'EON Citizen Badge',
    'market.genesis.item.eon-citizen-badge.desc': 'إصدار مفتوح لكل أعضاء مجتمع EON. بلا حد للإمداد — اصكه لإثبات العضوية وكسب Pool Points أساسي.',
    'market.genesis.item.eon-operator-pass.title': 'EON Operator Pass',
    'market.genesis.item.eon-operator-pass.desc': 'تصريح مشغّل غير محدود. يمنح الوصول إلى جميع وحدات Realm Operator وميزات البائع في السوق. 10 EonLite لكل ربع سنة.',
    'market.genesis.item.ai-cinema-genesis-set.title': 'AI Cinema Genesis Set',
    'market.genesis.item.ai-cinema-genesis-set.desc': 'مجموعة NFT تسلسلية بصرية من إنتاج فريق EON لعرض المبدعين وإطلاق الحملات. إمداد مفتوح مع حزم بيانات وصفية متبدلة.',
    'market.genesis.item.ai-signal-atlas-series.title': 'AI Signal Atlas Series',
    'market.genesis.item.ai-signal-atlas-series.desc': 'سلسلة NFTs فنية تحليلية مبنية على لقطات Signal وروايات ذكاء السوق من EON.',
  },
};

function slugifyMarketKey(/** @type {any} */ value) {
  return String(value || '')
    .toLowerCase()
    .replace(/^genesis-eon-/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getMarketCopyKey(/** @type {any} */ item, /** @type {any} */ field) {
  const scope = item?.isGenesis || item?.genesis ? 'genesis' : 'catalog';
  const slug = slugifyMarketKey(item?.id || item?.title || 'item');
  return `market.${scope}.item.${slug}.${field}`;
}

/**
 * @param {string} key
 * @param {string} fallback
 */
function marketPackText(key, fallback) {
  const lang = getCurrentLanguage() || 'en';
  const localPack = /** @type {any} */ (MARKET_PAGE_COPY)[lang];
  if (localPack && Object.prototype.hasOwnProperty.call(localPack, key)) {
    return localPack[key];
  }
  return multiLanguageService.t(key, fallback);
}

const FLAG_STORE_KEY = 'eon:market:flags:v1';
const FLAG_HIDE_THRESHOLD = 5;

function loadFlags() {
  try { return JSON.parse(localStorage.getItem(FLAG_STORE_KEY) || '{}'); }
  catch { return {}; }
}

function saveFlags(/** @type {any} */ flags) {
  try { localStorage.setItem(FLAG_STORE_KEY, JSON.stringify(flags)); } catch {}
}

function flagListing(/** @type {any} */ listingId) {
  const flags = loadFlags();
  flags[listingId] = (Number(flags[listingId] || 0) + 1);
  saveFlags(flags);
  return flags[listingId];
}

function loadComputeOffers() {
  try {
    const offers = JSON.parse(localStorage.getItem('eon:realm:compute-offers:v1') || '[]');
    return Array.isArray(offers) ? offers : [];
  } catch {
    return [];
  }
}

function buildComputeCatalogEntries() {
  return loadComputeOffers()
    .filter((/** @type {any} */ o) => o && o.available)
    .map((/** @type {any} */ o, /** @type {any} */ idx) => {
      const pricePerCU = Number(o.pricePerCU || 0);
      const minCU = Number(o.minUnitsPerRequest || 1);
      const maxParallel = Number(o.maxParallelJobs || 1);
      const hardware = o.hardware || o.gpu || 'Universal Compute Node';
      const serviceTypes = Array.isArray(o.serviceTypes) && o.serviceTypes.length
        ? o.serviceTypes.join(', ')
        : 'inference';
      return {
        id: `compute-offer-${o.id || idx}`,
        type: 'compute',
        title: `${hardware}`,
        desc: `${o.providerName || 'Realm Provider'} offers CU pay-per-use compute at ${pricePerCU || '0'} USDT per CU (settled in EonLite at checkout quote). Min ${minCU} CU · Max parallel ${maxParallel}. Services: ${serviceTypes}.`,
        price: `${pricePerCU || '0'} USDT/CU`,
        priceUsdt: pricePerCU || 0,
        by: o.providerName || 'Realm Provider',
        mode: 'compute',
        soon: false,
        externalUrl: '/realm',
      };
    });
}

function parseLegacyEonPrice(/** @type {any} */ value) {
  const text = String(value || '').trim();
  if (!text || /^free$/i.test(text)) return 0;
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

function resolveUsdtPricing(/** @type {any} */ item) {
  if (Number.isFinite(Number(item?.priceUsdt))) {
    return formatUsdtWithSettlement(Number(item.priceUsdt), { freeLabel: 'Free' });
  }
  const numericEon = Number(item?.priceEon);
  if (Number.isFinite(numericEon)) {
    return formatUsdtWithSettlement(getUsdtFromEonAmount(numericEon), { freeLabel: 'Free' });
  }
  const parsedLegacy = parseLegacyEonPrice(item?.price);
  if (parsedLegacy == null) {
    return { primary: item?.price || 'Quote', settlement: 'Settle in EonLite' };
  }
  return formatUsdtWithSettlement(getUsdtFromEonAmount(parsedLegacy), { freeLabel: 'Free' });
}

let _activeFilter = 'all';
let _searchQuery = '';
const _marketTranslationCache = new Map();
const MARKET_INITIAL_BATCH = 12;
const MARKET_APPEND_BATCH = 6;
const MARKET_STARTER_TARGET_COUNT = 12;
let _marketRenderToken = 0;

const W131_CATEGORY_DRAWER_COPY = Object.freeze({
  all: {
    title: 'All Market items',
    body: 'Showing generated starter NFTs, official Genesis items, free creator packs, compute offers, and launch-gated paid listings together. Starter drops can save to Vault and preview in Realm.'
  },
  genesis: {
    title: 'Genesis catalog',
    body: 'Official EON Team Genesis items stay visible with clear supply notes. Paid checkout remains launch-gated until payment, seller policy, and dispute proof are live.'
  },
  template: {
    title: 'Template drawer',
    body: 'Templates open into Build OS or the local listing drawer. Seller submissions are saved locally until backend proof is enabled.'
  },
  agent: {
    title: 'Agent Pack drawer',
    body: 'Agent packs explain what workflow they unlock. Free packs open immediately; paid packs show launch-gated checkout guidance.'
  },
  prompt: {
    title: 'Prompt Pack drawer',
    body: 'Prompt packs route to Build OS and Code Showcase. Paid packs cannot silently charge before launch proof.'
  },
  nft: {
    title: 'Output NFT drawer',
    body: 'Starter NFTs are generated locally, can be saved to Vault, and can be previewed in Realm before any on-chain minting is enabled.'
  },
  compute: {
    title: 'Compute offers drawer',
    body: 'Compute listings route to Realm/Workstation offers and show settlement notes. No invisible payment action is allowed.'
  }
});

function scheduleMarketIdle(/** @type {any} */ task, /** @type {any} */ timeout = 1200) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => { void task(); }, { timeout });
    return;
  }
  window.setTimeout(() => { void task(); }, 120);
}

function getMarketCatalogItems() {
  const starterItems = ensureMarketStarterDrop({ count: MARKET_STARTER_TARGET_COUNT }).items;
  const genesisItems = getAllGenesisItems().map((/** @type {any} */ g) => ({ ...g, isGenesis: true }));
  return [...starterItems, ...genesisItems, ...CATALOG, ...buildComputeCatalogEntries()];
}

function getSearchCorpus(/** @type {any} */ item) {
  return [
    item?.title,
    item?.desc,
    item?.type,
    item?.collectionType,
    item?.by,
    item?.mode,
    item?.price,
    item?.district,
    item?.series,
    ...(Array.isArray(item?.tags) ? item.tags : []),
    ...(Array.isArray(item?.utilityUnlocks) ? item.utilityUnlocks : [])
  ].filter(Boolean).join(' ').toLowerCase();
}

function findMarketCatalogItemById(/** @type {any} */ id) {
  const targetId = String(id || '').trim();
  if (!targetId) return null;
  return getMarketCatalogItems().find((/** @type {any} */ item) => String(item?.id || '') === targetId) || null;
}

function initMarketInteractions() {
  const /** @type {any} */
grid = document.getElementById('mk-items-grid');
  if (!grid || grid.dataset.marketDelegationReady === '1') return;
  grid.dataset.marketDelegationReady = '1';

  grid.addEventListener('click', (/** @type {any} */ event) => {
    const target = event?.target instanceof Element ? event.target.closest('button, a') : null;
    if (!target || !grid.contains(target)) return;

    const claimStarterBtn = target.closest('.mk-claim-starter-btn');
    if (claimStarterBtn) {
      const result = claimMarketStarterNftToVault(claimStarterBtn.dataset.id);
      const statusEl = document.getElementById('mk-form-status');
      if (statusEl) {
        statusEl.className = result.ok ? 'mk-form-status ok' : 'mk-form-status err';
        statusEl.textContent = result.ok
          ? result.alreadySaved
            ? `${result.item?.title || 'Starter NFT'} is already saved in your Vault.`
            : `${result.item?.title || 'Starter NFT'} saved to your Vault collection · proof receipt created.`
          : 'Could not save this generated NFT. Try refreshing the Market.';
      }
      showStarterClaimProof(result);
      void renderCatalog();
      return;
    }

    const purchaseBtn = target.closest('.mk-purchase-btn');
    if (purchaseBtn) {
      const item = findMarketCatalogItemById(purchaseBtn.dataset.id);
      if (item) void showPurchaseStub(item);
      return;
    }

    const flagBtn = target.closest('.mk-flag-btn');
    if (!flagBtn) return;
    const listingId = String(flagBtn.dataset.id || '').trim();
    if (!listingId || listingId.startsWith('genesis-eon-')) return;
    const total = flagListing(listingId);
    const /** @type {any} */
statusEl = document.getElementById('mk-form-status');
    if (statusEl) {
      statusEl.className = 'mk-form-status ok';
      statusEl.textContent = total >= FLAG_HIDE_THRESHOLD
        ? String(marketPackText('market.flag.hidden.status', 'Listing reached community flag threshold and is now hidden.'))
        : String(marketPackText('market.flag.recorded', `Flag recorded. Current report count: ${total}/${FLAG_HIDE_THRESHOLD}`));
    }
    void renderCatalog();
  });
}



function ensureMarketTrustDrawer() {
  let drawer = document.getElementById('mk-market-trust-drawer');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mk-market-trust-drawer';
    drawer.className = 'mk-market-trust-drawer hidden';
    drawer.setAttribute('data-w131-market-drawer', 'trust-proof');
    drawer.setAttribute('role', 'status');
    drawer.setAttribute('aria-live', 'polite');
    const grid = document.getElementById('mk-items-grid');
    grid?.parentElement?.insertBefore(drawer, grid.nextSibling);
  }
  return drawer;
}

function renderMarketTrustDrawer({ title, body, actions = [] }) {
  const drawer = ensureMarketTrustDrawer();
  if (!drawer) return null;
  const actionHtml = actions.length
    ? `<div class="mk-market-trust-actions">${actions.map((action) => `<a class="btn btn-outline btn-sm" href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a>`).join('')}</div>`
    : '';
  drawer.className = 'mk-market-trust-drawer';
  drawer.innerHTML = `<div><span class="mk-genesis-badge">Market trust</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div>${actionHtml}`;
  return drawer;
}

function showCategoryTrustDrawer(filter) {
  const copy = W131_CATEGORY_DRAWER_COPY[filter] || W131_CATEGORY_DRAWER_COPY.all;
  renderMarketTrustDrawer({
    title: copy.title,
    body: copy.body,
    actions: [
      { label: 'Save drops to Vault', href: '/vault.html#nft-collection' },
      { label: 'Preview in Realm', href: '/realm.html?preview=market-drop' },
      { label: 'Open Build OS', href: '/workbench.html#build-os' }
    ]
  });
}

function showStarterClaimProof(result) {
  if (!result?.ok) {
    renderMarketTrustDrawer({
      title: 'Starter NFT save failed',
      body: 'The starter NFT could not be saved locally. Refresh Market and try again; no paid action or wallet operation happened.',
      actions: [{ label: 'Open Vault', href: '/vault.html#nft-collection' }]
    });
    return;
  }
  renderMarketTrustDrawer({
    title: result.alreadySaved ? 'Starter NFT already in Vault' : 'Starter NFT saved to Vault',
    body: `${result.item?.title || 'Starter NFT'} is now recorded in both local Vault-compatible collections with a W138 proof receipt. Vault visible items: ${Number(result.vaultProof?.visibleV3Count || 0)}. You can preview Market drops in Realm before any on-chain minting is enabled.`,
    actions: [
      { label: 'Open Vault NFTs', href: '/vault.html#nft-collection' },
      { label: 'Preview in Realm', href: `/realm.html?preview=market-drop&item=${encodeURIComponent(result.item?.id || '')}` }
    ]
  });
}

function updateStarterGenerationStatus() {
  const status = document.getElementById('mk-starter-generation-status');
  const grid = document.getElementById('mk-items-grid');
  if (!status || !grid) return;
  const rendered = grid.querySelectorAll('.mk-item-card.is-user-drop').length;
  const stats = getMarketStarterStats();
  const total = Math.max(Number(stats.count || 0), MARKET_STARTER_TARGET_COUNT);
  if (rendered >= total) {
    status.textContent = `${rendered}/${total} generated · each NFT can be saved to Vault`;
    status.classList.add('complete');
    return;
  }
  status.textContent = `Generating NFT ${Math.min(rendered + 1, total)}/${total}… cards appear one by one`;
  status.classList.remove('complete');
}

async function appendMarketCards(/** @type {number} */ renderToken, /** @type {any[]} */ items, /** @type {any} */ flags) {
  const /** @type {any} */
grid = document.getElementById('mk-items-grid');
  if (!grid || renderToken !== _marketRenderToken) return;

  for (let i = 0; i < items.length; i += MARKET_APPEND_BATCH) {
    if (renderToken !== _marketRenderToken) return;
    const chunk = items.slice(i, i + MARKET_APPEND_BATCH);
    const chunkHtml = (await Promise.all(chunk.map((/** @type {any} */ item) => renderItemCard(item, flags)))).join('');
    if (renderToken !== _marketRenderToken || !grid.isConnected) return;
    grid.insertAdjacentHTML('beforeend', chunkHtml);
    updateStarterGenerationStatus();
    void autoLocalizePage(grid);
    if (i + MARKET_APPEND_BATCH < items.length) {
      await new Promise((resolve) => scheduleMarketIdle(resolve, 200));
    }
  }

  if (renderToken === _marketRenderToken && grid.isConnected) {
    grid.classList.remove('mk-items-grid--hydrating');
    updateStarterGenerationStatus();
  }
}

/**
 * @param {string} text
 */
async function translateMarketText(text) {
  const source = String(text || '').trim();
  if (!source) return '';
  const lang = getCurrentLanguage() || 'en';
  const cacheKey = `${lang}::${source}`;
  if (_marketTranslationCache.has(cacheKey)) return _marketTranslationCache.get(cacheKey);
  if (lang === 'en') {
    _marketTranslationCache.set(cacheKey, source);
    return source;
  }
  const translated = await translateForUser(source, { fromLang: 'en', toLang: lang, category: 'guide' });
  const result = translated && translated.trim() ? translated : source;
  _marketTranslationCache.set(cacheKey, result);
  return result;
}

async function renderCatalog() {
  const /** @type {any} */
grid = document.getElementById('mk-items-grid');
  const /** @type {any} */
empty = document.getElementById('mk-empty');
  if (!grid) return;
  const renderToken = ++_marketRenderToken;

  const flags = loadFlags();
  let fullCatalog = getMarketCatalogItems();
  if (!fullCatalog.length) {
    fullCatalog = CATALOG.map((item) => ({ ...item, fallback: true }));
  }

  const q = _searchQuery.toLowerCase().trim();
  const filtered = fullCatalog.filter((/** @type {any} */ item) => {
    if (_activeFilter === 'genesis') return item.isGenesis || item.genesis;
    const matchType = _activeFilter === 'all' || item.type === _activeFilter || item.collectionType === _activeFilter;
    const matchSearch = !q || getSearchCorpus(item).includes(q);
    return matchType && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.classList.remove('mk-items-grid--loading', 'mk-items-grid--hydrating');
    if (empty) {
      const total = fullCatalog.length;
      const query = q ? ` for “${_searchQuery.trim()}”` : '';
      empty.innerHTML = `<div class="mk-empty-card"><strong>No matching Market results${escapeHtml(query)}.</strong><p>Clear search or switch back to All to see ${total} Genesis, creator, compute, and personal EON City NFT items. New visitors also receive a unique local starter drop.</p><button class="btn btn-primary btn-sm" id="mk-clear-search" type="button">Show all items</button></div>`;
      empty.classList.remove('hidden');
      document.getElementById('mk-clear-search')?.addEventListener('click', () => {
        _searchQuery = '';
        _activeFilter = 'all';
        const input = /** @type {HTMLInputElement | null} */ (document.getElementById('mk-search'));
        if (input) input.value = '';
        document.querySelectorAll('.mk-filter-tab').forEach((tab) => {
          const active = tab.dataset.filter === 'all';
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', String(active));
        });
        void renderCatalog();
      });
    }
    return;
  }

  empty?.classList.add('hidden');
  const visibleNow = filtered.slice(0, MARKET_INITIAL_BATCH);
  const deferredItems = filtered.slice(MARKET_INITIAL_BATCH);
  const hasGenesis = filtered.some((/** @type {any} */ item) => item.isGenesis);

  let html = '';

  const starterStats = getMarketStarterStats();
  const starterVaultProof = getMarketStarterVaultProof();
  if (filtered.some((/** @type {any} */ item) => item.generatedForUser)) {
    html += `<div class="mk-personal-drop-header">
      <span class="mk-personal-drop-badge">✦ Your EON City starter drop</span>
      <span class="mk-genesis-copy">local NFT generator is active · ${starterStats.claimed} saved to Vault · ${starterVaultProof.receiptCount} proof receipt${starterVaultProof.receiptCount === 1 ? '' : 's'}</span>
      <span class="mk-genesis-copy mk-generation-status" id="mk-starter-generation-status" role="status" aria-live="polite">Generating NFT 1/${Math.max(starterStats.count, MARKET_STARTER_TARGET_COUNT)}… cards appear one by one</span>
    </div>`;
  }

  if (hasGenesis) {
    const genesisTitle = marketPackText('market.genesis.header.title', 'EON Genesis Collection');
    const genesisCopy = marketPackText('market.genesis.header.copy', 'First-class items by the EON Team — all proceeds split across Treasury, Participation Pool, Dev & Community.');
    html += `<div class="mk-genesis-header">
      <span class="mk-genesis-badge">⚡ ${escapeHtml(genesisTitle)}</span>
      <span class="mk-genesis-copy">${escapeHtml(genesisCopy)}</span>
    </div>`;
  }

  html += (await Promise.all(visibleNow.map((/** @type {any} */ item) => renderItemCard(item, flags)))).join('');
  grid.innerHTML = html;
  grid.classList.remove('mk-items-grid--loading');
  grid.classList.toggle('mk-items-grid--hydrating', deferredItems.length > 0);
  void autoLocalizePage(grid);

  if (deferredItems.length > 0) {
    scheduleMarketIdle(() => appendMarketCards(renderToken, deferredItems, flags), 700);
  }
}

async function renderItemCard(/** @type {any} */ item, /** @type {any} */ flags) {
  const isGenesis = item.isGenesis || item.genesis;
  const isUserDrop = Boolean(item.generatedForUser || item.source === 'market-starter-drop');
  const isFlagged = !isGenesis && (flags[item.id] || 0) >= FLAG_HIDE_THRESHOLD;
  const safeId = escapeHtml(String(item.id || ''));
  const titleKey = getMarketCopyKey(item, 'title');
  const descKey = getMarketCopyKey(item, 'desc');
  const safeTitle = escapeHtml(await translateMarketText(marketPackText(titleKey, item.title || '')));
  const safeDesc = escapeHtml(await translateMarketText(marketPackText(descKey, item.desc || '')));
  const safeBy = escapeHtml(String(item.by || ''));
  const safeExternalUrl = escapeHtml(sanitizeMarketplaceHref(item.externalUrl || '/realm'));
  const limitedTag = item.limited
    ? `<span class="mk-soon-tag mk-soon-tag--genesis">🔢 Max ${item.maxSupply}</span>`
    : item.maxSupply === null && item.limited === false
      ? `<span class="mk-soon-tag mk-soon-tag--open">♾ Open Edition</span>`
      : '';
  const genesisTag = isGenesis
    ? `<span class="mk-genesis-seller-tag">⚡ EON Team</span>`
    : isUserDrop
      ? `<span class="mk-personal-drop-chip">✦ Generated for you</span>`
      : '';
  const revenueNote = item.revenueNote
    ? `<span class="mk-flag-count mk-revenue-note">${item.revenueNote}</span>`
    : '';

  const buildNftVisualBundle = await getNftVisualBundleBuilder();
  const nftBundle = buildNftVisualBundle({
    ...item,
    rarity: item.rarityTier ?? item.rarity ?? (isGenesis ? 2 : 'common'),
    subtitle: await translateMarketText(marketPackText(`market.type.${item.collectionType || item.type || 'item'}`, item.collectionType || item.type || 'market item')),
    seedKey: `${item.id}|${item.title}|${item.type}|${item.priceEon || item.price || 0}`
  }, { wide: true, hollow: isGenesis || (item.rarityTier ?? 0) >= 3 });
  const utilityProfile = buildNftUtilityProfile({
    ...item,
    metadata: item.metadata || {},
    rarityTier: item.rarityTier ?? item.rarity ?? (isGenesis ? 2 : 'common')
  });
  const utilityUnlocks = Array.isArray(item.utilityUnlocks) && item.utilityUnlocks.length
    ? item.utilityUnlocks.slice(0, 3)
    : (Array.isArray(utilityProfile.unlocks) ? utilityProfile.unlocks.slice(0, 3) : []);
  const utilityTags = [
    utilityProfile.badgeLabel,
    utilityProfile.animatedBadge,
    utilityProfile.dataBadge,
    utilityProfile.bridgeBadge,
    utilityProfile.marketBadge,
    item.permanenceRail ? `Rail: ${String(item.permanenceRail).toUpperCase()}` : ''
  ].filter(Boolean).slice(0, 4);
  const utilityHtml = utilityUnlocks.length || utilityTags.length || utilityProfile.summary
    ? `<div class="mk-item-utility">
         ${utilityProfile.summary ? `<div class="mk-flag-count mk-utility-summary">${escapeHtml(utilityProfile.summary)}</div>` : ''}
         ${utilityUnlocks.length ? `<div class="mk-flag-count mk-utility-unlocks">Unlocks: ${escapeHtml(utilityUnlocks.join(' · '))}</div>` : ''}
         ${utilityTags.length ? `<div class="mk-item-meta mk-item-meta--utility">${utilityTags.map((tag) => `<span class="mk-soon-tag mk-soon-tag--open">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
       </div>`
    : '';
  const qualityScore = Number(nftBundle.qualityScore || 0);
  const qualityPct = Math.max(0, Math.min(100, Math.round((qualityScore / 100) * 100)));
  const qualityLabel = await translateMarketText(marketPackText(
    qualityScore >= 88 ? 'market.quality.elite' : qualityScore >= 75 ? 'market.quality.premium' : qualityScore >= 60 ? 'market.quality.standard' : 'market.quality.experimental',
    qualityScore >= 88 ? 'Elite' : qualityScore >= 75 ? 'Premium' : qualityScore >= 60 ? 'Standard' : 'Experimental'
  ));
  const artHtml = nftBundle.staticUri
    ? `<div class="mk-nft-svg-card" aria-hidden="true"><img src="${escapeHtml(nftBundle.staticUri)}" alt="" loading="lazy" fetchpriority="low" decoding="async" /></div>`
    : `<div class="mk-nft-svg-card" aria-hidden="true">${nftBundle.svg}</div>`;
  const pricing = resolveUsdtPricing(item);
  const isFree = /^free$/i.test(String(pricing.primary || '')) || Number(item.priceEon || 0) === 0;

  return `
    <article class="mk-item-card market-card${item.soon ? ' is-soon' : ''}${isFlagged ? ' is-flagged' : ''}${isGenesis ? ' is-genesis' : ''}${isUserDrop ? ' is-user-drop' : ''}" data-id="${safeId}">
      ${artHtml}
      <div>
        <span class="mk-type-badge type-${item.type}">${(/** @type {any} */ (TYPE_ICONS))[item.type] || 'GEN'} ${escapeHtml(await translateMarketText(marketPackText(`market.type.${item.type}`, (/** @type {any} */ (TYPE_LABELS))[item.type] || item.type)))}</span>
      </div>
      <h3 class="mk-item-title">${safeTitle}</h3>
      ${isFlagged
        ? `<p class="mk-item-desc">${escapeHtml(await translateMarketText(marketPackText('market.flag.hidden', 'This listing is hidden due to community reports.')))}</p>
           <div class="mk-flag-state">${escapeHtml(await translateMarketText(marketPackText('market.flag.community', 'Community flagged')))} (${flags[item.id] || 0} ${escapeHtml(await translateMarketText(marketPackText('market.flag.reports', 'reports')) )})</div>`
        : `<p class="mk-item-desc">${safeDesc}</p>
           ${utilityHtml}
           <div class="mk-item-meta">
             <span class="mk-item-price">${pricing.primary}</span>
             <span class="mk-quality-chip">Q${qualityScore.toFixed(1)} · ${qualityLabel}</span>
             ${genesisTag}
             ${!isGenesis ? `<span class="mk-item-by">${escapeHtml(await translateMarketText(marketPackText('market.by', 'by')))} ${safeBy}</span>` : ''}
             ${!isGenesis ? `<span class="mk-flag-count">${escapeHtml(await translateMarketText(marketPackText('market.flag.count', 'Flags')))}: ${flags[item.id] || 0}</span>` : ''}
             ${item.soon ? `<span class="mk-soon-tag">${escapeHtml(await translateMarketText(marketPackText('market.coming-soon', 'Coming Soon')))}</span>` : ''}
             ${limitedTag}
           </div>
          <div class="mk-quality-row" role="img" aria-label="Quality score ${qualityScore.toFixed(1)} out of 100">
             <progress class="mk-quality-progress" value="${qualityPct}" max="100" aria-hidden="true"></progress>
             <span class="mk-quality-pass">${escapeHtml(await translateMarketText(marketPackText(nftBundle.qaPass ? 'market.qa.pass' : 'market.qa.tune', nftBundle.qaPass ? 'QA pass' : 'QA tune')))}</span>
           </div>
           <div class="mk-flag-count mk-settlement-note">${escapeHtml(await translateMarketText(String(pricing.settlement || '')))}</div>
           ${revenueNote ? `<div>${revenueNote}</div>` : ''}
           <div class="mk-item-actions">
             ${item.soon
               ? `<span class="mk-soon-tag">${escapeHtml(await translateMarketText(marketPackText('market.available-soon', 'Available Soon')))}</span>`
               : isUserDrop
                 ? `<button class="btn btn-primary btn-sm mk-claim-starter-btn" data-id="${safeId}" type="button">Save to Vault</button><a class="btn btn-outline btn-sm mk-preview-realm-btn" data-w131-preview-realm="${safeId}" href="/realm.html?preview=market-drop&amp;item=${safeId}">Preview in Realm</a>`
                 : item.type === 'compute'
                   ? `<a href="${safeExternalUrl}" class="btn btn-primary btn-sm" aria-label="${escapeHtml(await translateMarketText(marketPackText('market.open', 'Open')))} ${safeTitle}">${escapeHtml(await translateMarketText(marketPackText('market.open-offer', 'Open Offer →')))}</a>`
                   : isFree
                     ? `<a href="/build" class="btn btn-primary btn-sm" aria-label="${escapeHtml(await translateMarketText(marketPackText('market.use', 'Use')))} ${safeTitle}">${escapeHtml(await translateMarketText(marketPackText('market.use-free', 'Use Free →')))}</a>`
                     : `<button class="btn btn-primary btn-sm mk-purchase-btn" data-id="${safeId}" data-w131-launch-gated="payment-proof" type="button">${isGenesis ? '⚡ ' : ''}Launch-gated · ${escapeHtml(await translateMarketText(marketPackText(`market.price.${String(pricing.primary || '').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`, pricing.primary)))}</button>`
             }
             ${isGenesis
               ? `<a href="/team-realm.html" class="btn btn-outline btn-sm" aria-label="${escapeHtml(await translateMarketText(marketPackText('market.team-realm', 'EON Team Realm')))}">${escapeHtml(await translateMarketText(marketPackText('market.team-realm-cta', 'Team Realm →')))}</a>`
               : isUserDrop
                 ? `<a href="/vault.html#nft-collection" class="btn btn-outline btn-sm">Open Vault</a>`
                 : `<button class="btn btn-outline btn-sm mk-flag-btn" data-id="${safeId}" type="button" aria-label="${escapeHtml(await translateMarketText(marketPackText('market.flag', 'Flag')))} ${safeTitle}">${escapeHtml(await translateMarketText(marketPackText('market.flag', 'Flag')))}</button>`
             }
           </div>
        `
      }
    </article>
  `;
}

async function showPurchaseStub(/** @type {any} */ item) {
  const form = document.getElementById('mk-listing-form');
  if (form) form.classList.add('hidden');
  const pricing = resolveUsdtPricing(item);
  const title = await translateMarketText(marketPackText(getMarketCopyKey(item, 'title'), item.title || ''));
  const settlementText = await translateMarketText(marketPackText('market.settlement.label', 'Settlement'));
  const vaultText = await translateMarketText(marketPackText('market.purchase.stub.note', 'Vault checkout finalization is being expanded; free templates work now — click "Use Free" on any free item.'));
  renderMarketTrustDrawer({
    title: `Launch-gated checkout: ${title}`,
    body: `${settlementText}: ${pricing.settlement}. ${vaultText} No payment, wallet signature, or credit deduction is attempted until payment proof, seller policy, dispute handling, and post-purchase support are verified.`,
    actions: [
      { label: 'Open billing rules', href: '/billing.html' },
      { label: 'Ask EONBOT support', href: '/chat.html?support=1&topic=market-checkout' },
      { label: 'Preview in Realm', href: `/realm.html?preview=market-listing&item=${encodeURIComponent(item?.id || '')}` }
    ]
  });
}

/* ── Filter tabs ──────────────────────────────────────────────── */
function initFilters() {
  const /** @type {any} */
tabs = document.querySelectorAll('.mk-filter-tab');
  tabs.forEach((/** @type {any} */ tab) => {
    tab.addEventListener('click', () => {
      _activeFilter = (/** @type {HTMLElement} */ (tab)).dataset.filter || 'all';
      tabs.forEach((/** @type {any} */ t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });
      void renderCatalog();
      showCategoryTrustDrawer(_activeFilter);
    });
  });
}

/* ── Search ────────────────────────────────────────────────────── */
function initSearch() {
  const input = /** @type {HTMLInputElement | null} */ (document.getElementById('mk-search'));
  if (!input) return;
  input.addEventListener('input', () => {
    _searchQuery = input.value;
    void renderCatalog();
  });
}

/* ── Sell / Listing form ────────────────────────────────────────── */
function initSellButtons() {
  const form = /** @type {HTMLElement | null} */ (document.getElementById('mk-listing-form'));
  const /** @type {any} */
formTitle = document.getElementById('mk-form-title');
  const catSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('mk-item-category'));

  const /** @type {any} */
SELL_BTNS = {
    'mk-list-template': 'template',
    'mk-list-agent': 'agent',
    'mk-list-prompt': 'prompt',
    'mk-list-nft': 'nft',
  };

  Object.entries(SELL_BTNS).forEach((/** @type {any} */ [btnId, cat]) => {
    const /** @type {any} */
btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (catSelect) catSelect.value = cat;
      if (formTitle) void translateMarketText(marketPackText('market.form.list', `List a ${(/** @type {any} */ (TYPE_LABELS))[cat]}`)).then(text => { formTitle.textContent = text; });
      if (form) {
        form.classList.remove('hidden');
        form.setAttribute('role', 'dialog');
        form.setAttribute('aria-modal', 'false');
        form.classList.add('mk-list-form--drawer');
        const status = document.getElementById('mk-form-status');
        if (status) {
          status.className = 'mk-form-status ok';
          status.textContent = `${(/** @type {any} */ (TYPE_LABELS))[cat] || 'Item'} listing drawer opened. This opens a local listing drawer; submissions are saved locally until seller backend proof is live.`;
        }
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('mk-item-title')?.focus?.();
      }
    });
  });

  const /** @type {any} */
cancelBtn = document.getElementById('mk-cancel-listing');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => form?.classList.add('hidden'));
  }

  const /** @type {any} */
submitBtn = document.getElementById('mk-submit-listing');
  const /** @type {any} */
statusEl = document.getElementById('mk-form-status');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const title = /** @type {HTMLInputElement | null} */ (document.getElementById('mk-item-title'))?.value.trim();
      const desc = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('mk-item-desc'))?.value.trim();
      if (!title || !desc) {
        if (statusEl) { void Promise.resolve(marketPackText('market.form.error.required', 'Please fill in the title and description.')).then(text => { statusEl.textContent = text; statusEl.className = 'mk-form-status err'; }); }
        return;
      }
      /* stub — real submission needs backend or IPFS listing */
      if (statusEl) {
        void Promise.resolve(marketPackText('market.form.ok.queued', '✓ Listing queued! Marketplace submissions open in Phase 2. Your item has been noted locally.')).then(text => { statusEl.textContent = text; statusEl.className = 'mk-form-status ok'; });
      }
      const pending = JSON.parse(localStorage.getItem('eon:market:pending-listings:v1') || '[]');
      const price = /** @type {HTMLInputElement | null} */ (document.getElementById('mk-item-price'))?.value;
      pending.push({ title, desc, category: catSelect?.value, price, ts: Date.now() });
      localStorage.setItem('eon:market:pending-listings:v1', JSON.stringify(pending));
    });
  }
}

/* ── Boot ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  initSearch();
  initSellButtons();
  initMarketInteractions();
  showCategoryTrustDrawer('all');
  void renderCatalog();
});
