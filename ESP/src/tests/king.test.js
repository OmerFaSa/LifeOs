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
})();
