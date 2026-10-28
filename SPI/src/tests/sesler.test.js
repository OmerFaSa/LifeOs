/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/sesler.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Ses kayıtları — brand/ortak/sesler.js ve ses.js'teki kayıtla çalma.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/sesler.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.
   ==================================================================

   Kullanıcı (2026-10-28): «sesleri … zirveye taşı»; önceki turlarda
   «elektronik ses veriyor». Arayüz sesleri ve adım gerçek CC0 kayıttır;
   kayıt yoksa ya da çözülemezse sentez çalar (ses bozulmaz). */
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
      expect(d.querySelectorAll('input[type="range"]').length).toBe(7);
    }));
    it('bir olay bir ses: dokunuşun hemen ardından gelen sayfa sesi çalmaz; uyarı sesi var; chime aç/kapa çalar', () => ile(() => {
      expect(S().tik('tik')).toBe(true);
      expect(S().tik('sayfa', false)).toBe(false);
      expect(!!S().SESLER.uyari).toBe(true);
      expect(typeof S().chime).toBe('function');
      expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.ses.duzey') >= 0).toBe(true);
    }));
  });

  describe('Ses — kayıtlar', () => {
    const TURLER = ['tik', 'ac', 'kapa', 'tamam', 'sayfa', 'adim'];
    it('altı kayıt var ve hepsi gerçek WAV (RIFF … WAVE, 22 050 Hz mono)', () => {
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
    it('ses.js kayıtla çalan türleri bilir; gıdık, hırr ve mırıltı sentezde kalır', () => {
      const S = window.LIFEOS.SES;
      expect(S.KAYITLI).toEqual(TURLER);
      ['gidik', 'hirr', 'bla'].forEach(t => expect(S.KAYITLI.indexOf(t) < 0).toBe(true));
    });
    /* Kayıt çözüldüyse dokunuş kayıttan çalar (sentez notası açılmaz);
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
        expect(S.tik('tik')).toBe(true);
        const kayitli = olay.kaynak.filter(b => b.buffer && b.buffer.kayit);
        expect(kayitli.length).toBe(1);
        expect(olay.nota).toBe(0);
      }finally{ S._ortam(null); S._sifirla(); }
    });
  });
})();
