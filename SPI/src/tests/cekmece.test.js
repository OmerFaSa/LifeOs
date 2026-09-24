/* Çekmece düzeni — SPİ (ekip/EKIP-PLANI.md T2–T3, ekip/CEKMECE-HARITASI.md).

   Kanıtladığı sözler: menü sekiz çekmecedir ve adları ortak kaynaktan gelir;
   iç içelik en çok iki kattır (çekmece › bölüm); her ekran yolunu söyler
   («Çalışma › Testler»); onaylar tek çekmecededir — Bugün yalnız en öndeki
   kartı gösterir, fazlası Onaylar'a gönderir; BAM'ın ürettikleri yalnız
   Kütüphanem'dedir; hedefler Plan'dadır. */

(function(){
  const { describe, it, expect, resetState } = SP.Test;
  const K = () => window.LIFEOS.KABUK;
  const BUGUN = '2026-09-23';

  function kingTeklif(id){
    return { id, konu:'Demir özeti', durum:'bekliyor', oneri:'tam', neden:'',
      secenekler:[{ id:'tam', ad:'Tam', metin:'Tam iş · 0,02 USD (tahmin)' }] };
  }
  function bekleyenKayit(){
    return { id:'pr-test', status:'pending', action:'vital-yaz', source:'istek',
      params:{ date:BUGUN, alan:'sleep', deger:7 }, at:new Date().toISOString() };
  }
  function temizle(){
    SP.S.ui.kingTeklifler = []; SP.S.ui.hkmIntents = []; SP.S.ui.hkmDoubts = [];
    SP.S.proposals = [];
  }

  describe('Çekmeceler (SPİ)', () => {
    it('menü sekiz çekmece; ad ve sıra ortak kaynaktan', () => {
      expect(SP.App.SECTIONS.map(g => g.id).join(',')).toBe(K().CEKMECELER.map(c => c.id).join(','));
      expect(SP.App.SECTIONS.map(g => g.label).join(',')).toBe(K().CEKMECELER.map(c => c.ad).join(','));
    });

    it('iç içelik iki kat: bölüm başka bölüm taşımaz; Çalışma en çok altı bölüm', () => {
      SP.App.SECTIONS.forEach(g => g.views.forEach(v => expect(v.views).toBe(undefined)));
      const cal = SP.App.SECTIONS.find(g => g.id === 'calisma');
      expect(cal.views.map(v => v.route).join(',')).toBe('labs,meals,kitchen,move,basket');
    });

    it('her ekran yolunu söyler; tek bölümlü çekmecede yalnız ad', () => {
      expect(SP.App.yolOf('labs').join(' › ')).toBe('Çalışma › Testler');
      expect(SP.App.yolOf('basket').join(' › ')).toBe('Çalışma › Bütçe');
      expect(SP.App.yolOf('team').join(' › ')).toBe('Ofis › Danışma');
      expect(SP.App.yolOf('rutbe').join(' › ')).toBe('Ayarlar › Rütbe');
      expect(SP.App.yolOf('family').join(' › ')).toBe('Ayarlar › Profil');
      expect(SP.App.yolOf('today').join(' › ')).toBe('Bugün');
      expect(SP.App.yolOf('onaylar').join(' › ')).toBe('Onaylar');
      expect(SP.App.yolOf('hedefler').join(' › ')).toBe('Plan');
    });

    it('onaylar tek çekmecede: Bugün en öndeki kartı gösterir, fazlası Onaylar\'da', async () => {
      resetState(); temizle();
      SP.S.ui.kingTeklifler = [kingTeklif(1)];
      SP.S.ui.hkmIntents = [{ id:9, kind:'material.add', note:'BAM bir özet hazırladı.' }];
      SP.S.proposals = [bekleyenKayit()];
      const on = String(await SP.Screens.onaylar.render());
      expect(on.indexOf('data-act="king-onayla"') >= 0).toBe(true);
      expect(on.indexOf('data-act="hkm-intent-') >= 0).toBe(true);
      expect(on.indexOf('data-act="bekleyen-onay"') >= 0).toBe(true);
      expect(SP.Screens.onaylar.bekleyen()).toBe(3);

      const alan = String(SP.Screens.onaylar.oneriAlani());
      expect(alan.indexOf('data-act="king-onayla"') >= 0).toBe(true);
      expect(alan.indexOf('data-act="hkm-intent-') < 0).toBe(true);
      expect(alan.indexOf('+2 öneri Onaylar') >= 0).toBe(true);

      /* Bugün kendi kopyasını çizmez: HKM teklifi ve bekleyen kayıt yalnız Onaylar'da. */
      const bugun = String(await SP.Screens.today.render());
      expect(bugun.indexOf('data-act="hkm-intent-') < 0).toBe(true);
      expect(bugun.indexOf('data-act="bekleyen-onay"') < 0).toBe(true);
      /* Bugün'deki düğme Onaylar'ın işleyicisine gider: tek yol. */
      ['king-onayla', 'hkm-intent-apply', 'bekleyen-onay'].forEach(a => {
        expect(typeof SP.Screens.today.handle[a]).toBe('function');
        expect(typeof SP.Screens.onaylar.handle[a]).toBe('function');
      });
      temizle();
    });

    /* Yarıda kalan teklif açılışta çekiliyordu (app.js intentDoubts) ama
       hiçbir ekranda çizilmiyordu: «yazıldı mı?» sorusu kullanıcıya hiç
       sorulmuyordu. */
    it('sonucu belirsiz HKM teklifi Onaylar\'da söylenir ve sayılır', async () => {
      resetState(); temizle();
      SP.S.ui.hkmDoubts = [{ id:41, kind:'kayit.add' }];
      const on = String(await SP.Screens.onaylar.render());
      expect(on.indexOf('data-act="hkm-doubt-ok"') >= 0).toBe(true);
      expect(on.indexOf('bilinmiyor') >= 0).toBe(true);
      expect(SP.Screens.onaylar.bekleyen()).toBe(1);
      expect(typeof SP.Screens.onaylar.handle['hkm-doubt-ok']).toBe('function');
      temizle();
    });

    it('oz-010 boş Onaylar: sakin cümle ve tek eylem', async () => {
      resetState(); temizle();
      const d = document.createElement('div');
      d.innerHTML = String(await SP.Screens.onaylar.render());
      expect(d.textContent).toContain('Bekleyen öneri yok');
      expect(d.querySelectorAll('button').length).toBe(1);
    });

    it('BAM\'ın ürettikleri yalnız Kütüphanem\'de: ürünler Ofis\'ten, yerler Mutfak\'tan çıktı', async () => {
      resetState();
      const eski = SP.Urunler;
      SP.Urunler = { liste:() => [{ id:'u1', baslik:'Demir özeti', urunAd:'Özet', dogruluk:'kaynakli' }],
        bul:() => null, sil:async () => {} };
      SP.S.yerler = [{ id:'y1', baslik:'spor salonu', konum:'Kadıköy, İstanbul', etiket:'tahmin', at:BUGUN,
        yerler:[{ ad:'Salon A', semt:'Moda', adres:null, tl:1500, donem:'aylık' }] }];
      try{
        const kut = String(await SP.Screens.kutuphane.render());
        expect(kut.indexOf('Demir özeti') >= 0).toBe(true);
        expect(kut.indexOf('Salon A') >= 0).toBe(true);
        expect(kut.indexOf('data-act="bilgi-iste"') >= 0).toBe(true);
        expect(String(await SP.Screens.office.render()).indexOf('Demir özeti') < 0).toBe(true);
        const mutfak = String(await SP.Screens.kitchen.render());
        expect(mutfak.indexOf('Salon A') < 0).toBe(true);
        expect(mutfak.indexOf('data-act="bilgi-iste"') < 0).toBe(true);
        ['urun-ac', 'urun-sil', 'bilgi-iste', 'yer-sil'].forEach(a =>
          expect(typeof SP.Screens.kutuphane.handle[a]).toBe('function'));
      }finally{
        SP.Urunler = eski; SP.S.yerler = [];
      }
    });

    it('hedefler Plan\'da: Bugün hedef kartını çizmez', async () => {
      resetState();
      const P = SP.Hedefler, H = window.LIFEOS.Hedef;
      const h = P.normalize(H.yeni(H.cumleden('3 ay içinde 3 kilo vermek istiyorum', P.PAKETLER, BUGUN), 'spi', BUGUN));
      h.durum = 'aktif';
      SP.S.hedefler = [h];
      try{
        const plan = String(await SP.Screens.hedefler.render());
        expect(plan.indexOf('data-act="hedef-durum"') >= 0).toBe(true);
        for(const tab of ['giris', 'ozet', 'gecmis']){
          SP.S.ui.dayTab = tab;
          expect(String(await SP.Screens.today.render()).indexOf('data-act="hedef-durum"') < 0).toBe(true);
        }
        expect(typeof SP.Screens.hedefler.handle['hedef-plan-uygula']).toBe('function');
      }finally{
        SP.S.hedefler = []; SP.S.ui.dayTab = 'giris';
      }
    });
  });
})();
