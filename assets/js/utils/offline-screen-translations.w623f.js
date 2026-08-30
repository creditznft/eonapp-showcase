/** W623F — core Chat, Guide and voice copy for the eleven-language Chat/Guide capability matrix. */
const freeze = (value) => Object.freeze(value);
const row = (value) => freeze(value);

export const W623F_CORE_SCREEN_TRANSLATIONS = freeze({
  'What would you like to make?': row({
    es: '¿Qué te gustaría crear?', zh: '你想创作什么？', ja: '何を作りたいですか？', ko: '무엇을 만들고 싶으신가요?',
    fr: 'Que souhaitez-vous créer ?', de: 'Was möchten Sie erstellen?', pt: 'O que você gostaria de criar?', ru: 'Что вы хотите создать?',
    ar: 'ماذا تريد أن تنشئ؟', hi: 'आप क्या बनाना चाहते हैं?'
  }),
  'Message EONBOT…': row({
    es: 'Escribe a EONBOT…', zh: '给 EONBOT 发消息…', ja: 'EONBOT にメッセージ…', ko: 'EONBOT에게 메시지…',
    fr: 'Écrivez à EONBOT…', de: 'Nachricht an EONBOT…', pt: 'Envie uma mensagem ao EONBOT…', ru: 'Напишите EONBOT…',
    ar: 'اكتب إلى EONBOT…', hi: 'EONBOT को संदेश दें…'
  }),
  'Open Create': row({
    es: 'Abrir Crear', zh: '打开“创建”', ja: '作成を開く', ko: '만들기 열기', fr: 'Ouvrir Créer', de: 'Erstellen öffnen',
    pt: 'Abrir Criar', ru: 'Открыть «Создать»', ar: 'فتح الإنشاء', hi: 'बनाएं खोलें'
  }),
  'Continue a project': row({
    es: 'Continuar un proyecto', zh: '继续一个项目', ja: 'プロジェクトを続ける', ko: '프로젝트 계속하기', fr: 'Continuer un projet',
    de: 'Projekt fortsetzen', pt: 'Continuar um projeto', ru: 'Продолжить проект', ar: 'متابعة مشروع', hi: 'प्रोजेक्ट जारी रखें'
  }),
  'Use voice': row({
    es: 'Usar voz', zh: '使用语音', ja: '音声を使う', ko: '음성 사용', fr: 'Utiliser la voix', de: 'Spracheingabe verwenden',
    pt: 'Usar voz', ru: 'Использовать голос', ar: 'استخدام الصوت', hi: 'आवाज़ का उपयोग करें'
  }),
  'What works offline': row({
    es: 'Qué funciona sin conexión', zh: '哪些功能可离线使用', ja: 'オフラインで使える機能', ko: '오프라인에서 가능한 기능',
    fr: 'Ce qui fonctionne hors ligne', de: 'Was offline funktioniert', pt: 'O que funciona offline', ru: 'Что работает офлайн',
    ar: 'ما الذي يعمل دون اتصال', hi: 'ऑफ़लाइन क्या काम करता है'
  }),
  'Voice & language': row({
    es: 'Voz e idioma', zh: '语音与语言', ja: '音声と言語', ko: '음성 및 언어', fr: 'Voix et langue', de: 'Sprache & Stimme',
    pt: 'Voz e idioma', ru: 'Голос и язык', ar: 'الصوت واللغة', hi: 'आवाज़ और भाषा'
  }),
  'Reply language': row({
    es: 'Idioma de respuesta', zh: '回复语言', ja: '返信言語', ko: '답변 언어', fr: 'Langue de réponse', de: 'Antwortsprache',
    pt: 'Idioma da resposta', ru: 'Язык ответа', ar: 'لغة الرد', hi: 'उत्तर की भाषा'
  }),
  'Speech recognition language': row({
    es: 'Idioma de reconocimiento de voz', zh: '语音识别语言', ja: '音声認識の言語', ko: '음성 인식 언어', fr: 'Langue de reconnaissance vocale',
    de: 'Sprache der Spracherkennung', pt: 'Idioma do reconhecimento de fala', ru: 'Язык распознавания речи', ar: 'لغة التعرّف على الكلام', hi: 'वाक् पहचान भाषा'
  }),
  'Allow spoken replies on this browser': row({
    es: 'Permitir respuestas habladas en este navegador', zh: '允许此浏览器朗读回复', ja: 'このブラウザーで音声返信を許可', ko: '이 브라우저에서 음성 답변 허용',
    fr: 'Autoriser les réponses vocales dans ce navigateur', de: 'Gesprochene Antworten in diesem Browser erlauben', pt: 'Permitir respostas faladas neste navegador',
    ru: 'Разрешить голосовые ответы в этом браузере', ar: 'السماح بالردود المنطوقة في هذا المتصفح', hi: 'इस ब्राउज़र में बोले गए उत्तरों की अनुमति दें'
  }),
  'Dictate — turn speech into editable text.': row({
    es: 'Dictar: convierte la voz en texto editable.', zh: '听写——将语音转换为可编辑文字。', ja: '音声入力 — 話した内容を編集できるテキストにします。',
    ko: '받아쓰기 — 음성을 편집 가능한 텍스트로 바꿉니다.', fr: 'Dicter — transforme la parole en texte modifiable.', de: 'Diktieren — Sprache in bearbeitbaren Text umwandeln.',
    pt: 'Ditar — transforme a fala em texto editável.', ru: 'Диктовка — преобразует речь в редактируемый текст.', ar: 'الإملاء — يحوّل الكلام إلى نص قابل للتعديل.',
    hi: 'डिक्टेट — बोली गई बात को संपादन योग्य टेक्स्ट में बदलें।'
  }),
  'Use Voice — talk with EONBOT using the current Guide, Local, or Connected route.': row({
    es: 'Usar voz: habla con EONBOT mediante la ruta actual de Guía, Local o Conectada.', zh: '使用语音——通过当前的指南、本地或已连接路线与 EONBOT 对话。',
    ja: '音声を使う — 現在のガイド、ローカル、または接続済みルートで EONBOT と話します。', ko: '음성 사용 — 현재 가이드, 로컬 또는 연결 경로로 EONBOT과 대화합니다.',
    fr: 'Utiliser la voix — parlez à EONBOT avec le mode Guide, Local ou Connecté actif.', de: 'Sprache verwenden — mit EONBOT über den aktuellen Guide-, Lokal- oder Verbunden-Modus sprechen.',
    pt: 'Usar voz — fale com o EONBOT pelo modo atual Guia, Local ou Conectado.', ru: 'Голосовой режим — говорите с EONBOT через текущий режим Guide, Local или Connected.',
    ar: 'استخدام الصوت — تحدّث مع EONBOT عبر المسار الحالي: الدليل أو المحلي أو المتصل.', hi: 'आवाज़ का उपयोग — मौजूदा गाइड, लोकल या कनेक्टेड मार्ग से EONBOT से बात करें।'
  }),
  'Voice output is on': row({
    es: 'La salida de voz está activada', zh: '语音输出已开启', ja: '音声出力はオンです', ko: '음성 출력이 켜져 있습니다', fr: 'La sortie vocale est activée',
    de: 'Sprachausgabe ist aktiviert', pt: 'A saída de voz está ativada', ru: 'Голосовой вывод включён', ar: 'الإخراج الصوتي مفعّل', hi: 'आवाज़ आउटपुट चालू है'
  }),
  'Voice output is off': row({
    es: 'La salida de voz está desactivada', zh: '语音输出已关闭', ja: '音声出力はオフです', ko: '음성 출력이 꺼져 있습니다', fr: 'La sortie vocale est désactivée',
    de: 'Sprachausgabe ist deaktiviert', pt: 'A saída de voz está desativada', ru: 'Голосовой вывод выключен', ar: 'الإخراج الصوتي متوقف', hi: 'आवाज़ आउटपुट बंद है'
  }),
  'Guide': row({ es: 'Guía', zh: '指南', ja: 'ガイド', ko: '가이드', fr: 'Guide', de: 'Guide', pt: 'Guia', ru: 'Guide', ar: 'الدليل', hi: 'गाइड' }),
  'Local': row({ es: 'Local', zh: '本地', ja: 'ローカル', ko: '로컬', fr: 'Local', de: 'Lokal', pt: 'Local', ru: 'Local', ar: 'محلي', hi: 'लोकल' }),
  'Connected': row({ es: 'Conectado', zh: '已连接', ja: '接続済み', ko: '연결됨', fr: 'Connecté', de: 'Verbunden', pt: 'Conectado', ru: 'Connected', ar: 'متصل', hi: 'कनेक्टेड' }),
  'Auto': row({ es: 'Automático', zh: '自动', ja: '自動', ko: '자동', fr: 'Automatique', de: 'Automatisch', pt: 'Automático', ru: 'Авто', ar: 'تلقائي', hi: 'स्वचालित' }),
  'Open language settings': row({
    es: 'Abrir ajustes de idioma', zh: '打开语言设置', ja: '言語設定を開く', ko: '언어 설정 열기', fr: 'Ouvrir les réglages de langue',
    de: 'Spracheinstellungen öffnen', pt: 'Abrir configurações de idioma', ru: 'Открыть настройки языка', ar: 'فتح إعدادات اللغة', hi: 'भाषा सेटिंग खोलें'
  }),
  'Tell me what you want to make or solve. I’ll turn it into one clear next step—Create something new, continue a Project, find an item in Library, enter EON City, or open a private setting. No feature maze.': row({
    es: 'Dime qué quieres crear o resolver. Lo convertiré en un siguiente paso claro: crear algo nuevo, continuar un proyecto, buscar algo en la Biblioteca, entrar en EON City o abrir un ajuste privado. Sin laberintos de funciones.',
    zh: '告诉我你想创作什么或解决什么问题。我会把它变成一个清晰的下一步：创建新内容、继续项目、在资料库中查找内容、进入 EON City，或打开私人设置。不用在功能迷宫里寻找。',
    ja: '作りたいもの、または解決したいことを教えてください。新しく作成する、プロジェクトを続ける、ライブラリで探す、EON City に入る、非公開設定を開く、の中から明確な次の一歩にまとめます。機能迷路はありません。',
    ko: '만들거나 해결하고 싶은 것을 말해 주세요. 새로 만들기, 프로젝트 계속하기, 라이브러리에서 찾기, EON City 들어가기, 개인 설정 열기 중 하나의 명확한 다음 단계로 정리해 드립니다. 복잡한 기능 미로는 없습니다.',
    fr: 'Dites-moi ce que vous voulez créer ou résoudre. Je le transformerai en une prochaine étape claire : créer quelque chose, poursuivre un projet, retrouver un élément dans la Bibliothèque, entrer dans EON City ou ouvrir un réglage privé. Aucun labyrinthe de fonctions.',
    de: 'Sagen Sie mir, was Sie erstellen oder lösen möchten. Ich mache daraus einen klaren nächsten Schritt: etwas Neues erstellen, ein Projekt fortsetzen, etwas in der Bibliothek finden, EON City betreten oder eine private Einstellung öffnen. Kein Funktionslabyrinth.',
    pt: 'Diga o que você quer criar ou resolver. Vou transformar isso em um próximo passo claro: criar algo novo, continuar um projeto, encontrar algo na Biblioteca, entrar na EON City ou abrir uma configuração privada. Sem labirinto de recursos.',
    ru: 'Скажите, что вы хотите создать или решить. Я превращу это в один понятный следующий шаг: создать новое, продолжить проект, найти материал в Библиотеке, войти в EON City или открыть личную настройку. Без лабиринта функций.',
    ar: 'أخبرني بما تريد إنشاءه أو حله. سأحوّله إلى خطوة تالية واضحة: إنشاء شيء جديد، متابعة مشروع، العثور على عنصر في المكتبة، دخول EON City، أو فتح إعداد خاص. بلا متاهة من الميزات.',
    hi: 'बताइए आप क्या बनाना या हल करना चाहते हैं। मैं उसे एक साफ अगले कदम में बदल दूँगा—कुछ नया बनाएं, कोई प्रोजेक्ट जारी रखें, लाइब्रेरी में कुछ खोजें, EON City में जाएं, या निजी सेटिंग खोलें। फीचरों की कोई भूलभुलैया नहीं।'
  }),
  'EONBOT is your calm command guide. Type or speak naturally; it understands the goal, prepares the safest next step, and pauses before anything sensitive, paid, public or external.': row({
    es: 'EONBOT es tu guía de control tranquila. Escribe o habla con naturalidad: entiende el objetivo, prepara el siguiente paso más seguro y se detiene antes de cualquier acción sensible, de pago, pública o externa.',
    zh: 'EONBOT 是你沉稳的指令向导。自然地输入或说话；它会理解目标、准备最安全的下一步，并在任何敏感、付费、公开或外部操作前暂停。',
    ja: 'EONBOT は落ち着いた操作ガイドです。自然に入力または話しかけると、目的を理解し、安全な次の一歩を準備し、機密・有料・公開・外部の操作の前で必ず止まります。',
    ko: 'EONBOT은 차분한 명령 가이드입니다. 자연스럽게 입력하거나 말하면 목표를 이해하고 가장 안전한 다음 단계를 준비하며, 민감하거나 유료이거나 공개 또는 외부 작업 전에 멈춥니다.',
    fr: 'EONBOT est votre guide de commande calme. Écrivez ou parlez naturellement : il comprend l’objectif, prépare l’étape suivante la plus sûre et s’arrête avant toute action sensible, payante, publique ou externe.',
    de: 'EONBOT ist Ihr ruhiger Befehlsbegleiter. Schreiben oder sprechen Sie natürlich; er versteht das Ziel, bereitet den sichersten nächsten Schritt vor und hält vor sensiblen, kostenpflichtigen, öffentlichen oder externen Aktionen an.',
    pt: 'EONBOT é o seu guia de comando tranquilo. Digite ou fale naturalmente; ele entende o objetivo, prepara o próximo passo mais seguro e pausa antes de qualquer ação sensível, paga, pública ou externa.',
    ru: 'EONBOT — ваш спокойный помощник по управлению. Пишите или говорите естественно: он понимает цель, готовит самый безопасный следующий шаг и останавливается перед любым чувствительным, платным, публичным или внешним действием.',
    ar: 'EONBOT هو دليلك الهادئ للتحكم. اكتب أو تحدث بطبيعتك؛ يفهم الهدف، ويجهز الخطوة التالية الأكثر أمانًا، ويتوقف قبل أي إجراء حساس أو مدفوع أو عام أو خارجي.',
    hi: 'EONBOT आपका शांत कमांड गाइड है। स्वाभाविक रूप से लिखें या बोलें; यह लक्ष्य समझता है, सबसे सुरक्षित अगला कदम तैयार करता है, और किसी भी संवेदनशील, भुगतान वाले, सार्वजनिक या बाहरी काम से पहले रुकता है।'
  })
});
