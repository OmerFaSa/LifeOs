/* Veli / koç raporu (DEVIR Y10, core/haftarapor.js): yazdırılabilir tek
   sayfa. Sayı calc.js'ten gelir; ölçülmemiş satır «veri yok», sıfır değil;
   sayfa belge/sonuç iddiası taşımaz (AGENTS §1.2, §1.5). */

(function(){
  const { describe, it, expect, resetState, withTodayAsync, examWithNet } = R.Test;

  async function hazirla(){
    resetState();
    await R.Model.ensureWeek(R.Model.currentWeek());
    await R.Model.ensureDay(R.U.today());
  }

  describe('Veli / koç raporu (Y10)', () => {

    it('boş haftada sayı uydurulmaz: deneme medyanı ve kayıtlı gün «veri yok»', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const v = R.HaftaRapor.veri();
        const bul = ad => v.satirlar.find(s => s.ad.indexOf(ad) === 0);
        expect(bul('TYT medyanı').kes).toBe('missing');
        expect(bul('TYT medyanı').deger).toBe('—');
        expect(bul('Kayıt girilen gün').kes).toBe('missing');
        v.satirlar.forEach(s => expect(s.ad + ':' + (s.deger === '0' && s.kes === 'missing')).toBe(s.ad + ':false'));
        expect(v.denemeler.length).toBe(0);
      });
    });

    it('haftanın denemesi ölçülen netiyle; medyan hesaplandı etiketli ve calc ile aynı', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const gunler = R.Model.weekDates(R.Model.currentWeek()).map(d => R.U.iso(d));
        R.S.exams.push(examWithNet(gunler[0], 40, 'TYT'), examWithNet('2026-09-01', 44, 'TYT'),
          examWithNet('2026-09-08', 46, 'TYT'));
        const v = R.HaftaRapor.veri();
        expect(v.denemeler.length).toBe(1);
        expect(v.denemeler[0].net).toBe(R.U.fmtNet(40));
        const m = v.satirlar.find(s => s.ad.indexOf('TYT medyanı') === 0);
        expect(m.kes).toBe('derived');
        expect(m.deger).toBe(R.U.fmtNet(R.Calc.medianTrend('TYT').last3) + ' net');
      });
    });

    it('sayfa yazdırma kökünde; belge olmadığını ve kesinlik anahtarını söyler', async () => {
      await withTodayAsync('2026-10-12', async () => {
        await hazirla();
        const kok = document.createElement('div');
        kok.innerHTML = R.HaftaRapor.html();
        try{
          expect(!!kok.querySelector('#print-root.printdoc')).toBe(true);
          expect(kok.textContent).toContain('Bu bir başarı belgesi değildir.');
          expect(kok.textContent).toContain('Kesinlik anahtarı');
          expect(kok.textContent).toContain('veri yok');
          expect(kok.textContent.indexOf('undefined')).toBe(-1);
          expect(kok.textContent.indexOf('NaN')).toBe(-1);
        }finally{ kok.remove(); }
      });
    });

    it('«Özeti paylaş»tan açılır; yazdır ve PDF işleyicileri bağlı', () => {
      const h = R.Screens.today.handle;
      ['veli-rapor', 'veli-rapor-yazdir', 'veli-rapor-pdf'].forEach(a => expect(typeof h[a]).toBe('function'));
    });
  });
})();
