/* Gezinme kataloğu — hangi bölüm, hangi sayfalar.

   Bu bir VERİDİR ve kabuktan (app.js) ayrı durur. Sebebi mimari değil
   pratik: bölüm listesini test edebilmek için bütün uygulamayı açmak
   gerekmemeli. `core/nav.js` bu listeyi kullanıcının açık bölümlerine göre
   süzer ve numaralandırır.

   `disc` alanı bir SAYFAYI (Çalışma'nın bölümünü) bir disipline bağlar;
   disiplin kapalıysa o sayfa hiç çizilmez, sayfası kalmayan çekmece de.
   `disc` taşımayan sayfalar (Bugün, Ofis, Ayarlar…) hiçbir zaman kapanmaz
   — onlar bir alan değil sistemin kendisidir.

   Numara burada YOKTUR: numara çizim anında verilir çünkü bir kimlik değil
   bir sıradır (bkz. core/nav.js). */

window.ESP = window.ESP || {};

/* SEKİZ ÇEKMECE (belgeler/ekip/CEKMECE-HARITASI.md, kullanıcı kararı 2026-09-24).
       Üç modülde aynı ad ve sıra; adlar tek kaynaktan gelir
       (`LIFEOS.KABUK.CEKMECELER`, core/nav.js çizim anında okur). Yedi
       eski bölümden nereye: Günlük › Bugün → Bugün; Günlük › Merdiven →
       Plan; Dil, Felsefe, Tarih, Ses, Okuma, Yazı → Çalışma'nın bölümleri
       (karar 4); Ofis › Analiz → Analiz; Rütbe → Ayarlar › Rütbe; Rehber →
       Ayarlar › Genel. Onaylar ve Kütüphanem ekranları gelene kadar boş
       çekmece çizilmez. `disc` artık BÖLÜMDEDİR: disiplin kapanınca yalnız
       onun bölümü düşer, Çalışma kalır. */
  /* Cekmece sirasi burada; icerik ekran dosyalarindaki P.sayfa satirlarindan gelir
     (brand/ortak/parca.js). Ekranlar bu dosyadan sonra yuklenir: liste okununca kurulur. */
  const CEKMECE = [
    { id:'bugun', icon:'pulse', label:'Bugün', note:'Günün pratiğini gir, karşılığını gör' },
    { id:'plan', icon:'chart', label:'Plan', note:'Merdiven: her disiplinde bir sonraki basamak' },
    { id:'calisma', icon:'cards', label:'Çalışma', note:'Altı disiplinin tezgâhı' },
    { id:'analiz', icon:'chart', label:'Analiz', note:'Kararın dayanağı' },
    { id:'onaylar', icon:'check', label:'Onaylar', note:'Bekleyen öneriler' },
    { id:'ofis', icon:'users', label:'Ofis', note:'Patron, yedi uzman ve bir koç' },
    { id:'kutuphane', icon:'book', label:'Kütüphanem', note:"BAM'ın ürettikleri" },
    { id:'ayarlar', icon:'sliders', label:'Ayarlar', note:'Profil, görünüm, veri ve rehber' },
  ];
  Object.defineProperty(ESP, 'SECTIONS_ALL', { configurable:true, get(){ return window.LIFEOS.PARCA.menu('esp', CEKMECE, { alan:'views', kimlik:'route' }); } });
