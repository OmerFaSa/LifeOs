/* Öğren › Karma test ve Yanlışlarım (core/ogrentest.js). Kanıtladığı sözler:
     1. Havuz yalnız Öğren'in soruları; kapsam ders ve «okuduğum konular»
        ile daralır; 5'ten az soruda test kurulmaz ve nedeni söylenir.
     2. Seçimde aynı soru iki kez yok; aynı konudan iki soru mümkünse ard
        arda gelmez; yarım test depoya yazılır, yeniden yüklenince sürer.
     3. İlk cevap kilitlenir; biten test geçmişe yazılır; boş, yanlış
        sayılmaz; konunun örnek soru kaydı ve konu durumu değişmez.
        «Vazgeç» geçmişe hiçbir şey yazmaz.
     4. Yanlışlarım = son denemesi doğru olmayanlar: konu sorusu, karma
        test ve yeniden çözüm birlikte; yeniden doğru çözülen düşer.
        Doğruluk bugünkü cevap anahtarıyla hesaplanır.
     5. Ekranlar: Sorular'ın üç kipi; karma test baştan sona; Yanlışlarım'da
        yeniden çözüm; karma sorudan yanlış defterine giden harf testinki.
        Konular'da dersler ve süzgeç; «Yanlışı olan» konuyu bulur. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const T = () => R.OgrenTest, O = () => R.Ogren;
  const TM = 'tyt-matematik';

  async function temiz(){
    resetState();
    await T().yukle();
  }
  async function sessiz(fn){
    const eski = R.App.render, git = R.App.go;
    R.App.render = () => {};
    R.App.go = () => {};
    try{ return await fn(); }finally{ R.App.render = eski; R.App.go = git; }
  }
  const tidOf = k => k.split('#')[0];
  /* Testin sıradaki sorusuna doğru (ya da yanlış) cevap. */
  async function cevapVer(dogru){
    const y = T().siradaki();
    const h = dogru ? y.s.q.dogru : O().HARFLER.find(x => x !== y.s.q.dogru);
    await T().cevapla(y.sira, h);
    return h;
  }

  describe('Öğren › Karma test', () => {
    it('havuz: ders ve okunan konular; az soruda test kurulmaz', async () => {
      await temiz();
      const hepsi = T().havuz({ ders:'hepsi', konular:'hepsi' });
      const tm = T().havuz({ ders:TM, konular:'hepsi' });
      expect(hepsi.length > tm.length).toBe(true);
      expect(tm.every(x => O().konuyuBul(x.tid).subject.id === TM)).toBe(true);
      expect(T().havuz({ ders:TM, konular:'okunan' })).toHaveLength(0);
      const r = await T().baslat({ ders:TM, konular:'okunan' }, 10);
      expect([r.ok, r.neden]).toEqual([false, 'az']);
      expect(r.metin).toContain('Okudum');
      expect(T().aktif()).toBeNull();
      await R.OgrenYolu.okundu(TM, 'tm-05', true);
      await R.OgrenYolu.okundu(TM, 'tm-06', true);
      const okunan = T().havuz({ ders:TM, konular:'okunan' });
      expect(okunan.length).toBe(O().sorular('tm-05').length + O().sorular('tm-06').length);
    });

    it('seçim: tekrar yok, aynı konu ard arda gelmez; yarım test yeniden yüklenince sürer', async () => {
      await temiz();
      await R.OgrenYolu.okundu(TM, 'tm-05', true);
      await R.OgrenYolu.okundu(TM, 'tm-06', true);
      const n = T().havuz({ ders:TM, konular:'okunan' }).length;
      const r = await T().baslat({ ders:TM, konular:'okunan' }, 20);
      expect([r.ok, r.n]).toEqual([true, Math.min(n, 20)]);
      const l = T().aktif().sorular;
      expect(new Set(l).size).toBe(l.length);
      let ardArda = 0;
      for(let k = 1; k < l.length; k++) if(tidOf(l[k]) === tidOf(l[k - 1])) ardArda++;
      const a5 = l.filter(k => tidOf(k) === 'tm-05').length, a6 = l.length - a5;
      expect(ardArda <= Math.abs(a5 - a6)).toBe(true);                 // ancak biri tükenince
      /* 10 ve 20 dışındaki boy 10'a döner. */
      await T().vazgec();
      expect((await T().baslat({ ders:'hepsi', konular:'hepsi' }, 7)).n).toBe(10);
      await cevapVer(true);
      await T().git(3);
      const once = JSON.stringify(T().aktif());
      await T().yukle();
      expect(JSON.stringify(T().aktif())).toBe(once);
      expect(T().siradaki().sira).toBe(3);
    });

    it('ölçüm: ilk cevap kalır; boş yanlış değil; konu kaydı değişmez; vazgeç iz bırakmaz', async () => {
      await temiz();
      const st0 = JSON.stringify(R.S.topics);
      await T().baslat({ ders:TM, konular:'hepsi' }, 10);
      const h = await cevapVer(true);
      const y0 = T().siradaki();
      const ikinci = await T().cevapla(y0.sira, O().HARFLER.find(x => x !== h));
      expect([ikinci.ok, ikinci.neden]).toEqual([false, 'kilitli']);
      expect(T().aktif().cevaplar[0].h).toBe(h);
      await T().git(1); await cevapVer(false);
      await T().git(2); await T().bak(2);
      expect(T().say(T().aktif())).toEqual({ toplam:10, cevaplanan:3, dogru:1, yanlis:1, bakildi:1, bos:7 });
      const oz = await T().bitir();
      expect([oz.toplam, oz.dogru, oz.yanlis, oz.bakildi, oz.bos]).toEqual([10, 1, 1, 1, 7]);
      expect(oz.konular.length > 0).toBe(true);
      expect(oz.konular[0].dogru / oz.konular[0].n <= oz.konular[oz.konular.length - 1].dogru / oz.konular[oz.konular.length - 1].n).toBe(true);
      expect(T().aktif()).toBeNull();
      expect(T().gecmis()).toHaveLength(1);
      expect(JSON.stringify(R.S.topics)).toBe(st0);                    // ornek, durum, kapanış aynı
      await T().baslat({ ders:TM, konular:'hepsi' }, 10);
      await cevapVer(false);
      await T().vazgec();
      expect(T().gecmis()).toHaveLength(1);
      await T().yukle();
      expect([T().aktif(), T().gecmis().length]).toEqual([null, 1]);
    });
  });

  describe('Öğren › Yanlışlarım', () => {
    it('son deneme kuralı: konu, test ve yeniden çözüm birlikte; doğru çözülen düşer', async () => {
      await temiz();
      const q0 = O().sorular('tm-05')[0], q1 = O().sorular('tm-05')[1];
      const yanlisHarf = q => O().HARFLER.find(x => x !== q.dogru);
      await O().cevapla(TM, 'tm-05', 0, yanlisHarf(q0));
      await O().bak(TM, 'tm-05', 1);
      await O().cevapla(TM, 'tm-05', 2, O().sorular('tm-05')[2].dogru);
      let l = T().yanlislar();
      expect(l.map(y => y.k).sort()).toEqual(['tm-05#0', 'tm-05#1']);
      expect(l.find(y => y.k === 'tm-05#1').son).toEqual(Object.assign({}, l.find(y => y.k === 'tm-05#1').son, { bak:true, kaynak:'konu' }));
      expect((await T().tekrarCevapla('tm-05#0', q0.dogru)).dogru).toBe(true);
      expect(T().yanlislar().map(y => y.k)).toEqual(['tm-05#1']);
      await T().tekrarCevapla('tm-05#1', yanlisHarf(q1));
      l = T().yanlislar();
      expect([l.length, l[0].son.kaynak, l[0].son.h]).toEqual([1, 'tekrar', yanlisHarf(q1)]);
      /* İlk ölçüm silinmez. */
      expect(O().cevaplar(TM, 'tm-05')[0].h).toBe(yanlisHarf(q0));
      /* Ders süzgeci. */
      expect(T().yanlislar('ayt-matematik')).toHaveLength(0);
      expect(T().yanlislar(TM)).toHaveLength(1);
    });

    it('karma testin yanlışı listeye girer; sonraki doğru deneme çıkarır', async () => {
      await temiz();
      await T().baslat({ ders:TM, konular:'hepsi' }, 10);
      const k = T().siradaki().s.k;
      await cevapVer(false);
      await T().bitir();
      const y = T().yanlislar();
      expect([y.length, y[0].k, y[0].son.kaynak]).toEqual([1, k, 'test']);
      await T().tekrarCevapla(k, T().soruOf(k).q.dogru);
      expect(T().yanlislar()).toHaveLength(0);
    });

    it('doğruluk bugünkü anahtarla: düzeltilen soru eski «doğru»yu taşımaz', async () => {
      await temiz();
      const t = 'tm-05', eski = R.KONU_ANLATIM[t];
      R.KONU_ANLATIM[t] = Object.assign({}, eski, { sorular:[
        { soru:'S?', sec:['1', '2', '3', '4', '5'], dogru:'B', cozum:['ç'] }].concat(eski.sorular.slice(1)) });
      try{
        await O().cevapla(TM, t, 0, 'B');
        expect(T().yanlislar()).toHaveLength(0);
        R.KONU_ANLATIM[t].sorular[0] = Object.assign({}, R.KONU_ANLATIM[t].sorular[0], { dogru:'C' });
        expect(T().yanlislar().map(y => y.k)).toEqual(['tm-05#0']);
      }finally{ R.KONU_ANLATIM[t] = eski; }
    });
  });

  describe('Öğren › Karma ve Yanlışlarım ekranları', () => {
    it('Sorular: üç kip; karma test baştan sona; sonuç ve geçmiş', async () => {
      await temiz();
      await sessiz(async () => {
        const SR = R.Screens.sorular;
        let h = String(await SR.render());
        expect(h).toContain('data-act="sorular-kip"');
        expect(h).toContain('Karma test');
        await SR.handle['sorular-kip']({ dataset:{ tab:'karma' } });
        expect(R.S.ui.ogrenKip).toBe('karma');
        h = String(await SR.render());
        expect(h).toContain('data-act="karma-baslat"');
        expect(h).toContain('Hepsi · ' + T().havuz({ ders:'hepsi', konular:'hepsi' }).length);   // okunan yok → hepsi
        await SR.change['karma-ders']({ value:TM });
        await SR.handle['karma-boy']({ dataset:{ value:'10' } });
        await SR.handle['karma-baslat']();
        expect(T().aktif().sorular).toHaveLength(10);
        h = String(await SR.render());
        expect(h).toContain('data-act="test-cevap" data-harf="A"');
        expect(h).toContain('Soru 1 / 10');
        const y = T().siradaki(), yanlis = O().HARFLER.find(x => x !== y.s.q.dogru);
        await SR.handle['test-cevap']({ dataset:{ harf:yanlis } });
        h = String(await SR.render());
        expect(h).toContain('Yanlış · senin cevabın ' + yanlis + ', doğrusu ' + y.s.q.dogru);
        expect(h).toContain('Konu: ' + y.s.subject.name + ' · ' + y.s.topic.name);
        expect(h).toContain('data-k="' + y.s.k + '"');
        /* Karma sorudan deftere: senin = testteki harf. */
        await SR.handle['soru-defter']({ dataset:{ k:y.s.k, h:yanlis } });
        const e = R.S.errors[R.S.errors.length - 1];
        expect([e.topicId, e.senin, e.anahtar]).toEqual([y.s.topic.id, yanlis, y.s.q.dogru]);
        /* Bitir: cevapsız var → onay ister; onaylanınca sonuç. */
        let onay = null;
        const cs = R.UI.confirmSheet;
        R.UI.confirmSheet = (b, m, fn) => { onay = { m, fn }; };
        try{ await SR.handle['karma-bitir'](); }finally{ R.UI.confirmSheet = cs; }
        expect(onay.m).toContain('9 soru cevapsız');
        await onay.fn();
        expect(T().aktif()).toBeNull();
        h = String(await SR.render());
        expect(h).toContain('Test sonucu');
        expect(h).toContain('data-act="sorular-kip" data-tab="yanlis"');
        expect(h).toContain('Geçmiş testler');
        await SR.handle['karma-yeni']();
        h = String(await SR.render());
        expect(h).toContain('data-act="karma-baslat"');
      });
    });

    it('Yanlışlarım: liste, yeniden çöz, doğru çözülünce düşer', async () => {
      await temiz();
      const q = O().sorular('tm-05')[0], yanlis = O().HARFLER.find(x => x !== q.dogru);
      await O().cevapla(TM, 'tm-05', 0, yanlis);
      await sessiz(async () => {
        const SR = R.Screens.sorular;
        await SR.handle['sorular-kip']({ dataset:{ tab:'yanlis' } });
        let h = String(await SR.render());
        expect(h).toContain('data-act="tekrar-ac" data-k="tm-05#0"');
        expect(h).toContain('cevabın ' + yanlis + ' · konu sorusu');
        await SR.handle['tekrar-ac']({ dataset:{ k:'tm-05#0' } });
        h = String(await SR.render());
        expect(h).toContain('Yeniden çöz');
        expect(h).toContain('data-act="tekrar-cevap" data-harf="A"');
        await SR.handle['tekrar-cevap']({ dataset:{ harf:q.dogru } });
        await SR.handle['tekrar-cevap']({ dataset:{ harf:yanlis } });   // ikinci dokunuş yok sayılır
        expect(R.S.ui.ogrTekrar.h).toBe(q.dogru);
        h = String(await SR.render());
        expect(h).toContain('Yanlışlarım’dan düştü');
        expect(T().yanlislar()).toHaveLength(0);
        await SR.handle['tekrar-kapat']();
        h = String(await SR.render());
        expect(h).toContain('Yanlışın yok');
      });
    });

    it('palet: «Karma test» ve «Yanlışlarım» Sorular’ı o kipte açar', async () => {
      await temiz();
      await sessiz(async () => {
        const c = R.Palette.commands();
        c.find(x => x.label.indexOf('Karma test') === 0).run();
        expect(R.S.ui.ogrenKip).toBe('karma');
        c.find(x => x.label.indexOf('Yanlışlarım') === 0).run();
        expect(R.S.ui.ogrenKip).toBe('yanlis');
      });
    });

    it('Konular: dersler kartı ders seçer; «Yanlışı olan» süzgeci konuyu bulur', async () => {
      await temiz();
      const q = O().sorular('tm-06')[0];
      await O().cevapla(TM, 'tm-06', 0, O().HARFLER.find(x => x !== q.dogru));
      await sessiz(async () => {
        const KS = R.Screens.ogren;
        await KS.handle['ogren-liste-sec']({ dataset:{ subject:TM } });
        let h = String(await KS.render());
        expect(h).toContain('data-act="ogren-liste-sec" data-subject="ayt-biyoloji"');
        expect(h).toContain('Yanlışı olan · 1');
        expect(h).toContain('Yanlışlarım · 1');
        expect(h).toContain('1 yanlış açık');
        await KS.handle['ogren-suzgec']({ dataset:{ f:'yanlis' } });
        h = String(await KS.render());
        expect(h).toContain('data-topic="tm-06"');
        expect(h.split('class="listitem listitem--tap ogr-konu').length - 1).toBe(1);
        await KS.handle['ogren-suzgec']({ dataset:{ f:'tamam' } });
        h = String(await KS.render());
        expect(h).toContain('Bu süzgeçte konu yok.');
      });
    });
  });
})();
