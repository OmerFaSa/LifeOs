/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/king.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* King — her yerden sade sohbet. Tek kaynak `brand/ortak/king.test.js`.

   Kanıtlanan sözler (brand/ortak/king.js):
     1. Hazır cevaplar ve serbest yazı doğru modülün doğru sayfasına götürür
        («Kolay gelsin»); modüller arası geçiş adresle (#king=rota).
     2. Anlaşılmayan istek tahmin edilmez: hiçbir yere götürülmez.
     3. Veri önce önizlenir; kayıt yalnız «Kaydet»le, «Vazgeç» kaydetmez.
     4. Başka modülden gelinen #king= hedefi yalnız katalogdaysa uygulanır.
     5. Ctrl iki kez açar, Esc kapatır; ışık ve baloncuk tek katmandadır.
     6. Ses (söz 7): mikrofon yalnız tanıma varsa çizilir; sesle sorulana
        sesle cevap, yazıyla sorulana yazıyla; yalnız cihazdaki Türkçe ses
        seçilir (bulut «Online» ses asla); izin yoksa söyler, King sürer;
        eylem cümlesi gidilecek sayfayı adıyla söyler. */

(function(){
  const { describe, it, expect } = (window.R || window.SP || window.ESP).Test;
  const K = () => window.LIFEOS.KING;

  let yedek = null;
  function sahne(o){
    o = o || {};
    const k = K();
    k._sifirla();
    yedek = yedek || Object.assign({}, k._ortam);
    const giden = [], gidilen = [];
    Object.assign(k._ortam, {
      git:u => giden.push(u),
      zamanla:fn => fn(),
      hash:() => o.hash || '',
      hashSil:() => { giden.push('hash-silindi'); },
      adres:m => ({ ays:'http://127.0.0.1:4173/', spi:'http://127.0.0.1:4183/', esp:'http://127.0.0.1:4193/' })[m],
      simdi:() => new Date(2026, 9, 5, 9, 0),
      yazmaEtkin:() => !!o.yazma,               // söz 21: yazma efekti yalnız kendi testinde
    }, o.fetch ? { fetch:o.fetch } : {});
    k.kur({ modul:o.modul || 'spi', git:(r, ek) => gidilen.push([r, ek || {}]),
      ozet:o.ozet || (() => ['Toparlanma iyi.', 'Uyku 7 sa · 2 öğün']), veri:o.veri, hkm:o.hkm });
    return { k, giden, gidilen };
  }
  function birak(){ const k = K(); k._sifirla(); if(yedek) Object.assign(k._ortam, yedek); }
  async function sahneyle(fn){ try{ await fn(); } finally{ birak(); } }

  describe('King — anlama', () => {
    it('kullanıcının örnekleri doğru modüle ve sayfaya gider', () => sahneyle(async () => {
      const { k } = sahne();
      const h = m => { const y = k.yorumla(m); return y.tur === 'git' ? y.hedef.modul + ':' + y.hedef.route : y.tur; };
      expect(h('antrenman yapacağım')).toBe('spi:move');
      expect(h('Besin gireceğim')).toBe('spi:meals');
      expect(h('test çözeceğim')).toBe('ays:solve');
      expect(h('deneme gireceğim')).toBe('ays:exams');
      expect(h('Dil çalışacağım')).toBe('esp:lang');
      expect(h('İngilizce kelime')).toBe('esp:lang');
      expect(h('koşuya çıkıyorum')).toBe('spi:move');
      expect(h('kan testi sonuçlarım')).toBe('spi:labs');
      expect(h('hareket sayfasına git')).toBe('spi:move');
      expect(h('okuma sayfasını aç')).toBe('esp:library');
      expect(h('bugünün özeti')).toBe('ozet');
      expect(h('nasıl gidiyorum')).toBe('ozet');
      expect(h('xyzzy qwerty')).toBe('bilinmiyor');
      expect(h('   ')).toBe('bos');
      expect(k.yorumla('antrenman yapacağım').hedef.ek.sekme).toBe('kuvvet');
      expect(k.yorumla('koşuya çıkıyorum').hedef.ek.sekme).toBe('kardiyo');
    }));

    it('eşit adda bulunulan modülün sayfası seçilir', () => sahneyle(async () => {
      expect(sahne({ modul:'esp' }).k.yorumla('bugün sayfasına git').hedef.modul).toBe('esp');
      expect(sahne({ modul:'ays' }).k.yorumla('bugün sayfasına git').hedef.modul).toBe('ays');
    }));
  });

  describe('King — ses', () => {
    function sahteSes(){
      const okunan = [];
      const sentez = { okunan, iptal:0, getVoices:() => [
        { name:'Microsoft Emel Online (Natural) - Turkish', lang:'tr-TR', localService:false },
        { name:'Google Türkçe', lang:'tr-TR', localService:false },
        { name:'Microsoft Tolga', lang:'tr-TR', localService:true },
        { name:'Yelda (Gelişmiş)', lang:'tr-TR', localService:true },
        { name:'Samantha', lang:'en-US', localService:true, default:true }],
        speak:u => { okunan.push(u); }, cancel(){ this.iptal++; } };
      let son = null;
      function Tanima(){ son = this; this.start = () => {}; this.stop = () => { this.onend && this.onend(); }; this.abort = this.stop; }
      return { sentez, okunan, tanimaSinifi:Tanima, son:() => son };
    }
    it('yalnız cihazdaki Türkçe ses seçilir; bulut sesi asla', () => {
      const k = K();
      const l = sahteSes().sentez.getVoices();
      expect(k.sesSec(l).name).toBe('Yelda (Gelişmiş)');
      expect(k.sesSec(l.filter(v => !/Yelda|Tolga/.test(v.name)))).toBe(null);
    });
    it('sesle sorulana sesle, yazıyla sorulana yazıyla; eylem cümlesi sayfayı söyler', () => sahneyle(async () => {
      const ss = sahteSes();
      const { k, gidilen } = sahne();
      Object.assign(k._ortam, { tanima:() => ss.tanimaSinifi, sentez:() => ss.sentez, soz:m => ({ metin:m }) });
      k.ac();
      expect(document.querySelector('.king__mik') !== null).toBe(true);
      k.dinle();
      expect(document.querySelector('[data-king]').classList.contains('is-dinliyor')).toBe(true);
      const r = ss.son();
      r.onresult({ results:[Object.assign([{ transcript:'antrenman yapacağım' }], { isFinal:true })] });
      r.onend();
      await new Promise(ok => setTimeout(ok, 0));
      /* Söz 9: niyet sayfayı hemen açar; King küçük kutu olarak açık kalır. */
      expect(gidilen).toEqual([['move', { sekme:'kuvvet' }]]);
      expect(k.acikMi() && k.miniMi()).toBe(true);
      expect(ss.okunan.length > 0).toBe(true);
      expect(ss.okunan[0].voice.name).toBe('Yelda (Gelişmiş)');
      expect(ss.okunan.map(u => u.metin).join(' ')).toContain('Hareket açılıyor');
      /* Yazıyla sorulan sesle cevaplanmaz. */
      k.ac();
      const once = ss.okunan.length;
      const f = document.querySelector('[data-king-form]');
      f.querySelector('.king__girdi').value = 'bugünün özeti';
      f.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      await new Promise(ok => setTimeout(ok, 0));
      expect(ss.okunan.length).toBe(once);
    }));
    it('mikrofon izni yoksa söyler ve King yazıyla sürer; tanıma yoksa düğme çizilmez', () => sahneyle(async () => {
      const ss = sahteSes();
      const { k } = sahne();
      Object.assign(k._ortam, { tanima:() => ss.tanimaSinifi, sentez:() => ss.sentez, soz:m => ({ metin:m }) });
      k.ac();
      k.dinle();
      const r = ss.son();
      r.onerror({ error:'not-allowed' });
      r.onend();
      expect(k.akis().some(m => /Mikrofon izni verilmedi/.test(m.metin))).toBe(true);
      expect(document.querySelector('[data-king]').classList.contains('is-dinliyor')).toBe(false);
      k.kapat();
      Object.assign(k._ortam, { tanima:() => null });
      k.ac();
      expect(document.querySelector('.king__mik')).toBe(null);
    }));
  });

  describe('King — eylem', () => {
    it('aynı modülde hazır cevap «Kolay gelsin» der ve sayfaya götürür', () => sahneyle(async () => {
      const { k, gidilen } = sahne();
      k.ac();
      k.hazirSec(0);                                     // Antrenman yapacağım
      expect(k.akis().some(m => m.kim === 'king' && /Kolay gelsin/.test(m.metin))).toBe(true);
      expect(gidilen).toEqual([['move', { sekme:'kuvvet' }]]);
      /* Söz 9: kapanmaz, küçülür. */
      expect(k.acikMi()).toBe(true);
      expect(k.miniMi()).toBe(true);
      expect(document.querySelector('[data-king]').classList.contains('is-mini')).toBe(true);
    }));

    it('öteki modüle adresle geçer (#king=rota)', () => sahneyle(async () => {
      const { k, giden, gidilen } = sahne();
      await k.isle('dil çalışacağım');
      expect(giden).toEqual(['http://127.0.0.1:4193/#king=lang']);
      expect(gidilen).toHaveLength(0);
    }));

    it('anlaşılmayan istek hiçbir yere götürmez, ne yapılabildiğini söyler', () => sahneyle(async () => {
      const { k, giden, gidilen } = sahne();
      await k.isle('bilmem ne şey');
      expect(giden.length + gidilen.length).toBe(0);
      expect(k.akis().slice(-1)[0].metin).toContain('anlayamadım');
    }));

    it('özet modülün kendi satırlarını söyler', () => sahneyle(async () => {
      const { k } = sahne();
      await k.isle('bugünün özeti');
      const son = k.akis().slice(-1)[0];
      expect(son.satirlar).toEqual(['Toparlanma iyi.', 'Uyku 7 sa · 2 öğün']);
      expect(son.metin).toBe('SPİ’de bugün:');
    }));

    it('veri önce önizlenir; Vazgeç kaydetmez, Kaydet kaydeder', () => sahneyle(async () => {
      let kayit = 0;
      const veri = { onizle:t => (/uyku/.test(t) ? { metin:'Uyku 7 sa', ipucu:'Günlük ölçüm',
        kaydet:async () => { kayit++; return 'Uyku kaydedildi'; } } : null) };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      expect(kayit).toBe(0);
      expect(k.akis().slice(-1)[0].onizleme.metin).toContain('Uyku 7 sa');
      document.querySelector('[data-king="vazgec"]').click();
      expect(kayit).toBe(0);
      await k.isle('uyku 7');
      document.querySelector('[data-king="kaydet"]').click();
      await new Promise(r => setTimeout(r, 0));
      expect(kayit).toBe(1);
      expect(k.akis().slice(-1)[0].metin).toBe('Uyku kaydedildi. Başka bir şey var mı?');
      expect(k.acikMi()).toBe(true);                       /* söz 8: sohbette kalır */
    }));
  });

  /* Söz 8 (depo sahibi, 2026-10-16): «fasulye yiyeceğim bir tabak» → «Afiyet
     olsun», sonda «ekleyeyim mi?»; bütün sistemler; sohbette kalınır. */
  describe('King — sohbette kalır', () => {
    function ogunVeri(sayac){
      return { onizle:t => /fasulye/.test(t) && !/yiyeceğim|yedim değil/.test(t)
        ? { tur:'ogun', metin:'Etli kuru fasulye', ipucu:'1 gıda', kaydet:async () => { sayac.n++; return 'Öğün kaydedildi'; } } : null };
    }
    it('yemekte «Afiyet olsun», sonda «Öğünlerine ekleyeyim mi?»; «evet» yazınca ekler', () => sahneyle(async () => {
      const sayac = { n:0 };
      const { k, gidilen } = sahne({ veri:ogunVeri(sayac) });
      k.ac();
      await k.isle('bir tabak kuru fasulye yedim');
      const son = k.akis().slice(-1)[0];
      expect(son.metin).toContain('Afiyet');
      expect(son.son).toBe('Öğünlerine ekleyeyim mi?');
      expect(document.querySelector('[data-king] .king__son').textContent).toBe('Öğünlerine ekleyeyim mi?');
      expect(sayac.n).toBe(0);
      await k.isle('evet');
      expect(sayac.n).toBe(1);
      expect(gidilen.length).toBe(0);
      expect(k.acikMi()).toBe(true);
    }));
    it('gelecek zaman: fiil çıkarılır, kendiliğinden yazılmaz; «hayır» eklemez', () => sahneyle(async () => {
      if(!window.LIFEOS.Olumsuz) return;
      const sayac = { n:0 };
      const { k } = sahne({ veri:ogunVeri(sayac) });
      k.ac();
      const y = k.yorumla('fasulye yiyeceğim bir tabak');
      expect(y.tur).toBe('veri');
      expect(y.gelecek).toBe(true);
      expect(y.sohbet.selam).toBe('Şimdiden afiyet olsun!');
      await k.isle('fasulye yiyeceğim bir tabak');
      expect(k.akis().slice(-1)[0].onizleme.ipucu).toContain('yaptıktan sonra');
      await k.isle('hayır');
      expect(sayac.n).toBe(0);
      expect(k.akis().slice(-1)[0].metin).toBe('Tamam, eklemedim.');
    }));
    it('olumsuz cümle hiç önizlenmez', () => sahneyle(async () => {
      if(!window.LIFEOS.Olumsuz) return;
      const { k } = sahne({ veri:{ onizle:t => window.LIFEOS.Olumsuz.olcumEngeli(t) ? null : { metin:'x', kaydet:async () => 'k' } } });
      expect(k.yorumla('kuru fasulye yemedim').tur === 'veri').toBe(false);
    }));
    it('her sistemin karşılığı: antrenman, çalışma, uyku, oturum', () => sahneyle(async () => {
      const tur = t => ({ onizle:() => ({ tur:t, metin:'x', kaydet:async () => 'k' }) });
      let { k } = sahne({ veri:tur('hareket') });
      expect(k.yorumla('45 dk koştum').sohbet.selam).toContain('Eline sağlık');
      expect(k.yorumla('45 dk koştum').sohbet.soru).toBe('Antrenmanlarına ekleyeyim mi?');
      ({ k } = sahne({ veri:tur('calisma') }));
      expect(k.yorumla('40 soru çözdüm').sohbet.soru).toBe('Çalışma kaydına ekleyeyim mi?');
      ({ k } = sahne({ veri:tur('oturum') }));
      expect(k.yorumla('45 dk gitar').sohbet.soru).toBe('Bugünün oturumlarına ekleyeyim mi?');
      ({ k } = sahne({ veri:tur('uyku') }));
      expect(k.yorumla('7 saat uyudum').sohbet.soru).toBe('Uyku kaydına ekleyeyim mi?');
      /* aynı cümle, aynı karşılık (rastgele değil) */
      expect(k.yorumla('7 saat uyudum').sohbet.selam).toBe(k.yorumla('7 saat uyudum').sohbet.selam);
    }));
    it('niyet cümlesi sayfayı açar; King kapanmaz, sağ üstte küçük kutu olur ve ekranın adını bilir', () => sahneyle(async () => {
      const { k, gidilen } = sahne();
      let ekran = 'today';
      k.kur({ modul:'spi', git:(r, ek) => { gidilen.push([r, ek || {}]); ekran = r; }, ekran:() => ekran, ozet:() => [] });
      k.ac();
      await k.isle('antrenman yapacağım');
      expect(gidilen.map(x => x[0])).toEqual(['move']);
      expect(k.acikMi() && k.miniMi()).toBe(true);
      const el = document.querySelector('[data-king]');
      expect(el.querySelector('.king__yer').textContent).toContain('Hareket');
      expect(!!el.querySelector('.king__girdi')).toBe(true);           /* yazmaya devam */
      expect(!!el.querySelector('.king-perde') && getComputedStyle(el.querySelector('.king-perde')).display === 'none').toBe(true);
    }));

    it('küçükken dışarı tıklamak kapatmaz; büyüt büyütür; ✕ kapatır; Ctrl iki kez küçükken büyütür', () => sahneyle(async () => {
      const { k } = sahne();
      k.ac();
      document.body.click();                                         /* büyükken dışarısı: küçültür */
      expect(k.acikMi() && k.miniMi()).toBe(true);
      document.body.click();                                         /* küçükken dışarısı: dokunmaz */
      expect(k.acikMi() && k.miniMi()).toBe(true);
      document.querySelector('[data-king="buyut"]').click();
      expect(k.acikMi() && !k.miniMi()).toBe(true);
      k.kucult();
      const tus = key => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles:true }));
      tus('Control'); tus('Control');
      expect(k.acikMi() && !k.miniMi()).toBe(true);
      k.kucult();
      document.querySelector('[data-king="kapat"]').click();
      expect(k.acikMi()).toBe(false);
    }));

    /* Söz 11–15 (2026-10-16: «King'e o an fotoğraf yükleyip gönderebilelim, ekranı
       açabilelim, sesli konuşabilelim; söylemediğim eksikleri de bul»). */
    it('fotoğraf modülün kendi akışına teslim edilir; işi olmayan modülde söylenir', () => sahneyle(async () => {
      const teslim = [];
      const { k } = sahne();
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], foto:[{ ad:'Soruyu çöz', is:async f => { teslim.push(f.name); return 'Soru çöz’e koydum.'; } }] });
      k._ortam.nesneUrl = () => 'blob:sahte';
      k.ac();
      const dosya = new File([new Uint8Array([137, 80, 78, 71])], 'soru.png', { type:'image/png' });
      expect(k.fotoAl(dosya)).toBe(true);
      expect(!!document.querySelector('[data-king] .king__foto')).toBe(true);
      expect(k.akis().slice(-1)[0].metin).toContain('bu cihazda kalıyor');
      document.querySelector('[data-king="foto:0"]').click();
      await new Promise(r => setTimeout(r, 0));
      expect(teslim).toEqual(['soru.png']);
      expect(k.miniMi()).toBe(true);
      expect(k.akis().slice(-1)[0].metin).toContain('Soru çöz’e koydum');
      /* görsel olmayan dosya alınmaz */
      expect(k.fotoAl(new File(['x'], 'a.txt', { type:'text/plain' }))).toBe(false);
      /* fotoğraf işi olmayan modül */
      k.kur({ modul:'esp', git:() => {}, ozet:() => [] });
      k.fotoAl(dosya);
      expect(k.akis().slice(-1)[0].metin).toContain('fotoğrafla yapılan bir iş yok');
    }));

    /* Söz 18 (depo sahibi, 2026-10-16: «AYS'den SPİ'ye geçerken sağ üstteki King
       kayboluyor»). King açıkken durumu animasyon.js taşımasıyla karşı modüle gider. */
    it('modül değişince King açık kalır: durum taşınır, karşı modülde küçük kutu ve sohbetle açılır', () => sahneyle(async () => {
      const A = window.LIFEOS.ANIMASYON;
      if(!A){ expect('animasyon.js').toBe('yüklü'); return; }
      expect(A.TASINAN.indexOf(K().TASIMA) >= 0).toBe(true);
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      let { k } = sahne({ modul:'ays', veri });
      k.ac();
      await k.isle('uyku 7');
      const t = JSON.parse(localStorage.getItem(k.TASIMA));
      expect([t.acik, t.kaynak]).toEqual([true, 'ays']);
      expect(t.akis.some(m => m.metin === 'uyku 7')).toBe(true);
      /* karşı modül: aynı anahtar, başka kaynak → küçük kutu, sohbet geri gelir, anahtar tüketilir */
      const tasinan = localStorage.getItem(k.TASIMA);
      ({ k } = sahne({ modul:'spi' }));
      localStorage.setItem(k.TASIMA, tasinan);
      k.kur({ modul:'spi', git:() => {}, ozet:() => [] });
      await new Promise(r => setTimeout(r, 0));
      expect(k.acikMi() && k.miniMi()).toBe(true);
      expect(k.akis().some(m => m.metin === 'uyku 7')).toBe(true);
      /* gelen taşıma tüketildi; artık SPİ'nin kendi açık King'i yazılı */
      expect(JSON.parse(localStorage.getItem(k.TASIMA)).kaynak).toBe('spi');
      /* kapatınca taşınacak bir şey kalmaz */
      k.kapat();
      expect(localStorage.getItem(k.TASIMA)).toBe(null);
    }));
    it('King açıkken öteki modüle kendisi geçerse sohbet ve hedef sayfa taşınır', () => sahneyle(async () => {
      if(!window.LIFEOS.ANIMASYON) return;
      let { k, giden } = sahne({ modul:'spi' });
      k.ac();
      await k.isle('dil çalışacağım');
      expect(giden[0].indexOf('http://127.0.0.1:4193/#lifeos=')).toBe(0);
      const veri = JSON.parse(decodeURIComponent(giden[0].split('#lifeos=')[1]));
      const t = JSON.parse(veri[k.TASIMA]);
      expect(t.git).toEqual({ route:'lang', sekme:null });
      const tasinan = veri[k.TASIMA];
      let gidilen;
      ({ k, gidilen } = sahne({ modul:'esp' }));
      localStorage.setItem(k.TASIMA, tasinan);
      k.kur({ modul:'esp', git:(r, ek) => gidilen.push([r, ek || {}]), ozet:() => [] });
      expect(gidilen).toEqual([['lang', {}]]);
      expect(k.acikMi() && k.miniMi()).toBe(true);
      expect(k.akis().some(m => m.metin === 'dil çalışacağım')).toBe(true);
    }));
    it('kendi modülünün eski taşıması açılışta silinir, King kendiliğinden açılmaz', () => sahneyle(async () => {
      let { k } = sahne({ modul:'ays' });
      localStorage.setItem(k.TASIMA, JSON.stringify({ acik:true, mini:true, kaynak:'ays', akis:[], zaman:Date.now() }));
      k.kur({ modul:'ays', git:() => {}, ozet:() => [] });
      await new Promise(r => setTimeout(r, 0));
      expect(k.acikMi()).toBe(false);
      expect(localStorage.getItem(k.TASIMA)).toBe(null);
    }));

    /* Söz 22 (2026-10-17): «King her şeyi öğrenecek» (KISI-PLANI). */
    function hafizali(k, o){
      const st = { hafiza:[] };
      const H = window.LIFEOS.Hafiza.kur({ store:() => ({ get:async () => null, set:async () => {} }), durum:() => st });
      k.kur(Object.assign({ modul:'spi', git:() => {}, ozet:() => [], hafiza:() => H }, o || {}));
      return H;
    }
    it('açık beyan kendiliğinden not edilir; «Geri al» unutur', () => sahneyle(async () => {
      if(!window.LIFEOS.KISI || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k);
      k.ac({ mini:true });
      const r = await k.isle('Balığı hiç sevmem');
      expect(r.tur).toBe('beyan');
      expect(H.etkin().map(x => [x.alan, x.katman, x.kaynak, x.metin])).toEqual([['sevgi', 'sohbet', 'kural', 'Balığı hiç sevmem']]);
      expect(k.akis().slice(-1)[0].metin).toContain('Not ettim');
      await k.isle('geri al');
      expect(H.etkin()).toHaveLength(0);
    }));
    it('beyanlı veri cümlesinde veri akışı sürer, beyan sessizce yazılır', () => sahneyle(async () => {
      if(!window.LIFEOS.KISI || !window.LIFEOS.Hafiza) return;
      const veri = { onizle:t => /içtim/.test(t) ? { metin:'Kahve 2 bardak', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k, { veri });
      k.ac({ mini:true });
      await k.isle('Kahveyi çok severim. 2 bardak içtim');
      expect(H.etkin().map(x => x.metin)).toEqual(['Kahveyi çok severim']);
      expect(k.akis().slice(-1)[0].onizleme.metin).toBe('Kahve 2 bardak');
    }));
    it('tanışma: günde bir soru; cevap «senin sözün» olarak sorunun alanına yazılır', () => sahneyle(async () => {
      if(!window.LIFEOS.KISI || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k);
      k.ac();
      expect(k.tanismaVar()).toBe(true);
      expect(k.akis()[0].metin).toContain('tanımak istiyorum');
      await k.isle('kitap okumak');
      const kay = H.etkin();
      expect(kay).toHaveLength(1);
      expect([kay[0].katman, kay[0].kaynak, !!kay[0].alan]).toEqual(['soz', 'kullanici', true]);
      expect(kay[0].metin).toContain('→ kitap okumak');
      k.kapat();
      await new Promise(r => setTimeout(r, 400));
      k._ortam.depo.sil('king.sohbet.spi');
      k.ac();
      expect(k.tanismaVar()).toBe(false);          // aynı gün ikinci soru yok
    }));
    it('«Beni nasıl tanıyorsun»: kendi kaydı silinir; öbür modülün kaydı modül adıyla, silinmez', () => sahneyle(async () => {
      if(!window.LIFEOS.KISI || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => ({ moduller:[{ modul:'ays', kayitlar:[{ id:'a1', alan:'hobi', metin:'Hobim satranç', katman:'sohbet' }] }] });
      const H = hafizali(k);
      await k.disKisiTazele();
      await H.ekle('Balığı sevmem', { katman:'sohbet', kaynak:'kural', alan:'sevgi' });
      k.ac({ mini:false, mesaj:'x' });
      k.menuAc('kisi');
      const p = document.querySelector('.king__menu');
      expect(p.textContent).toContain('Hobim satranç');
      expect(p.textContent).toContain('AYS’de öğrenildi');
      expect(p.querySelectorAll('[data-king^="kisi-sil:"]').length).toBe(1);
      expect(k.kisiOzeti()).toContain('Balığı sevmem (sohbetten)');
      await k.isle('hatırla: sabahları daha verimliyim');
      expect(H.etkin().some(x => x.metin === 'sabahları daha verimliyim' && x.katman === 'soz')).toBe(true);
    }));

    /* Söz 25 (2026-10-17): kişilik envanteri sohbetle. */
    it('«kişilik testi»: 20 madde tek tek; bitince beş boyut kişilik alanına; yeniden yapılınca eskisinin yerine', () => sahneyle(async () => {
      if(!window.LIFEOS.ENVANTER || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k);
      k.ac({ mini:true });
      await k.isle('kişilik testi');
      expect(k.envanterVar()).toBe(true);
      expect(!!document.querySelector('[data-king="env:5"]')).toBe(true);
      await k.isle('bunu bilmiyorum');                        // geçersiz cevap ilerletmez
      expect(k.akis().slice(-1)[0].metin).toContain('1 ile 5');
      for(let i = 0; i < 20; i++) await k.isle(String(1 + (i % 5)));
      expect(k.envanterVar()).toBe(false);
      const kay = H.etkin().filter(x => x.alan === 'kisilik');
      expect(kay).toHaveLength(5);
      expect(kay.every(x => x.katman === 'soz')).toBe(true);
      await k.isle('kişilik testi');
      for(let i = 0; i < 20; i++) await k.isle('3');
      expect(H.etkin().filter(x => x.alan === 'kisilik')).toHaveLength(5);
      await k.isle('kişilik testi');
      await k.isle('bırak');
      expect(k.envanterVar()).toBe(false);
    }));

    /* Söz 24 (2026-10-17): «… artık bana sorma / sor». */
    it('«SPİ’de uyku için artık sorma»: o tür doğrudan kaydedilir, «Geri al» kalır; «sor» geri alır', () => sahneyle(async () => {
      let kayit = 0;
      const veri = { onizle:t => /uyku/.test(t) ? { tur:'uyku', metin:'Uyku 7 sa',
        kaydet:async () => { kayit++; return { metin:'Uyku kaydedildi', geriAl:async () => { kayit--; } }; } }
        : /su/.test(t) ? { tur:'su', metin:'Su 250 ml', kaydet:async () => { kayit++; return 'Su kaydedildi'; } } : null };
      const { k } = sahne({ veri, modul:'spi' });
      k.ac({ mini:true });
      expect(k.sormaKomutu('sor bakalım')).toBe(null);                 // yalnız «sor» yetmez
      await k.isle('SPİ’de uyku için artık sorma');
      expect(k.sormaListesi()).toEqual(['SPİ · uyku']);
      await k.isle('uyku 7');
      expect(kayit).toBe(1);                                             // sormadan
      expect(!!document.querySelector('[data-king="geri-al"]')).toBe(true);
      await k.isle('su 250');
      expect(kayit).toBe(1);                                             // su için yine soruyor
      expect(!!document.querySelector('[data-king="kaydet"]')).toBe(true);
      await k.isle('uyku için yine sor');
      await k.isle('uyku 8');
      expect(kayit).toBe(1);
      /* modül geneli ve taşınma */
      await k.isle('AYS’de veri alırken bana sorma');
      expect(JSON.parse(localStorage.getItem(k.SORMA)).ays).toEqual({ '*':true });
      if(window.LIFEOS.ANIMASYON) expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(k.SORMA) >= 0).toBe(true);
    }));

    /* Söz 23 (2026-10-17): çıkarım sohbetle sorulur; doğruysa kaydedilir. */
    const ESP_VERI = () => ({ esp:{ disiplin:{ gun:12, dakika:{ philo:500, lang:100 }, adlar:{ philo:'Felsefe' } } } });
    it('çıkarım: «Doğru» onayla hafızaya; aynı çıkarım bir daha sorulmaz', () => sahneyle(async () => {
      if(!window.LIFEOS.CIKARIM || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k, { cikarimVeri:ESP_VERI });
      k.ac();
      expect(k.cikarimVar()).toBe(true);
      expect(k.akis()[0].metin).toContain('Felsefe');
      expect(k.akis()[0].son).toBe('Sence doğru mu?');
      document.querySelector('[data-king="cikarim:dogru"]').click();
      await new Promise(r => setTimeout(r, 0));
      const kay = H.etkin();
      expect([kay.length, kay[0].alan, kay[0].katman, kay[0].kaynak]).toEqual([1, 'gelisim', 'sohbet', 'kullanici']);
      expect(kay[0].metin).toContain('onayladı');
      expect(k.cikarimAdaylari().some(a => a.id === 'esp-disiplin:philo')).toBe(false);
    }));
    it('çıkarım: «Yanlış» bir daha sormaz; serbest cevap düzeltme olarak senin sözün', () => sahneyle(async () => {
      if(!window.LIFEOS.CIKARIM || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k, { cikarimVeri:ESP_VERI });
      k.ac({ mini:true });
      await k.isle('beni yorumla');
      expect(k.cikarimVar()).toBe(true);
      await k.isle('hayır');
      expect(H.etkin()).toHaveLength(0);
      expect(k.cikarimAdaylari()).toHaveLength(0);
      await k.isle('beni yorumla');
      expect(k.akis().slice(-1)[0].metin).toContain('yeni bir çıkarımım yok');
      /* düzeltme */
      k._ortam.depo.sil('lifeos.king.cikarim');
      await k.isle('beni yorumla');
      await k.isle('felsefe değil, tarih seviyorum');
      const kay = H.etkin();
      expect([kay.length, kay[0].katman, kay[0].alan]).toEqual([1, 'soz', 'gelisim']);
    }));

    /* Söz 21 (2026-10-17): «King yazarken tıkı tıkı, açıp kapatabildiğimiz yazı yazma». */
    it('yeni cevap harf harf yazılır, seyrek tıklar; dokununca biter; kapatılınca tek seferde', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri, yazma:true });
      const kareler = [];
      let tik = 0;
      Object.assign(k._ortam, { kare:fn => { kareler.push(fn); }, tikla:() => { tik++; return true; } });
      k.ac();
      await k.isle('uyku 7');
      const balon = () => Array.from(document.querySelectorAll('.king__balon--king')).pop();
      expect(k.yaziyorMu()).toBe(true);
      expect(balon().textContent.trim()).toBe('');
      const tam = k.akis().slice(-1)[0].metin;
      expect(balon().querySelector('.is-yaziyor').getAttribute('aria-label')).toContain(tam);
      /* zaman ilerler: yarısı yazılır, tık sayısı karakterden çok az */
      let z = 0;
      const ilerle = ms => { z += ms; const l = kareler.splice(0); l.forEach(f => f(z)); };
      ilerle(0); ilerle(400);
      const yarim = balon().textContent.trim().length;
      expect(yarim > 0 && yarim < tam.length).toBe(true);
      for(let i = 0; i < 200 && k.yaziyorMu(); i++) ilerle(16);
      expect(k.yaziyorMu()).toBe(false);
      expect(balon().textContent).toContain(tam);
      expect(tik > 0 && tik < balon().textContent.trim().length / 2).toBe(true);
      /* dokununca biter */
      await k.isle('uyku 8');
      ilerle(0);
      balon().querySelector('.is-yaziyor').click();
      expect(k.yaziyorMu()).toBe(false);
      expect(balon().textContent).toContain(k.akis().slice(-1)[0].metin);
      /* kapalıyken tek seferde; ses ayrı kapanır */
      k.yazmaSec('ses', false);
      expect(k.yazmaAyar()).toEqual({ yaz:true, ses:false });
      k.yazmaSec('yaz', false);
      await k.isle('uyku 9');
      expect(k.yaziyorMu()).toBe(false);
      expect(balon().textContent).toContain(k.akis().slice(-1)[0].metin);
      if(window.LIFEOS.ANIMASYON) expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(k.YAZMA) >= 0).toBe(true);
    }));
    it('boş kutuda ↑ son yazdığını geri getirir', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      const g = document.querySelector('.king__girdi');
      g.value = '';
      g.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowUp', bubbles:true }));
      expect(g.value).toBe('uyku 7');
      g.value = 'başka';
      g.dispatchEvent(new KeyboardEvent('keydown', { key:'ArrowUp', bubbles:true }));
      expect(g.value).toBe('başka');            // dolu kutuya dokunmaz
    }));
    it('King cevabı kopyalanır', () => sahneyle(async () => {
      const kopyalanan = [];
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k._ortam.kopyala = async m => { kopyalanan.push(m); return true; };
      k.ac();
      await k.isle('uyku 7');
      Array.from(document.querySelectorAll('.king__kopyala')).pop().click();
      await new Promise(r => setTimeout(r, 0));
      expect(kopyalanan[0]).toContain(k.akis().slice(-1)[0].metin);
    }));

    /* Söz 20 (2026-10-17): «King'in her şeye yetkisi olsun; hesabım hariç». */
    function yetkiSahnesi(){
      const Y = window.LIFEOS.YETKI;
      const durum = { tema:'system', kayit:{ a:1 }, bekleyen:[{ id:'p1', metin:'Uyku 7 sa' }], onaylanan:[] };
      Y.kur({ modul:'spi',
        tema:{ oku:() => durum.tema, yaz:async v => { durum.tema = v; } },
        onaylar:{ bekleyen:() => durum.bekleyen, onayla:async id => { durum.onaylanan.push(id); durum.bekleyen = []; return { ok:true }; } },
        donus:{ al:() => ({ data:durum.kayit }), yukle:async v => { durum.kayit = v.data; }, sil:async () => { durum.kayit = {}; } } });
      return durum;
    }
    it('küçük eylem hemen; «geri al» geri alır', () => sahneyle(async () => {
      if(!window.LIFEOS.YETKI) return;
      try{
        const durum = yetkiSahnesi();
        const { k } = sahne();
        k.ac();
        await k.isle('koyu tema yap');
        expect(durum.tema).toBe('dark');
        expect(!!document.querySelector('[data-king="geri-al"]')).toBe(true);
        await k.isle('geri al');
        expect(durum.tema).toBe('system');
      }finally{ window.LIFEOS.YETKI._sifirla(); }
    }));
    it('orta eylem önizleme + onay; «evet» de onaylar', () => sahneyle(async () => {
      if(!window.LIFEOS.YETKI) return;
      try{
        const durum = yetkiSahnesi();
        const { k } = sahne();
        k.ac();
        await k.isle('bekleyenleri onayla');
        expect(durum.onaylanan).toHaveLength(0);
        expect(k.akis().slice(-1)[0].satirlar).toEqual(['Uyku 7 sa']);
        await k.isle('evet');
        expect(durum.onaylanan).toEqual(['p1']);
      }finally{ window.LIFEOS.YETKI._sifirla(); }
    }));
    it('büyük eylem «evet»le olmaz; «Onaylıyorum» ile dönüş noktası alınır, sayfa yenilenir', () => sahneyle(async () => {
      if(!window.LIFEOS.YETKI) return;
      const Y = window.LIFEOS.YETKI;
      try{
        const durum = yetkiSahnesi();
        const { k } = sahne();
        let yenilendi = 0;
        k._ortam.yenile = () => { yenilendi++; };
        k.ac();
        await k.isle('sıfırdan başlayalım');
        expect(!!document.querySelector('[data-king="yetki-onay"]')).toBe(true);
        await k.isle('evet');
        expect(durum.kayit).toEqual({ a:1 });
        expect(k.akis().slice(-1)[0].metin).toContain('«evet» yetmez');
        await k.isle('Onaylıyorum');
        expect(durum.kayit).toEqual({});
        expect(!!Y.donusNoktasi()).toBe(true);
        expect(yenilendi).toBe(1);
        expect(JSON.parse(localStorage.getItem(k.TASIMA)).yenile).toBe(true);
        /* yenilenen sayfada King küçük kutu olarak açılır */
        const tasinan = localStorage.getItem(k.TASIMA);
        const s2 = sahne();
        localStorage.setItem(k.TASIMA, tasinan);
        s2.k.kur({ modul:'spi', git:() => {}, ozet:() => [] });
        expect(s2.k.acikMi() && s2.k.miniMi()).toBe(true);
        expect(s2.k.akis().slice(-1)[0].metin).toContain('sayfa yenilendi');
      }finally{ localStorage.removeItem(Y.DONUS); Y._sifirla(); }
    }));
    it('hesap işi yapılmaz; vazgeç hiçbir şeyi değiştirmez', () => sahneyle(async () => {
      if(!window.LIFEOS.YETKI) return;
      try{
        const durum = yetkiSahnesi();
        const { k } = sahne();
        k.ac();
        await k.isle('parolamı değiştir');
        expect(k.akis().slice(-1)[0].metin).toContain('Hesap sayfasından');
        await k.isle('hepsini onayla');
        await k.isle('hayır');
        expect(durum.onaylanan).toHaveLength(0);
        expect(k.akis().slice(-1)[0].metin).toBe('Tamam, hiçbir şeyi değiştirmedim.');
      }finally{ window.LIFEOS.YETKI._sifirla(); }
    }));

    /* Söz 19 (2026-10-17): cevap biçimi, sohbeti temizle / kaydet / kayıtlar. */
    it('cevap biçimi: Sesli yazana da okur, Yazılı konuşana da susar; seçim taşınır', () => sahneyle(async () => {
      const okunan = [];
      const sentez = { getVoices:() => [], speak:u => okunan.push(u.metin), cancel(){} };
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      Object.assign(k._ortam, { sentez:() => sentez, soz:m => ({ metin:m }) });
      k.ac();
      expect(k.cevapBicimi()).toBe('oto');
      await k.isle('uyku 7');
      expect(okunan).toHaveLength(0);            // otomatik: yazana yazıyla
      k.cevapSec('ses');
      await k.isle('uyku 7');
      expect(okunan.length > 0).toBe(true);
      expect(k.akis().slice(-1)[0].metin.length > 0).toBe(true);   // yazı da görünür
      okunan.length = 0;
      k.cevapSec('yazi');
      k.sesliSohbetAc();                         // sesle konuşuyor
      okunan.length = 0;
      await k.isle('uyku 7');
      expect(okunan).toHaveLength(0);
      if(window.LIFEOS.ANIMASYON) expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(k.CEVAP) >= 0).toBe(true);
      expect(k.cevapSec('saçma')).toBe(false);
    }));
    it('sohbeti temizle: ekrandan ve cihazdan gider, «Geri getir» geri koyar', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      expect(k.sohbetiTemizle()).toBe(true);
      expect(k.akis().some(m => m.metin === 'uyku 7')).toBe(false);
      expect(!!document.querySelector('[data-king="geri-getir"]')).toBe(true);
      expect(k.sohbetiGeriGetir()).toBe(true);
      expect(k.akis().some(m => m.metin === 'uyku 7')).toBe(true);
    }));
    it('sohbeti kaydet: kayıtlarda listelenir, açılır, indirilir, iki adımda silinir', () => sahneyle(async () => {
      const inen = [];
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri, modul:'spi' });
      Object.assign(k._ortam, { indir:(ad, metin) => { inen.push([ad, metin]); return true; } });
      k.ac();
      expect(k.sohbetiKaydet()).toBe(null);      // boş sohbet kaydedilmez
      await k.isle('uyku 7');
      const kayit = k.sohbetiKaydet();
      expect(k.kayitlar()).toHaveLength(1);
      expect(k.akis().slice(-1)[0].metin).toContain('bu cihazda, SPİ içinde');
      /* menü: Daha fazla → Kayıtlı sohbetler → kayıt */
      document.querySelector('[data-king="menu"]').click();
      expect(document.querySelector('.king__menu-say').textContent).toBe('1');
      document.querySelector('[data-king="kayitlar"]').click();
      expect(document.querySelectorAll('.king__kayitlar li')).toHaveLength(1);
      document.querySelector('[data-king="kayit:' + kayit.id + '"]').click();
      expect(document.querySelector('.king__kayit').textContent).toContain('uyku 7');
      document.querySelector('[data-king="indir:' + kayit.id + '"]').click();
      expect(/^king-spi-2026-10-05-\d{4}\.txt$/.test(inen[0][0])).toBe(true);
      expect(inen[0][1]).toContain('Sen: uyku 7');
      /* sil: ilk dokunuş sorar, ikincisi siler */
      k.menuAc({ id:kayit.id });
      expect(k.kayitSil(kayit.id)).toBe(false);
      expect(document.querySelector('[data-king="sil:' + kayit.id + '"]').textContent).toBe('Emin misin? Sil');
      expect(k.kayitSil(kayit.id)).toBe(true);
      expect(k.kayitlar()).toHaveLength(0);
    }));
    it('ekranda son altı mesaj; günün tamamı saklanır', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      for(let i = 0; i < 6; i++) await k.isle('uyku ' + (i + 5));
      expect(k.akis().length > 6).toBe(true);
      expect(document.querySelectorAll('.king__akis .king__balon').length).toBe(6);
    }));

    /* Söz 16–17: «ekran paylaşmaktan kastım PC, telefon ya da başka bir ekran». */
    function sahteModel(cevap){
      const istek = [];
      return { istek, M:{ visionChain:() => [{ provider:'gemini', model:'g' }], errorText:() => 'hata',
        complete:async (zincir, req) => { istek.push(req); return { text:cevap }; } } };
    }
    it('ekranımı paylaş: soru o anın tek karesiyle görüntü modeline gider; veri cümlesi yerelde kalır; Durdur biter', () => sahneyle(async () => {
      const sm = sahteModel('Ekranda bir deneme sonucu görüyorum: 42,5 net.');
      let bitti = 0, kare = 0;
      const veri = { onizle:t => /soru çözdüm/.test(t) ? { tur:'calisma', metin:'40 soru', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], veri, model:() => sm.M });
      Object.assign(k._ortam, { ekranDestek:() => true,
        ekranBaslat:async () => ({ kare:() => { kare++; return { mime:'image/jpeg', data:'QUJD' }; }, bitir:() => { bitti++; } }) });
      k.ac();
      expect(await k.paylasimBaslat()).toBe(true);
      expect(k.paylasimVar()).toBe(true);
      expect(!!document.querySelector('[data-king] .king__paylasim')).toBe(true);
      await k.isle('bu ekranda ne var?');
      expect(kare).toBe(1);
      expect(sm.istek.length).toBe(1);
      expect(sm.istek[0].messages[0].images[0].data).toBe('QUJD');
      expect(sm.istek[0].system).toContain('teşhis koyma');
      expect(sm.istek[0].system).toContain('uydurma');
      expect(k.akis().slice(-1)[0].metin).toContain('42,5 net');
      await k.isle('40 soru çözdüm');                       /* veri: görüntüye gitmez */
      expect(sm.istek.length).toBe(1);
      expect(k.akis().slice(-1)[0].onizleme.metin).toBe('40 soru');
      document.querySelector('[data-king="paylasim-bitir"]').click();
      expect(bitti).toBe(1);
      expect(k.paylasimVar()).toBe(false);
    }));

    it('telefonda paylaşım yok, söylenir; görüntü modeli yoksa söylenir', () => sahneyle(async () => {
      const { k } = sahne();
      k.kur({ modul:'spi', git:() => {}, ozet:() => [], model:() => ({ visionChain:() => [] }) });
      Object.assign(k._ortam, { ekranDestek:() => false });
      k.ac();
      expect(await k.paylasimBaslat()).toBe(false);
      expect(k.akis().slice(-1)[0].metin).toContain('ekran paylaşamıyor');
      Object.assign(k._ortam, { ekranDestek:() => true });
      expect(await k.paylasimBaslat()).toBe(false);
      expect(k.akis().slice(-1)[0].metin).toContain('görüntü okuyan bir yapay zekâ');
    }));

    it('fotoğrafı yorumla: görüntü modeli varsa «Ne gördüğünü söyle»; cevap okumadır, kayda yazılmaz', () => sahneyle(async () => {
      const sm = sahteModel('Bir tabak kuru fasulye ve pilav görüyorum.');
      const { k } = sahne();
      k.kur({ modul:'esp', git:() => {}, ozet:() => [], model:() => sm.M });
      Object.assign(k._ortam, { nesneUrl:() => 'blob:x', dosyaKare:async () => ({ mime:'image/jpeg', data:'WFla' }) });
      k.ac();
      k.fotoAl(new File([new Uint8Array([1, 2])], 'ekran.png', { type:'image/png' }));
      document.querySelector('[data-king="foto-yorum"]').click();
      await new Promise(r => setTimeout(r, 0));
      await new Promise(r => setTimeout(r, 0));
      expect(sm.istek[0].messages[0].images[0].data).toBe('WFla');
      expect(k.akis().slice(-1)[0].metin).toContain('kuru fasulye');
    }));

    it('ekranı göster: Merkez yokken başlıkları okur; uydurmaz', () => sahneyle(async () => {
      const { k } = sahne();
      const app = document.getElementById('app');
      const kutu = document.createElement('section');
      kutu.innerHTML = '<h2>Günün ölçümü</h2><h3>Su</h3>';
      (app || document.body).appendChild(kutu);
      try{
        k.ac();
        const e = k.ekranOku();
        expect(e.basliklar.indexOf('Günün ölçümü') >= 0).toBe(true);
        await k.ekranGoster();
        const son = k.akis().slice(-1)[0];
        expect(son.satirlar.indexOf('Su') >= 0).toBe(true);
        expect(document.querySelector('[data-king] .king__durum').textContent).toBe('yerel');
      }finally{ kutu.remove(); }
    }));

    it('sohbette «geri al»: son kayıt modülün kendi işleviyle geri alınır; yoksa söylenir', () => sahneyle(async () => {
      let kayit = 0;
      const veri = { onizle:t => /uyku/.test(t) ? { tur:'uyku', metin:'Uyku 7 sa',
        kaydet:async () => { kayit++; return { metin:'Uyku kaydedildi', geriAl:async () => { kayit--; } }; } } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      await k.isle('evet');
      expect(kayit).toBe(1);
      expect(!!document.querySelector('[data-king="geri-al"]')).toBe(true);
      await k.isle('geri al');
      expect(kayit).toBe(0);
      expect(k.akis().slice(-1)[0].metin).toBe('Geri aldım.');
      await k.isle('geri al');
      expect(k.akis().slice(-1)[0].metin).toBe('Geri alınacak bir kayıt yok.');
    }));

    it('sohbet kapatıp açınca kalır (aynı gün, bu cihaz)', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      k.kapat();
      await new Promise(r => setTimeout(r, 400));
      k.ac();
      expect(k.akis().some(m => m.metin === 'uyku 7')).toBe(true);
    }));

    it('sesli sohbet: King konuşunca yeniden dinler; «tamam» bitirir', () => sahneyle(async () => {
      const ss = (() => {
        const okunan = [];
        const sentez = { getVoices:() => [{ name:'Yelda', lang:'tr-TR', localService:true }], speak:u => { okunan.push(u); }, cancel(){} };
        let son = null;
        function Tanima(){ son = this; this.start = () => {}; this.stop = () => { this.onend && this.onend(); }; this.abort = this.stop; }
        return { sentez, okunan, tanimaSinifi:Tanima, son:() => son };
      })();
      const { k } = sahne();
      Object.assign(k._ortam, { tanima:() => ss.tanimaSinifi, sentez:() => ss.sentez, soz:m => ({ metin:m }) });
      k.ac();
      expect(k.sesliSohbetAc()).toBe(true);
      expect(k.sesliSohbetMi()).toBe(true);
      /* King'in cümlesi bitince dinleme başlar */
      ss.okunan.forEach(u => u.onend && u.onend());
      expect(document.querySelector('[data-king]').classList.contains('is-dinliyor')).toBe(true);
      const r = ss.son();
      r.onresult({ results:[Object.assign([{ transcript:'tamam' }], { isFinal:true })] });
      r.onend();
      expect(k.sesliSohbetMi()).toBe(false);
      expect(k.akis().slice(-1)[0].metin).toContain('bitirdim');
    }));

    it('öteki modülün verisi tahmin edilmez, iletilir (sunucu sözü 23); giriş yoksa yalnız «aç»', () => sahneyle(async () => {
      const H = window.LIFEOS.HESAP;
      if(!H){ expect('hesap.js').toBe('yüklü'); return; }
      const eski = { durum:H.durum, gelenBirak:H.gelenBirak };
      const giden = [];
      try{
        H.durum = () => ({ oturum:{ ad:'omer' } });
        H.gelenBirak = async (modul, metin) => { giden.push([modul, metin]); return { ok:true, mesaj:'SPİ açılınca Onaylar’a düşer.' }; };
        const { k, gidilen } = sahne({ modul:'ays', veri:{ onizle:() => null } });
        k.ac();
        await k.isle('bir tabak kuru fasulye yedim');
        expect(gidilen.length).toBe(0);
        expect(k.akis().slice(-1)[0].son).toContain('SPİ’ye ileteyim mi?');
        document.querySelector('[data-king="ilet"]').click();
        await new Promise(r => setTimeout(r, 0));
        expect(giden).toEqual([['spi', 'bir tabak kuru fasulye yedim']]);
        expect(k.akis().slice(-1)[0].metin).toContain('İlettim');
        /* niyet (veri değil) iletilmez, açılır */
        expect(k.veriGibi('antrenman yapacağım')).toBe(false);
        expect(k.veriGibi('45 dk koştum')).toBe(true);
        H.durum = () => ({ oturum:null });
        await k.isle('bir tabak kuru fasulye yedim');
        expect(!!document.querySelector('[data-king="ilet"]')).toBe(false);
        expect(!!document.querySelector('[data-king="git-onay"]')).toBe(true);
      }finally{ H.durum = eski.durum; H.gelenBirak = eski.gelenBirak; }
    }));
    it('açık komut ve hazır cevap doğrudan gider', () => sahneyle(async () => {
      const { k, gidilen } = sahne();
      await k.isle('hareket sayfasına git');
      expect(gidilen.map(x => x[0])).toEqual(['move']);
    }));
  });

  describe('King — adres ve açılış', () => {
    it('başka modülden gelinen #king= hedefi yalnız katalogdaysa uygulanır', () => sahneyle(async () => {
      let s = sahne({ hash:'#king=move:kardiyo' });
      expect(s.gidilen).toEqual([['move', { sekme:'kardiyo' }]]);
      /* Söz 9: King'le gelindi; burada küçük kutu olarak açık. */
      expect(s.k.acikMi() && s.k.miniMi()).toBe(true);
      expect(s.k.akis()[0].metin).toContain('Buradayım');
      expect(s.giden).toContain('hash-silindi');
      s = sahne({ hash:'#king=evil' });
      expect(s.gidilen).toHaveLength(0);
      s = sahne({ hash:'#king=lang', modul:'spi' });   // esp rotası spi'de yok
      expect(s.gidilen).toHaveLength(0);
    }));

    it('Ctrl iki kez açar, Esc kapatır; ışık ve baloncuk aynı katmanda', () => sahneyle(async () => {
      const { k } = sahne();
      const tus = key => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles:true }));
      tus('Control'); tus('Control');
      expect(k.acikMi()).toBe(true);
      const el = document.querySelector('[data-king]');
      expect(!!el.querySelector('.king-isik')).toBe(true);
      expect(el.querySelector('[role="dialog"]').getAttribute('aria-label')).toBe('King ile konuş');
      expect(el.textContent).toContain('Ne yapıyoruz?');
      expect(el.querySelectorAll('[data-king-hazir]').length).toBe(5);
      tus('Escape');
      expect(k.acikMi()).toBe(false);
      /* Odak: arka plan perdesi; dokununca kapanır, sayfaya tıklama geçmez. */
      tus('Control'); tus('Control');
      const perde = document.querySelector('[data-king] .king-perde');
      expect(!!perde).toBe(true);
      perde.click();                                          /* söz 9: perde kapatmaz, küçültür */
      expect(k.acikMi() && k.miniMi()).toBe(true);
      tus('Escape');                                          /* yalnız Esc ya da ✕ kapatır */
      expect(k.acikMi()).toBe(false);
      tus('Control'); tus('c'); tus('Control');               // Ctrl+C sonrası açmaz
      expect(k.acikMi()).toBe(false);
    }));
  });

  /* 2026-10-05 (kullanıcı: «Apple Intelligence gibi olan King'i
     profesyonelleştir»): başlık ve kapat, yeni cevap belirerek gelir, hazır
     cevapta modülün noktası, veri önizlemesi kart. */
  describe('King — hitap', () => {
    it('hesaptaki hitapla selamlar, yoksa görünen adla; doğum gününde kutlar', () => sahneyle(async () => {
      const H = window.LIFEOS.HESAP, eski = H && H.durum;
      if(!H){ expect('hesap.js').toBe('yüklü'); return; }
      const baloncuk = () => document.querySelector('[data-king]').textContent;
      try{
        H.durum = () => ({ oturum:{ ad:'omer', gorunen_ad:'Ömer Faruk', hitap:'Ömer', dogum_gun:'04-23' } });
        let { k } = sahne();
        k.ac();
        expect(baloncuk()).toContain('Günaydın Ömer.');
        k.kapat();
        H.durum = () => ({ oturum:{ ad:'omer', gorunen_ad:'Ömer Faruk', hitap:'', dogum_gun:'10-05' } });   // sahnenin günü
        ({ k } = sahne());
        k.ac();
        expect(baloncuk()).toContain('İyi ki doğdun Ömer Faruk.');
      }finally{ H.durum = eski; }
    }));
  });

  describe('King — profesyonel görünüm', () => {
    it('başlıkta King ve bulunulan modül; kapat düğmesi kapatır', () => sahneyle(async () => {
      const { k } = sahne({ modul:'esp' });
      k.ac();
      const bas = document.querySelector('[data-king] .king__bas');
      expect(!!bas).toBe(true);
      expect(bas.textContent).toContain('King');
      expect(bas.textContent).toContain('ESP');
      const kapat = bas.querySelector('[data-king="kapat"]');
      expect(kapat.getAttribute('aria-label')).toBe('Kapat');
      kapat.click();
      expect(k.acikMi()).toBe(false);
    }));

    it('yalnız en yeni cevap belirerek gelir; hazır cevapta modül noktası', () => sahneyle(async () => {
      const { k } = sahne();
      k.ac();
      const hazir = Array.from(document.querySelectorAll('[data-king-hazir]'));
      expect(hazir[0].querySelector('.king__nokta--spi') !== null).toBe(true);   // Antrenman → SPİ
      expect(hazir[2].querySelector('.king__nokta--ays') !== null).toBe(true);   // Test → AYS
      await k.isle('bugünün özeti');
      await k.isle('nasıl gidiyorum');
      const king = document.querySelectorAll('[data-king] .king__balon--king');
      expect(king.length).toBe(2);
      expect(king[1].classList.contains('is-yeni')).toBe(true);
      expect(king[0].classList.contains('is-yeni')).toBe(false);
    }));

    it('veri önizlemesi kart olarak çizilir; Kaydet ana düğme', () => sahneyle(async () => {
      const veri = { onizle:t => (/uyku/.test(t) ? { metin:'Uyku 7 sa', ipucu:'Günlük ölçüm',
        kaydet:async () => 'Uyku kaydedildi' } : null) };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      const kart = document.querySelector('[data-king] .king__onizle');
      expect(!!kart).toBe(true);
      expect(kart.textContent).toContain('Uyku 7 sa');
      expect(kart.textContent).toContain('Günlük ölçüm');
      expect(document.querySelector('[data-king="kaydet"]').classList.contains('king__cip--ana')).toBe(true);
    }));
  });
  /* Kullanıcı (2026-10-06): «kingle konuşurken HKM'deki kingle konuşur gibi
     olacak, o AI kısmında». HKM bağlıyken sorular, özet ve anlaşılmayan istek
     HKM'deki King'e (/api/chat, agent king) gider: geçmişi HKM tutar, modülden
     konuşmak oradaki konuşmanın devamıdır. Sayfaya götürme ve kayıt yerelde
     kalır (HKM modüle yazmaz, §1.4). HKM yoksa yerel King aynen sürer. */
  describe('King — HKM’deki King', () => {
    function merkez(cevap){
      const istekler = [];
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200/' }), urlOk:() => true });
      const fetch = async (url, o) => {
        istekler.push({ url, o, govde:JSON.parse(o.body) });
        const c = typeof cevap === 'function' ? await cevap() : cevap;
        if(c instanceof Error) throw c;
        return { status:200, json:async () => c };
      };
      return { hkm, fetch, istekler };
    }
    function bagliSahne(m, o){
      return sahne(Object.assign({ hkm:m.hkm, fetch:m.fetch, ozet:() => ['Toparlanma iyi.'] }, o || {}));
    }

    it('soru ve anlaşılmayan istek HKM’deki King’e gider; cevap söylenir, hiçbir yere götürülmez', () => sahneyle(async () => {
      const m = merkez({ ok:true, mode:'model', text:'Dün 6 saat uyudun; bu gece erken yat.' });
      const { k, giden, gidilen } = bagliSahne(m);
      await k.isle('Bugün neden yorgunum?');
      expect(m.istekler.length).toBe(1);
      expect(m.istekler[0].url).toBe('http://127.0.0.1:4200/api/chat');
      expect(m.istekler[0].o.headers.Authorization).toBe('Bearer jeton');
      expect(m.istekler[0].govde.agent).toBe('king');
      expect(m.istekler[0].govde.text).toBe('Bugün neden yorgunum?');
      expect(/^\d{4}-\d\d-\d\d$/.test(m.istekler[0].govde.date)).toBe(true);
      expect(k.akis().slice(-1)[0].metin).toBe('Dün 6 saat uyudun; bu gece erken yat.');
      /* Kelimesi sayfa adına benzeyen SORU artık sayfaya götürülmez. */
      await k.isle('hangi derse çalışayım?');
      await k.isle('bilmem ne şey');
      expect(m.istekler.length).toBe(3);
      expect(giden.length + gidilen.length).toBe(0);
    }));

    it('sayfa komutu, niyet cümlesi ve kayıt yerelde kalır (HKM’ye gitmez)', () => sahneyle(async () => {
      const m = merkez({ ok:true, mode:'model', text:'x' });
      let kaydedildi = 0;
      const { k, gidilen } = bagliSahne(m, { veri:{ onizle:t => /^uyku \d/.test(t)
        ? { metin:'Uyku 7 sa', kaydet:async () => { kaydedildi++; return 'Kaydedildi.'; } } : null } });
      await k.isle('hareket sayfasına git');
      await k.isle('antrenman yapacağım');
      await k.isle('uyku 7');
      expect(m.istekler.length).toBe(0);
      expect(gidilen.map(g => g[0])).toEqual(['move', 'move']);
      expect(k.akis().slice(-1)[0].onizleme.metin).toBe('Uyku 7 sa');
    }));

    it('düşünürken baloncuk bekler; cevap gelince yerini alır', () => sahneyle(async () => {
      let bitir = null;
      const m = merkez(() => new Promise(r => { bitir = () => r({ ok:true, mode:'model', text:'Hazırım.' }); }));
      const { k } = bagliSahne(m);
      const is = k.isle('bugün ne yapmalıyım?');
      await new Promise(r => setTimeout(r, 0));
      expect(k.akis().slice(-1)[0].bekliyor).toBe(true);
      bitir();
      await is;
      expect(k.akis().some(x => x.bekliyor)).toBe(false);
      expect(k.akis().slice(-1)[0].metin).toBe('Hazırım.');
    }));

    it('HKM’ye ulaşılamazsa ya da modeli yoksa yerel King sürer ve nedenini söyler', () => sahneyle(async () => {
      let m = merkez(new Error('ağ yok'));
      let sh = bagliSahne(m);
      await sh.k.isle('bugünün özeti');
      expect(sh.k.akis().slice(-1)[0].satirlar).toEqual(['Toparlanma iyi.']);          // yerel özet
      await sh.k.isle('bilmem ne şey');
      expect(sh.k.akis().slice(-1)[0].metin).toContain('Merkeze (HKM) şu an ulaşılamadı');
      birak();
      m = merkez({ ok:false, mode:'yok', text:null, note:'Model kapalı.' });
      sh = bagliSahne(m);
      await sh.k.isle('bilmem ne şey');
      expect(sh.k.akis().slice(-1)[0].metin).toContain('modeli şu an kapalı');
      expect(sh.k.akis().slice(-1)[0].metin).toContain('anlayamadım');
    }));
  });

  /* Kullanıcı (2026-10-17): «King'de kaydırınca arkada sayfa kayıyor,
     sonra yerinde sıkışıyor». Akış dibe gelince tekerlek arkadaki sayfaya
     geçiyordu (Playwright: masaüstünde 208, telefonda 550 piksel); perdenin
     üstünde de. Büyük King açıkken sayfa kilitli, akış kendi içinde kalır;
     küçük kutuda sayfa serbesttir (söz 9). Test sayfası king.css'i
     yüklemez: kural dosyadan okunup geçici olarak takılır. */
  describe('King — kaydırma arkaya geçmez', () => {
    async function stilli(fn){
      const r = await fetch('../css/king.css');
      const st = document.createElement('style');
      st.textContent = await r.text();
      document.head.appendChild(st);
      try{ await fn(); } finally { st.remove(); }
    }
    const tasma = () => getComputedStyle(document.documentElement).overflowY;
    it('büyük King açıkken sayfa kaymaz; küçülünce ve kapanınca serbest', () => stilli(() => sahneyle(async () => {
      const once = tasma();
      const { k } = sahne();
      k.ac();
      expect(tasma()).toBe('hidden');
      const akis = document.querySelector('.king__akis');
      expect(getComputedStyle(akis).overscrollBehaviorY).toBe('contain');
      k.kucult();
      expect(tasma()).toBe(once);
      const son = document.querySelector('.king__mini-son');
      if(son) expect(getComputedStyle(son).overscrollBehaviorY).toBe('contain');
      k.buyut();
      expect(tasma()).toBe('hidden');
      k.kapat();
      expect(tasma()).toBe(once);
    })));
    it('perdeye dokunuş kaydırma başlatmaz (telefon)', () => stilli(() => sahneyle(async () => {
      const { k } = sahne();
      k.ac();
      expect(getComputedStyle(document.querySelector('.king-perde')).touchAction).toBe('none');
      k.kapat();
    })));
  });
})();
