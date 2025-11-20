/**
 * Multi-language support for WorkLife AI Coach
 * Translations for UI and coach responses
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' | 'pt' | 'ar' | 'hi' | 'ru';

export interface Translations {
  // Header
  appName: string;
  appSubtitle: string;
  
  // Welcome Screen
  welcomeTitle: string;
  welcomeMessage: string;
  
  // Starter Questions
  starterQuestions: string[];
  
  // Input
  inputPlaceholder: string;
  sendButton: string;
  
  // Quick Replies
  quickReplies: {
    tellMeMore: string;
    whatNext: string;
    helpWithSkills: string;
    careerAdvice: string;
  };
  
  // Common Phrases
  common: {
    today: string;
    thisWeek: string;
    thisMonth: string;
    loading: string;
  };
}

export const translations: Record<Language, Translations> = {
  // English
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
    sendButton: 'Send',
    quickReplies: {
      tellMeMore: 'Tell me more',
      whatNext: "What should I do first?",
      helpWithSkills: 'I need help with skills',
      careerAdvice: 'Career change advice'
    },
    common: {
      today: 'Today',
      thisWeek: 'This week',
      thisMonth: 'This month',
      loading: 'Thinking...'
    }
  },

  // Spanish
  es: {
    appName: 'Coach WorkLife',
    appSubtitle: 'Aquí para ayudarte a avanzar',
    welcomeTitle: '¡Hola! Soy tu coach WorkLife',
    welcomeMessage: 'Estoy aquí para ayudarte a avanzar en tu carrera, ya sea que estés descubriendo qué aprender a continuación, pensando en cambiar de campo o simplemente sintiéndote perdido sobre hacia dónde te diriges. Hablemos juntos.',
    starterQuestions: [
      'No estoy seguro de qué carrera es la adecuada para mí',
      'Me siento estancado en mi trabajo actual',
      '¿Qué habilidades debería aprender?',
      'Quiero cambiar de carrera pero no sé cómo',
      '¿Cómo puedo crecer en mi puesto actual?',
      'Estoy abrumado con demasiados objetivos'
    ],
    inputPlaceholder: 'Escribe tu mensaje...',
    sendButton: 'Enviar',
    quickReplies: {
      tellMeMore: 'Cuéntame más',
      whatNext: '¿Qué debo hacer primero?',
      helpWithSkills: 'Necesito ayuda con habilidades',
      careerAdvice: 'Consejo sobre cambio de carrera'
    },
    common: {
      today: 'Hoy',
      thisWeek: 'Esta semana',
      thisMonth: 'Este mes',
      loading: 'Pensando...'
    }
  },

  // French
  fr: {
    appName: 'Coach WorkLife',
    appSubtitle: 'Ici pour vous aider à avancer',
    welcomeTitle: 'Bonjour ! Je suis votre coach WorkLife',
    welcomeMessage: "Je suis là pour vous aider à avancer dans votre carrière, que vous cherchiez à savoir quoi apprendre ensuite, que vous pensiez à changer de domaine ou que vous vous sentiez simplement perdu sur votre direction. Parlons-en ensemble.",
    starterQuestions: [
      'Je ne sais pas quelle carrière me convient',
      'Je me sens bloqué dans mon travail actuel',
      'Quelles compétences devrais-je apprendre ?',
      'Je veux changer de carrière mais je ne sais pas comment',
      'Comment puis-je évoluer dans mon poste actuel ?',
      "J'ai trop d'objectifs et je suis dépassé"
    ],
    inputPlaceholder: 'Tapez votre message...',
    sendButton: 'Envoyer',
    quickReplies: {
      tellMeMore: 'Dites-moi en plus',
      whatNext: 'Que dois-je faire en premier ?',
      helpWithSkills: "J'ai besoin d'aide avec les compétences",
      careerAdvice: 'Conseil sur le changement de carrière'
    },
    common: {
      today: "Aujourd'hui",
      thisWeek: 'Cette semaine',
      thisMonth: 'Ce mois-ci',
      loading: 'Réflexion...'
    }
  },

  // German
  de: {
    appName: 'WorkLife Coach',
    appSubtitle: 'Hier, um Ihnen zu helfen',
    welcomeTitle: 'Hallo! Ich bin Ihr WorkLife Coach',
    welcomeMessage: 'Ich bin hier, um Ihnen zu helfen, in Ihrer Karriere voranzukommen – egal, ob Sie herausfinden möchten, was Sie als Nächstes lernen sollen, über einen Wechsel nachdenken oder sich einfach verloren fühlen. Lassen Sie uns gemeinsam darüber sprechen.',
    starterQuestions: [
      'Ich bin mir nicht sicher, welcher Karriereweg für mich richtig ist',
      'Ich fühle mich in meinem aktuellen Job festgefahren',
      'Welche Fähigkeiten sollte ich lernen?',
      'Ich möchte die Karriere wechseln, weiß aber nicht wie',
      'Wie kann ich in meiner aktuellen Position wachsen?',
      'Ich bin mit zu vielen Zielen überfordert'
    ],
    inputPlaceholder: 'Geben Sie Ihre Nachricht ein...',
    sendButton: 'Senden',
    quickReplies: {
      tellMeMore: 'Erzählen Sie mir mehr',
      whatNext: 'Was soll ich zuerst tun?',
      helpWithSkills: 'Ich brauche Hilfe bei Fähigkeiten',
      careerAdvice: 'Rat zum Karrierewechsel'
    },
    common: {
      today: 'Heute',
      thisWeek: 'Diese Woche',
      thisMonth: 'Diesen Monat',
      loading: 'Denke nach...'
    }
  },

  // Chinese (Simplified)
  zh: {
    appName: 'WorkLife 教练',
    appSubtitle: '帮助您突破困境',
    welcomeTitle: '你好！我是你的 WorkLife 教练',
    welcomeMessage: '我在这里帮助你在职业生涯中取得突破——无论你是在思考接下来要学什么，考虑转行，还是对未来方向感到迷茫。让我们一起讨论吧。',
    starterQuestions: [
      '我不确定什么职业道路适合我',
      '我觉得在目前的工作中停滞不前',
      '我应该学习什么技能？',
      '我想转行但不知道如何开始',
      '如何在当前职位上成长？',
      '我有太多目标感到不知所措'
    ],
    inputPlaceholder: '输入您的消息...',
    sendButton: '发送',
    quickReplies: {
      tellMeMore: '告诉我更多',
      whatNext: '我应该先做什么？',
      helpWithSkills: '我需要技能方面的帮助',
      careerAdvice: '职业转换建议'
    },
    common: {
      today: '今天',
      thisWeek: '本周',
      thisMonth: '本月',
      loading: '思考中...'
    }
  },

  // Japanese
  ja: {
    appName: 'WorkLife コーチ',
    appSubtitle: 'あなたの前進をサポート',
    welcomeTitle: 'こんにちは！WorkLife コーチです',
    welcomeMessage: '次に何を学ぶべきか、分野を変えるべきか、それとも進むべき方向がわからないなど、キャリアで行き詰まっているあなたをサポートします。一緒に話し合いましょう。',
    starterQuestions: [
      'どのキャリアパスが自分に合っているかわかりません',
      '現在の仕事で行き詰まっています',
      'どのスキルを学ぶべきですか？',
      'キャリアチェンジしたいけど方法がわかりません',
      '現在の役職でどう成長すればいいですか？',
      '目標が多すぎて圧倒されています'
    ],
    inputPlaceholder: 'メッセージを入力...',
    sendButton: '送信',
    quickReplies: {
      tellMeMore: 'もっと教えて',
      whatNext: '最初に何をすべきですか？',
      helpWithSkills: 'スキルについて助けが必要です',
      careerAdvice: 'キャリアチェンジのアドバイス'
    },
    common: {
      today: '今日',
      thisWeek: '今週',
      thisMonth: '今月',
      loading: '考え中...'
    }
  },

  // Portuguese
  pt: {
    appName: 'Coach WorkLife',
    appSubtitle: 'Aqui para ajudá-lo a avançar',
    welcomeTitle: 'Olá! Sou seu coach WorkLife',
    welcomeMessage: 'Estou aqui para ajudá-lo a avançar em sua carreira—seja descobrindo o que aprender a seguir, pensando em mudar de área ou simplesmente se sentindo perdido sobre para onde está indo. Vamos conversar juntos.',
    starterQuestions: [
      'Não tenho certeza de qual carreira é certa para mim',
      'Me sinto preso no meu trabalho atual',
      'Quais habilidades devo aprender?',
      'Quero mudar de carreira mas não sei como',
      'Como posso crescer na minha função atual?',
      'Estou sobrecarregado com muitos objetivos'
    ],
    inputPlaceholder: 'Digite sua mensagem...',
    sendButton: 'Enviar',
    quickReplies: {
      tellMeMore: 'Me conte mais',
      whatNext: 'O que devo fazer primeiro?',
      helpWithSkills: 'Preciso de ajuda com habilidades',
      careerAdvice: 'Conselho sobre mudança de carreira'
    },
    common: {
      today: 'Hoje',
      thisWeek: 'Esta semana',
      thisMonth: 'Este mês',
      loading: 'Pensando...'
    }
  },

  // Arabic
  ar: {
    appName: 'مدرب WorkLife',
    appSubtitle: 'هنا لمساعدتك على التقدم',
    welcomeTitle: 'مرحباً! أنا مدربك في WorkLife',
    welcomeMessage: 'أنا هنا لمساعدتك على التقدم في مسيرتك المهنية—سواء كنت تحاول معرفة ما يجب تعلمه بعد ذلك، أو تفكر في تغيير المجال، أو تشعر بالضياع حول وجهتك. دعنا نتحدث معاً.',
    starterQuestions: [
      'لست متأكداً من المسار المهني المناسب لي',
      'أشعر بالجمود في وظيفتي الحالية',
      'ما المهارات التي يجب أن أتعلمها؟',
      'أريد تغيير مسيرتي المهنية لكن لا أعرف كيف',
      'كيف يمكنني النمو في دوري الحالي؟',
      'أنا مرهق بالعديد من الأهداف'
    ],
    inputPlaceholder: 'اكتب رسالتك...',
    sendButton: 'إرسال',
    quickReplies: {
      tellMeMore: 'أخبرني المزيد',
      whatNext: 'ماذا يجب أن أفعل أولاً؟',
      helpWithSkills: 'أحتاج مساعدة في المهارات',
      careerAdvice: 'نصيحة حول تغيير المسار المهني'
    },
    common: {
      today: 'اليوم',
      thisWeek: 'هذا الأسبوع',
      thisMonth: 'هذا الشهر',
      loading: 'جاري التفكير...'
    }
  },

  // Hindi
  hi: {
    appName: 'WorkLife कोच',
    appSubtitle: 'आपकी मदद के लिए यहाँ',
    welcomeTitle: 'नमस्ते! मैं आपका WorkLife कोच हूँ',
    welcomeMessage: 'मैं आपके करियर में आगे बढ़ने में मदद करने के लिए यहाँ हूँ—चाहे आप यह पता लगा रहे हों कि आगे क्या सीखना है, क्षेत्र बदलने के बारे में सोच रहे हों, या बस अपनी दिशा के बारे में खोया हुआ महसूस कर रहे हों। आइए एक साथ बात करें।',
    starterQuestions: [
      'मुझे यकीन नहीं है कि कौन सा करियर मेरे लिए सही है',
      'मैं अपनी वर्तमान नौकरी में फंसा हुआ महसूस करता हूँ',
      'मुझे कौन से कौशल सीखने चाहिए?',
      'मैं करियर बदलना चाहता हूँ लेकिन नहीं जानता कैसे',
      'मैं अपनी वर्तमान भूमिका में कैसे बढ़ूँ?',
      'मैं बहुत सारे लक्ष्यों से अभिभूत हूँ'
    ],
    inputPlaceholder: 'अपना संदेश टाइप करें...',
    sendButton: 'भेजें',
    quickReplies: {
      tellMeMore: 'मुझे और बताएं',
      whatNext: 'मुझे पहले क्या करना चाहिए?',
      helpWithSkills: 'मुझे कौशल में मदद चाहिए',
      careerAdvice: 'करियर बदलने की सलाह'
    },
    common: {
      today: 'आज',
      thisWeek: 'इस सप्ताह',
      thisMonth: 'इस महीने',
      loading: 'सोच रहा हूँ...'
    }
  },

  // Russian
  ru: {
    appName: 'WorkLife Коуч',
    appSubtitle: 'Здесь, чтобы помочь вам',
    welcomeTitle: 'Привет! Я ваш WorkLife коуч',
    welcomeMessage: 'Я здесь, чтобы помочь вам продвинуться в карьере—будь то выяснение того, что изучать дальше, размышления о смене сферы деятельности или просто чувство потерянности относительно вашего направления. Давайте обсудим это вместе.',
    starterQuestions: [
      'Я не уверен, какой карьерный путь мне подходит',
      'Я чувствую себя застрявшим на текущей работе',
      'Какие навыки мне следует изучить?',
      'Я хочу сменить карьеру, но не знаю как',
      'Как мне расти на текущей должности?',
      'Я перегружен слишком многими целями'
    ],
    inputPlaceholder: 'Введите ваше сообщение...',
    sendButton: 'Отправить',
    quickReplies: {
      tellMeMore: 'Расскажите подробнее',
      whatNext: 'Что мне делать в первую очередь?',
      helpWithSkills: 'Мне нужна помощь с навыками',
      careerAdvice: 'Совет по смене карьеры'
    },
    common: {
      today: 'Сегодня',
      thisWeek: 'На этой неделе',
      thisMonth: 'В этом месяце',
      loading: 'Думаю...'
    }
  }
};

export function getTranslation(lang: Language): Translations {
  return translations[lang] || translations.en;
}

export const supportedLanguages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' }
];
