// Builds the classroom picture library from Microsoft Fluent Emoji (MIT licence).
// Only the flat SVGs for curated, school-safe learner words are copied.
//
//   git clone --filter=blob:none --no-checkout --depth 1 https://github.com/microsoft/fluentui-emoji.git C:/fe
//   (sparse-checkout assets/*/Flat/*, assets/*/Default/Flat/*, assets/*/metadata.json, LICENSE)
//   FLUENT_DIR=C:/fe node scripts/build-pictures.mjs
//
// Output: public/pictures/<key>.svg, public/pictures/LICENSE-fluentui-emoji.txt,
//         src/data/pictures.json (topics, words, Turkish glosses, CEFR level).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORD_DATA } from '../src/data/words.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.env.FLUENT_DIR || 'C:/fe';
const outDir = path.join(root, 'public', 'pictures');
const dataOut = path.join(root, 'src', 'data', 'pictures.json');

// Entry syntax: 'word=fluent name|Turkish gloss|#group'. The picture name is
// only needed when it differs from the word. '#group' marks words a class could
// defend for the same picture (duck / bird, rain / cloud, hotel with its "H" /
// hospital): presentVocab never puts two words of one group side by side.
const TOPICS = [
  { id: 'animals', tr: 'Hayvanlar', en: 'Animals', words: ['cat|kedi', 'dog|köpek', 'horse|at|#horse', 'cow|inek', 'pig|domuz', 'sheep=ewe|koyun', 'goat|keçi', 'chicken|tavuk|#bird', 'duck|ördek|#bird', 'rabbit|tavşan', 'mouse|fare', 'lion|aslan', 'tiger|kaplan', 'elephant|fil', 'monkey|maymun', 'bear|ayı', 'panda|panda', 'giraffe|zürafa', 'zebra|zebra', 'camel|deve', 'frog|kurbağa', 'snake|yılan', 'turtle|kaplumbağa', 'fish|balık|#fish', 'shark|köpek balığı|#fish', 'whale|balina|#fish', 'dolphin|yunus|#fish', 'octopus|ahtapot', 'bird|kuş|#bird', 'owl|baykuş|#bird', 'penguin|penguen|#bird', 'parrot|papağan|#bird', 'bee=honeybee|arı', 'butterfly|kelebek', 'spider|örümcek', 'snail|salyangoz', 'crocodile|timsah', 'kangaroo|kanguru', 'hippo=hippopotamus|su aygırı', 'fox|tilki', 'wolf|kurt', 'deer|geyik', 'squirrel=chipmunk|sincap', 'hedgehog|kirpi', 'bat|yarasa', 'crab|yengeç', 'ant|karınca', 'ladybird=lady beetle|uğur böceği', 'dinosaur=sauropod|dinozor', 'unicorn|tek boynuzlu at|#horse'] },
  { id: 'fruit-veg', tr: 'Meyve ve Sebzeler', en: 'Fruit & Vegetables', words: ['apple=red apple|elma', 'banana|muz', 'orange=tangerine|portakal', 'lemon|limon', 'grapes|üzüm', 'strawberry|çilek', 'cherries|kiraz', 'watermelon|karpuz|#melon', 'pear|armut', 'peach|şeftali', 'pineapple|ananas', 'mango|mango', 'coconut|hindistan cevizi', 'kiwi=kiwi fruit|kivi', 'melon|kavun|#melon', 'tomato|domates', 'carrot|havuç', 'potato|patates', 'corn=ear of corn|mısır', 'broccoli|brokoli', 'onion|soğan', 'garlic|sarımsak', 'mushroom|mantar', 'cucumber|salatalık', 'pepper=bell pepper|biber', 'avocado|avokado', 'aubergine=eggplant|patlıcan', 'olive|zeytin', 'lettuce=leafy green|marul', 'peanuts|yer fıstığı'] },
  { id: 'food-drink', tr: 'Yiyecek ve İçecekler', en: 'Food & Drinks', words: ['bread|ekmek', 'cheese=cheese wedge|peynir', 'egg|yumurta', 'milk=glass of milk|süt', 'butter|tereyağı', 'honey=honey pot|bal', 'pizza|pizza', 'hamburger|hamburger', 'sandwich|sandviç', 'hot dog|sosisli sandviç', 'soup=pot of food|çorba|#noodle', 'salad=green salad|salata', 'rice=cooked rice|pilav', 'spaghetti|spagetti|#noodle', 'cake=shortcake|pasta', 'cookie|kurabiye', 'chocolate=chocolate bar|çikolata', 'ice cream|dondurma', 'doughnut|donut', 'sweet=candy|şeker|#sweet', 'popcorn|patlamış mısır', 'chips=french fries|patates kızartması', 'water=droplet|su', 'tea=teacup without handle|çay', 'coffee=hot beverage|kahve', 'juice=beverage box|meyve suyu', 'salt|tuz', 'pancakes|pankek', 'meat=cut of meat|et', 'lollipop|lolipop|#sweet', 'pie|turta', 'noodles=steaming bowl|erişte|#noodle'] },
  { id: 'clothes', tr: 'Kıyafetler', en: 'Clothes', words: ['T-shirt=t-shirt|tişört', 'jeans|kot pantolon', 'dress|elbise', 'coat|mont', 'scarf|atkı', 'gloves|eldiven', 'socks|çorap', 'hat=top hat|şapka|#hat', 'cap=billed cap|kasket|#hat', 'shoe=running shoe|ayakkabı|#shoe', 'boot=hiking boot|bot|#shoe', 'sunglasses|güneş gözlüğü|#glasses', 'glasses|gözlük|#glasses', 'shorts|şort', 'bag=handbag|çanta|#bag', 'backpack|sırt çantası|#bag', 'umbrella|şemsiye', 'ring|yüzük', 'crown|taç', 'swimsuit=one-piece swimsuit|mayo', 'tie=necktie|kravat', 'sandal=woman’s sandal|sandalet|#shoe', 'purse|cüzdan|#bag', 'watch|kol saati'] },
  { id: 'transport', tr: 'Ulaşım', en: 'Transport', words: ['car=automobile|araba|#car', 'bus|otobüs', 'taxi|taksi|#car', 'train=locomotive|tren|#train', 'plane=airplane|uçak', 'ship|gemi|#boat', 'boat=sailboat|tekne|#boat', 'bike=bicycle|bisiklet|#bike', 'motorbike=motorcycle|motosiklet|#bike', 'helicopter|helikopter', 'rocket|roket', 'truck=delivery truck|kamyon|#truck', 'tractor|traktör', 'ambulance|ambulans', 'police car|polis arabası|#car', 'fire engine|itfaiye aracı|#truck', 'scooter=kick scooter|scooter', 'underground=metro|metro|#train', 'tram|tramvay|#train', 'canoe|kano|#boat', 'skateboard|kaykay', 'parachute|paraşüt', 'traffic light=vertical traffic light|trafik ışığı'] },
  { id: 'school', tr: 'Okul Eşyaları', en: 'School Things', words: ['book=closed book|kitap|#book', 'pencil|kurşun kalem', 'pen|tükenmez kalem', 'ruler=straight ruler|cetvel', 'scissors|makas', 'notebook|defter|#book', 'computer=laptop|bilgisayar', 'abacus|abaküs', 'clock=alarm clock|saat', 'crayon|pastel boya', 'paintbrush|fırça', 'paints=artist palette|boyalar', 'school|okul', 'bell|zil', 'teacher|öğretmen', 'student|öğrenci', 'globe=globe showing europe-africa|küre', 'map=world map|harita', 'magnet|mıknatıs', 'microscope|mikroskop', 'test tube|deney tüpü', 'paper clip=paperclip|ataş', 'envelope|zarf'] },
  { id: 'home', tr: 'Evim ve Eşyalar', en: 'My Home', words: ['house|ev', 'bed|yatak', 'chair|sandalye', 'sofa=couch and lamp|kanepe', 'door|kapı', 'window|pencere', 'light bulb|ampul', 'bath=bathtub|küvet', 'shower|duş', 'toilet|tuvalet', 'key|anahtar', 'phone=mobile phone|telefon', 'television|televizyon', 'mirror|ayna', 'plate=fork and knife with plate|tabak', 'spoon|kaşık', 'cup=cup with straw|bardak', 'soap|sabun', 'toothbrush|diş fırçası', 'bucket|kova', 'basket|sepet', 'candle|mum', 'broom|süpürge', 'sponge|sünger', 'radio|radyo', 'camera|fotoğraf makinesi', 'teapot|çaydanlık', 'box=package|kutu'] },
  { id: 'nature-weather', tr: 'Doğa ve Hava', en: 'Nature & Weather', words: ['sun|güneş', 'moon=crescent moon|ay', 'star|yıldız', 'cloud|bulut|#cloud', 'rain=cloud with rain|yağmur|#cloud', 'snow=snowflake|kar', 'wind=wind face|rüzgâr', 'rainbow|gökkuşağı', 'tree=deciduous tree|ağaç|#plant', 'flower=tulip|çiçek|#plant', 'rose|gül|#plant', 'sunflower|ayçiçeği|#plant', 'leaf=leaf fluttering in wind|yaprak', 'mountain|dağ|#mountain', 'sea=water wave|deniz', 'volcano|yanardağ|#mountain', 'fire|ateş', 'lightning=high voltage|şimşek', 'snowman|kardan adam', 'desert|çöl', 'island=desert island|ada', 'beach=beach with umbrella|plaj', 'cactus|kaktüs|#plant', 'plant=potted plant|bitki|#plant', 'fog|sis|#cloud'] },
  { id: 'sports-hobbies', tr: 'Spor ve Hobiler', en: 'Sports & Hobbies', words: ['football=soccer ball|futbol', 'basketball|basketbol', 'tennis|tenis', 'volleyball|voleybol', 'baseball|beyzbol', 'swimming=person swimming|yüzme', 'running=person running|koşu', 'cycling=person biking|bisiklet sürme', 'skiing=skier|kayak', 'skateboarding=skateboard|kaykay', 'dancing=woman dancing|dans', 'reading=books|kitap okuma', 'painting=artist palette|resim yapma', 'chess=chess pawn|satranç', 'fishing=fishing pole|balık tutma', 'camping|kamp', 'bowling|bowling', 'table tennis=ping pong|masa tenisi', 'surfing=person surfing|sörf', 'climbing=person climbing|tırmanma', 'yoga=person in lotus position|yoga', 'video game|video oyunu', 'music=musical notes|müzik', 'medal=sports medal|madalya', 'trophy|kupa'] },
  { id: 'music', tr: 'Müzik Aletleri', en: 'Music', words: ['guitar|gitar', 'piano=musical keyboard|piyano', 'drum|davul|#drum', 'violin|keman', 'trumpet|trompet', 'saxophone|saksafon', 'microphone|mikrofon', 'headphones=headphone|kulaklık', 'radio|radyo', 'accordion|akordeon', 'banjo|banjo', 'flute|flüt', 'maracas|marakas', 'long drum|uzun davul|#drum'] },
  { id: 'body', tr: 'Vücudumuz', en: 'My Body', words: ['eye|göz', 'ear|kulak', 'nose|burun', 'mouth|ağız', 'tooth|diş', 'tongue|dil', 'hand=raised hand|el|#hand', 'foot|ayak|#leg', 'leg|bacak|#leg', 'arm=flexed biceps|kol', 'brain|beyin', 'bone|kemik', 'heart=anatomical heart|kalp', 'lungs|akciğerler', 'finger=backhand index pointing up|parmak|#hand', 'hair=woman: red hair|saç|#face', 'face=grinning face|yüz|#face'] },
  { id: 'feelings', tr: 'Duygular', en: 'Feelings', words: ['happy=grinning face|mutlu|#happy', 'sad=frowning face|üzgün|#sad', 'angry=angry face|kızgın', 'scared=fearful face|korkmuş', 'surprised=astonished face|şaşırmış', 'tired=sleepy face|yorgun', 'sick=face with thermometer|hasta', 'bored=unamused face|sıkılmış|#sad', 'excited=star-struck|heyecanlı|#happy', 'worried=worried face|endişeli|#sad', 'cool=smiling face with sunglasses|havalı|#happy', 'confused=confused face|kafası karışık|#sad', 'hot=hot face|sıcaklamış', 'cold=cold face|üşümüş'] },
  { id: 'jobs', tr: 'Meslekler', en: 'Jobs', words: ['doctor=health worker|doktor', 'teacher|öğretmen', 'cook|aşçı', 'farmer|çiftçi', 'police officer|polis', 'firefighter|itfaiyeci', 'pilot|pilot', 'artist|ressam', 'singer|şarkıcı', 'astronaut|astronot', 'scientist|bilim insanı', 'mechanic|tamirci', 'student|öğrenci', 'office worker|ofis çalışanı', 'judge|hâkim', 'builder=construction worker|inşaat işçisi', 'detective|dedektif', 'guard|muhafız', 'factory worker|fabrika işçisi', 'programmer=technologist|yazılımcı'] },
  { id: 'places', tr: 'Şehir ve Yerler', en: 'Places in Town', words: ['house|ev', 'school|okul', 'hospital|hastane|#hospital', 'hotel|otel|#hospital', 'bank|banka|#bank', 'shop=convenience store|dükkân', 'stadium|stadyum', 'castle|kale', 'tent|çadır|#tent', 'factory|fabrika', 'office=office building|ofis binası', 'park=national park|park', 'bridge=bridge at night|köprü', 'fountain|çeşme', 'tower=tokyo tower|kule', 'museum=classical building|müze|#bank', 'beach=beach with umbrella|plaj', 'city=cityscape|şehir', 'road=motorway|yol', 'railway=railway track|tren yolu', 'funfair=ferris wheel|lunapark', 'circus=circus tent|sirk|#tent'] },
  { id: 'colours-shapes', tr: 'Renkler ve Şekiller', en: 'Colours & Shapes', words: ['red=red circle|kırmızı', 'orange=orange circle|turuncu', 'yellow=yellow circle|sarı', 'green=green circle|yeşil', 'blue=blue circle|mavi', 'purple=purple circle|mor', 'brown=brown circle|kahverengi', 'black=black circle|siyah', 'white=white circle|beyaz', 'pink=pink heart|pembe', 'square=blue square|kare', 'triangle=red triangle pointed up|üçgen', 'star|yıldız', 'heart=red heart|kalp', 'diamond=large orange diamond|baklava dilimi'] },
  { id: 'toys-party', tr: 'Oyuncak ve Parti', en: 'Toys & Party', words: ['teddy bear|oyuncak ayı', 'ball=soccer ball|top', 'doll=nesting dolls|oyuncak bebek', 'kite|uçurtma', 'balloon|balon', 'present=wrapped gift|hediye', 'birthday cake|doğum günü pastası', 'party popper|konfeti patlatıcı', 'puzzle=puzzle piece|yapboz', 'yo-yo|yoyo', 'robot|robot', 'drum|davul', 'magic wand|sihirli değnek', 'fireworks|havai fişek', 'candle|mum', 'crown|taç', 'playing card=joker|oyun kartı'] },
];


// Sentence helpers: the answer is always echoed as a full English sentence.
const NO_ARTICLE = new Set(['bread', 'cheese', 'milk', 'butter', 'honey', 'soup', 'rice', 'spaghetti', 'chocolate', 'popcorn', 'soap', 'hair', 'water', 'tea', 'coffee', 'juice', 'salt', 'meat', 'garlic', 'broccoli', 'lettuce', 'corn', 'rain', 'snow', 'wind', 'fire', 'lightning', 'fog', 'music', 'football', 'basketball', 'tennis', 'volleyball', 'baseball', 'swimming', 'running', 'cycling', 'skiing', 'skateboarding', 'dancing', 'reading', 'painting', 'chess', 'fishing', 'camping', 'bowling', 'table tennis', 'surfing', 'climbing', 'yoga']);
// Only words whose picture really shows several things (or a pair).
const PLURAL = new Set(['grapes', 'cherries', 'jeans', 'gloves', 'socks', 'sunglasses', 'glasses', 'shorts', 'scissors', 'headphones', 'maracas', 'lungs', 'peanuts', 'pancakes', 'noodles', 'chips', 'books', 'paints', 'fireworks']);
// One of a kind: "It's the sun.", never "It's a sun."
const THE = new Set(['sun', 'moon', 'sea', 'underground']);
// People outside the jobs topic: "Who is it?" / "This is a teacher."
const PEOPLE = new Set(['teacher', 'student']);
const COLOURS = new Set(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'brown', 'black', 'white', 'pink']);
const an = (w) => (/^(a|e|i|o|u(?!ni|se|ku))/i.test(w) ? 'an' : 'a');
function phrases(word, topic) {
  if (topic === 'feelings') {
    // "You're hot!" reads as 'attractive' to teenagers: temperature takes "feel".
    if (word === 'hot' || word === 'cold') return { q: 'How do I feel?', find: `Who feels ${word}?`, say: `You feel ${word}!` };
    return { q: 'How do I feel?', find: `Who is ${word}?`, say: `You're ${word}!` };
  }
  if (topic === 'colours-shapes' && COLOURS.has(word)) return { q: 'What colour is it?', find: `Find ${word}!`, say: `It's ${word}.` };
  if (topic === 'colours-shapes') return { q: 'What shape is it?', find: `Find the ${word}!`, say: `It's ${an(word)} ${word}.` };
  if (topic === 'jobs' || PEOPLE.has(word)) {
    const q = topic === 'jobs' && word !== 'student' ? "What's the job?" : 'Who is it?';
    return { q, find: `Where's the ${word}?`, say: `This is ${an(word)} ${word}.` };
  }
  if (PLURAL.has(word)) return { q: 'What are they?', find: `Where are the ${word}?`, say: `They're ${word}.` };
  if (NO_ARTICLE.has(word)) return { q: topic === 'sports-hobbies' ? "What's the activity?" : 'What is it?', find: `Find ${word}!`, say: `It's ${word}.` };
  if (THE.has(word)) return { q: 'What is it?', find: `Where's the ${word}?`, say: `It's the ${word}.` };
  const q = topic === 'places' ? 'What place is it?' : 'What is it?';
  return { q, find: `Where's the ${word}?`, say: `It's ${an(word)} ${word}.` };
}


// School-safety filter: pictures never used even if a word maps to them.
const BLOCK = /\b(beer|wine|cocktail|sake|champagne|tumbler glass|bottle with popping cork|clinking|cigarette|pistol|water pistol|gun|kitchen knife|hocho|dagger|crossed swords|bomb|coffin|skull|headstone|zombie|vampire|ogre|goblin|middle finger|pile of poo|syringe|pill|drop of blood|kiss|couple|flag|church|mosque|synagogue|kaaba|shinto shrine|menorah|star of david|om|latin cross|orthodox cross|dove|slot machine|money-mouth face|oncoming fist)\b/;

function slug(s) { return String(s).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function loadAssets() {
  const byName = new Map();
  for (const dir of fs.readdirSync(path.join(src, 'assets'))) {
    const base = path.join(src, 'assets', dir);
    const metaPath = path.join(base, 'metadata.json');
    if (!fs.existsSync(metaPath)) continue;
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    let flatDir = path.join(base, 'Flat');
    if (!fs.existsSync(flatDir)) flatDir = path.join(base, 'Default', 'Flat');
    if (!fs.existsSync(flatDir)) continue;
    const file = fs.readdirSync(flatDir).find((f) => f.endsWith('.svg'));
    if (!file) continue;
    byName.set(String(meta.cldr).toLowerCase(), { cldr: meta.cldr, group: meta.group, keywords: meta.keywords || [], file: path.join(flatDir, file) });
  }
  return byName;
}

function levelOf(word) {
  const w = word.toLowerCase();
  for (const lv of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']) if ((WORD_DATA.sets[lv] || []).includes(w)) return lv.toUpperCase();
  return null;
}

const assets = loadAssets();
fs.mkdirSync(outDir, { recursive: true });
const pictures = {};
const topics = [];
const missing = [];
// One picture standing for two different words is a mistake unless listed
// here (the same thing seen as an object and as an activity or feeling).
const SHARED_PICTURES = new Set(['soccer-ball', 'skateboard', 'artist-palette', 'grinning-face']);
const wordsByPic = new Map();
for (const t of TOPICS) {
  const words = [];
  const seen = new Set();
  for (const entry of t.words) {
    const [left, tr = '', ...tags] = entry.split('|');
    const cg = (tags.find((x) => x.startsWith('#')) || '').slice(1);
    const [word, pic] = left.split('=');
    const name = (pic || word).toLowerCase();
    const asset = assets.get(name);
    if (!asset || BLOCK.test(name)) { missing.push(`${t.id}:${entry}`); continue; }
    if (seen.has(word.toLowerCase()) || seen.has('pic:' + name)) continue;
    seen.add(word.toLowerCase()); seen.add('pic:' + name);
    const key = slug(asset.cldr);
    if (!pictures[key]) {
      const svg = fs.readFileSync(asset.file, 'utf8').replace(/<\?xml[^>]*>\s*/g, '').replace(/\s{2,}/g, ' ').trim();
      fs.writeFileSync(path.join(outDir, `${key}.svg`), svg);
      pictures[key] = { name: asset.cldr, group: asset.group };
    }
    if (!wordsByPic.has(key)) wordsByPic.set(key, new Set());
    wordsByPic.get(key).add(word);
    // Colours and shapes share pictures (a red heart is red and a heart), so
    // a question only offers words of its own kind.
    const cat = t.id === 'colours-shapes' ? (COLOURS.has(word) ? 'colour' : 'shape') : '';
    words.push({ word, pic: key, tr, level: levelOf(word) || 'A1', ...(cg && { cg }), ...(cat && { cat }), ...phrases(word, t.id) });
  }
  topics.push({ id: t.id, tr: t.tr, en: t.en, words });
}

// Board-game decoration (Kelime Şehri squares). Not word content, so it
// lives in its own folder and never enters the topic lists.
const BOARD_ICONS = ['hot beverage', 'croissant', 'books', 'clapper board', 'deciduous tree', 'shopping cart', 'classical building', 'station', 'fountain', 'musical notes', 'stadium', 'hotel',
  'palm tree', 'spiral shell', 'coconut', 'parrot', 'turtle', 'crab', 'pineapple', 'mango', 'dolphin', 'rainbow', 'glowing star', 'volcano',
  'chequered flag', 'red question mark', 'wrapped gift', 'wrench', 'wheel', 'microphone', 'raising hands', 'anchor', 'magic wand', 'nest with eggs', 'wind face', 'playground slide',
  'rocket', 'satellite', 'package', 'rock', 'cyclone', 'satellite antenna', 'flying saucer', 'game die', 'coin', 'trophy', 'party popper', 'sparkles'];
const boardDir = path.join(outDir, 'board');
fs.mkdirSync(boardDir, { recursive: true });
for (const name of BOARD_ICONS) {
  const asset = assets.get(name);
  if (!asset) { missing.push(`board:${name}`); continue; }
  const svg = fs.readFileSync(asset.file, 'utf8').replace(/<\?xml[^>]*>\s*/g, '').replace(/\s{2,}/g, ' ').trim();
  fs.writeFileSync(path.join(boardDir, `${slug(asset.cldr)}.svg`), svg);
}

// Pictures of words that were dropped from TOPICS must not linger in public/.
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith('.svg') && !pictures[f.slice(0, -4)]) fs.unlinkSync(path.join(outDir, f));
}
fs.copyFileSync(path.join(src, 'LICENSE'), path.join(outDir, 'LICENSE-fluentui-emoji.txt'));
fs.writeFileSync(dataOut, JSON.stringify({ source: 'Microsoft Fluent Emoji (flat), MIT licence', topics, pictures }, null, 1));
const count = Object.keys(pictures).length;
const bytes = fs.readdirSync(outDir).filter((f) => f.endsWith('.svg')).reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`${topics.length} topics, ${topics.reduce((n, t) => n + t.words.length, 0)} words, ${count} pictures, ${(bytes / 1024).toFixed(0)} KB`);
for (const [key, set] of wordsByPic) {
  if (set.size > 1 && !SHARED_PICTURES.has(key)) console.warn(`warning: picture "${key}" stands for different words: ${[...set].join(', ')}`);
}
if (missing.length) console.log(`not mapped (${missing.length}): ${missing.join(', ')}`);
