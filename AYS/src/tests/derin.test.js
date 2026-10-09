/* Konu derinleştirme (data/derin-*.js, core/ogren.js). Kanıtladığı sözler:
     1. Her derin kayıt gerçek bir konuya aittir ve biçimi tutar: 2–5
        kazanım, geçerli ve önce gelen ön koşullar, 2–4 seviyeli örnek,
        2–4 kalıp, 2–4 hata; işaretler kapalı, çift boşluk yok.
     2. Derin sorular ÖSYM biçimindedir: beş farklı seçenek, A–E tek doğru,
        orta ya da ileri seviye, ipucu ve çözüm; doğru harfler dağılır.
     3. Bitmiş derslerde her konunun derin kaydı var: en az 3 örnek, 4 soru.
     4. Derin sorular konunun temel sorularının ARDINA eklenir; seviye
        temel/orta/ileri döner; kayıtlı cevapların sırası kaymaz.
     5. İpucu açıldıktan sonra verilen cevap «ipucuyla» yazılır; ekran
        seviye rozetini, ipucunu ve derin blokları gösterir.
     6. Karma testte «sınav tarzı» yalnız orta ve ileri soruları alır. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  /* Derinleştirmesi bitmiş dersler; yenisi bitince buraya eklenir. */
  const TAM = ['tyt-matematik', 'ayt-matematik', 'ayt-fizik', 'ayt-kimya', 'ayt-biyoloji'];
  const HARF = ['A', 'B', 'C', 'D', 'E'];
  const SEV = ['temel', 'orta', 'ileri'];
  const dizi = x => x == null ? [] : Array.isArray(x) ? x : [x];
  function metin(k, ad, m, bozuk){
    const s = String(m == null ? '' : m);
    if(!s.trim()) bozuk.push(k + ' ' + ad + ': boş');
    if(/ {2,}/.test(s)) bozuk.push(k + ' ' + ad + ': çift boşluk');
    if(/\*\*|[\^_]\{/.test(R.Ogren.duzMetin(s))) bozuk.push(k + ' ' + ad + ': işaret açılmadı');
  }
  const aralik = (l, a, b) => Array.isArray(l) && l.length >= a && l.length <= b;

  describe('Konu derinleştirme', () => {
    it('her kayıt gerçek bir konuya ait ve biçimi tutar', () => {
      const sira = R.Ogren.konular().map(x => x.topic.id);
      const dersOf = id => (R.Ogren.konuyuBul(id).subject || {}).id;
      const bozuk = [];
      Object.keys(R.KONU_DERIN).forEach(k => {
        const d = R.KONU_DERIN[k];
        if(sira.indexOf(k) < 0){ bozuk.push(k + ': konu yok'); return; }
        if(!aralik(d.kazanim, 2, 5)) bozuk.push(k + ': kazanım sayısı');
        dizi(d.kazanim).forEach(m => metin(k, 'kazanım', m, bozuk));
        if(!aralik(d.onKosul, 0, 3)) bozuk.push(k + ': ön koşul sayısı');
        dizi(d.onKosul).forEach(o => {
          if(sira.indexOf(o) < 0) bozuk.push(k + ': ön koşul yok ' + o);
          /* Aynı dersteki ön koşul önce gelir: öğrenme yolu geriye dönmez. */
          else if(dersOf(o) === dersOf(k) && sira.indexOf(o) >= sira.indexOf(k)) bozuk.push(k + ': ön koşul sonra geliyor ' + o);
        });
        if(!aralik(d.ornekler, 2, 4)) bozuk.push(k + ': örnek sayısı');
        dizi(d.ornekler).forEach((o, i) => {
          if(SEV.indexOf(o.seviye) < 0) bozuk.push(k + ' örnek ' + (i + 1) + ': seviye');
          metin(k, 'örnek ' + (i + 1), o.soru, bozuk);
          if(!dizi(o.cozum).length) bozuk.push(k + ' örnek ' + (i + 1) + ': çözüm yok');
          dizi(o.cozum).forEach(c => metin(k, 'örnek çözüm', c, bozuk));
        });
        if(!aralik(d.kaliplar, 2, 4)) bozuk.push(k + ': kalıp sayısı');
        if(!aralik(d.hatalar, 2, 4)) bozuk.push(k + ': hata sayısı');
        dizi(d.kaliplar).concat(dizi(d.hatalar)).forEach(m => metin(k, 'kalıp/hata', m, bozuk));
      });
      expect(bozuk).toEqual([]);
    });

    it('derin sorular ÖSYM biçiminde; seviyeli, ipuçlu, çözümlü', () => {
      const bozuk = [];
      Object.keys(R.KONU_DERIN).forEach(k => {
        const l = R.KONU_DERIN[k].sorular;
        if(!aralik(l, 2, 8)) bozuk.push(k + ': soru sayısı');
        dizi(l).forEach((q, i) => {
          const ad = 'derin soru ' + (i + 1);
          metin(k, ad, q.soru, bozuk);
          if(!Array.isArray(q.sec) || q.sec.length !== 5) bozuk.push(k + ' ' + ad + ': beş seçenek değil');
          else{
            if(new Set(q.sec.map(x => String(x).trim())).size !== 5) bozuk.push(k + ' ' + ad + ': aynı seçenek iki kez');
            q.sec.forEach(x => metin(k, ad + ' seçenek', x, bozuk));
          }
          if(HARF.indexOf(q.dogru) < 0) bozuk.push(k + ' ' + ad + ': doğru harf');
          if(['orta', 'ileri'].indexOf(q.seviye) < 0) bozuk.push(k + ' ' + ad + ': seviye');
          metin(k, ad + ' ipucu', q.ipucu, bozuk);
          if(!dizi(q.cozum).length) bozuk.push(k + ' ' + ad + ': çözüm yok');
          dizi(q.cozum).forEach(c => metin(k, ad + ' çözüm', c, bozuk));
        });
      });
      expect(bozuk).toEqual([]);
    });

    it('derin soruların doğru harfleri derste dağılır', () => {
      const yigin = [];
      R.SUBJECTS.forEach(s => {
        const say = { A:0, B:0, C:0, D:0, E:0 };
        let n = 0;
        s.topics.forEach(t => (((R.KONU_DERIN || {})[t.id] || {}).sorular || []).forEach(q => { say[q.dogru]++; n++; }));
        if(n < 20) return;
        HARF.forEach(h => { if(say[h] / n > 0.32 || say[h] / n < 0.1) yigin.push(s.id + ': ' + h + ' ' + say[h] + '/' + n); });
      });
      expect(yigin).toEqual([]);
    });

    it('bitmiş derslerde her konunun derin kaydı var', () => {
      const eksik = [];
      TAM.forEach(sid => R.SUBJECTS.find(s => s.id === sid).topics.forEach(t => {
        const d = R.KONU_DERIN[t.id];
        if(!d || dizi(d.ornekler).length < 3 || dizi(d.sorular).length < 4) eksik.push(t.id);
      }));
      expect(eksik).toEqual([]);
    });

    it('derin sorular temel soruların ardına eklenir; seviye temel/orta/ileri', () => {
      const t = 'tm-05', taban = R.Ogren.tabanSorular(t), hepsi = R.Ogren.sorular(t), d = R.KONU_DERIN[t];
      expect(hepsi.length).toBe(taban.length + d.sorular.length);
      expect(hepsi[0]).toBe(taban[0]);
      expect(hepsi[taban.length]).toBe(d.sorular[0]);
      expect(R.Ogren.seviye(t, 0)).toBe('temel');
      expect(R.Ogren.seviye(t, taban.length)).toBe(d.sorular[0].seviye);
      /* Derin kaydı olmayan konuda yalnız temel sorular. */
      const eski = R.KONU_DERIN[t];
      delete R.KONU_DERIN[t];
      try{ expect(R.Ogren.sorular(t)).toBe(taban); }finally{ R.KONU_DERIN[t] = eski; }
    });

    it('ipucu: açıldıktan sonraki cevap «ipucuyla» yazılır; ekran rozet, ipucu ve derin blokları gösterir', async () => {
      resetState();
      const s = R.SUBJECTS.find(x => x.id === 'tyt-matematik'), t = 'tm-05';
      const n = R.Ogren.tabanSorular(t).length, q = R.Ogren.sorular(t)[n];
      const eski = R.App.render;
      R.App.render = () => {};
      try{
        await R.Ogren.sec(s.id, t);
        R.S.ui.ogrenKip = 'konu';
        R.S.ui.ogrenSoru = n;
        let h = String(await R.Screens.sorular.render());
        expect(h).toContain('ogr-seviye is-' + q.seviye);
        expect(h).toContain('data-act="soru-ipucu"');
        await R.Screens.sorular.handle['soru-ipucu']({ dataset:{ ip:'konu:' + t + '#' + n } });
        h = String(await R.Screens.sorular.render());
        expect(h).toContain('İpucu:');
        await R.Screens.sorular.handle['soru-cevap']({ dataset:{ harf:q.dogru } });
        expect(R.Ogren.cevaplar(s.id, t)[n].ip).toBe(true);
        h = String(await R.Screens.sorular.render());
        expect(h).toContain('Doğru · ipucuyla');
        /* İpucu açılmadan verilen cevapta işaret yok. */
        R.S.ui.ipucu = null;
        await R.Screens.sorular.handle['soru-git']({ dataset:{ i:String(n + 1) } });
        await R.Screens.sorular.handle['soru-cevap']({ dataset:{ harf:'A' } });
        expect(R.Ogren.cevaplar(s.id, t)[n + 1].ip).toBeUndefined();
        /* Anlatımda derin bloklar. */
        h = String(await R.Screens.anlatim.render());
        expect(h).toContain('Bu konunun sonunda');
        expect(h).toContain('Çözümlü örnekler');
        expect(h).toContain('<summary>Çözümü göster</summary>');
        expect(h).toContain('Sınavda nasıl sorulur');
        expect(h).toContain('Sık yapılan hatalar');
        expect(h).toContain('Önce bunları bil');
      }finally{ R.App.render = eski; }
    });

    it('karma test: «sınav tarzı» yalnız orta ve ileri soruları alır', async () => {
      resetState();
      await R.OgrenTest.yukle();
      const hepsi = R.OgrenTest.havuz({ ders:'tyt-matematik', konular:'hepsi' });
      const sinav = R.OgrenTest.havuz({ ders:'tyt-matematik', konular:'hepsi', seviye:'sinav' });
      expect(sinav.length).toBe(R.SUBJECTS.find(x => x.id === 'tyt-matematik').topics
        .reduce((a, t) => a + ((R.KONU_DERIN[t.id] || {}).sorular || []).length, 0));
      expect(sinav.length < hepsi.length).toBe(true);
      const r = await R.OgrenTest.baslat({ ders:'tyt-matematik', konular:'hepsi', seviye:'sinav' }, 10);
      expect(r.ok).toBe(true);
      expect(R.OgrenTest.aktif().kapsam.seviye).toBe('sinav');
      expect(R.OgrenTest.aktif().sorular.every(k => {
        const p = k.split('#');
        return R.Ogren.seviye(p[0], Number(p[1])) !== 'temel';
      })).toBe(true);
      await R.OgrenTest.vazgec();
    });
  });
})();
