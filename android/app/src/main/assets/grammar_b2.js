/* English Word Coach — Dilbilgisi B2 (Orta Üstü) */
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
        { h: "Kuruluş", b: "have/has + been + fiil-ing\n\n> I have been working.\n> She has been studying." },
        { h: "Kullanım", b: "Geçmişte başlayıp hâlâ devam eden eylem, süre vurgusu:\n\n> I have been working for 3 hours.\n> It has been raining since morning." },
        { h: "Present Perfect ile fark", b: "Continuous sürece/sürekliliğe vurgu yapar:\n\n> I have read the book. (bitirdim)\n> I have been reading the book. (hâlâ okuyorum)" }
      ],
      mistakes: [
        { w: "I have been work here.", r: "I have been working here.", n: "Fiil -ing alır." },
        { w: "She has been worked all day.", r: "She has been working all day.", n: "been + fiil-ing." },
        { w: "They has been playing.", r: "They have been playing.", n: "Çoğul için have." }
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
        { h: "Kuruluş", b: "had + fiil 3. hali\n\n> I had finished.\n> She had left." },
        { h: "Kullanım", b: "Geçmişte başka bir olaydan ÖNCE olan eylem:\n\n> When I arrived, she had left. (önce o gitti)" },
        { h: "Sıra", b: "İki geçmiş olayın sırasını netleştirir:\n\n> I had eaten before I went out." }
      ],
      mistakes: [
        { w: "I had went home.", r: "I had gone home.", n: "go'nun 3. hali gone." },
        { w: "She had ate dinner.", r: "She had eaten dinner.", n: "eat → eaten." },
        { w: "When I arrived, she left.", r: "When I arrived, she had left.", n: "Önce olan olay past perfect." }
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
        { h: "Yapı", b: "If + past perfect, would have + fiil 3. hali\n\n> If I had studied, I would have passed." },
        { h: "Anlam", b: "Geçmişte gerçekleşmemiş hayali durum (pişmanlık):\n\n> If I had known, I would have come." },
        { h: "Kısaltma", b: "had ve would kısaltılabilir:\n\n> If I'd known, I'd have come." }
      ],
      mistakes: [
        { w: "If I had known, I would go.", r: "If I had known, I would have gone.", n: "would have + 3. hal." },
        { w: "If I knew, I would have come.", r: "If I had known, I would have come.", n: "if sonrası past perfect." },
        { w: "If I had studied, I would had passed.", r: "If I had studied, I would have passed.", n: "would have (had değil)." }
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
        { h: "Yapı", b: "Farklı zamanları karıştırır:\n\n> If + past perfect (geçmiş), would + fiil (şimdi)\n\n> If I had studied, I would have a good job now." },
        { h: "Anlam", b: "Geçmişteki koşul → şimdiki sonuç:\n\n> If she had saved money, she would be rich now." },
        { h: "Diğer karışım", b: "If + past simple (şimdi) + would have (geçmiş):\n\n> If I weren't shy, I would have spoken." }
      ],
      mistakes: [
        { w: "If I had studied, I will have a job now.", r: "If I had studied, I would have a job now.", n: "Şimdiki sonuç → would + fiil." },
        { w: "If she had saved, she has money now.", r: "If she had saved, she would have money now.", n: "would kullanılır." }
      ],
      practice: [
        { q: "If I had saved money, I ___ a car now.", hint: "have", a: ["would have"] },
        { q: "If she had studied, she ___ a doctor now.", hint: "be", a: ["would be"] },
        { q: "If he had taken the job, he ___ in London now.", hint: "live", a: ["would live"] },
        { q: "If I ___ shy, I would have spoken.", hint: "be (olumsuz)", a: ["weren't", "were not", "wasn't", "was not"] }
      ]
    },
    {
      id: "b2-05",
      title: "Reported Speech",
      short: "dolaylı anlatım",
      slides: [
        { h: "Zaman kayması", b: "Söyleneni aktarırken zaman genelde bir adım geriye kayar:\n\n> 'I am tired' → He said he was tired.\n> 'I will come' → She said she would come." },
        { h: "Söyleme fiilleri", b: "say (+ that) / tell + nesne\n\n> He said (that) he was busy.\n> He told me (that) he was busy.\n\n! tell'den sonra nesne gerekir: told me (doğru) / said me (yanlış)" },
        { h: "Diğer değişimler", b: "Zaman/yer sözcükleri ve zamirler değişir:\n\n> now → then, today → that day\n> tomorrow → the next day, here → there" }
      ],
      mistakes: [
        { w: "He said he will come.", r: "He said he would come.", n: "will → would." },
        { w: "She said me she was tired.", r: "She told me she was tired.", n: "said me değil, told me." },
        { w: "He said he is hungry.", r: "He said he was hungry.", n: "is → was (kayma)." }
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
      title: "Edilgen Çatı (Tüm Zamanlar)",
      short: "pasif yapılar",
      slides: [
        { h: "Farklı zamanlar", b: "> Present Continuous: is being built\n> Present Perfect: has been built\n> Past Perfect: had been built\n> Future: will be built" },
        { h: "Kullanım", b: "Eylem önemliyse veya yapan bilinmiyorsa:\n\n> The new bridge is being built.\n> The work has been finished." },
        { h: "with by", b: "Eylemi yapan belirtilirse by kullanılır:\n\n> The book was written by a famous author." }
      ],
      mistakes: [
        { w: "The work has been do.", r: "The work has been done.", n: "do'nun 3. hali done." },
        { w: "The house is being build.", r: "The house is being built.", n: "build → built." },
        { w: "It will be build next year.", r: "It will be built next year.", n: "be + 3. hal." }
      ],
      practice: [
        { q: "The report ___ now.", hint: "write (pasif, şimdi)", a: ["is being written"] },
        { q: "The bridge ___ last year.", hint: "build (pasif)", a: ["was built"] },
        { q: "The work ___ .", hint: "finish (pasif, present perfect)", a: ["has been finished"] },
        { q: "The letters ___ tomorrow.", hint: "send (pasif, gelecek)", a: ["will be sent"] },
        { q: "The window ___ by a boy.", hint: "break (pasif, geçmiş)", a: ["was broken"] }
      ]
    },
    {
      id: "b2-07",
      title: "Gerund & Infinitive",
      short: "-ing mi, to mu?",
      slides: [
        { h: "Gerund (-ing)", b: "Bazı fiillerden sonra -ing gelir:\n\n> enjoy, finish, mind, avoid, suggest, keep\n\n> I enjoy reading." },
        { h: "Infinitive (to)", b: "Bazı fiillerden sonra to gelir:\n\n> want, decide, hope, plan, need, promise\n\n> I want to go." },
        { h: "İkisi de", b: "Bazı fiiller her ikisini alır:\n\n> like, love, start, begin\n\n> I like reading. / I like to read." }
      ],
      mistakes: [
        { w: "I enjoy to read.", r: "I enjoy reading.", n: "enjoy sonrası -ing." },
        { w: "I want going home.", r: "I want to go home.", n: "want sonrası to." },
        { w: "She decided leaving.", r: "She decided to leave.", n: "decide sonrası to." }
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
      title: "Çıkarım Kipleri",
      short: "must / might / can't",
      slides: [
        { h: "Şimdiki zaman", b: "must → kesin (olduğundan emin)\nmight/may/could → olası\ncan't → imkânsız\n\n> He must be tired. (kesin)\n> She might be at work.\n> It can't be true." },
        { h: "Geçmiş zaman", b: "must have + 3. hal → geçmişte kesin\nmight have → geçmişte olası\ncan't have → geçmişte imkânsız\n\n> He must have forgotten." },
        { h: "Dikkat", b: "Olumsuz kesin çıkarım için 'can't' (mustn't değil):\n\n> It can't be true. (imkânsız)\n> You mustn't smoke. (yasak)" }
      ],
      mistakes: [
        { w: "He must be at home? (imkânsız anlamında)", r: "He can't be at home.", n: "İmkânsız çıkarım → can't." },
        { w: "She must tired.", r: "She must be tired.", n: "must + be + sıfat." },
        { w: "He must have went.", r: "He must have gone.", n: "gone (3. hal)." }
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
        { h: "Şimdiki dilek", b: "wish + past simple → şimdiki gerçek dışı dilek\n\n> I wish I had a car. (keşke arabam olsa)\n> I wish I were taller." },
        { h: "Geçmiş pişmanlık", b: "wish + past perfect → geçmişe dair pişmanlık\n\n> I wish I had studied harder." },
        { h: "would", b: "wish + would → değişmesini istediğimiz şey\n\n> I wish it would stop raining.\n> I wish you would listen." }
      ],
      mistakes: [
        { w: "I wish I have a car.", r: "I wish I had a car.", n: "Şimdiki dilek → past simple." },
        { w: "I wish I have known.", r: "I wish I had known.", n: "Geçmiş pişmanlık → past perfect." },
        { w: "I wish I am taller.", r: "I wish I were taller.", n: "wish sonrası were." }
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
      title: "Future Perfect & Continuous",
      short: "will have / will be -ing",
      slides: [
        { h: "Future Perfect", b: "will have + fiil 3. hali → gelecekte belirli ana kadar tamamlanmış\n\n> By 2026 I will have finished university." },
        { h: "Future Continuous", b: "will be + fiil-ing → gelecekte belirli anda devam eden\n\n> This time tomorrow I will be flying to Istanbul." },
        { h: "Zaman ifadeleri", b: "Future Perfect: by, by the time\nFuture Continuous: this time tomorrow, at 8pm" }
      ],
      mistakes: [
        { w: "By 2030 I will live here.", r: "By 2030 I will have lived here.", n: "by + tamamlanma → future perfect." },
        { w: "This time tomorrow I will work.", r: "This time tomorrow I will be working.", n: "Belirli anda devam → future continuous." }
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
