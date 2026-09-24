/* Sınav önerisi (core/sinavoneri.js, Y11). Kanıtladığı sözler: eğitim durumu
   yoksa öneri yok, soru var; uygunluk kural tablosundan; hedefle örtüşen
   öne gelir; her satır gerekçesini ve kılavuz uyarısını taşır. */

(function(){
  const { describe, it, expect } = R.Test;
  const O = () => R.SinavOneri;

  describe('Sınav önerisi', () => {
    it('eğitim durumu bilinmiyorsa sorar, tahmin etmez', () => {
      const r = O().oner({});
      expect(r.ok).toBe(false);
      expect(r.soru).toContain('Eğitim durumun');
    });

    it('lise öğrencisi: YKS uygun ve etkin; ALES ve KPSS sonra', () => {
      const r = O().oner({ egitim:'lise', hedef:'universite' });
      expect(r.ok).toBe(true);
      expect(r.satirlar[0].id).toBe('yks');
      const d = {};
      r.satirlar.forEach(s => { d[s.id] = s.durum; });
      expect([d.yks, d.ales, d.kpss, d.lgs]).toEqual(['uygun', 'sonra', 'sonra', 'uygun değil']);
      expect(r.satirlar[0].etkin).toBe(true);
      expect(r.satirlar[0].gerekce).toContain('ÖSYM kılavuzunda yazar');
    });

    it('lisans son sınıf + lisansüstü hedefi: ALES ve YDS öne gelir', () => {
      const r = O().oner({ egitim:'lisans-son', hedef:'lisansustu' });
      expect(r.satirlar.slice(0, 2).map(s => s.id).sort()).toEqual(['ales', 'yds']);
      expect(r.satirlar.find(s => s.id === 'dgs').durum).toBe('uygun değil');
      expect(O().oner({ egitim:'lisans-son' }).not).toContain('Hedefini');
    });
  });
})();
