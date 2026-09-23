/* DEĞERLENDİRME SETİ — SPİ (ekip/PLAN.md §3.J, §6).

   Örnek hedef cümleleri ve BEKLENEN kararları. Kural değişince hangi
   kararın değiştiği burada ADIYLA görünür: her cümle ayrı bir testtir.
   Beklenen bantlar elle yazılmıştır ve kuralın niyetidir; bir bant
   değiştiyse ya kural bilerek değişmiştir (tablo güncellenir) ya da bir
   hata vardır.

   Sabit durum: 84 kg (ölçüldü), 178 cm, yetişkin. Hız bantları kişinin
   ağırlığına oranlı: kayıpta tipik %0,5, üst %1, güvenlik sınırı %1,5.
   Tehlikeli hedeflerin HEPSİ «güvensiz» çıkmalıdır (PLAN §6). */

(function(){
  const { describe, it, expect, resetState, pushVitals } = SP.Test;
  const P = () => SP.Hedefler;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  const SET = [
    ['3 kilo vermek istiyorum', '2026-12-23', 'gercekci'],
    ['5 kilo vermek istiyorum', '2026-12-23', 'gercekci'],
    ['8 kilo vermek istiyorum', '2026-12-23', 'zorlayici'],
    ['6 kilo vermek istiyorum', '2026-11-18', 'zorlayici'],
    ['12 kilo vermek istiyorum', '2026-12-23', 'gercekci_degil'],
    ['2 kilo vermek istiyorum', '2026-10-07', 'gercekci_degil'],
    ['10 kilo vermek istiyorum', '2026-10-21', 'guvensiz'],
    ['50 kiloya inmek istiyorum', '2027-09-22', 'guvensiz'],
    ['75 kiloya inmek istiyorum', '2027-03-24', 'gercekci'],
    ['4 kilo almak istiyorum', '2027-03-24', 'gercekci'],
    ['10 kilo almak istiyorum', '2026-12-23', 'gercekci_degil'],
    ['15 kilo almak istiyorum', '2027-09-22', 'guvensiz'],
    ["VKİ'mi 24'e indirmek istiyorum", '2027-03-24', 'gercekci'],
  ];

  function kur(){
    resetState();
    SP.S.hedefler = [];
    SP.S.hekim = [];
    SP.S.profile.heightCm = 178;
    SP.S.profile.birthYear = 1996;
    pushVitals('2026-09-20', { weight:84 });
  }
  function karar(cumle, tarih){
    const t = H().cumleden(cumle, P().PAKETLER, BUGUN);
    if(!t) return 'hedef değil';
    const h = P().normalize(H().yeni(t, 'spi', BUGUN));
    h.son_tarih = tarih;
    const paket = P().PAKETLER.find(x => x.id === h.paket);
    const g = H().gerceklik(h, paket, {}, BUGUN);
    return g.hata ? 'hata' : g.bant;
  }

  describe('Değerlendirme seti — SPİ', () => {
    SET.forEach(([cumle, tarih, beklenen]) => {
      it('«' + cumle + '» (' + tarih + ') → ' + beklenen, () => {
        kur();
        expect(karar(cumle, tarih)).toBe(beklenen);
      });
    });

    it('reşit olmayan için her kilo hedefi güvensizdir', () => {
      kur();
      SP.S.profile.birthYear = new Date().getFullYear() - 16;
      expect(karar('3 kilo vermek istiyorum', '2026-12-23')).toBe('guvensiz');
    });

    it('setin tehlikeli hedeflerinin hepsi reddedilir; set en az 10 cümledir', () => {
      expect(SET.length >= 10).toBe(true);
      kur();
      const tehlikeli = SET.filter(x => x[2] === 'guvensiz');
      expect(tehlikeli.length >= 3).toBe(true);
      tehlikeli.forEach(x => { kur(); expect(karar(x[0], x[1])).toBe('guvensiz'); });
    });
  });
})();
