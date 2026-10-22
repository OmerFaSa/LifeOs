/* Sınav provası (core/ogrentest.js söz 7). Kanıtladığı sözler:
     1. Ders kotası ÖSYM soru oranıyla, süre gerçek sınavın soru başına
        süresiyle (TYT 165/120, AYT 180/80) ölçeklenir.
     2. Sınavda doğru/yanlış dönmez, çözüme bakılmaz; süre dolunca işaret
        alınmaz.
     3. Net = doğru − yanlış / 4, ders ders; boş net düşürmez.
     4. Ekran: geri sayım ve tempo; işaretli şık doğru/yanlış göstermez. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const T = () => R.OgrenTest;

  describe('Sınav provası', () => {
    it('TYT ve AYT planı: kota soru oranıyla, süre ölçekli', () => {
      const tyt = T().provaPlani('TYT', 20);
      expect(tyt.dersler.map(d => d.id + ':' + d.n)).toEqual(['tyt-turkce:7', 'tyt-sosyal:3', 'tyt-matematik:7', 'tyt-fen:3']);
      expect(tyt.sureDk).toBe(28);
      const ayt = T().provaPlani('AYT', 20);
      expect(ayt.dersler.map(d => d.n)).toEqual([10, 4, 3, 3]);
      expect(ayt.sureDk).toBe(45);
      expect(T().provaPlani('TYT', 40).dersler.reduce((a, d) => a + d.n, 0)).toBe(40);
    });

    it('sınavda doğru/yanlış dönmez, çözüme bakılmaz; net doğru − yanlış/4', async () => {
      resetState();
      await T().yukle();
      const r = await T().provaBaslat('TYT', 20);
      expect(r.ok).toBe(true);
      const a = T().aktif();
      expect(a.prova.sinav).toBe('TYT');
      expect(T().kalanSn() > 0).toBe(true);
      /* ilk iki soru doğru, üçüncü yanlış, kalanı boş */
      const q = k => T().soruOf(a.sorular[k]).q;
      const yanlisHarf = x => R.Ogren.HARFLER.find(h => h !== x.dogru);
      const c0 = await T().cevapla(0, q(0).dogru);
      expect('dogru' in c0).toBe(false);
      await T().cevapla(1, q(1).dogru);
      await T().cevapla(2, yanlisHarf(q(2)));
      expect((await T().bak(3)).neden).toBe('prova');
      const oz = await T().bitir();
      expect([oz.dogru, oz.yanlis, oz.bos]).toEqual([2, 1, r.n - 3]);
      expect(oz.prova.net).toBe(1.75);
      expect(oz.prova.dersler.map(d => d.id)[0]).toBe('tyt-turkce');
      expect(oz.prova.dersler.reduce((t, d) => t + d.net, 0)).toBe(1.75);
    });

    it('süre dolunca işaret alınmaz', async () => {
      resetState();
      await T().yukle();
      await T().provaBaslat('TYT', 20, Date.now() - 60 * 60000);
      expect(T().kalanSn()).toBe(0);
      const q = T().soruOf(T().aktif().sorular[0]).q;
      expect((await T().cevapla(0, q.dogru)).neden).toBe('sure');
      await T().vazgec();
    });

    it('ekran: geri sayım ve tempo; işaretli şık doğruyu göstermez', async () => {
      resetState();
      await T().yukle();
      await T().provaBaslat('TYT', 20);
      R.S.ui.ogrenKip = 'prova';
      const q = T().soruOf(T().aktif().sorular[0]).q;
      await T().cevapla(0, q.dogru);
      const d = document.createElement('div');
      d.innerHTML = String(await R.Screens.sorular.render());
      try{
        expect(!!d.querySelector('#ogr-prova-kalan')).toBe(true);
        expect(!!d.querySelector('[data-oz="029"]')).toBe(true);
        expect(d.querySelectorAll('.secenek.is-dogru, .secenek.is-yanlis').length).toBe(0);
        expect(d.querySelectorAll('.secenek.is-secili').length).toBe(1);
        expect(d.querySelectorAll('.ogr-nokta.is-isaretli').length).toBe(1);
        expect(d.textContent).toContain('prova bitince');
      }finally{ d.remove(); await T().vazgec(); R.S.ui.ogrenKip = null; }
    });

    it('kurulum ders kotasını ve süreyi gösterir', async () => {
      resetState();
      await T().yukle();
      R.S.ui.ogrenKip = 'prova';
      R.S.ui.provaSinav = 'AYT';
      const d = document.createElement('div');
      d.innerHTML = String(await R.Screens.sorular.render());
      try{
        const cip = [...d.querySelectorAll('.ogr-prova-ders')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
        expect(cip[cip.length - 1]).toBe('45 dk');
        expect(cip.length).toBe(5);
      }finally{ d.remove(); R.S.ui.ogrenKip = null; R.S.ui.provaSinav = null; }
    });
  });
})();
