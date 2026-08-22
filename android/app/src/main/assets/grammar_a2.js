// Languago — A2 · Temel (Günlük hayat dilbilgisi)
window.GRAMMAR_A2 = {
  id: "a2",
  title: "A2 · Temel",
  subtitle: "Günlük hayat dilbilgisi",
  color: "#22C55E",
  units: [
  {
    "id": "a2-01",
    "title": "Şimdiki Zaman (Present Continuous)",
    "short": "am/is/are + -ing",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "am/is/are + fiil-ing\n\n> I am reading.\n> She is reading.\n> They are reading."
      },
      {
        "h": "Kullanım",
        "b": "Şu an devam eden eylemler için:\n\n> He is watching TV now.\n> Listen! The baby is crying."
      },
      {
        "h": "Yazım kuralları",
        "b": "-e ile biten fiillerde e düşer: make → making\n\n- kısa ünlü + sessiz → sessiz iki kat:\n> run → running, sit → sitting"
      }
    ],
    "mistakes": [
      {
        "w": "I am work now.",
        "r": "I am working now.",
        "n": "Fiil -ing alır."
      },
      {
        "w": "She is run in the park.",
        "r": "She is running in the park.",
        "n": "run → running (sessiz iki kat)."
      },
      {
        "w": "They is playing.",
        "r": "They are playing.",
        "n": "Çoğul için are."
      }
    ],
    "practice": [
      {
        "q": "I ___ a book now.",
        "hint": "read",
        "a": [
          "am reading"
        ]
      },
      {
        "q": "She ___ in the pool.",
        "hint": "swim",
        "a": [
          "is swimming"
        ]
      },
      {
        "q": "They ___ lunch.",
        "hint": "eat",
        "a": [
          "are eating"
        ]
      },
      {
        "q": "He ___ his homework.",
        "hint": "do",
        "a": [
          "is doing"
        ]
      },
      {
        "q": "We ___ TV.",
        "hint": "watch",
        "a": [
          "are watching"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ in the pool.",
        "options": [
          "is swimming",
          "am reading",
          "are eating",
          "is doing"
        ],
        "a": 0
      },
      {
        "q": "They ___ lunch.",
        "options": [
          "are eating",
          "am reading",
          "is swimming",
          "is doing"
        ],
        "a": 0
      },
      {
        "q": "He ___ his homework.",
        "options": [
          "is doing",
          "am reading",
          "is swimming",
          "are eating"
        ],
        "a": 0
      },
      {
        "q": "We ___ TV.",
        "options": [
          "are watching",
          "am reading",
          "is swimming",
          "are eating"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-02",
    "title": "Geniş Zaman vs Şimdiki Zaman",
    "short": "Simple vs Continuous",
    "slides": [
      {
        "h": "Fark",
        "b": "Simple → rutin/alışkanlık/genel gerçek.\nContinuous → şu an devam eden.\n\n> I play football. (genel)\n> I am playing football now."
      },
      {
        "h": "Zaman zarfları",
        "b": "Simple: always, usually, every day, sometimes\nContinuous: now, right now, at the moment, Look!/Listen!"
      },
      {
        "h": "Durum fiilleri",
        "b": "Bazı fiiller -ing almaz (durum fiilleri):\n\n> like, love, want, know, understand, believe\n\n> I understand (doğru) / I am understanding (yanlış)"
      }
    ],
    "mistakes": [
      {
        "w": "I am playing football every day.",
        "r": "I play football every day.",
        "n": "Rutin → simple."
      },
      {
        "w": "She works right now.",
        "r": "She is working right now.",
        "n": "Şu an → continuous."
      },
      {
        "w": "I am wanting a coffee.",
        "r": "I want a coffee.",
        "n": "want durum fiilidir, -ing almaz."
      }
    ],
    "practice": [
      {
        "q": "He ___ to school every day.",
        "hint": "go (rutin)",
        "a": [
          "goes"
        ]
      },
      {
        "q": "Listen! She ___ a song.",
        "hint": "sing",
        "a": [
          "is singing"
        ]
      },
      {
        "q": "I ___ (not/understand) now.",
        "hint": "understand (durum fiili)",
        "a": [
          "don't understand",
          "do not understand"
        ]
      },
      {
        "q": "They usually ___ at 8.",
        "hint": "get up",
        "a": [
          "get up"
        ]
      },
      {
        "q": "Look! It ___ outside.",
        "hint": "rain",
        "a": [
          "is raining"
        ]
      }
    ],
    "mcq": [
      {
        "q": "Listen! She ___ a song.",
        "options": [
          "is singing",
          "goes",
          "don't understand",
          "get up"
        ],
        "a": 0
      },
      {
        "q": "I ___ (not/understand) now.",
        "options": [
          "don't understand",
          "goes",
          "is singing",
          "get up"
        ],
        "a": 0
      },
      {
        "q": "They usually ___ at 8.",
        "options": [
          "get up",
          "goes",
          "is singing",
          "don't understand"
        ],
        "a": 0
      },
      {
        "q": "Look! It ___ outside.",
        "options": [
          "is raining",
          "goes",
          "is singing",
          "don't understand"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-03",
    "title": "Geçmiş Zaman (Olumlu)",
    "short": "worked / went",
    "slides": [
      {
        "h": "Düzenli fiiller",
        "b": "-ed eklenir.\n\n> work → worked, play → played\n\n- e ile biten → -d: live → lived\n- y (öncesi sessiz) → -ied: study → studied"
      },
      {
        "h": "Düzensiz fiiller",
        "b": "Ezberlenmelidir:\n\n> go → went, eat → ate, see → saw\n> buy → bought, come → came, have → had"
      },
      {
        "h": "Kullanım",
        "b": "Geçmişte bitmiş eylemler için, genelde belirli zamanla:\n\n> I visited my friend yesterday.\n> She went to Paris last year."
      }
    ],
    "mistakes": [
      {
        "w": "I goed to school.",
        "r": "I went to school.",
        "n": "go → went (düzensiz)."
      },
      {
        "w": "She eated lunch.",
        "r": "She ate lunch.",
        "n": "eat → ate."
      },
      {
        "w": "He work yesterday.",
        "r": "He worked yesterday.",
        "n": "Düzenli fiil -ed alır."
      }
    ],
    "practice": [
      {
        "q": "Yesterday I ___ to the cinema.",
        "hint": "go",
        "a": [
          "went"
        ]
      },
      {
        "q": "She ___ a new dress.",
        "hint": "buy",
        "a": [
          "bought"
        ]
      },
      {
        "q": "They ___ football last week.",
        "hint": "play",
        "a": [
          "played"
        ]
      },
      {
        "q": "We ___ pizza for dinner.",
        "hint": "eat",
        "a": [
          "ate"
        ]
      },
      {
        "q": "He ___ TV last night.",
        "hint": "watch",
        "a": [
          "watched"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ a new dress.",
        "options": [
          "bought",
          "went",
          "played",
          "ate"
        ],
        "a": 0
      },
      {
        "q": "They ___ football last week.",
        "options": [
          "played",
          "went",
          "bought",
          "ate"
        ],
        "a": 0
      },
      {
        "q": "We ___ pizza for dinner.",
        "options": [
          "ate",
          "went",
          "bought",
          "played"
        ],
        "a": 0
      },
      {
        "q": "He ___ TV last night.",
        "options": [
          "watched",
          "went",
          "bought",
          "played"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-04",
    "title": "Geçmiş Zaman (Olumsuz ve Soru)",
    "short": "didn't / Did",
    "slides": [
      {
        "h": "Olumsuz",
        "b": "didn't + fiil yalın:\n\n> I didn't go.\n> She didn't go."
      },
      {
        "h": "Soru",
        "b": "Did + özne + fiil yalın:\n\n> Did you go?\n> Did she go?"
      },
      {
        "h": "Dikkat",
        "b": "didn't/did'den sonra fiil geçmiş haliyle değil YALIN kullanılır.\n\n> I didn't went (yanlış) → I didn't go (doğru)"
      }
    ],
    "mistakes": [
      {
        "w": "I didn't went to school.",
        "r": "I didn't go to school.",
        "n": "didn't sonrası yalın fiil."
      },
      {
        "w": "Did you went there?",
        "r": "Did you go there?",
        "n": "did sonrası yalın fiil."
      },
      {
        "w": "She did not ate.",
        "r": "She did not eat.",
        "n": "did not sonrası yalın fiil."
      }
    ],
    "practice": [
      {
        "q": "I ___ to school yesterday.",
        "hint": "not/go",
        "a": [
          "didn't go",
          "did not go"
        ]
      },
      {
        "q": "___ you see him?",
        "hint": "did",
        "a": [
          "did"
        ]
      },
      {
        "q": "She ___ breakfast.",
        "hint": "not/eat",
        "a": [
          "didn't eat",
          "did not eat"
        ]
      },
      {
        "q": "___ they come to the party?",
        "hint": "did",
        "a": [
          "did"
        ]
      },
      {
        "q": "He ___ the answer.",
        "hint": "not/know",
        "a": [
          "didn't know",
          "did not know"
        ]
      }
    ],
    "mcq": [
      {
        "q": "___ you see him?",
        "options": [
          "did",
          "didn't go",
          "didn't eat",
          "didn't know"
        ],
        "a": 0
      },
      {
        "q": "She ___ breakfast.",
        "options": [
          "didn't eat",
          "didn't go",
          "did",
          "did"
        ],
        "a": 0
      },
      {
        "q": "___ they come to the party?",
        "options": [
          "did",
          "didn't go",
          "didn't eat",
          "didn't know"
        ],
        "a": 0
      },
      {
        "q": "He ___ the answer.",
        "options": [
          "didn't know",
          "didn't go",
          "did",
          "didn't eat"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-05",
    "title": "Gelecek: going to",
    "short": "planlı gelecek",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "am/is/are + going to + fiil\n\n> I am going to travel.\n> She is going to study.\n> They are going to move."
      },
      {
        "h": "Kullanım",
        "b": "Planlanmış gelecek ve niyet için:\n\n> I am going to visit my grandparents.\n> We are going to buy a house."
      },
      {
        "h": "Kısaltmalar",
        "b": "am → 'm, is → 's, are → 're\n\n> I'm going to, She's going to, We're going to"
      }
    ],
    "mistakes": [
      {
        "w": "I going to travel.",
        "r": "I am going to travel.",
        "n": "am/is/are şart."
      },
      {
        "w": "She is going to travels.",
        "r": "She is going to travel.",
        "n": "going to sonrası fiil yalın."
      },
      {
        "w": "He going to eat.",
        "r": "He is going to eat.",
        "n": "is eksik."
      }
    ],
    "practice": [
      {
        "q": "I ___ my friend tomorrow.",
        "hint": "visit",
        "a": [
          "am going to visit",
          "'m going to visit"
        ]
      },
      {
        "q": "They ___ a car.",
        "hint": "buy",
        "a": [
          "are going to buy",
          "'re going to buy"
        ]
      },
      {
        "q": "She ___ us next week.",
        "hint": "visit",
        "a": [
          "is going to visit",
          "'s going to visit"
        ]
      },
      {
        "q": "We ___ (not/come).",
        "hint": "come (olumsuz)",
        "a": [
          "are not going to come",
          "aren't going to come"
        ]
      }
    ],
    "mcq": [
      {
        "q": "They ___ a car.",
        "options": [
          "are going to buy",
          "am going to visit",
          "is going to visit",
          "are not going to come"
        ],
        "a": 0
      },
      {
        "q": "She ___ us next week.",
        "options": [
          "is going to visit",
          "am going to visit",
          "are going to buy",
          "are not going to come"
        ],
        "a": 0
      },
      {
        "q": "We ___ (not/come).",
        "options": [
          "are not going to come",
          "am going to visit",
          "are going to buy",
          "is going to visit"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-06",
    "title": "Karşılaştırma ve Üstünlük",
    "short": "-er / -est / more / most",
    "slides": [
      {
        "h": "Karşılaştırma",
        "b": "Kısa sıfatlar → -er: big → bigger, tall → taller\n\nUzun sıfatlar → more: beautiful → more beautiful\n\n> This car is faster than that car."
      },
      {
        "h": "Üstünlük",
        "b": "Kısa → -est: the biggest\nUzun → the most: the most beautiful\n\n> She is the tallest in the class."
      },
      {
        "h": "Düzensizler",
        "b": "> good → better → best\n> bad → worse → worst\n> far → farther/further → farthest/furthest"
      }
    ],
    "mistakes": [
      {
        "w": "This is more big.",
        "r": "This is bigger.",
        "n": "Kısa sıfat -er alır."
      },
      {
        "w": "She is gooder.",
        "r": "She is better.",
        "n": "good → better (düzensiz)."
      },
      {
        "w": "He is the most tall.",
        "r": "He is the tallest.",
        "n": "Kısa sıfat -est alır."
      }
    ],
    "practice": [
      {
        "q": "big → ___",
        "hint": "karşılaştırma (-er)",
        "a": [
          "bigger"
        ]
      },
      {
        "q": "good → ___",
        "hint": "karşılaştırma",
        "a": [
          "better"
        ]
      },
      {
        "q": "expensive → ___",
        "hint": "karşılaştırma (more)",
        "a": [
          "more expensive"
        ]
      },
      {
        "q": "tall → ___",
        "hint": "üstünlük (-est)",
        "a": [
          "tallest",
          "the tallest"
        ]
      },
      {
        "q": "bad → ___",
        "hint": "üstünlük",
        "a": [
          "worst",
          "the worst"
        ]
      }
    ],
    "mcq": [
      {
        "q": "good → ___",
        "options": [
          "better",
          "bigger",
          "more expensive",
          "tallest"
        ],
        "a": 0
      },
      {
        "q": "expensive → ___",
        "options": [
          "more expensive",
          "bigger",
          "better",
          "tallest"
        ],
        "a": 0
      },
      {
        "q": "tall → ___",
        "options": [
          "tallest",
          "bigger",
          "better",
          "more expensive"
        ],
        "a": 0
      },
      {
        "q": "bad → ___",
        "options": [
          "worst",
          "bigger",
          "better",
          "more expensive"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-07",
    "title": "Sayılabilir/Sayılamaz + some/any",
    "short": "much / many / some / any",
    "slides": [
      {
        "h": "Sayılabilir / sayılamaz",
        "b": "Sayılabilir: book, apple (tekil/çoğul olur).\nSayılamaz: water, money, information (çoğul olmaz)."
      },
      {
        "h": "some / any",
        "b": "some → olumluda, any → olumsuz ve soruda.\n\n> I have some money.\n> I don't have any money.\n> Do you have any money?"
      },
      {
        "h": "much / many / a lot of",
        "b": "many → sayılabilir çoğul\nmuch → sayılamaz\na lot of → her ikisi (özellikle olumlu)\n\n> How many books? / How much water?"
      }
    ],
    "mistakes": [
      {
        "w": "I have much books.",
        "r": "I have many books.",
        "n": "Sayılabilir → many."
      },
      {
        "w": "How many water?",
        "r": "How much water?",
        "n": "Sayılamaz → much."
      },
      {
        "w": "I don't have some money.",
        "r": "I don't have any money.",
        "n": "Olumsuzda any."
      }
    ],
    "practice": [
      {
        "q": "How ___ books do you have?",
        "hint": "much / many",
        "a": [
          "many"
        ]
      },
      {
        "q": "How ___ water do you need?",
        "hint": "much / many",
        "a": [
          "much"
        ]
      },
      {
        "q": "I don't have ___ money.",
        "hint": "some / any",
        "a": [
          "any"
        ]
      },
      {
        "q": "There are ___ apples on the table.",
        "hint": "some / any",
        "a": [
          "some"
        ]
      },
      {
        "q": "She has ___ friends.",
        "hint": "çok",
        "a": [
          "a lot of",
          "many"
        ]
      }
    ],
    "mcq": [
      {
        "q": "How ___ water do you need?",
        "options": [
          "much",
          "many",
          "any",
          "some"
        ],
        "a": 0
      },
      {
        "q": "I don't have ___ money.",
        "options": [
          "any",
          "many",
          "much",
          "some"
        ],
        "a": 0
      },
      {
        "q": "There are ___ apples on the table.",
        "options": [
          "some",
          "many",
          "much",
          "any"
        ],
        "a": 0
      },
      {
        "q": "She has ___ friends.",
        "options": [
          "a lot of",
          "many",
          "much",
          "any"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-08",
    "title": "can / can't (Yetenek)",
    "short": "yapabilmek",
    "slides": [
      {
        "h": "Yetenek",
        "b": "can + fiil yalın = yapabilmek\n\n> I can swim.\n> She can speak English."
      },
      {
        "h": "Olumsuz ve soru",
        "b": "can't (cannot) = yapamamak\n\n> I can't drive.\n\nSoru: Can you help me?"
      },
      {
        "h": "Dikkat",
        "b": "can'den sonra fiil yalın; to veya -ing gelmez.\n\n> I can swim (doğru) / I can to swim (yanlış)\n\ncan asla -s almaz: he can (doğru), he cans (yanlış)"
      }
    ],
    "mistakes": [
      {
        "w": "I can to swim.",
        "r": "I can swim.",
        "n": "can sonrası fiil yalın."
      },
      {
        "w": "She cans swim.",
        "r": "She can swim.",
        "n": "can değişmez, -s almaz."
      },
      {
        "w": "He can swimming.",
        "r": "He can swim.",
        "n": "Fiil yalın kullanılır."
      }
    ],
    "practice": [
      {
        "q": "I ___ swim very well.",
        "hint": "can / can't",
        "a": [
          "can"
        ]
      },
      {
        "q": "She ___ drive.",
        "hint": "yapamıyor",
        "a": [
          "can't",
          "cannot"
        ]
      },
      {
        "q": "___ you help me?",
        "hint": "can (soru)",
        "a": [
          "can"
        ]
      },
      {
        "q": "He ___ play the guitar.",
        "hint": "yapabiliyor",
        "a": [
          "can"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ drive.",
        "options": [
          "can't",
          "can",
          "can",
          "can"
        ],
        "a": 0
      },
      {
        "q": "___ you help me?",
        "options": [
          "can",
          "can't",
          "is",
          "are"
        ],
        "a": 0
      },
      {
        "q": "He ___ play the guitar.",
        "options": [
          "can",
          "can't",
          "is",
          "are"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-09",
    "title": "Düzensiz Geçmiş Zaman Fiilleri",
    "short": "went / ate / saw",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "Düzensiz fiiller geçmişte -ed ALMAZ, fiil biçimi değişir:\n\n> go → went, eat → ate, see → saw\n> come → came, buy → bought, have → had\n> give → gave, take → took, break → broke"
      },
      {
        "h": "Sık kullanılanlar",
        "b": "> drink → drank, sleep → slept, swim → swam\n> write → wrote, read → read, leave → left\n\nCümle:\n> I went to the beach yesterday.\n> She bought a gift."
      },
      {
        "h": "Dikkat",
        "b": "Düzenli: walk → walked. Düzensiz: go → went.\n\nYanlış: I goed. (Doğru: I went.)\nYanlış: She eated. (Doğru: She ate.)"
      }
    ],
    "mistakes": [
      {
        "w": "I goed to the park.",
        "r": "I went to the park.",
        "n": "go → went (düzensiz), -ed almaz."
      },
      {
        "w": "She buyed a phone.",
        "r": "She bought a phone.",
        "n": "buy → bought (düzensiz)."
      },
      {
        "w": "We taked photos.",
        "r": "We took photos.",
        "n": "take → took (düzensiz)."
      }
    ],
    "practice": [
      {
        "q": "I ___ to my grandmother yesterday.",
        "hint": "go (düzensiz)",
        "a": [
          "went"
        ]
      },
      {
        "q": "She ___ a delicious meal.",
        "hint": "make (düzensiz)",
        "a": [
          "made"
        ]
      },
      {
        "q": "They ___ to the party last night.",
        "hint": "come (düzensiz)",
        "a": [
          "came"
        ]
      },
      {
        "q": "We ___ a great film.",
        "hint": "see (düzensiz)",
        "a": [
          "saw"
        ]
      },
      {
        "q": "He ___ the window.",
        "hint": "break (düzensiz)",
        "a": [
          "broke"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ a delicious meal.",
        "options": [
          "made",
          "went",
          "came",
          "saw"
        ],
        "a": 0
      },
      {
        "q": "They ___ to the party last night.",
        "options": [
          "came",
          "went",
          "made",
          "saw"
        ],
        "a": 0
      },
      {
        "q": "We ___ a great film.",
        "options": [
          "saw",
          "went",
          "made",
          "came"
        ],
        "a": 0
      },
      {
        "q": "He ___ the window.",
        "options": [
          "broke",
          "went",
          "made",
          "came"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-10",
    "title": "be: was / were",
    "short": "geçmişte olmak",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "be fiilinin geçmişi:\n\n> I / he / she / it → was\n> you / we / they → were\n\n> I was tired. / She was at home. / We were happy."
      },
      {
        "h": "Olumsuz ve soru",
        "b": "Olumsuz: wasn't / weren't\n\n> I wasn't late.\n> They weren't ready.\n\nSoru:\n> Was he here?\n> Were you at school?"
      },
      {
        "h": "Kullanım",
        "b": "Geçmişte durum / var olma:\n\n> I was ill last week.\n> There was a problem.\n> There were many people."
      }
    ],
    "mistakes": [
      {
        "w": "I were tired last night.",
        "r": "I was tired last night.",
        "n": "I/he/she/it ile was."
      },
      {
        "w": "They was at home.",
        "r": "They were at home.",
        "n": "you/we/they ile were."
      },
      {
        "w": "Was you there?",
        "r": "Were you there?",
        "n": "you ile were."
      }
    ],
    "practice": [
      {
        "q": "I ___ very hungry after the match.",
        "hint": "be geçmiş (tekil)",
        "a": [
          "was"
        ]
      },
      {
        "q": "They ___ at the cinema last night.",
        "hint": "be geçmiş (çoğul)",
        "a": [
          "were"
        ]
      },
      {
        "q": "She ___ (not) at work yesterday.",
        "hint": "be olumsuz",
        "a": [
          "wasn't",
          "was not"
        ]
      },
      {
        "q": "___ you at the party on Saturday?",
        "hint": "be geçmiş (soru)",
        "a": [
          "were"
        ]
      },
      {
        "q": "There ___ a lot of traffic.",
        "hint": "var olma (tekil)",
        "a": [
          "was"
        ]
      }
    ],
    "mcq": [
      {
        "q": "They ___ at the cinema last night.",
        "options": [
          "were",
          "was",
          "wasn't",
          "was"
        ],
        "a": 0
      },
      {
        "q": "She ___ (not) at work yesterday.",
        "options": [
          "wasn't",
          "was",
          "were",
          "were"
        ],
        "a": 0
      },
      {
        "q": "___ you at the party on Saturday?",
        "options": [
          "were",
          "was",
          "wasn't",
          "was"
        ],
        "a": 0
      },
      {
        "q": "There ___ a lot of traffic.",
        "options": [
          "was",
          "were",
          "wasn't",
          "were"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-11",
    "title": "Zaman Zarfları: yesterday / last week / ago",
    "short": "geçmiş zaman zarfları",
    "slides": [
      {
        "h": "Yardımcılar",
        "b": "Geçmiş zaman zarfları past simple'la kullanılır:\n\n> yesterday, last week / month / year, … ago\n\n> I met him yesterday.\n> She moved here last year."
      },
      {
        "h": "… ago",
        "b": "ago = 'önce' (şimdiden geriye):\n\n> two days ago, three months ago, ten minutes ago\n\n> He left ten minutes ago."
      },
      {
        "h": "Dikkat",
        "b": "Bu zarflarla Geniş / Şimdiki zaman kullanılmaz:\n\nYanlış: I see him yesterday.\nDoğru: I saw him yesterday."
      }
    ],
    "mistakes": [
      {
        "w": "I visit her yesterday.",
        "r": "I visited her yesterday.",
        "n": "yesterday → geçmiş."
      },
      {
        "w": "She go to Ankara last week.",
        "r": "She went to Ankara last week.",
        "n": "last week → geçmiş (düzensiz go→went)."
      },
      {
        "w": "He finishes the work two days ago.",
        "r": "He finished the work two days ago.",
        "n": "ago → geçmiş."
      }
    ],
    "practice": [
      {
        "q": "I ___ my keys three hours ago.",
        "hint": "lose (düzensiz)",
        "a": [
          "lost"
        ]
      },
      {
        "q": "She ___ abroad last summer.",
        "hint": "go (düzensiz)",
        "a": [
          "went"
        ]
      },
      {
        "q": "We ___ a great dinner yesterday.",
        "hint": "have (düzensiz)",
        "a": [
          "had"
        ]
      },
      {
        "q": "He ___ (not/come) to class yesterday.",
        "hint": "not come (geçmiş)",
        "a": [
          "didn't come",
          "did not come"
        ]
      },
      {
        "q": "They ___ here a week ago.",
        "hint": "arrive",
        "a": [
          "arrived"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ abroad last summer.",
        "options": [
          "went",
          "lost",
          "had",
          "didn't come"
        ],
        "a": 0
      },
      {
        "q": "We ___ a great dinner yesterday.",
        "options": [
          "had",
          "lost",
          "went",
          "didn't come"
        ],
        "a": 0
      },
      {
        "q": "He ___ (not/come) to class yesterday.",
        "options": [
          "didn't come",
          "lost",
          "went",
          "had"
        ],
        "a": 0
      },
      {
        "q": "They ___ here a week ago.",
        "options": [
          "arrived",
          "lost",
          "went",
          "had"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-12",
    "title": "Eşitlik: as...as",
    "short": "as + sıfat + as",
    "slides": [
      {
        "h": "Eşitlik",
        "b": "as + sıfat + as = '… kadar …'\n\n> Tom is as tall as his brother.\n> This bag is as heavy as that one."
      },
      {
        "h": "Olumsuz: not as … as",
        "b": "not as + sıfat + as = '… kadar değil'\n\n> This book is not as interesting as that one.\n> I'm not as fast as you."
      },
      {
        "h": "Karşılaştırma notu",
        "b": "as…as EŞİTLİK, -er than ise FARK:\n\n> She is as old as me. (eşit)\n> She is older than me. (fark)"
      }
    ],
    "mistakes": [
      {
        "w": "This car is fast as mine.",
        "r": "This car is as fast as mine.",
        "n": "as + sıfat + as gerekli."
      },
      {
        "w": "He is as taller as me.",
        "r": "He is as tall as me.",
        "n": "as…as arasına YALIN sıfat gelir (comparative değil)."
      },
      {
        "w": "This is as better as that.",
        "r": "This is as good as that.",
        "n": "as…as arasına temel sıfat gelir."
      }
    ],
    "practice": [
      {
        "q": "My bag is ___ (heavy) as yours.",
        "hint": "as … as",
        "a": [
          "as heavy"
        ]
      },
      {
        "q": "She is not ___ (tall) as her sister.",
        "hint": "not as … as",
        "a": [
          "as tall"
        ]
      },
      {
        "q": "This film is ___ (interesting) as that one.",
        "hint": "as … as (uzun sıfat)",
        "a": [
          "as interesting"
        ]
      },
      {
        "q": "He runs ___ (fast) as me.",
        "hint": "as … as",
        "a": [
          "as fast"
        ]
      },
      {
        "q": "Our house is ___ (big) as theirs.",
        "hint": "as … as",
        "a": [
          "as big"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She is not ___ (tall) as her sister.",
        "options": [
          "as tall",
          "as heavy",
          "as interesting",
          "as fast"
        ],
        "a": 0
      },
      {
        "q": "This film is ___ (interesting) as that one.",
        "options": [
          "as interesting",
          "as heavy",
          "as tall",
          "as fast"
        ],
        "a": 0
      },
      {
        "q": "He runs ___ (fast) as me.",
        "options": [
          "as fast",
          "as heavy",
          "as tall",
          "as interesting"
        ],
        "a": 0
      },
      {
        "q": "Our house is ___ (big) as theirs.",
        "options": [
          "as big",
          "as heavy",
          "as tall",
          "as interesting"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-13",
    "title": "Gelecek: will (tahmin ve teklif)",
    "short": "will / won't",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "will + fiil yalın; her öznede değişmez:\n\n> I will help you. / She will win.\n\nKısa: 'll → I'll call you."
      },
      {
        "h": "Tahminler",
        "b": "Gelecek hakkında tahmin:\n\n> I think it will rain.\n> Maybe he'll be late.\n\nGenelde I think, maybe, probably ile kullanılır."
      },
      {
        "h": "Karar ve teklif",
        "b": "Anlık karar / teklif:\n\n> The phone is ringing. I'll answer it.\n> I'll carry that bag for you.\n\nOlumsuz: won't (will not)."
      }
    ],
    "mistakes": [
      {
        "w": "I will to help you.",
        "r": "I will help you.",
        "n": "will sonrası fiil yalın."
      },
      {
        "w": "She will helps us.",
        "r": "She will help us.",
        "n": "will sonrası fiil yalın; -s eklenmez."
      },
      {
        "w": "He won't coming.",
        "r": "He won't come.",
        "n": "won't sonrası fiil yalın."
      }
    ],
    "practice": [
      {
        "q": "I think it ___ rain tomorrow.",
        "hint": "will / won't",
        "a": [
          "will"
        ]
      },
      {
        "q": "Don't worry, I ___ help you.",
        "hint": "anlık teklif",
        "a": [
          "will",
          "'ll"
        ]
      },
      {
        "q": "She ___ (not/come) to the party.",
        "hint": "olumsuz",
        "a": [
          "won't come",
          "will not come"
        ]
      },
      {
        "q": "Maybe we ___ have time later.",
        "hint": "will",
        "a": [
          "will",
          "'ll"
        ]
      },
      {
        "q": "___ you open the window, please?",
        "hint": "ricada bulunma",
        "a": [
          "will"
        ]
      }
    ],
    "mcq": [
      {
        "q": "Don't worry, I ___ help you.",
        "options": [
          "will",
          "won't come",
          "is",
          "are"
        ],
        "a": 0
      },
      {
        "q": "She ___ (not/come) to the party.",
        "options": [
          "won't come",
          "will",
          "will",
          "will"
        ],
        "a": 0
      },
      {
        "q": "Maybe we ___ have time later.",
        "options": [
          "will",
          "won't come",
          "is",
          "are"
        ],
        "a": 0
      },
      {
        "q": "___ you open the window, please?",
        "options": [
          "will",
          "won't come",
          "is",
          "are"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-14",
    "title": "Şimdiki Zaman ile Gelecek Planları",
    "short": "am/is/are + -ing (plan)",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "Present Continuous (am/is/are + -ing) planlanmış gelecek için:\n\n> I'm meeting my friend tomorrow.\n> We're leaving at 8 o'clock."
      },
      {
        "h": "Kullanım",
        "b": "Genelde zaman belirtilir (tomorrow, next week, on Friday):\n\n> She is flying to İzmir next week.\n> They are having dinner with us on Sunday."
      },
      {
        "h": "Fark",
        "b": "going to = niyet, Present Continuous = kesinleşmiş program:\n\n> I'm going to visit. (niyet)\n> I'm meeting the doctor at 3. (program)"
      }
    ],
    "mistakes": [
      {
        "w": "I am meet my friend tomorrow.",
        "r": "I am meeting my friend tomorrow.",
        "n": "am/is/are + -ing gerekli."
      },
      {
        "w": "She is fly to Ankara next week.",
        "r": "She is flying to Ankara next week.",
        "n": "fly → flying."
      },
      {
        "w": "We are seeing them on Friday?",
        "r": "Are we seeing them on Friday?",
        "n": "Soru: Am/Is/Are öznenin önüne."
      }
    ],
    "practice": [
      {
        "q": "I ___ my cousin on Saturday.",
        "hint": "visit (program)",
        "a": [
          "am visiting",
          "'m visiting"
        ]
      },
      {
        "q": "She ___ to İzmir tomorrow.",
        "hint": "fly (plan)",
        "a": [
          "is flying",
          "'s flying"
        ]
      },
      {
        "q": "We ___ dinner at 8 tonight.",
        "hint": "have (program)",
        "a": [
          "are having",
          "'re having"
        ]
      },
      {
        "q": "They ___ here next week.",
        "hint": "come (plan)",
        "a": [
          "are coming"
        ]
      },
      {
        "q": "He ___ his boss on Monday.",
        "hint": "meet (plan)",
        "a": [
          "is meeting",
          "'s meeting"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ to İzmir tomorrow.",
        "options": [
          "is flying",
          "am visiting",
          "are having",
          "are coming"
        ],
        "a": 0
      },
      {
        "q": "We ___ dinner at 8 tonight.",
        "options": [
          "are having",
          "am visiting",
          "is flying",
          "are coming"
        ],
        "a": 0
      },
      {
        "q": "They ___ here next week.",
        "options": [
          "are coming",
          "am visiting",
          "is flying",
          "are having"
        ],
        "a": 0
      },
      {
        "q": "He ___ his boss on Monday.",
        "options": [
          "is meeting",
          "am visiting",
          "is flying",
          "are having"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-15",
    "title": "Zorunluluk: must / have to",
    "short": "must / mustn't / have to",
    "slides": [
      {
        "h": "must & have to",
        "b": "Zorunluluk:\n\n> You must wear a helmet. (kural)\n> I have to get up early. (dış zorunluluk)\n\nmust üçüncü tekilde değişmez: he must."
      },
      {
        "h": "mustn't",
        "b": "mustn't = YASAK / izin yok:\n\n> You mustn't smoke here.\n> You mustn't use your phone in class."
      },
      {
        "h": "don't have to",
        "b": "don't have to = ZORUNLU DEĞİL (gerek yok):\n\n> You don't have to come early.\n\nDikkat: mustn't = yasak; don't have to = gerek yok."
      }
    ],
    "mistakes": [
      {
        "w": "You mustn't to go.",
        "r": "You mustn't go.",
        "n": "must sonrası fiil yalın."
      },
      {
        "w": "He musts study.",
        "r": "He must study.",
        "n": "must -s almaz, değişmez."
      },
      {
        "w": "You mustn't come early if you want. (gerek yok)",
        "r": "You don't have to come early if you want.",
        "n": "Gerek yok → don't have to; mustn't = yasak."
      }
    ],
    "practice": [
      {
        "q": "You ___ wear a seatbelt. (kural)",
        "hint": "must / have to",
        "a": [
          "must",
          "have to"
        ]
      },
      {
        "q": "He ___ (not) smoke in the hospital. (yasak)",
        "hint": "must not",
        "a": [
          "mustn't",
          "must not"
        ]
      },
      {
        "q": "You ___ (not) pay now. You can pay later.",
        "hint": "gerek yok",
        "a": [
          "don't have to"
        ]
      },
      {
        "q": "I ___ finish this report today. (zorunluluk)",
        "hint": "have to",
        "a": [
          "have to"
        ]
      },
      {
        "q": "Students ___ (not) cheat on exams. (yasak)",
        "hint": "must not",
        "a": [
          "mustn't",
          "must not"
        ]
      }
    ],
    "mcq": [
      {
        "q": "He ___ (not) smoke in the hospital. (yasak)",
        "options": [
          "mustn't",
          "must",
          "don't have to",
          "have to"
        ],
        "a": 0
      },
      {
        "q": "You ___ (not) pay now. You can pay later.",
        "options": [
          "don't have to",
          "must",
          "mustn't",
          "have to"
        ],
        "a": 0
      },
      {
        "q": "I ___ finish this report today. (zorunluluk)",
        "options": [
          "have to",
          "must",
          "mustn't",
          "don't have to"
        ],
        "a": 0
      },
      {
        "q": "Students ___ (not) cheat on exams. (yasak)",
        "options": [
          "mustn't",
          "must",
          "don't have to",
          "have to"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-16",
    "title": "Öneri: should / shouldn't",
    "short": "tavsiye",
    "slides": [
      {
        "h": "Tavsiye",
        "b": "should + fiil yalın = 'yapmalısın' (tavsiye):\n\n> You should drink more water.\n> You should sleep early."
      },
      {
        "h": "shouldn't",
        "b": "shouldn't = 'yapmamalısın':\n\n> You shouldn't eat too much sugar.\n> He shouldn't drive so fast."
      },
      {
        "h": "Soru",
        "b": "Should I …? (tavsiye sorma):\n\n> Should I call him?\n> What should we do?"
      }
    ],
    "mistakes": [
      {
        "w": "You should to study.",
        "r": "You should study.",
        "n": "should sonrası fiil yalın."
      },
      {
        "w": "She shoulds go.",
        "r": "She should go.",
        "n": "should değişmez, -s almaz."
      },
      {
        "w": "You shouldn't to worry.",
        "r": "You shouldn't worry.",
        "n": "shouldn't sonrası fiil yalın."
      }
    ],
    "practice": [
      {
        "q": "You ___ drink more water. (tavsiye)",
        "hint": "should / shouldn't",
        "a": [
          "should"
        ]
      },
      {
        "q": "He ___ study for the exam.",
        "hint": "should",
        "a": [
          "should"
        ]
      },
      {
        "q": "You ___ (not) worry about it.",
        "hint": "olumsuz tavsiye",
        "a": [
          "shouldn't",
          "should not"
        ]
      },
      {
        "q": "___ I call the doctor?",
        "hint": "tavsiye sorusu",
        "a": [
          "should"
        ]
      },
      {
        "q": "We ___ eat more vegetables.",
        "hint": "should",
        "a": [
          "should"
        ]
      }
    ],
    "mcq": [
      {
        "q": "He ___ study for the exam.",
        "options": [
          "should",
          "shouldn't",
          "is",
          "are"
        ],
        "a": 0
      },
      {
        "q": "You ___ (not) worry about it.",
        "options": [
          "shouldn't",
          "should",
          "should",
          "should"
        ],
        "a": 0
      },
      {
        "q": "___ I call the doctor?",
        "options": [
          "should",
          "shouldn't",
          "is",
          "are"
        ],
        "a": 0
      },
      {
        "q": "We ___ eat more vegetables.",
        "options": [
          "should",
          "shouldn't",
          "is",
          "are"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-17",
    "title": "Geçmişte Yetenek: could / couldn't",
    "short": "could / couldn't",
    "slides": [
      {
        "h": "Geçmişte yetenek",
        "b": "could + fiil yalın = geçmişte yapabilmek:\n\n> I could swim when I was five.\n> She could speak English as a child."
      },
      {
        "h": "couldn't",
        "b": "couldn't = geçmişte yapamamak:\n\n> I couldn't understand the film.\n> He couldn't find his keys."
      },
      {
        "h": "Dikkat",
        "b": "could değişmez (-s almaz), sonrası fiil yalın:\n\nYanlış: He could swims / could to swim.\nDoğru: He could swim.\n\nKibar rica: Could you help me?"
      }
    ],
    "mistakes": [
      {
        "w": "I could to swim.",
        "r": "I could swim.",
        "n": "could sonrası fiil yalın."
      },
      {
        "w": "She coulds run fast.",
        "r": "She could run fast.",
        "n": "could değişmez, -s almaz."
      },
      {
        "w": "He couldn't came.",
        "r": "He couldn't come.",
        "n": "couldn't sonrası fiil yalın."
      }
    ],
    "practice": [
      {
        "q": "I ___ swim when I was six.",
        "hint": "geçmişte yetenek",
        "a": [
          "could"
        ]
      },
      {
        "q": "She ___ (not) find her phone this morning.",
        "hint": "couldn't",
        "a": [
          "couldn't",
          "could not"
        ]
      },
      {
        "q": "___ you help me carry this?",
        "hint": "kibar rica",
        "a": [
          "could"
        ]
      },
      {
        "q": "When I was young, I ___ run very fast.",
        "hint": "could",
        "a": [
          "could"
        ]
      },
      {
        "q": "We ___ (not) sleep last night.",
        "hint": "couldn't",
        "a": [
          "couldn't",
          "could not"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She ___ (not) find her phone this morning.",
        "options": [
          "couldn't",
          "could",
          "could",
          "could"
        ],
        "a": 0
      },
      {
        "q": "___ you help me carry this?",
        "options": [
          "could",
          "couldn't",
          "couldn't",
          "is"
        ],
        "a": 0
      },
      {
        "q": "When I was young, I ___ run very fast.",
        "options": [
          "could",
          "couldn't",
          "couldn't",
          "is"
        ],
        "a": 0
      },
      {
        "q": "We ___ (not) sleep last night.",
        "options": [
          "couldn't",
          "could",
          "could",
          "could"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-18",
    "title": "Past Continuous",
    "short": "was/were + -ing",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "was/were + fiil-ing = geçmişte belirli anda süren eylem:\n\n> I was reading at 9 pm.\n> They were watching TV."
      },
      {
        "h": "Kullanım",
        "b": "Geçmişte bir olay sırasında süren eylem:\n\n> While I was cooking, the phone rang.\n> I was sleeping when you called."
      },
      {
        "h": "Zaman zarfları",
        "b": "at that moment, at 8 o'clock, while:\n\n> She was working at 8.\n> They were playing while it rained."
      }
    ],
    "mistakes": [
      {
        "w": "I was work at 8.",
        "r": "I was working at 8.",
        "n": "was/were + -ing gerekli."
      },
      {
        "w": "They was playing football.",
        "r": "They were playing football.",
        "n": "çoğul → were."
      },
      {
        "w": "While I cook, the phone rang.",
        "r": "While I was cooking, the phone rang.",
        "n": "süren eylem için past continuous."
      }
    ],
    "practice": [
      {
        "q": "He ___ TV when I arrived.",
        "hint": "watch (süren)",
        "a": [
          "was watching"
        ]
      },
      {
        "q": "They ___ dinner at 8.",
        "hint": "have",
        "a": [
          "were having"
        ]
      },
      {
        "q": "I ___ (not/listen) when she spoke.",
        "hint": "olumsuz",
        "a": [
          "wasn't listening",
          "was not listening"
        ]
      },
      {
        "q": "While she ___ a book, the baby cried.",
        "hint": "read (süren)",
        "a": [
          "was reading"
        ]
      },
      {
        "q": "We ___ football when it started to rain.",
        "hint": "play (-ing)",
        "a": [
          "were playing"
        ]
      }
    ],
    "mcq": [
      {
        "q": "They ___ dinner at 8.",
        "options": [
          "were having",
          "was watching",
          "wasn't listening",
          "was reading"
        ],
        "a": 0
      },
      {
        "q": "I ___ (not/listen) when she spoke.",
        "options": [
          "wasn't listening",
          "was watching",
          "were having",
          "was reading"
        ],
        "a": 0
      },
      {
        "q": "While she ___ a book, the baby cried.",
        "options": [
          "was reading",
          "was watching",
          "were having",
          "wasn't listening"
        ],
        "a": 0
      },
      {
        "q": "We ___ football when it started to rain.",
        "options": [
          "were playing",
          "was watching",
          "were having",
          "wasn't listening"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-19",
    "title": "Dönüşlü Zamirler",
    "short": "myself / yourself / …",
    "slides": [
      {
        "h": "Kuruluş",
        "b": "Özne kendine dönükse dönüşlü zamir:\n\n> I → myself, you → yourself\n> he → himself, she → herself, it → itself\n> we → ourselves, you (çoğul) → yourselves, they → themselves"
      },
      {
        "h": "Kullanım",
        "b": "> I cut myself.\n> She looked at herself in the mirror.\n> Be careful! Don't hurt yourself."
      },
      {
        "h": "Dikkat",
        "b": "by myself = 'tek başıma':\n\n> I live by myself.\n\nGünlük fiillerde her zaman gerekmez:\n> I got dressed. (dressed enough)"
      }
    ],
    "mistakes": [
      {
        "w": "I made this by meself.",
        "r": "I made this by myself.",
        "n": "I → myself."
      },
      {
        "w": "She hurt themselves.",
        "r": "She hurt herself.",
        "n": "she → herself (tekil)."
      },
      {
        "w": "We enjoyed ourself.",
        "r": "We enjoyed ourselves.",
        "n": "we → ourselves."
      }
    ],
    "practice": [
      {
        "q": "I cut ___ while cooking.",
        "hint": "I → dönüşlü",
        "a": [
          "myself"
        ]
      },
      {
        "q": "She looked at ___ in the mirror.",
        "hint": "she → dönüşlü",
        "a": [
          "herself"
        ]
      },
      {
        "q": "They built the house by ___.",
        "hint": "they → dönüşlü",
        "a": [
          "themselves"
        ]
      },
      {
        "q": "He taught ___ to play the piano.",
        "hint": "he → dönüşlü",
        "a": [
          "himself"
        ]
      },
      {
        "q": "We enjoyed ___ at the party.",
        "hint": "we → dönüşlü",
        "a": [
          "ourselves"
        ]
      }
    ],
    "mcq": [
      {
        "q": "She looked at ___ in the mirror.",
        "options": [
          "herself",
          "myself",
          "themselves",
          "himself"
        ],
        "a": 0
      },
      {
        "q": "They built the house by ___.",
        "options": [
          "themselves",
          "myself",
          "herself",
          "himself"
        ],
        "a": 0
      },
      {
        "q": "He taught ___ to play the piano.",
        "options": [
          "himself",
          "myself",
          "herself",
          "themselves"
        ],
        "a": 0
      },
      {
        "q": "We enjoyed ___ at the party.",
        "options": [
          "ourselves",
          "myself",
          "herself",
          "themselves"
        ],
        "a": 0
      }
    ]
  },
  {
    "id": "a2-20",
    "title": "Koşul Cümleleri: Zero & First",
    "short": "if / when",
    "slides": [
      {
        "h": "Zero conditional",
        "b": "Genel gerçekler: if + geniş zaman, geniş zaman:\n\n> If you heat ice, it melts.\n> If I drink coffee at night, I can't sleep."
      },
      {
        "h": "First conditional",
        "b": "Gerçekleşme ihtimali olan gelecek: if + geniş zaman, will/may:\n\n> If it rains, we will stay home.\n> If you study hard, you will pass."
      },
      {
        "h": "Dikkat",
        "b": "if'li cümlede will kullanılmaz; gelecek ana cümlede olur:\n\nYanlış: If it will rain …\nDoğru: If it rains, … we will stay home."
      }
    ],
    "mistakes": [
      {
        "w": "If it will rain, we stay home.",
        "r": "If it rains, we will stay home.",
        "n": "if'li tarafta will olmaz."
      },
      {
        "w": "If you heat ice, it will melts.",
        "r": "If you heat ice, it melts.",
        "n": "zero conditional → iki geniş zaman."
      },
      {
        "w": "If she comes, I will happy.",
        "r": "If she comes, I will be happy.",
        "n": "will sonrası fiil (be) gerekli."
      }
    ],
    "practice": [
      {
        "q": "If you ___ water to 100 degrees, it boils.",
        "hint": "heat (zero)",
        "a": [
          "heat"
        ]
      },
      {
        "q": "If I ___ late, my teacher gets angry.",
        "hint": "be (zero)",
        "a": [
          "am"
        ]
      },
      {
        "q": "If it ___ tomorrow, we will stay home.",
        "hint": "rain (first)",
        "a": [
          "rains"
        ]
      },
      {
        "q": "If you study hard, you ___ pass the exam.",
        "hint": "first conditional",
        "a": [
          "will"
        ]
      },
      {
        "q": "If she ___ , we will call you.",
        "hint": "come (first)",
        "a": [
          "comes"
        ]
      }
    ],
    "mcq": [
      {
        "q": "If I ___ late, my teacher gets angry.",
        "options": [
          "am",
          "heat",
          "rains",
          "will"
        ],
        "a": 0
      },
      {
        "q": "If it ___ tomorrow, we will stay home.",
        "options": [
          "rains",
          "heat",
          "am",
          "will"
        ],
        "a": 0
      },
      {
        "q": "If you study hard, you ___ pass the exam.",
        "options": [
          "will",
          "heat",
          "am",
          "rains"
        ],
        "a": 0
      },
      {
        "q": "If she ___ , we will call you.",
        "options": [
          "comes",
          "heat",
          "am",
          "rains"
        ],
        "a": 0
      }
    ]
  }
]
};
