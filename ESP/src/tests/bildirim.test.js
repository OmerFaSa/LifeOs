/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/bildirim.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Telefon bildirimi istemcisi (brand/ortak/bildirim.js). Kanıtlanan:
   köprü yoksa hiçbir şey yapılmaz; liste temizlenir (geçmiş, yinelenen,
   eksik atılır; en yakın SINIR kadarı gider); istek numarasıyla giden
   mesajın cevabı kendi sözüne döner; izin durumu hatırlanır; kabuğun
   hatası «ok:false» olur; uygulamada açılışta ve öne gelişte gelmiş
   bildirimler kaldırılır, Badging API köprüye bağlanır (söz 5, 6).
   Gerçek kabuk uygulama/ios'ta CI'da sınanır. */

(function(){
  const T = (window.R || window.SP || window.ESP).Test;
  const { describe, it, expect } = T;
  const B = () => window.LIFEOS.BILDIRIM;

  /* Sahte kabuk: gelen mesajı kaydeder, cevabı bir sonraki turda verir. */
  function sahteKabuk(cevapla){
    const giden = [];
    const eski = window.webkit;
    window.webkit = { messageHandlers:{ lifeosBildirim:{ postMessage(m){
      giden.push(JSON.parse(JSON.stringify(m)));
      setTimeout(() => B()._cevap(m.istek, cevapla(m)), 0);
    } } } };
    return { giden, birak(){ if(eski === undefined) delete window.webkit; else window.webkit = eski; } };
  }

  describe('Bildirim — telefon kabuğu köprüsü', () => {
    it('köprü yoksa yok sayılır: var() false, kur hiçbir şey yollamaz', async () => {
      const eski = window.webkit;
      delete window.webkit;
      try{
        expect(B().var()).toBe(false);
        const r = await B().kur('spi', [{ anahtar:'a', baslik:'x', zaman:Date.now() + 60000 }]);
        expect(r.ok).toBe(false);
        expect(await B().durum()).toBe(null);
      }finally{ if(eski !== undefined) window.webkit = eski; }
    });

    it('liste temizlenir: geçmiş, yinelenen ve eksik atılır; en yakın önce; modül sınırı', () => {
      const n = 1700000000000;
      const l = B().temizle('esp', [
        { anahtar:'b', baslik:'İki', zaman:n + 120000 },
        { anahtar:'a', baslik:'Bir', govde:'g', zaman:n + 60000 },
        { anahtar:'a', baslik:'Bir yine', zaman:n + 90000 },
        { anahtar:'gecmis', baslik:'x', zaman:n - 1 },
        { anahtar:'', baslik:'x', zaman:n + 5 },
        { anahtar:'c', zaman:n + 5 },
        { anahtar:'d', baslik:'x', zaman:'yarın' },
      ], n);
      expect(l.map(x => x.anahtar)).toEqual(['a', 'b']);
      expect(l[0]).toEqual({ anahtar:'a', baslik:'Bir', govde:'g', zaman:n + 60000 });
      const cok = Array.from({ length:50 }, (_, i) => ({ anahtar:'k' + i, baslik:'x', zaman:n + (50 - i) * 1000 }));
      const k = B().temizle('esp', cok, n);
      expect(k.length).toBe(B().SINIR.esp);
      expect(k[0].anahtar).toBe('k49');                                    // en yakın önce
      expect(B().SINIR.spi + B().SINIR.esp + B().SINIR.ays <= 64).toBe(true);
    });

    it('istek numarasıyla gider, cevap kendi sözüne döner; izin hatırlanır; kabuk hatası ok:false', async () => {
      const k = sahteKabuk(m => (m.tur === 'durum' || m.tur === 'izin' ? { durum:'izin' }
        : m.tur === 'kur' ? { kurulan:m.liste.length } : { hata:'bilinmeyen istek' }));
      try{
        expect(B().var()).toBe(true);
        const [d, i] = await Promise.all([B().durum(), B().izin()]);
        expect([d, i]).toEqual(['izin', 'izin']);
        expect(B().sonDurum()).toBe('izin');
        expect(k.giden[0].istek !== k.giden[1].istek).toBe(true);
        const r = await B().kur('spi', [{ anahtar:'s', baslik:'SPİ · 08:00', govde:'Su', zaman:Date.now() + 3600000 },
          { anahtar:'eski', baslik:'x', zaman:Date.now() - 1000 }]);
        expect([r.ok, r.kurulan]).toEqual([true, 1]);
        expect(k.giden[2]).toEqual({ tur:'kur', modul:'spi', istek:k.giden[2].istek,
          liste:[{ anahtar:'s', baslik:'SPİ · 08:00', govde:'Su', zaman:k.giden[2].liste[0].zaman }] });
      }finally{ k.birak(); }
      const h = sahteKabuk(() => ({ hata:'izin yok' }));
      try{
        const r = await B().kur('spi', []);
        expect(r.ok).toBe(false);
        expect(r.why).toBe('izin yok');
      }finally{ h.birak(); }
    });

    it('uygulamada: açılışta ve öne gelişte gelmişler kalkar; rozet Badging API ile köprüye gider', async () => {
      const k = sahteKabuk(m => (m.tur === 'kaldir' ? { kaldirilan:2 } : m.tur === 'rozet' ? { toplam:m.sayi + 1 } : {}));
      try{
        const doc = new EventTarget();
        doc.hidden = false;
        const nav = {};
        expect(B()._kurulum(doc, nav)).toBe(true);
        expect(k.giden[k.giden.length - 1].tur).toBe('kaldir');
        expect(k.giden[k.giden.length - 1].anahtarlar).toBeUndefined();          // bu modülün hepsi
        const once = k.giden.length;
        doc.hidden = true;
        doc.dispatchEvent(new Event('visibilitychange'));                      // arka plana: dokunulmaz
        expect(k.giden.length).toBe(once);
        doc.hidden = false;
        doc.dispatchEvent(new Event('visibilitychange'));                      // öne geldi: yine temizlik
        expect(k.giden[k.giden.length - 1].tur).toBe('kaldir');
        await nav.setAppBadge(3);
        expect(k.giden[k.giden.length - 1]).toEqual({ tur:'rozet', sayi:3, istek:k.giden[k.giden.length - 1].istek });
        await nav.clearAppBadge();
        expect(k.giden[k.giden.length - 1].sayi).toBe(0);
        /* Gezginin kendi setAppBadge'i olsa da köprü bağlanır (simge kabuğun). */
        const yerel = { setAppBadge(){ return Promise.resolve('yerel'); } };
        B()._kurulum(new EventTarget(), yerel);
        await yerel.setAppBadge(5);
        expect(k.giden[k.giden.length - 1].sayi).toBe(5);
        const r = await B().kaldir(['a', '', 7, 'b']);
        expect(r).toEqual({ ok:true, kaldirilan:2 });
        expect(k.giden[k.giden.length - 1].anahtarlar).toEqual(['a', 'b']);
        expect((await B().rozet(-4)).toplam).toBe(1);                           // eksi sayı 0 gider
      }finally{ k.birak(); }
      const eski = window.webkit;
      delete window.webkit;
      try{
        expect(B()._kurulum(new EventTarget(), {})).toBe(false);               // tarayıcıda hiçbir şey
        expect((await B().kaldir()).ok).toBe(false);
      }finally{ if(eski !== undefined) window.webkit = eski; }
    });

    it('bir günün saati yerel saatle ms olur', () => {
      expect(B().anOf('2026-10-09', '08:30')).toBe(new Date(2026, 9, 9, 8, 30).getTime());
    });
  });
})();
