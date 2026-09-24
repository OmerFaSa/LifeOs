/* Sağlık verisi içe aktarma (core/saglikice.js, Y5). Kanıtladığı sözler:
   senin değerin ezilmez; aynı ölçü değilse alınmaz (HRV SDNN, adım); aralık
   dışı düşer; uyku iki kaynaktan iki kez sayılmaz; birim çevrilir; geri
   alınır ve sonradan değiştirdiğin değer geri almada kalır; zip ve CSV okunur. */

(function(){
  const { describe, it, expect, resetState, pushVitals } = SP.Test;
  const I = () => SP.SaglikIce;
  const G = SP.U.iso(SP.U.addDays(SP.U.today(), -3));      /* pencere içinde bir gün */
  const G2 = SP.U.iso(SP.U.addDays(SP.U.today(), -2));
  const ESKI = SP.U.iso(SP.U.addDays(SP.U.today(), -400));

  function rec(tur, deger, birim, bas, bit, kaynak){
    return '<Record type="' + tur + '" sourceName="' + (kaynak || 'iPhone') + '" unit="' + (birim || '')
      + '" startDate="' + bas + '" endDate="' + (bit || bas) + '" value="' + deger + '"/>';
  }
  function xml(){
    return '<?xml version="1.0"?><HealthData>'
      + rec('HKQuantityTypeIdentifierBodyMass', '160', 'lb', G + ' 07:00:00 +0300')
      + rec('HKQuantityTypeIdentifierDietaryWater', '500', 'mL', G + ' 09:00:00 +0300')
      + rec('HKQuantityTypeIdentifierDietaryWater', '1.2', 'L', G + ' 15:00:00 +0300')
      + rec('HKQuantityTypeIdentifierOxygenSaturation', '0.97', '%', G + ' 08:00:00 +0300')
      + rec('HKQuantityTypeIdentifierRestingHeartRate', '300', 'count/min', G + ' 08:00:00 +0300')
      + rec('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', '45', 'ms', G + ' 08:00:00 +0300')
      + rec('HKQuantityTypeIdentifierStepCount', '5000', 'count', G + ' 08:00:00 +0300')
      + rec('HKCategoryTypeIdentifierSleepAnalysis', 'HKCategoryValueSleepAnalysisAsleepCore', '',
        G + ' 23:00:00 +0300', G2 + ' 06:00:00 +0300', 'Watch')
      + rec('HKCategoryTypeIdentifierSleepAnalysis', 'HKCategoryValueSleepAnalysisAsleepUnspecified', '',
        G + ' 23:30:00 +0300', G2 + ' 05:30:00 +0300', 'iPhone')
      + rec('HKCategoryTypeIdentifierSleepAnalysis', 'HKCategoryValueSleepAnalysisInBed', '',
        G + ' 22:00:00 +0300', G2 + ' 07:00:00 +0300', 'iPhone')
      + rec('HKQuantityTypeIdentifierBodyMass', '70', 'kg', ESKI + ' 07:00:00 +0300')
      + '</HealthData>';
  }
  function deger(o, alan, gun){ const x = o.yaz.find(y => y.alan === alan && y.gun === gun); return x ? x.v : undefined; }

  describe('Sağlık verisi içe aktarma', () => {
    it('iPhone XML: birim çevrilir, uyku tek kaynaktan, aynı olmayan ölçü alınmaz', () => {
      resetState();
      const o = I().metindenOku(xml(), { gun:90 });
      expect(o.ok).toBe(true);
      expect(deger(o, 'weight', G)).toBe(72.6);           /* 160 lb */
      expect(deger(o, 'water', G)).toBe(1700);            /* 500 mL + 1,2 L */
      expect(deger(o, 'spo2', G)).toBe(97);
      expect(deger(o, 'sleep', G2)).toBe(7);              /* saat 7, telefon 6: en büyüğü */
      expect(deger(o, 'rhr', G)).toBe(undefined);         /* 300 aralık dışı */
      expect(o.aralikDisi).toBe(1);
      expect(o.alinmayan.map(x => x.ad).join(' ')).toContain('RMSSD');
      expect(o.alinmayan.map(x => x.ad).join(' ')).toContain('Adım');
      expect(o.yaz.some(x => x.gun === ESKI)).toBe(false); /* 90 günlük pencere */
    });

    it('senin değerin ezilmez; çakışma gösterilir', () => {
      resetState();
      pushVitals(G, { weight:71 });
      const o = I().metindenOku(xml(), { gun:90 });
      expect(deger(o, 'weight', G)).toBe(undefined);
      expect(o.cakisma).toEqual([{ gun:G, alan:'weight', mevcut:71, gelen:72.6 }]);
    });

    it('yazılır ve geri alınır; sonradan değiştirdiğin kalır', async () => {
      resetState();
      const o = I().metindenOku(xml(), { gun:90 });
      const r = await I().uygula(o);
      expect(r.ok).toBe(true);
      expect([SP.S.vitals[G].water, SP.S.vitals[G2].sleep, SP.S.vitals[G].iceAktarim.water]).toEqual([1700, 7, 'telefon']);
      await SP.Model.saveVitals(G, { water:2000 });       /* kullanıcı düzeltti */
      const g = await I().geriAl(r.id);
      expect([g.ok, g.kalan]).toEqual([true, 1]);
      expect([SP.S.vitals[G].water, SP.S.vitals[G].weight, SP.S.vitals[G2].sleep]).toEqual([2000, null, null]);
    });

    it('CSV (Android uygulamaları): tarih, ölçü, değer', () => {
      resetState();
      const o = I().metindenOku('tarih,olcu,deger\n' + G + ',kilo,"72,5"\n' + G + ',nabız,58\n' + G + ',adim,9000\n', { gun:90 });
      expect([deger(o, 'weight', G), deger(o, 'rhr', G)]).toEqual([72.5, 58]);
      expect(o.alinmayan[0].ad).toContain('adim');
    });

    it('zip içindeki export.xml okunur (saklı ve sıkıştırılmış)', async () => {
      resetState();
      const veri = new TextEncoder().encode(xml());
      async function zip(yontem){
        let govde = veri;
        if(yontem === 8){
          const s = new Blob([veri]).stream().pipeThrough(new CompressionStream('deflate-raw'));
          govde = new Uint8Array(await new Response(s).arrayBuffer());
        }
        const ad = new TextEncoder().encode('apple_health_export/export.xml');
        const lh = new DataView(new ArrayBuffer(30));
        lh.setUint32(0, 0x04034b50, true); lh.setUint16(8, yontem, true);
        lh.setUint32(18, govde.length, true); lh.setUint32(22, veri.length, true); lh.setUint16(26, ad.length, true);
        const cd = new DataView(new ArrayBuffer(46));
        cd.setUint32(0, 0x02014b50, true); cd.setUint16(10, yontem, true);
        cd.setUint32(20, govde.length, true); cd.setUint32(24, veri.length, true); cd.setUint16(28, ad.length, true);
        cd.setUint32(42, 0, true);
        const cdBas = 30 + ad.length + govde.length;
        const eo = new DataView(new ArrayBuffer(22));
        eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, 1, true); eo.setUint16(10, 1, true);
        eo.setUint32(12, 46 + ad.length, true); eo.setUint32(16, cdBas, true);
        return new File([lh.buffer, ad, govde, cd.buffer, ad, eo.buffer], 'export.zip');
      }
      for(const y of [0, 8]){
        const o = await I().dosyadanOku(await zip(y), { gun:90 });
        expect([o.ok, deger(o, 'water', G)]).toEqual([true, 1700]);
      }
      expect((await I().dosyadanOku(new File(['x'], 'foto.png'), {})).why).toContain('tanınmadı');
    });
  });
})();
