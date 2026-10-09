/* Konunun içinde «Anlamadım / soru sor» (core/konusor.js). Kanıtladığı sözler:
     1. Model yoksa hiçbir şey uydurulmaz; Ofis ayarları söylenir.
     2. Bağlam yalnız konudur (ders, bölüm, konu, yapıştırılan parça); ikinci
        soruda konuşma geri verilir.
     3. Cevap hiçbir kayda yazılmaz; «Karta çevir» kullanıcının kartını açar.
     4. Öğren › Koç cevabın «doğrulanmadı» etiketini ve karta çevirmeyi
        gösterir; hazır soru tek dokunuşla sorulur; Sorular'dan gelen
        «Koça sor» sorunun metnini bağlam olarak taşır. Model ağa çıkmaz:
        sahte zincir.
     5. Bağlama uygulamanın kendi kısa özeti girer (aynı dili konuşsun). */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const KS = () => R.KonuSor;
  const konu = () => { const s = R.SUBJECTS[0]; return { s, t:s.topics[0] }; };

  /* Sahte model: giden istek yakalanır, cevap sırayla verilir. */
  function sahteModel(cevaplar){
    const giden = [];
    const eskiZ = R.Office.chainFor, eskiC = R.LLM.complete;
    R.Office.chainFor = () => [{ provider:'sahte', model:'m' }];
    R.LLM.complete = async (chain, req) => { giden.push(req); const c = cevaplar.shift();
      if(c instanceof Error) throw c; return { text:c, model:'m' }; };
    return { giden, birak(){ R.Office.chainFor = eskiZ; R.LLM.complete = eskiC; } };
  }

  describe('Konuda soru sor', () => {
    it('model yoksa söylenir, hiçbir şey uydurulmaz; boş soru sorulmaz', async () => {
      resetState();
      const { s, t } = konu();
      const eski = R.Office.chainFor;
      R.Office.chainFor = () => [];
      try{
        expect(KS().hazir()).toBe(false);
        const r = await KS().sor(s.id, t.id, 'Bunu anlamadım');
        expect([r.ok, r.neden]).toEqual([false, 'model']);
        expect(r.metin).toContain('Ofis ayarları');
      }finally{ R.Office.chainFor = eski; }
      expect((await KS().sor(s.id, t.id, ' ')).neden).toBe('bos');
    });

    it('bağlam yalnız konu; ikinci soruda konuşma geri verilir; cevap kayda yazılmaz, karta çevrilir', async () => {
      resetState();
      const { s, t } = konu();
      KS().unut(s.id, t.id);
      R.S.profile.name = 'Gizli Ad';
      const m = sahteModel(['Birinci anlatım.', 'Başka yoldan anlatım.']);
      try{
        const kartOnce = R.S.cards.length;
        const r1 = await KS().sor(s.id, t.id, 'Bu kural neden böyle?', { parca:'Örnek paragraf' });
        expect([r1.ok, r1.metin]).toEqual([true, 'Birinci anlatım.']);
        const ilk = m.giden[0].messages[0].text;
        expect(ilk).toContain('Konu: ' + t.name);
        expect(ilk).toContain('Ders: ' + s.name);
        expect(ilk).toContain('«Örnek paragraf»');
        expect(ilk).toContain('Uygulamadaki kısa özet');                       // söz 5
        expect(ilk).toContain(R.KONU_OZET[t.id].ana[0].slice(0, 25));
        expect(ilk).toContain('Bu kural neden böyle?');
        expect(ilk.indexOf('Gizli Ad')).toBe(-1);                                 // kişisel veri gitmez
        expect(m.giden[0].system).toContain('uydurma');
        await KS().sor(s.id, t.id, 'Yine anlamadım');
        expect(m.giden[1].messages.map(x => x.role)).toEqual(['user', 'user', 'assistant', 'user']);
        expect(m.giden[1].messages[3].text).toBe('Yine anlamadım');
        expect(R.S.cards.length).toBe(kartOnce);                                  // kayda yazılmadı
        const k = await KS().kartYap(s.id, t.id, 1);
        expect([k.front, k.back, k.topic, k.source]).toEqual(['Yine anlamadım', 'Başka yoldan anlatım.', t.name, 'konusor']);
        expect(R.S.cards.length).toBe(kartOnce + 1);
      }finally{ m.birak(); KS().unut(s.id, t.id); }
    });

    it('model hatası düz cümleyle söylenir, konuşmaya eklenmez', async () => {
      resetState();
      const { s, t } = konu();
      KS().unut(s.id, t.id);
      const m = sahteModel([Object.assign(new Error('x'), { code:'rate_limited' })]);
      try{
        const r = await KS().sor(s.id, t.id, 'Anlamadım');
        expect([r.ok, r.neden]).toEqual([false, 'hata']);
        expect(r.metin.length > 5).toBe(true);
        expect(KS().konusmaOf(s.id, t.id)).toHaveLength(0);
      }finally{ m.birak(); }
    });

    it('Öğren › Koç: sohbet, «doğrulanmadı», karta çevir; hazır soru; Sorular’dan gelen bağlam', async () => {
      resetState();
      const { s, t } = konu();
      KS().unut(s.id, t.id);
      await R.Ogren.sec(s.id, t.id);
      const eskiRender = R.App.render;
      R.App.render = () => {};
      const m = sahteModel(['Kısa anlatım.', 'Basit anlatım.']);
      try{
        let html = String(await R.Screens.koc.render());
        expect(html).toContain('id="konusor-soru"');
        expect(html).toContain('data-act="koc-hazir"');
        expect(html).toContain('Daha basit anlat');
        await KS().sor(s.id, t.id, 'Neden?');
        html = String(await R.Screens.koc.render());
        expect(html).toContain('Kısa anlatım.');
        expect(html).toContain('doğrulanmadı');
        expect(html).toContain('data-act="konusor-kart" data-i="0"');
        /* Hazır soru: tek dokunuş, bağlamla. */
        R.S.ui.kocParca = { etiket:'Soru 1', metin:'Örnek soru metni' };
        await R.Screens.koc.handle['koc-hazir']({ dataset:{ i:'0' } });
        const son = m.giden[1].messages;
        expect(son[0].text).toContain('«Örnek soru metni»');
        expect(son[son.length - 1].text).toContain('çok basit');
        expect(String(await R.Screens.koc.render())).toContain('Bağlam: Soru 1');
      }finally{ m.birak(); KS().unut(s.id, t.id); R.App.render = eskiRender; R.S.ui.kocParca = null; }
      /* Model yoksa kutu yerine yönlendirme; anlatım modelsiz de çalışır. */
      const eski = R.Office.chainFor;
      R.Office.chainFor = () => [];
      try{
        const html = String(await R.Screens.koc.render());
        expect(html).toContain('Model bağlı değil');
        expect(html).toContain('data-act="koc-ayar"');
      }finally{ R.Office.chainFor = eski; }
    });
  });
})();
