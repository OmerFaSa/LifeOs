/* V5 düzen — SPİ (kullanıcı, 2026-09-25: «kaos içinde bir düzeni yok …
   ne olduğu anlaşılmıyor»).

   Kanıtladığı sözler: Analiz › Kendi bağını kur'da grafik açıklaması
   çizilir, ham HTML metni olarak ekrana basılmaz; Hareket › Günün yük
   emri toparlanma cümlesini bir kez yazar (göstergenin yanında), bir de
   uyarı kutusunda tekrar etmez; Bütçe bölümünde sayfa başının cümlesini
   tekrarlayan ikinci başlık yoktur. */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, pushVitals } = SP.Test;

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }
  const kutu = (d, ad) => Array.from(d.querySelectorAll('.lrow, .card'))
    .find(k => { const e = k.querySelector('.lrow__label, .card__title'); return e && e.textContent.trim().indexOf(ad) === 0; });

  describe('V5 düzen — SPİ', () => {
    it('Analiz › Kendi bağını kur: grafik açıklaması öğe olarak çizilir, ham HTML yazmaz', async () => {
      resetState();
      const pf = SP.Calc.pairsFor, co = SP.Calc.correlate;
      SP.Calc.pairsFor = () => Array.from({ length:12 }, (_, i) => [6 + i % 3, 60 + i]);
      SP.Calc.correlate = () => ({ ok:true, r:0.4, n:12, strength:0.4 });
      let d;
      try{
        d = yerlestir(await SP.Screens.analytics.render());
        const k = kutu(d, 'Kendi bağını kur');
        expect(k).toBeTruthy();
        expect(k.querySelector('.legend .legend__item')).toBeTruthy();
        expect(k.textContent.indexOf('class="legend"') < 0).toBe(true);
        expect(k.textContent.indexOf('<span') < 0).toBe(true);
      }finally{
        SP.Calc.pairsFor = pf; SP.Calc.correlate = co;
        if(d) d.remove();
      }
    });

    it('Hareket › Günün yük emri: toparlanma cümlesi bir kez yazılır', async () => {
      resetState();
      await withTodayAsync('2026-03-01', async () => {
        pushVitals('2026-03-01', { sleep:8 });
        const rx = SP.Move.prescription();
        expect(rx.readiness.ok).toBeTruthy();
        const d = yerlestir(await SP.Screens.move.render());
        try{
          const k = kutu(d, 'Günün yük emri');
          const cumle = rx.readiness.band.order;
          const kez = k.textContent.split(cumle).length - 1;
          expect(kez).toBe(1);
          /* başka bir gerekçe (ör. ince ölçüm) varsa o yine yazılır */
          rx.reasons.filter(x => x.id !== 'readiness').forEach(x => expect(k.textContent).toContain(x.text));
        }finally{ d.remove(); }
      });
    });

    it('Bütçe: sayfa başının cümlesini tekrarlayan ikinci başlık yok', async () => {
      resetState();
      const d = yerlestir(await SP.Screens.basket.render());
      try{
        expect(d.querySelector('.sect__h')).toBeNull();
        expect(d.textContent.indexOf('Bütçe diğer koçların talebinden çıkar') < 0).toBe(true);
        /* Talep tablosu yerinde */
        expect(d.textContent).toContain('Talep tablosu');
      }finally{ d.remove(); }
    });
  });
})();
