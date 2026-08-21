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
        { h: "Kuruluş", b: "have/has + fiil 3. hali (past participle)\n\n> I have lived here for years.\n> She has worked here since 2020." },
        { h: "for / since", b: "for → süre (for 5 years, for a week)\nsince → başlangıç noktası (since 2020, since Monday)" },
        { h: "Düzensiz fiillerin 3. hali", b: "> go → went → gone\n> see → saw → seen\n> eat → ate → eaten\n> be → was/were → been" }
      ],
      mistakes: [
        { w: "I have went there.", r: "I have gone there.", n: "go'nun 3. hali gone." },
        { w: "She has go home.", r: "She has gone home.", n: "have/has + 3. hal." },
        { w: "I work here since 2019.", r: "I have worked here since 2019.", n: "since ile present perfect kullanılır." }
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
        { h: "Temel fark", b: "Past Simple → bitmiş, belirli zaman.\nPresent Perfect → geçmişte olmuş, şimdiyle bağlantılı.\n\n> I saw him yesterday. (belirli zaman)\n> I have seen him before. (tecrübe)" },
        { h: "Zaman ifadeleri", b: "Past Simple: yesterday, last week, in 2010, ago\nPresent Perfect: ever, never, just, already, yet, for, since" },
        { h: "Kullanım alanları", b: "Present Perfect → hayat tecrübesi, henüz bitmemiş zaman, sonucu bugün görünen.\n\n> I have lost my keys. (şu an yok)" }
      ],
      mistakes: [
        { w: "I have seen him yesterday.", r: "I saw him yesterday.", n: "yesterday belirli zaman → past simple." },
        { w: "I saw him before.", r: "I have seen him before.", n: "before tecrübe → present perfect." },
        { w: "She has finished it last week.", r: "She finished it last week.", n: "last week → past simple." }
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
        { h: "will", b: "Anlık kararlar ve tahminlerde:\n\n> I'll help you. (anlık karar)\n> I think it will rain." },
        { h: "going to", b: "Önceden planlanmış niyetlerde ve kanıtlı tahminde:\n\n> I'm going to travel to Paris. (plan)\n> Look at the clouds! It's going to rain." },
        { h: "Özet", b: "> plan → going to\n> anlık karar/tahmin → will\n> kanıtlı tahmin → going to" }
      ],
      mistakes: [
        { w: "I will going to travel.", r: "I am going to travel.", n: "İkisi birlikte kullanılmaz." },
        { w: "Look! It will rain.", r: "Look! It's going to rain.", n: "Kanıt varsa going to." },
        { w: "I going to help you.", r: "I am going to help you.", n: "am/is/are gerekli." }
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
        { h: "Kuruluş", b: "was/were + fiil-ing\n\n> I was watching TV.\n> They were playing." },
        { h: "Kullanım", b: "Geçmişte belirli bir anda devam eden eylem:\n\n> At 8pm I was watching TV.\n> When she called, I was cooking." },
        { h: "was / were", b: "I/he/she/it → was\nyou/we/they → were\n\n> He was sleeping. / We were eating." }
      ],
      mistakes: [
        { w: "I was watch TV.", r: "I was watching TV.", n: "Fiil -ing alır." },
        { w: "They was playing.", r: "They were playing.", n: "Çoğul için were." },
        { w: "She were sleeping.", r: "She was sleeping.", n: "Tekil için was." }
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
        { h: "Yapı", b: "If + present simple, will + fiil\n\n> If it rains, I will stay home.\n> If you study, you will pass." },
        { h: "Anlam", b: "Gelecekte gerçek/olası durum ve sonucu:\n\n> If she comes, we will be happy." },
        { h: "Dikkat", b: "if cümlesinde will kullanılmaz (genellikle).\n\n> If it rains (doğru) / If it will rain (yanlış)" }
      ],
      mistakes: [
        { w: "If it will rain, I will stay.", r: "If it rains, I will stay.", n: "if sonrası present simple." },
        { w: "If I will have money, I will buy it.", r: "If I have money, I will buy it.", n: "if sonrası will yok." },
        { w: "If she comes, she is happy.", r: "If she comes, she will be happy.", n: "Sonuç cümlesi will alır." }
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
        { h: "Yapı", b: "If + past simple, would + fiil\n\n> If I were rich, I would travel the world." },
        { h: "Anlam", b: "Hayali/gerçek dışı durumlar:\n\n> If I had a car, I would drive to work.\n> (ama arabam yok)" },
        { h: "were", b: "I/he/she/it ile 'were' da kullanılabilir.\n\n> If I were you... (Senin yerinde olsam)" }
      ],
      mistakes: [
        { w: "If I have money, I would buy it.", r: "If I had money, I would buy it.", n: "İkinci koşulda past simple." },
        { w: "If I was rich, I will travel.", r: "If I was rich, I would travel.", n: "Sonuç would alır." },
        { w: "If I won, I will buy a house.", r: "If I won, I would buy a house.", n: "would kullanılır." }
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
        { h: "who / which / that", b: "who → insanlar, which → nesneler/hayvanlar, that → her ikisi\n\n> The man who lives next door.\n> The book which I read." },
        { h: "Kullanım", b: "İsimleri tanımlayan yan cümleler kurar:\n\n> The woman who called you is my aunt.\n> This is the car that I bought." },
        { h: "Dikkat", b: "who insan, which nesne için. that resmi olmayan durumlarda her ikisinin yerine geçebilir." }
      ],
      mistakes: [
        { w: "The man which is there is my father.", r: "The man who is there is my father.", n: "İnsan için who." },
        { w: "The book who I read was good.", r: "The book which I read was good.", n: "Nesne için which/that." },
        { w: "She is the teacher which helped me.", r: "She is the teacher who helped me.", n: "İnsan için who." }
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
        { h: "Yapı", b: "be + fiil 3. hali (past participle)\n\n> Present: The letter is sent.\n> Past: The letter was sent." },
        { h: "Ne zaman?", b: "Eylemi yapan değil, eylem önemliyse:\n\n> English is spoken here.\n> The bridge was built in 1900." },
        { h: "Aktif → Pasif", b: "Aktif: They send letters. → Pasif: Letters are sent.\nAktif: They sent letters. → Pasif: Letters were sent." }
      ],
      mistakes: [
        { w: "The letter was send.", r: "The letter was sent.", n: "send'in 3. hali sent." },
        { w: "The house is build here.", r: "The house is built here.", n: "build → built." },
        { w: "English is speak here.", r: "English is spoken here.", n: "speak → spoken." }
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
        { h: "should", b: "Tavsiye için: should + fiil\n\n> You should study more.\n> You shouldn't eat too much." },
        { h: "must / have to", b: "must → konuşmacının zorunluluğu, have to → dış zorunluluk/kural\n\n> I must call my mother.\n> I have to wear a uniform at work." },
        { h: "Dikkat", b: "should/must sonrası fiil yalın, to yok.\n\n> He must go (doğru) / He must to go (yanlış)\n\nhave to → has to (3. tekil)" }
      ],
      mistakes: [
        { w: "You should to study.", r: "You should study.", n: "should sonrası fiil yalın." },
        { w: "He musts go.", r: "He must go.", n: "must değişmez." },
        { w: "She have to work.", r: "She has to work.", n: "3. tekil için has to." }
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
        { h: "a few / a little", b: "a few → sayılabilir (birkaç)\na little → sayılamaz (biraz)\n\n> I have a few friends.\n> I have a little money." },
        { h: "a lot of", b: "Her ikisiyle de kullanılır (özellikle olumlu):\n\n> a lot of books / a lot of water" },
        { h: "some / any", b: "some → olumlu, any → olumsuz/soru\n\n> some tea, any tea?" }
      ],
      mistakes: [
        { w: "I have a few water.", r: "I have a little water.", n: "Sayılamaz → a little." },
        { w: "There is a little books.", r: "There are a few books.", n: "Sayılabilir → a few." },
        { w: "I have any money.", r: "I have some money.", n: "Olumluda some." }
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
