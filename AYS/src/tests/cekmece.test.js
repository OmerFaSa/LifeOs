/* Çekmece düzeni — AYS (ekip/EKIP-PLANI.md T2–T3, ekip/CEKMECE-HARITASI.md).

   Kanıtladığı sözler: menü sekiz çekmecedir ve adları ortak kaynaktan gelir;
   iç içelik en çok iki kattır (çekmece › bölüm); her ekran yolunu söyler
   («Plan › Hafta»); onaylar tek çekmecededir — Bugün yalnız en öndeki kartı
   gösterir, fazlası Onaylar'a gönderir; «Kütüphane» yalnız Kütüphanem'dedir. */

(function(){
  const { describe, it, expect, resetState } = R.Test;
  const K = () => window.LIFEOS.KABUK;

  function kingTeklif(id){
    return { id, konu:'Türev özeti', durum:'bekliyor', oneri:'tam', neden:'',
      secenekler:[{ id:'tam', ad:'Tam', metin:'Tam iş · 0,02 USD (tahmin)' }] };
  }

  describe('Çekmeceler (AYS)', () => {
    it('menü sekiz çekmece; ad ve sıra ortak kaynaktan', () => {
      expect(R.App.NAV.map(g => g.id).join(',')).toBe(K().CEKMECELER.map(c => c.id).join(','));
      expect(R.App.NAV.map(g => g.label).join(',')).toBe(K().CEKMECELER.map(c => c.ad).join(','));
    });

    it('iç içelik iki kat: bölüm başka bölüm taşımaz; Çalışma en çok altı bölüm', () => {
      R.App.NAV.forEach(g => g.items.forEach(v => expect(v.items).toBe(undefined)));
      const cal = R.App.NAV.find(g => g.id === 'calisma');
      expect(cal.items.length <= 6).toBe(true);
    });

    it('her ekran yolunu söyler: «Plan › Hafta»; tek bölümlü çekmecede yalnız ad', () => {
      expect(R.App.yolOf('week').join(' › ')).toBe('Plan › Hafta');
      expect(R.App.yolOf('exams').join(' › ')).toBe('Çalışma › Deneme');
      expect(R.App.yolOf('today').join(' › ')).toBe('Bugün');
      expect(R.App.yolOf('onaylar').join(' › ')).toBe('Onaylar');
      /* Menüde olmayan ayrıntı ekranı üst bölümünün altında durur. */
      expect(R.App.yolOf('topic').join(' › ')).toBe('Çalışma › Konu çalış › Konu');
      expect(R.App.yolOf('rutbe').join(' › ')).toBe('Ayarlar › Rütbe');
    });

    it('onaylar tek çekmecede: Bugün en öndeki kartı gösterir, fazlası Onaylar\'da', async () => {
      resetState();
      R.S.ui.kingTeklifler = [kingTeklif(1)];
      R.S.ui.hkmIntents = [{ id:9, kind:'material.add', note:'BAM bir özet hazırladı.' }];
      const on = String(await R.Screens.onaylar.render());
      expect(on.indexOf('data-act="king-onayla"') >= 0).toBe(true);
      expect(on.indexOf('data-act="hkm-intent-') >= 0).toBe(true);
      expect(R.Screens.onaylar.bekleyen()).toBe(2);

      const alan = String(R.Screens.onaylar.oneriAlani());
      expect(alan.indexOf('data-act="king-onayla"') >= 0).toBe(true);
      expect(alan.indexOf('data-act="hkm-intent-') < 0).toBe(true);
      expect(alan.indexOf('+1 öneri Onaylar') >= 0).toBe(true);
      /* Bugün'deki düğme Onaylar'ın işleyicisine gider: tek yol. */
      expect(typeof R.Screens.today.handle['king-onayla']).toBe('function');
      expect(typeof R.Screens.onaylar.handle['king-onayla']).toBe('function');
      R.S.ui.kingTeklifler = []; R.S.ui.hkmIntents = [];
    });

    it('ofisin önerileri Ofis ekranında değil Onaylar\'da', async () => {
      resetState();
      const ofis = String(await R.Screens.office.render());
      expect(ofis.indexOf('data-act="office-approve"') < 0).toBe(true);
      expect(typeof R.Screens.onaylar.handle['office-approve']).toBe('function');
      expect(typeof R.Screens.onaylar.handle['office-undo']).toBe('function');
    });

    it('oz-010 boş Onaylar: sakin cümle ve tek eylem', async () => {
      resetState();
      R.S.ui.kingTeklifler = []; R.S.ui.hkmIntents = []; R.S.ui.hkmDoubts = [];
      const d = document.createElement('div');
      d.innerHTML = String(await R.Screens.onaylar.render());
      expect(d.textContent).toContain('Bekleyen öneri yok');
      expect(d.querySelectorAll('button').length).toBe(1);
    });

    /* Duman testi yakaladı: Goodhart politikasında tek bir «asgari çaba»
       yok; birleştirilen metin «undefined dk.» yazıyordu. */
    it('Analiz bölümlerinin hiçbiri «undefined» yazmaz', async () => {
      resetState();
      const out = String(await R.Screens.analytics.render());
      expect(out.indexOf('undefined') < 0).toBe(true);
    });

    it('«Kütüphane» yalnız Kütüphanem\'de: test kitapları Sınama\'dan çıktı', async () => {
      resetState();
      R.S.testKitaplari = [{ id:'kitap-1', baslik:'TYT deneme kitabı', dogruluk:'kaynakli', maliyet:null,
        bolumler:[{ no:1, ad:'Paragraf', sorular:[{ soru:'x', secenekler:['a', 'b', 'c', 'd', 'e'], dogru:0 }] }],
        sonuclar:{} }];
      const kut = String(await R.Screens.kutuphane.render());
      expect(kut.indexOf('TYT deneme kitabı') >= 0).toBe(true);
      expect(kut.indexOf('data-act="kitap-baslat"') >= 0).toBe(true);
      const quiz = String(await R.Screens.quiz.render());
      expect(quiz.indexOf('TYT deneme kitabı') < 0).toBe(true);
      expect(typeof R.Screens.kutuphane.handle['kitap-baslat']).toBe('function');
      R.S.testKitaplari = [];
    });
  });
})();
