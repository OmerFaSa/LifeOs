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

    it('radyo varsayılan kapalı (ses öğesi kurulmaz, ağa çıkılmaz); arayüz sesleri varsayılan açık', () => ortamla({ sesOgesi:() => { throw new Error('kurulmamalıydı'); } }, () => {
      expect(S.durum().hal).toBe('kapali');
      expect(S.tercih().tik).toBe(true);
      expect(S._acilis()).toBe(false);
    }));

    it('arayüz sesleri bir kez açılır: eski kayıttaki «kapalı» 2026-10-27 isteğiyle açılır, sonra yeni seçim korunur', () => ortamla({ sesOgesi:() => sahteOge() }, () => {
      localStorage.setItem(S.ANAHTAR, JSON.stringify({ tur:'chill', ses:0.5, tik:false }));
      S._sifirla();
      expect(S.tercih().tik).toBe(true);
      S.tikAc(false);
      S._sifirla();
      expect(S.tercih().tik).toBe(false);
    }));

    it('yeni sesler tanımlı: sayfa, gıdık, sohbet', () => {
      ['sayfa', 'gidik', 'bla'].forEach(t => expect(S.SESLER[t].length > 0).toBe(true));
    });

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
      expect(S.tercih().tik).toBe(true);
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

    /* 2026-10-29 (kullanıcı: «sakin bir radyo daha hareketli pop çalıyor»):
       yedek arama yalnız etikete bakıyordu; «slow» etiketli dans/kulüp akışı
       sakin türe giriyordu. */
    it('sakin türün yedeği dans, rap ya da rock etiketli akışı almaz', () => {
      const a = sahteOge();
      const yanit = [
        { name:'Kulüp Slow Mix', url_resolved:'https://x.test/kulup.mp3', hls:0, codec:'MP3', tags:'slow,dance,club' },
        { name:'Sakin Akış', url_resolved:'https://x.test/sakin.mp3', hls:0, codec:'MP3', tags:'slow,akustik' },
      ];
      return ortamla({ sesOgesi:() => a, fetch:() => Promise.resolve({ ok:true, json:() => yanit }) }, async () => {
        S.turSec('tr-slow');
        const n = S.TURLER.find(x => x.id === 'tr-slow').istasyonlar.length;
        for(let i = 0; i < n; i++) a.tetikle('error');
        await bekle(10);
        expect(a.src).toBe('https://x.test/sakin.mp3');
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
        expect(tk.textContent.trim()).toBe('Açık');   // arayüz sesleri varsayılan açık (2026-10-27)
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
      const kayit = { kurulan:0, nota:[], gurultu:[], filtre:[], sikistirici:0, yanki:0, saat:0, tepe:0, panlar:[] };
      const param = () => ({ value:0, setValueAtTime(){}, linearRampToValueAtTime(){},
        exponentialRampToValueAtTime(v){ kayit.tepe = Math.max(kayit.tepe, v); } });
      /* Osilatörün frekansına bağlanan düğüm titreşimdir (vibrato LFO'su). */
      const dugum = o => Object.assign({ connect(h){ if(h && h.sahip) h.sahip.vibrato = true; return {}; } }, o);
      function Baglam(){
        kayit.kurulan++;
        Object.defineProperty(this, 'currentTime', { get:() => kayit.saat });
        this.state = 'running'; this.destination = {}; this.sampleRate = 8000;
        this.createOscillator = () => {
          const o = dugum({ type:'', frequency:{ setValueAtTime(f){ o.f0 = f; }, exponentialRampToValueAtTime(f){ o.f1 = f; }, get sahip(){ return o; } },
            start(t){ o.t = t; kayit.nota.push(o); }, stop(){} });
          return o;
        };
        this.createGain = () => dugum({ gain:param() });
        this.createBiquadFilter = () => { const f = dugum({ type:'', Q:param(), frequency:{ setValueAtTime(v){ f.f = v; }, exponentialRampToValueAtTime(){} } }); kayit.filtre.push(f); return f; };
        this.createBuffer = (k, n) => ({ getChannelData:() => new Float32Array(n) });
        this.createBufferSource = () => { const b = dugum({ start(t){ b.t = t; kayit.gurultu.push(b); }, stop(){} }); return b; };
        this.createDynamicsCompressor = () => { kayit.sikistirici++; return dugum({ threshold:param(), knee:param(), ratio:param(), attack:param(), release:param() }); };
        this.createConvolver = () => { kayit.yanki++; return dugum({}); };
        this.createStereoPanner = () => { const p = dugum({ pan:{ value:0 } }); kayit.panlar.push(p); return p; };
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
          S.tikAc(false);
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

    /* Kullanıcı (2026-10-28): «sesleri daha profesyonel yap». Tık artık
       sinüs «blop» değil: kısa bir dokunuş hışırtısı + cam gövde + hafif
       ağırlık; aç/kapa iki notalık tel (aç yükselir, kapa iner); hepsi
       kısık, ortak bir sıkıştırıcıdan ve kısa bir oda yankısından geçer. */
    it('tık: hışırtı + ton katmanı, 60 ms\'den kısa; aç yükselir, kapa iner; «tamam» yankılı çan', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        expect(S.tik('tik')).toBe(true);
        expect(kayit.gurultu.length).toBe(1);
        expect(kayit.nota.length > 0).toBe(true);
        expect(Math.max.apply(null, S.SESLER.tik.map(k => k.t + k.d)) <= 0.06).toBe(true);
        const ton = ad => S.SESLER[ad].map(k => k.f[0]);
        const ac = ton('ac'), kapa = ton('kapa');
        expect(ac.length).toBe(2);
        expect(ac[1]).toBeGreaterThan(ac[0]);
        expect(kapa[0]).toBeGreaterThan(kapa[1]);
        expect(S.SESLER.tamam.some(k => k.oda > 0 && k.d >= 0.4)).toBe(true);
      });
    });

    it('çıkış zinciri: bir sıkıştırıcı ve bir oda yankısı (bağlamda bir kez); aynı ses 40 ms içinde üst üste çalmaz', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        expect(S.tik('tik')).toBe(true);
        expect(S.tik('tik')).toBe(false);
        kayit.saat += 0.05;
        expect(S.tik('tik')).toBe(true);
        expect(kayit.sikistirici).toBe(1);
        expect(kayit.yanki).toBe(1);
      });
    });

    /* Kullanıcı (2026-10-28, ikinci tur): «sesler çok zayıf ve kulak
       tırmalıyor». Ölçüm: tepe −33…−42 dBFS (duyulmuyordu), Ponpon'un
       kıkırdamasının yarısı 2,5 kHz üstündeydi (testere dişi + 2,8 kHz
       ünlü). Şimdi: duyulur düzey, tizlik yok, testere dişi yok. */
    it('duyulur ama yumuşak: katman kazancı 0.05–0.3; hiçbir ton ya da süzgeç 2,2 kHz üstüne çıkmaz; testere dişi yok', () => {
      Object.keys(S.SESLER).forEach(ad => {
        expect(Math.max.apply(null, S.SESLER[ad].map(k => k.g)) >= 0.05).toBe(true);
        S.SESLER[ad].forEach(k => { expect(k.g > 0 && k.g <= 0.3).toBe(true); expect(k.t + k.d <= 1).toBe(true); });
      });
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        Object.keys(S.SESLER).forEach(ad => {
          kayit.saat += 2; kayit.nota.length = 0; kayit.filtre.length = 0;
          expect(S.tik(ad, true, { perde:1.25 })).toBe(true);
          kayit.nota.forEach(n => {
            expect(n.type === 'sawtooth' || n.type === 'square').toBe(false);
            expect(Math.max(n.f0, n.f1 || 0) <= 2200).toBe(true);
          });
          /* 2026-10-28: gerçek kayıtların yolu ayrı ve 5,5 kHz (S.KAYIT_TAVAN): yalnız kayıt geçer, sentez 2,2 kHz altında kalır. */
          kayit.filtre.forEach(f => expect(f.f <= 2200 || f.f === S.KAYIT_TAVAN).toBe(true));
        });
      });
    });

    /* Kullanıcı (2026-10-28, dördüncü tur): «hâlâ elektronik ses veriyor;
       soft ve yumuşak değil». Osilatör ne yapılsa elektronik duyulur;
       dosyasız fiziksel modellemeye geçildi: notalar TEL (Karplus–Strong:
       süzülmüş gürültü bir gecikme halkasında söner — yumuşak naylon tel),
       minik sesleri KABARCIK (perdesi yukarı kıvrılan çok kısa sinüs: suda
       «blup»), dokunuş ve adım KEÇE (alçak geçiren süzgeçten kısa gürültü).
       Hiçbir tonlu katman ani başlamaz (en az 4 ms yükseliş: tık yok). */
    it('organik ve yumuşak: notalar tel, minik sesleri kabarcık, dokunuş keçe; ani başlayan ton yok', () => {
      ['ac', 'kapa', 'tamam'].forEach(ad => S.SESLER[ad].forEach(k => expect(k.tur).toBe('tel')));
      ['gidik', 'bla'].forEach(ad => S.SESLER[ad].forEach(k => {
        expect(k.tur === 'ton' && (k.dalga || 'sine') === 'sine').toBe(true);
        expect(k.f[1] > k.f[0]).toBe(true);
        expect(k.d <= 0.1).toBe(true);
      }));
      ['tik', 'adim', 'hirr', 'sayfa'].forEach(ad => expect(S.SESLER[ad].some(k => k.tur === 'kece')).toBe(true));
      Object.keys(S.SESLER).forEach(ad => S.SESLER[ad].forEach(k => {
        expect(k.tur === 'ses').toBe(false);
        if(k.tur === 'ton' || k.tur === 'tel') expect((k.a || 0) >= 0.004).toBe(true);
      }));
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        kayit.saat += 3; kayit.nota.length = 0; kayit.gurultu.length = 0;
        expect(S.tik('tamam', true)).toBe(true);
        expect(kayit.gurultu.length).toBe(S.SESLER.tamam.length);
        expect(kayit.nota.length).toBe(0);
      });
    });

    it('çıkışta sıcak süzgeç: bütün sesler 2,2 kHz altında bir alçak geçirenden geçer', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        expect(S.tik('tik', true)).toBe(true);
        expect(kayit.filtre.some(f => f.type === 'lowpass' && f.f <= 2200)).toBe(true);
      });
    });

    /* Kullanıcı (2026-10-28): «hafif, uzaktan gelen yürüme sesleri». Adım
       sesi kısık ve boğuktur (uzaktaki yumuşak ayak); minik ekranın
       neresindeyse ses oradan gelir (stereo konum). */
    it('adım sesi: kısık, boğuk, odada; pan verilirse o yandan gelir', () => {
      const l = S.SESLER.adim;
      expect(Array.isArray(l)).toBe(true);
      expect(Math.max.apply(null, l.map(k => k.g)) <= 0.08).toBe(true);
      l.forEach(k => expect(Math.max(k.f[0], k.f[1] || 0) <= 700).toBe(true));
      expect(l.some(k => k.oda >= 0.2)).toBe(true);
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        kayit.saat += 5; kayit.panlar.length = 0;
        expect(S.tik('adim', true, { pan:-0.6 })).toBe(true);
        expect(kayit.panlar.length).toBe(1);
        expect(kayit.panlar[0].pan.value).toBe(-0.6);
        kayit.saat += 1; kayit.panlar.length = 0;
        S.tik('adim', true);
        expect(kayit.panlar.length).toBe(0);
      });
    });

    it('minik sesi: perde sesin tonunu taşır (her minik kendi tonunda)', () => {
      const { Baglam, kayit } = sahteBaglam();
      return ortamla({ AudioContext:Baglam, sentetik:true }, () => {
        S.tikAc(true);
        kayit.nota.length = 0;
        S.tik('bla');
        const alcak = kayit.nota[0].f0;
        kayit.saat += 1; kayit.nota.length = 0;
        S.tik('bla', true, { perde:1.4 });
        const ort = kayit.nota[0].f0 / alcak;
        expect(ort > 1.25 && ort < 1.55).toBe(true);
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
          /* aç sesi iki tel: iki tampon kaynağı, ikincisi sonra başlar (perde sırası veride). */
          kayit.gurultu.length = 0;
          tikla(d.querySelector('#tk-p'));
          expect(kayit.gurultu.length).toBe(2);
          expect(kayit.gurultu[1].t).toBeGreaterThan(kayit.gurultu[0].t);
          kayit.saat += 1; kayit.gurultu.length = 0;
          const c = d.querySelector('#tk-c');
          c.checked = true;
          c.dispatchEvent(new Event('change', { bubbles:true }));
          expect(kayit.gurultu.length).toBe(2);
        }finally{ d.remove(); }
      });
    });
  });
})();
