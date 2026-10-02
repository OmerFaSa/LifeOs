/* Ses — internet radyosu ve tık sesleri.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/radyo.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır. Adı `ses.test.js`
   DEĞİL: SPİ ve ESP'nin kendi ses (konuşma) testleri o adı taşır.

   Kanıtladığı sözler: varsayılan kapalıdır ve kullanıcı başlatmadan ağa
   çıkılmaz; tercih (tür, ses, tık) kalıcıdır; tık sesleri kapalıyken
   AudioContext hiç kurulmaz; ölü akışta türün sonraki istasyonuna geçilir,
   hepsi düşerse sakin bir cümle söylenir; internet yoksa «Bağlantı yok»;
   tarayıcı kendiliğinden çalmayı reddederse düğme «dokun, sürsün» hâline
   geçer; listedeki her akış doğrudan mp3/aac'tır (HLS yok). Hiçbir testte
   gerçek ağa çıkılmaz: ses öğesi ve fetch sahtedir. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const S = window.LIFEOS.SES;
  const K = window.LIFEOS.KABUK;

  /* Sahte <audio>: src atanınca kaydeder, play() verilen davranışla döner,
     olayları test elle tetikler. */
  function sahteOge(play){
    const dinle = {};
    const o = {
      src:'', volume:1, paused:true, currentTime:0, srcler:[],
      addEventListener(ad, fn){ (dinle[ad] = dinle[ad] || []).push(fn); },
      setAttribute(a, v){ if(a === 'src') this.src = v; },
      removeAttribute(a){ if(a === 'src') this.src = ''; },
      load(){}, pause(){ this.paused = true; },
      play(){ this.srcler.push(this.src); this.paused = false; return play ? play(this) : Promise.resolve(); },
      tetikle(ad){ (dinle[ad] || []).forEach(fn => fn({ type:ad, target:o })); },
    };
    return o;
  }
  const bekle = ms => new Promise(r => setTimeout(r, ms || 0));

  function ortamla(o, fn){
    const eski = {};
    try{ eski.ses = localStorage.getItem(S.ANAHTAR); }catch(e){}
    try{ localStorage.removeItem(S.ANAHTAR); }catch(e){}
    S._ortam(Object.assign({ cevrimici:() => true, fetch:() => Promise.resolve({ ok:true, json:() => [] }) }, o));
    S._sifirla();
    const bitir = () => {
      S._ortam(null);
      try{ if(eski.ses == null) localStorage.removeItem(S.ANAHTAR); else localStorage.setItem(S.ANAHTAR, eski.ses); }catch(e){}
      S._sifirla();
    };
    let r;
    try{ r = fn(); }catch(e){ bitir(); throw e; }
    return Promise.resolve(r).then(v => { bitir(); return v; }, e => { bitir(); throw e; });
  }

  describe('Ses — radyo', () => {
    it('yedi tür; her akış doğrudan https mp3/aac (HLS yok), adlar Türkçe', () => {
      expect(S.TURLER.map(t => t.ad)).toEqual(['Chill', 'Türkçe Pop', 'Türkçe Slow', 'Türkçe Rap',
        'İngilizce Pop', 'İngilizce Slow', 'İngilizce Rap']);
      S.TURLER.forEach(t => {
        expect(t.istasyonlar.length).toBeGreaterThan(1);
        t.istasyonlar.forEach(i => {
          expect(i.url.indexOf('https://')).toBe(0);
          expect(/\.m3u8?(\?|$)/i.test(i.url)).toBe(false);
        });
      });
    });

    it('varsayılan kapalı: açılışta ses öğesi kurulmaz, ağa çıkılmaz', () => ortamla({ sesOgesi:() => { throw new Error('kurulmamalıydı'); } }, () => {
      expect(S.durum().hal).toBe('kapali');
      expect(S.tercih().tik).toBe(false);
      expect(S._acilis()).toBe(false);
    }));

    it('tercih kalıcı: tür, ses düzeyi, tık sesleri', () => ortamla({ sesOgesi:() => sahteOge() }, () => {
      S.turSec('tr-slow', { calma:true });
      S.sesAyarla(0.35);
      S.tikAc(true);
      const d = JSON.parse(localStorage.getItem(S.ANAHTAR));
      expect(d.tur).toBe('tr-slow');
      expect(d.ses).toBe(0.35);
      expect(d.tik).toBe(true);
      S._sifirla();
      expect(S.tercih().tur).toBe('tr-slow');
      expect(S.tercih().ses).toBe(0.35);
      expect(S.tercih().tik).toBe(true);
      /* Bozuk kayıt varsayılana düşer, hata vermez. */
      localStorage.setItem(S.ANAHTAR, '{bozuk');
      S._sifirla();
      expect(S.tercih().tur).toBe('chill');
      expect(S.tercih().tik).toBe(false);
    }));

    it('ölü akışta türün sonraki istasyonuna geçer; çalınca adı söylenir', () => {
      const a = sahteOge();
      return ortamla({ sesOgesi:() => a }, async () => {
        S.turSec('chill');
        const t = S.TURLER.find(x => x.id === 'chill');
        expect(a.src).toBe(t.istasyonlar[0].url);
        expect(S.durum().hal).toBe('baglaniyor');
        a.tetikle('error');
        expect(a.src).toBe(t.istasyonlar[1].url);
        a.tetikle('playing');
        expect(S.durum().hal).toBe('caliyor');
        expect(S.durum().mesaj).toBe('Şimdi: ' + t.istasyonlar[1].ad);
        /* Çalan istasyon hatırlanır: bir sonraki «Çal» oradan başlar. */
        expect(S.tercih().son.chill).toBe(t.istasyonlar[1].url);
        S.durdur();
        expect(S.durum().hal).toBe('kapali');
        expect(a.src).toBe('');
        S.cal();
        expect(a.src).toBe(t.istasyonlar[1].url);
        S.durdur();
      });
    });

    it('takılan akış (stalled) da bekleme süresinden sonra geçer', () => {
      const a = sahteOge();
      return ortamla({ sesOgesi:() => a, bekleme:20 }, async () => {
        S.turSec('tr-rap');
        const t = S.TURLER.find(x => x.id === 'tr-rap');
        a.tetikle('playing');
        a.tetikle('stalled');
        /* Bekçi 20 ms'de geçer; sonraki bekçi en erken 40 ms'de. 30 ms'de
           ikinci istasyondayız (zamanlayıcılar bitiş sırasıyla koşar). */
        await bekle(30);
        expect(a.src).toBe(t.istasyonlar[1].url);
        S.durdur();
      });
    });

    it('hepsi düşerse ve yedek kaynak da boşsa: «Bu türde şu an çalan istasyon yok»', () => {
      const a = sahteOge();
      let sorgu = null;
      return ortamla({ sesOgesi:() => a, fetch:u => { sorgu = u; return Promise.resolve({ ok:true, json:() => [] }); } }, async () => {
        S.turSec('en-slow');
        const n = S.TURLER.find(x => x.id === 'en-slow').istasyonlar.length;
        for(let i = 0; i < n; i++) a.tetikle('error');
        await bekle(10);
        expect(sorgu.indexOf('https://de1.api.radio-browser.info/json/stations/search?')).toBe(0);
        expect(sorgu.indexOf('hidebroken=true') > 0).toBe(true);
        expect(S.durum().hal).toBe('yok');
        expect(S.durum().mesaj).toBe('Bu türde şu an çalan istasyon yok');
        expect(a.src).toBe('');
      });
    });

    it('yedek kaynak HLS vermez; verdiği akış denenir', () => {
      const a = sahteOge();
      const yanit = [
        { name:'Akış HLS', url_resolved:'https://x.test/a.m3u8', hls:1, codec:'AAC' },
        { name:'Akış Ogg', url_resolved:'https://x.test/b.ogg', hls:0, codec:'OGG' },
        { name:'Akış MP3', url_resolved:'https://x.test/c.mp3', hls:0, codec:'MP3' },
      ];
      return ortamla({ sesOgesi:() => a, fetch:() => Promise.resolve({ ok:true, json:() => yanit }) }, async () => {
        S.turSec('tr-rap');
        const n = S.TURLER.find(x => x.id === 'tr-rap').istasyonlar.length;
        for(let i = 0; i < n; i++) a.tetikle('error');
        await bekle(10);
        expect(a.src).toBe('https://x.test/c.mp3');
        a.tetikle('playing');
        expect(S.durum().mesaj).toBe('Şimdi: Akış MP3');
        S.durdur();
      });
    });

    it('internet yoksa «Bağlantı yok»; ses öğesine kaynak verilmez', () => {
      const a = sahteOge();
      return ortamla({ sesOgesi:() => a, cevrimici:() => false }, () => {
        S.cal();
        expect(S.durum().hal).toBe('baglantiyok');
        expect(S.durum().mesaj).toBe('Bağlantı yok');
        expect(a.srcler.length).toBe(0);
      });
    });

    it('tarayıcı kendiliğinden çalmayı reddederse ♪ «dokun, sürsün» hâline geçer', () => {
      let izin = false;
      const a = sahteOge(() => izin ? Promise.resolve()
        : Promise.reject(Object.assign(new Error('izin yok'), { name:'NotAllowedError' })));
      return ortamla({ sesOgesi:() => a }, async () => {
        /* Başka modülde çalıyordu: açılışta sürdürmeyi dener. */
        localStorage.setItem(S.ANAHTAR, JSON.stringify({ tur:'chill', caliyordu:Date.now() }));
        S._sifirla();
        expect(S._acilis()).toBe(true);
        await bekle(0);
        expect(S.durum().hal).toBe('dokun');
        const d = document.createElement('div');
        d.innerHTML = K.ustSerit({ modul:'ays', yol:['Bugün'] });
        document.body.appendChild(d);
        try{
          const b = d.querySelector('.ust__ses');
          expect(b.classList.contains('is-dokun')).toBe(true);
          expect(b.getAttribute('aria-label')).toContain('dokun');
          izin = true;
          S.cal();
          a.tetikle('playing');
          expect(S.durum().hal).toBe('caliyor');
          expect(b.classList.contains('is-caliyor')).toBe(true);
          expect(b.classList.contains('is-dokun')).toBe(false);
        }finally{ d.remove(); S.durdur(); }
      });
    });

    /* Geri tuşu: SPİ'de durdurulan müzik, geri dönülen AYS'de kendi
       eski damgasıyla yeniden başlamamalı. */
    it('modül geçişinde müzik devredilir: adres taze damgayı taşır, kaynak sayfanın damgası sıfırlanır', () => {
      const a = sahteOge();
      return ortamla({ sesOgesi:() => a }, () => {
        S.turSec('chill');
        a.tetikle('playing');
        S.devret();
        const url = window.LIFEOS.ANIMASYON.tasimaEkle('http://127.0.0.1:4183/');
        const tasinan = JSON.parse(JSON.parse(decodeURIComponent(url.split('#lifeos=')[1]))['lifeos.ses']);
        expect(Date.now() - tasinan.caliyordu < 5000).toBe(true);
        S._sayfadanCik();
        expect(JSON.parse(localStorage.getItem(S.ANAHTAR)).caliyordu).toBe(0);
        S.durdur();
      });
    });

    it('yenilemede (devir yok) çalan radyonun damgası tazelenir', () => {
      const a = sahteOge();
      return ortamla({ sesOgesi:() => a }, () => {
        S.turSec('chill');
        a.tetikle('playing');
        localStorage.setItem(S.ANAHTAR, JSON.stringify(Object.assign(S.tercih(), { caliyordu:1 })));
        S._sayfadanCik();
        expect(Date.now() - JSON.parse(localStorage.getItem(S.ANAHTAR)).caliyordu < 5000).toBe(true);
        S.durdur();
      });
    });

    /* Hata (2026-10-02): «dokun» hâlinde paneldeki Çal'a basınca belge
       düzeyindeki «ilk dokunuşta sür» pointerup'ta çalmayı başlatıyor,
       ardından düğmenin click'i «çalıyor» görüp DURDURUYORDU. */
    it('«dokun» hâlinde paneldeki Çal sürdürür; sayfada başka yere ilk dokunuş da sürdürür', () => {
      let izin = false;
      const a = sahteOge(() => izin ? Promise.resolve()
        : Promise.reject(Object.assign(new Error('izin yok'), { name:'NotAllowedError' })));
      return ortamla({ sesOgesi:() => a, sentetik:true }, async () => {
        localStorage.setItem(S.ANAHTAR, JSON.stringify({ tur:'chill', caliyordu:Date.now() }));
        S._sifirla();
        S._acilis();
        await bekle(0);
        expect(S.durum().hal).toBe('dokun');
        const d = document.createElement('div');
        d.innerHTML = S.panelHtml() + '<p id="rd-bos">boş yer</p>';
        document.body.appendChild(d);
        try{
          izin = true;
          const b = d.querySelector('[data-ses="cal"]');
          b.dispatchEvent(new PointerEvent('pointerup', { bubbles:true }));
          b.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true }));
          expect(S.durum().hal).toBe('baglaniyor');

          S.durdur();
          izin = false;
          S.cal();
          await bekle(0);
          expect(S.durum().hal).toBe('dokun');
          izin = true;
          d.querySelector('#rd-bos').dispatchEvent(new PointerEvent('pointerup', { bubbles:true }));
          expect(S.durum().hal).toBe('baglaniyor');
        }finally{ d.remove(); S.durdur(); }
      });
    });

    it('eski «çalıyordu» kaydı (uzun ara) sürdürülmez', () => ortamla({ sesOgesi:() => sahteOge() }, () => {
      localStorage.setItem(S.ANAHTAR, JSON.stringify({ tur:'chill', caliyordu:Date.now() - 6 * 3600 * 1000 }));
      S._sifirla();
      expect(S._acilis()).toBe(false);
      expect(S.durum().hal).toBe('kapali');
    }));

    it('panel: yedi tür çipi, şimdi satırı, çal/durdur, sonraki, ses kaydırıcısı, tık anahtarı', () => ortamla({ sesOgesi:() => sahteOge() }, () => {
      const d = document.createElement('div');
      d.innerHTML = S.panelHtml();
      try{
        const p = d.firstElementChild;
        expect(p.getAttribute('role')).toBe('dialog');
        expect(p.querySelectorAll('[data-ses-tur]').length).toBe(7);
        expect(p.querySelector('[data-ses-tur="chill"]').getAttribute('aria-pressed')).toBe('true');
        expect(p.querySelector('.ses__simdi').textContent.trim()).toBe('Kapalı');
        expect(p.querySelector('[data-ses="cal"]').textContent.trim()).toBe('Çal');
        expect(p.querySelector('[data-ses="sonraki"]').textContent.trim()).toBe('Sonraki istasyon');
        expect(p.querySelector('input[type="range"][data-ses="duzey"]').getAttribute('aria-label')).toBe('Ses düzeyi');
        const tk = p.querySelector('[data-ses="tik"]');
        expect(tk.getAttribute('role')).toBe('switch');
        expect(tk.textContent.trim()).toBe('Kapalı');
      }finally{ d.remove(); }
    }));

    it('üst şeritte çerçevesiz ♪ düğmesi: simge, erişilebilir ad, kapalıyken nokta yok', () => ortamla({}, () => {
      const d = document.createElement('div');
      d.innerHTML = K.ustSerit({ modul:'spi', yol:['Bugün'] });
      try{
        const b = d.querySelector('.ust__sag .ust__ses');
        expect(!!b).toBe(true);
        expect(b.getAttribute('aria-label')).toBe('Radyo ve sesler');
        expect(b.getAttribute('aria-haspopup')).toBe('dialog');
        expect(!!b.querySelector('svg.kbk-ic')).toBe(true);
        expect(b.classList.contains('is-caliyor')).toBe(false);
      }finally{ d.remove(); }
    }));
  });

  describe('Ses — tık sesleri', () => {
    function sahteBaglam(){
      const kayit = { kurulan:0, nota:[] };
      function Baglam(){
        kayit.kurulan++;
        this.currentTime = 0; this.state = 'running'; this.destination = {};
        this.createOscillator = () => {
          const o = { type:'', frequency:{ setValueAtTime(f){ o.f0 = f; }, exponentialRampToValueAtTime(f){ o.f1 = f; } },
            connect(){ return {}; }, start(t){ o.t = t; kayit.nota.push(o); }, stop(){} };
          return o;
        };
        this.createGain = () => ({ gain:{ setValueAtTime(){}, exponentialRampToValueAtTime(v){ kayit.tepe = Math.max(kayit.tepe || 0, v); } }, connect(){ return {}; } });
        this.resume = () => Promise.resolve();
      }
      return { Baglam, kayit };
    }
    function tikla(el){ el.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true })); }

    it('kapalıyken AudioContext hiç kurulmaz; açılınca ilk dokunuşta kurulur', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        const d = document.createElement('div');
        d.innerHTML = '<button type="button" id="tk-a">A</button>';
        document.body.appendChild(d);
        try{
          tikla(d.querySelector('#tk-a'));
          expect(S.tik('tik')).toBe(false);
          expect(kayit.kurulan).toBe(0);
          S.tikAc(true);
          tikla(d.querySelector('#tk-a'));
          expect(kayit.kurulan).toBe(1);
          expect(kayit.nota.length > 0).toBe(true);
        }finally{ d.remove(); }
      });
    });

    it('kısık, tok, kısa: tık ~200→140 Hz, kazanç ≤ 0.05; aç yukarı, kapa aşağı', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        kayit.nota.length = 0;
        expect(S.tik('tik')).toBe(true);
        expect(kayit.nota[0].f0).toBe(200);
        expect(kayit.nota[0].f1).toBe(140);
        expect(kayit.tepe <= 0.05).toBe(true);
        kayit.nota.length = 0;
        S.tik('ac');
        expect(kayit.nota.map(n => n.f0)).toEqual([180, 240]);
        kayit.nota.length = 0;
        S.tik('kapa');
        expect(kayit.nota.map(n => n.f0)).toEqual([240, 180]);
        kayit.nota.length = 0;
        S.tik('tamam');
        expect(kayit.nota.length).toBe(1);
      });
    });

    it('aria-pressed düğmesi aç/kapa sesi verir; onay kutusu da', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        const d = document.createElement('div');
        d.innerHTML = '<button type="button" aria-pressed="false" id="tk-p">P</button><input type="checkbox" id="tk-c">';
        document.body.appendChild(d);
        try{
          kayit.nota.length = 0;
          tikla(d.querySelector('#tk-p'));
          expect(kayit.nota.map(n => n.f0)).toEqual([180, 240]);
          kayit.nota.length = 0;
          const c = d.querySelector('#tk-c');
          c.checked = true;
          c.dispatchEvent(new Event('change', { bubbles:true }));
          expect(kayit.nota.map(n => n.f0)).toEqual([180, 240]);
        }finally{ d.remove(); }
      });
    });
  });
})();
