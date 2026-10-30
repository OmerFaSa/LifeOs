/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/minik.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Minik — kartların üstünde yaşayan minikler.

   ===================== BU DOSYA TEK KAYNAKTIR =====================
   Kaynağı `brand/ortak/minik.test.js`; `tools/ortak.py --yay` ile üç
   arayüzün `src/tests/` klasörüne birebir kopyalanır.

   Kanıtladığı sözler: yalnız yeterince geniş ve ekrana yakın kartın üst
   kenarı zemindir; minik kenarın köşesine taşmaz; zıplama yalnız menzildeki
   başka bir kenara olur ve iki uçta da kenarın üstüne iner; test sayfasında
   (kabuk yokken) hiçbir şey kurulmaz. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const C = window.LIFEOS.MINIK;
  const gor = { ust:0, boy:800 };
  const sabit = v => () => v;

  describe('Minik · zemin seçimi', () => {
    it('dar kart zemin olmaz, geniş kartın üst kenarı olur', () => {
      const z = C.zeminler([{ sol:0, ust:100, genis:C.EN_AZ - 1 }, { sol:50, ust:300, genis:400 }]);
      expect(z.length).toBe(1);
      expect(z[0].y).toBe(300);
      expect(z[0].x1).toBe(50 + C.PAY);
      expect(z[0].x2).toBe(450 - C.PAY);
    });
    it('ekrandan çıkan kart zemin olarak kalır (minik kartıyla birlikte kayar, sıçrayıp gelmez)', () => {
      const z = C.zeminler([{ sol:0, ust:5000, genis:400 }]);
      expect(z.length).toBe(1);
    });
    it('yeni yer yalnız ekranda görünen kenarlardan seçilir', () => {
      const z = C.zeminler([{ sol:0, ust:5000, genis:400 }, { sol:0, ust:300, genis:400 }]);
      expect(C.gorunenler(z, gor).map(o => o.y)).toEqual([300]);
      expect(C.gorunenler([z[1]], gor).length).toBe(0);   // z[1]: 5000 px aşağıdaki
    });
    it('kenarlar yukarıdan aşağı sıralanır', () => {
      const z = C.zeminler([{ sol:0, ust:500, genis:300 }, { sol:0, ust:120, genis:300 }]);
      expect(z.map(o => o.y)).toEqual([120, 500]);
    });
  });

  describe('Minik · yürüyüş', () => {
    const z = { x1:100, x2:500, y:200 };
    it('adım kısadır: bir seferde en çok 110 px yürür', () => {
      [0, .3, .7, .99].forEach(r => expect(Math.abs(C.adim({ x1:0, x2:2000, y:0 }, 1000, sabit(r), 40) - 1000) <= 110).toBe(true));
    });
    it('durak kenarın içinde kalır (iki uçta da)', () => {
      [0, .25, .49, .5, .75, .99].forEach(r => {
        const x = C.adim(z, 120, sabit(r), 40);
        expect(x >= 120 && x <= 480).toBe(true);
        const y = C.adim(z, 470, sabit(r), 40);
        expect(y >= 120 && y <= 480).toBe(true);
      });
    });
    it('minikten dar kenarda ortada durur', () => {
      expect(C.adim({ x1:100, x2:120, y:0 }, 110, sabit(.3), 40)).toBe(110);
    });
  });

  describe('Minik · zıplama', () => {
    const a = { x1:0, x2:300, y:400 }, b = { x1:200, x2:600, y:250 }, uzak = { x1:2000, x2:2300, y:400 };
    it('yalnız menzildeki başka kenara zıplar', () => {
      const k = C.komsular([a, b, uzak], a, 150);
      expect(k).toEqual([b]);
    });
    it('uçuş kalkış kenarında başlar, iniş kenarında biter, tepe ikisinden yüksektir', () => {
      const kare = C.sicrama({ x:150, y:400 }, { x:350, y:250 });
      expect(kare[0].transform.indexOf('translate(150.0px,400.0px)') === 0).toBe(true);
      expect(kare[kare.length - 1].transform.indexOf('translate(350.0px,250.0px)') === 0).toBe(true);
      const tepe = kare.find(k => k.offset === .55).transform.match(/,(-?[\d.]+)px\)/)[1];
      expect(+tepe < 250).toBe(true);
      expect(kare[0].offset).toBe(0);
      expect(kare[kare.length - 1].offset).toBe(1);
    });
  });

  describe('Minik · göz, sohbet, kişilik', () => {
    it('göz imlece doğru bakar ama en çok 2,2 px kayar; uzaktaki imleci izlemez', () => {
      const y = C.gozYonu({ x:100, y:100 }, { x:300, y:100 });
      expect(y.x > 0 && y.x <= 2.2).toBe(true);
      expect(y.y).toBe(0);
      const s = C.gozYonu({ x:100, y:100 }, { x:100, y:40 });
      expect(s.y < 0 && s.y >= -2.2).toBe(true);
      expect(C.gozYonu({ x:0, y:0 }, { x:900, y:0 })).toBe(null);
    });
    it('sohbet eşi yalnız aynı kartta ve yakında olandır', () => {
      const k1 = {}, k2 = {};
      const a = { z:{ el:k1 }, x:100 }, b = { z:{ el:k1 }, x:300 }, c = { z:{ el:k2 }, x:120 }, d = { z:{ el:k1 }, x:900 };
      expect(C.sohbetEsi([a, b, c, d], a)).toBe(b);
      expect(C.sohbetEsi([a, c, d], a)).toBe(null);
    });
    it('her miniğin adı, Türkçe huy adı ve kendi ses tonu var (üstüne gelince adı görünür)', () => {
      expect(new Set(C.KISILER.map(k => k.ad)).size).toBe(C.KISILER.length);
      C.KISILER.forEach(k => {
        expect(typeof C.HUY_AD[k.huy]).toBe('string');
        expect(k.perde >= 0.7 && k.perde <= 1.4).toBe(true);
      });
      expect(new Set(C.KISILER.map(k => k.perde)).size >= 5).toBe(true);
    });
    it('her minik başka: takımının içinde huyu farklı', () => {
      C.TAKIMLAR.filter(t => t !== 'karma').forEach(t => {
        const l = C.KISILER.filter(k => (k.aile || 'sekil') === t);
        expect(new Set(l.map(k => k.huy)).size).toBe(l.length);
      });
    });
  });

  describe('Minik · sayfaya göre kadro', () => {
    it('kadro geniş: en az altı ayrı minik; biçim ve süs birlikte her birinde başka', () => {
      expect(C.KISILER.length >= 12).toBe(true);
      expect(new Set(C.KISILER.map(k => k.bicim + '/' + k.tip)).size).toBe(C.KISILER.length);
    });
    it('biçimler: yuvarlak, kare ve üçgen; gözlük yok (gözler kayınca yerinde kalıp bozuk görünüyordu)', () => {
      const b = new Set(C.KISILER.map(k => k.bicim));
      ['yuvarlak', 'kare', 'ucgen'].forEach(x => expect(b.has(x)).toBe(true));
      expect(C.KISILER.some(k => k.tip === 'gozluk')).toBe(false);
    });
    it('aynı sayfa hep aynı minikleri çağırır; sayfalar arasında kadro değişir', () => {
      const a1 = C.kadro('bugun:today', 3), a2 = C.kadro('bugun:today', 3);
      expect(a1).toEqual(a2);
      expect(new Set(a1).size).toBe(3);
      const farkli = ['calisma:solve', 'analiz:progress', 'ofis:office', 'menu:x'].some(k => C.kadro(k, 3).join() !== a1.join());
      expect(farkli).toBe(true);
    });
  });

  /* Kullanıcı (2026-10-28): «çok tıklarsak minikler kızsın; ruh hâlleri
     olsun: üzgün, mutlu, uykulu». Ruh hâli süstür: oturumda bellekte
     durur, hiçbir kayda bakmaz, hiçbir şey yazmaz. */
  describe('Minik · ruh hâli', () => {
    const SAAT = 14;   // öğleden sonra, gece değil
    it('arka arkaya çok dokunulursa kızar (4 sn içinde 5 dokunuş); kızgınken dokunmak homurdatır', () => {
      const r = C.yeniRuh(0);
      const olay = [0, 300, 600, 900].map(t => C.dokun(r, t));
      expect(olay.every(o => o === 'kalp')).toBe(true);
      expect(C.dokun(r, 1200)).toBe('kizdi');
      expect(C.ruh(r, 1300, SAAT, 'bilge')).toBe('kizgin');
      expect(C.dokun(r, 2000)).toBe('hirr');
    });
    it('ağır ağır sevmek kızdırmaz: 1,2 sn arayla on dokunuş hep kalp, minik mutlu', () => {
      const r = C.yeniRuh(0);
      for(let i = 0; i < 10; i++) expect(C.dokun(r, i * 1200)).toBe('kalp');
      expect(C.ruh(r, 11000, SAAT, 'bilge')).toBe('mutlu');
    });
    it('kızgınlık geçince küser (üzgün); tek dokunuş barıştırır ve mutlu eder', () => {
      const r = C.yeniRuh(0);
      [0, 200, 400, 600, 800].forEach(t => C.dokun(r, t));
      const sonra = 800 + C.RUH.KIZ + 1000;
      expect(C.ruh(r, sonra, SAAT, 'bilge')).toBe('uzgun');
      expect(C.dokun(r, sonra)).toBe('baristi');
      expect(C.ruh(r, sonra + 10, SAAT, 'bilge')).toBe('mutlu');
      expect(C.ruh(r, sonra + C.RUH.MUTLU + 10, SAAT, 'bilge')).toBe('');
    });
    it('gece herkes uykulu; uykucu öğleden sonra da; uzun süre dokunulmayan özler; neşeli kendiliğinden mutlu', () => {
      const r = C.yeniRuh(0);
      expect(C.ruh(r, 1000, 23, 'bilge')).toBe('uykulu');
      expect(C.ruh(r, 1000, 3, 'neseli')).toBe('uykulu');
      expect(C.ruh(r, 1000, 14, 'uykucu')).toBe('uykulu');
      expect(C.ruh(r, 1000, 10, 'uykucu')).toBe('');
      expect(C.ruh(r, 1000, 10, 'neseli')).toBe('mutlu');
      expect(C.ruh(r, C.RUH.OZLEM + 1, 10, 'bilge')).toBe('uzgun');
    });
    it('her ruh hâlinin Türkçe adı var (etikette huyun yerine görünür)', () => {
      ['mutlu', 'uzgun', 'uykulu', 'kizgin'].forEach(r => expect(typeof C.RUH_AD[r]).toBe('string'));
      expect(C.RUH_AD.uzgun).toBe('üzgün');
      expect(C.RUH_AD.kizgin).toBe('kızgın');
    });
  });

  /* Kullanıcı (2026-10-28): «bir sayfada görünebilecek sayıyı
     değiştirebilelim». Görünüm › Minikler: Yok, 1–6; seçilmemişse ekran
     genişliği karar verir. 2026-10-28 «kalabalık görünümü engelle»: her
     genişlikte 1 (manzara ve cam ön planda; Görünüm'den artırılır). */
  describe('Minik · sayfadaki sayı', () => {
    it('tercih yoksa her ekranda 1; 0–6 tercihi olduğu gibi; bozuk tercih yok sayılır', () => {
      expect(C.sayi(null, 400)).toBe(1);
      expect(C.sayi(null, 900)).toBe(1);
      expect(C.sayi(null, 1400)).toBe(1);
      expect(C.sayi('0', 1400)).toBe(0);
      expect(C.sayi('6', 400)).toBe(6);
      expect(C.sayi('4', 900)).toBe(4);
      expect(C.sayi('9', 1400)).toBe(1);
      expect(C.sayi('x', 400)).toBe(1);
      expect(C.EN_COK).toBe(6);
      expect(C.KISILER.length > C.EN_COK).toBe(true);   // sayfalar arasında kadro değişir
    });
    it('seçici: Yok ve 1–6; yalnız seçili olan basılı', () => {
      const d = document.createElement('div');
      d.innerHTML = C.seciciHtml(2);
      const b = [...d.querySelectorAll('[data-minik-sec]')];
      expect(b.map(x => x.getAttribute('data-minik-sec')).join()).toBe('0,1,2,3,4,5,6');
      expect(b[0].textContent).toBe('Yok');
      expect(b.filter(x => x.getAttribute('aria-pressed') === 'true').map(x => x.getAttribute('data-minik-sec')).join()).toBe('2');
      expect(d.firstElementChild.getAttribute('aria-label')).toBe('Minikler');
    });
    it('tercih modüller arasında taşınır', () => {
      expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(C.ANAHTAR) >= 0).toBe(true);
    });
  });

  /* Yürüyen minik hafif adım sesi çıkarır; ses miniğin ekrandaki yerinden gelir. */
  describe('Minik · adım sesi', () => {
    it('stereo konum: solda -0.8, ortada 0, sağda 0.8; taşanı sınırlar', () => {
      expect(C.yanSes(0, 1000)).toBe(-0.8);
      expect(C.yanSes(500, 1000)).toBe(0);
      expect(C.yanSes(1000, 1000)).toBe(0.8);
      expect(C.yanSes(-300, 1000)).toBe(-0.8);
      expect(C.yanSes(250, 1000)).toBe(-0.4);
    });
  });

  /* Kullanıcı (2026-10-28): «minik agentların çeşitliliğini ve kalitesini
     zirveye taşı, bütün detaylarıyla». Her kişinin kendi süsü (12 ayrı),
     deseni (karın, çil) var (kuyruk kullanıcının isteğiyle kalktı); huyu davranışını değiştirir. */
  /* 2026-10-30 (kullanıcı: «hâlâ çok amatör; kod yoğunluğu karman çorman»): gövdenin içi tek SVG çizim. */
  describe('Minik · çizim', () => {
    it('her kişi kendi çizimini alır; gradyan kimlikleri tekil; kulak ve ışın arkadaki çizimde', () => {
      const ids = new Set();
      C.KISILER.forEach(k => {
        const c = C.sanat(k);
        expect(c.deri.indexOf('<svg class="minik__sanat"') === 0).toBe(true);
        (c.deri.match(/id="([^"]+)"/g) || []).forEach(x => { expect(ids.has(x)).toBe(false); ids.add(x); });
        expect(/fill="var\(/.test(c.deri + c.sus)).toBe(false);                 // değişken yalnız style'da işler
      });
      ['Mırnav', 'Pati', 'Ayıcık', 'Tavşi', 'Işıl', 'Yeşilcik'].forEach(ad => expect(!!C.sanat(C.KISILER.find(k => k.ad === ad)).sus).toBe(true));
      expect(C.sanat(C.KISILER.find(k => k.ad === 'Pofuduk')).sus).toBe('');     // şekillerin süsü CSS'te kalır
      const d = document.createElement('div'); d.innerHTML = C.galeriHtml();
      expect(d.querySelectorAll('.minik[data-sanat] .minik__deri svg').length > 0).toBe(true);
    });
  });

  describe('Minik · çeşitlilik', () => {
    it('şekillerde her süs ayrı; desen türlü; her huyun Türkçe adı var', () => {
      const sekil = C.KISILER.filter(k => (k.aile || 'sekil') === 'sekil');
      expect(new Set(sekil.map(k => k.tip)).size).toBe(sekil.length);
      C.KISILER.forEach(k => {
        expect(['yok', 'karin', 'cil', 'kedi', 'kopek', 'ayi', 'tavsan', 'panda', 'penguen', 'tilki', 'kurbaga', 'baykus', 'damar', 'buz', 'parilti'].indexOf(k.desen) >= 0).toBe(true);
        expect(typeof C.HUY_AD[k.huy]).toBe('string');
      });
      ['karin', 'cil'].forEach(d => expect(C.KISILER.some(k => k.desen === d)).toBe(true));
    });
  });

  /* Kullanıcı (2026-10-28, SPİ Analiz görüntüsü): iki sıra kart arasında
     boşluk yokken minik alttaki kartın kenarına konup üstteki kartın içinde
     görünüyordu. Üstünde (miniğin boyu kadar) başka kart olan kenar zemin olmaz. */
  describe('Minik · sıkışık kenar', () => {
    it('hemen üstünde kart olan kenar zemin olmaz; arada boşluk varsa olur', () => {
      const sik = C.zeminler([{ sol:0, ust:100, alt:300, genis:400 }, { sol:0, ust:304, alt:500, genis:400 }]);
      expect(sik.map(z => z.y).join()).toBe('100');
      const bos = C.zeminler([{ sol:0, ust:100, alt:300, genis:400 }, { sol:0, ust:380, alt:500, genis:400 }]);
      expect(bos.length).toBe(2);
      const yanda = C.zeminler([{ sol:0, ust:100, alt:300, genis:300 }, { sol:420, ust:304, alt:500, genis:300 }]);
      expect(yanda.length).toBe(2);
    });

    /* Kullanıcı (2026-10-28, ekran görüntüsü): dar pencerede yapışık bölüm
       bandı (buzlu cam, z 29) ilk kartın 20 px üstünde; minik orada bandın
       arkasında kalıp başı ve adı kesiliyordu. Engel zemin olmaz ama
       altındaki kenarı sıkıştırır. */
    it('yapışık bant engeldir: kendisi zemin olmaz, hemen altındaki kenarı da kapatır', () => {
      const z = C.zeminler([{ sol:0, ust:80, alt:122, genis:600, engel:true }, { sol:0, ust:142, alt:400, genis:600 }, { sol:0, ust:460, alt:700, genis:600 }]);
      expect(z.map(x => x.y).join()).toBe('460');
    });
  });

  /* Kullanıcı (2026-10-28: «agent'ı basılı tutup sürükleyebilelim bir
     yere»): bırakınca minik, bırakıldığı noktanın ALTINDAKİ ilk kart
     kenarına düşer (yerçekimi); altında kenar yoksa en yakın kenara. */
  /* Kullanıcı (2026-10-28): «agentların kademeli küçülmesi» — boy ayarı. */
  describe('Minik · boy', () => {
    it('Küçük · Orta · Büyük: çarpan boya işler; tercih taşınır; bozuk değer yok sayılır', () => {
      const once = C.boy();
      try{
        expect(C.boyAyarla('buyuk')).toBe(true);
        expect(C.boy()).toBe('buyuk');
        expect(C.boyPx(40)).toBe(48);
        expect(C.boyAyarla('kucuk')).toBe(true);
        expect(C.boyPx(40)).toBe(33);
        expect(C.boyAyarla('dev')).toBe(false);
        const d = document.createElement('div'); d.innerHTML = C.boySeciciHtml();
        expect(d.querySelector('[data-minik-boy="kucuk"]').getAttribute('aria-pressed')).toBe('true');
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf('lifeos.minik.boy') >= 0).toBe(true);
        expect(C.ICERIK.indexOf('minik__isik') >= 0).toBe(true);
      }finally{ C.boyAyarla(once); }
    });
    it('gözler gövdedeki 2. ve 3. <i>: konum ve kaş kuralları nth-of-type ile yazıldı', () => {
      // Hata (2026-10-29): iç ışık <i> olarak gözlerden önce girdi; sol göz sağa
      // kaydı, sağ göz konumsuz kaldı, kravat ağzın yerinde «+» gibi göründü.
      const d = document.createElement('div'); d.innerHTML = C.ICERIK;
      const g = d.querySelectorAll('.minik__govde > i:nth-of-type(2), .minik__govde > i:nth-of-type(3)');
      expect(g.length).toBe(2);
      expect(g[0].className + ' ' + g[1].className).toBe('minik__goz minik__goz');
    });
  });

  describe('Minik · sürükle bırak', () => {
    const l = [{ x1:100, x2:500, y:200 }, { x1:100, x2:500, y:600 }, { x1:700, x2:1100, y:400 }];
    it('bırakılan noktanın altındaki ilk kenara iner, x kenarın içinde kalır', () => {
      const a = C.inisYeri(l, 300, 120);
      expect(a.z.y).toBe(200); expect(a.x).toBe(300);
      const b = C.inisYeri(l, 300, 350);
      expect(b.z.y).toBe(600);
      const c = C.inisYeri(l, 90, 150);
      expect(c.z.y).toBe(200); expect(c.x).toBe(100);
    });
    /* Kartlar arası 24 px: kendiliğinden gezerken zemin olmaz (56 px ister),
       ama elle bırakılan kartta 16 px yeter; dipdibe (4 px) yine olmaz. */
    it('elle bırakılan kartta 24 px boşluk yeter, 4 px yetmez', () => {
      const ust = { sol:0, ust:100, alt:300, genis:400, el:'a' }, alt24 = { sol:0, ust:324, alt:500, genis:400, el:'b' }, alt4 = { sol:0, ust:504, alt:700, genis:400, el:'c' };
      expect(C.zeminler([ust, alt24, alt4]).map(z => z.y).join()).toBe('100');
      const elle = new Set(['b', 'c']);
      expect(C.zeminler([ust, alt24, alt4], elle).map(z => z.y).join()).toBe('100,324');
    });
    it('altında kenar yoksa en yakın kenara; kenar yoksa iniş de yok', () => {
      const a = C.inisYeri(l, 1150, 900);
      expect(a.z.y).toBe(400); expect(a.x).toBe(1100);
      expect(C.inisYeri([], 10, 10)).toBe(null);
    });
  });

  /* Kullanıcı (2026-10-28): «radyo açarsak minikler dans etsin, hepsi chill,
     radyoya uysun». Radyo çalarken ritimle sallanır (kulaklık istenmedi, kalktı). */
  describe('Minik · radyo', () => {
    it('yalnız çalarken radyoda sayılır', () => {
      expect(C.radyoda({ hal:'caliyor' })).toBe(true);
      expect(C.radyoda({ hal:'baglaniyor' })).toBe(false);
      expect(C.radyoda({ hal:'durdu' })).toBe(false);
      expect(C.radyoda(null)).toBe(false);
    });
  });

  /* Kullanıcı (2026-10-28): «etrafta gezen agentların arasında ofis
     çalışanları da olsun». Modülün kendi Ofis kadrosu (R/SP/ESP.AGENTS)
     gezen minik olur: kravat ve baş harfli yaka kartı (Patron kırmızı
     kravatlı), etikette görevi. Sayfada iki ve daha çok minik varsa en az
     biri Ofis'ten. */
  describe('Minik · ofis çalışanları', () => {
    const AJAN = [{ id:'patron', name:'Patron', role:'Ofis şefi', initial:'P' },
      { id:'tyt', name:'Tuna', role:'TYT uzmanı', initial:'T' },
      { id:'polyglot', name:'Polyglot Mentor', short:'Polyglot', role:'Yabancı dil', initial:'Pg' }];
    it('her ajan bir minik olur: adı, görevi, baş harfi; Patron ayrı giyinir', () => {
      const o = C.ofisKisileri(AJAN);
      expect(o.length).toBe(3);
      o.forEach(k => { expect(k.ofis).toBe(true); expect(typeof k.rol).toBe('string'); expect(['yuvarlak', 'kare', 'ucgen'].indexOf(k.bicim) >= 0).toBe(true); });
      expect(o.map(k => k.ad).join()).toBe('Patron,Tuna,Polyglot');
      expect(o[0].tip).toBe('patron');
      expect(o[1].tip).toBe('yaka');
      expect(o[1].harf).toBe('T');
      expect(C.ofisKisileri(null).length).toBe(0);
    });
    /* İkinci istek (aynı gün): «sayısını azalt; dışarıda ofis çalışanları
       gezsin, diğerleri az olsun». Ofis varsa sayfadakilerin hepsi Ofis'ten;
       üç ve daha çok seçildiyse yalnız biri diğerlerinden. */
    it('kadroda Ofis varsa sayfadakiler Ofis çalışanı; üç ve daha çok minikte en çok biri diğerlerinden', () => {
      const havuz = C.KISILER.concat(C.ofisKisileri(AJAN));
      ['bugun:today', 'calisma:solve', 'analiz:progress', 'ofis:office', 'menu:x', 'a', 'b', 'c'].forEach(a => {
        const k = C.kadro(a, 3, havuz);
        expect(new Set(k).size).toBe(3);
        expect(k.filter(i => !havuz[i].ofis).length <= 1).toBe(true);
        expect(C.kadro(a, 2, havuz).every(i => havuz[i].ofis)).toBe(true);
        expect(C.kadro(a, 1, havuz).every(i => havuz[i].ofis)).toBe(true);
        expect(C.kadro(a, 3, havuz)).toEqual(k);
      });
      expect(C.kadro('bugun:today', 3)).toEqual(C.kadro('bugun:today', 3, C.KISILER));
    });
  });

  /* Kullanıcı (2026-10-28): «yürüme sesi, konuşma sesi gibi olayları
     ayarlardan ayarlayabilelim». Görünüm › Minik sesleri: adım, konuşma,
     gıdık ayrı ayrı; tercih bu kapıda durur, modüller arasında taşınır. */
  describe('Minik · ses ayarı', () => {
    it('varsayılan hepsi açık; biri kapanınca yalnız o susar; tercih kalıcı ve taşınır', () => {
      let eski = null; try{ eski = localStorage.getItem(C.SES_ANAHTAR); localStorage.removeItem(C.SES_ANAHTAR); }catch(e){}
      try{
        expect(C.sesAyar()).toEqual({ adim:true, konusma:true, gidik:true });
        C.sesAyarla('adim', false);
        expect(C.sesIzinli('adim')).toBe(false);
        expect(C.sesIzinli('bla')).toBe(true);
        expect(C.sesIzinli('gidik')).toBe(true);
        C.sesAyarla('konusma', false);
        expect(C.sesIzinli('bla')).toBe(false);
        expect(C.sesIzinli('hirr')).toBe(false);
        expect(JSON.parse(localStorage.getItem(C.SES_ANAHTAR)).adim).toBe(false);
        const d = document.createElement('div'); d.innerHTML = C.sesSeciciHtml();
        const b = [...d.querySelectorAll('[data-minik-ses]')];
        expect(b.map(x => x.getAttribute('data-minik-ses')).join()).toBe('adim,konusma,gidik');
        expect(b.map(x => x.getAttribute('aria-pressed')).join()).toBe('false,false,true');
        expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(C.SES_ANAHTAR) >= 0).toBe(true);
      } finally { try{ if(eski == null) localStorage.removeItem(C.SES_ANAHTAR); else localStorage.setItem(C.SES_ANAHTAR, eski); }catch(e){} }
    });
  });

  /* Kullanıcı (2026-10-28): «aralarındaki konuşmaları daha çeşitli yap».
     Sohbet artık rastgele tek kelime değil: soru–cevap senaryosu; Ofis
     çalışanlarının kendi işi, sabahın ve gecenin kendi lafı var. */
  describe('Minik · sohbet senaryoları', () => {
    it('senaryolar geniş ve kısa: her satır balona sığar; Ofis, sabah ve gece ayrı', () => {
      const D = C.DIYALOG;
      ['genel', 'ofis', 'sabah', 'gece'].forEach(k => {
        expect(D[k].length >= (k === 'genel' || k === 'ofis' ? 10 : 3)).toBe(true);
        D[k].forEach(sn => { expect(sn.length >= 2).toBe(true); sn.forEach(x => expect(x.length <= 18).toBe(true)); });
      });
      const sabit = v => () => v;
      expect(D.ofis.indexOf(C.diyalogSec(true, 14, sabit(.99))) >= 0 || D.genel.indexOf(C.diyalogSec(true, 14, sabit(.99))) >= 0).toBe(true);
      expect(D.ofis.indexOf(C.diyalogSec(true, 14, sabit(.1))) >= 0).toBe(true);
      expect(D.sabah.indexOf(C.diyalogSec(false, 8, sabit(.1))) >= 0).toBe(true);
      expect(D.gece.indexOf(C.diyalogSec(false, 23, sabit(.1))) >= 0).toBe(true);
      expect(D.genel.indexOf(C.diyalogSec(false, 14, sabit(.1))) >= 0).toBe(true);
    });
  });

  /* Ofis çalışanları gezerken arada elinde bir şey taşır (kahve, not, grafik). */
  describe('Minik · eşya', () => {
    it('yalnız Ofis çalışanı eşya taşır; eşya bilinen türlerden', () => {
      expect(C.esyaSec({ ofis:false }, () => 0)).toBe('');
      ['kahve', 'not', 'grafik'].forEach((e, i) => expect(C.esyaSec({ ofis:true }, () => i / 3 + .01)).toBe(e));
      expect(C.ESYALAR.indexOf('buyutec') >= 0 && C.ESYALAR.indexOf('ampul') >= 0).toBe(true);
    });
  });

  describe('Minik · kurulum', () => {
    it('kabuk yokken (test sayfası) katman kurulmaz', () => {
      C.kur();
      expect(document.querySelector('.minikkat')).toBe(null);
    });
  });
  /* Kullanıcı (2026-10-29): «mini ajanların hangilerinin olacağını görüp seçip
     çıkartıp ekleyebilelim; ajan çeşitliliğini arttır». */
  describe('Minik · kadro seçimi', () => {
    function ile(fn){
      let eski = null;
      try{ eski = localStorage.getItem(C.KADRO_ANAHTAR); }catch(e){}
      const eskiTakim = localStorage.getItem(C.TAKIM_ANAHTAR);
      try{ localStorage.removeItem(C.KADRO_ANAHTAR); localStorage.removeItem(C.TAKIM_ANAHTAR); return fn(); }
      finally{
        try{ if(eski == null) localStorage.removeItem(C.KADRO_ANAHTAR); else localStorage.setItem(C.KADRO_ANAHTAR, eski); }catch(e){}
        try{ if(eskiTakim == null) localStorage.removeItem(C.TAKIM_ANAHTAR); else localStorage.setItem(C.TAKIM_ANAHTAR, eskiTakim); }catch(e){}
      }
    }
    const SEKIL = () => C.KISILER.filter(k => (k.aile || 'sekil') === 'sekil').length;
    const AJ = [{ id:'patron', name:'Patron' }, { id:'a', name:'Asistan' }];
    it('kadro üç takım: on altı şekil, dokuz hayvan, sekiz emoji; hepsi kendi süsü ve huyuyla', () => {
      const say = t => C.KISILER.filter(k => (k.aile || 'sekil') === t).length;
      expect([say('sekil'), say('hayvan'), say('emoji')]).toEqual([16, 9, 8]);
      C.KISILER.filter(k => k.aile).forEach(k => expect(k.renk.length).toBe(3));   // hayvan ve emojinin rengi kendinin
      ['Bereli', 'Hilal', 'Alev', 'Pamuk', 'Sevgi', 'Damla'].forEach(ad => expect(C.KISILER.some(k => k.ad === ad)).toBe(true));
      C.KISILER.forEach(k => expect(typeof C.HUY_NOT[k.huy]).toBe('string'));
    });
    it('varsayılan herkes açık; kapatılan havuzdan çıkar, ofis hepsini birden çıkarır', () => ile(() => {
      expect(C.havuzKur(AJ).length).toBe(SEKIL() + 2);
      C.kadroAyarla('Pofuduk', false);
      expect(C.havuzKur(AJ).some(k => k.ad === 'Pofuduk')).toBe(false);
      C.kadroAyarla('ofis', false);
      expect(C.havuzKur(AJ).some(k => k.ofis)).toBe(false);
      expect(C.havuzKur(AJ).length).toBe(SEKIL() - 1);
      C.kadroAyarla('Pofuduk', true);
      expect(Array.from(C.kapalilar())).toEqual(['ofis']);
    }));
    it('yeni eklenen minik kendiliğinden açık gelir: tercih yalnız kapatılanların adıdır', () => ile(() => {
      localStorage.setItem(C.KADRO_ANAHTAR, JSON.stringify(['Bıcır', 'Eski bir minik']));
      const h = C.havuzKur([]);
      expect(h.some(k => k.ad === 'Damla')).toBe(true);
      expect(h.some(k => k.ad === 'Bıcır')).toBe(false);
      localStorage.setItem(C.KADRO_ANAHTAR, '{bozuk');
      expect(C.havuzKur([]).length).toBe(SEKIL());
    }));
    /* 2026-10-30 (kullanıcı: «şekil mi, hayvan mı, emoji mi seçeceğiz; istersek karma»). */
    it('takım: varsayılan şekiller; hayvan ve emoji kendi kadrosunu çağırır; karma hepsini; galeri seçili takımı gösterir', () => ile(() => {
      expect(C.takim()).toBe('sekil');
      expect(C.havuzKur([]).every(k => !k.aile)).toBe(true);
      expect(C.takimAyarla('hayvan')).toBe(true);
      expect(C.havuzKur([]).every(k => k.aile === 'hayvan')).toBe(true);
      expect(localStorage.getItem(C.TAKIM_ANAHTAR)).toBe('hayvan');
      const d = document.createElement('div'); d.innerHTML = C.galeriHtml(); document.body.appendChild(d);
      try{
        expect(d.querySelector('[data-minik-takim="hayvan"]').getAttribute('aria-pressed')).toBe('true');
        expect(!!d.querySelector('[data-minik-kadro="Mırnav"]') && !d.querySelector('[data-minik-kadro="Pofuduk"]')).toBe(true);
        expect(d.querySelector('[data-minik-kadro="Mırnav"] .minik').getAttribute('style')).toContain('--g2:#ffb067');
        d.querySelector('[data-minik-takim="emoji"]').click();         // galeri yerinde yenilenir
        expect(!!document.querySelector('[data-minik-kadro="Çıtır"]')).toBe(true);
        expect(C.havuzKur([]).every(k => k.aile === 'emoji')).toBe(true);
      }finally{ d.remove(); }
      C.takimAyarla('karma');
      expect(C.havuzKur([]).length).toBe(C.KISILER.length);
      expect(C.takimAyarla('bilinmez')).toBe(false);
      C.takimAyarla('sekil');
      expect(localStorage.getItem(C.TAKIM_ANAHTAR)).toBe(null);
      expect(window.LIFEOS.ANIMASYON.TASINAN.indexOf(C.TAKIM_ANAHTAR) >= 0).toBe(true);
    }));
    it('galeri: her kişi bir kart (canlı minik, ad, huy); basınca kapanır, yeniden basınca açılır', () => ile(() => {
      const d = document.createElement('div'); d.innerHTML = C.galeriHtml(); document.body.appendChild(d);
      try{
        const kartlar = Array.from(d.querySelectorAll('[data-minik-kadro]'));
        expect(kartlar.filter(b => b.getAttribute('data-minik-kadro') !== 'ofis').length).toBe(SEKIL());
        kartlar.forEach(b => expect(!!b.querySelector('.minikgal__sahne .minik .minik__govde')).toBe(true));
        const b = d.querySelector('[data-minik-kadro="Hilal"]');
        expect(b.getAttribute('aria-pressed')).toBe('true');
        b.click();
        expect(b.getAttribute('aria-pressed')).toBe('false');
        expect(C.kapalilar().has('Hilal')).toBe(true);
        b.click();
        expect(C.kapalilar().has('Hilal')).toBe(false);
      }finally{ d.remove(); }
    }));
  });
})();
