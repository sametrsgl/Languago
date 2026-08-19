/* English Word Coach — Dilbilgisi A2 (Temel) */
window.GRAMMAR_A2 = {
  id: "a2",
  title: "A2 · Temel",
  subtitle: "Günlük hayat dilbilgisi",
  color: "#22C55E",
  units: [
    {
      id: "a2-01",
      title: "Şimdiki Zaman (Present Continuous)",
      short: "am/is/are + -ing",
      slides: [
        { h: "Kuruluş", b: "am/is/are + fiil-ing\n\n> I am reading.\n> She is reading.\n> They are reading." },
        { h: "Kullanım", b: "Şu an devam eden eylemler için:\n\n> He is watching TV now.\n> Listen! The baby is crying." },
        { h: "Yazım kuralları", b: "-e ile biten fiillerde e düşer: make → making\n\n- kısa ünlü + sessiz → sessiz iki kat:\n> run → running, sit → sitting" }
      ],
      mistakes: [
        { w: "I am work now.", r: "I am working now.", n: "Fiil -ing alır." },
        { w: "She is run in the park.", r: "She is running in the park.", n: "run → running (sessiz iki kat)." },
        { w: "They is playing.", r: "They are playing.", n: "Çoğul için are." }
      ],
      practice: [
        { q: "I ___ a book now.", hint: "read", a: ["am reading"] },
        { q: "She ___ in the pool.", hint: "swim", a: ["is swimming"] },
        { q: "They ___ lunch.", hint: "eat", a: ["are eating"] },
        { q: "He ___ his homework.", hint: "do", a: ["is doing"] },
        { q: "We ___ TV.", hint: "watch", a: ["are watching"] }
      ]
    },
    {
      id: "a2-02",
      title: "Geniş Zaman vs Şimdiki Zaman",
      short: "Simple vs Continuous",
      slides: [
        { h: "Fark", b: "Simple → rutin/alışkanlık/genel gerçek.\nContinuous → şu an devam eden.\n\n> I play football. (genel)\n> I am playing football now." },
        { h: "Zaman zarfları", b: "Simple: always, usually, every day, sometimes\nContinuous: now, right now, at the moment, Look!/Listen!" },
        { h: "Durum fiilleri", b: "Bazı fiiller -ing almaz (durum fiilleri):\n\n> like, love, want, know, understand, believe\n\n> I understand (doğru) / I am understanding (yanlış)" }
      ],
      mistakes: [
        { w: "I am playing football every day.", r: "I play football every day.", n: "Rutin → simple." },
        { w: "She works right now.", r: "She is working right now.", n: "Şu an → continuous." },
        { w: "I am wanting a coffee.", r: "I want a coffee.", n: "want durum fiilidir, -ing almaz." }
      ],
      practice: [
        { q: "He ___ to school every day.", hint: "go (rutin)", a: ["goes"] },
        { q: "Listen! She ___ a song.", hint: "sing", a: ["is singing"] },
        { q: "I ___ (not/understand) now.", hint: "understand (durum fiili)", a: ["don't understand", "do not understand"] },
        { q: "They usually ___ at 8.", hint: "get up", a: ["get up"] },
        { q: "Look! It ___ outside.", hint: "rain", a: ["is raining"] }
      ]
    },
    {
      id: "a2-03",
      title: "Geçmiş Zaman (Olumlu)",
      short: "worked / went",
      slides: [
        { h: "Düzenli fiiller", b: "-ed eklenir.\n\n> work → worked, play → played\n\n- e ile biten → -d: live → lived\n- y (öncesi sessiz) → -ied: study → studied" },
        { h: "Düzensiz fiiller", b: "Ezberlenmelidir:\n\n> go → went, eat → ate, see → saw\n> buy → bought, come → came, have → had" },
        { h: "Kullanım", b: "Geçmişte bitmiş eylemler için, genelde belirli zamanla:\n\n> I visited my friend yesterday.\n> She went to Paris last year." }
      ],
      mistakes: [
        { w: "I goed to school.", r: "I went to school.", n: "go → went (düzensiz)." },
        { w: "She eated lunch.", r: "She ate lunch.", n: "eat → ate." },
        { w: "He work yesterday.", r: "He worked yesterday.", n: "Düzenli fiil -ed alır." }
      ],
      practice: [
        { q: "Yesterday I ___ to the cinema.", hint: "go", a: ["went"] },
        { q: "She ___ a new dress.", hint: "buy", a: ["bought"] },
        { q: "They ___ football last week.", hint: "play", a: ["played"] },
        { q: "We ___ pizza for dinner.", hint: "eat", a: ["ate"] },
        { q: "He ___ TV last night.", hint: "watch", a: ["watched"] }
      ]
    },
    {
      id: "a2-04",
      title: "Geçmiş Zaman (Olumsuz ve Soru)",
      short: "didn't / Did",
      slides: [
        { h: "Olumsuz", b: "didn't + fiil yalın:\n\n> I didn't go.\n> She didn't go." },
        { h: "Soru", b: "Did + özne + fiil yalın:\n\n> Did you go?\n> Did she go?" },
        { h: "Dikkat", b: "didn't/did'den sonra fiil geçmiş haliyle değil YALIN kullanılır.\n\n> I didn't went (yanlış) → I didn't go (doğru)" }
      ],
      mistakes: [
        { w: "I didn't went to school.", r: "I didn't go to school.", n: "didn't sonrası yalın fiil." },
        { w: "Did you went there?", r: "Did you go there?", n: "did sonrası yalın fiil." },
        { w: "She did not ate.", r: "She did not eat.", n: "did not sonrası yalın fiil." }
      ],
      practice: [
        { q: "I ___ to school yesterday.", hint: "not/go", a: ["didn't go", "did not go"] },
        { q: "___ you see him?", hint: "did", a: ["did"] },
        { q: "She ___ breakfast.", hint: "not/eat", a: ["didn't eat", "did not eat"] },
        { q: "___ they come to the party?", hint: "did", a: ["did"] },
        { q: "He ___ the answer.", hint: "not/know", a: ["didn't know", "did not know"] }
      ]
    },
    {
      id: "a2-05",
      title: "Gelecek: going to",
      short: "planlı gelecek",
      slides: [
        { h: "Kuruluş", b: "am/is/are + going to + fiil\n\n> I am going to travel.\n> She is going to study.\n> They are going to move." },
        { h: "Kullanım", b: "Planlanmış gelecek ve niyet için:\n\n> I am going to visit my grandparents.\n> We are going to buy a house." },
        { h: "Kısaltmalar", b: "am → 'm, is → 's, are → 're\n\n> I'm going to, She's going to, We're going to" }
      ],
      mistakes: [
        { w: "I going to travel.", r: "I am going to travel.", n: "am/is/are şart." },
        { w: "She is going to travels.", r: "She is going to travel.", n: "going to sonrası fiil yalın." },
        { w: "He going to eat.", r: "He is going to eat.", n: "is eksik." }
      ],
      practice: [
        { q: "I ___ my friend tomorrow.", hint: "visit", a: ["am going to visit", "'m going to visit"] },
        { q: "They ___ a car.", hint: "buy", a: ["are going to buy", "'re going to buy"] },
        { q: "She ___ us next week.", hint: "visit", a: ["is going to visit", "'s going to visit"] },
        { q: "We ___ (not/come).", hint: "come (olumsuz)", a: ["are not going to come", "aren't going to come"] }
      ]
    },
    {
      id: "a2-06",
      title: "Karşılaştırma ve Üstünlük",
      short: "-er / -est / more / most",
      slides: [
        { h: "Karşılaştırma", b: "Kısa sıfatlar → -er: big → bigger, tall → taller\n\nUzun sıfatlar → more: beautiful → more beautiful\n\n> This car is faster than that car." },
        { h: "Üstünlük", b: "Kısa → -est: the biggest\nUzun → the most: the most beautiful\n\n> She is the tallest in the class." },
        { h: "Düzensizler", b: "> good → better → best\n> bad → worse → worst\n> far → farther/further → farthest/furthest" }
      ],
      mistakes: [
        { w: "This is more big.", r: "This is bigger.", n: "Kısa sıfat -er alır." },
        { w: "She is gooder.", r: "She is better.", n: "good → better (düzensiz)." },
        { w: "He is the most tall.", r: "He is the tallest.", n: "Kısa sıfat -est alır." }
      ],
      practice: [
        { q: "big → ___", hint: "karşılaştırma (-er)", a: ["bigger"] },
        { q: "good → ___", hint: "karşılaştırma", a: ["better"] },
        { q: "expensive → ___", hint: "karşılaştırma (more)", a: ["more expensive"] },
        { q: "tall → ___", hint: "üstünlük (-est)", a: ["tallest", "the tallest"] },
        { q: "bad → ___", hint: "üstünlük", a: ["worst", "the worst"] }
      ]
    },
    {
      id: "a2-07",
      title: "Sayılabilir/Sayılamaz + some/any",
      short: "much / many / some / any",
      slides: [
        { h: "Sayılabilir / sayılamaz", b: "Sayılabilir: book, apple (tekil/çoğul olur).\nSayılamaz: water, money, information (çoğul olmaz)." },
        { h: "some / any", b: "some → olumluda, any → olumsuz ve soruda.\n\n> I have some money.\n> I don't have any money.\n> Do you have any money?" },
        { h: "much / many / a lot of", b: "many → sayılabilir çoğul\nmuch → sayılamaz\na lot of → her ikisi (özellikle olumlu)\n\n> How many books? / How much water?" }
      ],
      mistakes: [
        { w: "I have much books.", r: "I have many books.", n: "Sayılabilir → many." },
        { w: "How many water?", r: "How much water?", n: "Sayılamaz → much." },
        { w: "I don't have some money.", r: "I don't have any money.", n: "Olumsuzda any." }
      ],
      practice: [
        { q: "How ___ books do you have?", hint: "much / many", a: ["many"] },
        { q: "How ___ water do you need?", hint: "much / many", a: ["much"] },
        { q: "I don't have ___ money.", hint: "some / any", a: ["any"] },
        { q: "There are ___ apples on the table.", hint: "some / any", a: ["some"] },
        { q: "She has ___ friends.", hint: "çok", a: ["a lot of", "many"] }
      ]
    },
    {
      id: "a2-08",
      title: "can / can't (Yetenek)",
      short: "yapabilmek",
      slides: [
        { h: "Yetenek", b: "can + fiil yalın = yapabilmek\n\n> I can swim.\n> She can speak English." },
        { h: "Olumsuz ve soru", b: "can't (cannot) = yapamamak\n\n> I can't drive.\n\nSoru: Can you help me?" },
        { h: "Dikkat", b: "can'den sonra fiil yalın; to veya -ing gelmez.\n\n> I can swim (doğru) / I can to swim (yanlış)\n\ncan asla -s almaz: he can (doğru), he cans (yanlış)" }
      ],
      mistakes: [
        { w: "I can to swim.", r: "I can swim.", n: "can sonrası fiil yalın." },
        { w: "She cans swim.", r: "She can swim.", n: "can değişmez, -s almaz." },
        { w: "He can swimming.", r: "He can swim.", n: "Fiil yalın kullanılır." }
      ],
      practice: [
        { q: "I ___ swim very well.", hint: "can / can't", a: ["can"] },
        { q: "She ___ drive.", hint: "yapamıyor", a: ["can't", "cannot"] },
        { q: "___ you help me?", hint: "can (soru)", a: ["can"] },
        { q: "He ___ play the guitar.", hint: "yapabiliyor", a: ["can"] }
      ]
    }
  ]
};
