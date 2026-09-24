/* Çekmece düzeni — ESP (ekip/EKIP-PLANI.md T2–T3, ekip/CEKMECE-HARITASI.md).

   Kanıtladığı sözler: onaylar tek çekmecededir — King ve HKM teklifi Bugün'ün
   başından, ajan teklifleri Ofis'ten Onaylar'a taşındı; Bugün yalnız en öndeki
   kartı gösterir, fazlası Onaylar'a gönderir; BAM'ın ürünleri yalnız
   Kütüphanem'dedir; iki yeni çekmece menüde görünür. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;

  function kingTeklif(id){
    return { id, konu:'İspanyolca ünite', durum:'bekliyor', oneri:'tam', neden:'',
      secenekler:[{ id:'tam', ad:'Tam', metin:'Tam iş · 0,02 USD (tahmin)' }] };
  }
  function temizle(){
    ESP.S.ui.kingTeklifler = []; ESP.S.ui.hkmIntents = []; ESP.S.ui.hkmDoubts = [];
  }

  describe('Çekmeceler (ESP)', () => {
    it('Onaylar ve Kütüphanem menüde bir ekrana gider', () => {
      const gor = id => ESP.App.SECTIONS().find(g => g.id === id);
      expect(gor('onaylar').views.map(v => v.route).join(',')).toBe('onaylar');
      expect(gor('kutuphane').views.map(v => v.route).join(',')).toBe('kutuphane');
      expect(!!ESP.Screens.onaylar && !!ESP.Screens.kutuphane).toBe(true);
    });

    it('onaylar tek çekmecede: Bugün en öndeki kartı gösterir, fazlası Onaylar\'da', async () => {
      resetState(); temizle();
      ESP.S.ui.kingTeklifler = [kingTeklif(1)];
      ESP.S.ui.hkmIntents = [{ id:9, kind:'material.add', note:'BAM bir özet hazırladı.' }];
      const on = String(await ESP.Screens.onaylar.render());
      expect(on.indexOf('data-act="king-onayla"') >= 0).toBe(true);
      expect(on.indexOf('data-act="hkm-intent-') >= 0).toBe(true);
      expect(ESP.Screens.onaylar.bekleyen() >= 2).toBe(true);

      const alan = String(ESP.Screens.onaylar.oneriAlani());
      expect(alan.indexOf('data-act="king-onayla"') >= 0).toBe(true);
      expect(alan.indexOf('data-act="hkm-intent-') < 0).toBe(true);
      expect(alan.indexOf('öneri Onaylar') >= 0).toBe(true);
      /* Bugün'deki düğme Onaylar'ın işleyicisine gider: tek yol. */
      expect(typeof ESP.Screens.today.handle['king-onayla']).toBe('function');
      expect(typeof ESP.Screens.onaylar.handle['king-onayla']).toBe('function');
      temizle();
    });

    it('ajan teklifleri Ofis\'te değil Onaylar\'da', async () => {
      resetState(); temizle();
      const ofis = String(await ESP.Screens.office.render());
      expect(ofis.indexOf('data-act="prop-accept"') < 0).toBe(true);
      expect(ofis.indexOf('data-route="onaylar"') >= 0).toBe(true);
    });

    it('oz-010 boş Onaylar: sakin cümle ve tek eylem', async () => {
      resetState(); temizle();
      const eski = ESP.Plans.all;
      ESP.Plans.all = () => [];
      try{
        const d = document.createElement('div');
        d.innerHTML = String(await ESP.Screens.onaylar.render());
        expect(d.textContent).toContain('Bekleyen öneri yok');
        expect(d.querySelectorAll('button').length).toBe(1);
      }finally{ ESP.Plans.all = eski; }
    });

    it('BAM ürünleri yalnız Kütüphanem\'de: Ofis\'ten çıktı', async () => {
      resetState();
      const eski = ESP.Urunler;
      ESP.Urunler = { liste:() => [{ id:'u1', baslik:'Stoacılık özeti', urunAd:'Özet', dogruluk:'kaynakli' }],
        bul:() => null, sil:async () => {} };
      try{
        const kut = String(await ESP.Screens.kutuphane.render());
        expect(kut.indexOf('Stoacılık özeti') >= 0).toBe(true);
        expect(String(await ESP.Screens.office.render()).indexOf('Stoacılık özeti') < 0).toBe(true);
        ['urun-ac', 'urun-sil'].forEach(a =>
          expect(typeof ESP.Screens.kutuphane.handle[a]).toBe('function'));
      }finally{ ESP.Urunler = eski; }
    });
  });
})();
