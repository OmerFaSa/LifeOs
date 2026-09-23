/* DEĞERLENDİRME SETİ — AYS (ekip/PLAN.md §3.J, §6).

   Örnek hedef cümleleri ve BEKLENEN kararları; her cümle ayrı bir test.
   Kural değişince hangi kararın değiştiği ADIYLA görünür.

   Sabit durum: hiçbir konu kapanmamış, seviye «Temeli var»; altı haftalık
   tam TYT denemeleri 60 → 67 net (medyan eğim haftada 1,4 net); AYT
   denemesi yok. Sınav tarihi profildeki varsayılandır. */

(function(){
  const { describe, it, expect, resetState, makeExam } = R.Test;
  const Hd = () => R.Hedefler;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  const SET = [
    ['TYT matematiği 100 günde bitirmek istiyorum, günde 2 saat', 'gercekci_degil'],
    ['TYT matematiği 100 günde bitirmek istiyorum, günde 3 saat', 'zorlayici'],
    ['TYT matematiği 100 günde bitirmek istiyorum, günde 4 saat', 'gercekci'],
    ['AYT fiziği sınava kadar bitirmek istiyorum, günde 1 saat', 'gercekci'],
    ['AYT kimyayı 6 ayda bitirmek istiyorum, günde 1 saat', 'zorlayici'],
    ['TYT konularını 3 ayda bitirmek istiyorum, günde 2 saat', 'gercekci_degil'],
    ['TYT fiziği bitirmek istiyorum', 'hata'],
    ['TYT\'de 75 nete sınava kadar çıkmak istiyorum', 'gercekci'],
    ['TYT\'de 3 ayda 80 nete çıkmak istiyorum', 'gercekci'],
    ['TYT\'de 2 ayda 80 nete çıkmak istiyorum', 'zorlayici'],
    ['TYT\'de 1 ayda 90 nete çıkmak istiyorum', 'gercekci_degil'],
    ['TYT\'de 130 nete çıkmak istiyorum', 'hata'],
    ['AYT\'de 6 ayda 60 nete çıkmak istiyorum', null],
  ];

  async function kur(){
    resetState();
    for(const [d, n] of [['2026-08-12', 60], ['2026-08-19', 62], ['2026-08-26', 61],
      ['2026-09-02', 64], ['2026-09-09', 66], ['2026-09-16', 67]]){
      await R.Model.saveExam(makeExam({ date:d, family:'TYT', kind:'full',
        tests:[{ name:'Türkçe', correct:n, wrong:0, blank:0, minutes:null }] }));
    }
  }
  function karar(cumle){
    const t = H().cumleden(cumle, Hd().PAKETLER, BUGUN);
    if(!t) return 'hedef değil';
    const h = H().yeni(t, 'ays', BUGUN);
    const g = H().gerceklik(h, Hd().PAKET_BY_ID[h.paket], {}, BUGUN);
    return g.hata ? 'hata' : g.bant;
  }

  describe('Değerlendirme seti — AYS', () => {
    SET.forEach(([cumle, beklenen]) => {
      it('«' + cumle + '» → ' + beklenen, async () => {
        await kur();
        expect(karar(cumle)).toBe(beklenen);
      });
    });

    it('set en az 10 cümledir ve iki paketi de kapsar', () => {
      expect(SET.length >= 10).toBe(true);
      const paketler = SET.map(x => (H().cumleden(x[0], Hd().PAKETLER, BUGUN) || {}).paket);
      ['konu', 'net'].forEach(p => expect(paketler).toContain(p));
    });
  });
})();
