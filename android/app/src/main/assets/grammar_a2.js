/* Languago — Dilbilgisi A2 (Temel) */
window.GRAMMAR_A2 = {
  id: "a2",
  title: "A2 · Temel",
  subtitle: "Günlük hayat dilbilgisi",
  color: "#22C55E",
  units: [
    {
      id: "a2-01",
      title: "Present Continuous (Şimdiki Zaman)",
      short: "am/is/are + -ing",
      slides: [
        { h: "Yapı ve Kuruluş", b: "am/is/are + fiil-ing\n\n> I am reading.\n> She is reading.\n> They are reading.\n\n! am/is/are mutlaka gerekir, ardından fiil + -ing." },
        { h: "Ne Zaman Kullanılır?", b: "Şu anda devam eden eylemler için:\n\n> He is watching TV now.\n> Listen! The baby is crying.\n\nAyrıca geçici durumlar için:\n> I am living in Ankara this year.\n> She is working at Google for 3 months." },
        { h: "Yazım Kuralları", b: "-e ile biten fiillerde e düşebilir:\n> make → making, write → writing\n\n-kısa ünlü + sessiz → sessiz iki kat alır:\n> run → running, sit → sitting, stop → stopping\n\n> swim → swimming, plan → planning" }
      ],
      mistakes: [
        { w: "I am work now.", r: "I am working now.", n: "Fiil -ing alır." },
        { w: "She is run in the park.", r: "She is running in the park.", n: "run → running (sessiz iki kat)." },
        { w: "They is playing.", r: "They are playing.", n: "Çoğul için are." }
      ],
      mcq: [
        { q: "She ___ a book right now.", options: ["reads", "is reading", "read"], a: 1 },
        { q: "Which sentence uses the present continuous correctly?", options: ["He is working now.", "He work now.", "He is work now.", "He works now."], a: 0 },
        { q: "The baby is ___ at the moment.", options: ["cry", "cries", "crying", "cried"], a: 2 },
        { q: "Choose the correct form of run in the present continuous.", options: ["runing", "running", "run", "runs"], a: 1 }
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
        { h: "İki Zaman Arasındaki Fark", b: "Simple → rutin, alışkanlık, genel gerçek.\nContinuous → şu anda devam eden eylem.\n\n> I play football every Sunday. (rutin)\n> I am playing football now. (şu an)\n\n> He works in a bank. (genel gerçek)\n> He is working on a new project now. (şu an)" },
        { h: "Zaman Zarfları", b: "Simple (basit) zamanla birlikte:\n> always, usually, often, sometimes, never, every day, every week\n\nContinuous (sürekli) zamanla birlikte:\n> now, right now, at the moment, currently\n> Look!, Listen! (uyarı sözcükleri)" },
        { h: "Durum Fiilleri — DİKKAT!", b: "Bazı fiiller -ing alamaz. Bu 'durum fiilleridir':\n\n> like, love, want, need, know, understand, believe, belong, hate\n\n> I understand the lesson. (✓)\n> I am understanding the lesson. (✗) — yanlış!\n\n> She doesn't want a coffee. (✓)\n> She isn't wanting a coffee. (✗)" }
      ],
      mistakes: [
        { w: "I am playing football every day.", r: "I play football every day.", n: "Rutin → simple." },
        { w: "She works right now.", r: "She is working right now.", n: "Şu an → continuous." },
        { w: "I am wanting a coffee.", r: "I want a coffee.", n: "want durum fiili, -ing almaz." }
      ],
      mcq: [
        { q: "I ___ football every Sunday.", options: ["am playing", "play", "playing", "plays"], a: 1 },
        { q: "Listen! Someone ___ at the door.", options: ["knocks", "is knocking", "knock", "is knock"], a: 1 },
        { q: "Which sentence is correct?", options: ["I am knowing the answer.", "I know the answer.", "I knowing the answer.", "I am know the answer."], a: 1 },
        { q: "She usually ___ up at seven.", options: ["is getting", "get", "gets", "getting"], a: 2 }
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
      title: "Geçmiş Zaman (Past Simple — Olumlu)",
      short: "worked / went",
      slides: [
        { h: "Düzenli Fiiller", b: "Geçmiş zaman için -ed ekle:\n\n> work → worked\n> play → played\n> watch → watched\n\n- e ile bitenlere sadece -d:\n> live → lived\n\n- -y (öncesi sessiz) → -ied:\n> study → studied\n> carry → carried\n> try → tried" },
        { h: "Düzensiz Fiiller", b: "Bu fiilleri ezberle (çok yaygın):\n\n> go → went\n> eat → ate\n> see → saw\n> buy → bought\n> come → came\n> have → had\n> do → did\n> get → got\n> make → made\n> take → took\n\n> give → gave\n> find → found\n> think → thought\n> tell → told\n> ask → asked\n> work → worked (düzenli)" },
        { h: "Kullanım ve Zaman Belirteçleri", b: "Geçmişte bitmiş eylemler için. Belirli zamanla birlikte:\n\n> I visited my friend yesterday.\n> She went to Paris last year.\n> They watched a movie last night.\n\nZaman zarfları:\n> yesterday, last week/month/year, in 2020, ago, when I was young" }
      ],
      mistakes: [
        { w: "I goed to school.", r: "I went to school.", n: "go → went (düzensiz)." },
        { w: "She eated lunch.", r: "She ate lunch.", n: "eat → ate." },
        { w: "He work yesterday.", r: "He worked yesterday.", n: "Düzenli fiil -ed alır." }
      ],
      mcq: [
        { q: "Yesterday I ___ to the cinema.", options: ["go", "goed", "went", "gone"], a: 2 },
        { q: "She ___ pizza for dinner last night.", options: ["eated", "ate", "eats", "eat"], a: 1 },
        { q: "Choose the correct past form of study.", options: ["studied", "studyed", "studid", "studiedd"], a: 0 },
        { q: "He ___ his homework two hours ago.", options: ["finish", "finishes", "finished", "finishing"], a: 2 }
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
      title: "Geçmiş Zaman (Olumsuz & Soru)",
      short: "didn't / Did",
      slides: [
        { h: "Olumsuz", b: "didn't (did not) + fiil yalın:\n\n> I didn't go.\n> She didn't go.\n> They didn't go.\n\n> I didn't eat lunch.\n> She didn't see the movie.\n\n! UNUTMA: didn't'tan sonra fiil ASLA -ed almaz!" },
        { h: "Soru", b: "Did + özne + fiil yalın:\n\n> Did you go?\n> Did she go?\n> Did they go?\n\n> Did he see the movie?\n> Did they have fun?\n\n! Soruda did mutlaka vardır, fiil yalın." },
        { h: "Kısa Cevap", b: "Soruya kısa yanıt:\n\n> Did you see him? → Yes, I did. / No, I didn't.\n> Did she like it? → Yes, she did. / No, she didn't.\n\n> Did they go? → Yes, they did. / No, they didn't." }
      ],
      mistakes: [
        { w: "I didn't went to school.", r: "I didn't go to school.", n: "didn't'tan sonra yalın fiil." },
        { w: "Did you went there?", r: "Did you go there?", n: "did'tan sonra yalın fiil." },
        { w: "She did not ate.", r: "She did not eat.", n: "did not'tan sonra yalın fiil." }
      ],
      mcq: [
        { q: "I ___ to the party yesterday.", options: ["didn't went", "didn't go", "did not went", "didn't going"], a: 1 },
        { q: "___ you see the film last night?", options: ["Did", "Do", "Does", "Were"], a: 0 },
        { q: "She ___ the answer to the question.", options: ["didn't knew", "didn't know", "didn't knows", "didn't known"], a: 1 },
        { q: "Did they ___ the meeting?", options: ["attended", "attend", "attends", "attending"], a: 1 }
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
        { h: "Kuruluş", b: "am/is/are + going to + fiil\n\n> I am going to travel.\n> She is going to study.\n> They are going to move.\n\n> I'm going to visit my parents.\n> She's going to buy a car.\n> They're going to watch a movie." },
        { h: "Ne Zaman Kullanılır?", b: "1. Planlanmış gelecek için:\n> I am going to visit my grandparents next week.\n\n2. Niyet/karar için:\n> We are going to buy a new house.\n\n3. Görülen kanıtlı tahmin:\n> Look at the clouds! It's going to rain.\n> Be careful! He's going to fall." },
        { h: "Kısaltmalar", b: "am → 'm\nis → 's\nare → 're\n\n> I'm going to → I am going to\n> She's going to → She is going to\n> They're going to → They are going to\n\n! NOT: 'm, 's, 're ile yazılır ama seslendirilirken 'going to' olarak okunur." }
      ],
      mistakes: [
        { w: "I going to travel.", r: "I am going to travel.", n: "am/is/are şart." },
        { w: "She is going to travels.", r: "She is going to travel.", n: "going to sonrası fiil yalın." },
        { w: "He going to eat.", r: "He is going to eat.", n: "is eksik." }
      ],
      mcq: [
        { q: "I ___ my friend tomorrow.", options: ["am going to visit", "going to visit", "am going to visits", "is going to visit"], a: 0 },
        { q: "She ___ a new car.", options: ["is going to buy", "going to buy", "is going to buys", "are going to buy"], a: 0 },
        { q: "We ___ to the beach on holiday.", options: ["are going to go", "going to go", "are going to goes", "is going to go"], a: 0 },
        { q: "They are not going to ___ late.", options: ["coming", "came", "come", "comes"], a: 2 }
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
        { h: "Karşılaştırma (-er / more)", b: "Kısa sıfatlar (1-2 hecele) → -er ek:\n\n> big → bigger\n> tall → taller\n> fast → faster\n> old → older\n\nUzun sıfatlar (2-3 hecele) → more:\n\n> beautiful → more beautiful\n> expensive → more expensive\n> interesting → more interesting\n\n> This car is faster than that car." },
        { h: "Üstünlük (-est / the most)", b: "Kısa sıfatlar → -est ek, başına the:\n\n> the biggest\n> the tallest\n> the fastest\n\nUzun sıfatlar → the most:\n\n> the most beautiful\n> the most expensive\n\n> She is the tallest in the class.\n> This is the most expensive hotel." },
        { h: "Düzensiz Karşılaştırmalar", b: "Bazı sıfatlar ezberlenir:\n\n> good → better → best\n> bad → worse → worst\n> far → farther/further → farthest/furthest\n> little → less → least\n> many/much → more → most\n> old → older/eldest (yaş) vs older/oldest" }
      ],
      mistakes: [
        { w: "This is more big.", r: "This is bigger.", n: "Kısa sıfat -er alır." },
        { w: "She is gooder.", r: "She is better.", n: "good → better (düzensiz)." },
        { w: "He is the most tall.", r: "He is the tallest.", n: "Kısa sıfat -est alır." }
      ],
      mcq: [
        { q: "This car is ___ than that one.", options: ["more fast", "faster", "fastest", "most fast"], a: 1 },
        { q: "She is the ___ student in the class.", options: ["most tall", "taller", "tallest", "more tall"], a: 2 },
        { q: "Your English is ___ than mine.", options: ["gooder", "better", "more good", "best"], a: 1 },
        { q: "That is the ___ hotel in the city.", options: ["more expensive", "expensivest", "most expensive", "expensive most"], a: 2 }
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
        { h: "Sayılabilir vs Sayılamaz", b: "Sayılabilir (countable): tekil/çoğul olur.\n> book/books, cat/cats, person/people\n\nSayılamaz (uncountable): çoğul olmaz.\n> water, rice, sugar, money, information\n\n> I have two books. (sayılabilir)\n> I have some water. (sayılamaz)" },
        { h: "some / any", b: "Olumluda → some:\n> I have some money.\n> There are some students.\n\nOlumsuzda ve soruda → any:\n> I don't have any money.\n> I haven't got any time.\n> Do you have any water?\n\n> Are there any students? (soru)\n> There aren't any books. (olumsuz)" },
        { h: "much / many / a lot of", b: "many → sayılabilir çoğul:\n> How many books?\n> Many students...\n\nmuch → sayılamaz:\n> How much water?\n> How much money?\n\na lot of → her ikisi (özellikle olumlu):\n> a lot of books\n> a lot of water\n\n> a great deal of, plenty of → daha resmi" }
      ],
      mistakes: [
        { w: "I have much books.", r: "I have many books.", n: "Sayılabilir → many." },
        { w: "How many water?", r: "How much water?", n: "Sayılamaz → much." },
        { w: "I don't have some money.", r: "I don't have any money.", n: "Olumsuzda any." }
      ],
      mcq: [
        { q: "How ___ books do you have?", options: ["much", "many", "a lot", "any"], a: 1 },
        { q: "How ___ water do you drink every day?", options: ["many", "much", "some", "any"], a: 1 },
        { q: "I don't have ___ money in my pocket.", options: ["some", "any", "much books", "many money"], a: 1 },
        { q: "There are ___ apples on the table.", options: ["any", "some", "much", "many water"], a: 1 }
      ],
      practice: [
        { q: "How ___ books do you have?", hint: "much / many", a: ["many"] },
        { q: "How ___ water do you need?", hint: "much / many", a: ["much"] },
        { q: "I don't have ___ money.", hint: "some / any", a: ["any"] },
        { q: "There are ___ apples on the table.", hint: "some / any", a: ["some"] },
        { q: "She has ___ good friends, about five.", hint: "çok", a: ["a lot of", "many"] }
      ]
    },
    {
      id: "a2-08",
      title: "can / can't (Yetenek)",
      short: "yapabilmek",
      slides: [
        { h: "Yetenek Anlatır", b: "can + fiil yalın = yapabilmek:\n\n> I can swim.\n> She can speak English.\n> They can cook well.\n\n> I can play the guitar.\n> He can run fast.\n> We can help you." },
        { h: "Olumsuz ve Soru", b: "can't (cannot) = yapamamak:\n\n> I can't drive.\n> She can't swim.\n> He can't cook.\n\nSoru:\n> Can you help me?\n> Can she speak French?\n> Can they come?\n\n! can değişmez, asla -s almaz!" },
        { h: "Diğer Yetenek Fiilleri", b: "should, would, may, might, could — geçici zamanlarda!\n\n> Could (geçmiş yetenek):\n> I could swim when I was 5.\n\n> Should (yapmalı):\n> You should try this!\n\n> May/Might (olasılık):\n> It might rain.\n> She may come." }
      ],
      mistakes: [
        { w: "I can to swim.", r: "I can swim.", n: "can sonrası fiil yalın." },
        { w: "She cans swim.", r: "She can swim.", n: "can değişmez, -s almaz." },
        { w: "He can swimming.", r: "He can swim.", n: "Fiil yalın kullanılır." }
      ],
      mcq: [
        { q: "I ___ swim very well.", options: ["can", "cans", "can to", "can swims"], a: 0 },
        { q: "She ___ drive a car.", options: ["can't", "cans", "can't to", "cannot to"], a: 0 },
        { q: "___ you help me with this?", options: ["Can", "Cans", "Can to", "Do can"], a: 0 },
        { q: "He ___ play the guitar.", options: ["can", "cans", "can to", "can plays"], a: 0 }
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
