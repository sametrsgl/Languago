// The classroom game suite, as shown on the hub and the homepage.
// status: 'live' = playable now, 'soon' = planned in a later build wave.

export const GAMES = [
  { slug: 'kutu-avi', name: 'Kutu Avı', like: 'Baamboozle gibi', pitch: 'Takımlar kutu seçer, sürpriz kartlar çıkar. Her soruda bütün sınıf kartını aynı anda kaldırır.', minutes: '10-30', teams: '2-8', energy: 'orta', icon: 'grid', status: 'live' },
  { slug: 'buyuk-yaris', name: 'Büyük Yarış', like: 'Kahoot yarışı gibi', pitch: 'Her takım her soruya cevap verir, doğru bilenler pistte ilerler. Telefon gerekmez.', minutes: '10-25', teams: '2-8', energy: 'yüksek', icon: 'race', status: 'soon' },
  { slug: 'anlat-ciz-canlandir', name: 'Anlat, Çiz, Canlandır', like: 'Tabu ve Pictionary', pitch: 'Gizli kelimeyi yasaklı kelimeleri kullanmadan anlat, çiz ya da canlandır.', minutes: '15-40', teams: '2-4', energy: 'yüksek', icon: 'talk', status: 'soon' },
  { slug: 'kelime-tombala', name: 'Kelime Tombala', like: 'Yılbaşı tombalası', pitch: 'Dinle, kartında işaretle, ilk sırayı tamamlayınca "Çinko!" de. Kalabalık sınıflar için.', minutes: '8-20', teams: 'tüm sınıf', energy: 'sakin', icon: 'bingo', status: 'soon' },
  { slug: 'kelime-kurtar', name: 'Kelime Kurtar', like: 'Adam asmaca, darağacı yok', pitch: 'Harf iste, balonları kurtar. İpucu merdiveni ve her kelimeye bir kelime kartı.', minutes: '5-25', teams: '2-6', energy: 'orta', icon: 'balloon', status: 'soon' },
  { slug: 'isim-sehir', name: 'İsim-Şehir STOP!', like: 'İsim-Şehir-Hayvan', pitch: 'Harf çekilir, takımlar kategorileri doldurur, "Sheets up!" ile cevaplar okunur.', minutes: '15-25', teams: '2-8', energy: 'orta', icon: 'letters', status: 'soon' },
  { slug: 'kelime-sehri', name: 'Kelime Şehri', like: 'Monopoly tarzı', pitch: 'Konu sokaklarını cevaplayarak satın al, kirayı konuşarak öde. Çocuklara merdiven yarışı.', minutes: '20-40', teams: '2-6', energy: 'orta', icon: 'city', status: 'soon' },
  { slug: 'konusma-carki', name: 'Konuşma Çarkı', like: 'Just a Minute ve Would You Rather', pitch: 'Çarkı çevir, konuşma görevini al, bir dakika boyunca konuş.', minutes: '3-20', teams: 'tüm sınıf', energy: 'orta', icon: 'wheel', status: 'soon' },
  { slug: 'milyoner-merdiveni', name: 'Milyoner Merdiveni', like: 'Kim Milyoner Olmak İster', pitch: 'Takımlar merdiveni tırmanır: güvenli basamaklar, telefonsuz jokerler, "Final answer?"', minutes: '15-30', teams: '2-6', energy: 'orta', icon: 'ladder', status: 'live' },
  { slug: 'kategori-kapismasi', name: 'Kategori Kapışması', like: 'Jeopardy', pitch: 'Kategori ve puan tablosu. Doğru kartı kaldıran diğer takımlar yarım puan alır.', minutes: '15-45', teams: '2-6', energy: 'orta', icon: 'table', status: 'live' },
  { slug: 'sicak-patates', name: 'Sıcak Patates', like: 'Hot potato', pitch: 'Kategoriden bir kelime söyle ve patatesi geçir, gizli süre dolmadan.', minutes: '5-15', teams: 'tüm sınıf', energy: 'yüksek', icon: 'flame', status: 'soon' },
  { slug: 'kommo-diyor-ki', name: 'Kommo Diyor ki', like: 'Simon Says', pitch: 'Bütün sınıf hareketle cevap verir. Yetişkinler için fikir çizgisi.', minutes: '3-15', teams: 'tüm sınıf', energy: 'hareketli', icon: 'hand', status: 'soon' },
  { slug: 'hafiza-kartlari', name: 'Hafıza Kartları', like: 'Memory', pitch: 'Eşleri bul: resim ve kelime, fiil halleri, deyim ve anlamı.', minutes: '8-25', teams: '2-6', energy: 'sakin', icon: 'cards', status: 'soon' },
  { slug: 'buyuk-macera', name: 'Büyük Macera', like: 'Sınıf RPG’si', pitch: 'Bütün sınıf tek ekip: sisli haritada ilerle, dil görevleriyle zar at, oylayarak yolu seç.', minutes: '15-45', teams: 'tüm sınıf', energy: 'orta', icon: 'map', status: 'soon' },
];

export const GAME_ICONS = {
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  race: '<path d="M4 21V4M4 4h13l-2.5 4.5L17 13H4"/>',
  talk: '<path d="M4 5h16v11H9l-5 4z"/>',
  bingo: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.6"/><circle cx="16" cy="8" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="8" cy="16" r="1.6"/><circle cx="16" cy="16" r="1.6"/>',
  balloon: '<ellipse cx="12" cy="9" rx="6" ry="7"/><path d="M12 16v6"/>',
  letters: '<path d="M4 19 8.5 5l4.5 14M5.8 14.5h5.4M15 5h3.5a3 3 0 0 1 0 6H15zm0 6h4a3 3 0 0 1 0 6h-4z"/>',
  city: '<path d="M3 21V9l5-3v15M8 21V4l7 3v14M15 21v-9l6 2v7M2 21h20"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4"/>',
  ladder: '<path d="M7 2v20M17 2v20M7 6h10M7 11h10M7 16h10"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16M15 4v16"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-6.8 0-3.4-2.1-5.5-3.6-7.2-.3 1.8-1.1 3-2.3 3.6.3-3.4-1.3-6.6-4.6-9.6.4 3.9-1.4 6.1-3 8.1C4.3 11.6 5 13.6 5 15.2 5 19.2 8 22 12 22z"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5V3.5a1.5 1.5 0 0 1 3 0V11m0-6a1.5 1.5 0 0 1 3 0V13m0-5.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3.3 16a1.6 1.6 0 0 1 2.5-2L8 16"/>',
  cards: '<rect x="3" y="6" width="11" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
};
