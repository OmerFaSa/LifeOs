/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sozluk.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* TEK SÖZLÜK — sistemin terimleri ve model kapalıyken konuşan hazır cümle.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sozluk.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   Biçimi `brand/ortak/kart.css` içindedir.
   ==================================================================

   NE YAPAR (katalog, belgeler/ekip/TASARIM-OZELLIKLERI.md §A, §G)

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
window.LIFEOS.PARCA.yazilar({
  'ortak.sozluk.tekrar-borcu':'Tekrar borcu',
  'ortak.sozluk.vadesi-gelen-tekrar-kartlari':'Vadesi gelen tekrar kartlarından gecikmiş olanların oranı.',
  'ortak.sozluk.vadesi-gelen-20-karttan-5-i':'Vadesi gelen 20 karttan 5’i gecikmişse borç %25’tir. Eşik %10; bu bir bulgu değil, sistemin seçimidir.',
  'ortak.sozluk.ays-core-calc-js-carddebt-co':'AYS core/calc.js cardDebt · core/audit.js',
  'ortak.sozluk.dogru-sayisindan-yanlislarin':'Doğru sayısından yanlışların dörtte biri çıkarılarak bulunur; testler ayrı ayrı hesaplanıp toplanır.',
  'ortak.sozluk.ays-data-hints-js-net-data-e':'AYS data/hints.js net · data/evidence.js',
  'ortak.sozluk.minimum-gun':'Minimum gün',
  'ortak.sozluk.kotu-gunun-alt-siniri-45':'Kötü günün alt sınırı: 45 dakika, 10 paragraf ve vadesi gelen kartlar.',
  'ortak.sozluk.hicbir-sey-yapamadigin-gun-b':'Hiçbir şey yapamadığın gün bu üçünü tutturursan seri kırılmaz.',
  'ortak.sozluk.ays-data-hints-js-minimum-da':'AYS data/hints.js minimum-day',
  'ortak.sozluk.gunluk-alt-siniri-tutturdugu':'Günlük alt sınırı tutturduğun ardışık gün sayısı; ödül nete değil davranışa bağlıdır.',
  'ortak.sozluk.dondurulan-gun-hastalik-tati':'Dondurulan gün (hastalık, tatil) seriyi bozmaz ama sayılmaz da.',
  'ortak.sozluk.ays-data-hints-js-streak-bra':'AYS data/hints.js streak · brand/ortak/seri.js',
  'ortak.sozluk.hkm-nin-modullere-oneri-yaza':'HKM’nin modüllere öneri yazan katmanı; modüle yazmaz, öneriyi modül kendi koduyla ve senin onayınla uygular.',
  'ortak.sozluk.agents-md-1-4-hkm-core-inten':'AGENTS.md §1.4 · HKM/core/intents.py',
  'ortak.sozluk.kucuk-aksiyon':'Küçük aksiyon',
  'ortak.sozluk.tek-gun-tek-kayit-degistiren':'Tek gün, tek kayıt değiştiren iş; istersen sormadan uygulanır, «Geri al» ekranda kalır.',
  'ortak.sozluk.bugunku-bir-blogun-saatini-k':'Bugünkü bir bloğun saatini kaydırmak.',
  'ortak.sozluk.agents-md-1-9':'AGENTS.md §1.9',
  'ortak.sozluk.orta-aksiyon':'Orta aksiyon',
  'ortak.sozluk.bir-hafta-ya-da-bir':'Bir hafta ya da bir dönemi etkileyen iş; önce önizleme gösterilir, tek onayla uygulanır.',
  'ortak.sozluk.ara-haftasi-gecici-sure-degi':'Ara haftası, geçici süre değişikliği, bir bölümü kapatmak.',
  'ortak.sozluk.buyuk-aksiyon':'Büyük aksiyon',
  'ortak.sozluk.sinavi-degistirmek-ya-da-pla':'Sınavı değiştirmek ya da planı baştan kurmak gibi iş; önce ve sonrası gösterilir, onaydan önce dönüş noktası alınır.',
  'ortak.sozluk.hedef-sinavi-yks-den-baska-b':'Hedef sınavı YKS’den başka bir sınava çevirmek.',
  'ortak.sozluk.donus-noktasi':'Dönüş noktası',
  'ortak.sozluk.buyuk-bir-aksiyon-uygulanmad':'Büyük bir aksiyon uygulanmadan önce alınan önceki hâl; geri alınınca veri bu noktaya döner.',
  'ortak.sozluk.spi-core-plan-js-uygula-agen':'SPİ core/plan.js uygula · AGENTS.md §1.9',
  'ortak.sozluk.bir-kuralin-tetiklendigi-sin':'Bir kuralın tetiklendiği sınır değer; eşiklerin çoğu bir bulgu değil, sistemin seçimidir.',
  'ortak.sozluk.tekrar-borcu-10-u-gecince-uy':'Tekrar borcu %10’u geçince uyarı çıkar.',
  'ortak.sozluk.ays-core-audit-js-data-hints':'AYS core/audit.js · data/hints.js evidence',
  'ortak.sozluk.kural-izi':'Kural izi',
  'ortak.sozluk.bir-onerinin-dayandigi-kural':'Bir önerinin dayandığı kurallar: numarası ve sağlanan değerle.',
  'ortak.sozluk.r-12-tekrar-borcu-34':'R-12 · tekrar borcu %34 ≥ %10.',
  'ortak.sozluk.ekip-plani-ek-a-121':'EKIP-PLANI Ek A 121',
  'ortak.sozluk.veri-tazeligi':'Veri tazeliği',
  'ortak.sozluk.olcumun-yasi-esigi-gecen-deg':'Ölçümün yaşı; eşiği geçen değer soluk yazılır ve kaç gün önce ölçüldüğünü söyler.',
  'ortak.sozluk.kullanimin-gorunur-izi-hicbi':'Kullanımın görünür izi; hiçbir plan, öneri ya da uyarı rütbeye bakmaz.',
  'ortak.sozluk.agents-md-1-6':'AGENTS.md §1.6',
  'ortak.sozluk.hazir-cumle':'hazır cümle',
  'ortak.sozluk.dil-modeli-kapali':'Dil modeli kapalı',
  'ortak.sozluk.uzmanlar-hazir-cumlelerle-ko':'Uzmanlar hazır cümlelerle konuşuyor; sayılar ve kararlar aynen duruyor.',
  'ortak.sozluk.tanimsiz-veri':'tanımsız veri',
});

window.LIFEOS.PARCA.yazilar({
  'ortak.sozluk.durum-ozeti':'Durum özeti',
  'ortak.sozluk.konu-riski':'Konu riski',
  'ortak.sozluk.puan-tahmini':'Puan tahmini',
  'ortak.sozluk.gunun-akisi':'Günün akışı',
  'ortak.sozluk.konu-durumlari':'Konu durumları',
  'ortak.sozluk.deneme-kayitlari':'Deneme kayıtları',
  'ortak.sozluk.hedef-ve-net-karsilastirmasi':'Hedef ve net karşılaştırması',
  'ortak.sozluk.gunluk-calisma-kaydi':'Günlük çalışma kaydı',
  'ortak.sozluk.enerji-durumu':'Enerji durumu',
  'ortak.sozluk.mola-ve-mesgale-durumu':'Mola ve meşgale durumu',
  'ortak.sozluk.haftalik-plan-ve-degerlendir':'Haftalık plan ve değerlendirme',
  'ortak.sozluk.yanlis-defteri':'Yanlış defteri',
  'ortak.sozluk.tekrar-kartlari':'Tekrar kartları',
  'ortak.sozluk.ders-notlari':'Ders notları',
  'ortak.sozluk.cozulen-sorular':'Çözülen sorular',
  'ortak.sozluk.konu-basina-oran':'Konu başına oran',
  'ortak.sozluk.kaynaklar':'Kaynaklar',
  'ortak.sozluk.kaynak-zorlugu':'Kaynak zorluğu',
});


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
    'tekrar-borcu':{ terim:yz('ortak.sozluk.tekrar-borcu'), modul:'ays',
      tanim:yz('ortak.sozluk.vadesi-gelen-tekrar-kartlari'),
      ornek:yz('ortak.sozluk.vadesi-gelen-20-karttan-5-i'),
      kaynak:yz('ortak.sozluk.ays-core-calc-js-carddebt-co') },
    'net':{ terim:'Net', modul:'ays',
      tanim:yz('ortak.sozluk.dogru-sayisindan-yanlislarin'),
      ornek:'40 doğru, 8 yanlış: 40 − 8 ÷ 4 = 38 net.',
      kaynak:yz('ortak.sozluk.ays-data-hints-js-net-data-e') },
    'minimum-gun':{ terim:yz('ortak.sozluk.minimum-gun'), modul:'ays',
      tanim:yz('ortak.sozluk.kotu-gunun-alt-siniri-45'),
      ornek:yz('ortak.sozluk.hicbir-sey-yapamadigin-gun-b'),
      kaynak:yz('ortak.sozluk.ays-data-hints-js-minimum-da') },
    'seri':{ terim:'Seri',
      tanim:yz('ortak.sozluk.gunluk-alt-siniri-tutturdugu'),
      ornek:yz('ortak.sozluk.dondurulan-gun-hastalik-tati'),
      kaynak:yz('ortak.sozluk.ays-data-hints-js-streak-bra') },
    'merkez':{ terim:'Merkez',
      tanim:yz('ortak.sozluk.hkm-nin-modullere-oneri-yaza'),
      ornek:'«Akşam bloğu tekrara ayrılsın» bir Merkez önerisidir; «Uygula» demeden hiçbir şey değişmez.',
      kaynak:yz('ortak.sozluk.agents-md-1-4-hkm-core-inten') },
    'kucuk-aksiyon':{ terim:yz('ortak.sozluk.kucuk-aksiyon'),
      tanim:yz('ortak.sozluk.tek-gun-tek-kayit-degistiren'),
      ornek:yz('ortak.sozluk.bugunku-bir-blogun-saatini-k'),
      kaynak:yz('ortak.sozluk.agents-md-1-9') },
    'orta-aksiyon':{ terim:yz('ortak.sozluk.orta-aksiyon'),
      tanim:yz('ortak.sozluk.bir-hafta-ya-da-bir'),
      ornek:yz('ortak.sozluk.ara-haftasi-gecici-sure-degi'),
      kaynak:yz('ortak.sozluk.agents-md-1-9') },
    'buyuk-aksiyon':{ terim:yz('ortak.sozluk.buyuk-aksiyon'),
      tanim:yz('ortak.sozluk.sinavi-degistirmek-ya-da-pla'),
      ornek:yz('ortak.sozluk.hedef-sinavi-yks-den-baska-b'),
      kaynak:yz('ortak.sozluk.agents-md-1-9') },
    'donus-noktasi':{ terim:yz('ortak.sozluk.donus-noktasi'),
      tanim:yz('ortak.sozluk.buyuk-bir-aksiyon-uygulanmad'),
      kaynak:yz('ortak.sozluk.spi-core-plan-js-uygula-agen') },
    'esik':{ terim:'Eşik',
      tanim:yz('ortak.sozluk.bir-kuralin-tetiklendigi-sin'),
      ornek:yz('ortak.sozluk.tekrar-borcu-10-u-gecince-uy'),
      kaynak:yz('ortak.sozluk.ays-core-audit-js-data-hints') },
    'kural-izi':{ terim:yz('ortak.sozluk.kural-izi'),
      tanim:yz('ortak.sozluk.bir-onerinin-dayandigi-kural'),
      ornek:yz('ortak.sozluk.r-12-tekrar-borcu-34'),
      kaynak:yz('ortak.sozluk.ekip-plani-ek-a-121') },
    'veri-tazeligi':{ terim:yz('ortak.sozluk.veri-tazeligi'),
      tanim:yz('ortak.sozluk.olcumun-yasi-esigi-gecen-deg'),
      kaynak:'brand/ortak/sayi.js TAZELIK' },
    'rutbe':{ terim:'Rütbe',
      tanim:yz('ortak.sozluk.kullanimin-gorunur-izi-hicbi'),
      kaynak:yz('ortak.sozluk.agents-md-1-6') },
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
      + ('<span class="hazir__etiket">' + yz('ortak.sozluk.hazir-cumle') + '</span> ') + kac(c.metin) + '</p>';
  }

  /* Gri durum şeridi. `acik` true ise şerit yok. Neden yazılırsa şeritte
     durur («kota doldu», «anahtar yok»); yazılmazsa neden uydurulmaz. */
  function seritHtml(durum){
    durum = durum || {};
    if(durum.acik) return '';
    return '<div class="modelsiz" data-oz="139" role="status">'
      + ('<b class="modelsiz__bas">' + yz('ortak.sozluk.dil-modeli-kapali') + '</b>')
      + ('<span class="modelsiz__metin">' + yz('ortak.sozluk.uzmanlar-hazir-cumlelerle-ko'))
      + (durum.neden ? ' Neden: ' + kac(durum.neden) + '.' : '') + '</span></div>';
  }


  /* ------------------------------------------------ 137 ajanın baktığı veri */

  /* Ajanın masasındaki veri kimlikleri (`data/agents.js` `reads`) iç
     adlardır: «gunun_akisi», «haftalar (review)». Ekrana ASCII kimlik
     yazılmaz (AGENTS.md §1.8, belgeler/ekip/HATALAR.md T2-02); ad buradan gelir.

     Adlar ve kesinlik, aracın KENDİ açıklamasından (AYS `core/tools.js`
     ve koçun `scope` alanı): «tahmini puan BANDI» → tahmin; risk, medyan,
     oran, yüzde → hesaplandı; kayıt → ölçüldü. Enerji 1–5 adayın kendi
     puanlamasıdır: «kullanıcının kendi kestirimi» → tahmin.
     Tabloda olmayan kimliğe ad UYDURULMAZ (`veriBul` → null). */
  const VERI = Object.freeze({
    durum_ozeti:{ ad:yz('ortak.sozluk.durum-ozeti'), kesinlik:'computed' },
    konu_riski:{ ad:yz('ortak.sozluk.konu-riski'), kesinlik:'computed' },
    puan_tahmini:{ ad:yz('ortak.sozluk.puan-tahmini'), kesinlik:'estimated' },
    gunun_akisi:{ ad:yz('ortak.sozluk.gunun-akisi'), kesinlik:'computed' },
    konular:{ ad:yz('ortak.sozluk.konu-durumlari'), kesinlik:'computed' },
    denemeler:{ ad:yz('ortak.sozluk.deneme-kayitlari'), kesinlik:'measured' },
    hedef_ve_net_matrisi:{ ad:yz('ortak.sozluk.hedef-ve-net-karsilastirmasi'), kesinlik:'computed' },
    gunler:{ ad:yz('ortak.sozluk.gunluk-calisma-kaydi'), kesinlik:'measured' },
    enerji_durumu:{ ad:yz('ortak.sozluk.enerji-durumu'), kesinlik:'estimated' },
    mesgaleler:{ ad:yz('ortak.sozluk.mola-ve-mesgale-durumu'), kesinlik:'measured' },
    haftalar:{ ad:yz('ortak.sozluk.haftalik-plan-ve-degerlendir'), kesinlik:'computed' },
    hatalar:{ ad:yz('ortak.sozluk.yanlis-defteri'), kesinlik:'measured' },
    kartlar:{ ad:yz('ortak.sozluk.tekrar-kartlari'), kesinlik:'computed' },
    video_notlari:{ ad:yz('ortak.sozluk.ders-notlari'), kesinlik:'measured' },
    cozulen_sorular:{ ad:yz('ortak.sozluk.cozulen-sorular'), kesinlik:'measured' },
    konu_basina_oran:{ ad:yz('ortak.sozluk.konu-basina-oran'), kesinlik:'computed' },
    kaynaklar:{ ad:yz('ortak.sozluk.kaynaklar'), kesinlik:'measured' },
    kaynak_zorlugu:{ ad:yz('ortak.sozluk.kaynak-zorlugu'), kesinlik:'computed' },
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
      if(!v) return '<li class="chip vericip__c vericip__c--yok" data-veri-yok="' + kac(k) + ('">' + yz('ortak.sozluk.tanimsiz-veri') + '</li>');
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
