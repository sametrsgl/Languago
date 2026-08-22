/* Languago — Dilbilgisi C1 (İleri) */
// CEFR-C1 müfredatı; 3 aşamalı iskele (Tanıma → Yönlendirmeli → Gerçek Yaşam).
export const GRAMMAR_C1 = {
  id: "c1",
  title: "C1 · İleri",
  subtitle: "Akademik ve incelikli dilbilgisi",
  color: "#7C3AED",
  units: [
    {
      id: "c1-01",
      title: "Advanced Passive (Genişletilmiş Edilgen)",
      short: "It is said that… / He is believed to…",
      slides: [
        { h: "Kişisiz edilgen (impersonal passive)", b: "Görüş/iddiaları 'is + 3. hal + that' ile aktarırız:\n\n> It is said that she is brilliant. (söyleniyor)\n> It is believed that the treaty will fail.\n\nbaşlıca fiiller: say, believe, think, report, know, claim." },
        { h: "Kişili edilgen (personal passive)", b: "Özne odaklanırsa 'is + 3. hal + to':\n\n> She is said to be brilliant.\n> They are believed to have left the city.\n\nDevam eden eylem için to be + -ing: He is thought to be hiding." },
        { h: "Zaman uyumu", b: "have + 3. hal ile geçmiş iddia öne alınır:\n\n> He is said to have resigned. (istifa ettiği söyleniyor)\n> The news is reported to have reached them.\n\nKuru pasif yerine bu yapı resmî/akademik metinde vurguyu yumuşatır." }
      ],
      mistakes: [
        { w: "It is said that she is brilliant.", r: "(doğru)", n: "Kişisiz edilgen doğru: It + is + 3.hal + that + cümle." },
        { w: "She is said to be left the city.", r: "She is said to have left the city.", n: "Bitmiş iddia için to have + 3. hal kullanılır." },
        { w: "People say to be rich man he is.", r: "He is said to be a rich man.", n: "Edilgen düzeni: özne + is said + to be + tümleç." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "It ___ that the factory will close next year.", hint: "be + said", a: ["is said"] },
        // Aşama 2 — Yönlendirmeli
        { q: "She ___ to have quit her job.", hint: "be + believed", a: ["is believed"] },
        { q: "The painting ___ to be a fake.", hint: "be + thought", a: ["is thought"] },
        // Aşama 3 — Gerçek yaşam
        { q: "He ___ to have spoken at the summit.", hint: "be + reported (geçmiş iddia)", a: ["is reported"] },
        { q: "The refugees ___ to be arriving by night.", hint: "be + known + to be -ing", a: ["are known"] }
      ]
    },
    {
      id: "c1-02",
      title: "Get-passive & Pasif Mastar",
      short: "get broken / being + 3.hal",
      slides: [
        { h: "get edilgeni (get-passive)", b: "Olayın özne üzerindeki etkisi veya beklenmedik oluşu vurgulanır; konuşma ve anlatı dilinde yaygın:\n\n> The car got damaged in the storm.\n> He got fired last week.\n\nresmi metinlerde be-passive tercih edilir." },
        { h: "Pasif mastar (passive infinitive)", b: "to + be + 3.hal — edilecek bir işi anlatır:\n\n> This report needs to be rewritten.\n> She hopes to be promoted soon." },
        { h: "being + 3.hal (passive -ing)", b: "Edilgen gerund, fiil ya da edat sonrası:\n\n> He hates being photographed.\n> She is proud of being chosen.\n\n! being + to karışımı resmî C1 metninde sık görülür: worth being considered." }
      ],
      mistakes: [
        { w: "The glass got broken by the child.", r: "(doğru)", n: "get-passive olayın etkisi için doğru; broken + by uyumlu." },
        { w: "This room needs to be clean.", r: "This room needs to be cleaned.", n: "Pasif mastar: to be + 3. hal (cleaned)." },
        { w: "She is afraid of being photograph.", r: "She is afraid of being photographed.", n: "being + 3. hal; photograph → photographed." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "The windows got ___ during the earthquake.", hint: "break (3.hal)", a: ["broken"] },
        // Aşama 2 — Yönlendirmeli
        { q: "This essay needs to be ___ .", hint: "rewrite (3.hal)", a: ["rewritten"] },
        { q: "He hates ___ photographed.", hint: "passive gerund", a: ["being"] },
        // Aşama 3 — Gerçek yaşam
        { q: "The contract is expected to be ___ next month.", hint: "sign (3.hal)", a: ["signed"] },
        { q: "She got ___ from the team for being late.", hint: "dismiss (3.hal)", a: ["dismissed"] }
      ]
    },
    {
      id: "c1-03",
      title: "Hedging & Kesinlik Kipleri",
      short: "yumuşatma ve olasılık",
      slides: [
        { h: "Hedging (yumuşatma)", b: "Akademik/örgün dilde iddiaları kesinleştirip de yumuşatırız; perhaps, presumably, arguably, to some extent:\n\n> The results are arguably significant.\n> She presumably knew the risk." },
        { h: "Kesinlik derecesi", b: "must (kesin) → should (beklenen) → may/might/could (olası) → can't (imkânsız):\n\n> They must be exhausted.\n> The plan could still work." },
        { h: "Belirsizliği zarflarla inceltme", b: "might + zarf → kesinlik azalır:\n\n> It might possibly rain.\n> She may well be right.\n\ncould well, might just ile nüans artar: He could well be mistaken." }
      ],
      mistakes: [
        { w: "The meeting is arguably finished on time.", r: "The meeting arguably finished on time.", n: "arguably eylem öncesi iddiayı yumuşatır; gerekli yapı bozuk." },
        { w: "It must possibly be true.", r: "It may possibly be true.", n: "must kesin; possibly olasılıkla çelişir → may/might kullanılır." },
        { w: "She could well be right about the outcome.", r: "(doğru)", n: "could well + be kesinliklere yakın güçlü olasılık verir." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "The findings are ___ significant to the field.", hint: "savunulabilir şekilde", a: ["arguably"] },
        // Aşama 2 — Yönlendirmeli
        { q: "You ___ be exhausted after that long flight.", hint: "kesin olasılık", a: ["must"] },
        { q: "It ___ possibly be a coincidence.", hint: "belirsiz olasılık", a: ["might", "may"] },
        // Aşama 3 — Gerçek yaşam
        { q: "She ___ well have resigned by now.", hint: "güçlü olasılık + geçmiş", a: ["may", "might", "could"] },
        { q: "The proposal ___ not be feasible, presumably.", hint: "olasılık + olumsuz", a: ["may", "might", "could"] }
      ]
    },
    {
      id: "c1-04",
      title: "Genişletilmiş & Devrik Koşullar",
      short: "Had I known… / Were you to…",
      slides: [
        { h: "Devrik koşullar (conditional inversion)", b: "if'siz koşul, resmî dilde vurgu için:\n\n> Had I known, I would have acted. (if I had known)\n> Were you to ask, I would say yes. (if you asked)\n> Should it rain, we'll cancel. (if it rains)" },
        { h: "Karışık koşullar (mixed)", b: "Geçmiş koşul → şimdiki sonuç ve tersi:\n\n> If she had applied, she would be here now.\n> If I were fitter, I would have run." },
        { h: "If it were not for / but for", b: "Bir durumu olmasaydı senaryosuna bağlar:\n\n> If it weren't for you, I'd be lost.\n> But for the rain, we'd have played." }
      ],
      mistakes: [
        { w: "Had I known, I would acted.", r: "Had I known, I would have acted.", n: "Devrik koşulda ana cümle would have + 3.hal." },
        { w: "Were she asks, I would reply.", r: "Were she to ask, I would reply.", n: "were + özne + to + fiil; asks değil." },
        { w: "If it hadn't been for you, I would be lost.", r: "If it weren't for you, I would be lost.", n: "Şimdiki duruma bağlı senaryo genelde present → weren't for." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "___ she known the truth, she'd have reacted.", hint: "devrik if + had", a: ["Had"] },
        // Aşama 2 — Yönlendirmeli
        { q: "Were you ___ ask, I would help.", hint: "to + fiil", a: ["to"] },
        { q: "Should it ___ , we'll cancel the picnic.", hint: "rain (should + fiil)", a: ["rain"] },
        // Aşama 3 — Gerçek yaşam
        { q: "___ for the scholarship, she couldn't study abroad.", hint: "if it weren't for → but", a: ["But", "But for"] },
        { q: "Had they paid earlier, the fine ___ been avoided.", hint: "would have", a: ["would have"] }
      ]
    },
    {
      id: "c1-05",
      title: "Cleft Cümleleri (Vurgu Yapıları)",
      short: "It was X that… / What I want is…",
      slides: [
        { h: "It-cleft", b: "Tek bir parçayı (özne/nesne/zaman/yer) vurgular:\n\n> It was Mert who broke the glass.\n> It is in autumn that leaves fall.\n> It was last week that we decided." },
        { h: "What-cleft", b: "Eylem/nesne vurgusu; özne olarak tekil 'is':\n\n> What I need is a break.\n> What worries me is the cost." },
        { h: "All / The thing", b: "Daraltılmış vurgu:\n\n> All I want is peace.\n> The thing I admire most is her honesty.\n\nCleft cümleleri konuşmacının odağını netleştirir." }
      ],
      mistakes: [
        { w: "It was yesterday that we decided.", r: "(doğru)", n: "Zaman vurgusu it + was + that ile doğru kurulmuş." },
        { w: "It was Mert who he broke the glass.", r: "It was Mert who broke the glass.", n: "Odak 'Mert' olduğundan zamir tekrar edilmez." },
        { w: "What I need are a break.", r: "What I need is a break.", n: "what-cleft öznesi tekil kabul edilir → is." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "It ___ Zoe who found the treasure.", hint: "be (geçmiş)", a: ["was"] },
        // Aşama 2 — Yönlendirmeli
        { q: "It is in Lisbon ___ they first met.", hint: "that / where hangisi", a: ["that"] },
        { q: "What I worry ___ is the deadline.", hint: "about", a: ["about"] },
        // Aşama 3 — Gerçek yaşam
        { q: "___ I ask is a moment of your time.", hint: "tek şey", a: ["All"] },
        { q: "It was her calm ___ impressed the committee.", hint: "that", a: ["that"] }
      ]
    },
    {
      id: "c1-06",
      title: "Devyirme & İnversion (İleri)",
      short: "fronting / rarely / no sooner",
      slides: [
        { h: "Devyirme (fronting)", b: "Vurgu için tümleci veya yan cümleciği öne alırız:\n\n> Into the room walked a stranger.\n> Hard though it was, we persisted.\n\nörgün açılış için: Not only, never, rarely, hardly…" },
        { h: "Olumsuz zarfla inversion", b: "Never/hardly/rarely/no sooner cümle başındaysa özne-fiil yer değiştirir:\n\n> Never have I seen such dedication.\n> No sooner had he left than it rained." },
        { h: "so / such önünde", b: "Güçlü sonucu öne alırız:\n\n> So convincing was her reply that all agreed.\n> Such was the chaos that we fled." }
      ],
      mistakes: [
        { w: "Never I have seen such talent.", r: "Never have I seen such talent.", n: "Olumsuz zarfla başlayınca yardımcı fiil öznenin önüne geçer." },
        { w: "No sooner had he left when it rained.", r: "No sooner had he left than it rained.", n: "Kalıp: no sooner…than (when değil)." },
        { w: "Rarely do we encounter such diligence.", r: "(doğru)", n: "rarely do + özne + fiil inversion doğrudur." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "Never ___ I seen a more committed team.", hint: "have", a: ["have"] },
        // Aşama 2 — Yönlendirmeli
        { q: "No sooner ___ she arrived than the bell rang.", hint: "had", a: ["had"] },
        { q: "Rarely ___ we face such challenges.", hint: "do", a: ["do"] },
        // Aşama 3 — Gerçek yaşam
        { q: "So ___ was the speech that nobody moved.", hint: "be + moving (sıfat değil fiil)", a: ["moving"] },
        { q: "Not only ___ the firm grow, but it also expanded abroad.", hint: "did", a: ["did"] }
      ]
    },
    {
      id: "c1-07",
      title: "Karmaşık İsim Öbekleri & Adlaştırma",
      short: "nominalization",
      slides: [
        { h: "Adlaştırma (nominalization)", b: "Eylem/sıfatı isme çevirerek akademik metin oluştururuz:\n\n> We analysed → The analysis of…\n> Accessible → accessibility of…\n\nfiillerin isim hâli: investigate→investigation, propose→proposal." },
        { h: "Çoklu niteleyiciler", b: "Soldan sağa daralan sıfat/noun zincirleri:\n\n> a small round oak dining table\n> the government's energy policy review committee" },
        { h: "Niteleyici + edat öbeği", b: "Kesinlik için ismin ardına edat gelir:\n\n> the development of renewable energy sources\n> a policy on climate change\n\nAşırı adlaştırma ile cümle ağırlaşır — C1'de redaksiyon gerekir." }
      ],
      mistakes: [
        { w: "The app develop was impressive.", r: "The development of the app was impressive.", n: "Eylem → isim: develop → development." },
        { w: "a oak table", r: "an oak table.", n: "oak ünlü harfle başlar → an (bir önceki adet yanlışı)." },
        { w: "the review of policy committee energy", r: "the energy policy review committee.", n: "Niteleyici zincirinde sıralama: özne sıfatı → amaç → ana isim." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "The ___ of the data took three weeks.", hint: "analyse → isim", a: ["analysis"] },
        // Aşama 2 — Yönlendirmeli
        { q: "Their ___ was widely praised.", hint: "propose → isim", a: ["proposal"] },
        { q: "She bought an ___ table.", hint: "oak / apple → artikel", a: ["oak"] },
        // Aşama 3 — Gerçek yaşam
        { q: "The government formed a health ___ committee.", hint: "policy (noun chain)", a: ["policy"] },
        { q: "___ of the economy drove the decision.", hint: "stabilize → isim", a: ["Stabilization", "Stability"] }
      ]
    },
    {
      id: "c1-08",
      title: "Gelişmiş Aktarma Kalıpları",
      short: "reporting verbs + patterns",
      slides: [
        { h: "Fiil + to-inf", b: "claim, threaten, refuse, offer, agree:\n\n> He claimed to have seen it.\n> She refused to comment." },
        { h: "Fiil + kişi + to-inf", b: "persuade, urge, warn, remind, advise:\n\n> They urged her to apply.\n> I warned him not to go." },
        { h: "Fiil + -ing / that", b: "admit, deny, suggest, insist:\n\n> He admitted leaving early.\n> She insisted that we wait.\n\nBu kalıpların doğru eşleşmesi C1 sınavlarında (YDS/YÖKDİL) sık ölçülür." }
      ],
      mistakes: [
        { w: "He advised me applying at once.", r: "He advised me to apply at once.", n: "advise + kişi + to-inf (applying değil)." },
        { w: "They insisted to go.", r: "They insisted on going.", n: "insist + on + -ing (to-inf değil)." },
        { w: "She admitted to steal the file.", r: "She admitted stealing the file.", n: "admit + -ing (to + fiil değil)." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "He claimed ___ solved the puzzle.", hint: "to + have", a: ["to have"] },
        // Aşama 2 — Yönlendirmeli
        { q: "She persuaded her friend ___ to the talk.", hint: "come (to)", a: ["to come"] },
        { q: "They insisted ___ paying the bill.", hint: "on", a: ["on"] },
        // Aşama 3 — Gerçek yaşam
        { q: "The director urged the staff ___ overtime.", hint: "accept (to)", a: ["to accept"] },
        { q: "He denied ___ the documents.", hint: "sign (İng)", a: ["signing"] }
      ]
    },
    {
      id: "c1-09",
      title: "Participe Cümlecikleri",
      short: "Having finished… / Written in…",
      slides: [
        { h: "Genişletilmiş participle clause", b: "Zaman/neden eşzamanlılığını -ing ile öne taşırız:\n\n> Having finished the report, she left.\n> Not knowing the answer, he stayed silent." },
        { h: "Pasif participle", b: "-ed/-en biçimi edilgen anlam taşır:\n\n> Written in 1900, the novel remains relevant.\n> Built on a hill, the castle commands the valley." },
        { h: "Bağlaç + participle", b: "while/when/before/after/on + -ing:\n\n> Before leaving, check the doors.\n> While travelling, she kept a diary.\n\n! Özne uyumu şart: yan cümlecik öznesi ana cümle öznesiyle aynı olmalı." }
      ],
      mistakes: [
        { w: "Having finished the report, it was sent.", r: "Having finished the report, she sent it.", n: "Participe cümleciğin öznesi ana cümle öznesiyle uyuşmalı." },
        { w: "Written in 1900, the writer is famous.", r: "Written in 1900, the novel is famous.", n: "-ed pasif, roman yazıldı; yazar değil." },
        { w: "While travelling, she kept a diary.", r: "(doğru)", n: "while + -ing eşzamanlı eylem için doğrudur." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "___ the course, she applied for the job.", hint: "having + finish", a: ["Having finished"] },
        // Aşama 2 — Yönlendirmeli
        { q: "___ in 1999, the law is now outdated.", hint: "pass (3.hal pasif)", a: ["Passed"] },
        { q: "Before ___ home, lock the room.", hint: "leave (İng)", a: ["leaving"] },
        // Aşama 3 — Gerçek yaşam
        { q: "___ to the delay, we missed the connection.", hint: "due (passive participle)", a: ["Owing"] },
        { q: "Not ___ the route, they used a map.", hint: "know (İng)", a: ["knowing"] }
      ]
    },
    {
      id: "c1-10",
      title: "Subjunctive & Resmi Yapılar",
      short: "It is essential that he be…",
      slides: [
        { h: "Subjunctive (dilek kipi)", b: "Zorunluluk/öneri eylemlerinden sonra fiil yalın (he be, she go):\n\n> It is essential that he be present.\n> I suggest that she leave now.\n\nbaşlıca: essential, vital, crucial, demand, insist, propose." },
        { h: "Basit subjunctive", b: "Olumsuzda not + yalın fiil:\n\n> It is vital that he not be disturbed.\n> The law requires that every driver carry insurance." },
        { h: "Resmi çekim seçenekleri", b: "should + fiil alternatifi:\n\n> It is vital that he be present. = It is vital that he should be present.\n\nAmerikan İngilizcesinde yalın mastar yaygın; Britanyada should+fiil doğal." }
      ],
      mistakes: [
        { w: "It is essential that he is present.", r: "It is essential that he be present.", n: "Şart/eylem sonrası subjunctive → yalın fiil (be)." },
        { w: "I suggest that she leaves now.", r: "I suggest that she leave now.", n: "suggest + that + yalın fiil (leaves değil)." },
        { w: "It is vital that he not be disturbed.", r: "(doğru)", n: "Olumsuz subjunctive: that + he + not + yalın fiil doğrudur." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "It is vital that she ___ the exam.", hint: "take (subjunctive)", a: ["take"] },
        // Aşama 2 — Yönlendirmeli
        { q: "It is essential that he ___ informed.", hint: "be", a: ["be"] },
        { q: "The law requires that everyone ___ a licence.", hint: "hold (subjunctive)", a: ["hold"] },
        // Aşama 3 — Gerçek yaşam
        { q: "I demand that the report ___ rewritten.", hint: "be", a: ["be"] },
        { q: "It is crucial that he not ___ the truth.", hint: "reveal (yalın)", a: ["reveal"] }
      ]
    },
    {
      id: "c1-11",
      title: "Düşürme & İkame (Ellipsis)",
      short: "so / not / do so",
      slides: [
        { h: "Düşürme (ellipsis)", b: "Tekrarı önlemek için bağlamca anlaşılan ögeler atılır:\n\n> She writes better than I (write).\n> A: Coming? B: (I am) Coming." },
        { h: "so / not ikamesi", b: "Olumlu/olumsuz kısa yanıtlar:\n\n> I think so. / I don't think so.\n> I hope so. / I fear not." },
        { h: "do / do so", b: "Önceki eyleme gönderme:\n\n> She asked me to call, and I did.\n> They support the plan; we do so too.\n\nresmi metinlerde 'aspect': He revised the essay and should have done so earlier." }
      ],
      mistakes: [
        { w: "I think so. / I don't think so.", r: "(doğru)", n: "so ile olumlu, not ile olumsuz kısa yanıt doğrudur." },
        { w: "She runs faster than I do.", r: "(doğru)", n: "do takviye fiili karşılaştırma sonrasında koruyucu." },
        { w: "I asked him to leave, and he did it left.", r: "I asked him to leave, and he did.", n: "did it left fazlalık; do eylemi ikame eder." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "A: Will it rain?  B: I hope ___.", hint: "olumlu kısa yanıt", a: ["so"] },
        // Aşama 2 — Yönlendirmeli
        { q: "I don't think ___.", hint: "olumsuz kısa yanıt", a: ["so"] },
        { q: "She sings better than he ___.", hint: "takevye fiili", a: ["does"] },
        // Aşama 3 — Gerçek yaşam
        { q: "They invested early; the rivals should have done ___ before.", hint: "önceki eyleme gönderme", a: ["so"] },
        { q: "A: Are you joining?  B: I'm ___.", hint: "olumsuz (fear + not)", a: ["not", "afraid not"] }
      ]
    },
    {
      id: "c1-12",
      title: "Ölçü & Derece Yapıları",
      short: "so…that / such…that / too…to",
      slides: [
        { h: "so + sıfat/zarf + that", b: "Sonuç kalıbı; sıfatın önüne veya devrik açılışa gelebilir:\n\n> The noise was so loud that we left.\n> So tired was she that she slept instantly." },
        { h: "such + isim + that", b: "İsim istenir:\n\n> It was such a difficult task that we gave up.\n> Such was the crowd that we couldn't enter." },
        { h: "too…to / enough…to", b: "Yetersiz/ölçü beklentisi:\n\n> The box is too heavy to carry.\n> She was strong enough to lift it.\n\ntoo + sıfat + to için olumsuz sonuç. C1'de 'such' derinliğine vurgu yapılır." }
      ],
      mistakes: [
        { w: "The task was so difficult that we gave up.", r: "(doğru)", n: "so + sıfat + that sonuç kalıbı doğru kurulmuş." },
        { w: "It was such difficult task that we quit.", r: "It was such a difficult task that we quit.", n: "such + a/an + sıfat + tekil isim gerekir." },
        { w: "The box is too heavy to carry.", r: "(doğru)", n: "too + sıfat + to-inf olumsuz sonuç için doğrudur." }
      ],
      practice: [
        // Aşama 1 — Tanıma
        { q: "The film was so ___ that everyone cried.", hint: "sad (sıfat)", a: ["sad"] },
        // Aşama 2 — Yönlendirmeli
        { q: "It was ___ a long journey that we boarded early.", hint: "such", a: ["such"] },
        { q: "The coffee is too hot ___ drink now.", hint: "to", a: ["to"] },
        // Aşama 3 — Gerçek yaşam
        { q: "Such was the ___ that flights were cancelled.", hint: "storm / chaos (isim)", a: ["storm"] },
        { q: "She was calm ___ to face the interview.", hint: "enough", a: ["enough"] }
      ]
    }
  ]
};