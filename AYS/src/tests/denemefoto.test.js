/* Deneme sonucu fotoğraftan (core/denemefoto.js, fikir 7). Kanıtladığı
   sözler: şablonda olmayan test doldurulmaz; D+Y+B soru sayısını aşan satır
   atlanır ve nedeni söylenir; okunamayan sayı tahmin edilmez; model yokken
   dürüstçe söylenir; görüntü modele `data` alanıyla gider. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const F = () => R.DenemeFoto;
  const TYT = () => R.EXAM_TEMPLATES.find(t => t.id === 'tyt-full');

  describe('Deneme sonucu fotoğraftan', () => {
    it('şablonla eşleşen, tutarlı satırlar doldurulur; gerisi nedeniyle atlanır', () => {
      const d = F().dogrula([
        { test:'TÜRKÇE TESTİ', dogru:31, yanlis:5, bos:4 },
        { test:'Temel Matematik', dogru:25, yanlis:10, bos:null },
        { test:'Fen Bilimleri', dogru:15, yanlis:6, bos:0 },       // 21 > 20
        { test:'Sosyal Bilimler', dogru:null, yanlis:3, bos:2 },    // doğru okunamadı
        { test:'Edebiyat', dogru:10, yanlis:0, bos:0 },            // şablonda yok
        { test:'Türkçe', dogru:1, yanlis:1, bos:1 },               // ikinci kez: ilk kazanır
        'bozuk',
      ], TYT());
      expect(d.satirlar.map(s => [s.ad, s.c, s.w, s.b])).toEqual([
        ['Türkçe', 31, 5, 4], ['Temel Matematik', 25, 10, null]]);
      expect(d.atlanan.map(a => a.ad)).toEqual(['Fen Bilimleri', 'Sosyal Bilimler', 'Edebiyat']);
      expect(d.atlanan[0].neden).toContain('20');
      expect(d.eksik).toEqual(['Sosyal Bilimler', 'Fen Bilimleri']);
    });

    it('kesirli ya da negatif sayı kabul edilmez; iki teste uyan ad eşleşmez', () => {
      const d = F().dogrula([{ test:'Türkçe', dogru:30.5, yanlis:2, bos:0 }], TYT());
      expect(d.satirlar.length).toBe(0);
      expect(F().eslestir('Matematik', [{ name:'Temel Matematik' }, { name:'Matematik' }])).toBe(1);
      expect(F().eslestir('Bilimler', [{ name:'Sosyal Bilimler' }, { name:'Fen Bilimleri' }])).toBe(-1);
    });

    it('model yokken söyler; varken görüntü `data` alanıyla gider ve sonuç doğrulanır', async () => {
      resetState();
      const eski = { ready:R.Solver.ready, chainFor:R.Solver.chainFor, prep:R.Solver.prepareImage, complete:R.LLM.complete };
      const dosya = { name:'s.jpg', type:'image/jpeg', size:100 };
      try{
        R.Solver.ready = () => false;
        const yok = await F().oku(dosya, TYT());
        expect(yok.ok).toBe(false);
        expect(yok.note).toContain('model');
        let giden = null;
        R.Solver.ready = () => true;
        R.Solver.chainFor = () => [{ provider:'x' }];
        R.Solver.prepareImage = async () => ({ mime:'image/jpeg', data:'QUJD' });
        R.LLM.complete = async (chain, req) => { giden = req;
          return { text:'Sonuç: [{"test":"Türkçe","dogru":30,"yanlis":6,"bos":4}]' }; };
        const r = await F().oku(dosya, TYT());
        expect(giden.messages[0].images[0]).toEqual({ mime:'image/jpeg', data:'QUJD' });
        expect(r.ok).toBe(true);
        expect(r.satirlar[0].c).toBe(30);
      }finally{
        R.Solver.ready = eski.ready; R.Solver.chainFor = eski.chainFor;
        R.Solver.prepareImage = eski.prep; R.LLM.complete = eski.complete;
      }
    });
  });
})();
