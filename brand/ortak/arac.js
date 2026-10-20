/* ARAÇ KATALOĞU — King'in sistemde yapabildiği her işin tek tip listesi.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/arac.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibi (2026-10-20, King 2.0 B aşaması): «kullanıcı modüllere
   gitmeden King'le konuşarak her şeyi halledebilsin; isteyen yine
   modülden yapar».

   Sözler:
   1. TEK TİP ARAÇ. Her araç: ad (snake_case; modülün aracı `ays_`, `spi_`,
      `esp_` ile başlar), açıklama (Türkçe, modelin okuyacağı), parametreler
      (küçük bir JSON şeması: string/number/integer/boolean, enum, minimum,
      maximum, maxLength, required), tür «oku» ya da «yaz» ve uygulayan
      fonksiyon. «oku» hiçbir kaydı ve ayarı değiştirmez (sayfa açmak, kart
      göstermek, odak sayacı da okuma sayılır); «yaz» değiştirir.
   2. MODEL YALNIZ SEÇER (AGENTS §1.1). Model hangi aracı hangi parametreyle
      çağıracağını seçer; HKM doğrular (HKM/core/arac.py), burada BİR KEZ
      DAHA doğrulanır: bilinmeyen araç, tanımsız ya da eksik parametre,
      yanlış tip, enum dışı değer reddedilir ve tahminle düzeltilmez.
      Sayıyı ve kararı aracın kodu üretir.
   3. YAZAN ARAÇ ONAYSIZ UYGULANMAZ. «yaz» aracı önce `onizle` verir; King
      onu mevcut onay kartıyla gösterir (Onayla / Vazgeç; büyükte
      «Onaylıyorum»). Model seçtiği için küçük eylem de sorulur: seviye en az
      «orta»dır. Uygulama yalnız onayla, aracın `uygula`sıyla.
   4. MODELSİZ DE VAR. Katalog yalnız bir liste; araçları modülün ve King'in
      kodu çalıştırır. Model yokken kural yolları (NIYET, giriş kapısı,
      yetki.js) aynen sürer; `es` taşıyan okuma aracı kuralla da çağrılır.
   5. SİSTEM HARİTASI. «Bu sistemde ne var, nerede, nasıl yapılır?» sorusu
      buradan cevaplanır: modüllerin işleri (HARITA), sayfalar (King'in
      SAYFALAR kataloğu) ve bu modülün araçları (açıklama + örnek cümle).

   Araç tanımı:
     { ad, aciklama, tur:'oku'|'yaz', parametreler?, ornek?, es?, seviye?,
       kullanilir?():bool,
       calistir(param)  (oku) → { sonuc?, cevap?, satirlar?, yerine? }
       onizle(param)    (yaz) → { metin, satirlar? } | { veri } | { yetki } | { hata }
       uygula(param)    (yaz) → { metin, geriAl? } } */

window.LIFEOS = window.LIFEOS || {};

window.LIFEOS.ARAC = (function(){
  'use strict';

  const AD_RE = /^[a-z][a-z0-9_]{1,47}$/;
  const TIPLER = ['string', 'number', 'integer', 'boolean'];
  const TURLER = ['oku', 'yaz'];
  const MODUL_AD = { ays:'AYS', spi:'SPİ', esp:'ESP', hkm:'HKM' };
  const SONUC_EN_COK = 4000;

  /* Modüllerin işleri — sistem haritası (söz 5). Kodun cümlesi; model
     uydurmaz. Ayrıntı her modülün kendi kataloğundadır. */
  const HARITA = [
    { modul:'ays', ad:'AYS', is:'Sınav hazırlığı', alanlar:['günün planı ve blokları', 'soru, süre, paragraf, problem kaydı',
      'konu kapanışı ve konu öğrenme', 'deneme ve yanlış defteri', 'tekrar kartları', 'hafta programı ve hedefler', 'ilerleme ve analiz'] },
    { modul:'spi', ad:'SPİ', is:'Sağlık ve performans', alanlar:['uyku, su, kilo gibi günlük ölçümler', 'öğün ve besin',
      'antrenman ve hareket', 'tahliller ve ilaçlar', 'mutfak ve market bütçesi', 'haftalık planlar ve hatırlatmalar'] },
    { modul:'esp', ad:'ESP', is:'Kişisel gelişim', alanlar:['dil ve kelime kartları', 'okuma ve kitaplar', 'yazı taslakları',
      'felsefe argümanları', 'tarih olayları', 'müzik ve diksiyon çalışmaları', 'günlük çalışma oturumları'] },
    { modul:'hkm', ad:'HKM (Merkez)', is:'Merkez ve yapay zekâ', alanlar:['King’in yapay zekâsı ve modeller', 'haftalık değerlendirme ve çapraz bulgular',
      'araştırma ve program işleri', 'para kaydı', 'bildirim ve Telegram'] },
  ];

  let modul = null;
  let modulAraclar = [];
  let ortak = [];

  const kucuk = s => String(s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

  function kur(o){
    o = o || {};
    if(o.modul) modul = o.modul;
    modulAraclar = o.araclar || [];
    return api;
  }
  /* King'in kendi araçları (king.js kur; dizi ya da her çağrıda kuran fonksiyon):
     modülden önce gelir, ad çakışırsa kazanır. */
  function ortakKur(l){ ortak = Array.isArray(l) || typeof l === 'function' ? l : []; }
  function modulSec(m){ if(m) modul = m; }

  function semaGecerli(s){
    if(s == null) return true;
    if(typeof s !== 'object' || (s.type || 'object') !== 'object') return false;
    const p = s.properties || {};
    return Object.keys(p).every(k => p[k] && TIPLER.indexOf(p[k].type) >= 0);
  }
  function tanimGecerli(a){
    if(!a || !AD_RE.test(String(a.ad || '')) || TURLER.indexOf(a.tur) < 0) return false;
    if(!String(a.aciklama || '').trim() || !semaGecerli(a.parametreler)) return false;
    if(a.tur === 'oku') return typeof a.calistir === 'function';
    return typeof a.onizle === 'function' && typeof a.uygula === 'function';
  }
  function kullanilir(a){
    if(typeof a.kullanilir !== 'function') return true;
    try{ return !!a.kullanilir(); }catch(e){ return false; }
  }
  function liste(){
    let m = modulAraclar;
    if(typeof m === 'function'){ try{ m = m(); }catch(e){ m = []; } }
    let o = ortak;
    if(typeof o === 'function'){ try{ o = o(); }catch(e){ o = []; } }
    const gorulen = {};
    return (Array.isArray(o) ? o : []).concat(Array.isArray(m) ? m : []).filter(a => {
      if(!tanimGecerli(a) || gorulen[a.ad] || !kullanilir(a)) return false;
      gorulen[a.ad] = true;
      return true;
    });
  }
  function bul(ad){ return liste().find(a => a.ad === ad) || null; }
  const sema = a => a.parametreler || { type:'object', properties:{} };

  function tipUyar(tip, v){
    if(tip === 'string') return typeof v === 'string';
    if(tip === 'boolean') return typeof v === 'boolean';
    if(typeof v !== 'number' || !isFinite(v)) return false;
    return tip === 'integer' ? Math.floor(v) === v : true;
  }

  /* Söz 2: HKM/core/arac.py param_dogrula ile aynı kurallar. */
  function paramDogrula(s, p){
    if(p == null) p = {};
    if(typeof p === 'string'){ try{ p = JSON.parse(p || '{}'); }catch(e){ return { hata:'parametreler JSON değil' }; } }
    if(typeof p !== 'object' || Array.isArray(p)) return { hata:'parametreler bir nesne olmalı' };
    const props = s.properties || {};
    const fazla = Object.keys(p).filter(k => !props[k]);
    if(fazla.length) return { hata:'tanımsız parametre: ' + fazla.slice(0, 4).join(', ') };
    const eksik = (s.required || []).filter(k => p[k] == null || p[k] === '');
    if(eksik.length) return { hata:'eksik parametre: ' + eksik.join(', ') };
    const temiz = {};
    for(const k of Object.keys(p)){
      const d = props[k];
      let v = p[k];
      if(v == null) continue;
      if(!tipUyar(d.type, v)) return { hata:k + ' ' + d.type + ' olmalı' };
      if(Array.isArray(d.enum) && d.enum.indexOf(v) < 0) return { hata:k + ' izinli değerlerden biri olmalı' };
      if(typeof d.minimum === 'number' && v < d.minimum) return { hata:k + ' en az ' + d.minimum + ' olmalı' };
      if(typeof d.maximum === 'number' && v > d.maximum) return { hata:k + ' en çok ' + d.maximum + ' olmalı' };
      if(d.type === 'string'){
        v = v.trim();
        if(v.length > (d.maxLength || 2000)) return { hata:k + ' çok uzun' };
      }
      temiz[k] = v;
    }
    return { param:temiz };
  }

  function dogrula(ad, param){
    const a = bul(String(ad || ''));
    if(!a) return { ok:false, hata:'katalogda böyle bir araç yok' };
    const r = paramDogrula(sema(a), param);
    if(r.hata) return { ok:false, arac:a, hata:r.hata };
    return { ok:true, arac:a, param:r.param };
  }

  /* HKM'ye giden biçim: yalnız ad, açıklama, tür ve şema (fonksiyon gitmez). */
  function modelIcin(){
    return liste().map(a => {
      const o = { ad:a.ad, aciklama:String(a.aciklama).replace(/\s+/g, ' ').trim().slice(0, 400), tur:a.tur };
      if(a.parametreler) o.parametreler = a.parametreler;
      return o;
    });
  }

  function jsonGibi(v){
    try{ const s = JSON.stringify(v); return s === undefined ? null : JSON.parse(s.length > SONUC_EN_COK ? JSON.stringify({ kirpildi:true, ozet:s.slice(0, SONUC_EN_COK) }) : s); }
    catch(e){ return null; }
  }

  /* Okuma aracını çalıştırır. Dönüş: { ok, ad, param, sonuc, cevap, satirlar, yerine } */
  async function calistir(ad, param, baglam){
    const d = dogrula(ad, param);
    if(!d.ok) return { ok:false, ad, hata:d.hata };
    if(d.arac.tur !== 'oku') return { ok:false, ad, hata:'bu araç yazar; önce önizlenir' };
    let r = null;
    try{ r = await d.arac.calistir(d.param, baglam || {}); }catch(e){ return { ok:false, ad, hata:'çalışmadı: ' + ((e && e.message) || 'bilinmeyen hata') }; }
    r = r && typeof r === 'object' ? r : { sonuc:r };
    if(r.hata) return { ok:false, ad, hata:String(r.hata) };
    return { ok:true, ad:d.arac.ad, param:d.param, sonuc:r.sonuc === undefined ? null : jsonGibi(r.sonuc),
      cevap:r.cevap ? String(r.cevap) : '', satirlar:Array.isArray(r.satirlar) ? r.satirlar.map(String).slice(0, 12) : null,
      kartlar:Array.isArray(r.kartlar) ? r.kartlar : null, yerine:!!r.yerine };
  }

  /* Yazan aracın önizlemesi. Dönüş: { ok, tur:'yaz', ad, param, seviye, onizle } */
  async function onizle(ad, param, baglam){
    const d = dogrula(ad, param);
    if(!d.ok) return { ok:false, ad, hata:d.hata };
    if(d.arac.tur !== 'yaz') return { ok:false, ad, hata:'bu araç okur' };
    let o = null;
    try{ o = await d.arac.onizle(d.param, baglam || {}); }catch(e){ return { ok:false, ad, hata:'önizlenemedi: ' + ((e && e.message) || 'bilinmeyen hata') }; }
    if(!o || o.hata) return { ok:false, ad, hata:(o && o.hata) || 'önizlenemedi' };
    /* Söz 3: model seçtiği için küçük de sorulur. */
    const seviye = d.arac.seviye === 'buyuk' ? 'buyuk' : 'orta';
    return { ok:true, tur:'yaz', ad:d.arac.ad, param:d.param, seviye, onizle:o, aracAd:String(d.arac.ozetAd || d.arac.aciklama).split(/[.:;]/)[0] };
  }

  /* Onaydan sonra: aynı araç, aynı parametre (yeniden doğrulanır). */
  async function uygula(n){
    if(!n || !n.arac) return { ok:false, metin:'Uygulanacak bir şey yok.' };
    const d = dogrula(n.ad, n.param);
    if(!d.ok || d.arac.tur !== 'yaz') return { ok:false, metin:'Bu iş katalogda yok; hiçbir şeyi değiştirmedim.' };
    try{
      const r = await d.arac.uygula(d.param);
      if(r && r.ok === false) return { ok:false, metin:String(r.metin || r.why || 'Uygulanamadı.') };
      return Object.assign({ ok:true, metin:'Tamam.' }, r || {});
    }catch(e){
      return { ok:false, metin:'Uygulanamadı: ' + ((e && e.message) || 'bilinmeyen hata') };
    }
  }

  /* Söz 4: modelsiz okuma — `es` taşıyan okuma aracı kuralla çağrılır. */
  function kuralla(metin){
    const t = kucuk(metin);
    if(!t) return null;
    for(const a of liste()){
      if(a.tur !== 'oku' || !(a.es instanceof RegExp)) continue;
      if(a.es.test(t)) return { ad:a.ad, param:{} };
    }
    return null;
  }

  /* Söz 5: «… nasıl yapılır / nerede» için katalogda arama. */
  const ARA_DOLGU = /(^|\s)(bu|sistem\w*|nasıl|nerede|nereden|yapılır|yaparım|yapabilirim|girerim|eklerim|ekleyebilirim|bulurum|var|mı|mi|ne|neler|bir|şey|ben|benim|king|lütfen|için|ile)(?=\s|$)/g;
  function ara(metin, en){
    const k = kucuk(metin).replace(/[.,!?;:«»"']/g, ' ').replace(ARA_DOLGU, ' ').replace(ARA_DOLGU, ' ')
      .split(/\s+/).filter(w => w.length >= 3).map(w => w.slice(0, Math.max(4, w.length - 3)));
    if(!k.length) return [];
    return liste().map(a => {
      const metin2 = kucuk(a.aciklama + ' ' + (a.ornek || '') + ' ' + a.ad.replace(/_/g, ' '));
      return { a, p:k.filter(w => metin2.indexOf(w) >= 0).length };
    }).filter(x => x.p > 0).sort((x, y) => y.p - x.p).slice(0, en || 4).map(x => x.a);
  }

  /* Sistem haritası: modüller, bu modülün sayfaları ve araçları. */
  function harita(sayfalar){
    const s = Array.isArray(sayfalar) ? sayfalar : [];
    const l = liste();
    return {
      modul:MODUL_AD[modul] || '',
      moduller:HARITA.map(h => ({ ad:h.ad, is:h.is, alanlar:h.alanlar.slice(),
        sayfalar:s.filter(x => x.modul === h.modul).map(x => x.ad) })),
      okuma:l.filter(a => a.tur === 'oku').map(a => ({ ad:a.ad, ne:String(a.aciklama).split(/(?<=\.)\s/)[0], ornek:a.ornek || '' })),
      yazma:l.filter(a => a.tur === 'yaz').map(a => ({ ad:a.ad, ne:String(a.aciklama).split(/(?<=\.)\s/)[0], ornek:a.ornek || '' })),
    };
  }

  /* Söz 2: SAYI KULLANICININDIR. Modelin kayda çevirdiği cümledeki her sayı
     kullanıcının kendi cümlesinde (rakamla ya da yazıyla) geçmeli; geçmiyorsa
     model sayı uydurmuştur ve önizleme kurulmaz. */
  const BIRLER = { bir:1, iki:2, 'üç':3, 'dört':4, 'beş':5, 'altı':6, yedi:7, sekiz:8, dokuz:9 };
  const ONLAR = { on:10, yirmi:20, otuz:30, 'kırk':40, elli:50, 'altmış':60, 'yetmiş':70, seksen:80, doksan:90 };
  function sayilar(metin){
    const t = kucuk(metin);
    const out = [];
    (t.match(/\d+(?:[.,]\d+)?/g) || []).forEach(x => out.push(Number(x.replace(',', '.'))));
    let birikim = null;
    const bitir = () => { if(birikim != null) out.push(birikim); birikim = null; };
    t.replace(/[^a-zçğıöşü\s]/g, ' ').split(/\s+/).forEach(w => {
      if(BIRLER[w] != null){ birikim = (birikim != null && birikim % 10 === 0 && birikim >= 10 ? birikim : (birikim != null ? (bitir(), 0) : 0)) + BIRLER[w]; }
      else if(ONLAR[w] != null){ birikim = (birikim != null && birikim % 100 === 0 && birikim >= 100 ? birikim : (birikim != null ? (bitir(), 0) : 0)) + ONLAR[w]; }
      else if(w === 'yüz'){ birikim = (birikim || 1) * 100; }
      else if(w === 'bin'){ birikim = (birikim || 1) * 1000; }
      else if(w === 'buçuk' && birikim != null){ birikim += 0.5; bitir(); }
      else if(w === 'yarım'){ bitir(); out.push(0.5); }
      else bitir();
    });
    bitir();
    return out;
  }
  function sayiKorunur(asil, yeni){
    const a = sayilar(asil);
    return sayilar(yeni).every(n => a.some(m => Math.abs(m - n) < 1e-9));
  }

  function _sifirla(){ modul = null; modulAraclar = []; ortak = []; }

  const api = { kur, ortakKur, modulSec, liste, bul, dogrula, paramDogrula, modelIcin, calistir, onizle, uygula,
    kuralla, ara, harita, sayilar, sayiKorunur, HARITA, MODUL_AD, kuruluMu:() => liste().length > 0, _sifirla };
  return api;
})();
