/* Boş ve bozuk durum (katalog 010 ve 011, EKIP-PLANI T3).

   Kanıtladığı sözler: veri yoksa küçük bir çizim, tek cümle ve en çok tek
   eylem görünür (010). Bir ekran çizilemezse kırmızı yoktur; İLK cümle
   verinin yerinde olduğunu söyler; tek düğme vardır ve sayfayı yeniden
   yükler; teknik ileti silinmez, «Teknik ayrıntı»nın altına iner (011). */

(function(){
  const { describe, it, expect } = SP.Test;

  function coz(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    return d;
  }

  describe('Boş durum sahnesi (010)', () => {
    it('çizim, tek cümle, tek eylem', () => {
      const d = coz(SP.C.Empty({ text:'Henüz kayıt yok.',
        action:SP.C.Button({ label:'İlk kaydı ekle', size:'sm', act:'go' }) }));
      const k = d.querySelector('[data-oz="010"]');
      expect(!!k).toBe(true);
      expect(!!k.querySelector('svg')).toBe(true);
      expect(k.querySelectorAll('p').length).toBe(1);
      expect(k.querySelectorAll('button').length).toBe(1);
    });
  });

  describe('Sakin hata (011)', () => {
    it('ekran hatası: kırmızı yok, ilk cümle veri, tek düğme', () => {
      const d = coz(SP.App.errorPanel(new Error('x is undefined')));
      const k = d.querySelector('[data-oz="011"]');
      expect(!!k).toBe(true);
      expect(d.querySelectorAll('[class*="danger"]').length).toBe(0);
      expect(k.querySelector('.kutu__govde p').textContent).toContain('Verin yerinde');
      const b = d.querySelectorAll('button');
      expect(b.length).toBe(1);
      expect(b[0].getAttribute('data-act')).toBe('reload');
    });

    it('teknik ileti silinmez, kapalı ayrıntıya iner', () => {
      const d = coz(SP.App.errorPanel(new Error('<b>x</b> is undefined')));
      const kod = d.querySelector('details .sakinhata__kod');
      expect(kod.textContent).toBe('<b>x</b> is undefined');
      expect(d.querySelector('details').open).toBe(false);
      /* İleti yoksa ayrıntı katmanı da yok. */
      expect(coz(SP.C.SakinHata({})).querySelectorAll('details').length).toBe(0);
    });
  });
})();
