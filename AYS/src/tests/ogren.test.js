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
        «Okudum»u yola yazar; Sorular cevabı gösterir; çekmece kenarda.
     6. Palet (Ctrl+K) anlatımın içinde arar: bölüm başlığı da bulunur.
     7. İşaretler tek ayrıştırıcıdan geçer: iç içe simge bozulmaz; karta,
        yanlış defterine ve koça ham işaret değil düz metin (x², H₂O) gider. */

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

    it('HATA: iç içe üst simge bozulmaz; karta, deftere ve koça düz metin gider', async () => {
      const H = O().metinHtml, D = O().duzMetin;
      /* Eski düzenli ifade ilk «}»de kapatıyordu: 5^{log_{5} 7} ekranda
         «5<sup>log_{5</sup> 7}» olarak çıkıyordu (anlatim-am.js, logaritma). */
      expect(H('5^{log_{5} 7} = 7')).toBe('5<sup>log<sub>5</sub> 7</sup> = 7');
      expect(H('**a^{2}** < b')).toBe('<b>a<sup>2</sup></b> &lt; b');
      expect(H('x^{2 ve **yarım')).toBe('x^{2 ve **yarım');                  // kapanmayan işaret yazı kalır
      expect(D('H_{2}O, Na^{+}, Ca^{2+}, HCO_{3}^{−}, x^{n}')).toBe('H₂O, Na⁺, Ca²⁺, HCO₃⁻, xⁿ');
      expect(D('5^{log_{5} 7} ve X^{H} ve **kalın**')).toBe('5^(log₅ 7) ve X^H ve kalın');
      resetState();
      const s = TM(), t = s.topics.find(x => x.id === 'tm-05');
      const UST = { giris:'g', bolumler:SAHTE.bolumler, sorular:[
        { soru:'Bir paragraf ki uzun.\n(−2)^{3} kaçtır?', sec:['−8', '8', '6', '−6', '9'], dogru:'A', cozum:['(−2)^{3} = −8.'] },
        SAHTE.sorular[1], SAHTE.sorular[2]] };
      const eski = R.KONU_ANLATIM[t.id];
      R.KONU_ANLATIM[t.id] = UST;
      try{
        await sessiz(async () => {
          await O().sec(s.id, t.id);
          const y = O().kartYuzu(t.id, 0);
          expect(y.front).toBe('Bir paragraf ki uzun. (−2)³ kaçtır?  A) −8  B) 8  C) 6  D) −6  E) 9');
          expect(y.back).toBe('A) −8 — (−2)³ = −8.');
          const n = R.S.cards.length;
          await R.Screens.sorular.handle['soru-kart']();
          expect(R.S.cards.length).toBe(n + 1);
          expect(R.S.cards[n].front).toBe(y.front);
          await O().cevapla(s.id, t.id, 0, 'B');
          const e = await O().yanlisaEkle(s.id, t.id, 0);
          expect(e.soru).toBe('Bir paragraf ki uzun.\n(−2)³ kaçtır?');
          const git = R.App.go;
          R.App.go = () => {};
          try{ await R.Screens.sorular.handle['soru-koca'](); }finally{ R.App.go = git; }
          expect(R.S.ui.kocParca.metin.indexOf('^{')).toBe(-1);
          expect(R.S.ui.kocParca.metin).toContain('(−2)³ kaçtır?');
        });
      }finally{ if(eski) R.KONU_ANLATIM[t.id] = eski; else delete R.KONU_ANLATIM[t.id]; }
    });

    it('kart yüzü: uzun paragraf kısalır, soru kökü kesilmez', () => {
      const t = 'tm-05', eski = R.KONU_ANLATIM[t];
      const uzun = 'Kelime '.repeat(80).trim() + '.';
      R.KONU_ANLATIM[t] = { sorular:[{ soru:uzun + '\nBu parçanın konusu nedir?', sec:['a', 'b', 'c', 'd', 'e'], dogru:'C', cozum:['x'] }] };
      try{
        const y = O().kartYuzu(t, 0);
        expect(y.front).toContain('… Bu parçanın konusu nedir?  A) a');
        expect(y.front.length < 340).toBe(true);
        expect(O().kartYuzu(t, 5)).toBeNull();
      }finally{ if(eski) R.KONU_ANLATIM[t] = eski; else delete R.KONU_ANLATIM[t]; }
    });

    it('palet: konu adı ve anlatımın bölüm başlığı aranınca Anlatım sonucu çıkar', () => {
      const P = R.Palette;
      const pisagor = P.searchContent('Pisagor').filter(x => x.group === 'Anlatım');
      expect(pisagor.some(x => x.label === 'Dik ve özel üçgenler')).toBe(true);    // bölüm başlığından
      const ebob = P.searchContent('EBOB').filter(x => x.group === 'Anlatım');
      expect(ebob.some(x => x.label === 'EBOB – EKOK')).toBe(true);               // konu adından
      expect(P.commands().some(c => c.route === 'ogren')).toBe(true);
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
