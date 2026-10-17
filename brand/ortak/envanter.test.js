/* Envanter (brand/ortak/envanter.js) — Mini-IPIP ve üslup.
   Kanıtlanan: ters maddeler doğru puanlanır; duygusal denge nörotikliğin
   tersidir; betimleme yargısız; üslup 15 mesajdan önce söylenmez. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const E = () => window.LIFEOS.ENVANTER;
  describe('Envanter — kişilik', () => {
    it('20 madde; her boyutta dört; ters maddeler ters puanlanır', () => {
      expect(E().MADDELER).toHaveLength(20);
      ['E', 'A', 'C', 'N', 'O'].forEach(b => expect(E().MADDELER.filter(m => m[1] === b)).toHaveLength(4));
      /* Hep «5»: düz maddeler 5, ters maddeler 1 → her boyut 3 (orta). */
      const p = E().puanla(new Array(20).fill(5)).puan;
      expect([p.E, p.A, p.C, p.O, p.D]).toEqual([3, 3, 3, 2, 3]);
      /* Dışadönüklük yüksek: düz E maddeleri 5, ters E maddeleri 1. */
      const c = E().MADDELER.map(m => m[1] === 'E' ? (m[2] > 0 ? 5 : 1) : 3);
      expect(E().puanla(c).puan.E).toBe(5);
    });
    it('duygusal denge = nörotikliğin tersi; betimleme yargısız', () => {
      const c = E().MADDELER.map(m => m[1] === 'N' ? (m[2] > 0 ? 5 : 1) : 3);
      const p = E().puanla(c).puan;
      expect(p.D).toBe(1);
      const s = E().satirlar(p).join(' ');
      expect(s).toContain('Duygusal denge: düşük');
      expect(/nörotik|kaygı bozukluğu|hasta|kötü/.test(s.toLocaleLowerCase('tr'))).toBe(false);
    });
  });
  describe('Envanter — üslup', () => {
    it('15 mesajdan önce söylenmez; kısa ve samimi yazış tanınır', () => {
      let s = null;
      for(let i = 0; i < 14; i++) s = E().uslupGuncelle(s, 'kanka uyku 7');
      expect(E().uslupOzeti(s)).toBe(null);
      s = E().uslupGuncelle(s, 'kanka su 2 bardak');
      const u = E().uslupOzeti(s);
      expect([u.kisa, u.samimi]).toEqual([true, true]);
      expect(u.ozet).toContain('samimi');
    });
  });
})();
