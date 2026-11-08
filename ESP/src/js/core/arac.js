/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/arac.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
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
      Güven kademesi (KING-4 §G): «oku» serbest, «yaz» onaylı, `dis:true`
      (bilgisayar, telefon; dış dünya) ayrıca izinli: hep «yaz» akışından ve
      «Onaylıyorum» kartından geçer, izni HKM ayrıca denetler. `kademe(a)`.
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
     { ad, aciklama, tur:'oku'|'yaz', parametreler?, ornek?, anahtar?, es?, kural?(t, metin):param|true|null, seviye?,
       kullanilir?():bool,
       calistir(param)  (oku) → { sonuc?, cevap?, satirlar?, yerine? }
       onizle(param)    (yaz) → { metin, satirlar? } | { veri } | { yetki } | { hata }
       uygula(param)    (yaz) → { metin, geriAl? } } */
window.LIFEOS.PARCA.yazilar({
  'ortak.arac.sinav-hazirligi':'Sınav hazırlığı',
  'ortak.arac.saglik-ve-performans':'Sağlık ve performans',
  'ortak.arac.kisisel-gelisim':'Kişisel gelişim',
  'ortak.arac.merkez-ve-yapay-zeka':'Merkez ve yapay zekâ',
  'ortak.arac.king-in-yapay-zekasi-ve-mode':'King’in yapay zekâsı ve modeller',
  'ortak.arac.ays-sinav':'AYS · sınav',
  'ortak.arac.spi-saglik':'SPİ · sağlık',
  'ortak.arac.esp-gelisim':'ESP · gelişim',
  'ortak.arac.king-her-modulde':'King · her modülde',
});

window.LIFEOS.PARCA.yazilar({
  'ortak.arac.ays':'AYS',
  'ortak.arac.spi':'SPİ',
  'ortak.arac.esp':'ESP',
  'ortak.arac.hkm-merkez':'HKM (Merkez)',
  'ortak.arac.soruyu-coz':'Soruyu çöz',
  'ortak.arac.soru-ve-sure-kaydi':'Soru ve süre kaydı',
  'ortak.arac.plani-degistir':'Planı değiştir',
  'ortak.arac.neye-calisayim':'Neye çalışayım',
  'ortak.arac.denemelerim':'Denemelerim',
  'ortak.arac.barkodu-oku':'Barkodu oku',
  'ortak.arac.ogun-olarak-oku':'Öğün olarak oku',
  'ortak.arac.olcum-ve-ogun-kaydi':'Ölçüm ve öğün kaydı',
  'ortak.arac.besin-degeri':'Besin değeri',
  'ortak.arac.uyku-ortalamasi':'Uyku ortalaması',
  'ortak.arac.tahliller':'Tahliller',
  'ortak.arac.kitap-sayfasini-oku':'Kitap sayfasını oku',
  'ortak.arac.calisma-oturumu':'Çalışma oturumu',
  'ortak.arac.kelime-karti':'Kelime kartı',
  'ortak.arac.alinti-kaydet':'Alıntı kaydet',
  'ortak.arac.kitabi-bitir':'Kitabı bitir',
  'ortak.arac.odak-sayaci':'Odak sayacı',
  'ortak.arac.bekleyen-oneriler':'Bekleyen öneriler',
  'ortak.arac.deftere-not':'Deftere not',
  'ortak.arac.gorunum':'Görünüm',
  'ortak.arac.haftalik-degerlendirme':'Haftalık değerlendirme',
  'ortak.arac.uygulanacak-bir-sey-yok':'Uygulanacak bir şey yok.',
  'ortak.arac.bu-is-katalogda-yok-hicbir':'Bu iş katalogda yok; hiçbir şeyi değiştirmedim.',
  'ortak.arac.uygulanamadi':'Uygulanamadı: ',
});


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
    { modul:'ays', ad:yz('ortak.arac.ays'), is:yz('ortak.arac.sinav-hazirligi'), alanlar:['günün planı ve blokları', 'soru, süre, paragraf, problem kaydı',
      'konu kapanışı ve konu öğrenme', 'deneme ve yanlış defteri', 'tekrar kartları', 'hafta programı ve hedefler', 'ilerleme ve analiz'] },
    { modul:'spi', ad:yz('ortak.arac.spi'), is:yz('ortak.arac.saglik-ve-performans'), alanlar:['uyku, su, kilo gibi günlük ölçümler', 'öğün ve besin',
      'antrenman ve hareket', 'tahliller ve ilaçlar', 'mutfak ve market bütçesi', 'haftalık planlar ve hatırlatmalar'] },
    { modul:'esp', ad:yz('ortak.arac.esp'), is:yz('ortak.arac.kisisel-gelisim'), alanlar:['dil ve kelime kartları', 'okuma ve kitaplar', 'yazı taslakları',
      'felsefe argümanları', 'tarih olayları', 'müzik ve diksiyon çalışmaları', 'günlük çalışma oturumları'] },
    { modul:'hkm', ad:yz('ortak.arac.hkm-merkez'), is:yz('ortak.arac.merkez-ve-yapay-zeka'), alanlar:[yz('ortak.arac.king-in-yapay-zekasi-ve-mode'), 'haftalık değerlendirme ve çapraz bulgular',
      'araştırma ve program işleri', 'para kaydı', 'bildirim ve Telegram'] },
  ];

  /* Söz 6: tek alan. tur «foto» (kamera ya da fotoğraf; modülün ayar.foto
     girdisiyle aynı id) ya da «cumle» (örnek cümle). */
  const ISLER = [
    { modul:'ays', id:'soru', tur:'foto', route:'solve', ad:yz('ortak.arac.soruyu-coz'), ne:'soru fotoğrafı ya da kamera; Soru çöz’e konur' },
    { modul:'ays', tur:'cumle', ad:yz('ortak.arac.soru-ve-sure-kaydi'), ornek:'matematikten 40 soru çözdüm' },
    { modul:'ays', tur:'cumle', ad:yz('ortak.arac.plani-degistir'), ornek:'bu hafta ara ver' },
    { modul:'ays', tur:'cumle', ad:yz('ortak.arac.neye-calisayim'), ornek:'neye çalışayım' },
    { modul:'ays', tur:'cumle', ad:yz('ortak.arac.denemelerim'), ornek:'son denemelerim nasıl' },
    { modul:'spi', id:'barkod', tur:'foto', route:'meals', ad:yz('ortak.arac.barkodu-oku'), ne:'kamera ya da fotoğraf; ürünün besin değeri, öğün önerisi' },
    { modul:'spi', id:'ogun', tur:'foto', route:'meals', ad:yz('ortak.arac.ogun-olarak-oku'), ne:'tabağın fotoğrafı; Fotoğraftan öğün açılır' },
    { modul:'spi', tur:'cumle', ad:yz('ortak.arac.olcum-ve-ogun-kaydi'), ornek:'7 saat uyudum, 2 yumurta yedim' },
    { modul:'spi', tur:'cumle', ad:yz('ortak.arac.besin-degeri'), ornek:'yulafın besin değeri' },
    { modul:'spi', tur:'cumle', ad:yz('ortak.arac.uyku-ortalamasi'), ornek:'son bir haftada uykum nasıl' },
    { modul:'spi', tur:'cumle', ad:yz('ortak.arac.tahliller'), ornek:'son tahlillerim' },
    { modul:'esp', id:'sayfa', tur:'foto', route:'library', ad:yz('ortak.arac.kitap-sayfasini-oku'), ne:'kamera ya da fotoğraf; alıntı ve kelime kartı' },
    { modul:'esp', tur:'cumle', ad:yz('ortak.arac.calisma-oturumu'), ornek:'45 dk gitar' },
    { modul:'esp', tur:'cumle', ad:yz('ortak.arac.kelime-karti'), ornek:'serendipity kelimesini kart yap: güzel bir tesadüf' },
    { modul:'esp', tur:'cumle', ad:yz('ortak.arac.alinti-kaydet'), ornek:'alıntı: Bir insanın değeri, sevdiği şeylerin değeridir' },
    { modul:'esp', tur:'cumle', ad:yz('ortak.arac.kitabi-bitir'), ornek:'kitabı bitirdim' },
    { modul:'king', tur:'cumle', ad:yz('ortak.arac.odak-sayaci'), ornek:'25 dakika matematik çalışalım' },
    { modul:'king', tur:'cumle', ad:yz('ortak.arac.bekleyen-oneriler'), ornek:'bekleyen öneriler' },
    { modul:'king', tur:'cumle', ad:yz('ortak.arac.deftere-not'), ornek:'deftere not: ' },
    { modul:'king', tur:'cumle', ad:yz('ortak.arac.gorunum'), ornek:'koyu temaya geç' },
    { modul:'king', tur:'cumle', ad:yz('ortak.arac.haftalik-degerlendirme'), ornek:'haftalık değerlendirme' },
  ];
  const GRUP_AD = { ays:yz('ortak.arac.ays-sinav'), spi:yz('ortak.arac.spi-saglik'), esp:yz('ortak.arac.esp-gelisim'), king:yz('ortak.arac.king-her-modulde') };
  /* Modüle göre gruplu liste; bulunulan modül önce, King'in ortak işleri sonda. */
  function isler(){
    const sira = [modul].concat(['ays', 'spi', 'esp']).filter((m, i, a) => m && a.indexOf(m) === i && m !== 'king').concat(['king']);
    return sira.map(m => ({ modul:m, ad:GRUP_AD[m] || m, burada:m === modul || m === 'king',
      isler:ISLER.map((x, i) => Object.assign({ i }, x)).filter(x => x.modul === m) })).filter(g => g.isler.length);
  }
  function isAra(metin){
    const k = kucuk(metin).replace(/[.,!?;:«»"']/g, ' ').split(/\s+/).filter(w => w.length >= 3).map(w => w.slice(0, Math.max(4, w.length - 3)));
    if(!k.length) return [];
    return ISLER.filter(x => { const t = kucuk(x.ad + ' ' + (x.ne || '') + ' ' + (x.ornek || '')); return k.some(w => t.indexOf(w) >= 0); });
  }

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
    if(a.tur === 'oku') return !a.dis && typeof a.calistir === 'function';
    return typeof a.onizle === 'function' && typeof a.uygula === 'function';
  }
  const kademe = a => a.dis ? 'dis' : a.tur === 'yaz' ? 'yaz' : 'oku';
  function kullanilir(a){
    if(typeof a.kullanilir !== 'function') return true;
    try{ return !!a.kullanilir(); }catch(e){ return false; }
  }
  /* hepsi: kullanılamayanlar da (bağlantısız Merkez aracı); güven denetimi (tools/king_guven.js) için. */
  function liste(hepsi){
    let m = modulAraclar;
    if(typeof m === 'function'){ try{ m = m(); }catch(e){ m = []; } }
    let o = ortak;
    if(typeof o === 'function'){ try{ o = o(); }catch(e){ o = []; } }
    const gorulen = {};
    return (Array.isArray(o) ? o : []).concat(Array.isArray(m) ? m : []).filter(a => {
      if(!tanimGecerli(a) || gorulen[a.ad] || (!hepsi && !kullanilir(a))) return false;
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

  /* King 5 tur 5 (klon simülasyonu): «ilaç ekle: D vitamini», «tez ekle: …», «market listesine muz ekle»
     → «… için yapılacak işlem ne olsun?». İşlem cümlenin fiilinden, ana metin «X: …»dan okunur; yalnız
     boş alan doldurulur, şemadaki değerler dışında hiçbir şey yazılmaz. */
  const ISLEM = [['ekle', /(ekle|yeni|kaydet|kart yap|oluştur|yaz:)/], ['sil', /(sil|kaldır|çıkar)/], ['guncelle', /(güncelle|değiştir|düzelt)/]];
  function tamamla(ad, param, metin){
    const a = bul(String(ad || ''));
    const s = a && sema(a);
    if(!s || !s.properties) return param;
    const p = Object.assign({}, param || {});
    const t = String(metin || '').toLocaleLowerCase('tr');
    const e = s.properties.islem && s.properties.islem.enum;
    if(e && p.islem == null){ const i = ISLEM.find(x => e.indexOf(x[0]) >= 0 && x[1].test(t)); if(i) p.islem = i[0]; }
    const iki = String(metin || '').match(/^[^:]{2,40}:\s*(.{2,})$/);
    if(iki && p.islem !== 'sil'){
      const k = ['metin', 'ad', 'baslik', 'kitap'].find(k => s.properties[k] && s.properties[k].type === 'string' && p[k] == null);
      if(k) p[k] = iki[1].trim().slice(0, s.properties[k].maxLength || 300);
    }
    return p;
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
      /* HKM mesajla ortüşen araçları seçerken okur (core/arac.py dar_katalog); modele gitmez. */
      const anahtar = [a.anahtar, a.ornek].filter(Boolean).join(' ').slice(0, 300);
      if(anahtar) o.anahtar = anahtar;
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
    const seviye = d.arac.seviye === 'buyuk' || d.arac.dis ? 'buyuk' : 'orta';
    return { ok:true, tur:'yaz', ad:d.arac.ad, param:d.param, seviye, dis:!!d.arac.dis, onizle:o, aracAd:String(d.arac.ozetAd || d.arac.aciklama).split(/[.:;]/)[0] };
  }

  /* Onaydan sonra: aynı araç, aynı parametre (yeniden doğrulanır). */
  async function uygula(n){
    if(!n || !n.arac) return { ok:false, metin:yz('ortak.arac.uygulanacak-bir-sey-yok') };
    const d = dogrula(n.ad, n.param);
    if(!d.ok || d.arac.tur !== 'yaz') return { ok:false, metin:yz('ortak.arac.bu-is-katalogda-yok-hicbir') };
    try{
      const r = await d.arac.uygula(d.param);
      if(r && r.ok === false) return { ok:false, metin:String(r.metin || r.why || 'Uygulanamadı.') };
      return Object.assign({ ok:true, metin:'Tamam.' }, r || {});
    }catch(e){
      return { ok:false, metin:yz('ortak.arac.uygulanamadi') + ((e && e.message) || 'bilinmeyen hata') };
    }
  }

  /* Söz 4: modelsiz yol — `es` taşıyan okuma aracı ya da `kural(t, metin)` ile
     cümleden parametresini çıkaran araç (oku ya da yaz) kuralla çağrılır.
     Yazan araç yine önizlenir ve onay ister (söz 3). */
  const GIT_SON = /\s(git|aç|götür|geç|gidelim|bakalım|açar mısın)[.!]?$/;   // «denemeleri aç», «bütçeme bakalım» sayfa komutudur, okuma değil
  function kuralla(metin){
    const t = kucuk(metin);
    if(!t) return null;
    for(const a of liste()){
      if(typeof a.kural === 'function'){
        let p = null;
        try{ p = a.kural(t, String(metin).trim()); }catch(e){ p = null; }
        if(p) return { ad:a.ad, param:p === true ? {} : p };
        continue;
      }
      if(a.tur === 'oku' && a.es instanceof RegExp && a.es.test(t) && !GIT_SON.test(t) && !NIYET_DANIS.test(t)) return { ad:a.ad, param:{} };
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

  /* Söz 6 (KING-4 A3): niyet çözücü. Kalıbı olmayan cümle de araç kaydından
     seçilir: cümlenin kelimeleri araçların adı, açıklaması, örneği ve
     `anahtar`ıyla (Türkçe ek payıyla; az araçta geçen kelime ağır) puanlanır.
     Soru ve ad cümlesi okuma, emir yazma aracına gider; kayıt cümlesi
     («… çözdüm») girmez, o giriş kapısının işi. Eşiğin altı ya da başa baş
     null döner: model ya da sayfa karar verir. Yazan araç yine önizlenir ve
     onay ister (söz 3). */
  const NIYET_DIS = /^(sayfa_ac|kayit_gir|odak_baslat|odak_durdur|modul_bilgileri)$/;
  /* Danışma ve bilgi sorusu («ne yesem», «nasıl korurum», «… nedir») araç değil, Merkez'in işi. */
  const NIYET_DANIS = /(\S(?:ay[ıi]m|ey[ıi]m|mal[ıi]y[ıi]m|mel[ıi]y[ıi]m|s[ae]m)(?=$|\s|[?.!])|ne önerirsin|nasıl .*(?:[ae]b[iı]l[iı]r[iı]m|r[ıiuü]m|n[ıiuü]r)(?=$|\s|[?.!])|nedir|tavsiye|bir şey söyle)/;
  const NIYET_DOLGU = new Set(('ve ile veya bu şu o bir de da ne neler nasıl kaç hangi hangileri için gibi daha en çok az şey '
    + 'ben benim bana beni sen king lütfen olarak olan var yok mi mı mu mü misin mısın bakalım acaba şimdi artık hep tüm bütün her kadar').split(' '));
  const NIYET_SORU = /\?|(?:^|\s)(ne|neden|niye|nasıl|hangi|hangileri|kaç|kim|nerede|niçin|m[ıiuü](?:s[ıiuü]n(?:[ıiuü]z)?|y[ıiuü][mz]|d[ıiuü]r)?)(?=$|\s|[.,!])/;
  const NIYET_OKU = /\s(göster|getir|sırala|listele|özetle)[.!]?$/;
  const NIYET_IKI = /\s(aç|çıkar)[.!]?$/;
  const NIYET_EMIR = /\s(yap|ekle|kapat|al|koy|çek|aktar|üret|oluştur|güncelle|işaretle|tanımla|düşür|kısalt|gizle|ver|sil|başlat|kaydet|değiştir|ayarla|bitir|tamamla|istiyorum)[.!]?$/;
  const NIYET_KAYIT = /(d[ıiuü]m|t[ıiuü]m|d[ıiuü]k|t[ıiuü]k)[.!]?$/;
  const NIYET_ESIK = 3, NIYET_FARK = 0.5;
  /* 'oku' | 'yaz' | 'iki' | 'ad' (fiilsiz ad öbeği, okuma) | null (kayıt). */
  /* «alıntı ekle: …» gibi cümlede iki noktadan sonrası içeriktir, niyet baştadır. */
  const niyetBas = m => String(m || '').split(':')[0];
  function niyetSinif(metin){
    const t = kucuk(niyetBas(metin));
    if(NIYET_SORU.test(t) || NIYET_OKU.test(t)) return 'oku';
    if(NIYET_IKI.test(t)) return 'iki';
    if(NIYET_EMIR.test(t)) return 'yaz';
    return NIYET_KAYIT.test(t) ? null : 'ad';
  }
  const niyetKelime = m => kucuk(m).replace(/[’'`]/g, ' ').replace(/[^0-9a-zçğıöşü\s]/g, ' ').split(/\s+/)
    .filter(w => w.length >= 3 && !NIYET_DOLGU.has(w));
  /* Ortak kök: en az 4 harf, ya da kısa kelimenin tamamı («net» ~ «netlerim»). */
  function niyetEs(w, u){
    const n = Math.min(w.length, u.length);
    let i = 0;
    while(i < n && w[i] === u[i]) i++;
    return i >= Math.min(n, 5) && (i >= 4 || i === n);
  }
  function niyet(metin, sinif){
    const s = sinif === undefined ? niyetSinif(metin) : sinif;
    const sira = niyetKelime(niyetBas(metin)), ws = Array.from(new Set(sira));
    if(!s || !ws.length || NIYET_DANIS.test(kucuk(metin))) return null;
    /* `tahminle`: araç şu an tahminle seçilebilir mi (King 5, deneme 2026-11-08: hesapsız cihazda hayat
       karnesi «ne işe yarıyor», «karşılaştır» cümlelerine seçilip «giriş yapılmamış» diyordu). Açık
       kural (araç kendi cümlesi) etkilenmez. */
    const tahmin = a => { if(typeof a.tahminle !== 'function') return true; try{ return !!a.tahminle(); }catch(e){ return false; } };
    const l = liste().filter(a => !NIYET_DIS.test(a.ad) && !a.dis && tahmin(a));   // dış dünya tahminle seçilmez: kural ya da model
    /* Açıklamadaki başka aracın adı («… için eylem_kitap_ekle'yi kullan») atıftır, anlam değil. */
    const dok = l.map(a => niyetKelime(a.ad.replace(/^(ays|spi|esp)_/, '').replace(/_/g, ' ') + ' ' + String(a.aciklama).replace(/\w+_\w+/g, ' ')
      + ' ' + (a.ornek || '') + ' ' + (a.anahtar || '')));
    const agir = ws.map(w => { const f = dok.filter(d => d.some(u => niyetEs(w, u))).length; return f ? Math.log(l.length / f) : 0; });
    const ag = w => agir[ws.indexOf(w)];
    /* Ardışık iki kelime araç metninde de ardışıksa («kitap ekle») yarım puan daha. */
    const ikili = d => sira.slice(1).reduce((t, w, j) => t + (d.some((u, k) => k > 0 && niyetEs(w, u) && niyetEs(sira[j], d[k - 1])) ? (ag(w) + ag(sira[j])) / 2 : 0), 0);
    const puan = l.map((a, i) => ({ a, p:ws.reduce((t, w, j) => t + (dok[i].some(u => niyetEs(w, u)) ? agir[j] : 0), 0) + ikili(dok[i]) }))
      .filter(x => x.p > 0 && (s === 'iki' || (s === 'yaz') === (x.a.tur === 'yaz')))
      .sort((x, y) => y.p - x.p);
    const [b, c] = puan;
    if(!b || b.p < NIYET_ESIK || (c && b.p - c.p < NIYET_FARK)) return null;
    return { ad:b.a.ad, param:{}, puan:Math.round(b.p * 100) / 100, sinif:s };
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
      isler:isler(),
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

  const api = { kur, ortakKur, modulSec, liste, bul, dogrula, tamamla, paramDogrula, modelIcin, calistir, onizle, uygula,
    kademe, kuralla, ara, niyet, niyetSinif, harita, isler, isAra, ISLER, GRUP_AD, sayilar, sayiKorunur, HARITA, MODUL_AD, kuruluMu:() => liste().length > 0, _sifirla };
  return api;
})();
