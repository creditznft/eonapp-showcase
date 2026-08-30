/**
 * W623F — compact multilingual routing lexicon for Guide Mode.
 *
 * This is not a translation model. It recognizes a small set of high-value
 * product intents in the eleven Chat/Guide languages so a user can type or
 * dictate a natural request and still reach the correct built-in Guide path.
 * Unknown requests remain untouched and can still be handled by Local or
 * Direct BYOK AI when the user has configured one.
 */
export const EONBOT_MULTILINGUAL_ROUTING_VERSION = 'eonbot-multilingual-routing:w623f-v1';

const freeze = (value) => Object.freeze(value);

const ROUTES = freeze([
  freeze({
    seed: 'language and voice settings',
    patterns: freeze([
      /\b(?:language|voice language|translate|multilingual)\b/i,
      /\b(?:idioma|lengua|traducir|voz)\b/i,
      /(?:语言|語言|翻译|翻譯|语音|語音)/,
      /(?:言語|翻訳|音声|マイク)/,
      /(?:언어|번역|음성|마이크)/,
      /\b(?:langue|traduire|voix|micro)\b/i,
      /\b(?:sprache|übersetzen|stimme|mikrofon)\b/i,
      /\b(?:idioma|traduzir|voz|microfone)\b/i,
      /(?:язык|перевод|голос|микрофон)/i,
      /(?:اللغة|ترجم|الصوت|الميكروفون)/,
      /(?:भाषा|अनुवाद|आवाज़|आवाज|माइक्रोफ़ोन|माइक्रोफोन)/
    ])
  }),
  freeze({
    seed: 'use microphone voice chat',
    patterns: freeze([
      /\b(?:speak|dictate|microphone|talk to eonbot|use voice)\b/i,
      /\b(?:hablar|dictar|micrófono)\b/i,
      /(?:说话|說話|听写|聽寫|麦克风|麥克風)/,
      /(?:話す|音声入力|ディクテーション)/,
      /(?:말하기|받아쓰기)/,
      /\b(?:parler|dicter)\b/i,
      /\b(?:sprechen|diktieren)\b/i,
      /\b(?:falar|ditar)\b/i,
      /(?:говорить|диктов)/i,
      /(?:تحدث|إملاء)/,
      /(?:बोल|डिक्टेट|श्रुतलेख)/
    ])
  }),
  freeze({
    seed: 'create a video',
    patterns: freeze([
      /\b(?:create|make|generate)\b[^\n]{0,30}\bvideo\b/i,
      /\b(?:crear|hacer|generar)\b[^\n]{0,30}\bvídeo|video\b/i,
      /(?:制作|创建|生成).{0,12}(?:视频|影片)/,
      /(?:動画|ビデオ).{0,12}(?:作|生成)/,
      /(?:영상|비디오).{0,12}(?:만들|생성)/,
      /\b(?:créer|faire|générer)\b[^\n]{0,30}\bvidéo\b/i,
      /\b(?:video|film).{0,30}(?:erstellen|machen|generieren)\b/i,
      /\b(?:criar|fazer|gerar)\b[^\n]{0,30}\bvídeo\b/i,
      /(?:созда|сдела|сгенер).{0,30}(?:видео)/i,
      /(?:إنشاء|اصنع|توليد).{0,20}(?:فيديو)/,
      /(?:वीडियो).{0,20}(?:बना|तैयार|जनरेट)/
    ])
  }),
  freeze({
    seed: 'create an image',
    patterns: freeze([
      /\b(?:create|make|generate)\b[^\n]{0,30}\b(?:image|picture|photo)\b/i,
      /\b(?:crear|hacer|generar)\b[^\n]{0,30}\b(?:imagen|foto)\b/i,
      /(?:制作|创建|生成).{0,12}(?:图片|图像|照片)/,
      /(?:画像|写真).{0,12}(?:作|生成)/,
      /(?:이미지|사진).{0,12}(?:만들|생성)/,
      /\b(?:créer|faire|générer)\b[^\n]{0,30}\b(?:image|photo)\b/i,
      /\b(?:bild|foto).{0,30}(?:erstellen|machen|generieren)\b/i,
      /\b(?:criar|fazer|gerar)\b[^\n]{0,30}\b(?:imagem|foto)\b/i,
      /(?:созда|сдела|сгенер).{0,30}(?:изображ|картин|фото)/i,
      /(?:إنشاء|اصنع|توليد).{0,20}(?:صورة)/,
      /(?:चित्र|तस्वीर|फोटो).{0,20}(?:बना|तैयार|जनरेट)/
    ])
  }),
  freeze({
    seed: 'build a website',
    patterns: freeze([
      /\b(?:website|web site|landing page)\b/i,
      /\b(?:sitio web|página web|pagina web)\b/i,
      /(?:网站|网页|網站|網頁)/,
      /(?:ウェブサイト|ホームページ)/,
      /(?:웹사이트|홈페이지)/,
      /\b(?:site web|page web)\b/i,
      /\b(?:website|webseite|landingpage)\b/i,
      /\b(?:site|página web|pagina web)\b/i,
      /(?:сайт|веб-страниц)/i,
      /(?:موقع|صفحة ويب)/,
      /(?:वेबसाइट|वेब पेज|लैंडिंग पेज)/
    ])
  }),
  freeze({
    seed: 'create a project document',
    patterns: freeze([
      /\b(?:project|document|proposal|report)\b/i,
      /\b(?:proyecto|documento|propuesta|informe)\b/i,
      /(?:项目|文件|文档|提案|报告)/,
      /(?:プロジェクト|文書|提案|レポート)/,
      /(?:프로젝트|문서|제안서|보고서)/,
      /\b(?:projet|document|proposition|rapport)\b/i,
      /\b(?:projekt|dokument|vorschlag|bericht)\b/i,
      /\b(?:projeto|documento|proposta|relatório)\b/i,
      /(?:проект|документ|предложение|отчёт|отчет)/i,
      /(?:مشروع|مستند|اقتراح|تقرير)/,
      /(?:प्रोजेक्ट|परियोजना|दस्तावेज़|प्रस्ताव|रिपोर्ट)/
    ])
  }),
  freeze({
    seed: 'create an automation workflow',
    patterns: freeze([
      /\b(?:automation|automate|workflow|schedule)\b/i,
      /\b(?:automatiz|flujo de trabajo|programar)\b/i,
      /(?:自动化|自動化|工作流|排程)/,
      /(?:自動化|ワークフロー|スケジュール)/,
      /(?:자동화|워크플로|예약)/,
      /\b(?:automatis|flux de travail|planifier)\b/i,
      /\b(?:automatis|arbeitsablauf|workflow|planen)\b/i,
      /\b(?:automatiz|automaç|fluxo de trabalho|agendar)\w*/i,
      /(?:автоматиз|рабочий процесс|расписан)/i,
      /(?:أتمتة|سير العمل|جدولة)/,
      /(?:ऑटोमेशन|स्वचालन|वर्कफ़्लो|शेड्यूल)/
    ])
  }),
  freeze({
    seed: 'set up local ai',
    patterns: freeze([
      /\b(?:local ai|ollama|lm studio|offline ai)\b/i,
      /\b(?:ia local|inteligencia artificial local)\b/i,
      /(?:本地 ?AI|本機 ?AI|离线 ?AI|離線 ?AI)/i,
      /(?:ローカル ?AI|オフライン ?AI)/i,
      /(?:로컬 ?AI|오프라인 ?AI)/i,
      /\b(?:ia locale|intelligence artificielle locale)\b/i,
      /\b(?:lokale ki|offline-ki)\b/i,
      /\b(?:ia local|inteligência artificial local)\b/i,
      /(?:локальн.{0,4}(?:ии|ai)|офлайн.{0,4}(?:ии|ai))/i,
      /(?:ذكاء اصطناعي محلي|ذكاء محلي)/,
      /(?:लोकल ?AI|स्थानीय ?AI|ऑफलाइन ?AI)/i
    ])
  }),
  freeze({
    seed: 'open eon city',
    patterns: freeze([/\beon city\b/i, /EON ?城/i, /EON ?シティ/i, /EON ?시티/i, /مدينة ?EON/i, /EON ?सिटी/i])
  }),
  freeze({
    seed: 'open my projects',
    patterns: freeze([/\bmy projects?\b/i, /\bmis proyectos\b/i, /我的项目/, /マイプロジェクト/, /내 프로젝트/, /\bmes projets\b/i, /\bmeine projekte\b/i, /\bmeus projetos\b/i, /мои проекты/i, /مشاريعي/, /मेरे प्रोजेक्ट|मेरी परियोजन/])
  }),
  freeze({
    seed: 'open library',
    patterns: freeze([/\b(?:open )?library\b/i, /\bbiblioteca\b/i, /资料库|素材库|圖書館/, /ライブラリ/, /라이브러리/, /\bbibliothèque\b/i, /\bbibliothek\b/i, /библиотек/i, /المكتبة/, /लाइब्रेरी|पुस्तकालय/])
  }),
  freeze({
    seed: 'getting started guide me',
    patterns: freeze([
      /\b(?:hello|hi|help|guide me|getting started)\b/i,
      /\b(?:hola|ayuda|guíame|guiame)\b/i,
      /(?:你好|帮助|幫助|教我|开始|開始)/,
      /(?:こんにちは|助けて|案内して|始め)/,
      /(?:안녕|도와줘|안내|시작)/,
      /\b(?:bonjour|aide|guide-moi|commencer)\b/i,
      /\b(?:hallo|hilfe|führe mich|anfangen)\b/i,
      /\b(?:olá|ola|ajuda|guie-me|começar)\b/i,
      /(?:привет|помоги|начать|проведи)/i,
      /(?:مرحبا|مساعدة|ساعدني|ابدأ)/,
      /(?:नमस्ते|मदद|मार्गदर्शन|शुरू)/
    ])
  }),
  freeze({
    seed: 'rewards access status',
    patterns: freeze([/(recompensa|recompensas|puntos|premio|報酬|ポイント|리워드|포인트|इनाम|पॉइंट|مكاف|مكافآت|نقاط|награ|балл)/i])
  }),
  freeze({
    seed: 'vault profile',
    patterns: freeze([/(boveda|bóveda|coffre|tresor|tresor|vault|profile|プロフィール|保管庫|프로필|보관함|तिजोरी|प्रोफाइल|خزينة|الملف|хранилищ|профил)/i])
  }),
  freeze({
    seed: 'invite referral link',
    patterns: freeze([/(invite|referral|invitaci[oó]n|enlace|招待|紹介|초대|추천|आमंत्रण|रेफ़रल|دعوة|إحالة|приглас|реферал)/i])
  })
]);

export function mapEonbotMultilingualRoutingSeed(text = '') {
  const source = String(text || '').trim();
  if (!source) return null;
  const match = ROUTES.find((entry) => entry.patterns.some((pattern) => pattern.test(source)));
  return match?.seed || null;
}

export function listEonbotMultilingualRoutingSeeds() {
  return ROUTES.map((entry) => entry.seed);
}

export default freeze({ EONBOT_MULTILINGUAL_ROUTING_VERSION, mapEonbotMultilingualRoutingSeed, listEonbotMultilingualRoutingSeeds });
