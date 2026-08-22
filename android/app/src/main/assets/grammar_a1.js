/* Languago — Dilbilgisi A1 (Başlangıç) */
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
        { h: "am / is /are — Kuruluş", b: "İngilizcede 'olmak' fiili am, is ve are olarak üç şekilde kullanılır.\n\nHer şey özneye (kim?) göre değişir:\n\n- I → am\n- He / She / It → is\n- You / We / They → are\n\n> I am a student. → Öğrenciyim.\n> He is a doctor. → O bir doktor.\n> They are happy. → Onlar mutlu.\n\n! NOT: Türkçede 'olmak' fiili çoğu zaman söylenmez ama İngilizcede mutlaka yazılır." },
        { h: "Olumsuz Cümleler", b: "Olumsuzda not kelimesi ekleriz:\n\n- am not (genellikle 'm not kısaltması)\n- is not → isn't\n- are not → aren't\n\n> I am not tired. → Yorgun değilim.\n> She isn't here. → O burada değil.\n> They aren't students. → Onlar öğrenci değiller.\n\n! UNUTMA: Olumsuzda da am/is/are yazılır, sadece not eklenir." },
        { h: "Soru Cümleleri", b: "Soruda fiil başa gelir, ardından özne:\n\n> Are you ready? → Hazır mısın?\n> Is he from England? → O İngilliz mü? (O ingiliz is mi?)\n> Is she a teacher? → O öğretmen mi?\n\n> Am I late? → Geç miyim?\n\n! İPUÇ: Soruda am/is/are mutlaka bulunur. \"You ready?\" yanlıştır." }
      ],
      mistakes: [
        { w: "She are a teacher.", r: "She is a teacher.", n: "He/She/It için is kullanılır, are değil." },
        { w: "I is happy.", r: "I am happy.", n: "I öznesi her zaman am alır." },
        { w: "They is students.", r: "They are students.", n: "You/We/They için are kullanılır." },
        { w: "Are she ready?", r: "Is she ready?", n: "She tekil olduğu için is sorulu." },
        { w: "I are not late.", r: "I am not late.", n: "I için am kullanılır." }
      ],
      mcq: [
        { q: "She ___ a doctor.", options: ["am", "is", "are"], a: 1 },
        { q: "We ___ from Turkey.", options: ["am", "is", "are"], a: 2 },
        { q: "Is ___ ready?", options: ["you", "I", "he"], a: 0 },
        { q: "___ I late?", options: ["Is", "Are", "Am"], a: 2 }
      ],
      practice: [
        { q: "I ___ a student.", hint: "be (I)", a: ["am"] },
        { q: "She ___ my sister.", hint: "be (he/she/it)", a: ["is"] },
        { q: "They ___ happy.", hint: "be (they)", a: ["are"] },
        { q: "He ___ not here.", hint: "not (is)", a: ["is", "isn't", "is not"] },
        { q: "___ you ready?", hint: "be (you, soru)", a: ["are"] },
        { q: "We ___ from Turkey.", hint: "be (we)", a: ["are"] },
        { q: "My brother ___ a teacher.", hint: "be (he)", a: ["is"] },
        { q: "I ___ not late.", hint: "not (am)", a: ["am", "aren't"] }
      ]
    },
    {
      id: "a1-02",
      title: "Zamirler ve İyelik Sıfatları",
      short: "I/my, he/his, she/her",
      slides: [
        { h: "Özne Zamirleri", b: "Cümlede özneyi (kim? / ne?) temsil eden zamirler:\n\n- I, you, he, she, it, we, they\n\n> He is my brother. → O benim erkek kardeşim.\n> I am a teacher. → Ben öğretmenim.\n> They work here. → Onlar burada çalışıyor.\n\n! Özne zamirleri fiilin doğru formunu alır:\n- I → am\n- He/She/It → is (+ -s)\n- We/They → are" },
        { h: "İyelik Sıfatları", b: "Bir şeyin kime ait olduğunu belirtir, isimden ÖNCE gelir:\n\n- I → my, You → your\n- He → his, She → her, It → its\n- We → our, They → their\n\n> This is my book. → Bu benim kitabım.\n> His name is Ali. → Onun adı Ali.\n> Our house is big. → Evimiz büyük.\n> Their car is red. → Arabaları kırmızı.\n\n! UNUTMA: İyelik sıfatı isimden hemen önce gelir, isimle birlikte değil." },
        { h: "İyelik Zamirleri", b: "İyelik sıfatlarının zamir hâli — cümlenin sonunda, isim gerekmez:\n\n- my → mine (this book is mine = bu kitap benim)\n- your → yours (the book is yours = kitap senin)\n- his → his (the book is his = kitap onun — erkek)\n- her → hers (the book is hers = kitap onun — kadın)\n- its → its (the table is its = masa onun — hayvan/şey)\n- our → ours, their → theirs\n\n> This is my book = This book is mine.\n> That house is theirs.\n> The cat is licking its paw. → Kedi kovuğunu yalıyor." },
        { h: "Nesne Zamirleri", b: "Özneyi (kim?) değil, nesneyi (kimi / ne?) temsil eden zamirler:\n\n- me, you, him, her, it, us, them\n\n> He called me. → O beni aradı.\n> I saw her. → Onu gördüm.\n> They helped us. → Bize yardımcı oldular.\n\n! DİKKAT: me ↔ I, him ↔ he, her ↔ she karıştırılma!:\n- I went (özne) ≠ He called me (nesne)" }
      ],
      mistakes: [
        { w: "Me name is John.", r: "My name is John.", n: "Bu cümlede 'benim' iyelik sıfatı. 'my' kullanılır; 'me' nesne zanırıdır." },
        { w: "He name is Ali.", r: "His name is Ali.", n: "Erkek için 'his' iyelik sıfatı gerekir." },
        { w: "She book is new.", r: "Her book is new.", n: "Kadın için 'her' iyelik sıfatı gerekir." },
        { w: "This book is me.", r: "This book is mine.", n: "İyelik zamir kullanımı: mine." },
        { w: "I saw he.", r: "I saw him.", n: "Nesne zamir 'he' → 'him' olur." }
      ],
      mcq: [
        { q: "___ name is John.", options: ["Me", "My", "I", "Mine"], a: 1 },
        { q: "This is ___ book.", options: ["she", "her", "hers", "she is"], a: 1 },
        { q: "The car is ___ (they).", options: ["their", "theirs", "they", "them"], a: 1 },
        { q: "That pen is ___ (you).", options: ["your", "yours", "you", "you are"], a: 1 },
        { q: "Ali likes ___ job. (he)", options: ["he", "him", "his", "hiss"], a: 2 },
        { q: "I saw ___ at the park. (she → nesne)", options: ["she", "her", "hers"], a: 1 }
      ],
      practice: [
        { q: "___ name is John.", hint: "I → benim (iyelik sıfatı)", a: ["my"] },
        { q: "This is ___ book.", hint: "she → onun (kadın, iyelik sıfatı)", a: ["her"] },
        { q: "The car is ___ red. (they → onların)", hint: "iyelik sıfatı", a: ["their"] },
        { q: "That is ___ pen. (you → senin)", hint: "iyelik sıfatı", a: ["your"] },
        { q: "Ali likes ___ job. (he → onun)", hint: "iyelik sıfatı", a: ["his"] },
        { q: "The book is ___ . (mine, my)", hint: "iyelik zamir", a: ["mine"] },
        { q: "I called ___ yesterday. (she → nesne)", hint: "nesne zamir", a: ["her"] },
        { q: "The cat licks ___ paw. (kendi — its)", hint: "hayvanın", a: ["its"] }
      ]
    },
    {
      id: "a1-03",
      title: "Artikeller (a / an / the)",
      short: "a, an, the",
      slides: [
        { h: "a / an Kullanımı", b: "Tekil sayılabilir isimlerden önce 'bir' anlamında kullanılır.\n\n- Ünlü harf sesiyle başlıyorsa → an\n- Sessiz harf sesiyle başlıyorsa → a\n\n> a book → bir kitap\n> an apple → bir elma\n> an umbrella → bir şemsiye\n> a car → bir araba\n\n! SES önemlidir, harf değil!\n- an hour (h sessiz) → a hour değil, an hour\n- a university (u 'yoo' diye okunur) → a university" },
        { h: "the Kullanımı", b: "the = 'o/la/şu' — belirli, bilinen bir şeyden bahsildiğinde:\n\n> The sun is bright. → Güneş parlaktır. (herkese biliyor)\n> Open the door. → Kapıyı aç. (belli ki hangi kapı)\n> The book on the table is mine. → Masadaki kitap benim.\n\n! the, tekil ya da çoğul önceden belirtilmiş şeylerde kullanılır.\nBazı isimlerde (the river, the sea) ama ülke/büyük şehirlerde (the USA, the Nile) vardır." },
        { h: "Hiç Article Yok", b: "Bazı isimlerde article (a/an/the) kullanılmaz:\n\n- Ülke ve şehir isimleri: Turkey, Istanbul, Ankara\n- Günlük hayatta: breakfast, lunch, dinner (kahvaltı, öğle, akşam)\n- Üniversiteler (genel): at university (üniversite) ama at the university (belirli bir üniversite)\n- Sokak: on main street, at 123 Main St\n\n> I live in Istanbul. → İstanbul'da yaşıyorum.\n> She has breakfast at 8. → Kahvaltı yapıyor.\n> He studies at Harvard University. → Harvard'da okuyor." }
      ],
      mistakes: [
        { w: "I have a apple.", r: "I have an apple.", n: "apple sessiz harfle başlar ama 'a' sesi verir → an." },
        { w: "She is a old teacher.", r: "She is an old teacher.", n: "old 'o' sesi verir → an." },
        { w: "The sun is hot." , r: "The sun is hot.", n: "Güneş herkende bildiği için the kullanılır — bu doğru." },
        { w: "Sun is hot.", r: "The sun is hot.", n: "Belirli, bilinen → the." },
        { w: "I am at a home.", r: "I am at home.", n: "home (ev) genellikle article almaz." }
      ],
      mcq: [
        { q: "I see ___ apple.", options: ["a", "an", "the"], a: 1 },
        { q: "She has ___ car.", options: ["an", "a", "the"], a: 1 },
        { q: "He is ___ engineer.", options: ["a", "an", "the"], a: 1 },
        { q: "I read ___ book yesterday.", options: ["an", "a", "the"], a: 1 },
        { q: "___ moon is bright tonight.", options: ["A", "An", "The"], a: 2 },
        { q: "I have ___ hour before dinner.", options: ["a", "an", "the"], a: 1 }
      ],
      practice: [
        { q: "I see ___ apple.", hint: "a/an (apple, ünlü)", a: ["an"] },
        { q: "She has ___ car.", hint: "a/an (car, sessiz)", a: ["a"] },
        { q: "He is ___ engineer.", hint: "a/an (engineer, sessiz)", a: ["an"] },
        { q: "___ moon is bright tonight.", hint: "the (belirli)", a: ["the"] },
        { q: "I read ___ book yesterday.", hint: "a/an", a: ["a"] },
        { q: "She has ___ dog.", hint: "a/an (dog, sessiz)", a: ["a"] },
        { q: "I need ___ water.", hint: "sayısız → a/an/the yok mu?", a: ["-"] },
        { q: "The cat is on ___ roof.", hint: "the (belirli)", a: ["the"] }
      ]
    },
    {
      id: "a1-04",
      title: "Çoğul İsimler",
      short: "book → books",
      slides: [
        { h: "Düzenli Çoğul Kuralları", b: "Çoğul için en yaygın kural: -s ekle.\n\n> book → books\n> dog → dogs\n> car → cars\n\n- -s, -ss, -sh, -ch, -x, -z ile biten isimlere -es eklenir:\n> box → boxes\n> bus → buses\n> church → churches\n> match → matches\n\n- e ile bitenlere sadece -s:\n> cake → cakes\n> bike → bikes" },
        { h: "-y ve -f/-fe Kuralı", b: "-y ile biten ve önünde sessiz varsa -y → -ies:\n\n> baby → babies\n> city → cities\n> story → stories\n\n! Ses: 'ee' sesi vardır → -ies\n\n-f / -fe ile bitenlerde -ves olur (bazı istisnalar):\n> knife → knives\n> wife → wives\n> life → lives\n> leaf → leaves\n\n! Unutma: -fe ile biten bazıları -s alır:\n> safe → safes (güvenlik kutusu)" },
        { h: "Düzensiz Çoğul (Ezberle)", b: "Bu isimler çoğulünde ek değişmez — ezberle:\n\n> man → men\n> woman → women\n> child → children\n> person → people\n> foot → feet\n> tooth → teeth\n> mouse → mice\n> goose → geese\n> ox → oxen\n\n> cactus → cacti (veya cactuses)\n> analysis → analyses\n> phenomenon → phenomena" }
      ],
      mistakes: [
        { w: "I have two book.", r: "I have two books.", n: "Sayısız/çoğul için -s eklenir." },
        { w: "Three child are playing.", r: "Three children are playing.", n: "child → children (düzensiz)." },
        { w: "Two boxs on the floor.", r: "Two boxes on the floor.", n: "box → boxes (-es)." },
        { w: "The babys are sleeping.", r: "The babies are sleeping.", n: "-y + sessiz → -ies." },
        { w: "Two womans are happy.", r: "Two women are happy.", n: "woman → women (düzensiz)." }
      ],
      mcq: [
        { q: "I have two ___.", options: ["book", "books", "bookes"], a: 1 },
        { q: "Three ___ are playing.", options: ["childs", "children", "childes"], a: 1 },
        { q: "Two ___ are on the floor.", options: ["boxs", "boxes", "box"], a: 1 },
        { q: "The ___ (baby) are sleeping.", options: ["babys", "babies", "babyes"], a: 1 },
        { q: "Five ___ (man) are in the room.", options: ["mans", "men", "mens"], a: 1 },
        { q: "The ___ (knife) are sharp.", options: ["knifes", "knives", "knive"], a: 1 }
      ],
      practice: [
        { q: "two ___", hint: "book → çoğul", a: ["books"] },
        { q: "three ___", hint: "child → çoğul", a: ["children"] },
        { q: "many ___", hint: "box → çoğul (-es)", a: ["boxes"] },
        { q: "two ___", hint: "baby → çoğul (-ies)", a: ["babies"] },
        { q: "five ___", hint: "man → çoğul (düzensiz)", a: ["men"] },
        { q: "The ___ (woman) are here.", hint: "çoğul", a: ["women"] },
        { q: "Three ___ (child) are playing.", hint: "düzensiz", a: ["children"] },
        { q: "Two ___ (cat) are sleeping.", hint: "düzenli", a: ["cats"] }
      ]
    },
    {
      id: "a1-05",
      title: "Geniş Zaman (Simple Present)",
      short: "I work / She works",
      slides: [
        { h: "Geniş Zaman Nedir?", b: "Rutinleri, alışkanlıkları ve genel gerçekleri anlatır.\n\n> I drink coffee every morning.\n> The sun rises in the east.\n> Dogs are loyal animals.\n\n! Neye özel? 'every day', 'always', 'usually', 'sometimes' gibi zarflarla.\n> I wake up at 7 every day.\n> She usually eats breakfast at 8." },
        { h: "Üçüncü Tekil Şahıs (-s / -es)", b: "He / She / It için fiile -s ya da -es eklenir:\n\n- I / You / We / They → fiil yalın (works, play, like)\n- He / She / it → fiil + -s/-es (works, goes, watches)\n\n> She works in a bank.\n> He goes to school.\n> It watches TV.\n> I work.\n\n! Kural: he/she/it cümlede, fiil mutlaka -s alır!" },
        { h: "-s / -es Kuralı", b: "-s ekleyenler:\n> work → works, play → plays, like → likes\n\n-es ekleyenler:\n> -ss, -sh, -ch, -x, -o ile biten fiiller:\n> go → goes, watch → watches, fix → fixes\n\n-y dönüşümü: sessiz + -y → -ies\n> study → studies, cry → cries\n\n> TRY, FLY, PLAY hepsine -s ekler:\n> He tries, She flies, They play" }
      ],
      mistakes: [
        { w: "He go to school.", r: "He goes to school.", n: "He/She/It için -s/-es eklenir." },
        { w: "She like tea.", r: "She likes tea.", n: "Üçüncü tekil -s alır." },
        { w: "They plays football.", r: "They play football.", n: "They I/yerde -s olmaz." },
        { w: "She go to school.", r: "She goes to school.", n: "go → goes (-es)." },
        { w: "He study hard.", r: "He studies hard.", n: "study → studies (-ies)." }
      ],
      mcq: [
        { q: "She ___ in a bank. (work)", options: ["work", "works", "working"], a: 1 },
        { q: "They ___ football. (play)", options: ["plays", "play", "played"], a: 1 },
        { q: "He ___ TV every night. (watch)", options: ["watch", "watches", "watching"], a: 1 },
        { q: "I ___ coffee. (like)", options: ["like", "likes", "liking"], a: 0 },
        { q: "She ___ to school by bus. (go)", options: ["go", "goes", "going"], a: 1 },
        { q: "My mother ___ in a hospital. (work)", options: ["work", "works", "working"], a: 1 }
      ],
      practice: [
        { q: "She ___ in a bank. (work)", hint: "3. tekil -s", a: ["works"] },
        { q: "They ___ football. (play)", hint: "yalın fiil", a: ["play"] },
        { q: "He ___ TV every night. (watch)", hint: "3. tekil -es", a: ["watches"] },
        { q: "I ___ coffee. (like)", hint: "yalın fiil", a: ["like"] },
        { q: "She ___ to school by bus. (go)", hint: "3. tekil -es", a: ["goes"] },
        { q: "My mother ___ every day. (work)", hint: "3. tekil -s", a: ["works"] },
        { q: "They ___ in Germany. (live)", hint: "çoğul", a: ["live"] },
        { q: "The dog ___ in the garden. (run)", hint: "3. tekil", a: ["runs"] }
      ]
    },
    {
      id: "a1-06",
      title: "Geniş Zaman (Olumsuz & Soru)",
      short: "don't / doesn't / Do",
      slides: [
        { h: "Olumsuz Cümleler", b: "Olumsuzda do/does + not kullanılır, fiil ASLA -s almaz:\n\n- I/You/We/They → don't\n- He/She/It → doesn't\n\n> I don't like tea.\n> She doesn't like tea.\n> They don't play football.\n\n! UNUTMA: doesn't'ten sonra fiil yalın kalır!\n> She doesn't like (✓)\n> She doesn't likes (✗)" },
        { h: "Soru Cümleleri", b: "Soruda Do/Does başa gelir, fiil yalın:\n\n> Do you like tea?\n> Does she like tea?\n> Do they play football?\n\n> Do I like coffee?\n\n! Soruda do/does mutlaka vardır, ardından fiil yalın." },
        { h: "Kısaltmalar", b: "don't → don't\nDoes not → doesn't\ndo not → don't\n\n> She doesn't work. = She doesn't work.\n> Do you like? = Doy musun?\n\n> I don't know. = Bilmiyorum.\n> Doesn't she work? = O çalışmıyor değil mi?" }
      ],
      mistakes: [
        { w: "He don't like tea.", r: "He doesn't like tea.", n: "He/She/It için doesn't." },
        { w: "Does she likes tea?", r: "Does she like tea?", n: "does'tan sonra fiil yalın." },
        { w: "I doesn't know.", r: "I don't know.", n: "I/You/We/They için don't." },
        { w: "Do she like tea?", r: "Does she like tea?", n: "She için does." },
        { w: "He don't work here.", r: "He doesn't work here.", n: "He → doesn't." }
      ],
      mcq: [
        { q: "He ___ like tea.", options: ["don't", "doesn't", "isn't"], a: 1 },
        { q: "___ you like coffee?", options: ["Does", "Is", "Do"], a: 2 },
        { q: "She ___ work here.", options: ["don't", "doesn't", "isn't"], a: 1 },
        { q: "___ he play football?", options: ["Do", "Is", "Does"], a: 2 },
        { q: "I ___ eat meat.", options: ["doesn't", "don't", "isn't"], a: 1 },
        { q: "Does she ___ tea?", options: ["likes", "like", "liking"], a: 0 }
      ],
      practice: [
        { q: "He ___ like tea.", hint: "not (3. tekil)", a: ["doesn't", "does not"] },
        { q: "___ you like coffee?", hint: "do (soru)", a: ["do"] },
        { q: "She ___ work here.", hint: "not (3. tekil)", a: ["doesn't", "does not"] },
        { q: "___ he play football?", hint: "does (soru)", a: ["does"] },
        { q: "I ___ eat meat.", hint: "not (I/we/they)", a: ["don't", "do not"] },
        { q: "They ___ speak Spanish.", hint: "not", a: ["don't", "do not"] },
        { q: "___ she like chocolate?", hint: "does (soru)", a: ["does"] },
        { q: "We ___ play tennis on Sundays.", hint: "not", a: ["don't", "do not"] }
      ]
    },
    {
      id: "a1-07",
      title: "There is / There are",
      short: "vardır / yok",
      slides: [
        { h: "There is / There are", b: "Bir yerde bir şeyin var olduğunu söyler:\n\n- Tekil/sayılamaz → There is\n- Çoğul → There are\n\n> There is a book on the table. → Masada bir kitap var.\n> There are two cats. → İki kedi var.\n> There is some water. → Biraz su var.\n\n! there is/are her zaman cümlenin başında olur." },
        { h: "Olumsuz ve Soru", b: "Olumsuz:\n\n> There isn't a park here. → Burada bir park yok.\n> There aren't any shops. → Mağaza yok.\n\nSoru:\n\n> Is there a bank near here? → Burada bir bank var mı?\n> Are there any shops? → Mağazalar var mı?\n\nKısa hâli:\n\n> There's = There is\n> There aren't = There aren't" },
        { h: "any / some / no", b: "Soruda ve olumsuzda any kullanılır:\n\n> Are there any students? → Öğrenci var mı?\n> There aren't any books. → Kitap yok.\n\nOlumlu da some:\n\n> There are some students. → Bazı öğrenciler var.\n> There is some water. → Biraz su var.\n\n> There isn't any money. → Para yok.\n> There aren't any cats. → Kedi yok." }
      ],
      mistakes: [
        { w: "There is two cats.", r: "There are two cats.", n: "Çoğul için there are." },
        { w: "There are a book.", r: "There is a book.", n: "Tekil için there is." },
        { w: "It is a park near.", r: "There is a park near.", n: "Varlık için there is/are." },
        { w: "There is many people.", r: "There are many people.", n: "many çoğul, there are." },
        { w: "There isn't no students.", r: "There aren't any students.", n: "Olumsuzda not + any, çift olumsuz yok." }
      ],
      mcq: [
        { q: "___ a book on the table.", options: ["There are", "There is", "There aren't"], a: 1 },
        { q: "___ two dogs in the garden.", options: ["There is", "There aren't", "There are"], a: 2 },
        { q: "___ a park near my house.", options: ["There are", "There aren't", "There is"], a: 2 },
        { q: "___ many students here.", options: ["There is", "There are", "There isn't"], a: 1 },
        { q: "___ any shops near here?", options: ["Is there", "Are there", "There are"], a: 1 },
        { q: "There ___ a bank near here.", options: ["are", "isn't", "is"], a: 2 }
      ],
      practice: [
        { q: "___ a book on the table.", hint: "there is / there are", a: ["there is", "there's"] },
        { q: "___ two dogs in the garden.", hint: "there is / there are", a: ["there are"] },
        { q: "___ a park near my house.", hint: "there is / there are", a: ["there is", "there's"] },
        { q: "___ many students here.", hint: "there is / there are", a: ["there are"] },
        { q: "___ a bank near here?", hint: "soru", a: ["is there"] },
        { q: "There ___ many students.", hint: "çoğul", a: ["are"] },
        { q: "___ any cats in the garden?", hint: "soru", a: ["are there"] },
        { q: "There isn't ___ water.", hint: "var mı yok mu", a: ["any"] }
      ]
    },
    {
      id: "a1-08",
      title: "Prepositions (in / on / at)",
      short: "yer ve zaman",
      slides: [
        { h: "Yer Edatleri: in / on / at", b: "in → içinde\non → üstünde\nat → belirli nokta/belli yer\n\n> The keys are in the box. → Anahtarlar kutunun içinde.\n> The book is on the table. → Kitap masanın üzerinde.\n> She is at the door. → O Kapıda.\n\n> at the station, at the bus stop, at the station\n> in the room, in the kitchen, in the garden\n> on the wall, on the floor, on the bus" },
        { h: "Zaman Edatları", b: "in → ay, yıl, mevsim\non → gün\nt:at → saat\n\n> in July, in 2025, in summer (yaz)\n> on Monday, on January 1st (1 Ocak)\n> at 5 o'clock, at night (gece)\n\n> at the weekend (hafta sonu)\n> in the morning (sabah)\n> in the evening (akşam)\n> in the afternoon (öğle)" },
        { h: "Sabit Diyadikler", b: "> at night = gece\n> at the weekend = hafta sonu\n> in the morning = sabah\n> in the afternoon = öğle\n> in the evening = akşam\n\n> at the bus stop = otobüs durağında\n> at the station = istasyonda\n> in the garden = bahçede\n> on the roof = çatıda\n\n! Bu ifadeleri ezberle, ayrı ayrı düşünme!" }
      ],
      mistakes: [
        { w: "I go to school in Monday.", r: "I go to school on Monday.", n: "Günler için on." },
        { w: "The book is in the table.", r: "The book is on the table.", n: "Üstünde → on." },
        { w: "I wake up at the morning.", r: "I wake up in the morning.", n: "in the morning (sabit ifade)." },
        { w: "We meet at 5 o'clock in the morning.", r: "We meet at 5 o'clock in the morning.", n: "Bu doğru — at saat, in sabah." },
        { w: "She is good in math.", r: "She is good at math.", n: "yetenek için at kullanılır." }
      ],
      mcq: [
        { q: "I go to work ___ Monday.", options: ["in", "on", "at"], a: 1 },
        { q: "My birthday is ___ July.", options: ["on", "at", "in"], a: 2 },
        { q: "We meet ___ 5 o'clock.", options: ["in", "on", "at"], a: 2 },
        { q: "The cat is ___ the table.", options: ["in", "on", "at"], a: 1 },
        { q: "She lives ___ Istanbul.", options: ["on", "at", "in"], a: 2 },
        { q: "I wake up ___ the morning.", options: ["on", "at", "in"], a: 2 }
      ],
      practice: [
        { q: "I go to work ___ Monday.", hint: "gün", a: ["on"] },
        { q: "My birthday is ___ July.", hint: "ay", a: ["in"] },
        { q: "We meet ___ 5 o'clock.", hint: "saat", a: ["at"] },
        { q: "The cat is ___ the table.", hint: "üstünde", a: ["on"] },
        { q: "She lives ___ Istanbul.", hint: "şehir", a: ["in"] },
        { q: "I wake up ___ the morning.", hint: "sabah", a: ["in"] },
        { q: "The keys are ___ the box.", hint: "içinde", a: ["in"] },
        { q: "She is ___ the bus stop.", hint: "belirli yer", a: ["at"] }
      ]
    }
  ]
};
