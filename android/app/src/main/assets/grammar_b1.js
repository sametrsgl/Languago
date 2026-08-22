/* Languago — Dilbilgisi B1 (Orta) */
window.GRAMMAR_B1 = {
  id: "b1",
  title: "B1 · Orta",
  subtitle: "Orta seviye dilbilgisi",
  color: "#3B82F6",
  units: [
    {
      id: "b1-01",
      title: "Present Perfect (for / since)",
      short: "have/has + 3. hal",
      slides: [
        { h: "Yapı ve Kuruluş", b: "have/has + fiil 3. hali (past participle)\n\n> I have lived here for years.\n> She has worked here since 2020.\n> They have just finished.\n> We have never been to London.\n\n! have/has özneye göre değişir:\nI/You/We/They → have\nHe/She/It → has" },
        { h: "for / since", b: "for → süre (for 5 years, for a week, for 3 months)\nsince → başlangıç noktası (since 2020, since Monday, since last week)\n\n> I have lived here for 5 years.\n> She has worked here since 2020.\n> They have been married for 10 years.\n\n! NOT: for/since'tan sonra zaman ifadesi gelir, fiil değil!" },
        { h: "Düzensiz Fiillerin 3. Hali", b: "Present perfect için unbilinen 3. haller:\n\n> go → went → gone\n> see → saw → seen\n> eat → ate → eaten\n> be → was/were → been\n> have → had → had\n\n> write → wrote → written\n> speak → spoke → spoken\n> break → broke → broken\n> choose → chose → chosen\n> drink → drank → drunk" }
      ],
      mistakes: [
        { w: "I have went there.", r: "I have gone there.", n: "go'nun 3. hali gone." },
        { w: "She has go home.", r: "She has gone home.", n: "have/has + 3. hal." },
        { w: "I work here since 2019.", r: "I have worked here since 2019.", n: "since ile present perfect kullanılır." }
      ],
      mcq: [
        { q: "She ___ in this city since 2015.", options: ["has lived", "have lived", "lives", "is living"], a: 0 },
        { q: "We have known each other ___ ten years.", options: ["since", "for", "ago", "during"], a: 1 },
        { q: "Choose the correct sentence:", options: ["I have went to Paris.", "I have gone to Paris.", "I has gone to Paris.", "I have go to Paris."], a: 1 },
        { q: "He ___ for two hours already.", options: ["has been waiting", "have been waiting", "waits", "is waiting"], a: 0 },
        { q: "They have lived here ___ last March.", options: ["for", "since", "from", "until"], a: 1 }
      ],
      practice: [
        { q: "I ___ here for 5 years.", hint: "live", a: ["have lived"] },
        { q: "She ___ here since 2020.", hint: "work", a: ["has worked"] },
        { q: "We ___ (not/see) him for ages.", hint: "see (olumsuz)", a: ["haven't seen", "have not seen"] },
        { q: "He ___ home.", hint: "go (present perfect)", a: ["has gone"] },
        { q: "I ___ (never/be) to London.", hint: "be", a: ["have never been"] }
      ]
    },
    {
      id: "b1-02",
      title: "Present Perfect vs Past Simple",
      short: "zaman ayrımı",
      slides: [
        { h: "Temel Fark", b: "Past Simple → bitmiş, belirli zaman.\nPresent Perfect → geçmişte olmuş, şimdiyle bağlantılı.\n\n> I saw him yesterday. (belirli zaman)\n> I have seen him before. (tecrübe)\n\n> She graduated in 2010. (bitti, belirli tarih)\n> She has graduated. (mezun oldu, ne zaman bilinmiyor)" },
        { h: "Zaman Zarfları", b: "Past Simple zamanlar:\n> yesterday, last week, last year, in 2010, ago, when...\n\nPresent Perfect zamanlar:\n> ever, never, just, already, yet, for, since, recently, before, never" },
        { h: "Kullanım Alanları", b: "Present Perfect için:\n\n1. Hayat tecrübesi:\n> I have never been to Paris.\n\n2. Henüz bitmemiş zaman (with 'yet'):\n> I have just eaten. (Az önce yedim)\n\n3. Sonucu bugün görünen:\n> I have lost my keys. (Şu anda yok)\n\n4. 'for' / 'since' ile:\n> I have lived here for 5 years." }
      ],
      mistakes: [
        { w: "I have seen him yesterday.", r: "I saw him yesterday.", n: "yesterday belirli zaman → past simple." },
        { w: "I saw him before.", r: "I have seen him before.", n: "before tecrübe → present perfect." },
        { w: "She has finished it last week.", r: "She finished it last week.", n: "last week → past simple." }
      ],
      mcq: [
        { q: "I ___ him yesterday at the station.", options: ["have seen", "saw", "have saw", "seen"], a: 1 },
        { q: "She ___ her keys, so she cannot open the door now.", options: ["lost", "has lost", "loses", "was losing"], a: 1 },
        { q: "Select the correct sentence:", options: ["I have seen him yesterday.", "I saw him before.", "I have never been to London.", "They have finished it last week."], a: 2 },
        { q: "We ___ to Italy last summer.", options: ["have gone", "went", "go", "have went"], a: 1 },
        { q: "___ you ever eaten sushi?", options: ["Did", "Have", "Do", "Was"], a: 1 }
      ],
      practice: [
        { q: "I ___ him yesterday.", hint: "see (geçmiş)", a: ["saw"] },
        { q: "I ___ (never/see) him before.", hint: "see", a: ["have never seen"] },
        { q: "She ___ (already/finish) her homework.", hint: "finish", a: ["has already finished"] },
        { q: "They ___ to Paris last year.", hint: "go (geçmiş)", a: ["went"] },
        { q: "I ___ (just/eat).", hint: "eat", a: ["have just eaten"] }
      ]
    },
    {
      id: "b1-03",
      title: "will / going to",
      short: "gelecek zamanlar",
      slides: [
        { h: "will Kullanımı", b: "Anlık kararlar ve tahminlerde:\n\n> I'll help you. (anlık karar)\n> I think it will rain. (tahmin)\n> Don't worry, I'll call you later.\n\n! will genellikle 'I think', 'probably', 'maybe' gibi tahmin sözcüklerinden sonra gelir." },
        { h: "going to Kullanımı", b: "Önceden planlanmış niyetlerde ve görülür kanıtlı tahminde:\n\n> I am going to travel to Paris. (plan)\n> We are going to buy a house.\n> Look at the clouds! It's going to rain. (görsel kanıt)\n> That vase is going to fall! (fiziksel tehlike)" },
        { h: "will vs going to", b: "> plan → going to\n> anlık karar/tahmin → will\n> kanıtlı tahmin → going to\n\n> will: I'll do it! (karar verdikten hemen sonra)\n> going to: I'm going to study medicine. (önceden plan)" }
      ],
      mistakes: [
        { w: "I will going to travel.", r: "I am going to travel.", n: "İkisi birlikte kullanılmaz." },
        { w: "Look! It will rain.", r: "Look! It's going to rain.", n: "Kanıt varsa going to." },
        { w: "I going to help you.", r: "I am going to help you.", n: "am/is/are gerekli." }
      ],
      mcq: [
        { q: "I think it ___ tomorrow.", options: ["will", "will rain", "is going to", "has"], a: 0 },
        { q: "I ___ to Paris next month.", options: ["am going to travel", "'m going to travel", "going to travel", "is going to travel"], a: 0 },
        { q: "Don't worry, I ___ you.", options: ["will help", "will", "do", "am"], a: 0 },
        { q: "She ___ a baby.", options: ["is going to have", "'s going to have", "will have", "is going to has"], a: 0 },
        { q: "Select the correct sentence:", options: ["I am going to help you.", "I will going to help you.", "I going to help you.", "I will to help you."], a: 0 }
      ],
      practice: [
        { q: "I think it ___ tomorrow.", hint: "rain (tahmin)", a: ["will rain"] },
        { q: "I ___ to Paris next month.", hint: "travel (plan)", a: ["am going to travel", "'m going to travel"] },
        { q: "Don't worry, I ___ you.", hint: "help (anlık karar)", a: ["will help"] },
        { q: "She ___ a baby.", hint: "have (kanıtlı)", a: ["is going to have", "'s going to have"] }
      ]
    },
    {
      id: "b1-04",
      title: "Past Continuous",
      short: "was/were + -ing",
      slides: [
        { h: "Yapı", b: "was/were + fiil-ing\n\n> I was watching TV.\n> She was sleeping.\n> They were playing.\n\n> We were having dinner.\n> He was working." },
        { h: "Kullanım", b: "Geçmişte belirli bir anda devam eden eylem:\n\n> At 8pm I was watching TV.\n> When she called, I was cooking.\n> This time yesterday I was flying to London.\n\nArka planda iki eylem varsa:\n> While she was reading, I was cooking." },
        { h: "was / were", b: "I/he/she/it → was\nYou/we/they → were\n\n> He was sleeping. (tekil)\n> They were eating. (çoğul)\n> I was tired. (I = was)\n> You were late. (you = were)" }
      ],
      mistakes: [
        { w: "I was watch TV.", r: "I was watching TV.", n: "Fiil -ing alır." },
        { w: "They was playing.", r: "They were playing.", n: "Çoğul için were." },
        { w: "She were sleeping.", r: "She was sleeping.", n: "Tekil için was." }
      ],
      mcq: [
        { q: "At 8 pm last night, I ___ dinner with my family.", options: ["ate", "was eating", "have eaten", "eat"], a: 1 },
        { q: "They ___ football when it started to rain.", options: ["played", "were playing", "play", "have played"], a: 1 },
        { q: "She ___ her homework when I called her.", options: ["was doing", "did", "does", "has done"], a: 0 },
        { q: "While we ___ home, we saw a deer.", options: ["walked", "were walking", "walk", "have walked"], a: 1 },
        { q: "Select the correct sentence:", options: ["I was watch TV.", "They was playing.", "He were sleeping.", "We were eating."], a: 3 }
      ],
      practice: [
        { q: "I ___ TV at 8pm.", hint: "watch", a: ["was watching"] },
        { q: "They ___ football.", hint: "play", a: ["were playing"] },
        { q: "She ___ when I called.", hint: "sleep", a: ["was sleeping"] },
        { q: "We ___ dinner.", hint: "eat", a: ["were eating"] },
        { q: "He ___ his car.", hint: "wash", a: ["was washing"] }
      ]
    },
    {
      id: "b1-05",
      title: "Koşul Tip 1 (First Conditional)",
      short: "If + present, will",
      slides: [
        { h: "Yapı", b: "If + present simple, will + fiil\n\n> If it rains, I will stay home.\n> If you study, you will pass.\n> If she comes, we will be happy.\n\n! if cümlesinde will KULLANILMAZ!\n> If it will rain, I will stay. (✗)\n> If it rains, I will stay. (✓)" },
        { h: "Anlam", b: "OLASILIK — gerçek ya da büyük ihtimalle gerçekleşecek durum:\n\n> If it rains tomorrow, I'll take an umbrella.\n> If you don't hurry, you'll miss the train.\n> If he studies hard, he will pass the exam.", },
        { h: "Soru ve Olumsuz", b: "Soru:\n> Will she come if she is free?\n> Will you help me if I ask?\n\nOlumsuz:\n> If you don't hurry, you'll miss the bus.\n> I won't go if it rains."
      }
      ],
      mistakes: [
        { w: "If it will rain, I will stay.", r: "If it rains, I will stay.", n: "if sonrası present simple." },
        { w: "If I will have money, I will buy it.", r: "If I have money, I will buy it.", n: "if sonrası will yok." },
        { w: "If she comes, she is happy.", r: "If she comes, she will be happy.", n: "Sonuç cümlesi will alır." }
      ],
      mcq: [
        { q: "If it ___ tomorrow, we will stay at home.", options: ["rains", "will rain", "rained", "rain"], a: 0 },
        { q: "You will pass the exam if you ___ hard.", options: ["will study", "study", "studied", "would study"], a: 1 },
        { q: "If she ___ me, I will call her back.", options: ["will call", "calls", "called", "would call"], a: 1 },
        { q: "I will buy the car if I ___ enough money.", options: ["have", "will have", "had", "would have"], a: 0 },
        { q: "What ___ you do if the weather is bad?", options: ["will", "would", "did", "are"], a: 0 }
      ],
      practice: [
        { q: "If it ___ , I will stay home.", hint: "rain", a: ["rains"] },
        { q: "If she ___ , we will be happy.", hint: "come", a: ["comes"] },
        { q: "You will pass if you ___ .", hint: "study", a: ["study"] },
        { q: "I will call you if I ___ time.", hint: "have", a: ["have"] },
        { q: "If he ___ hard, he will succeed.", hint: "work", a: ["works"] }
      ]
    },
    {
      id: "b1-06",
      title: "Koşul Tip 2 (Second Conditional)",
      short: "If + past, would",
      slides: [
        { h: "Yapı", b: "If + past simple, would + fiil\n\n> If I were rich, I would travel the world.\n> If I had a car, I would drive to work.\n> If she weren't busy, she would come.\n\n! Gerçek dışı / hayali: şu anda doğru değil ama düşünüyoruz." },
        { h: "Anlam", b: "Şu anda gerçek olmayan durumlar:\n\n> If I had a dog, I would be happy.\n> If I spoke French, I would visit France.\n> If she weren't tired, she would keep working.", },
        { h: "were Kullanımı", b: "Tip 2'de I/he/she/it için 'were' kullanılabilir (daha resmi):\n\n> If I were you... (Senin yerinde olsam)\n> If he were taller, he would play basketball.\n\n! Günlük hayatta 'was' da kabul edilir ama 'were' daha doğrudur."
      }
      ],
      mistakes: [
        { w: "If I have money, I would buy it.", r: "If I had money, I would buy it.", n: "İkinci koşulda past simple." },
        { w: "If I was rich, I will travel.", r: "If I was rich, I would travel.", n: "Sonuç would alır." },
        { w: "If I won, I will buy a house.", r: "If I won, I would buy a house.", n: "would kullanılır." }
      ],
      mcq: [
        { q: "If I ___ rich, I would travel the world.", options: ["am", "were", "will be", "have been"], a: 1 },
        { q: "If she ___ a car, she would drive to work.", options: ["have", "had", "will have", "would have"], a: 1 },
        { q: "If I were you, I ___ that job.", options: ["took", "would take", "take", "will take"], a: 1 },
        { q: "He would come to the party if he ___ enough time.", options: ["has", "had", "will have", "would have"], a: 1 },
        { q: "If they ___ more careful, they would not make so many mistakes.", options: ["were", "are", "will be", "have been"], a: 2 }
      ],
      practice: [
        { q: "If I ___ rich, I would travel.", hint: "be", a: ["were", "was"] },
        { q: "If she ___ a car, she would drive.", hint: "have", a: ["had"] },
        { q: "I would buy a house if I ___ the lottery.", hint: "win", a: ["won"] },
        { q: "If I ___ you, I would apologize.", hint: "be", a: ["were"] },
        { q: "He would come if he ___ time.", hint: "have", a: ["had"] }
      ]
    },
    {
      id: "b1-07",
      title: "Relative Cümleler (who/which/that)",
      short: "ilgi zamirleri",
      slides: [
        { h: "who / which / that", b: "who → insanlar:\n> The man who lives next door is my uncle.\n\nwhich → nesneler/hayvanlar:\n> The book which I read was good.\n\nthat → insanlar VE nesneler (resmi olmayan dil):\n> The woman who/that called is my aunt.\n> The car which/that I bought is red." },
        { h: "Kullanım", b: "İsimleri tanımlayan yan cümleler kurar:\n\n> The woman who called you is my aunt.\n> This is the car that I bought.\n> The house which was built in 1990 is beautiful.", },
        { h: "Dikkat Edin!", b: "> who insan için, which nesne.\n> that resmi olmayan durumlarda her ikisinin yerine geçebilir.\n> Who/which/that bazen omit edilir (especially in speech):\n> The man (who) I saw was tall."
      }
      ],
      mistakes: [
        { w: "The man which is there is my father.", r: "The man who is there is my father.", n: "İnsan için who." },
        { w: "The book who I read was good.", r: "The book which I read was good.", n: "Nesne için which/that." },
        { w: "She is the teacher which helped me.", r: "She is the teacher who helped me.", n: "İnsan için who." }
      ],
      mcq: [
        { q: "The woman ___ lives next door is kind.", options: ["which", "who", "whose", "where"], a: 1 },
        { q: "The car ___ I bought is fast.", options: ["who", "which", "whose", "whom"], a: 1 },
        { q: "He is the man ___ helped me.", options: ["which", "who", "whose", "where"], a: 1 },
        { q: "I have a friend ___ mother is a famous singer.", options: ["which", "who", "whose", "where"], a: 2 },
        { q: "The house ___ we live in is very old.", options: ["who", "which", "whose", "whom"], a: 1 }
      ],
      practice: [
        { q: "The woman ___ lives next door is kind.", hint: "who / which", a: ["who", "that"] },
        { q: "The car ___ I bought is fast.", hint: "who / which", a: ["which", "that"] },
        { q: "He is the man ___ helped me.", hint: "who / which", a: ["who", "that"] },
        { q: "This is the house ___ I grew up in.", hint: "who / which", a: ["which", "that"] }
      ]
    },
    {
      id: "b1-08",
      title: "Edilgen Çatı (Present & Past)",
      short: "be + 3. hal",
      slides: [
        { h: "Yapı", b: "be + fiil 3. hali (past participle)\n\n> Present: The letter is sent.\n> Past: The letter was sent.\n> Present Perf: The work has been finished.\n> Future: The car will be sold."
      },
      { h: "Ne zaman kullanılır?", b: "Eylemi yapan değil, eylem önemliyse:\n\n> English is spoken here. (İngilizce burada konuşulur.)\n> The bridge was built in 1900. (Köprü 1900'de inşa edildi.)\n> My bike was stolen. (Markam çalındı! — kim yaptı önemli değil.)" },
        { h: "Aktif → Pasif", b: "Aktif: They send letters. → Pasif: Letters are sent.\nAktif: They sent letters. → Pasif: Letters were sent.\n\n> Active: The chef prepares the meal.\n> Passive: The meal is prepared by the chef.\n\n! by: Eylemi yapan belirtilirse by kullanılır.\n> The book was written by a famous author."
      }
      ],
      mistakes: [
        { w: "The letter was send.", r: "The letter was sent.", n: "send'in 3. hali sent." },
        { w: "The house is build here.", r: "The house is built here.", n: "build → built." },
        { w: "English is speak here.", r: "English is spoken here.", n: "speak → spoken." }
      ],
      mcq: [
        { q: "The letter ___ yesterday morning.", options: ["was sent", "was send", "is sent", "sent"], a: 0 },
        { q: "English ___ in many countries around the world.", options: ["is spoken", "is spoke", "speaks", "was spoken"], a: 0 },
        { q: "The bridge ___ over a hundred years ago.", options: ["is built", "was built", "builds", "was build"], a: 1 },
        { q: "These cars ___ in Germany every year.", options: ["are made", "were made", "are make", "make"], a: 0 },
        { q: "The window ___ by a careless boy during the game.", options: ["is broken", "was broken", "breaks", "was break"], a: 1 }
      ],
      practice: [
        { q: "The letter ___ yesterday.", hint: "send (pasif)", a: ["was sent"] },
        { q: "English ___ here.", hint: "speak (pasif)", a: ["is spoken"] },
        { q: "The bridge ___ in 1900.", hint: "build (pasif)", a: ["was built"] },
        { q: "These cars ___ in Germany.", hint: "make (pasif)", a: ["are made"] },
        { q: "The window ___ by Tom.", hint: "break (pasif, geçmiş)", a: ["was broken"] }
      ]
    },
    {
      id: "b1-09",
      title: "should / must / have to",
      short: "tavsiye ve zorunluluk",
      slides: [
        { h: "should", b: "Tavsiye için:\n\n> You should study more.\n> You shouldn't eat too much.\n> Should I go now?\n\n> I think you should see a doctor.\n> You should try this restaurant." },
        { h: "must / have to", b: "must → konuşmacının kendi zorunluluğu (içten):\n> I must call my mother.\n> I must lose weight.\n\nhave to → dış zorunluluk/kural:\n> I have to wear a uniform at work.\n> Students have to study hard.\n> You have to be 18 to vote.", },
        { h: "Olumsuz", b: "should not → shouldn't (tavsiye yok):\n> You shouldn't smoke.\n\nmust not → mustn't (yasak):\n> You must not smoke here.\n\ndon't have to (zorunluluk yok):\n> I don't have to go to work today."
      }
      ],
      mistakes: [
        { w: "You should to study.", r: "You should study.", n: "should sonrası fiil yalın." },
        { w: "He musts go.", r: "He must go.", n: "must değişmez." },
        { w: "She have to work.", r: "She has to work.", n: "3. tekil için has to." }
      ],
      mcq: [
        { q: "You look tired. You ___ go to bed early tonight.", options: ["must go to sleep", "should", "have to does", "musts"], a: 1 },
        { q: "She ___ wear a uniform at her school.", options: ["have to", "has to", "must to", "should to"], a: 1 },
        { q: "You ___ smoke here; it is forbidden.", options: ["must not", "don't have to", "should not to", "mustn't"], a: 0 },
        { q: "It is a rule that every student ___ bring an ID card.", options: ["must", "should", "has to does", "musts"], a: 0 },
        { q: "Select the correct sentence:", options: ["You should to study.", "He musts go.", "She has to work.", "I must to call."], a: 2 }
      ],
      practice: [
        { q: "You ___ study more.", hint: "should (tavsiye)", a: ["should"] },
        { q: "She ___ work tomorrow.", hint: "have to (zorunluluk)", a: ["has to"] },
        { q: "You ___ (not/smoke) here.", hint: "must (yasak)", a: ["mustn't", "must not"] },
        { q: "I ___ wear a uniform at work.", hint: "have to", a: ["have to"] },
        { q: "He ___ see a doctor.", hint: "should (tavsiye)", a: ["should"] }
      ]
    },
    {
      id: "b1-10",
      title: "Miktar Belirteçleri",
      short: "a few / a little / a lot of",
      slides: [
        { h: "a few / a little", b: "a few → sayılabilir (birkaç):\n> I have a few friends.\n> I have a few questions.\n\na little → sayılamaz (biraz):\n> I have a little money.\n> She has a little time.\n\n! NOT: 'a few' sayılabilir, 'a little' sayılamazdır!" },
        { h: "a lot of", b: "Her ikisiyle de kullanılır (özellikle olumlu):\n\n> a lot of books (sayılabilir)\n> a lot of water (sayılamaz)\n> I have a lot of friends.\n> We have a lot of time.", },
        { h: "some / any / no", b: "some → olumluda:\n> I have some money.\n> There are some students.\n\nany → olumsuzda/soruda:\n> Do you have any money?\n> I don't have any.\n\nno → none yerine:\n> There are no students. (= no students)"
      }
      ],
      mistakes: [
        { w: "I have a few water.", r: "I have a little water.", n: "Sayılamaz → a little." },
        { w: "There is a little books.", r: "There are a few books.", n: "Sayılabilir → a few." },
        { w: "I don't have some money.", r: "I don't have any money.", n: "Olumsuzda any." }
      ],
      mcq: [
        { q: "I only have ___ money, so I cannot buy the jacket.", options: ["a few", "a little", "many", "few"], a: 1 },
        { q: "She has ___ good friends, about five of them.", options: ["a few", "a little", "much", "little"], a: 0 },
        { q: "There are ___ people waiting outside the gate.", options: ["a lot of", "much", "a little", "is a lot"], a: 0 },
        { q: "Do you have ___ sugar for the tea?", options: ["some", "any", "much many", "few"], a: 1 },
        { q: "I bought ___ apples at the market.", options: ["some", "any", "little", "much"], a: 0 }
      ],
      practice: [
        { q: "I have ___ money.", hint: "biraz (sayılamaz)", a: ["a little"] },
        { q: "She has ___ friends.", hint: "birkaç (sayılabilir)", a: ["a few"] },
        { q: "There are ___ people here.", hint: "çok", a: ["a lot of", "many"] },
        { q: "Do you have ___ sugar?", hint: "some / any", a: ["any"] },
        { q: "I bought ___ apples.", hint: "some / any", a: ["some"] }
      ]
    }
  ]
};
