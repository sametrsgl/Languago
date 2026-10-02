// Kelime Şehri (Monopoly-style city board): curated content banks.
// Pure data, no DOM: error sentences for the Garage, Open Mic prompts,
// Chance/Signal/Magic decks, Kommo's brain breaks and the square names.
// Everything students read is English; `tr` is a short hint for the teacher.
// Icons are slugs of /pictures/board/<slug>.svg (null: Arena planets are CSS).

export const STAGE_NAMES = { studio: 'Word City', arena: 'Orbit Match', park: 'Treasure Island' };

// Garage "Fix a sentence" cards: one error per sentence, safe for teens.
export const ERROR_SENTENCES = {
  a1: [
    { wrong: 'She have a cat.', right: 'She has a cat.', tr: 'he/she/it ile has' },
    { wrong: 'I am student.', right: 'I am a student.', tr: 'Meslek/rolden önce a/an' },
    { wrong: "He don't like milk.", right: "He doesn't like milk.", tr: "he/she/it ile doesn't" },
    { wrong: 'They is my friends.', right: 'They are my friends.', tr: 'they ile are' },
    { wrong: 'I have two book.', right: 'I have two books.', tr: 'Çoğulda -s: books' },
    { wrong: 'Where you live?', right: 'Where do you live?', tr: 'Soruda yardımcı fiil do' },
    { wrong: 'I can to swim.', right: 'I can swim.', tr: "can'den sonra to yok" },
    { wrong: 'There is three apples.', right: 'There are three apples.', tr: 'Çoğulda there are' },
    { wrong: 'i like english.', right: 'I like English.', tr: 'I ve dil adları büyük harfle' },
    { wrong: 'It is a apple.', right: 'It is an apple.', tr: 'Ünlü sesten önce an' },
    { wrong: 'We goes to school by bus.', right: 'We go to school by bus.', tr: 'we ile go (-es yok)' },
    { wrong: 'My sister she is ten.', right: 'My sister is ten.', tr: 'Özne iki kez söylenmez' },
  ],
  a2: [
    { wrong: 'She go to school every day.', right: 'She goes to school every day.', tr: 'Geniş zaman, he/she/it: -es' },
    { wrong: "I didn't went to the park.", right: "I didn't go to the park.", tr: "didn't'ten sonra yalın fiil" },
    { wrong: 'Yesterday I eat pizza.', right: 'Yesterday I ate pizza.', tr: 'Geçmiş zaman: eat → ate' },
    { wrong: 'Did you saw the film?', right: 'Did you see the film?', tr: 'Did ile yalın fiil' },
    { wrong: 'He is more tall than me.', right: 'He is taller than me.', tr: 'Kısa sıfat: -er (more değil)' },
    { wrong: "I'm going visit my grandma.", right: "I'm going to visit my grandma.", tr: 'be going to + fiil' },
    { wrong: "There isn't some milk.", right: "There isn't any milk.", tr: 'Olumsuz cümlede any' },
    { wrong: 'Does she likes music?', right: 'Does she like music?', tr: 'Does ile yalın fiil' },
    { wrong: 'We was at home last night.', right: 'We were at home last night.', tr: 'we ile were' },
    { wrong: "It's the most big city in Turkey.", right: "It's the biggest city in Turkey.", tr: 'Kısa sıfat: the -est' },
    { wrong: 'I am watching TV every evening.', right: 'I watch TV every evening.', tr: 'Alışkanlık: geniş zaman' },
    { wrong: 'How much apples do you want?', right: 'How many apples do you want?', tr: 'Sayılabilen isim: how many' },
  ],
  b1: [
    { wrong: 'I live here since 2020.', right: 'I have lived here since 2020.', tr: 'since ile present perfect' },
    { wrong: 'I have seen that film last week.', right: 'I saw that film last week.', tr: 'Belli geçmiş zaman (last week): past simple' },
    { wrong: 'If it will rain, we will stay home.', right: 'If it rains, we will stay home.', tr: 'If tarafında will yok: present simple' },
    { wrong: 'She is interesting in science.', right: 'She is interested in science.', tr: 'Kişinin ilgisi: -ed (interested)' },
    { wrong: "I'm used to get up early.", right: "I'm used to getting up early.", tr: 'be used to + -ing' },
    { wrong: 'You should to see a doctor.', right: 'You should see a doctor.', tr: "should'dan sonra to yok" },
    { wrong: 'The book who I read was great.', right: 'The book that I read was great.', tr: 'Nesne için who değil that/which (ikisi de doğru)' },
    { wrong: 'I was reading when the phone was ringing.', right: 'I was reading when the phone rang.', tr: 'Araya giren kısa eylem: past simple' },
    { wrong: 'Can you tell me where is the station?', right: 'Can you tell me where the station is?', tr: 'Dolaylı soruda düz sıra' },
    { wrong: 'I look forward to see you.', right: 'I look forward to seeing you.', tr: 'look forward to + -ing' },
    { wrong: 'We arrived to the airport late.', right: 'We arrived at the airport late.', tr: 'arrive at (yer), arrive in (şehir)' },
    { wrong: 'He is working here for three years.', right: 'He has been working here for three years.', tr: 'for + süre: present perfect continuous' },
  ],
  b2: [
    { wrong: 'If I would have known, I would have come.', right: 'If I had known, I would have come.', tr: 'Üçüncü tip koşul: If + past perfect' },
    { wrong: 'I wish I can speak Japanese.', right: 'I wish I could speak Japanese.', tr: 'wish + past: could' },
    { wrong: 'Despite of the rain, we went for a walk.', right: 'Despite the rain, we went for a walk.', tr: "despite'tan sonra of yok (in spite of olur)" },
    { wrong: 'Hardly I had arrived when it started to rain.', right: 'Hardly had I arrived when it started to rain.', tr: 'Hardly ile devrik yapı: had I' },
    { wrong: 'She suggested me to take a break.', right: 'She suggested that I take a break.', tr: 'suggest that + özne + fiil; "suggested taking a break" da doğru' },
    { wrong: 'The number of students are growing.', right: 'The number of students is growing.', tr: 'The number of: tekil fiil (a number of: çoğul)' },
    { wrong: "It's high time we leave.", right: "It's high time we left.", tr: "It's high time + past simple" },
    { wrong: "I'd rather you don't tell anyone.", right: "I'd rather you didn't tell anyone.", tr: "I'd rather + özne + past simple" },
    { wrong: 'He made me to wait for an hour.', right: 'He made me wait for an hour.', tr: 'make + nesne + yalın fiil (to yok)' },
    { wrong: 'By the time we got there, the film already started.', right: 'By the time we got there, the film had already started.', tr: 'Daha önce biten eylem: past perfect' },
    { wrong: 'The information were useful.', right: 'The information was useful.', tr: 'information sayılamaz: was' },
    { wrong: "Let's discuss about the plan.", right: "Let's discuss the plan.", tr: "discuss'tan sonra about yok" },
  ],
};

// Open Mic (Stüdyo corner 10): a 30-second talk; the criteria are printed on the card.
export const MIC_PROMPTS = {
  a1: [
    { text: 'Talk about your family.', criteria: '3 sentences', tr: 'Ailenizi anlatın' },
    { text: 'Talk about your home.', criteria: '3 sentences', tr: 'Evinizi anlatın' },
    { text: 'What do you have for breakfast?', criteria: '3 sentences', tr: 'Kahvaltıda ne yersiniz?' },
    { text: 'Tell us about your best friend.', criteria: '3 sentences', tr: 'En iyi arkadaşınızı anlatın' },
    { text: "What's in your bag?", criteria: '3 sentences', tr: 'Çantanızda ne var?' },
    { text: 'Talk about your city.', criteria: '3 sentences', tr: 'Şehrinizi anlatın' },
    { text: 'What do you do on Sundays?', criteria: '3 sentences', tr: 'Pazar günleri ne yaparsınız?' },
    { text: "What's your favourite food?", criteria: '3 sentences', tr: 'En sevdiğiniz yemek' },
  ],
  a2: [
    { text: 'Tell us about your last holiday.', criteria: '4 sentences in the past', tr: 'Son tatiliniz (geçmiş zaman)' },
    { text: 'Describe a typical day for you.', criteria: '4 sentences', tr: 'Sıradan bir gününüz' },
    { text: 'What did you do last weekend?', criteria: '4 sentences in the past', tr: 'Geçen hafta sonu ne yaptınız?' },
    { text: 'Talk about a person you admire.', criteria: '4 sentences and a reason', tr: 'Hayran olduğunuz biri' },
    { text: 'Tell us about your favourite restaurant.', criteria: '4 sentences', tr: 'En sevdiğiniz restoran' },
    { text: 'What are you going to do next summer?', criteria: '4 sentences with "going to"', tr: 'Gelecek yaz planınız (going to)' },
    { text: 'Talk about a film you like.', criteria: '4 sentences', tr: 'Sevdiğiniz bir film' },
    { text: 'Compare two cities you know.', criteria: '4 sentences with comparatives', tr: 'İki şehri karşılaştırın (-er / more)' },
  ],
  b1: [
    { text: 'Tell us about a time you got lost.', criteria: '30 seconds in the past', tr: 'Kaybolduğunuz bir an' },
    { text: 'What would you change about your city?', criteria: '30 seconds and a reason', tr: 'Şehrinizde neyi değiştirirdiniz?' },
    { text: 'Talk about a skill you want to learn.', criteria: '30 seconds and a reason', tr: 'Öğrenmek istediğiniz bir beceri' },
    { text: "What's the best advice anyone has ever given you?", criteria: '30 seconds and a reason', tr: 'Aldığınız en iyi tavsiye' },
    { text: 'Describe a family tradition.', criteria: '30 seconds and an example', tr: 'Bir aile geleneği' },
    { text: 'Working from home: are you for or against it?', criteria: '30 seconds and a reason', tr: 'Evden çalışma: lehte mi aleyhte mi?' },
    { text: 'Talk about a place that changed you.', criteria: '30 seconds and a reason', tr: 'Sizi değiştiren bir yer' },
    { text: 'What makes a good neighbour?', criteria: '30 seconds and an example', tr: 'İyi bir komşu nasıl olur?' },
  ],
  b2: [
    { text: 'Convince us to visit your hometown.', criteria: '30 seconds, a reason and an example', tr: 'Memleketinizi ziyaret etmemiz için ikna edin' },
    { text: 'Is social media making us lonelier?', criteria: '30 seconds, a reason and an example', tr: 'Sosyal medya bizi yalnızlaştırıyor mu?' },
    { text: 'Talk about a decision you regret.', criteria: '30 seconds, a reason and an example', tr: 'Pişman olduğunuz bir karar' },
    { text: 'What will cities be like in 30 years?', criteria: '30 seconds, a reason and an example', tr: '30 yıl sonra şehirler' },
    { text: 'Defend your favourite season.', criteria: '30 seconds, a reason and an example', tr: 'En sevdiğiniz mevsimi savunun' },
    { text: 'Renting or buying a home: which is better?', criteria: '30 seconds, a reason and an example', tr: 'Kira mı, ev sahibi olmak mı?' },
    { text: 'Pitch an app in 30 seconds.', criteria: '30 seconds: the problem, the app and who it is for', tr: 'Bir uygulama fikrini 30 saniyede sunun' },
    { text: "What's overrated? Tell us and explain why.", criteria: '30 seconds, a reason and an example', tr: 'Sizce abartılan bir şey' },
  ],
};

// Chance events. Effects: gain n, payPot n (Stüdyo), toStart (lands on START,
// so the pass bonus is paid), toGarage (not Park), steps n (move, then resolve
// that square), allGain n, joker.
const STUDIO_EVENTS = [
  { id: 'bonus', text: 'Bonus! Collect 50 coins.', tr: '+50 jeton', effect: { type: 'gain', n: 50 } },
  { id: 'parking', text: 'Parking ticket! Pay 50 coins to the pot.', tr: 'Park cezası: 50 jeton kasaya', effect: { type: 'payPot', n: 50 } },
  { id: 'start', text: 'Go to START and collect your bonus.', tr: "START'a git (bonus alınır)", effect: { type: 'toStart' } },
  { id: 'flat-tyre', text: 'Flat tyre! Go to the Garage. Do not pass START.', tr: 'Lastik patladı: Garaja', effect: { type: 'toGarage' } },
  { id: 'taxi', text: 'Take a taxi! Move 3 squares forward.', tr: 'Taksi: 3 kare ileri', effect: { type: 'steps', n: 3 } },
  { id: 'joker', text: 'Lucky day! Take a joker.', tr: 'Bir joker al', effect: { type: 'joker' } },
];

const ARENA_EVENTS = [
  { id: 'solar-wind', text: 'Solar wind! +2 credits.', tr: '+2 kredi', effect: { type: 'gain', n: 2 } },
  { id: 'meteor', text: 'Meteor shower! Move 3 squares forward.', tr: 'Meteor yağmuru: 3 kare ileri', effect: { type: 'steps', n: 3 } },
  { id: 'tractor', text: 'Tractor beam! Go to the Asteroid Belt.', tr: 'Çekici ışın: Asteroit Kuşağına', effect: { type: 'toGarage' } },
  { id: 'supply', text: 'Supply boost! Take a joker.', tr: 'Bir joker al', effect: { type: 'joker' } },
  { id: 'launch-pad', text: 'Back to the Launch Pad! +2 credits.', tr: 'Fırlatma rampasına dön (+2)', effect: { type: 'toStart' } },
];

const PARK_EVENTS = [
  { id: 'lucky-shell', text: 'Lucky shell! +2 stars.', tr: 'Şanslı deniz kabuğu: +2 yıldız', effect: { type: 'gain', n: 2 } },
  { id: 'hop', text: 'Hop 2 more squares!', tr: '2 kare daha zıpla', effect: { type: 'steps', n: 2 } },
  { id: 'stars-all', text: 'Everybody gets a star!', tr: 'Her takıma 1 yıldız', effect: { type: 'allGain', n: 1 } },
  { id: 'harbour', text: 'Fly to the Harbour! +1 star.', tr: 'Limana uç (+1 yıldız)', effect: { type: 'toStart' } },
];

// Band A is A1-A2, band B is B1-B2. Park tasks are whole-class TPR ("Done!"
// gives every team a star); `levels` limits a task to some levels only.
export const CHANCE = {
  studio: {
    A: {
      tasks: [
        { id: 'cafe', text: "You're at a café. Order a drink and a snack.", criteria: 'Use "Can I have…?"', tr: 'Kafede içecek ve atıştırmalık isteyin' },
        { id: 'teammate', text: 'Introduce a teammate to the class.', criteria: 'Name, job and a hobby', tr: 'Bir takım arkadaşını tanıtın' },
        { id: 'weekend', text: 'Ask the teacher 2 questions about the weekend.', criteria: '2 correct questions', tr: 'Öğretmene hafta sonuyla ilgili 2 soru' },
        { id: 'room', text: 'Everyone in your team names one thing in this room.', criteria: 'One word each, no repeats', tr: 'Herkes sınıftan bir eşya söyler' },
        { id: 'weather', text: "Describe today's weather.", criteria: '2 sentences', tr: 'Bugünün havası' },
        { id: 'directions', text: 'Give directions from your seat to the door.', criteria: 'Turn left, turn right, go straight', tr: 'Kapıya yol tarifi' },
        { id: 'yesterday', text: 'Say what you did yesterday.', criteria: '3 sentences, one per speaker', tr: 'Dün ne yaptınız (her konuşmacı 1 cümle)' },
      ],
      events: STUDIO_EVENTS,
    },
    B: {
      tasks: [
        { id: 'flight', text: 'Your flight is cancelled. Complain politely to the airline.', criteria: '3 polite sentences', tr: 'Uçuş iptali: kibarca şikâyet' },
        { id: 'reception', text: 'Make small talk with a hotel receptionist.', criteria: 'Ask 2 questions and answer 2', tr: 'Resepsiyonistle sohbet' },
        { id: 'update', text: "Give your manager a quick update on next week's plans.", criteria: '3 sentences about the future', tr: 'Yöneticiye gelecek haftanın planı' },
        { id: 'restaurant', text: 'Recommend a restaurant to the class.', criteria: '2 reasons', tr: 'Bir restoran önerin (2 neden)' },
        { id: 'surprised', text: 'Tell a story that begins "I\'ve never been so surprised…"', criteria: '3 sentences', tr: '"Hiç bu kadar şaşırmamıştım…" diye başlayan hikâye' },
        { id: 'voicemail', text: "Leave a voicemail: you'll be late.", criteria: 'Apologise and suggest a new time', tr: 'Sesli mesaj: gecikeceğim, özür + yeni saat' },
        { id: 'hobby', text: 'Persuade the class to try your hobby.', criteria: '20 seconds', tr: 'Hobinizi denememiz için ikna edin' },
        { id: 'would-you-mind', text: 'Ask another team for 2 favours with "Would you mind…?"', criteria: 'Would you mind + -ing; they answer politely', tr: '"Would you mind…?" ile 2 rica' },
      ],
      events: STUDIO_EVENTS,
    },
  },
  arena: {
    A: {
      tasks: [
        { id: 'subjects', text: 'Name 5 school subjects in 10 seconds!', criteria: '5 subjects, 10 seconds', tr: '10 saniyede 5 ders adı' },
        { id: 'bedroom', text: 'Describe your dream bedroom.', criteria: '3 sentences', tr: 'Hayalinizdeki yatak odası' },
        { id: 'ask-team', text: 'Ask another team 2 questions.', criteria: '2 correct questions; they answer', tr: 'Başka bir takıma 2 soru' },
        { id: 'can', text: "Say 3 things you can do and 1 thing you can't do.", criteria: '4 sentences with can / can\'t', tr: "can ile 3, can't ile 1 cümle" },
        { id: 'fav-game', text: "What's your favourite game? Say why.", criteria: 'The game and a reason', tr: 'En sevdiğiniz oyun ve nedeni' },
      ],
      events: ARENA_EVENTS,
    },
    B: {
      tasks: [
        { id: 'strange-day', text: 'Tell us about a strange day at school.', criteria: '3 sentences in the past', tr: 'Okulda tuhaf bir gün (geçmiş zaman)' },
        { id: 'best-film', text: 'Convince us your favourite film is the best.', criteria: '2 reasons', tr: 'En sevdiğiniz filmin en iyisi olduğuna ikna edin' },
        { id: 'compare', text: 'Compare two planets or two places.', criteria: '3 sentences with comparatives', tr: 'İki gezegen ya da yeri karşılaştırın' },
        { id: 'rules', text: 'Explain the rules of a game you know.', criteria: 'First, then, finally', tr: 'Bildiğiniz bir oyunun kuralları' },
        { id: 'invisible', text: 'What would you do if you were invisible for a day?', criteria: '3 sentences with "would"', tr: 'Bir günlüğüne görünmez olsaydınız' },
      ],
      events: ARENA_EVENTS,
    },
  },
  park: {
    tasks: [
      { id: 'penguin', text: 'Walk like a penguin and say "penguin" 3 times!', tr: 'Penguen gibi yürü, 3 kez "penguin" de' },
      { id: 'blue', text: 'Touch something blue!', tr: 'Mavi bir şeye dokun' },
      { id: 'count-10', text: 'Count from 1 to 10 together!', tr: "Birlikte 1'den 10'a say", levels: ['a1'] },
      { id: 'count-twos', text: 'Count in twos to 20 together!', tr: "Birlikte ikişer ikişer 20'ye say", levels: ['a2', 'b1', 'b2'] },
      { id: 'animals', text: 'Say 3 animals together!', tr: 'Birlikte 3 hayvan söyle' },
      { id: 'clap', text: 'Clap 5 times and say hello to a friend!', tr: '5 kez alkışla, bir arkadaşına merhaba de' },
      { id: 'frog', text: 'Jump like a frog 3 times!', tr: 'Kurbağa gibi 3 kez zıpla' },
      { id: 'pizza', text: 'Stand up if you like pizza!', tr: 'Pizza seviyorsan ayağa kalk' },
      { id: 'see-3', text: 'Say 3 things you can see in the classroom!', tr: 'Sınıfta gördüğün 3 şeyi söyle', levels: ['b1', 'b2'] },
      { id: 'breakfast', text: 'Tell a friend what you ate for breakfast!', tr: 'Arkadaşına kahvaltıda ne yediğini anlat', levels: ['b1', 'b2'] },
    ],
    events: PARK_EVENTS,
  },
};

// Kommo's Nest (Park corner 6): "Done!" gives every team a star.
export const NEST_BREAKS = [
  { text: 'Touch your nose, then your toes!', tr: 'Önce burnuna, sonra ayak parmaklarına dokun' },
  { text: 'Freeze like a statue!', tr: 'Heykel gibi donup kal' },
  { text: 'Dance for 10 seconds!', tr: '10 saniye dans et' },
  { text: 'Stretch up high like a tree!', tr: 'Ağaç gibi yukarı uzan' },
  { text: 'Jump like a frog 3 times!', tr: 'Kurbağa gibi 3 kez zıpla' },
];

// Square 0 is the bottom-right corner, then clockwise (see the board in logic):
// 0 start | 1 2 4 street A | 3 15 chance | 5 joker | 6 garage | 7-9 street B
// 10 mic | 11 13 14 street C | 12 everyone | 16 go-to-garage | 17-19 street D.
export const SQUARES = {
  studio: [
    { name: 'START', icon: 'chequered-flag' },
    { name: 'Café', icon: 'hot-beverage' },
    { name: 'Bakery', icon: 'croissant' },
    { name: 'Chance', icon: 'red-question-mark' },
    { name: 'Bookshop', icon: 'books' },
    { name: 'Joker Box', icon: 'wrapped-gift' },
    { name: 'Fix-it Garage', icon: 'wrench' },
    { name: 'Cinema', icon: 'clapper-board' },
    { name: 'City Park', icon: 'deciduous-tree' },
    { name: 'Market', icon: 'shopping-cart' },
    { name: 'Open Mic', icon: 'microphone' },
    { name: 'Museum', icon: 'classical-building' },
    { name: 'Everybody!', icon: 'raising-hands' },
    { name: 'Station', icon: 'station' },
    { name: 'Fountain Square', icon: 'fountain' },
    { name: 'Chance', icon: 'red-question-mark' },
    { name: 'Flat tyre! Go to the Garage', icon: 'wheel' },
    { name: 'Concert Hall', icon: 'musical-notes' },
    { name: 'Stadium', icon: 'stadium' },
    { name: 'Grand Hotel', icon: 'hotel' },
  ],
  arena: [
    { name: 'Launch Pad', icon: 'rocket' },
    { name: 'Nova', icon: null },
    { name: 'Vega', icon: null },
    { name: 'Signal', icon: 'satellite-antenna' },
    { name: 'Orion', icon: null },
    { name: 'Supply Drop', icon: 'package' },
    { name: 'Asteroid Belt', icon: 'rock' },
    { name: 'Lyra', icon: null },
    { name: 'Zenith', icon: null },
    { name: 'Kepler', icon: null },
    { name: 'Wormhole', icon: 'cyclone' },
    { name: 'Atlas', icon: null },
    { name: 'Scan', icon: 'satellite' },
    { name: 'Rigel', icon: null },
    { name: 'Sirius', icon: null },
    { name: 'Signal', icon: 'satellite-antenna' },
    { name: 'Tractor Beam', icon: 'flying-saucer' },
    { name: 'Altair', icon: null },
    { name: 'Polaris', icon: null },
    { name: 'Titan', icon: null },
  ],
  park: [
    { name: 'Harbour', icon: 'anchor' },
    { name: 'Palm Beach', icon: 'palm-tree' },
    { name: 'Shell Cove', icon: 'spiral-shell' },
    { name: 'Magic', icon: 'magic-wand' },
    { name: 'Coconut Hill', icon: 'coconut' },
    { name: 'Everybody', icon: 'raising-hands' },
    { name: "Kommo's Nest", icon: 'nest-with-eggs' },
    { name: 'Parrot Jungle', icon: 'parrot' },
    { name: 'Turtle Bay', icon: 'turtle' },
    { name: 'Crab Rock', icon: 'crab' },
    { name: 'Windy Corner', icon: 'wind-face' },
    { name: 'Pineapple Farm', icon: 'pineapple' },
    { name: 'Everybody', icon: 'raising-hands' },
    { name: 'Mango Grove', icon: 'mango' },
    { name: 'Dolphin Lagoon', icon: 'dolphin' },
    { name: 'Magic', icon: 'magic-wand' },
    { name: 'Rainbow Slide', icon: 'playground-slide' },
    { name: 'Rainbow Falls', icon: 'rainbow' },
    { name: 'Star Beach', icon: 'glowing-star' },
    { name: 'Volcano View', icon: 'volcano' },
  ],
};
