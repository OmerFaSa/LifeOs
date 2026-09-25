/* 120 Haftalık Merkez özeti — Bugün'de (modül tarafı). Veri app.js'in
   HKM'den çektiği S.ui.haftaOzet'tir; yoksa (HKM kapalı, pazar akşamı
   değil) kart hiç çizilmez. İstemci ve çizici: brand/ortak/haftaozet.js. */

(function(){
  const { describe, it, expect, resetState } = ESP.Test;
  const dom = h => { const k = document.createElement('div'); k.innerHTML = String(h); return k; };
  const VERI = { from:'2026-09-21', to:'2026-09-27', zamani:true,
    satirlar:[{ modul:'ays', modul_adi:'AYS', cumle:'Net: 4 arttı', kesinlik:'hesaplandı' },
      { modul:'spi', modul_adi:'SPİ', cumle:'Bu hafta kayıt gelmedi.', kesinlik:'veri yok' },
      { modul:'esp', modul_adi:'ESP', cumle:'7 günün 5 gününde kayıt geldi.', kesinlik:'ölçüldü' }],
    bekleyen:{ moduller:{}, king:0, toplam:0 } };

  describe('120 Haftalık Merkez özeti — Bugün', () => {
    it('oz-120 veri varsa Bugün\'de tek kart; yoksa hiç çizilmez', async () => {
      resetState();
      ESP.S.profile.setupDone = true;
      try{
        ESP.S.ui.haftaOzet = VERI;
        const k = dom(await ESP.Screens.today.render());
        expect(k.querySelectorAll('.bugun [data-oz="120"]').length).toBe(1);
        expect(k.querySelectorAll('[data-oz="120"] .hozet__satir').length).toBe(3);
        ESP.S.ui.haftaOzet = null;
        expect(dom(await ESP.Screens.today.render()).querySelector('[data-oz="120"]')).toBe(null);
      }finally{ ESP.S.ui.haftaOzet = null; }
    });
  });
})();
