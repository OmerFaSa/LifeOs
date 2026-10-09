/* Çekirdek konu özetleri (data/ozetler.js). Kanıtladığı sözler:
     1. Her özet gerçek bir konuya aittir; biçim tutar (3–5 ana madde,
        dikkat, isteğe bağlı örnek; uzunluk sınırı, çift boşluk yok,
        cümle noktalı biter).
     2. Hiçbir konunun özeti eksik değildir (bütün dersler; yeni konu
        eklenirse özeti de yazılmalıdır).
     3. Öğren › Anlatım özeti «Akılda kalsın» olarak, «elle yazıldı ·
        doğrulanmadı» etiketiyle gösterir; özeti olmayan konuda çizilmez. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  /* Bütün dersler tamam (2026-10-09): her konunun özeti var. */
  const TAM = R.SUBJECTS.map(s => s.id);

  function metinler(o){ return o.ana.concat([o.dikkat], o.ornek ? [o.ornek] : []); }

  describe('Çekirdek konu özetleri', () => {
    it('her özet gerçek bir konuya ait ve biçimi tutar', () => {
      const ids = new Set();
      R.SUBJECTS.forEach(s => s.topics.forEach(t => ids.add(t.id)));
      const sahipsiz = Object.keys(R.KONU_OZET).filter(k => !ids.has(k));
      expect(sahipsiz).toEqual([]);
      const bozuk = [];
      Object.keys(R.KONU_OZET).forEach(k => {
        const o = R.KONU_OZET[k];
        if(!Array.isArray(o.ana) || o.ana.length < 3 || o.ana.length > 5) bozuk.push(k + ': ana madde sayısı');
        if(typeof o.dikkat !== 'string') bozuk.push(k + ': dikkat yok');
        metinler(o).forEach((m, i) => {
          const s = String(m || '');
          if(s.length < 15 || s.length > 260) bozuk.push(k + '#' + i + ': uzunluk ' + s.length);
          if(/\s{2,}/.test(s)) bozuk.push(k + '#' + i + ': çift boşluk');
          if(!/[.!?»)]$/.test(s.trim())) bozuk.push(k + '#' + i + ': nokta yok');
        });
      });
      expect(bozuk).toEqual([]);
    });

    it('her konunun özeti var', () => {
      const eksik = [];
      TAM.forEach(sid => R.SUBJECTS.find(s => s.id === sid).topics
        .forEach(t => { if(!R.KONU_OZET[t.id]) eksik.push(t.id); }));
      expect(eksik).toEqual([]);
    });

    it('Anlatım özeti «Akılda kalsın» olarak etiketiyle gösterir; özeti olmayan konuda yok', async () => {
      resetState();
      const s = R.SUBJECTS.find(x => x.id === 'tyt-matematik'), t = s.topics.find(x => x.id === 'tm-03');
      await R.Ogren.sec(s.id, t.id);
      let html = String(await R.Screens.anlatim.render());
      expect(html).toContain('Akılda kalsın');
      expect(html).toContain('elle yazıldı · doğrulanmadı');
      expect(html).toContain('Dikkat:');
      expect(html).toContain(R.KONU_OZET['tm-03'].ana[1].slice(0, 30));
      const eski = R.KONU_OZET['tm-03'];
      delete R.KONU_OZET['tm-03'];
      try{
        html = String(await R.Screens.anlatim.render());
        expect(html.indexOf('Akılda kalsın')).toBe(-1);
      }finally{ R.KONU_OZET['tm-03'] = eski; }
    });
  });
})();
