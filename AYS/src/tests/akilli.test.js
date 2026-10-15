/* Akıllı Öğrenme, Kavramlar ve Resmî Kaynaklar Testleri (data/akilli.js).
   Kanıtladığı sözler:
     1. Her konu için kavram etiketleri tanımlıdır ve geçerli dizilerdir.
     2. Akıllı karar ve taktik kartları şemaya uygundur (başlık, taktik, neden, mini soru).
     3. Bilimsel öğrenme stratejileri eksiksizdir (6 yöntem).
     4. Resmî kaynak bağlantıları geçerli URL ve kurumlara sahiptir.
     5. R.Ogren yardımcıları doğru ve hatasız veri döner.
     6. Soru netleştirmeleri (am-12, tf-f6) geçerlidir.
     7. Ekran dürüsttür (denetim 2026-10-15): taktik kartı «doğrulanmadı»
        der; kaynaklar «bu konunun özeti» demez, resmî olmayan (OpenStax)
        «Resmî» başlığı altında durmaz; strateji kartının sınıfı CSS'te
        vardır; kullanılmayan KONU_ZENGIN verisi yüklenmez. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const O = () => R.Ogren;

  describe('Akıllı öğrenme ve kavramlar', () => {
    it('184 konunun tamamında kavram etiketleri var ve geçerli', () => {
      const ids = [];
      (R.SUBJECTS || []).forEach(s => s.topics.forEach(t => ids.push(t.id)));
      expect(ids.length).toBe(184);

      const eksik = [];
      ids.forEach(id => {
        const k = O().kavramlar(id);
        if(!Array.isArray(k) || k.length < 2) eksik.push(id + ': az kavram (' + (k ? k.length : 0) + ')');
        else if(k.some(s => typeof s !== 'string' || !s.trim())) eksik.push(id + ': geçersiz etiket');
      });
      expect(eksik).toEqual([]);
    });

    it('akıllı karar ve taktik kartları şemaya uygundur', () => {
      const notlar = R.AKILLI_NOTLAR || {};
      const anahtarlar = Object.keys(notlar);
      expect(anahtarlar.length >= 8).toBe(true);

      const beklenen = ['tm-01', 'tm-04', 'tm-15', 'tr-05', 'tf-f6', 'tf-k5', 'tf-b4', 'am-12'];
      beklenen.forEach(id => {
        const n = O().akilliNot(id);
        expect(!!n).toBe(true);
        expect(typeof n.baslik).toBe('string');
        expect(typeof n.taktik).toBe('string');
        expect(typeof n.neden).toBe('string');
        expect(typeof n.kisa_not).toBe('string');
        expect(!!n.mini).toBe(true);
        expect(typeof n.mini.soru).toBe('string');
        expect(typeof n.mini.cevap).toBe('string');
        expect(Array.isArray(n.kontroller)).toBe(true);
        expect(n.kontroller.length >= 1).toBe(true);
      });
    });

    it('araştırma dayanaklı öğrenme stratejileri 6 yöntem içerir', () => {
      const l = O().stratejiler();
      expect(Array.isArray(l)).toBe(true);
      expect(l.length).toBe(6);
      l.forEach(y => {
        expect(typeof y.id).toBe('string');
        expect(typeof y.ad).toBe('string');
        expect(typeof y.kullanim).toBe('string');
        expect(typeof y.kontrol).toBe('string');
        expect(typeof y.dayanak).toBe('string');
      });
    });

    it('resmî kaynaklar geçerli kurum ve bağlantılara sahip', () => {
      const ids = [];
      (R.SUBJECTS || []).forEach(s => s.topics.forEach(t => ids.push(t.id)));

      const eksik = [];
      ids.forEach(id => {
        const kr = O().kaynaklar(id);
        if(!Array.isArray(kr) || kr.length < 1) eksik.push(id + ': kaynak yok');
        else {
          kr.forEach(k => {
            if(!k.baslik || !k.kurum) eksik.push(id + ': eksik künye');
            if(k.url && !/^https?:\/\//.test(k.url)) eksik.push(id + ': geçersiz url ' + k.url);
          });
        }
      });
      expect(eksik).toEqual([]);
    });

    it('soru düzeltmeleri yerinde ve yenilendi damgalı', () => {
      const am = (R.KONU_ANLATIM['am-12'] || {}).sorular || [];
      const amSoru = am[1];
      expect(!!amSoru).toBe(true);
      expect(amSoru.soru.includes('azalan olduğu en geniş aralık')).toBe(true);
      expect(amSoru.dogru).toBe('B');
      expect(!!amSoru.yenilendi).toBe(true);

      const tf = (R.KONU_ANLATIM['tf-f6'] || {}).sorular || [];
      const tfSoru = tf[1];
      expect(!!tfSoru).toBe(true);
      expect(tfSoru.soru.includes('ortalama ivmesi')).toBe(true);
      expect(tfSoru.dogru).toBe('C');
      expect(!!tfSoru.yenilendi).toBe(true);

      const tfNet = tf[2];
      expect(!!tfNet).toBe(true);
      expect(tfNet.soru.includes('işaretli (net) alan')).toBe(true);
      expect(tfNet.dogru).toBe('E');
      expect(!!tfNet.yenilendi).toBe(true);

      const af = ((R.KONU_DERIN || {})['af-01'] || {}).sorular || [];
      const afSoru = af[1];
      if (afSoru) {
        expect(afSoru.soru.includes('sin 53° ≈ 0,8')).toBe(true);
        expect(afSoru.dogru).toBe('B');
        expect(!!afSoru.yenilendi).toBe(true);
      }

      const ts = ((R.KONU_DERIN || {})['ts-c2'] || {}).sorular || [];
      const tsSoru = ts[1];
      if (tsSoru) {
        expect(tsSoru.soru.includes('Aynı büyüklükte kâğıtlara çizilen')).toBe(true);
        expect(tsSoru.dogru).toBe('C');
        expect(!!tsSoru.yenilendi).toBe(true);
      }
    });

    it('an-06 akıllı notunun ikinci kontrolü güncel oranları içerir', () => {
      ['tf-k5', 'ak-02'].forEach(id => {
        const n = O().akilliNot(id);
        expect(!!n).toBe(true);
        expect(n.kontroller.length).toBe(2);
        expect(n.kontroller[1].soru.includes('3 mol N₂ ve 6 mol H₂')).toBe(true);
        expect(n.kontroller[1].cevap.includes('4 mol NH₃')).toBe(true);
      });
    });

    it('ekran dürüst: doğrulanmadı etiketi, ders düzeyi kaynak, resmî olmayan ayrı; strateji kartı biçimli', async () => {
      resetState();
      const eski = R.App.render, git = R.App.go;
      R.App.render = () => {}; R.App.go = () => {};
      try{
        await O().sec('tyt-matematik', 'tm-01');
        let h = String(await R.Screens.anlatim.render());
        expect(h).toContain('Akıllı Karar');
        expect(h).toContain('elle yazıldı · doğrulanmadı');
        expect(h.indexOf('Bu konunun MEB OGM') < 0).toBe(true);
        expect(h).toContain('bu konuya özel değildir');
        await O().sec('ayt-fizik', 'af-01');
        h = String(await R.Screens.anlatim.render());
        const k = document.createElement('div'); k.innerHTML = h;
        const bolum = k.querySelector('#ders-kaynaklar');
        expect(!!bolum).toBe(true);
        const metin = bolum.textContent, resmiBas = metin.indexOf('Resmî (MEB)'), ekBas = metin.indexOf('Ek kaynak');
        expect(ekBas > 0).toBe(true);
        expect(metin.indexOf('OpenStax') > ekBas).toBe(true);
        expect(resmiBas < 0 || metin.slice(resmiBas, ekBas).indexOf('OpenStax') < 0).toBe(true);
      }finally{ R.App.render = eski; R.App.go = git; }
      let govde = '';
      const sheet = R.UI.sheet;
      R.UI.sheet = o => { govde = o.body; };
      try{ await R.Screens.anlatim.handle['ogren-strateji'](); }finally{ R.UI.sheet = sheet; }
      expect(govde).toContain('class="ogr-strateji"');
      expect(govde.indexOf('p-10') < 0).toBe(true);
      const d = document.createElement('div'); d.className = 'ogr-strateji'; document.body.appendChild(d);
      try{ expect(getComputedStyle(d).paddingTop).toBe('10px'); }finally{ d.remove(); }
      expect(R.KONU_ZENGIN).toBe(undefined);
    });
  });
})();
