/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/parca.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* PARÇA — sistem Lego gibi kurulur: her sayfa, blok, yazı ve bilgi tek parçadır.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/parca.js`; `python3 tools/ortak.py --yay` ile üç
   arayüzün `src/js/core/` klasörüne BİREBİR kopyalanır.
   ==================================================================

   Depo sahibi (2026-11-04): «Her sayfanın, her özelliğin, her yazının bir Lego
   gibi parça olması lazım. Sistemi Lego gibi inşa edeceğiz.»

   Dört parça:
     sayfa  menüde yeri olan ekran: çekmece, ad, simge, sıra, ızgara. Menü
            elle yazılmaz, sayfalardan üretilir (`menu`).
     blok   sayfanın bir bölümü. Hangi sayfanın hangi yerine takıldığını
            kendi söyler; sayfa dosyasına dokunmadan başka bir dosyadan da
            eklenir. Olay işleyicisi bloğun içinde durur.
            `kosul` verilirse yalnız o durumda çizilir (görünüm seçen ekranlar).
     yazı   ekranda görünen cümle kimlikle durur (`yazi`); çizim kodu metin taşımaz.
     bilgi  bir sayı ya da değer: nasıl okunduğu ve kesinlik etiketi (§1.2).
            Etiketsiz bilgi kaydedilmez. King, Gün ve başka parça buradan okur.
     komut  komut paletinin bir satırı; kendi ekran dosyasında durur.
     tepki  bir olaya verilen ses, hareket ya da minik tepkisi (`katalog.tepkiler()` hepsini dizer).
            Sayfa kaydındaki `king` alanı sayfayı King'e tanıtır (tools/parca.py rehberi üretir).

   Sözler:
     1. TAK, ÇIKAR. Blok silinince sayfa yine çizilir, menü ve olaylar kendini düzeltir.
     2. PARÇA DÜŞERSE SAYFA DÜŞMEZ. Hata veren blok kendi yerinde tek satır söyler.
     3. YANLIŞ KAYIT SESSİZ GEÇMEZ. Aynı kimlik, eksik alan, olmayan yazı hata atar.
     4. GÖRÜNÜM DEĞİŞMEZ. Motor sayfanın kendi ızgara bileşenini (K) kullanır. */
window.LIFEOS = window.LIFEOS || {};

(function(L){
  const SAYFA = new Map(), BLOK = new Map(), YAZI = new Map(), BILGI = new Map(), KOMUT = new Map(), TEPKI = new Map(), hatalar = [];

  function gerek(o, alanlar, tur){
    alanlar.forEach(a => { if(o == null || o[a] == null || o[a] === '') throw new Error('PARCA: ' + tur + ' için «' + a + '» gerekir'); });
  }
  function ekle(harita, id, deger, tur){
    if(harita.has(id)) throw new Error('PARCA: ' + tur + ' iki kez kaydedildi: ' + id);
    harita.set(id, deger);
  }

  function sayfa(o){
    gerek(o, ['id', 'modul'], 'sayfa');
    if(o.cekmece != null) gerek(o, ['ad'], 'menü sayfası');
    ekle(SAYFA, o.id, Object.assign({ sira:100, izgara:[] }, o), 'sayfa');
    return o.id;
  }

  function blok(o){
    gerek(o, ['id', 'sayfa', 'yer', 'ad', 'ciz'], 'blok');
    ekle(BLOK, o.id, Object.assign({ sira:100 }, o), 'blok');
    return o.id;
  }

  function yazilar(tablo){ Object.keys(tablo).forEach(k => ekle(YAZI, k, tablo[k], 'yazı')); }

  /* yazi('hedef.mesafe', { net:'3,5' }): {ad} yerine değer koyar. */
  function yazi(id, degerler){
    if(!YAZI.has(id)) throw new Error('PARCA: yazı yok: ' + id);
    const m = YAZI.get(id);
    return degerler ? m.replace(/\{(\w+)\}/g, (t, a) => (a in degerler ? String(degerler[a]) : t)) : m;
  }

  const ETIKETLER = ['ölçüldü', 'tahmin', 'hesaplandı', 'veri yok'];
  function bilgi(o){
    gerek(o, ['id', 'etiket', 'oku'], 'bilgi');
    if(ETIKETLER.indexOf(o.etiket) < 0) throw new Error('PARCA: bilinmeyen etiket: ' + o.etiket);
    ekle(BILGI, o.id, o, 'bilgi');
    return o.id;
  }
  /* Eksik veri sıfır değildir (§1.2): okunamayan bilgi «veri yok» döner. Değer kendi
     etiketini de taşıyabilir: { deger, etiket } (ör. tahmin içeren haftalık toplam). */
  function oku(id){
    const b = BILGI.get(id);
    if(!b) throw new Error('PARCA: bilgi yok: ' + id);
    let d = null;
    try{ d = b.oku(); }catch(e){ d = null; }
    if(d == null) return { deger:null, etiket:'veri yok' };
    if(typeof d === 'object' && 'deger' in d){
      if(d.deger == null) return { deger:null, etiket:'veri yok' };
      return { deger:d.deger, etiket:ETIKETLER.indexOf(d.etiket) >= 0 ? d.etiket : b.etiket };
    }
    return { deger:d, etiket:b.etiket };
  }
  /* Bir önekin bütün bilgileri, okunmuş: King ve başka parça tek çağrıyla alır. */
  function bilgiler(onek){
    return Array.from(BILGI.keys()).filter(id => !onek || id.indexOf(onek) === 0).map(id => {
      const b = BILGI.get(id);
      return Object.assign({ id, ad:b.ad || id, birim:b.birim || '' }, oku(id));
    });
  }

  function bloklar(sayfaId, yer){
    return Array.from(BLOK.values())
      .filter(b => b.sayfa === sayfaId && (yer == null || b.yer === yer))
      .sort((a, b) => a.sira - b.sira);
  }

  function ciz1(b, K, baglam){
    try{ return b.ciz(baglam); }
    catch(e){
      hatalar.push({ id:b.id, hata:String(e && e.message || e) });
      if(typeof console !== 'undefined') console.error('PARCA: ' + b.id, e);
      return K.Notice({ tone:'warn', body:'«' + b.ad + '» bölümü şu an açılamadı.' });
    }
  }

  /* Sayfanın ızgarası: { alan:6, yer:'sol' } alt alta, { tek:true } yığınsız. */
  function ciz(sayfaId, K, baglam){
    const s = SAYFA.get(sayfaId);
    if(!s) throw new Error('PARCA: sayfa yok: ' + sayfaId);
    return K.Grid(s.izgara.map(z => {
      const l = liste(sayfaId, z.yer, K, baglam);
      return K.Span(z.alan, z.tek ? (l.length === 1 ? l[0] : l.join('')) : K.Stack(l));
    }));
  }

  /* Bir yerin bloklarını sırayla çizer; ekranın kendi şablonu bu parçaları dizer. */
  function liste(sayfaId, yerAd, K, baglam){
    return bloklar(sayfaId, yerAd).filter(b => !b.kosul || b.kosul(baglam)).map(b => ciz1(b, K, baglam));
  }
  function yer(sayfaId, yerAd, K, baglam, raw){
    const l = liste(sayfaId, yerAd, K, baglam);
    if(l.length === 1) return l[0];
    return raw ? raw(l.map(String).join('')) : l.join('');
  }

  function olaylar(sayfaId, tur){
    const out = {};
    bloklar(sayfaId).forEach(b => Object.keys(b[tur] || {}).forEach(k => {
      if(k in out) throw new Error('PARCA: «' + k + '» olayı iki blokta: ' + sayfaId);
      out[k] = b[tur][k];
    }));
    return out;
  }

  /* Sayfa kaydından ekran nesnesi: kabuğun beklediği biçim aynıdır. */
  function ekran(sayfaId, K, ek){
    const s = SAYFA.get(sayfaId);
    if(!s) throw new Error('PARCA: sayfa yok: ' + sayfaId);
    const sirali = s.izgara.reduce((l, z) => l.concat(bloklar(sayfaId, z.yer)), []);
    return Object.assign({
      id:sayfaId,
      title:s.baslik || s.ad,
      kucukVarsayilan:sirali.filter(b => b.kucuk).map(b => b.kucuk),
      actions(){ return ''; },
      async render(){ return String(ciz(sayfaId, K)); },
      handle:olaylar(sayfaId, 'handle'),
      change:olaylar(sayfaId, 'change'),
    }, ek || {});
  }

  /* Modülün menüsü: çekmece sırası verilir, içi sayfaların kendi sırasından.
     bicim: modülün beklediği alan adları (AYS items/id, SPİ ve ESP views/route). */
  function menu(modul, cekmeceler, bicim){
    const o = Object.assign({ alan:'items', kimlik:'id' }, bicim);
    return cekmeceler.map(c => {
      const satir = Array.from(SAYFA.values())
        .filter(s => s.modul === modul && s.cekmece === c.id)
        .sort((a, b) => a.sira - b.sira)
        .map(s => Object.assign({ [o.kimlik]:s.id, label:s.ad }, s.ikon ? { icon:s.ikon } : {}, s.ek || {}));
      const { ad, ...ek } = c;
      return Object.assign(ek, { id:c.id, label:c.label || ad, [o.alan]:satir });
    }).filter(c => c[o.alan].length);
  }

  /* Komut paletinin bir satiri (run) ya da satir ureten parca (uret). `sira` modulde tektir:
     palet sirasi budur. Ekran dosyasi silinince komutu da gider. */
  function komut(o){
    gerek(o, ['modul', 'sira'], 'komut');
    if(typeof o.run !== 'function' && typeof o.uret !== 'function') throw new Error('PARCA: komut için «run» ya da «uret» gerekir');
    ekle(KOMUT, o.modul + ':' + o.sira, o, 'komut');
    return o.sira;
  }
  function komutlar(modul){
    const out = [];
    Array.from(KOMUT.values()).filter(k => k.modul === modul).sort((a, b) => a.sira - b.sira).forEach(k => {
      if(!k.uret){ const { modul:_m, sira:_s, ...satir } = k; out.push(satir); return; }
      /* Parca duserse palet dusmez (soz 2). */
      try{ out.push(...k.uret()); }
      catch(e){ hatalar.push({ id:'komut:' + modul + ':' + k.sira, hata:String(e && e.message || e) }); }
    });
    return out;
  }

  /* Bir olaya verilen tepki (ses, hareket, minik, video): `lifeos:<olay>` dinlenir. Olayı
     yayan tepkiyi bilmez; parça çıkınca yalnız tepki gider. Yeniden kurulum eskisinin yerine geçer. */
  function tepki(o){
    gerek(o, ['id', 'olay', 'ad', 'yap'], 'tepki');
    const ad = 'lifeos:' + o.olay;
    if(TEPKI.has(o.id)) window.removeEventListener(ad, TEPKI.get(o.id).dinle);
    const dinle = e => {
      try{ o.yap((e && e.detail) || {}, e); }
      catch(h){ hatalar.push({ id:'tepki:' + o.id, hata:String(h && h.message || h) }); }
    };
    TEPKI.set(o.id, Object.assign({}, o, { dinle }));
    window.addEventListener(ad, dinle);
    return o.id;
  }

  /* Ekran kodunda kisa ad: yz('kimlik'). */
  window.yz = yazi;
  L.PARCA = Object.freeze({ sayfa, blok, yazilar, yazi, bilgi, oku, bilgiler, bloklar, liste, yer, ciz, ekran, olaylar, menu, komut, komutlar, tepki, hatalar,
    /* yalnız testler: kaydı geri alır */
    _sil(id){ [SAYFA, BLOK, YAZI, BILGI, KOMUT].forEach(h => h.delete(id)); },
    katalog:Object.freeze({ sayfalar:() => Array.from(SAYFA.keys()), bloklar:() => Array.from(BLOK.keys()),
      yazilar:() => Array.from(YAZI.keys()), bilgiler:() => Array.from(BILGI.keys()),
      tepkiler:() => Array.from(TEPKI.values()).map(t => ({ id:t.id, olay:t.olay, ad:t.ad })) }) });
})(window.LIFEOS);
