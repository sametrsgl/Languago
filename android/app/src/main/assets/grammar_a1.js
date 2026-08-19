/* English Word Coach — Dilbilgisi A1 (Başlangıç) */
window.GRAMMAR_A1 = {
  id: "a1",
  title: "A1 · Başlangıç",
  subtitle: "Temel dilbilgisi",
  color: "#10B981",
  units: [
    {
      id: "a1-01",
      title: "To Be (am / is / are)",
      short: "Olmak fiili",
      slides: [
        { h: "am / is / are", b: "İngilizcede 'olmak' fiili am, is ve are ile ifade edilir. Özneye göre doğru olanı seçeriz.\n\n- I → am\n- He / She / It → is\n- You / We / They → are" },
        { h: "Olumsuz ve soru", b: "Olumsuzda not ekleriz: am not, is not (isn't), are not (aren't).\n\n> I am not tired. → Yorgun değilim.\n> She isn't here. → O burada değil.\n\nSoruda fiil başa gelir:\n> Are you ready? → Hazır mısın?" },
        { h: "Nerede kullanılır?", b: "Kimlik, meslek, durum ve yer belirtirken kullanılır.\n\n> I am a student. → Öğrenciyim.\n> He is a doctor. → O bir doktor.\n> They are happy. → Onlar mutlu.\n\n! Dikkat: Türkçede ayrı bir 'olmak' fiili çoğu zaman söylenmez; İngilizcede am/is/are mutlaka yazılır." }
      ],
      mistakes: [
        { w: "She are a teacher.", r: "She is a teacher.", n: "Üçüncü tekil şahıs (he/she/it) için is kullanılır." },
        { w: "I is happy.", r: "I am happy.", n: "I öznesi her zaman am alır." },
        { w: "They is students.", r: "They are students.", n: "Çoğul özneler (they/we/you) are alır." }
      ],
      practice: [
        { q: "I ___ a student.", hint: "be", a: ["am"] },
        { q: "She ___ my sister.", hint: "be", a: ["is"] },
        { q: "They ___ happy.", hint: "be", a: ["are"] },
        { q: "He ___ not here.", hint: "be (olumsuz)", a: ["is"] },
        { q: "___ you ready?", hint: "be (soru)", a: ["are"] },
        { q: "We ___ from Turkey.", hint: "be", a: ["are"] }
      ]
    },
    {
      id: "a1-02",
      title: "Zamirler ve İyelik Sıfatları",
      short: "I/my, he/his, she/her",
      slides: [
        { h: "Özne zamirleri", b: "Cümlede özneyi temsil eden zamirler:\n\n- I, you, he, she, it, we, they\n\n> He is my brother. → O benim erkek kardeşim." },
        { h: "İyelik sıfatları", b: "Bir şeyin kime ait olduğunu belirtir, isimden önce gelir:\n\n- I → my, You → your\n- He → his, She → her, It → its\n- We → our, They → their\n\n> This is my book. → Bu benim kitabım.\n> Her name is Anna. → Onun adı Anna." },
        { h: "Yaygın karışıklıklar", b: "İyelik sıfatı isimden ÖNCE gelir ve tekil/çoğula göre değişmez.\n\n> Their house is big. → Onların evi büyük.\n\n! Dikkat: his (erkeğin) ile her (kadının) karıştırılır. 'his' erkek, 'her' kadın içindir." }
      ],
      mistakes: [
        { w: "Me name is John.", r: "My name is John.", n: "'Benim' için my kullanılır; me nesne zamiridir." },
        { w: "He name is Ali.", r: "His name is Ali.", n: "Erkek için his; he özne zamiridir." },
        { w: "She book is new.", r: "Her book is new.", n: "Kadın için her kullanılır." }
      ],
      practice: [
        { q: "___ name is John.", hint: "I → benim", a: ["my"] },
        { q: "This is ___ book.", hint: "she → onun (kadın)", a: ["her"] },
        { q: "___ car is red.", hint: "they → onların", a: ["their"] },
        { q: "That is ___ pen.", hint: "you → senin", a: ["your"] },
        { q: "Ali likes ___ job.", hint: "he → onun (erkek)", a: ["his"] }
      ]
    },
    {
      id: "a1-03",
      title: "Artikeller (a / an / the)",
      short: "a, an, the",
      slides: [
        { h: "a / an", b: "Tekil sayılabilir isimlerden önce 'bir' anlamında kullanılır.\n\n- Sessiz harf sesiyle başlayan → a\n- Ünlü harf sesiyle başlayan → an\n\n> a book → bir kitap\n> an apple → bir elma" },
        { h: "the", b: "Belirli, bilinen bir şeyden bahsederken the kullanılır.\n\n> The sun is bright. → Güneş parlaktır.\n> Open the door. → Kapıyı aç." },
        { h: "İpuçları", b: "Ses önemlidir, harf değil.\n\n> an hour → bir saat (h sessiz)\n> a university → bir üniversite (u 'yu' diye okunur)\n\n! Dikkat: a/an yalnızca tekil sayılabilir isimlerle kullanılır." }
      ],
      mistakes: [
        { w: "I have a apple.", r: "I have an apple.", n: "apple ünlü sesle başlar → an." },
        { w: "She is a old teacher.", r: "She is an old teacher.", n: "old ünlü sesle başlar → an." },
        { w: "Sun is hot.", r: "The sun is hot.", n: "Tek olan şeyler için the kullanılır." }
      ],
      practice: [
        { q: "I see ___ apple.", hint: "a / an", a: ["an"] },
        { q: "She has ___ car.", hint: "a / an", a: ["a"] },
        { q: "He is ___ engineer.", hint: "a / an", a: ["an"] },
        { q: "___ moon is bright tonight.", hint: "a / an / the", a: ["the"] },
        { q: "I read ___ book yesterday.", hint: "a / an / the", a: ["a"] }
      ]
    },
    {
      id: "a1-04",
      title: "Çoğul İsimler",
      short: "book → books",
      slides: [
        { h: "Düzenli çoğullar", b: "Çoğul için genelde -s eklenir.\n\n> book → books, dog → dogs\n\n- -s, -ss, -sh, -ch, -x, -z ile bitenlere -es eklenir:\n> box → boxes, bus → buses" },
        { h: "-y ve -f/-fe", b: "-y ile biten ve önünde sessiz varsa → -ies:\n\n> baby → babies, city → cities\n\n-f/-fe genelde -ves olur:\n> knife → knives, wife → wives" },
        { h: "Düzensiz çoğullar", b: "Bazıları ezberlenmelidir:\n\n> man → men, woman → women, child → children\n> foot → feet, tooth → teeth, mouse → mice\n> person → people" }
      ],
      mistakes: [
        { w: "I have two book.", r: "I have two books.", n: "Çoğulda -s eklenir." },
        { w: "Three childs are playing.", r: "Three children are playing.", n: "child → children (düzensiz)." },
        { w: "Two boxs on the floor.", r: "Two boxes on the floor.", n: "box → boxes (-es)." }
      ],
      practice: [
        { q: "two ___", hint: "book", a: ["books"] },
        { q: "three ___", hint: "child", a: ["children"] },
        { q: "many ___", hint: "box", a: ["boxes"] },
        { q: "two ___", hint: "baby", a: ["babies"] },
        { q: "five ___", hint: "man", a: ["men"] }
      ]
    },
    {
      id: "a1-05",
      title: "Geniş Zaman (Olumlu)",
      short: "I work / She works",
      slides: [
        { h: "Kullanım", b: "Rutinleri, alışkanlıkları ve genel gerçekleri anlatır.\n\n> I drink coffee every morning.\n> The sun rises in the east." },
        { h: "Üçüncü tekil şahıs", b: "He / she / it ile fiile -s/-es eklenir.\n\n- I/you/we/they → fiil yalın\n- he/she/it → fiil + -s/-es\n\n> She works in a bank.\n> He watches TV." },
        { h: "-s / -es kuralı", b: "-ss, -sh, -ch, -x, -o ile biten fiiller -es alır.\n\n> go → goes, watch → watches\n\n-sessiz + y → -ies:\n> study → studies" }
      ],
      mistakes: [
        { w: "He go to school.", r: "He goes to school.", n: "Üçüncü tekil şahısta -es." },
        { w: "She like tea.", r: "She likes tea.", n: "he/she/it → fiil + -s." },
        { w: "They plays football.", r: "They play football.", n: "they öznesinde fiil yalın kalır." }
      ],
      practice: [
        { q: "She ___ in a bank.", hint: "work", a: ["works"] },
        { q: "They ___ football.", hint: "play", a: ["play"] },
        { q: "He ___ TV every night.", hint: "watch", a: ["watches"] },
        { q: "I ___ coffee.", hint: "like", a: ["like"] },
        { q: "She ___ to school by bus.", hint: "go", a: ["goes"] }
      ]
    },
    {
      id: "a1-06",
      title: "Geniş Zaman (Olumsuz ve Soru)",
      short: "don't / doesn't / Do",
      slides: [
        { h: "Olumsuz", b: "Olumsuzda do/does + not kullanılır, fiil yalın kalır.\n\n- I/you/we/they → don't\n- he/she/it → doesn't\n\n> I don't like tea.\n> She doesn't like tea." },
        { h: "Soru", b: "Soruda Do/Does başa gelir, fiil yalın kalır.\n\n> Do you like tea?\n> Does she like tea?" },
        { h: "Dikkat", b: "doesn't ve does'tan sonra fiil ASLA -s almaz.\n\n> She doesn't like (doğru)\n> She doesn't likes (yanlış)" }
      ],
      mistakes: [
        { w: "He don't like tea.", r: "He doesn't like tea.", n: "he/she/it için doesn't." },
        { w: "Does she likes tea?", r: "Does she like tea?", n: "does'tan sonra fiil yalın." },
        { w: "I doesn't know.", r: "I don't know.", n: "I/you/we/they için don't." }
      ],
      practice: [
        { q: "He ___ like tea.", hint: "not (olumsuz)", a: ["doesn't", "does not"] },
        { q: "___ you like coffee?", hint: "do / does", a: ["do"] },
        { q: "She ___ work here.", hint: "not (olumsuz)", a: ["doesn't", "does not"] },
        { q: "___ he play football?", hint: "do / does", a: ["does"] },
        { q: "I ___ eat meat.", hint: "not (olumsuz)", a: ["don't", "do not"] }
      ]
    },
    {
      id: "a1-07",
      title: "There is / There are",
      short: "vardır / vardır (çoğul)",
      slides: [
        { h: "Kullanım", b: "Bir yerde bir şeyin var olduğunu söylerken kullanılır.\n\n- Tekil/sayılamaz → There is\n- Çoğul → There are\n\n> There is a book on the table.\n> There are two cats." },
        { h: "Olumsuz ve soru", b: "> There isn't a park here.\n> Are there any shops?\n> Is there a bank near here?" },
        { h: "Kısa yazım", b: "There is → There's (yalnızca tekilde).\n\n! Dikkat: There are kısaltılmaz." }
      ],
      mistakes: [
        { w: "There is two cats.", r: "There are two cats.", n: "Çoğul → there are." },
        { w: "There are a book.", r: "There is a book.", n: "Tekil → there is." },
        { w: "It is a park near.", r: "There is a park near.", n: "Varlık için there is/are kullanılır." }
      ],
      practice: [
        { q: "___ a book on the table.", hint: "there is / there are", a: ["there is", "there's"] },
        { q: "___ two dogs in the garden.", hint: "there is / there are", a: ["there are"] },
        { q: "___ a park near my house.", hint: "there is / there are", a: ["there is", "there's"] },
        { q: "___ many students here.", hint: "there is / there are", a: ["there are"] }
      ]
    },
    {
      id: "a1-08",
      title: "Edatlar (in / on / at)",
      short: "yer ve zaman",
      slides: [
        { h: "Yer: in / on / at", b: "in → içinde, on → üstünde, at → belirli nokta\n\n> The keys are in the box.\n> The book is on the table.\n> She is at the door." },
        { h: "Zaman: in / on / at", b: "in → ay/yıl/mevsim, on → gün, at → saat\n\n> in July, in 2025\n> on Monday\n> at 5 o'clock" },
        { h: "İpuçları", b: "Sabit ifadeler:\n\n> at night, at the weekend\n> in the morning, in the evening\n> on the weekend (ABD)" }
      ],
      mistakes: [
        { w: "I go to school in Monday.", r: "I go to school on Monday.", n: "Günler için on." },
        { w: "The book is in the table.", r: "The book is on the table.", n: "Üstünde → on." },
        { w: "I wake up at the morning.", r: "I wake up in the morning.", n: "in the morning (sabit)." }
      ],
      practice: [
        { q: "I go to work ___ Monday.", hint: "in / on / at", a: ["on"] },
        { q: "My birthday is ___ July.", hint: "in / on / at", a: ["in"] },
        { q: "We meet ___ 5 o'clock.", hint: "in / on / at", a: ["at"] },
        { q: "The cat is ___ the table.", hint: "in / on / at", a: ["on"] },
        { q: "She lives ___ Istanbul.", hint: "in / on / at", a: ["in"] }
      ]
    }
  ]
};
