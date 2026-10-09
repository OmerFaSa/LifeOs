/* Öğren çekmecesi (core/ogren.js, screens/ogren.js). Kanıtladığı sözler:
     1. Seçili konu tek: son açılan hatırlanır; ‹ › bir sonraki konuya,
        dersin sonunda öbür derse geçer; uçta durur.
     2. Örnek soruda ilk cevap kalır (kilit); «çözüme bakıldı» ölçüm değildir;
        «Baştan çöz» hepsini siler. Cevap konunun durumunu ve kapanışı
        değiştirmez; öğrenme yolunun «Soru çöz» adımına sayılmaz.
     3. Yanlış kendiliğinden deftere yazılmaz; «Yanlış defterine ekle» bir
        kez ekler.
     4. Bir yama (Okudum, örnek cevap) «yeniden açıldı» konuyu «kapalı»ya
        çevirmez — HATA: setTopicState her yamada kapanışı yeniden
        hesaplıyordu.
     5. Ekranlar: Konular satırı Anlatım'a götürür; Anlatım okutur ve
        «Okudum»u yola yazar; Sorular cevabı gösterir; çekmece kenarda. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const O = () => R.Ogren;
  const TM = () => R.SUBJECTS.find(s => s.id === 'tyt-matematik');

  /* Sınama için sahte içerik: gerçek içerik değişse de test aynı kalır. */
  const SAHTE = { giris:'Giriş cümlesi.', bolumler:[{ baslik:'Bir', metin:['x^{2} ve H_{2}O ve **kalın**.'],
      formul:['a + b = c'], ornek:{ soru:'Örnek?', cozum:['Adım bir.'] }, dikkat:'Dikkat cümlesi.' }],
    sorular:[
      { soru:'Birinci soru?', sec:['1', '2', '3', '4', '5'], dogru:'B', cozum:['Çözüm bir.'] },
      { soru:'İkinci soru?', sec:['a', 'b', 'c', 'd', 'e'], dogru:'E', cozum:['Çözüm iki.'] },
      { soru:'Üçüncü soru?', sec:['k', 'l', 'm', 'n', 'o'], dogru:'A', cozum:['Çözüm üç.'] },
    ] };
  function sahteIcerik(id, fn){
    const eski = R.KONU_ANLATIM[id];
    R.KONU_ANLATIM[id] = SAHTE;
    return Promise.resolve().then(fn).finally(() => { if(eski) R.KONU_ANLATIM[id] = eski; else delete R.KONU_ANLATIM[id]; });
  }
  async function sessiz(fn){
    const eski = R.App.render;
    R.App.render = () => {};
    try{ return await fn(); }finally{ R.App.render = eski; }
  }

  describe('Öğren', () => {
    it('seçili konu tek; son açılan hatırlanır; ‹ › dersler arasında geçer, uçta durur', async () => {
      resetState();
      const l = O().konular();
      expect(l.length).toBe(R.SUBJECTS.reduce((n, s) => n + s.topics.length, 0));
      await O().sec('tyt-matematik', 'tm-04');
      expect([R.S.ui.ogrenDers, R.S.ui.ogrenKonu]).toEqual(['tyt-matematik', 'tm-04']);
      expect(O().sonAcilan().topic.id).toBe('tm-04');
      R.S.ui.ogrenDers = null; R.S.ui.ogrenKonu = null;
      await O().yukle();
      expect(O().secili().topic.id).toBe('tm-04');                       // depodan geri geldi
      const tr = R.SUBJECTS[0], sonTr = tr.topics[tr.topics.length - 1];
      const ileri = O().komsu(tr.id, sonTr.id, 1);
      expect(ileri.subject.id !== tr.id).toBe(true);                     // dersin sonunda öbür derse
      expect(O().komsu(l[0].subject.id, l[0].topic.id, -1)).toBeNull();
      const son = l[l.length - 1];
      expect(O().komsu(son.subject.id, son.topic.id, 1)).toBeNull();
      expect(await O().sec('yok', 'yok')).toBeNull();
    });

    it('ilk cevap kalır; çözüme bakmak ölçüm değil; baştan çöz siler; durum ve yol değişmez', async () => {
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-05');
      await sahteIcerik(t.id, async () => {
        const once = R.Model.topicState(s.id, t.id).state;
        let r = await O().cevapla(s.id, t.id, 0, 'c');
        expect([r.ok, r.dogru]).toEqual([true, false]);
        r = await O().cevapla(s.id, t.id, 0, 'B');                          // kilit
        expect([r.ok, r.neden]).toEqual([false, 'kilitli']);
        expect((await O().cevapla(s.id, t.id, 1, 'E')).dogru).toBe(true);
        expect((await O().cevapla(s.id, t.id, 2, 'Z')).neden).toBe('gecersiz');
        expect((await O().bak(s.id, t.id, 2)).ok).toBe(true);
        expect((await O().cevapla(s.id, t.id, 2, 'A')).neden).toBe('kilitli');
        expect(O().skor(s.id, t.id)).toEqual({ toplam:3, cevaplanan:3, dogru:1 });
        const st = R.Model.topicState(s.id, t.id);
        expect(st.state).toBe(once);                                         // konu durumu değişmedi
        expect(st.first).toBeNull();
        const coz = R.OgrenYolu.adimlar(s.id, t.id).find(a => a.id === 'coz');
        expect(coz.tamam).toBe(false);                                       // yola sayılmadı
        await O().sifirla(s.id, t.id);
        expect(O().skor(s.id, t.id)).toEqual({ toplam:3, cevaplanan:0, dogru:0 });
      });
    });

    it('yanlış kendiliğinden deftere yazılmaz; «ekle» bir kez ekler', async () => {
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-05');
      await sahteIcerik(t.id, async () => {
        const n = R.S.errors.length;
        await O().cevapla(s.id, t.id, 0, 'A');
        expect(R.S.errors.length).toBe(n);
        const e = await O().yanlisaEkle(s.id, t.id, 0);
        expect([e.subjectId, e.topicId, e.senin, e.anahtar, e.tag, e.rootCause]).toEqual([s.id, t.id, 'A', 'B', null, '']);
        expect(e.closedAt).toBeNull();
        await O().yanlisaEkle(s.id, t.id, 0);
        expect(R.S.errors.length).toBe(n + 1);
        expect(O().deftere(s.id, t.id, 0).id).toBe(e.id);
      });
    });

    it('HATA: «Okudum» ya da örnek cevap, yeniden açılan konuyu kapatmaz', async () => {
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-06');
      await R.Model.setTopicState(s.id, t.id, { first:80, firstAt:'2026-10-01', second:75, secondAt:'2026-10-08' });
      expect(R.Model.topicState(s.id, t.id).state).toBe('closed');
      await R.Model.setTopicState(s.id, t.id, { state:'reopened' });
      await R.OgrenYolu.okundu(s.id, t.id, true);
      expect(R.Model.topicState(s.id, t.id).state).toBe('reopened');
      await R.Model.setTopicState(s.id, t.id, { ornek:{} });
      expect(R.Model.topicState(s.id, t.id).state).toBe('reopened');
      /* Ölçüm girilince kural yine çalışır. */
      await R.Model.setTopicState(s.id, t.id, { first:60, firstAt:'2026-10-09' });
      expect(R.Model.topicState(s.id, t.id).state).toBe('practicing');
    });

    it('sıradaki iş: anlatım → sorular → sonraki konu', async () => {
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-05');
      await sahteIcerik(t.id, async () => {
        expect(O().sirada(s.id, t.id).route).toBe('anlatim');
        await R.OgrenYolu.okundu(s.id, t.id, true);
        expect(O().sirada(s.id, t.id).route).toBe('sorular');
        for(let i = 0; i < 3; i++) await O().cevapla(s.id, t.id, i, 'A');
        const k = O().sirada(s.id, t.id);
        expect([k.route, k.sonraki.topic.id]).toEqual(['anlatim', 'tm-06']);
      });
    });

    it('ekranlar: çekmece kenarda; Konular → Anlatım; Anlatım okutur; Sorular cevabı gösterir', async () => {
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-05');
      const cek = R.App.NAV.find(g => g.id === 'ogren');
      expect(cek.items.map(i => i.id)).toEqual(['ogren', 'anlatim', 'sorular', 'koc', 'learn']);
      expect(R.App.NAV.find(g => g.id === 'calisma').items.some(i => i.id === 'learn')).toBe(false);
      await sahteIcerik(t.id, async () => {
        await sessiz(async () => {
          await O().sec(s.id, t.id);
          let h = String(await R.Screens.ogren.render());
          expect(h).toContain('Kaldığın yer');
          expect(h).toContain('data-act="ogren-git" data-route="anlatim" data-subject="tyt-matematik" data-topic="tm-05"');
          h = String(await R.Screens.anlatim.render());
          expect(h).toContain('Giriş cümlesi.');
          expect(h).toContain('x<sup>2</sup> ve H<sub>2</sub>O ve <b>kalın</b>.');   // üç işaret
          expect(h).toContain('a + b = c');
          expect(h).toContain('data-act="ogren-okundu"');
          expect(h).toContain('id="ogren-konu"');
          await R.Screens.anlatim.handle['ogren-okundu']();
          expect(R.Model.topicState(s.id, t.id).okunduAt).toBeTruthy();
          expect(R.OgrenYolu.adimlar(s.id, t.id)[0].tamam).toBe(true);
          h = String(await R.Screens.sorular.render());
          expect(h).toContain('Birinci soru?');
          expect(h).toContain('data-act="soru-cevap" data-harf="A"');
          await R.Screens.sorular.handle['soru-cevap']({ dataset:{ harf:'C' } });
          h = String(await R.Screens.sorular.render());
          expect(h).toContain('Yanlış · senin cevabın C, doğrusu B');
          expect(h).toContain('Çözüm bir.');
          expect(h).toContain('data-act="soru-defter"');
          expect(h).toContain('class="secenek is-dogru"');
          await R.Screens.sorular.handle['soru-git']({ dataset:{ i:'1' } });
          h = String(await R.Screens.sorular.render());
          expect(h).toContain('İkinci soru?');
          expect(h).toContain('data-act="soru-bak"');
          /* Konu değişince soru sırası başa döner. */
          await R.Screens.anlatim.handle['ogren-komsu']({ dataset:{ yon:'1' } });
          expect([R.S.ui.ogrenKonu, R.S.ui.ogrenSoru]).toEqual(['tm-06', 0]);
        });
      });
    });

    it('anlatımı olmayan konu: kısa özet ve not; sorusu yoksa koça yönlendirir', async () => {
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-05');
      const eski = R.KONU_ANLATIM[t.id];
      delete R.KONU_ANLATIM[t.id];
      try{
        await O().sec(s.id, t.id);
        let h = String(await R.Screens.anlatim.render());
        expect(h).toContain('henüz yazılmadı');
        expect(h).toContain('Akılda kalsın');
        h = String(await R.Screens.sorular.render());
        expect(h).toContain('örnek soruları henüz yazılmadı');
        expect(h).toContain('data-route="koc"');
      }finally{ if(eski) R.KONU_ANLATIM[t.id] = eski; }
    });
  });
})();
