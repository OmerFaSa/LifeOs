/* BAM dil ünitesi (core/unite.js, Part 8d). Kanıtladığı sözler: kayıt ESP'nin
   KENDİ koduyla sınanır (dil, yazı sistemi, öğe sayısı, tekrar); ünite yalnız
   kendi dilinde listelenir; onayla kartlar `seed` + `bam` etiketiyle desteye
   girer ve pratik motoru onları kullanır; geri alınınca ünite ve tekrar
   edilmemiş kartlar kalkar; isteğe yalnız dil, düzey, konu gider. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const Un = () => ESP.Unite;
  const RU = [['Привет', 'merhaba'], ['Спасибо', 'teşekkürler'], ['Пожалуйста', 'lütfen'],
    ['До свидания', 'hoşça kal'], ['Нет', 'hayır'], ['Извините', 'affedersiniz'], ['Доброе утро', 'günaydın']];

  function kayit(patch){
    return Object.assign({ id:21, tur:'materyal', baslik:'Rusça A1 · selamlaşma', dogruluk:'dogrulanmadi',
      created_at:'2026-09-24T10:00:00',
      govde:{ tur:'unite', dil:'ru', duzey:'A1', konu:'selamlaşma', uniteler:[
        { baslik:'Selamlaşma', hedef:'Yedi selamlaşma kalıbını düşünmeden kurmak.', gorev:'Bir gün içinden kur.',
          ogeler:RU.map(x => ({ on:x[0], arka:x[1] })).concat([{ on:'Hello', arka:'merhaba' },
            { on:'Привет', arka:'selam' }, { on:'Мир', arka:'Мир' }]) },
        { baslik:'Kısa', hedef:'Beş öğe yetmez, girmemeli.', ogeler:RU.slice(0, 5).map(x => ({ on:x[0] + '!', arka:x[1] })) },
      ] } }, patch || {});
  }

  async function withHkm(kayitlar, fn){
    const eski = window.fetch;
    const cagri = [];
    window.fetch = function(url, opt){
      cagri.push({ url, opt });
      const m = /\/api\/bam\/kayit\/(\d+)$/.exec(url);
      const k = m && kayitlar[m[1]];
      if(m) return Promise.resolve({ status:k ? 200 : 404, json:async () => (k ? { kayit:k } : {}) });
      if(/\/api\/king\/emir$/.test(url)){
        return Promise.resolve({ status:200, json:async () => ({ ok:true, yeni:true, emir:{ id:43 } }) });
      }
      if(/\/take$/.test(url)){
        return Promise.resolve({ status:200, json:async () => ({ intents:kayitlar.__kuyruk || [] }) });
      }
      return Promise.resolve({ status:200, json:async () => ({}) });
    };
    await ESP.Beacon.save({ enabled:true, token:'jeton', url:'http://127.0.0.1:4200' });
    try{ await fn(cagri); }
    finally{
      window.fetch = eski;
      await ESP.Beacon.save({ enabled:false, token:'' });
    }
  }

  describe('BAM dil ünitesi — sınama', () => {
    it('ESP kendi koduyla sınar: yazı sistemi, tekrar, en az altı öğe', () => {
      resetState();
      const s = Un().sina(kayit(), { kayit_id:21 });
      expect(s.ok).toBe(true);
      expect(s.uniteler.length).toBe(1);                 /* 5 öğeli ünite girmez */
      const u = s.uniteler[0];
      expect(u.items.ru.map(x => x.front)).toEqual(RU.map(x => x[0]));
      expect([u.id, u.level, u.band, u.bam.dil, u.bam.dogruluk]).toEqual(['bam-21-0', 1, 'A1', 'ru', 'dogrulanmadi']);
      expect(s.onizleme.uyari.join(' ')).toContain('2 öğe');
      expect(Un().sina(kayit(), { kayit_id:22 }).ok).toBe(false);
      const k = kayit(); k.govde.dil = 'tr';
      expect(Un().sina(k, { kayit_id:21 }).ok).toBe(false);
      expect(Un().yaziTutar('ar', 'مرحبا') && !Un().yaziTutar('en', 'Привет')).toBe(true);
    });

    it('istek yalnız dil, düzey ve konudur', () => {
      expect(Un().istekTemizle({ dil:'ru', duzey:'a2', konu:'yemek' }).unite).toEqual({ dil:'ru', duzey:'A2', konu:'yemek' });
      expect(Un().istekTemizle({ dil:'tr', duzey:'A1', konu:'yemek' }).ok).toBe(false);
      expect(Un().istekTemizle({ dil:'ru', duzey:'Z9', konu:'yemek' }).ok).toBe(false);
    });
  });

  describe('BAM gitar paketi', () => {
    function gitar(){
      return { id:31, tur:'materyal', baslik:'Gitar başlangıç · akor geçişleri', dogruluk:'dogrulanmadi',
        govde:{ tur:'gitar', duzey:'başlangıç', konu:'akor geçişleri', alistirmalar:[
          { ad:'G majör akor geçişi', tur:'technique', ton:'G', ilerleyis:['I', 'V', 'vi', 'IV'],
            baslangic_bpm:60, hedef_bpm:100, not:'Geçişte boşluk kalmasın.' },
          { ad:'12 ölçü blues', tur:'piece', ton:'Em', ilerleyis:['I', 'IV', 'V7'], baslangic_bpm:70, hedef_bpm:110 },
          { ad:'Ters tempo', tur:'technique', baslangic_bpm:120, hedef_bpm:80 },
          { ad:'Uydurma', tur:'technique', ilerleyis:['Q'], baslangic_bpm:60, hedef_bpm:90 },
          { ad:'Dönüşümlü mızrap', tur:'technique', baslangic_bpm:60, hedef_bpm:140 } ] } };
    }

    it('Stüdyo’ya referans tempoyla girer; var olan ad yeniden eklenmez; ölçülen kalır', async () => {
      resetState();
      await ESP.Model.savePiece(ESP.Model.newPiece({ name:'Dönüşümlü mızrap', kind:'technique' }));
      const s = Un().sina(gitar(), { kayit_id:31 });
      expect(s.ok).toBe(true);
      expect(s.pieces.map(p => p.name)).toEqual(['G majör akor geçişi', '12 ölçü blues']);
      const g = s.pieces[0];
      expect([g.kind, g.key, g.startBpm, g.targetBpm, g.targetRef, g.progression.join('-')])
        .toEqual(['technique', 'G', 60, 100, true, 'I-V-vi-IV']);
      expect(s.onizleme.uyari.join(' ')).toContain('2 alıştırma ESP’nin denetimini geçmedi');
      expect(s.onizleme.uyari.join(' ')).toContain('1 alıştırma Stüdyo’da zaten var');
      await withHkm({ 31:gitar() }, async cagri => {
        const r = await Un().uygula({ kayit_id:31 });
        expect(r.ok).toBe(true);
        expect(ESP.S.pieces.filter(p => (p.tags || []).indexOf('bam:31') >= 0).length).toBe(2);
        expect((await Un().uygula({ kayit_id:31 })).error).toContain('zaten');
        /* Üzerinde deneme (ölçüm) olan alıştırma geri almada kalır. */
        const olculen = ESP.S.pieces.find(p => p.name === '12 ölçü blues');
        olculen.attempts = [{ date:'2026-09-24', bpm:70, clean:true }];
        const geri = await Un().geriAl(r.geriAl);
        expect([geri.ok, geri.kalan]).toEqual([true, 1]);
        expect(ESP.S.pieces.filter(p => (p.tags || []).indexOf('bam:31') >= 0).map(p => p.name)).toEqual(['12 ölçü blues']);
        const ist = await Un().iste({ alan:'gitar', duzey:'Başlangıç', konu:'akor geçişleri' });
        expect(ist.ok).toBe(true);
        const b = JSON.parse(cagri.find(c => /king\/emir$/.test(c.url)).opt.body);
        expect(b.govde).toEqual({ unite:{ alan:'gitar', duzey:'başlangıç', konu:'akor geçişleri' } });
      });
    });
  });

  describe('BAM dil ünitesi — HKM ile', () => {
    it('onayla eklenir: kendi dilinde listelenir, kartlar etiketli, pratik çalışır; geri alınır', async () => {
      resetState();
      await withHkm({ 21:kayit() }, async cagri => {
        const r = await Un().uygula({ kayit_id:21 });
        expect(r.ok).toBe(true);
        expect(ESP.Lesson.units('lang', 'ru').some(u => u.id === 'bam-21-0')).toBe(true);
        expect(ESP.Lesson.units('lang', 'en').some(u => u.id === 'bam-21-0')).toBe(false);
        const u = ESP.Lesson.unitOf('lang', 'bam-21-0');
        expect(ESP.Lesson.progress(u, 'ru').added).toBe(7);
        const kart = ESP.S.cards.find(c => c.front === 'Привет');
        expect(['seed', 'bam', 'bam:21', 'unit:bam-21-0'].every(t => kart.tags.indexOf(t) >= 0)).toBe(true);
        expect((await Un().uygula({ kayit_id:21 })).error).toContain('zaten');
        /* Pratik motoru soruyu desteden kurar: model soru yazmadı. */
        const oturum = ESP.Lesson.start('ru', { length:7 });
        expect(oturum.ok).toBe(true);
        const uniteKart = ESP.S.cards.filter(c => c.tags.indexOf('unit:bam-21-0') >= 0);
        const kimlik = uniteKart.map(c => c.id);
        const metinler = uniteKart.map(c => c.front).concat(uniteKart.map(c => c.back));
        expect(oturum.questions.length).toBe(7);
        expect(oturum.questions.every(q => kimlik.indexOf(q.cardId) >= 0)).toBe(true);
        /* Çeldiriciler de aynı desteden: hiçbir şık modelden gelmedi. */
        expect(oturum.questions.every(q => (q.options || []).every(o => metinler.indexOf(o) >= 0))).toBe(true);
        /* Bir kart tekrar edildiyse geri almada kalır. */
        kart.reps = 2;
        const g = await Un().geriAl(r.geriAl);
        expect([g.ok, g.kalan]).toEqual([true, 1]);
        expect(ESP.S.cards.filter(c => (c.tags || []).indexOf('bam:21') >= 0).map(c => c.front)).toEqual(['Привет']);
        expect(ESP.Lesson.units('lang', 'ru').some(u => u.bam)).toBe(false);
        /* İstek King'e yalnız dil, düzey, konuyla gider. */
        const ist = await Un().iste({ dil:'ru', duzey:'A1', konu:'selamlaşma' });
        expect(ist.ok).toBe(true);
        const b = JSON.parse(cagri.find(c => /king\/emir$/.test(c.url)).opt.body);
        expect([b.modul, b.tur]).toEqual(['esp', 'esp.unite']);
        expect(b.govde).toEqual({ unite:{ dil:'ru', duzey:'A1', konu:'selamlaşma' } });
      });
    });

    it('teklif kartı onaydan önce önizler; geçmeyen ünite uygulanamaz', async () => {
      resetState();
      const kotu = kayit({ id:22 });
      kotu.govde.uniteler = [kotu.govde.uniteler[1]];
      const kuyruk = [{ id:9201, kind:'unite.add', note:'not', payload:{ kayit_id:21, baslik:'Rusça A1' } },
        { id:9202, kind:'unite.add', note:'not', payload:{ kayit_id:22, baslik:'Kısa' } }];
      await withHkm({ 21:kayit(), 22:kotu, __kuyruk:kuyruk }, async () => {
        await ESP.Beacon.load();
        const l = await ESP.Beacon.intents();
        const a = l.find(n => n.id === 9201), b = l.find(n => n.id === 9202);
        expect([a.unite.ok, ESP.Beacon.canApply(a)]).toEqual([true, true]);
        expect(a.unite.onizleme.baslik).toContain('Rusça A1');
        expect([b.unite.ok, ESP.Beacon.canApply(b)]).toEqual([false, false]);
        const r = await ESP.Beacon.resolveIntent(a, 'apply');
        expect([r.ok, r.state, !!r.geriAl]).toEqual([true, 'applied', true]);
        await Un().geriAl(r.geriAl);
      });
    });
  });
})();
