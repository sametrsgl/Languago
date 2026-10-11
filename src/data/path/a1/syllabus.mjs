// A1 grammar syllabus for the learning path: 24 topics × 5 days = 120 days.
// Day 1 of a topic shows the explanation, the main video (QR) and practice;
// days 2–4 practise it with earlier topics mixed in; day 5 is a review.
// Explanations are written for Turkish adult beginners. Videos were checked
// on YouTube (exists + embeddable) on 2026-10-11: `video` is the Turkish
// explanation (İngilizce Konu Anlatımı – Özer Kiraz) where one exists,
// `alt` an English-language lesson.
const tr = (id, title) => ({ id, title, channel: 'İngilizce Konu Anlatımı - Özer Kiraz', lang: 'tr' });
const en = (id, title, channel) => ({ id, title, channel, lang: 'en' });

export default [
  {
    id: 'g01', title: 'to be: am / is / are', tr: '“Olmak” fiili (olumlu)',
    explain: [
      'İngilizcede “-ım, -sın, -dır” eklerinin yerini **am, is, are** alır. Hangisini kullanacağımız özneye bağlıdır.',
      '**I am** (ben …ım) · **he / she / it is** (o …dır) · **you / we / they are** (sen, biz, onlar …sınız/ız/lar).',
      'Konuşmada kısaltırız: I’m, you’re, he’s, she’s, it’s, we’re, they’re.',
    ],
    examples: [['I am a nurse.', 'Ben bir hemşireyim.'], ['She is from Bursa.', 'O Bursalı.'], ['We are tired.', 'Biz yorgunuz.'], ['It’s cold today.', 'Bugün hava soğuk.']],
    mistake: 'Türkçede fiil gerekmediği için “I tired.” demek kolaydır. İngilizcede cümlede mutlaka bir fiil olur: **I am tired.**',
    video: tr('056tP8bGMtg', 'He, She, It, I, You, We, They Konu Anlatımı #1'), alt: en('mKxKVi0N6yc', 'Learn Subject Pronouns + ‘be’ verb (am, is, are)', 'Shaw English Online'),
  },
  {
    id: 'g02', title: 'to be: negatives and questions', tr: '“Olmak” fiili: olumsuz ve soru',
    explain: [
      'Olumsuz yapmak için am / is / are’dan sonra **not** ekleriz: I’m not, she isn’t, they aren’t.',
      'Soru sormak için fiili öznenin **önüne** alırız: **Are you** a student? **Is he** at home?',
      'Kısa cevaplar: Yes, I am. / No, I’m not. — Yes, she is. / No, she isn’t.',
    ],
    examples: [['I’m not hungry.', 'Aç değilim.'], ['Is your office near here?', 'Ofisin buraya yakın mı?'], ['Are they your parents? – Yes, they are.', 'Onlar annenle baban mı? – Evet.']],
    mistake: '“Yes, I’m.” denmez; kısa olumlu cevapta kısaltma yapılmaz: **Yes, I am.**',
    video: tr('9ngJZwpfejw', 'İngilizce İsim Nasıl Sorulur? #3'), alt: en('4SoEvIbzwh0', 'English Grammar: Subjective Pronouns + Be + Not', 'Shaw English Online'),
  },
  {
    id: 'g03', title: 'a / an and plural nouns', tr: 'a / an ve çoğul isimler',
    explain: [
      'Tek bir şeyden bahsederken **a** ya da **an** kullanırız. Sessiz harfle başlayan sesten önce **a** (a book, a university), sesli harfle başlayan sesten önce **an** (an apple, an hour).',
      'Çoğul için genelde **-s** ekleriz: book → books. -s, -sh, -ch, -x ile bitenlere **-es**: bus → buses. Düzensizler: man → men, woman → women, child → children, person → people.',
      'Çoğul isimlerin önünde a / an kullanılmaz: **two apples**, “a apples” değil.',
    ],
    examples: [['She has a car and an old bike.', 'Onun bir arabası ve eski bir bisikleti var.'], ['There are three children in the room.', 'Odada üç çocuk var.'], ['I eat an egg every morning.', 'Her sabah bir yumurta yerim.']],
    mistake: 'Meslek söylerken a / an unutulur: “I am teacher.” değil, **I am a teacher.**',
    video: tr('BGdMetl7Tqs', 'A, An, The Konu Anlatımı #5'), alt: en('iJt12OE3c7k', 'Learn Singular Nouns a / an + noun', 'Shaw English Online'),
  },
  {
    id: 'g04', title: 'this / that / these / those', tr: 'Bu, şu: this, that, these, those',
    explain: [
      'Yakındaki tek şey için **this** (bu), uzaktaki tek şey için **that** (şu / o).',
      'Yakındaki birden fazla şey için **these** (bunlar), uzaktakiler için **those** (şunlar).',
      'Bir isimle de kullanılırlar: **this phone**, **those shoes**.',
    ],
    examples: [['This is my brother.', 'Bu benim erkek kardeşim.'], ['That bus is late.', 'Şu otobüs geç kaldı.'], ['These keys aren’t mine.', 'Bu anahtarlar benim değil.'], ['Who are those people?', 'Şu insanlar kim?']],
    mistake: 'Çoğul isimle “this” kullanılmaz: “this books” değil, **these books**.',
    video: tr('NYYMfTDZP4c', 'This, That, These, Those Konu Anlatımı #10'), alt: en('GIbD5seHH-E', 'This That These Those', 'Woodward English'),
  },
  {
    id: 'g05', title: "possessive adjectives and 's", tr: 'İyelik sıfatları (my, your…) ve ’s',
    explain: [
      'Bir şeyin kime ait olduğunu söylerken: **my** (benim), **your** (senin / sizin), **his** (onun – erkek), **her** (onun – kadın), **its** (onun – eşya, hayvan), **our** (bizim), **their** (onların).',
      'Bir insanın adıyla **’s** kullanırız: **Ayşe’s** car (Ayşe’nin arabası), my **brother’s** job.',
      'Türkçede “onun” tektir; İngilizcede erkek için his, kadın için her seçmek gerekir.',
    ],
    examples: [['My name is Can.', 'Benim adım Can.'], ['Her husband is a doctor.', 'Onun kocası doktor.'], ['This is Mehmet’s office.', 'Burası Mehmet’in ofisi.'], ['Their house is very big.', 'Onların evi çok büyük.']],
    mistake: '“its” (onun) ile “it’s” (it is) karışır: The dog is in **its** bed. **It’s** late.',
    video: tr('hJftEYqBfk0', 'My, Your, His, Her, Its, Our, Their Konu Anlatımı #2'), alt: en('-Jc8jkVqde0', 'Learn Possessive Adjectives', 'Shaw English Online'),
  },
  {
    id: 'g06', title: 'present simple (I / you / we / they)', tr: 'Geniş zaman: olumlu cümle',
    explain: [
      'Alışkanlıkları, düzenli yaptığımız şeyleri ve genel gerçekleri anlatır: Her gün, genellikle, hep…',
      'I / you / we / they ile fiilin yalın hâli kullanılır: **I work** in a bank. **We live** in Konya.',
      'Zaman ifadeleri: every day, every morning, at the weekend, on Mondays.',
    ],
    examples: [['I drink tea in the morning.', 'Sabahları çay içerim.'], ['They live near the sea.', 'Onlar denize yakın yaşar.'], ['We go to the gym on Mondays.', 'Pazartesileri spor salonuna gideriz.']],
    mistake: 'Geniş zamanda “am / is / are” eklenmez: “I am work in a bank.” değil, **I work in a bank.**',
    video: tr('QUVscCzjlEg', 'Simple Present Tense Konu Anlatımı #25'), alt: en('47LEelX7nhg', 'Learn Present Simple Tense', 'Shaw English Online'),
  },
  {
    id: 'g07', title: 'present simple: he / she / it + -s', tr: 'Geniş zaman: he / she / it ile -s',
    explain: [
      'He, she, it (ve tek bir kişi ya da şey) ile fiile **-s** ekleriz: she work**s**, he live**s**, it rain**s**.',
      '-s, -sh, -ch, -x, -o ile bitenlere **-es**: go → goes, watch → watches. Sessiz harf + y → **-ies**: study → studies.',
      'Düzensiz: have → **has**.',
    ],
    examples: [['My sister works in a hospital.', 'Kız kardeşim bir hastanede çalışır.'], ['He goes to work by bus.', 'O işe otobüsle gider.'], ['The shop opens at nine.', 'Dükkân dokuzda açılır.']],
    mistake: 'En sık hata -s’yi unutmak: “She speak English.” değil, **She speaks English.**',
    video: tr('QUVscCzjlEg', 'Simple Present Tense Konu Anlatımı #25'), alt: en('sH2rk3q4omM', 'Present Simple Tense in English', 'Woodward English'),
  },
  {
    id: 'g08', title: 'present simple: negatives and questions', tr: 'Geniş zaman: olumsuz ve soru (do / does)',
    explain: [
      'Olumsuz: **don’t** (I / you / we / they) ve **doesn’t** (he / she / it) + fiilin yalın hâli: I don’t smoke. She doesn’t eat meat.',
      'Soru: **Do** / **Does** + özne + fiil: **Do** you like coffee? **Does** he work here?',
      'Does kullanınca fiile -s eklenmez: Does she **work**? (works değil)',
    ],
    examples: [['I don’t drive to work.', 'İşe arabayla gitmem.'], ['Does your brother live in Ankara?', 'Kardeşin Ankara’da mı yaşıyor?'], ['They don’t watch TV.', 'Onlar televizyon izlemez.']],
    mistake: '“She doesn’t likes it.” yanlıştır; doesn’t’tan sonra yalın fiil: **She doesn’t like it.**',
    video: tr('QUVscCzjlEg', 'Simple Present Tense Konu Anlatımı #25'), alt: en('-Qb99jxYPxg', 'English Grammar: Do / Does Have Questions', 'Shaw English Online'),
  },
  {
    id: 'g09', title: 'adverbs of frequency', tr: 'Sıklık zarfları: always, usually, never…',
    explain: [
      'Bir şeyi ne sıklıkla yaptığımızı söyler: **always** (her zaman) → **usually** (genellikle) → **often** (sık sık) → **sometimes** (bazen) → **rarely** (nadiren) → **never** (asla).',
      'Normal fiilin **önüne** gelir: I **usually** get up at seven.',
      'am / is / are’dan **sonra** gelir: She is **always** late.',
    ],
    examples: [['We often eat out on Fridays.', 'Cuma günleri sık sık dışarıda yeriz.'], ['He never drinks coffee.', 'O asla kahve içmez.'], ['I’m usually tired in the evening.', 'Akşamları genellikle yorgunum.']],
    mistake: 'Sıralama: “I go always to work by bus.” değil, **I always go to work by bus.**',
    video: tr('GygQ5YqGzZU', 'Adverbs Konu Anlatımı (Zarflar) #61'), alt: en('vAHD0rqlj8I', 'Adverbs of Frequency in English', 'Woodward English'),
  },
  {
    id: 'g10', title: 'wh- questions', tr: 'Soru kelimeleri: what, where, when, who, how',
    explain: [
      '**What** (ne), **where** (nerede), **when** (ne zaman), **who** (kim), **why** (neden), **how** (nasıl), **how much / how many** (ne kadar / kaç tane).',
      'Soru kelimesi en başa gelir, ardından normal soru düzeni: **Where do** you live? **What is** your job?',
    ],
    examples: [['What time does the film start?', 'Film saat kaçta başlıyor?'], ['Where is the station?', 'İstasyon nerede?'], ['Why are you late?', 'Neden geç kaldın?'], ['How do you go to work?', 'İşe nasıl gidiyorsun?']],
    mistake: 'Yardımcı fiil unutulur: “Where you live?” değil, **Where do you live?**',
    video: tr('au1ZKvLOzr0', 'What, Where, When, Why, How, Who Kullanımı #4'), alt: en('x_4AjSwTXdc', 'Wh- Questions – English Grammar Lessons', 'Ellii'),
  },
  {
    id: 'g11', title: 'there is / there are, some / any', tr: 'Var / yok: there is, there are',
    explain: [
      'Bir yerde bir şeyin **var** olduğunu söylerken: **there is** + tekil, **there are** + çoğul.',
      'Olumsuz ve soruda: There **isn’t** a lift. **Are there** any shops near here?',
      'Olumlu cümlede **some**, olumsuz ve soruda **any**: There are **some** eggs. There aren’t **any** eggs.',
    ],
    examples: [['There is a pharmacy on the corner.', 'Köşede bir eczane var.'], ['There are two bedrooms in the flat.', 'Dairede iki yatak odası var.'], ['Is there any milk in the fridge?', 'Buzdolabında süt var mı?']],
    mistake: '“Var” için have kullanılmaz: “In my city have a big park.” değil, **There is a big park in my city.**',
    video: tr('2wIDfIxUL88', 'İngilizce There is, There are Konusu #17'), alt: en('xCrsoRmPFok', 'THERE IS – THERE ARE in English', 'Woodward English'),
  },
  {
    id: 'g12', title: 'prepositions of place', tr: 'Yer edatları: in, on, under, next to…',
    explain: [
      '**in** (içinde), **on** (üstünde), **under** (altında), **next to** (yanında), **between** (arasında), **behind** (arkasında), **in front of** (önünde), **opposite** (karşısında).',
      'Türkçede edat kelimenin sonuna eklenir (masa**da**); İngilizcede isimden **önce** gelir: **on** the table.',
    ],
    examples: [['Your keys are on the table.', 'Anahtarların masanın üstünde.'], ['The bank is between the café and the hotel.', 'Banka kafe ile otelin arasında.'], ['The cat is under the bed.', 'Kedi yatağın altında.']],
    mistake: '“next” tek başına yetmez: “next the door” değil, **next to the door**.',
    video: tr('dBYKwJRd5qk', 'İngilizce Yer Edatları Konusu (In, On, At…) #11'), alt: en('4530pfmquro', 'Basic Prepositions of Place in English', 'Woodward English'),
  },
  {
    id: 'g13', title: 'prepositions of time: at / on / in', tr: 'Zaman edatları: at, on, in',
    explain: [
      '**at** + saat ve belirli anlar: at 7 o’clock, at night, at the weekend.',
      '**on** + günler ve tarihler: on Monday, on 23 April, on my birthday.',
      '**in** + aylar, yıllar, mevsimler ve günün bölümleri: in May, in 2025, in summer, in the morning.',
    ],
    examples: [['The meeting is at 10 o’clock.', 'Toplantı saat onda.'], ['I was born in 1995.', '1995’te doğdum.'], ['We have English on Tuesdays.', 'Salı günleri İngilizce dersimiz var.']],
    mistake: '“in the night” değil, **at night**; ama **in the morning / in the evening**.',
    video: tr('36qye2lFSYg', 'In, On, At Kullanımı (Zaman Edatları) #24'), alt: en('Lr1BBoNu6hI', 'AT ON IN – Prepositions of Time in English', 'Woodward English'),
  },
  {
    id: 'g14', title: "can / can't", tr: 'Yetenek ve rica: can, can’t',
    explain: [
      '**can** + fiilin yalın hâli: bir şeyi yapabildiğimizi anlatır. I **can swim**.',
      'Olumsuz: **can’t** (cannot). Soru: **Can** you drive?',
      'Rica ve izin için de kullanılır: **Can** I open the window? **Can** you help me?',
      'Tüm öznelerle aynıdır; he / she / it ile -s almaz: She **can** cook.',
    ],
    examples: [['I can speak a little English.', 'Biraz İngilizce konuşabiliyorum.'], ['He can’t come to the meeting.', 'O toplantıya gelemez.'], ['Can I pay by card?', 'Kartla ödeyebilir miyim?']],
    mistake: '“can” sonrasında “to” gelmez: “I can to swim.” değil, **I can swim.**',
    video: tr('sSAmVbaXGAE', 'Can, Can’t Konu Anlatımı #19'), alt: en('SeLYwHeOodM', 'Can Can’t Cannot', 'Woodward English'),
  },
  {
    id: 'g15', title: 'imperatives', tr: 'Emir ve talimat cümleleri',
    explain: [
      'Talimat, uyarı ve öneri için fiilin yalın hâliyle başlarız: **Open** the door. **Turn** left.',
      'Olumsuz: **Don’t** + fiil: **Don’t** run!',
      'Daha kibar olmak için **please** ekleriz: Please sit down.',
    ],
    examples: [['Take the second street on the right.', 'Sağdaki ikinci sokağa girin.'], ['Don’t forget your umbrella.', 'Şemsiyeni unutma.'], ['Please close the door.', 'Lütfen kapıyı kapatın.']],
    mistake: 'Olumsuzda “not” tek başına kullanılmaz: “Not touch!” değil, **Don’t touch!**',
    video: tr('OHgp2xCCSI4', 'İngilizce Emir Cümleleri Konu Anlatımı #22'), alt: en('uL-Vwtcn9wY', 'The Imperative – Give Orders and Commands', 'The teacher channel'),
  },
  {
    id: 'g16', title: 'object pronouns', tr: 'Nesne zamirleri: me, him, her…',
    explain: [
      'Fiilden ya da edattan sonra özne zamiri değil **nesne zamiri** gelir: **me, you, him, her, it, us, them**.',
      'I → me, he → him, she → her, we → us, they → them. (you ve it değişmez.)',
    ],
    examples: [['Can you help me?', 'Bana yardım edebilir misin?'], ['I see them every weekend.', 'Onları her hafta sonu görürüm.'], ['This present is for her.', 'Bu hediye onun için.']],
    mistake: '“Call I later.” değil, **Call me later.**; “with they” değil, **with them**.',
    video: tr('su10jh6MJWY', 'İngilizce Object Pronouns Konu Anlatımı #21'), alt: en('aqJMbCvduhY', 'Object Pronouns – English Grammar Lessons', 'Ellii'),
  },
  {
    id: 'g17', title: 'present continuous', tr: 'Şimdiki zaman: am / is / are + -ing',
    explain: [
      'Şu anda olan ya da bu aralar devam eden işler için: **am / is / are + fiil-ing**.',
      'I **am working**. She **is cooking**. They **are watching** TV.',
      'Olumsuz: I’m **not** working. Soru: **Are** you **listening**?',
      'Yazım: make → making, sit → sitting, lie → lying.',
    ],
    examples: [['I’m waiting for the bus.', 'Otobüsü bekliyorum.'], ['She isn’t working today.', 'Bugün çalışmıyor.'], ['What are you doing?', 'Ne yapıyorsun?']],
    mistake: 'am / is / are unutulur: “I working now.” değil, **I’m working now.**',
    video: tr('JcbnUPB6lg8', 'Present Continuous Tense Konu Anlatımı #23'), alt: en('CHCth_sWL1g', 'Learn Present Continuous Tense', 'Shaw English Online'),
  },
  {
    id: 'g18', title: 'present simple or present continuous?', tr: 'Geniş zaman mı, şimdiki zaman mı?',
    explain: [
      '**Present simple**: alışkanlıklar ve hep doğru olanlar — I **work** in an office. (her gün)',
      '**Present continuous**: şu an ya da bu aralar — Today I**’m working** from home.',
      'İpuçları: every day, usually, never → present simple; now, at the moment, today, this week → present continuous.',
      'like, love, know, want, need gibi fiiller genelde -ing almaz: I **want** a coffee now.',
    ],
    examples: [['He usually drives, but today he’s taking the bus.', 'Genelde arabayla gider ama bugün otobüse biniyor.'], ['I don’t understand this word.', 'Bu kelimeyi anlamıyorum.'], ['Listen! Someone is knocking.', 'Dinle! Biri kapıyı çalıyor.']],
    mistake: '“I am knowing him.” denmez: **I know him.**',
    video: tr('JcbnUPB6lg8', 'Present Continuous Tense Konu Anlatımı #23'), alt: en('Q5UEPSk9ipE', 'Present Simple vs. Present Continuous Tense', 'Woodward English'),
  },
  {
    id: 'g19', title: 'countable / uncountable, how much / how many', tr: 'Sayılabilen / sayılamayan isimler',
    explain: [
      'Sayılabilen isimlerin çoğulu olur: an apple, two apples. Sayılamayanların olmaz: water, money, bread, information.',
      'Sayılamayanlarla a / an ve -s kullanılmaz: some bread (a bread değil).',
      'Soru: **How many** + çoğul (How many eggs?), **How much** + sayılamayan (How much money?).',
    ],
    examples: [['How much sugar do you want?', 'Ne kadar şeker istersin?'], ['How many people work here?', 'Burada kaç kişi çalışıyor?'], ['I need some information.', 'Biraz bilgiye ihtiyacım var.']],
    mistake: '“informations”, “advices” denmez: **information**, **advice** her zaman tekil kalır.',
    video: tr('Fge3CA2zr_k', 'İngilizcede Sayılabilen ve Sayılamayan Kelimeler #18'), alt: en('KJCKugsb9jw', 'Countable and Uncountable Nouns in English', 'Woodward English'),
  },
  {
    id: 'g20', title: 'like / love / hate + -ing', tr: 'Sevmek, nefret etmek + -ing',
    explain: [
      'Hoşlandığımız ya da hoşlanmadığımız etkinlikleri anlatırken **like, love, enjoy, hate, don’t mind** + **fiil-ing**: I **like swimming**.',
      'Olumsuz ve soru geniş zamandaki gibi: I **don’t like** cooking. **Do** you **enjoy** running?',
      '“would like” farklıdır, istek bildirir: I’d like a coffee.',
    ],
    examples: [['I love reading on the train.', 'Trende okumayı çok severim.'], ['She hates getting up early.', 'Erken kalkmaktan nefret eder.'], ['Do you like playing football?', 'Futbol oynamayı sever misin?']],
    mistake: '“I like swim.” değil, **I like swimming.**',
    video: en('GFUgzLvdwYg', 'Love hate like + verb + ing', 'Antoinette Dapples'), alt: null,
  },
  {
    id: 'g21', title: 'was / were', tr: '“Olmak” fiilinin geçmişi: was, were',
    explain: [
      'am / is → **was**; are → **were**. I / he / she / it **was**, you / we / they **were**.',
      'Olumsuz: wasn’t, weren’t. Soru: **Were** you at home? **Was** it expensive?',
      'Zaman ifadeleri: yesterday, last week, in 2019, two days ago.',
    ],
    examples: [['I was at the office yesterday.', 'Dün ofisteydim.'], ['The tickets weren’t cheap.', 'Biletler ucuz değildi.'], ['Where were you last night?', 'Dün gece neredeydin?']],
    mistake: '“You was” denmez: **you were**.',
    video: tr('quIqNQmJS08', 'Was Were Kullanımı #28'), alt: en('yhq1wuu7NFk', 'TO BE – Past & Present Tense – WAS and WERE', 'Woodward English'),
  },
  {
    id: 'g22', title: 'past simple: regular verbs', tr: 'Geçmiş zaman: düzenli fiiller (-ed)',
    explain: [
      'Geçmişte olup bitmiş işler için düzenli fiillere **-ed** ekleriz: work → work**ed**, watch → watch**ed**.',
      'Yazım: -e ile bitene sadece -d (live → lived); sessiz + y → -ied (study → studied); kısa fiillerde son harf ikilenir (stop → stopped).',
      'Tüm öznelerle aynıdır: I / she / they **worked**.',
    ],
    examples: [['I called my mother last night.', 'Dün akşam annemi aradım.'], ['We visited Kapadokya in May.', 'Mayıs’ta Kapadokya’yı gezdik.'], ['She studied in Germany.', 'Almanya’da okudu.']],
    mistake: 'Geçmiş zaman ifadesiyle şimdiki fiil kullanılır: “Yesterday I work late.” değil, **Yesterday I worked late.**',
    video: tr('iej7kmyqMQM', 'Simple Past Tense Konu Anlatımı #29'), alt: en('5rv9jKwC-cs', 'Learn Past Simple Tense', 'Shaw English Online'),
  },
  {
    id: 'g23', title: 'past simple: irregular verbs, negatives and questions', tr: 'Geçmiş zaman: düzensiz fiiller, olumsuz ve soru',
    explain: [
      'Sık kullanılan fiillerin çoğu düzensizdir; ezberlemek gerekir: go → **went**, have → **had**, see → **saw**, buy → **bought**, eat → **ate**, take → **took**.',
      'Olumsuz: **didn’t** + yalın fiil: I **didn’t go** (didn’t went değil).',
      'Soru: **Did** + özne + yalın fiil: **Did** you **see** the match?',
    ],
    examples: [['We went to the cinema on Saturday.', 'Cumartesi sinemaya gittik.'], ['I didn’t have breakfast today.', 'Bugün kahvaltı yapmadım.'], ['Did you buy the tickets?', 'Biletleri aldın mı?']],
    mistake: 'did’den sonra fiil yine geçmiş yapılmaz: “Did you saw it?” değil, **Did you see it?**',
    video: tr('iej7kmyqMQM', 'Simple Past Tense Konu Anlatımı #29'), alt: en('LkyCYeDdvgI', 'Past Simple Tense in English – Regular and Irregular Verbs', 'Woodward English'),
  },
  {
    id: 'g24', title: 'be going to (plans)', tr: 'Gelecek planları: be going to',
    explain: [
      'Önceden karar verdiğimiz planlar için: **am / is / are + going to + fiil**: I**’m going to visit** my grandparents.',
      'Olumsuz: I’m **not going to** buy it. Soru: **Are** you **going to** come?',
      'Zaman ifadeleri: tomorrow, next week, this summer, next year.',
    ],
    examples: [['We’re going to move to İzmir next year.', 'Seneye İzmir’e taşınacağız.'], ['He isn’t going to come tonight.', 'Bu akşam gelmeyecek.'], ['What are you going to do this weekend?', 'Bu hafta sonu ne yapacaksın?']],
    mistake: 'am / is / are unutulur: “I going to call you.” değil, **I’m going to call you.**',
    video: tr('fIvVSbc6u_o', 'Future Tense Be Going To Konu Anlatımı #31'), alt: en('IpmmTWcjVbM', 'Simple Future with Be Going To', 'Ellii'),
  },
];
