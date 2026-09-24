/* Bugün — üç alan (katalog 03, ekip/EKIP-PLANI.md §3; T-DEVIR §2.A-4).

   Kanıtladığı sözler: Bugün sekme taşımaz; Şimdi · Durum · (Öneri)
   alanlarından oluşur ve görünen düğme 14'ü aşmaz; sıkça yazılan dört
   ölçüm Bugün'de yazılır ve yalnız yazılanı değiştirir; geri kalan her
   kart «Bugün › Ayrıntı»dadır ve aynı şey iki yerde durmaz. */

(function(){
  const { describe, it, expect, resetState, pushVitals, pushMeal, withTodayAsync } = SP.Test;
  const GUN = '2026-03-10';

  function yerlestir(h){
    const d = document.createElement('div');
    d.innerHTML = String(h);
    document.body.appendChild(d);
    return d;
  }
  function dolu(){
    resetState();
    pushVitals('2026-03-09', { sleep:6.5, rhr:60, hrv:48, weight:78.2 });
    pushVitals(GUN, { sleep:7, rhr:58, hrv:52, soreness:4, water:2100, weight:78 });
    pushMeal(GUN, 'kahvalti', [['yumurta', 110], ['beyaz-peynir', 40]]);
  }

  describe('Bugün (SPİ) — üç alan', () => {
    it('oz-003 sekme yok; Şimdi ve Durum alanları; düğme 14\'ü aşmaz', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
          const alanlar = Array.from(d.querySelectorAll('.bugun__alan')).map(x => x.getAttribute('aria-label'));
          expect(alanlar.indexOf('Şimdi') >= 0).toBe(true);
          expect(alanlar.indexOf('Durum') >= 0).toBe(true);
          expect(d.querySelectorAll('button').length <= 14).toBe(true);
          /* Tek dolu düğme: günün ölçümünü kaydetmek. */
          expect(d.querySelectorAll('.btn--primary').length).toBe(1);
        }finally{ d.remove(); }
      });
    });

    it('dört ölçüm Bugün\'de yazılır; kaydetmek yalnız yazılanı değiştirir', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        const d = yerlestir(await SP.Screens.today.render());
        try{
          ['sleep', 'rhr', 'hrv', 'weight'].forEach(k => expect(!!d.querySelector('#v-' + k)).toBe(true));
          expect(!!d.querySelector('#v-temp')).toBe(false);
          d.querySelector('#v-sleep').value = '8';
          const toast = SP.UI.toast;
          SP.UI.toast = () => {};
          try{ await SP.Screens.today.handle['save-vitals'](); }
          finally{ SP.UI.toast = toast; }
          const v = SP.Model.vitalsOf(GUN);
          expect(v.sleep).toBe(8);
          /* Bugün'de alanı olmayan ölçümler silinmez. */
          expect([v.water, v.soreness]).toEqual([2100, 4]);
        }finally{ d.remove(); }
      });
    });

    it('Bugün › Ayrıntı: sekme yok; form, şikâyet, geçmiş ve özet orada', async () => {
      dolu();
      await withTodayAsync(GUN, async () => {
        expect(SP.App.yolOf('gun').join(' › ')).toBe('Bugün › Ayrıntı');
        const d = yerlestir(await SP.Screens.gun.render());
        try{
          expect(d.querySelectorAll('[role="tab"], .subtabs').length).toBe(0);
          ['save-vitals', 'cycle-symptom', 'open-day', 'no-symptoms'].forEach(a =>
            expect(!!d.querySelector('[data-act="' + a + '"]')).toBe(true));
          const b = Array.from(d.querySelectorAll('.sayfabolum h2')).map(x => x.textContent.trim());
          expect(b.join(',')).toBe('Giriş,Özet,Geçmiş');
          /* Eski sekme eylemi bölüm çubuğunda kalır. */
          expect(!!d.querySelector('.bolumcubugu [data-act="day-tab"][data-tab="gecmis"]')).toBe(true);
          /* Aynı şey iki yerde durmaz: hızlı öğün Bugün'de, Ayrıntı'da değil. */
          expect(!!d.querySelector('#quick-meal')).toBe(false);
          expect(typeof SP.Screens.gun.handle['save-vitals']).toBe('function');
        }finally{ d.remove(); }
      });
    });

    it('en acil tek uyarı Bugün\'de, fazlası Ayrıntı\'da', async () => {
      dolu();
      SP.S.flags = [
        { id:'f1', label:'Birinci bayrak', detail:'a', at:GUN, ack:false },
        { id:'f2', label:'İkinci bayrak', detail:'b', at:GUN, ack:false },
      ];
      const eski = SP.Model.openFlags;
      SP.Model.openFlags = () => SP.S.flags;
      try{
        /* Bayrak KARTI sayılır: Ofis'in notu bayrağın adını anabilir. */
        const kartlar = d => Array.from(d.querySelectorAll('.flagcard__title')).map(x => x.textContent.trim());
        await withTodayAsync(GUN, async () => {
          const b = yerlestir(await SP.Screens.today.render());
          const a = yerlestir(await SP.Screens.gun.render());
          try{
            expect(kartlar(b)).toEqual(['Birinci bayrak']);
            expect(kartlar(a)).toEqual(['İkinci bayrak']);
          }finally{ b.remove(); a.remove(); }
        });
      }finally{ SP.Model.openFlags = eski; SP.S.flags = []; }
    });
  });
})();
