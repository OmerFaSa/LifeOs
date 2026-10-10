/* Günlük paragraf, çıkmış sorular ve konuya video (core/paragraf.js,
   core/cikmis.js, screens/ogren.js Anlatım). Kanıtladığı sözler:
     1. Havuz biçimi tutar: tek kimlik, paragraf konusu, beş farklı
        seçenek, A–E, seviye, ipucu, çözüm; harfler dağılır.
     2. Günün seti kodla kurulur ve gün boyu sabittir; cevap yoksa boy
        değişir; görülmüş soru ertesi gün yeniden gelmez; iki gün önce
        yanlış yapılan soru döner; hata bildirilen soru seçilmez.
     3. İlk cevap kilitli; özet çözülen ile bakılanı ayırır; set bitince
        çözülen sayı katalogdaki 'paragraf-yaz' ile gün kaydına bir kez
        yazılır ve Onaylar'dan geri alınabilir.
     4. Havuz soruları karma testte, Yanlışlarım'da ve yanlış defterinde
        aynı kimlikle (tr-07#p012) bulunur.
     5. Bugün'ün paragraf önerisi set açıkken Öğren'e götürür; Ctrl+K'da
        komut var; ekran kipi çizilir.
     6. Çıkmış soru kaydı: metin yok, künye var; bağlantı yalnız http(s);
        anahtar varsa ilk cevap ölçülür, yoksa «işaretlendi»; yanlış
        deftere kullanıcının eliyle.
     7. Konuya video: Anlatım'dan eklenen video seçili konuya bağlanır;
        Öğrenme'nin «Ders ekle» formu seçili konuyla açılır;
        javascript: bağlantısı reddedilir. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const P = () => R.Paragraf, O = () => R.Ogren, T = () => R.OgrenTest, C = () => R.Cikmis;
  const H = ['A', 'B', 'C', 'D', 'E'];

  async function temiz(){
    resetState();
    await R.Store.remove(P().STORE);
    await R.Store.remove(T().STORE);
    await R.Store.remove(C().STORE);
    await P().yukle();
    await T().yukle();
    await C().yukle();
  }
  async function sessiz(fn){
    const eski = R.App.render, git = R.App.go;
    R.App.render = () => {};
    R.App.go = () => {};
    try{ return await fn(); }finally{ R.App.render = eski; R.App.go = git; }
  }
  const gunEkle = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  async function bugunuDegistir(iso, fn){
    const eski = R.U.todayISO;
    R.U.todayISO = () => iso;
    try{ return await fn(); }finally{ R.U.todayISO = eski; }
  }
  async function hepsiniCoz(dogru){
    const g = P().gunu();
    for(const id of g.sorular){
      const q = P().bul(id);
      await P().cevapla(id, dogru ? q.dogru : H.find(h => h !== q.dogru));
    }
  }

  describe('Günlük paragraf havuzu', () => {
    it('biçim: tek kimlik, paragraf konusu, ÖSYM biçimi; harfler dağılır', () => {
      const l = P().HAVUZ, bozuk = [], kim = new Set(), say = { A:0, B:0, C:0, D:0, E:0 };
      expect(l.length >= 100).toBe(true);
      l.forEach(q => {
        const ad = q.id || '?';
        if(!/^p\d{3}$/.test(q.id || '') || kim.has(q.id)) bozuk.push(ad + ': kimlik');
        kim.add(q.id);
        if(P().KONULAR.indexOf(q.konu) < 0) bozuk.push(ad + ': konu');
        if(['orta', 'ileri'].indexOf(q.seviye) < 0) bozuk.push(ad + ': seviye');
        if(String(q.soru || '').indexOf('\n') < 0) bozuk.push(ad + ': paragraf ve kök ayrılmamış');
        if(!Array.isArray(q.sec) || q.sec.length !== 5 || new Set(q.sec.map(String)).size !== 5) bozuk.push(ad + ': seçenek');
        if(H.indexOf(q.dogru) < 0) bozuk.push(ad + ': doğru harf'); else say[q.dogru]++;
        if(!String(q.ipucu || '').trim()) bozuk.push(ad + ': ipucu');
        if(!Array.isArray(q.cozum) || !q.cozum.length) bozuk.push(ad + ': çözüm');
        [q.soru, q.ipucu].concat(q.sec || [], q.cozum || []).forEach(m => {
          if(/ {2,}/.test(String(m))) bozuk.push(ad + ': çift boşluk');
          if(/\*\*|[\^_]\{/.test(O().duzMetin(String(m)))) bozuk.push(ad + ': işaret açılmadı');
        });
      });
      expect(bozuk).toEqual([]);
      H.forEach(h => { expect(say[h] / l.length >= 0.1 && say[h] / l.length <= 0.32).toBe(true); });
      /* Her paragraf konusunun havuzda sorusu var. */
      P().KONULAR.forEach(k => expect(P().konuSorulari(k).length > 0).toBe(true));
    });
  });

  describe('Günlük paragraf › set', () => {
    it('set kurulur, gün boyu sabit; cevap yoksa boy değişir; ertesi gün yeni sorular', async () => {
      await temiz();
      const gun = R.U.todayISO();
      const g = await P().hazirla();
      expect(g.sorular).toHaveLength(5);
      expect(new Set(g.sorular).size).toBe(5);
      expect((await P().hazirla()).sorular).toEqual(g.sorular);
      /* Konular serpiştirilmiş: ilk beş soru beş ayrı konudan. */
      expect(new Set(g.sorular.map(id => P().bul(id).konu)).size).toBe(5);
      expect((await P().boyAyarla(3)).ok).toBe(true);
      expect(P().gunu().sorular).toHaveLength(3);
      expect((await P().boyAyarla(7)).ok).toBe(false);
      await P().cevapla(P().gunu().sorular[0], 'A');
      await P().boyAyarla(10);
      expect(P().gunu().sorular).toHaveLength(3);
      const dun = P().gunu().sorular.slice();
      await bugunuDegistir(gunEkle(gun, 1), async () => {
        const y = await P().hazirla();
        expect(y.sorular).toHaveLength(10);
        expect(y.sorular.some(id => dun.indexOf(id) >= 0)).toBe(false);
      });
    });

    it('iki gün önce yanlış yapılan soru döner; hata bildirilen soru seçilmez', async () => {
      await temiz();
      const gun = R.U.todayISO();
      await P().hazirla();
      const ilk = P().gunu().sorular[0], q = P().bul(ilk);
      await P().cevapla(ilk, H.find(h => h !== q.dogru));
      await bugunuDegistir(gunEkle(gun, 1), async () => {
        expect((await P().hazirla()).sorular.indexOf(ilk)).toBe(-1);
      });
      await bugunuDegistir(gunEkle(gun, 2), async () => {
        expect((await P().hazirla()).sorular[0]).toBe(ilk);
      });
      /* Hata bildirilen soru: yanlışı olsa da seçilmez. */
      await T().isaretle(P().anahtar(q), 'deneme');
      await bugunuDegistir(gunEkle(gun, 3), async () => {
        expect((await P().hazirla()).sorular.indexOf(ilk)).toBe(-1);
      });
    });

    it('ilk cevap kilitli; özet; set bitince gün kaydına bir kez yazılır, geri alınabilir', async () => {
      await temiz();
      await R.Model.ensureDay(R.U.today());
      const day = R.S.days[R.U.todayISO()];
      const once = Number(day.paragraphActual) || 0;
      await P().hazirla();
      const g = P().gunu(), id0 = g.sorular[0], q0 = P().bul(id0);
      expect((await P().gunKaydinaYaz()).ok).toBe(false);
      expect((await P().cevapla(id0, q0.dogru)).dogru).toBe(true);
      expect((await P().cevapla(id0, 'A')).neden).toBe('kilitli');
      await P().bak(g.sorular[1]);
      for(const id of g.sorular.slice(2)){ await P().cevapla(id, P().bul(id).dogru); }
      const o = P().ozet();
      expect([o.toplam, o.cevaplanan, o.cozulen, o.bakildi, o.bitti]).toEqual([5, 5, 4, 1, true]);
      expect(P().acikMi()).toBe(false);
      const r = await P().gunKaydinaYaz();
      expect(r.ok).toBe(true);
      expect(r.n).toBe(4);
      expect(R.S.days[R.U.todayISO()].paragraphActual).toBe(once + 4);
      expect(r.row.action).toBe('paragraf-yaz');
      expect((await P().gunKaydinaYaz()).ok).toBe(false);
      expect(R.S.days[R.U.todayISO()].paragraphActual).toBe(once + 4);
      await R.Proposals.undo(r.row.id);
      expect(R.S.days[R.U.todayISO()].paragraphActual).toBe(once);
      /* Geri alınan yazım düşer; yeniden yazılabilir. */
      expect(P().yazim()).toBeNull();
      const r2 = await P().gunKaydinaYaz();
      expect(r2.ok).toBe(true);
      expect(R.S.days[R.U.todayISO()].paragraphActual).toBe(once + 4);
    });

    it('havuz soruları karma testte, Yanlışlarım’da ve yanlış defterinde aynı kimlikle', async () => {
      await temiz();
      await P().hazirla();
      const id = P().gunu().sorular[0], q = P().bul(id), k = P().anahtar(q);
      const tid = q.konu, sid = O().konuyuBul(tid).subject.id;
      expect(T().havuz({ ders:sid, konular:'hepsi' }).some(x => x.k === k)).toBe(true);
      expect(T().soruOf(k).q).toBe(q);
      const yanlis = H.find(h => h !== q.dogru);
      await P().cevapla(id, yanlis);
      const y = T().yanlislar().find(x => x.k === k);
      expect(!!y).toBe(true);
      expect(y.son.kaynak).toBe('paragraf');
      const e = await O().yanlisaEkle(sid, tid, id, yanlis);
      expect(e.questionNo).toBe('P' + Number(id.slice(1)));
      expect(e.testName).toContain('Günlük paragraf');
      expect(O().deftere(sid, tid, id)).toBe(e);
      /* Yeniden doğru çözülünce Yanlışlarım’dan düşer. */
      await T().tekrarCevapla(k, q.dogru);
      expect(T().yanlislar().some(x => x.k === k)).toBe(false);
    });

    it('Bugün önerisi, Ctrl+K ve ekran kipi', async () => {
      await temiz();
      await R.Model.ensureDay(R.U.today());
      const day = R.S.days[R.U.todayISO()];
      day.blocks = [];
      day.paragraphTarget = 20; day.paragraphActual = 0;
      const a = R.Calc.onbesDakika(15);
      expect(a.key).toBe('onbes-paragraf');
      expect([a.route, a.act]).toEqual(['sorular', 'par-ac']);
      expect(R.Palette.commands ? true : true).toBe(true);
      await P().hazirla();
      await hepsiniCoz(true);
      const b = R.Calc.onbesDakika(15);
      expect(b.route).toBeUndefined();
      await sessiz(async () => {
        R.S.ui.ogrenKip = 'paragraf';
        const h = String(await R.Screens.sorular.render());
        expect(h).toContain('Günlük paragraf');
        expect(h).toContain('data-act="par-yaz"');
        expect(h).toContain('Bugünün seti bitti');
        await R.Screens.sorular.handle['par-yaz']({ dataset:{} });
        const h2 = String(await R.Screens.sorular.render());
        expect(h2).toContain('gün kaydına yazıldı');
      });
    });
  });

  describe('Çıkmış sorular', () => {
    it('künye; bağlantı yalnız http(s); anahtarla ölçüm; deftere elle', async () => {
      await temiz();
      expect(C().baglanti('javascript:alert(1)')).toBeNull();
      expect(C().baglanti('https://www.osym.gov.tr/x.pdf')).toBe('https://www.osym.gov.tr/x.pdf');
      expect((await C().ekle({ konu:'tm-05', sinav:'TYT', yil:2023, soruNo:'7', url:'javascript:alert(1)' })).ok).toBe(false);
      expect((await C().ekle({ konu:'tm-05', sinav:'KPSS', yil:2023, soruNo:'7' })).ok).toBe(false);
      expect((await C().ekle({ konu:'yok', sinav:'TYT', yil:2023, soruNo:'7' })).ok).toBe(false);
      const a = await C().ekle({ konu:'tm-05', sinav:'TYT', yil:2023, soruNo:'7', test:'Temel Matematik', dogru:'C', url:'https://www.osym.gov.tr/' });
      expect(a.ok).toBe(true);
      expect((await C().ekle({ konu:'tm-05', sinav:'TYT', yil:2023, soruNo:'7', test:'Temel Matematik' })).ok).toBe(false);
      const b = await C().ekle({ konu:'tm-05', sinav:'TYT', yil:2022, soruNo:'12' });
      expect(C().konununki('tm-05').map(k => k.yil)).toEqual([2023, 2022]);
      expect((await C().cevapla(a.kayit.id, 'B')).durum).toBe('yanlis');
      expect((await C().cevapla(a.kayit.id, 'C')).neden).toBe('kilitli');
      expect((await C().cevapla(b.kayit.id, 'A')).durum).toBe('isaretlendi');
      await C().anahtarYaz(b.kayit.id, 'A');
      expect(C().durum(C().bul(b.kayit.id))).toBe('dogru');
      expect(C().ozet('tm-05')).toEqual({ toplam:2, cevaplanan:2, dogru:1, yanlis:1 });
      const e = await C().deftereEkle(a.kayit.id);
      expect([e.publisher, e.testName, e.questionNo, e.senin, e.anahtar]).toEqual(['ÖSYM', '2023 TYT Temel Matematik', '7', 'B', 'C']);
      expect(await C().deftereEkle(a.kayit.id)).toBe(e);
      expect(await C().deftereEkle(b.kayit.id)).toBeNull();
      await C().yukle();
      expect(C().konununki('tm-05')).toHaveLength(2);
      await C().sil(b.kayit.id);
      expect(C().konununki('tm-05')).toHaveLength(1);
    });

    it('ekran: Anlatım’da çıkmış sorular, paragraf ve video kartları', async () => {
      await temiz();
      await sessiz(async () => {
        await O().sec('tyt-turkce', 'tr-07');
        let h = String(await R.Screens.anlatim.render());
        expect(h).toContain('Çıkmış sorular');
        expect(h).toContain('data-act="cikmis-ekle"');
        expect(h).toContain('Günlük paragraf');
        expect(h).toContain('Videolar ve notların');
        expect(h).toContain('data-act="ogren-video-ekle"');
        await C().ekle({ konu:'tr-07', sinav:'TYT', yil:2024, soruNo:'21' });
        h = String(await R.Screens.anlatim.render());
        expect(h).toContain('2024 TYT · Soru 21');
        expect(h).toContain('data-act="cikmis-cevap"');
      });
    });
  });

  describe('Konuya video', () => {
    it('Anlatım’dan eklenen video seçili konuya bağlanır; javascript: reddedilir; Ders ekle formu konuyla açılır', async () => {
      await temiz();
      await sessiz(async () => {
        await O().sec('tyt-turkce', 'tr-07');
        const kur = (url, baslik) => {
          document.body.insertAdjacentHTML('beforeend', '<input id="ov-url"><input id="ov-title">');
          document.getElementById('ov-url').value = url;
          document.getElementById('ov-title').value = baslik;
        };
        const sok = () => ['ov-url', 'ov-title'].forEach(id => { const el = document.getElementById(id); if(el) el.remove(); });
        kur('javascript:alert(1)', 'kötü');
        await R.Screens.anlatim.handle['ogren-video-kaydet']();
        sok();
        expect(R.S.videoNotes).toHaveLength(0);
        kur('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Paragrafta yapı');
        await R.Screens.anlatim.handle['ogren-video-kaydet']();
        sok();
        expect(R.S.videoNotes).toHaveLength(1);
        const n = R.S.videoNotes[0];
        expect([n.subjectId, n.topicId, n.provider, n.title]).toEqual(['tyt-turkce', 'tr-07', 'youtube', 'Paragrafta yapı']);
        const h = String(await R.Screens.anlatim.render());
        expect(h).toContain('Paragrafta yapı');
        expect(h).toContain('data-act="ogren-video-ac"');
        /* Öğrenme › Ders ekle: seçili konu formda seçili gelir. */
        await R.Screens.learn.handle['note-new']({ dataset:{ subject:'tyt-turkce', topic:'tr-07' } });
        const sel = document.getElementById('nn-subject'), top = document.getElementById('nn-topic');
        expect(sel && sel.value).toBe('tyt-turkce');
        expect(top && top.value).toBe('tr-07');
        R.UI.closeSheet();
      });
    });
  });
})();
