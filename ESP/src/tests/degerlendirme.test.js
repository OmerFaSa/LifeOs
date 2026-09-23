/* DEĞERLENDİRME SETİ — ESP (ekip/PLAN.md §3.J, §6).

   Örnek hedef cümleleri ve BEKLENEN kararları; her cümle ayrı bir test.
   Kural değişince hangi kararın değiştiği ADIYLA görünür.

   Sabit durum: kitap geçmişi yok (kitap başına 6 saat tahmini); enstrümanda
   dört haftada 70 → 86 BPM temiz tempo (haftada 4 BPM, üst 6); dil
   seviyesi her cümlede ayrıca verilir (öz-değerlendirme). */

(function(){
  const { describe, it, expect, resetState, pushPiece } = ESP.Test;
  const HD = () => ESP.Hedefler;
  const H = () => window.LIFEOS.Hedef;
  const BUGUN = '2026-09-23';

  const SET = [
    ['Bir yılda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat', 'A1', 'gercekci'],
    ['Bir ayda İngilizcede A2\'ye gelmek istiyorum, günde yarım saat', 'A1', 'gercekci_degil'],
    ['4 ayda İngilizcede A2\'ye gelmek istiyorum, günde 40 dakika', 'A1', 'zorlayici'],
    ['6 ayda Almancada B1\'e gelmek istiyorum, günde 1 saat', '0', 'gercekci_degil'],
    ['6 ayda İngilizcede B1\'e gelmek istiyorum, günde 2 saat', 'A2', 'gercekci'],
    ['3 ayda İngilizcede B2\'ye gelmek istiyorum, günde 1 saat', 'B1', 'gercekci_degil'],
    ['bu yıl 24 kitap okumak istiyorum, günde 1 saat', null, 'zorlayici'],
    ['yılda 24 kitap okumak istiyorum, günde yarım saat', null, 'gercekci'],
    ['3 ayda 10 kitap okumak istiyorum, günde 20 dakika', null, 'gercekci_degil'],
    ['6 ayda gitarda 120 bpm\'e çıkmak istiyorum', null, 'gercekci'],
    ['6 haftada gitarda 120 bpm\'e çıkmak istiyorum', null, 'zorlayici'],
    ['1 ayda gitarda 140 bpm\'e çıkmak istiyorum', null, 'gercekci_degil'],
  ];

  function kur(tempo){
    resetState();
    HD().sohbet.sifirla();
    if(tempo){
      pushPiece('Gam', { attempts:[
        { date:'2026-08-26', bpm:70, clean:true }, { date:'2026-09-09', bpm:78, clean:true },
        { date:'2026-09-23', bpm:86, clean:true }] });
    }
  }
  function karar(cumle, seviye){
    const t = H().cumleden(cumle, HD().PAKETLER, BUGUN);
    if(!t) return 'hedef değil';
    const h = H().yeni(t, 'esp', BUGUN);
    if(seviye) h.simdi = { deger:seviye, birim:'CEFR', etiket:'tahmin' };
    const g = H().gerceklik(h, HD().PAKET_BY_ID[h.paket], {}, BUGUN);
    return g.hata ? 'hata' : g.bant;
  }

  describe('Değerlendirme seti — ESP', () => {
    SET.forEach(([cumle, seviye, beklenen]) => {
      it('«' + cumle + '»' + (seviye ? ' (şimdi ' + seviye + ')' : '') + ' → ' + beklenen, () => {
        kur(true);
        expect(karar(cumle, seviye)).toBe(beklenen);
      });
    });

    it('tempo geçmişi yoksa enstrüman hedefine karar verilmez', () => {
      kur(false);
      expect(karar('6 ayda gitarda 120 bpm\'e çıkmak istiyorum', null)).toBe(null);
    });

    it('set en az 10 cümledir ve üç paketi de kapsar', () => {
      expect(SET.length >= 10).toBe(true);
      const paketler = SET.map(x => (H().cumleden(x[0], HD().PAKETLER, BUGUN) || {}).paket);
      ['dil', 'okuma', 'enstruman'].forEach(p => expect(paketler).toContain(p));
    });
  });
})();
