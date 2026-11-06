/* Ses kayıtları — brand/ortak/sesler.js ve ses.js'teki kayıtla çalma.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sesler.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.
   ==================================================================

   Kullanıcı (2026-10-28): «sesleri … zirveye taşı»; önceki turlarda
   «elektronik ses veriyor». 2026-11-05 («sistem sesleri tema ile çok
   alakasız»): arayüz sesleri piksel temaya uyan çip sentezi oldu; yalnız
   minik adımı CC0 kayıttır. Kayıt çözülemezse sentez çalar. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;

  /* Kullanıcı (2026-10-28): «ayarlarda ses kısmında her şeyini detaylı
     ayarlayabilelim: yürümenin sesinin yüksekliği, agentların konuşmasının
     sesi, sistemdeki tüm sesler». Ses gözlemcisi: düzeyler 26 LU'ya
     dağılıyordu, gezinmede iki ses, hatada başarı sesi çalıyordu. */
  describe('Ses — aileler ve düzeyler', () => {
    const S = () => window.LIFEOS.SES;
    function sahte(){
      const olay = { nota:0, kaynak:0 };
      const param = () => ({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} });
      const dugum = o => Object.assign({ connect(){ return {}; } }, o);
      function Baglam(){
        this.currentTime = 1; this.state = 'running'; this.destination = {}; this.sampleRate = 22050;
        this.createOscillator = () => dugum({ frequency:param(), start(){ olay.nota++; }, stop(){} });
        this.createGain = () => dugum({ gain:param() });
        this.createBiquadFilter = () => dugum({ Q:param(), frequency:param() });
        this.createBuffer = (k, n) => ({ getChannelData:() => new Float32Array(n) });
        this.createBufferSource = () => dugum({ playbackRate:{ value:1 }, start(){ olay.kaynak++; }, stop(){} });
        this.createDynamicsCompressor = () => dugum({ threshold:param(), knee:param(), ratio:param(), attack:param(), release:param() });
        this.createConvolver = () => dugum({});
        this.createStereoPanner = () => dugum({ pan:{ value:0 } });
        this.resume = () => Promise.resolve();
      }
      return { Baglam, olay };
    }
    function ile(fn){
      const { Baglam, olay } = sahte(), once = localStorage.getItem('lifeos.ses.duzey');
      S()._ortam({ AudioContext:Baglam, sentetik:true, cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) });
      S()._sifirla();
      try{ S().tikAc(true); return fn(olay); }
      finally{ S()._ortam(null); S()._sifirla(); try{ if(once == null) localStorage.removeItem('lifeos.ses.duzey'); else localStorage.setItem('lifeos.ses.duzey', once); }catch(e){} }
    }
    it('her tür bir aileye bağlı; düzey kaydedilir, genel ile çarpılır; 0 olan aile hiç çalmaz', () => ile(() => {
      expect(S().AILE.tik).toBe('dokunus'); expect(S().AILE.sayfa).toBe('gecis'); expect(S().AILE.adim).toBe('ortam');
      expect(S().AILE.uyari).toBe('onay'); expect(S().AILE.bla).toBe('karakter');
      expect(S().duzeyAyarla('genel', .5)).toBe(true);
      expect(S().duzeyAyarla('karakter', .4)).toBe(true);
      expect(Math.abs(S().duzey('karakter') - .2) < 1e-9).toBe(true);
      expect(S().duzeyAyarla('bilinmez', 1)).toBe(false);
      S().duzeyAyarla('genel', 1); S().duzeyAyarla('dokunus', 0);
      expect(S().tik('tik')).toBe(false);
      const d = document.createElement('div'); d.innerHTML = S().duzeySeciciHtml();
      expect(d.querySelector('[data-ses-duzey="dokunus"]').getAttribute('aria-valuetext')).toBe('Kapalı');
      expect(d.querySelectorAll('input[type="range"]').length).toBe(9);
    }));
    /* 2026-10-29 (kullanıcı: «genel, ajan, UI seslerini tek seferde kısalım; köşedeki
       şeye tıklayınca içlerindekini teker teker»): aile ile genel arasında grup. */
    it('üç ana kaydırıcı (Genel · Arayüz · Ajanlar); grup kendi ailelerini çarpar, ötekine dokunmaz', () => ile(() => {
      expect(S().duzeyAyarla('arayuz', .5)).toBe(true);
      expect(Math.abs(S().duzey('dokunus') - .5) < 1e-9).toBe(true);
      expect(Math.abs(S().duzey('onay') - .5) < 1e-9).toBe(true);
      expect(Math.abs(S().duzey('karakter') - .8) < 1e-9).toBe(true);
      expect(S().duzeyAyarla('ajan', 0)).toBe(true);
      expect(S().duzey('king')).toBe(0);
      const d = document.createElement('div'); d.innerHTML = S().duzeySeciciHtml();
      const ana = Array.from(d.querySelectorAll('.sesduzey > .sesduzey__satir input, .sesduzey__grup > .sesduzey__satir input')).map(i => i.getAttribute('data-ses-duzey'));
      expect(ana).toEqual(['genel', 'arayuz', 'ajan']);
      const ayr = Array.from(d.querySelectorAll('details.sesduzey__ayrinti')).map(x => Array.from(x.querySelectorAll('input')).map(i => i.getAttribute('data-ses-duzey')));
      expect(ayr).toEqual([['dokunus', 'gecis', 'onay'], ['karakter', 'ortam', 'king']]);
      expect(d.querySelector('details.sesduzey__ayrinti').open).toBe(false);
    }));
    it('bir olay bir ses: dokunuşun hemen ardından gelen sayfa sesi çalmaz; uyarı sesi var; chime aç/kapa çalar', () => ile(() => {
      expect(S().tik('tik')).toBe(true);
      expect(S().tik('sayfa', false)).toBe(false);
      expect(!!S().SESLER.uyari).toBe(true);
      expect(typeof S().chime).toBe('function');
      expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.ses.duzey') >= 0).toBe(true);
    }));
  });

  /* Kullanıcı, 2026-11-06: «5-6 tane ses var; 10-15 tane güzel, tatlı, eğlenceli ses olsun», «rahatlatıcı geliş gidiş sesi».
     Kulakla değil ölçüyle: her ses gerçekten çizilir (OfflineAudioContext); tepe, kırpılma, süre ve bulutun yumuşak başlayıp sönmesi. */
  describe('Ses — tatlı sesler ölçülür', () => {
    const S = () => window.LIFEOS.SES, SR = 44100;
    async function ciz(tur){
      const off = new OfflineAudioContext(2, SR * 3, SR);
      off.resume = () => Promise.resolve();
      off.decodeAudioData = undefined;   // kayıt yolu ayrı sınanır; burada sentez
      S()._ortam({ AudioContext:function(){ return off; }, sentetik:true, cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) });
      S()._sifirla();
      S().tikAc(true);
      const caldi = S().tik(tur, true, { perde:1 });
      const r = await off.startRendering(), v = r.getChannelData(0);
      let tepe = 0, ilk = -1, son = -1;
      for(let i = 0; i < v.length; i++){ const a = Math.abs(v[i]); if(a > tepe) tepe = a; if(a > 0.00316){ if(ilk < 0) ilk = i; son = i; } }   // -50 dB
      const rms = (a, b) => { let t = 0; for(let i = a; i < b; i++) t += v[i] * v[i]; return Math.sqrt(t / Math.max(1, b - a)); };
      return { caldi, tepe, sure:(son - ilk) / SR, rms, ilk, v };
    }
    it('en az 15 ses; hepsinin adı ve ailesi var; Ayarlar kartında tek tek dinlenir', () => {
      const t = Object.keys(S().SESLER);
      expect(t.length >= 15).toBe(true);
      t.forEach(x => { expect(!!S().AILE[x]).toBe(true); expect(!!S().SES_AD[x]).toBe(true); });
      S()._sifirla(); const vardi = S().tercih().tik;
      try{
        S().tikAc(true);
        const d = document.createElement('div'); d.innerHTML = S().sesListeHtml();
        expect(Array.from(d.querySelectorAll('[data-ses-dinle]')).map(b => b.getAttribute('data-ses-dinle')).sort()).toEqual(t.slice().sort());
        S().tikAc(false);
        d.innerHTML = S().sesListeHtml();
        expect(d.querySelector('[data-ses-dinle]').disabled).toBe(true);   // ses kapalıyken dinlenmez, kartta söylenir
        expect(!!d.querySelector('.sesliste__not')).toBe(true);
      }finally{ S().tikAc(vardi); S()._sifirla(); }
    });
    it('her ses: çalar, kırpılmaz, duyulur, uzamaz', async () => {
      try{
        for(const tur of Object.keys(S().SESLER)){
          const o = await ciz(tur);
          if(!o.caldi || o.tepe >= 0.99 || o.tepe < 0.008 || o.sure > 1.6) throw new Error(tur + ' tepe ' + o.tepe.toFixed(3) + ' süre ' + o.sure.toFixed(2));
        }
      }finally{ S()._ortam(null); S()._sifirla(); }
    });
    it('bulut sesi: kaymayla aynı boyda, yumuşak başlar, ani kesilmez', async () => {
      try{
        for(const tur of ['bulutGel', 'bulutGit']){
          const o = await ciz(tur), pen = Math.floor(SR * 0.05);
          let en = 0, enYer = 0;
          for(let i = o.ilk; i + pen < o.v.length; i += pen){ const r = o.rms(i, i + pen); if(r > en){ en = r; enYer = i; } }
          expect(o.sure > 0.55 && o.sure < 1.3).toBe(true);
          expect(o.rms(o.ilk, o.ilk + pen) < en * 0.5).toBe(true);                       // ilk 50 ms tepenin yarısından az: «aniden gelmez»
          expect((enYer - o.ilk) / SR > 0.15).toBe(true);
          const sonPen = o.ilk + Math.floor(SR * o.sure);
          expect(o.rms(sonPen - pen, sonPen) < en * 0.25).toBe(true);                    // sonu sönerek biter: «aniden kesilmez»
        }
      }finally{ S()._ortam(null); S()._sifirla(); }
    });
    it('ses kapalıyken çalmaz; askıdaki bağlamda (tarayıcı izin vermedi) ses sonraya birikmez', async () => {
      let kurulan = 0, cal = 0;
      const param = () => ({ value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){} }), dugum = o => Object.assign({ connect(){ return {}; } }, o);
      function Baglam(){ kurulan++; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; this.sampleRate = 22050;
        this.resume = () => new Promise(() => {});   // tarayıcı dokunuş bekliyor: hiç çözülmez
        this.createGain = () => dugum({ gain:param() }); this.createOscillator = () => dugum({ frequency:param(), start(){ cal++; }, stop(){} }); }
      S()._ortam({ AudioContext:Baglam, sentetik:true, cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) });
      S()._sifirla();
      const vardi = S().tercih().tik;
      try{
        S().tikAc(false);
        expect(S().olaySes('bulutGel')).toBe(false);
        expect(kurulan).toBe(0);                                                         // kapalıyken bağlam hiç kurulmaz
        S().tikAc(true);
        expect(S().olaySes('bulutGit')).toBe(false);
        expect(cal).toBe(0);
      }finally{ S().tikAc(vardi); S()._ortam(null); S()._sifirla(); }
    });
    it('bir olay bir ses: tepki sesinin ardından aç/kapa ve «kaydedildi» çalmaz; arada uzun süre varsa çalar', () => {
      const param = () => ({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} }), dugum = o => Object.assign({ connect(){ return {}; } }, o);
      let saat = 1;
      function Baglam(){ this.state = 'running'; Object.defineProperty(this, 'currentTime', { get:() => saat }); this.destination = {}; this.sampleRate = 22050;
        this.createOscillator = () => dugum({ frequency:param(), start(){}, stop(){} }); this.createGain = () => dugum({ gain:param() }); this.resume = () => Promise.resolve(); }
      S()._ortam({ AudioContext:Baglam, sentetik:true, cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) });
      S()._sifirla();
      const vardi = S().tercih().tik;
      try{
        S().tikAc(true);
        expect(S().tik('isaret')).toBe(true);
        expect(S().tik('ac')).toBe(false);
        expect(S().tik('tamam')).toBe(false);
        saat += 1;
        expect(S().tik('tamam')).toBe(true);
        saat += 0.1;
        expect(S().tik('isaret')).toBe(true);   // tepkiler üst üste gelebilir: art arda tiklenen iş sessiz kalmaz
      }finally{ S().tikAc(vardi); S()._ortam(null); S()._sifirla(); }
    });
  });

  describe('Ses — kayıtlar', () => {
    const TURLER = ['adim'];
    it('tek kayıt (adım) var ve gerçek WAV (RIFF … WAVE, 22 050 Hz mono)', () => {
      const K = window.LIFEOS.SES_KAYIT;
      expect(Object.keys(K)).toEqual(TURLER);
      TURLER.forEach(t => {
        const b = atob(K[t]);
        expect(b.slice(0, 4)).toBe('RIFF');
        expect(b.slice(8, 12)).toBe('WAVE');
        const v = new DataView(Uint8Array.from(b.slice(0, 44), c => c.charCodeAt(0)).buffer);
        expect(v.getUint16(22, true)).toBe(1);
        expect(v.getUint32(24, true)).toBe(22050);
      });
    });
    it('ses.js kayıtla çalan türleri bilir; arayüz sesleri ve minik konuşması sentezde kalır', () => {
      const S = window.LIFEOS.SES;
      expect(S.KAYITLI).toEqual(TURLER);
      ['tik', 'ac', 'kapa', 'tamam', 'sayfa', 'uyari', 'gidik', 'hirr', 'bla'].forEach(t => expect(S.KAYITLI.indexOf(t) < 0).toBe(true));
    });
    /* Kayıt çözüldüyse adım kayıttan çalar (sentez notası açılmaz);
       çözülmemişse (ilk ses, sahte bağlam) sentez çalar. */
    it('çözülen kayıt sentezin yerine çalar, aynı zincirden geçer', () => {
      const S = window.LIFEOS.SES, olay = { kaynak:[], nota:0 };
      const param = () => ({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} });
      const dugum = o => Object.assign({ connect(){ return {}; } }, o);
      function Baglam(){
        this.currentTime = 0; this.state = 'running'; this.destination = {}; this.sampleRate = 22050;
        this.createOscillator = () => dugum({ frequency:param(), start(){ olay.nota++; }, stop(){} });
        this.createGain = () => dugum({ gain:param() });
        this.createBiquadFilter = () => dugum({ Q:param(), frequency:param() });
        this.createBuffer = (k, n) => ({ getChannelData:() => new Float32Array(n) });
        this.createBufferSource = () => { const b = dugum({ playbackRate:{ value:1 }, start(){ olay.kaynak.push(b); }, stop(){} }); return b; };
        this.createDynamicsCompressor = () => dugum({ threshold:param(), knee:param(), ratio:param(), attack:param(), release:param() });
        this.createConvolver = () => dugum({});
        this.createStereoPanner = () => dugum({ pan:{ value:0 } });
        this.resume = () => Promise.resolve();
        this.decodeAudioData = (ab, iyi) => { iyi({ duration:.16, kayit:true }); return Promise.resolve(); };
      }
      S._ortam({ AudioContext:Baglam, sentetik:true, cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) });
      S._sifirla();
      try{
        S.tikAc(true);
        expect(S.tik('adim')).toBe(true);
        const kayitli = olay.kaynak.filter(b => b.buffer && b.buffer.kayit);
        expect(kayitli.length).toBe(1);
        expect(olay.nota).toBe(0);
      }finally{ S._ortam(null); S._sifirla(); }
    });
  });

  /* Başarım (2026-10-29): sayfa açıldıktan sonraki İLK dokunuş 470-700 ms sürüyordu;
     181 ms'si `new AudioContext()` (Windows ses aygıtını o an kurar). Bağlam boşta
     ÖNCEDEN askıda kurulur; ilk dokunuş yalnız resume() çağırır. Ses kapalıyken kurulmaz. */
  describe('Ses — bağlam önceden kurulur', () => {
    it('onKur boşta bağlamı askıda kurar, resume çağırmaz; ikinci kez kurmaz; ses kapalıyken kurmaz', () => {
      const S = window.LIFEOS.SES; let kurulan = 0, resume = 0;
      function Baglam(){ kurulan++; this.state = 'suspended'; this.currentTime = 0; this.destination = {};
        this.resume = () => { resume++; return Promise.resolve(); }; this.close = () => Promise.resolve(); }
      S._ortam({ AudioContext:Baglam, sentetik:true, cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) });
      S._sifirla();
      const tikVardi = S.tercih().tik;
      try{
        S.tikAc(true);
        expect(S._onKur()).toBe(true);
        expect(kurulan + ',' + resume).toBe('1,0');
        expect(S._onKur()).toBe(false);
        expect(kurulan).toBe(1);
        S._sifirla(); S.tikAc(false);
        expect(S._onKur()).toBe(false);
        expect(kurulan).toBe(1);
      }finally{ S.tikAc(tikVardi); S._ortam(null); S._sifirla(); }
    });
  });
  /* 2026-10-29: Ayarlar › Bildirimler › Sessiz saatler. */
  describe('Ses · sessiz saatler', () => {
    const S = () => window.LIFEOS.SES;
    function ile(v, fn){
      const once = localStorage.getItem(S().SESSIZ_ANAHTAR);
      try{ if(v) localStorage.setItem(S().SESSIZ_ANAHTAR, JSON.stringify(v)); else localStorage.removeItem(S().SESSIZ_ANAHTAR); return fn(); }
      finally{ if(once == null) localStorage.removeItem(S().SESSIZ_ANAHTAR); else localStorage.setItem(S().SESSIZ_ANAHTAR, once); }
    }
    const t = (h, m) => new Date(2026, 9, 29, h, m || 0);
    it('kapalıyken hiç susmaz; varsayılan 22:00–07:00', () => ile(null, () => {
      expect(S().sessiz()).toEqual({ acik:false, bas:'22:00', bit:'07:00' });
      expect(S().sessizMi(t(23))).toBe(false);
    }));
    it('gece yarısını geçen aralık: 22–07 arası sessiz, dışı değil; açıkken düzey 0', () => ile({ acik:true, bas:'22:00', bit:'07:00' }, () => {
      expect(S().sessizMi(t(23, 30))).toBe(true);
      expect(S().sessizMi(t(3))).toBe(true);
      expect(S().sessizMi(t(7))).toBe(false);
      expect(S().sessizMi(t(12))).toBe(false);
      expect(S().sessizMi(t(21, 59))).toBe(false);
    }));
    it('gün içi aralık ve bozuk saat', () => ile({ acik:true, bas:'13:00', bit:'14:00' }, () => {
      expect(S().sessizMi(t(13, 30))).toBe(true);
      expect(S().sessizMi(t(14))).toBe(false);
      localStorage.setItem(S().SESSIZ_ANAHTAR, JSON.stringify({ acik:true, bas:'25:00', bit:'x' }));
      expect(S().sessiz().bas).toBe('22:00');
    }));
  });
})();
