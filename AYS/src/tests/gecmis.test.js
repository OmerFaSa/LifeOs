/* ÜRETİLMİŞ KOPYA — BURAYI DÜZENLEME.
   Düzeltme brand/ortak/gecmis.test.js içine yazılır; burası bir sonraki
   `python3 tools/ortak.py --yay` ile yeniden üretilir. */
/* SOHBET GEÇMİŞİ testleri — kaynak `brand/ortak/gecmis.test.js`; ortak.py
   üç arayüze kopyalar. */
(function(){
  const NS = window.R || window.SP || window.ESP;
  const { describe, it, expect } = NS.Test;
  const G = () => window.LIFEOS.GECMIS;
  const temizle = () => { ['x', 'y'].forEach(a => { try{ localStorage.removeItem(G()._anahtar('deneme', a)); }catch(e){} }); G()._sifirla(); };

  describe('Sohbet geçmişi (Ofis)', () => {
    it('boş konuşma geçmişe yazılmaz; senden mesaj varsa yazılır, başlık ilk sorudan', () => {
      temizle();
      expect(G().arsivle('deneme', 'x', [])).toBe(null);
      expect(G().arsivle('deneme', 'x', [{ role:'agent', text:'Merhaba' }])).toBe(null);
      const k = G().arsivle('deneme', 'x', [{ role:'user', text:'Bu hafta hangi derse ağırlık vereyim?' }, { role:'agent', text:'Matematik.' }]);
      expect(!!k).toBe(true);
      expect(G().liste('deneme', 'x')).toHaveLength(1);
      expect(G().baslik(k)).toBe('Bu hafta hangi derse ağırlık vereyim?');
      expect(G().liste('deneme', 'y')).toHaveLength(0);              // ajan başına
      temizle();
    });
    it('geçmişten açılan kayıt çıkar; aynı kimlikle geri yazılınca kopya olmaz', () => {
      temizle();
      const k = G().arsivle('deneme', 'x', [{ role:'user', text:'soru 1' }]);
      const a = G().al('deneme', 'x', k.id);
      expect(a.mesajlar[0].text).toBe('soru 1');
      expect(G().liste('deneme', 'x')).toHaveLength(0);
      G().arsivle('deneme', 'x', a.mesajlar.concat([{ role:'user', text:'soru 2' }]), a.id);
      const l = G().liste('deneme', 'x');
      expect([l.length, l[0].id, l[0].mesajlar.length]).toEqual([1, k.id, 2]);
      temizle();
    });
    it('silmek iki dokunuş; liste en çok 30; işaretleme kaçışlı', () => {
      temizle();
      const k = G().arsivle('deneme', 'x', [{ role:'user', text:'<b>kalın</b>' }]);
      const act = { ac:'gecmis-ac', sil:'gecmis-sil' };
      const h = G().listeHtml('deneme', 'x', act);
      expect(h.indexOf('<b>kalın') < 0).toBe(true);
      expect(h).toContain('data-act="gecmis-ac"');
      expect(G().sil('deneme', 'x', k.id)).toBe(false);
      expect(G().listeHtml('deneme', 'x', act)).toContain('Silinsin mi?');
      expect(G().sil('deneme', 'x', k.id)).toBe(true);
      expect(G().liste('deneme', 'x')).toHaveLength(0);
      for(let i = 0; i < 35; i++) G().arsivle('deneme', 'x', [{ role:'user', text:'s' + i }], null, new Date(2026, 9, 1, 0, i));
      expect(G().liste('deneme', 'x')).toHaveLength(G().EN_COK);
      expect(G().listeHtml('deneme', 'y', act)).toContain('Henüz geçmiş sohbet yok');
      temizle();
    });
  });
})();
