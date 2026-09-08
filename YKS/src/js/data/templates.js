/* Hazır metin kalıpları: not şablonları, koç tonu, kötü gün protokolü. */

window.R = window.R || {};

/* Not alırken boş kutuya bakıp donmayı önleyen kalıplar. */
R.NOTE_TEMPLATES = {
  kural:  ['… olduğunda … yapılır, çünkü …', '… ile … arasındaki fark: …', '… koşulu sağlanmazsa … olmaz'],
  ornek:  ['Örnek: … → çözüm adımı: …', 'Tipik soru: … Burada ilk hamle …'],
  tuzak:  ['Dikkat: … sanılır ama aslında …', 'Sık hata: … Doğrusu: …', '… birimini çevirmeden işleme girme'],
  soru:   ['Anlamadım: … Tekrar bakılacak.', 'Şunu neden … yapıyoruz?'],
  not:    ['…'],
};

/* Not kalitesi — geri çağırma üretmeyen not, kart olarak da işe yaramaz. */
R.NOTE_QUALITY = {
  minLen: 12,
  maxLen: 240,
  vagueWords: ['dikkatsizlik', 'dikkat', 'unuttum', 'bilmiyorum', 'önemli', 'bak', 'tekrar et'],
  rules: [
    { id:'short',  test:t => t.trim().length < 12,
      why:'Çok kısa. Bir haftaya bu notu okuyunca ne demek istediğini hatırlamazsın.' },
    { id:'long',   test:t => t.trim().length > 240,
      why:'Çok uzun. Tek not tek şey söylemeli; ikiye böl.' },
    { id:'vague',  test:t => R.NOTE_QUALITY.vagueWords.some(w =>
        new RegExp('^\s*'+w, 'i').test(t.trim())),
      why:'Belirsiz başlangıç. “Dikkatsizlik” bir açıklama değil; ne olduğunu yaz.' },
    { id:'noverb', test:t => t.trim().split(/\s+/).length < 3,
      why:'Cümle değil. Geri çağırmayı tetikleyecek kadar bilgi yok.' },
  ],
};

/* Koç tonu — aynı veri herkese aynı dille söylenmez. */
R.COACH_TONES = {
  sert: { id:'sert', name:'Sert', note:'Doğrudan, mazeret almaz',
    line:'Doğrudan konuş. Yumuşatma, mazereti kabul etme, sayıyı yüzüne söyle. Hakaret etme, küçümseme.' },
  dengeli: { id:'dengeli', name:'Dengeli', note:'Varsayılan — gözlem odaklı',
    line:'Gözlem yap, yargılama. Ne olduğunu söyle, ne yapılacağını söyle.' },
  destekleyici: { id:'destekleyici', name:'Destekleyici', note:'Önce ne işlediğini söyler',
    line:'Önce işleyen davranışı adlandır, sonra tek eksiği söyle. Yine de abartılı övgü yapma.' },
};

/* Kötü gün: sistem çökmesin diye tek düğmelik iniş. */
R.BAD_DAY = {
  label:'Bugün olmuyor',
  note:'Hedefi minimum güne indirir, seriyi kırmaz. Atlanan bloklar “kötü gün” nedeniyle işaretlenir.',
  reason:'Kötü gün',
  keepStreak:true,
};

/* Sınav haftası modu: son N hafta arayüz sadeleşir. */
R.EXAM_WEEK_MODE = {
  weeksBefore: 2,
  hiddenRoutes: ['learn', 'plan'],
  note:'Son iki haftada yeni konu açılmaz; ekranlar tekrar ve provaya odaklanır.',
};

/* Ödül eşikleri — nete değil davranışa bağlı. */
R.REWARD_TIERS = [
  { days:3,  name:'Üç gün',      note:'Seri kuruldu; en zor kısım geçti.' },
  { days:7,  name:'Bir hafta',   note:'Düzen alışkanlığa dönüşmeye başladı.' },
  { days:14, name:'İki hafta',   note:'Artık motivasyon değil sistem çalışıyor.' },
  { days:30, name:'Bir ay',      note:'Bu tempo sınava kadar taşınabilir.' },
  { days:60, name:'İki ay',      note:'Program artık kimliğinin parçası.' },
];
