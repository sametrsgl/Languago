/* Languago — Dilbilgisi B2 (Orta Üstü) */
window.GRAMMAR_B2 = {
  id: "b2",
  title: "B2 · Orta Üstü",
  subtitle: "Üst-orta seviye dilbilgisi",
  color: "#2563EB",
  units: [
    {
      id: "b2-01",
      title: "Present Perfect Continuous",
      short: "have/has been + -ing",
      slides: [
        { h: "Yapı ve Kuruluş", b: "have/has + been + fiil-ing\n\n> I have been working.\n> She has been studying.\n> They have been playing.\n\n! have/has özneye göre değişir, been hep aynı kalır." },
        { h: "Ne Zaman Kullanılır?", b: "Geçmişte başlayıp hâlâ devam eden eylem, süre vurgusu:\n\n> I have been working for 3 hours.\n> It has been raining since morning.\n> She has been studying all day.\n\n! for/since ile kullanılır, present perfect ile karıştırılma!" },
        { h: "Present Perfect ile Fark", b: "Continuous sürece/sürekliliğe vurgu yapar:\n\n> I have read the book. → kitabı okudum (bitirdim)\n> I have been reading the book. → kitap okuyorum (hâlâ okuyorum)\n\n> She has worked here. → burada çalıştı.\n> She has been working here. → burada çalışıyor (süredir)."
      }
      ],
      mistakes: [
        { w: "I have been work here.", r: "I have been working here.", n: "Fiil -ing alır." },
        { w: "She has been worked all day.", r: "She has been working all day.", n: "been + fiil-ing." },
        { w: "They has been playing.", r: "They have been playing.", n: "Çoğul için have." }
      ],
      mcq: [
        { q: "They ___ for three hours when the power went out.", options: ["have been working", "has been working", "have worked", "are working"], a: 0 },
        { q: "She ___ French since last year, so her speaking has improved a lot.", options: ["has studied", "has been studying", "studied", "is studying"], a: 1 },
        { q: "It ___ since morning.", options: ["has rained", "rained", "has been raining", "rains"], a: 2 },
        { q: "I ___ for the exam all week and I still feel unprepared.", options: ["have been preparing", "have prepared", "prepared", "prepare"], a: 0 },
        { q: "He ___ too hard lately, which is why he looks exhausted.", options: ["has worked", "works", "had worked", "has been working"], a: 3 }
      ],
      practice: [
        { q: "I ___ here for 3 hours.", hint: "work", a: ["have been working"] },
        { q: "She ___ all day.", hint: "study", a: ["has been studying"] },
        { q: "It ___ since morning.", hint: "rain", a: ["has been raining"] },
        { q: "They ___ football for an hour.", hint: "play", a: ["have been playing"] },
        { q: "He ___ for the exam.", hint: "prepare", a: ["has been preparing"] }
      ]
    },
    {
      id: "b2-02",
      title: "Past Perfect",
      short: "had + 3. hal",
      slides: [
        { h: "Yapı ve Kuruluş", b: "had + fiil 3. hali (past participle)\n\n> I had finished.\n> She had left.\n> They had eaten.\n\n> I had worked for 3 years before I quit.\n> She had already gone when I arrived."
      },
      { h: "Ne Zaman Kullanılır?", b: "Geçmişte başka bir olaydan ÖNCE olan eylem:\n\n> When I arrived, she had left. (önce gitti)\n> He had eaten before he left.\n> By the time the police came, the thief had run away.\n\n! İki geçmiş olayın sırasını netleştirir!"
      },
      { h: "Sıralama", b: "Past Perfect, geçmişteki bir başka eylemden önceki eylemi gösterir:\n\n> I had eaten breakfast → then I went out.\n> (Önce kahvaltı yedim, sonra dışarı çıktım.)\n\n> She had finished her homework → then she went to sleep.\n\n! Soru kelimesi: 'by the time', 'when', 'after', 'before'"
      }
      ],
      mistakes: [
        { w: "I had went home.", r: "I had gone home.", n: "go'nun 3. hali gone." },
        { w: "She had ate dinner.", r: "She had eaten dinner.", n: "eat → eaten." },
        { w: "When I arrived, she left.", r: "When I arrived, she had left.", n: "Önce olan olay past perfect." }
      ],
      mcq: [
        { q: "When I arrived at the station, the train ___ already ___.", options: ["has, left", "had, left", "had, leave", "was, leaving"], a: 1 },
        { q: "She ___ dinner before her guests came.", options: ["had eaten", "has eaten", "eats", "was eating"], a: 0 },
        { q: "He told me he ___ that film before, so we watched something else.", options: ["saw", "has seen", "had seen", "sees"], a: 2 },
        { q: "By the time the teacher arrived, the students ___ all the questions.", options: ["answer", "answered", "have answered", "had answered"], a: 3 },
        { q: "They ___ (not) the report, so they could not present it.", options: ["had not finished", "have not finished", "did not finish", "not finished"], a: 0 }
      ],
      practice: [
        { q: "When I arrived, she ___ .", hint: "leave", a: ["had left"] },
        { q: "They ___ (already/eat) when we came.", hint: "eat", a: ["had already eaten"] },
        { q: "He ___ (not/see) it before.", hint: "see (olumsuz)", a: ["hadn't seen", "had not seen"] },
        { q: "I ___ the film before.", hint: "see", a: ["had seen"] },
        { q: "She ___ the report by noon.", hint: "finish", a: ["had finished"] }
      ]
    },
    {
      id: "b2-03",
      title: "Koşul Tip 3 (Third Conditional)",
      short: "If + past perfect, would have",
      slides: [
        { h: "Yapı", b: "If + past perfect, would have + fiil 3. hali\n\n> If I had studied, I would have passed.\n> If she had known, she would have come.\n> If they had left early, they would have arrived on time.\n\n! Hiç gerçekleşmedi, ama düşünüyoruz."
      },
      { h: "Anlam", b: "Geçmişte gerçekleşmemiş hayali durum (pişmanlık):\n\n> If I had known you were sick, I would have visited you.\n> If I had studied harder, I would have passed.\n> She wishes she had taken the job."
      },
      { h: "Kısaltmalar", b: "had → 'd (I'd, she'd, he'd)\nwould → 'd (I'd, would)\n\n> If I'd known, I'd have come.\n> If she'd had more time, she'd have finished.\n\n! Dikkat: 'd iki anlama gelir:\n> I'd = I had / I would"
      }
      ],
      mistakes: [
        { w: "If I had known, I would go.", r: "If I had known, I would have gone.", n: "would have + 3. hal." },
        { w: "If I knew, I would have come.", r: "If I had known, I would have come.", n: "if sonrası past perfect." },
        { w: "If I had studied, I would had passed.", r: "If I had studied, I would have passed.", n: "would have (had değil)." }
      ],
      mcq: [
        { q: "If I ___ , I would have come.", options: ["studied", "had studied", "would study", "study"], a: 1 },
        { q: "She ___ if she had studied.", options: ["would pass", "would have passed", "has passed", "studied"], a: 1 },
        { q: "If they had left earlier, they would have caught the bus.", options: ["left", "had left", "would leave", "leaves"], a: 1 },
        { q: "I would have called you if I ___ your number.", options: ["knew", "had known", "would know", "know"], a: 1 },
        { q: "If he ___ me, I would have helped.", options: ["asked", "had asked", "would ask", "asks"], a: 2 }
      ],
      practice: [
        { q: "If I ___ , I would have come.", hint: "know", a: ["had known"] },
        { q: "She ___ if she had studied.", hint: "pass", a: ["would have passed"] },
        { q: "If they ___ earlier, they would have caught the bus.", hint: "leave", a: ["had left"] },
        { q: "I ___ the exam if I had worked harder.", hint: "pass", a: ["would have passed"] },
        { q: "If he ___ me, I would have helped.", hint: "ask", a: ["had asked"] }
      ]
    },
    {
      id: "b2-04",
      title: "Karışık Koşullar (Mixed Conditionals)",
      short: "farklı zamanlar",
      slides: [
        { h: "Yapı", b: "Farklı zamanları karıştırır:\n\n> If + past perfect (geçmiş), would + fiil (şimdi)\n\n> If I had studied, I would have a good job now.\n(Geçmişte çalışmadım → ama şu an iyi bir işim yok.)\n\n> If she had saved money, she would be rich now.\n(Geçmişte tasarruf etmedi → ama şu an zengin değil.)"
      },
      { h: "Anlam", b: "Geçmişteki koşul → şimdiki sonuç:\n\n> If I had studied harder, I would have a better job now.\n> If she had left earlier, she would not be late now.\n> If they had taken the job, they would live in London now.", }
      ],
      mistakes: [
        { w: "If I had studied, I will have a job now.", r: "If I had studied, I would have a job now.", n: "Şimdiki sonuç → would + fiil." },
        { w: "If she had saved, she has money now.", r: "If she had saved, she would have money now.", n: "would kullanılır." }
      ],
      mcq: [
        { q: "If I had saved money, I ___ a car now.", options: ["would have", "will have", "had", "has"], a: 0 },
        { q: "If she had studied, she ___ a doctor now.", options: ["would be", "will be", "would have been", "am"], a: 0 },
        { q: "If he had taken the job, he ___ in London at this moment.", options: ["would live", "would have lived", "will live", "lived"], a: 0 },
        { q: "If I ___ afraid of heights, I would have gone climbing.", options: ["was", "am not", "were not", "had not been"], a: 2 }
      ],
      practice: [
        { q: "If I had saved money, I ___ a car now.", hint: "have", a: ["would have"] },
        { q: "If she had studied, she ___ a doctor now.", hint: "be", a: ["would be"] },
        { q: "If he had taken the job, he ___ in London now.", hint: "live", a: ["would live"] }
      ]
    },
    {
      id: "b2-05",
      title: "Reported Speech",
      short: "dolaylı anlatım",
      slides: [
        { h: "Zaman Kayması", b: "Söyleneni aktarırken zaman genelde bir adım geriye kayar:\n\n> 'I am tired' → He said he was tired.\n> 'I will come' → She said she would come.\n> 'I went' → He said he had gone.\n\n> 'I have eaten' → She said she had eaten.\n\n! Zaman kaydırması genel kuraldır, ama geçerli zaman ifadeleri varsa durum değişir."
      },
      { h: "Söyleme Fiilleri", b: "say (+ that) / tell + nesne\n\n> He said (that) he was busy.\n> He told me (that) he was busy.\n\n! tell'den sonra nesne gerekir:\n> told me (✓)\n> said me (✗) — yanlış!\n\n> say → genel bilgi, duyuru\n> tell → bilgi aktarımı, komut"
      },
      { h: "Diğer Değişimler", b: "Zaman/yer sözcükleri değişir:\n\n> now → then\n> today → that day\n> tomorrow → the next/following day\n> yesterday → the day before/the previous day\n> here → there\n\n> Come! → He said to come.\n> Don't do that! → He told me not to do that."
      }
      ],
      mistakes: [
        { w: "He said he will come.", r: "He said he would come.", n: "will → would." },
        { w: "She said me she was tired.", r: "She told me she was tired.", n: "said me değil, told me." },
        { w: "He said he is hungry.", r: "He said he was hungry.", n: "is → was (kayma)." }
      ],
      mcq: [
        { q: "He said he ___ tired after the journey.", options: ["is", "was", "has been", "will be"], a: 1 },
        { q: "She said she ___ come to the party.", options: ["will", "would", "can", "shall"], a: 1 },
        { q: "They said they ___ happy with the result.", options: ["were", "are", "have been", "are being"], a: 0 },
        { q: "She said she ___ be free the next day.", options: ["will", "would", "can", "could"], a: 1 },
        { q: "Which is correct when reporting 'What did he say today'?", options: ["He said me he was busy.", "He told he was busy.", "He said he was busy.", "He told me he is busy."], a: 2 }
      ],
      practice: [
        { q: "He said he ___ tired.", hint: "be (is→was)", a: ["was"] },
        { q: "She said she ___ come.", hint: "will (will→would)", a: ["would"] },
        { q: "He told me he ___ busy.", hint: "be", a: ["was"] },
        { q: "She said she ___ go the next day.", hint: "will", a: ["would"] },
        { q: "They said they ___ happy.", hint: "be", a: ["were"] }
      ]
    },
    {
      id: "b2-06",
      title: "Pasif Yapılar (Tüm Zamanlar)",
      short: "pasif",
      slides: [
        { h: "Farklı Zamanlar", b: "> Present Continuous: is being built\n> Present Perfect: has been built\n> Past Perfect: had been built\n> Future: will be built\n\n> Present Simple: is/are built\n> Past Simple: was/were built\n> Present Perfect Continuous: has/have been being built"
      },
      { h: "Kullanım", b: "Eylemi yapan değil, eylem önemliyse:\n\n> The new bridge is being built.\n> The work has been finished.\n> The letter was sent yesterday.\n\n> English is spoken here.\n> The bridge was built in 1900."
      },
      { h: "with by Kullanımı", b: "Eylemi yapan belirtilirse by kullanılır:\n\n> The book was written by a famous author.\n> The car was made by Toyota.\n> The house was designed by my uncle.\n\n! by olmadan da pasif kurulabilir:\n> The book was written. (kim tarafından yazıldı belirtilmez)"
      }
      ],
      mistakes: [
        { w: "The work has been do.", r: "The work has been done.", n: "do'nun 3. hali done." },
        { w: "The house is being build.", r: "The house is being built.", n: "build → built." },
        { w: "It will be build next year.", r: "It will be built next year.", n: "be + 3. hal." }
      ],
      mcq: [
        { q: "The report ___ now.", options: ["is being written", "was written", "is written", "has written"], a: 0 },
        { q: "The bridge ___ last year.", options: ["was built", "is built", "has built", "was build"], a: 0 },
        { q: "The work ___ .", options: ["has been finished", "have been finished", "is finished", "finishes"], a: 0 },
        { q: "The letters ___ tomorrow morning.", options: ["will be sent", "are sending", "sent", "will send"], a: 0 },
        { q: "The window ___ by a boy.", options: ["was broken", "broke", "is broken", "has broken"], a: 0 }
      ],
      practice: [
        { q: "The report ___ now.", hint: "write (pasif, şimdi)", a: ["is being written"] },
        { q: "The bridge ___ last year.", hint: "build (pasif)", a: ["was built"] },
        { q: "The work ___ .", hint: "finish (pasif, present perfect)", a: ["has been finished"] },
        { q: "The letters ___ tomorrow.", hint: "send (pasif, gelecek)", a: ["will be sent"] },
        { q: "The window ___ by Tom.", hint: "break (pasif, geçmiş)", a: ["was broken"] }
      ]
    },
    {
      id: "b2-07",
      title: "Gerund & Infinitive",
      short: "-ing mi, to mu?",
      slides: [
        { h: "Gerund (-ing)", b: "Bazı fiillerden sonra -ing gelir:\n\n> enjoy, finish, mind, avoid, suggest, keep, consider, can't help\n\n> I enjoy reading.\n> She finished working.\n> Don't stop talking.\n> I can't help laughing.\n\n! Gerund fiil yapısı aynı kalır, doğrudan isim gibi kullanılır."
      },
      { h: "Infinitive (to)", b: "Bazı fiillerden sonra to gelir:\n\n> want, decide, hope, plan, need, promise, intend, aim, choose\n\n> I want to go.\n> She decided to leave.\n> They hope to succeed.\n> I need to rest.\n\n! Infinitive'de de fiil yalın kalır, to ekli."
      },
      { h: "İkisini Alanlar", b: "Bazı fiiller her ikisini alır:\n\n> like, love, start, begin, continue, forget, remember\n\n> I like reading. / I like to read.\n> She started singing. / She started to sing.\n> He began to work / He began working.\n\n! Bazen anlam değişir:\n> I remember meeting you → (tanıdığımı hatırlıyorum)\n> I remembered to buy flowers → (çiçi almayı unuttum değil, hatırladım ve aldım)"
      }
      ],
      mistakes: [
        { w: "I enjoy to read.", r: "I enjoy reading.", n: "enjoy sonrası -ing." },
        { w: "I want going home.", r: "I want to go home.", n: "want sonrası to." },
        { w: "She decided leaving.", r: "She decided to leave.", n: "decide sonrası to." }
      ],
      mcq: [
        { q: "I really enjoy ___ in the mountains.", options: ["to hike", "hiking", "hike", "to hiking"], a: 1 },
        { q: "She decided ___ a new project.", options: ["starting", "start", "to start", "to starting"], a: 2 },
        { q: "We finished ___ dinner and went for a walk.", options: ["to eat", "eating", "eat", "eaten"], a: 1 },
        { q: "He promised ___ me as soon as he landed.", options: ["calling", "call", "to call", "to calling"], a: 2 },
        { q: "I avoid ___ late because I hate rushing.", options: ["to stay", "staying", "stay", "stayed"], a: 1 }
      ],
      practice: [
        { q: "I enjoy ___ .", hint: "read", a: ["reading"] },
        { q: "She wants ___ .", hint: "go", a: ["to go"] },
        { q: "He decided ___ .", hint: "leave", a: ["to leave"] },
        { q: "They finished ___ .", hint: "eat", a: ["eating"] },
        { q: "I avoid ___ late.", hint: "stay", a: ["staying"] }
      ]
    },
    {
      id: "b2-08",
      title: "Çıkarım (Speculation / Deduction)",
      short: "must / might / can't",
      slides: [
        { h: "Şimdiki Zaman Çıkarımları", b: "Kesin çıkarım → must:\n> He must be tired. (çünkü böyle görünüyor, kesin)\n\nOlasılık → might/may/could:\n> She might be at work. (belki)\n> It could be true. (olası)\n\nİmkânsızlık → can't:\n> It can't be true. (imkânsız, emin değilim ama çok olası değil)"
      },
      { h: "Geçmiş Zaman Çıkarımları", b: "Geçmişte kesin → must have + 3. hal:\n> He must have forgotten. (unuttuğundan eminim)\n\nGeçmişte olasılık → might have / could have:\n> She might have missed the bus. (belki otobüsü kaçırdı)\n\nGeçmişte imkânsızlık → can't have:\n> He can't have finished. (bitiremeyecek kadar zor)"
      },
      { h: "Dikkat!", b: "Olumsuz kesin çıkarım için 'can't' (mustn't değil):\n\n> It can't be true. (imkânsız)\n> You must not smoke. (yasak — tamamen farklı)\n\n> He must be at home. (kesin — güçlü inanç)\n> He might be at home. (olası)"
      }
      ],
      mistakes: [
        { w: "He must be at home? (imkânsız anlamında)", r: "He can't be at home.", n: "İmkânsız çıkarım → can't." },
        { w: "She must tired.", r: "She must be tired.", n: "must + be + sıfat." },
        { w: "He must have went.", r: "He must have gone.", n: "gone (3. hal)." }
      ],
      mcq: [
        { q: "He worked all night, so he ___ be very tired now.", options: ["must", "might", "can't", "mustn't"], a: 0 },
        { q: "That ___ be true, it sounds completely impossible.", options: ["must", "might", "can't", "should"], a: 2 },
        { q: "I am not sure, but she ___ be at the office.", options: ["must", "might", "can't", "mustn't"], a: 1 },
        { q: "He ___ have forgotten the meeting, he never misses anything.", options: ["must", "might", "can't", "shouldn't"], a: 2 },
        { q: "The door is locked and his coat is here, so he ___ have left.", options: ["must", "might", "can't", "could"], a: 2 }
      ],
      practice: [
        { q: "He ___ be tired. He worked all day.", hint: "must / might / can't", a: ["must"] },
        { q: "It ___ be true. It's impossible.", hint: "must / can't", a: ["can't", "cannot"] },
        { q: "She ___ be at work. I'm not sure.", hint: "must / might", a: ["might", "may", "could"] },
        { q: "He ___ have forgotten. He didn't call.", hint: "must (geçmiş)", a: ["must"] }
      ]
    },
    {
      id: "b2-09",
      title: "Wish / If only",
      short: "keşke",
      slides: [
        { h: "Şimdiki Dilek", b: "wish + past simple → şimdiki gerçek dışı dilek:\n\n> I wish I had a car. (keşke arabam olsa)\n> I wish I were taller. (keşke daha uzun olsam)\n> I wish I didn't have to work. (keşke çalışmak zorunda kalmasam)", },
        { h: "Geçmiş Pişmanlık", b: "wish + past perfect → geçmişe dair pişmanlık:\n\n> I wish I had studied harder. (keşke daha çok çalışsaydım)\n> I wish I had gone to the party. (keşke partiye gitmişim)\n> She wishes she had told him.", },
        { h: "would ile", b: "wish + would → değişmesini istediğimiz şey:\n\n> I wish it would stop raining.\n> I wish you would listen.\n> I wish they would be quieter.\n\n> I wish it would snow for Christmas."
      }
      ],
      mistakes: [
        { w: "I wish I have a car.", r: "I wish I had a car.", n: "Şimdiki dilek → past simple." },
        { w: "I wish I have known.", r: "I wish I had known.", n: "Geçmiş pişmanlık → past perfect." },
        { w: "I wish I am taller.", r: "I wish I were taller.", n: "wish sonrası were." }
      ],
      mcq: [
        { q: "I wish I ___ a car.", options: ["has", "had", "have", "would have"], a: 1 },
        { q: "I wish I ___ harder for that exam.", options: ["study", "studied", "had studied", "would study"], a: 2 },
        { q: "I wish it ___ raining so we could go out.", options: ["stops", "stopped", "would stop", "had stopped"], a: 2 },
        { q: "I wish I ___ taller, but I am quite short.", options: ["am", "was", "were", "be"], a: 2 },
        { q: "I wish you ___ so much noise; it is hard to concentrate.", options: ["did not make", "do not make", "had not made", "would not make"], a: 3 }
      ],
      practice: [
        { q: "I wish I ___ a car.", hint: "have (şimdiki dilek)", a: ["had"] },
        { q: "I wish I ___ harder.", hint: "study (geçmiş pişmanlık)", a: ["had studied"] },
        { q: "I wish it ___ raining.", hint: "stop", a: ["would stop"] },
        { q: "I wish I ___ taller.", hint: "be", a: ["were", "was"] },
        { q: "I wish you ___ .", hint: "listen", a: ["would listen"] }
      ]
    },
    {
      id: "b2-10",
      title: "Future Perfect & Future Continuous",
      short: "will have / will be -ing",
      slides: [
        { h: "Future Perfect", b: "will have + fiil 3. hali → gelecekte belirli ana kadar tamamlanmış:\n\n> By 2026 I will have finished university.\n> She will have completed the project by Friday.\n> They will have arrived by the time we get there.\n\n> By next year, I will have lived here for 10 years."
      },
      { h: "Future Continuous", b: "will be + fiil-ing → gelecekte belirli anda devam eden:\n\n> This time tomorrow I will be flying to Istanbul.\n> At 8pm I will be watching the match.\n> She will be working at 9am.\n\n> Don't call at 3pm, I will be meeting clients."
      },
      { h: "Zaman İfadeleri", b: "Future Perfect: by, by the time, before\n> By 2030, by the time you arrive\n\nFuture Continuous: this time tomorrow, at 8pm, on Monday\n> This time next week, at this moment tomorrow"
      }
      ],
      mistakes: [
        { w: "By 2030 I will live here.", r: "By 2030 I will have lived here.", n: "by + tamamlanma → future perfect." },
        { w: "This time tomorrow I will work.", r: "This time tomorrow I will be working.", n: "Belirli anda devam → future continuous." }
      ],
      mcq: [
        { q: "By 2026 I ___ university.", options: ["will finish", "will be finishing", "will have finished", "finish"], a: 2 },
        { q: "This time tomorrow I ___ to Ankara.", options: ["will fly", "will be flying", "will have flown", "fly"], a: 1 },
        { q: "By the time you arrive, I ___ the flat.", options: ["will clean", "clean", "will have cleaned", "will be cleaning"], a: 2 },
        { q: "At 8pm tonight I ___ my favourite show on TV.", options: ["will be watching", "watch", "will have watched", "watched"], a: 0 },
        { q: "She ___ the report by Friday, so it will be ready for the meeting.", options: ["will write", "will be writing", "will have written", "writes"], a: 2 }
      ],
      practice: [
        { q: "By 2026 I ___ university.", hint: "finish", a: ["will have finished"] },
        { q: "This time tomorrow I ___ to Istanbul.", hint: "fly", a: ["will be flying"] },
        { q: "By the time you arrive, I ___ .", hint: "leave", a: ["will have left"] },
        { q: "At 8pm I ___ TV.", hint: "watch", a: ["will be watching"] },
        { q: "She ___ the report by Friday.", hint: "finish", a: ["will have finished"] }
      ]
    }
  ]
};
