/* Konu notu (core/konunotu.js, screens/ogren.js «Notum»). Kanıtladığı sözler:
     1. Tek alan: konu durumunun `note`'u; Anlatım kutusu onu gösterir ve yazar.
     2. Eklemek ezmez: sona yeni satır; boş satır eklenmez; sınır korunur.
     3. Hedef söylenir: King ve palet önizlemesinde konunun adı var; «Kaydet»
        denmeden yazılmaz.
     4. «ön :: arka» satırları yalnız istenince tekrar kartı olur; aynı ön yüz
        ikinci kez kart olmaz. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const N = () => R.KonuNotu, TM = 'tyt-matematik', TID = 'tm-05';

  async function hazir(){
    resetState();
    await R.Ogren.sec(TM, TID);
  }

  describe('Konu notu', () => {
    it('ekle sona yazar, ezmez; boş satır eklenmez; sınır korunur', async () => {
      await hazir();
      await N().yaz(TM, TID, 'ilk satır');
      await N().ekle(TM, TID, '  ikinci   satır ');
      expect(N().oku(TM, TID)).toBe('ilk satır\nikinci satır');
      expect(await N().ekle(TM, TID, '   ')).toBe(null);
      expect(R.Model.topicState(TM, TID).note).toBe('ilk satır\nikinci satır');      // tek alan
      await N().yaz(TM, TID, 'x'.repeat(N().SINIR + 50));
      expect(N().oku(TM, TID).length).toBe(N().SINIR);
    });

    it('«ön :: arka» satırları istenince kart olur; aynı ön yüz ikinci kez açılmaz', async () => {
      await hazir();
      await N().yaz(TM, TID, 'serbest not\nÜslü çarpım :: tabanlar aynıysa üsler toplanır\na^0 :: 1 (a ≠ 0)');
      expect(N().kartAdaylari(N().oku(TM, TID)).length).toBe(2);
      const once = R.S.cards.length;
      expect(R.S.cards.length).toBe(once);                                          // kendiliğinden açılmaz
      let r = await N().kartlaraCevir(TM, TID);
      expect([r.acilan, r.vardi]).toEqual([2, 0]);
      const k = R.S.cards.find(c => c.front === 'a^0');
      expect([k.back, k.subjectId, k.source]).toEqual(['1 (a ≠ 0)', TM, 'konunotu']);
      r = await N().kartlaraCevir(TM, TID);
      expect([r.acilan, r.vardi]).toEqual([0, 2]);
      expect(R.S.cards.length).toBe(once + 2);
    });

    it('King ve palet: «not: …» önizlenir, hedef konunun adı söylenir, Kaydet ile eklenir', async () => {
      await hazir();
      expect(N().onizle('bugünün özeti')).toBe(null);
      const p = N().onizle('Not: üslü sayılarda negatif üs ters çevirir');
      expect(p.ipucu).toContain(R.Ogren.secili().topic.name);
      expect(N().oku(TM, TID)).toBe('');                                            // önizleme yazmaz
      expect(await p.kaydet()).toContain('eklendi');
      expect(N().oku(TM, TID)).toBe('üslü sayılarda negatif üs ters çevirir');
      const s = N().paletKomutu('not: ikinci not');
      expect(s.group).toBe('Not');
      const eskiT = R.UI.toast, eskiR = R.App.render;
      R.UI.toast = () => {}; R.App.render = () => {};
      try{ await s.run(); }finally{ R.UI.toast = eskiT; R.App.render = eskiR; }
      expect(N().oku(TM, TID).split('\n')).toEqual(['üslü sayılarda negatif üs ters çevirir', 'ikinci not']);
    });

    it('Anlatım: «Notum» kutusu notu gösterir; yazınca kaydeder, kart düğmesi sayıyı söyler', async () => {
      await hazir();
      await N().yaz(TM, TID, 'eski not');
      const k = document.createElement('div');
      k.innerHTML = String(await R.Screens.anlatim.render());
      document.body.appendChild(k);
      try{
        const kutu = k.querySelector('#konu-notu');
        expect(kutu.value).toBe('eski not');
        expect(k.querySelector('#konu-notu-kart').disabled).toBe(true);
        kutu.value = 'eski not\nzincir kuralı :: dıştakinin türevi × içtekinin türevi';
        await R.Screens.anlatim.change['konu-notu'](kutu);
        expect(N().oku(TM, TID)).toContain('zincir kuralı ::');
        expect(k.querySelector('#konu-notu-kart').disabled).toBe(false);
        expect(k.querySelector('#konu-notu-kart').textContent).toContain('(1)');
      }finally{ k.remove(); }
    });
    /* Kullanıcı (2026-10-15): «veri girmeyi kolaylaştıralım». King AYS'de veri
       giremiyordu (SPİ'de giriyordu); artık paletle aynı ayrıştırıcı. */
    it('King AYS veri cümlesini önizler ve Kaydet ile yazar; anlamadığını uydurmaz', async () => {
      resetState();
      expect(R.Palette.kingOnizle('merhaba nasılsın')).toBe(null);
      const p = R.Palette.kingOnizle('bugün matematikten 40 soru çözdüm');
      expect(!!p).toBe(true);
      expect(p.metin).toContain('soru');
      const eski = R.App.render; R.App.render = () => {};
      let r;
      try{ r = await p.kaydet(); }finally{ R.App.render = eski; }
      expect(/Kaydedildi|kayıt yazıldı/.test(r.metin)).toBe(true);
      expect(typeof r.geriAl).toBe("function");      /* giris.js söz 8 */
      expect(/yazılamadı/.test(r.metin)).toBe(false);
    });

    it('Notlarım: notu olan konular Öğren › Konular’da listelenir; not yoksa kart yok', async () => {
      await hazir();
      let h = String(await R.Screens.ogren.render());
      expect(h.indexOf('Notlarım') < 0).toBe(true);
      await N().yaz(TM, TID, 'payda eşitle\nkesir :: pay / payda');
      expect(N().hepsi().map(x => [x.topic.id, x.kart])).toEqual([[TID, 1]]);
      h = String(await R.Screens.ogren.render());
      expect(h).toContain('Notlarım');
      expect(h).toContain('data-route="anlatim" data-subject="' + TM + '" data-topic="' + TID + '"');
    });
  });
})();
