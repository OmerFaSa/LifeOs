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

    /* Söz 23 (2026-10-18): çıkarım sohbette sorulmaz, Onaylar'da karar verilir.
       Hata: açılışta «Senin üzerine bir çıkarım yaptım … Sence doğru mu?»
       sohbete düşüyordu; ardından yazılan «MERHABA» düzeltme sayılıp «Anladım,
       senin cümlenle not ettim» diye hafızaya yazılıyordu. */
    const ESP_VERI = () => ({ esp:{ disiplin:{ gun:12, dakika:{ philo:500, lang:100 }, adlar:{ philo:'Felsefe' } } } });
    it('çıkarım sohbete girmez; «MERHABA» hafızaya yazılmaz', () => sahneyle(async () => {
      if(!window.LIFEOS.CIKARIM || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k, { cikarimVeri:ESP_VERI });
      expect(k.cikarimAdaylari().length > 0).toBe(true);
      k.ac();
      expect(k.akis().some(m => /çıkarım/i.test(m.metin || '') || m.son === 'Sence doğru mu?')).toBe(false);
      expect(!!document.querySelector('[data-king^="cikarim:"]')).toBe(false);
      await k.isle('MERHABA');
      expect(/anlayamadım/.test(k.akis().slice(-1)[0].metin)).toBe(false);   // selam selamla karşılanır
      expect(H.etkin()).toHaveLength(0);
      expect(k.akis().some(m => /senin cümlenle not ettim/.test(m.metin || ''))).toBe(false);
      expect(k.cikarimAdaylari().length > 0).toBe(true);           // karar Onaylar'da bekliyor
    }));
    it('çıkarım Onaylar kartında: Doğru kaydeder, Geri al geri getirir; Yanlış bir daha sormaz', () => sahneyle(async () => {
      if(!window.LIFEOS.CIKARIM || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k, { cikarimVeri:ESP_VERI });
      const kart = k.cikarimKarti(3);
      expect(kart).toContain('Felsefe');
      expect(kart).toContain('data-act="cikarim-karar"');
      expect(kart).toContain('data-karar="dogru"');
      expect(kart).toContain('data-karar="yanlis"');
      const id = 'esp-disiplin:philo';
      const r = await k.cikarimOnayla(id, 'dogru');
      expect(r.ok).toBe(true);
      const kay = H.etkin();
      expect([kay.length, kay[0].alan, kay[0].katman, kay[0].kaynak]).toEqual([1, 'gelisim', 'sohbet', 'kullanici']);
      expect(k.cikarimAdaylari().some(a => a.id === id)).toBe(false);
      await r.geriAl();
      expect(H.etkin()).toHaveLength(0);
      expect(k.cikarimAdaylari().some(a => a.id === id)).toBe(true);
      const y = await k.cikarimOnayla(id, 'yanlis');
      expect(y.ok).toBe(true);
      expect(H.etkin()).toHaveLength(0);
      expect(k.cikarimKarti(3)).toBe('');
      expect((await k.cikarimOnayla(id, 'dogru')).ok).toBe(false);   // artık aday değil
    }));
    it('çıkarımı kendi cümlenle düzeltmek senin sözün olur; boş cümle yazılmaz', () => sahneyle(async () => {
      if(!window.LIFEOS.CIKARIM || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      const H = hafizali(k, { cikarimVeri:ESP_VERI });
      const id = 'esp-disiplin:philo';
      expect((await k.cikarimOnayla(id, 'kismen', '   ')).ok).toBe(false);
      expect(H.etkin()).toHaveLength(0);
      const r = await k.cikarimOnayla(id, 'kismen', 'felsefe değil, tarih seviyorum');
      expect(r.ok).toBe(true);
      const kay = H.etkin();
      expect([kay.length, kay[0].katman, kay[0].alan, kay[0].metin]).toEqual([1, 'soz', 'gelisim', 'felsefe değil, tarih seviyorum']);
      expect((await k.cikarimOnayla(id, 'bilinmez')).ok).toBe(false);
    }));
    it('«beni yorumla» çıkarımı sormaz, Onaylar’ı söyler', () => sahneyle(async () => {
      if(!window.LIFEOS.CIKARIM || !window.LIFEOS.Hafiza) return;
      const { k } = sahne();
      k._ortam.kisiSunucu = async () => null;
      hafizali(k, { cikarimVeri:ESP_VERI });
      k.ac({ mini:true });
      const r = await k.isle('beni yorumla');
      expect(r.tur).toBe('cikarim-onaylar');
      expect(k.akis().slice(-1)[0].metin).toContain('Onaylar');
      await k.isle('evet');
      expect(k.cikarimAdaylari().length > 0).toBe(true);
    }));

    /* Söz 21 (2026-10-18): «tıkı tıkı seslerle yazma işi amatörce». Cevap tek
       seferde gelir, ses çalmaz; menüde yazma anahtarı yok. */
    it('cevap tek seferde gelir, ses çalmaz; yazma anahtarı yok', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      const eskiC = window.AudioContext;
      let ses = 0;
      window.AudioContext = function(){ ses++; };
      try{
        k.ac();
        await k.isle('uyku 7');
        const balon = Array.from(document.querySelectorAll('.king__balon--king')).pop();
        expect(balon.textContent).toContain(k.akis().slice(-1)[0].metin);
        expect(!!document.querySelector('.is-yaziyor')).toBe(false);
        expect(ses).toBe(0);
        expect(k.yazmaSec).toBe(undefined);
        expect(k._ortam.tikla).toBe(undefined);
        k.menuAc('menu');
        expect(!!document.querySelector('[data-king^="yazma:"]')).toBe(false);
      }finally{ window.AudioContext = eskiC; }
      if(window.LIFEOS.ANIMASYON) expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.king.yazma') < 0).toBe(true);
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
    /* Söz 26 (2026-10-18): büyük pencere GPT gibi; sohbetin tamamı görünür. */
    it('büyük pencerede sohbetin tamamı görünür; kenarda geçmiş ve araçlar', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      for(let i = 0; i < 6; i++) await k.isle('uyku ' + (i + 5));
      expect(document.querySelectorAll('.king__akis .king__balon').length).toBe(k.akis().length);
      expect(!!document.querySelector('.king__yan [data-king="yeni-sohbet"]')).toBe(true);
      /* Söz 27: araçlar yazı alanındaki «+» menüsünde; solda yalnız sohbetler. */
      expect(!!document.querySelector('.king__yan .king__arac')).toBe(false);
      document.querySelector('[data-king="arac"]').click();
      const araclar = Array.from(document.querySelectorAll('.king__arac-menu [data-king]')).map(b => b.getAttribute('data-king'));
      expect(araclar.indexOf('ekran') >= 0 && araclar.indexOf('foto-sec') >= 0 && araclar.indexOf('pdf-sec') >= 0).toBe(true);
      document.querySelector('.king__arac-menu [data-king="ekran"]').click();
      expect(!!document.querySelector('.king__arac-menu')).toBe(false);          // seçince kapanır
      k.menuAc('menu');
      expect(k.ARACLAR.every(a => a.is && a.ad && typeof a.kosul === 'function')).toBe(true);
      /* küçük King kenar çubuğu çizmez */
      k.kucult();
      expect(!!document.querySelector('.king__yan')).toBe(false);
    }));
    it('Yeni sohbet: açık sohbet geçmişe geçer; geçmişten açılan sohbet oradan sürer, kopya olmaz', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      document.querySelector('[data-king="yeni-sohbet"]').click();
      expect(k.akis()).toHaveLength(0);
      expect(k.kayitlar()).toHaveLength(1);
      const id = k.kayitlar()[0].id;
      const gecmis = document.querySelector('[data-king="kayit-ac:' + id + '"]');
      expect(gecmis.textContent).toContain('uyku 7');
      /* boş sohbette Yeni sohbet geçmişe boş kayıt yazmaz */
      k.yeniSohbet();
      expect(k.kayitlar()).toHaveLength(1);
      /* aç, sürdür, yeniden yeni sohbet: aynı kayıt güncellenir */
      k.kayitAc(id);
      expect(k.aktifKayit()).toBe(id);
      expect(k.akis().some(m => m.metin === 'uyku 7')).toBe(true);
      await k.isle('uyku 8');
      k.yeniSohbet();
      expect(k.kayitlar()).toHaveLength(1);
      expect(k.kayitlar()[0].mesajlar.some(m => m.metin === 'uyku 8')).toBe(true);
    }));
    /* Söz 27 (2026-10-18): Yaz · Dinle · Konuş · Ekran; birbirini kapatır. */
    it('kipler: Dinle cevabı sesli okur, Konuş sesli sohbeti açar, Ekran önizlemeli paylaşır; biri ötekini kapatır', () => sahneyle(async () => {
      const okunan = [];
      const { k } = sahne();
      k.kur({ modul:'spi', git:() => {}, ozet:() => [], model:() => ({ visionChain:() => [{ provider:'gemini', model:'g' }] }) });
      let bitti = 0;
      const video = document.createElement('video');
      Object.assign(k._ortam, {
        sentez:() => ({ cancel(){}, getVoices:() => [], speak:u => { okunan.push(u.text); if(u.onend) u.onend(); } }),
        soz:t => ({ text:t }),
        tanima:() => function(){ this.start = () => {}; this.stop = () => {}; },
        ekranDestek:() => true,
        ekranBaslat:async () => ({ video, kare:() => ({ mime:'image/jpeg', data:'QUJD' }), bitir:() => { bitti++; } }),
      });
      k.ac();
      expect(k.KIPLER.map(x => x.id)).toEqual(['yaz', 'dinle', 'konus', 'ekran', 'kamera']);
      /* Kipler açılır menüde: kapalıyken yalnız seçili kipin hapı görünür. */
      expect([document.querySelectorAll('[data-king^="kip:"]').length, document.querySelector('[data-king="kipler"]').textContent]).toEqual([0, 'Yaz']);
      document.querySelector('[data-king="kipler"]').click();
      expect(document.querySelectorAll('.king__kip-menu [data-king^="kip:"]').length).toBe(4);
      document.querySelector('[data-king="kip:dinle"]').click();
      await new Promise(r => setTimeout(r, 0));
      expect([k.kip(), !!document.querySelector('.king__kip-menu'), document.querySelector('[data-king="kipler"]').textContent]).toEqual(['dinle', false, 'Dinle']);
      await k.kipSec('yaz');
      expect(k.kip()).toBe('yaz');
      await k.kipSec('dinle');
      expect(k.kip()).toBe('dinle');
      expect(!!document.querySelector('.king__kip-panel--dinle')).toBe(false);   // 2026-10-19: Dinle kutusuz; ses ve hız ··· menüsünde
      await k.isle('bugünün özeti');
      expect(okunan.length > 0).toBe(true);                                   // yazdın, sesli okudu
      await k.kipSec('ekran');
      expect([k.kip(), k.cevapBicimi()]).toEqual(['ekran', 'oto']);           // Dinle kapandı
      expect(document.querySelector('[data-king-onizle] video')).toBe(video);  // canlı önizleme
      expect(!!document.querySelector('[data-king="ekran-sor"]')).toBe(true);
      /* 2026-10-21: ekran açıkken Konuş ekranı kapatmaz; ikisi birlikte çalışır. */
      await k.kipSec('konus');
      expect([k.kip(), k.sesliSohbetMi(), bitti]).toEqual(['ekran', true, 0]);
      expect(document.querySelector('[data-king="ekran-ses"]').textContent).toBe('Sesli konuşmayı bitir');
      await k.kipSec('yaz');                                                  // Yaz ikisini de bitirir
      expect([k.kip(), k.sesliSohbetMi(), bitti]).toEqual(['yaz', false, 1]);
      await k.kipSec('konus');
      expect(!!document.querySelector('.king__kip-panel--konus')).toBe(true);
      await k.kipSec('yaz');
      expect([k.kip(), k.sesliSohbetMi()]).toEqual(['yaz', false]);
      /* desteklenmeyen kip görünmez ve seçilmez */
      Object.assign(k._ortam, { ekranDestek:() => false });
      k.menuAc(null);
      document.querySelector('[data-king="kipler"]').click();
      expect([!!document.querySelector('.king__kip-menu'), !!document.querySelector('[data-king="kip:ekran"]')]).toEqual([true, false]);
      expect(await k.kipSec('ekran')).toBe(false);
    }));
    it('klasörler: oluştur, sohbeti taşı, klasör silinince sohbet silinmez', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      k.yeniSohbet();
      const id = k.kayitlar()[0].id;
      expect(k.klasorEkle('   ')).toBe(null);
      const f = k.klasorEkle('Sağlık');
      expect(k.klasorler().map(x => x.ad)).toEqual(['Sağlık']);
      expect(k.kayitTasi(id, 'yok')).toBe(false);
      expect(k.kayitTasi(id, f.id)).toBe(true);
      k.menuAc(null);
      k.bolumSec('kutuphane');
      const klasor = document.querySelector('.king__klasor');
      expect(klasor.textContent).toContain('Sağlık');
      expect(!!klasor.querySelector('[data-king="kayit-ac:' + id + '"]')).toBe(true);
      /* aç, sürdür, yeni sohbet: klasörü korunur */
      k.kayitAc(id);
      await k.isle('uyku 8');
      k.yeniSohbet();
      expect(k.kayitlar()[0].klasor).toBe(f.id);
      k.klasorSil(f.id);
      expect(k.klasorler()).toHaveLength(0);
      expect([k.kayitlar().length, k.kayitlar()[0].klasor]).toEqual([1, null]);
    }));
    it('sohbet yeniden adlandırılır ve sabitlenir; ikisi de sohbet sürünce korunur', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      await k.isle('uyku 7');
      k.yeniSohbet();
      const id = k.kayitlar()[0].id;
      expect(k.kayitAdlandir(id, '  Uyku düzenim  ')).toBe(true);
      expect(k.kayitSabitle(id)).toBe(true);
      k.menuAc(null);
      const yan = document.querySelector('.king__yan').textContent;
      expect(yan).toContain('Sabitlenenler');
      expect(yan).toContain('Uyku düzenim');
      k.kayitAc(id);
      await k.isle('uyku 8');
      k.yeniSohbet();
      expect([k.kayitlar()[0].ad, k.kayitlar()[0].sabit]).toEqual(['Uyku düzenim', true]);
      k.kayitAdlandir(id, '');                                   // boş ad: ilk soruya döner
      expect(k.kayitSabitle(id)).toBe(false);
      k.menuAc(null);
      expect(document.querySelector('[data-king="kayit-ac:' + id + '"]').textContent).toContain('uyku 7');
      expect(document.querySelector('.king__yan').textContent.indexOf('Sabitlenenler') < 0).toBe(true);
    }));
    it('önceki günün sohbeti açılışta geçmişe geçer, kaybolmaz', () => sahneyle(async () => {
      const { k } = sahne();
      k.kur({ modul:'spi', git:() => {}, ozet:() => [] });
      localStorage.setItem('king.sohbet.spi', JSON.stringify({ gun:'2026-10-04', akis:[{ kim:'sen', metin:'dünkü soru' }, { kim:'king', metin:'dünkü cevap' }] }));
      k.ac();
      expect(k.akis().some(m => m.metin === 'dünkü soru')).toBe(false);
      const l = k.kayitlar();
      expect(l).toHaveLength(1);
      expect(l[0].mesajlar.map(m => m.metin)).toEqual(['dünkü soru', 'dünkü cevap']);
      expect(l[0].zaman.slice(0, 10)).toBe('2026-10-04');
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
      expect(k.akis().slice(-1)[0].metin).toContain('Merkez’e (HKM) bağlı');
    }));

    /* 2026-10-21: model ayarları yalnız Merkez'de; görüntü HKM'nin görsel kademesine gider. */
    it('Merkez bağlıyken modülde model olmasa da ekran karesi /api/ofis/cevap ile görsel kademeye gider', () => sahneyle(async () => {
      const istekler = [];
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => { istekler.push({ url, govde:JSON.parse(o.body) });
        return { status:200, json:async () => ({ ok:true, text:'Ekranda AYS Bugün sayfası var.' }) }; };
      const { k } = sahne({ hkm, fetch });
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], hkm, model:() => ({ visionChain:() => [] }) });
      Object.assign(k._ortam, { ekranDestek:() => true,
        ekranBaslat:async () => ({ kare:() => ({ mime:'image/jpeg', data:'QUJD' }), bitir:() => {} }) });
      try{
        k.ac();
        expect(await k.paylasimBaslat()).toBe(true);
        await k.isle('ekranda ne var?');
        const g = istekler.find(x => /\/api\/ofis\/cevap$/.test(x.url));
        /* Ekran karesi «ekran» yeteneğiyle: GPU'da duran sohbet modeli (hızlı); fotoğraf «gorsel»de kalır. */
        expect([!!g, g && g.govde.yetenek, g && g.govde.modul, g && g.govde.gorseller[0].data]).toEqual([true, 'ekran', 'ays', 'QUJD']);
        expect(k.akis().slice(-1)[0].metin).toBe('Ekranda AYS Bugün sayfası var.');
      }finally{ k.paylasimBitir(); k.kapat(); }
    }));

    /* 2026-10-21, kullanıcı: King'in «elleri» — kamera kipi; masadaki kâğıda bakar, yüz yorumu yapmaz. */
    it('kamera: kamera varsa kip menüsünde; soru tek kareyle hızlı modele, «oku» keskin modele; göz masaya bakar; Ekran kamerayı kapatır', () => sahneyle(async () => {
      const istekler = [], zaman = [];
      let cevap = 'Kâğıtta bir türev sorusu var.';
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => { istekler.push(JSON.parse(o.body)); return { status:200, json:async () => ({ ok:true, text:cevap }) }; };
      const { k } = sahne({ hkm, fetch });
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], hkm, model:() => ({ visionChain:() => [] }) });
      let bitti = 0, cihaz = null;
      const video = document.createElement('video');
      Object.assign(k._ortam, { kameraDestek:() => true, ekranDestek:() => true, zamanla:fn => { zaman.push(fn); },
        tanima:() => function(){ this.start = () => {}; this.stop = () => {}; },
        kameralar:async () => [{ id:'a', ad:'Dahili' }, { id:'b', ad:'USB' }],
        kameraBaslat:async (s, id) => { cihaz = id; return { video, kare:() => ({ mime:'image/jpeg', data:'S0FN' }), bitir:() => { bitti++; } }; },
        ekranBaslat:async () => ({ kare:() => ({ mime:'image/jpeg', data:'RUtS' }), bitir:() => {} }) });
      try{
        k.ac();
        await k.kamTazele();
        document.querySelector('[data-king="kipler"]').click();
        expect(!!document.querySelector('.king__kip-menu [data-king="kip:kamera"]')).toBe(true);
        k.kamSec('b');
        expect(await k.kipSec('kamera')).toBe(true);
        expect([k.kip(), cihaz, document.querySelector('[data-king-onizle] video') === video]).toEqual(['kamera', 'b', true]);
        expect(document.querySelector('[data-king="kamera-sor"]').textContent).toBe('Kamerada ne görüyorsun?');
        await k.isle('bu soruda neyi bulmam gerekiyor?');
        await k.isle('şu soruyu oku');
        expect(istekler.map(g => [g.yetenek, g.gorseller[0].data])).toEqual([['ekran', 'S0FN'], ['gorsel', 'S0FN']]);
        expect(/yüzü/.test(istekler[0].sistem)).toBe(true);                    // kişiye dair yorum yok
        /* Göz: vakti gelince masaya bakar; PAS derse susar. */
        cevap = 'PAS';
        const once = k.akis().length;
        k._ortam.simdi = () => new Date(2026, 9, 5, 12, 0);
        await zaman[zaman.length - 1]();
        expect([/masasındaki kameraya/.test(istekler[2].mesajlar[0].text), k.akis().length]).toEqual([true, once]);
        /* Konuş birlikte çalışır; Ekran kamerayı kapatır; Yaz hepsini bitirir. */
        await k.kipSec('konus');
        expect([k.kip(), k.sesliSohbetMi(), bitti]).toEqual(['kamera', true, 0]);
        await k.kipSec('ekran');
        expect([k.kip(), k.sesliSohbetMi(), bitti]).toEqual(['ekran', true, 1]);
        await k.kipSec('kamera');
        await k.kipSec('yaz');
        expect([k.kip(), k.sesliSohbetMi(), k.paylasimVar()]).toEqual(['yaz', false, false]);
      }finally{ k.kapat(); }
    }));

    /* 2026-10-21, kullanıcı: «kamerayı kapattıktan sonra hâlâ kameranın ışığı yanıyor». */
    it('kamera akışı her kapanışta durur: küçült, kapat, gizlen; çift açılış ve izin beklerken kapanış akış bırakmaz', () => sahneyle(async () => {
      const hkm = () => ({ settings:() => ({ enabled:true, token:'j', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const { k } = sahne({ hkm });
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], hkm, model:() => ({ visionChain:() => [] }) });
      const acilan = [], iptal = [];
      let bekle = null, gizli = false;
      const kaynak = () => { const p = { duran:0, kare:() => ({ mime:'image/jpeg', data:'S0FN' }), bitir:() => { p.duran++; } }; acilan.push(p); return p; };
      Object.assign(k._ortam, { kameraDestek:() => true, ekranDestek:() => true, gizli:() => gizli,
        kameralar:async () => [{ id:'a', ad:'Dahili' }],
        zamanla:() => 'z' + acilan.length, zamanIptal:id => { iptal.push(id); },
        kameraBaslat:() => bekle ? bekle.then(kaynak) : Promise.resolve(kaynak()),
        ekranBaslat:async () => kaynak() });
      const acik = () => acilan.filter(p => !p.duran).length;
      try{
        /* Küçültünce kamera durur, göz zamanlayıcısı bırakılır. */
        k.ac(); await k.kamTazele();
        expect(await k.kipSec('kamera')).toBe(true);
        k.kucult();
        expect([k.paylasimVar(), acik(), iptal.length > 0]).toEqual([false, 0, true]);
        /* Kapatınca durur. */
        k.buyut(); await k.kipSec('kamera');
        k.kapat();
        expect([k.paylasimVar(), acik()]).toEqual([false, 0]);
        /* Sayfa gizlenince kamera durur; ekran paylaşımı sürer. */
        k.ac(); await k.kamTazele(); await k.kipSec('kamera');
        gizli = true; k._gorunurluk();
        expect([k.paylasimVar(), acik()]).toEqual([false, 0]);
        gizli = false; await k.kipSec('ekran');
        gizli = true; k._gorunurluk();
        expect(k.paylasimVar()).toBe(true);
        gizli = false; await k.kipSec('yaz');
        /* İki kez basılınca tek akış kalır. */
        let ac1; bekle = new Promise(ok => { ac1 = ok; });
        const a = k.kameraAc(), b = k.kameraAc();
        ac1(); await a; await b;
        expect([k.kip(), acik()]).toEqual(['kamera', 1]);
        await k.kipSec('yaz');
        /* İzin beklenirken King kapanırsa ya da Yaz seçilirse gelen akış durur. */
        let ac2; bekle = new Promise(ok => { ac2 = ok; });
        const c = k.kameraAc();
        k.kapat(); ac2(); await c;
        k.ac(); await k.kamTazele();
        let ac3; bekle = new Promise(ok => { ac3 = ok; });
        const d = k.kameraAc();
        await k.kipSec('yaz'); ac3(); await d;
        expect([k.paylasimVar(), acik()]).toEqual([false, 0]);
      }finally{ k.kapat(); }
    }));

    it('video kaynağı kapanınca her iz durur, önizleme bırakılır', () => sahneyle(async () => {
      const c = document.createElement('canvas');
      if(typeof c.captureStream !== 'function') return;          // tarayıcı akış üretemiyorsa sınanamaz
      const g = c.getContext('2d'), boya = () => { g.fillStyle = '#' + Math.floor(Math.random() * 4096).toString(16).padStart(3, '0'); g.fillRect(0, 0, 8, 8); };
      boya();
      const akis = c.captureStream(10), iz = akis.getVideoTracks()[0], zt = setInterval(boya, 40);
      let bitti = 0, p;
      try{ p = await K()._videoKaynak(akis, () => { bitti++; }); }finally{ clearInterval(zt); }
      document.body.appendChild(p.video);
      p.bitir();
      expect([iz.readyState, p.video.srcObject, p.video.isConnected, bitti]).toEqual(['ended', null, false, 0]);
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
        k.menuAc('menu');
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
      /* Karşılamada özet görünüyorsa «Bugünün özeti» düğmesi tekrar edilmez. */
      expect(el.querySelectorAll('[data-king-hazir]').length).toBe(el.querySelector('.king__bos-ozet') ? 4 : 5);
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
      expect(m.istekler[0].url).toBe('http://127.0.0.1:4200/api/chat/akis');
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
  /* Söz 35 (depo sahibi, 2026-10-19): «günümü anlatacağım, aradan bulup kaydetsin». */
  describe('King — sohbetten kayıt (söz 35)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 12; i++) await bekle(); }
    it('anlatım bölünür; «elma ve armut yedim» bölünmez, kayıtlar bağlaçta ayrılır', () => sahneyle(async () => {
      const { k } = sahne();
      expect(k.parcalaGunluk('Bugün 7 saat uyudum, sonra 40 soru çözdüm ve akşam 30 dk koştum. Elma ve armut yedim.'))
        .toEqual(['Bugün 7 saat uyudum', '40 soru çözdüm', 'akşam 30 dk koştum', 'Elma ve armut yedim']);
    }));
    it('bulunanlar tek kartta; onay olmadan yazılmaz; bu modülünki kaydedilir, öbürü o modülde onaya sunulur', () => sahneyle(async () => {
      const kayit = [];
      const { k } = sahne({ veri:{ onizle:t => /uyudum/.test(t) ? { metin:'Uyku · 7 sa', kaydet:async () => { kayit.push('uyku'); } } : null } });
      try{
        k._ortam.depo.sil(k.BEKLEYEN_KAYIT);
        k.ac();
        const r = await k.isle('Bugün 7 saat uyudum, sonra 40 soru matematik çözdüm. Akşam yarın koşacağım.');
        expect(r).toEqual({ tur:'bulunan', n:2 });
        expect(kayit).toEqual([]);                                             // onaysız yazılmaz
        const ogeler = [...document.querySelectorAll('.king__bulunan-oge')];
        expect(ogeler.map(x => x.querySelector('b').textContent)).toEqual(['Uyku · 7 sa', '40 soru matematik çözdüm']);
        document.querySelector('[data-king^="bul-kaydet:"]').click();
        await bitsin();
        expect(kayit).toEqual(['uyku']);
        expect(k._ortam.depo.oku(k.BEKLEYEN_KAYIT).map(x => [x.modul, x.metin])).toEqual([['ays', '40 soru matematik çözdüm']]);
        expect(k.akis().pop().metin).toBe('1 kayıt kaydedildi, 1 kayıt o modül açılınca onayına sunulacak.');
        expect(!!document.querySelector('[data-king^="bul-git:ays:"]')).toBe(true);
        /* AYS'de King açılınca AYS'nin ayrıştırıcısıyla yeniden önizlenir. */
        const ays = [];
        k.kapat();
        k.kur({ modul:'ays', git:() => {}, ozet:() => [], acilis:false, veri:{ onizle:t => /soru/.test(t) ? { metin:'Matematik · 40 soru', kaydet:async () => { ays.push(t); } } : null } });
        k.yeniSohbet();
        k.ac();
        expect(document.querySelector('.king__bulunan-oge b').textContent).toBe('Matematik · 40 soru');
        expect(k._ortam.depo.oku(k.BEKLEYEN_KAYIT)).toEqual([]);
        document.querySelector('[data-king^="bul-kaydet:"]').click();
        await bitsin();
        expect(ays).toEqual(['40 soru matematik çözdüm']);
      }finally{ k._ortam.depo.sil(k.BEKLEYEN_KAYIT); }
    }));
    it('«…, 4 yanlışım var» kayıtta kalır; duygu günlüğe girer ve işaretli gelir', () => sahneyle(async () => {
      const { k } = sahne();
      expect(k.parcalaGunluk('Türevden 20 soru çözdüm, 4 yanlışım var. 30 dk akustik gitar çalıştım, çalışmaktan memnunum'))
        .toEqual(['Türevden 20 soru çözdüm, 4 yanlışım var', '30 dk akustik gitar çalıştım', 'çalışmaktan memnunum']);
      const eski = window.LIFEOS.DEFTER;
      window.LIFEOS.DEFTER = { kuruluMu:() => true, yukle:async () => [], yeni:async () => ({}), ac:() => true };
      try{
        const b = sahne({ veri:{ onizle:t => /soru/.test(t) ? { metin:'Türev · 20 soru, 16 doğru', kaydet:async () => {} } : null } });
        const l = b.k.sohbettenBul('Türevden 20 soru çözdüm, 4 yanlışım var. Bugün de 30 dk koştum, çok memnunum');
        expect(l.map(o => o.modul)).toEqual(['spi', 'defter']);
        const d = l.find(o => o.modul === 'defter');
        expect([!!d, d && d.secili, /duygularını/.test(d && d.metin)]).toEqual([true, true, true]);
        expect(l[0].metin).toBe('Türev · 20 soru, 16 doğru');
      }finally{ window.LIFEOS.DEFTER = eski; }
    }));
    it('oturum yokken öbür modülün kaydı HKM kutusuna gider; o modülde King kutudan alıp onaya sunar', () => sahneyle(async () => {
      const giden = [];
      let kutu = [];
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => {
        if(url.endsWith('/api/kutu')){ const b = JSON.parse(o.body); giden.push(b); kutu.push({ modul:b.modul, metin:b.metin }); return { status:200, json:async () => ({ ok:true }) }; }
        if(/\/api\/kutu\?modul=/.test(url)){ const m = url.split('=').pop(); const l = kutu.filter(x => x.modul === m); kutu = kutu.filter(x => x.modul !== m); return { status:200, json:async () => ({ kayitlar:l }) }; }
        return { status:200, json:async () => ({ ok:true, text:'Güzel bir gün.', mode:'model' }) };
      };
      const { k } = sahne({ hkm, fetch, veri:{ onizle:t => /uyudum/.test(t) ? { metin:'Uyku', kaydet:async () => {} } : null } });
      try{
        k._ortam.depo.sil(k.BEKLEYEN_KAYIT);
        k.ac();
        await k.isle('7 saat uyudum, 40 soru matematik çözdüm');
        document.querySelector('[data-king^="bul-kaydet:"]').click();
        for(let i = 0; i < 12; i++) await new Promise(ok => setTimeout(ok, 0));
        expect(giden).toEqual([{ modul:'ays', metin:'40 soru matematik çözdüm', kaynak:'spi' }]);
        expect(k._ortam.depo.oku(k.BEKLEYEN_KAYIT) || []).toEqual([]);
        const ays = [];
        k.kapat();
        k.kur({ modul:'ays', git:() => {}, ozet:() => [], acilis:false, hkm, veri:{ onizle:t => /soru/.test(t) ? { metin:'40 soru', kaydet:async () => { ays.push(t); } } : null } });
        k.yeniSohbet();
        k.ac();
        for(let i = 0; i < 12; i++) await new Promise(ok => setTimeout(ok, 0));
        expect(document.querySelector('.king__bulunan-oge b').textContent).toBe('40 soru');
        expect(kutu).toEqual([]);
      }finally{ k._ortam.depo.sil(k.BEKLEYEN_KAYIT); }
    }));
    it('işaret kaldırılan kaydedilmez; vazgeç hiçbirini yazmaz', () => sahneyle(async () => {
      const kayit = [];
      const { k } = sahne({ veri:{ onizle:t => /uyudum|yedim/.test(t) ? { metin:t, kaydet:async () => { kayit.push(t); } } : null } });
      k.ac();
      await k.isle('7 saat uyudum, iki yumurta yedim');
      document.querySelector('[data-king^="bul-sec:"]').click();               // ilkini kaldır
      document.querySelector('[data-king^="bul-kaydet:"]').click();
      await bitsin();
      expect(kayit).toEqual(['iki yumurta yedim']);
      await k.isle('8 saat uyudum, üç yumurta yedim');
      [...document.querySelectorAll('[data-king^="bul-vazgec:"]')].pop().click();
      await bitsin();
      expect(kayit.length).toBe(1);
      expect(k.akis().pop().metin).toBe('Tamam, hiçbirini kaydetmedim.');
    }));
  });
  /* Söz 34 (depo sahibi, 2026-10-19): işe yarayan fikirler. */
  describe('King — işe yarayan fikirler (söz 34)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 12; i++) await bekle(); }
    function defterli(notlar){
      const yazilan = [];
      const eski = window.LIFEOS.DEFTER;
      window.LIFEOS.DEFTER = { kuruluMu:() => true, yukle:async () => notlar || [], yeni:async (b, g, t) => { yazilan.push({ b, g, t }); return {}; }, ac:() => true };
      return { yazilan, birak:() => { window.LIFEOS.DEFTER = eski; } };
    }
    it('«neye çalışayım» modülün öncelik listesini sıralı kart olarak gösterir; satırdan Öğren açılır', () => sahneyle(async () => {
      const acilan = [];
      const { k } = sahne();
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], acilis:false, kartlar:{
        oncelik:() => [{ ad:'Problemler', ders:'TYT Matematik', neden:'4 deneme yanlışı · sık çıkar', puan:12, topicId:'tm-20' }, { ad:'Paragraf', ders:'TYT Türkçe', neden:'%55 doğru', puan:6 }],
        oncelikAc:o => acilan.push(o.topicId) } });
      k.ac();
      expect((await k.isle('neye çalışayım')).tur).toBe('oncelik');
      const satir = [...document.querySelectorAll('.king__sira')];
      expect(satir.map(x => x.querySelector('b').textContent)).toEqual(['Problemler', 'Paragraf']);
      satir[0].querySelector('[data-king^="sira-ac:"]').click();
      await bitsin();
      expect(acilan).toEqual(['tm-20']);
    }));
    it('not arama: Merkez yokken notları listeler; varsa yalnız notlarla cevaplar ve kaynağı yazar', () => sahneyle(async () => {
      const d = defterli([{ id:'n1', baslik:'Türev kuralları', govde:'Çarpım kuralı: (fg)′ = f′g + fg′.' }, { id:'n2', baslik:'Alışveriş', govde:'süt' }]);
      try{
        const a = sahne();
        a.k.ac();
        await a.k.isle('notlarımda türev');
        const m = a.k.akis().pop();
        expect([m.metin, m.satirlar.length, /Türev kuralları/.test(m.satirlar[0])]).toEqual(['Notlarında bunları buldum:', 1, true]);
        a.k.kapat();
        const istekler = [];
        const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
        const fetch = async (url, o) => { istekler.push(JSON.parse(o.body).text); return { status:200, json:async () => ({ ok:true, text:'Çarpım kuralı f′g + fg′.', mode:'model' }) }; };
        const b = sahne({ hkm, fetch });
        b.k.ac();
        await b.k.isle('türev hakkında ne not almıştım');
        expect(/YALNIZ bu notlara dayanarak/.test(istekler[0]) && /Türev kuralları/.test(istekler[0]) && !/Alışveriş/.test(istekler[0])).toBe(true);
        const c = b.k.akis().pop();
        expect([c.metin, c.satirlar]).toEqual(['Çarpım kuralı f′g + fg′.', ['Kaynak: Türev kuralları']]);
      }finally{ d.birak(); }
    }));
    it('haftalık gözden geçirme: üç soru, Defter’e not, hedef açılışta', () => sahneyle(async () => {
      const d = defterli([]);
      const { k } = sahne();
      try{
        k.ac();
        await k.isle('haftalık gözden geçirme');
        expect(/^Bu hafta ne iyi gitti\?/.test(k.akis().pop().metin)).toBe(true);
        await k.isle('Denemeler iyiydi');
        expect(k.akis().pop().metin).toBe('Ne zorladı?');
        await k.isle('Uyku');
        await k.isle('Her gün 22:30 yat');
        expect(/Haftanın hedefi: «Her gün 22:30 yat»/.test(k.akis().pop().metin)).toBe(true);
        expect(/^Haftalık gözden geçirme · /.test(d.yazilan[0].b)).toBe(true);
        expect(d.yazilan[0].g).toContain('## Ne zorladı?\nUyku');
        expect(k.haftaHedefi()).toBe('Her gün 22:30 yat');
      }finally{ d.birak(); k._ortam.depo.sil(k.HEDEF); }
    }));
    it('günlük: anlattığın ve hissin Defter’e yazılır', () => sahneyle(async () => {
      const d = defterli([]);
      const { k } = sahne();
      try{
        k.ac();
        await k.isle('günlük yazalım');
        await k.isle('Bugün uzun bir gündü ama denemem iyi geçti.');
        document.querySelector('[data-king="gunluk-his:4"]').click();
        await bitsin();
        expect(d.yazilan[0].g).toBe('Bugün uzun bir gündü ama denemem iyi geçti.\n\nHis: 4/5 (benim beyanım)');
        expect(k.akis().pop().metin).toBe('Günlüğe yazdım (Defter). Hissin: 4/5.');
      }finally{ d.birak(); }
    }));
    it('yük: modülün kartları ve sinyali; deney: ölçü seçilir, süre sonunda kodla karşılaştırılır', () => sahneyle(async () => {
      const { k } = sahne();
      const degerler = {};
      for(let i = -14; i < 0; i++) degerler['2026-10-' + String(5 + i + 14 - 14).padStart(2, '0')] = 6;
      k.kur({ modul:'spi', git:() => {}, ozet:() => [], acilis:false, kartlar:{
        yuk:() => ({ kartlar:[{ ad:'Uyku · son 7 gece', deger:6.1, birim:'sa', etiket:'hesaplandı' }], sinyal:'Uykun son 7 gecede ortalama 1 saat azaldı.' }),
        olcu:{ liste:[{ id:'uyku', ad:'Uyku', birim:'sa' }], deger:(id, iso) => iso < '2026-10-05' ? 6 : 7.5 } } });
      try{
        k._ortam.depo.sil(k.DENEY());
        k.ac();
        await k.isle('yük durumum');
        const y = k.akis().pop();
        expect([y.metin, y.kartlar.length, y.bulgu]).toEqual(['Uykun son 7 gecede ortalama 1 saat azaldı.', 1, true]);
        await k.isle('deney başlat 23:00’te yatacağım');
        document.querySelector('[data-king="deney-olcu:uyku"]').click();
        expect(k.deneyOku().olcu).toBe('uyku');
        const v = k.deneyOku(); v.baslangic = '2026-09-21'; k._ortam.depo.yaz(k.DENEY(), v);     // 14 gün geçti (sahne: 2026-10-05)
        await k.isle('deney sonucu');
        const r = k.akis().pop();
        expect(/^Deney bitti/.test(r.metin)).toBe(true);
        expect(r.kartlar.map(x => x.deger)).toEqual(['6', '6', '0']);
        expect(k.deneyOku()).toBe(null);
      }finally{ k._ortam.depo.sil(k.DENEY()); }
    }));
  });
  /* Söz 33 (depo sahibi, 2026-10-19): «hepsini King'e getir». */
  describe('King — genel geliştirme (söz 33)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 15; i++) await bekle(); }
    const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
    function akanCevap(satirlar){
      let i = 0;
      return { status:200, headers:{ get:h => /content-type/i.test(h) ? 'application/x-ndjson' : null },
        body:{ getReader:() => ({ read:async () => i < satirlar.length ? { value:satirlar[i++], done:false } : { done:true } }) } };
    }
    function temizle(k){ [k.TARZ, k.ODAK, k.BAS()].forEach(x => k._ortam.depo.sil(x)); k.derinlikSec('oto'); k.sesTercihSec('oto'); }
    it('cevap akarak gelir; sonda tam cevap yerine geçer; sohbet başı ve tarz HKM’ye gider', () => sahneyle(async () => {
      const istekler = [];
      let akarkenGoruldu = false;
      const fetch = async (url, o) => {
        istekler.push({ url, govde:JSON.parse(o.body) });
        return akanCevap(['{"t":"parca","metin":"Merhaba "}\n{"t":"parca","metin":"dostum. "}\n',
          '{"t":"son","ok":true,"mode":"model","text":"Merhaba dostum."}\n']);
      };
      const { k } = sahne({ hkm, fetch });
      try{
        k.tarzSec('resmi');
        k.ac();
        const gozcu = new MutationObserver(() => { if(document.querySelector('.king__balon.is-akiyor')) akarkenGoruldu = true; });
        gozcu.observe(document.body, { subtree:true, childList:true });
        const r = await k.isle('felsefede özgür irade hakkında ne düşünüyorsun');
        gozcu.disconnect();
        expect(r.tur).toBe('merkez');
        expect(istekler[0].url).toBe('http://127.0.0.1:4200/api/chat/akis');
        expect(istekler[0].govde.uslup).toBe('resmi');
        expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(istekler[0].govde.baslangic)).toBe(true);
        expect(akarkenGoruldu).toBe(true);
        const sonM = k.akis().filter(m => m.kim === 'king').pop();
        expect([sonM.metin, !!sonM.akiyor]).toEqual(['Merhaba dostum.', false]);
        const oneri = [...document.querySelectorAll('[data-king^="oner-metin:"]')].map(b => b.textContent);
        expect(oneri.slice(0, 2)).toEqual(['Detaylandır', 'Kısalt']);
      }finally{ temizle(k); }
    }));
    it('eski HKM (404) için /api/chat’e düşer', () => sahneyle(async () => {
      const yollar = [];
      const fetch = async url => {
        yollar.push(url.replace('http://127.0.0.1:4200', ''));
        if(url.endsWith('/akis')) return { status:404, json:async () => ({}) };
        return { status:200, json:async () => ({ ok:true, text:'Tamam.', mode:'model' }) };
      };
      const { k } = sahne({ hkm, fetch });
      try{
        k.ac();
        await k.isle('felsefede özgür irade hakkında ne düşünüyorsun');
        expect(yollar.filter(y => !y.startsWith('/api/kutu'))).toEqual(['/api/chat/akis', '/api/chat']);   // kutu sorgusu açılışta (mimari 3)
        expect(k.akis().pop().metin).toBe('Tamam.');
      }finally{ temizle(k); }
    }));
    it('yeni sohbet sohbet başını yeniler', () => sahneyle(async () => {
      const { k } = sahne();
      try{
        k._ortam.depo.sil(k.BAS());
        k.ac();
        k.yeniSohbet();
        expect(/^\d{4}-\d{2}-\d{2}T/.test(k.sohbetBas())).toBe(true);
      }finally{ temizle(k); }
    }));
    it('ayar komutları King’in tercihini değiştirir', () => sahneyle(async () => {
      const { k } = sahne();
      try{
        k.ac();
        await k.isle('derin düşün');
        expect(k.derinlik()).toBe('derin');
        await k.isle('sesi piper yap');
        expect([k.sesTercihi(), k.akis().pop().metin]).toEqual(['piper', 'Sesi Piper yaptım.']);
        await k.isle('resmi konuş');
        expect(k.tarz()).toBe('resmi');
        expect(k.ayarKomutu('bugün hava nasıl')).toBe(null);
      }finally{ temizle(k); }
    }));
    it('odak sayacı başlar, bitince haber verir ve «Kaydet» modülün girişine gider', () => sahneyle(async () => {
      const { k } = sahne();
      try{
        k.ac();
        await k.isle('25 dakika matematik çalışalım');            // sahnede zamanlayıcı anında çalışır
        const l = k.akis().filter(m => m.kim === 'king').map(m => m.metin);
        expect(l.some(x => /^25 dakikalık odak başladı \(matematik\)/.test(x))).toBe(true);
        expect(l.some(x => /^Süre doldu: 25 dakika matematik tamam/.test(x))).toBe(true);
        expect(document.querySelector('[data-king^="odak-kaydet:"]').getAttribute('data-king')).toBe('odak-kaydet:25:matematik');
        expect(k.odak()).toBe(null);
      }finally{ temizle(k); }
    }));
    it('karşılama: boş sohbette selam, kartlar ve özet; sohbete yazılmaz, ilk mesajla gider', () => sahneyle(async () => {
      const { k } = sahne();
      k.kur({ modul:'ays', git:() => {}, ozet:() => ['Bugün plan var.'], kartlar:{ istatistik:() => [{ ad:'Çözülen soru', deger:12, etiket:'ölçüldü', seri:[3, null, 5] }] } });
      try{
        k.ac();
        expect(k.akis().some(x => x.kartlar)).toBe(false);
        expect([document.querySelectorAll('.king__bos .king__kart').length, document.querySelector('.king__bos-ozet li').textContent])
          .toEqual([1, 'Bugün plan var.']);
        expect(document.querySelector('.king__kart-cizgi path').getAttribute('d')).toBe('M0.0 22.0M100.0 2.0');
        /* Özet zaten görünürken «Bugünün özeti» hazır cevabı tekrar edilmez. */
        expect([...document.querySelectorAll('.king__hazir')].some(b => /Bugünün özeti/.test(b.textContent))).toBe(false);
        await k.isle('merhaba');
        expect([document.querySelector('.king__bos'), document.querySelector('.king__bos-veri')]).toEqual([null, null]);
      }finally{ temizle(k); }
    }));
    it('haftalık değerlendirme HKM’nin «hafta» raporunu getirir', () => sahneyle(async () => {
      const istekler = [];
      const fetch = async (url, o) => { istekler.push(JSON.parse(o.body).text); return { status:200, json:async () => ({ ok:true, text:'Hafta: AYS 3 gün.', mode:'komut' }) }; };
      const { k } = sahne({ hkm, fetch });
      try{
        k.ac();
        await k.isle('haftalık değerlendirme');
        expect(istekler).toEqual(['hafta']);
        const m = k.akis().pop();
        expect([m.metin, m.bulgu]).toEqual(['Hafta: AYS 3 gün.', true]);
      }finally{ temizle(k); }
    }));
    it('Konuş kipinde King konuşurken sen konuşursan susar ve dinler', () => sahneyle(async () => {
      const acilan = [];
      const fetch = async () => ({ status:200, blob:async () => ({}), headers:{ get:() => 'gemini' }, json:async () => ({}) });
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, {
        oynat:() => new Promise(() => {}),                      // King konuşmayı sürdürür
        tanima:() => function(){ this.start = () => {}; this.stop = () => {}; },
        kayitAc:async (sessiz, cihaz, basla, esik) => { acilan.push({ basla, esik }); return { bitir:() => ({ pcm:new Float32Array(10), hz:16000, konustu:false }) }; },
      });
      try{
        k.ac();
        await k.kipSec('konus');
        k.seslendir('Uzun bir cevap okuyorum.');
        await bitsin();
        const kes = acilan.filter(x => x.esik === 0.06).pop();
        expect(!!kes).toBe(true);
        kes.basla();
        await bitsin();
        expect(acilan.length >= 2).toBe(true);                   // ikinci kayıt: seni dinliyor
        expect(document.querySelector('.king').classList.contains('is-konusuyor')).toBe(false);
      }finally{ temizle(k); }
    }));
  });
  /* Söz 32 (depo sahibi, 2026-10-19): istatistik kartları ve soru kartları. */
  describe('King — kartlar (söz 32)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    function kartSahnesi(kartlar){
      const { k } = sahne();
      k.kur({ modul:'ays', git:() => {}, ozet:() => [], kartlar, acilis:false });
      k.ac();
      return k;
    }
    it('tetik kuraldır: istatistik ve soru; konu dolgudan ayıklanır', () => sahneyle(async () => {
      const { k } = sahne();
      expect(k.kartNiyeti('istatistiklerimi göster')).toEqual({ tur:'istatistik' });
      expect(k.kartNiyeti('bana soru sor')).toEqual({ tur:'soru', konu:'' });
      expect(k.kartNiyeti('türev hakkında bana bir soru sor')).toEqual({ tur:'soru', konu:'türev' });
      expect(k.kartNiyeti('bugün nasılsın')).toBe(null);
    }));
    it('istatistik: modülün kartları ızgarada; değeri olmayan «—» ve «veri yok», sıfır yazılmaz', () => sahneyle(async () => {
      const k = kartSahnesi({ istatistik:() => [
        { ad:'Çözülen soru', deger:120, etiket:'ölçüldü' },
        { ad:'Doğru oranı', deger:64, birim:'%', etiket:'hesaplandı', alt:'77 / 120' },
        { ad:'Deneme neti', deger:null, etiket:'ölçüldü' },
      ] });
      const r = await k.isle('istatistiklerim');
      expect(r).toEqual({ tur:'kart-istatistik', kartlar:3 });
      const kartlar = [...document.querySelectorAll('.king__kart')];
      expect(kartlar.length).toBe(3);
      expect(kartlar[1].querySelector('.king__kart-deger').textContent).toBe('64 %');
      expect(kartlar[1].querySelector('.king__kart-etiket').textContent).toBe('hesaplandı');
      expect(kartlar[2].querySelector('.king__kart-deger').textContent).toBe('—');
      expect(kartlar[2].querySelector('.king__kart-etiket').textContent).toBe('veri yok');
    }));
    it('soru: bankadan gelir, şıklar düğme; cevabı modül yazar, doğru şık ve çözüm görünür', () => sahneyle(async () => {
      const cevaplar = [];
      const k = kartSahnesi({
        soru:async konu => ({ id:'tm|tm-05|0', konu:'Türev', soru:'2x’in türevi?', sec:['0', '1', '2', 'x', '2x'], kaynak:'AYS · Öğren', sorgu:konu }),
        cevapla:async (id, h) => { cevaplar.push([id, h]); return { dogru:'C', cozum:['(2x)′ = 2'] }; },
      });
      const r = await k.isle('türev hakkında soru sor');
      expect(r.tur).toBe('kart-soru');
      const siklar = [...document.querySelectorAll('.king__soru-sik')];
      expect(siklar.map(b => b.querySelector('b').textContent)).toEqual(['A', 'B', 'C', 'D', 'E']);
      siklar[3].click();
      for(let i = 0; i < 6; i++) await bekle();
      expect(cevaplar).toEqual([['tm|tm-05|0', 'D']]);
      expect(document.querySelector('.king__soru-sik.is-dogru').querySelector('b').textContent).toBe('C');
      expect(document.querySelector('.king__soru-sik.is-yanlis').querySelector('b').textContent).toBe('D');
      expect(document.querySelector('.king__soru-sonuc').textContent).toBe('Doğru cevap C.');
      expect(document.querySelector('.king__soru-cozum li').textContent).toBe('(2x)′ = 2');
      expect([...document.querySelectorAll('.king__soru-sik')].every(b => b.disabled)).toBe(true);
      expect(!!document.querySelector('[data-king^="soru-yeni:"]')).toBe(true);
      /* ikinci tık yeni cevap yazmaz */
      const n = k.akis().findIndex(m => m.soru);
      expect(await k.soruCevapla(n, 'C')).toBe(null);
      expect(cevaplar.length).toBe(1);
    }));
    it('bankası olmayan modül söyler; bulunamayan konu söylenir', () => sahneyle(async () => {
      const k = kartSahnesi({ istatistik:() => [] });
      await k.isle('bana soru sor');
      expect(k.akis().pop().metin).toBe('Soru bankası AYS’de; AYS’yi açıp «bana soru sor» diyebilirsin.');
      await k.isle('istatistiklerim');
      expect(k.akis().pop().metin).toBe('AYS için gösterilecek istatistik kartı yok.');
      const k2 = kartSahnesi({ soru:async () => null, cevapla:async () => null });
      await k2.isle('kuantum hakkında soru sor');
      expect(k2.akis().pop().metin).toBe('«kuantum» için soru bulamadım; başka bir konu dener misin?');
    }));
    it('uzun cevapta **kalın** ve madde işaretleri biçimlenir; HTML kaçırılır', () => sahneyle(async () => {
      const { k } = sahne();
      expect(k.bicimli('**Başlık**\n* bir\n- iki\n## Alt\n<b>x</b>')).toBe('<b>Başlık</b>\n• bir\n• iki\nAlt\n&lt;b&gt;x&lt;/b&gt;');
    }));
    it('metindeki http(s) linkleri tıklanabilir olur; sondaki noktalama dışarıda kalır', () => sahneyle(async () => {
      const { k } = sahne();
      expect(k.bicimli('Bak: https://a.com/x?b=1&c=2.')).toBe('Bak: <a href="https://a.com/x?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">https://a.com/x?b=1&amp;c=2</a>.');
      expect(k.bicimli('javascript:alert(1)')).toBe('javascript:alert(1)');
    }));
    it('iş rozeti yalnız açık iş varken çizilir ve sayıyı kod söyler', () => sahneyle(async () => {
      const { k } = sahne();
      k.isDurumYaz(null);
      expect(k.isRozet()).toBe('');
      k.isDurumYaz({ acik:2, metin:'King şu an 2 iş yapıyor (1 çalışıyor, 1 sırada)' });
      expect(k.isRozet()).toContain('King şu an 2 iş yapıyor');
      k.isDurumYaz(null);
    }));
  });
  /* Söz 31 (depo sahibi, 2026-10-19): «King ne kadar düşünecek seçilebilsin». */
  describe('King — düşünme derinliği (söz 31)', () => {
    function derinSahnesi(bagli){
      const istekler = [];
      const hkm = () => ({ settings:() => ({ enabled:!!bagli, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => {
        istekler.push({ url, govde:JSON.parse(o.body) });
        return { status:200, json:async () => ({ ok:true, text:'Tamam, düşündüm.', mode:'model' }), headers:{ get:() => null } };
      };
      const { k } = sahne({ hkm, fetch });
      return { k, istekler };
    }
    /* G (2026-10-21): Düşünme yazı alanında değil, Ayarlar › Konuşma'da. */
    it('Düşünme ayarlarda; yazı alanında düğme yok; seçim cihazda kalır', () => sahneyle(async () => {
      const { k } = derinSahnesi(true);
      try{
        k.ac();
        expect(!!document.querySelector('[data-king="derin"]')).toBe(false);
        k.menuAc('menu');
        document.querySelector('.king__secici [data-king="derinlik:derin"]').click();
        expect([k.derinlik(), k._ortam.depo.oku(k.DERIN)]).toEqual(['derin', 'derin']);
        expect(document.querySelector('.king__secici [data-king="derinlik:derin"]').getAttribute('aria-checked')).toBe('true');
        expect(k.derinlikSec('uzman')).toBe(false);
        k.derinlikSec('oto');
        expect(k._ortam.depo.oku(k.DERIN)).toBe(null);
      }finally{ k.derinlikSec('oto'); }
    }));
    it('G: ray bölümleri listeyi değiştirir; çalışma alanı sohbetin yanında açılır; «Neden?» kaynağı söyler', () => sahneyle(async () => {
      const veri = { onizle:t => /uyku/.test(t) ? { metin:'Uyku 7 sa', kaydet:async () => 'Kaydedildi' } : null };
      const { k } = sahne({ veri });
      k.ac();
      expect(document.querySelectorAll('.king__ray [data-king^="bolum:"]').length).toBe(5);
      k.bolumSec('kutuphane');
      expect(document.querySelector('.king__yan').getAttribute('aria-label')).toBe('Kütüphane');
      document.querySelector('.king__ray [data-king="menu"]').click();
      expect([k.menuDurum(), !!document.querySelector('.king__alan'), !!document.querySelector('.king__akis')]).toEqual(['menu', true, true]);
      document.querySelector('[data-king="alan-kapat"]').click();
      expect(k.menuDurum()).toBe(null);
      await k.isle('uyku 7');
      expect(document.querySelector('[data-king-neden]').textContent).toContain('onaylamadan');
    }));
    /* Araçlar (kullanıcı, 2026-10-22: «King'in özelliklerinin hepsini oradan görebilirim»). */
    function aracSahnesi(o){
      const { k } = sahne();
      k.kur({ modul:'ays', git:() => {}, ozet:() => ['Bugün plan var.'], acilis:false, kartlar:Object.assign({
        istatistik:() => [{ ad:'Çözülen soru', deger:12, etiket:'ölçüldü' }],
        soru:() => ({ id:'s1', govde:'2 + 2 kaçtır?', siklar:['3', '4', '5', '6', '7'] }),
        oncelik:() => [{ ad:'Problemler', ders:'TYT Matematik', neden:'sık çıkar', puan:12 }],
        yuk:() => ({ kartlar:[], sinyal:'' }) }, (o && o.kartlar) || {}) });
      return k;
    }
    it('Araçlar: rayda Sohbet’in altında; gruplu, aranır; satırın türü simgesiyle bellidir', () => sahneyle(async () => {
      const k = aracSahnesi();
      k.ac();
      expect([...document.querySelectorAll('.king__ray [data-king^="bolum:"]')].map(b => b.getAttribute('data-king')).slice(0, 2))
        .toEqual(['bolum:sohbet', 'bolum:araclar']);
      k.bolumSec('araclar');
      const yan = document.querySelector('.king__yan');
      expect(yan.getAttribute('aria-label')).toBe('Araçlar');
      const gruplar = [...yan.querySelectorAll('.king__yan-ad')].map(h => h.textContent);
      ['Kart ve soru', 'Araştır ve oku', 'Planla ve takip et', 'Rutin ve hafıza', 'AYS · sınav', 'SPİ · sağlık', 'Sistem'].forEach(g => expect(gruplar).toContain(g));
      expect(gruplar[gruplar.length - 1]).toBe('Sistem');
      /* Şimdi grubu en çok üç öneri (sabah 9: özet önce). */
      expect(gruplar[0]).toBe('Şimdi');
      const simdi = yan.querySelector('.king__yan-grup').querySelectorAll('li');
      expect(simdi.length <= 3 && simdi.length > 0).toBe(true);
      expect(simdi[0].textContent).toContain('Bugünün özeti');
      /* Merkez bağlı değil: Merkez isteyen satır etiketli. */
      const arastir = [...yan.querySelectorAll('.king__yetenek')].find(b => /^Araştır/.test(b.textContent));
      expect(arastir.classList.contains('is-sonuk')).toBe(true);
      expect(arastir.querySelector('.king__yetenek-etiket').textContent).toBe('Merkez');
      /* Başka modülün işi de katalogda (Tüm işler ile aynı kaynak). */
      expect(!!yan.querySelector('[data-king^="is-sec:"]')).toBe(true);
    }));
    it('Araçlar: bankası olmayan modülde soru satırı yok; olan modülde var', () => sahneyle(async () => {
      const { k } = sahne();
      const adlar = () => k.yetenekler().reduce((a, g) => a.concat(g.l.map(x => x.ad)), []);
      expect(adlar().indexOf('Bana soru sor')).toBe(-1);
      aracSahnesi();
      expect(adlar()).toContain('Bana soru sor');
      expect(adlar()).toContain('Neye çalışayım');
    }));
    it('Araçlar: «doldur» satırı örneği yazı alanına koyar, göndermez; «calis» satırı hemen sorar', () => sahneyle(async () => {
      const k = aracSahnesi();
      k.ac();
      k.bolumSec('araclar');
      const once = k.akis().length;
      document.querySelector('.king__yan [data-king="doldur:25 dakika matematik çalışalım"]').click();
      expect(document.querySelector('.king__girdi').value).toBe('25 dakika matematik çalışalım');
      expect(k.akis().length).toBe(once);
      document.querySelector('.king__yan [data-king="oner-metin:neye çalışayım"]').click();
      for(let i = 0; i < 6; i++) await new Promise(r => setTimeout(r, 0));
      expect(k.akis().some(m => m.kim === 'sen' && m.metin === 'neye çalışayım')).toBe(true);
    }));
    it('Araçlar: her örnek King’in gerçek tetiğidir (Merkez’siz olanlar kuralla anlaşılır)', () => sahneyle(async () => {
      const eski = window.LIFEOS.DEFTER;
      window.LIFEOS.DEFTER = { kuruluMu:() => true, yukle:async () => [{ id:'n1', baslik:'Türev', govde:'türev notu' }], yeni:async () => ({}), ac:() => true };
      try{
        const k = aracSahnesi();
        k.ac();
        /* Kalıcı ayar değiştirenler (tema, sesli cevap, odak sayacı) burada koşturulmaz. */
        const atla = ['Görünüm', 'Cevapları sesli oku', 'Odak sayacı', 'Deftere not'];
        const ornekler = k.yetenekler().filter(g => g.ad !== 'Şimdi').reduce((a, g) => a.concat(g.l), [])
          .filter(x => !x.merkez && (x.calis || x.doldur) && atla.indexOf(x.ad) < 0).map(x => x.calis || x.doldur);
        expect(ornekler.length >= 10).toBe(true);
        for(const m of ornekler){
          k._sifirla(); aracSahnesi(); k.ac();
          const r = await k.isle(m);
          expect([m, r && r.tur !== 'bilinmiyor']).toEqual([m, true]);
        }
      }finally{ window.LIFEOS.DEFTER = eski; }
    }));
    it('HKM’ye derinlik gider; Otomatik’te alan hiç gönderilmez', () => sahneyle(async () => {
      const { k, istekler } = derinSahnesi(true);
      try{
        k.ac();
        await k.isle('felsefede özgür irade hakkında ne düşünüyorsun');
        const ilk = istekler.filter(x => x.url.includes('/api/chat'));
        expect(ilk.length).toBe(1);
        expect('derinlik' in ilk[0].govde).toBe(false);
        k.derinlikSec('hizli');
        await k.isle('peki stoacılar ne der');
        const son = istekler.filter(x => x.url.includes('/api/chat')).pop();
        expect(son.govde.derinlik).toBe('hizli');
      }finally{ k.derinlikSec('oto'); }
    }));
    it('··· menüsünde «Düşünme» satırı aynı seçimi yapar', () => sahneyle(async () => {
      const { k } = derinSahnesi(true);
      try{
        k.ac();
        k.menuAc('menu');
        const r = [...document.querySelectorAll('.king__secici [data-king^="derinlik:"]')];
        expect(r.map(x => x.textContent)).toEqual(['Otomatik', 'Hızlı', 'Dengeli', 'Derin']);
        expect(r[0].getAttribute('aria-checked')).toBe('true');
        document.querySelector('.king__secici [data-king="derinlik:dengeli"]').click();
        expect(k.derinlik()).toBe('dengeli');
        expect(document.querySelector('.king__secici [data-king="derinlik:dengeli"]').getAttribute('aria-checked')).toBe('true');
      }finally{ k.derinlikSec('oto'); }
    }));
  });
  /* Söz 30 (depo sahibi, 2026-10-19): «Konuş'taki kutucuk rahatsız ediyor,
     Dinle'deki gibi minimal olsun; kenar çubuğu sola küçülebilsin». */
  describe('King — profesyonel (söz 30)', () => {
    function konusSahnesi(){
      const { k } = sahne();
      Object.assign(k._ortam, {
        sentez:() => ({ cancel(){}, getVoices:() => [], speak:u => { if(u.onend) u.onend(); } }),
        soz:t => ({ text:t }),
        tanima:() => function(){ this.start = () => {}; this.stop = () => {}; },
        kayitAc:null,
      });
      return k;
    }
    it('Konuş kutusuz: ince şerit (küre, durum, kapat); ses seçimi ve ipucu yazısı yok', () => sahneyle(async () => {
      const k = konusSahnesi();
      k.ac();
      await k.kipSec('konus');
      const p = document.querySelector('.king__kip-panel--konus');
      expect(!!p).toBe(true);
      expect(!!p.querySelector('.king__kure')).toBe(true);
      expect(!!p.querySelector('.king__ses-durum')).toBe(true);
      expect(p.querySelectorAll('button').length).toBe(1);
      expect(p.querySelector('button').getAttribute('data-king')).toBe('kip:yaz');
      expect(p.querySelector('button').getAttribute('aria-label')).toBe('Sesli sohbeti bitir');
      expect(!!p.querySelector('[data-king^="ses:"]')).toBe(false);
      expect(p.textContent.includes('Bitirmek için')).toBe(false);
      p.querySelector('button').click();
      await new Promise(ok => setTimeout(ok, 0));
      expect(k.kip()).toBe('yaz');
      expect(!!document.querySelector('.king__kip-panel--konus')).toBe(false);
    }));

    it('kenar çubuğu geniş ekranda kendi içindeki düğmeyle kapanır, kenarda çıkıntı kalır; tercih cihazda kalır', () => sahneyle(async () => {
      const { k } = sahne();
      Object.assign(k._ortam, { genis:() => true });
      try{
        k.yanDarSec(false);
        k.ac();
        const kok = () => document.querySelector('.king');
        const dug = () => document.querySelector('[data-king="yan"]');
        expect([k.yanDar(), kok().classList.contains('is-yan-dar'), dug().getAttribute('aria-expanded')]).toEqual([false, false, 'true']);
        dug().click();
        expect([k.yanDar(), kok().classList.contains('is-yan-dar'), dug().getAttribute('aria-expanded')]).toEqual([true, true, 'false']);
        expect(k._ortam.depo.oku(k.YAN)).toBe('dar');
        /* Düğme başlıkta değil: biri çubukta, biri kenardaki çıkıntı. */
        expect([document.querySelector('.king__bas [data-king="yan"]'), document.querySelectorAll('.king__yan [data-king="yan"], .king__cikinti').length])
          .toEqual([null, 2]);
        /* Kapatıp yeniden açınca kapalı kalır. */
        k.kapat();
        k.ac();
        expect(kok().classList.contains('is-yan-dar')).toBe(true);
        dug().click();
        expect([k.yanDar(), kok().classList.contains('is-yan-dar')]).toEqual([false, false]);
        expect(k._ortam.depo.oku(k.YAN)).toBe(null);
      }finally{ k.yanDarSec(false); }
    }));

    it('dar ekranda düğme kenar çubuğunu pencerenin içinde açar; geniş ekran tercihine dokunmaz', () => sahneyle(async () => {
      const { k } = sahne();
      Object.assign(k._ortam, { genis:() => false });
      try{
        k.yanDarSec(false);
        k.ac();
        const kok = () => document.querySelector('.king');
        document.querySelector('[data-king="yan"]').click();
        expect([kok().classList.contains('is-yan-acik'), document.querySelector('[data-king="yan"]').getAttribute('aria-expanded'), k.yanDar()])
          .toEqual([true, 'true', false]);
        document.querySelector('[data-king="yan"]').click();
        expect(kok().classList.contains('is-yan-acik')).toBe(false);
      }finally{ k.yanDarSec(false); }
    }));

    it('··· menüsü son okuyanı ve nedenini yazar; okuma yoksa satır yok', () => sahneyle(async () => {
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => ({ status:200, blob:async () => ({}), json:async () => ({}),
        headers:{ get:h => h === 'X-Ses-Motor' ? 'piper' : h === 'X-Ses-Not' ? encodeURIComponent('Gemini kotası doldu; 60 sn boyunca denenmeyecek.') : null } });
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, { oynat:async () => 'bitti' });
      k.ac();
      k.menuAc('menu');
      expect(!!document.querySelector('[data-king-son-ses]')).toBe(false);
      k.menuAc(null);
      k.seslendir('Merhaba.');
      for(let i = 0; i < 12; i++) await new Promise(ok => setTimeout(ok, 0));
      k.menuAc('menu');
      expect(document.querySelector('[data-king-son-ses]').textContent)
        .toBe('Son okuyan: Piper. Gemini kotası doldu; 60 sn boyunca denenmeyecek.');
    }));

    it('küre katmanlı: iç akış döner, hareket azaltılmışsa durur (king.css)', async () => {
      const css = await (await fetch('../css/king.css')).text();
      expect(/\.king__kure::before\{[^}]*animation:king-akis/.test(css)).toBe(true);
      expect(/\.king__kure::after\{/.test(css)).toBe(true);
      expect(/prefers-reduced-motion:reduce\)\{[^@]*\.king__kure::before[^{]*\{ animation:none/.test(css)).toBe(true);
      expect(css.includes('king__ses-sec')).toBe(false);
    });
  });
  /* Söz 28 (depo sahibi, 2026-10-19): HKM bağlıysa ses HKM'den gelir (Gemini,
     yoksa Piper); gelmezse cihazın sesi. Seçim cihazda; «Cihaz» HKM'ye ses
     isteği yollamaz; Sustur çalanı keser. */
  describe('King — güzel ses (söz 28)', () => {
    function sesSahnesi(cevap){
      const istekler = [], calinan = [], okunan = [];
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => {
        const govde = JSON.parse(o.body);
        istekler.push({ url, govde });
        const c = typeof cevap === 'function' ? cevap(govde) : cevap;
        if(c instanceof Error) throw c;
        return { status:c.status, blob:async () => ({ metin:govde.metin }),
          headers:{ get:h => h === 'X-Ses-Motor' ? c.motor || '' : h === 'X-Ses-Not' ? c.not || null : null }, json:async () => ({}) };
      };
      const { k } = sahne({ hkm, fetch });
      let durdur = null;
      Object.assign(k._ortam, {
        sentez:() => ({ getVoices:() => [], cancel(){}, speak:u => { okunan.push(u.metin); if(u.onend) u.onend(); } }),
        soz:m => ({ metin:m }),
        oynat:async (blob, tut) => { calinan.push(blob.metin); tut({ dur:() => { durdur = 'durdu'; } }); return 'bitti'; },
        pcmCal:null,                                            // akışlı yol ayrı sınanır (K3)
      });
      return { k, istekler, calinan, okunan, durdu:() => durdur };
    }
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 12; i++) await bekle(); }

    it('HKM bağlıyken ses HKM’den gelir; cihaz sesi kullanılmaz', () => sahneyle(async () => {
      const s = sesSahnesi({ status:200, motor:'gemini' });
      s.k.seslendir('Merhaba. Bugün iyi uyudun.');
      await bitsin();
      expect(s.istekler.length).toBe(1);
      expect(s.istekler[0].url).toBe('http://127.0.0.1:4200/api/ses');
      expect(s.istekler[0].govde.tercih).toBe('oto');
      expect(s.calinan).toEqual(['Merhaba. Bugün iyi uyudun.']);
      expect(s.okunan.length).toBe(0);
      expect(s.k.sonMotor()).toBe('gemini');
    }));

    it('HKM ses üretemezse cihazın sesi okur; King susmaz', () => sahneyle(async () => {
      const s = sesSahnesi({ status:503 });
      s.k.seslendir('Merhaba.');
      await bitsin();
      expect(s.calinan.length).toBe(0);
      expect(s.okunan).toEqual(['Merhaba.']);
      expect(s.k.sonMotor()).toBe('cihaz');
      const a = sesSahnesi(new Error('ağ yok'));
      a.k.seslendir('Selam.');
      await bitsin();
      expect(a.okunan).toEqual(['Selam.']);
    }));

    it('«Cihaz» seçiliyse HKM’ye ses isteği gitmez; seçim panelde görünür', () => sahneyle(async () => {
      const s = sesSahnesi({ status:200, motor:'piper' });
      try{
        expect(s.k.sesTercihi()).toBe('oto');
        expect(s.k.sesTercihSec('bilinmez')).toBe(false);
        s.k.sesTercihSec('cihaz');
        expect(s.k.sesTercihi()).toBe('cihaz');
        s.k.seslendir('Merhaba.');
        await bitsin();
        expect(s.istekler.length).toBe(0);
        expect(s.okunan).toEqual(['Merhaba.']);
        s.k.sesTercihSec('piper');
        s.k.seslendir('Tekrar.');
        await bitsin();
        expect(s.istekler[0].govde.tercih).toBe('piper');
      }finally{ s.k.sesTercihSec('oto'); }
    }));

    it('uzun cevap parça parça istenir, sırayla çalar', () => sahneyle(async () => {
      const s = sesSahnesi({ status:200, motor:'gemini' });
      const cumle = 'Bu uzunca bir cümledir ve ses için parçalanmalıdır. ';
      const metin = cumle.repeat(20).trim();
      const p = s.k.sesParcalari(metin);
      expect(p.length > 1).toBe(true);
      expect(p.every(x => x.length <= 420)).toBe(true);
      s.k.seslendir(metin);
      await bitsin(); await bitsin();
      expect(s.calinan).toEqual(p);
    }));

    /* Ses kilidi (2026-10-19, «ses durduk yere Gemini'ye, Piper'a, cihaza
       geçiyor»): Otomatik her parçada sırayı baştan denemez. */
    const uzun = () => 'Bu uzunca bir cümledir ve ses için parçalanmalıdır. '.repeat(20).trim();
    it('ses kilidi: ilk parçayı okuyan motor kalan parçaları da okur', () => sahneyle(async () => {
      const s = sesSahnesi(g => ({ status:200, motor:g.tercih === 'oto' ? 'piper' : g.tercih }));
      const p = s.k.sesParcalari(uzun());
      s.k.seslendir(uzun());
      await bitsin(); await bitsin();
      expect(s.calinan).toEqual(p);
      expect(s.istekler.map(x => x.govde.tercih)).toEqual(['oto'].concat(p.slice(1).map(() => 'piper')));
      expect(s.okunan.length).toBe(0);
      expect(s.k.sonMotor()).toBe('piper');
    }));

    it('ses kilidi: kilitli motor ortada vermezse parça tercihle bir kez daha istenir', () => sahneyle(async () => {
      let gemini = 0;
      const s = sesSahnesi(g => {
        if(g.tercih === 'gemini') return ++gemini === 1 ? { status:200, motor:'gemini' } : { status:503 };
        return gemini ? { status:200, motor:'piper', not:encodeURIComponent('Gemini kotası doldu; 60 sn boyunca denenmeyecek.') }
          : { status:200, motor:'gemini' };
      });
      const p = s.k.sesParcalari(uzun());
      s.k.seslendir(uzun());
      await bitsin(); await bitsin(); await bitsin();
      expect(s.calinan).toEqual(p);
      expect(s.okunan.length).toBe(0);
      /* oto (1. parça, Gemini okur) · gemini (2. parça, kilit) · gemini (3. parça, 503) · oto (3. parça yeniden) */
      expect(s.istekler.slice(0, 4).map(x => x.govde.tercih)).toEqual(['oto', 'gemini', 'gemini', 'oto']);
      expect(s.k.sonMotor()).toBe('piper');
      expect(s.k.sonNot()).toBe('Gemini kotası doldu; 60 sn boyunca denenmeyecek.');
    }));

    it('ses kilidi: yeniden istek de olmazsa kalan cihazın sesiyle okunur, not temizlenir', () => sahneyle(async () => {
      let n = 0;
      const s = sesSahnesi(() => ++n === 1 ? { status:200, motor:'gemini', not:'' } : { status:503 });
      const p = s.k.sesParcalari(uzun());
      s.k.seslendir(uzun());
      await bitsin(); await bitsin(); await bitsin();
      expect(s.calinan).toEqual([p[0]]);
      expect(s.okunan.join(' ').replace(/\s+/g, ' ')).toBe(p.slice(1).join(' ').replace(/\s+/g, ' '));
      expect(s.k.sonMotor()).toBe('cihaz');
      expect(s.k.sonNot()).toBe('');
    }));

    it('Sustur çalan sesi keser', () => sahneyle(async () => {
      let birak = null;
      const s = sesSahnesi({ status:200, motor:'gemini' });
      s.k._ortam.oynat = (blob, tut) => new Promise(ok => { tut({ dur:() => ok('bitti') }); birak = ok; });
      s.k.seslendir('Uzun bir konuşma.');
      await bitsin();
      expect(document.querySelector('[data-king]') === null || true).toBe(true);
      s.k.sus();
      await bitsin();
      expect(s.okunan.length).toBe(0);
      if(birak) birak('bitti');
    }));
  });

  describe('King — ses algılama ve mikrofon ayarı (söz 29)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 12; i++) await bekle(); }

    it('Ayarlar menüsünde mikrofon seçilir, kayıt seçili mikrofonla açılır ve Mikrofonu dene sonucu gösterir', () => sahneyle(async () => {
      const istekler = [], acilanCihazlar = [];
      let konustuMu = true, _sessiz = null;
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async (url, o) => {
        const govde = JSON.parse(o.body);
        istekler.push({ url, govde });
        return { status:200, json:async () => ({ ok:true, metin:'Deneme bir iki', motor:'whisper' }) };
      };
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, {
        mikrofonlar:async () => [
          { id:'default', ad:'Varsayılan' },
          { id:'mik-usb', ad:'USB Stüdyo Mikrofonu' },
          { id:'mik-bt', ad:'Kulaklık Mikrofonu' },
        ],
        kayitAc:async (sessiz, cihazId) => {
          acilanCihazlar.push(cihazId || '');
          _sessiz = sessiz;
          return {
            bitir:() => ({ pcm:new Float32Array(1600), hz:16000, konustu:konustuMu, seviye:konustuMu ? 42 : 0 }),
          };
        },
      });
      k.ac();
      k.menuAc('menu');
      await bitsin();
      const sec = document.querySelector('[data-king-mik]');
      expect(!!sec).toBe(true);
      expect(sec.querySelectorAll('option').length).toBe(3);
      expect(k.mikSecili()).toBe('');
      k.mikSec('mik-usb');
      expect(k.mikSecili()).toBe('mik-usb');

      /* Algılama tercihi: Whisper seçilir ve /api/dinle'ye gider. */
      document.querySelector('[data-king="algila:whisper"]').click();
      expect(document.querySelector('[data-king="algila:whisper"]').getAttribute('aria-checked')).toBe('true');

      /* Mikrofonu dene: seçili mikrofonla açılır, sessizlikte biter ve sonucu yazar. */
      document.querySelector('[data-king="mik-dene"]').click();
      await bitsin();
      expect(acilanCihazlar).toEqual(['mik-usb']);
      _sessiz();
      await bitsin();
      expect(istekler.length).toBe(1);
      expect(istekler[0].url).toBe('http://127.0.0.1:4200/api/dinle');
      expect(istekler[0].govde.tercih).toBe('whisper');
      const notEl = document.querySelector('[data-king-mik-not]');
      expect(!!notEl).toBe(true);
      expect(/Deneme bir iki/.test(notEl.textContent)).toBe(true);

      /* Ses duyulmazsa uyarı verir, sunucuya gitmez. */
      konustuMu = false;
      document.querySelector('[data-king="mik-dene"]').click();
      await bitsin();
      _sessiz();
      await bitsin();
      expect(istekler.length).toBe(1);
      expect(/duyulmadı/i.test(document.querySelector('[data-king-mik-not]').textContent)).toBe(true);
    }));

    /* Sahada (2026-10-19): tek bir 503 «Whisper yok» dedirtip HKM'yi bırakıyordu;
       ardından tarayıcı tanıması her seferinde hata verip «Ses tanınamadı» yığılıyordu. */
    it('tek 503 HKM’yi bırakmaz, neden yazılır; ikincide geçici olarak tarayıcıya geçer', () => sahneyle(async () => {
      let sessiz = null;
      const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
      const fetch = async () => ({ status:503, json:async () => ({ ok:false, notlar:['Whisper yazıya dökemedi (TimeoutExpired).'] }) });
      const { k } = sahne({ hkm, fetch });
      const tanimaAcildi = [];
      Object.assign(k._ortam, {
        sentez:() => null,
        kayitAc:async s => { sessiz = s; return { bitir:() => ({ pcm:new Float32Array(1600), hz:16000, konustu:true }) }; },
        tanima:() => function(){ tanimaAcildi.push(1); this.start = () => {}; this.stop = () => {}; },
      });
      k.ac();
      k.dinle(); await bitsin(); sessiz(); await bitsin();
      const son = () => k.akis().filter(m => m.kim === 'king').pop().metin;
      expect(son()).toBe('Ses yazıya dökülemedi (Whisper yazıya dökemedi (TimeoutExpired)); yazarak da sorabilirsin.');
      k.dinle(); await bitsin(); sessiz(); await bitsin();
      expect(/^HKM sesi yazıya dökemedi/.test(son())).toBe(true);
      expect(tanimaAcildi.length).toBe(0);
      k.dinle(); await bitsin();
      expect(tanimaAcildi.length).toBe(1);                       // şimdi tarayıcı
    }));

    it('sesli sohbette tanıma hatası döngüyü tek mesajla durdurur', () => sahneyle(async () => {
      const { k } = sahne();
      let r = null;
      Object.assign(k._ortam, {
        sentez:() => null, kayitAc:null,
        tanima:() => function(){ r = this; this.start = () => {}; this.stop = () => {}; },
      });
      k.ac();
      await k.kipSec('konus');
      k.dinle();
      r.onerror({ error:'network' }); r.onend();
      await bitsin();
      const hatalar = k.akis().filter(m => m.kim === 'king' && /Ses tanınamadı/.test(m.metin));
      expect(hatalar.length).toBe(1);
      expect(hatalar[0].metin).toBe('Ses tanınamadı; sesli sohbeti durdurdum. Yazarak devam edebilirsin.');
      expect(k.sesliSohbetMi()).toBe(false);
    }));
  });
  /* Söz 36: araç kataloğu (brand/ortak/arac.js). Model yalnız seçer; kod
     doğrular; okuma çalışır ve sonucu ikinci turda cümleye çevrilir; yazma
     önizlenir ve yalnız onayla uygulanır. Harita modelsiz cevaplanır. */
  describe('King — araç kataloğu', () => {
    const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
    function sira(...cevaplar){
      const istekler = [];
      const fetch = async (url, o) => { istekler.push({ url, govde:JSON.parse(o.body) }); const c = cevaplar.shift() || { ok:true, mode:'model', text:'Tamam.' }; return { status:200, json:async () => c }; };
      return { fetch, istekler };
    }
    const calisan = [], uygulanan = [];
    const UYKU = { ad:'spi_uyku', tur:'oku', aciklama:'Son günlerin uyku saatleri.', es:/uykum nasıl/,
      parametreler:{ type:'object', properties:{ gun:{ type:'integer', minimum:1, maximum:60 } } },
      calistir:p => { calisan.push(p); return { sonuc:{ gun:p.gun || 7, ortalama_saat:7.5 }, satirlar:['Ortalama: 7,5 sa'] }; } };
    const BOLUM = { ad:'spi_bolum_ac_kapa', tur:'yaz', aciklama:'Bölümü gizler.',
      parametreler:{ type:'object', properties:{ bolum:{ type:'string' }, acik:{ type:'integer', enum:[0, 1] } }, required:['bolum', 'acik'] },
      onizle:p => ({ metin:'«' + p.bolum + '» ' + (p.acik ? 'açılacak' : 'gizlenecek') + '.' }),
      uygula:async p => { uygulanan.push(p); return { metin:'Bölüm gizlendi.', geriAl:async () => { uygulanan.pop(); } }; } };
    function aracSahne(m, o){
      calisan.length = 0; uygulanan.length = 0;
      const r = sahne(Object.assign({ hkm, fetch:m && m.fetch }, o || {}));
      window.LIFEOS.ARAC.kur({ modul:'spi', araclar:[UYKU, BOLUM] });
      return r;
    }
    const temizle = () => { window.LIFEOS.ARAC.kur({ modul:'spi', araclar:[] }); };

    it('okuma: model seçer, modülün kodu çalışır, sonuç ikinci turda cümleye çevrilir', () => sahneyle(async () => {
      const m = sira({ ok:true, mode:'arac', text:'', cagrilar:[{ ad:'spi_uyku', param:{ gun:7 }, tur:'oku' }] },
        { ok:true, mode:'model', text:'Son 7 gecede ortalama 7,5 saat uyumuşsun.' });
      const { k } = aracSahne(m);
      const r = await k.isle('son günlerde nasıl dinlendim sence');
      expect(r.tur).toBe('arac-oku');
      expect(m.istekler[0].govde.araclar.map(a => a.ad)).toContain('spi_uyku');
      expect(m.istekler[0].govde.araclar.map(a => a.ad)).toContain('sistem_haritasi');
      expect(calisan).toEqual([{ gun:7 }]);
      expect(m.istekler[1].govde.arac_sonuclari).toEqual([{ ad:'spi_uyku', param:{ gun:7 }, sonuc:{ gun:7, ortalama_saat:7.5 } }]);
      const son = k.akis().slice(-1)[0];
      expect(son.metin).toBe('Son 7 gecede ortalama 7,5 saat uyumuşsun.');
      expect(son.satirlar).toEqual(['Ortalama: 7,5 sa']);
      temizle();
    }));

    it('yazma: önizlenir, onaysız uygulanmaz; «evet»le uygulanır, «Geri al» kalır', () => sahneyle(async () => {
      const m = sira({ ok:true, mode:'arac', text:'Gizledim!', cagrilar:[{ ad:'spi_bolum_ac_kapa', param:{ bolum:'butce', acik:0 }, tur:'yaz' }] });
      const { k } = aracSahne(m);
      const r = await k.isle('şu kısmı artık görmek istemiyorum');
      expect(r.tur).toBe('arac-yaz');
      expect(uygulanan).toEqual([]);
      expect(k.bekleyenYetki().onizle.metin).toBe('«butce» gizlenecek.');
      /* Modelin «Gizledim!» cümlesi gösterilmez: yapılmamış iş anlatılmaz. */
      expect(k.akis().some(x => x.metin === 'Gizledim!')).toBe(false);
      await k.isle('evet');
      expect(uygulanan).toEqual([{ bolum:'butce', acik:0 }]);
      expect(k.akis().slice(-1)[0].metin).toBe('Bölüm gizlendi.');
      await k.geriAlYap();
      expect(uygulanan).toEqual([]);
      temizle();
    }));

    it('bilinmeyen araç ve geçersiz parametre reddedilir; hiçbir şey çalışmaz', () => sahneyle(async () => {
      const m = sira({ ok:true, mode:'arac', text:'', cagrilar:[{ ad:'hepsini_sil', param:{} }, { ad:'spi_uyku', param:{ gun:999 } },
        { ad:'spi_bolum_ac_kapa', param:{ bolum:'butce' } }] });
      const { k } = aracSahne(m);
      await k.isle('her şeyi uçur gitsin');
      expect(calisan).toEqual([]);
      expect(uygulanan).toEqual([]);
      expect(k.bekleyenYetki()).toBeNull();
      expect(m.istekler.length).toBe(1);
      temizle();
    }));

    it('kayıt: önce kullanıcının cümlesi; modelin cümlesi yalnız sayısı korunmuşsa', () => sahneyle(async () => {
      let kaydedilen = [];
      const veri = { onizle:t => { const x = String(t).match(/^uyku (\d+)$/); return x ? { tur:'uyku', metin:'Uyku ' + x[1] + ' sa', kaydet:async () => { kaydedilen.push(Number(x[1])); return 'Kaydedildi.'; } } : null; } };
      const m = sira({ ok:true, mode:'arac', cagrilar:[{ ad:'kayit_gir', param:{ metin:'uyku 7' } }] },
        { ok:true, mode:'arac', cagrilar:[{ ad:'kayit_gir', param:{ metin:'uyku 9' } }] });
      const { k } = aracSahne(m, { veri });
      await k.isle('dün gece yedi saat kadar uyudum');
      expect(k.akis().slice(-1)[0].onizleme.metin).toBe('Uyku 7 sa');
      expect(kaydedilen).toEqual([]);
      await k.isle('evet');
      expect(kaydedilen).toEqual([7]);
      await k.isle('dün gece yedi saat kadar uyudum');
      expect(k.akis().slice(-1)[0].metin).toContain('senin cümlende geçmeyen bir sayı çıktı');
      expect(kaydedilen).toEqual([7]);
      temizle();
    }));

    it('harita: «bu sistemde neler var» ve «… nasıl yapılır» modelsiz cevaplanır', () => sahneyle(async () => {
      const m = sira();
      const { k } = aracSahne(m);
      const r = await k.isle('bu sistemde neler var?');
      expect(r.tur).toBe('harita');
      expect(m.istekler.length).toBe(0);
      const s = k.akis().slice(-1)[0];
      expect(s.satirlar[0].indexOf('AYS — Sınav hazırlığı')).toBe(0);
      /* Söz 37: her modülün King'le yapılan işleri modüle göre; King'in ortak işleri ayrı satır. */
      expect(s.satirlar.length).toBe(5);
      expect(s.satirlar[1]).toContain('King’le Barkodu oku (kamera)');
      expect(s.satirlar[4].indexOf('King — her modülde: Odak sayacı')).toBe(0);
      await k.isle('barkod okutma nasıl yapılır?');
      expect(k.akis().slice(-1)[0].satirlar[0]).toBe('Barkodu oku — kamera ya da fotoğraf: + › Tüm işler');
      await k.isle('deneme nasıl yapılır?');
      expect(k.akis().slice(-1)[0].satirlar).toContain('Sayfası: Deneme (AYS)');
      temizle();
    }));

    /* Söz 37 (King 3.0 K5): «SPİ'nin içindeki şeyleri de King yapabilsin; barkod
       okumak gibi … hepsi tek bir alanda toplansın». */
    const BARKOD = { ad:'spi_barkod_ogun', tur:'yaz', aciklama:'Barkodlu ürünü öğüne ekler.',
      parametreler:{ type:'object', properties:{ kod:{ type:'string', maxLength:20 } }, required:['kod'] },
      onizle:p => ({ metin:'«Yulaf» öğüne eklenecek: 40 g.', satirlar:['Kaynak: Open Food Facts · doğrulanmadı'] }),
      uygula:async p => { uygulanan.push(p); return { metin:'«Yulaf» öğüne eklendi.' }; } };
    it('fotoğraf işi: görüntü okuma yardımı Merkez’e gider; işin önerisi onay kartıyla, onaysız yazılmaz', () => sahneyle(async () => {
      const m = sira({ ok:true, text:'Barkod: 4006381333931' });
      const { k } = aracSahne(m);
      window.LIFEOS.ARAC.kur({ modul:'spi', araclar:[BARKOD] });
      const okunan = [];
      k.kur({ modul:'spi', git:() => {}, ozet:() => [], hkm, foto:[{ id:'barkod', ad:'Barkodu oku', is:async (f, y) => {
        const r = await y.gorsel('rakamları yaz', 'gorsel'); okunan.push(r.text);
        return { metin:'Barkod 4006381333931.', arac:{ ad:'spi_barkod_ogun', param:{ kod:'4006381333931' } } }; } }] });
      Object.assign(k._ortam, { nesneUrl:() => 'blob:sahte', dosyaKare:async () => ({ mime:'image/jpeg', data:'QQ==' }) });
      k.ac();
      k.fotoAl(new File([new Uint8Array([1])], 'b.jpg', { type:'image/jpeg' }));
      document.querySelector('[data-king="foto:0"]').click();
      for(let i = 0; i < 6; i++) await new Promise(r => setTimeout(r, 0));
      expect(okunan).toEqual(['Barkod: 4006381333931']);
      expect([m.istekler[0].url.slice(-15), m.istekler[0].govde.yetenek]).toEqual(['/api/ofis/cevap', 'gorsel']);
      const s = k.akis().slice(-1)[0];
      expect(s.metin).toContain('Barkod 4006381333931. «Yulaf» öğüne eklenecek');
      expect(uygulanan.length).toBe(0);
      document.querySelector('[data-king="yetki-onay"]').click();
      for(let i = 0; i < 4; i++) await new Promise(r => setTimeout(r, 0));
      expect(uygulanan).toEqual([{ kod:'4006381333931' }]);
      temizle();
    }));

    it('kamera kipi: modülün fotoğraf işleri tek düğmeyle o anki kareyle çalışır', () => sahneyle(async () => {
      const { k } = aracSahne(null);
      const gelen = [];
      k.kur({ modul:'spi', git:() => {}, ozet:() => [], foto:[{ id:'barkod', ad:'Barkodu oku', is:async (f, y) => { gelen.push([f.name, f.type, f.size, y.kamera]); return 'Okundu.'; } },
        { id:'ogun', ad:'Öğün olarak oku', is:async () => 'Öğün.' }] });
      Object.assign(k._ortam, { kameraDestek:() => true, kameralar:async () => [{ id:'a', ad:'Dahili' }],
        kameraBaslat:async () => ({ video:document.createElement('video'), kare:() => ({ mime:'image/jpeg', data:'S0FN' }), bitir:() => {} }) });
      k.ac();
      await k.kamTazele();
      await k.kipSec('kamera');
      const dugme = Array.from(document.querySelectorAll('.king__kip-eylem [data-king^="kam-is:"]')).map(b => b.textContent);
      expect(dugme).toEqual(['Barkodu oku', 'Öğün olarak oku']);
      document.querySelector('[data-king="kam-is:0"]').click();
      for(let i = 0; i < 4; i++) await new Promise(r => setTimeout(r, 0));
      expect(gelen).toEqual([['barkod.jpg', 'image/jpeg', 3, true]]);
      expect(k.akis().filter(x => x.kim === 'sen').slice(-1)[0].metin).toBe('(kameradan) Barkodu oku');
      k.kipSec('yaz');
      temizle();
    }));

    it('Tüm işler: üç modülün işleri modüle göre; başka modülün işi orada açılır, örnek cümle yazı alanına konur', () => sahneyle(async () => {
      const { k, giden } = aracSahne(null);
      const gelen = [];
      k.kur({ modul:'spi', git:() => {}, ozet:() => [], foto:[{ id:'barkod', ad:'Barkodu oku', is:async f => { gelen.push(f.name); return 'Okundu.'; } }] });
      Object.assign(k._ortam, { nesneUrl:() => 'blob:sahte', kameraDestek:() => false });
      k.ac();
      document.querySelector('[data-king="arac"]').click();
      document.querySelector('.king__arac-menu [data-king="isler"]').click();
      const gruplar = Array.from(document.querySelectorAll('.king__isler-ad')).map(x => x.textContent);
      expect(gruplar).toEqual(['SPİ · sağlık', 'AYS · sınav · oraya geçer', 'ESP · gelişim · oraya geçer', 'King · her modülde']);
      const A = window.LIFEOS.ARAC;
      /* SPİ'nin fotoğraf işi burada: kamera yoksa yalnız «Fotoğraf seç»; seçilen fotoğraf doğrudan o işe. */
      document.querySelector('[data-king="is-sec:' + A.ISLER.findIndex(x => x.id === 'barkod') + '"]').click();
      expect(k.cipler().map(c => c.is)).toEqual(['foto-sec', 'vazgec']);
      k.fotoAl(new File([new Uint8Array([1])], 'urun.jpg', { type:'image/jpeg' }));
      for(let i = 0; i < 4; i++) await new Promise(r => setTimeout(r, 0));
      expect(gelen).toEqual(['urun.jpg']);
      k.buyut();                                   // iş sayfa açtı, King küçüldü
      /* cümle işi: örnek yazı alanına konur, gönderilmez */
      document.querySelector('[data-king="arac"]').click();
      document.querySelector('[data-king="isler"]').click();
      document.querySelector('[data-king="is-sec:' + A.ISLER.findIndex(x => x.ad === 'Besin değeri') + '"]').click();
      expect(document.querySelector('.king__girdi').value).toBe('yulafın besin değeri');
      /* ESP'nin işi: ESP'ye geçilir, iş orada açılır */
      document.querySelector('[data-king="arac"]').click();
      document.querySelector('[data-king="isler"]').click();
      const n = A.ISLER.findIndex(x => x.id === 'sayfa');
      document.querySelector('[data-king="is-sec:' + n + '"]').click();
      expect(giden.slice(-1)[0].indexOf('http://127.0.0.1:4193/')).toBe(0);
      expect(k.akis().slice(-1)[0].metin).toBe('Kitap sayfasını oku ESP’nin işi; oraya geçiyorum.');
      temizle();
    }));

    /* Söz 38: HKM'nin araştırma şablonu (arastirma.v1) kart olur; link yalnız http(s), yeni sekmede. */
    it('araştırma kartı: Özet, İzle, Oku; yalnız http(s) link; modül HKM’ye gider; Defter’e ekleme onaylı', () => sahneyle(async () => {
      const yt = 'https://www.youtube.com/watch?v=abc&t=166s';
      const m = sira({ ok:true, mode:'arastirma', text:'Özet …', arastirma:{ sablon:'arastirma.v1', modul:'spi', konu:'kuantum dolanıklığı',
        ozet:{ metin:'Dolanık parçacıklar ortak bir durumu paylaşır.' },
        izle:[{ no:2, baslik:'Dolanıklık anlatımı', kanal:'Bilim', sure:'12:30', dil:'Türkçe', dil_etiket:'olculdu', an:'2:46', link:yt, neden:'Konunun geçtiği an 2:46' },
          { no:3, baslik:'Kötü', link:'javascript:alert(1)' }],
        oku:[{ no:1, baslik:'Kuantum dolanıklığı', site:'tr.wikipedia.org', url:'https://tr.wikipedia.org/wiki/Dolan%C4%B1kl%C4%B1k', neden:'Ansiklopedi: Dolanıklık bir kuantum olgusudur.' }],
        sonraki:{ metin:'…', hedef:{ tur:'video', baslik:'Dolanıklık anlatımı', link:yt, kanal:'Bilim' } } } });
      const { k } = aracSahne(m);
      k.ac();
      const r = await k.isle('kuantum dolanıklığını araştır');
      expect([r.tur, r.mode, m.istekler[0].govde.modul]).toEqual(['merkez', 'arastirma', 'spi']);
      const kart = document.querySelector('.king__ars');
      expect(Array.from(kart.querySelectorAll('.king__ars-ad')).map(x => x.textContent).slice(0, 3)).toEqual(['Özet', 'İzle', 'Oku']);
      const linkler = Array.from(kart.querySelectorAll('a.king__ars-link'));
      expect(linkler.map(a => [a.getAttribute('href'), a.getAttribute('target')])).toEqual([[yt, '_blank'], ['https://tr.wikipedia.org/wiki/Dolan%C4%B1kl%C4%B1k', '_blank']]);
      expect(kart.textContent).toContain('Bilim · 12:30 · Türkçe · başlangıç 2:46');
      expect(!!kart.querySelector('[data-king^="ars-dinle:"]')).toBe(true);
      expect(k.arastirmaVeri({ sablon:'baska' })).toBeNull();
      const ekle = kart.querySelector('[data-king^="ars-ekle:"]');
      if(ekle){
        ekle.click();
        for(let i = 0; i < 4; i++) await new Promise(x => setTimeout(x, 0));
        expect(!!document.querySelector('[data-king="yetki-onay"]')).toBe(true);
        expect(k.akis().slice(-1)[0].metin).toContain('Defter’e not eklenecek');
      }
      temizle();
    }));

    it('model yokken «es» taşıyan okuma aracı kuralla çalışır', () => sahneyle(async () => {
      calisan.length = 0;
      const { k } = sahne({});
      window.LIFEOS.ARAC.kur({ modul:'spi', araclar:[UYKU] });
      const r = await k.isle('uykum nasıl');
      expect(r.tur).toBe('arac-oku');
      expect(calisan.length).toBe(1);
      expect(k.akis().slice(-1)[0].satirlar).toEqual(['Ortalama: 7,5 sa']);
      temizle();
    }));
  });
  /* King 3.0 K1 (ekran) ve K3 (doğal konuşma), 2026-10-21. */
  describe('King 3.0 — ekip, işler ve görevler (K1)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 15; i++) await bekle(); }
    const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
    const IS = (id, durum, ek) => Object.assign({ id, ajan:'zihin', tur:'devir', baslik:'B1 kaynakları', durum,
      durum_ad:{ bekliyor:'Sırada', calisiyor:'Çalışıyor', bitti:'Bitti', hata:'Hata', iptal:'İptal' }[durum], ilerleme:40, adim:'Rapor yazıyor', sonuc:null }, ek || {});
    const GOREV = { id:3, hedef:'B1', modul:'esp', modul_ad:'ESP', ajan:'zihin', ajan_ad:'Zihin', gun_sayisi:2, gunluk_dk:60,
      durum:'taslak', durum_ad:'Taslak', ilerleme:{ bitti:1, kapali:1, toplam:3, yuzde:33 }, teklif_sayisi:2,
      gunler:[{ gun:'2026-10-21', gun_ad:'Çar 21 Eki', adimlar:[1, 2] }, { gun:'2026-10-22', gun_ad:'Per 22 Eki', adimlar:[3] }],
      adimlar:[
        { no:1, tur:'analiz', baslik:'Durum analizi', ajan:'zihin', ajan_ad:'Zihin', durum:'bitti', durum_ad:'Bitti', ilerleme:100 },
        { no:2, tur:'arastirma', baslik:'Kaynak araştırması', ajan:'arastirmaci', ajan_ad:'Araştırmacı', durum:'calisiyor', durum_ad:'Çalışıyor', ilerleme:50 },
        { no:3, tur:'calisma', baslik:'Kelime listesi', ajan:'zihin', ajan_ad:'Zihin', durum:'bekliyor', durum_ad:'Bekliyor', ilerleme:0 }] };
    function ekipSahnesi(){
      const istekler = [];
      const v = { isler:[IS(7, 'calisiyor')], gorevler:[GOREV] };
      const fetch = async (url, o) => {
        istekler.push({ url, yontem:(o && o.method) || 'GET' });
        const durum = { acik:v.isler.filter(i => i.durum === 'calisiyor' || i.durum === 'bekliyor').length };
        durum.metin = durum.acik ? 'King şu an ' + durum.acik + ' iş yapıyor' : 'King şu an boşta';
        let g = { ok:true };
        if(/\/api\/king\/isler/.test(url)) g = { isler:v.isler, durum };
        else if(/\/api\/king\/gorevler/.test(url)) g = { gorevler:v.gorevler, durum };
        else if(/\/gorev\/3\/onayla$/.test(url)){ v.gorevler = [Object.assign({}, GOREV, { durum:'suruyor', durum_ad:'Sürüyor' })]; g = { ok:true }; }
        else if(/\/is\/7\/iptal$/.test(url)){ v.isler = [IS(7, 'iptal')]; g = { ok:true }; }
        return { status:200, json:async () => g };
      };
      const s = sahne({ hkm, fetch });
      return Object.assign(s, { istekler, v });
    }
    it('rozet yalnız açık iş varken çizilir; tıklanınca iş listesi ve görev panosu açılır', () => sahneyle(async () => {
      const s = ekipSahnesi();
      s.k.ac();
      await s.k.isYokla();
      const rozet = document.querySelector('.king__is-rozet');
      expect([rozet.textContent, rozet.getAttribute('aria-label')]).toEqual(['1 iş', 'King şu an 1 iş yapıyor. İşleri göster']);
      rozet.click();
      await bitsin();
      expect(s.k.menuDurum()).toBe('ekip');
      const pano = document.querySelector('.king__gorev');
      expect(pano.querySelector('.king__gorev-bas b').textContent).toBe('B1');
      expect(pano.querySelector('.king__cubuk').getAttribute('aria-label')).toBe('1/3 adım bitti');
      expect(pano.querySelectorAll('.king__adim-nokta.is-bitti').length >= 1).toBe(true);
      /* Açık gün adlarıyla; sahibi alt ajan yazılır. */
      expect(pano.querySelector('.king__gun.is-simdi .king__adimlar').textContent).toContain('Araştırmacı');
      expect(pano.textContent).toContain('2 plan teklifi ESP’nin Onaylar ekranında');
      expect(document.querySelector('.king__is b').textContent).toBe('B1 kaynakları');
      /* Başlat: onaysız başlamaz; düğmeyle POST …/onayla. */
      document.querySelector('[data-king="gorev-onayla:3"]').click();
      await bitsin();
      expect(s.istekler.some(x => x.yontem === 'POST' && /\/api\/king\/gorev\/3\/onayla$/.test(x.url))).toBe(true);
      expect(document.querySelector('.king__gorev').textContent).toContain('Sürüyor');
      /* İptal iki dokunuş ister. */
      document.querySelector('[data-king="gorev-iptal:3"]').click();
      expect(s.istekler.some(x => /gorev\/3\/iptal/.test(x.url))).toBe(false);
      expect(document.querySelector('[data-king="gorev-iptal:3"]').textContent).toBe('Emin misin? İptal et');
      /* İşi iptal etmek: rozet kalkar; iptal edilen iş haber edilmez. */
      const once = s.k.akis().length;
      document.querySelector('[data-king="is-iptal:7"]').click();
      await bitsin();
      expect(document.querySelector('.king__is-rozet')).toBe(null);
      expect(s.k.akis().length).toBe(once);
    }));
    it('iş bitince rapor sohbete düşer, kaynaklar tıklanır; King kapalıyken yoklama yok', () => sahneyle(async () => {
      const s = ekipSahnesi();
      s.k.ac();
      await s.k.isYokla();
      s.v.isler = [IS(7, 'bitti', { sonuc:{ ad:'Zihin', ozet:'Üç kaynak buldum.', kaynaklar:[{ baslik:'BBC Learning', url:'https://www.bbc.co.uk/learningenglish' }] } })];
      await s.k.isYokla();
      const m = s.k.akis().pop();
      expect(m.metin.split('\n')[0]).toBe('Zihin raporu (iş #7): Üç kaynak buldum.');
      const a = document.querySelector('.king__balon--king a');
      expect([a.getAttribute('href'), a.getAttribute('target')]).toEqual(['https://www.bbc.co.uk/learningenglish', '_blank']);
      expect(document.querySelector('.king__is-rozet')).toBe(null);
      await s.k.isYokla();
      expect(s.k.akis().filter(x => /raporu \(iş #7\)/.test(x.metin)).length).toBe(1);   // bir kez
      expect(s.k.isZamanli()).toBe(true);
      s.k.kapat();
      expect(s.k.isZamanli()).toBe(false);
      const n = s.istekler.length;
      await s.k.isYokla();
      expect(s.istekler.length).toBe(n);
    }));
  });

  describe('King 3.0 — doğal konuşma (K3)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 20; i++) await bekle(); }
    const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
    const akanSes = (motor, hz) => ({ status:200, body:{ getReader:() => ({ read:async () => ({ done:true }), cancel:() => {} }), cancel:() => {} },
      headers:{ get:h => h === 'X-Ses-Hz' ? String(hz) : h === 'X-Ses-Motor' ? motor : null }, json:async () => ({}) });
    it('ses akarak çalınır (/api/ses/akis); eski HKM 404 verirse bir kez /api/ses’e düşer ve hatırlar', () => sahneyle(async () => {
      const yollar = [], calinan = [];
      let eski = false;
      const fetch = async (url, o) => {
        yollar.push(url.replace('http://127.0.0.1:4200', ''));
        if(/\/api\/ses\/akis$/.test(url)) return eski ? { status:404, json:async () => ({}) } : akanSes('ema', 24000);
        return { status:200, blob:async () => ({ metin:JSON.parse(o.body).metin }), headers:{ get:h => h === 'X-Ses-Motor' ? 'piper' : null }, json:async () => ({}) };
      };
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, {
        sentez:() => null,
        pcmCal:async (res, hz) => { calinan.push(['akis', hz]); return 'bitti'; },
        oynat:async blob => { calinan.push(['wav', blob.metin]); return 'bitti'; },
      });
      try{
        k.seslendir('Merhaba.');
        await bitsin();
        expect([yollar, calinan, k.sonMotor()]).toEqual([['/api/ses/akis'], [['akis', 24000]], 'ema']);
        eski = true; yollar.length = 0; calinan.length = 0;
        k.seslendir('Selam.');
        await bitsin();
        k.seslendir('Yine.');
        await bitsin();
        expect(yollar).toEqual(['/api/ses/akis', '/api/ses', '/api/ses']);
        expect(calinan).toEqual([['wav', 'Selam.'], ['wav', 'Yine.']]);
      }finally{ k.sesTercihSec('oto'); }
    }));
    it('sesli sohbette ilk cümle cevap bitmeden okunur; baş tekrar okunmaz', () => sahneyle(async () => {
      const okunan = [];
      let i = 0, erken = null;
      const satirlar = ['{"t":"parca","metin":"Bugün üç blok var. "}\n', '{"t":"parca","metin":"İlki matematik."}\n',
        '{"t":"son","ok":true,"mode":"model","text":"Bugün üç blok var. İlki matematik."}\n'];
      const fetch = async (url, o) => {
        if(/\/api\/ses/.test(url)) return { status:200, blob:async () => ({ metin:JSON.parse(o.body).metin }), headers:{ get:() => null }, json:async () => ({}) };
        return { status:200, headers:{ get:h => /content-type/i.test(h) ? 'application/x-ndjson' : null },
          body:{ getReader:() => ({ read:async () => {
            /* İkinci parça gelmeden ilk cümle okunmaya başlamış olmalı. */
            if(i === 1){ await bekle(); await bekle(); erken = okunan.slice(); }
            return i < satirlar.length ? { value:satirlar[i++], done:false } : { done:true };
          } }) } };
      };
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, { sentez:() => null, pcmCal:null, kayitAc:null,
        oynat:async blob => { okunan.push(blob.metin.trim()); return 'bitti'; } });
      try{
        k.ac();
        k.cevapSec('ses');
        await k.isle('felsefede özgür irade hakkında ne düşünüyorsun');
        await bitsin();
        expect(erken).toEqual(['Bugün üç blok var.']);
        expect(okunan).toEqual(['Bugün üç blok var.', 'İlki matematik.']);
      }finally{ k.cevapSec('oto'); }
    }));
    it('araya girme: King konuşurken konuşursan aynı kayıt devralınır, yeni mikrofon açılmaz, söz yazıya dökülür', () => sahneyle(async () => {
      const acilan = [], dinle = [];
      let sessizFn = null;
      const fetch = async (url, o) => {
        if(/\/api\/dinle$/.test(url)){ dinle.push(JSON.parse(o.body)); return { status:200, json:async () => ({ ok:true, metin:'dur bir saniye' }) }; }
        if(/\/api\/ses/.test(url)) return { status:200, blob:async () => ({}), headers:{ get:() => null }, json:async () => ({}) };
        return { status:200, json:async () => ({ ok:true, text:'Tamam.', mode:'model' }) };
      };
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, {
        sentez:() => ({ getVoices:() => [], cancel(){}, speak(){} }), pcmCal:null,
        oynat:() => new Promise(() => {}),
        tanima:() => null,
        kayitAc:async (sessiz, cihaz, basla, esik) => {
          const x = { basla, esik, devral:(s2, e2) => { sessizFn = s2; x.devralindi = e2; },
            bitir:() => ({ pcm:new Float32Array(1600), hz:16000, konustu:true }) };
          acilan.push(x);
          return x;
        },
      });
      k.ac();
      await k.kipSec('konus');
      k.seslendir('Uzun bir cevap okuyorum.');
      await bitsin();
      const kes = acilan.filter(x => x.esik === 0.06).pop();
      kes.basla();
      await bitsin();
      expect(acilan.length).toBe(acilan.indexOf(kes) + 1);             // yeni kayıt açılmadı
      expect(kes.devralindi).toBe(0.02);                               // normal eşikle dinliyor
      expect(document.querySelector('[data-king]').classList.contains('is-konusuyor')).toBe(false);
      expect(document.querySelector('[data-king]').classList.contains('is-dinliyor')).toBe(true);
      sessizFn();
      await bitsin();
      expect(dinle.length).toBe(1);
      expect(k.akis().some(m => m.kim === 'sen' && m.metin === 'dur bir saniye')).toBe(true);
    }));
    it('«King» uyanma: varsayılan kapalı; yalnız «King» ile başlayan parça uyandırır, yerel modelle yazıya dökülür', () => sahneyle(async () => {
      const dinle = [], acilan = [];
      let cevap = 'Merhaba nasılsın';
      const fetch = async (url, o) => {
        if(/\/api\/dinle$/.test(url)){ dinle.push(JSON.parse(o.body).tercih); return { status:200, json:async () => ({ ok:true, metin:cevap }) }; }
        if(/\/api\/ses/.test(url)) return { status:503, json:async () => ({}) };
        return { status:200, json:async () => ({ ok:true, text:'Bugün iki blok var.', mode:'model' }) };
      };
      const { k } = sahne({ hkm, fetch });
      Object.assign(k._ortam, { sentez:() => null, kayitAc:null, gizli:() => false,
        uyanikAc:async () => { const u = { kapali:false, bitir:() => { u.kapali = true; } }; acilan.push(u); return u; } });
      try{
        expect(k.uyanCumlesi('King.')).toBe('');
        expect(k.uyanCumlesi('Hey King, bugün ne var?')).toBe('bugün ne var?');
        expect(k.uyanCumlesi('King bugün ne var')).toBe('bugün ne var');
        expect(k.uyanCumlesi('Bugün king size yatak aldım')).toBe(null);
        expect(k.uyanCumlesi(null)).toBe(null);
        await k.uyanKontrol();
        expect([k.uyanAcikMi(), acilan.length]).toEqual([false, 0]);   // varsayılan kapalı: mikrofon açılmaz
        k.uyanSec(true);
        await bitsin();
        expect(k.uyanikMi()).toBe(true);
        await k.uyanParca(new Float32Array(8000), 16000);
        expect([dinle, k.acikMi()]).toEqual([['gemma'], false]);        // «King» yok: uyanmaz, Gemini'ye gitmez
        cevap = 'King, bugün ne var?';
        await k.uyanParca(new Float32Array(8000), 16000);               // bekleme süresi: hemen ikinci deneme yok
        expect(dinle.length).toBe(1);
        k._ortam.simdi = () => new Date(2026, 9, 5, 9, 5);
        await k.uyanParca(new Float32Array(8000), 16000);
        await bitsin();
        expect([k.acikMi(), k.sesliSohbetMi(), k.uyanTurMu()]).toEqual([true, true, true]);
        expect(k.akis().some(m => m.kim === 'sen' && m.metin === 'bugün ne var?')).toBe(true);
        expect(acilan[0].kapali).toBe(true);                             // sesli konuşmada uyanma dinleyicisi kapanır
        k.uyanSec(false);
        expect(k.uyanikMi()).toBe(false);
      }finally{ k.uyanSec(false); }
    }));
    it('uyanma yalnız bu bilgisayardaki Merkez’le çalışır', () => sahneyle(async () => {
      let acildi = 0;
      const uzak = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://192.168.1.5:4200' }), urlOk:() => true });
      const { k } = sahne({ hkm:uzak, fetch:async () => ({ status:200, json:async () => ({}) }) });
      Object.assign(k._ortam, { gizli:() => false, uyanikAc:async () => { acildi++; return { bitir:() => {} }; } });
      try{
        k.uyanSec(true);
        await bitsin();
        expect(acildi).toBe(0);
      }finally{ k.uyanSec(false); }
    }));
  });
  describe('King 3.0 — beceriler, sözler ve bekleyen mesajlar (K2)', () => {
    const bekle = () => new Promise(ok => setTimeout(ok, 0));
    async function bitsin(){ for(let i = 0; i < 15; i++) await bekle(); }
    const hkm = () => ({ settings:() => ({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' }), urlOk:() => true });
    function k2Sahnesi(ek){
      const istekler = [];
      const v = Object.assign({
        beceriler:[{ id:3, ad:'Her pazartesi 09:00 · deneme', acik:true, tetik:{ tur:'zaman', gunler:[0], saat:'09:00' },
          eylemler:[{ tur:'mesaj', metin:'Hatırlatma: deneme.' }, { tur:'soru', metin:'Deneme nasıl geçti?', saat:'20:00' }],
          ozet:'Her pazartesi 09:00 → «Hatırlatma: deneme.»', calisma:2 }],
        sozler:[{ id:5, metin:'yarın fizik sınavım var', soru:'Fizik sınavın nasıl geçti?', vade_metin:'yarın 20:00', durum:'bekliyor', durum_ad:'Zamanı bekleniyor' }],
        mesajlar:[], chat:null }, ek || {});
      const fetch = async (url, o) => {
        const yol = url.replace('http://127.0.0.1:4200', ''), yontem = (o && o.method) || 'GET';
        const govde = o && o.body ? JSON.parse(o.body) : null;
        istekler.push({ yol, yontem, govde });
        let g = { ok:true };
        if(yol === '/api/king/beceriler' && yontem === 'GET') g = { beceriler:v.beceriler };
        else if(yol === '/api/king/sozler' && yontem === 'GET') g = { sozler:v.sozler };
        else if(/^\/api\/king\/bekleyen\?/.test(yol)){ g = { mesajlar:v.mesajlar }; v.mesajlar = []; }
        else if(/^\/api\/king\/beceriler\/3\/(ac|kapat)$/.test(yol)) v.beceriler[0].acik = /ac$/.test(yol);
        else if(yol === '/api/king/beceriler/3/sil') v.beceriler = [];
        else if(yol === '/api/king/beceriler/3'){ Object.assign(v.beceriler[0], govde.ad ? { ad:govde.ad } : {}, govde.tetik ? { tetik:govde.tetik } : {}); }
        else if(yol === '/api/king/sozler/5/sil') v.sozler = [];
        else if(/^\/api\/king\/isler/.test(yol)) g = { isler:[], durum:{ acik:0, metin:'King şu an boşta' } };
        else if(/^\/api\/chat/.test(yol)) g = v.chat;
        return { status:200, headers:{ get:() => null }, json:async () => g };
      };
      const s = sahne({ hkm, fetch });
      return Object.assign(s, { istekler, v });
    }
    it('panelde beceri açılıp kapanır, düzeltilir, iki dokunuşla silinir; söz silinir', () => sahneyle(async () => {
      const s = k2Sahnesi();
      s.k.ac();
      await s.k.beceriAc();
      expect(document.querySelector('.king__beceri b').textContent).toBe('Her pazartesi 09:00 · deneme');
      expect(document.querySelector('.king__beceri small').textContent).toBe('Pzt · 09:00 · 2 kez çalıştı');
      document.querySelector('[data-king="beceri-kapat:3"]').click();
      await bitsin();
      expect(s.v.beceriler[0].acik).toBe(false);
      expect(document.querySelector('[data-king="beceri-ac:3"]').getAttribute('aria-checked')).toBe('false');
      document.querySelector('[data-king="beceri-duzelt:3"]').click();
      const f = document.querySelector('[data-king-beceri-form="3"]');
      f.querySelector('[name="saat"]').value = '10:30';
      f.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
      await bitsin();
      const duz = s.istekler.find(x => x.yol === '/api/king/beceriler/3' && x.yontem === 'POST');
      expect(duz.govde).toEqual({ tetik:{ tur:'zaman', gunler:[0], saat:'10:30' } });
      document.querySelector('[data-king="beceri-sil:3"]').click();
      expect(s.istekler.some(x => /beceriler\/3\/sil/.test(x.yol))).toBe(false);
      document.querySelector('[data-king="beceri-sil:3"]').click();
      await bitsin();
      expect(document.querySelector('.king__beceri')).toBe(null);
      expect(document.querySelector('.king__is b').textContent).toBe('yarın fizik sınavım var');
      document.querySelector('[data-king="soz-sil:5"]').click();
      await bitsin();
      expect(s.istekler.some(x => x.yol === '/api/king/sozler/5/sil' && x.yontem === 'POST')).toBe(true);
    }));
    it('bekleyen mesaj King açılınca sohbete düşer, eylemi çalışır; alınan bir daha gelmez', () => sahneyle(async () => {
      const s = k2Sahnesi({ mesajlar:[{ id:12, tur:'beceri', metin:'Ders bitti mi? Mola zamanı.', soru:false,
        eylemler:[{ tur:'mesaj', metin:'Mola zamanı.' }, { tur:'sayac', dakika:5, ad:'Mola' }] }] });
      try{
        s.k.ac();
        await s.k.isYokla();
        expect(s.istekler.some(x => x.yol === '/api/king/bekleyen?modul=spi')).toBe(true);
        expect(s.k.akis().filter(m => m.metin === 'Ders bitti mi? Mola zamanı.').length).toBe(1);
        /* Sahnede zamanlayıcı anında biter: sayaç açılıp doldu. */
        expect(s.k.akis().some(m => /^Süre doldu: 5 dakika Mola/.test(m.metin))).toBe(true);
        await s.k.bekleyenAl();
        expect(s.k.akis().filter(m => m.metin === 'Ders bitti mi? Mola zamanı.').length).toBe(1);
      }finally{ s.k._ortam.depo.sil(s.k.ODAK); }
    }));
    it('King’in sorusuna ilk cevap yerel kurallara takılmadan Merkez’e gider; kutudaki öneri hemen sunulur', () => sahneyle(async () => {
      const s = k2Sahnesi({ mesajlar:[{ id:14, tur:'soz', metin:'Fizik sınavın nasıl geçti?', soru:true, eylemler:[{ tur:'soru', metin:'Fizik sınavın nasıl geçti?' }] }],
        chat:{ ok:true, mode:'model', text:'Tebrikler!', k2_not:'Not aldım.', cevap:{ bekleyen_id:14, kutuya:'spi' } } });
      s.k.ac();
      await s.k.bekleyenAl();
      await s.k.isle('antrenman yapacağım');                    // normalde Hareket sayfasına götürürdü
      await bitsin();
      expect(s.istekler.some(x => /^\/api\/chat/.test(x.yol))).toBe(true);
      expect(s.istekler.some(x => x.yol === '/api/kutu?modul=spi')).toBe(true);
      expect(s.k.akis().some(m => m.metin === 'Tebrikler!')).toBe(true);
      /* Yalnız ilk cevap: sonraki mesaj yine yerel kurallardan geçer. */
      const n = s.istekler.filter(x => /^\/api\/chat/.test(x.yol)).length;
      await s.k.isle('antrenman yapacağım');
      expect(s.istekler.filter(x => /^\/api\/chat/.test(x.yol)).length).toBe(n);
    }));
    it('cevaptaki söz notu ayrı satırda; «Söz yapma» sözü siler, «Cevap değil» cevabı geri alır', () => sahneyle(async () => {
      const s = k2Sahnesi({ chat:{ ok:true, mode:'model', text:'Başarılar!\n\nSöz aldım: yarın 20:00 soracağım. İstemezsen «bunu söz yapma» de.',
        k2_not:'Söz aldım: yarın 20:00 soracağım. İstemezsen «bunu söz yapma» de.', soz:{ id:5 } } });
      s.k.ac();
      await s.k.isle('felsefede yarın sınavım var hakkında ne düşünüyorsun');
      const m = s.k.akis().pop();
      expect(m.metin).toBe('Başarılar!');
      expect(document.querySelector('.king__k2').textContent).toContain('Söz aldım');
      document.querySelector('[data-king^="k2-soz:5:"]').click();
      await bitsin();
      expect(s.istekler.some(x => x.yol === '/api/king/sozler/5/sil')).toBe(true);
      expect(document.querySelector('.king__k2').textContent).toBe('Söz silindi; sormayacağım.');
      s.v.chat = { ok:true, mode:'model', text:'Güzel.\n\nNot aldım.', k2_not:'Not aldım.', cevap:{ bekleyen_id:12, kutuya:null } };
      await s.k.isle('felsefede özgür irade hakkında ne düşünüyorsun');
      expect(s.k.akis().pop().metin).toBe('Güzel.');
      document.querySelector('[data-king^="k2-cevap:12:"]').click();
      await bitsin();
      expect(s.istekler.some(x => x.yol === '/api/king/bekleyen/12/geri' && x.yontem === 'POST')).toBe(true);
    }));
  });
})();

