/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/pusula.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* Pusula — Kolay LifeOS planının iki sayısı. Tek kaynak
   `brand/ortak/pusula.test.js`. Kanıtlanan sözler (brand/ortak/pusula.js):
     1. Sayı ölçülür: ölçüm yoksa «veri yok», sıfır değil.
     P2 paydası ilk etkinlikten bu yana; bugün girilmediyse sayılmaz.
     2. Hedef yanında yazılır. */

(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const P = () => window.LIFEOS.PUSULA;
  const SIMDI = new Date(2026, 9, 16, 20, 0);

  function sahne(o, fn){
    const eski = P()._ayar(), eskiSimdi = P()._ortam.simdi;
    P()._ortam.simdi = () => new Date(SIMDI);
    P().kur(o);
    try{ return fn(); }
    finally{ P()._ortam.simdi = eskiSimdi; if(eski) P().kur(eski); else P()._sifirla(); }
  }

  describe('Pusula', () => {
    /* Faz 0 bulgusu (2026-10-16): kullanım kaydı olmayan gün «0 dk ölçüldü»
       sayılıyordu (sürtünme ölçeri kaydı olan her günü ölçülmüş sayar). */
    it('P1 yalnız kullanım kaydı olan günlerden: kayıtsız gün 0 dk sayılmaz', () => sahne({ modul:'x',
      kullanim:() => ({ '2026-10-16':{ adminMs:120000 }, '2026-10-01':{ adminMs:999999 } }),
      girildi:() => true, ilkGun:() => '2026-10-10' }, () => {
      const o = P().olc();
      expect(o.p1).toEqual({ dk:2, gun:1 });          // 1 Ekim pencere dışında; öteki günler kayıtsız
    }));

    it('ölçüm yoksa «veri yok», sıfır değil', () => sahne({ modul:'x', kullanim:() => ({}),
      girildi:() => false, ilkGun:() => null }, () => {
      const o = P().olc();
      expect(o.p1).toBe(null);
      expect(o.p2).toBe(null);
      expect(P().satirHtml()).toContain('veri yok');
    }));

    it('P2 paydası ilk etkinlikten bu yana; bugün girilmediyse paydaya katılmaz', () => sahne({ modul:'x',
      kullanim:() => ({ '2026-10-12':{ adminMs:240000 }, '2026-10-13':{ adminMs:300000 }, '2026-10-15':{ adminMs:180000 } }),
      girildi:t => ['2026-10-12', '2026-10-13', '2026-10-15'].indexOf(t) >= 0, ilkGun:() => '2026-10-12' }, () => {
      const o = P().olc();
      expect(o.p1).toEqual({ dk:4, gun:3 });          // (4 + 5 + 3) / 3 gün
      expect(o.p2.gun).toBe(4);           // 12–15 Ekim; bugün (16) girilmedi, sayılmaz
      expect(o.p2.girilen).toBe(3);
      expect(Math.round(o.p2.oran * 100)).toBe(75);
    }));

    it('hedef satırda yazılı; pencere 14 günle sınırlı', () => sahne({ modul:'x',
      kullanim:() => ({}), girildi:() => true, ilkGun:() => '2026-01-01' }, () => {
      const o = P().olc();
      expect(o.p2.gun).toBe(14);
      const h = P().satirHtml();
      expect(h).toContain('hedef ≤ 2 dk');
      expect(h).toContain('hedef ≥ %90');
    }));
  });
})();
