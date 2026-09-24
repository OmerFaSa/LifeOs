/* ÖNERİ KARTI VE ONAY KALIBI — Merkez'in sesi ve aksiyonun üç seviyesi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/oneri.js`; `python3 tools/ortak.py --yay`
   ile üç arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   Kopyayı elle düzenleme: bir sonraki yayında kaybolur.
   Biçimi `brand/ortak/kart.css` içindedir.
   ==================================================================

   NE YAPAR (katalog, ekip/TASARIM-OZELLIKLERI.md §F, §I, §L)

     110  Mor öneri kartı     Merkez'den gelen her öneri mor kartta ve
                              seviye rozetiyle. Modülün kendi önerisi
                              NÖTR kartta: mor yalnız Merkez'indir.
     111  Seviyeye göre onay  onay kalıbı aksiyonun KATALOGDAKİ seviyesinden
                              seçilir; önerinin (modelin) yazdığı seviye
                              yok sayılır.
     112  Çakışma kartı       aynı saati isteyen iki modül yan yana;
                              Merkez'in çözümü onaysız UYGULANMAZ.
     114  Gerekçe çubuğu      sayı ve eşik koddan, çubukla; modelin cümlesi
                              ayrı öğede, altta. Model kapalıyken sayı ve
                              çubuk kalır.
     116  Otomatik uygula     her küçük tür için «sormadan uygula» anahtarı;
                              orta ve büyük türde anahtar kilitli.
     121  Kural izi           her Merkez önerisi tetikleyen kuralların
                              numarasını ve sağlanan değeri taşır.
     150  Geri al geri sayımı «Geri al» şeridinin kalan süresi çizgiyle;
                              süre dolunca şerit kapanır, işlem kalıcıdır.
     022  Sonucu söyleyen     yıkıcı düğme sonucu adıyla ve sayısıyla söyler:
          düğme               «14 bloğu sil». «Evet» ya da «Tamam» yok.

     P2: 113 önce/sonra (yalnız değişen renkli) · 123 geçme nedeni (isteğe
         bağlı çip) · 124 çapraz etki (kaynak → hedef, ok Merkez'in) ·
         127 kapsam seçimi (süre uzadıkça seviye büyür, hiç küçülmez)

   DOKTRİN (AGENTS.md §1.1, §1.4, §1.9)

   Bu dosya hiçbir şeyi UYGULAMAZ. Karar verir (hangi kalıp, sormadan mı,
   uygulanabilir mi) ve markup üretir; uygulayan her zaman modülün kendi
   kodudur (`core/proposals.js` ve eşleri). HKM modüle yazmaz, teklif
   yazar; teklifi bu kart gösterir. */

window.LIFEOS = window.LIFEOS || {};

(function(){
  'use strict';

  const L = window.LIFEOS;

  function kac(t){
    return String(t == null ? '' : t).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);
  }
  const sayiMi = v => typeof v === 'number' && isFinite(v);
  const birimli = (t, b) => (L.SAYI && L.SAYI.birimli) ? L.SAYI.birimli(t, b) : t + (b ? ' ' + b : '');
  const bicim = (n, od) => (L.SAYI && L.SAYI.bicim) ? L.SAYI.bicim(n, od) : (sayiMi(n) ? String(n) : '—');

  /* Düğme: T'nin `components.js` Button'ıyla AYNI işaretleme. Biçim
     T'nindir (`components.css` .btn); burada yalnız işaret üretilir. */
  function dugme(o){
    const sinif = ['btn'];
    if(o.ton) sinif.push('btn--' + o.ton);
    if(o.boy) sinif.push('btn--' + o.boy);
    let ek = '';
    Object.keys(o.data || {}).forEach(k => { ek += ' data-' + k + '="' + kac(o.data[k]) + '"'; });
    return '<button type="button" class="' + sinif.join(' ') + '"'
      + (o.act ? ' data-act="' + kac(o.act) + '"' : '') + ek
      + (o.devreDisi ? ' disabled' : '') + '><span class="btn__label">' + kac(o.etiket) + '</span></button>';
  }

  /* ------------------------------------------------ 022 sonuç düğmesi */

  /* «Evet», «Tamam», «OK» onay anında NE olacağını söylemez. Yıkıcı bir
     düğmede bu kelimeler yoktur; düğme sonucu adıyla ve sayısıyla söyler. */
  const YASAK_ETIKET = /^\s*(evet|tamam|ok|okay)\b/i;

  /* «14 bloğu sil». Nesne ÇEKİMLİ gelir (bloğu, kaydı, kartı): Türkçe
     belirtme eki kökün sesine göre değişir ve kodda güvenle kurulamaz;
     çekimi bilen, cümleyi yazan ekrandır. */
  function sonucEtiketi(o){
    o = o || {};
    const parca = [];
    if(sayiMi(o.sayi)) parca.push(bicim(o.sayi));
    if(o.nesne) parca.push(String(o.nesne));
    if(o.fiil) parca.push(String(o.fiil));
    const e = parca.join(' ');
    return e ? e.charAt(0).toLocaleUpperCase('tr-TR') + e.slice(1) : e;
  }

  /* Yıkıcı düğmenin etiketi geçerli mi: yasak kelimeyle başlamaz ve bir
     SAYI taşır (kabul ölçütü: «adıyla ve sayısıyla»). */
  function etiketGecerliMi(etiket){
    const e = String(etiket == null ? '' : etiket);
    return !!e.trim() && !YASAK_ETIKET.test(e) && /\d/.test(e);
  }

  /* Sayısı bilinmeyen yıkıcı düğme yine çizilir (işlev saklanmaz) ama
     `data-eksik="sayi"` taşır: denetim onu bulur. */
  function yikiciDugme(o){
    o = o || {};
    const etiket = sonucEtiketi(o);
    const data = Object.assign({}, o.data || {});
    if(!sayiMi(o.sayi)) data.eksik = 'sayi';
    return dugme({ etiket:etiket, ton:'danger', act:o.act, data:data })
      .replace('<button ', '<button data-oz="022" ');
  }

  /* ------------------------------------------------ 111 seviye */

  /* Kimlikler modüllerin kataloğundaki dizelerdir (`data/actions.js`
     `level`); ekrana çıkan karşılıkları Türkçedir. */
  const SEVIYELER = ['kucuk', 'orta', 'buyuk'];
  const SEVIYE_AD = { kucuk:'küçük', orta:'orta', buyuk:'büyük' };

  /* Her seviyenin onay kalıbı (AGENTS.md §1.9):
       kucuk  tek dokunuş + «Geri al»
       orta   önizleme + tek onay
       buyuk  önce/sonra + onay + dönüş noktası */
  const KALIPLAR = Object.freeze({
    kucuk:Object.freeze({ seviye:'kucuk', onizleme:false, onay:false, oncesonra:false, donusNoktasi:false, geriAl:true }),
    orta:Object.freeze({ seviye:'orta', onizleme:true, onay:true, oncesonra:false, donusNoktasi:false, geriAl:true }),
    buyuk:Object.freeze({ seviye:'buyuk', onizleme:true, onay:true, oncesonra:true, donusNoktasi:true, geriAl:true }),
  });

  /* Katalog iki biçimde gelir: dizi (`R.ACTIONS`) ya da kimlikten kayda
     harita (`R.ACTION_BY_ID`). */
  function katalogKaydi(katalog, id){
    if(!katalog || id == null) return null;
    if(Array.isArray(katalog)){
      for(let i = 0; i < katalog.length; i++) if(katalog[i] && katalog[i].id === id) return katalog[i];
      return null;
    }
    return Object.prototype.hasOwnProperty.call(katalog, id) ? katalog[id] : null;
  }

  /* 111 — onay kalıbı. Seviye YALNIZ katalogdan okunur: önerinin kendi
     `level`/`seviye` alanı (modelin yazdığı) yok sayılır ve bu dönüşte
     söylenir. Katalogda olmayan aksiyonun kalıbı YOKTUR (null): kapalı
     katalog dışından gelen bir öneri kartlanmaz.

     Geri alınamayan bir aksiyon küçük SAYILAMAZ (§1.9): katalog yanlışlıkla
     `kucuk` yazsa bile en az `orta` olur. Bilinmeyen seviye en çok onayı
     isteyen kalıba düşer — sormadan uygulamak geri dönüşü olmayan hatadır,
     fazladan sormak değildir. */
  function kalip(oneri, katalog){
    const id = oneri && (oneri.eylem != null ? oneri.eylem : oneri.action);
    const kayit = katalogKaydi(katalog, id);
    if(!kayit) return null;
    let sev = kayit.level != null ? kayit.level : kayit.seviye;
    if(SEVIYELER.indexOf(sev) < 0) sev = 'buyuk';
    if(sev === 'kucuk' && kayit.geriAlinamaz) sev = 'orta';
    const onerilen = oneri.level != null ? oneri.level : oneri.seviye;
    return Object.assign({}, KALIPLAR[sev], {
      eylem:id,
      yokSayilan:onerilen != null && onerilen !== sev ? String(onerilen) : null,
    });
  }

  function seviyeRozeti(sev){
    return '<span class="badge badge--muted okart__seviye" data-seviye="' + kac(sev) + '">' + kac(SEVIYE_AD[sev] || sev) + '</span>';
  }

  /* ------------------------------------------------ 116 otomatik */

  /* Ayar: { mod:'istek'|'hepsi'|'hicbiri', turler:{ <eylem>:true|false } }
     `mod`, üç arayüzde bugün var olan `otomatikUygula` ayarıdır; tür
     anahtarı onun ÜSTÜNE yazılır. Anahtar dokunulmamışsa mod geçerlidir.
     Eski ayar düz dize olarak gelirse mod sayılır.

     Hiçbir ayarda sormadan UYGULANMAYANLAR:
       · küçük olmayan her şey (katalog seviyesiyle — 111)
       · ölçüm yazan aksiyon (`olcum:true`, ekip/HATALAR.md KR-1)
       · çakışma çözümü (112: son sözü kullanıcı söyler) */
  const MODLAR = ['istek', 'hepsi', 'hicbiri'];

  function ayarOku(ayar){
    if(typeof ayar === 'string') return { mod:ayar, turler:{} };
    const a = ayar || {};
    return { mod:a.mod != null ? a.mod : a.otomatikUygula, turler:a.turler || {} };
  }

  function sormadanMi(oneri, katalog, ayar, baglam){
    baglam = baglam || {};
    if(baglam.cakisma || (oneri && oneri.cakisma)) return false;
    const k = kalip(oneri, katalog);
    if(!k || k.seviye !== 'kucuk') return false;
    const kayit = katalogKaydi(katalog, k.eylem);
    if(kayit && kayit.olcum) return false;
    const a = ayarOku(ayar);
    if(Object.prototype.hasOwnProperty.call(a.turler, k.eylem)) return a.turler[k.eylem] === true;
    const m = MODLAR.indexOf(a.mod) >= 0 ? a.mod : 'istek';
    if(m === 'hicbiri') return false;
    if(m === 'hepsi') return true;
    const kaynak = baglam.kaynak != null ? baglam.kaynak : (oneri && oneri.source);
    return kaynak === 'istek';
  }

  /* Ayarlar › Merkez listesinin satırları. Küçük olmayan ve ölçüm yazan
     türün anahtarı KİLİTLİDİR ve nedeni yazılır. */
  function ayarSatirlari(katalog, ayar){
    const a = ayarOku(ayar);
    const liste = Array.isArray(katalog) ? katalog
      : Object.keys(katalog || {}).map(k => katalog[k]);
    return liste.filter(x => x && x.id).map(x => {
      const k = kalip({ eylem:x.id }, liste);
      const sev = k.seviye;
      let kilit = null;
      if(sev !== 'kucuk') kilit = SEVIYE_AD[sev] + ' aksiyon: her zaman sorar';
      else if(x.olcum) kilit = 'ölçüm yazar: her zaman sorar';
      const acik = !kilit && sormadanMi({ eylem:x.id }, liste, a, { kaynak:'istek' })
        && (Object.prototype.hasOwnProperty.call(a.turler, x.id) ? a.turler[x.id] === true : a.mod === 'hepsi');
      return { id:x.id, baslik:x.title || x.baslik || x.id, seviye:sev, acik:!!acik, kilitli:!!kilit, neden:kilit };
    });
  }

  function ayarHtml(katalog, ayar){
    const satir = ayarSatirlari(katalog, ayar);
    return '<ul class="otoayar" data-oz="116">' + satir.map(s => {
      const id = 'oto-' + s.id.replace(/[^a-zA-Z0-9_-]/g, '');
      return '<li class="otoayar__s' + (s.kilitli ? ' otoayar__s--kilitli' : '') + '">'
        + '<label class="otoayar__et" for="' + kac(id) + '">'
        + '<span class="otoayar__ad">' + kac(s.baslik) + '</span>'
        + seviyeRozeti(s.seviye)
        + (s.neden ? '<span class="otoayar__neden">' + kac(s.neden) + '</span>' : '')
        + '</label>'
        + '<input type="checkbox" role="switch" class="otoayar__anahtar" id="' + kac(id) + '"'
        + ' data-act="otomatik-tur" data-eylem="' + kac(s.id) + '"'
        + (s.acik ? ' checked' : '') + (s.kilitli ? ' disabled aria-disabled="true"' : '') + '>'
        + '</li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------ 114 gerekçe */

  /* g = { etiket:'Tekrar borcu', deger:34, esik:10, birim:'%',
           kesinlik:'computed', olcek (çubuğun üst sınırı), not:'yalnız bugün' }
     cumle = { metin, kaynak:'model'|'kural' } — AYRI öğe, sayının altında.
     Model kapalıyken cümle ya kuralın hazır cümlesidir ya hiç yoktur;
     sayı ve çubuk her durumda kalır. */
  function gerekceHtml(g, cumle){
    g = g || {};
    const sayi = L.SAYI ? L.SAYI.html({ deger:g.deger, birim:g.birim, kesinlik:g.kesinlik || 'computed',
      formul:g.formul, girdiler:g.girdiler, zaman:g.zaman }) : kac(g.deger);
    const var_ = sayiMi(g.deger);
    let cubuk = '';
    if(var_ && sayiMi(g.esik)){
      const ust = sayiMi(g.olcek) && g.olcek > 0 ? g.olcek : Math.max(g.deger, g.esik) * 1.25 || 1;
      const yuzde = v => Math.max(0, Math.min(100, Math.round(v / ust * 1000) / 10));
      cubuk = '<span class="gerekce__cubuk" aria-hidden="true">'
        + '<span class="gerekce__dolu" style="width:' + yuzde(g.deger) + '%"></span>'
        + '<span class="gerekce__esik" style="left:' + yuzde(g.esik) + '%"></span></span>';
    }
    const esikMetni = sayiMi(g.esik) ? '<span class="gerekce__ek">eşik ' + kac(birimli(bicim(g.esik), g.birim)) + '</span>' : '';
    const notMetni = g.not ? '<span class="gerekce__ek">' + kac(g.not) + '</span>' : '';
    const cm = cumle && cumle.metin
      ? '<p class="gerekce__cumle" data-kaynak="' + kac(cumle.kaynak === 'kural' ? 'kural' : 'model') + '">'
        + kac(cumle.metin) + '</p>'
      : '';
    return '<div class="gerekce" data-oz="114">'
      + '<div class="gerekce__satir">' + (g.etiket ? '<span class="gerekce__et">' + kac(g.etiket) + '</span>' : '')
      + sayi + esikMetni + notMetni + '</div>'
      + cubuk + cm + '</div>';
  }

  /* ------------------------------------------------ 121 kural izi */

  const KARSILASTIRMA = { '>=':'≥', '<=':'≤', '>':'>', '<':'<', '=':'=' };

  /* k = { no:'R-12', ad:'Tekrar borcu eşiği', deger:34, esik:10, birim:'%', kosul:'>=' } */
  function kuralMetni(k){
    const d = sayiMi(k.deger) ? birimli(bicim(k.deger, k.ondalik), k.birim) : '—';
    const e = sayiMi(k.esik) ? birimli(bicim(k.esik, k.ondalik), k.birim) : null;
    return e ? d + ' ' + (KARSILASTIRMA[k.kosul] || '≥') + ' ' + e : d;
  }

  function kuralIziHtml(kurallar){
    const ks = (kurallar || []).filter(k => k && k.no);
    if(!ks.length) return '';
    return '<details class="kuralizi" data-oz="121"><summary>Neden?</summary><ol class="kuralizi__l">'
      + ks.map(k => '<li class="kuralizi__k"><span class="kuralizi__no">' + kac(k.no) + '</span>'
        + '<span class="kuralizi__ad">' + kac(k.ad || '') + '</span>'
        + '<span class="kuralizi__deger">' + kac(kuralMetni(k)) + '</span></li>').join('')
      + '</ol></details>';
  }

  /* ------------------------------------------------ 110 kart */

  /* Kartın gösterilebilir olup olmadığı. Sorun listesi boşsa geçerli.
     Merkez önerisi kural izi TAŞIMAK ZORUNDADIR (121): tetikleyen kuralı
     olmayan bir Merkez önerisi, kodun değil modelin kararıdır. */
  function dogrula(oneri, katalog){
    const s = [];
    if(!oneri) return ['öneri yok'];
    if(!kalip(oneri, katalog)) s.push('aksiyon katalogda yok');
    if(!oneri.baslik) s.push('başlık yok');
    if(oneri.kaynak === 'merkez' && !(oneri.kurallar || []).some(k => k && k.no)) s.push('kural izi yok');
    return s;
  }

  /* oneri = { id, eylem, baslik, kaynak:'merkez'|'modul',
               gerekce:{…114}, cumle:{ metin, kaynak }, kurallar:[…121],
               kapsam:'yalnız bugün' }
     Geçersiz öneri BOŞ dize döner: kart çizilmez (HKM kapalıyken
     `kingteklif.js` de aynı şeyi yapar — bilinmeyeni göstermez). */
  function kartHtml(oneri, katalog){
    if(dogrula(oneri, katalog).length) return '';
    const k = kalip(oneri, katalog);
    const merkez = oneri.kaynak === 'merkez';
    const kid = 'oneri-' + String(oneri.id || oneri.eylem).replace(/[^a-zA-Z0-9_-]/g, '');
    let eylem;
    if(k.seviye === 'kucuk'){
      eylem = dugme({ etiket:'Uygula', act:'oneri-uygula', data:{ oneri:oneri.id } })
        + dugme({ etiket:'Geç', ton:'ghost', act:'oneri-gec', data:{ oneri:oneri.id } });
    }else{
      eylem = dugme({ etiket:k.seviye === 'buyuk' ? 'Önce / sonra' : 'Önizle', act:'oneri-onizle',
        data:{ oneri:oneri.id, seviye:k.seviye } })
        + dugme({ etiket:'Geç', ton:'ghost', act:'oneri-gec', data:{ oneri:oneri.id } });
    }
    const alt = [SEVIYE_AD[k.seviye] + ' aksiyon'];
    if(oneri.kapsam) alt.push(oneri.kapsam);
    if(k.geriAl) alt.push('geri alınabilir');
    return '<article class="kutu okart ' + (merkez ? 'okart--merkez' : 'okart--modul') + '" data-oz="110"'
      + ' data-seviye="' + k.seviye + '" data-oneri="' + kac(oneri.id || '') + '" aria-labelledby="' + kid + '">'
      + '<div class="okart__bas"><span class="okart__kaynak">' + (merkez ? 'Merkez önerisi' : 'Öneri') + '</span>'
      + seviyeRozeti(k.seviye) + '</div>'
      + (oneri.capraz ? caprazHtml(oneri.capraz) : '')
      + '<h3 class="okart__baslik" id="' + kid + '">' + kac(oneri.baslik) + '</h3>'
      + '<p class="okart__alt">' + kac(alt.join(' · ')) + '</p>'
      + (oneri.gerekce ? gerekceHtml(oneri.gerekce, oneri.cumle) : '')
      + kuralIziHtml(oneri.kurallar)
      + '<div class="okart__eylem">' + eylem + '</div></article>';
  }

  /* Öneri alanında en çok BİR kart durur (EKIP-PLANI Ek A · 110); fazlası
     Onaylar'dadır. Sıra: büyük önce değil, ÖNCE GELEN önce — öncelik
     sırasını modül verir, burada yalnız geçersizler elenir. */
  function alan(liste, katalog){
    const gecerli = (liste || []).filter(o => !dogrula(o, katalog).length);
    return { kart:gecerli[0] || null, kalan:Math.max(0, gecerli.length - 1),
      kalanMetni:gecerli.length > 1 ? (gecerli.length - 1) + ' öneri daha Onaylar’da' : '' };
  }

  /* ------------------------------------------------ 112 çakışma */

  function dakika(s){
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || ''));
    if(!m) return null;
    const h = +m[1], d = +m[2];
    return h > 24 || d > 59 ? null : h * 60 + d;
  }

  /* İki blok aynı saati istiyor mu? { modul, ad, bas:'20:30', bit:'21:40' }
     Saati okunamayan blok ÇAKIŞMAZ sayılmaz ve çakışır da sayılmaz:
     `null` döner — bilinmeyen, bilinmeyen olarak kalır. */
  function cakisma(a, b){
    const a1 = dakika(a && a.bas), a2 = dakika(a && a.bit), b1 = dakika(b && b.bas), b2 = dakika(b && b.bit);
    if([a1, a2, b1, b2].some(v => v == null) || a2 <= a1 || b2 <= b1) return null;
    const bas = Math.max(a1, b1), bit = Math.min(a2, b2);
    return bit > bas ? { dakika:bit - bas, bas:bas, bit:bit } : { dakika:0 };
  }

  /* Çözüm YALNIZ açık onayla uygulanabilir. Ayar, seviye ya da kaynak
     ne olursa olsun: son sözü kullanıcı söyler. */
  function cozumUygulanabilirMi(onay){
    return onay === true;
  }

  const saatMetni = d => ('0' + Math.floor(d / 60)).slice(-2) + ':' + ('0' + (d % 60)).slice(-2);

  /* c = { a:{modul,ad,bas,bit}, b:{…}, cozum:{ baslik, id } } */
  function cakismaHtml(c){
    c = c || {};
    const r = cakisma(c.a, c.b);
    if(!r || !r.dakika) return '';
    const taraf = x => '<div class="cakisma__taraf cakisma--' + kac(x.modul || '') + '">'
      + '<span class="cakisma__modul">' + kac((x.modul || '').toLocaleUpperCase('tr-TR')) + '</span>'
      + '<b class="cakisma__ad">' + kac(x.ad || '') + '</b>'
      + '<span class="cakisma__saat">' + kac(x.bas + '–' + x.bit) + '</span></div>';
    const cozum = c.cozum && c.cozum.baslik
      ? '<div class="cakisma__cozum"><span class="okart__kaynak">Merkez önerisi</span>'
        + '<p class="cakisma__cozum-metin">' + kac(c.cozum.baslik) + '</p>'
        + dugme({ etiket:'Çözümü önizle', act:'cakisma-onizle', data:{ cozum:c.cozum.id || '' } })
        + '</div>'
      : '';
    return '<section class="cakisma" data-oz="112" aria-label="Çakışma: '
      + kac(saatMetni(r.bas) + '–' + saatMetni(r.bit)) + '">'
      + '<p class="cakisma__bas">' + kac(r.dakika + ' dakika çakışıyor · ' + saatMetni(r.bas) + '–' + saatMetni(r.bit)) + '</p>'
      + '<div class="cakisma__iki">' + taraf(c.a) + taraf(c.b) + '</div>' + cozum + '</section>';
  }

  /* ------------------------------------------------ 150 geri al */

  /* Şeridin ömrü. Üç arayüzün `ui.js` toast'ı bugün 6000 ms kullanıyor;
     aynı sayı burada durur ki çizgi ile şerit aynı anda bitsin. */
  const GERI_AL_MS = 6000;

  function kalan(baslangic, sure, simdi){
    const s = sayiMi(sure) && sure > 0 ? sure : GERI_AL_MS;
    const g = (simdi == null ? Date.now() : simdi) - baslangic;
    return Math.max(0, Math.min(s, s - g));
  }

  /* Geri al denetçisi. `geriAl()` yalnız süre içinde çalışır; süre
     dolunca `kalici()` bir kez çağrılır ve geri alma kapanır — «Geri al»
     ekranda kalıp çalışmasaydı kullanıcıya yalan söylerdi. */
  function geriAlBaslat(o){
    o = o || {};
    const sure = sayiMi(o.sure) && o.sure > 0 ? o.sure : GERI_AL_MS;
    const bas = Date.now();
    let durum = 'acik';
    const bitir = () => {
      if(durum !== 'acik') return;
      durum = 'kalici';
      try{ if(o.kalici) o.kalici(); }catch(e){}
    };
    const t = setTimeout(bitir, sure);
    return {
      sure:sure,
      durum:() => durum,
      kalan:simdi => durum === 'acik' ? kalan(bas, sure, simdi) : 0,
      geriAl:() => {
        if(durum !== 'acik') return false;
        durum = 'geri-alindi';
        clearTimeout(t);
        try{ if(o.geriAl) o.geriAl(); }catch(e){}
        return true;
      },
    };
  }

  /* Şeridin altındaki incelen çizgi (DOM). Süre VERİDİR, tasarım süresi
     değil: çizgi şeritle aynı anda biter. Azaltılmış harekette çizgi
     saniye saniye kısalır (kart.css) — kalan süre bilgisi kaybolmaz. */
  function cizgi(sure){
    const s = sayiMi(sure) && sure > 0 ? sure : GERI_AL_MS;
    const el = document.createElement('span');
    el.className = 'gerial__sure';
    el.setAttribute('data-oz', '150');
    el.setAttribute('aria-hidden', 'true');
    el.style.animationDuration = s + 'ms';
    el.style.setProperty('--gerial-adim', String(Math.max(1, Math.round(s / 1000))));
    return el;
  }


  /* ------------------------------------------------ 127 kapsam */

  /* Kural 9 (AGENTS.md §1.9): süre uzadıkça seviye büyür. Kapsam seviyeyi
     yalnız YÜKSELTİR; kataloğu orta olan bir aksiyon «yalnız bugün»
     seçilince küçülmez. */
  const KAPSAMLAR = Object.freeze([
    Object.freeze({ id:'bugun', ad:'Yalnız bugün', seviye:'kucuk' }),
    Object.freeze({ id:'hafta', ad:'Bu hafta', seviye:'orta' }),
    Object.freeze({ id:'kalici', ad:'Kalıcı', seviye:'buyuk' }),
  ]);
  const KALIP_OZET = { kucuk:'tek dokunuş, «Geri al» kalır', orta:'önizleme ve tek onay',
    buyuk:'önce/sonra, onay ve dönüş noktası' };

  function kapsamSeviyesi(oneri, katalog, kapsamId){
    const k = kalip(oneri, katalog);
    if(!k) return null;
    const kp = KAPSAMLAR.filter(x => x.id === kapsamId)[0];
    if(!kp) return k.seviye;
    return SEVIYELER[Math.max(SEVIYELER.indexOf(k.seviye), SEVIYELER.indexOf(kp.seviye))];
  }

  function kapsamHtml(oneri, katalog, secili){
    if(!kalip(oneri, katalog)) return '';
    const ad = 'kapsam-' + String((oneri && (oneri.id || oneri.eylem)) || 'x').replace(/[^a-zA-Z0-9_-]/g, '');
    return '<fieldset class="kapsam" data-oz="127"><legend class="kapsam__bas">Ne kadar süre?</legend>'
      + KAPSAMLAR.map(kp => {
        const sev = kapsamSeviyesi(oneri, katalog, kp.id);
        const id = ad + '-' + kp.id;
        return '<label class="kapsam__s" for="' + id + '"><input type="radio" name="' + ad + '" id="' + id + '"'
          + ' value="' + kp.id + '" data-act="oneri-kapsam" data-seviye="' + sev + '"' + (secili === kp.id ? ' checked' : '') + '>'
          + '<span class="kapsam__ad">' + kac(kp.ad) + '</span>'
          + '<span class="kapsam__seviye">' + kac(SEVIYE_AD[sev] + ' aksiyon · ' + KALIP_OZET[sev]) + '</span></label>';
      }).join('') + '</fieldset>';
  }

  /* ------------------------------------------------ 123 geçme nedeni */

  /* «Geç» dendiğinde İSTEĞE BAĞLI neden. Önerinin neden işe yaramadığı
     tahminle değil kullanıcının sözüyle bilinir; neden seçmemek de bir
     cevaptır ve öyle yazılır (null). */
  const GECME_NEDENLERI = Object.freeze([
    Object.freeze({ id:'zaman-yok', ad:'Zamanım yok' }),
    Object.freeze({ id:'uymuyor', ad:'Bana uymuyor' }),
    Object.freeze({ id:'zaten-yaptim', ad:'Zaten yaptım' }),
    Object.freeze({ id:'veri-yanlis', ad:'Veri yanlış' }),
    Object.freeze({ id:'sonra', ad:'Sonra bakarım' }),
  ]);

  function gecmeHtml(oneri){
    const id = oneri && oneri.id != null ? String(oneri.id) : '';
    return '<div class="gecme" data-oz="123" role="group" aria-label="Neden geçiyorsun? (isteğe bağlı)">'
      + '<p class="gecme__bas">Neden geçiyorsun? <span class="gecme__ek">isteğe bağlı</span></p><div class="gecme__cipler">'
      + GECME_NEDENLERI.map(n => '<button type="button" class="chip chip--tap" data-act="oneri-gec-neden"'
        + ' data-oneri="' + kac(id) + '" data-neden="' + n.id + '">' + kac(n.ad) + '</button>').join('')
      + '</div>' + dugme({ etiket:'Nedensiz geç', ton:'ghost', boy:'sm', act:'oneri-gec-neden', data:{ oneri:id, neden:'' } })
      + '</div>';
  }

  /* Geçmişe yazılacak kayıt. Tanınmayan neden UYDURULMAZ: null olur. */
  function gecmeKaydi(oneri, nedenId, zaman){
    const n = GECME_NEDENLERI.filter(x => x.id === nedenId)[0] || null;
    return { oneri:oneri && oneri.id != null ? oneri.id : null, eylem:oneri ? (oneri.eylem || oneri.action || null) : null,
      neden:n ? n.id : null, nedenAd:n ? n.ad : null, zaman:zaman || new Date().toISOString() };
  }

  /* ------------------------------------------------ 124 çapraz etki */

  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP' };

  /* c = { kaynak:'spi', hedef:'ays', olcum:'Uyku 5,1 saat' }
     Kaynak ve hedef AYRI renkte, ok Merkez'in: Merkez her şeyi görür
     ama modülleri karıştırmaz. Aynı modül çapraz etki değildir. */
  function caprazHtml(c){
    c = c || {};
    if(!MODUL_AD[c.kaynak] || !MODUL_AD[c.hedef] || c.kaynak === c.hedef) return '';
    const sr = MODUL_AD[c.kaynak] + ' ölçümü ' + MODUL_AD[c.hedef] + '’ye öneri' + (c.olcum ? ': ' + c.olcum : '');
    return '<div class="capraz" data-oz="124" role="img" aria-label="' + kac(sr) + '">'
      + '<span class="capraz__modul capraz--' + c.kaynak + '" aria-hidden="true">' + MODUL_AD[c.kaynak] + '</span>'
      + '<svg class="capraz__ok" viewBox="0 0 20 10" aria-hidden="true"><path d="M1 5 H17 M13 1 L17 5 L13 9"/></svg>'
      + '<span class="capraz__modul capraz--' + c.hedef + '" aria-hidden="true">' + MODUL_AD[c.hedef] + '</span>'
      + (c.olcum ? '<span class="capraz__olcum" aria-hidden="true">' + kac(c.olcum) + '</span>' : '')
      + '</div>';
  }

  /* ------------------------------------------------ 113 önce / sonra */

  /* Bloklar: [{ id, ad, bas:'20:30', bit:'21:40', gun }]. Kimlikle eşlenir.
     Değişen yalnız ad ya da saat farkıdır; sıra değişikliği değişiklik
     sayılmaz (abartılmaz). */
  function onceSonra(once, sonra){
    const anah = b => b && b.id != null ? String(b.id) : null;
    const A = {}, B = {};
    (once || []).forEach(b => { const k = anah(b); if(k) A[k] = b; });
    (sonra || []).forEach(b => { const k = anah(b); if(k) B[k] = b; });
    const esit = (x, y) => x.ad === y.ad && x.bas === y.bas && x.bit === y.bit && (x.gun || null) === (y.gun || null);
    const r = { ayni:[], degisen:[], eklenen:[], silinen:[] };
    Object.keys(A).forEach(k => {
      if(!B[k]) r.silinen.push(A[k]);
      else if(esit(A[k], B[k])) r.ayni.push(B[k]);
      else r.degisen.push({ once:A[k], sonra:B[k] });
    });
    Object.keys(B).forEach(k => { if(!A[k]) r.eklenen.push(B[k]); });
    const parca = [];
    if(r.degisen.length) parca.push(r.degisen.length + ' değişti');
    if(r.eklenen.length) parca.push(r.eklenen.length + ' eklendi');
    if(r.silinen.length) parca.push(r.silinen.length + ' silindi');
    parca.push(r.ayni.length + ' aynı');
    r.ozet = (r.degisen.length + r.eklenen.length + r.silinen.length) ? parca.join(' · ') : 'Değişiklik yok';
    return r;
  }

  function onceSonraHtml(once, sonra){
    const r = onceSonra(once, sonra);
    const satir = (b, tur) => '<li class="oncesonra__b oncesonra__b--' + tur + '" data-blok="' + kac(b.id) + '">'
      + '<span class="oncesonra__saat">' + kac((b.bas || '—') + '–' + (b.bit || '—')) + '</span>'
      + '<span class="oncesonra__ad">' + kac(b.ad || '') + '</span></li>';
    const degisenId = {};
    r.degisen.forEach(d => { degisenId[String(d.once.id)] = 1; });
    const sil = {};
    r.silinen.forEach(b => { sil[String(b.id)] = 1; });
    const ekl = {};
    r.eklenen.forEach(b => { ekl[String(b.id)] = 1; });
    const sol = (once || []).filter(b => b && b.id != null).map(b =>
      satir(b, sil[String(b.id)] ? 'silinen' : degisenId[String(b.id)] ? 'degisen' : 'ayni')).join('');
    const sag = (sonra || []).filter(b => b && b.id != null).map(b =>
      satir(b, ekl[String(b.id)] ? 'eklenen' : degisenId[String(b.id)] ? 'degisen' : 'ayni')).join('');
    return '<div class="oncesonra" data-oz="113">'
      + '<p class="oncesonra__ozet">' + kac(r.ozet) + '</p><div class="oncesonra__iki">'
      + '<section class="oncesonra__yan"><h4 class="oncesonra__bas">Önce</h4><ol class="oncesonra__l">' + sol + '</ol></section>'
      + '<section class="oncesonra__yan"><h4 class="oncesonra__bas">Sonra</h4><ol class="oncesonra__l">' + sag + '</ol></section>'
      + '</div></div>';
  }

  L.ONERI = {
    SEVIYELER:SEVIYELER,
    SEVIYE_AD:SEVIYE_AD,
    KALIPLAR:KALIPLAR,
    MODLAR:MODLAR,
    GERI_AL_MS:GERI_AL_MS,
    katalogKaydi:katalogKaydi,
    kalip:kalip,
    sormadanMi:sormadanMi,
    ayarSatirlari:ayarSatirlari,
    ayarHtml:ayarHtml,
    gerekceHtml:gerekceHtml,
    kuralMetni:kuralMetni,
    kuralIziHtml:kuralIziHtml,
    dogrula:dogrula,
    kartHtml:kartHtml,
    alan:alan,
    cakisma:cakisma,
    cakismaHtml:cakismaHtml,
    cozumUygulanabilirMi:cozumUygulanabilirMi,
    kalan:kalan,
    geriAlBaslat:geriAlBaslat,
    cizgi:cizgi,
    dugme:dugme,
    YASAK_ETIKET:YASAK_ETIKET,
    sonucEtiketi:sonucEtiketi,
    etiketGecerliMi:etiketGecerliMi,
    yikiciDugme:yikiciDugme,
    KAPSAMLAR:KAPSAMLAR,
    kapsamSeviyesi:kapsamSeviyesi,
    kapsamHtml:kapsamHtml,
    GECME_NEDENLERI:GECME_NEDENLERI,
    gecmeHtml:gecmeHtml,
    gecmeKaydi:gecmeKaydi,
    caprazHtml:caprazHtml,
    onceSonra:onceSonra,
    onceSonraHtml:onceSonraHtml,
  };
})();
