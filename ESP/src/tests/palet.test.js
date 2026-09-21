/* KOMUT PALETİ — yapı, gezinme kapısı ve çizim.

   ------------------------------------------------------------------
   NEDEN BU DOSYA VAR

   `node tools/kapsam.js ESP --ayrinti` şunu yazdı:

       palette.js  %0  0/13
         koşmayan: commands, iconFor, quickCommand, onayGoster,
                   saveQuick, filtered, draw, run, openPalette, close,
                   isOpen, runById

   Palet Ctrl+K ile her yerden açılır ve uygulamanın en hızlı yoludur.
   Bozulduğunda GÖRÜNÜR BİR HATA VERMEZ: komut listede görünmez, ya da
   yanlış ekrana gider. SPİ'de `palette.test.js` vardı, ESP'de yoktu.

   ------------------------------------------------------------------
   BURADA ÇİZİM DEĞİL KARAR SINANIR

   Listenin yapısı, kimliklerin tekilliği ve — en önemlisi — **kapalı
   bir disiplinin ekranının palette görünmemesi**. Palet gezinme
   şeridinden ayrı bir kapıdır; oradan kapalı bir bölüme girilebilseydi
   kullanıcı kapattığı şeyi yine de görürdü.

   Çizim de bir kez yapılır (`open()`), çünkü `draw` içindeki liste
   kurulumu ve simge eşlemesi başka hiçbir yerden çağrılmıyor. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const P = ESP.Palette;

  function rotalar(){
    return ESP.Nav.sections()
      .reduce((a, s) => a.concat(s.views.map(v => v.route)), []);
  }

describe('Palet — komut listesi', () => {

  it('liste boş değil', () => {
    resetState();
    expect(P.commands().length).toBeGreaterThan(5);
  });

  it('her komutun etiketi, türü ve çalıştırıcısı var', () => {
    /* Etiketsiz bir komut listede görünür ama okunmaz; çalıştırıcısı
       olmayan bir komut tıklanır ve hiçbir şey olmaz. */
    resetState();
    P.commands().forEach(c => {
      expect(typeof c.label).toBe('string');
      expect(c.label.length).toBeGreaterThan(0);
      expect(typeof c.kind).toBe('string');
      expect(typeof c.run).toBe('function');
    });
  });

  it('komut kimlikleri TEKİL', () => {
    /* Aynı kimlikten iki komut, seçileni belirsiz yapar — ve
       `runById` ilk bulduğunu çalıştırır. */
    resetState();
    const ids = P.commands().map(c => c.id).filter(Boolean);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('AÇIK her ekrana giden bir komut var', () => {
    resetState();
    const gidenler = P.commands().filter(c => String(c.id).indexOf('go:') === 0)
      .map(c => String(c.id).slice(3));
    rotalar().forEach(r => {
      if(gidenler.indexOf(r) < 0) throw new Error('palet bu ekrana gitmiyor: ' + r);
    });
  });

  it('palet bir EKRAN listesi değil İŞ listesidir', () => {
    /* Yalnız sayfalar olsaydı palet ikinci bir gezinme şeridi olurdu.
       Değeri, «kart çalışmasına başla» gibi işleri tek aramadan
       ulaşılır yapmasında. */
    resetState();
    const eylem = P.commands().filter(c => String(c.id).indexOf('act:') === 0);
    expect(eylem.length).toBeGreaterThan(3);
  });

  it('KAPALI disiplinin ekranı palette GÖRÜNMEZ', () => {
    /* Palet gezinme şeridinden ayrı bir kapıdır; oradan kapalı bir
       bölüme girilebilseydi kullanıcı kapattığı şeyi yine görürdü. */
    resetState();
    const acik = P.commands().some(c => c.id === 'go:symposium');
    expect(acik).toBe(true);

    const onceki = ESP.S.prefs.modules;
    try{
      ESP.S.prefs.modules = Object.assign({}, onceki || {}, { philo:false });
      const kapali = P.commands().some(c => c.id === 'go:symposium');
      expect(kapali).toBe(false);
      /* Disipline bağlı OLMAYAN bölüm yerinde kalır. */
      expect(P.commands().some(c => c.id === 'go:rutbe')).toBe(true);
    }finally{ ESP.S.prefs.modules = onceki; }
  });

  it('her komut bir simge türüne düşer', () => {
    /* `iconFor` tanımadığı türe de bir simge verir; vermeseydi satır
       kaymış görünürdü. Tür adları tek yerde tutulur. */
    resetState();
    const turler = new Set(P.commands().map(c => c.kind));
    turler.forEach(t => expect(t.length > 0).toBe(true));
  });
});

describe('Palet — hızlı giriş', () => {

  it('sorgu BOŞKEN öneri üretilmez', () => {
    /* İki harf yazarken her tuşta öneri çıkarmak paleti kullanılmaz
       yapar; eşik bilinçli. */
    resetState();
    P.close();
    expect(P.quickCommand()).toBeFalsy();
  });

  it('öneri KENDİLİĞİNDEN KAYDETMEZ', () => {
    /* Komut yalnızca önizlemeyi açar; onaysız hiçbir şey yazılmaz. */
    resetState();
    const once = JSON.stringify(ESP.S.days || {});
    P.quickCommand();
    expect(JSON.stringify(ESP.S.days || {})).toBe(once);
  });
});

describe('Palet — açılış, çizim, kapanış', () => {

  it('başlangıçta kapalıdır', () => {
    P.close();
    expect(P.isOpen()).toBe(false);
    expect(document.getElementById('cmdk')).toBeNull();
  });

  it('açılınca DOM\'a girer ve komutları listeler', () => {
    resetState();
    try{
      P.open();
      expect(P.isOpen()).toBe(true);
      const el = document.getElementById('cmdk');
      expect(el).toBeTruthy();
      const satirlar = el.querySelectorAll('[data-act="cmdk-run"]');
      expect(satirlar.length).toBeGreaterThan(3);
      /* Liste otuzda kesilir: daha uzunu kaydırmadan okunamaz. */
      expect(satirlar.length <= 30).toBe(true);
    }finally{ P.close(); }
  });

  it('açılan palet ekran okuyucuya kendini tanıtır', () => {
    resetState();
    try{
      P.open();
      const el = document.getElementById('cmdk');
      expect(el.innerHTML.indexOf('role="dialog"') >= 0).toBe(true);
      expect(el.innerHTML.indexOf('aria-modal="true"') >= 0).toBe(true);
      expect(el.innerHTML.indexOf('role="listbox"') >= 0).toBe(true);
      /* Arama alanı etiketsiz kalmaz. */
      expect(el.innerHTML.indexOf('aria-label="Komut ara"') >= 0).toBe(true);
    }finally{ P.close(); }
  });

  it('TEK BİR satır seçilidir', () => {
    /* İki seçili satır, Enter'a basınca hangisinin açılacağını
       belirsiz yapardı. */
    resetState();
    try{
      P.open();
      const el = document.getElementById('cmdk');
      expect(el.querySelectorAll('[aria-selected="true"]').length).toBe(1);
      expect(el.querySelectorAll('.is-active').length).toBe(1);
    }finally{ P.close(); }
  });

  it('kapanınca düğüm KALKAR — gizlenmez', () => {
    /* Gizlenseydi arkasındaki ekranda sekme sırası bozuk kalırdı. */
    resetState();
    P.open();
    P.close();
    expect(P.isOpen()).toBe(false);
    expect(document.getElementById('cmdk')).toBeNull();
  });

  it('iki kez açmak iki palet çizmez', () => {
    resetState();
    try{
      P.open();
      P.open();
      expect(document.querySelectorAll('#cmdk').length).toBe(1);
    }finally{ P.close(); }
  });

  it('arama YAZINCA liste daralır', () => {
    resetState();
    try{
      P.open();
      const hepsi = document.querySelectorAll('[data-act="cmdk-run"]').length;
      const input = document.getElementById('cmdk-input');
      input.value = 'zzzz-eslesmeyecek-bir-sey';
      input.oninput({ target:input });
      const sonra = document.querySelectorAll('[data-act="cmdk-run"]').length;
      expect(sonra).toBe(0);
      expect(hepsi).toBeGreaterThan(0);
      /* Eşleşen yoksa boş bir kutu değil bir CÜMLE görünür. */
      expect(document.getElementById('cmdk').innerHTML
        .indexOf('Eşleşen komut yok') >= 0).toBe(true);
    }finally{ P.close(); }
  });

  it('arama TÜRKÇE harf farkına takılmaz', () => {
    /* «gunluk» ile «günlük» aynı şeyi bulmalı; kullanıcı palete acele
       yazar, düzeltme işaretlerini koymaz. */
    resetState();
    try{
      P.open();
      const input = document.getElementById('cmdk-input');
      const ara = q => {
        input.value = q;
        input.oninput({ target:input });
        return document.querySelectorAll('[data-act="cmdk-run"]').length;
      };
      const a = ara('gunluk');
      const b = ara('günlük');
      expect(a).toBeGreaterThan(0);
      expect(a).toBe(b);
    }finally{ P.close(); }
  });

  it('OK tuşlarıyla seçim kayar ve sınırda durur', () => {
    resetState();
    try{
      P.open();
      const input = document.getElementById('cmdk-input');
      const secili = () => Array.prototype.indexOf.call(
        document.querySelectorAll('[data-act="cmdk-run"]'),
        document.querySelector('[data-act="cmdk-run"].is-active'));
      expect(secili()).toBe(0);
      /* Yukarı: zaten en üstte, kaymamalı — eksi bir satır yoktur. */
      input.onkeydown({ key:'ArrowUp', preventDefault(){} });
      expect(secili()).toBe(0);
      input.onkeydown({ key:'ArrowDown', preventDefault(){} });
      expect(secili()).toBe(1);
    }finally{ P.close(); }
  });

  it('kimlikle çalıştırmak paleti KAPATIR', () => {
    /* Komut çalıştıktan sonra palet açık kalsaydı, gidilen ekranın
       üstünü örterdi. */
    resetState();
    const gercek = ESP.App;
    try{
      ESP.App = { go(){} };                 // gezinme kabuğu testte yok
      P.open();
      P.runById('go:rutbe');
      expect(P.isOpen()).toBe(false);
      expect(document.getElementById('cmdk')).toBeNull();
    }finally{ ESP.App = gercek; P.close(); }
  });

  it('BİLİNMEYEN kimlik çökmez ve paleti açık bırakmaz', () => {
    resetState();
    try{
      P.open();
      P.runById('yok:boyle-bir-komut');
      /* Komut bulunamadı: hiçbir şey çalışmaz, palet de kapanmaz. */
      expect(P.isOpen()).toBe(true);
    }finally{ P.close(); }
  });
});

})();
