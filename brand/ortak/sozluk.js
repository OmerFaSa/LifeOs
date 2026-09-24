/* TEK SÖZLÜK — sistemin terimleri ve model kapalıyken konuşan hazır cümle.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sozluk.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   Biçimi `brand/ortak/kart.css` içindedir.
   ==================================================================

   NE YAPAR (katalog, ekip/TASARIM-OZELLIKLERI.md §A, §G)

     016  Terim ipucu         «Tekrar borcu» gibi terimlerin altı noktalı;
                              üzerine gelince (dokunmatikte basılı tutunca)
                              tek cümlelik tanım ve örnek açılır. Tanım TEK
                              yerden gelir: aynı terim her ekranda aynıdır.
     137  Ajanın baktığı veri ajanın masasındaki veri kimliği Türkçe ad ve
                              kesinlik etiketiyle çip olur («gunun_akisi» değil
                              «Günün akışı»). Ekrana bağlama K2'de (T2-02).
     139  Model kapalı kipi   dil modeli kapalıyken ajanlar kuraldan gelen
                              hazır cümlelerle konuşur ve bunu ETİKETLER;
                              üstte gri bir durum şeridi. Hiçbir ekran
                              kapanmaz, sayılar aynen durur.

   TANIMLAR NEREDEN GELDİ

   Uydurulmadı. Her tanım deponun kendi metninden: AGENTS.md §1 (aksiyon
   seviyeleri, Merkez, XP), `AYS/src/js/data/hints.js` (net, seri,
   minimum gün), `AYS/src/js/core/audit.js` ve `calc.js` (tekrar borcu),
   `brand/ortak/seri.js` (dondurulmuş gün), `kesinlik.js` (dört etiket).
   Yeni terim eklerken de kaynak yazılır (`kaynak` alanı): kaynağı
   gösterilemeyen tanım bu dosyaya girmez.

   Dört kesinlik etiketinin tanımı BURADA YAZILMAZ: `LIFEOS.KESINLIK`'ten
   okunur. İki yerde yazılsaydı bir gün ayrışırdı. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }

  /* ------------------------------------------------ 016 sözlük */

  /* modul: terimin ait olduğu sistem ('ays' | 'spi' | 'esp'); yazılmamışsa
     üç sistemde aynı anlamdadır. */
  const TERIMLER = {
    'tekrar-borcu':{ terim:'Tekrar borcu', modul:'ays',
      tanim:'Vadesi gelen tekrar kartlarından gecikmiş olanların oranı.',
      ornek:'Vadesi gelen 20 karttan 5’i gecikmişse borç %25’tir. Eşik %10; bu bir bulgu değil, sistemin seçimidir.',
      kaynak:'AYS core/calc.js cardDebt · core/audit.js' },
    'net':{ terim:'Net', modul:'ays',
      tanim:'Doğru sayısından yanlışların dörtte biri çıkarılarak bulunur; testler ayrı ayrı hesaplanıp toplanır.',
      ornek:'40 doğru, 8 yanlış: 40 − 8 ÷ 4 = 38 net.',
      kaynak:'AYS data/hints.js net · data/evidence.js' },
    'minimum-gun':{ terim:'Minimum gün', modul:'ays',
      tanim:'Kötü günün alt sınırı: 45 dakika, 15 paragraf ve vadesi gelen kartlar.',
      ornek:'Hiçbir şey yapamadığın gün bu üçünü tutturursan seri kırılmaz.',
      kaynak:'AYS data/hints.js minimum-day' },
    'seri':{ terim:'Seri',
      tanim:'Günlük alt sınırı tutturduğun ardışık gün sayısı; ödül nete değil davranışa bağlıdır.',
      ornek:'Dondurulan gün (hastalık, tatil) seriyi bozmaz ama sayılmaz da.',
      kaynak:'AYS data/hints.js streak · brand/ortak/seri.js' },
    'merkez':{ terim:'Merkez',
      tanim:'HKM’nin modüllere öneri yazan katmanı; modüle yazmaz, öneriyi modül kendi koduyla ve senin onayınla uygular.',
      ornek:'«Akşam bloğu tekrara ayrılsın» bir Merkez önerisidir; «Uygula» demeden hiçbir şey değişmez.',
      kaynak:'AGENTS.md §1.4 · HKM/core/intents.py' },
    'kucuk-aksiyon':{ terim:'Küçük aksiyon',
      tanim:'Tek gün, tek kayıt değiştiren iş; istersen sormadan uygulanır, «Geri al» ekranda kalır.',
      ornek:'Bugünkü bir bloğun saatini kaydırmak.',
      kaynak:'AGENTS.md §1.9' },
    'orta-aksiyon':{ terim:'Orta aksiyon',
      tanim:'Bir hafta ya da bir dönemi etkileyen iş; önce önizleme gösterilir, tek onayla uygulanır.',
      ornek:'Ara haftası, geçici süre değişikliği, bir bölümü kapatmak.',
      kaynak:'AGENTS.md §1.9' },
    'buyuk-aksiyon':{ terim:'Büyük aksiyon',
      tanim:'Sınavı değiştirmek ya da planı baştan kurmak gibi iş; önce ve sonrası gösterilir, onaydan önce dönüş noktası alınır.',
      ornek:'Hedef sınavı YKS’den başka bir sınava çevirmek.',
      kaynak:'AGENTS.md §1.9' },
    'donus-noktasi':{ terim:'Dönüş noktası',
      tanim:'Büyük bir aksiyon uygulanmadan önce alınan önceki hâl; geri alınınca veri bu noktaya döner.',
      kaynak:'SPİ core/plan.js uygula · AGENTS.md §1.9' },
    'esik':{ terim:'Eşik',
      tanim:'Bir kuralın tetiklendiği sınır değer; eşiklerin çoğu bir bulgu değil, sistemin seçimidir.',
      ornek:'Tekrar borcu %10’u geçince uyarı çıkar.',
      kaynak:'AYS core/audit.js · data/hints.js evidence' },
    'kural-izi':{ terim:'Kural izi',
      tanim:'Bir önerinin dayandığı kurallar: numarası ve sağlanan değerle.',
      ornek:'R-12 · tekrar borcu %34 ≥ %10.',
      kaynak:'EKIP-PLANI Ek A 121' },
    'veri-tazeligi':{ terim:'Veri tazeliği',
      tanim:'Ölçümün yaşı; eşiği geçen değer soluk yazılır ve kaç gün önce ölçüldüğünü söyler.',
      kaynak:'brand/ortak/sayi.js TAZELIK' },
    'rutbe':{ terim:'Rütbe',
      tanim:'Kullanımın görünür izi; hiçbir plan, öneri ya da uyarı rütbeye bakmaz.',
      kaynak:'AGENTS.md §1.6' },
  };
  Object.keys(TERIMLER).forEach(k => Object.freeze(TERIMLER[k]));
  Object.freeze(TERIMLER);

  /* Kesinlik etiketleri de terimdir; tanımı `kesinlik.js`'ten okunur. */
  const KESINLIK_TERIM = { 'olculdu':'measured', 'tahmin':'estimated',
    'hesaplandi':'computed', 'veri-yok':'missing' };

  function bul(id){
    if(id == null) return null;
    const k = String(id);
    if(Object.prototype.hasOwnProperty.call(TERIMLER, k)) return Object.assign({ id:k }, TERIMLER[k]);
    if(Object.prototype.hasOwnProperty.call(KESINLIK_TERIM, k) && L.KESINLIK_ILE){
      const e = L.KESINLIK_ILE(KESINLIK_TERIM[k]);
      if(e) return { id:k, terim:e.ad.charAt(0).toLocaleUpperCase('tr-TR') + e.ad.slice(1),
        tanim:e.ozet, kaynak:'brand/ortak/kesinlik.js' };
    }
    return null;
  }

  function hepsi(){
    return Object.keys(TERIMLER).concat(Object.keys(KESINLIK_TERIM)).map(bul).filter(Boolean);
  }

  let sayac = 0;

  /* Terimin ekrandaki hâli. `metin` verilirse o yazılır (çekim eki:
     «tekrar borcunu»), tanım yine sözlükten gelir. Bilinmeyen terimde
     tanım UYDURULMAZ: yazı düz kalır ve `data-terim-yok` taşır. */
  function html(id, metin){
    const t = bul(id);
    const yazi = metin != null ? metin : (t ? t.terim : String(id == null ? '' : id));
    if(!t) return '<span class="terim terim--yok" data-terim-yok="' + kac(id) + '">' + kac(yazi) + '</span>';
    const tid = 'terim-' + (++sayac);
    return '<span class="terim" data-oz="016" data-terim="' + kac(t.id) + '" tabindex="0" aria-describedby="' + tid + '">'
      + kac(yazi)
      + '<span class="terim__kart" role="tooltip" id="' + tid + '">'
      + '<span class="terim__ad">' + kac(t.terim) + '</span>'
      + '<span class="terim__tanim">' + kac(t.tanim) + '</span>'
      + (t.ornek ? '<span class="terim__ornek">' + kac(t.ornek) + '</span>' : '')
      + '</span></span>';
  }

  /* Dokunmatikte basılı tutma ve Esc: sayı bileşeninin köken kartıyla
     AYNI davranış (sayi.js `bagla`). Tek davranış öğrenilir. */
  const BASILI_MS = 450;
  function bagla(kok){
    kok = kok || document;
    if(kok.__terimBagli) return false;
    kok.__terimBagli = true;
    let zaman = null;
    const kapat = haric => {
      kok.querySelectorAll('.terim--acik').forEach(el => { if(el !== haric) el.classList.remove('terim--acik'); });
    };
    kok.addEventListener('pointerdown', ev => {
      const el = ev.target && ev.target.closest ? ev.target.closest('.terim[aria-describedby]') : null;
      kapat(el);
      if(!el || ev.pointerType === 'mouse') return;
      clearTimeout(zaman);
      zaman = setTimeout(() => el.classList.add('terim--acik'), BASILI_MS);
    });
    const birak = () => { clearTimeout(zaman); zaman = null; };
    kok.addEventListener('pointerup', birak);
    kok.addEventListener('pointercancel', birak);
    kok.addEventListener('keydown', ev => { if(ev.key === 'Escape') kapat(null); });
    return true;
  }

  /* ------------------------------------------------ 139 hazır cümle */

  /* Model kapalıyken konuşan cümle KODDAN gelir: kalıp + değer. Değeri
     olmayan yer «—» olur; boş bırakılmaz, uydurulmaz da. Dönen nesne
     kaynağını taşır ve ekranda etiketlenir (`hazirHtml`). */
  function hazir(kalip, degerler){
    degerler = degerler || {};
    const eksik = [];
    const metin = String(kalip || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, ad) => {
      const v = degerler[ad];
      if(v == null || v === '' || (typeof v === 'number' && !isFinite(v))){ eksik.push(ad); return '—'; }
      return typeof v === 'number' && L.SAYI ? L.SAYI.bicim(v) : String(v);
    });
    return { metin:metin, kaynak:'kural', eksik:eksik };
  }

  function hazirHtml(c){
    if(!c || !c.metin) return '';
    return '<p class="hazir" data-oz="139" data-kaynak="kural">'
      + '<span class="hazir__etiket">hazır cümle</span> ' + kac(c.metin) + '</p>';
  }

  /* Gri durum şeridi. `acik` true ise şerit yok. Neden yazılırsa şeritte
     durur («kota doldu», «anahtar yok»); yazılmazsa neden uydurulmaz. */
  function seritHtml(durum){
    durum = durum || {};
    if(durum.acik) return '';
    return '<div class="modelsiz" data-oz="139" role="status">'
      + '<b class="modelsiz__bas">Dil modeli kapalı</b>'
      + '<span class="modelsiz__metin">Ajanlar hazır cümlelerle konuşuyor; sayılar ve kararlar aynen duruyor.'
      + (durum.neden ? ' Neden: ' + kac(durum.neden) + '.' : '') + '</span></div>';
  }


  /* ------------------------------------------------ 137 ajanın baktığı veri */

  /* Ajanın masasındaki veri kimlikleri (`data/agents.js` `reads`) iç
     adlardır: «gunun_akisi», «haftalar (review)». Ekrana ASCII kimlik
     yazılmaz (AGENTS.md §1.8, ekip/HATALAR.md T2-02); ad buradan gelir.

     Adlar ve kesinlik, aracın KENDİ açıklamasından (AYS `core/tools.js`
     ve koçun `scope` alanı): «tahmini puan BANDI» → tahmin; risk, medyan,
     oran, yüzde → hesaplandı; kayıt → ölçüldü. Enerji 1–5 adayın kendi
     puanlamasıdır: «kullanıcının kendi kestirimi» → tahmin.
     Tabloda olmayan kimliğe ad UYDURULMAZ (`veriBul` → null). */
  const VERI = Object.freeze({
    durum_ozeti:{ ad:'Durum özeti', kesinlik:'computed' },
    konu_riski:{ ad:'Konu riski', kesinlik:'computed' },
    puan_tahmini:{ ad:'Puan tahmini', kesinlik:'estimated' },
    gunun_akisi:{ ad:'Günün akışı', kesinlik:'computed' },
    konular:{ ad:'Konu durumları', kesinlik:'computed' },
    denemeler:{ ad:'Deneme kayıtları', kesinlik:'measured' },
    hedef_ve_net_matrisi:{ ad:'Hedef ve net karşılaştırması', kesinlik:'computed' },
    gunler:{ ad:'Günlük çalışma kaydı', kesinlik:'measured' },
    enerji_durumu:{ ad:'Enerji durumu', kesinlik:'estimated' },
    mesgaleler:{ ad:'Mola ve meşgale durumu', kesinlik:'measured' },
    haftalar:{ ad:'Haftalık plan ve değerlendirme', kesinlik:'computed' },
    hatalar:{ ad:'Yanlış defteri', kesinlik:'measured' },
    kartlar:{ ad:'Tekrar kartları', kesinlik:'computed' },
    video_notlari:{ ad:'Ders notları', kesinlik:'measured' },
    cozulen_sorular:{ ad:'Çözülen sorular', kesinlik:'measured' },
    konu_basina_oran:{ ad:'Konu başına oran', kesinlik:'computed' },
    kaynaklar:{ ad:'Kaynaklar', kesinlik:'measured' },
    kaynak_zorlugu:{ ad:'Kaynak zorluğu', kesinlik:'computed' },
  });
  /* Paranteze yazılan ek: «konular (TYT)». `review` adın içinde zaten var. */
  const VERI_EK = Object.freeze({ TYT:'TYT', AYT:'AYT', review:'' });

  function veriBul(kimlik){
    const m = /^\s*([a-z_]+)\s*(?:\(([^)]*)\))?\s*$/.exec(String(kimlik == null ? '' : kimlik));
    if(!m || !Object.prototype.hasOwnProperty.call(VERI, m[1])) return null;
    const ek = m[2] != null ? m[2].trim() : null;
    if(ek != null && !Object.prototype.hasOwnProperty.call(VERI_EK, ek)) return null;
    const v = VERI[m[1]];
    const ekAd = ek != null ? VERI_EK[ek] : '';
    return { kimlik:String(kimlik), taban:m[1], ek:ek, ad:v.ad + (ekAd ? ' (' + ekAd + ')' : ''), kesinlik:v.kesinlik };
  }

  /* Çipler: ad + kesinlik glifi (T'nin .chip'i). Tanımsız kimlik ham
     yazılmaz; «tanımsız veri» çipi olur ve işaretlenir (denetim bulur). */
  function veriCipleriHtml(liste){
    const cip = (liste || []).map(k => {
      const v = veriBul(k);
      if(!v) return '<li class="chip vericip__c vericip__c--yok" data-veri-yok="' + kac(k) + '">tanımsız veri</li>';
      return '<li class="chip vericip__c" data-veri="' + kac(v.kimlik) + '">'
        + (L.KESINLIK_HTML ? L.KESINLIK_HTML(v.kesinlik) : '') + '<span class="vericip__ad">' + kac(v.ad) + '</span></li>';
    }).join('');
    return cip ? '<ul class="vericip" data-oz="137" aria-label="Baktığı veri">' + cip + '</ul>' : '';
  }

  L.SOZLUK = {
    TERIMLER:TERIMLER,
    BASILI_MS:BASILI_MS,
    bul:bul,
    hepsi:hepsi,
    html:html,
    bagla:bagla,
    hazir:hazir,
    hazirHtml:hazirHtml,
    seritHtml:seritHtml,
    VERI:VERI,
    veriBul:veriBul,
    veriCipleriHtml:veriCipleriHtml,
  };
})();
