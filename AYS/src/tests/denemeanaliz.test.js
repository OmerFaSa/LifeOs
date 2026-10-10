/* Deneme soru analizi (core/denemeanaliz.js, core/sorufoto.js,
   screens/exams.js). Kanıtladığı sözler:
     1. Anahtar ve cevap iki biçimde okunur (yan yana harfler, «1-A 2-C»);
        D/Y/B ve net kodla hesaplanır; iptal soru D/Y/B'ye girmez.
     2. Kayıt kendiliğinden değişmez; «güncelle» önceki sayıları saklar,
        «geri al» birebir geri getirir.
     3. Belirsiz girdi kaydedilmez: soru sayısı, geçersiz harf, eksik ya da
        çift numara; bir test bozuksa hiçbir test yazılmaz.
     4. Konu kapalı katalogdan ve testin dersinden; model konusu «tahmin»,
        elle seçileni model ezmez; bağlı hata kaydının konusu birlikte
        değişir, kullanıcı onu ayrıca değiştirdiyse dokunulmaz.
     5. Model anahtarı görmeden çözer; şık anahtarla kodla karşılaştırılır
        (tutuyor / tutmuyor / karşılaştırılamadı).
     6. Fotoğraf cihazda; görsel olmayan reddedilir; deneme silinince gider.
     7. Hata kaydı tektir; tekrar kartı bir kez açılır.
     8. Yayın karnesi yetersiz veride susar, yeterlide konu payını söyler. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const A = () => R.DenemeAnaliz;
  const ANAHTAR = 'ABCDEABCDEABCD';          // br-fizik: 14 soru
  const CEVAP   = 'ABCDE..CDAABCE';          // 10 D · 2 Y (10, 14) · 2 B (6, 7)

  function deneme(o){
    const ex = R.Test.makeExam(Object.assign({ type:'Branş — AYT Fizik', family:'AYT', kind:'branch', publisher:'Örnek Yayın',
      tests:[{ name:'Fizik', correct:9, wrong:3, blank:2, blankCert:'measured', minutes:null }] }, o || {}));
    ex.templateId = 'br-fizik';
    R.S.exams.push(ex);
    return ex;
  }
  function dom(html){ const k = document.createElement('div'); k.innerHTML = String(html); return k; }
  async function gorsel(){
    const c = document.createElement('canvas'); c.width = 30; c.height = 20;
    c.getContext('2d').fillRect(0, 0, 10, 10);
    return await new Promise(ok => c.toBlob(ok, 'image/png'));
  }
  function modelTaklidi(cevap, meta){
    const eski = { ready:R.Solver.ready, prep:R.Solver.prepareImage, solve:R.Solver.solve };
    const giden = [];
    R.Solver.ready = () => true;
    R.Solver.prepareImage = async () => ({ mime:'image/jpeg', data:'QUJD' });
    R.Solver.solve = async (req) => { giden.push(req);
      return { text:'Soru: …\nÇözüm adımları.', model:'test-model',
        meta:Object.assign({ answer:cevap, subjectId:'ayt-fizik', topicId:'af-12', rawTopic:'' }, meta || {}) }; };
    return { giden, geri:() => { R.Solver.ready = eski.ready; R.Solver.prepareImage = eski.prep; R.Solver.solve = eski.solve; } };
  }

  describe('Deneme soru analizi', () => {
    it('anahtar ve cevap: yan yana ya da numaralı; büyük–küçük harf ve boşluk fark etmez', () => {
      expect(A().ayristir('abcde abcde abcd', 14, 'anahtar')).toEqual({ ok:true, dizi:ANAHTAR });
      const numarali = Array.from(ANAHTAR).map((h, i) => (i + 1) + '-' + h).join(' ');
      expect(A().ayristir(numarali, 14, 'anahtar').dizi).toBe(ANAHTAR);
      expect(A().ayristir('1) A 2) B 3) C 4) D', 4, 'anahtar').dizi).toBe('ABCD');
      expect(A().ayristir('1.A 2.B 3.. 4.D', 4, 'cevap').dizi).toBe('AB.D');
      expect(A().ayristir('1-A 2-B 4-D', 4, 'cevap').dizi).toBe('AB.D');      // yazılmayan numara cevapta boş
      expect(A().ayristir('AB-D_', 5, 'cevap').dizi).toBe('AB.D.');
      expect(A().ayristir('ABC*', 4, 'anahtar').dizi).toBe('ABC*');
    });

    it('belirsiz girdi kaydedilmez ve nedeni söylenir', () => {
      expect(A().ayristir('ABCDE', 14, 'anahtar').hata).toContain('14 soru bekleniyordu, 5');
      expect(A().ayristir('ABCDF', 5, 'anahtar').hata).toContain('«F»');
      expect(A().ayristir('AB.DE', 5, 'anahtar').hata).toContain('iptal');
      expect(A().ayristir('AB*DE', 5, 'cevap').hata).toContain('nokta');
      expect(A().ayristir('1-A 2-B 4-D', 4, 'anahtar').hata).toContain('3');
      expect(A().ayristir('1-A 1-B 2-C 3-D', 3, 'anahtar').hata).toContain('iki kez');
      expect(A().ayristir('1-A 2-B 9-C', 3, 'anahtar').hata).toContain('9. soru yok');
      expect(A().ayristir('', 3, 'anahtar').ok).toBe(false);
    });

    it('karşılaştırma: D/Y/B ve net kodla; iptal soru D/Y/B’ye girmez', () => {
      const s = A().karsilastir(ANAHTAR, CEVAP);
      expect([s.d, s.y, s.b, s.iptal]).toEqual([10, 2, 2, 0]);
      expect(s.net).toBe(R.Model.testNet({ correct:10, wrong:2 }));
      expect(s.sorular.filter(x => x.durum === 'yanlis').map(x => x.no)).toEqual([10, 14]);
      const i = A().karsilastir('ABCDEABCDEABC*', CEVAP);
      expect([i.d, i.y, i.b, i.iptal]).toEqual([10, 1, 2, 1]);
    });

    it('girdiler: bir test bozuksa hiçbiri yazılmaz; ikisi de boşsa test silinir', async () => {
      resetState();
      const ex = deneme();
      const r = await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:'ABC', cevap:CEVAP }]);
      expect(r.ok).toBe(false);
      expect(r.hatalar[0]).toContain('Fizik anahtarı');
      expect(ex.anahtar).toBe(undefined);
      expect((await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:ANAHTAR, cevap:CEVAP }])).ok).toBe(true);
      expect(ex.anahtar.Fizik).toBe(ANAHTAR);
      expect(ex.cevaplar.Fizik).toBe(CEVAP);
      await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:'', cevap:'' }]);
      expect(ex.anahtar.Fizik).toBe(undefined);
    });

    it('kayıt kendiliğinden değişmez; güncelle önceki sayıları saklar, geri al birebir getirir', async () => {
      resetState();
      const ex = deneme();
      await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:ANAHTAR, cevap:CEVAP }]);
      const oz = A().ozet(ex);
      expect(oz.fark).toBe(true);
      expect([ex.tests[0].correct, ex.tests[0].wrong]).toEqual([9, 3]);      // kayıt aynı kaldı
      expect(await A().kaydiGuncelle(ex)).toBe(1);
      expect([ex.tests[0].correct, ex.tests[0].wrong, ex.tests[0].blank]).toEqual([10, 2, 2]);
      expect(A().ozet(ex).fark).toBe(false);
      expect(await A().kaydiGuncelle(ex)).toBe(0);
      expect(await A().geriAl(ex)).toBe(true);
      expect([ex.tests[0].correct, ex.tests[0].wrong, ex.tests[0].blank, ex.tests[0].blankCert]).toEqual([9, 3, 2, 'measured']);
      expect(ex.anahtarOncesi).toBe(undefined);
    });

    it('hata kaydı tektir; tekrar kartı bir kez açılır; boş soru «Boş» yazılır', async () => {
      resetState();
      const ex = deneme();
      await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:ANAHTAR, cevap:CEVAP }]);
      const kartOnce = R.S.cards.length;
      const r = await A().hatayaEkle(ex, 'Fizik#10');
      expect(r.ok && !r.vardi).toBe(true);
      expect(r.err.status).toBe('Yanlış');
      expect(r.err.tag).toBe(null);
      expect([r.err.cevap, r.err.dogruCevap]).toEqual(['A', 'E']);
      expect((await A().hatayaEkle(ex, 'Fizik#10')).vardi).toBe(true);
      expect(R.S.errors.filter(e => e.examId === ex.id).length).toBe(1);
      expect(R.S.cards.length).toBe(kartOnce + 1);
      expect((await A().hatayaEkle(ex, 'Fizik#1')).ok).toBe(false);          // doğru soru
      expect(await A().hepsiniEkle(ex)).toBe(3);
      const bos = R.S.errors.find(e => e.examId === ex.id && e.questionNo === '6');
      expect(bos.status).toBe('Boş');
      expect(bos.cevap).toBe('');
      expect(A().yanlislar(ex).every(x => x.hata)).toBe(true);
    });

    it('konu kapalı katalogdan ve testin dersinden; bağlı hata kaydı birlikte değişir', async () => {
      resetState();
      const ex = deneme();
      await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:ANAHTAR, cevap:CEVAP }]);
      expect((await A().konuYaz(ex, 'Fizik#10', 'tyt-turkce::tr-01', 'elle')).ok).toBe(false);
      expect((await A().konuYaz(ex, 'Fizik#10', 'ayt-fizik::yok', 'elle')).ok).toBe(false);
      await A().hatayaEkle(ex, 'Fizik#10');
      expect((await A().konuYaz(ex, 'Fizik#10', 'ayt-fizik::af-12', 'elle')).ok).toBe(true);
      expect(ex.soruAnaliz['Fizik#10'].konuKaynak).toBe('elle');
      const err = A().hataOf(ex, 'Fizik', 10);
      expect([err.topicId, err.subjectId]).toEqual(['af-12', 'ayt-fizik']);
      /* Kullanıcı hata kaydının konusunu ayrıca değiştirirse analiz ona dokunmaz. */
      err.topicRef = 'ayt-fizik::af-11'; err.topicId = 'af-11';
      await A().konuYaz(ex, 'Fizik#10', 'ayt-fizik::af-13', 'elle');
      expect(A().hataOf(ex, 'Fizik', 10).topicId).toBe('af-11');
      expect(A().dersler('Matematik', 'TYT')).toEqual(['tyt-matematik']);
      expect(A().dersler('Matematik', 'AYT')).toEqual(['ayt-matematik']);
      expect(A().dersler('Fen Bilimleri', 'TYT')).toEqual(['tyt-fen']);
    });

    it('fotoğraf cihazda: görsel olmayan reddedilir; kaydedilen okunur, önekle silinir', async () => {
      const F = R.SoruFoto;
      expect((await F.kaydet('deneme:t1:Fizik#1', { type:'text/plain' })).ok).toBe(false);
      const r = await F.kaydet('deneme:t1:Fizik#1', await gorsel());
      expect(r.ok).toBe(true);
      expect(F.url('deneme:t1:Fizik#1')).toContain('blob:');
      expect((await F.al('deneme:t1:Fizik#1')).type).toBe('image/jpeg');
      await F.kaydet('deneme:t2:Fizik#1', await gorsel());
      expect(await F.onekSil('deneme:t1:')).toBe(1);
      expect(F.url('deneme:t1:Fizik#1')).toBe(null);
      expect(F.url('deneme:t2:Fizik#1')).toContain('blob:');
      await F.onekSil('deneme:t2:');
    });

    it('çözdürme: fotoğrafsız ve modelsiz dürüstçe söyler; model anahtarı görmez, şık anahtarla karşılaştırılır', async () => {
      resetState();
      const ex = deneme();
      await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:ANAHTAR, cevap:CEVAP }]);
      expect((await A().coz(ex, 'Fizik#10')).note).toContain('fotoğraf');
      await R.SoruFoto.kaydet(A().sahip(ex, 'Fizik#10'), await gorsel());
      await R.SoruFoto.kaydet(A().sahip(ex, 'Fizik#14'), await gorsel());
      const eskiReady = R.Solver.ready;
      R.Solver.ready = () => false;
      try{ expect((await A().coz(ex, 'Fizik#10')).note).toContain('model'); }finally{ R.Solver.ready = eskiReady; }

      let t = modelTaklidi('E');                                           // 10. sorunun anahtarı E
      try{
        const r = await A().coz(ex, 'Fizik#10');
        expect([r.ok, r.tutar, r.harf, r.dogru]).toEqual([true, true, 'E', 'E']);
        expect(t.giden[0].note.indexOf('anahtar') < 0).toBe(true);
        expect(t.giden[0].image.data).toBe('QUJD');
        expect(ex.soruAnaliz['Fizik#10'].konuKaynak).toBe('tahmin');
        expect(ex.soruAnaliz['Fizik#10'].topicRef).toBe('ayt-fizik::af-12');
      }finally{ t.geri(); }

      t = modelTaklidi('B şıkkı', { subjectId:'tyt-turkce', topicId:'tr-01' }); // 14. sorunun anahtarı D
      try{
        const r = await A().coz(ex, 'Fizik#14');
        expect([r.tutar, r.harf]).toEqual([false, 'B']);
        expect(r.konuNotu).toContain('başka bir dersten');
        expect(ex.soruAnaliz['Fizik#14'].topicRef).toBe(undefined);
      }finally{ t.geri(); }

      await A().konuYaz(ex, 'Fizik#10', 'ayt-fizik::af-11', 'elle');
      t = modelTaklidi('sonuç 12 newton');
      try{
        const r = await A().coz(ex, 'Fizik#10');
        expect(r.tutar).toBe(null);                                         // şık bildirilmedi
        expect(ex.soruAnaliz['Fizik#10'].topicRef).toBe('ayt-fizik::af-11'); // elle seçilen ezilmedi
      }finally{ t.geri(); }
      await R.SoruFoto.onekSil('deneme:' + ex.id + ':');
    });

    it('yayın karnesi: yetersiz veride susar; yeterlide konu payını ve öteki yayınları söyler', () => {
      resetState();
      const ex = deneme();
      const hata = (yayin, topicId, i) => ({ id:'h' + yayin + i, examId:ex.id, publisher:yayin,
        subjectId:'ayt-fizik', topicId, topic:topicId, topicRef:'ayt-fizik::' + topicId });
      R.S.errors = [hata('Örnek Yayın', 'af-12', 1), hata('Örnek Yayın', 'af-12', 2)];
      let k = A().yayinKarnesi('örnek  yayın');
      expect([k.deneme, k.konulu, k.yeterli]).toEqual([1, 2, false]);
      R.S.errors = R.S.errors.concat([hata('Örnek Yayın', 'af-12', 3), hata('Örnek Yayın', 'af-11', 4), hata('Örnek Yayın', 'af-11', 5),
        hata('Başka', 'af-12', 6), hata('Başka', 'af-01', 7), hata('Başka', 'af-01', 8), hata('Başka', 'af-01', 9)]);
      k = A().yayinKarnesi('Örnek Yayın');
      expect(k.yeterli).toBe(true);
      expect(k.konular.map(x => [x.topicId, x.n, x.pay])).toEqual([['af-12', 3, 60], ['af-11', 2, 40]]);
      expect(k.konular[0].otekiPay).toBe(null);                             // öteki yayınlarda 4 < 5 hata
      R.S.errors.push(hata('Başka', 'af-12', 10));
      expect(A().yayinKarnesi('Örnek Yayın').konular[0].otekiPay).toBe(40);
    });

    it('ekran: anahtarsız deneme boş durum; anahtarlıda yanlışlar, fark ve güncelle; silinen denemenin fotoğrafı gider', async () => {
      resetState();
      const ex = deneme();
      R.S.ui.examOpen = ex.id;
      let k = dom(await R.Screens.exams.render());
      expect(k.textContent).toContain('Soru analizi');
      expect(k.querySelector('[data-act="da-giris"]') !== null).toBe(true);
      await A().girdileriYaz(ex, [{ test:'Fizik', anahtar:ANAHTAR, cevap:CEVAP }]);
      k = dom(await R.Screens.exams.render());
      expect(k.querySelectorAll('.dsoru').length).toBe(4);
      expect(k.querySelector('[data-act="da-guncelle"]') !== null).toBe(true);
      expect(k.querySelector('input[data-change="da-foto"][data-key="Fizik#10"]') !== null).toBe(true);
      expect(k.textContent).toContain('Yayın karnesi');
      await R.SoruFoto.kaydet(A().sahip(ex, 'Fizik#10'), await gorsel());
      const eski = R.UI.confirmSheet;
      let silme = null;
      R.UI.confirmSheet = (b, m, f) => { silme = f(); };
      try{ await R.Screens.exams.handle['delete-exam']({ dataset:{ id:ex.id } }); await silme; }
      finally{ R.UI.confirmSheet = eski; }
      expect(R.SoruFoto.url(A().sahip(ex, 'Fizik#10'))).toBe(null);
    });
  });
})();
