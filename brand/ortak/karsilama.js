/* KARŞILAMA — modüle girerken italik selam ve o anki not; Bugün kapağı.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/karsilama.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır. Biçimi `karsilama.css`.
   ==================================================================

   Kullanıcı (2026-10-18): «modüle geçerken logo yerine italik bir yazıyla
   hoş geldin, merhaba, bugün zinde misin…; dili ayarlardan seçerim; altına
   küçük yazıyla o bölümün o anki notu; özelleştirilebilir selam ve
   mesajlar». Ve: «Bugün kısmı bambaşka, ana sayfa gibi olsun».

   Sözler:
     1. SELAM bir havuzdan seçilir: seçilen dil, günün saati (sabah, gün,
        akşam, gece), haftanın günü ve modülün kendi selamları; açılış sözü
        ile modülün sorusu birleşerek yüzlerce selam olur. Son görülen 40
        selam bir daha gelmez.
        «İyi misin?» gibi zorlama sorular havuzda yok (kullanıcı: «çok
        kasıtlı olur»). «Kendi selamlarım» seçiliyse yalnız onlar.
     2. NOT KURALDAN YA DA KULLANICIDAN. Sistem notu modülün kendi kural
        cümlesidir (Bugün'ün `sesli()` cümlesi, Siri'ye giden aynı cümle);
        modül onu her çizimde önbelleğe yazar. Dünden kalan cümle
        gösterilmez. Model burada hiçbir cümle yazmaz (AGENTS §1.1).
     3. AYAR TAŞINIR. `lifeos.karsilama` (localStorage) modüller arası
        geçişte taşınır (animasyon.js TASINAN); not önbelleği modülündür.
     4. KAPAK sayfanın başında, levhanın üstünde: italik selam, kural
        cümlesi (h1), en çok dört sayı (kesinliğiyle; ölçülmemiş «—»), tek
        eylem. Tarih yazmaz (kullanıcı, 2026-10-02: «böyle tarih yazmasın»). */

window.LIFEOS = window.LIFEOS || {};

LIFEOS.KARSILAMA = (function(){
  'use strict';
  const AYAR = 'lifeos.karsilama';
  const NOT = 'lifeos.karsilama.not';
  const SON = 'lifeos.karsilama.son';
  const EN_COK = 12, EN_UZUN = 60;
  const DILLER = Object.freeze([
    { id:'tr', ad:'Türkçe' }, { id:'en', ad:'English' }, { id:'de', ad:'Deutsch' },
    { id:'fr', ad:'Français' }, { id:'es', ad:'Español' },
  ]);
  const MODULLER = ['ays', 'spi', 'esp'];

  /* Havuz: dil → { genel, sabah, gun, aksam, gece, pzt, cuma, hs, ays, spi, esp, hkm,
     on:{ genel, sabah, … }, ek:{ ays, … } }. Tek selamların yanında BİRLEŞİK
     selam da var: açılış sözü («Günaydın») + modülün küçük harfli sorusu
     («bugün hangi konu?»). Kullanıcı (2026-10-18): «türlü türlü olsun,
     aynısını bir daha görmek zor bir ihtimal olsun». Son görülen 40 selam
     bir daha seçilmez (acilis). `hkm` Merkez'indir: Merkez tek dosyadır,
     bu listeyi kopyalar; HKM/tests/test_yuz.py ikisinin aynı olduğunu sınar. */
  const HAVUZ = {
    tr:{
      genel:['Hoş geldin', 'Merhaba', 'Merhabalar', 'Tekrar hoş geldin', 'Seni görmek güzel', 'Bugün zinde misin?',
        'Hazırsan başlayalım', 'Selam', 'Yeniden merhaba', 'Kaldığın yerden devam', 'Hadi bakalım', 'Bir adım daha',
        'Sakin ve odaklı', 'Yavaş ama düzenli', 'Az ama her gün', 'Küçük bir adım yeter', 'Nefes al, başlayalım',
        'Ne güzel, geldin', 'Bugüne birlikte bakalım', 'Gün senin', 'Bir bakalım neler var', 'Kısa bir tur atalım',
        'Odak zamanı', 'Her gün biraz', 'Kapı açık, buyur', 'Yine buradasın, ne güzel', 'Düzen kuruluyor',
        'Bugün de buradayız', 'Sade bir gün olsun', 'Adım adım'],
      sabah:['Günaydın', 'Güzel bir sabah', 'Günaydın, bugün zinde misin?', 'Sabahın hayırlı olsun', 'Erken kalkmışsın',
        'Kahven hazır mı?', 'Taze bir gün', 'Günaydın, yeni bir sayfa', 'Güne yumuşak bir başlangıç', 'Aydınlık bir sabah',
        'Sabahın sakin saati'],
      gun:['İyi günler', 'Günün nasıl geçiyor?', 'Günün ortasındayız', 'Tünaydın', 'Kısa bir mola mı?', 'Günün yarısı geride',
        'Öğlen molası mı?', 'Günün geri kalanına bakalım', 'İyi bir öğleden sonra'],
      aksam:['İyi akşamlar', 'Akşamın hayırlı olsun', 'Günü toparlama vakti', 'Akşam sakinliği', 'Günün sonuna yaklaşıyoruz',
        'Akşama merhaba', 'Günü kapatmadan önce', 'Hoş bir akşam', 'Akşam serinliğinde'],
      gece:['Geç saatlere kaldın', 'Sakin bir gece', 'İyi geceler', 'Gece kuşu', 'Gece sessizliği', 'Uyku vakti yaklaşıyor',
        'Bu saatte de buradasın', 'Kısa tutalım, gece oldu'],
      pzt:['Yeni hafta, yeni sayfa', 'Pazartesiye merhaba', 'Haftanın ilk günü', 'Haftaya yumuşak bir giriş'],
      cuma:['Cuma geldi', 'Haftanın son düzlüğü', 'Hafta sonu kapıda', 'Hayırlı cumalar'],
      hs:['İyi hafta sonları', 'Hafta sonu ritmi', 'Hafta sonuna merhaba', 'Hafta sonu sakinliği'],
      ays:['Bugün hangi konu?', 'Çalışmaya hazır mısın?', 'Masaya hoş geldin', 'Kalem kâğıt hazır mı?', 'Bugün neyi bitiriyoruz?',
        'Bir konu daha kapanabilir', 'Soru çözme vakti', 'Defterini aç', 'Çalışma masasına merhaba', 'Sınav yolunda bir gün daha',
        'Bugünün bloğu hazır mı?', 'Formüller yerinde mi?', 'Paragraf mı, problem mi?', 'Bir deneme, bir analiz',
        'Konular sırada', 'Yavaş yavaş, konu konu', 'Sessizce çalışalım', 'Tekrar kartları bekliyor olabilir',
        'Bugün kaç soru?', 'Odak masası hazır'],
      spi:['Bugün ne yapmayı planlıyorsun?', 'Bugün kendine nasıl bakacaksın?', 'Bedenine merhaba', 'Su içtin mi?',
        'Biraz hareket iyi gelir', 'Uykun nasıldı?', 'Nefesine bir bak', 'Esneme vakti mi?', 'Bir bardak suyla başla',
        'Yürüyüş havası mı?', 'Bugün ne yiyeceksin?', 'Kendine iyi bak', 'Dinlenmek de plana dahil', 'Bugünün ritmi ne?',
        'Bedeninin sesini dinle', 'Bugün antrenman var mı?', 'Hafif bir gün mü, yoğun bir gün mü?', 'Hareket zamanı',
        'Öğünlerine bir bakalım', 'Omuzlarını gevşet'],
      esp:['Bugün ne düşünüyorsun?', 'Bugün neyi merak ediyorsun?', 'Yeni bir şey öğrenelim mi?', 'Merakın nerede bugün?',
        'Bir sayfa, bir fikir', 'Bugün hangi alan?', 'Gitar mı, kitap mı?', 'Biraz yazı, biraz okuma', 'Kelimeler seni bekliyor',
        'Bugün neyi derinleştiriyoruz?', 'Küçük bir alıştırma?', 'Zihnine merhaba', 'Okuma köşesine hoş geldin',
        'Fikirler için bir yer', 'Bugün neyi keşfedeceksin?', 'Bir alışkanlık daha', 'Yavaş öğren, derin öğren',
        'Not defterin hazır', 'Bugün kimi okuyorsun?', 'Bir soru, bir cevap'],
      hkm:['Merkeze hoş geldin', 'Merkez hazır', 'Üç modül, tek bakış', 'Her şey tek yerde', 'Genel tabloya bakalım',
        'Kumanda masasına hoş geldin', 'Bugünün özeti burada', 'Hepsine birden bakalım', 'Merkeze merhaba',
        'Büyük resme bakalım', 'Bütün iplikler burada', 'Sakin bir kontrol turu', 'Bir göz atalım', 'Düzenin kalbi',
        'Hepsi yerinde mi?', 'Bugün neyi yönetiyoruz?', 'Haftanın tablosu burada', 'Kuşbakışı bir gün'],
      on:{ genel:['Merhaba', 'Selam', 'Hoş geldin', 'Tekrar hoş geldin'], sabah:['Günaydın'], gun:['İyi günler', 'Tünaydın'],
        aksam:['İyi akşamlar'], gece:['İyi geceler'] },
      ek:{
        ays:['bugün hangi konu?', 'çalışmaya hazır mısın?', 'bugün neyi bitiriyoruz?', 'soru çözme vakti', 'defterini aç',
          'tekrar zamanı olabilir', 'bugün kaç soru?', 'masa hazır', 'konular sırada', 'bir konu daha kapanabilir'],
        spi:['bugün ne yapmayı planlıyorsun?', 'su içtin mi?', 'uykun nasıldı?', 'biraz hareket iyi gelir', 'bugün ne yiyeceksin?',
          'yürüyüş havası mı?', 'kendine iyi bak', 'bugünün ritmi ne?', 'nefesine bir bak', 'esneme vakti mi?'],
        esp:['bugün ne düşünüyorsun?', 'bugün neyi merak ediyorsun?', 'yeni bir şey öğrenelim mi?', 'bugün hangi alan?',
          'bugün neyi keşfedeceksin?', 'kelimeler seni bekliyor', 'bugün kimi okuyorsun?', 'küçük bir alıştırma?',
          'okuma köşesi hazır', 'merakın nerede bugün?'],
        hkm:['merkez hazır', 'genel tabloya bakalım', 'kuşbakışı bir gün', 'bugünün özeti burada', 'büyük resme bakalım',
          'bir göz atalım', 'hepsi yerinde mi?', 'bugün neyi yönetiyoruz?'],
      } },
    en:{ genel:['Welcome back', 'Hello', 'Hi there', 'Good to see you', 'Ready for today?', 'Let’s begin', 'One step at a time',
        'Little and often', 'Back again, nice', 'Calm and focused', 'Pick up where you left off', 'Here we go'],
      sabah:['Good morning', 'A fresh day', 'Coffee ready?', 'Morning, a new page'], gun:['Good afternoon', 'How’s your day going?', 'Halfway there'],
      aksam:['Good evening', 'Time to wind down', 'A calm evening'], gece:['Working late?', 'A quiet night', 'Night owl'],
      pzt:['New week, new page'], cuma:['Friday at last'], hs:['Happy weekend'],
      ays:['What are we studying today?', 'Ready to study?', 'Which topic today?', 'Time for some questions'],
      spi:['What’s your plan for today?', 'Had some water?', 'How did you sleep?', 'A little movement helps'],
      esp:['What’s on your mind today?', 'What are you curious about?', 'Learn something new?', 'Guitar or book?'],
      hkm:['Welcome to the hub', 'Everything in one place', 'The big picture', 'Three modules, one view'] },
    de:{ genel:['Willkommen zurück', 'Hallo', 'Schön, dich zu sehen', 'Bereit für heute?', 'Los geht’s', 'Schritt für Schritt', 'Ruhig und fokussiert'],
      sabah:['Guten Morgen', 'Ein frischer Tag'], gun:['Guten Tag', 'Wie läuft dein Tag?'], aksam:['Guten Abend', 'Ein ruhiger Abend'],
      gece:['Noch wach?', 'Eine stille Nacht'], pzt:['Neue Woche, neue Seite'], cuma:['Endlich Freitag'], hs:['Schönes Wochenende'],
      ays:['Was lernen wir heute?', 'Welches Thema heute?'], spi:['Was hast du heute vor?', 'Schon Wasser getrunken?'],
      esp:['Was beschäftigt dich heute?', 'Etwas Neues lernen?'], hkm:['Willkommen in der Zentrale', 'Alles an einem Ort'] },
    fr:{ genel:['Bon retour', 'Bonjour', 'Content de te revoir', 'Prêt pour aujourd’hui ?', 'On y va', 'Pas à pas', 'Calme et concentré'],
      sabah:['Bonjour', 'Une nouvelle journée'], gun:['Bon après-midi', 'Comment se passe ta journée ?'], aksam:['Bonsoir', 'Une soirée calme'],
      gece:['Encore debout ?', 'Une nuit tranquille'], pzt:['Nouvelle semaine, nouvelle page'], cuma:['Enfin vendredi'], hs:['Bon week-end'],
      ays:['On étudie quoi aujourd’hui ?', 'Quel sujet aujourd’hui ?'], spi:['Qu’as-tu prévu aujourd’hui ?', 'Tu as bu de l’eau ?'],
      esp:['À quoi penses-tu aujourd’hui ?', 'Apprendre quelque chose ?'], hkm:['Bienvenue au centre', 'Tout au même endroit'] },
    es:{ genel:['Bienvenido de nuevo', 'Hola', 'Qué bueno verte', '¿Listo para hoy?', 'Vamos allá', 'Paso a paso', 'Con calma y foco'],
      sabah:['Buenos días', 'Un día nuevo'], gun:['Buenas tardes', '¿Qué tal tu día?'], aksam:['Buenas tardes', 'Una tarde tranquila'],
      gece:['¿Trasnochando?', 'Una noche tranquila'], pzt:['Nueva semana, nueva página'], cuma:['Por fin viernes'], hs:['Buen fin de semana'],
      ays:['¿Qué estudiamos hoy?', '¿Qué tema hoy?'], spi:['¿Qué planeas hoy?', '¿Ya tomaste agua?'],
      esp:['¿Qué tienes en mente hoy?', '¿Aprender algo nuevo?'], hkm:['Bienvenido al centro', 'Todo en un lugar'] },
  };
  const HATIRA = 40;

  const kac = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function vakit(d){
    const s = (d || new Date()).getHours();
    return s >= 5 && s < 11 ? 'sabah' : s >= 11 && s < 17 ? 'gun' : s >= 17 && s < 22 ? 'aksam' : 'gece';
  }
  function liste(l){
    const temiz = [];
    (Array.isArray(l) ? l : []).forEach(x => {
      const t = String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, EN_UZUN);
      if(t && temiz.indexOf(t) < 0 && temiz.length < EN_COK) temiz.push(t);
    });
    return temiz;
  }

  /* ------------------------------------------------------------ ayar */

  function ayarOku(v){
    v = v && typeof v === 'object' ? v : {};
    const notlar = {};
    MODULLER.forEach(m => { notlar[m] = liste(v.notlar && v.notlar[m]); });
    return {
      dil:DILLER.some(d => d.id === v.dil) ? v.dil : 'tr',
      selam:v.selam === 'kendi' ? 'kendi' : 'karisik',
      kendi:liste(v.kendi),
      not:['sistem', 'kendi', 'ikisi', 'kapali'].indexOf(v.not) >= 0 ? v.not : 'sistem',
      notlar,
    };
  }
  function depo(){ try{ return window.localStorage; }catch(e){ return null; } }
  function oku(anahtar){ try{ const d = depo(); return d ? JSON.parse(d.getItem(anahtar) || 'null') : null; }catch(e){ return null; } }
  function yaz(anahtar, v){ try{ const d = depo(); if(d) d.setItem(anahtar, JSON.stringify(v)); return true; }catch(e){ return false; } }
  function ayar(){ return ayarOku(oku(AYAR)); }
  function ayarYaz(v){ const a = ayarOku(v); yaz(AYAR, a); return a; }

  /* ------------------------------------------------------------ selam */

  function gunTuru(d){
    const g = (d || new Date()).getDay();
    return g === 1 ? 'pzt' : g === 5 ? 'cuma' : g === 0 || g === 6 ? 'hs' : '';
  }
  function havuz(o){
    const H = HAVUZ[o.dil] || HAVUZ.tr, v = vakit(o.simdi), gt = gunTuru(o.simdi);
    const tek = [].concat(H.genel, H[v] || [], gt ? H[gt] || [] : [], H[o.modul] || []);
    const on = H.on ? [].concat(H.on.genel || [], H.on[v] || []) : [];
    const ek = H.ek && H.ek[o.modul] || [];
    const bir = [];
    on.forEach(a => ek.forEach(b => { if(b.indexOf(',') < 0) bir.push(a + ', ' + b); }));
    const hepsi = [];
    tek.concat(bir).forEach(x => { if(hepsi.indexOf(x) < 0) hepsi.push(x); });
    return hepsi;
  }
  /* once: son görülen selam ya da son görülenlerin listesi; hepsi
     görülmüşse yalnız en sonuncusu dışarıda kalır. */
  function sec(l, tohum, once){
    if(!l.length) return '';
    const gorulen = Array.isArray(once) ? once : once ? [once] : [];
    let aday = l.filter(x => gorulen.indexOf(x) < 0);
    if(!aday.length) aday = l.length > 1 ? l.filter(x => x !== gorulen[gorulen.length - 1]) : l;
    const i = Math.abs(Math.floor(Number(tohum) || 0)) % aday.length;
    return aday[i];
  }
  /* o: { ayar, modul, simdi, tohum, once } */
  function selam(o){
    const a = ayarOku(o.ayar);
    const l = a.selam === 'kendi' && a.kendi.length ? a.kendi : havuz({ dil:a.dil, modul:o.modul, simdi:o.simdi });
    return sec(l, o.tohum == null ? Math.random() * 1e9 : o.tohum, o.once);
  }

  /* ------------------------------------------------------------ not */

  /* o: { ayar, modul, onbellek:{ metin, gun }, bugun, tohum } */
  function not(o){
    const a = ayarOku(o.ayar);
    const sistem = o.onbellek && o.onbellek.gun === o.bugun && o.onbellek.metin ? String(o.onbellek.metin) : '';
    const kendi = sec(a.notlar[o.modul] || [], o.tohum == null ? Date.now() / 1009 : o.tohum, '');
    if(a.not === 'kapali') return '';
    if(a.not === 'sistem') return sistem;
    if(a.not === 'kendi') return kendi;
    return sistem || kendi;
  }
  /* Modül çağırır: Bugün'ün kural cümlesi (sesli) önbelleğe. */
  function notYaz(metin, gun){ return yaz(NOT, { metin:String(metin || '').slice(0, 200), gun }); }

  function bugunISO(d){
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* Perde için: selam + not, bir açılışta bir kez (sonraki çağrı aynısını verir). */
  let bu = null;
  function acilis(modul){
    if(bu && bu.modul === modul) return bu;
    const a = ayar(), simdi = new Date();
    const son = oku(SON) || {};
    const once = Array.isArray(son[modul]) ? son[modul].filter(x => typeof x === 'string') : son[modul] ? [String(son[modul])] : [];
    const s = selam({ ayar:a, modul, simdi, once });
    son[modul] = once.concat([s]).slice(-HATIRA);
    yaz(SON, son);
    bu = { modul, selam:s, not:not({ ayar:a, modul, onbellek:oku(NOT), bugun:bugunISO(simdi) }), dil:a.dil };
    return bu;
  }
  /* Perdenin durağan kabına yazar (perde.html); kap yoksa sessiz. */
  function perdeyeYaz(kap, modul){
    if(!kap) return false;
    const k = acilis(modul);
    const s = kap.querySelector('.karsilama__selam'), n = kap.querySelector('.karsilama__not');
    if(s){ s.textContent = k.selam; s.setAttribute('lang', k.dil); }
    if(n){ n.textContent = k.not; n.hidden = !k.not; }
    kap.classList.add('is-hazir');
    return true;
  }

  /* ------------------------------------------------------------ kapak */

  const KESINLIK = { measured:'ölçüldü', computed:'hesaplandı', estimated:'tahmin', veri_yok:'veri yok' };
  /* GÖRSEL PANO (kullanıcı, 2026-10-20: «genel sistem arayüzünü daha
     görselleştirip daha güzel yap»; seçtiği yön: halka göstergeli renkli
     karolar). Her sayı bir karo: simge, ad, değer. Modül HEDEFİ biliyorsa
     (`oran`, ör. su 2000 ml eşiğinin ne kadarı) değerin çevresinde halka
     çizilir; bilmiyorsa halka yok — hedef uydurulmaz. `seri` son günlerin
     kaydıysa altta küçük sütunlar; girilmemiş gün nokta (sıfır değil). */
  const SIMGE = {
    uyku:'<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
    su:'<path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z"/>',
    ogun:'<path d="M7 3v7.5M5 3v5a2 2 0 0 0 4 0V3M7 10.5V21M17.5 3c-2 2-2.5 5-2.5 8h2.5v10"/>',
    hareket:'<path d="M3 12.5h4l2.5-6 4.5 12 2.5-6H21"/>',
    oturum:'<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 13L12 17.5 20.5 13"/>',
    sure:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    hatirlatici:'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    blok:'<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
    kart:'<rect x="4" y="7" width="12.5" height="13" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v11"/>',
    seri:'<path d="M12 3c1 3.6 5 5.6 5 10.2a5 5 0 0 1-10 0c0-2.6 1.5-3.9 2.6-5.1.3 1.6 1 2.6 2 3.1C11.6 8.2 12 5.8 12 3z"/>',
    sinav:'<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
    nokta:'<circle cx="12" cy="12" r="3.5"/>',
  };
  const SIMGE_AD = { 'uyku':'uyku', 'su':'su', 'öğün':'ogun', 'hareket':'hareket', 'oturum':'oturum', 'süre':'sure',
    'hatırlatıcı':'hatirlatici', 'blok':'blok', 'tekrar kartı':'kart', 'tekrar':'kart', 'seri':'seri', 'sınava':'sinav' };
  const simgeOf = x => SIMGE[x.simge] ? x.simge : (SIMGE_AD[String(x.ad || '').toLocaleLowerCase('tr-TR')] || 'nokta');
  const svgS = (ic, cls) => '<svg class="' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + SIMGE[ic] + '</svg>';
  function halka(oran){
    const r = 25, c = 2 * Math.PI * r, o = Math.max(0, Math.min(1, oran));
    return '<svg class="kapak__halka" viewBox="0 0 60 60" aria-hidden="true"><circle class="kapak__halka-iz" cx="30" cy="30" r="' + r + '"/>'
      + (o > 0 ? '<circle class="kapak__halka-dolu" cx="30" cy="30" r="' + r + '" stroke-dasharray="' + (c * o).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 30 30)"/>' : '') + '</svg>';
  }
  function sutunlar(l){
    const v = (l || []).map(x => x == null || !isFinite(Number(x)) ? null : Number(x));
    if(!v.some(x => x != null)) return '';
    const en = Math.max(1e-9, ...v.filter(x => x != null)), w = 6, ara = 4, h = 22;
    return '<svg class="kapak__sutun" viewBox="0 0 ' + (v.length * (w + ara) - ara) + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">'
      + v.map((x, i) => x == null
        ? '<circle cx="' + (i * (w + ara) + w / 2) + '" cy="' + (h - 1.5) + '" r="1.3" class="kapak__sutun-bos"/>'
        : '<rect x="' + i * (w + ara) + '" y="' + (h - Math.max(2, x / en * h)).toFixed(1) + '" width="' + w + '" height="' + Math.max(2, x / en * h).toFixed(1) + '" rx="2"'
          + (i === v.length - 1 ? ' class="is-son"' : '') + '/>').join('') + '</svg>';
  }
  /* o: { modul, selam, cumle, sayilar:[{ ad, deger, birim, kesinlik, oran?, halka?, seri?, simge?, alt?, git? }], eylem:html, ikincil:html }
     `halka:true`: hedef biliniyor ama bugün kayıt yok — boş halka (iz) çizilir.
     `git`: karo o ekrana götüren düğme olur (data-act="go"). */
  function kapakHtml(o){
    o = o || {};
    const sayi = x => {
      const yok = x.deger == null || x.deger === '';
      const kes = yok ? 'veri_yok' : (x.kesinlik || 'computed');
      const oran = !yok && x.oran != null && isFinite(Number(x.oran)) ? Number(x.oran) : (x.halka ? 0 : null);
      const deger = '<span class="kapak__deger">' + (yok ? '—' : kac(x.deger) + (x.birim ? '<small>' + kac(x.birim) + '</small>' : '')) + '</span>';
      const etiket = x.git ? 'button' : 'div';
      return '<' + etiket + (x.git ? ' type="button" data-act="go" data-route="' + kac(x.git) + '" aria-label="' + kac(x.ad + ': ' + (yok ? 'veri yok' : x.deger + (x.birim ? ' ' + x.birim : ''))) + '"' : '')
        + ' class="kapak__sayi' + (oran != null ? ' has-halka' : '') + (oran != null && oran >= 1 ? ' is-tamam' : '') + (x.git ? ' is-git' : '') + '" data-kesinlik="' + kac(kes) + '" data-simge="' + simgeOf(x) + '">'
        + '<div class="kapak__karo-ust">' + svgS(simgeOf(x), 'kapak__simge')
        + '<span class="kapak__ad">' + kac(x.ad) + '<i title="' + kac(KESINLIK[kes] || kes) + '">' + kac(KESINLIK[kes] || '') + '</i></span></div>'
        + '<div class="kapak__karo-orta">' + (oran != null ? halka(oran) : '') + deger + '</div>'
        + (x.alt ? '<span class="kapak__alt">' + kac(x.alt) + '</span>' : '')
        + sutunlar(x.seri)
        + '</' + etiket + '>';
    };
    const sayilar = (o.sayilar || []).slice(0, 4);
    return '<section class="kapak kapak--' + kac(o.modul || '') + '" aria-label="Bugün">'
      + '<div class="kapak__ic">'
      + (o.selam ? '<p class="kapak__selam">' + kac(o.selam) + '</p>' : '')
      + '<h1 class="kapak__cumle hero__title" tabindex="-1">' + kac(o.cumle || 'Bugün') + '</h1>'
      + (sayilar.length ? '<div class="kapak__sayilar" data-adet="' + sayilar.length + '">' + sayilar.map(sayi).join('') + '</div>' : '')
      + (o.eylem || o.ikincil ? '<div class="kapak__eylem">' + (o.eylem || '') + (o.ikincil || '') + '</div>' : '')
      + '</div>'
      + '<button type="button" class="kapak__asagi" data-kapak-asagi aria-label="Günün ayrıntısına in">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>'
      + '</section>';
  }

  /* ------------------------------------------------------------ ayar paneli */

  function ayarHtml(modul){
    const a = ayar();
    const sec_ = (ad, deger, secenek) => '<div class="seg seg--block karsilama-ayar__seg" role="group" aria-label="' + kac(ad) + '">'
      + secenek.map(([v, y]) => '<button type="button" class="' + (v === deger ? 'is-on' : '') + '" data-karsilama="' + kac(ad) + '" data-deger="' + kac(v) + '"'
        + ' aria-pressed="' + (v === deger ? 'true' : 'false') + '">' + kac(y) + '</button>').join('') + '</div>';
    return '<div class="karsilama-ayar" data-karsilama-ayar="' + kac(modul || '') + '">'
      + '<label class="field"><span>Karşılama dili</span><select class="input" data-karsilama-alan="dil">'
      + DILLER.map(d => '<option value="' + d.id + '"' + (d.id === a.dil ? ' selected' : '') + '>' + kac(d.ad) + '</option>').join('') + '</select></label>'
      + '<div class="field"><span>Selam</span>' + sec_('selam', a.selam, [['karisik', 'Türlü türlü'], ['kendi', 'Kendi selamlarım']]) + '</div>'
      + '<label class="field"><span>Kendi selamların <small>her satıra bir tane</small></span><textarea class="input" rows="3" data-karsilama-alan="kendi" placeholder="Selam&#10;Hadi bakalım">'
      + kac(a.kendi.join('\n')) + '</textarea></label>'
      + '<div class="field"><span>Altındaki not</span>' + sec_('not', a.not, [['sistem', 'Sistemin notu'], ['kendi', 'Kendi notlarım'], ['ikisi', 'İkisi'], ['kapali', 'Kapalı']]) + '</div>'
      + (modul ? '<label class="field"><span>Bu bölüm için kendi notların <small>her satıra bir tane</small></span><textarea class="input" rows="3" data-karsilama-alan="notlar" placeholder="Matematiği ihmal etme">'
        + kac((a.notlar[modul] || []).join('\n')) + '</textarea></label>' : '')
      + '<p class="karsilama-ayar__ornek" aria-live="polite"><em>' + kac(selam({ ayar:a, modul:modul || 'ays', simdi:new Date(), tohum:1 })) + '</em></p>'
      + '</div>';
  }
  function ayarDegisti(kok){
    const k = kok && kok.closest ? kok.closest('[data-karsilama-ayar]') : null;
    if(!k) return null;
    const modul = k.getAttribute('data-karsilama-ayar');
    const a = ayar();
    const dil = k.querySelector('[data-karsilama-alan="dil"]'), kendi = k.querySelector('[data-karsilama-alan="kendi"]'),
      notlar = k.querySelector('[data-karsilama-alan="notlar"]');
    if(dil) a.dil = dil.value;
    if(kendi) a.kendi = kendi.value.split('\n');
    if(notlar && modul) a.notlar[modul] = notlar.value.split('\n');
    const yeni = ayarYaz(a);
    const ornek = k.querySelector('.karsilama-ayar__ornek em');
    if(ornek) ornek.textContent = selam({ ayar:yeni, modul:modul || 'ays', simdi:new Date() });
    return yeni;
  }

  if(typeof document !== 'undefined'){
    /* Olaylar belge düzeyinde (animasyon seçicisi gibi): modülün data-act
       işleyicisine düşmez. */
    document.addEventListener('click', e => {
      const t = e.target && e.target.closest ? e.target : null;
      if(!t) return;
      const b = t.closest('[data-karsilama]');
      if(b){
        e.preventDefault();
        const a = ayar();
        a[b.getAttribute('data-karsilama')] = b.getAttribute('data-deger');
        ayarYaz(a);
        const seg = b.parentElement;
        Array.from(seg.children).forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        ayarDegisti(b);
        return;
      }
      if(t.closest('[data-kapak-asagi]')){
        e.preventDefault();
        const hedef = document.querySelector('.site__body .sayfa') || document.getElementById('main');
        if(hedef) hedef.scrollIntoView({ behavior:'smooth', block:'start' });
      }
    });
    document.addEventListener('change', e => { if(e.target && e.target.closest && e.target.closest('[data-karsilama-alan]')) ayarDegisti(e.target); });
  }

  return { AYAR, NOT, DILLER, HAVUZ, HATIRA, EN_COK, EN_UZUN, vakit, gunTuru, havuz, selam, not, notYaz, ayarOku, ayar, ayarYaz,
    acilis, perdeyeYaz, kapakHtml, ayarHtml, ayarDegisti, bugunISO, _sifirla:() => { bu = null; } };
})();
