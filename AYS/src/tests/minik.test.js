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
    it('her minik başka: huyu farklı', () => {
      expect(new Set(C.KISILER.map(k => k.huy)).size).toBe(C.KISILER.length);
    });
  });

  describe('Minik · sayfaya göre kadro', () => {
    it('kadro geniş: en az altı ayrı minik; biçim ve süs birlikte her birinde başka', () => {
      expect(C.KISILER.length >= 6).toBe(true);
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

  describe('Minik · kurulum', () => {
    it('kabuk yokken (test sayfası) katman kurulmaz', () => {
      C.kur();
      expect(document.querySelector('.minikkat')).toBe(null);
    });
  });
})();
