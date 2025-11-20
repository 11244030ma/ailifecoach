/**
 * Simple i18n for demo.html
 * Multi-language support
 */

const translations = {
  en: {
    appName: 'WorkLife Coach',
    appSubtitle: 'Here to help you get unstuck',
    welcomeTitle: "Hi! I'm your WorkLife coach",
    welcomeMessage: "I'm here to help you get unstuck in your career—whether you're figuring out what to learn next, thinking about switching fields, or just feeling lost about where you're headed. Let's talk through it together.",
    starterQuestions: [
      "I'm not sure what career path is right for me",
      "I feel stuck in my current job",
      "What skills should I learn next?",
      "I want to switch careers but don't know how",
      "How do I grow in my current role?",
      "I'm overwhelmed with too many goals"
    ],
    inputPlaceholder: 'Type your message...',
    quickReplies: ['Tell me more', 'What should I do first?', 'I need help with skills', 'Career change advice']
  },
  es: {
    appName: 'Coach WorkLife',
    appSubtitle: 'Aquí para ayudarte',
    welcomeTitle: '¡Hola! Soy tu coach WorkLife',
    welcomeMessage: 'Estoy aquí para ayudarte a avanzar en tu carrera. Hablemos juntos.',
    starterQuestions: [
      'No estoy seguro de qué carrera es la adecuada',
      'Me siento estancado en mi trabajo',
      '¿Qué habilidades debería aprender?',
      'Quiero cambiar de carrera',
      '¿Cómo crecer en mi puesto actual?',
      'Estoy abrumado con objetivos'
    ],
    inputPlaceholder: 'Escribe tu mensaje...',
    quickReplies: ['Cuéntame más', '¿Qué hacer primero?', 'Ayuda con habilidades', 'Consejo de carrera']
  },
  fr: {
    appName: 'Coach WorkLife',
    appSubtitle: 'Ici pour vous aider',
    welcomeTitle: 'Bonjour ! Je suis votre coach',
    welcomeMessage: "Je suis là pour vous aider dans votre carrière. Parlons-en ensemble.",
    starterQuestions: [
      'Je ne sais pas quelle carrière me convient',
      'Je me sens bloqué dans mon travail',
      'Quelles compétences apprendre ?',
      'Je veux changer de carrière',
      'Comment évoluer dans mon poste ?',
      "J'ai trop d'objectifs"
    ],
    inputPlaceholder: 'Tapez votre message...',
    quickReplies: ['Dites-moi plus', 'Que faire ?', 'Aide compétences', 'Conseil carrière']
  },
  de: {
    appName: 'WorkLife Coach',
    appSubtitle: 'Hier um zu helfen',
    welcomeTitle: 'Hallo! Ich bin Ihr Coach',
    welcomeMessage: 'Ich bin hier, um Ihnen in Ihrer Karriere zu helfen.',
    starterQuestions: [
      'Welcher Karriereweg ist richtig?',
      'Ich fühle mich festgefahren',
      'Welche Fähigkeiten lernen?',
      'Karriere wechseln',
      'In aktueller Position wachsen?',
      'Zu viele Ziele'
    ],
    inputPlaceholder: 'Nachricht eingeben...',
    quickReplies: ['Mehr erzählen', 'Was tun?', 'Hilfe Fähigkeiten', 'Karriereberatung']
  },
  zh: {
    appName: 'WorkLife 教练',
    appSubtitle: '帮助您突破困境',
    welcomeTitle: '你好！我是你的教练',
    welcomeMessage: '我在这里帮助你在职业生涯中取得突破。',
    starterQuestions: [
      '我不确定什么职业适合我',
      '我觉得工作停滞不前',
      '我应该学习什么技能？',
      '我想转行',
      '如何在当前职位成长？',
      '目标太多感到不知所措'
    ],
    inputPlaceholder: '输入您的消息...',
    quickReplies: ['告诉我更多', '我该做什么？', '技能帮助', '职业建议']
  },
  ja: {
    appName: 'WorkLife コーチ',
    appSubtitle: 'サポートします',
    welcomeTitle: 'こんにちは！コーチです',
    welcomeMessage: 'キャリアで行き詰まっているあなたをサポートします。',
    starterQuestions: [
      'どのキャリアが合っているか',
      '仕事で行き詰まっています',
      'どのスキルを学ぶべき？',
      'キャリアチェンジしたい',
      '現在の役職で成長するには？',
      '目標が多すぎます'
    ],
    inputPlaceholder: 'メッセージを入力...',
    quickReplies: ['もっと教えて', '何をすべき？', 'スキル助けて', 'キャリアアドバイス']
  },
  pt: {
    appName: 'Coach WorkLife',
    appSubtitle: 'Aqui para ajudar',
    welcomeTitle: 'Olá! Sou seu coach',
    welcomeMessage: 'Estou aqui para ajudá-lo em sua carreira.',
    starterQuestions: [
      'Qual carreira é certa para mim?',
      'Me sinto preso no trabalho',
      'Quais habilidades aprender?',
      'Quero mudar de carreira',
      'Como crescer na função atual?',
      'Muitos objetivos'
    ],
    inputPlaceholder: 'Digite sua mensagem...',
    quickReplies: ['Conte mais', 'O que fazer?', 'Ajuda habilidades', 'Conselho carreira']
  },
  ar: {
    appName: 'مدرب WorkLife',
    appSubtitle: 'هنا للمساعدة',
    welcomeTitle: 'مرحباً! أنا مدربك',
    welcomeMessage: 'أنا هنا لمساعدتك في مسيرتك المهنية.',
    starterQuestions: [
      'لست متأكداً من المسار المناسب',
      'أشعر بالجمود في وظيفتي',
      'ما المهارات التي أتعلمها؟',
      'أريد تغيير مسيرتي',
      'كيف أنمو في دوري الحالي؟',
      'أهداف كثيرة'
    ],
    inputPlaceholder: 'اكتب رسالتك...',
    quickReplies: ['أخبرني المزيد', 'ماذا أفعل؟', 'مساعدة مهارات', 'نصيحة مهنية']
  },
  hi: {
    appName: 'WorkLife कोच',
    appSubtitle: 'मदद के लिए यहाँ',
    welcomeTitle: 'नमस्ते! मैं आपका कोच हूँ',
    welcomeMessage: 'मैं आपके करियर में मदद के लिए यहाँ हूँ।',
    starterQuestions: [
      'कौन सा करियर सही है?',
      'मैं नौकरी में फंसा हूँ',
      'कौन से कौशल सीखें?',
      'करियर बदलना चाहता हूँ',
      'वर्तमान भूमिका में कैसे बढ़ें?',
      'बहुत सारे लक्ष्य'
    ],
    inputPlaceholder: 'संदेश टाइप करें...',
    quickReplies: ['और बताएं', 'क्या करें?', 'कौशल मदद', 'करियर सलाह']
  },
  ru: {
    appName: 'WorkLife Коуч',
    appSubtitle: 'Здесь чтобы помочь',
    welcomeTitle: 'Привет! Я ваш коуч',
    welcomeMessage: 'Я здесь, чтобы помочь вам в карьере.',
    starterQuestions: [
      'Какой путь карьеры подходит?',
      'Я застрял на работе',
      'Какие навыки изучить?',
      'Хочу сменить карьеру',
      'Как расти на должности?',
      'Слишком много целей'
    ],
    inputPlaceholder: 'Введите сообщение...',
    quickReplies: ['Расскажите больше', 'Что делать?', 'Помощь навыки', 'Совет карьера']
  }
};

const languageNames = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  zh: '中文',
  ja: '日本語',
  pt: 'Português',
  ar: 'العربية',
  hi: 'हिन्दी',
  ru: 'Русский'
};

function getCurrentLanguage() {
  return localStorage.getItem('language') || 'en';
}

function setLanguage(lang) {
  localStorage.setItem('language', lang);
  location.reload();
}

function t(key) {
  const lang = getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || translations.en[key] || key;
}
