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

ESP.SECTIONS_ALL = [
    /* SEKİZ ÇEKMECE (ekip/CEKMECE-HARITASI.md, kullanıcı kararı 2026-09-24).
       Üç modülde aynı ad ve sıra; adlar tek kaynaktan gelir
       (`LIFEOS.KABUK.CEKMECELER`, core/nav.js çizim anında okur). Yedi
       eski bölümden nereye: Günlük › Bugün → Bugün; Günlük › Merdiven →
       Plan; Dil, Felsefe, Tarih, Ses, Okuma, Yazı → Çalışma'nın bölümleri
       (karar 4); Ofis › Analiz → Analiz; Rütbe → Ayarlar › Rütbe; Rehber →
       Ayarlar › Genel. Onaylar ve Kütüphanem ekranları gelene kadar boş
       çekmece çizilmez. `disc` artık BÖLÜMDEDİR: disiplin kapanınca yalnız
       onun bölümü düşer, Çalışma kalır. */
    { id:'bugun', icon:'pulse', label:'Bugün', note:'Günün pratiğini gir, karşılığını gör',
      views:[{ route:'today', label:'Bugün', icon:'pulse' }] },

    { id:'plan', icon:'chart', label:'Plan', note:'Merdiven: her disiplinde bir sonraki basamak',
      views:[{ route:'ladder', label:'Merdiven', icon:'chart' }] },

    { id:'calisma', icon:'cards', label:'Çalışma', note:'Altı disiplinin tezgâhı',
      views:[
        { route:'lang',      label:'Dil',     icon:'cards',    disc:'lang' },
        { route:'symposium', label:'Felsefe', icon:'socratic', disc:'philo' },
        { route:'history',   label:'Tarih',   icon:'book',     disc:'history' },
        { route:'studio',    label:'Ses',     icon:'wave',     disc:['music', 'diction'] },
        { route:'library',   label:'Okuma',   icon:'book',     disc:'reading' },
        { route:'writing',   label:'Yazı',    icon:'quill',    disc:'writing' },
      ] },

    { id:'analiz', icon:'chart', label:'Analiz', note:'Kararın dayanağı',
      views:[{ route:'analytics', label:'Analiz', icon:'chart' }] },

    { id:'onaylar', icon:'check', label:'Onaylar', note:'Bekleyen öneriler', views:[] },

    { id:'ofis', icon:'users', label:'Ofis', note:'Patron, yedi uzman ve bir koç',
      views:[
        { route:'office',  label:'Masalar',  icon:'users' },
        { route:'team',    label:'Danışma',  icon:'zap' },
        { route:'meeting', label:'Toplantı', icon:'list' },
      ] },

    { id:'kutuphane', icon:'book', label:'Kütüphanem', note:'BAM\'ın ürettikleri', views:[] },

    /* Rütbe burada bir bölümdür (karar §8-2); `disc` taşımaz, kapatılan
       bir disiplinle birlikte kaybolmaz. */
    { id:'ayarlar', icon:'sliders', label:'Ayarlar', note:'Profil, görünüm, veri ve rehber',
      views:[
        { route:'profile', label:'Profil', icon:'sliders' },
        { route:'guide',   label:'Genel',  icon:'guide' },
        { route:'rutbe',   label:'Rütbe',  icon:'layers' },
      ] },
  ];
