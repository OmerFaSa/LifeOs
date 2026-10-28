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
    it('her minik başka: huyu farklı', () => {
      expect(new Set(C.KISILER.map(k => k.huy)).size).toBe(C.KISILER.length);
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
     genişliği karar verir (az: masaüstü 2, tablet ve telefon 1). */
  describe('Minik · sayfadaki sayı', () => {
    it('tercih yoksa ekrana göre (az: masaüstü 2, öbürleri 1); 0–6 tercihi olduğu gibi; bozuk tercih yok sayılır', () => {
      expect(C.sayi(null, 400)).toBe(1);
      expect(C.sayi(null, 900)).toBe(1);
      expect(C.sayi(null, 1400)).toBe(2);
      expect(C.sayi('0', 1400)).toBe(0);
      expect(C.sayi('6', 400)).toBe(6);
      expect(C.sayi('4', 900)).toBe(4);
      expect(C.sayi('9', 1400)).toBe(2);
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
  describe('Minik · çeşitlilik', () => {
    it('on iki kişi: on iki ayrı süs; desen türlü; her huyun Türkçe adı var', () => {
      expect(new Set(C.KISILER.map(k => k.tip)).size).toBe(C.KISILER.length);
      C.KISILER.forEach(k => {
        expect(['yok', 'karin', 'cil'].indexOf(k.desen) >= 0).toBe(true);
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
})();
