// Languago — B1 · Orta (Orta seviye dilbilgisi)
window.GRAMMAR_B1 = {
  id: "b1",
  title: "B1 · Orta",
  subtitle: "Orta seviye dilbilgisi",
  color: "#3B82F6",
  units: [
  {
    "id": "b1-01",
    "title": "Present Perfect (for / since)",
    "short": "have/has + 3. hal",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "have/has + fiil 3. hali (past participle)\n\n> I have lived here for years.\n> She has worked here since 2020."
      },
      {
        "h": "for / since",
        "b": "for → süre (for 5 years, for a week)\nsince → başlangıç noktası (since 2020, since Monday)"
      },
      {
        "h": "Düzensiz fiillerin 3. hali",
        "b": "> go → went → gone\n> see → saw → seen\n> eat → ate → eaten\n> be → was/were → been"
      }
    ],
    "mistakes": [
      {
        "w": "I have went there.",
        "r": "I have gone there.",
        "n": "go'nun 3. hali gone."
      },
      {
        "w": "She has go home.",
        "r": "She has gone home.",
        "n": "have/has + 3. hal."
      },
      {
        "w": "I work here since 2019.",
        "r": "I have worked here since 2019.",
        "n": "since ile present perfect kullanılır."
      }
    ],
    "practice": [
      {
        "q": "I ___ here for 5 years.",
        "hint": "live",
        "a": [
          "have lived"
        ]
      },
      {
        "q": "She ___ here since 2020.",
        "hint": "work",
        "a": [
          "has worked"
        ]
      },
      {
        "q": "We ___ (not/see) him for ages.",
        "hint": "see (olumsuz)",
        "a": [
          "haven't seen",
          "have not seen"
        ]
      },
      {
        "q": "He ___ home.",
        "hint": "go (present perfect)",
        "a": [
          "has gone"
        ]
      },
      {
        "q": "I ___ (never/be) to London.",
        "hint": "be",
        "a": [
          "have never been"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ here since 2020.",
        "options": [
          "has worked",
          "have lived",
          "haven't seen",
          "has gone"
        ],
        "a": 0
      },
      {
        "q": "We ___ (not/see) him for ages.",
        "options": [
          "haven't seen",
          "have lived",
          "has worked",
          "has gone"
        ],
        "a": 0
      },
      {
        "q": "He ___ home.",
        "options": [
          "has gone",
          "have lived",
          "has worked",
          "haven't seen"
        ],
        "a": 0
      },
      {
        "q": "I ___ (never/be) to London.",
        "options": [
          "have never been",
          "have lived",
          "has worked",
          "haven't seen"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-02",
    "title": "Present Perfect vs Past Simple",
    "short": "zaman ayrımı",
    "slides": [
      {
        "h": "Temel fark",
        "b": "Past Simple → bitmiş, belirli zaman.\nPresent Perfect → geçmişte olmuş, şimdiyle bağlantılı.\n\n> I saw him yesterday. (belirli zaman)\n> I have seen him before. (tecrübe)"
      },
      {
        "h": "Zaman ifadeleri",
        "b": "Past Simple: yesterday, last week, in 2010, ago\nPresent Perfect: ever, never, just, already, yet, for, since"
      },
      {
        "h": "Kullanım alanları",
        "b": "Present Perfect → hayat tecrübesi, henüz bitmemiş zaman, sonucu bugün görünen.\n\n> I have lost my keys. (şu an yok)"
      }
    ],
    "mistakes": [
      {
        "w": "I have seen him yesterday.",
        "r": "I saw him yesterday.",
        "n": "yesterday belirli zaman → past simple."
      },
      {
        "w": "I saw him before.",
        "r": "I have seen him before.",
        "n": "before tecrübe → present perfect."
      },
      {
        "w": "She has finished it last week.",
        "r": "She finished it last week.",
        "n": "last week → past simple."
      }
    ],
    "practice": [
      {
        "q": "I ___ him yesterday.",
        "hint": "see (geçmiş)",
        "a": [
          "saw"
        ]
      },
      {
        "q": "I ___ (never/see) him before.",
        "hint": "see",
        "a": [
          "have never seen"
        ]
      },
      {
        "q": "She ___ (already/finish) her homework.",
        "hint": "finish",
        "a": [
          "has already finished"
        ]
      },
      {
        "q": "They ___ to Paris last year.",
        "hint": "go (geçmiş)",
        "a": [
          "went"
        ]
      },
      {
        "q": "I ___ (just/eat).",
        "hint": "eat",
        "a": [
          "have just eaten"
        ]
      }
    ],
    "mcq": [
      {
        "q": "I ___ (never/see) him before.",
        "options": [
          "have never seen",
          "saw",
          "has already finished",
          "went"
        ],
        "a": 0
      },
      {
        "q": "She ___ (already/finish) her homework.",
        "options": [
          "has already finished",
          "saw",
          "have never seen",
          "went"
        ],
        "a": 0
      },
      {
        "q": "They ___ to Paris last year.",
        "options": [
          "went",
          "saw",
          "have never seen",
          "has already finished"
        ],
        "a": 0
      },
      {
        "q": "I ___ (just/eat).",
        "options": [
          "have just eaten",
          "saw",
          "have never seen",
          "has already finished"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-03",
    "title": "will / going to",
    "short": "gelecek zamanlar",
    "slides": [
      {
        "h": "will",
        "b": "Anlık kararlar ve tahminlerde:\n\n> I'll help you. (anlık karar)\n> I think it will rain."
      },
      {
        "h": "going to",
        "b": "Önceden planlanmış niyetlerde ve kanıtlı tahminde:\n\n> I'm going to travel to Paris. (plan)\n> Look at the clouds! It's going to rain."
      },
      {
        "h": "Özet",
        "b": "> plan → going to\n> anlık karar/tahmin → will\n> kanıtlı tahmin → going to"
      }
    ],
    "mistakes": [
      {
        "w": "I will going to travel.",
        "r": "I am going to travel.",
        "n": "İkisi birlikte kullanılmaz."
      },
      {
        "w": "Look! It will rain.",
        "r": "Look! It's going to rain.",
        "n": "Kanıt varsa going to."
      },
      {
        "w": "I going to help you.",
        "r": "I am going to help you.",
        "n": "am/is/are gerekli."
      }
    ],
    "practice": [
      {
        "q": "I think it ___ tomorrow.",
        "hint": "rain (tahmin)",
        "a": [
          "will rain"
        ]
      },
      {
        "q": "I ___ to Paris next month.",
        "hint": "travel (plan)",
        "a": [
          "am going to travel",
          "'m going to travel"
        ]
      },
      {
        "q": "Don't worry, I ___ you.",
        "hint": "help (anlık karar)",
        "a": [
          "will help"
        ]
      },
      {
        "q": "She ___ a baby.",
        "hint": "have (kanıtlı)",
        "a": [
          "is going to have",
          "'s going to have"
        ]
      }
    ],
    "mcq": [
      {
        "q": "I ___ to Paris next month.",
        "options": [
          "am going to travel",
          "will rain",
          "will help",
          "is going to have"
        ],
        "a": 0
      },
      {
        "q": "Don't worry, I ___ you.",
        "options": [
          "will help",
          "will rain",
          "am going to travel",
          "is going to have"
        ],
        "a": 0
      },
      {
        "q": "She ___ a baby.",
        "options": [
          "is going to have",
          "will rain",
          "am going to travel",
          "will help"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-04",
    "title": "Past Continuous",
    "short": "was/were + -ing",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "was/were + fiil-ing\n\n> I was watching TV.\n> They were playing."
      },
      {
        "h": "Kullanım",
        "b": "Geçmişte belirli bir anda devam eden eylem:\n\n> At 8pm I was watching TV.\n> When she called, I was cooking."
      },
      {
        "h": "was / were",
        "b": "I/he/she/it → was\nyou/we/they → were\n\n> He was sleeping. / We were eating."
      }
    ],
    "mistakes": [
      {
        "w": "I was watch TV.",
        "r": "I was watching TV.",
        "n": "Fiil -ing alır."
      },
      {
        "w": "They was playing.",
        "r": "They were playing.",
        "n": "Çoğul için were."
      },
      {
        "w": "She were sleeping.",
        "r": "She was sleeping.",
        "n": "Tekil için was."
      }
    ],
    "practice": [
      {
        "q": "I ___ TV at 8pm.",
        "hint": "watch",
        "a": [
          "was watching"
        ]
      },
      {
        "q": "They ___ football.",
        "hint": "play",
        "a": [
          "were playing"
        ]
      },
      {
        "q": "She ___ when I called.",
        "hint": "sleep",
        "a": [
          "was sleeping"
        ]
      },
      {
        "q": "We ___ dinner.",
        "hint": "eat",
        "a": [
          "were eating"
        ]
      },
      {
        "q": "He ___ his car.",
        "hint": "wash",
        "a": [
          "was washing"
        ]
      }
    ],
    "mcq": [
      {
        "q": "They ___ football.",
        "options": [
          "were playing",
          "was watching",
          "was sleeping",
          "were eating"
        ],
        "a": 0
      },
      {
        "q": "She ___ when I called.",
        "options": [
          "was sleeping",
          "was watching",
          "were playing",
          "were eating"
        ],
        "a": 0
      },
      {
        "q": "We ___ dinner.",
        "options": [
          "were eating",
          "was watching",
          "were playing",
          "was sleeping"
        ],
        "a": 0
      },
      {
        "q": "He ___ his car.",
        "options": [
          "was washing",
          "was watching",
          "were playing",
          "was sleeping"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-05",
    "title": "Koşul Tip 1 (First Conditional)",
    "short": "If + present, will",
    "slides": [
      {
        "h": "Yapı",
        "b": "If + present simple, will + fiil\n\n> If it rains, I will stay home.\n> If you study, you will pass."
      },
      {
        "h": "Anlam",
        "b": "Gelecekte gerçek/olası durum ve sonucu:\n\n> If she comes, we will be happy."
      },
      {
        "h": "Dikkat",
        "b": "if cümlesinde will kullanılmaz (genellikle).\n\n> If it rains (doğru) / If it will rain (yanlış)"
      }
    ],
    "mistakes": [
      {
        "w": "If it will rain, I will stay.",
        "r": "If it rains, I will stay.",
        "n": "if sonrası present simple."
      },
      {
        "w": "If I will have money, I will buy it.",
        "r": "If I have money, I will buy it.",
        "n": "if sonrası will yok."
      },
      {
        "w": "If she comes, she is happy.",
        "r": "If she comes, she will be happy.",
        "n": "Sonuç cümlesi will alır."
      }
    ],
    "practice": [
      {
        "q": "If it ___ , I will stay home.",
        "hint": "rain",
        "a": [
          "rains"
        ]
      },
      {
        "q": "If she ___ , we will be happy.",
        "hint": "come",
        "a": [
          "comes"
        ]
      },
      {
        "q": "You will pass if you ___ .",
        "hint": "study",
        "a": [
          "study"
        ]
      },
      {
        "q": "I will call you if I ___ time.",
        "hint": "have",
        "a": [
          "have"
        ]
      },
      {
        "q": "If he ___ hard, he will succeed.",
        "hint": "work",
        "a": [
          "works"
        ]
      }
    ],
    "mcq": [
      {
        "q": "If she ___ , we will be happy.",
        "options": [
          "comes",
          "rains",
          "study",
          "have"
        ],
        "a": 0
      },
      {
        "q": "You will pass if you ___ .",
        "options": [
          "study",
          "rains",
          "comes",
          "have"
        ],
        "a": 0
      },
      {
        "q": "I will call you if I ___ time.",
        "options": [
          "have",
          "rains",
          "comes",
          "study"
        ],
        "a": 0
      },
      {
        "q": "If he ___ hard, he will succeed.",
        "options": [
          "works",
          "rains",
          "comes",
          "study"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-06",
    "title": "Koşul Tip 2 (Second Conditional)",
    "short": "If + past, would",
    "slides": [
      {
        "h": "Yapı",
        "b": "If + past simple, would + fiil\n\n> If I were rich, I would travel the world."
      },
      {
        "h": "Anlam",
        "b": "Hayali/gerçek dışı durumlar:\n\n> If I had a car, I would drive to work.\n> (ama arabam yok)"
      },
      {
        "h": "were",
        "b": "I/he/she/it ile 'were' da kullanılabilir.\n\n> If I were you... (Senin yerinde olsam)"
      }
    ],
    "mistakes": [
      {
        "w": "If I have money, I would buy it.",
        "r": "If I had money, I would buy it.",
        "n": "İkinci koşulda past simple."
      },
      {
        "w": "If I was rich, I will travel.",
        "r": "If I was rich, I would travel.",
        "n": "Sonuç would alır."
      },
      {
        "w": "If I won, I will buy a house.",
        "r": "If I won, I would buy a house.",
        "n": "would kullanılır."
      }
    ],
    "practice": [
      {
        "q": "If I ___ rich, I would travel.",
        "hint": "be",
        "a": [
          "were",
          "was"
        ]
      },
      {
        "q": "If she ___ a car, she would drive.",
        "hint": "have",
        "a": [
          "had"
        ]
      },
      {
        "q": "I would buy a house if I ___ the lottery.",
        "hint": "win",
        "a": [
          "won"
        ]
      },
      {
        "q": "If I ___ you, I would apologize.",
        "hint": "be",
        "a": [
          "were"
        ]
      },
      {
        "q": "He would come if he ___ time.",
        "hint": "have",
        "a": [
          "had"
        ]
      }
    ],
    "mcq": [
      {
        "q": "If she ___ a car, she would drive.",
        "options": [
          "had",
          "were",
          "won",
          "were"
        ],
        "a": 0
      },
      {
        "q": "I would buy a house if I ___ the lottery.",
        "options": [
          "won",
          "were",
          "had",
          "were"
        ],
        "a": 0
      },
      {
        "q": "If I ___ you, I would apologize.",
        "options": [
          "were",
          "had",
          "won",
          "had"
        ],
        "a": 0
      },
      {
        "q": "He would come if he ___ time.",
        "options": [
          "had",
          "were",
          "won",
          "were"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-07",
    "title": "Relative Cümleler (who/which/that)",
    "short": "ilgi zamirleri",
    "slides": [
      {
        "h": "who / which / that",
        "b": "who → insanlar, which → nesneler/hayvanlar, that → her ikisi\n\n> The man who lives next door.\n> The book which I read."
      },
      {
        "h": "Kullanım",
        "b": "İsimleri tanımlayan yan cümleler kurar:\n\n> The woman who called you is my aunt.\n> This is the car that I bought."
      },
      {
        "h": "Dikkat",
        "b": "who insan, which nesne için. that resmi olmayan durumlarda her ikisinin yerine geçebilir."
      }
    ],
    "mistakes": [
      {
        "w": "The man which is there is my father.",
        "r": "The man who is there is my father.",
        "n": "İnsan için who."
      },
      {
        "w": "The book who I read was good.",
        "r": "The book which I read was good.",
        "n": "Nesne için which/that."
      },
      {
        "w": "She is the teacher which helped me.",
        "r": "She is the teacher who helped me.",
        "n": "İnsan için who."
      }
    ],
    "practice": [
      {
        "q": "The woman ___ lives next door is kind.",
        "hint": "who / which",
        "a": [
          "who",
          "that"
        ]
      },
      {
        "q": "The car ___ I bought is fast.",
        "hint": "who / which",
        "a": [
          "which",
          "that"
        ]
      },
      {
        "q": "He is the man ___ helped me.",
        "hint": "who / which",
        "a": [
          "who",
          "that"
        ]
      },
      {
        "q": "This is the house ___ I grew up in.",
        "hint": "who / which",
        "a": [
          "which",
          "that"
        ]
      }
    ],
    "mcq": [
      {
        "q": "The car ___ I bought is fast.",
        "options": [
          "which",
          "who",
          "who",
          "is"
        ],
        "a": 0
      },
      {
        "q": "He is the man ___ helped me.",
        "options": [
          "who",
          "which",
          "which",
          "is"
        ],
        "a": 0
      },
      {
        "q": "This is the house ___ I grew up in.",
        "options": [
          "which",
          "who",
          "who",
          "is"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-08",
    "title": "Edilgen Çatı (Present & Past)",
    "short": "be + 3. hal",
    "slides": [
      {
        "h": "Yapı",
        "b": "be + fiil 3. hali (past participle)\n\n> Present: The letter is sent.\n> Past: The letter was sent."
      },
      {
        "h": "Ne zaman?",
        "b": "Eylemi yapan değil, eylem önemliyse:\n\n> English is spoken here.\n> The bridge was built in 1900."
      },
      {
        "h": "Aktif → Pasif",
        "b": "Aktif: They send letters. → Pasif: Letters are sent.\nAktif: They sent letters. → Pasif: Letters were sent."
      }
    ],
    "mistakes": [
      {
        "w": "The letter was send.",
        "r": "The letter was sent.",
        "n": "send'in 3. hali sent."
      },
      {
        "w": "The house is build here.",
        "r": "The house is built here.",
        "n": "build → built."
      },
      {
        "w": "English is speak here.",
        "r": "English is spoken here.",
        "n": "speak → spoken."
      }
    ],
    "practice": [
      {
        "q": "The letter ___ yesterday.",
        "hint": "send (pasif)",
        "a": [
          "was sent"
        ]
      },
      {
        "q": "English ___ here.",
        "hint": "speak (pasif)",
        "a": [
          "is spoken"
        ]
      },
      {
        "q": "The bridge ___ in 1900.",
        "hint": "build (pasif)",
        "a": [
          "was built"
        ]
      },
      {
        "q": "These cars ___ in Germany.",
        "hint": "make (pasif)",
        "a": [
          "are made"
        ]
      },
      {
        "q": "The window ___ by Tom.",
        "hint": "break (pasif, geçmiş)",
        "a": [
          "was broken"
        ]
      }
    ],
    "mcq": [
      {
        "q": "English ___ here.",
        "options": [
          "is spoken",
          "was sent",
          "was built",
          "are made"
        ],
        "a": 0
      },
      {
        "q": "The bridge ___ in 1900.",
        "options": [
          "was built",
          "was sent",
          "is spoken",
          "are made"
        ],
        "a": 0
      },
      {
        "q": "These cars ___ in Germany.",
        "options": [
          "are made",
          "was sent",
          "is spoken",
          "was built"
        ],
        "a": 0
      },
      {
        "q": "The window ___ by Tom.",
        "options": [
          "was broken",
          "was sent",
          "is spoken",
          "was built"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-09",
    "title": "should / must / have to",
    "short": "tavsiye ve zorunluluk",
    "slides": [
      {
        "h": "should",
        "b": "Tavsiye için: should + fiil\n\n> You should study more.\n> You shouldn't eat too much."
      },
      {
        "h": "must / have to",
        "b": "must → konuşmacının zorunluluğu, have to → dış zorunluluk/kural\n\n> I must call my mother.\n> I have to wear a uniform at work."
      },
      {
        "h": "Dikkat",
        "b": "should/must sonrası fiil yalın, to yok.\n\n> He must go (doğru) / He must to go (yanlış)\n\nhave to → has to (3. tekil)"
      }
    ],
    "mistakes": [
      {
        "w": "You should to study.",
        "r": "You should study.",
        "n": "should sonrası fiil yalın."
      },
      {
        "w": "He musts go.",
        "r": "He must go.",
        "n": "must değişmez."
      },
      {
        "w": "She have to work.",
        "r": "She has to work.",
        "n": "3. tekil için has to."
      }
    ],
    "practice": [
      {
        "q": "You ___ study more.",
        "hint": "should (tavsiye)",
        "a": [
          "should"
        ]
      },
      {
        "q": "She ___ work tomorrow.",
        "hint": "have to (zorunluluk)",
        "a": [
          "has to"
        ]
      },
      {
        "q": "You ___ (not/smoke) here.",
        "hint": "must (yasak)",
        "a": [
          "mustn't",
          "must not"
        ]
      },
      {
        "q": "I ___ wear a uniform at work.",
        "hint": "have to",
        "a": [
          "have to"
        ]
      },
      {
        "q": "He ___ see a doctor.",
        "hint": "should (tavsiye)",
        "a": [
          "should"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ work tomorrow.",
        "options": [
          "has to",
          "should",
          "mustn't",
          "have to"
        ],
        "a": 0
      },
      {
        "q": "You ___ (not/smoke) here.",
        "options": [
          "mustn't",
          "should",
          "has to",
          "have to"
        ],
        "a": 0
      },
      {
        "q": "I ___ wear a uniform at work.",
        "options": [
          "have to",
          "should",
          "has to",
          "mustn't"
        ],
        "a": 0
      },
      {
        "q": "He ___ see a doctor.",
        "options": [
          "should",
          "has to",
          "mustn't",
          "have to"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-10",
    "title": "Miktar Belirteçleri",
    "short": "a few / a little / a lot of",
    "slides": [
      {
        "h": "a few / a little",
        "b": "a few → sayılabilir (birkaç)\na little → sayılamaz (biraz)\n\n> I have a few friends.\n> I have a little money."
      },
      {
        "h": "a lot of",
        "b": "Her ikisiyle de kullanılır (özellikle olumlu):\n\n> a lot of books / a lot of water"
      },
      {
        "h": "some / any",
        "b": "some → olumlu, any → olumsuz/soru\n\n> some tea, any tea?"
      }
    ],
    "mistakes": [
      {
        "w": "I have a few water.",
        "r": "I have a little water.",
        "n": "Sayılamaz → a little."
      },
      {
        "w": "There is a little books.",
        "r": "There are a few books.",
        "n": "Sayılabilir → a few."
      },
      {
        "w": "I have any money.",
        "r": "I have some money.",
        "n": "Olumluda some."
      }
    ],
    "practice": [
      {
        "q": "I have ___ money.",
        "hint": "biraz (sayılamaz)",
        "a": [
          "a little"
        ]
      },
      {
        "q": "She has ___ friends.",
        "hint": "birkaç (sayılabilir)",
        "a": [
          "a few"
        ]
      },
      {
        "q": "There are ___ people here.",
        "hint": "çok",
        "a": [
          "a lot of",
          "many"
        ]
      },
      {
        "q": "Do you have ___ sugar?",
        "hint": "some / any",
        "a": [
          "any"
        ]
      },
      {
        "q": "I bought ___ apples.",
        "hint": "some / any",
        "a": [
          "some"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She has ___ friends.",
        "options": [
          "a few",
          "a little",
          "a lot of",
          "any"
        ],
        "a": 0
      },
      {
        "q": "There are ___ people here.",
        "options": [
          "a lot of",
          "a little",
          "a few",
          "any"
        ],
        "a": 0
      },
      {
        "q": "Do you have ___ sugar?",
        "options": [
          "any",
          "a little",
          "a few",
          "a lot of"
        ],
        "a": 0
      },
      {
        "q": "I bought ___ apples.",
        "options": [
          "some",
          "a little",
          "a few",
          "a lot of"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-11",
    "title": "Present Perfect Continuous",
    "short": "have/has been + -ing",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "have/has been + fiil-ing\\n\\n> I have been studying for two hours.\\n> She has been working all day."
      },
      {
        "h": "Kullanım",
        "b": "Geçmişte başlayıp hâlâ devam eden veya yakın zamanda biten eylem; süreye vurgu:\\n\\n> I have been reading this book for a week."
      },
      {
        "h": "Present Perfect ile fark",
        "b": "PPC → süre/etkinlik vurgusu, PP → sonuç.\\n\\n> I have been cleaning. (etkinlik)\\n> I have cleaned the kitchen. (sonuç)"
      }
    ],
    "mistakes": [
      {
        "w": "I have been work here.",
        "r": "I have been working here.",
        "n": "been sonrası fiil -ing alır."
      },
      {
        "w": "She has being working.",
        "r": "She has been working.",
        "n": "Doğrusu been, being değil."
      },
      {
        "w": "I have been studied English.",
        "r": "I have been studying English.",
        "n": "PPC'de 3. hal değil -ing kullanılır."
      }
    ],
    "practice": [
      {
        "q": "I ___ for two hours.",
        "hint": "study (PPC)",
        "a": [
          "have been studying",
          "'ve been studying"
        ]
      },
      {
        "q": "We ___ all morning.",
        "hint": "work",
        "a": [
          "have been working"
        ]
      },
      {
        "q": "She ___ (not/feel) well lately.",
        "hint": "feel (olumsuz)",
        "a": [
          "hasn't been feeling",
          "has not been feeling"
        ]
      },
      {
        "q": "He ___ since 8 am.",
        "hint": "run",
        "a": [
          "has been running"
        ]
      },
      {
        "q": "How long ___ you ___ here?",
        "hint": "wait",
        "a": [
          "have ... been waiting"
        ]
      }
    ],
    "mcq": [
      {
        "q": "We ___ all morning.",
        "options": [
          "have been working",
          "have been studying",
          "hasn't been feeling",
          "has been running"
        ],
        "a": 0
      },
      {
        "q": "She ___ (not/feel) well lately.",
        "options": [
          "hasn't been feeling",
          "have been studying",
          "have been working",
          "has been running"
        ],
        "a": 0
      },
      {
        "q": "He ___ since 8 am.",
        "options": [
          "has been running",
          "have been studying",
          "have been working",
          "hasn't been feeling"
        ],
        "a": 0
      },
      {
        "q": "How long ___ you ___ here?",
        "options": [
          "have ... been waiting",
          "have been studying",
          "have been working",
          "hasn't been feeling"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-12",
    "title": "Present Perfect (just / already / yet / ever / never)",
    "short": "zaman zarfları",
    "slides": [
      {
        "h": "just",
        "b": "Az önce, çok yakın geçmişte:\\n\\n> I have just finished my homework."
      },
      {
        "h": "already / yet",
        "b": "already → olumlu cümlede 'çoktan'.\\nyet → soru ve olumsuzda (cümle sonunda) 'henüz'.\\n\\n> She has already eaten. / Have you finished yet?"
      },
      {
        "h": "ever / never",
        "b": "Hayat tecrübesi:\\n\\n> Have you ever been to Italy?\\n> I have never seen that film."
      }
    ],
    "mistakes": [
      {
        "w": "I have finished my homework yet.",
        "r": "I have already finished my homework.",
        "n": "yet olumlu cümlede değil; already kullanılır."
      },
      {
        "w": "She haven't arrived yet.",
        "r": "She hasn't arrived yet.",
        "n": "3. tekil she → has."
      },
      {
        "w": "Have you ever went there?",
        "r": "Have you ever been there?",
        "n": "ever'den sonra 3. hal (been)."
      }
    ],
    "practice": [
      {
        "q": "I have ___ finished my homework.",
        "hint": "az önce",
        "a": [
          "just"
        ]
      },
      {
        "q": "She has ___ eaten.",
        "hint": "çoktan",
        "a": [
          "already"
        ]
      },
      {
        "q": "Have you finished ___?",
        "hint": "cümle sonu",
        "a": [
          "yet"
        ]
      },
      {
        "q": "I have ___ seen that film.",
        "hint": "hiç",
        "a": [
          "never"
        ]
      },
      {
        "q": "___ you ever been to Paris?",
        "hint": "ever",
        "a": [
          "Have"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She has ___ eaten.",
        "options": [
          "already",
          "just",
          "yet",
          "never"
        ],
        "a": 0
      },
      {
        "q": "Have you finished ___?",
        "options": [
          "yet",
          "just",
          "already",
          "never"
        ],
        "a": 0
      },
      {
        "q": "I have ___ seen that film.",
        "options": [
          "never",
          "just",
          "already",
          "yet"
        ],
        "a": 0
      },
      {
        "q": "___ you ever been to Paris?",
        "options": [
          "Have",
          "just",
          "already",
          "yet"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-13",
    "title": "used to (eski alışkanlıklar)",
    "short": "artık yapılmayan şeyler",
    "slides": [
      {
        "h": "Yapı",
        "b": "used to + fiil yalın\\n\\n> I used to play football. (Eskiden oynardım, artık oynamıyorum)"
      },
      {
        "h": "Olumsuz / soru",
        "b": "didn't use to — Did ... use to?\\n\\n> I didn't use to like coffee.\\n> Did you use to ride a bike?"
      },
      {
        "h": "used to vs Past Simple",
        "b": "used to → artık geçerli olmayan eski alışkanlık/durum.\\nPast Simple → tek seferlik olay.\\n\\n> I used to live in Ankara. / I met her in 2019."
      }
    ],
    "mistakes": [
      {
        "w": "I use to live here.",
        "r": "I used to live here.",
        "n": "Eski alışkanlık için used to."
      },
      {
        "w": "She used to went there.",
        "r": "She used to go there.",
        "n": "used to + yalın fiil."
      },
      {
        "w": "I didn't used to like it.",
        "r": "I didn't use to like it.",
        "n": "didn't'ten sonra use to gelir."
      }
    ],
    "practice": [
      {
        "q": "I ___ to play tennis when I was young.",
        "hint": "used",
        "a": [
          "used"
        ]
      },
      {
        "q": "She ___ to live in Izmir.",
        "hint": "used",
        "a": [
          "used"
        ]
      },
      {
        "q": "I didn't ___ to like coffee.",
        "hint": "use",
        "a": [
          "use"
        ]
      },
      {
        "q": "He ___ to be very shy.",
        "hint": "used",
        "a": [
          "used"
        ]
      },
      {
        "q": "Did you ___ to ride a bike?",
        "hint": "use",
        "a": [
          "use"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ to live in Izmir.",
        "options": [
          "used",
          "use",
          "use",
          "is"
        ],
        "a": 0
      },
      {
        "q": "I didn't ___ to like coffee.",
        "options": [
          "use",
          "used",
          "used",
          "used"
        ],
        "a": 0
      },
      {
        "q": "He ___ to be very shy.",
        "options": [
          "used",
          "use",
          "use",
          "is"
        ],
        "a": 0
      },
      {
        "q": "Did you ___ to ride a bike?",
        "options": [
          "use",
          "used",
          "used",
          "used"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-14",
    "title": "Question Tags (değil mi?)",
    "short": "onay sorusu ekleri",
    "slides": [
      {
        "h": "Temel kural",
        "b": "Olumlu cümle → olumsuz tag; olumsuz cümle → olumlu tag.\\n\\n> It's cold, isn't it?\\n> She isn't here, is she?"
      },
      {
        "h": "Yardımcı fiil + zamir",
        "b": "Tag, cümledeki yardımcı fiille başlar:\\n\\n> You like tea, don't you?\\n> He can swim, can't he?"
      },
      {
        "h": "Önemli detay",
        "b": "I am → aren't I?\\n\\n> I'm early, aren't I?"
      }
    ],
    "mistakes": [
      {
        "w": "She is nice, is she?",
        "r": "She is nice, isn't she?",
        "n": "Olumlu cümle → olumsuz tag."
      },
      {
        "w": "They don't work, don't they?",
        "r": "They don't work, do they?",
        "n": "Olumsuz cümle → olumlu tag."
      },
      {
        "w": "He can swim, doesn't he?",
        "r": "He can swim, can't he?",
        "n": "can fiili devam eder → can't he."
      }
    ],
    "practice": [
      {
        "q": "It's cold, ___?",
        "hint": "isn't",
        "a": [
          "isn't it"
        ]
      },
      {
        "q": "She isn't here, ___?",
        "hint": "is",
        "a": [
          "is she"
        ]
      },
      {
        "q": "You like tea, ___?",
        "hint": "don't",
        "a": [
          "don't you"
        ]
      },
      {
        "q": "He can swim, ___?",
        "hint": "can't",
        "a": [
          "can't he"
        ]
      },
      {
        "q": "They don't work here, ___?",
        "hint": "do",
        "a": [
          "do they"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She isn't here, ___?",
        "options": [
          "is she",
          "isn't it",
          "don't you",
          "can't he"
        ],
        "a": 0
      },
      {
        "q": "You like tea, ___?",
        "options": [
          "don't you",
          "isn't it",
          "is she",
          "can't he"
        ],
        "a": 0
      },
      {
        "q": "He can swim, ___?",
        "options": [
          "can't he",
          "isn't it",
          "is she",
          "don't you"
        ],
        "a": 0
      },
      {
        "q": "They don't work here, ___?",
        "options": [
          "do they",
          "isn't it",
          "is she",
          "don't you"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-15",
    "title": "Modal Çıkarım (must / might / can't)",
    "short": "tahmin ve çıkarım",
    "slides": [
      {
        "h": "Kesinlik derecesi",
        "b": "must → neredeyse kesin, might/may/could → olası, can't → imkânsız.\\n\\n> must, might, can't"
      },
      {
        "h": "must (güçlü çıkarım)",
        "b": "> He must be at work; his car is here.\\n> She must be tired; she worked all night."
      },
      {
        "h": "might / can't",
        "b": "might/may/could → olasılık.\\ncan't → kesin olumsuz çıkarım (must not değil!).\\n\\n> She might be at home.\\n> That can't be true."
      }
    ],
    "mistakes": [
      {
        "w": "He must be at home; I saw him leave.",
        "r": "He can't be at home; I saw him leave.",
        "n": "Kesin olumsuz çıkarım için can't."
      },
      {
        "w": "She can be the manager; she is too young.",
        "r": "She can't be the manager; she is too young.",
        "n": "Olası değilse can't."
      },
      {
        "w": "He must working now.",
        "r": "He must be working now.",
        "n": "must + be + -ing."
      }
    ],
    "practice": [
      {
        "q": "He ___ be at work; his car is here.",
        "hint": "must",
        "a": [
          "must"
        ]
      },
      {
        "q": "That ___ be true; it's impossible.",
        "hint": "can't",
        "a": [
          "can't",
          "cannot"
        ]
      },
      {
        "q": "She ___ be sleeping; she isn't answering.",
        "hint": "might",
        "a": [
          "might",
          "may",
          "could"
        ]
      },
      {
        "q": "They ___ be home; the lights are on.",
        "hint": "must",
        "a": [
          "must"
        ]
      },
      {
        "q": "I'm not sure, but it ___ rain later.",
        "hint": "might",
        "a": [
          "might",
          "may",
          "could"
        ]
      }
    ],
    "mcq": [
      {
        "q": "That ___ be true; it's impossible.",
        "options": [
          "can't",
          "must",
          "might",
          "must"
        ],
        "a": 0
      },
      {
        "q": "She ___ be sleeping; she isn't answering.",
        "options": [
          "might",
          "must",
          "can't",
          "must"
        ],
        "a": 0
      },
      {
        "q": "They ___ be home; the lights are on.",
        "options": [
          "must",
          "can't",
          "might",
          "might"
        ],
        "a": 0
      },
      {
        "q": "I'm not sure, but it ___ rain later.",
        "options": [
          "might",
          "must",
          "can't",
          "must"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-16",
    "title": "too / enough",
    "short": "aşırılık ve yeterlilik",
    "slides": [
      {
        "h": "too + sıfat",
        "b": "Fazla, aşırı (olumsuz anlam):\\n\\n> This bag is too heavy. (Çok ağır)"
      },
      {
        "h": "sıfat + enough",
        "b": "Yeterince:\\n\\n> He is old enough to drive.\\n\\nSıfattan SONRA gelir: old enough (enough old değil)."
      },
      {
        "h": "too...to / enough...to",
        "b": "> She is too tired to work.\\n> It's warm enough to swim."
      }
    ],
    "mistakes": [
      {
        "w": "I'm enough old to vote.",
        "r": "I'm old enough to vote.",
        "n": "enough sıfattan sonra gelir."
      },
      {
        "w": "This soup is too hot enough.",
        "r": "This soup is too hot.",
        "n": "too ve enough birlikte kullanılmaz."
      },
      {
        "w": "She is too young to driving.",
        "r": "She is too young to drive.",
        "n": "to + yalın fiil."
      }
    ],
    "practice": [
      {
        "q": "This coffee is ___ hot to drink.",
        "hint": "too",
        "a": [
          "too"
        ]
      },
      {
        "q": "He is old ___ to drive.",
        "hint": "enough",
        "a": [
          "enough"
        ]
      },
      {
        "q": "I'm ___ tired to study.",
        "hint": "too",
        "a": [
          "too"
        ]
      },
      {
        "q": "The water is warm ___ to swim.",
        "hint": "enough",
        "a": [
          "enough"
        ]
      },
      {
        "q": "She is not old ___ to drive.",
        "hint": "enough",
        "a": [
          "enough"
        ]
      }
    ],
    "mcq": [
      {
        "q": "He is old ___ to drive.",
        "options": [
          "enough",
          "too",
          "too",
          "is"
        ],
        "a": 0
      },
      {
        "q": "I'm ___ tired to study.",
        "options": [
          "too",
          "enough",
          "enough",
          "enough"
        ],
        "a": 0
      },
      {
        "q": "The water is warm ___ to swim.",
        "options": [
          "enough",
          "too",
          "too",
          "is"
        ],
        "a": 0
      },
      {
        "q": "She is not old ___ to drive.",
        "options": [
          "enough",
          "too",
          "too",
          "is"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-17",
    "title": "-ed / -ing Sıfatlar",
    "short": "duygu vs etki",
    "slides": [
      {
        "h": "-ing sıfatlar",
        "b": "Durumu/etkiyi yaratan şey:\\n\\n> The film was boring. (Film sıkıcı)\\n> It was an exciting game."
      },
      {
        "h": "-ed sıfatlar",
        "b": "Kişinin hissettiği duygu:\\n\\n> I was bored. (Sıkıldım)\\n> We were excited."
      },
      {
        "h": "Yaygın çiftler",
        "b": "interesting/ed, exciting/ed, tiring/ed, disappointing/ed, frightening/ed.\\n\\nKişi hissediyor → -ed; şey hissettiriyor → -ing."
      }
    ],
    "mistakes": [
      {
        "w": "The movie was bored.",
        "r": "The movie was boring.",
        "n": "Film sıkıcı → -ing."
      },
      {
        "w": "I was boring.",
        "r": "I was bored.",
        "n": "Kişi sıkıldı → -ed."
      },
      {
        "w": "This is a tired job.",
        "r": "This is a tiring job.",
        "n": "İş yorucu → -ing."
      }
    ],
    "practice": [
      {
        "q": "I was really ___ after work.",
        "hint": "tire",
        "a": [
          "tired"
        ]
      },
      {
        "q": "The lesson was very ___.",
        "hint": "bore",
        "a": [
          "boring"
        ]
      },
      {
        "q": "She is ___ in history.",
        "hint": "interest",
        "a": [
          "interested"
        ]
      },
      {
        "q": "That game is so ___.",
        "hint": "excite",
        "a": [
          "exciting"
        ]
      },
      {
        "q": "We were ___ to hear the news.",
        "hint": "surprise",
        "a": [
          "surprised"
        ]
      }
    ],
    "mcq": [
      {
        "q": "The lesson was very ___.",
        "options": [
          "boring",
          "tired",
          "interested",
          "exciting"
        ],
        "a": 0
      },
      {
        "q": "She is ___ in history.",
        "options": [
          "interested",
          "tired",
          "boring",
          "exciting"
        ],
        "a": 0
      },
      {
        "q": "That game is so ___.",
        "options": [
          "exciting",
          "tired",
          "boring",
          "interested"
        ],
        "a": 0
      },
      {
        "q": "We were ___ to hear the news.",
        "options": [
          "surprised",
          "tired",
          "boring",
          "interested"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-18",
    "title": "Fiil + -ing vs Fiil + to",
    "short": "fiil kalıpları",
    "slides": [
      {
        "h": "-ing alan fiiller",
        "b": "enjoy, mind, finish, avoid, feel like, can't stand, suggest:\\n\\n> I enjoy playing chess.\\n> Would you mind opening the window?"
      },
      {
        "h": "to + fiil alan fiiller",
        "b": "want, need, decide, plan, hope, offer, promise, agree:\\n\\n> I decided to go home.\\n> She wants to become a doctor."
      },
      {
        "h": "Her ikisini alanlar",
        "b": "start, begin, like, love, hate / prefer:\\n\\n> I started to read / reading."
      }
    ],
    "mistakes": [
      {
        "w": "I enjoy to play chess.",
        "r": "I enjoy playing chess.",
        "n": "enjoy + -ing."
      },
      {
        "w": "She decided going home.",
        "r": "She decided to go home.",
        "n": "decide + to."
      },
      {
        "w": "I want going home.",
        "r": "I want to go home.",
        "n": "want + to."
      }
    ],
    "practice": [
      {
        "q": "I enjoy ___ football.",
        "hint": "play",
        "a": [
          "playing"
        ]
      },
      {
        "q": "She wants ___ a doctor.",
        "hint": "become",
        "a": [
          "to become"
        ]
      },
      {
        "q": "He finished ___ the report.",
        "hint": "write",
        "a": [
          "writing"
        ]
      },
      {
        "q": "I decided ___ a new course.",
        "hint": "take",
        "a": [
          "to take"
        ]
      },
      {
        "q": "We feel like ___ out.",
        "hint": "eat",
        "a": [
          "eating"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She wants ___ a doctor.",
        "options": [
          "to become",
          "playing",
          "writing",
          "to take"
        ],
        "a": 0
      },
      {
        "q": "He finished ___ the report.",
        "options": [
          "writing",
          "playing",
          "to become",
          "to take"
        ],
        "a": 0
      },
      {
        "q": "I decided ___ a new course.",
        "options": [
          "to take",
          "playing",
          "to become",
          "writing"
        ],
        "a": 0
      },
      {
        "q": "We feel like ___ out.",
        "options": [
          "eating",
          "playing",
          "to become",
          "writing"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-19",
    "title": "Amaç Bildiren 'to' (Infinitive of Purpose)",
    "short": "neden için",
    "slides": [
      {
        "h": "to + fiil",
        "b": "Amaç bildirir ('için'):\\n\\n> I went to the shop to buy milk. (Süt almak için)"
      },
      {
        "h": "Why sorusuna yanıt",
        "b": "> Why did you call? → To ask for help.\\n\\nDaha resmi: in order to / so as to."
      },
      {
        "h": "Olumsuz amaç",
        "b": "so as not to / in order not to:\\n\\n> He left early so as not to be late."
      }
    ],
    "mistakes": [
      {
        "w": "I went there for buy milk.",
        "r": "I went there to buy milk.",
        "n": "Amaç için to kullanılır."
      },
      {
        "w": "She studied for to pass.",
        "r": "She studied to pass.",
        "n": "'for to' yanlıştır."
      },
      {
        "w": "I came here see you.",
        "r": "I came here to see you.",
        "n": "to gereklidir."
      }
    ],
    "practice": [
      {
        "q": "I went to the bank ___ my money.",
        "hint": "withdraw",
        "a": [
          "to withdraw"
        ]
      },
      {
        "q": "She called me ___ her.",
        "hint": "help",
        "a": [
          "to help"
        ]
      },
      {
        "q": "We left early ___ the bus.",
        "hint": "catch",
        "a": [
          "to catch"
        ]
      },
      {
        "q": "He studies hard ___ the exam.",
        "hint": "pass",
        "a": [
          "to pass"
        ]
      },
      {
        "q": "I opened the window ___ some fresh air.",
        "hint": "get",
        "a": [
          "to get"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She called me ___ her.",
        "options": [
          "to help",
          "to withdraw",
          "to catch",
          "to pass"
        ],
        "a": 0
      },
      {
        "q": "We left early ___ the bus.",
        "options": [
          "to catch",
          "to withdraw",
          "to help",
          "to pass"
        ],
        "a": 0
      },
      {
        "q": "He studies hard ___ the exam.",
        "options": [
          "to pass",
          "to withdraw",
          "to help",
          "to catch"
        ],
        "a": 0
      },
      {
        "q": "I opened the window ___ some fresh air.",
        "options": [
          "to get",
          "to withdraw",
          "to help",
          "to catch"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-20",
    "title": "make / let / allow",
    "short": "zorlamak ve izin vermek",
    "slides": [
      {
        "h": "make + kişi + yalın fiil",
        "b": "Zorlamak:\\n\\n> My parents make me study. (Beni çalışmaya zorlarlar)"
      },
      {
        "h": "let + kişi + yalın fiil",
        "b": "İzin vermek (günlük):\\n\\n> My mum lets me go out. (Çıkmama izin verir)"
      },
      {
        "h": "allow + kişi + to fiil",
        "b": "İzin vermek (resmi).\\n\\nDikkat: make/let → yalın fiil, allow → to + fiil.\\n\\n> They allow students to use phones."
      }
    ],
    "mistakes": [
      {
        "w": "My father makes me to study.",
        "r": "My father makes me study.",
        "n": "make + yalın fiil (to yok)."
      },
      {
        "w": "She lets me to go out.",
        "r": "She lets me go out.",
        "n": "let + yalın fiil."
      },
      {
        "w": "They allow students using phones.",
        "r": "They allow students to use phones.",
        "n": "allow + to + fiil."
      }
    ],
    "practice": [
      {
        "q": "My dad made me ___ my room.",
        "hint": "clean",
        "a": [
          "clean"
        ]
      },
      {
        "q": "She lets her son ___ late.",
        "hint": "stay",
        "a": [
          "stay"
        ]
      },
      {
        "q": "The teacher allowed us ___ early.",
        "hint": "leave",
        "a": [
          "to leave"
        ]
      },
      {
        "q": "Don't make me ___ that.",
        "hint": "do",
        "a": [
          "do"
        ]
      },
      {
        "q": "They don't allow people ___ here.",
        "hint": "smoke",
        "a": [
          "to smoke"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She lets her son ___ late.",
        "options": [
          "stay",
          "clean",
          "to leave",
          "do"
        ],
        "a": 0
      },
      {
        "q": "The teacher allowed us ___ early.",
        "options": [
          "to leave",
          "clean",
          "stay",
          "do"
        ],
        "a": 0
      },
      {
        "q": "Don't make me ___ that.",
        "options": [
          "do",
          "clean",
          "stay",
          "to leave"
        ],
        "a": 0
      },
      {
        "q": "They don't allow people ___ here.",
        "options": [
          "to smoke",
          "clean",
          "stay",
          "to leave"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-21",
    "title": "Belgisiz Zamirler",
    "short": "somebody / anything / nothing",
    "slides": [
      {
        "h": "some- / any- / no-",
        "b": "somebody, anybody, everybody, nobody\\nsomething, anything, everything, nothing\\n\\n> Somebody is at the door."
      },
      {
        "h": "some / any",
        "b": "some- → olumluda, any- → olumsuz/soruda:\\n\\n> I want something to eat.\\n> I don't know anything.\\n> Is anybody home?"
      },
      {
        "h": "no-",
        "b": "no- olumsuz anlam verir, olumsuz fiille kullanılmaz.\\n\\n> Nobody called. (Doğru) / Nobody didn't call. (Yanlış)\\n> There is nothing in the fridge."
      }
    ],
    "mistakes": [
      {
        "w": "I don't know nobody here.",
        "r": "I don't know anybody here.",
        "n": "no- ile olumsuz fiil birlikte kullanılmaz."
      },
      {
        "w": "Is somebody home?",
        "r": "Is anybody home?",
        "n": "Sorularda any- kullanılır."
      },
      {
        "w": "There is no anything in the bag.",
        "r": "There is nothing in the bag.",
        "n": "no + anything olmaz."
      }
    ],
    "practice": [
      {
        "q": "___ is knocking at the door.",
        "hint": "somebody",
        "a": [
          "Somebody",
          "Someone"
        ]
      },
      {
        "q": "There is ___ in the fridge.",
        "hint": "hiçbir şey",
        "a": [
          "nothing"
        ]
      },
      {
        "q": "I don't know ___ about it.",
        "hint": "anything",
        "a": [
          "anything"
        ]
      },
      {
        "q": "Is ___ here?",
        "hint": "anybody",
        "a": [
          "anybody",
          "anyone"
        ]
      },
      {
        "q": "___ phoned while you were out.",
        "hint": "somebody",
        "a": [
          "Somebody",
          "Someone"
        ]
      }
    ],
    "mcq": [
      {
        "q": "There is ___ in the fridge.",
        "options": [
          "nothing",
          "Somebody",
          "anything",
          "anybody"
        ],
        "a": 0
      },
      {
        "q": "I don't know ___ about it.",
        "options": [
          "anything",
          "Somebody",
          "nothing",
          "anybody"
        ],
        "a": 0
      },
      {
        "q": "Is ___ here?",
        "options": [
          "anybody",
          "Somebody",
          "nothing",
          "anything"
        ],
        "a": 0
      },
      {
        "q": "___ phoned while you were out.",
        "options": [
          "Somebody",
          "nothing",
          "anything",
          "anybody"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "b1-22",
    "title": "Dolaylı Anlatım (say / tell, ricalar)",
    "short": "backshift ve rica",
    "slides": [
      {
        "h": "say / tell",
        "b": "say (to) + kişi, tell + kişi (to'suz):\\n\\n> He said (that) he was tired.\\n> He told me (that) he was tired."
      },
      {
        "h": "Backshift (zaman kayması)",
        "b": "present → past, will → would, can → could, am/is → was/were.\\n\\n> \"I am busy.\" → She said she was busy."
      },
      {
        "h": "Aktarılan ricalar",
        "b": "ask/tell + kişi + to fiil:\\n\\n> \"Please close the door.\" → She asked me to close the door.\\n> \"Close the door!\" → He told me to close the door."
      }
    ],
    "mistakes": [
      {
        "w": "She said she is tired.",
        "r": "She said she was tired.",
        "n": "Backshift: is → was."
      },
      {
        "w": "He said me that he was happy.",
        "r": "He told me that he was happy.",
        "n": "said'den sonra kişi gelmez."
      },
      {
        "w": "She asked me close the door.",
        "r": "She asked me to close the door.",
        "n": "ask + kişi + to."
      }
    ],
    "practice": [
      {
        "q": "He said (that) he ___ at home.",
        "hint": "be (backshift)",
        "a": [
          "was"
        ]
      },
      {
        "q": "\"I will come.\" → He said he ___ come.",
        "hint": "will",
        "a": [
          "would"
        ]
      },
      {
        "q": "She told me (that) she ___ to help.",
        "hint": "want",
        "a": [
          "wanted"
        ]
      },
      {
        "q": "She asked me ___ quiet.",
        "hint": "be",
        "a": [
          "to be"
        ]
      },
      {
        "q": "\"Call me.\" → They told me ___ them.",
        "hint": "call",
        "a": [
          "to call"
        ]
      }
    ],
    "mcq": [
      {
        "q": "\"I will come.\" → He said he ___ come.",
        "options": [
          "would",
          "was",
          "wanted",
          "to be"
        ],
        "a": 0
      },
      {
        "q": "She told me (that) she ___ to help.",
        "options": [
          "wanted",
          "was",
          "would",
          "to be"
        ],
        "a": 0
      },
      {
        "q": "She asked me ___ quiet.",
        "options": [
          "to be",
          "was",
          "would",
          "wanted"
        ],
        "a": 0
      },
      {
        "q": "\"Call me.\" → They told me ___ them.",
        "options": [
          "to call",
          "was",
          "would",
          "wanted"
        ],
        "a": 0
      }
    ]
  }
]
};
