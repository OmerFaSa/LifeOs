/* Öğretmen (King, 2026-10-22): SP.KingDers kavramı ders ve soru olarak verir, 1/3/7 tekrar motoru (KING-4 §D). */
(function(){
  const { describe, it, expect } = SP.Test;

  describe('King dersi (SPİ kavramı)', () => {
    it('«set» kavramı ders olur; metin kavramın kendisi, inceleme durumu etikette, soruVar true', () => {
      const c = SP.OGRENME_KAVRAMLAR.find(x => x.id === 'concept-set');
      const d = SP.KingDers.ders('set');
      expect(d.baslik).toBe('Set');
      expect(d.bolumler.map(b => b.metin)).toEqual([c.definition, c.watch, c.example]);
      expect(d.etiket).toContain('doğrulanmadı');
      expect(d.soruVar).toBe(true);
    });

    it('kavramı olmayan konuda ders yok', () => {
      expect(SP.KingDers.ders('kuantum alan kuramı')).toBe(null);
      expect(SP.KingDers.ders('')).toBe(null);
    });

    it('soru 4 farklı seçenek üretir, tanımı aynen içerir, doğru harf doğrudur', () => {
      const q = SP.KingDers.soru('set');
      expect(Boolean(q)).toBe(true);
      expect(q.id.startsWith('concept-set|')).toBe(true);
      expect(q.sec.length).toBe(4);
      expect(new Set(q.sec).size).toBe(4);
      const dogruHarf = q.id.split('|')[1];
      const dogruMetin = q.sec[dogruHarf.charCodeAt(0) - 65];
      expect(dogruMetin).toBe('Set');
      expect(q.soru).toContain('«');
      expect(q.soru).toContain('Birlikte kaydedilen tekrar grubudur.');
      expect(q.kaynak).toContain('SPİ');
    });

    it('yanlış cevap motorun 1/3/7 takvimine ve son yanlışa girer', () => {
      localStorage.removeItem('spi.ogret.tekrar');
      localStorage.removeItem('spi.ogret.son');
      const q = SP.KingDers.soru('set');
      const d = q.id.split('|')[1];
      const y = ['A', 'B', 'C', 'D'].find(h => h !== d);
      const a = SP.KingDers.cevapla(q.id, y);

      expect(Boolean(a)).toBe(true);
      expect(a.dogru).toBe(d);
      expect(a.not).toBe('Yarın bu konudan benzer bir soru soracağım.');
      expect(a.cozum.some(s => s.startsWith('Tanım: '))).toBe(true);

      const tk = JSON.parse(localStorage.getItem('spi.ogret.tekrar') || '{}');
      expect(tk['concept-set'] && tk['concept-set'].n).toBe(0);
      expect(tk['concept-set'] && tk['concept-set'].y).toBe(1);

      const son = JSON.parse(localStorage.getItem('spi.ogret.son') || 'null');
      expect(son && son.kavram).toBe('concept-set');
      expect(Boolean(son && son.secMetin)).toBe(true);
    });

    it('üçüncü tekrar doğrusu kavramı kapatır (bitti)', () => {
      const bugun = SP.U.todayISO();
      localStorage.setItem('spi.ogret.tekrar', JSON.stringify({
        'concept-set': { n: 2, sonraki: bugun }
      }));
      const q = SP.KingDers.soru('set');
      const d = q.id.split('|')[1];
      const a = SP.KingDers.cevapla(q.id, d);

      expect(Boolean(a)).toBe(true);
      expect(a.not).toBe('Tekrarları tamamladın; bu konu kapandı.');
      const tk = JSON.parse(localStorage.getItem('spi.ogret.tekrar') || '{}');
      expect(tk['concept-set'].n).toBe(3);
      expect(Boolean(tk['concept-set'].bitti)).toBe(true);
    });

    it('boş ya da bilinmeyen kimlikte cevapla null döner', () => {
      expect(SP.KingDers.cevapla('yok|A', 'A')).toBe(null);
      expect(SP.KingDers.cevapla('', 'A')).toBe(null);
      expect(SP.KingDers.cevapla(null, 'A')).toBe(null);
    });

    it('konusuz soru vadesi gelen kavramı veya sorulmamış kavramı seçer', () => {
      localStorage.setItem('spi.ogret.tekrar', JSON.stringify({
        'concept-set': { n: 1, sonraki: '2000-01-01' }
      }));
      const q = SP.KingDers.soru('');
      expect(Boolean(q)).toBe(true);
      expect(q.id.split('|')[0]).toBe('concept-set');
      expect(q.not.startsWith('Tekrar (2. tur)')).toBe(true);
    });

    it('King araçları iki okuma aracı döner', () => {
      const araclar = SP.KingDers.araclar();
      expect(araclar.map(a => a.ad)).toEqual(['spi_tekrarlarim', 'spi_yanlis_teshis']);
      const liste = SP.KingArac.liste();
      expect(liste.some(a => a.ad === 'spi_tekrarlarim')).toBe(true);
      expect(liste.some(a => a.ad === 'spi_yanlis_teshis')).toBe(true);
    });
  });
})();
