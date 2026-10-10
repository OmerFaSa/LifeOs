/* Şekil, tablo, yenilenen soru ve hata bildirimi (core/sekil.js,
   core/ogren.js söz 5, core/ogrentest.js söz 6). Kanıtladığı sözler:
     1. İçerikteki her şekil ve tablo tarifi denetimden geçer: kapalı öğe
        kataloğu, sonlu sayılar, zorunlu «alt» cümlesi, işaretsiz yazı.
     2. Çizim güvenlidir: yazı kaçırılır, bilinmeyen öğe çizilmez, kusurlu
        tarifin yerine alt cümlesi yazılır; SVG role="img" ve aria-label taşır.
     3. Şeklin düz metni kart ön yüzüne, yanlış defterine ve koça gider;
        ekranda şekil paragrafla kök arasına girer.
     4. Yenilenen sorunun eski cevabı konu kaydında, karma test sonucunda,
        Yanlışlarım'da ve yanlış defterinde bu soruya sayılmaz.
     5. Hata bildirimi cevap anahtarını değiştirmez; soru karma test
        havuzundan çıkar; soru yenilenince bildirim kapanır; liste düz
        metne çevrilir. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const O = () => R.Ogren, T = () => R.OgrenTest, SK = () => R.Sekil;
  const TM = 'tyt-matematik', TID = 'tm-05';

  const UCGEN = { w:200, h:140, alt:'ABC üçgeni; A tepede, B sol altta, C sağ altta; B açısı dik.',
    o:[['p', [40, 120, 160, 120, 40, 30]], ['dk', 40, 120, 160, 120, 40, 30], ['t', 40, 18, 'A'], ['t', 30, 130, 'B'],
      ['t', 170, 130, 'C'], ['t', 100, 132, '12 cm', 'k'], ['a', 160, 120, 22, 143, 180, 'v']] };
  const TABLO = { baslik:'Yıllara göre üretim', bas:['Yıl', 'Üretim (ton)'], satir:[['2022', '40'], ['2023', '55']] };

  /* İçerikteki bütün şekil ve tablo tarifleri, nerede durduklarıyla. */
  function butunTarifler(){
    const l = [];
    const ekle = (yer, x) => { if(x && x.sekil) l.push({ yer, tur:'sekil', v:x.sekil }); if(x && x.tablo) l.push({ yer, tur:'tablo', v:x.tablo }); };
    Object.keys(R.KONU_ANLATIM || {}).forEach(k => {
      const a = R.KONU_ANLATIM[k];
      (a.bolumler || []).forEach((b, i) => { ekle(k + ' bölüm ' + (i + 1), b); ekle(k + ' bölüm örneği ' + (i + 1), b.ornek); });
      (a.sorular || []).forEach((q, i) => ekle(k + ' temel soru ' + (i + 1), q));
    });
    Object.keys(R.KONU_DERIN || {}).forEach(k => {
      const d = R.KONU_DERIN[k];
      (d.ornekler || []).forEach((o, i) => ekle(k + ' örnek ' + (i + 1), o));
      (d.sorular || []).forEach((q, i) => ekle(k + ' derin soru ' + (i + 1), q));
    });
    ((R.Paragraf && R.Paragraf.HAVUZ) || []).forEach(q => ekle('paragraf ' + q.id, q));
    return l;
  }

  /* Konunun son derin sorusunu geçici olarak değiştirir. */
  async function geciciSoru(degis, fn){
    const d = O().derin(TID), i = d.sorular.length - 1, eski = d.sorular[i];
    d.sorular[i] = Object.assign({}, eski, degis);
    try{ return await fn(O().tabanSorular(TID).length + i); }finally{ d.sorular[i] = eski; }
  }

  describe('Şekil ve tablo', () => {
    it('içerikteki her şekil ve tablo tarifi denetimden geçer', () => {
      const bozuk = [];
      butunTarifler().forEach(x => {
        const h = x.tur === 'sekil' ? SK().denetle(x.v) : SK().tabloDenetle(x.v);
        h.forEach(m => bozuk.push(x.yer + ': ' + m));
      });
      expect(bozuk).toEqual([]);
    });

    it('çizim: rol, etiket, viewBox; yazı kaçırılır; kusurlu tarif çizilmez', () => {
      const svg = SK().svg(UCGEN);
      expect(SK().denetle(UCGEN)).toEqual([]);
      expect(svg).toContain('role="img"');
      expect(svg).toContain('aria-label="ABC üçgeni');
      expect(svg).toContain('viewBox="0 0 200 140"');
      expect(svg).toContain('<polygon');
      expect(svg).toContain('<path');
      expect(svg).toContain('>12 cm</text>');
      const kotu = { w:200, h:100, alt:'Denemelik bir şekil cümlesi burada.', o:[['t', 10, 10, '<script>x</script>']] };
      expect(SK().denetle(kotu).length > 0).toBe(true);
      expect(SK().svg(kotu)).toContain('Şekil çizilemedi');
      expect(SK().svg(kotu).indexOf('<script>')).toBe(-1);
      expect(SK().denetle({ w:200, h:100, alt:'Bilinmeyen öğe içeren bir şekil.', o:[['foreignObject', 1, 2]] })[0]).toContain('bilinmeyen');
      expect(SK().denetle({ w:200, h:100, alt:'kısa', o:[['c', 0, 0, 10, 10]] })[0]).toContain('alt');
      expect(SK().denetle({ w:200, h:100, alt:'Sonsuz sayı içeren bir şekil cümlesi.', o:[['c', 0, 0, Infinity, 10]] }).length > 0).toBe(true);
      const t = SK().tablo(TABLO);
      expect(t).toContain('<caption>Yıllara göre üretim</caption>');
      expect(t).toContain('<th scope="col">Üretim (ton)</th>');
      expect(SK().tabloDenetle({ bas:['a', 'b'], satir:[['1']] }).length > 0).toBe(true);
    });

    it('düz metin: kart, yanlış defteri ve koç şekli cümlesiyle anlatır; ekranda şekil kökten önce', async () => {
      resetState();
      expect(SK().ekMetni({ sekil:UCGEN, tablo:TABLO })).toBe('[Şekil: ' + UCGEN.alt + '] [Tablo — Yıllara göre üretim: Yıl | Üretim (ton); 2022 | 40; 2023 | 55]');
      await geciciSoru({ sekil:UCGEN, tablo:TABLO, soru:'Şekildeki üçgende C açısı kaç derecedir?' }, async n => {
        const kart = O().kartYuzu(TID, n);
        expect(kart.front).toContain('[Şekil: ABC üçgeni');
        expect(kart.front).toContain('[Tablo — Yıllara göre üretim');
        const e = await O().yanlisaEkle(TM, TID, n, 'A');
        expect(e.soru).toContain('[Şekil: ABC üçgeni');
        const eski = R.App.render;
        R.App.render = () => {};
        try{
          await O().sec(TM, TID);
          R.S.ui.ogrenKip = 'konu';
          R.S.ui.ogrenSoru = n;
          const h = String(await R.Screens.sorular.render());
          const sekil = h.indexOf('<figure class="sekil">'), kok = h.indexOf('Şekildeki üçgende C açısı');
          expect(sekil > 0).toBe(true);
          expect(sekil < kok).toBe(true);
          expect(h).toContain('class="ogr-tablo"');
        }finally{ R.App.render = eski; }
      });
    });
  });

  describe('Yenilenen soru', () => {
    it('eski cevap konu kaydında, Yanlışlarım’da ve defterde bu soruya sayılmaz', async () => {
      resetState();
      await T().yukle();
      const n = O().tabanSorular(TID).length + O().derin(TID).sorular.length - 1;
      const q = O().sorular(TID)[n];
      const yanlis = O().HARFLER.find(h => h !== q.dogru);
      await O().cevapla(TM, TID, n, yanlis);
      await O().yanlisaEkle(TM, TID, n, yanlis);
      expect(!!O().cevaplar(TM, TID)[n]).toBe(true);
      expect(T().yanlislar().some(y => y.k === TID + '#' + n)).toBe(true);
      expect(!!O().deftere(TM, TID, n)).toBe(true);
      /* Sıra: eski cevap → soru yenilenir → yeni cevap. */
      const bekle = () => new Promise(r => setTimeout(r, 5));
      await bekle();
      const yenilendi = new Date().toISOString();
      await bekle();
      await geciciSoru({ yenilendi }, async () => {
        expect(O().cevaplar(TM, TID)[n]).toBeUndefined();
        expect(T().yanlislar().some(y => y.k === TID + '#' + n)).toBe(false);
        expect(O().deftere(TM, TID, n)).toBeNull();
        expect(O().skor(TM, TID).cevaplanan).toBe(0);
        /* Yenilenen soru yeniden cevaplanabilir; yeni cevap kalır. */
        expect((await O().cevapla(TM, TID, n, q.dogru)).ok).toBe(true);
        expect(O().cevaplar(TM, TID)[n].h).toBe(q.dogru);
      });
      expect(O().gecerli({ yenilendi:'2026-10-10T10:00:00Z' }, '2026-10-10T09:00:00Z')).toBe(false);
      expect(O().gecerli({ yenilendi:'2026-10-10T10:00:00Z' }, '2026-10-10T11:00:00Z')).toBe(true);
      expect(O().gecerli({}, '2020-01-01')).toBe(true);
    });

    it('karma test geçmişinde yenilenen soru sonuca sayılmaz', async () => {
      resetState();
      await T().yukle();
      await R.OgrenYolu.okundu(TM, TID, true);
      const r = await T().baslat({ ders:TM, konular:'okunan' }, 10);
      expect(r.ok).toBe(true);
      const a = T().aktif();
      for(let j = 0; j < a.sorular.length; j++){ await T().git(j); const y = T().siradaki(); await T().cevapla(y.sira, y.s.q.dogru); }
      const oz = await T().bitir();
      expect(oz.toplam).toBe(a.sorular.length);
      const hedef = a.sorular[0], i = Number(hedef.split('#')[1]);
      const d = O().derin(TID), n0 = O().tabanSorular(TID).length;
      const liste = i < n0 ? O().anlatim(TID).sorular : d.sorular, j = i < n0 ? i : i - n0, eski = liste[j];
      liste[j] = Object.assign({}, eski, { yenilendi:new Date(Date.now() + 60000).toISOString() });
      try{ expect(T().gecmis()[0].toplam).toBe(a.sorular.length - 1); }finally{ liste[j] = eski; }
    });
  });

  describe('Hata bildirimi', () => {
    it('anahtar değişmez; soru havuzdan çıkar; yenilenince kapanır; liste metne çevrilir', async () => {
      resetState();
      await T().yukle();
      const k = TID + '#0', q = O().sorular(TID)[0], dogru = q.dogru;
      expect(T().havuz({ ders:TM, konular:'hepsi' }).some(x => x.k === k)).toBe(true);
      expect((await T().isaretle(k, '  B de   doğru görünüyor ')).ok).toBe(true);
      expect(T().isaretOf(k).not).toBe('B de doğru görünüyor');
      expect(q.dogru).toBe(dogru);
      expect(T().havuz({ ders:TM, konular:'hepsi' }).some(x => x.k === k)).toBe(false);
      expect(T().isaretliler().map(x => x.k)).toEqual([k]);
      const metin = T().isaretMetni();
      expect(metin).toContain(k);
      expect(metin).toContain('Uygulamadaki cevap: ' + dogru);
      expect(metin).toContain('Not: B de doğru görünüyor');
      /* Depoya yazılır; yeniden yüklenince durur. */
      await T().yukle();
      expect(!!T().isaretOf(k)).toBe(true);
      /* Soru sonradan yenilenirse bildirim kapanır. */
      const liste = O().anlatim(TID).sorular, eski = liste[0];
      liste[0] = Object.assign({}, eski, { yenilendi:new Date(Date.now() + 60000).toISOString() });
      try{ expect(T().isaretOf(k)).toBeNull(); expect(T().isaretliler()).toHaveLength(0); }finally{ liste[0] = eski; }
      await T().isaretKaldir(k);
      expect(T().isaretOf(k)).toBeNull();
      expect((await T().isaretle('yok-99#0', '')).ok).toBe(false);
    });

    it('ekran: çözümden sonra «Hata bildir»; Yanlışlarım’da «Bildirdiğin hatalar»', async () => {
      resetState();
      await T().yukle();
      const eski = R.App.render;
      R.App.render = () => {};
      try{
        await O().sec(TM, TID);
        R.S.ui.ogrenKip = 'konu';
        R.S.ui.ogrenSoru = 0;
        await R.Screens.sorular.handle['soru-cevap']({ dataset:{ harf:O().sorular(TID)[0].dogru } });
        let h = String(await R.Screens.sorular.render());
        expect(h).toContain('data-act="soru-isaret"');
        await T().isaretle(TID + '#0', 'deneme');
        h = String(await R.Screens.sorular.render());
        expect(h).toContain('hata bildirdin');
        R.S.ui.ogrenKip = 'yanlis';
        h = String(await R.Screens.sorular.render());
        expect(h).toContain('Bildirdiğin hatalar');
        expect(h).toContain('data-act="isaret-kopyala"');
      }finally{ R.App.render = eski; }
    });
  });
})();
